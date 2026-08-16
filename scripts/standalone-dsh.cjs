/**
 * standalone-dsh.cjs — Zero-dependency DSH CLI launcher.
 * Runs with Node.js >= 22. No pnpm, no dsh CLI required.
 */

'use strict'

const fs = require('fs')
const path = require('path')
const { execSync, spawn } = require('child_process')

const ROOT_DIR = path.resolve(__dirname, '..')
const LIB_DIR = path.join(ROOT_DIR, 'lib')
const PLUGIN_NAME = '@deepseek-ai/dsh-win-desktop'

function getDshHome() {
  return process.env.DSH_HOME || path.join(require('os').homedir(), '.deepseek-harness')
}

function getPluginDir(dshHome) {
  return path.join(dshHome, 'plugins', 'dsh-win-desktop')
}

function hasCommand(cmd) {
  try {
    execSync('where ' + cmd, { stdio: 'ignore', shell: true })
    return true
  } catch {
    return false
  }
}

function printBanner() {
  console.log('')
  console.log('  [win-desktop] DeepSeek Harness Windows Desktop Plugin v0.1.0')
  console.log('  [win-desktop] Zero-dependency launcher')
  console.log('')
}

function cmdInstall() {
  const dshHome = getDshHome()
  const pluginDir = getPluginDir(dshHome)
  const targetLib = pluginDir

  if (!fs.existsSync(path.join(LIB_DIR, 'index.js'))) {
    console.error('Error: lib/index.js not found. Build first: npm run build')
    process.exit(1)
  }

  fs.mkdirSync(pluginDir, { recursive: true })
  fs.mkdirSync(targetLib, { recursive: true })

  const artifacts = [
    ['index.js', 'lib/index.js'],
    ['invariant.js', 'lib/invariant.js'],
    ['client.js', 'lib/client.js'],
    ['types/index.d.ts', 'types/index.d.ts'],
    ['types/client.d.ts', 'types/client.d.ts'],
  ]
  for (const [name, rel] of artifacts) {
    const src = path.join(ROOT_DIR, rel)
    const dst = path.join(targetLib, path.basename(rel))
    if (fs.existsSync(src)) {
      fs.mkdirSync(path.dirname(dst), { recursive: true })
      fs.copyFileSync(src, dst)
      console.log('  [win-desktop]   copied ' + name)
    }
  }

  for (const f of ['cordis.patch.yml', 'dsh-plugin.json', 'package.json']) {
    const src = path.join(ROOT_DIR, f)
    const dst = path.join(pluginDir, f)
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dst)
      console.log('  [win-desktop]   copied ' + f)
    }
  }

  // Try to register via dsh CLI if available
  if (hasCommand('dsh')) {
    try {
      execSync('dsh plugin --profile web add "' + pluginDir + '"', { stdio: 'inherit', shell: true })
      console.log('  [win-desktop] Registered via dsh CLI')
    } catch (e) {
      console.warn('  [win-desktop] Warning: dsh registration failed, patch injected manually')
    }
  }

  // Always inject patch directly as fallback
  const patchFile = path.join(dshHome, 'profiles', 'web', 'cordis.patch.yml')
  const patchEntry = [
    '',
    '# @deepseek-ai/dsh-win-desktop — injected by dsh-win-desktop install',
    '- id: win-desktop',
    "  name: '@deepseek-ai/dsh-win-desktop'",
    '  config:',
    '    port: 8765',
    "    host: '127.0.0.1'",
    '    autoStart: false',
    '',
  ].join('\n')

  if (fs.existsSync(patchFile)) {
    let content = fs.readFileSync(patchFile, 'utf8')
    if (!content.includes('dsh-win-desktop')) {
      fs.writeFileSync(patchFile, content.replace(/\n+$/, '') + patchEntry, 'utf8')
      console.log('  [win-desktop] Injected patch into ' + patchFile)
    }
  } else {
    fs.mkdirSync(path.dirname(patchFile), { recursive: true })
    fs.writeFileSync(patchFile, '# DSH Profile Patch — web\n' + patchEntry, 'utf8')
    console.log('  [win-desktop] Created patch file: ' + patchFile)
  }

  console.log('')
  console.log('  [win-desktop] Installed to: ' + pluginDir)
  console.log('  [win-desktop] Start: dsh-win-desktop start')
}

function cmdStart(port) {
  port = port || 8765
  const dshHome = getDshHome()
  const serverJs = path.join(getPluginDir(dshHome), 'lib', 'index.js')

  if (!fs.existsSync(serverJs)) {
    console.error('Error: Not installed. Run: dsh-win-desktop install')
    process.exit(1)
  }

  console.log('  [win-desktop] Starting bridge on port ' + port + '...')
  console.log('  [win-desktop] Health: http://localhost:' + port + '/health')
  console.log('  [win-desktop] Press Ctrl+C to stop')
  console.log('')

  const env = Object.assign({}, process.env, { DSH_HOME: dshHome })
  const child = spawn(process.execPath, [serverJs], { env: env, stdio: 'inherit' })

  child.on('error', function(err) {
    console.error('Failed to start:', err.message)
    process.exit(1)
  })

  process.on('SIGINT', function() {
    console.log('')
    console.log('  [win-desktop] Stopping...')
    child.kill('SIGTERM')
    process.exit(0)
  })
}

function cmdStatus(port) {
  port = port || 8765
  try {
    const result = execSync('curl -s http://localhost:' + port + '/health 2>nul || echo NOT_RUNNING', { encoding: 'utf8', shell: true }).trim()
    if (result === 'NOT_RUNNING') {
      console.log('  [win-desktop] Status: STOPPED')
      console.log('  [win-desktop] Port: ' + port)
      console.log('  [win-desktop] Install: dsh-win-desktop install')
      console.log('  [win-desktop] Start:   dsh-win-desktop start')
    } else {
      var data = JSON.parse(result)
      console.log('  [win-desktop] Status: RUNNING')
      console.log('  [win-desktop] Port:   ' + port)
      console.log('  [win-desktop] Version: ' + (data.version || '0.1.0'))
      console.log('  [win-desktop] Sessions: ' + (data.sessions || 0))
      console.log('  [win-desktop] Health: http://localhost:' + port + '/health')
    }
  } catch (e) {
    console.log('  [win-desktop] Status: STOPPED')
    console.log('  [win-desktop] Port: ' + port)
  }
}

function cmdStop(port) {
  port = port || 8765
  try {
    var out = execSync('netstat -ano 2>nul | findstr :' + port + ' | findstr LISTENING', { encoding: 'utf8', shell: true }).trim()
    if (out) {
      var pid = out.split(/\s+/).pop()
      if (pid) {
        execSync('taskkill /PID ' + pid + ' /F', { shell: true })
        console.log('  [win-desktop] Stopped PID ' + pid)
      }
    }
  } catch (e) { /* not running */ }
  console.log('  [win-desktop] Bridge stopped.')
}

function cmdDoctor() {
  printBanner()
  var issues = []
  var hints = []

  var nodeVer = process.version
  var nodeMajor = parseInt(nodeVer.slice(1).split('.')[0], 10)
  if (nodeMajor >= 22) {
    console.log('  [win-desktop]   Node.js ' + nodeVer + ' OK')
  } else {
    issues.push('Node.js ' + nodeVer + ' < 22 required')
  }

  if (hasCommand('dsh')) {
    try {
      var dshVer = execSync('dsh --version', { encoding: 'utf8', shell: true }).trim()
      console.log('  [win-desktop]   dsh ' + dshVer + ' OK')
    } catch (e) {
      console.log('  [win-desktop]   dsh found (version check failed)')
    }
  } else {
    hints.push('dsh CLI not in PATH — install: npm install -g @deepseek-ai/dsh')
  }

  var dshHome = getDshHome()
  if (fs.existsSync(dshHome)) {
    console.log('  [win-desktop]   DSH_HOME: ' + dshHome)
  } else {
    hints.push('DSH_HOME not initialized: ' + dshHome)
  }

  var pluginDir = getPluginDir(dshHome)
  if (fs.existsSync(path.join(pluginDir, 'lib', 'index.js'))) {
    console.log('  [win-desktop]   Plugin installed: ' + pluginDir)
  } else {
    hints.push('Plugin not installed — run: dsh-win-desktop install')
  }

  try {
    execSync('netstat -ano 2>nul | findstr :8765 | findstr LISTENING', { shell: true })
    console.log('  [win-desktop]   Port 8765: IN USE')
  } catch (e) {
    console.log('  [win-desktop]   Port 8765: available')
  }

  if (issues.length > 0) {
    console.log('')
    console.log('  ISSUES:')
    issues.forEach(function(i) { console.log('    - ' + i) })
  }
  if (hints.length > 0) {
    console.log('')
    console.log('  HINTS:')
    hints.forEach(function(h) { console.log('    - ' + h) })
  }
}

// ── Entry ─────────────────────────────────────────────────────────────────────

printBanner()

var command = process.argv[2]
var args = process.argv.slice(3)

var commands = {
  install: cmdInstall,
  start: cmdStart,
  status: cmdStatus,
  stop: cmdStop,
  doctor: cmdDoctor,
  help: function() {
    console.log('')
    console.log('  Usage: dsh-win-desktop <command> [options]')
    console.log('')
    console.log('  Commands:')
    console.log('    install   Install plugin bundle to DSH_HOME/plugins/')
    console.log('    start     Start the Windows Desktop bridge server')
    console.log('    status    Show service status and session count')
    console.log('    stop      Stop the bridge server')
    console.log('    doctor    Check environment and report issues')
    console.log('    help      Show this help message')
    console.log('')
    console.log('  Environment:')
    console.log('    DSH_HOME  DSH home directory (default: ~/.deepseek-harness)')
    console.log('')
  }
}

if (!command || command === 'help' || command === '--help' || command === '-h') {
  commands.help()
  process.exit(0)
}

var handler = commands[command]
if (!handler) {
  console.error('  [win-desktop] Unknown command: ' + command)
  commands.help()
  process.exit(1)
}

handler.apply(null, args)
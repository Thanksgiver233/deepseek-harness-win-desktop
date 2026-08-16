/**
 * wrap-dsh.js — DSH CLI wrapper for zero-dependency installation.
 *
 * When the user runs `dsh-win-desktop install`, this script:
 * 1. Tries to find the system dsh CLI
 * 2. If not found, creates a wrapper that stubs the dsh command
 * 3. Registers the plugin in the profile's cordis.patch.yml directly
 */

'use strict'

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const PLUGIN_NAME = '@deepseek-ai/dsh-win-desktop'
const SHORT_NAME = 'dsh-win-desktop'

function getDshHome() {
  return process.env.DSH_HOME || path.join(require('os').homedir(), '.deepseek-harness')
}

function findDsh() {
  // Check common locations
  const candidates = [
    'dsh',
    path.join(process.env.APPDATA, 'npm', 'dsh.cmd'),
    path.join(process.env.ProgramFiles, 'DeepSeek', 'Harness', 'dsh.cmd'),
  ]
  for (const c of candidates) {
    try {
      execSync(`where ${c}`, { stdio: 'ignore', shell: true })
      return c
    } catch { /* try next */ }
  }
  return null
}

function readYamlSimple(filePath) {
  // Minimal YAML reader — no external dependency
  if (!fs.existsSync(filePath)) return null
  return fs.readFileSync(filePath, 'utf8')
}

function writeYamlSimple(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, 'utf8')
}

function injectIntoProfile(dshHome, profile = 'web') {
  const profileDir = path.join(dshHome, 'profiles', profile)
  const patchFile = path.join(profileDir, 'cordis.patch.yml')

  const pluginEntry = `
# @deepseek-ai/dsh-win-desktop — injected by dsh-win-desktop install
- id: win-desktop
  name: '@deepseek-ai/dsh-win-desktop'
  config:
    port: 8765
    host: '127.0.0.1'
    autoStart: false
`

  if (fs.existsSync(patchFile)) {
    let content = readYamlSimple(patchFile)
    if (content.includes("name: '@deepseek-ai/dsh-win-desktop'")) {
      console.log('  ℹ Plugin already registered in profile')
      return
    }
    // Append to existing patch file
    content = content.replace(/\n+$/, '') + '\n' + pluginEntry + '\n'
    writeYamlSimple(patchFile, content)
    console.log(`  ✓ Injected into ${patchFile}`)
  } else {
    // Create new patch file
    const header = `# DSH Profile Patch — ${profile}
# Managed by dsh-win-desktop — do not edit manually
`
    writeYamlSimple(patchFile, header + pluginEntry)
    console.log(`  ✓ Created ${patchFile}`)
  }
}

function main() {
  const command = process.argv[2]
  const profile = process.argv[3] || 'web'

  if (command === 'register') {
    const dshHome = getDshHome()
    const dshCmd = findDsh()

    if (dshCmd) {
      console.log(`  Using dsh CLI: ${dshCmd}`)
      try {
        execSync(
          `"${dshCmd}" plugin --profile ${profile} add "${process.argv[4] || '.'}"`,
          { stdio: 'inherit', shell: true }
        )
        console.log('  ✅ Registered via dsh CLI')
      } catch (e) {
        console.warn('  ⚠ dsh CLI registration failed, using direct patch injection')
        injectIntoProfile(dshHome, profile)
      }
    } else {
      console.log('  ℹ dsh CLI not found — injecting patch directly')
      injectIntoProfile(dshHome, profile)
    }
  } else if (command === 'locate') {
    const dsh = findDsh()
    console.log(dsh || 'NOT_FOUND')
  } else {
    console.log(`
  Usage: node wrap-dsh.js <command> [profile]

  Commands:
    register [profile]  Register plugin in DSH profile (auto or manual)
    locate              Print path to dsh CLI (or NOT_FOUND)
`)
  }
}

main()

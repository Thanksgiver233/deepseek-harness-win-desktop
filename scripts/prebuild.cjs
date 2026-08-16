/**
 * prebuild.js — Standalone build script for the client bundle.
 *
 * When dsh-win-desktop is distributed as a zip/tarball, this script
 * runs during `npm pack` (via the prepare hook) to produce lib/client.js.
 * In zero-dependency mode, the pre-built lib/ directory is included in the release.
 *
 * This script uses only Node.js built-ins + tsdown if available.
 */

'use strict'

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const ROOT = __dirname + '/..'
const LIB = path.join(ROOT, 'lib')

function ensureLib() {
  fs.mkdirSync(LIB, { recursive: true })
}

function tryTsdown() {
  // Check if tsdown is available (workspace build or global install)
  const tsdownBin = path.join(ROOT, 'node_modules', '.bin', 'tsdown')
  const tsdownGlobal = require('child_process').execSync('where tsdown 2>nul || echo notfound', { encoding: 'utf8', shell: true }).trim()

  if (fs.existsSync(tsdownBin) || tsdownGlobal !== 'notfound') {
    const cmd = fs.existsSync(tsdownBin) ? tsdownBin : tsdownGlobal.split('\n')[0]
    console.log(`  Building with tsdown: ${cmd}`)
    execSync(`${cmd}`, { cwd: ROOT, stdio: 'inherit' })
    return true
  }
  return false
}

function createFallbackClient() {
  // Fallback: create a minimal client.js stub if tsdown is unavailable
  // This allows the plugin to load even without the full build toolchain
  const clientJs = path.join(LIB, 'client.js')
  const indexJs = path.join(LIB, 'index.js')

  ensureLib()

  // Create minimal client stub (the real bundle is produced by tsdown in CI/release)
  const stub = `// @deepseek-ai/dsh-win-desktop — client bundle stub
// Built by scripts/prebuild.js (fallback mode)
// For production builds, run: pnpm bundle
window.__DSH_BOOT__ = window.__DSH_BOOT__ || {};
window.__DSH_BOOT__['@deepseek-ai/dsh-win-desktop'] = function(require) {
  return { apply: function() {} };
};
`
  fs.writeFileSync(clientJs, stub, 'utf8')
  console.log('  Created fallback client.js stub')

  // Create minimal host stub if index.js doesn't exist
  if (!fs.existsSync(indexJs)) {
    const hostStub = `// @deepseek-ai/dsh-win-desktop — host stub
// The real service is built by tsdown. This stub enables basic operation.
module.exports = {
  WinDesktopService: class WinDesktopService {
    static Config = { port: 8765, host: '127.0.0.1', autoStart: false }
    constructor(ctx, config) { this.ctx = ctx; this.config = config }
    async [Symbol.for('cordis:init')]() {}
    get listenPort() { return this.config.port }
    get sessionCount() { return 0 }
    getSessions() { return [] }
  },
  apply: () => {},
}
`
    fs.writeFileSync(indexJs, hostStub, 'utf8')
    console.log('  Created fallback index.js stub')
  }
}

function main() {
  console.log('  🛠️  Building @deepseek-ai/dsh-win-desktop...')
  ensureLib()

  const built = tryTsdown()
  if (!built) {
    console.log('  ⚠ tsdown not found, creating fallback stubs')
    createFallbackClient()
  }

  console.log('  ✅ Build complete')
}

main()

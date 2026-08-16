/**
 * @deepseek-ai/dsh-win-desktop — Host entry point (ESM).
 * Pre-built from src/host/index.ts. For development, run `pnpm build`.
 */

import { createServer } from 'node:http'
import { EventEmitter } from 'node:events'

const VERSION = '0.1.0'

/** In-memory session store */
class SessionStore {
  constructor() { this.sessions = new Map() }
  create(name) {
    const id = crypto.randomUUID()
    const session = { id, name: name || `Session ${id.slice(0, 8)}`, status: 'running', startedAt: Date.now() }
    this.sessions.set(id, session)
    return session
  }
  list() { return [...this.sessions.values()] }
  delete(id) { return this.sessions.delete(id) }
  get count() { return this.sessions.size }
}

/**
 * WinDesktopService — Cordis-compatible HTTP bridge service.
 * Endpoints: GET /health, GET /sessions, POST /sessions, DELETE /sessions/:id
 */
export class WinDesktopService extends EventEmitter {
  static Config = { port: 8765, host: '127.0.0.1', autoStart: false }

  constructor(config = WinDesktopService.Config) {
    super()
    this.config = { ...WinDesktopService.Config, ...config }
    this.store = new SessionStore()
    this.server = null
    this._port = this.config.port
  }

  get listenPort() { return this._port }
  get sessionCount() { return this.store.count }
  getSessions() { return this.store.list() }

  async init() {
    this.server = createServer((req, res) => {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Access-Control-Allow-Origin', '*')
      if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

      let url
      try { url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`) }
      catch { res.writeHead(400); res.end(JSON.stringify({ error: 'bad request' })); return }

      if (url.pathname === '/health' && req.method === 'GET') {
        res.writeHead(200)
        res.end(JSON.stringify({ status: 'ok', version: VERSION, sessions: this.store.count, port: this._port }))
      } else if (url.pathname === '/sessions' && req.method === 'GET') {
        res.writeHead(200)
        res.end(JSON.stringify(this.store.list()))
      } else if (url.pathname === '/sessions' && req.method === 'POST') {
        const session = this.store.create()
        this.emit('winDesktop:session:start', { sessionId: session.id })
        res.writeHead(201)
        res.end(JSON.stringify(session))
      } else if (/^\/sessions\/[^/]+$/.test(url.pathname) && req.method === 'DELETE') {
        const id = url.pathname.split('/').pop()
        if (this.store.delete(id)) this.emit('winDesktop:session:stop', { sessionId: id })
        res.writeHead(204)
        res.end()
      } else {
        res.writeHead(404)
        res.end(JSON.stringify({ error: 'not found' }))
      }
    })

    await new Promise((resolve, reject) => {
      this.server.once('error', reject)
      this.server.listen(this.config.port, this.config.host, () => {
        this.server.off('error', reject)
        this.server.on('error', (err) => console.error('[win-desktop]', err.message))
        this._port = this.server.address().port
        resolve()
      })
    })

    console.log(`  [win-desktop] Bridge running at http://localhost:${this._port}`)
    console.log(`  [win-desktop] Health: http://localhost:${this._port}/health`)
  }

  async stop() {
    if (this.server) {
      await new Promise((resolve) => { this.server.close(() => resolve()) })
      this.server = null
      this.store = new SessionStore()
      this._port = this.config.port
      console.log('  [win-desktop] Bridge stopped')
    }
  }

  dispose() { void this.stop() }
}

/** Plugin apply — no host-side behavior beyond service registration. */
export function apply() {}

export default WinDesktopService

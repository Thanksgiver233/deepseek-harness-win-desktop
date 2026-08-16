/**
 * @deepseek-ai/dsh-win-desktop — Windows Desktop bridge plugin.
 *
 * Host side: registers an HTTP service on a configurable port that exposes
 * session management endpoints for the Windows desktop bridge.
 * Client side: injects a React panel into the DSH UI via the slot system.
 *
 * The service lifecycle is managed by Cordis — on init, the server binds;
 * on dispose, all connections are drained and the socket is closed.
 */

import { Service, type Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'

declare module '@deepseek-ai/cordis' {
  interface Context {
    winDesktop: WinDesktopService
  }
}

/** Config schema for the Windows Desktop bridge service. */
export const Config = z.object({
  /** Listen port; 0 requests an OS-assigned port. */
  port: z.natural().max(65535).default(8765),
  /** Bind host: loopback only (safer) or all interfaces. */
  host: z.union([z.const('127.0.0.1'), z.const('0.0.0.0')]).default('127.0.0.1'),
  /** Whether to auto-create a default session on boot. */
  autoStart: z.boolean().default(false),
})

export type Config = z.infer<typeof Config>

/** In-memory session store. */
interface Session {
  id: string
  name: string
  status: 'idle' | 'running' | 'error'
  startedAt: number
}

/**
 * The Windows Desktop bridge service.
 *
 * Exposes:
 * - `GET /health` — liveness probe
 * - `GET /sessions` — list all sessions
 * - `POST /sessions` — create a new session
 * - `DELETE /sessions/:id` — stop a session
 */
export class WinDesktopService extends Service {
  static Config = Config

  private server!: Server
  private port!: number
  private sessions = new Map<string, Session>()

  constructor(ctx: Context, private config: Config) {
    super(ctx, 'winDesktop')
  }

  /** The resolved listening port (OS-assigned when config.port is 0). */
  get listenPort(): number {
    return this.port
  }

  /** Current session count. */
  get sessionCount(): number {
    return this.sessions.size
  }

  /** Snapshot of all sessions. */
  getSessions(): Session[] {
    return [...this.sessions.values()]
  }

  async [Service.init](): Promise<void> {
    this.server = createServer((req, res) => {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Access-Control-Allow-Origin', '*')

      if (req.method === 'OPTIONS') {
        res.writeHead(204)
        res.end()
        return
      }

      const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)

      if (url.pathname === '/health' && req.method === 'GET') {
        res.writeHead(200)
        res.end(JSON.stringify({ status: 'ok', version: '0.1.0', sessions: this.sessions.size }))
      } else if (url.pathname === '/sessions' && req.method === 'GET') {
        res.writeHead(200)
        res.end(JSON.stringify([...this.sessions.values()]))
      } else if (url.pathname === '/sessions' && req.method === 'POST') {
        const id = crypto.randomUUID()
        const session: Session = {
          id,
          name: `Session ${id.slice(0, 8)}`,
          status: 'running',
          startedAt: Date.now(),
        }
        this.sessions.set(id, session)
        this.ctx.emit('winDesktop:session:start', { sessionId: id })
        res.writeHead(201)
        res.end(JSON.stringify(session))
      } else if (/^\/sessions\/[^/]+$/.test(url.pathname) && req.method === 'DELETE') {
        const id = url.pathname.split('/').pop()!
        if (this.sessions.has(id)) {
          this.sessions.delete(id)
          this.ctx.emit('winDesktop:session:stop', { sessionId: id })
        }
        res.writeHead(204)
        res.end()
      } else {
        res.writeHead(404)
        res.end(JSON.stringify({ error: 'not found' }))
      }
    })

    await new Promise<void>((resolve, reject) => {
      this.server.once('error', reject)
      this.server.listen(this.config.port, this.config.host, () => {
        this.server.off('error', reject)
        this.server.on('error', (err) => this.ctx.logger.error(err))
        this.port = (this.server.address() as AddressInfo).port
        resolve()
      })
    })

    this.ctx.effect(() => async () => {
      const closed = new Promise<void>((resolve) => {
        this.server.close(() => resolve())
      })
      this.server.closeAllConnections()
      await closed
    }, 'winDesktop.close')
  }
}

/** Plugin apply — no host-side behavior beyond service registration. */
export function apply(): void {}

export default WinDesktopService

/**
 * Package-owned invariant companion for `@deepseek-ai/dsh-win-desktop`.
 * @module @deepseek-ai/dsh-win-desktop/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = '@deepseek-ai/dsh-win-desktop'

/** Cordis companion plugin name. */
export const name = 'win-desktop-invariant'

/** Services required before the invariant can register. */
export const inject = ['invariants']

/**
 * Owned relation: session lifecycle events must match HTTP endpoints.
 * Every POST /sessions emission must have a corresponding DELETE handler,
 * and the session map must never retain entries after DELETE.
 */
const install: InvariantInstaller = (ctx, fail) => {
  ctx.on('winDesktop:session:start', ({ sessionId }: { sessionId: string }) => {
    const service = ctx.get('winDesktop') as
      | { getSessions: () => { id: string }[] }
      | undefined
    if (service === undefined) return
    const exists = service.getSessions().some((s) => s.id === sessionId)
    if (!exists) {
      fail('winDesktop: session:start emitted but session not found in store')
    }
  }, { global: true })

  ctx.on('winDesktop:session:stop', ({ sessionId }: { sessionId: string }) => {
    const service = ctx.get('winDesktop') as
      | { getSessions: () => { id: string }[] }
      | undefined
    if (service === undefined) return
    const exists = service.getSessions().some((s) => s.id === sessionId)
    if (exists) {
      fail('winDesktop: session:stop emitted but session still in store')
    }
  }, { global: true })
}

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
/* jscpd:ignore-end */

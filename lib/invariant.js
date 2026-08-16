/**
 * @deepseek-ai/dsh-win-desktop/invariant — ESM invariant companion.
 */

const PACKAGE_NAME = '@deepseek-ai/dsh-win-desktop'
export const name = 'win-desktop-invariant'
export const inject = ['invariants']

export async function apply(ctx, fail) {
  ctx.on('winDesktop:session:start', ({ sessionId }) => {
    const service = ctx.get('winDesktop')
    if (!service) return
    const exists = service.getSessions().some(s => s.id === sessionId)
    if (!exists) fail('winDesktop: session:start emitted but session not in store')
  }, { global: true })

  ctx.on('winDesktop:session:stop', ({ sessionId }) => {
    const service = ctx.get('winDesktop')
    if (!service) return
    const exists = service.getSessions().some(s => s.id === sessionId)
    if (exists) fail('winDesktop: session:stop emitted but session still in store')
  }, { global: true })

  return () => {}
}

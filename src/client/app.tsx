/**
 * @deepseek-ai/dsh-win-desktop/client — Windows Desktop panel client apply.
 *
 * Injects the WinDesktopPanel into the DSH slot system and provides
 * HTTP API communication with the host-side WinDesktopService.
 */

import type { ClientContext, SessionId } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots/client'
import { renderRoot, type SlotRendererHost } from '@deepseek-ai/dsh-client-ui-slots'
import { WinDesktopPanel } from './ui-panel.tsx'
import { WIN_DESKTOP_PANEL, type WinDesktopSession } from './slots.ts'
import { NS, en, zh } from './locales.ts'

interface AppState {
  isRunning: boolean
  sessions: WinDesktopSession[]
  lastError: string | null
}

async function fetchState(): Promise<AppState> {
  try {
    const res = await fetch('/api/win-desktop/state')
    if (!res.ok) return { isRunning: false, sessions: [], lastError: null }
    const data = await res.json()
    return {
      isRunning: data.isRunning ?? true,
      sessions: data.sessions ?? [],
      lastError: null,
    }
  } catch {
    return { isRunning: false, sessions: [], lastError: null }
  }
}

async function createSession(): Promise<WinDesktopSession> {
  const res = await fetch('/api/win-desktop/sessions', { method: 'POST' })
  if (!res.ok) throw new Error('Failed to create session')
  return res.json()
}

async function stopSession(sessionId: string): Promise<void> {
  const res = await fetch(`/api/win-desktop/sessions/${sessionId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to stop session')
}

/**
 * Client plugin entry point.
 * Installs the locale dictionary and registers the panel slot.
 */
export function apply(ctx: ClientContext): void {
  // Register locale dictionaries
  ctx.effect(() => {
    const locale = ctx.locale
    if (locale === undefined) return () => {}
    return locale.register(NS, { zh, en })
  }, 'win-desktop:locale')

  // Register the panel slot
  ctx.effect(() => {
    const slots = ctx.slots
    if (slots === undefined) return () => {}

    const dispose = slots.inject(WIN_DESKTOP_PANEL, () => {
      let state: AppState = { isRunning: true, sessions: [], lastError: null }
      let resolveRender: ((value: unknown) => void) | undefined

      const poll = async () => {
        state = await fetchState()
        resolveRender?.(null)
      }

      // Initial fetch + periodic poll
      void poll()
      const interval = setInterval(poll, 3000)

      const Component = () => (
        <WinDesktopPanel
          t={(key: string, params?: Record<string, unknown>) => {
            const dict = { ...en, ...zh }
            return String(dict[key as keyof typeof dict] ?? key)
          }}
          onCreateSession={async () => {
            const session = await createSession()
            state.sessions = [...state.sessions, session]
            resolveRender?.(null)
          }}
          onStopSession={async (id) => {
            await stopSession(id)
            state.sessions = state.sessions.filter((s) => s.id !== id)
            resolveRender?.(null)
          }}
          sessions={state.sessions}
          isRunning={state.isRunning}
          lastError={state.lastError}
        />
      )

      // Render the component tree into the slot
      const observer = {
        getSnapshot: () => state,
        subscribe: (fn: () => void) => {
          resolveRender = fn
          return () => { resolveRender = undefined }
        },
      }

      return () => {
        clearInterval(interval)
      }
    })

    return dispose
  }, 'win-desktop:slot')
}

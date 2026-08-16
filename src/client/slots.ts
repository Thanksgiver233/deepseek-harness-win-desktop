/**
 * Slot registry declarations for the Windows Desktop panel.
 * Extend SlotMap via declaration merging.
 */

import type { ReactNode } from 'react'
import type { SlotEntryDef } from '@deepseek-ai/dsh-client-ui-slots'

/** Slot key for the main Windows Desktop panel. */
export const WIN_DESKTOP_PANEL = 'win-desktop.panel'

/** Slot key for individual session cards. */
export const WIN_DESKTOP_SESSION = 'win-desktop.session'

/** Declare the slot entries owned by this plugin. */
declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    /** Main Windows Desktop management panel. */
    [WIN_DESKTOP_PANEL]: SlotEntryDef & {
      kind: 'single'
      scope: 'root'
      owner?: { title: string; icon: string }
    }
    /** Per-session card rendered inside the panel. */
    [WIN_DESKTOP_SESSION]: SlotEntryDef & {
      kind: 'list'
      scope: 'session'
      owner?: { sessionId: string }
    }
  }
}

export interface WinDesktopPanelProps {
  /** Translated label helper. */
  t: (key: string, params?: Record<string, unknown>) => string
  /** On-click handler for "New Session" button. */
  onCreateSession: () => Promise<void>
  /** On-click handler for stopping a session. */
  onStopSession: (sessionId: string) => Promise<void>
  /** Current sessions list. */
  sessions: WinDesktopSession[]
  /** Whether the backend service is running. */
  isRunning: boolean
  /** Last error message, or null. */
  lastError: string | null
}

export interface WinDesktopSession {
  id: string
  name: string
  status: 'idle' | 'running' | 'error'
  startedAt: number
}

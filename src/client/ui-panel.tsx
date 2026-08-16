/**
 * Windows Desktop panel UI — rendered inside the DSH web shell slot.
 *
 * Uses only @deepseek-ai/dsh-client-ui-primitives for styling consistency.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Button, StateDot, Toast } from '@deepseek-ai/dsh-client-ui-primitives'
import type { WinDesktopPanelProps, WinDesktopSession } from './slots.ts'

const STATUS_COLORS: Record<WinDesktopSession['status'], string> = {
  idle: '#6b7280',
  running: '#10b981',
  error: '#ef4444',
}

/** A single session row displayed in the panel. */
const SessionRow: React.FC<{
  session: WinDesktopSession
  onStop: (id: string) => void
}> = ({ session, onStop }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 12px',
      borderRadius: '6px',
      border: '1px solid var(--dsw-border-muted)',
      marginBottom: '6px',
      backgroundColor: 'var(--dsw-surface-raised)',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <StateDot state={session.status === 'running' ? 'online' : session.status === 'error' ? 'error' : 'offline'} />
      <div>
        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--dsw-text-primary)' }}>
          {session.name}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--dsw-text-secondary)' }}>
          {new Date(session.startedAt).toLocaleString()}
        </div>
      </div>
    </div>
    <Button
      variant="danger"
      size="sm"
      onClick={() => onStop(session.id)}
    >
      Stop
    </Button>
  </div>
)

/**
 * The main Windows Desktop management panel.
 * Mounted into the `win-desktop.panel` slot by the client apply function.
 */
export const WinDesktopPanel: React.FC<WinDesktopPanelProps> = ({
  t,
  onCreateSession,
  onStopSession,
  sessions,
  isRunning,
  lastError,
}) => {
  const [toast, setToast] = useState<string | null>(null)

  const handleCreate = useCallback(async () => {
    try {
      await onCreateSession()
      setToast('Session created')
    } catch (err) {
      setToast(String(err))
    }
  }, [onCreateSession])

  const handleStop = useCallback(async (id: string) => {
    try {
      await onStopSession(id)
      setToast('Session stopped')
    } catch (err) {
      setToast(String(err))
    }
  }, [onStopSession])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  return (
    <div style={{ padding: '16px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--dsw-text-primary)' }}>
          {t('winDesktop.title', 'Windows Desktop Sessions')}
        </h2>
        <Button variant="primary" size="sm" onClick={handleCreate} disabled={!isRunning}>
          {t('winDesktop.newSession', '+ New Session')}
        </Button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          backgroundColor: isRunning ? 'var(--dsw-bg-success-subtle)' : 'var(--dsw-bg-danger-subtle)',
          color: isRunning ? 'var(--dsw-text-success)' : 'var(--dsw-text-danger)',
        }}>
          <StateDot state={isRunning ? 'online' : 'offline'} />
          {isRunning ? 'Service Running' : 'Service Stopped'}
        </span>
        <span style={{
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          backgroundColor: 'var(--dsw-bg-muted)',
          color: 'var(--dsw-text-secondary)',
        }}>
          v0.1.0
        </span>
      </div>

      {lastError && (
        <Toast variant="danger" onClose={() => {}}>
          {lastError}
        </Toast>
      )}

      {toast && !lastError && (
        <Toast variant="success" onClose={() => setToast(null)}>
          {toast}
        </Toast>
      )}

      <div style={{ minHeight: '80px' }}>
        {sessions.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '32px',
            color: 'var(--dsw-text-muted)',
            fontSize: '14px',
          }}>
            {t('winDesktop.noSessions', 'No active sessions. Click "+ New Session" to start.')}
          </div>
        ) : (
          sessions.map((s) => (
            <SessionRow key={s.id} session={s} onStop={handleStop} />
          ))
        )}
      </div>
    </div>
  )
}

export default WinDesktopPanel

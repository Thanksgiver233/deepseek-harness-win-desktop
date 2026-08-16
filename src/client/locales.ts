/**
 * Locale dictionaries for the Windows Desktop panel.
 * Declared namespace "winDesktop" — merged into LocaleNamespaceMap by the locale plugin.
 */

export const en = {
  title: 'Windows Desktop Sessions',
  newSession: '+ New Session',
  noSessions: 'No active sessions. Click "+ New Session" to start.',
  serviceRunning: 'Service Running',
  serviceStopped: 'Service Stopped',
  sessionCreated: 'Session created',
  sessionStopped: 'Session stopped',
  createError: 'Failed to create session',
  stopError: 'Failed to stop session',
} as const

export const zh = {
  title: 'Windows 桌面会话',
  newSession: '+ 新建会话',
  noSessions: '暂无活跃会话。点击"+ 新建会话"开始。',
  serviceRunning: '服务运行中',
  serviceStopped: '服务已停止',
  sessionCreated: '会话已创建',
  sessionStopped: '会话已停止',
  createError: '创建会话失败',
  stopError: '停止会话失败',
} as const

/** Dictionary namespace key owned by this plugin. */
export const NS = 'winDesktop' as const
export type WinDesktopLocaleKey = keyof typeof en

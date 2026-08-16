# deepseek-harness-win-desktop
`@deepseek-ai/dsh-win-desktop` 是 DeepSeek Harness（DSH）的 Windows 桌面插件，通过本地 HTTP 服务桥接 Windows 桌面会话。它在 8765 端口（可配置）运行一个轻量 HTTP 服务器，提供完整的会话管理 REST API（`GET /health`、`GET /sessions`、`POST /sessions`、`DELETE /sessions/:id`），并以 React 组件形式注入 DSH Web UI 的 Slot 系统，支持 3 秒轮询刷新和实时状态指示。该插件严格遵循 DSH 官方插件架构：Host 端基于 Cordis `Service` 类实现，使用 `schemastery` 做配置校验。

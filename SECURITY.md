# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | ✅                 |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly.

**Do NOT open a public GitHub issue.**

Instead, email security@deepseek.com or use GitHub Security Advisories.

### What to include

- Description of the vulnerability
- Steps to reproduce
- Impact assessment
- Your contact information

### What to expect

- Acknowledgment within 48 hours
- Status update within 7 days
- Public disclosure after fix (with your permission)

## Security Measures

- All HTTP responses include `Access-Control-Allow-Origin: *` for browser compatibility
- Sessions are in-memory only (no persistence = no data leakage)
- Default bind host is `127.0.0.1` (loopback only — not exposed to LAN)
- No credentials or secrets are stored or transmitted
- The plugin has no network outbound calls (client-side polling is browser-initiated)
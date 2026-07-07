# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-07-07

### Added

- Initial production-ready Argo CD MCP Server template.
- Streamable HTTP MCP transport.
- Bearer-token authentication for `/mcp`.
- Argo CD API client with token authentication.
- MCP tools for application listing, inspection, health, sync status, resources, events, refresh, and optional sync.
- Feature flag for `sync_application` write operations.
- Health endpoint for Argo CD connectivity checks.
- Rate limiting for MCP requests.
- Structured Pino logging.
- Zod-based environment validation.
- Jest test setup.
- GitHub Actions CI workflow.
- Architecture documentation.
- MIT license.

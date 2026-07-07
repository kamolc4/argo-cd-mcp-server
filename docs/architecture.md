# Argo CD MCP Server Architecture

This project exposes Argo CD deployment data to MCP-compatible AI clients through a secure Streamable HTTP MCP server.

## Request flow

```text
AI Client
  │
  │ HTTP POST /mcp
  │ Authorization: Bearer <MCP_API_KEY>
  ▼
Express Application
  │
  ├── JSON request parsing
  ├── API key authentication
  ├── Rate limiting
  └── Streamable HTTP MCP transport
        │
        ▼
MCP Tool Registry
  │
  ├── list_applications
  ├── get_application
  ├── get_application_health
  ├── get_application_sync_status
  ├── list_application_resources
  ├── get_application_events
  ├── refresh_application
  └── sync_application (feature-flagged)
        │
        ▼
Argo CD Client
  │
  ├── Bearer token auth
  ├── TLS configuration
  ├── Axios error normalization
  └── Argo CD REST API
```

## Security boundaries

- The MCP endpoint requires `Authorization: Bearer <MCP_API_KEY>`.
- Argo CD access is performed through a dedicated `ARGOCD_TOKEN`.
- The `sync_application` write tool is disabled unless `ENABLE_SYNC_TOOL=true`.
- `ARGOCD_INSECURE_TLS=true` should only be used for local development with self-signed certificates.
- The Argo CD token is never logged by the application.

## Recommended production setup

Use a dedicated Argo CD account with least-privilege RBAC permissions. Start with read-only permissions for application inspection, and only add sync permissions when the workflow has an approval layer and audit logging.

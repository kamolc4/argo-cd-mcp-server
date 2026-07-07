# Argo CD MCP Server

[![CI](https://github.com/kamolc4/argo-cd-mcp-server/actions/workflows/ci.yml/badge.svg)](https://github.com/kamolc4/argo-cd-mcp-server/actions/workflows/ci.yml)
[![Verified by MCPForge](https://www.mcpforge.tech/api/servers/argo-cd-mcp-server/badge)](https://www.mcpforge.tech/verified/argo-cd-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A production-ready Model Context Protocol server for the Argo CD API.

This template lets Claude Desktop, Cursor, Windsurf, and other MCP-compatible clients inspect Argo CD applications, check sync and health status, list Kubernetes resources, review events, refresh applications, and optionally trigger controlled sync operations.

Built as a secure starter template for platform teams, DevOps engineers, and GitOps workflows that need AI-assisted visibility into Argo CD without exposing unrestricted cluster access.

## Who this is for

This repository is useful for:

- platform engineers building AI assistants for GitOps workflows,
- DevOps teams that use Argo CD for Kubernetes deployments,
- SRE teams that want safe read-only deployment visibility from Claude or Cursor,
- internal tools teams connecting Argo CD to AI agents,
- agencies building production MCP integrations for Kubernetes and cloud-native clients.

## Features

- TypeScript + Express MCP server
- Streamable HTTP transport using the official MCP SDK
- Bearer-token protection for `/mcp`
- Rate limiting for MCP requests
- Health endpoint at `/health`
- Structured Pino logging
- Zod-based environment validation
- Argo CD REST API client
- MCP tools for applications, health, sync status, resources, events, refresh, and optional sync
- Feature flag for write operations with `ENABLE_SYNC_TOOL`
- GitHub Actions CI workflow
- Jest test setup

## Architecture

```text
Claude Desktop / Cursor / Windsurf
        │
        │  HTTP POST /mcp
        │  Authorization: Bearer <MCP_API_KEY>
        ▼
  Express Server
        │
        ├── Express JSON middleware
        ├── API key authentication
        ├── Rate limiter
        ├── Streamable HTTP MCP transport
        │
        ▼
   MCP SDK Handler
        │
        ├── list_applications          ─┐
        ├── get_application            ─┤
        ├── get_application_health     ─┤
        ├── get_application_sync_status ┤──► Argo CD REST API
        ├── list_application_resources ─┤
        ├── get_application_events     ─┤
        ├── refresh_application        ─┤
        └── sync_application*          ─┘

  * sync_application is only registered when ENABLE_SYNC_TOOL=true

  GET /health → Argo CD connectivity + dependency status
```

See the larger diagram in [docs/architecture.md](docs/architecture.md).

## Source Code

The complete production-ready Argo CD MCP Server template is available on GitHub.

Repository:

https://github.com/kamolc4/argo-cd-mcp-server

The repository includes TypeScript source code, Argo CD API tools, authentication middleware, tests, GitHub Actions CI, security notes, and configuration examples for Claude Desktop and Cursor.

Fork the repository or download it as a ZIP to start building immediately.

## MCPForge Starter Template

Explore, copy, or customize the production-ready starter template on MCPForge:

https://www.mcpforge.tech/code/production-argo-cd-mcp-server-template-typescript

## Available MCP tools

| Tool | Purpose | Risk |
|---|---|---|
| `list_applications` | List Argo CD applications, optionally filtered by project or namespace. | Read-only |
| `get_application` | Fetch full application details by name. | Read-only |
| `get_application_health` | Return summarized application health status. | Read-only |
| `get_application_sync_status` | Return summarized sync status and revision details. | Read-only |
| `list_application_resources` | List Kubernetes resources managed by an Argo CD application. | Read-only |
| `get_application_events` | Fetch recent Argo CD application events. | Read-only |
| `refresh_application` | Ask Argo CD to refresh/reconcile an application. | Low-impact action |
| `sync_application` | Trigger an application sync. Disabled unless `ENABLE_SYNC_TOOL=true`. | Write operation |

## Quick start

### 1. Clone the repository

```bash
git clone https://github.com/kamolc4/argo-cd-mcp-server.git
cd argo-cd-mcp-server
```

### 2. Install dependencies

```bash
npm ci
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```bash
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

MCP_API_KEY=replace-with-a-long-random-secret

ARGOCD_SERVER_URL=https://argocd.example.com
ARGOCD_TOKEN=your-argocd-api-token
ARGOCD_INSECURE_TLS=false
ARGOCD_NAMESPACE=argocd

RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=60
ENABLE_SYNC_TOOL=false
```

### 4. Run locally

```bash
npm run dev
```

### 5. Check health

```bash
curl http://localhost:3000/health
```

### 6. List MCP tools

```bash
curl -X POST http://localhost:3000/mcp \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer replace-with-a-long-random-secret' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

## Argo CD setup

Create a dedicated Argo CD account for this MCP server and grant only the permissions required by your use case.

Example high-level flow:

1. Create a service account or local account for MCP access.
2. Grant read-only access for application inspection.
3. Generate an API token for that account.
4. Store the token as `ARGOCD_TOKEN` in your runtime environment.
5. Keep `ENABLE_SYNC_TOOL=false` until you intentionally review and approve write access.

For production, prefer a least-privilege policy that allows read operations by default and only enables sync permissions for approved environments.

## Connect to Claude Desktop

Build and start the server:

```bash
npm run build
npm start
```

Then add an MCP server entry in your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "argocd": {
      "url": "http://localhost:3000/mcp",
      "headers": {
        "Authorization": "Bearer replace-with-your-mcp-api-key"
      }
    }
  }
}
```

Restart Claude Desktop after editing the configuration.

## Connect to Cursor

In Cursor, add a new MCP server using the HTTP endpoint:

```json
{
  "name": "argocd",
  "url": "http://localhost:3000/mcp",
  "headers": {
    "Authorization": "Bearer replace-with-your-mcp-api-key"
  }
}
```

Then restart Cursor or reload the MCP server list.

## Security notes

This template is intentionally conservative, but you should harden it before production use.

Recommended production changes:

- Use a dedicated Argo CD service account for this server.
- Grant least-privilege RBAC permissions in Argo CD.
- Store `ARGOCD_TOKEN` and `MCP_API_KEY` in a managed secret manager.
- Keep `ENABLE_SYNC_TOOL=false` unless write operations are explicitly required.
- Put `sync_application` behind a human approval workflow before production use.
- Do not use `ARGOCD_INSECURE_TLS=true` in production.
- Rotate Argo CD tokens regularly.
- Add audit logs for every MCP tool call.
- Restrict network access to the MCP server.
- Use HTTPS in production.
- Verify the server with MCPForge before exposing it to AI clients.

## Security Review

Verify this server with MCPForge:

https://www.mcpforge.tech/verify

MCPForge can help review:

- exposed tools,
- authentication behavior,
- health checks,
- compatibility with MCP clients,
- risk level of write operations,
- security posture before publishing or deployment.

After verification, you can link your public report from this README:

```md
[![Verified by MCPForge](https://www.mcpforge.tech/api/servers/argo-cd-mcp-server/badge)](https://www.mcpforge.tech/verified/argo-cd-mcp-server)
```

## Deployment

A common production setup:

1. Deploy this service to Railway, Render, Fly.io, AWS, GCP, Azure, or a private Kubernetes cluster.
2. Configure environment variables in the hosting provider or secret manager.
3. Set `ARGOCD_SERVER_URL` to your Argo CD server URL.
4. Set `ARGOCD_TOKEN` to a least-privilege Argo CD API token.
5. Set `MCP_API_KEY` to a long random secret.
6. Keep `ARGOCD_INSECURE_TLS=false` in production.
7. Verify `/health` and `/mcp` before connecting production AI clients.
8. Run a public or private verification with MCPForge.

## Local development commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## API endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health and Argo CD connectivity check. |
| `POST` | `/mcp` | MCP endpoint protected by `Authorization: Bearer <MCP_API_KEY>`. |
| `GET` | `/mcp` | Returns `405` in stateless HTTP mode. |
| `DELETE` | `/mcp` | Returns `405` in stateless HTTP mode. |

## Releases

Latest stable release:

`v1.0.0`

See the Releases page for the full changelog.

## Contributing

Contributions are welcome.

If you want to improve this Argo CD MCP Server template, open an issue or submit a pull request.

## Related MCP Server Templates

Looking for other production-ready MCP Server templates?

- GitHub MCP Server
- Slack MCP Server
- Linear MCP Server
- Kubernetes MCP Server
- PostgreSQL MCP Server
- Next.js MCP Server
- Python FastAPI MCP Server

Browse the complete collection:

https://www.mcpforge.tech/code

## License

MIT — see [LICENSE](LICENSE).

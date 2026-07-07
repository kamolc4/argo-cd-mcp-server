import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { config } from './config';
import { logger } from './logger';
import { apiKeyAuth } from './auth';
import { healthRouter } from './health';
import { registerAllTools } from './tools/index';

function buildMcpServer(): McpServer {
  const server = new McpServer(
    { name: 'argo-cd-mcp-server', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );
  registerAllTools(server);
  return server;
}

const app = express();
app.disable('x-powered-by');
app.use(express.json());

// Health check — unauthenticated, no rate limit, used for readiness/liveness probes
app.use(healthRouter);

const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  limit: config.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
});

// MCP endpoint — authenticated, rate-limited, stateless Streamable HTTP transport.
// A new server + transport pair is created per request to keep tool state isolated.
app.post('/mcp', apiKeyAuth, limiter, async (req: Request, res: Response) => {
  const requestId = randomUUID();
  try {
    const server = buildMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on('close', () => {
      transport.close();
      server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ requestId, err: message }, 'Error handling MCP request');
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null,
      });
    }
  }
});

// GET/DELETE are not supported in stateless mode (no sessions to resume or terminate)
app.get('/mcp', apiKeyAuth, (_req: Request, res: Response) => {
  res.status(405).json({
    error: 'Method Not Allowed',
    message: 'This server runs in stateless mode; GET /mcp is not supported.',
  });
});

app.delete('/mcp', apiKeyAuth, (_req: Request, res: Response) => {
  res.status(405).json({
    error: 'Method Not Allowed',
    message: 'This server runs in stateless mode; DELETE /mcp is not supported.',
  });
});

const httpServer = app.listen(config.PORT, () => {
  logger.info(
    { port: config.PORT, env: config.NODE_ENV },
    'Argo CD MCP server listening'
  );
});

function shutdown(signal: string): void {
  logger.info({ signal }, 'Shutting down');
  httpServer.close(() => {
    process.exit(0);
  });
  // Force exit if graceful shutdown hangs
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

import { Router, Request, Response } from 'express';
import { getArgoCDClient } from './argocd/client';
import { logger } from './logger';
import { config } from './config';

export const healthRouter = Router();

interface HealthStatus {
  status: 'ok' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    argocd: {
      status: 'ok' | 'unreachable';
      url: string;
      latencyMs?: number;
      error?: string;
    };
  };
}

healthRouter.get('/health', async (_req: Request, res: Response) => {
  const startTime = Date.now();
  const client = getArgoCDClient();

  let argoCDStatus: HealthStatus['checks']['argocd'];

  try {
    const t0 = Date.now();
    // Use the version endpoint — it is lightweight, public, and always available
    await client.getVersion();
    argoCDStatus = {
      status: 'ok',
      url: config.ARGOCD_SERVER_URL,
      latencyMs: Date.now() - t0,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn({ err: message }, 'Health check: Argo CD unreachable');
    argoCDStatus = {
      status: 'unreachable',
      url: config.ARGOCD_SERVER_URL,
      error: message,
    };
  }

  const overallStatus: HealthStatus['status'] =
    argoCDStatus.status === 'ok' ? 'ok' : 'degraded';

  const body: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '1.0.0',
    uptime: Math.floor(process.uptime()),
    checks: {
      argocd: argoCDStatus,
    },
  };

  const httpStatus = overallStatus === 'ok' ? 200 : 503;
  const elapsed = Date.now() - startTime;
  logger.info({ status: overallStatus, latencyMs: elapsed }, 'Health check');

  res.status(httpStatus).json(body);
});

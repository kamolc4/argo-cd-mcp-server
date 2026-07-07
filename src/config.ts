import { z } from 'zod';

const configSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error'])
    .default('info'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('production'),

  // MCP authentication
  MCP_API_KEY: z.string().min(16, 'MCP_API_KEY must be at least 16 characters'),

  // Argo CD
  ARGOCD_SERVER_URL: z
    .string()
    .url('ARGOCD_SERVER_URL must be a valid URL')
    .transform((u) => u.replace(/\/$/, '')), // strip trailing slash
  ARGOCD_TOKEN: z.string().min(1, 'ARGOCD_TOKEN is required'),
  ARGOCD_INSECURE_TLS: z
    .string()
    .default('false')
    .transform((v) => v.toLowerCase() === 'true'),
  ARGOCD_NAMESPACE: z.string().default('argocd'),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(60),

  // Feature flags
  ENABLE_SYNC_TOOL: z
    .string()
    .default('false')
    .transform((v) => v.toLowerCase() === 'true'),
});

export function loadConfig(env: Record<string, string | undefined> = process.env) {
  const result = configSchema.safeParse(env);
  if (!result.success) {
    const errors = result.error.errors
      .map((e) => `  ${e.path.join('.')}: ${e.message}`)
      .join('\n');
    throw new Error(`Configuration validation failed:\n${errors}`);
  }
  return result.data;
}

export const config = loadConfig();
export type Config = typeof config;

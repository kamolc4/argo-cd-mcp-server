import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getArgoCDClient } from '../argocd/client';
import { logger } from '../logger';

const inputSchema = z.object({
  name: z.string().min(1).describe('Name of the Argo CD application'),
  appNamespace: z
    .string()
    .optional()
    .describe('Namespace of the application (optional)'),
});

export function registerGetApplicationHealth(server: McpServer): void {
  server.tool(
    'get_application_health',
    'Get the health status of a specific Argo CD application. Returns health status, message, and per-resource health.',
    inputSchema.shape,
    async (args) => {
      const input = inputSchema.parse(args);
      logger.info(
        { tool: 'get_application_health', name: input.name },
        'Tool called'
      );

      const client = getArgoCDClient();
      const app = await client.getApplication(input.name, input.appNamespace);

      const resourceHealth = (app.status.resources ?? []).map((r) => ({
        kind: r.kind,
        name: r.name,
        namespace: r.namespace ?? 'cluster-scoped',
        health: r.health?.status ?? 'Unknown',
        healthMessage: r.health?.message ?? null,
      }));

      const result = {
        application: input.name,
        overallHealth: app.status.health.status,
        healthMessage: app.status.health.message ?? null,
        reconciledAt: app.status.reconciledAt ?? null,
        resources: resourceHealth,
        unhealthyResources: resourceHealth.filter(
          (r) => r.health !== 'Healthy' && r.health !== 'Unknown'
        ),
      };

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );
}

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getArgoCDClient } from '../argocd/client';
import { logger } from '../logger';

const inputSchema = z.object({
  name: z.string().min(1).describe('Name of the Argo CD application'),
  hardRefresh: z
    .boolean()
    .default(false)
    .describe(
      'If true, forces a hard refresh (re-pulls manifests from source, bypassing the cache). If false, performs a normal refresh.'
    ),
});

export function registerRefreshApplication(server: McpServer): void {
  server.tool(
    'refresh_application',
    'Trigger Argo CD to re-reconcile an application against its live state. Read-only with respect to the cluster — does not change deployed resources.',
    inputSchema.shape,
    async (args) => {
      const input = inputSchema.parse(args);
      logger.info(
        {
          tool: 'refresh_application',
          name: input.name,
          hardRefresh: input.hardRefresh,
        },
        'Tool called'
      );

      const client = getArgoCDClient();
      const app = await client.refreshApplication(
        input.name,
        input.hardRefresh
      );

      const result = {
        application: input.name,
        refreshType: input.hardRefresh ? 'hard' : 'normal',
        health: app.status.health.status,
        syncStatus: app.status.sync.status,
        reconciledAt: app.status.reconciledAt ?? null,
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

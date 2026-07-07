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

export function registerGetApplicationEvents(server: McpServer): void {
  server.tool(
    'get_application_events',
    'Get the Kubernetes events associated with a specific Argo CD application (deployments, sync operations, warnings, etc.).',
    inputSchema.shape,
    async (args) => {
      const input = inputSchema.parse(args);
      logger.info(
        { tool: 'get_application_events', name: input.name },
        'Tool called'
      );

      const client = getArgoCDClient();
      const response = await client.getApplicationEvents(
        input.name,
        input.appNamespace
      );

      const events = (response.items ?? []).map((e) => ({
        type: e.type,
        reason: e.reason,
        message: e.message,
        count: e.count ?? 1,
        firstTimestamp: e.firstTimestamp ?? null,
        lastTimestamp: e.lastTimestamp ?? null,
        component: e.source?.component ?? null,
      }));

      const result = {
        application: input.name,
        total: events.length,
        warningCount: events.filter((e) => e.type === 'Warning').length,
        events,
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

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

export function registerGetApplication(server: McpServer): void {
  server.tool(
    'get_application',
    'Get full details for a specific Argo CD application including spec, status, and operation state.',
    inputSchema.shape,
    async (args) => {
      const input = inputSchema.parse(args);
      logger.info({ tool: 'get_application', name: input.name }, 'Tool called');

      const client = getArgoCDClient();
      const app = await client.getApplication(input.name, input.appNamespace);

      const detail = {
        name: app.metadata.name,
        namespace: app.metadata.namespace,
        uid: app.metadata.uid,
        createdAt: app.metadata.creationTimestamp,
        labels: app.metadata.labels ?? {},
        project: app.spec.project,
        source: {
          repoURL: app.spec.source.repoURL,
          path: app.spec.source.path,
          targetRevision: app.spec.source.targetRevision,
          chart: app.spec.source.chart,
        },
        destination: app.spec.destination,
        syncPolicy: app.spec.syncPolicy ?? null,
        health: app.status.health,
        sync: app.status.sync,
        conditions: app.status.conditions ?? [],
        reconciledAt: app.status.reconciledAt ?? null,
        operationState: app.status.operationState ?? null,
        images: app.status.summary?.images ?? [],
      };

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(detail, null, 2),
          },
        ],
      };
    }
  );
}

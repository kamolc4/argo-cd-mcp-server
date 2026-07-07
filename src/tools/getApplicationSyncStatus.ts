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

export function registerGetApplicationSyncStatus(server: McpServer): void {
  server.tool(
    'get_application_sync_status',
    'Get the sync status of a specific Argo CD application including revision, sync phase, and any drift details.',
    inputSchema.shape,
    async (args) => {
      const input = inputSchema.parse(args);
      logger.info(
        { tool: 'get_application_sync_status', name: input.name },
        'Tool called'
      );

      const client = getArgoCDClient();
      const app = await client.getApplication(input.name, input.appNamespace);

      const outOfSyncResources = (app.status.resources ?? []).filter(
        (r) => r.status === 'OutOfSync'
      );

      const result = {
        application: input.name,
        syncStatus: app.status.sync.status,
        revision: app.status.sync.revision ?? null,
        automatedSync: app.spec.syncPolicy?.automated != null,
        autoPrune: app.spec.syncPolicy?.automated?.prune ?? false,
        selfHeal: app.spec.syncPolicy?.automated?.selfHeal ?? false,
        operationState: app.status.operationState
          ? {
              phase: app.status.operationState.phase,
              message: app.status.operationState.message ?? null,
              startedAt: app.status.operationState.startedAt ?? null,
              finishedAt: app.status.operationState.finishedAt ?? null,
            }
          : null,
        outOfSyncResources: outOfSyncResources.map((r) => ({
          kind: r.kind,
          name: r.name,
          namespace: r.namespace ?? 'cluster-scoped',
          requiresPruning: r.requiresPruning ?? false,
        })),
        outOfSyncCount: outOfSyncResources.length,
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

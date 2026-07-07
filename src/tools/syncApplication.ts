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
  dryRun: z
    .boolean()
    .default(false)
    .describe('If true, performs a dry run without applying changes.'),
  prune: z
    .boolean()
    .default(false)
    .describe('If true, deletes resources that are no longer defined in source.'),
  revision: z
    .string()
    .optional()
    .describe('Specific git revision to sync to (defaults to the target revision).'),
});

/**
 * ⚠️ WRITE OPERATION
 * This tool triggers a real sync against the live cluster and is only
 * registered when ENABLE_SYNC_TOOL=true (see src/tools/index.ts).
 */
export function registerSyncApplication(server: McpServer): void {
  server.tool(
    'sync_application',
    'Trigger a sync of an Argo CD application, applying the desired state to the cluster. This is a write operation that can affect production workloads.',
    inputSchema.shape,
    async (args) => {
      const input = inputSchema.parse(args);
      logger.warn(
        {
          tool: 'sync_application',
          name: input.name,
          dryRun: input.dryRun,
          prune: input.prune,
        },
        'Write tool called: sync_application'
      );

      const client = getArgoCDClient();
      const result = await client.syncApplication(input.name, {
        dryRun: input.dryRun,
        prune: input.prune,
        revision: input.revision,
        appNamespace: input.appNamespace,
      });

      const summary = {
        application: input.name,
        dryRun: input.dryRun,
        prune: input.prune,
        revision: result.status.sync.revision ?? input.revision ?? null,
        health: result.status.health.status,
        syncStatus: result.status.sync.status,
        operationPhase: result.status.operationState?.phase ?? null,
      };

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(summary, null, 2),
          },
        ],
      };
    }
  );
}

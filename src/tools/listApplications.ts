import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getArgoCDClient } from '../argocd/client';
import { logger } from '../logger';

const inputSchema = z.object({
  project: z
    .string()
    .optional()
    .describe('Filter by Argo CD project name (optional)'),
  appNamespace: z
    .string()
    .optional()
    .describe('Filter by application namespace (optional)'),
});

export function registerListApplications(server: McpServer): void {
  server.tool(
    'list_applications',
    'List all Argo CD applications, optionally filtered by project or namespace.',
    inputSchema.shape,
    async (args) => {
      const input = inputSchema.parse(args);
      logger.info({ tool: 'list_applications', input }, 'Tool called');

      const client = getArgoCDClient();
      const response = await client.listApplications({
        project: input.project,
        appNamespace: input.appNamespace,
      });

      const apps = response.items ?? [];

      if (apps.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: 'No Argo CD applications found matching the criteria.',
            },
          ],
        };
      }

      const summary = apps.map((app) => ({
        name: app.metadata.name,
        namespace: app.metadata.namespace,
        project: app.spec.project,
        healthStatus: app.status.health.status,
        syncStatus: app.status.sync.status,
        destination: app.spec.destination.namespace,
        repoURL: app.spec.source.repoURL,
        targetRevision: app.spec.source.targetRevision ?? 'HEAD',
        automated: app.spec.syncPolicy?.automated != null,
      }));

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              { total: apps.length, applications: summary },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}

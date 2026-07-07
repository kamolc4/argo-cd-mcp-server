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
  kindFilter: z
    .string()
    .optional()
    .describe(
      'Optional Kubernetes resource kind to filter by, e.g. "Deployment", "Service"'
    ),
});

export function registerListApplicationResources(server: McpServer): void {
  server.tool(
    'list_application_resources',
    'List the Kubernetes resources managed by an Argo CD application via the resource tree.',
    inputSchema.shape,
    async (args) => {
      const input = inputSchema.parse(args);
      logger.info(
        { tool: 'list_application_resources', name: input.name },
        'Tool called'
      );

      const client = getArgoCDClient();
      const tree = await client.getApplicationResourceTree(
        input.name,
        input.appNamespace
      );

      let nodes = tree.nodes ?? [];

      if (input.kindFilter) {
        const kind = input.kindFilter.toLowerCase();
        nodes = nodes.filter((n) => n.kind.toLowerCase() === kind);
      }

      const resources = nodes.map((n) => ({
        group: n.group ?? 'core',
        version: n.version,
        kind: n.kind,
        name: n.name,
        namespace: n.namespace ?? 'cluster-scoped',
        health: n.health?.status ?? 'Unknown',
        healthMessage: n.health?.message ?? null,
        createdAt: n.createdAt ?? null,
        images: n.images ?? [],
      }));

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                application: input.name,
                total: resources.length,
                filtered: input.kindFilter != null,
                kindFilter: input.kindFilter ?? null,
                resources,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { config } from '../config';
import { logger } from '../logger';
import { registerListApplications } from './listApplications';
import { registerGetApplication } from './getApplication';
import { registerGetApplicationHealth } from './getApplicationHealth';
import { registerGetApplicationSyncStatus } from './getApplicationSyncStatus';
import { registerListApplicationResources } from './listApplicationResources';
import { registerGetApplicationEvents } from './getApplicationEvents';
import { registerRefreshApplication } from './refreshApplication';
import { registerSyncApplication } from './syncApplication';

export function registerAllTools(server: McpServer): void {
  registerListApplications(server);
  registerGetApplication(server);
  registerGetApplicationHealth(server);
  registerGetApplicationSyncStatus(server);
  registerListApplicationResources(server);
  registerGetApplicationEvents(server);
  registerRefreshApplication(server);

  if (config.ENABLE_SYNC_TOOL) {
    logger.warn(
      'sync_application tool is ENABLED — this can affect production deployments'
    );
    registerSyncApplication(server);
  } else {
    logger.info(
      'sync_application tool is disabled (set ENABLE_SYNC_TOOL=true to enable)'
    );
  }
}

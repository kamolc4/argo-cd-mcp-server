/**
 * Argo CD REST API response shapes.
 * Based on the official Argo CD API documentation:
 * https://argo-cd.readthedocs.io/en/stable/developer-guide/api-docs/
 *
 * Only the fields actually used by MCP tools are typed here.
 */

export interface ArgoCDVersion {
  Version: string;
  BuildDate: string;
  GitCommit: string;
  GoVersion: string;
  Platform: string;
}

export interface ArgoCDAppListResponse {
  items: ArgoCDApplication[] | null;
  metadata: {
    resourceVersion: string;
  };
}

export interface ArgoCDApplication {
  metadata: AppMetadata;
  spec: AppSpec;
  status: AppStatus;
  operation?: AppOperation;
}

export interface AppMetadata {
  name: string;
  namespace: string;
  uid: string;
  creationTimestamp: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

export interface AppSpec {
  project: string;
  source: AppSource;
  destination: AppDestination;
  syncPolicy?: AppSyncPolicy;
}

export interface AppSource {
  repoURL: string;
  path?: string;
  targetRevision?: string;
  chart?: string;
  helm?: Record<string, unknown>;
  kustomize?: Record<string, unknown>;
}

export interface AppDestination {
  server: string;
  namespace: string;
  name?: string;
}

export interface AppSyncPolicy {
  automated?: {
    prune: boolean;
    selfHeal: boolean;
  };
  syncOptions?: string[];
  retry?: AppRetryStrategy;
}

export interface AppRetryStrategy {
  limit: number;
  backoff?: {
    duration: string;
    factor: number;
    maxDuration: string;
  };
}

export interface AppStatus {
  health: AppHealth;
  sync: AppSync;
  operationState?: AppOperationState;
  conditions?: AppCondition[];
  reconciledAt?: string;
  sourceType?: string;
  summary?: AppSummary;
  resources?: AppResourceStatus[];
}

export interface AppHealth {
  status:
    | 'Healthy'
    | 'Progressing'
    | 'Degraded'
    | 'Suspended'
    | 'Missing'
    | 'Unknown';
  message?: string;
}

export interface AppSync {
  status: 'Synced' | 'OutOfSync' | 'Unknown';
  revision?: string;
  comparedTo?: {
    source: AppSource;
    destination: AppDestination;
  };
}

export interface AppOperationState {
  phase: 'Running' | 'Failed' | 'Succeeded' | 'Error' | 'Terminating';
  message?: string;
  startedAt?: string;
  finishedAt?: string;
  operation?: AppOperation;
  syncResult?: AppSyncResult;
}

export interface AppSyncResult {
  revision: string;
  resources?: AppResourceResult[];
  source: AppSource;
}

export interface AppResourceResult {
  group: string;
  version: string;
  kind: string;
  namespace: string;
  name: string;
  status: string;
  message: string;
  hookPhase?: string;
  syncPhase?: string;
}

export interface AppOperation {
  sync?: {
    revision?: string;
    prune?: boolean;
    dryRun?: boolean;
    resources?: AppResourceRef[];
    syncOptions?: string[];
  };
  initiatedBy?: {
    username?: string;
    automated?: boolean;
  };
  info?: Array<{ name: string; value: string }>;
}

export interface AppResourceRef {
  group?: string;
  kind: string;
  name: string;
  namespace?: string;
}

export interface AppCondition {
  type: string;
  message: string;
  lastTransitionTime?: string;
}

export interface AppSummary {
  externalURLs?: string[];
  images?: string[];
}

export interface AppResourceStatus {
  group?: string;
  version: string;
  kind: string;
  namespace?: string;
  name: string;
  status?: string;
  health?: AppHealth;
  hook?: boolean;
  requiresPruning?: boolean;
}

export interface ArgoCDResourceTreeResponse {
  nodes: ResourceNode[];
  orphanedNodes?: ResourceNode[];
}

export interface ResourceNode {
  group?: string;
  version: string;
  kind: string;
  namespace?: string;
  name: string;
  uid?: string;
  resourceVersion?: string;
  health?: AppHealth;
  parentRefs?: ResourceRef[];
  networkingInfo?: Record<string, unknown>;
  images?: string[];
  createdAt?: string;
}

export interface ResourceRef {
  group?: string;
  version?: string;
  kind?: string;
  namespace?: string;
  name?: string;
  uid?: string;
}

export interface ArgoCDEventsResponse {
  items: ArgoCDEvent[] | null;
  metadata: {
    resourceVersion: string;
  };
}

export interface ArgoCDEvent {
  metadata: AppMetadata;
  involvedObject: {
    kind: string;
    namespace: string;
    name: string;
    uid: string;
    apiVersion: string;
    resourceVersion: string;
  };
  reason: string;
  message: string;
  source: {
    component?: string;
    host?: string;
  };
  firstTimestamp?: string;
  lastTimestamp?: string;
  count?: number;
  type: 'Normal' | 'Warning';
}

export interface ArgoCDSyncResponse {
  metadata: AppMetadata;
  spec: AppSpec;
  status: AppStatus;
  operation?: AppOperation;
}

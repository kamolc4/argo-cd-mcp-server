import axios, { AxiosInstance, AxiosError } from 'axios';
import https from 'https';
import { config } from '../config';
import { logger } from '../logger';
import type {
  ArgoCDVersion,
  ArgoCDAppListResponse,
  ArgoCDApplication,
  ArgoCDResourceTreeResponse,
  ArgoCDEventsResponse,
  ArgoCDSyncResponse,
} from './types';

export class ArgoCDError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly argoCDMessage?: string
  ) {
    super(message);
    this.name = 'ArgoCDError';
  }
}

function buildAxiosInstance(): AxiosInstance {
  const httpsAgent = config.ARGOCD_INSECURE_TLS
    ? new https.Agent({ rejectUnauthorized: false })
    : undefined;

  const instance = axios.create({
    baseURL: `${config.ARGOCD_SERVER_URL}/api/v1`,
    timeout: 15_000,
    headers: {
      // Token is added here — never logged by pino because redact config covers it,
      // but we also avoid passing it through the logger at all.
      Authorization: `Bearer ${config.ARGOCD_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    httpsAgent,
  });

  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const status = error.response?.status;
      const data = error.response?.data as Record<string, unknown> | undefined;
      const argoCDMsg =
        typeof data?.message === 'string'
          ? data.message
          : typeof data?.error === 'string'
          ? data.error
          : 'Unknown Argo CD error';

      logger.error(
        {
          status,
          path: error.config?.url,
          argoCDMessage: argoCDMsg,
          // Do NOT log error.config.headers — it contains the Authorization token
        },
        'Argo CD API request failed'
      );

      throw new ArgoCDError(
        `Argo CD API error: ${argoCDMsg}`,
        status,
        argoCDMsg
      );
    }
  );

  return instance;
}

let _client: ArgoCDClient | null = null;

export function getArgoCDClient(): ArgoCDClient {
  if (!_client) {
    _client = new ArgoCDClient(buildAxiosInstance());
  }
  return _client;
}

export class ArgoCDClient {
  constructor(private readonly http: AxiosInstance) {}

  /** GET /version — lightweight connectivity check */
  async getVersion(): Promise<ArgoCDVersion> {
    const res = await this.http.get<ArgoCDVersion>('/version');
    return res.data;
  }

  /** GET /applications — list all applications with optional project filter */
  async listApplications(params?: {
    project?: string;
    appNamespace?: string;
  }): Promise<ArgoCDAppListResponse> {
    const res = await this.http.get<ArgoCDAppListResponse>('/applications', {
      params,
    });
    return res.data;
  }

  /** GET /applications/{name} */
  async getApplication(
    name: string,
    appNamespace?: string
  ): Promise<ArgoCDApplication> {
    const res = await this.http.get<ArgoCDApplication>(
      `/applications/${encodeURIComponent(name)}`,
      { params: appNamespace ? { appNamespace } : undefined }
    );
    return res.data;
  }

  /** GET /applications/{name}/resource-tree */
  async getApplicationResourceTree(
    name: string,
    appNamespace?: string
  ): Promise<ArgoCDResourceTreeResponse> {
    const res = await this.http.get<ArgoCDResourceTreeResponse>(
      `/applications/${encodeURIComponent(name)}/resource-tree`,
      { params: appNamespace ? { appNamespace } : undefined }
    );
    return res.data;
  }

  /** GET /applications/{name}/events */
  async getApplicationEvents(
    name: string,
    appNamespace?: string
  ): Promise<ArgoCDEventsResponse> {
    const res = await this.http.get<ArgoCDEventsResponse>(
      `/applications/${encodeURIComponent(name)}/events`,
      { params: appNamespace ? { appNamespace } : undefined }
    );
    return res.data;
  }

  /**
   * GET /applications/{name}?refresh=normal
   * Triggers a refresh (re-reconcile) without changing state.
   */
  async refreshApplication(
    name: string,
    hardRefresh = false
  ): Promise<ArgoCDApplication> {
    const res = await this.http.get<ArgoCDApplication>(
      `/applications/${encodeURIComponent(name)}`,
      { params: { refresh: hardRefresh ? 'hard' : 'normal' } }
    );
    return res.data;
  }

  /**
   * POST /applications/{name}/sync
   * ⚠️ Write operation — only called when ENABLE_SYNC_TOOL=true
   */
  async syncApplication(
    name: string,
    options: {
      dryRun?: boolean;
      prune?: boolean;
      revision?: string;
      appNamespace?: string;
    } = {}
  ): Promise<ArgoCDSyncResponse> {
    const body: Record<string, unknown> = {};
    if (options.dryRun !== undefined) body['dryRun'] = options.dryRun;
    if (options.prune !== undefined) body['prune'] = options.prune;
    if (options.revision) body['revision'] = options.revision;

    const res = await this.http.post<ArgoCDSyncResponse>(
      `/applications/${encodeURIComponent(name)}/sync`,
      body,
      { params: options.appNamespace ? { appNamespace: options.appNamespace } : undefined }
    );
    return res.data;
  }
}

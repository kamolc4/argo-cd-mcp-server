import { loadConfig } from '../config';

const baseEnv = {
  MCP_API_KEY: 'test-api-key-1234567890',
  ARGOCD_SERVER_URL: 'https://argocd.example.com/',
  ARGOCD_TOKEN: 'test-token',
};

describe('loadConfig', () => {
  it('validates required configuration and strips trailing slash from Argo CD URL', () => {
    const config = loadConfig(baseEnv);

    expect(config.MCP_API_KEY).toBe('test-api-key-1234567890');
    expect(config.ARGOCD_SERVER_URL).toBe('https://argocd.example.com');
    expect(config.ARGOCD_TOKEN).toBe('test-token');
  });

  it('applies safe defaults', () => {
    const config = loadConfig(baseEnv);

    expect(config.PORT).toBe(3000);
    expect(config.LOG_LEVEL).toBe('info');
    expect(config.NODE_ENV).toBe('production');
    expect(config.ARGOCD_INSECURE_TLS).toBe(false);
    expect(config.ARGOCD_NAMESPACE).toBe('argocd');
    expect(config.RATE_LIMIT_WINDOW_MS).toBe(60_000);
    expect(config.RATE_LIMIT_MAX).toBe(60);
    expect(config.ENABLE_SYNC_TOOL).toBe(false);
  });

  it('parses numeric and boolean overrides', () => {
    const config = loadConfig({
      ...baseEnv,
      PORT: '4000',
      LOG_LEVEL: 'debug',
      NODE_ENV: 'test',
      ARGOCD_INSECURE_TLS: 'true',
      ARGOCD_NAMESPACE: 'custom-argocd',
      RATE_LIMIT_WINDOW_MS: '120000',
      RATE_LIMIT_MAX: '5',
      ENABLE_SYNC_TOOL: 'true',
    });

    expect(config.PORT).toBe(4000);
    expect(config.LOG_LEVEL).toBe('debug');
    expect(config.NODE_ENV).toBe('test');
    expect(config.ARGOCD_INSECURE_TLS).toBe(true);
    expect(config.ARGOCD_NAMESPACE).toBe('custom-argocd');
    expect(config.RATE_LIMIT_WINDOW_MS).toBe(120_000);
    expect(config.RATE_LIMIT_MAX).toBe(5);
    expect(config.ENABLE_SYNC_TOOL).toBe(true);
  });

  it('rejects a missing MCP_API_KEY', () => {
    expect(() =>
      loadConfig({
        ARGOCD_SERVER_URL: 'https://argocd.example.com',
        ARGOCD_TOKEN: 'test-token',
      })
    ).toThrow(/Configuration validation failed/);
  });

  it('rejects a short MCP_API_KEY', () => {
    expect(() =>
      loadConfig({
        ...baseEnv,
        MCP_API_KEY: 'short',
      })
    ).toThrow(/MCP_API_KEY/);
  });

  it('rejects an invalid Argo CD server URL', () => {
    expect(() =>
      loadConfig({
        ...baseEnv,
        ARGOCD_SERVER_URL: 'not-a-url',
      })
    ).toThrow(/ARGOCD_SERVER_URL/);
  });

  it('rejects invalid rate limit values', () => {
    expect(() =>
      loadConfig({
        ...baseEnv,
        RATE_LIMIT_MAX: '0',
      })
    ).toThrow(/RATE_LIMIT_MAX/);
  });
});

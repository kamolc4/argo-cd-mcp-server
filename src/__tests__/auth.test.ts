import { Request, Response } from 'express';

process.env.MCP_API_KEY = 'test-api-key-1234567890';
process.env.ARGOCD_SERVER_URL = 'https://argocd.example.com';
process.env.ARGOCD_TOKEN = 'test-token';

// Imported after env vars are set, since config.ts validates env at import time.
import { apiKeyAuth } from '../auth';

function mockRes() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

describe('apiKeyAuth', () => {
  it('rejects requests with no Authorization header', () => {
    const req = { headers: {}, path: '/mcp', method: 'POST', ip: '127.0.0.1' } as Request;
    const res = mockRes();
    const next = jest.fn();

    apiKeyAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects requests with a malformed Authorization header', () => {
    const req = {
      headers: { authorization: 'Basic abc123' },
      path: '/mcp',
      method: 'POST',
      ip: '127.0.0.1',
    } as unknown as Request;
    const res = mockRes();
    const next = jest.fn();

    apiKeyAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects requests with an incorrect API key', () => {
    const req = {
      headers: { authorization: 'Bearer wrong-key' },
      path: '/mcp',
      method: 'POST',
      ip: '127.0.0.1',
    } as unknown as Request;
    const res = mockRes();
    const next = jest.fn();

    apiKeyAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() when the API key is correct', () => {
    const req = {
      headers: { authorization: `Bearer ${process.env.MCP_API_KEY}` },
      path: '/mcp',
      method: 'POST',
      ip: '127.0.0.1',
    } as unknown as Request;
    const res = mockRes();
    const next = jest.fn();

    apiKeyAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects keys of a different length without throwing', () => {
    const req = {
      headers: { authorization: 'Bearer short' },
      path: '/mcp',
      method: 'POST',
      ip: '127.0.0.1',
    } as unknown as Request;
    const res = mockRes();
    const next = jest.fn();

    expect(() => apiKeyAuth(req, res, next)).not.toThrow();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

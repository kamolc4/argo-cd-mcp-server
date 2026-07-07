import { Request, Response, NextFunction } from 'express';
import { config } from './config';
import { logger } from './logger';

/**
 * API key authentication middleware.
 * Expects: Authorization: Bearer <MCP_API_KEY>
 * Returns 401 if the key is missing or invalid.
 * Does NOT log the submitted key value.
 */
export function apiKeyAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn(
      { path: req.path, method: req.method, ip: req.ip },
      'Auth rejected: missing or malformed Authorization header'
    );
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authorization: Bearer <key> header is required',
    });
    return;
  }

  const submittedKey = authHeader.slice('Bearer '.length).trim();

  // Constant-time comparison to prevent timing attacks
  if (!timingSafeEqual(submittedKey, config.MCP_API_KEY)) {
    logger.warn(
      { path: req.path, method: req.method, ip: req.ip },
      'Auth rejected: invalid API key'
    );
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key',
    });
    return;
  }

  next();
}

/**
 * A simple constant-time string comparison.
 * Avoids early-exit leaking key length via timing.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still iterate to avoid length-based timing leak
    let diff = 0;
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    }
    void diff;
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

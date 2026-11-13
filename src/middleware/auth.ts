import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { env } from '../config/env.js';

export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const tokenHeader = req.headers['x-admin-token'];

  if (!tokenHeader || typeof tokenHeader !== 'string') {
    res.status(401).json({ error: 'Admin authentication required. Please provide X-Admin-Token header.' });
    return;
  }

  // Support comma-separated list of admin tokens
  const validTokens = env.ADMIN_TOKEN.split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const providedBuffer = Buffer.from(tokenHeader);

  // Check if provided token matches any valid admin token (timing-safe)
  const isMatch = validTokens.some((token) => {
    const expectedBuffer = Buffer.from(token);
    return (
      expectedBuffer.length === providedBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, providedBuffer)
    );
  });

  if (!isMatch) {
    res.status(403).json({ error: 'Invalid admin token.' });
    return;
  }

  next();
}

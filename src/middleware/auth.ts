import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { env } from '../config/env.js';

export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const tokenHeader = req.headers['x-admin-token'];

  if (!tokenHeader || typeof tokenHeader !== 'string') {
    res.status(401).json({ error: 'Admin authentication required. Please provide X-Admin-Token header.' });
    return;
  }

  const expectedToken = env.ADMIN_TOKEN;

  // Use timingSafeEqual to avoid timing attack vulnerabilities
  const expectedBuffer = Buffer.from(expectedToken);
  const providedBuffer = Buffer.from(tokenHeader);

  if (
    expectedBuffer.length !== providedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    res.status(403).json({ error: 'Invalid admin token.' });
    return;
  }

  next();
}

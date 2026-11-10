import { Router } from 'express';

export function createHealthRouter(): Router {
  const router = Router();

  router.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      mode: 'local SQLite',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}

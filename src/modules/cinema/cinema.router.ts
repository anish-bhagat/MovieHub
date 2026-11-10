import { Router } from 'express';
import { CinemaRepository } from '../../db/repositories/cinema.repository.js';
import { requireAdminAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { createCinemaSchema, updateCinemaSchema } from './cinema.schemas.js';

export function createCinemaRouter(repo: CinemaRepository): Router {
  const router = Router();

  // Public endpoint: GET /api/cinemas (only active cinemas)
  router.get('/api/cinemas', (_req, res, next) => {
    try {
      const cinemas = repo.findAll(true);
      res.json(cinemas);
    } catch (err) {
      next(err);
    }
  });

  // Admin endpoint: GET /api/admin/cinemas (all cinemas)
  router.get('/api/admin/cinemas', requireAdminAuth, (_req, res, next) => {
    try {
      const cinemas = repo.findAll(false);
      res.json(cinemas);
    } catch (err) {
      next(err);
    }
  });

  // Admin endpoint: POST /api/admin/cinemas
  router.post(
    '/api/admin/cinemas',
    requireAdminAuth,
    validateBody(createCinemaSchema),
    (req, res, next) => {
      try {
        const created = repo.create(req.body);
        res.status(201).json(created);
      } catch (err) {
        next(err);
      }
    }
  );

  // Admin endpoint: PUT /api/admin/cinemas/:id
  router.put(
    '/api/admin/cinemas/:id',
    requireAdminAuth,
    validateBody(updateCinemaSchema),
    (req, res, next) => {
      try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
          res.status(400).json({ error: 'Invalid cinema ID' });
          return;
        }

        const updated = repo.update(id, req.body);
        if (!updated) {
          res.status(404).json({ error: 'Cinema not found' });
          return;
        }

        res.json(updated);
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}

import { Router } from 'express';
import { MovieRepository } from '../../db/repositories/movie.repository.js';
import { requireAdminAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { createMovieSchema, updateMovieSchema } from './movie.schemas.js';

export function createMovieRouter(repo: MovieRepository): Router {
  const router = Router();

  // Public endpoint: GET /api/movies (active movies only)
  router.get('/api/movies', (_req, res, next) => {
    try {
      const movies = repo.findAll(true);
      res.json(movies);
    } catch (err) {
      next(err);
    }
  });

  // Admin endpoint: GET /api/admin/movies (all movies)
  router.get('/api/admin/movies', requireAdminAuth, (_req, res, next) => {
    try {
      const movies = repo.findAll(false);
      res.json(movies);
    } catch (err) {
      next(err);
    }
  });

  // Admin endpoint: POST /api/admin/movies
  router.post(
    '/api/admin/movies',
    requireAdminAuth,
    validateBody(createMovieSchema),
    (req, res, next) => {
      try {
        const created = repo.create(req.body);
        res.status(201).json(created);
      } catch (err) {
        next(err);
      }
    }
  );

  // Admin endpoint: PUT /api/admin/movies/:id
  router.put(
    '/api/admin/movies/:id',
    requireAdminAuth,
    validateBody(updateMovieSchema),
    (req, res, next) => {
      try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
          res.status(400).json({ error: 'Invalid movie ID' });
          return;
        }

        const updated = repo.update(id, req.body);
        if (!updated) {
          res.status(404).json({ error: 'Movie not found' });
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

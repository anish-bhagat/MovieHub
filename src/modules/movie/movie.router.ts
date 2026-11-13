import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { MovieRepository } from '../../db/repositories/movie.repository.js';
import { requireAdminAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { createMovieSchema, updateMovieSchema } from './movie.schemas.js';

export function createMovieRouter(repo: MovieRepository): Router {
  const router = Router();

  // Admin endpoint: POST /api/admin/upload-poster
  router.post('/api/admin/upload-poster', requireAdminAuth, async (req, res, next) => {
    try {
      const { image } = req.body;
      if (!image || typeof image !== 'string') {
        res.status(400).json({ error: 'Image data URL is required' });
        return;
      }

      const matches = image.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i);
      if (!matches) {
        res.status(400).json({ error: 'Invalid image format. Supported formats: JPG, PNG, WEBP' });
        return;
      }

      const rawExt = matches[1].toLowerCase();
      const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      const uploadsDir = path.resolve(process.cwd(), 'public/uploads/posters');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filename = `poster_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
      const filePath = path.join(uploadsDir, filename);
      await fs.promises.writeFile(filePath, buffer);

      const fileUrl = `/uploads/posters/${filename}`;
      res.json({ url: fileUrl });
    } catch (err) {
      next(err);
    }
  });

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

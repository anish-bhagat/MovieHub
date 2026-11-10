import { Router } from 'express';
import { SnackRepository } from '../../db/repositories/snack.repository.js';
import { requireAdminAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { createSnackSchema, updateSnackSchema } from './snack.schemas.js';

export function createSnackRouter(repo: SnackRepository): Router {
  const router = Router();

  // Public: Get all in-stock snacks for booking checkout
  router.get('/api/snacks', (_req, res, next) => {
    try {
      const snacks = repo.findAll(true);
      res.json(snacks);
    } catch (err) {
      next(err);
    }
  });

  // Admin: Get all snacks (including out of stock)
  router.get('/api/admin/snacks', requireAdminAuth, (_req, res, next) => {
    try {
      const snacks = repo.findAll(false);
      res.json(snacks);
    } catch (err) {
      next(err);
    }
  });

  // Admin: Create new snack item
  router.post('/api/admin/snacks', requireAdminAuth, validateBody(createSnackSchema), (req, res, next) => {
    try {
      const created = repo.create(req.body);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  // Admin: Update snack item
  router.put('/api/admin/snacks/:id', requireAdminAuth, validateBody(updateSnackSchema), (req, res, next) => {
    try {
      const updated = repo.update(req.params.id, req.body);
      if (!updated) {
        res.status(404).json({ error: 'Snack not found' });
        return;
      }
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  // Admin: Toggle in-stock status
  router.patch('/api/admin/snacks/:id/stock', requireAdminAuth, (req, res, next) => {
    try {
      const updated = repo.toggleStock(req.params.id);
      if (!updated) {
        res.status(404).json({ error: 'Snack not found' });
        return;
      }
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  // Admin: Delete snack item
  router.delete('/api/admin/snacks/:id', requireAdminAuth, (req, res, next) => {
    try {
      const success = repo.delete(req.params.id);
      if (!success) {
        res.status(404).json({ error: 'Snack not found' });
        return;
      }
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}

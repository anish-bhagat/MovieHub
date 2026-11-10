import { Router } from 'express';
import { PromoRepository } from '../../db/repositories/promo.repository.js';
import { requireAdminAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { createPromoSchema, updatePromoSchema, validatePromoSchema } from './promo.schemas.js';

export function createPromoRouter(repo: PromoRepository): Router {
  const router = Router();

  // Public: Validate promo code against current cart subtotal
  router.post('/api/promos/validate', validateBody(validatePromoSchema), (req, res, next) => {
    try {
      const { code, subtotal } = req.body;
      const result = repo.validateCode(code, subtotal);
      if (!result.valid) {
        res.status(400).json(result);
        return;
      }
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // Admin: Get all promo codes
  router.get('/api/admin/promos', requireAdminAuth, (_req, res, next) => {
    try {
      const promos = repo.findAll();
      res.json(promos);
    } catch (err) {
      next(err);
    }
  });

  // Admin: Create new promo code
  router.post('/api/admin/promos', requireAdminAuth, validateBody(createPromoSchema), (req, res, next) => {
    try {
      const existing = repo.findByCode(req.body.code);
      if (existing) {
        res.status(409).json({ error: `Promo code ${req.body.code.toUpperCase()} already exists.` });
        return;
      }
      const created = repo.create(req.body);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  // Admin: Update promo code
  router.put('/api/admin/promos/:id', requireAdminAuth, validateBody(updatePromoSchema), (req, res, next) => {
    try {
      const updated = repo.update(req.params.id, req.body);
      if (!updated) {
        res.status(404).json({ error: 'Promo code not found' });
        return;
      }
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  // Admin: Delete promo code
  router.delete('/api/admin/promos/:id', requireAdminAuth, (req, res, next) => {
    try {
      const success = repo.delete(req.params.id);
      if (!success) {
        res.status(404).json({ error: 'Promo code not found' });
        return;
      }
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}

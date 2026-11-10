"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMovieRouter = createMovieRouter;
const express_1 = require("express");
const auth_js_1 = require("../../middleware/auth.js");
const validate_js_1 = require("../../middleware/validate.js");
const movie_schemas_js_1 = require("./movie.schemas.js");
function createMovieRouter(repo) {
    const router = (0, express_1.Router)();
    // Public endpoint: GET /api/movies (active movies only)
    router.get('/api/movies', (_req, res, next) => {
        try {
            const movies = repo.findAll(true);
            res.json(movies);
        }
        catch (err) {
            next(err);
        }
    });
    // Admin endpoint: GET /api/admin/movies (all movies)
    router.get('/api/admin/movies', auth_js_1.requireAdminAuth, (_req, res, next) => {
        try {
            const movies = repo.findAll(false);
            res.json(movies);
        }
        catch (err) {
            next(err);
        }
    });
    // Admin endpoint: POST /api/admin/movies
    router.post('/api/admin/movies', auth_js_1.requireAdminAuth, (0, validate_js_1.validateBody)(movie_schemas_js_1.createMovieSchema), (req, res, next) => {
        try {
            const created = repo.create(req.body);
            res.status(201).json(created);
        }
        catch (err) {
            next(err);
        }
    });
    // Admin endpoint: PUT /api/admin/movies/:id
    router.put('/api/admin/movies/:id', auth_js_1.requireAdminAuth, (0, validate_js_1.validateBody)(movie_schemas_js_1.updateMovieSchema), (req, res, next) => {
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
        }
        catch (err) {
            next(err);
        }
    });
    return router;
}
//# sourceMappingURL=movie.router.js.map
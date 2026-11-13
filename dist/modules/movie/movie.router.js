"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMovieRouter = createMovieRouter;
const express_1 = require("express");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const node_crypto_1 = __importDefault(require("node:crypto"));
const auth_js_1 = require("../../middleware/auth.js");
const validate_js_1 = require("../../middleware/validate.js");
const movie_schemas_js_1 = require("./movie.schemas.js");
function createMovieRouter(repo) {
    const router = (0, express_1.Router)();
    // Admin endpoint: POST /api/admin/upload-poster
    router.post('/api/admin/upload-poster', auth_js_1.requireAdminAuth, async (req, res, next) => {
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
            const uploadsDir = node_path_1.default.resolve(process.cwd(), 'public/uploads/posters');
            if (!node_fs_1.default.existsSync(uploadsDir)) {
                node_fs_1.default.mkdirSync(uploadsDir, { recursive: true });
            }
            const filename = `poster_${Date.now()}_${node_crypto_1.default.randomBytes(4).toString('hex')}.${ext}`;
            const filePath = node_path_1.default.join(uploadsDir, filename);
            await node_fs_1.default.promises.writeFile(filePath, buffer);
            const fileUrl = `/uploads/posters/${filename}`;
            res.json({ url: fileUrl });
        }
        catch (err) {
            next(err);
        }
    });
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
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = validateBody;
exports.validateQuery = validateQuery;
function validateBody(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const errorMsg = formatZodError(result.error);
            res.status(400).json({ error: errorMsg, details: result.error.errors });
            return;
        }
        req.body = result.data;
        next();
    };
}
function validateQuery(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            const errorMsg = formatZodError(result.error);
            res.status(400).json({ error: errorMsg, details: result.error.errors });
            return;
        }
        req.query = result.data;
        next();
    };
}
function formatZodError(error) {
    return error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
}
//# sourceMappingURL=validate.js.map
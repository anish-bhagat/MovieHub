"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnackRepository = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
class SnackRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    mapRow(row) {
        return {
            id: row.id,
            name: row.name,
            icon: row.icon,
            price: row.price,
            inStock: Boolean(row.in_stock),
            category: row.category,
            description: row.description,
            createdAt: row.created_at,
        };
    }
    findAll(onlyInStock = false) {
        let sql = `SELECT * FROM snacks`;
        if (onlyInStock) {
            sql += ` WHERE in_stock = 1`;
        }
        sql += ` ORDER BY category ASC, price ASC`;
        const rows = this.db.prepare(sql).all();
        return rows.map((r) => this.mapRow(r));
    }
    findById(id) {
        const row = this.db.prepare(`SELECT * FROM snacks WHERE id = ?`).get(id);
        return row ? this.mapRow(row) : null;
    }
    create(data) {
        const id = (data.name.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_' + node_crypto_1.default.randomBytes(2).toString('hex')).replace(/^_+|_+$/g, '');
        const inStock = data.inStock ?? true;
        const icon = data.icon || '🍿';
        const category = data.category || 'Snacks';
        const description = data.description || '';
        this.db.prepare(`
      INSERT INTO snacks (id, name, icon, price, in_stock, category, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.name, icon, data.price, inStock ? 1 : 0, category, description);
        const created = this.findById(id);
        if (!created)
            throw new Error('Failed to create snack');
        return created;
    }
    update(id, data) {
        const existing = this.findById(id);
        if (!existing)
            return null;
        const name = data.name !== undefined ? data.name : existing.name;
        const icon = data.icon !== undefined ? data.icon : existing.icon;
        const price = data.price !== undefined ? data.price : existing.price;
        const inStock = data.inStock !== undefined ? (data.inStock ? 1 : 0) : (existing.inStock ? 1 : 0);
        const category = data.category !== undefined ? data.category : existing.category;
        const description = data.description !== undefined ? data.description : existing.description;
        this.db.prepare(`
      UPDATE snacks
      SET name = ?, icon = ?, price = ?, in_stock = ?, category = ?, description = ?
      WHERE id = ?
    `).run(name, icon, price, inStock, category, description, id);
        return this.findById(id);
    }
    toggleStock(id) {
        const existing = this.findById(id);
        if (!existing)
            return null;
        const newStock = existing.inStock ? 0 : 1;
        this.db.prepare(`UPDATE snacks SET in_stock = ? WHERE id = ?`).run(newStock, id);
        return this.findById(id);
    }
    delete(id) {
        const res = this.db.prepare(`DELETE FROM snacks WHERE id = ?`).run(id);
        return Number(res.changes) > 0;
    }
}
exports.SnackRepository = SnackRepository;
//# sourceMappingURL=snack.repository.js.map
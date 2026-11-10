"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromoRepository = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
class PromoRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    mapRow(row) {
        return {
            id: row.id,
            code: row.code,
            discountType: row.discount_type,
            discountValue: row.discount_value,
            maxUses: row.max_uses,
            usedCount: row.used_count,
            active: Boolean(row.active),
            createdAt: row.created_at,
        };
    }
    findAll() {
        const rows = this.db.prepare(`
      SELECT * FROM promos ORDER BY created_at DESC
    `).all();
        return rows.map((r) => this.mapRow(r));
    }
    findById(id) {
        const row = this.db.prepare(`SELECT * FROM promos WHERE id = ?`).get(id);
        return row ? this.mapRow(row) : null;
    }
    findByCode(code) {
        const row = this.db.prepare(`SELECT * FROM promos WHERE UPPER(code) = UPPER(?)`).get(code.trim());
        return row ? this.mapRow(row) : null;
    }
    create(data) {
        const id = node_crypto_1.default.randomUUID();
        const code = data.code.trim().toUpperCase();
        const discountType = data.discountType;
        const discountValue = data.discountValue;
        const maxUses = data.maxUses ?? 100;
        const active = data.active !== undefined ? (data.active ? 1 : 0) : 1;
        this.db.prepare(`
      INSERT INTO promos (id, code, discount_type, discount_value, max_uses, used_count, active)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `).run(id, code, discountType, discountValue, maxUses, active);
        const created = this.findById(id);
        if (!created)
            throw new Error('Failed to create promo');
        return created;
    }
    update(id, data) {
        const existing = this.findById(id);
        if (!existing)
            return null;
        const code = data.code !== undefined ? data.code.trim().toUpperCase() : existing.code;
        const discountType = data.discountType !== undefined ? data.discountType : existing.discountType;
        const discountValue = data.discountValue !== undefined ? data.discountValue : existing.discountValue;
        const maxUses = data.maxUses !== undefined ? data.maxUses : existing.maxUses;
        const active = data.active !== undefined ? (data.active ? 1 : 0) : (existing.active ? 1 : 0);
        this.db.prepare(`
      UPDATE promos
      SET code = ?, discount_type = ?, discount_value = ?, max_uses = ?, active = ?
      WHERE id = ?
    `).run(code, discountType, discountValue, maxUses, active, id);
        return this.findById(id);
    }
    delete(id) {
        const res = this.db.prepare(`DELETE FROM promos WHERE id = ?`).run(id);
        return Number(res.changes) > 0;
    }
    validateCode(rawCode, subtotal) {
        const code = rawCode.trim().toUpperCase();
        const promo = this.findByCode(code);
        if (!promo) {
            return { valid: false, message: 'Invalid coupon code.' };
        }
        if (!promo.active) {
            return { valid: false, message: 'This promo code is currently inactive.' };
        }
        if (promo.usedCount >= promo.maxUses) {
            return { valid: false, message: 'This promo code has reached its maximum usage limit.' };
        }
        let discountAmount = 0;
        if (promo.discountType === 'percentage') {
            discountAmount = Math.round((subtotal * promo.discountValue) / 100);
        }
        else {
            discountAmount = Math.min(subtotal, promo.discountValue);
        }
        return {
            valid: true,
            code: promo.code,
            discountType: promo.discountType,
            discountValue: promo.discountValue,
            discountAmount,
            message: `${promo.code} applied! Saved ₹${discountAmount}.`,
        };
    }
    incrementUsage(code) {
        const res = this.db.prepare(`
      UPDATE promos
      SET used_count = used_count + 1
      WHERE UPPER(code) = UPPER(?) AND used_count < max_uses
    `).run(code.trim());
        return Number(res.changes) > 0;
    }
}
exports.PromoRepository = PromoRepository;
//# sourceMappingURL=promo.repository.js.map
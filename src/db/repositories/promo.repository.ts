import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import { Promo, CreatePromoDTO, UpdatePromoDTO, ValidatePromoResponse } from '../../types/index.js';

interface PromoRow {
  id: string;
  code: string;
  discount_type: 'percentage' | 'flat';
  discount_value: number;
  max_uses: number;
  used_count: number;
  active: number;
  created_at: string;
}

export class PromoRepository {
  constructor(private db: DatabaseSync) {}

  private mapRow(row: PromoRow): Promo {
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

  findAll(): Promo[] {
    const rows = this.db.prepare(`
      SELECT * FROM promos ORDER BY created_at DESC
    `).all() as unknown as PromoRow[];
    return rows.map((r) => this.mapRow(r));
  }

  findById(id: string): Promo | null {
    const row = this.db.prepare(`SELECT * FROM promos WHERE id = ?`).get(id) as unknown as PromoRow | undefined;
    return row ? this.mapRow(row) : null;
  }

  findByCode(code: string): Promo | null {
    const row = this.db.prepare(`SELECT * FROM promos WHERE UPPER(code) = UPPER(?)`).get(code.trim()) as unknown as PromoRow | undefined;
    return row ? this.mapRow(row) : null;
  }

  create(data: CreatePromoDTO): Promo {
    const id = crypto.randomUUID();
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
    if (!created) throw new Error('Failed to create promo');
    return created;
  }

  update(id: string, data: UpdatePromoDTO): Promo | null {
    const existing = this.findById(id);
    if (!existing) return null;

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

  delete(id: string): boolean {
    const res = this.db.prepare(`DELETE FROM promos WHERE id = ?`).run(id);
    return Number(res.changes) > 0;
  }

  validateCode(rawCode: string, subtotal: number): ValidatePromoResponse {
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
    } else {
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

  incrementUsage(code: string): boolean {
    const res = this.db.prepare(`
      UPDATE promos
      SET used_count = used_count + 1
      WHERE UPPER(code) = UPPER(?) AND used_count < max_uses
    `).run(code.trim());
    return Number(res.changes) > 0;
  }
}

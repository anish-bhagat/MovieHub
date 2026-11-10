import { DatabaseSync } from 'node:sqlite';
import { Promo, CreatePromoDTO, UpdatePromoDTO, ValidatePromoResponse } from '../../types/index.js';
export declare class PromoRepository {
    private db;
    constructor(db: DatabaseSync);
    private mapRow;
    findAll(): Promo[];
    findById(id: string): Promo | null;
    findByCode(code: string): Promo | null;
    create(data: CreatePromoDTO): Promo;
    update(id: string, data: UpdatePromoDTO): Promo | null;
    delete(id: string): boolean;
    validateCode(rawCode: string, subtotal: number): ValidatePromoResponse;
    incrementUsage(code: string): boolean;
}

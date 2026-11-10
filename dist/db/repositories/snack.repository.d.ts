import { DatabaseSync } from 'node:sqlite';
import { Snack, CreateSnackDTO, UpdateSnackDTO } from '../../types/index.js';
export declare class SnackRepository {
    private db;
    constructor(db: DatabaseSync);
    private mapRow;
    findAll(onlyInStock?: boolean): Snack[];
    findById(id: string): Snack | null;
    create(data: CreateSnackDTO): Snack;
    update(id: string, data: UpdateSnackDTO): Snack | null;
    toggleStock(id: string): Snack | null;
    delete(id: string): boolean;
}

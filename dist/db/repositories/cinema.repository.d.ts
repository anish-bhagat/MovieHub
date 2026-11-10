import { DatabaseSync } from 'node:sqlite';
import { Cinema, CreateCinemaDTO, UpdateCinemaDTO } from '../../types/index.js';
export declare class CinemaRepository {
    private db;
    constructor(db: DatabaseSync);
    private mapRow;
    findAll(onlyActive?: boolean): Cinema[];
    findById(id: number): Cinema | null;
    create(data: CreateCinemaDTO): Cinema;
    update(id: number, data: UpdateCinemaDTO): Cinema | null;
    countActive(): number;
}

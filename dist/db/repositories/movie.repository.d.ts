import { DatabaseSync } from 'node:sqlite';
import { Movie, CreateMovieDTO, UpdateMovieDTO } from '../../types/index.js';
export declare class MovieRepository {
    private db;
    constructor(db: DatabaseSync);
    private mapRow;
    findAll(onlyActive?: boolean): Movie[];
    findById(id: number): Movie | null;
    create(data: CreateMovieDTO): Movie;
    update(id: number, data: UpdateMovieDTO): Movie | null;
    countActive(): number;
}

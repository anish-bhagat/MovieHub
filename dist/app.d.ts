import { Express } from 'express';
import { DatabaseSync } from 'node:sqlite';
export declare function createApp(db: DatabaseSync): Express;

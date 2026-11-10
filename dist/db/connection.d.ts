import { DatabaseSync } from 'node:sqlite';
export declare function getDb(customPath?: string): DatabaseSync;
export declare function closeDb(): void;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
exports.closeDb = closeDb;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const node_sqlite_1 = require("node:sqlite");
const env_js_1 = require("../config/env.js");
let dbInstance = null;
function getDb(customPath) {
    if (dbInstance && !customPath) {
        return dbInstance;
    }
    const dbPath = customPath || env_js_1.env.DATABASE_PATH;
    if (dbPath !== ':memory:') {
        const dir = node_path_1.default.dirname(dbPath);
        if (!node_fs_1.default.existsSync(dir)) {
            node_fs_1.default.mkdirSync(dir, { recursive: true });
        }
    }
    const db = new node_sqlite_1.DatabaseSync(dbPath);
    // Enable foreign keys and WAL mode for better concurrency and durability
    db.exec('PRAGMA foreign_keys = ON;');
    if (dbPath !== ':memory:') {
        db.exec('PRAGMA journal_mode = WAL;');
    }
    // Auto-initialize schema
    const schemaPath = node_path_1.default.resolve(process.cwd(), 'src/db/schema.sql');
    if (node_fs_1.default.existsSync(schemaPath)) {
        const schemaSql = node_fs_1.default.readFileSync(schemaPath, 'utf-8');
        db.exec(schemaSql);
    }
    // Safe migration for snacks column
    try {
        db.exec("ALTER TABLE bookings ADD COLUMN snacks TEXT NOT NULL DEFAULT '[]';");
    }
    catch {
        // Column already exists
    }
    // Safe migration for blocked_seats column
    try {
        db.exec("ALTER TABLE showtimes ADD COLUMN blocked_seats TEXT NOT NULL DEFAULT '[]';");
    }
    catch {
        // Column already exists
    }
    if (!customPath) {
        dbInstance = db;
    }
    return db;
}
function closeDb() {
    if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
    }
}
//# sourceMappingURL=connection.js.map
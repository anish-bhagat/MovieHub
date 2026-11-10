"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const node_path_1 = __importDefault(require("node:path"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().default(3000),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    ADMIN_TOKEN: zod_1.z.string().min(1, 'ADMIN_TOKEN is required'),
    DATABASE_PATH: zod_1.z.string().default('./data/moviehub.db'),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.format());
    throw new Error('Environment configuration error');
}
exports.env = {
    ...parsed.data,
    DATABASE_PATH: node_path_1.default.resolve(process.cwd(), parsed.data.DATABASE_PATH),
};
//# sourceMappingURL=env.js.map
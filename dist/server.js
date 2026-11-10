"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_js_1 = require("./config/env.js");
const connection_js_1 = require("./db/connection.js");
const app_js_1 = require("./app.js");
const cinema_repository_js_1 = require("./db/repositories/cinema.repository.js");
const seed_js_1 = require("./db/seed.js");
async function bootstrap() {
    try {
        const db = (0, connection_js_1.getDb)();
        // Auto-seed if database is freshly created with 0 records
        const cinemaRepo = new cinema_repository_js_1.CinemaRepository(db);
        if (cinemaRepo.findAll(false).length === 0) {
            console.log('Database empty, performing initial seed...');
            (0, seed_js_1.seedDatabase)(db);
        }
        const app = (0, app_js_1.createApp)(db);
        const server = app.listen(env_js_1.env.PORT, () => {
            console.log(`=========================================`);
            console.log(`🎬 MovieHub Server running on port ${env_js_1.env.PORT}`);
            console.log(`📡 Health Check:  http://localhost:${env_js_1.env.PORT}/api/health`);
            console.log(`👑 Admin Portal: http://localhost:${env_js_1.env.PORT}/admin`);
            console.log(`🎟️ Customer App:  http://localhost:${env_js_1.env.PORT}`);
            console.log(`🔑 Admin Token:  ${env_js_1.env.ADMIN_TOKEN}`);
            console.log(`=========================================`);
        });
        const gracefulShutdown = () => {
            console.log('\nGracefully shutting down MovieHub...');
            server.close(() => {
                console.log('Server closed.');
                process.exit(0);
            });
        };
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=server.js.map
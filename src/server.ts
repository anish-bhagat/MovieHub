import { env } from './config/env.js';
import { getDb } from './db/connection.js';
import { createApp } from './app.js';
import { CinemaRepository } from './db/repositories/cinema.repository.js';
import { seedDatabase } from './db/seed.js';

async function bootstrap() {
  try {
    const db = getDb();

    // Auto-seed if database is freshly created with 0 records
    const cinemaRepo = new CinemaRepository(db);
    if (cinemaRepo.findAll(false).length === 0) {
      console.log('Database empty, performing initial seed...');
      seedDatabase(db);
    }

    const app = createApp(db);

    const server = app.listen(env.PORT, () => {
      console.log(`=========================================`);
      console.log(`🎬 MovieHub Server running on port ${env.PORT}`);
      console.log(`📡 Health Check:  http://localhost:${env.PORT}/api/health`);
      console.log(`👑 Admin Portal: http://localhost:${env.PORT}/admin`);
      console.log(`🎟️ Customer App:  http://localhost:${env.PORT}`);
      console.log(`🔑 Admin Token:  ${env.ADMIN_TOKEN}`);
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
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();

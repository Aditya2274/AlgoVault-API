import 'dotenv/config';
import app from './app.js';
import { pool, prisma } from './config/prisma.js';

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 AlgoVault API server running at http://localhost:${PORT}`);
});

const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Closing HTTP server...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      await prisma.$disconnect();
      await pool.end();
      console.log('Database connections closed cleanly.');
      process.exit(0);
    } catch (err) {
      console.error('Error during database teardown:', err);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

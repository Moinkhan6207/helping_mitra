import http from 'http';
import app from './app';
import { env } from './config/env';
import { disconnectDatabase } from './config/database';
import { walletService } from './modules/wallet/wallet.service';

const server = http.createServer(app);

const startServer = (): void => {
  server.listen(env.PORT, () => {
    console.log(`🚀 Server is listening at http://localhost:${env.PORT}`);
    console.log(`⚙️  Running environment: ${env.NODE_ENV}`);
  });
};

/**
 * Handle uncaught exceptions and unhandled rejections cleanly.
 */
const handleFatalError = (type: string, error: Error): void => {
  console.error(`💥 Fatal Error [${type}]:`, error);
  gracefulShutdown('FATAL_ERROR');
};

process.on('uncaughtException', (error) => handleFatalError('Uncaught Exception', error));
process.on('unhandledRejection', (reason) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  handleFatalError('Unhandled Rejection', error);
});

let isShuttingDown = false;

/**
 * Graceful shutdown logic to close HTTP server handles and detach DB clients.
 */
const gracefulShutdown = (signal: string): void => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n🔌 Signal ${signal} received. Initiating graceful shutdown...`);

  // Terminate connection acceptance, drain outstanding requests
  server.close(async () => {
    console.log('🛑 HTTP server closed.');
    
    // Disconnect Prisma Client gracefully
    await disconnectDatabase();
    
    console.log('👋 Clean exit accomplished.');
    process.exit(signal === 'FATAL_ERROR' ? 1 : 0);
  });

  // Timeout fallback forcing termination after 10 seconds
  setTimeout(() => {
    console.error('⚠️ Force shutting down as server closure timed out.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();

// Start periodic job to auto-expire stale recharge requests every 5 minutes
const EXPIRY_INTERVAL_MS = 5 * 60 * 1000;
setInterval(async () => {
  try {
    const expiredCount = await walletService.expireStaleRecharges();
    if (expiredCount > 0) {
      console.log(`[Expiry Job] Expired ${expiredCount} stale wallet recharge requests.`);
    }
  } catch (error) {
    console.error('[Expiry Job] Error running stale recharges check:', error);
  }
}, EXPIRY_INTERVAL_MS);

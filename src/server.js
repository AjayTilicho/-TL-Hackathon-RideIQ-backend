import app from './app.js';
import { config } from './config/env.js';
import { connectDatabase } from './config/database.js';

async function main() {
  try {
    await connectDatabase();
    // eslint-disable-next-line no-console
    console.log('MongoDB connected');
    const server = app.listen(config.port, () => {
      // eslint-disable-next-line no-console
      console.log(`RideIQ API listening on port ${config.port}`);
    });
    const twentyMinMs = 20 * 60 * 1000;
    server.timeout = twentyMinMs;
    server.headersTimeout = twentyMinMs + 60_000;
    if ('requestTimeout' in server) {
      server.requestTimeout = twentyMinMs;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

main();

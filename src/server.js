import app from './app.js';
import { config } from './config/env.js';
import { connectDatabase } from './config/database.js';

async function main() {
  try {
    await connectDatabase();
    // eslint-disable-next-line no-console
    console.log('MongoDB connected');
    app.listen(config.port, () => {
      // eslint-disable-next-line no-console
      console.log(`RideIQ API listening on port ${config.port}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

main();

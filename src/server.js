import app from './app.js';
import { logger } from './lib/logger.js';

const port = process.env.PORT || 3001;
app.listen(port, () => logger.info('server_started', { port: Number(port) }));

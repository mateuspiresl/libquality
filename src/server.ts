import 'module-alias/register';
import 'source-map-support/register';
import 'reflect-metadata';

import '~/config/github';

import logger from '~/config/logger';
import { PORT } from '~/config/settings';
import { app } from '~/loaders/app';

export const server = app.listen(PORT);

export function closeServer(): void {
  if (server.listening) {
    server.close();
    logger.info('--> Server closed');
  }
}

server.on('listening', () =>
  logger.info('--> Server successfully started at port %d', PORT),
);
server.on('error', logger.error);

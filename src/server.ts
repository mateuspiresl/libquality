import 'module-alias/register';
import 'source-map-support/register';
import 'reflect-metadata';

import '~/config/github';
import '~/config/injections';

import logger from '~/config/logger';
import { PORT } from '~/config/settings';
import { AppLoader } from '~/loaders/app-loader';
import { DatabaseLoader } from '~/loaders/database-loader';

export async function closeServer(): Promise<void> {
  await Promise.all([AppLoader.disconnect, DatabaseLoader.disconnect]);
  logger.info('--> Server closed');
}

DatabaseLoader.connect()
  .then(AppLoader.connect)
  .then(() => logger.info('--> Server successfully started at port %d', PORT))
  .catch((error) => {
    logger.error(error);
    return closeServer();
  });

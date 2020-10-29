import 'module-alias/register';
import 'source-map-support/register';
import 'reflect-metadata';

import '~/config/github';
import '~/config/injections';

import { DatabaseLoader } from './loaders/database-loader';
import { WorkersLoader } from './loaders/workers-loader';

import logger from '~/config/logger';

export async function closeWorkers(): Promise<void> {
  await WorkersLoader.disconnect();
  logger.info('--> Workers were teminated');
}

DatabaseLoader.connect()
  .then(WorkersLoader.connect)
  .then(() =>
    logger.info(
      '--> Initialized workers: %s',
      WorkersLoader.workers.map((worker) => worker.queue.name).join(', '),
    ),
  )
  .catch(logger.error);

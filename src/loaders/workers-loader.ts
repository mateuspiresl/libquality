import 'module-alias/register';
import 'source-map-support/register';
import 'reflect-metadata';

import '~/config/github';
import '~/config/injections';

import logger from '~/config/logger';
import { MAX_CONCURRENT_JOBS } from '~/config/settings';
import { FetchRepositoryWorker } from '~/workers/fetch-repository-worker';

interface IWorkersLoader extends Loader {
  workers: BullWorker<unknown>[];
}

function startWorker<T>({ fn, queue }: BullWorker<T>): void {
  queue.process(MAX_CONCURRENT_JOBS, (job) => fn(job.data, job.id));
  queue.on('active', (job) =>
    logger.info('[%s] %s with %o', queue.name, job.id, job.data),
  );
  queue.on('completed', (job) =>
    logger.info('[%s] %s ended', queue.name, job.id),
  );
  queue.on('failed', (job, error) =>
    logger.error('[%s] %s failed with %o', queue.name, job.id, error),
  );
  queue.on('error', (error) => logger.error('[%s] %o', queue.name, error));
}

export const WorkersLoader: IWorkersLoader = {
  workers: [FetchRepositoryWorker],

  async connect(): Promise<void> {
    await Promise.all(WorkersLoader.workers.map(startWorker));
  },

  async disconnect(): Promise<void> {
    await Promise.all(
      WorkersLoader.workers.map((worker) => worker.queue.close()),
    );
  },
};

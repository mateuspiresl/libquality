import Bull from 'bull';
import Container from 'typedi';

import { DEFAULT_JOB_OPTIONS, REDIS_URL } from '~/config/settings';
import { HostService } from '~/services/host-service';
import { RepositoryService } from '~/services/repository-service';

/**
 * Repository worker. It refreshes the repository data and issues statistics.
 * @param jobId Job ID.
 * @param data Job data.
 */
async function fn(identifier: Jobs.FetchRepository): Promise<void> {
  const hostService = Container.get(HostService);
  const [data, issuesStatistics] = await Promise.all([
    hostService.fetchRepository(identifier),
    hostService.calculateIssuesStatistics(identifier),
  ]);

  if (!data || !issuesStatistics) {
    throw new Error('Repository not found at the host');
  }

  const reposityService = Container.get(RepositoryService);
  const updated = await reposityService.updateRepository(identifier, {
    ...data,
    ...issuesStatistics,
    refreshedAt: new Date(),
  });

  if (!updated) {
    throw new Error('Repository not found at the database');
  }
}

const queue = new Bull<Jobs.FetchRepository>('fetch-repository', REDIS_URL, {
  defaultJobOptions: DEFAULT_JOB_OPTIONS,
});

export const FetchRepositoryWorker: BullWorker<Jobs.FetchRepository> = {
  fn,
  queue,
};

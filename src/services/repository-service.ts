import { Inject, Service } from 'typedi';

import { HostService } from './host-service';

import { InjectionKeys } from '~/constants/injection-keys';
import { HOUR_MS } from '~/helpers/datetime-helper';
import {
  Repository,
  RepositoryDocument,
  RepositoryModel,
} from '~/models/repository';
import { FetchRepositoryWorker } from '~/workers/fetch-repository-worker';

export interface RepositoryIdentifier {
  owner: string;
  name: string;
}

/**
 * A repository data is considered outdated after 1 hour after the last refresh.
 */
const MAX_AGE = 1 * HOUR_MS;

/**
 * Checks whether the repository is output by the refreshed at date.
 * @param refreshedAt Date of last refresh.
 * @returns True if the repository is outdated.
 */
function isOutdated(refreshedAt: Date): boolean {
  return Date.now() - refreshedAt.getTime() > MAX_AGE;
}

@Service()
export class RepositoryService {
  @Inject(InjectionKeys.RepositoryModel)
  private readonly repositoryModel: typeof RepositoryModel;

  @Inject()
  private readonly hostService: HostService;

  /**
   * Fetches a repository and updates from the host if outdated.
   * @param identifier Repository identifier.
   * @returns The updated repository document.
   */
  async fetchRepository(
    identifier: RepositoryIdentifier,
  ): Promise<RepositoryDocument | null> {
    const repository = await this.repositoryModel.findOneAndUpdate(identifier, {
      $inc: { viewsCount: 1 },
    });
    const jobId = `${identifier.owner}/${identifier.name}`;

    // If the repository doesn't exist in the database, fetch its initial data and
    // add a job to fetch the rest
    if (!repository) {
      const data = await this.hostService.fetchRepository(identifier);

      if (!data) {
        return null;
      }

      const created = RepositoryModel.create<Repository>({
        ...identifier,
        ...data,
      });
      await FetchRepositoryWorker.queue.add(identifier, { jobId });
      return created;
    }

    if (!isOutdated(repository.refreshedAt)) {
      return repository;
    }

    const job = await FetchRepositoryWorker.queue.getJob(jobId);

    // Add a job to refresh the repository data if there is no job or the last one
    // failed
    if (!job || (await job.isFailed())) {
      await FetchRepositoryWorker.queue.add(identifier, { jobId });
    }

    return repository;
  }

  /**
   * Updates a repository.
   * @param identifier Repository identifier.
   * @param data Data to replace.
   * @returns The updated repository document.
   */
  async updateRepository(
    identifier: RepositoryIdentifier,
    data: Partial<Omit<Repository, 'viewsCount'>>,
  ): Promise<boolean> {
    const result = await this.repositoryModel.updateOne(identifier, {
      $set: data,
    });
    return result.nModified === 1;
  }
}

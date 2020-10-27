import { Inject, Service } from 'typedi';

import { HostService } from './host-service';

import { InjectionKeys } from '~/constants/injection-keys';
import { DAY_MS, HOUR_MS } from '~/helpers/datetime-helper';
import { RepositoryDocument, RepositoryModel } from '~/models/repository';

export interface RepositoryIdentifier {
  owner: string;
  name: string;
}

/**
 * A repository data is considered outdated after 1 hour after the last refresh.
 */
const MAX_AGE = HOUR_MS;

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
    const repository = await this.repositoryModel.findOneAndUpdate(
      identifier,
      {
        $inc: { viewsCount: 1 },
      },
      { new: true },
    );

    if (repository && !isOutdated(repository.refreshedAt)) {
      return repository;
    }

    const [data, issuesStatistics] = await Promise.all([
      this.hostService.fetchRepository(identifier),
      this.hostService.calculateIssuesStatistics(identifier),
    ]);

    // The repository doesn't exist
    if (!data || !issuesStatistics) {
      return null;
    }

    if (!repository) {
      return this.repositoryModel.create({
        ...identifier,
        ...data,
        ...issuesStatistics,
        viewsCount: 1,
        refreshedAt: new Date(),
      });
    }

    return this.repositoryModel.findOneAndUpdate(
      { _id: repository.id },
      {
        $set: { ...data, ...issuesStatistics, refreshedAt: new Date() },
      },
      { new: true },
    );
  }
}

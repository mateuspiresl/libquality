import '~/config/github';

import Container from 'typedi';

import { HostService } from '../host-service';
import { RepositoryService } from '../repository-service';

import { setupTestDatabase } from '~/helpers/integration-tests-helper';
import {
  Repository,
  RepositoryDocument,
  RepositoryModel,
} from '~/models/repository';
import { FetchRepositoryWorker } from '~/workers/fetch-repository-worker';

jest.mock('~/workers/fetch-repository-worker', () => ({
  FetchRepositoryWorker: {
    queue: {
      add: jest.fn(),
      getJob: jest.fn().mockReturnValue(null),
    },
  },
}));

const hostService = {
  fetchRepository: jest.fn(),
  calculateIssuesStatistics: jest.fn(),
};
Container.set(HostService, hostService);

describe('[integration] Repository service', () => {
  const repositoryService = Container.get(RepositoryService);
  const REPOSITORY_IDENTIFIER = { owner: 'octocat', name: 'Hello-World' };
  const REPOSITORY_JOB_OPTIONS = { jobId: 'octocat/Hello-World' };
  const REPOSITORY_DATA = { title: 'title', issuesCount: 1 };
  const ISSUES_STATISTICS = { issuesAvgTime: '1d', issuesTimeStdDev: '0d' };

  function createRepository(refreshedAt: Date): Promise<RepositoryDocument> {
    return RepositoryModel.create<Repository>({
      ...REPOSITORY_IDENTIFIER,
      title: 'initial',
      issuesCount: 0,
      refreshedAt,
    });
  }

  setupTestDatabase();

  beforeAll(async () => {
    hostService.fetchRepository.mockReturnValue(REPOSITORY_DATA);
    hostService.calculateIssuesStatistics.mockReturnValue(ISSUES_STATISTICS);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await RepositoryModel.deleteMany({});
  });

  describe('#fetchRepository', () => {
    it('should fetch a new repository data', async () => {
      const repository = await repositoryService.fetchRepository(
        REPOSITORY_IDENTIFIER,
      );

      expect(repository!.owner).toBe(REPOSITORY_IDENTIFIER.owner);
      expect(repository!.name).toBe(REPOSITORY_IDENTIFIER.name);
      expect(repository!.title).toBe(REPOSITORY_DATA.title);
      expect(repository!.issuesCount).toBe(REPOSITORY_DATA.issuesCount);
      expect(repository!.viewsCount).toBe(1);
      expect(repository!.issuesAvgTime).toBeUndefined();
      expect(repository!.issuesTimeStdDev).toBeUndefined();
      expect(repository!.viewsCount).toBe(1);
      expect(repository!.refreshedAt).toBeInstanceOf(Date);
      expect(FetchRepositoryWorker.queue.add).toHaveBeenCalledWith(
        REPOSITORY_IDENTIFIER,
        REPOSITORY_JOB_OPTIONS,
      );
    });

    it('should fetch an existent up to date repository', async () => {
      const refreshedAt = new Date();
      const { id } = await createRepository(refreshedAt);
      const repository = await repositoryService.fetchRepository(
        REPOSITORY_IDENTIFIER,
      );

      expect(repository!.id).toBe(id);
      expect(FetchRepositoryWorker.queue.getJob).not.toHaveBeenCalled();
      await expect(RepositoryModel.findById(id)).resolves.toHaveProperty(
        'viewsCount',
        2,
      );
    });

    it('should fetch an existent outdated repository', async () => {
      const { id } = await createRepository(new Date('2020-01-01'));
      const repository = await repositoryService.fetchRepository(
        REPOSITORY_IDENTIFIER,
      );

      expect(repository!.id).toBe(id);
      expect(FetchRepositoryWorker.queue.getJob).toHaveBeenCalled();
      expect(FetchRepositoryWorker.queue.add).toHaveBeenCalled();
    });

    it('should fetch an existent outdated repository been refreshed', async () => {
      (FetchRepositoryWorker.queue.getJob as jest.Mock).mockReturnValueOnce({
        isFailed: jest.fn().mockReturnValue(false),
      });

      const { id } = await createRepository(new Date('2020-01-01'));
      const repository = await repositoryService.fetchRepository(
        REPOSITORY_IDENTIFIER,
      );

      expect(repository!.id).toBe(id);
      expect(FetchRepositoryWorker.queue.getJob).toHaveBeenCalled();
      expect(FetchRepositoryWorker.queue.add).not.toHaveBeenCalled();
    });

    it('should return null when the respository is not found', async () => {
      hostService.fetchRepository.mockReturnValue(null);

      await expect(
        repositoryService.fetchRepository({ owner: '', name: '' }),
      ).resolves.toBeNull();
    });
  });

  describe('#updateRepository', () => {
    it('should update an existent repository and return true', async () => {
      const { id } = await createRepository(new Date());

      await expect(
        repositoryService.updateRepository(REPOSITORY_IDENTIFIER, {
          title: 'new title',
        }),
      ).resolves.toBeTruthy();
      await expect(RepositoryModel.findById(id)).resolves.toHaveProperty(
        'title',
        'new title',
      );
    });

    it('should return false when the respository is not found', async () => {
      await expect(
        repositoryService.fetchRepository(REPOSITORY_IDENTIFIER),
      ).resolves.toBeFalsy();
    });
  });
});

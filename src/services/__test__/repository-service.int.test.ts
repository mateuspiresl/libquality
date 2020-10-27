import '~/config/github';

import Container from 'typedi';

import { HostService } from '../host-service';
import { RepositoryService } from '../repository-service';

import { setupTestDatabase } from '~/helpers/integration-tests-helper';
import { RepositoryModel } from '~/models/repository';

const hostService = {
  fetchRepository: jest.fn(),
  calculateIssuesStatistics: jest.fn(),
};
Container.set(HostService, hostService);

describe('[integration] Repository service', () => {
  const repositoryService = Container.get(RepositoryService);
  const REPOSITORY_IDENTIFIER = { owner: 'octocat', name: 'Hello-World' };
  const REPOSITORY_DATA = { title: 'title', issuesCount: 1 };
  const ISSUES_STATISTICS = { issuesAvgTime: '1d', issuesTimeStdDev: '0d' };
  const OriginalDate = Date;

  setupTestDatabase();

  beforeAll(() => {
    hostService.fetchRepository.mockReturnValue(REPOSITORY_DATA);
    hostService.calculateIssuesStatistics.mockReturnValue(ISSUES_STATISTICS);
  });

  afterEach(() => {
    hostService.fetchRepository.mockClear();
    hostService.calculateIssuesStatistics.mockClear();
  });

  afterEach(async () => {
    // Delete the created documents
    await RepositoryModel.deleteMany({});
  });

  it('#fetchRepository should fetch a new repository data', async () => {
    const repository = await repositoryService.fetchRepository(
      REPOSITORY_IDENTIFIER,
    );

    expect(repository!.owner).toBe(REPOSITORY_IDENTIFIER.owner);
    expect(repository!.name).toBe(REPOSITORY_IDENTIFIER.name);
    expect(repository!.title).toBe(REPOSITORY_DATA.title);
    expect(repository!.issuesCount).toBe(REPOSITORY_DATA.issuesCount);
    expect(repository!.viewsCount).toBe(1);
    expect(repository!.issuesAvgTime).toBe(ISSUES_STATISTICS.issuesAvgTime);
    expect(repository!.issuesTimeStdDev).toBe(
      ISSUES_STATISTICS.issuesTimeStdDev,
    );
    expect(repository!.viewsCount).toBe(1);
    expect(repository!.refreshedAt).toBeInstanceOf(Date);
  });

  it('#fetchRepository should fetch an existent repository', async () => {
    const refreshedAt = new Date(Date.now() - 1000);
    const { id } = await RepositoryModel.create({
      ...REPOSITORY_IDENTIFIER,
      title: 'initial',
      issuesCount: 0,
      viewsCount: 1,
      refreshedAt,
    });
    const repository = await repositoryService.fetchRepository(
      REPOSITORY_IDENTIFIER,
    );

    expect(repository!.id).toBe(id);
    expect(repository!.viewsCount).toBe(2);
    expect(repository!.refreshedAt).toStrictEqual(refreshedAt);
    expect(hostService.fetchRepository).not.toHaveBeenCalled();
    expect(hostService.calculateIssuesStatistics).not.toHaveBeenCalled();
  });

  it('#fetchRepository should fetch an existent repository and load from host when outdated', async () => {
    const refreshedAt = new Date();
    const { id } = await RepositoryModel.create({
      ...REPOSITORY_IDENTIFIER,
      title: 'initial',
      issuesCount: 0,
      viewsCount: 1,
      refreshedAt: new OriginalDate('2020-01-01'),
    });
    const repository = await repositoryService.fetchRepository(
      REPOSITORY_IDENTIFIER,
    );

    expect(repository!.id).toBe(id);
    expect(repository!.owner).toBe(REPOSITORY_IDENTIFIER.owner);
    expect(repository!.name).toBe(REPOSITORY_IDENTIFIER.name);
    expect(repository!.title).toBe(REPOSITORY_DATA.title);
    expect(repository!.issuesCount).toBe(REPOSITORY_DATA.issuesCount);
    expect(repository!.viewsCount).toBe(2);
    expect(repository!.issuesAvgTime).toBe(ISSUES_STATISTICS.issuesAvgTime);
    expect(repository!.issuesTimeStdDev).toBe(
      ISSUES_STATISTICS.issuesTimeStdDev,
    );
    expect(repository!.viewsCount).toBe(2);
    expect(repository!.refreshedAt.getTime()).toBeGreaterThan(
      refreshedAt.getTime(),
    );
  });

  it('#fetchRepository should return null when the respository is not found', async () => {
    hostService.calculateIssuesStatistics.mockReturnValue(null);

    await expect(
      repositoryService.fetchRepository(REPOSITORY_IDENTIFIER),
    ).resolves.toBeNull();
  });
});

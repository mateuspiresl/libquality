import '~/config/github';

import { Octokit } from '@octokit/core';
import Container from 'typedi';

import { RepositoryHostService } from '../repository-host-service';

import { InjectionKeys } from '~/constants/injection-keys';
import { timeToDaysString } from '~/helpers/datetime-helper';
import { setupTestDatabase } from '~/helpers/integration-tests-helper';
import { RepositoryModel } from '~/models/repository';

describe('[integration] Repository host service', () => {
  const EXISTENT_REPOSITORY = { owner: 'octocat', name: 'Hello-World' };

  const repositoryHostService = Container.get(RepositoryHostService);

  setupTestDatabase();

  describe('#fetchRepository', () => {
    const ISSUES_STATISTICS = {
      averageTime: 1,
      timeStandardDeviation: 0,
    };

    beforeAll(() => {
      jest.spyOn(repositoryHostService, 'calculateIssuesStatistics');
    });

    afterEach(async () => {
      // Delete the created documents
      await RepositoryModel.deleteMany({});

      (repositoryHostService.calculateIssuesStatistics as jest.Mock).mockClear();
    });

    afterAll(() => {
      (repositoryHostService.calculateIssuesStatistics as jest.Mock).mockRestore();
    });

    it('should fetch a new repository data and load issues', async () => {
      (repositoryHostService.calculateIssuesStatistics as jest.Mock).mockImplementation(
        () => Promise.resolve(ISSUES_STATISTICS),
      );

      const repository = await repositoryHostService.fetchRepository(
        EXISTENT_REPOSITORY,
      );

      expect(repository!.owner).toBe(EXISTENT_REPOSITORY.owner);
      expect(repository!.name).toBe(EXISTENT_REPOSITORY.name);
      expect(repository!.viewsCount).toBe(1);
      expect(
        repositoryHostService.calculateIssuesStatistics,
      ).toHaveBeenCalled();
      expect(repository!.issuesAvgTime).toBe(
        timeToDaysString(ISSUES_STATISTICS.averageTime),
      );
      expect(repository!.issuesTimeStdDev).toBe(
        timeToDaysString(ISSUES_STATISTICS.timeStandardDeviation),
      );
    });

    it('should fetch an existent repository and load issues', async () => {
      (repositoryHostService.calculateIssuesStatistics as jest.Mock).mockImplementation(
        () => Promise.resolve(ISSUES_STATISTICS),
      );

      const { id } = await RepositoryModel.create({
        ...EXISTENT_REPOSITORY,
        title: 'title',
        viewsCount: 1,
      });
      const repository = await repositoryHostService.fetchRepository(
        EXISTENT_REPOSITORY,
      );

      expect(repository!.id).toBe(id);
      expect(repository!.owner).toBe(EXISTENT_REPOSITORY.owner);
      expect(repository!.name).toBe(EXISTENT_REPOSITORY.name);
      expect(repository!.viewsCount).toBe(2);
      expect(
        repositoryHostService.calculateIssuesStatistics,
      ).toHaveBeenCalled();
      expect(repository!.issuesAvgTime).toBe(
        timeToDaysString(ISSUES_STATISTICS.averageTime),
      );
      expect(repository!.issuesTimeStdDev).toBe(
        timeToDaysString(ISSUES_STATISTICS.timeStandardDeviation),
      );
    });

    it('should return null when the respository is not found', async () => {
      await expect(
        repositoryHostService.fetchRepository({ owner: '', name: '' }),
      ).resolves.toBeNull();
      expect(
        repositoryHostService.calculateIssuesStatistics,
      ).not.toHaveBeenCalled();
    });
  });

  it('#fetchIssues should fetch issues', async () => {
    const octokit = Container.get<Octokit>(InjectionKeys.Octokit);
    const response = await octokit.graphql<any>(
      `query ($owner: String!, $name: String!) {
        repository(owner: $owner, name: $name) {
          issues { totalCount }
        }
      }`,
      EXISTENT_REPOSITORY,
    );
    const issues = await repositoryHostService.fetchIssues(EXISTENT_REPOSITORY);

    expect(issues.length).toBe(response.repository.issues.totalCount);
  });
});

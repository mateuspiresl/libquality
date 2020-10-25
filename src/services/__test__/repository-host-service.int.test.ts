import '~/config/github';

import { Octokit } from '@octokit/core';
import Container from 'typedi';

import { RepositoryHostService } from '../repository-host-service';

import { InjectionKeys } from '~/constants/injection-keys';

describe('[integration] Repository host service', () => {
  const EXISTENT_REPOSITORY = { owner: 'octocat', name: 'Hello-World' };

  const repositoryHostService = Container.get(RepositoryHostService);

  describe('#fetchRepository', () => {
    const ISSUES_STATISTICS = {
      averageTime: 1,
      timeStandardDeviation: 0,
    };

    beforeEach(() => {
      jest
        .spyOn(repositoryHostService, 'calculateIssuesStatistics')
        .mockImplementationOnce(() => Promise.resolve(ISSUES_STATISTICS));
    });

    afterEach(() => {
      (repositoryHostService.calculateIssuesStatistics as jest.Mock).mockRestore();
    });

    it('should fetch a new repository data and load issues', async () => {
      const repository = await repositoryHostService.fetchRepository(
        EXISTENT_REPOSITORY,
      );

      expect(repository!.owner).toBe(EXISTENT_REPOSITORY.owner);
      expect(repository!.name).toBe(EXISTENT_REPOSITORY.name);
      expect(
        repositoryHostService.calculateIssuesStatistics,
      ).toHaveBeenCalled();
      expect(repository!.issuesAvgTime).toBe(ISSUES_STATISTICS.averageTime);
      expect(repository!.issuesTimeStdDev).toBe(
        ISSUES_STATISTICS.timeStandardDeviation,
      );
    });

    it('should return null when the respository is not found', async () => {
      await expect(
        repositoryHostService.fetchRepository({ owner: '', name: '' }),
      ).resolves.toBeNull();
      await expect(
        repositoryHostService.calculateIssuesStatistics,
      ).not.toHaveBeenCalled();
    });
  });

  describe('#fetchIssues', () => {
    it('should fetch issues', async () => {
      const octokit = Container.get<Octokit>(InjectionKeys.Octokit);
      const response = await octokit.graphql<any>(
        `query ($owner: String!, $name: String!) {
          repository(owner: $owner, name: $name) {
            issues { totalCount }
          }
        }`,
        EXISTENT_REPOSITORY,
      );
      const issues = await repositoryHostService.fetchIssues(
        EXISTENT_REPOSITORY,
      );

      expect(issues.length).toBe(response.repository.issues.totalCount);
    });
  });
});

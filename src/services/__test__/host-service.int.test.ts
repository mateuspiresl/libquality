import '~/config/github';

import { Octokit } from '@octokit/core';
import Container from 'typedi';

import { HostService } from '../host-service';

import { InjectionKeys } from '~/constants/injection-keys';
import { setupTestDatabase } from '~/helpers/integration-tests-helper';

describe('[integration] Host service', () => {
  const EXISTENT_REPOSITORY = { owner: 'octocat', name: 'Hello-World' };

  const hostService = Container.get(HostService);

  setupTestDatabase();

  describe('#fetchRepository', () => {
    it('should fetch the repository data', async () => {
      const data = await hostService.fetchRepository(EXISTENT_REPOSITORY);

      expect(data).toHaveProperty('title');
      expect(data).toHaveProperty('issuesCount');
    });

    it('should return null when the respository is not found', async () => {
      await expect(
        hostService.fetchRepository({ owner: '', name: '' }),
      ).resolves.toBeNull();
    });
  });

  it('#calculateIssuesStatistics should return null when the respository is not found', async () => {
    await expect(
      hostService.calculateIssuesStatistics({ owner: '', name: '' }),
    ).resolves.toBeNull();
  });

  it('#fetchIssues should fetch issues', async () => {
    const octokit = Container.get<Octokit>(InjectionKeys.Octokit);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await octokit.graphql<any>(
      `query ($owner: String!, $name: String!) {
        repository(owner: $owner, name: $name) {
          issues { totalCount }
        }
      }`,
      EXISTENT_REPOSITORY,
    );
    const issues = await hostService.fetchIssues(EXISTENT_REPOSITORY);

    expect(issues.length).toBe(response.repository.issues.totalCount);
  });
});

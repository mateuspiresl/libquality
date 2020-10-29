import '~/config/github';

import Container from 'typedi';

import { FetchRepositoryWorker } from '../fetch-repository-worker';

import { HostService } from '~/services/host-service';
import { RepositoryService } from '~/services/repository-service';

const repositoryService = { updateRepository: jest.fn() };
Container.set(RepositoryService, repositoryService);
const hostService = {
  fetchRepository: jest.fn(),
  calculateIssuesStatistics: jest.fn(),
};
Container.set(HostService, hostService);

describe('Fetch repository woirker', () => {
  const REPOSITORY_IDENTIFIER = { owner: 'octocat', name: 'Hello-World' };

  it('should update the repository with the data received from the host', async () => {
    const refreshedAt = new Date();
    jest
      .spyOn(global, 'Date')
      .mockImplementation(() => (refreshedAt as unknown) as string);
    repositoryService.updateRepository.mockReturnValue(true);
    hostService.fetchRepository.mockReturnValue({ a: 1 });
    hostService.calculateIssuesStatistics.mockReturnValue({ b: 2 });

    await expect(
      FetchRepositoryWorker.fn(REPOSITORY_IDENTIFIER, 0),
    ).resolves.toBeUndefined();
    expect(
      repositoryService.updateRepository,
    ).toHaveBeenCalledWith(REPOSITORY_IDENTIFIER, { a: 1, b: 2, refreshedAt });
  });

  it('should throw error if the repository is not found at the host', async () => {
    hostService.fetchRepository.mockReturnValue(null);

    await expect(
      FetchRepositoryWorker.fn(REPOSITORY_IDENTIFIER, 0),
    ).rejects.toBeInstanceOf(Error);
  });

  it('should throw error if the repository is not found at the database', async () => {
    repositoryService.updateRepository.mockReturnValue(false);
    hostService.fetchRepository.mockReturnValue({});
    hostService.calculateIssuesStatistics.mockReturnValue({});

    await expect(
      FetchRepositoryWorker.fn(REPOSITORY_IDENTIFIER, 0),
    ).rejects.toBeInstanceOf(Error);
  });
});

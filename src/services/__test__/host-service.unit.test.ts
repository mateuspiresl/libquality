import '~/config/github';

import Container from 'typedi';

import { HostService } from '../host-service';

import { InjectionKeys } from '~/constants/injection-keys';
import { DAY_MS, timeToDaysString } from '~/helpers/datetime-helper';
import { average, standardDeviation } from '~/helpers/math-helper';

const mockedOctokit = { graphql: jest.fn() };
Container.set(InjectionKeys.Octokit, mockedOctokit);
Container.set(InjectionKeys.RepositoryModel, null);

describe('Host service', () => {
  const EXISTENT_REPOSITORY = { owner: 'octocat', name: 'Hello-World' };

  const repositoryHostService = Container.get(HostService);

  it('is injectable', async () => {
    expect(repositoryHostService).toBeInstanceOf(HostService);
  });

  it('#fetchRepository should throw errors when not related to repository not found', async () => {
    const error = new Error();
    mockedOctokit.graphql.mockRejectedValue(error);

    await expect(
      repositoryHostService.fetchRepository({ owner: '', name: '' }),
    ).rejects.toBe(error);
  });

  it('#calculateIssuesStatistics should throw errors when not related to repository not found', async () => {
    const error = new Error();
    mockedOctokit.graphql.mockRejectedValue(error);

    await expect(
      repositoryHostService.calculateIssuesStatistics({ owner: '', name: '' }),
    ).rejects.toBe(error);
  });

  describe('#calculateIssuesStatistics', () => {
    beforeAll(() => {
      jest
        .spyOn(Date, 'now')
        .mockReturnValue(Date.parse('2020-02-15T00:00:00.000Z'));
    });

    afterEach(() => {
      (repositoryHostService.fetchIssues as jest.Mock).mockRestore();
    });

    afterAll(() => {
      (Date.now as jest.Mock).mockRestore();
    });

    it('should return 0 values for empty issues', async () => {
      jest
        .spyOn(repositoryHostService, 'fetchIssues')
        .mockImplementationOnce(() => Promise.resolve([]));

      await expect(
        repositoryHostService.calculateIssuesStatistics(EXISTENT_REPOSITORY),
      ).resolves.toStrictEqual({
        issuesAvgTime: '0d',
        issuesTimeStdDev: '0d',
      });
    });

    it('should return the correct values when there are issues', async () => {
      jest
        .spyOn(repositoryHostService, 'fetchIssues')
        .mockImplementationOnce(() =>
          Promise.resolve([
            {
              createdAt: '2020-01-01T00:00:00.000Z',
              closedAt: '2020-01-15T00:00:00.000Z',
            },
            {
              createdAt: '2020-01-01T00:00:00.000Z',
              closedAt: '2020-02-01T00:00:00.000Z',
            },
            { createdAt: '2020-01-01T00:00:00.000Z', closedAt: null },
            {
              createdAt: '2020-01-15T00:00:00.000Z',
              closedAt: '2020-02-01T00:00:00.000Z',
            },
            { createdAt: '2020-02-01T00:00:00.000Z', closedAt: null },
          ]),
        );

      const values = [
        14 * DAY_MS,
        31 * DAY_MS,
        45 * DAY_MS,
        17 * DAY_MS,
        14 * DAY_MS,
      ];
      const avg = average(values);

      await expect(
        repositoryHostService.calculateIssuesStatistics(EXISTENT_REPOSITORY),
      ).resolves.toStrictEqual({
        issuesAvgTime: timeToDaysString(avg),
        issuesTimeStdDev: timeToDaysString(standardDeviation(values, avg)),
      });
    });
  });

  describe('#fetchIssues', () => {
    it('should return nodes immediatly when there is no next page', async () => {
      const nodes = Object();
      mockedOctokit.graphql.mockImplementation(() =>
        Promise.resolve({
          repository: { issues: { nodes, pageInfo: { hasNextPage: false } } },
        }),
      );

      await expect(
        repositoryHostService.fetchIssues(EXISTENT_REPOSITORY),
      ).resolves.toBe(nodes);
      expect(mockedOctokit.graphql.mock.calls.pop()[1]).toStrictEqual({
        ...EXISTENT_REPOSITORY,
        pageSize: 100,
        cursor: null,
      });
    });

    it('should paginate and join nodes', async () => {
      const node = Object();
      mockedOctokit.graphql.mockImplementation((_, { cursor }) =>
        Promise.resolve({
          repository: {
            issues: {
              nodes: [node],
              pageInfo: {
                hasNextPage: cursor !== 'none',
                endCursor: cursor ? 'none' : 'once',
              },
            },
          },
        }),
      );

      await expect(
        repositoryHostService.fetchIssues(EXISTENT_REPOSITORY),
      ).resolves.toStrictEqual([node, node, node]);
    });
  });
});

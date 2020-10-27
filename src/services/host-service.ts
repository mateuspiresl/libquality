import { Octokit } from '@octokit/core';
import { Inject, Service } from 'typedi';

import { RepositoryIdentifier } from './repository-service';

import { InjectionKeys } from '~/constants/injection-keys';
import { timeToDaysString } from '~/helpers/datetime-helper';
import { average, standardDeviation } from '~/helpers/math-helper';
import { Repository } from '~/models/repository';

export type RepositoryData = Pick<Repository, 'title' | 'issuesCount'>;

export type IssuesStatisticsData = Pick<
  Repository,
  'issuesAvgTime' | 'issuesTimeStdDev'
>;

interface Issue {
  createdAt: string;
  closedAt: string | null;
}

interface FetchRepositoryResponse {
  repository: {
    name: string;
    owner: { login: string };
    issues: { totalCount: number };
  };
}

interface FetchIssuesResponse {
  repository: {
    issues: {
      nodes: Issue[];
      pageInfo: {
        endCursor: string;
        hasNextPage: boolean;
      };
    };
  };
}

const ITEMS_PER_PAGE = 100;

function isNotFoundError(error): boolean {
  return error.errors && error.errors[0].type === 'NOT_FOUND';
}

@Service()
export class HostService {
  @Inject(InjectionKeys.Octokit)
  private readonly octokit: Octokit;

  /**
   * Fetches a repository.
   * @param identifier Repository identifier.
   * @returns Repository document.
   */
  async fetchRepository(
    identifier: RepositoryIdentifier,
  ): Promise<RepositoryData | null> {
    try {
      const response = await this.octokit.graphql<FetchRepositoryResponse>(
        `query ($owner: String!, $name: String!) {
          repository(owner: $owner, name: $name) {
            name, issues { totalCount }
          }
        }`,
        { ...identifier },
      );
      return {
        title: response.repository.name,
        issuesCount: response.repository.issues.totalCount,
      };
    } catch (error) {
      if (isNotFoundError(error)) {
        return null;
      }

      throw error;
    }
  }

  /**
   * Calculates the average time the issues stays open and the standard deviation
   * time.
   * @param identifier Repository identifier.
   * @returns Issues statistics.
   */
  async calculateIssuesStatistics(
    identifier: RepositoryIdentifier,
  ): Promise<IssuesStatisticsData | null> {
    try {
      const issues = await this.fetchIssues(identifier);
      const now = Date.now();
      const timeList = issues.map(
        (issue) =>
          (issue.closedAt ? Date.parse(issue.closedAt) : now) -
          Date.parse(issue.createdAt),
      );
      const averageTime = average(timeList);
      const timeStandardDeviation = standardDeviation(timeList, averageTime);
      return {
        issuesAvgTime: timeToDaysString(averageTime),
        issuesTimeStdDev: timeToDaysString(timeStandardDeviation),
      };
    } catch (error) {
      if (isNotFoundError(error)) {
        return null;
      }

      throw error;
    }
  }

  /**
   * Fetches all of the repository issues. To accomplish this, it needs to make
   * multiple requests because of the pagination and limit of items per page.
   * @param identifier Repository identifier.
   * @param cursor Pagination cursor.
   * @returns Issues list.
   */
  async fetchIssues(
    identifier: RepositoryIdentifier,
    cursor: string | null = null,
  ): Promise<Issue[]> {
    const response = await this.octokit.graphql<FetchIssuesResponse>(
      `query ($owner: String!, $name: String!, $pageSize: Int!, $cursor: String) {
        repository(owner: $owner, name: $name) {
          issues(first: $pageSize, after: $cursor) {
            nodes { createdAt, closedAt }
            pageInfo { endCursor, hasNextPage }
          }
        }
      }`,
      { ...identifier, pageSize: ITEMS_PER_PAGE, cursor },
    );

    if (response.repository.issues.pageInfo.hasNextPage) {
      const nextPageResponse = await this.fetchIssues(
        identifier,
        response.repository.issues.pageInfo.endCursor,
      );
      return [...response.repository.issues.nodes, ...nextPageResponse];
    }

    return response.repository.issues.nodes;
  }
}

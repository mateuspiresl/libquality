import { Octokit } from '@octokit/core';
import { Inject, Service } from 'typedi';

import { InjectionKeys } from '~/constants/injection-keys';
import { average, standardDeviation } from '~/helpers/math-helper';

export interface RepositoryIdentifier {
  owner: string;
  name: string;
}

export interface Repository {
  owner: string;
  name: string;
  title: string;
  issuesCount: number;
  issuesAvgTime: number;
  issuesTimeStdDev: number;
  // The attributes below will be added when the persistence is implemented
  // views: number;
  // refreshedAt: Date;
}

export interface Issue {
  createdAt: string;
  closedAt: string | null;
}

export interface IssuesStatistics {
  averageTime: number;
  timeStandardDeviation: number;
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

@Service()
export class RepositoryHostService {
  @Inject(InjectionKeys.Octokit)
  private readonly octokit: Octokit;

  async fetchRepository(
    identifier: RepositoryIdentifier,
  ): Promise<Repository | null> {
    try {
      const response = await this.octokit.graphql<FetchRepositoryResponse>(
        `query ($owner: String!, $name: String!) {
          repository(owner: $owner, name: $name) {
            name, owner { login }, issues { totalCount }
          }
        }`,
        { ...identifier },
      );
      const issuesStatistics = await this.calculateIssuesStatistics(identifier);
      return {
        owner: response.repository.owner.login,
        name: identifier.name,
        title: response.repository.name,
        issuesCount: response.repository.issues.totalCount,
        issuesAvgTime: issuesStatistics.averageTime,
        issuesTimeStdDev: issuesStatistics.timeStandardDeviation,
      };
    } catch (error) {
      if (error.errors[0].type === 'NOT_FOUND') {
        return null;
      }

      throw error;
    }
  }

  async calculateIssuesStatistics(
    identifier: RepositoryIdentifier,
  ): Promise<IssuesStatistics> {
    const issues = await this.fetchIssues(identifier);
    const now = Date.now();
    const timeList = issues.map(
      (issue) =>
        (issue.closedAt ? Date.parse(issue.closedAt) : now) -
        Date.parse(issue.createdAt),
    );
    const averageTime = average(timeList);
    return {
      averageTime,
      timeStandardDeviation: standardDeviation(timeList, averageTime),
    };
  }

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

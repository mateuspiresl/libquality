import { Octokit } from '@octokit/core';
import { Inject, Service } from 'typedi';

import { InjectionKeys } from '~/constants/injection-keys';
import { timeToDaysString } from '~/helpers/datetime-helper';
import { average, standardDeviation } from '~/helpers/math-helper';
import { RepositoryDocument, RepositoryModel } from '~/models/repository';

export interface RepositoryIdentifier {
  owner: string;
  name: string;
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

  @Inject(InjectionKeys.RepositoryModel)
  private readonly repositoryModel: typeof RepositoryModel;

  /**
   * Fetches a repository.
   * @param identifier Repository identifier.
   * @returns The updated repository document.
   */
  async fetchRepository(
    identifier: RepositoryIdentifier,
  ): Promise<RepositoryDocument | null> {
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
      return this.repositoryModel.findOneAndUpdate(
        identifier,
        {
          $set: {
            owner: response.repository.owner.login,
            name: identifier.name,
            title: response.repository.name,
            issuesCount: response.repository.issues.totalCount,
            issuesAvgTime: timeToDaysString(issuesStatistics.averageTime),
            issuesTimeStdDev: timeToDaysString(
              issuesStatistics.timeStandardDeviation,
            ),
          },
          $inc: { viewsCount: 1 },
        },
        { new: true, upsert: true },
      );
    } catch (error) {
      if (error.errors && error.errors[0].type === 'NOT_FOUND') {
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

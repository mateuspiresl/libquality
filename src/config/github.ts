import { Octokit } from '@octokit/core';
import Container from 'typedi';

import { GITHUB_ACCESS_TOKEN } from './settings';

import { InjectionKeys } from '~/constants/injection-keys';

Container.set({
  id: InjectionKeys.Octokit,
  factory: () => new Octokit({ auth: GITHUB_ACCESS_TOKEN }),
});

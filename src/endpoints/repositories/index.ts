import { Router } from 'express';

import { findRepositoryByIdentifier } from './find-repository-by-identifier';

export const RepositoriesController = Router().get(
  '/repositories/:owner/:name',
  findRepositoryByIdentifier,
);

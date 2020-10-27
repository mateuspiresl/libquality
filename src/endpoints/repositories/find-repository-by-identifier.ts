import { notFound } from '@hapi/boom';
import Container from 'typedi';

import {
  RepositoryIdentifier,
  RepositoryService,
} from '~/services/repository-service';

type Params = RepositoryIdentifier;

export async function findRepositoryByIdentifier(
  req: ERequest<Params>,
  res: EResponse,
): Promise<void> {
  const repositoryService = Container.get(RepositoryService);
  const repository = await repositoryService.fetchRepository(req.params);

  if (!repository) {
    throw notFound('Repository not found', req.params);
  }

  res.status(200).send(repository);
}

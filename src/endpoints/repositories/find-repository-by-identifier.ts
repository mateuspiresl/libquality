import Container from 'typedi';

import {
  RepositoryHostService,
  RepositoryIdentifier,
} from '~/services/repository-host-service';

type Params = RepositoryIdentifier;

export async function findRepositoryByIdentifier(
  req: ERequest<Params>,
  res: EResponse,
): Promise<void> {
  const repositoryHostService = Container.get(RepositoryHostService);
  const repository = await repositoryHostService.fetchRepository(req.params);
  res.status(200).send(repository);
}

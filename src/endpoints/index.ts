import { Router } from 'express';

import { RepositoriesController } from './repositories';

export const ApiRouter = Router().use(RepositoriesController);

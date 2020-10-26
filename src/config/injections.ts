import Container from 'typedi';

import { InjectionKeys } from '~/constants/injection-keys';
import { RepositoryModel } from '~/models/repository';

Container.set(InjectionKeys.RepositoryModel, RepositoryModel);

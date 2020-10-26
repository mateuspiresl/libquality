import mongoose from 'mongoose';

import logger from '~/config/logger';
import { DATABASE_URL } from '~/config/settings';

mongoose.Promise = Promise;
mongoose.connection.on('error', (error) =>
  logger.error(`mongoose error '${error.name}': ${error.message}`),
);
mongoose.connection.on('connected', () =>
  logger.info('mongoose connection established.'),
);
mongoose.connection.once('open', () =>
  logger.info('mongoose connection successful.'),
);
mongoose.connection.on('reconnected', () =>
  logger.info('mongoose reconnection established.'),
);
mongoose.connection.on('connecting', () => logger.info('mongoose connecting.'));
mongoose.connection.on('close', () =>
  logger.info('mongoose closed connection.'),
);
mongoose.connection.on('timeout', () =>
  logger.error('mongoose connection timeout.'),
);
mongoose.connection.on('disconnected', () =>
  logger.info('mongoose disconnected.'),
);

export const DatabaseLoader: Loader = {
  async connect(): Promise<void> {
    await mongoose.connect(DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    });
  },

  disconnect(): Promise<void> {
    return mongoose.disconnect();
  },
};

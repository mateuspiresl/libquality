import '~/config/injections';

import mongoose from 'mongoose';

import { DatabaseLoader } from '~/loaders/database-loader';

/**
 * Prepares the database for the integration tests.
 */
export function setupTestDatabase(): void {
  beforeAll(async () => {
    await DatabaseLoader.connect();
  });

  afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await DatabaseLoader.disconnect();
  });
}

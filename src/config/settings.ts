import * as dotenv from 'dotenv';

// ---------------------
// Environment variables

const REQUIRED_VARIABLES = [
  'PORT',
  'DATABASE_URL',
  'REDIS_URL',
  'GITHUB_ACCESS_TOKEN',
  'MAX_CONCURRENT_JOBS',
];

function assertEnvironmentVariablePresence(name: string) {
  if (process.env[name] === undefined) {
    throw new Error(`Missing environment variable '${name}'`);
  }
}

dotenv.config();
// Assert the presence of the NODE_ENV variable after the dotenv setup to allow
// defining it at .env
assertEnvironmentVariablePresence('NODE_ENV');

export const NODE_ENV = process.env.NODE_ENV!;

// Assert the presence of required variables
REQUIRED_VARIABLES.forEach(assertEnvironmentVariablePresence);

export const PORT = parseInt(process.env.PORT!, 10);
export const DATABASE_URL = process.env.DATABASE_URL!;
export const REDIS_URL = process.env.REDIS_URL!;
export const GITHUB_ACCESS_TOKEN = process.env.GITHUB_ACCESS_TOKEN!;
export const MAX_CONCURRENT_JOBS = parseInt(
  process.env.MAX_CONCURRENT_JOBS!,
  10,
);

// ---------
// Constants

export const DEFAULT_JOB_OPTIONS = { removeOnComplete: true };

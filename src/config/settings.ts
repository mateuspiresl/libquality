import * as dotenv from 'dotenv';

const REQUIRED_VARIABLES = [
  'PORT',
  'DATABASE_URL',
  'REDIS_URL',
  'GITHUB_ACCESS_TOKEN',
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
export const { DATABASE_URL, REDIS_URL, GITHUB_ACCESS_TOKEN } = process.env;

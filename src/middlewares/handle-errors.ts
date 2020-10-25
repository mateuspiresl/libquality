import * as boom from '@hapi/boom';
import express from 'express';

import logger from '~/config/logger';

function formatBoomPayload(error: boom.Boom<unknown>) {
  return {
    ...error.output.payload,
    ...(error.data === null ? {} : { data: error.data }),
  };
}

function handleNotBoomError(error: Error, res: express.Response): void {
  if (process.env.NODE_ENV !== 'production' && (error.stack || error.message)) {
    res.status(500).send(error.stack || error.message);
  } else {
    logger.error('Unknown error: ', error);
    res.status(500).send(boom.internal().output.payload);
  }
}

export function handleErrors() {
  return (
    error: Error,
    req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: express.NextFunction,
  ): void => {
    if (boom.isBoom(error)) {
      res.status(error.output.statusCode).send(formatBoomPayload(error));
    } else {
      handleNotBoomError(error, res);
    }
  };
}

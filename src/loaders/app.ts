import 'module-alias/register';
import 'source-map-support/register';
import 'express-async-errors';
import 'reflect-metadata';

import * as bodyParser from 'body-parser';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import lusca from 'lusca';
import morgan from 'morgan';

import logger from '~/config/logger';
import { DocsRouter } from '~/docs-router';
import { ApiRouter } from '~/endpoints';
import { handleErrors } from '~/middlewares/handle-errors';

export const app = express()
  .use(compression())
  .use(cors({ optionsSuccessStatus: 200 }))
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  .use(lusca.xframe('SAMEORIGIN'))
  .use(lusca.xssProtection(true))
  .use(
    morgan(
      ':remote-addr - :remote-user ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"',
      {
        stream: {
          write(text: string) {
            logger.info(text.replace(/\n$/, ''));
          },
        },
      },
    ),
  )

  // Health check
  .get('/ping', (req, res) => res.send('Up!'))

  // Docs
  .use('/docs', DocsRouter)

  // Routes
  .use('/api', ApiRouter)
  .use(handleErrors());
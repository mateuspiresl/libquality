import * as express from 'express-serve-static-core';

declare global {
  type EResponse = express.Response;

  interface ERequest<Params = express.ParamsDictionary>
    extends express.Request<Params> {}
}

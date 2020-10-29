import * as express from 'express-serve-static-core';
import Bull from 'bull';

declare global {
  type EResponse = express.Response;

  interface ERequest<Params = express.ParamsDictionary>
    extends express.Request<Params> {}

  interface Loader {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
  }

  interface BullWorker<T> {
    fn: (data: T, id: Bull.JobId) => Promise<void>;
    queue: Bull.Queue<T>;
  }

  namespace Jobs {
    type FetchRepository = {
      owner: string;
      name: string;
    };
  }
}

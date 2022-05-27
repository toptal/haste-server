declare module 'rethinkdbdash' {
  type Result = {
    data: string
  }

  type Callback = (error: unknown, result?: Result) => void

  interface RethinkRun {
    run(callback: Callback)
  }

  type RethinkInsertObject = {
    id: string
    data: string
  }

  interface RethinkFunctions {
    insert(object: RethinkInsertObject): RethinkRun
    get(x: string): RethinkRun
  }

  export interface RethinkClient {
    table(s: string): RethinkFunctions
  }

  function rethink<T>(obj: T): RethinkClient<T>

  export = rethink
}

declare module 'connect-ratelimit' {
  function connectRateLimit(
    as: RateLimits,
  ): (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => void

  export = connectRateLimit
}

declare namespace Express {
  export interface Request {
    sturl: string
  }
}

declare module 'st' {

  type ConnectSt = {
    path: string
    content: { maxAge : number }
    passthrough? : boolean
    index: boolean | string
  }

  function connectSt(st: ConnectSt): Middleware

  export = connectSt
}

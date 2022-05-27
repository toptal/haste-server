export type Callback = (arg0: boolean | string) => void

export interface Store {
  type: string
  expire?: number
  get: (key: string, callback: Callback, skipExpire?: boolean) => void
  set: (
    key: string,
    data: string,
    callback: Callback,
    skipExpire?: boolean,
  ) => void
}

import { BaseStoreConfig } from 'src/types/config'

export type Callback = (data: boolean | string) => void

export abstract class Store {
  type: string

  expire?: number

  constructor(config: BaseStoreConfig) {
    this.type = config.type
    if (this.expire) {
      this.expire = config.expire
    }
  }

  abstract get: (key: string, callback: Callback, skipExpire?: boolean) => void

  abstract set: (
    key: string,
    data: string,
    callback: Callback,
    skipExpire?: boolean
  ) => void
}

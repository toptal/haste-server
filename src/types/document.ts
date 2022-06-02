import type { Config } from './config'
import type { KeyGenerator } from './key-generator'
import type { Store } from './store'

export type Document = {
  store: Store
  config: Config
  keyGenerator: KeyGenerator
  maxLength?: number
  keyLength?: number
}

export interface Documents {
  about: string
}

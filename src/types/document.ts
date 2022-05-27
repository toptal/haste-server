import type { Config } from './config'
import type { KeyGenerator } from './key-generator'
import type { Store } from './store'

export type Document = {
  store: Store
  config: Config
  maxLength: number
  keyLength: number
  keyGenerator: KeyGenerator
}

export interface Documents {
  about: string
}

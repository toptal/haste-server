import KeyGenerator from 'src/lib/key-generators'
import type { Config } from './config'
import type { Store } from './callback'

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

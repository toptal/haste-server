import { Logging } from './log'
import { RateLimits } from './rate-limits'

export interface Config {
  host: string
  port: number
  keyLength: number
  maxLength: number
  staticMaxAge: number
  recompressStaticAssets: boolean
  logging: Logging[]
  keyGenerator: KeyGeneratorConfig
  rateLimits: RateLimits
  storage: StoreConfig
  documents: Record<string, string>
}

export type BaseStoreConfig = {
  type: string
  expire?: number
}

export interface MongoStoreConfig extends BaseStoreConfig {
  connectionUrl: string
}

export interface MemcachedStoreConfig extends BaseStoreConfig {
  host: string
  port: number
}

export interface FileStoreConfig extends BaseStoreConfig {
  path: string
}

export interface AmazonStoreConfig extends BaseStoreConfig {
  bucket: string
  region: string
}

export interface PostgresStoreConfig extends BaseStoreConfig {
  connectionUrl: string
}

export interface RethinkDbStoreConfig extends BaseStoreConfig {
  host: string
  port: string
  db: string
  user: string
  password: string
}

export interface RedisStoreConfig extends BaseStoreConfig {
  url?: string
  db?: string
  user?: string
  username?: string | undefined
  password?: string
  host?: string
  port?: string
}

export type GoogleStoreConfig = BaseStoreConfig

export type StoreConfig =
  | MongoStoreConfig
  | MemcachedStoreConfig
  | GoogleStoreConfig
  | AmazonStoreConfig
  | FileStoreConfig
  | MongoStoreConfig
  | RedisStoreConfig
  | RethinkDbStoreConfig
  | PostgresStoreConfig

export interface KeyGeneratorConfig {
  type: string
  keyspace?: string
  path?: string
}

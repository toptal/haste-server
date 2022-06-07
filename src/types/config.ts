import { Logging } from './log'
import { RateLimits } from './rate-limits'
import { StoreNames } from './store-names'

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
  type: StoreNames
  expire?: number
}

export interface MongoStoreConfig extends BaseStoreConfig {
  connectionUrl: string
  type: StoreNames.mongo
}

export interface MemcachedStoreConfig extends BaseStoreConfig {
  host: string
  port: number
  type: StoreNames.memcached
}

export interface FileStoreConfig extends BaseStoreConfig {
  path: string
  type: StoreNames.file
}

export interface AmazonStoreConfig extends BaseStoreConfig {
  bucket: string
  region: string
  type: StoreNames.amazons3
}

export interface PostgresStoreConfig extends BaseStoreConfig {
  connectionUrl: string
  type: StoreNames.postgres
}

export interface RethinkDbStoreConfig extends BaseStoreConfig {
  host: string
  port: string
  db: string
  user: string
  password: string
  type: StoreNames.rethinkdb
}

export interface RedisStoreConfig extends BaseStoreConfig {
  url?: string
  db?: number
  user?: string
  username?: string | undefined
  password?: string
  host?: string
  port?: string
  type: StoreNames.redis
}

export interface GoogleStoreConfig extends BaseStoreConfig {
  type: StoreNames.googledatastore
}

export type StoreConfig =
  | MongoStoreConfig
  | MemcachedStoreConfig
  | FileStoreConfig
  | AmazonStoreConfig
  | PostgresStoreConfig
  | RethinkDbStoreConfig
  | RedisStoreConfig
  | GoogleStoreConfig

export interface KeyGeneratorConfig {
  type: string
  keyspace?: string
  path?: string
}

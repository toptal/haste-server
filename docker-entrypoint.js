const { promisify } = require("util");
const {
  HOST,
  PORT,
  KEY_LENGTH,
  MAX_LENGTH,
  STATIC_MAX_AGE,
  RECOMPRESS_STATIC_ASSETS,
  STORAGE_TYPE,
  STORAGE_HOST,
  STORAGE_PORT,
  STORAGE_EXPIRE_SECONDS,
  STORAGE_DB,
  STORAGE_AWS_BUCKET,
  STORAGE_AWS_REGION,
  STORAGE_PG_PASSWORD,
  STORAGE_PG_USERNAME,
  LOGGING_LEVEL,
  LOGGING_TYPE,
  LOGGING_COLORIZE,
  KEYGENERATOR_TYPE,
  KEY_GENERATOR_KEYSPACE,
  RATE_LIMITS_NORMAL_TOTAL_REQUESTS,
  RATE_LIMITS_NORMAL_EVERY_SECONDS,
  RATE_LIMITS_WHITELIST_TOTAL_REQUESTS,
  RATE_LIMITS_WHITELIST_EVERY_SECONDS,
  RATE_LIMITS_WHITELIST,
  RATE_LIMITS_BLACKLIST_TOTAL_REQUESTS,
  RATE_LIMITS_BLACKLIST_EVERY_SECONDS,
  RATE_LIMITS_BLACKLIST,
  DOCUMENTS,
} = process.env;

const config = {
  host: HOST,
  port: PORT,

  keyLength: KEY_LENGTH,

  maxLength: MAX_LENGTH,

  staticMaxAge: STATIC_MAX_AGE,

  recompressStaticAssets: RECOMPRESS_STATIC_ASSETS,

  logging: [
    {
      level: LOGGING_LEVEL,
      type: LOGGING_TYPE,
      colorize: LOGGING_COLORIZE,
    },
  ],

  keyGenerator: {
    type: KEYGENERATOR_TYPE,
    keyspace: KEY_GENERATOR_KEYSPACE,
  },

  rateLimits: {
    whitelist: RATE_LIMITS_WHITELIST ? RATE_LIMITS_WHITELIST.split(",") : [],
    blacklist: RATE_LIMITS_BLACKLIST ? RATE_LIMITS_BLACKLIST.split(",") : [],
    categories: {
      normal: {
        totalRequests: RATE_LIMITS_NORMAL_TOTAL_REQUESTS,
        every: RATE_LIMITS_NORMAL_EVERY_SECONDS,
      },
      whitelist:
        RATE_LIMITS_WHITELIST_EVERY_SECONDS ||
        RATE_LIMITS_WHITELIST_TOTAL_REQUESTS
          ? {
              totalRequests: RATE_LIMITS_WHITELIST_TOTAL_REQUESTS,
              every: RATE_LIMITS_WHITELIST_EVERY_SECONDS,
            }
          : null,
      blacklist:
        RATE_LIMITS_BLACKLIST_EVERY_SECONDS ||
        RATE_LIMITS_BLACKLIST_TOTAL_REQUESTS
          ? {
              totalRequests: RATE_LIMITS_WHITELIST_TOTAL_REQUESTS,
              every: RATE_LIMITS_BLACKLIST_EVERY_SECONDS,
            }
          : null,
    },
  },

  storage: {
    type: STORAGE_TYPE,
    host: STORAGE_HOST,
    port: STORAGE_PORT,
    expire: STORAGE_EXPIRE_SECONDS,
    bucket: STORAGE_AWS_BUCKET,
    region: STORAGE_AWS_REGION,
    connectionUrl: `postgres://${STORAGE_PG_USERNAME}:${STORAGE_PG_PASSWORD}@${STORAGE_HOST}:${STORAGE_PORT}/${STORAGE_DB}`,
    db: STORAGE_DB,
  },

  documents: DOCUMENTS
    ? DOCUMENTS.split(",").reduce((acc, item) => {
        const keyAndValueArray = item.replace(/\s/g, "").split("=");
        return { ...acc, [keyAndValueArray[0]]: keyAndValueArray[1] };
      }, {})
    : null,
};

console.log(JSON.stringify(config));

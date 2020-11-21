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
  STORAGE_PASSWORD,
  STORAGE_USERNAME,
  STORAGE_FILEPATH,
  LOGGING_LEVEL,
  LOGGING_TYPE,
  LOGGING_COLORIZE,
  KEYGENERATOR_TYPE,
  KEY_GENERATOR_KEYSPACE,
  RATE_LIMITS_NORMAL_TOTAL_REQUESTS,
  RATE_LIMITS_NORMAL_EVERY_MILLISECONDS,
  RATE_LIMITS_WHITELIST_TOTAL_REQUESTS,
  RATE_LIMITS_WHITELIST_EVERY_MILLISECONDS,
  RATE_LIMITS_WHITELIST,
  RATE_LIMITS_BLACKLIST_TOTAL_REQUESTS,
  RATE_LIMITS_BLACKLIST_EVERY_MILLISECONDS,
  RATE_LIMITS_BLACKLIST,
  DOCUMENTS,
  STORAGE_ALLOWLIST,
  STORAGE_ALLOWDELETE
} = process.env;

const config = require("./base.config.json");

if (HOST) config.host = HOST;
if (PORT) config.port = PORT;

if (KEY_LENGTH) config.keyLength = KEY_LENGTH;

if (MAX_LENGTH) config.maxLength = MAX_LENGTH;

if (PORT) config.staticMaxAge = STATIC_MAX_AGE;

if (PORT) config.ecompressStaticAssets = RECOMPRESS_STATIC_ASSETS;

if (LOGGING_LEVEL) config.logging[0].level = LOGGING_LEVEL;
if (LOGGING_TYPE) config.logging[0].type = LOGGING_TYPE;
if (LOGGING_COLORIZE) config.logging[0].colorize = LOGGING_COLORIZE;

if (KEYGENERATOR_TYPE) config.keyGenerator.type = KEYGENERATOR_TYPE;
if (KEY_GENERATOR_KEYSPACE) config.keyGenerator.keyspace = KEY_GENERATOR_KEYSPACE;

if (RATE_LIMITS_WHITELIST) config.rateLimits.whitelist = RATE_LIMITS_WHITELIST.split(",");
if (RATE_LIMITS_BLACKLIST) config.rateLimits.blacklist = RATE_LIMITS_BLACKLIST.split(",");

if (RATE_LIMITS_NORMAL_TOTAL_REQUESTS) config.rateLimits.categories.normal.totalRequests = RATE_LIMITS_NORMAL_TOTAL_REQUESTS;
if (RATE_LIMITS_NORMAL_EVERY_MILLISECONDS) config.rateLimits.categories.normal.every = RATE_LIMITS_NORMAL_EVERY_MILLISECONDS;

if (RATE_LIMITS_WHITELIST_EVERY_MILLISECONDS || RATE_LIMITS_WHITELIST_TOTAL_REQUESTS) config.rateLimits.categories.whitelist = { totalRequests: RATE_LIMITS_WHITELIST_TOTAL_REQUESTS, every: RATE_LIMITS_WHITELIST_EVERY_MILLISECONDS };
if (RATE_LIMITS_BLACKLIST_EVERY_MILLISECONDS || RATE_LIMITS_BLACKLIST_TOTAL_REQUESTS) config.rateLimits.categories.blacklist = { totalRequests: RATE_LIMITS_BLACKLIST_TOTAL_REQUESTS, every: RATE_LIMITS_BLACKLIST_EVERY_MILLISECONDS };

if (STORAGE_TYPE) config.storage.type = STORAGE_TYPE;
if (STORAGE_HOST) config.storage.host = STORAGE_HOST;
if (STORAGE_PORT) config.storage.port = STORAGE_PORT;
if (STORAGE_EXPIRE_SECONDS) config.storage.expire = STORAGE_EXPIRE_SECONDS;
if (STORAGE_AWS_BUCKET) config.storage.bucket = STORAGE_AWS_BUCKET;
if (STORAGE_AWS_REGION) config.storage.region = STORAGE_AWS_REGION;
if (STORAGE_DB) config.storage.connectionUrl = `postgres://${STORAGE_USERNAME}:${STORAGE_PASSWORD}@${STORAGE_HOST}:${STORAGE_PORT}/${STORAGE_DB}`;
if (STORAGE_DB) config.storage.db = STORAGE_DB;
if (STORAGE_USERNAME) config.storage.user = STORAGE_USERNAME;
if (STORAGE_PASSWORD) config.storage.password = STORAGE_PASSWORD;
if (STORAGE_FILEPATH) config.storage.path = STORAGE_FILEPATH;
if (STORAGE_ALLOWLIST) config.storage.allowList = STORAGE_ALLOWLIST == "true";
if (STORAGE_ALLOWDELETE) config.storage.allowDelete = STORAGE_ALLOWDELETE == "true";

if (DOCUMENTS) { 
  config.documents = DOCUMENTS.split(",").reduce((acc, item) => {
    const keyAndValueArray = item.replace(/\s/g, "").split("=");
    return { ...acc, [keyAndValueArray[0]]: keyAndValueArray[1] };
  }, {});
}

console.log(JSON.stringify(config));

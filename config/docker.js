module.exports = {
  host: "0.0.0.0",
  port: 7777,

  keyLength: 10,

  maxLength: 400000,

  staticMaxAge: 86400,

  recompressStaticAssets: true,

  logging: [
    {
      level: "verbose",
      type: "Console",
      colorize: true
    }
  ],

  keyGenerator: {
    type: "phonetic"
  },

  storage: {
    type: "redis",
    host: process.env.REDIS_PORT_6379_TCP_ADDR || process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT_6379_TCP_PORT || process.env.REDIS_PORT || 6379,
    db: process.env.REDIS_DB || 2,
    expire: process.env.REDIS_EXPIRE || 2592000
  },

  documents: {
    about: "./about.md"
  }
};

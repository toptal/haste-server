{
  "http": true,
  "http_host": "0.0.0.0",
  "http_port": 7777,
  "http_redirect_to_https": false,

  "https": false,
  "https_host": "0.0.0.0",
  "https_port": 7778,
  "https_cert": "/opt/certs/fullchain.pem",
  "https_key": "/opt/certs/privkey.pem",

  "keyLength": 10,

  "maxLength": 400000,

  "staticMaxAge": 86400,

  "recompressStaticAssets": true,

  "logging": [
    {
      "level": "verbose",
      "type": "Console",
      "colorize": true
    }
  ],

  "keyGenerator": {
    "type": "phonetic"
  },

  "rateLimits": {
    "categories": {
      "normal": {
        "totalRequests": 500,
        "every": 60000
      }
    }
  },

  "storage": {
    "type": "redis",
    "host": "0.0.0.0",
    "port": 6379,
    "db": 2,
    "expire": 2592000
  },

  "documents": {
    "about": "./about.md"
  }

}

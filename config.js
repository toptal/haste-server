{

  "host": "localhost",
  "port": 7777,

  "keyLength": 6,

  "maxLength": 400000,

  "logging": [
    {
      "level": "verbose",
      "type": "Console",
      "colorize": true
    }
  ],

  "storage": {
    "type": "redis",
    "host": "localhost",
    "port": 6379,
    "db": 2,
    "expire": 3600
  }

}

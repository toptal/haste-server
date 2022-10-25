# Important announcement:

## [Soon a new version of Hastebin will be launched!](https://github.com/toptal/haste-server/issues/429)

[Check here what you need to know.](https://github.com/toptal/haste-server/issues/429)

.    
.    
.    

# Haste

Haste is an open-source pastebin software written in node.js, which is easily
installable in any network.  It can be backed by either redis or filesystem,
and has a very easy adapter interface for other stores.  A publicly available
version can be found at [hastebin.com](http://hastebin.com)

Major design objectives:

* Be really pretty
* Be really simple
* Be easy to set up and use

Haste works really well with a little utility called
[haste-client](https://github.com/seejohnrun/haste-client), allowing you
to do things like:

`cat something | haste`

which will output a URL to share containing the contents of `cat something`'s
STDOUT.  Check the README there for more details and usages.

## Tested Browsers

* Firefox 8
* Chrome 17
* Safari 5.3

## Installation

1.  Download the package, and expand it
2.  Explore the settings inside of config.js, but the defaults should be good
3.  `npm install`
4.  `npm start` (you may specify an optional `<config-path>` as well)

## Settings

* `host` - the host the server runs on (default localhost)
* `port` - the port the server runs on (default 7777)
* `keyLength` - the length of the keys to user (default 10)
* `maxLength` - maximum length of a paste (default 400000)
* `staticMaxAge` - max age for static assets (86400)
* `recompressStaticAssets` - whether or not to compile static js assets (true)
* `documents` - static documents to serve (ex: http://hastebin.com/about.com)
  in addition to static assets.  These will never expire.
* `storage` - storage options (see below)
* `logging` - logging preferences
* `keyGenerator` - key generator options (see below)
* `rateLimits` - settings for rate limiting (see below)

## Rate Limiting

When present, the `rateLimits` option enables built-in rate limiting courtesy
of `connect-ratelimit`.  Any of the options supported by that library can be
used and set in `config.js`.

See the README for [connect-ratelimit](https://github.com/dharmafly/connect-ratelimit)
for more information!

## Key Generation

### Phonetic

Attempts to generate phonetic keys, similar to `pwgen`

``` json
{
  "type": "phonetic"
}
```

### Random

Generates a random key

``` json
{
  "type": "random",
  "keyspace": "abcdef"
}
```

The _optional_ keySpace argument is a string of acceptable characters
for the key.

## Storage

### File

To use file storage (the default) change the storage section in `config.js` to
something like:

``` json
{
  "path": "./data",
  "type": "file"
}
```

where `path` represents where you want the files stored.

File storage currently does not support paste expiration, you can follow [#191](https://github.com/seejohnrun/haste-server/issues/191) for status updates.

### Redis

To use redis storage you must install the `redis` package in npm, and have
`redis-server` running on the machine.

`npm install redis`

Once you've done that, your config section should look like:

``` json
{
  "type": "redis",
  "host": "localhost",
  "port": 6379,
  "db": 2
}
```

You can also set an `expire` option to the number of seconds to expire keys in.
This is off by default, but will constantly kick back expirations on each view
or post.

All of which are optional except `type` with very logical default values.

If your Redis server is configured for password authentification, use the `password` field.

### Postgres

To use postgres storage you must install the `pg` package in npm

`npm install pg`

Once you've done that, your config section should look like:

``` json
{
  "type": "postgres",
  "connectionUrl": "postgres://user:password@host:5432/database"
}
```

You can also just set the environment variable for `DATABASE_URL` to your database connection url.

You will have to manually add a table to your postgres database:

`create table entries (id serial primary key, key varchar(255) not null, value text not null, expiration int, unique(key));`

You can also set an `expire` option to the number of seconds to expire keys in.
This is off by default, but will constantly kick back expirations on each view
or post.

All of which are optional except `type` with very logical default values.

### MongoDB

To use mongodb storage you must install the 'mongodb' package in npm

`npm install mongodb`

Once you've done that, your config section should look like:

``` json
{
  "type": "mongo",
  "connectionUrl": "mongodb://localhost:27017/database"
}
```

You can also just set the environment variable for `DATABASE_URL` to your database connection url.

Unlike with postgres you do NOT have to create the table in your mongo database prior to running.

You can also set an `expire` option to the number of seconds to expire keys in.
This is off by default, but will constantly kick back expirations on each view or post.

### Memcached

To use memcache storage you must install the `memcached` package via npm

`npm install memcached`

Once you've done that, your config section should look like:

``` json
{
  "type": "memcached",
  "host": "127.0.0.1",
  "port": 11211
}
```

You can also set an `expire` option to the number of seconds to expire keys in.
This behaves just like the redis expirations, but does not push expirations
forward on GETs.

All of which are optional except `type` with very logical default values.

### RethinkDB

To use the RethinkDB storage system, you must install the `rethinkdbdash` package via npm

`npm install rethinkdbdash`

Once you've done that, your config section should look like this:

``` json
{
  "type": "rethinkdb",
  "host": "127.0.0.1",
  "port": 28015,
  "db": "haste"
}
```

In order for this to work, the database must be pre-created before the script is ran.
Also, you must create an `uploads` table, which will store all the data for uploads.

You can optionally add the `user` and `password` properties to use a user system.

### Google Datastore

To use the Google Datastore storage system, you must install the `@google-cloud/datastore` package via npm

`npm install @google-cloud/datastore`

Once you've done that, your config section should look like this:

``` json
{
  "type": "google-datastore"
}
```

Authentication is handled automatically by [Google Cloud service account credentials](https://cloud.google.com/docs/authentication/getting-started), by providing authentication details to the GOOGLE_APPLICATION_CREDENTIALS environmental variable.

### Amazon S3

To use [Amazon S3](https://aws.amazon.com/s3/) as a storage system, you must
install the `aws-sdk` package via npm:

`npm install aws-sdk`

Once you've done that, your config section should look like this:

```json
{
  "type": "amazon-s3",
  "bucket": "your-bucket-name",
  "region": "us-east-1"
}
```

Authentication is handled automatically by the client. Check
[Amazon's documentation](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-credentials-node.html)
for more information. You will need to grant your role these permissions to
your bucket:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Action": [
                "s3:GetObject",
                "s3:PutObject"
            ],
            "Effect": "Allow",
            "Resource": "arn:aws:s3:::your-bucket-name-goes-here/*"
        }
    ]
}
```

## Docker

### Build image

```bash
docker build --tag haste-server .
```

### Run container

For this example we will run haste-server, and connect it to a redis server

```bash
docker run --name haste-server-container --env STORAGE_TYPE=redis --env STORAGE_HOST=redis-server --env STORAGE_PORT=6379 haste-server
```

### Use docker-compose example

There is an example `docker-compose.yml` which runs haste-server together with memcached

```bash
docker-compose up
```

### Configuration

The docker image is configured using environmental variables as you can see in the example above.

Here is a list of all the environment variables

### Storage

|          Name          | Default value |                                                  Description                                                  |
| :--------------------: | :-----------: | :-----------------------------------------------------------------------------------------------------------: |
|      STORAGE_TYPE      |   memcached   |    Type of storage . Accepted values: "memcached","redis","postgres","rethinkdb", "amazon-s3", and "file"     |
|      STORAGE_HOST      |   127.0.0.1   |                 Storage host. Applicable for types: memcached, redis, postgres, and rethinkdb                 |
|      STORAGE_PORT      |     11211     |           Port on the storage host. Applicable for types: memcached, redis, postgres, and rethinkdb           |
| STORAGE_EXPIRE_SECONDS |    2592000    | Number of seconds to expire keys in. Applicable for types. Redis, postgres, memcached. `expire` option to the |
|       STORAGE_DB       |       2       |                    The name of the database. Applicable for redis, postgres, and rethinkdb                    |
|    STORAGE_PASSWORD    |               |                       Password for database. Applicable for redis, postges, rethinkdb .                       |
|    STORAGE_USERNAME    |               |                           Database username. Applicable for postgres, and rethinkdb                           |
|   STORAGE_AWS_BUCKET   |               |                          Applicable for amazon-s3. This is the name of the S3 bucket                          |
|   STORAGE_AWS_REGION   |               |                      Applicable for amazon-s3. The region in which the bucket is located                      |
|    STORAGE_FILEPATH    |               |                            Path to file to save data to. Applicable for type file                             |

### Logging

|       Name        | Default value | Description |
| :---------------: | :-----------: | :---------: |
|   LOGGING_LEVEL   |    verbose    |             |
|   LOGGING_TYPE=   |    Console    |
| LOGGING_COLORIZE= |     true      |

### Basics

|           Name           |  Default value   |                                        Description                                        |
| :----------------------: | :--------------: | :---------------------------------------------------------------------------------------: |
|           HOST           |     0.0.0.0      |                         The hostname which the server answers on                          |
|           PORT           |       7777       |                          The port on which the server is running                          |
|        KEY_LENGTH        |        10        |                              the length of the keys to user                               |
|        MAX_LENGTH        |      400000      |                                 maximum length of a paste                                 |
|      STATIC_MAX_AGE      |      86400       |                                 max age for static assets                                 |
| RECOMPRESS_STATIC_ASSETS |       true       |                        whether or not to compile static js assets                         |
|    KEYGENERATOR_TYPE     |     phonetic     |             Type of key generator. Acceptable values: "phonetic", or "random"             |
|  KEYGENERATOR_KEYSPACE   |                  |                  keySpace argument is a string of acceptable characters                   |
|        DOCUMENTS         | about=./about.md | Comma separated list of static documents to serve. ex: \n about=./about.md,home=./home.md |

### Rate limits

|                 Name                 |             Default value             |                                       Description                                        |
| :----------------------------------: | :-----------------------------------: | :--------------------------------------------------------------------------------------: |
|   RATELIMITS_NORMAL_TOTAL_REQUESTS   |                  500                  | By default anyone uncategorized will be subject to 500 requests in the defined timespan. |
| RATELIMITS_NORMAL_EVERY_MILLISECONDS |                 60000                 |             The timespan to allow the total requests for uncategorized users             |
| RATELIMITS_WHITELIST_TOTAL_REQUESTS  |                                       |      By default client names in the whitelist will not have their requests limited.      |
|  RATELIMITS_WHITELIST_EVERY_SECONDS  |                                       |      By default client names in the whitelist will not have their requests limited.      |
|         RATELIMITS_WHITELIST         | example1.whitelist,example2.whitelist |           Comma separated list of the clients which are in the whitelist pool            |
| RATELIMITS_BLACKLIST_TOTAL_REQUESTS  |                                       |    By default client names in the blacklist will be subject to 0 requests per hours.     |
|  RATELIMITS_BLACKLIST_EVERY_SECONDS  |                                       |     By default client names in the blacklist will be subject to 0 requests per hours     |
|         RATELIMITS_BLACKLIST         | example1.blacklist,example2.blacklist |           Comma separated list of the clients which are in the blacklistpool.            |

## Author

John Crepezzi <john.crepezzi@gmail.com>

## License

(The MIT License)

Copyright © 2011-2012 John Crepezzi

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the ‘Software’), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED ‘AS IS’, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE

### Other components:

* jQuery: MIT/GPL license
* highlight.js: Copyright © 2006, Ivan Sagalaev
* highlightjs-coffeescript: WTFPL - Copyright © 2011, Dmytrii Nagirniak

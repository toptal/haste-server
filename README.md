# Haste

Haste is an open-source pastebin software written in node.js, which is easily installable in any network.  By default, it is filesystem backed, but it can also be set up to work with Redis quickly.

Major design objectives:

* Be really pretty
* Be really simple
* Be easy to set up and use
* By default, don't require any external database

## Installation

1.  Download the package, and expand it
2.  Explore the settings inside of config.js, but the defaults should be good
3.  `npm install`
4.  `npm start`

## Storage

## File

To use file storage (the default) change the storage section in `config.js` to something like:

``` json
{
	"path": "./data",
	"type": "file"
}
```

Where `path` represents where you want the files stored

### Redis

To use redis storage you must install the redis package in npm globall using

`npm install redis --global`

Once you've done that, your config section should look like:

``` json
{
	"type": "redis",
	"host": "localhost",
	"port": 6379,
	"db": 2
}
```

All of which are optional except `type` with very logical default values.

## Author

John Crepezzi <john.crepezzi@gmail.com>

## License

(The MIT License)

Copyright © 2011 John Crepezzi

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the ‘Software’), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED ‘AS IS’, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE

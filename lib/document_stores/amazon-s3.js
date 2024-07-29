/*global require,module,process*/

var AWS = require('aws-sdk');
var winston = require('winston');

var AmazonS3DocumentStore = function(options) {
  this.expire = options.expire;
  this.bucket = options.bucket;

  var config = {};
  if(options.endpoint) 
    config.endpoint = new AWS.Endpoint(options.endpoint);
  if(options.region)
    config.region = options.region;
  if(options.keyId && options.keySecret)
    config.credentials = new AWS.Credentials({ accessKeyId: options.keyId, secretAccessKey: options.keySecret })

  this.client = new AWS.S3(config);
};

AmazonS3DocumentStore.prototype.get = function(key, callback, skipExpire) {
  var _this = this;

  var req = {
    Bucket: _this.bucket,
    Key: key
  };

  _this.client.getObject(req, function(err, data) {
    if(err) {
      callback(false);
    }
    else {
      callback(data.Body.toString('utf-8'));
      if (_this.expire && !skipExpire) {
        winston.warn('amazon s3 store cannot set expirations on keys');
      }
    }
  });
}

AmazonS3DocumentStore.prototype.set = function(key, data, callback, skipExpire) {
  var _this = this;

  var req = {
    Bucket: _this.bucket,
    Key: key,
    Body: data,
    ContentType: 'text/plain'
  };

  _this.client.putObject(req, function(err, data) {
    if (err) {
      callback(false);
    }
    else {
      callback(true);
      if (_this.expire && !skipExpire) {
        winston.warn('amazon s3 store cannot set expirations on keys');
      }
    }
  });
}

module.exports = AmazonS3DocumentStore;

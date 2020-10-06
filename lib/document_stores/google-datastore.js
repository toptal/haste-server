/*global require,module,process*/

const Datastore = require('@google-cloud/datastore');
const winston = require('winston');

class GoogleDatastoreDocumentStore {

  // Create a new store with options
  constructor(options) {
    this.kind = "Haste";
    this.expire = options.expire;
    this.datastore = new Datastore();
  }

  // Save file in a key
  set(key, data, callback, skipExpire) {
    var expireTime = (skipExpire || this.expire === undefined) ? null : new Date(Date.now() + this.expire * 1000);

    var taskKey = this.datastore.key([this.kind, key])
    var task = {
      key: taskKey,
      data: [
        {
          name: 'value',
          value: data,
          excludeFromIndexes: true
        },
        {
          name: 'expiration',
          value: expireTime
        }
      ]
    };

    this.datastore.insert(task).then(() => {
      callback(true);
    })
    .catch(err => {
      callback(false);
    });
  }

  // Get a file from a key
  get(key, callback, skipExpire) {
    var taskKey = this.datastore.key([this.kind, key])

    this.datastore.get(taskKey).then((entity) => {
      if (skipExpire || entity[0]["expiration"] == null) {
        callback(entity[0]["value"]);
      }
      else {
        // check for expiry
        if (entity[0]["expiration"] < new Date()) {
          winston.info("document expired", {key: key, expiration: entity[0]["expiration"], check: new Date(null)});
          callback(false);
        }
        else {
          // update expiry
          var task = {
            key: taskKey,
            data: [
              {
                name: 'value',
                value: entity[0]["value"],
                excludeFromIndexes: true
              },
              {
                name: 'expiration',
                value: new Date(Date.now() + this.expire * 1000)
              }
            ]
          };
          this.datastore.update(task).then(() => {
          })
          .catch(err => {
            winston.error("failed to update expiration", {error: err});
          });
          callback(entity[0]["value"]);
        }
      }
    })
    .catch(err => {
        winston.error("Error retrieving value from Google Datastore", {error: err});
        callback(false);
    });
  }
}

module.exports = GoogleDatastoreDocumentStore;

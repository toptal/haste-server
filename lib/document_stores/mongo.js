

var MongoClient = require('mongodb').MongoClient,
    winston = require('winston');

var MongoDocumentStore = function (options) {
    this.expire = options.expire;
    this.connectionUrl = process.env.DATABASE_URl || options.connectionUrl;
};

MongoDocumentStore.prototype.set = function (key, data, callback, skipExpire) {
    var now = Math.floor(new Date().getTime() / 1000),
        that = this;
    this.safeConnect(function (err, db) {
        if (err)
            return callback(false);
        
        db.collection('entries').updateOne({
            $or: [
                { expiration: -1 },
                { expiration: { $gt: now } }
            ],
            $and: [
                {
                    'entry_id': key,
                }
            ]
        }, 
        {
            $set: { 
                'entry_id': key,
                'value': data,
                'expiration': that.expire && !skipExpire ? that.expire + now : -1 
            }
        },        
       {
            upsert: true
        });
    });
};

MongoDocumentStore.prototype.get = function (key, callback, skipExpire) {
    var now = Math.floor(new Date().getTime() / 1000),
        that = this;

    this.safeConnect(function (err, db) {
        if (err)
            return callback(false);
        
        db.collection('entries').findOne({
            $and: [
                {
                    'entry_id': key,
                }
            ],
            $or: [
                { expiration: -1 },
                { expiration: { $gt: now } }
            ]
        }, function (err, entry) {
            if (err) {
                winston.error('error persisting value to mongodb', { error: err });
                return callback(false);
            }

            callback(entry === null ? false : entry.value);

            if (entry !== null && entry.expiration !== -1 && that.expire && !skipExpire) {
                db.collection('entries').updateOne({
                    $and: [
                        {
                            'entry_id': key,
                        }
                    ],
                }, {
                    $set: {
                        'expiration': that.expire + now
                    }
                }, function (err, result) { });
            }
        });
    });
};

MongoDocumentStore.prototype.safeConnect = async function (callback) {
    await MongoClient.connect(this.connectionUrl, function (err, db) {
        if (err) {
            winston.error('error connecting to mongodb', { error: err });
            callback(err);
        } else {
            callback(undefined, db);
        }
    });
};


module.exports = MongoDocumentStore;

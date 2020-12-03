const MongoClient = require('mongodb').MongoClient,
    winston = require('winston');

const MongoDocumentStore = function (options) {
    this.expire = options.expire;
    this.connectionUrl = process.env.DATABASE_URL || options.connectionUrl;
    this.connectionName = process.env.DATABASE_NAME || options.connectionName;
};

MongoDocumentStore.prototype.set = function (key, data, callback, skipExpire) {
    const now = Math.floor(new Date().getTime() / 1000),
        that = this;

    this.safeConnect(function (err, db) {
        if (err)
            return callback(false);

        db.collection('entries').updateOne({
            'entry_id': key,
            $or: [
                { expiration: -1 },
                { expiration: { $gt: now } }
            ]
        }, {
            $set: {
                'entry_id': key,
                'value': data,
                'expiration': that.expire && !skipExpire ? that.expire + now : -1
            }
        }, {
            upsert: true
        }, function (err, existing) {
            if (err) {
                winston.error('error persisting value to mongodb', { error: err });
                return callback(false);
            }

            callback(true);
        });
    });
};

MongoDocumentStore.prototype.get = function (key, callback, skipExpire) {
    const now = Math.floor(new Date().getTime() / 1000),
        that = this;

    this.safeConnect(function (err, db) {
        if (err)
            return callback(false);

        db.collection('entries').findOne({
            'entry_id': key,
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
                    'entry_id': key
                }, {
                    $set: {
                        'expiration': that.expire + now
                    }
                }, function (err, result) { });
            }
        });
    });
};

MongoDocumentStore.prototype.safeConnect = function (callback) {
    MongoClient.connect(this.connectionUrl, { useUnifiedTopology: true }, function (err, client) {
        if (err) {
            winston.error('error connecting to mongodb', { error: err });
            callback(err);
        } else {
            callback(undefined, client.db(this.connectionDBName));
        }
    });
};

module.exports = MongoDocumentStore;

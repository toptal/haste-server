var MongoClient = require("mongodb").MongoClient,
    winston = require("winston");

var MongoDocumentStore = function (options) {
    this.expire = options.expire;
    this.connectionUrl = process.env.DATABASE_URl || options.connectionUrl;
};

MongoDocumentStore.prototype.set = function (key, data, callback, skipExpire) {
    var now = Math.floor(new Date().getTime() / 1000),
        that = this;

    this.safeConnect(function (err, db, close) {
        if (err) return callback(false);

        db.collection("entries")
            .updateOne(
                {
                    entry_id: key,
                    $or: [{ expiration: -1 }, { expiration: { $gt: now } }],
                },
                {
                    $set: {
                        entry_id: key,
                        value: data,
                        expiration:
                            that.expire && !skipExpire ? that.expire + now : -1,
                    },
                },
                {
                    upsert: true,
                }
            )
            .then(function (existing, err) {
                if (err) {
                    winston.error("error persisting value to mongodb", {
                        error: err,
                    });
                    close();
                    return callback(false);
                }

                callback(true);
                close();
            });
    });
};

MongoDocumentStore.prototype.get = function (key, callback, skipExpire) {
    var now = Math.floor(new Date().getTime() / 1000),
        that = this;

    this.safeConnect(function (err, db, close) {
        if (err) return callback(false);

        db.collection("entries")
            .findOne({
                entry_id: key,
                $or: [{ expiration: -1 }, { expiration: { $gt: now } }],
            })
            .then(function (entry, err) {
                if (err) {
                    winston.error("error persisting value to mongodb", {
                        error: err,
                    });
                    return callback(false);
                }

                callback(entry === null ? false : entry.value);

                if (
                    entry !== null &&
                    entry.expiration !== -1 &&
                    that.expire &&
                    !skipExpire
                ) {
                    db.collection("entries").update(
                        {
                            entry_id: key,
                        },
                        {
                            $set: {
                                expiration: that.expire + now,
                            },
                        },
                        function (err, result) {}
                    );
                }
                close();
            });
    });
};

MongoDocumentStore.prototype.safeConnect = function (callback) {
    const client = new MongoClient(this.connectionUrl);
    let db_name = this.connectionUrl.split("/");
    db_name = db_name[db_name.length - 1];
    const db = client.db(db_name);
    callback(undefined, db, function () {
        client.close();
    });
};

module.exports = MongoDocumentStore;

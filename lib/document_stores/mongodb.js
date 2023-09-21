const { MongoClient } = require("mongodb"),
    winston = require("winston");

const MongoDocumentStore = function (options) {
    this.expire = options.expire;
    this.connectionUrl = process.env.DATABASE_URL || options.connectionUrl;
    this.connectionName = process.env.DATABASE_NAME || options.connectionName;
};

MongoDocumentStore.prototype.set = function (key, data, callback, skipExpire) {
    const now = Math.floor(new Date().getTime() / 1000);

    this.safeConnect((err, db, client) => {
        if (err) return callback(false);

        db.collection("entries").updateOne(
            {
                entry_id: key,
                $or: [{ expiration: -1 }, { expiration: { $gt: now } }],
            },
            {
                $set: {
                    entry_id: key,
                    value: data,
                    expiration:
                        this.expire && !skipExpire ? this.expire + now : -1,
                },
            },
            {
                upsert: true,
            },
            (err /*, existing*/) => {
                client.close();

                if (err) {
                    winston.error("error persisting value to mongodb", {
                        error: err,
                    });
                    return callback(false);
                }

                callback(true);
            }
        );
    });
};

MongoDocumentStore.prototype.get = function (key, callback, skipExpire) {
    const now = Math.floor(new Date().getTime() / 1000);

    this.safeConnect((err, db, client) => {
        if (err) return callback(false);

        db.collection("entries").findOne(
            {
                entry_id: key,
                $or: [{ expiration: -1 }, { expiration: { $gt: now } }],
            },
            (err, entry) => {
                if (err) {
                    winston.error("error persisting value to mongodb", {
                        error: err,
                    });
                    client.close();
                    return callback(false);
                }

                callback(entry === null ? false : entry.value);

                if (
                    entry !== null &&
                    entry.expiration !== -1 &&
                    this.expire &&
                    !skipExpire
                ) {
                    db.collection("entries").updateOne(
                        {
                            entry_id: key,
                        },
                        {
                            $set: {
                                expiration: this.expire + now,
                            },
                        },
                        () => {
                            client.close();
                        }
                    );
                }
            }
        );
    });
};

MongoDocumentStore.prototype.safeConnect = function (callback) {
    MongoClient.connect(
        this.connectionUrl,
        { useUnifiedTopology: true },
        (err, client) => {
            if (err) {
                winston.error("error connecting to mongodb", { error: err });
                callback(err);
            } else {
                callback(undefined, client.db(this.connectionName), client);
            }
        }
    );
};

module.exports = MongoDocumentStore;

const winston = require('winston');
const mongodb = require('mongodb');

class MongoDocumentStore {
	constructor(config){
		this.expire = config.expire;
        this.connectionUrl = process.env.DATABASE_URl || config.connectionUrl;
		this.MongoClient = new mongodb.MongoClient(this.connectionUrl);
	}

	async set(key, data, callback, skipExpire){
		winston.silly(`mongo set ${key}`);
		const now = Math.floor(Date.now() / 1000);

		if (await (this.safeConnect()).error) return callback(false);

		return await this.MongoClient.db().collection('entries').updateOne(
			{
				'entry_id': key,
				$or: [
					{ expiration: -1 },
					{ expiration: { $gt: now } }
				]
			},
			{
				$set: {
					'entry_id': key,
					value: data,
					expiration: this.expire && !skipExpire ? this.expire + now : -1
				}
			},
			{
				upsert: true
			}
		)
			.then((err, result) => {
                return callback(true);
			})
			.catch((err, result) => {
				winston.error('error updating mongodb document', { error: err });
                return callback(false)
            });
	}
	async get(key, callback, skipExpire){
		winston.silly(`mongo get ${key}`);
		const now = Math.floor(Date.now() / 1000);

		if ((await this.safeConnect()).error) return callback(false);

		let document = await this.MongoClient.db().collection('entries').findOne({
			'entry_id': key,
			$or: [
				{ expiration: -1 },
				{ expiration: { $gt: now } }
			]
		}).catch(err => {
			winston.error('error finding mongodb document', { error: err });
			return callback(false);
		});

		if (document && document.expiration != -1 && this.expire && !skipExpire) {
			await this.MongoClient.db().collection('entries').updateOne(
				{ 'entry_id': key },
				{ $set: { expiration: this.expire + now } }
			)
            .then(() => {
                winston.silly('extended expiry of mongodb document', { key: key, timestamp: this.expire + now });
            })
            .catch(err => {
				winston.warn('error extending expiry of mongodb document', { error: err });
			});
		}
		return callback(document ? document.value : false);
	}
	async safeConnect() {
        // check if we are already connected
        if(!!this.MongoClient && !!this.MongoClient.topology && this.MongoClient?.topology?.isConnected()) return { error: null };
        
		return await this.MongoClient.connect()
			.then(() => {
				winston.info('connected to mongodb');
				return { error: null };
			})
			.catch(err => {
				winston.error('error connecting to mongodb', { error: err });
				return { error: err };
			});
	}
}

module.exports = MongoDocumentStore;
const winston = require("winston");
const mongoose = require("mongoose");


const MongoDocumentStore = function(options, mongoOptions) {
  this.expire = options.expire;
  MongoDocumentStore.connect(options, mongoOptions);
}
// Create a connection according to config
MongoDocumentStore.connect = function(options, mongoOptions) {
  const uri = options.uri;
  const ops = mongoOptions || { useUnifiedTopology: true, useNewUrlParser: true };
  
  if (!uri) {
    throw Error("Enter Mongo URI!");
    winston.error("mongo uri is undefined");
  } else {
    mongoose.connect(uri, mongoOptions, (error) => {
      if (error) {
        throw Error(error);
        winston.error("defining error: " + error.message);
        process.exit(1);
      } else {
        winston.info("Connected to MongoDB");
      }
    });
    
    const schema = new mongoose.Schema({
      key: String,
      value: String,
      expiration: Number
    });
    
    const model = mongoose.model("hastebinData", schema);
    winston.info("Configuring Schema and Model is sucess.");
    MongoDocumentStore.model = model;
  }
}

// Set a given key

MongoDocumentStore.set = async function (key, data, callback, skipExpire) {
  const now = Math.floor(new Date().getTime() / 1000);
  const db = await MongoDocumentStore.model({
    key,
    value: data,
    expiration: MongoDocumentStore.expire && !skipExpire ? MongoDocumentStore.expire + now : null
  });
  db.save().then((error) => {
    if (error) {
      winston.error("can't save data", { error });
      return callback(false);
    }
    
    callback(true);
    winston.info("Sucess save data");
  });
}

MongoDocumentStore.get = async function (key, callback, skipExpire) {
  const now = Math.floor(new Date().getTime() / 1000);
  await MongoDocumentStore.model.findOne({ key }, async (error, result) => {
    if (error) {
      winston.error("cannot find document", { error });
      return callback(false);
    } 
    callback(result.value.length ? result.value : false);
    if (result && MongoDocumentStore.expire && !skipExpire) {
        await MongoDocumentStore.updateOne({ key }, {
          key,
          value: result.value,
          expiration: MongoDocumentStore.expire + now
        }, (err) => {
          if (err) {
            if (!err) {
              winston.info("true");
            }
          }
        });
     } else {
       winston.info("true");
     }
  });
};

module.exports = MongoDocumentStore;

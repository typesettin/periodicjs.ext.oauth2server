'use strict';

const crypto = require('crypto');
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId,
  logger = console;

var clientSchema = new Schema({
  id: ObjectId,
  createdat: {
    type: Date,
    'default': Date.now
  },
  updatedat: {
    type: Date,
    'default': Date.now
  },
  name: {
    type: String,
    required: true,
    index: {
      unique: true
    }
  },
  title: String,
  user_id: {
    type: ObjectId,
    ref: 'User'
  },
  user_entity_type: {
    type: String,
    'default': 'user'
  },
  client_id: {
    type: String,
    index: {
      unique: true
    }
  },
  client_secret: {
    type: String,
    index: {
      unique: true
    }
  },
  ip_addresses: {
    type: String,
    default: null
  },
  rate_limit: {
    max: {
      type: Number,
      default: -1
    },
    delayMs: {
      type: Number,
      default: 0
    }
  },
  api_settings: {
    responseType: {
      type: String,
      default: 'application/json'
    },
    acknowledgementType: {
      type: String,
      default: null
    },
    sendAcknowledgement: {
      type: Boolean,
      default: false
    }
  }
});

clientSchema.pre('save', function (next, done) {
  // let client_id;
  // let client_secret;
  let salt = crypto.randomBytes(16).toString('base64');

  if (!this.user_id) {
    next(new Error('Invalid User Id'));
  }
  else if (!this.name) {
    next(new Error('Invalid Name'));
  }
  else {
    // console.log('clientSchema pre validation');
    let crypto_client_id = () => {
      return new Promise((resolve, reject) => {
        // console.log('this.user_id',this.user_id);
        crypto.pbkdf2(this.user_id + new Date(), salt, 10, 16, 'sha512', (err, key) => {
          if (err) {
            reject(err);
          }
          else {
            resolve(key.toString('hex'));
          }
        });
      });
    };
    let crypto_client_secret = () => {
      return new Promise((resolve, reject) => {
        crypto.pbkdf2(this.random + new Date(), salt, 10, 16, 'sha512', (err, key) => {
          if (err) {
            reject(err);
          }
          else {
            resolve(key.toString('hex'));
          }
        });
      });
    };
    Promise.all([crypto_client_id(), crypto_client_secret()])
      .then((client_data) => {
        console.log('client_data', client_data);
        this.client_id = client_data[0];
        this.client_secret = client_data[1];
        next();
      })
      .catch(function (err) {
        next(err);
      });
  }
});

// clientSchema.post('init', function (doc) {
// 	logger.info('model - user.js - ' + doc._id + ' has been initialized from the db');
// });
// clientSchema.post('validate', function (doc) {
// 	logger.info('model - user.js - ' + doc._id + ' has been validated (but not saved yet)');
// });
// clientSchema.post('save', function (doc) {
// 	logger.info('model - user.js - ' + doc._id + ' has been saved');
// });
// clientSchema.pre('remove', function (doc) {
// 	console.log('==================deleted============');
// 	logger.info('model - user.js - ' + doc._id + ' has been removed');
// });


exports = module.exports = clientSchema;

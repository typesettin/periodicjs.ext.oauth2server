'use strict';

const lowkie = require('lowkie');
const Schema = lowkie.Schema;
const ObjectId = Schema.ObjectId;
const scheme = {
  name: {
    type: String,
    required: true,
    // index: {
    //   unique: true,
    // },
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
    // index: {
    //   unique: true
    // }
  },
  client_secret: {
    type: String,
    // index: {
    //   unique: true
    // }
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
};

module.exports = {
  scheme,
  options: {},
  coreDataOptions: {
    docid: [ '_id', 'name', 'client_id'],
    sort: { createdat: -1, },
    search: ['title', 'name', 'client_id'],
    population: 'user_id'
  }
};
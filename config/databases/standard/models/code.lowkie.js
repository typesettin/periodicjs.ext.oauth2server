'use strict';

const lowkie = require('lowkie');
const Schema = lowkie.Schema;
const ObjectId = Schema.ObjectId;
const scheme = {
  value: {
    type: String,
    required: true,
  },
  user_id: {
    type: ObjectId,
    ref: 'User',
  },
  user_username: String,
  user_email: String,
  user_entity_type: {
    type: String,
    'default': 'user',
  },
  redirect_uri: {
    type: String,
    required: true,
  },
  client_id: String,
};

module.exports = {
  scheme,
  options: {},
  coreDataOptions: {
    docid: ['_id', 'client_id', ],
    sort: { createdat: -1, },
    search: ['client_id', ],
    population: 'user_id',
  },
};
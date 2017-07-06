'use strict';
const Sequelize = require('sequelize');
const scheme = {
  _id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  value: {
    type: Sequelize.INTEGER,
    required: true,
  },
  user_id: {
    type: Sequelize.INTEGER,
    // type: ObjectId,
    // ref: 'User'
  },
  user_username: {
    type: Sequelize.INTEGER,
  },
  user_email: {
    type: Sequelize.INTEGER,
  },
  user_entity_type: {
    type: Sequelize.INTEGER,
    'default': 'user',
  },
  redirect_uri: {
    type: Sequelize.INTEGER,
    required: true,
  },
  client_id: {
    type: Sequelize.INTEGER,
  },
};
const options = {
  underscored: true,
  timestamps: true,
  indexes: [{
    fields: ['createdat', ],
  }, ],
};
const associations = [{
  source: 'code',
  association: 'hasOne',
  target: 'user',
  options: {
    as: 'user_id',
  },
}, ];

module.exports = {
  scheme,
  options,
  associations,
  coreDataOptions: {
    docid: ['_id', 'client_id', ],
    sort: { createdat: -1, },
    search: ['user_email', 'value', 'client_id', 'redirect_uri'],
    population: 'user_id',
  },
};
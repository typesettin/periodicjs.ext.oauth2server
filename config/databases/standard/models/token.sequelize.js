'use strict';
const Sequelize = require('sequelize');
const scheme = {
  _id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  value: {
    type: Sequelize.STRING,
    required: true,
  },
  user_id: {
    type: Sequelize.INTEGER,
        // type: ObjectId,
        // ref: 'User'
  },
  user_username: {
    type: Sequelize.STRING,
  },
  user_email: {
    type: Sequelize.STRING,
  },
  user_entity_type: {
    type: Sequelize.STRING,
    'default': 'user',
  },
  expires: {
    type: Sequelize.DATE,
    required: true,
  },
  client_id: {
    type: Sequelize.STRING,
  },
};
const options = {
  underscored: true,
  timestamps: true,
  indexes: [{
    fields: ['createdat'],
  }],
  createdAt: 'createdat',
  updatedAt: 'updatedat',
};
// const associations = [{
//   source: 'token',
//   association: 'hasOne',
//   target: 'user',
//   options: {
//     as: 'user_id',
//   },
// }, ];

module.exports = {
  scheme,
  options,
  associations: [],
  coreDataOptions: {
    docid: ['_id',],
    sort: { createdat: -1, },
    search: ['user_email', 'value', 'client_id',],
        // population: 'user_id',
  },
};
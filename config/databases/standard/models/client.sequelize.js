'use strict';
const Sequelize = require('sequelize');
const scheme = {
  _id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: Sequelize.STRING,
    required: true,
    // index: {
    //   unique: true,
    // },
  },
  title: {
    type: Sequelize.STRING,
    // index: {
    //   unique: true
    // }
  },
  user_id: {
    type: Sequelize.INTEGER,
    // type: ObjectId,
    // ref: 'User'
  },
  user_entity_type: {
    type: Sequelize.STRING,
    'default': 'user'
  },
  client_id: {
    type: Sequelize.STRING,
    // index: {
    //   unique: true
    // }
  },
  client_secret: {
    type: Sequelize.STRING,
    // index: {
    //   unique: true
    // }
  },
  ip_addresses: {
    type: Sequelize.STRING,
    default: null
  },
  rate_limit: {
    // max: {
    //   type: Number,
    //   default: -1
    // },
    // delayMs: {
    //   type: Number,
    //   default: 0
    // }
    // allowNull: false,
    type: Sequelize.STRING,
    get() {
      return JSON.parse(this.getDataValue('rate_limit'));
    },
    set(val) {
      this.setDataValue('rate_limit', JSON.stringify(val));
    },
  },
  api_settings: {
    // responseType: {
    //   type: Sequelize.STRING,
    //   default: 'application/json'
    // },
    // acknowledgementType: {
    //   type: Sequelize.STRING,
    //   default: null
    // },
    // sendAcknowledgement: {
    //   type: Boolean,
    //   default: false
    // }
    type: Sequelize.STRING,
    get() {
      return JSON.parse(this.getDataValue('api_settings'));
    },
    set(val) {
      this.setDataValue('api_settings', JSON.stringify(val));
    },
  }
};

const options = {
  underscored: true,
  timestamps: true,
  indexes: [{
    fields: ['createdat'],
  }],
};

const associations = [ {
  source: 'client',
  association: 'hasOne',
  target: 'user',
  options: {
    as: 'user_id',
  }
}, ];

module.exports = {
  scheme,
  options,
  associations,
  coreDataOptions: {
    docid: [ '_id', 'name','client_id' ],
    sort: { createdat: -1, },
    search: ['title', 'name', 'client_id'],
    population: 'user_id'
  }
};
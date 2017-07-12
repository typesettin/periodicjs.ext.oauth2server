'use strict';
const periodic = require('periodicjs');
const utilities = require('../utilities/index');

module.exports = {
  createClient: utilities.client.create,
  createclient: utilities.client.create,
  cc: utilities.client.create,
};
'use strict';
const oauth2orize = require('oauth2orize');
const oauth2server = require('./oauth2server');
const oauth2 = require('./oauth2');
const auth = require('./auth');
const client = require('./client');
module.exports = {
  server: oauth2orize.createServer(),
  oauth2server,
  oauth2,
  auth,
  client,
};
'use strict';
const oauth2orize = require('oauth2orize');
const oauth2 = require('./oauth2');
const oauth2server = require('./oauth2server');
module.exports = {
  server: oauth2orize.createServer(),
  oauth2server,
  oauth2,
};
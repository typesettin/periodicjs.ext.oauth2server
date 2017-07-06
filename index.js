'use strict';
// const periodic = require('periodicjs');
// const LocalStrategy = require('passport-local').Strategy;
const utilities = require('./utilities');
const server = utilities.server;
const oauth2server = utilities.oauth2server;
// const passportSettings = utilities.getSettings();
module.exports = () => {
  return new Promise((resolve, reject) => {
    // Register serialialization function
    server.serializeClient(oauth2server.serializeClient);
    // Register deserialization function
    server.deserializeClient(oauth2server.deserializeClient);
    // Register authorization code grant type
    server.grant(oauth2server.oauth2orizeGrantCode);
    // Exchange authorization codes for access tokens
    server.exchange(oauth2server.oauth2orizeExchangeCode);
    resolve(true);
  });
};
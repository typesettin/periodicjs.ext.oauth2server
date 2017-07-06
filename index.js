'use strict';
// const LocalStrategy = require('passport-local').Strategy;
const periodic = require('periodicjs');
const utilities = require('./utilities');
const server = utilities.server;
const oauth2server = utilities.oauth2server;
const passport = periodic.locals.extensions.get('periodicjs.ext.passport').passport;
const BasicStrategy = require('passport-http').BasicStrategy;
const BearerStrategy = require('passport-http-bearer').Strategy;
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
    passport.use('client-basic', new BasicStrategy(oauth2server.basicStrategy));
    passport.use(new BearerStrategy(oauth2server.bearerStrategy));    
    resolve(true);
  });
};
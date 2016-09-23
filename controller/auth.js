'use strict';

var capitalize = require('capitalize'),
  moment = require('moment'),
  CoreExtension,
  CoreUtilities,
  CoreMailer,
  CoreController,
  appSettings,
  appenvironment,
  logger,
  loginAttemptsError,
  limitLoginAttempts,
  loginExtSettings,
  oauth2serverExtSettings,
  redis_config,
  redisClient,
  rateLimitStore,
  passport,
  mongoose,
  Client,
  User,
  user_based_rate_limits,
  Token;
var jwt = require('jwt-simple');
var BasicStrategy = require('passport-http').BasicStrategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
var RateLimit = require('express-rate-limit');
var RedisStore = require('rate-limit-redis');
var redis = require('redis');

/**
 * Add two more strategies to passport for client-basic authentication, this allows you to use HTTP Basic Auth with your client token id and client secret to obtain an authorization code
 */
var configurePassport = function(){
  /**
   * HTTP Basic Auth with client_token and client_secret
   * @param  {string} username  username parsed from auth header
   * @param  {string} password  password parsed from auth header
   * @param  {function} callback) {	                        Client.findOne({ client_id: username } find client by client_token_id
   * @return {function} callback with client from db
   */
  passport.use('client-basic', new BasicStrategy(
    function(username, password, callback) {
      // console.log('in client basic strategy username, password',username, password)
      Client.findOne({ client_id: username }, function (err, client) {
        if (err) { 
          return callback(err); 
        }
        else if (!client || client.client_secret !== password) { 
          // No client found with that id or bad password
          return callback(null, false); 
        }
        else{
          // Success
          return callback(null, client);
        }
      });
    }
  ));
  /**
   * HTTP Bearer Authentication setup using an access token
   * @param  {string} accessToken OAUTH 2.0 token
   * @param  {function} callback)   {	                  	var UserModelToQuery;	    Token.findOne({value: accessToken }    find token in db, to pull user account
   * @return {function} callback with user from db
   */
  passport.use(new BearerStrategy(
    function(accessToken, callback) {
      var UserModelToQuery;
      Token.findOne({value: accessToken }, function (err, token) {
        if (err) { 
          return callback(err); 
        }
        else if (!token) {// No token found
          return callback(null, false); 
        }
        else{
          UserModelToQuery = mongoose.model(capitalize(token.user_entity_type));
          UserModelToQuery.findOne({ _id: token.user_id }, function (err, user) {
            if (err) { 
              return callback(err); 
            }
            else if (!user) { // No user found
              return callback(null, false); 
            }
            else{
              // Simple example with no scope
              callback(null, user, { scope: '*' });
            }
          });
        }
      });
    }
  ));
};

/**
 * sets additional request variables for creating new client applications, so can query the correct user collection in db
 * @param {object}   req  express request object
 * @param {object}   res  express response object
 * @param {Function} next express middleware callback function
 */
var set_client_data = function( req, res, next) {
  req.body.user_id = req.user._id;
  req.body.user_entity_type = req.user.entitytype;
  next();
};

/**
 * basic route to test authenticated request that returns user id, entitytype, username and created dates
 * @param {object}   req  express request object
 * @param {object}   res  express response object
 */
var get_user_profile = function(req, res){
   res.send({
     _id:req.user._id,
     updatedat:req.user.updatedat,
     createdat:req.user.createdat,
     entitytype:req.user.entitytype,
     username: req.user.username,
     user:req.user,
   });
};

/**
 * authorization request to obtain a JWT access token (requires, username, password, clientid, entitytype (optional user entitytype))
 * @param {object}   req  express request object
 * @param {object}   res  express response object
 */
var get_jwt_token = function(req,res){
  var username = req.body.username || req.headers.username;
  var clientId = req.body.clientid || req.headers.clientid;
  var password = req.body.password || req.headers.password;
  var userQuery = {
      $or: [{
        username: {
          $regex: new RegExp(username, 'i')
        }
      }, {
        email: {
          $regex: new RegExp(username, 'i')
        }
      }]
    };
  var clientApp;
  var entitytype = req.body.entitytype || req.headers.entitytype ||'user';
  var UserModelToQuery = mongoose.model(capitalize(entitytype));
  /**
   * saves generated expiring JWT token to user document in db
   * @param  {object} user   user from db
   * @param  {object} client client from db
   * @return {object}        Promise for saving token
   */
  var saveToken = function(user,client){
    return new Promise(function(resolve,reject){
      var expires = moment().add( oauth2serverExtSettings.jwt.expire_duration, oauth2serverExtSettings.jwt.expire_period).valueOf();	
      var jwtTokenSecret = (oauth2serverExtSettings.jwt.custom_secret)? oauth2serverExtSettings.jwt.custom_secret : appSettings.session_secret;			
      var jwt_token = jwt.encode(
        {
          iss: user._id,
          ent: user.entitytype,
          exp: expires
        }, 
        jwtTokenSecret
      );	
      var token = new Token({
        client_id: client.client_id,
        user_id: user._id,
        user_username: user._username,
        user_email: user._email,
        expires: new Date(expires),
        user_entity_type: user.entitytype,
        value: jwt_token,
      });

      // Save the access token and check for errors
      token.save(function (err) {

        if (err) { reject(err); }
        else{
          resolve({jwt_token:jwt_token,expires:expires,user:user});
        }

      });
    });
  };
  /**
   * gets user from db
   * @param  {function} resolve       promise resolve callback
   * @param  {function} reject) 			promise reject callback
   * @return {object}        Promise for finding db user
   */
  var getUser = new Promise(function(resolve,reject){
    if (!username || !password){
      reject(new Error('Authentication error'));
    }
    else{
      UserModelToQuery.findOne(userQuery).select({
        'primaryasset.changes':0,
        'primaryasset.content':0,
        'assets.changes':0,
        '__v':0,
        'password':0,
        changes:0,
        content:0
      }).populate('tags categories contenttypes assets primaryasset').exec(function(err, user) {
        var validUserCallback = function(user){
          user.comparePassword(password, function(err, isMatch) {
            if (err) {	      		
              // an error has occured checking the password. For simplicity, just return a 401
              reject('Invalid Login Error');
            }
            if (isMatch) {	
              //clear login attempt blocks
              if (user.extensionattributes && user.extensionattributes.login && user.extensionattributes.login.attempts) {
                user.extensionattributes.login.attempts = 0;
                user.markModified('extensionattributes');
                user.save();
              }
              resolve(user);
            } 
            else {						
              // The password is wrong...
              reject('Invalid Login Authentication');
            }
          });
        };


        if (err ) {		
          // user cannot be found; may wish to log that fact here. For simplicity, just return a 401
          reject( new Error('Authentication error'));
        }
        else if (!user) {		
          // user cannot be found; may wish to log that fact here. For simplicity, just return a 401
          reject( new Error('Invalid Credentials'));
        }
        else if (loginExtSettings.timeout.use_limiter) {
          var limitAttemptUser = limitLoginAttempts(user);
          limitAttemptUser.save(function (err, updated) {
            if (err) {
              logger.error('Error updating user', err);
              reject(err);
            }
            else if (loginExtSettings.timeout.use_limiter && updated.extensionattributes.login.flagged) {
                loginAttemptsError(updated, function(err){
                  reject(err);
                });
            }
            else {
              resolve(updated);
            }
          });
        }
        else {
          resolve(user);
        }
      });
    }
  });
  Promise.resolve(Client.findOne({ client_id: clientId }))
    .then(function(client){
      clientApp = client;
      if(!client){
        throw new Error('Client not found');
      }
      else if(req.user){
        return new Promise(function(resolve,reject){
          resolve(req.user);
        });
      }
      else{
        return getUser;
      }
    })
    .then(function(user){
      return saveToken(user,clientApp);
    })
    .then(function(savedToken){
      // console.log('savedToken',savedToken);
      res.json({
        token : savedToken.jwt_token,
        expires : savedToken.expires,
        timeout : new Date(savedToken.expires),
        user : (typeof savedToken.user.toJSON() ==='function')?savedToken.user.toJSON():savedToken.user
      });
    })
    .catch(function(err){
      var errortosend = (appenvironment==='production')?{message:err.message}:err;
      logger.error(err);
      res.status(401).send(errortosend);
    });
};


/**
 * looks up valid jwt tokens and sets user variable
 * @param {object}   req  express request object
 * @param {object}   res  express response object
 * @param {Function} next express middleware callback function
 */
var isJWTAuthenticated = function(req, res, next){
  var UserModelToQuery;
  var jwtTokenSecret = (oauth2serverExtSettings.jwt.custom_secret)? oauth2serverExtSettings.jwt.custom_secret : appSettings.session_secret;			
  
  /**
   * Take the token from:
   * 
   *  - the POST value access_token
   *  - the GET parameter access_token
   *  - the x-access-token header
   *    ...in that order.
   */
  var token = (req.body && req.body.access_token) || req.query.access_token || req.headers['x-access-token'];
  // console.log('token',token);
  if (token) {

    try {
      var decoded = jwt.decode(token, jwtTokenSecret);

      if (decoded.exp <= Date.now()) {
        res.status(400).send('Access token has expired', 400);				
      }
      else{
        UserModelToQuery = mongoose.model(capitalize(decoded.ent));
        UserModelToQuery.findOne({ '_id': decoded.iss }).select({changes:0,password:0}).populate('primaryasset').exec(function(err, user){
          if (!err) {					
            req.user = user;								
            return next();
          }
        });
      }
    } 
    catch (err) {			
      return next();
    }
  }
  else {
    next();
  }
};


/**
 * quieries mongo for clients and users - stores with ID as key and rate limits as value
 */
var get_custom_rate_limits = function () {
  let allClientLimits = {};
  let allUserLimits = {};
  Client.find({}, (err, clients) => {
    clients.map(client => {
      let client_from_mongo = (client.toJSON)? client.toJSON(): client;
      let clientId = client_from_mongo.client_id.toString();
      allClientLimits[clientId] = client.rate_limit
    })
  });
  user_based_rate_limits = {
    clients: allClientLimits,
    users: allUserLimits
  };
};

var client_id_auth_header_map = {};

/***
 *store all queries for client id in a map and then return value split out of the basic auth header
 * @param {string} authHeader this is the base64 encoded authorization header
 */
var get_client_id_from_authorization_header = function (authHeader) {
  if (!client_id_auth_header_map[authHeader]) {
    client_id_auth_header_map[authHeader] = Buffer.from(authHeader.replace('Basic ', ''),'base64').toString().split(':')[0]; // Buffer.from(authHeader, 'base64').toString().replace('Basic ','').split(':')[0];
  }
  return client_id_auth_header_map[authHeader];
}

/**
 * returns rate limiter middleware with configured settings based on client, or default settings if headers have no client_id
 * @param {object}   req  express request object
 * @param {object}   res  express response object
 * @param {Function} next express middleware callback function
 */
var limit_api_requests = function (req, res, next) {
  let cannot_connect_to_redis = (rateLimitStore) ? true : false;
  if (oauth2serverExtSettings.use_rate_limit === false || cannot_connect_to_redis) {
    next();
  } 
  else if (( req.headers.client_id || (req.headers.authorization && req.headers.authorization.substr(0,6) === 'Basic '
)) && user_based_rate_limits) {
    if (!req.headers.client_id) {
      req.headers.client_id = get_client_id_from_authorization_header(req.headers.authorization);
    }
    let client = user_based_rate_limits.clients[req.headers.client_id.toString()];
    let client_limits = {
      store: rateLimitStore,
      max: client.max,
      windowMs: oauth2serverExtSettings.rate_limiter.windowMs,
      delayMs: client.delayMs,
      keyGenerator: function (req) {
        return req.body.client_id || req.headers.authorization || req.body.client_secret || req.body.access_token || req.query.access_token || req.headers['x-access-token'] || req.ip;
      }
    }
    let limiter = new RateLimit(client_limits);
    return limiter(req, res, next);
  }
  else {
    let config_limits = {
      store: rateLimitStore,
      max: oauth2serverExtSettings.rate_limiter.max,
      windowMs: oauth2serverExtSettings.rate_limiter.windowMs,
      delayMs: oauth2serverExtSettings.rate_limiter.delayMs, 
      keyGenerator: function (req) {
        return req.headers.authorization || req.body.client_secret || req.body.client_id || req.body.access_token || req.query.access_token || req.headers['x-access-token'] || req.ip;
      }
    };
    let config_from_settings = {};
    let limiter = new RateLimit(Object.assign(config_limits, config_from_settings));
    return limiter(req, res, next);
  }
}

/**
 * express middleware for ensuring either HTTP Bearer or JWT access token
 */
var checkApiAuthentication = [
  function (req, res, next) {
    req.controllerData = req.controllerData || {};
    req.controllerData.skip_session = true;
    next();
  },
  limit_api_requests,
  isJWTAuthenticated,
  function (req, res, next) {
    if (req.user) {
      next();
    }
    else {
      return passport.authenticate('bearer', { session: false })(req,res,next);
    }
  }];

/**
 * oauth2server auth controller
 * @module oauth2serverController
 * @{@link https://github.com/typesettin/periodicjs.ext.oauth2server}
 * @author Yaw Joseph Etse
 * @copyright Copyright (c) 2016 Typesettin. All rights reserved.
 * @license MIT
 * @requires module:async
 * @requires module:path
 * @requires module:moment
 * @requires module:capitalize
 * @param  {object} resources variable injection from current periodic instance with references to the active logger and mongo session
 */
var controller = function (resources) {
  logger = resources.logger;
  mongoose = resources.mongoose;
  appSettings = resources.settings;
  passport = resources.app.controller.extension.login.auth.passport;
  CoreController = resources.core.controller;
  CoreUtilities = resources.core.utilities;
  CoreExtension = resources.core.extension;
  CoreMailer = resources.core.mailer;
  Client = resources.mongoose.model('Client');
  Token = resources.mongoose.model('Token');
  User = resources.mongoose.model('User');
  appenvironment = resources.settings.application.environment;
  oauth2serverExtSettings = resources.app.controller.extension.oauth2server.settings;
  loginExtSettings = resources.app.controller.extension.login.auth.loginExtSettings;
  var passportController = resources.app.controller.extension.login.auth.passportController;
  passport = passportController.passport;
  loginAttemptsError = passportController.loginAttemptsError;
  limitLoginAttempts = passportController.limitLoginAttempts;
  redis_config = resources.settings.redis_config;
  redisClient = redis.createClient(redis_config);
  rateLimitStore = new RedisStore({
    client: redisClient,
    expiry: oauth2serverExtSettings.rate_limiter.expiry,
    prefix: oauth2serverExtSettings.rate_limiter.prefix
  });
  configurePassport();
  get_custom_rate_limits();
  return {
    set_client_data : set_client_data,
    isClientAuthenticated: [
      limit_api_requests,
      function (req, res, next) {
      var username;
      var password;
      if (!req.headers.authorization && req.body && req.body.client_id && req.body.client_secret) {
        username = req.body.client_id;
        password = req.body.client_secret;
        req.headers.authorization = 'Basic ' + new Buffer(username + ':' + password).toString('base64');
      }
      else if(!req.headers.authorization && req.query && req.query.client_id && req.query.client_secret){
        username = req.query.client_id;
        password = req.query.client_secret;
        req.headers.authorization = 'Basic ' + new Buffer(username + ':' + password).toString('base64');
      }
      // console.log('req.body',req.body);
      // console.log('req.headers',req.headers);
      next();
    },passport.authenticate('client-basic', { session : false })],
    isBearerAuthenticated: passport.authenticate('bearer', { session: false }),
    ensureApiAuthenticated :checkApiAuthentication,
    isJWTAuthenticated: isJWTAuthenticated,
    isAuthenticated: [function (req, res, next) {
      console.log('Inside isAuthenticated');
      next();
    }, passport.authenticate(['bearer'], { session: false })],
    get_user_profile: get_user_profile,
    get_jwt_token: get_jwt_token
  };
};

module.exports = controller;

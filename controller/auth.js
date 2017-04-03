'use strict';
const capitalize = require('capitalize');
const moment = require('moment');
const jwt = require('jwt-simple');
const BasicStrategy = require('passport-http').BasicStrategy;
const BearerStrategy = require('passport-http-bearer').Strategy;
const RateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');
const Promisie = require('promisie');

var CoreExtension;
var CoreUtilities;
var CoreMailer;
var CoreController;
var appSettings;
var appenvironment;
var logger;
var loginAttemptsError;
var limitLoginAttempts;
var loginExtSettings;
var oauth2serverExtSettings;
var redis_config;
var redisClient;
var rateLimitStore;
var passport;
var mongoose;
var Client;
var User;
var user_based_rate_limits;
var Token;
var findOneClient;

/**
 * Add two more strategies to passport for client-basic authentication, this allows you to use HTTP Basic Auth with your client token id and client secret to obtain an authorization code
 */
var configurePassport = function() {
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
      Client.findOne({ client_id: username }, function(err, client) {
        if (err) {
          return callback(err);
        } else if (!client || client.client_secret !== password) {
          // No client found with that id or bad password
          return callback(null, false);
        } else {
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
      Token.findOne({ value: accessToken }, function(err, token) {
        if (err) {
          return callback(err);
        } else if (!token) { // No token found
          return callback(null, false);
        } else {
          UserModelToQuery = mongoose.model(capitalize(token.user_entity_type));
          UserModelToQuery.findOne({ _id: token.user_id }, function(err, user) {
            if (err) {
              return callback(err);
            } else if (!user) { // No user found
              return callback(null, false);
            } else {
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
var set_client_data = function(req, res, next) {
  req.body.user_id = req.user._id;
  req.body.user_entity_type = req.user.entitytype;
  next();
};

/**
 * basic route to test authenticated request that returns user id, entitytype, username and created dates
 * @param {object}   req  express request object
 * @param {object}   res  express response object
 */
var get_user_profile = function(req, res) {
  res.send({
    _id: req.user._id,
    updatedat: req.user.updatedat,
    createdat: req.user.createdat,
    entitytype: req.user.entitytype,
    username: req.user.username,
    user: req.user,
  });
};

/**
 * validates user password
 * @return {object}        Promise for saving token
 */
var validateUserForUnauthenticatedRequest = function(options = {}) {
  if (!options.user) return Promisie.reject(new Error('Invalid credentials'));
  let comparePassword = function() {
    return Promisie.promisify(options.user.comparePassword, options.user)(options.password)
      .then(isMatch => {
        if (isMatch) {
          if (options.user.extensionattributes && options.user.extensionattributes.login && options.user.extensionattributes.login.attempts) {
            options.user.extensionattributes.login.attempts = 0;
            options.user.markModified('extensionattributes');
            options.user.save();
          }
          return options;
        }
        return Promisie.reject(new Error('Invalid credentials'));
      })
      .catch(e => Promisie.reject(e));
  };
  if (loginExtSettings.timeout.use_limiter) {
    let limitAttemptUser = limitLoginAttempts(options.user);
    return Promisie.promisify(limitAttemptUser.save, limitAttemptUser)()
      .then(result => {
        if (result && result.extensionattributes && result.extensionattributes.login && result.extensionattributes.login.flagged) {
          return Promisie.promisify(loginAttemptsError)(result);
        }
        return comparePassword();
      })
      .catch(e => Promisie.reject(e));
  }
  return comparePassword();
};

/**
 * gets user from db
 * @return {object}        Promise for finding db user
 */
var getUserForUnauthenticatedRequest = function(options = {}) {
  if (!options.username || !options.password) return Promisie.reject(new Error('Authentication Error'));
  return new Promisie((resolve, reject) => {
    options.modelToQuery.findOne(options.userQuery, {
        'primaryasset.changes': 0,
        'primaryasset.content': 0,
        'assets.changes': 0,
        '__v': 0,
        changes: 0,
        content: 0
      })
      .populate('tags categories contenttypes assets primaryasset')
      .exec((err, user) => {
        if (err) reject(err);
        else resolve(Object.assign(options, { user }));
      });
  });
};

/**
 * saves generated expiring JWT token to user document in db
 * @return {object}        Promise for saving token
 */
var saveTokenForAuthenticatedUser = function(options = {}) {
  try {
    let expires = moment().add(oauth2serverExtSettings.jwt.expire_duration, oauth2serverExtSettings.jwt.expire_period).valueOf();
    let jwtTokenSecret = (oauth2serverExtSettings.jwt.custom_secret) ? oauth2serverExtSettings.jwt.custom_secret : appSettings.session_secret;
    let jwt_token = jwt.encode({
      iss: options.user._id,
      ent: options.user.entitytype,
      exp: expires
    }, jwtTokenSecret);
    let token = new Token({
      client_id: options.client.client_id,
      user_id: options.user._id,
      user_username: options.user.username,
      user_email: options.user.email,
      expires: new Date(expires),
      user_entity_type: options.user.entitytype,
      value: jwt_token
    });
    return Promisie.promisify(token.save, token)()
      .then(() => Object.assign(options, { jwt_token, expires }))
      .catch(e => Promisie.reject(e));
  } catch (e) {
    return Promisie.reject(e);
  }
};

/**
 * authorization request to obtain a JWT access token (requires, username, password, clientid, entitytype (optional user entitytype))
 * @param {object}   req  express request object
 * @param {object}   res  express response object
 */
var get_jwt_token = function(req, res) {
  let username = req.body.username || req.headers.username;
  let clientId = req.body.clientid || req.headers.clientid;
  let password = req.body.password || req.headers.password;
  let userQuery = {
    $or: [{
      username: new RegExp(username, 'i')
    }, {
      email: new RegExp(username, 'i')
    }]
  };
  let entitytype = req.body.entitytype || req.headers.entitytype || 'user';
  let UserModelToQuery = mongoose.model(capitalize(entitytype));
  findOneClient = (findOneClient) ? findOneClient : Promisie.promisify(Client.findOne, Client);
  return findOneClient({ client_id: clientId })
    .then(client => getUserForUnauthenticatedRequest({ client, req, modelToQuery: UserModelToQuery, username, password, userQuery }))
    .then(validateUserForUnauthenticatedRequest)
    .then(saveTokenForAuthenticatedUser)
    .then(result => {
      res.status(200).json({
        token: result.jwt_token,
        expires: result.expires,
        timeout: new Date(result.expires),
        user: (typeof result.user.toJSON() === 'function') ? result.user.toJSON() : result.user
      });
    })
    .catch(e => {
      let errortosend = (appenvironment === 'production') ? { message: e.message } : e;
      logger.error('there was an authentication error', e);
      res.status(401).send(errortosend);
    });
};

/**
 * looks up valid jwt tokens and sets user variable
 * @param {object}   req  express request object
 * @param {object}   res  express response object
 * @param {Function} next express middleware callback function
 */
var isJWTAuthenticated = function(req, res, next) {
  var UserModelToQuery;
  var jwtTokenSecret = (oauth2serverExtSettings.jwt.custom_secret) ? oauth2serverExtSettings.jwt.custom_secret : appSettings.session_secret;

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
      } else {
        UserModelToQuery = mongoose.model(capitalize(decoded.ent));
        UserModelToQuery.findOne({ '_id': decoded.iss }).select({ changes: 0, password: 0 }).populate('primaryasset').exec(function(err, user) {
          if (!err) {
            req.user = user;
            return next();
          }
        });
      }
    } catch (err) {
      return next();
    }
  } else {
    next();
  }
};


/**
 * quieries mongo for clients and users - stores with ID as key and rate limits as value
 */
var get_custom_rate_limits = function() {
  let allClientLimits = {};
  let allUserLimits = {};
  Client.find({}, (err, clients) => {
    clients.map(client => {
      let client_from_mongo = (client.toJSON) ? client.toJSON() : client;
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
var get_client_id_from_authorization_header = function(authHeader) {
  if (!client_id_auth_header_map[authHeader]) {
    client_id_auth_header_map[authHeader] = Buffer.from(authHeader.replace('Basic ', ''), 'base64').toString().split(':')[0]; // Buffer.from(authHeader, 'base64').toString().replace('Basic ','').split(':')[0];
  }
  return client_id_auth_header_map[authHeader];
}

/**
 * returns rate limiter middleware with configured settings based on client, or default settings if headers have no client_id
 * @param {object}   req  express request object
 * @param {object}   res  express response object
 * @param {Function} next express middleware callback function
 */
var limit_api_requests = function(req, res, next) {
  let cannot_connect_to_redis = (rateLimitStore) ? true : false;
  if (oauth2serverExtSettings.use_rate_limit === false || cannot_connect_to_redis) {
    next();
  } else if ((req.headers.client_id || (req.headers.authorization && req.headers.authorization.substr(0, 6) === 'Basic ')) && user_based_rate_limits) {
    if (!req.headers.client_id) {
      req.headers.client_id = get_client_id_from_authorization_header(req.headers.authorization);
    }
    let client = user_based_rate_limits.clients[req.headers.client_id.toString()];
    let client_limits = {
      store: rateLimitStore,
      max: client.max,
      windowMs: oauth2serverExtSettings.rate_limiter.windowMs,
      delayMs: client.delayMs,
      keyGenerator: function(req) {
        return req.body.client_id || req.headers.authorization || req.body.client_secret || req.body.access_token || req.query.access_token || req.headers['x-access-token'] || req.ip;
      }
    }
    let limiter = new RateLimit(client_limits);
    return limiter(req, res, next);
  } else {
    let config_limits = {
      store: rateLimitStore,
      max: oauth2serverExtSettings.rate_limiter.max,
      windowMs: oauth2serverExtSettings.rate_limiter.windowMs,
      delayMs: oauth2serverExtSettings.rate_limiter.delayMs,
      keyGenerator: function(req) {
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
  function(req, res, next) {
    req.controllerData = req.controllerData || {};
    req.controllerData.skip_session = true;
    if (req.body.use_session = true) {
      req.controllerData.skip_session = false;
    }
    next();
  },
  limit_api_requests,
  isJWTAuthenticated,
  function(req, res, next) {
    // console.log('req.user', req.user);
    if (req.user) {
      next();
    } else {
      return passport.authenticate('bearer', { session: false })(req, res, next);
    }
  }
];

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
var controller = function(resources) {
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
    set_client_data: set_client_data,
    isClientAuthenticated: [
      limit_api_requests,
      function(req, res, next) {
        var username;
        var password;
        if (!req.headers.authorization && req.body && req.body.client_id && req.body.client_secret) {
          username = req.body.client_id;
          password = req.body.client_secret;
          req.headers.authorization = 'Basic ' + new Buffer(username + ':' + password).toString('base64');
        } else if (!req.headers.authorization && req.query && req.query.client_id && req.query.client_secret) {
          username = req.query.client_id;
          password = req.query.client_secret;
          req.headers.authorization = 'Basic ' + new Buffer(username + ':' + password).toString('base64');
        }
        // console.log('req.body',req.body);
        // console.log('req.headers',req.headers);
        next();
      },
      passport.authenticate('client-basic', { session: false })
    ],
    isBearerAuthenticated: passport.authenticate('bearer', { session: false }),
    ensureApiAuthenticated: checkApiAuthentication,
    isJWTAuthenticated: isJWTAuthenticated,
    isAuthenticated: [function(req, res, next) {
      console.log('Inside isAuthenticated');
      next();
    }, passport.authenticate(['bearer'], { session: false })],
    get_user_profile: get_user_profile,
    get_jwt_token: get_jwt_token
  };
};

module.exports = controller;
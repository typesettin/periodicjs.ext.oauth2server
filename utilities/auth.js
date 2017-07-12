'use strict';
const oauth2orize = require('oauth2orize');
const Promisie = require('promisie');
const RateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const periodic = require('periodicjs');
/**
 * validates user password
 * @return {object}        Promise for saving token
 */
function validateUserForUnauthenticatedRequest(options = {}) {
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
}

/**
 * gets user from db
 * @return {object}        Promise for finding db user
 */
function getUserForUnauthenticatedRequest(options = {}) {
  if (!options.username || !options.password) {
    return Promisie.reject(new Error('Authentication Error'));
  } else {
    return new Promise((resolve, reject) => {
      try {
        const { client, req, query, username, password, entitytype, } = options;
        const userAccountCoreData = periodic.locals.extensions.get('periodicjs.ext.passport').auth.getAuthCoreDataModel({ entitytype, });//get from req
        console.log({ userAccountCoreData, }, 'getUserForUnauthenticatedRequest', { client, query, username, password, entitytype, });
        userAccountCoreData.load({
          query,
          population: ' ',
          fields: {
            'primaryasset.changes': 0,
            'primaryasset.content': 0,
            'assets.changes': 0,
            '__v': 0,
            changes: 0,
            content: 0,
          },
        })
          .then(userAccount => {
            //checkifuser
            //comparepassword
            console.log({ userAccount });
            resolve(Object.assign(options, { user : userAccount, }));
          })
          .catch(reject);
      } catch (e) {
        reject(e);
      }
    });
  }
}

/**
 * saves generated expiring JWT token to user document in db
 * @return {object}        Promise for saving token
 */
function saveTokenForAuthenticatedUser(options = {}) {
  try {
    let expires = moment().add(oauth2serverExtSettings.jwt.expire_duration, oauth2serverExtSettings.jwt.expire_period).valueOf();
    let jwtTokenSecret = (oauth2serverExtSettings.jwt.custom_secret) ? oauth2serverExtSettings.jwt.custom_secret : appSettings.session_secret;
    let jwt_token = jwt.encode({
      iss: options.user._id,
      ent: options.user.entitytype,
      exp: expires,
    }, jwtTokenSecret);
    let token = new Token({
      client_id: options.client.client_id,
      user_id: options.user._id,
      user_username: options.user.username,
      user_email: options.user.email,
      expires: new Date(expires),
      user_entity_type: options.user.entitytype,
      value: jwt_token,
    });
    return Promisie.promisify(token.save, token)()
      .then(() => Object.assign(options, { jwt_token, expires, }))
      .catch(e => Promisie.reject(e));
  } catch (e) {
    return Promisie.reject(e);
  }
}

/**
 * quieries mongo for clients and users - stores with ID as key and rate limits as value
 */
function getCustomRateLimits() {
  let allClientLimits = {};
  let allUserLimits = {};
  Client.find({}, (err, clients) => {
    clients.map(client => {
      let client_from_mongo = (client.toJSON) ? client.toJSON() : client;
      let clientId = client_from_mongo.client_id.toString();
      allClientLimits[clientId] = client.rate_limit;
    });
  });
  user_based_rate_limits = {
    clients: allClientLimits,
    users: allUserLimits,
  };
}

const clientIdAuthHeaderMap = {};

/***
 *store all queries for client id in a map and then return value split out of the basic auth header
 * @param {string} authHeader this is the base64 encoded authorization header
 */
function getClientIdFromAuthorizationHeader(authHeader) {
  if (!clientIdAuthHeaderMap[authHeader]) {
    clientIdAuthHeaderMap[authHeader] = Buffer.from(authHeader.replace('Basic ', ''), 'base64').toString().split(':')[0]; // Buffer.from(authHeader, 'base64').toString().replace('Basic ','').split(':')[0];
  }
  return clientIdAuthHeaderMap[authHeader];
}

// const redis_config = resources.settings.redis_config;
// const redisClient = redis.createClient(redis_config);
// const rateLimitStore = new RedisStore({
//   client: redisClient,
//   expiry: oauth2serverExtSettings.rate_limiter.expiry,
//   prefix: oauth2serverExtSettings.rate_limiter.prefix
// });

function findOneClient(options) {
  return new Promise((resolve, reject) => {
    try {
      const { clientId, } = options;
      const ClientCoreData = periodic.datas.get('standard_client');
      ClientCoreData.load({
        query: { client_id: clientId, },
      })
        .then(client => {
          if (!client) {
            reject(new Error('Invalid OAuth2 Client'));
          } else {
            resolve(client);
          }
        })
      .catch(reject);
    } catch (e) {
      reject(e);  
    }
  });
}

module.exports = {
  validateUserForUnauthenticatedRequest,
  getUserForUnauthenticatedRequest,
  saveTokenForAuthenticatedUser,
  getCustomRateLimits,
  clientIdAuthHeaderMap,
  getClientIdFromAuthorizationHeader,
  findOneClient,
};
'use strict';
const periodic = require('periodicjs');
const passport = periodic.locals.extensions.get('periodicjs.ext.passport').passport;
const utilities = require('../utilities');
// const authUtil = utilities.auth;
const appenvironment = periodic.settings.application.environment;
const logger = periodic.logger;

function getClientAuthHeaders(req, res, next) {
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
}

const isClientAuthenticated = [
  limitApiRequests,
  getClientAuthHeaders,
  passport.authenticate('client-basic', { session: false })
];


/**
 * looks up valid jwt tokens and sets user variable
 * @param {object}   req  express request object
 * @param {object}   res  express response object
 * @param {Function} next express middleware callback function
 */
function isJWTAuthenticated(req, res, next) {
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
}

function getJWTProfile(req, res, next) {
  next();
}

/**
 * basic route to test authenticated request that returns user id, entitytype, username and created dates
 * @param {object}   req  express request object
 * @param {object}   res  express response object
 */
function getUserProfile(req, res, next) {
  res.send({
    _id: req.user._id,
    updatedat: req.user.updatedat,
    createdat: req.user.createdat,
    entitytype: req.user.entitytype,
    username: req.user.username,
    user: req.user,
  });
}

/**
 * sets additional request variables for creating new client applications, so can query the correct user collection in db
 * @param {object}   req  express request object
 * @param {object}   res  express response object
 * @param {Function} next express middleware callback function
 */
function setClientData(req, res, next) {
  req.body.user_id = req.user._id;
  req.body.user_entity_type = req.user.entitytype;
  next();
}

function forceSession(req, res, next) {
  req.body = Object.assign({}, req.body, {
    use_session: true,
  });
  next();
}

function forceAPIReqLogin(req, res, next) {
  req.login(req.user, (e) => {
    // console.log('login error', e);
    // console.log('req.session', req.session);
    next(e);
  });
}

function asyncLogin(req, res) {
  let onsubmit = {
    options: {
      method: 'POST',
    },
    successCallback: 'func:this.props.loginUser',
  };
  res.status(200).send({
    status: 200,
    result: 'success',
    data: onsubmit,
  });
}

function asyncProcessLogin(req, res) {
  let password = (req.body && req.body.password) ?
    req.body.password :
    '';
  let username = (req.body && req.body.username) ?
    req.body.username :
    '';
  let __returnURL = req._parsedOriginalUrl.path.replace('/signin', '/authorize');
  __returnURL = __returnURL.replace('?format=json&', '?');
  __returnURL = __returnURL.replace('oauth2async/authorize', 'oauth2/authorize');
  __returnURL = (__returnURL.substr(-1) === '?') ?
    __returnURL.substr(0, __returnURL.length - 1) :
    __returnURL;
  res.status(200).send({
    status: 200,
    result: 'success',
    username,
    password,
    __returnURL,
  });
}

function fakeSessions(req, res, next) { //fake session   etpzo33U
  // console.log('req.body', req.body);
  // console.log('req.session', req.session);
  if (!req.session.authorize) {
    req.session.authorize = req.body.authorize;
    // console.log('req.session after body append', req.session);
  }
  res.redirect = (location) => {
    console.log('overwrite res.redirect', { location });
    res.status(200).send({ location });
  };
  // console.log('req.session', req.session);
  next();
}

function asyncUser(req, res, next) {
  if (req.method === 'POST' && req.body) {
    req.body.user_id = (req.body.user_id) ? req.body.user_id : req.user._id;
    req.body.user_entity_type = (req.body.user_id && req.body.user_entity_type) ? req.body.user_entity_type : req.user.entitytype;
  }
  next();
}

/**
 * authorization request to obtain a JWT access token (requires, username, password, clientid, entitytype (optional user entitytype))
 * @param {object}   req  express request object
 * @param {object}   res  express response object
 */
function getJWTtoken(req, res) {
  const username = req.body.username || req.headers.username || req.body.name || req.headers.name;
  const clientId = req.body.clientid || req.headers.clientid;
  const password = req.body.password || req.headers.password;
  const query = {
    $or: [{
      name: username,
    }, {
      email: username,
    }]
  };
  const entitytype = req.body.entitytype || req.headers.entitytype || 'user';
  // const UserModelToQuery = mongoose.model(capitalize(entitytype));
  // findOneClient = (findOneClient) ? findOneClient : Promisie.promisify(Client.findOne, Client);
  // console.log('getJWTtoken', { username, clientId, password, query, entitytype, });

  return utilities.auth.findOneClient({ clientId, })
    .then(client => utilities.auth.getUserForUnauthenticatedRequest({ client, req, query, username, password, entitytype, }))
    .then(utilities.auth.validateUserForUnauthenticatedRequest)
    .then(utilities.auth.saveTokenForAuthenticatedUser)
    .then(result => {
      console.log('getJWTtoken', { result, });
      res.status(200).json({
        token: result.jwt_token,
        expires: result.expires,
        timeout: new Date(result.expires),
        user: (result.user && result.user.toJSON && typeof result.user.toJSON() === 'function') ?
          result.user.toJSON() : result.user,
      });
    })
    .catch(e => {
      let errortosend = (appenvironment === 'production') ? { message: e.message, } : e;
      logger.error('there was an authentication error', e);
      res.status(401).send(errortosend);
    });
}

/**
 * returns rate limiter middleware with configured settings based on client, or default settings if headers have no client_id
 * @param {object}   req  express request object
 * @param {object}   res  express response object
 * @param {Function} next express middleware callback function
 */
function limitApiRequests(req, res, next) {
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

function bearerAuth(req, res, next) {
  // console.log('req.user', req.user);
  if (req.user) {
    next();
  } else {
    return passport.authenticate('bearer', { session: false })(req, res, next);
  }
}

/**
 * express middleware for ensuring either HTTP Bearer or JWT access token
 */
const checkApiAuthentication = [
  function(req, res, next) {
    req.controllerData = req.controllerData || {};
    req.controllerData.skip_session = true;
    if (req.body.use_session = true) {
      req.controllerData.skip_session = false;
    }
    next();
  },
  limitApiRequests,
  isJWTAuthenticated,
  bearerAuth,
];

function checkIsAuthenticated(req, res, next) {
  console.log('Inside isAuthenticated');
  next();
}

const isAuthenticated = [
  checkIsAuthenticated,
  passport.authenticate(['bearer'], { session: false }),
];

module.exports = {
  ensureApiAuthenticated: checkApiAuthentication,
  getClientAuthHeaders,
  isClientAuthenticated,
  isJWTAuthenticated,
  isBearerAuthenticated: passport.authenticate('bearer', { session: false }),
  isAuthenticated,
  getJWTProfile,
  getUserProfile,
  setClientData,
  forceSession,
  forceAPIReqLogin,
  asyncLogin,
  asyncProcessLogin,
  fakeSessions,
  asyncUser,
  getJWTtoken,
  limitApiRequests,
  checkApiAuthentication,
  checkIsAuthenticated,
  bearerAuth,
};
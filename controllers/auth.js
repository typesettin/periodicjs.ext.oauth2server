'use strict';

function ensureApiAuthenticated(req, res, next) {
  next();
}

function isClientAuthenticated(req, res, next) {
  next();
}

function isJWTAuthenticated(req, res, next) {
  next();
}

function getJWTProfile(req, res, next) {
  next();
}

function getUserProfile(req, res, next) {
  next();
}

function setClientData(req, res, next) {
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

module.exports = {
  ensureApiAuthenticated,
  isClientAuthenticated,
  isJWTAuthenticated,
  getJWTProfile,
  getUserProfile,
  setClientData,
  forceSession,
  forceAPIReqLogin,
  asyncLogin,
  asyncProcessLogin,
  fakeSessions,
  asyncUser,
};
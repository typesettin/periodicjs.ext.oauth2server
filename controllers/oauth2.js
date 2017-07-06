'use strict';

function token(req, res, next) {
  next();
}

function decision(req, res, next) {
  next();
}

function authorization(req, res, next) {
  next();
}

module.exports = {
  token,
  decision,
  authorization,
};
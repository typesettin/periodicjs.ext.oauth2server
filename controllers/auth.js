'use strict';

function getJWTProfile(req, res, next) {
  next();
}

function isJWTAuthenticated(req, res, next) {
  next();
}

function getUserProfile(req, res, next) {
  next();
}
module.exports = {
  getJWTProfile,
  isJWTAuthenticated,
  getUserProfile,
};
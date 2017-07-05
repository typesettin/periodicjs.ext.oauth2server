'use strict';
const path = require('path');
module.exports = function(resources) {
  const OAuth2Server = resources.express.Router();
  const oauth2serverController = resources.app.controller.extension.oauth2server.controller;
  const oauth2authController = resources.app.controller.extension.oauth2server.auth;

  OAuth2Server.use(oauth2authController.ensureApiAuthenticated);
  OAuth2Server.use((req, res, next) => {
    if (req.method === 'POST' && req.body) {
      req.body.user_id = (req.body.user_id) ? req.body.user_id : req.user._id;
      req.body.user_entity_type = (req.body.user_id && req.body.user_entity_type) ? req.body.user_entity_type : req.user.entitytype;
    }
    next();
  },oauth2serverController.client.router);
  OAuth2Server.use(oauth2serverController.code.router);
  OAuth2Server.use(oauth2serverController.token.router);

  return OAuth2Server;
};
'use strict';

module.exports = function(resources) {
  const OAuth2Server = resources.express.Router();
  const oauth2serverController = resources.app.controller.extension.oauth2server.controller;
  const oauth2authController = resources.app.controller.extension.oauth2server.auth;
  // console.log({  oauth2serverController });
  // const DBLoggerRouter = dbloggerController.router;
  OAuth2Server.use(oauth2authController.ensureApiAuthenticated);
  OAuth2Server.use(oauth2serverController.client.router);
  OAuth2Server.use(oauth2serverController.code.router);
  OAuth2Server.use(oauth2serverController.token.router);

  return OAuth2Server;
};
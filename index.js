'use strict';
var ControllerSettings = require('./model/controller_settings.js');
var clientSchema = require('./model/client.js');
var codeSchema = require('./model/code.js');
var tokenSchema = require('./model/token.js');
var RateLimit = require('express-rate-limit');
var RedisStore = require('rate-limit-redis');
var redis = require('redis');
var fs = require('fs-extra');
var extend = require('utils-merge');
var path = require('path');
var oauth2serverExtSettings;
var appenvironment;
var settingJSON;
var oauth2serverExtSettingsFile = path.join(__dirname, '../../content/config/extensions/periodicjs.ext.oauth2server/settings.json');
var defaultExtSettings = require('./controller/default_config');
/**
 * An asset upload manager that uses pkgcloud to upload to the various cloud service providers (amazon s3, rackspace cloud files
 * @{@link https://github.com/typesettin/periodicjs.ext.clouduploads}
 * @author Yaw Joseph Etse
 * @copyright Copyright (c) 2014 Typesettin. All rights reserved.
 * @license MIT
 * @exports periodicjs.ext.clouduploads
 * @requires module:path
 * @param  {object} periodic variable injection of resources from current periodic instance
 */
module.exports = function (periodic) {
  //register mongo models
  var Client = periodic.mongoose.model('Client', clientSchema);
  var Code = periodic.mongoose.model('Code', codeSchema);
  var Token = periodic.mongoose.model('Token', tokenSchema);

  appenvironment = periodic.settings.application.environment;
  settingJSON = fs.readJsonSync(oauth2serverExtSettingsFile, { throws: false });
  //console.log('before settingJSON[appenvironment]', settingJSON[appenvironment]);
  oauth2serverExtSettings = (settingJSON && settingJSON[appenvironment]) ? extend(defaultExtSettings, settingJSON[appenvironment]) : defaultExtSettings;

  let oauthControllers = require('./controller/index')(periodic);
  periodic.app.controller.extension.oauth2server = Object.assign({
    client: periodic.core.controller.controller_routes(ControllerSettings.client)
  }, {controller:oauthControllers});
  periodic.app.controller.extension.oauth2server.settings = oauth2serverExtSettings;
  periodic.app.controller.extension.oauth2server.auth = require('./controller/auth.js')(periodic);
  periodic.app.controller.extension.oauth2server.server = require('./controller/oauth2.js')(periodic);
  var clientRouter = periodic.express.Router();
  var apiRouter = periodic.express.Router();
  var clientController = periodic.app.controller.extension.oauth2server.client;
  var oauth2authController = periodic.app.controller.extension.oauth2server.auth;
  var oauth2serverController = periodic.app.controller.extension.oauth2server.server;
  var authController = periodic.app.controller.extension.login.auth;
  var uacController = periodic.app.controller.extension.user_access_control.uac;
  var userroleController = periodic.app.controller.native.userrole;

  clientRouter.get('/',
    clientController.loadClientsWithDefaultLimit,
    clientController.loadClientsWithCount,
    clientController.loadClients,
    clientController.index);
  clientRouter.get('/:id',
    clientController.loadClient,
    clientController.show);
  clientRouter.post('/new', oauth2authController.set_client_data, clientController.create);
  
  apiRouter.get('/jwt/token', oauth2authController.get_jwt_token);
  apiRouter.post('/jwt/token', oauth2authController.get_jwt_token);

  // Create endpoint handlers for oauth2 authorize
  apiRouter.route('/oauth2/authorize')
    .get(authController.ensureAuthenticated,
    uacController.loadUserRoles,
    uacController.check_user_access,
    oauth2serverController.authorization)
    .post(authController.ensureAuthenticated,
    oauth2serverController.decision);

  apiRouter.get('/oauth2/profile',
    oauth2authController.ensureApiAuthenticated,
    oauth2authController.get_user_profile);

  // Create endpoint handlers for oauth2 token
  apiRouter.route('/oauth2/token')
    .post(oauth2authController.isClientAuthenticated, oauth2serverController.token);

  //get jwt auth token
  apiRouter.get('/jwt/profile', oauth2authController.isJWTAuthenticated, oauth2authController.get_user_profile);
  apiRouter.post('/jwt/profile', oauth2authController.isJWTAuthenticated, oauth2authController.get_user_profile);

  // Register all our routes with /api
  periodic.app.use('/api', apiRouter);

  periodic.app.use('/' + periodic.app.locals.adminPath + '/oauth/client', clientRouter);
  let oauth2ServerRouter = require('./router/index')(periodic);
  periodic.app.use(oauth2ServerRouter);

  return periodic;
};
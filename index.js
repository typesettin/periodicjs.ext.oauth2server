'use strict';
var	ControllerSettings = require('./model/controller_settings.js');
var	clientSchema = require('./model/client.js');
var	codeSchema = require('./model/code.js');
var	tokenSchema = require('./model/token.js');
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

	periodic.app.controller.extension.oauth2server = {
		client:periodic.core.controller.controller_routes(ControllerSettings.client)
	};
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

	// express,app,logger,config,db,mongoose
	// 		assetController = periodic.app.controller.native.asset,

	clientRouter.get('/', 
		clientController.loadClientsWithDefaultLimit, 
		clientController.loadClientsWithCount, 
		clientController.loadClients, 
		clientController.index);
	clientRouter.get('/:id', 
		clientController.loadClient, 
		clientController.show);
	clientRouter.post('/new',oauth2authController.set_client_data,clientController.create);

	// Create endpoint handlers for oauth2 authorize
	apiRouter.route('/oauth2/authorize')
	  .get(authController.ensureAuthenticated,
	  	uacController.loadUserRoles, 
	  	uacController.check_user_access, 
	  	oauth2serverController.authorization)
	  .post(authController.ensureAuthenticated,
	  	oauth2serverController.decision);

	 apiRouter.get('/oauth2/profile',oauth2authController.isBearerAuthenticated, oauth2authController.get_user_profile);

	// Create endpoint handlers for oauth2 token
	apiRouter.route('/oauth2/token')
	  .post(oauth2authController.isClientAuthenticated, oauth2serverController.token);

	// Register all our routes with /api
	periodic.app.use('/api', apiRouter);

	periodic.app.use('/' + periodic.app.locals.adminPath + '/oauth/client', clientRouter);
	return periodic;
};
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
	var clientRouter = periodic.express.Router();
	var clientController = periodic.app.controller.extension.oauth2server.client;
	var oauthController = periodic.app.controller.extension.oauth2server.auth;
	var authController = periodic.app.controller.extension.login.auth;

	// express,app,logger,config,db,mongoose
	// 		assetController = periodic.app.controller.native.asset,

	clientRouter.get('/', 
		clientController.loadClientsWithDefaultLimit, 
		clientController.loadClientsWithCount, 
		clientController.loadClients, 
		clientController.index);

	clientRouter.post('/new',oauthController.set_client_data,clientController.create);

	periodic.app.use('/' + periodic.app.locals.adminPath + '/oauth/client', clientRouter);
	return periodic;
};
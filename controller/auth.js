'use strict';

var path = require('path'),
	CoreExtension,
	CoreUtilities,
	CoreController,
	appSettings,
	logger,
	passport,
	mongoose,
	Client;
var BasicStrategy = require('passport-http').BasicStrategy;
var BearerStrategy = require('passport-http-bearer').Strategy;

var configurePassport = function(){
	passport.use('client-basic', new BasicStrategy(
	  function(username, password, callback) {
	    Client.findOne({ client_id: username }, function (err, client) {
	      if (err) { return callback(err); }

	      // No client found with that id or bad password
	      if (!client || client.client_secret !== password) { return callback(null, false); }

	      // Success
	      return callback(null, client);
	    });
	  }
	));
};

var set_client_data = function( req, res, next) {
	req.body.user_id = req.user._id;
	req.body.user_entity_type = req.user.entity_type;
	next();
};




/**
 * cloudupload controller
 * @module clouduploadController
 * @{@link https://github.com/typesettin/periodicjs.ext.clouduploads}
 * @author Yaw Joseph Etse
 * @copyright Copyright (c) 2014 Typesettin. All rights reserved.
 * @license MIT
 * @requires module:async
 * @requires module:path
 * @requires module:fs-extra
 * @requires module:formidable
 * @requires module:pkgcloud
 * @requires module:periodicjs.core.utilities
 * @requires module:periodicjs.core.controller
 * @requires module:periodicjs.core.extensions
 * @param  {object} resources variable injection from current periodic instance with references to the active logger and mongo session
 */
var controller = function (resources) {
	logger = resources.logger;
	mongoose = resources.mongoose;
	appSettings = resources.settings;
	passport = resources.app.controller.extension.login.auth.passport;
	CoreController = resources.core.controller;
	CoreUtilities = resources.core.utilities;
	CoreExtension = resources.core.extension;
	Client = resources.mongoose.model('Client');

	configurePassport();
	return {
		set_client_data : set_client_data,
		isClientAuthenticated : passport.authenticate('client-basic', { session : false })
	}
};

module.exports = controller;

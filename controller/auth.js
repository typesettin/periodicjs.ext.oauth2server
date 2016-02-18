'use strict';

var path = require('path'),
	capitalize = require('capitalize'),
	CoreExtension,
	CoreUtilities,
	CoreController,
	appSettings,
	logger,
	passport,
	mongoose,
	Client,
	Token;
var BasicStrategy = require('passport-http').BasicStrategy;
var BearerStrategy = require('passport-http-bearer').Strategy;

var configurePassport = function(){
	passport.use('client-basic', new BasicStrategy(
	  function(username, password, callback) {
	    Client.findOne({ client_id: username }, function (err, client) {
	      if (err) { 
	      	return callback(err); 
	      }
	      else if (!client || client.client_secret !== password) { 
		      // No client found with that id or bad password
	      	return callback(null, false); 
	      }
	      else{
		      // Success
		      return callback(null, client);
	      }
	    });
	  }
	));

	passport.use(new BearerStrategy(
	  function(accessToken, callback) {
	  	var UserModelToQuery;
	    Token.findOne({value: accessToken }, function (err, token) {
	      if (err) { 
	      	return callback(err); 
	      }
	      else if (!token) {// No token found
	      	return callback(null, false); 
	      }
	      else{
	      	UserModelToQuery = mongoose.model(capitalize(token.user_entity_type));
		      UserModelToQuery.findOne({ _id: token.user_id }, function (err, user) {
		        if (err) { 
		        	return callback(err); 
		        }
		        else if (!user) { // No user found
		        	return callback(null, false); 
		        }
		        else{
			        // Simple example with no scope
			        callback(null, user, { scope: '*' });
		        }
		      });
	      }
	    });
	  }
	));
};

var set_client_data = function( req, res, next) {
	req.body.user_id = req.user._id;
	req.body.user_entity_type = req.user.entitytype;
	next();
};

var get_user_profile = function(req, res){
 	res.send({
 		_id:req.user._id,
 		updatedat:req.user.updatedat,
 		createdat:req.user.createdat,
 		entitytype:req.user.entitytype,
 		username:req.user.username,
 	});
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
	Token = resources.mongoose.model('Token');

	configurePassport();
	return {
		set_client_data : set_client_data,
		isClientAuthenticated : passport.authenticate('client-basic', { session : false }),
		isBearerAuthenticated : passport.authenticate('bearer', { session: false }),
		ensureApiAuthenticated : passport.authenticate('bearer', { session: false }),
		isAuthenticated : passport.authenticate([ 'bearer'], { session: false }),
		get_user_profile: get_user_profile
	}
};

module.exports = controller;

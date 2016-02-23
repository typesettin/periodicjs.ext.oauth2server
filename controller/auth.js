'use strict';

var path = require('path'),
	capitalize = require('capitalize'),
	moment = require('moment'),
	CoreExtension,
	CoreUtilities,
	CoreController,
	appSettings,
	appenvironment,
	logger,
	jwtTokenSecret,
	loginExtSettings,
	oauth2serverExtSettings,
	passport,
	mongoose,
	Client,
	Token;
var jwt = require('jwt-simple');
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

var get_jwt_token = function(req,res){
	var username = req.body.username || req.headers.username;
	var clientId = req.body.clientid || req.headers.clientid;
	var password = req.body.password || req.headers.password;
	var userQuery = {
			$or: [{
				username: {
					$regex: new RegExp(username, 'i')
				}
			}, {
				email: {
					$regex: new RegExp(username, 'i')
				}
			}]
		};
	var clientApp;
	var entitytype = req.body.entitytype || req.headers.entitytype ||'user';
	var UserModelToQuery = mongoose.model(capitalize(entitytype));
	var saveToken = function(user,client){
		return new Promise(function(resolve,reject){
			var expires = moment().add( oauth2serverExtSettings.jwt.expire_duration, oauth2serverExtSettings.jwt.expire_period).valueOf();	
			var jwtTokenSecret = (oauth2serverExtSettings.jwt.custom_secret)? oauth2serverExtSettings.jwt.custom_secret : appSettings.session_secret;			
			var jwt_token = jwt.encode(
				{
					iss: user._id,
					ent: user.entitytype,
					exp: expires
				}, 
				jwtTokenSecret
			);	
			var token = new Token({
	      client_id: client.client_id,
	      user_id: user._id,
	      expires: new Date(expires),
	      user_entity_type: user.entitytype,
	      value: jwt_token,
	    });

	    // Save the access token and check for errors
	    token.save(function (err) {

	      if (err) { reject(err); }
	      else{
	      	resolve({jwt_token:jwt_token,expires:expires,user:user});
	      }

	    });
		});
	};
	var getUser = new Promise(function(resolve,reject){
		if (!username || !password){
			reject(new Error('Authentication error'));
		}
		else{
			UserModelToQuery.findOne(userQuery).select({
				'primaryasset.changes':0,
				'primaryasset.content':0,
				'assets.changes':0,
				'__v':0,
				'password':0,
				changes:0,
				content:0
			}).populate('tags categories contenttypes assets primaryasset').exec(function(err, user) {
	    	var validUserCallback = function(user){
	    		user.comparePassword(password, function(err, isMatch) {
		      	if (err) {	      		
		      		// an error has occured checking the password. For simplicity, just return a 401
							reject('Invalid Login Error');
		      	}
						if (isMatch) {	
							//clear login attempt blocks
							if (user.extensionattributes && user.extensionattributes.login && user.extensionattributes.login.attempts) {
								user.extensionattributes.login.attempts = 0;
								user.markModified('extensionattributes');
								user.save();
							}
							resolve(user);
						} 
						else {						
							// The password is wrong...
							reject('Invalid Login Authentication')
						}
					});
	  		};


				if (err ) {		
					// user cannot be found; may wish to log that fact here. For simplicity, just return a 401
					reject( new Error('Authentication error'));
				}
				else if (!user) {		
					// user cannot be found; may wish to log that fact here. For simplicity, just return a 401
					reject( new Error('Invalid Credentials'));
				}
				else if (loginExtSettings.timeout.use_limiter) {
					var limitAttemptUser = limitLoginAttempts(user);
					limitAttemptUser.save(function (err, updated) {
						if (err) {
							logger.error('Error updating user', err);
							reject(err);
						}
						else if (loginExtSettings.timeout.use_limiter && updated.extensionattributes.login.flagged) {
								loginAttemptsError(updated, function(err){
									reject(err);
								});
						}
						else {
							resolve(updated);
						}
					});
				}
				else {
					resolve(user);
				}
	    });
		}
	});
	Promise.resolve(Client.findOne({ client_id: clientId }))
		.then(function(client){
			clientApp = client;
    	if(!client){
    		throw new Error('Client not found');
    	}
    	else if(req.user){
    		return new Promise(function(resolve,reject){
    			resolve(req.user);
    		});
    	}
    	else{
    		return getUser;
    	}
		})
		.then(function(user){
  		return saveToken(user,clientApp);
		})
		.then(function(savedToken){
			// console.log('savedToken',savedToken)
			res.json({
				token : savedToken.jwt_token,
				expires : savedToken.expires,
				timeout : new Date(savedToken.expires),
				user : (typeof savedToken.user.toJSON() ==='function')?savedToken.user.toJSON():savedToken.user
			});
		})
		.catch(function(err){
			var errortosend = (appenvironment==='production')?{message:err.message}:err;
			logger.error(err);
			res.status(401).send(errortosend);
		});
};

var loginAttemptsError = function (user, done) {
	var templatepath = path.resolve(process.cwd(), loginExtSettings.timeout.view_path_relative_to_periodic);
	async.waterfall([
		function (cb) {
			var coreMailerOptions = {
				appenvironment: 'development',
				to: user.email,
				replyTo: 'Promise Financial [Do Not Reply] <no-reply@promisefin.com>',
				from: 'Promise Financial [Do Not Reply] <no-reply@promisefin.com>',
				subject: loginExtSettings.timeout.lockout_email_subject,
				emailtemplatefilepath: templatepath,
				emailtemplatedata: {
					data: user
				}
			};
			if (loginExtSettings.settings.adminbccemail || appSettings.adminbccemail) {
				coreMailerOptions.bcc = loginExtSettings.settings.adminbccemail || appSettings.adminbccemail;
			}
			CoreMailer.sendEmail(coreMailerOptions, function (err, status) {
				if (err) {
					cb(err, null);
				}
				else {
					cb(null, status);
				}
			});
		}
	], function (err, result) {
		if (err) {
			logger.error('Error sending email', err);
			return done(err);
		}
		else {
			logger.verbose('Sending account lockout email', result);
			return done(new Error('Your Account is Currently Blocked'), false, {
				message: 'Your Account is Currently Blocked'
			});
		}
	});
};

var limitLoginAttempts = function (user) {
	user.extensionattributes = user.extensionattributes || {};
	if (!user.extensionattributes.login) {
		user.extensionattributes.login = {
			attempts: 0,
			timestamp: moment(),
			flagged: false,
			freezeTime: moment()
		};
	}
	user.extensionattributes.login.attempts++;
	if (!user.extensionattributes.login.flagged) {
		if (moment(user.extensionattributes.login.timestamp).isBefore(moment().subtract(loginExtSettings.timeout.attempt_interval.time, loginExtSettings.timeout.attempt_interval.unit))) {
			user.extensionattributes.login.attempts = 1;
			user.extensionattributes.login.timestamp = moment();
		}
		else if (user.extensionattributes.login.attempts >= loginExtSettings.timeout.attempts && moment(user.extensionattributes.login.timestamp).isAfter(moment().subtract(loginExtSettings.timeout.attempt_interval.time, loginExtSettings.timeout.attempt_interval.unit))) {
			user.extensionattributes.login.flagged = true;
			user.extensionattributes.login.freezeTime = moment();
		}
	}
	else {
		if (moment(user.extensionattributes.login.freezeTime).isBefore(moment().subtract(loginExtSettings.timeout.freeze_interval.time, loginExtSettings.timeout.freeze_interval.unit))) {
			user.extensionattributes.login.attempts = 1;
			user.extensionattributes.login.timestamp = moment();
			user.extensionattributes.login.flagged = false;
			user.extensionattributes.login.freezeTime = moment();
		}
	}
	user.markModified('extensionattributes');
	return user;
};


var isJWTAuthenticated = function(req, res, next){
	var UserModelToQuery;
	var jwtTokenSecret = (oauth2serverExtSettings.jwt.custom_secret)? oauth2serverExtSettings.jwt.custom_secret : appSettings.session_secret;			
	
	/**
	 * Take the token from:
	 * 
	 *  - the POST value access_token
	 *  - the GET parameter access_token
	 *  - the x-access-token header
	 *    ...in that order.
	 */
	var token = (req.body && req.body.access_token) || req.query.access_token || req.headers['x-access-token'];
	// console.log('token',token);
	if (token) {

		try {
			var decoded = jwt.decode(token, jwtTokenSecret);

			if (decoded.exp <= Date.now()) {
				res.status(400).send('Access token has expired', 400);				
			}
			else{
				UserModelToQuery = mongoose.model(capitalize(decoded.ent));
				UserModelToQuery.findOne({ '_id': decoded.iss }, function(err, user){
					if (!err) {					
						req.user = user									
						return next();
					}
				})
			}
		} 
		catch (err) {			
			return next();
		}
	}
	else {
		next();
	}
}

var checkApiAuthentication = [
	function(req,res,next){
		req.controllerData = req.controllerData || {};
		req.controllerData.skip_session = true;
		next();
	},
	isJWTAuthenticated,
	function(req,res,next){
		if(req.user){
			next();
		}
		else{
			return passport.authenticate('bearer', { session: false })(req,res,next);
		}
	}];

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
	appenvironment = resources.settings.application.environment;
	oauth2serverExtSettings = resources.app.controller.extension.oauth2server.settings;
	loginExtSettings = resources.app.controller.extension.login.auth.loginExtSettings;
	configurePassport();
	return {
		set_client_data : set_client_data,
		isClientAuthenticated : passport.authenticate('client-basic', { session : false }),
		isBearerAuthenticated : passport.authenticate('bearer', { session: false }),
		ensureApiAuthenticated :checkApiAuthentication,
		isJWTAuthenticated: isJWTAuthenticated,
		isAuthenticated : passport.authenticate([ 'bearer'], { session: false }),
		get_user_profile: get_user_profile,
		get_jwt_token: get_jwt_token
	}
};

module.exports = controller;

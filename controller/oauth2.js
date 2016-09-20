'use strict';

var oauth2orize = require('oauth2orize'),
  CoreExtension,
  CoreUtilities,
  CoreController,
  appSettings,
  authorization,
  token,
  decision,
  logger,
  passport,
  mongoose,
  Client,
  Code,
  Token;
var server = oauth2orize.createServer();


/**
 * Return a unique identifier with the given `len`.
 *
 *     utils.uid(10);
 *     // => "FDaS435D2z"
 *
 * @param {Number} len
 * @return {String}
 * @api private
 */
var uid = function (len) {
  var buf = []
    , chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    , charlen = chars.length;

  for (var i = 0; i < len; ++i) {
    buf.push(chars[getRandomInt(0, charlen - 1)]);
  }

  return buf.join('');
};

/**
 * Return a random int, used by `utils.uid()`
 *
 * @param {Number} min
 * @param {Number} max
 * @return {Number}
 * @api private
 */

var getRandomInt = function (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * configure oauth2server 
 */
var configureOAUTH2 = function () {
  /**
   * Register serialialization function
   * @param  {object} client    client from db
   * @param  {function} callback) {	            return callback(null, client._id);	} client id from db
   */
  server.serializeClient(function (client, callback) {
    return callback(null, client._id);
  });

  // Register deserialization function
  /**
   * Register deserialization function
   * @param  {string} id        client id
   * @param  {function} callback) {	                   Client.findOne({ _id: id } pull client from db by client_id
   * @return  {function} callback function  (err,         client) {	                          if            (err) { return callback(err); }	    return callback(null, client);	  });	} returns client object
   */
  server.deserializeClient(function (id, callback) {
    Client.findOne({ _id: id }, function (err, client) {
      if (err) { return callback(err); }
      return callback(null, client);
    });
  });

  /**
   * Register authorization code grant type
   * OAuth 2.0 specifies a framework that allows users to grant client applications limited access to their protected resources. It does this through a process of the user granting access, and the client exchanging the grant for an access token.
   * 
   * We are registering here for an authorization code grant type. We create a new authorization code model for the user and application client. It is then stored in MongoDB so we can access it later when exchanging for an access token.
   * @param  {object} client      client from db
   * @param  {string} redirectUri redirect path for user
   * @param  {object} user        user from db
   * @return {function}             callback function
   */
  server.grant(oauth2orize.grant.code(function (client, redirectUri, user, ares, callback) {
    // Create a new authorization code
    var code = new Code({
      value: uid(16),
      client_id: client._id,
      redirect_uri: redirectUri,
      user_id: user._id,
      user_username: user.username,
      user_email: user.email,
      user_entity_type: user.entitytype
    });

    // Save the auth code and check for errors
    code.save(function (err) {
      if (err) { return callback(err); }

      callback(null, code.value);
    });
  }));

  // Exchange authorization codes for access tokens
  server.exchange(oauth2orize.exchange.code(function (client, code, redirectUri, callback) {
    Code.findOne({ value: code }, function (err, authCode) {
      if (err) {
        return callback(err);
      }
      else if (authCode === undefined || !authCode) {
        return callback(null, false);
      }
      else if (client._id.toString() !== authCode.client_id.toString()) {
        return callback(null, false);
      }
      else if (redirectUri !== authCode.redirect_uri) {
        return callback(null, false);
      }
      else {
        // Delete auth code now that it has been used
        authCode.remove(function (err) {
          if (err) {
            return callback(err);
          }
          else {
            // Create a new access token
            var token = new Token({
              value: uid(256),
              client_id: authCode.client_id,
              user_id: authCode.user_id,
              user_username: authCode.user_username,
              user_email: authCode.user_email,
              user_entity_type: authCode.user_entity_type
            });

            // Save the access token and check for errors
            token.save(function (err) {
              // console.log('callback',callback);
              if (err) { return callback(err); }
              else {
                return callback(null, token);
              }
            });
          }
        });
      }

    });
  }));



  /**
   * oauth middle function for authorization view for approving account access
   * User authorization endpoint
   * This endpoint, initializes a new authorization transaction. It finds the client requesting access to the user’s account and then renders the dialog ejs view we created eariler.
   */
  authorization = [
    server.authorization(function (clientId, redirectUri, callback) {
      // console.log('looking up client',clientId, redirectUri);
      Client.findOne({ client_id: clientId }, function (err, client) {
        if (err) { return callback(err); }

        return callback(null, client, redirectUri);
      });
    }),
    function (req, res) {
      var viewtemplate = {
          viewname: 'client/dialog',
          themefileext: appSettings.templatefileextension,
          extname: 'periodicjs.ext.oauth2server'
        },
        viewdata = {
          pagedata: {
            title: 'OAUTH 2 Authorization',
            toplink: '&raquo; OAUTH 2 Authorization',
            extensions: CoreUtilities.getAdminMenu()
          },
          transactionID: req.oauth2.transactionID,
          user: req.user,
          client: req.oauth2.client
        };

      CoreController.renderView(req, res, viewtemplate, viewdata);
    }
  ];

  /**
   * Application client token middleware exchange endpoint
   * This endpoint is setup to handle the request made by the application client after they have been granted an authorization code by the user. The server.token() function will initiate a call to the server.exchange() function we created earlier.
  */
  token = [
    server.token(),
    server.errorHandler()
  ];

  /**
   * User decision middleware endpoint
   * This endpoint is setup to handle when the user either grants or denies access to their account to the requesting application client. The server.decision() function handles the data submitted by the post and will call the server.grant() function we created earlier if the user granted access.
  */
  decision = [
    server.decision()
  ]
};



/**
 * oauth2server oauth2 server controller
 * @module oauth2serverController
 * @{@link https://github.com/typesettin/periodicjs.ext.oauth2server}
 * @author Yaw Joseph Etse
 * @copyright Copyright (c) 2016 Typesettin. All rights reserved.
 * @license MIT
 * @requires module:async
 * @requires module:path
 * @requires module:moment
 * @requires module:capitalize
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
  Code = resources.mongoose.model('Code');
  Client = resources.mongoose.model('Client');
  Token = resources.mongoose.model('Token');

  configureOAUTH2();
  return {
    isClientAuthenticated: passport.authenticate('client-basic', { session: false }),
    isBearerAuthenticated: passport.authenticate('bearer', { session: false }),
    authorization: authorization,
    token: token,
    decision: decision
  }
};

module.exports = controller;

'use strict';
const utilities = require('../utilities');
const server = utilities.server;
const oauth2server = utilities.oauth2server;

/**
 * render authorization dialog
 * 
 * @param {any} req 
 * @param {any} res 
 */
function authorizationView(req, res) {
  // console.log('req.session in authorization', req.session);
  var viewtemplate = {
    viewname: 'client/dialog',
    // themefileext: appSettings.templatefileextension,
    extname: 'periodicjs.ext.oauth2server'
  },
  viewdata = {
    pagedata: {
      // title: 'OAUTH 2 Authorization',
      // toplink: '&raquo; OAUTH 2 Authorization',
      // extensions: CoreUtilities.getAdminMenu(),
      transactionID: req.oauth2.transactionID,
      client: req.oauth2.client,
      // authorize: req.session.authorize, //TODO @markewaldron encrypt
    },
    transactionID: req.oauth2.transactionID,
    user: req.user,
    client: req.oauth2.client,
    authorize: req.session.authorize, //TODO @markewaldron encrypt
  };
  // req.controllerData
  // CoreController.renderView(req, res, viewtemplate, viewdata);
  periodic.core.controller.render(req, res, viewtemplate, viewdata);
}

/**
 * oauth middle function for authorization view for approving account access
 * User authorization endpoint
 * This endpoint, initializes a new authorization transaction. It finds the client requesting access to the user’s account and then renders the dialog ejs view we created eariler.
 */
const authorization = [
  server.authorization(oauth2server.authorization),
  authorizationView,
];

/**
 * Application client token middleware exchange endpoint
 * This endpoint is setup to handle the request made by the application client after they have been granted an authorization code by the user. The server.token() function will initiate a call to the server.exchange() function we created earlier.
 */
const token = [
  server.token(),
  server.errorHandler(),
];

/**
 * User decision middleware endpoint
 * This endpoint is setup to handle when the user either grants or denies access to their account to the requesting application client. The server.decision() function handles the data submitted by the post and will call the server.grant() function we created earlier if the user granted access.
 */
const decision = [
  (req, res, next) => {
    console.log('before server decision');
    next();
  },
  server.decision(),
  (req, res, next) => {
    console.log('AFTER server decision');
    next();
  }
];
module.exports = {
  token,
  decision,
  authorization,
  authorizationView,
};
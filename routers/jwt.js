'use strict';

const periodic = require('periodicjs');
// const path = require('path');
const jwtRouter = periodic.express.Router();
// const periodicRoutingUtil = periodic.utilities.routing;
// const apiRoute = periodicRoutingUtil.route_prefix('api');
// const apiRouter = require('./api');
// const jwtRoute = periodicRoutingUtil.route_prefix('jwt');
// const jwtRouter = require('./jwt');
// const clientRoute = periodicRoutingUtil.route_prefix(path.join(adminRoute, 'oauth/client'));
// const clientRouter = require('./client');
const controllers = require('../controllers');
// authRouter.get('/test', controllers.auth.ensureAuthenticated, controllers.auth.testView);

jwtRouter.get('/profile', controllers.auth.getJWTProfile);
jwtRouter.post('/profile', controllers.auth.getJWTProfile);
jwtRouter.get('/profile', controllers.auth.isJWTAuthenticated, controllers.auth.getUserProfile);
jwtRouter.post('/profile', controllers.auth.isJWTAuthenticated, controllers.auth.getUserProfile);

module.exports = jwtRouter;
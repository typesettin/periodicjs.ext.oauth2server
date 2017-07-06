'use strict';

const periodic = require('periodicjs');
const path = require('path');
const adminRoute = periodic.locals.extensions.get('periodicjs.ext.passport');
const reactAdminRoute = '/';
const extensionRouter = periodic.express.Router();
const periodicRoutingUtil = periodic.utilities.routing;
const apiRoute = periodicRoutingUtil.route_prefix('api');
const apiRouter = require('./api');
const jwtRoute = periodicRoutingUtil.route_prefix('jwt');
const jwtRouter = require('./jwt');
const clientRoute = periodicRoutingUtil.route_prefix(path.join(adminRoute, 'oauth/client'));
const clientRouter = require('./client');
const reactadminRouter = require('./reactadmin');

apiRouter.use(jwtRoute, jwtRouter);
extensionRouter.use(apiRoute, apiRouter);
extensionRouter.use(clientRoute, clientRouter);
extensionRouter.use(reactAdminRoute, reactadminRouter);

module.exports = extensionRouter;
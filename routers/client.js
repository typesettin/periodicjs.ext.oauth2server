'use strict';

const periodic = require('periodicjs');
const clientNew = periodic.controllers.core.get('standard_client').protocol.api.initialize.NEW;
const clientRouter = periodic.routers.get('standard_client').router;
const controllers = require('../controllers');

clientRouter.post('/new', controllers.auth.setClientData, clientNew);

module.exports = clientRouter;
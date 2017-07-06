'use strict';

const periodic = require('periodicjs');
const jwtRouter = periodic.express.Router();
const controllers = require('../controllers');

jwtRouter.get('/profile', controllers.auth.getJWTProfile);
jwtRouter.post('/profile', controllers.auth.getJWTProfile);
jwtRouter.get('/profile', controllers.auth.isJWTAuthenticated, controllers.auth.getUserProfile);
jwtRouter.post('/profile', controllers.auth.isJWTAuthenticated, controllers.auth.getUserProfile);
jwtRouter.get('/token', controllers.auth.getJWTtoken);
jwtRouter.post('/token', controllers.auth.getJWTtoken);

module.exports = jwtRouter;
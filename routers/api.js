'use strict';

const periodic = require('periodicjs');
const apiRouter = periodic.express.Router();
const controllers = require('../controllers');

apiRouter.get('/oauth2async/profile',
  controllers.auth.ensureApiAuthenticated,
  controllers.auth.getUserProfile);
apiRouter.post('/oauth2/token',
  controllers.auth.isClientAuthenticated,
  controllers.oauth2.token);

module.exports = apiRouter;
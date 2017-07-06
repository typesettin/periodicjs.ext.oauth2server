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
apiRouter.route('/oauth2/authorize')
  .get(controllers.auth.ensureAuthenticated,
    // uacController.loadUserRoles,
    // uacController.check_user_access,
    controllers.oauth2.authorization)
  .post(controllers.auth.ensureAuthenticated,
    controllers.oauth2.decision);
apiRouter.get('/oauth2/profile',
  controllers.auth.ensureApiAuthenticated,
  controllers.auth.getUserProfile);


module.exports = apiRouter;
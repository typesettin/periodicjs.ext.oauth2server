'use strict';

const periodic = require('periodicjs');
const reactAdminRouter = periodic.express.Router();
const reactAdminOauthSeverRouter = periodic.express.Router();
const clientRouter = periodic.routers.get('standard_client').router;
const codeRouter = periodic.routers.get('standard_code').router;
const tokenRouter = periodic.routers.get('standard_token').router;
const controllers = require('../controllers');

reactAdminRouter.route('/api/oauth2async/signin')
  .get(controllers.auth.asyncLogin)
  .post(controllers.auth.asyncProcessLogin);
reactAdminRouter.route('/api/oauth2async/authorize')
  .get(controllers.auth.forceSession,
    controllers.auth.ensureApiAuthenticated,
    controllers.auth.forceAPIReqLogin,
    // uacController.loadUserRoles,
    // uacController.check_user_access,
    controllers.oauth2.authorization)
  .post(controllers.auth.forceSession,
    controllers.auth.ensureApiAuthenticated,
    controllers.auth.forceAPIReqLogin,
    controllers.auth.fakeSessions,
    controllers.oauth2.decision);
reactAdminRouter.post('/api/oauth2/token',
  controllers.auth.isClientAuthenticated,
  controllers.oauth2.token);
reactAdminOauthSeverRouter.use(controllers.auth.ensureApiAuthenticated);
reactAdminOauthSeverRouter.use(controllers.auth.asyncUser, clientRouter);
reactAdminOauthSeverRouter.use(codeRouter);
reactAdminOauthSeverRouter.use(tokenRouter);
reactAdminRouter.use('/extension/oauth2server', reactAdminOauthSeverRouter);

module.exports = reactAdminRouter;
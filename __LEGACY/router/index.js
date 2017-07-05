'use strict';

const path = require('path');

module.exports = function(periodic) {
  const ExtensionRouter = periodic.express.Router();
  const oauth2serverRouter = require(path.resolve(__dirname, './oauth2server'))(periodic);
  const reUtilPath = path.join(__dirname, '../../../node_modules/periodicjs.ext.reactadmin/utility/locals.js');
  let reactadmin = { manifest_prefix: '/r-admin' };

  for (var x in periodic.settings.extconf.extensions) {
    if (periodic.settings.extconf.extensions[x].name === 'periodicjs.ext.reactadmin') {
      const reactadminUtil = require(reUtilPath)(periodic).app.locals.extension.reactadmin;
      reactadmin = reactadminUtil;
    }
  }
  ExtensionRouter.use(`${reactadmin.manifest_prefix}extension/oauth2server`, oauth2serverRouter);

  return ExtensionRouter;
};
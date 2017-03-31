'use strict';
const path = require('path');

const autoManifests = require(path.join(__dirname, '../../../../../node_modules/periodicjs.ext.reactadmin/utility/detail_views/lib/manifest.js'));
const clientSchema = require('../../../model/client');
const codeSchema = require('../../../model/code');
const tokenSchema = require('../../../model/token');
const schemas = {
  client: clientSchema,
  code: codeSchema,
  token: tokenSchema,
};
// console.log({ schemas });
// const customerScheme = require('../../../utility/reference/dsa/models/customerdata');
// const customerSchema = new customerScheme().attributes;
// const customer = new customerSchema().schema
// console.log( {customerSchema});
// console.log('new customerScheme()',new customerScheme());

module.exports = (periodic) => {
  let reactadmin = periodic.app.controller.extension.reactadmin;
  let extsettings = Object.assign({},
    periodic.app.locals.extension.reactadmin.settings, {
    extension_overrides: Object.assign({},
      periodic.app.locals.extension.reactadmin.settings.extension_overrides,
      {
      // customIndexTables: { dblogger:tableHeader, },
    //   customCardProps: CONSTANTS.styles.cardProps,
    //   // customEntitytypeElements: customEntityFormElements,
    //   // customIndexPageData: customEntityPageData.pageIndexData,
    //   customIndexTabs: subTabsReduced,
    //   customIndexHeader: headerTabsReduced,
    //   // customDetailPageData: customEntityPageData.pageDetailData,
    //   customDetailTabs: subTabsReduced,
    //   customDetailHeader: headerTabsReduced,
      // customDetailEditor: {
      //   dblogger: {
      //     advanced: true,
      //     basic: false,
      //   },
      // },
      }
    ),
  });
  const oauthManifests = autoManifests(
    schemas,
    {
      prefix: `${reactadmin.manifest_prefix}extension/oauth2server`,
      // dbname:'logger',
      extsettings,
    });
  // console.log({ oauthManifests, });
  return {
    containers: oauthManifests,
  };
};
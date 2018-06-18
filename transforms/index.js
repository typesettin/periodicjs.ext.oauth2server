'use strict';
const periodic = require('periodicjs');
const utilities = require('../utilities');

function createClientPreTransform(req) {
  return new Promise((resolve, reject) => {
    req = periodic.locals.extensions.get('periodicjs.ext.admin').data.fixGenericReqBody(req);
    utilities.client.preClientCreate(req.body)
      .then(newClient => {
        req.body = Object.assign(req.body, newClient);
        resolve(req);
      })
      .catch(reject);
  });
}

module.exports = {
  pre: {
    POST: {
      '/b-admin/data/standard_clients': [createClientPreTransform, ],
      '/contentdata/standard_clients': [createClientPreTransform, ],
    },
  },
  post: {},
};
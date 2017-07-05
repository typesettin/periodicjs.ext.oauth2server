'use strict';
const periodic = require('periodicjs');
function testPreTransform(req) {
  return new Promise((resolve, reject) => {
    periodic.logger.silly('sample pre transfrom', req.params.id);
    resolve(req);
  });
}
function testPostTransform(req) {
  return new Promise((resolve, reject) => {
    periodic.logger.silly('sample post transfrom', req.params.id);
    resolve(req);
  });
}

<<<<<<< HEAD
=======
/*
clientSchema.pre('save', function (next, done) {
  // let client_id;
  // let client_secret;
  let salt = crypto.randomBytes(16).toString('base64');

  if (!this.user_id) {
    next(new Error('Invalid User Id'));
  }
  else if (!this.name) {
    next(new Error('Invalid Name'));
  }
  else {
    // console.log('clientSchema pre validation');
    let crypto_client_id = () => {
      return new Promise((resolve, reject) => {
        // console.log('this.user_id',this.user_id);
        crypto.pbkdf2(this.user_id + new Date(), salt, 10, 16, 'sha512', (err, key) => {
          if (err) {
            reject(err);
          }
          else {
            resolve(key.toString('hex'));
          }
        });
      });
    };
    let crypto_client_secret = () => {
      return new Promise((resolve, reject) => {
        crypto.pbkdf2(this.random + new Date(), salt, 10, 16, 'sha512', (err, key) => {
          if (err) {
            reject(err);
          }
          else {
            resolve(key.toString('hex'));
          }
        });
      });
    };
    Promise.all([crypto_client_id(), crypto_client_secret()])
      .then((client_data) => {
        console.log('client_data', client_data);
        this.client_id = client_data[0];
        this.client_secret = client_data[1];
        next();
      })
      .catch(function (err) {
        next(err);
      });
  }
});
 */

>>>>>>> ed410f80062f61e650a2bd0f8f2437f134164a13
module.exports = {
  pre: {
    GET: {
      '/some/route/path/:id':[testPreTransform]
    },
    PUT: {
    }
  },
  post: {
    GET: {
      '/another/route/test/:id':[testPostTransform]
    },
    PUT: {
    }
  }
}
'use strict';
const periodic = require('periodicjs');
const crypto = require('crypto');
const ClientCoreData = periodic.data.get('standard_client');

function preClientCreate(options) {
  return new Promise((resolve, reject) => {
    try {
      // let client_id;
      // let client_secret;
      let salt = crypto.randomBytes(16).toString('base64');
      let newClient = Object.assign({
        random: Math.random(),
        title: options.name,
        user_entity_type:'user',
      }, options);
      /*if (!newClient.user_id) {
        reject(new Error('Invalid User Id'));
      }
      else */ if (!newClient.name) {
        reject(new Error('Invalid Name'));
      }
      else {
        // console.log('clientSchema pre validation');
        let crypto_client_id = () => {
          return new Promise((resolve, reject) => {
            // console.log('newClient.user_id',newClient.user_id);
            crypto.pbkdf2(newClient.user_id + new Date(), salt, 10, 16, 'sha512', (err, key) => {
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
            crypto.pbkdf2(newClient.random + new Date(), salt, 10, 16, 'sha512', (err, key) => {
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
            const [ client_id, client_secret ] = client_data;
            console.log({ client_data, client_id, client_secret, });
            // newClient.client_id = client_data[0];
            // newClient.client_secret = client_data[1];
            resolve(Object.assign(newClient, { client_id, client_secret }));
          })
          .catch(reject);
      }
    } catch (e) {
      reject(e);
    }
  });
}

function create(options) {
  return new Promise((resolve, reject) => {
    try {
      let newClient = {};
      if (typeof options === 'string') {
        newClient.name = options;
      } else {
        newClient = Object.assign({}, options);
      }
      preClientCreate(newClient)
        .then(client => { 
          return ClientCoreData.create({ newdoc: client });
        })
        .catch(reject);
    } catch (e) {
      reject(e);
    }
  });
}


module.exports = {
  create,
};
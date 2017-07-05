# periodicjs.ext.oauth2server [![Coverage Status](https://coveralls.io/repos/github/githubUserOrgName/periodicjs.ext.oauth2server/badge.svg?branch=master)](https://coveralls.io/github/githubUserOrgName/periodicjs.ext.oauth2server?branch=master) [![Build Status](https://travis-ci.org/githubUserOrgName/periodicjs.ext.oauth2server.svg?branch=master)](https://travis-ci.org/githubUserOrgName/periodicjs.ext.oauth2server)

  A simple extension.

  [API Documentation](https://github.com/githubUserOrgName/periodicjs.ext.oauth2server/blob/master/doc/api.md)

  ## Usage

  ### CLI TASK

  You can preform a task via CLI
  ```
  $ cd path/to/application/root
  ### Using the CLI
  $ periodicjs ext periodicjs.ext.oauth2server hello  
  ### Calling Manually
  $ node index.js --cli --command --ext --name=periodicjs.ext.oauth2server --task=hello 
  ```

  ## Configuration

  You can configure periodicjs.ext.oauth2server

  ### Default Configuration
  ```javascript
  {
    settings: {
      defaults: true,
    },
    databases: {
    },
  };
  ```


  ## Installation

  ### Installing the Extension

  Install like any other extension, run `npm run install periodicjs.ext.oauth2server` from your periodic application root directory and then run `periodicjs addExtension periodicjs.ext.oauth2server`.
  ```
  $ cd path/to/application/root
  $ npm run install periodicjs.ext.oauth2server
  $ periodicjs addExtension periodicjs.ext.oauth2server
  ```
  ### Uninstalling the Extension

  Run `npm run uninstall periodicjs.ext.oauth2server` from your periodic application root directory and then run `periodicjs removeExtension periodicjs.ext.oauth2server`.
  ```
  $ cd path/to/application/root
  $ npm run uninstall periodicjs.ext.oauth2server
  $ periodicjs removeExtension periodicjs.ext.oauth2server
  ```


  ## Testing
  *Make sure you have grunt installed*
  ```
  $ npm install -g grunt-cli
  ```

  Then run grunt test or npm test
  ```
  $ grunt test && grunt coveralls #or locally $ npm test
  ```
  For generating documentation
  ```
  $ grunt doc
  $ jsdoc2md commands/**/*.js config/**/*.js controllers/**/*.js  transforms/**/*.js utilities/**/*.js index.js > doc/api.md
  ```
  ## Notes
  * Check out https://github.com/typesettin/periodicjs for the full Periodic Documentation
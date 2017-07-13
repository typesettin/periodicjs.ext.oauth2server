# periodicjs.ext.oauth2server [![Coverage Status](https://coveralls.io/repos/github/typesettin/periodicjs.ext.oauth2server/badge.svg?branch=master)](https://coveralls.io/github/typesettin/periodicjs.ext.oauth2server?branch=master) [![Build Status](https://travis-ci.org/typesettin/periodicjs.ext.oauth2server.svg?branch=master)](https://travis-ci.org/typesettin/periodicjs.ext.oauth2server)

An extension that creates an OAuth 2 Server that uses oauth2orize and http-bearer for server-to-server authenication and jwt-token-bearer for mobile/javascript client based authentication.

  [API Documentation](https://github.com/typesettin/periodicjs.ext.oauth2server/blob/master/doc/api.md)

  ## Usage



[API Documentation](https://github.com/typesettin/periodicjs.ext.oauth2server/blob/master/doc/api.md)

## Usage

Creating an OAuth2 server allows for your periodic application to restrict access to API endpoints for the authorized user or authorized applications.

### Step 1: Installing the Extension

Install like any other extension, run `npm run install periodicjs.ext.oauth2server` from your periodic application directory.

### Step 2: Creating Application Clients

Login into Async Admin, in the navigation sidebar *Extensions -> OAuth 2 Server -> Clients*

Name your new Application Client, a token_id and token_secret will be automatically generated. 

### Step 3: Obtain an Access Token

Navigate to `/api/oauth2/authorize`, login in and approve access to your account for your application.

Example:
 `http://localhost:8786/api/oauth2/authorize?client_id=[client token_id]&response_type=code&redirect_uri=[your redirect url, e.g.: http://localhost:3000]`

If you approve access, you'll be granted a new authorization code to obtain a new OAUTH 2.0 token.

Then, you'll have to post (using http basic auth with your client token_id and client secret)

 * code: [your authorization code]
 * grant_type: 'authorization_code'
 * redirect_url: [your redirect url]

You'll then recieve an OAUTH Token to make API requests with (With HTTP Bearer Authentication)

#### For mobile applications using JWT Tokens

Send a get request to `/api/jwt/token`

With either request headers or a request body containing:
 * username
 * clientid
 * password
 * entitytype (optional if using a different user account model)

You'll then recieve a JWT access_token to make API requests with in either the request body or `x-access-token` header

### Step 4: Make authenticated Requests

* Add `periodic.app.controller.extension.oauth2server.auth.ensureApiAuthenticated` middleware before any API route that requires user authentication.
* Add `periodic.app.controller.extension.oauth2server.auth.isClientAuthenticated` middleware before any API route that requires application client authentication.

#### A quick note on security

When implementing an OAuth2 server you MUST make sure to secure your application. This means running all OAuth2 endpoints over HTTPS, this extension also hashes the client secret, authorization code, and access token. 

  ## CLI COMMANDS

  ### Create Client
  ```
  $ cd path/to/application/root
  ### Using the CLI
  $ periodicjs ext periodicjs.ext.oauth2server createClient my-oauth2-client  
  $ periodicjs ext periodicjs.ext.oauth2server createclient my-oauth2-client  
  $ periodicjs ext periodicjs.ext.oauth2server cc my-oauth2-client  
  ### Calling Manually
  $ node index.js --cli --command --ext --name=periodicjs.ext.oauth2server --task=createClient --args=my-oauth2-client
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

  Install like any other extension, run `npm run install periodicjs.ext.oauth2server` from your periodic application root directory and then you would normally run `periodicjs addExtension periodicjs.ext.oauth2server` but this is handled by the npm post install script.
  ```
  $ cd path/to/application/root
  $ npm run install periodicjs.ext.oauth2server
  $ periodicjs addExtension periodicjs.ext.oauth2server //handled by npm post install
  ```
  ### Uninstalling the Extension

  Run `npm run uninstall periodicjs.ext.oauth2server` from your periodic application root directory and then you would normally run `periodicjs removeExtension periodicjs.ext.oauth2server` but this is handled by the npm post uninstall script.
  ```
  $ cd path/to/application/root
  $ npm run uninstall periodicjs.ext.oauth2server
  $ periodicjs removeExtension periodicjs.ext.oauth2server //handled by npm post uninstall
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
  * Special thanks to [scott k smith](http://scottksmith.com/blog/2014/07/02/beer-locker-building-a-restful-api-with-node-oauth2-server/)
  * TODOS
    * reset login attempts
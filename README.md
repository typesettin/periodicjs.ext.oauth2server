# periodicjs.ext.oauth2server

An extension that creates an OAuth 2 Server that uses oauth2orize and http-bearer for server-to-server authenication and jwt-token-bearer for mobile/javascript client based authentication.

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

You'll then recieve a JWT access_token to make API requests w

### Step 4: Make authenticated Requests

* Add `periodic.app.controller.extension.oauth2server.auth.ensureApiAuthenticated` middleware before any API route that requires user authentication.
* Add `periodic.app.controller.extension.oauth2server.auth.isClientAuthenticated` middleware before any API route that requires application client authentication.

#### A quick note on security

When implementing an OAuth2 server you MUST make sure to secure your application. This means running all OAuth2 endpoints over HTTPS, this extension also hashes the client secret, authorization code, and access token. 

## Installation

```
$ npm install periodicjs.ext.oauth2server
```

## Configure

The extension configuration is located in `content/config/extensions/periodicjs.ext.oauth2server/settings.json`

```javascript
//default settings
	jwt: {
		expire_period :"days",
		expire_duration :8,
		custom_secret :false
	}
```

By default jwt tokens will use the same secret that your periodic application is using for cookie parsing, otherwise you can set environment specific secrets

##Development
*Make sure you have grunt installed*
```
$ npm install -g grunt-cli
```

Then run grunt watch
```
$ grunt watch
```
For generating documentation
```
$ grunt doc
$ jsdoc2md controller/**/*.js index.js install.js uninstall.js > doc/api.md
```
##Notes
* Check out https://github.com/typesettin/periodicjs for the full Periodic Documentation
* Special thanks to [scott k smith](http://scottksmith.com/blog/2014/07/02/beer-locker-building-a-restful-api-with-node-oauth2-server/)
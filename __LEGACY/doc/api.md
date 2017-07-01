#Index

**Modules**

* [periodicjs.ext.clouduploads](#periodicjs.ext.module_clouduploads)
* [oauth2serverController](#module_oauth2serverController)
* [oauth2serverController](#module_oauth2serverController)

**Functions**

* [configurePassport()](#configurePassport)
* [set_client_data(req, res, next)](#set_client_data)
* [get_user_profile(req, res)](#get_user_profile)
* [get_jwt_token(req, res)](#get_jwt_token)
  * [get_jwt_token~getUser](#get_jwt_token..getUser)
  * [get_jwt_token~saveToken(user, client)](#get_jwt_token..saveToken)
* [loginAttemptsError(user, done)](#loginAttemptsError)
* [limitLoginAttempts(user)](#limitLoginAttempts)
* [isJWTAuthenticated(req, res, next)](#isJWTAuthenticated)
  * [isJWTAuthenticated~token](#isJWTAuthenticated..token)
* [uid(len)](#uid)
* [getRandomInt(min, max)](#getRandomInt)
* [configureOAUTH2()](#configureOAUTH2)
  * [configureOAUTH2~authorization](#configureOAUTH2..authorization)
  * [configureOAUTH2~token](#configureOAUTH2..token)
  * [configureOAUTH2~decision](#configureOAUTH2..decision)

**Members**

* [checkApiAuthentication](#checkApiAuthentication)
 
<a name="periodicjs.ext.module_clouduploads"></a>
#periodicjs.ext.clouduploads
An asset upload manager that uses pkgcloud to upload to the various cloud service providers (amazon s3, rackspace cloud files

**Params**

- periodic `object` - variable injection of resources from current periodic instance  

**Author**: Yaw Joseph Etse  
**License**: MIT  
**Copyright**: Copyright (c) 2014 Typesettin. All rights reserved.  
<a name="module_oauth2serverController"></a>
#oauth2serverController
oauth2server auth controller

**Params**

- resources `object` - variable injection from current periodic instance with references to the active logger and mongo session  

**Author**: Yaw Joseph Etse  
**License**: MIT  
**Copyright**: Copyright (c) 2016 Typesettin. All rights reserved.  
<a name="module_oauth2serverController"></a>
#oauth2serverController
oauth2server oauth2 server controller

**Params**

- resources `object` - variable injection from current periodic instance with references to the active logger and mongo session  

**Author**: Yaw Joseph Etse  
**License**: MIT  
**Copyright**: Copyright (c) 2016 Typesettin. All rights reserved.  
<a name="configurePassport"></a>
#configurePassport()
Add two more strategies to passport for client-basic authentication, this allows you to use HTTP Basic Auth with your client token id and client secret to obtain an authorization code

<a name="set_client_data"></a>
#set_client_data(req, res, next)
sets additional request variables for creating new client applications, so can query the correct user collection in db

**Params**

- req `object` - express request object  
- res `object` - express response object  
- next `function` - express middleware callback function  

<a name="get_user_profile"></a>
#get_user_profile(req, res)
basic route to test authenticated request that returns user id, entitytype, username and created dates

**Params**

- req `object` - express request object  
- res `object` - express response object  

<a name="get_jwt_token"></a>
#get_jwt_token(req, res)
authorization request to obtain a JWT access token (requires, username, password, clientid, entitytype (optional user entitytype))

**Params**

- req `object` - express request object  
- res `object` - express response object  

<a name="loginAttemptsError"></a>
#loginAttemptsError(user, done)
send error if user is locked out

**Params**

- user `object` - user from db  
- done `function` - callback function  

**Returns**: `function` - callback function  
<a name="limitLoginAttempts"></a>
#limitLoginAttempts(user)
update user to mark login attempts

**Params**

- user `object` - user from db  

**Returns**: `object` - updated user  
<a name="isJWTAuthenticated"></a>
#isJWTAuthenticated(req, res, next)
looks up valid jwt tokens and sets user variable

**Params**

- req `object` - express request object  
- res `object` - express response object  
- next `function` - express middleware callback function  

<a name="uid"></a>
#uid(len)
Return a unique identifier with the given `len`.

    utils.uid(10);
    // => "FDaS435D2z"

**Params**

- len `Number`  

**Returns**: `String`  
<a name="getRandomInt"></a>
#getRandomInt(min, max)
Return a random int, used by `utils.uid()`

**Params**

- min `Number`  
- max `Number`  

**Returns**: `Number`  
<a name="configureOAUTH2"></a>
#configureOAUTH2()
configure oauth2server

<a name="checkApiAuthentication"></a>
#checkApiAuthentication
express middleware for ensuring either HTTP Bearer or JWT access token


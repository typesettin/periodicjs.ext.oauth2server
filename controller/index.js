'use strict';
module.exports = function (resources) {
  const Client = resources.mongoose.model('Client');
  const Code = resources.mongoose.model('Code');
  const Token = resources.mongoose.model('Token');
  const CoreController = resources.core.controller;
  let getModelSettings = (options) => {
    let { model, model_name, searchfields, } = options;
    return {
      model_name,
      model,
      controllerOptions: {
        model,
      },
      searchfields,
      use_admin_menu: false,
      use_plural_view_names: true,
      // load_model_population: 'asset',
      // load_multiple_model_population: 'asset',
      use_full_data: true,
      extname: 'periodicjs.ext.oauth2server'
    };
  };
  let clientController = CoreController.controller_routes(getModelSettings({ model: Client, model_name: 'client', searchfields: [ 'name', 'title', 'ip_addresses' ] }));
  let codeController = CoreController.controller_routes(getModelSettings({ model: Code, model_name: 'code', searchfields: [ 'user_email', 'value', 'client_id', 'redirect_uri' ] }));
  let tokenController = CoreController.controller_routes(getModelSettings({ model: Code, model_name: 'code', searchfields: [ 'user_email', 'value', 'client_id', 'redirect_uri' ] }));
  return {
    client: clientController,
    code: codeController,
    token: tokenController,
  };
};
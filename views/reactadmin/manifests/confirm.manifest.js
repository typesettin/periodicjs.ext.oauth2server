'use strict';
const path = require('path');

module.exports = (periodic) => {
  let reactadmin = periodic.app.controller.extension.reactadmin;

  return {
    containers: {
      [`${reactadmin.manifest_prefix}api/oauth2/authorize`]: {
        "layout": {
          "component": "Hero",
          "props": {
            "size": "isFullheight"
          },
          "children": [{
            "component": "HeroBody",
            "props": {},
            "children": [{
              "component": "Container",
              "props": {},
              "children": [{
                "component": "Columns",
                "children": [{
                    "component": "Column",
                    "props": {
                      "size": "is3"
                    }
                  },
                  {
                    "component": "Column",
                    "props": {},
                    "children": [{
                        "component": "Title",
                        "props": {
                          "style": {
                            "textAlign": "center"
                          }
                        },
                        "children": "Authorize Application"
                      },
                      {
                        "component": "ResponsiveForm",
                        asyncprops: {
                          formdata: ['oauth2data']
                        },
                        "props": {
                          "hiddenFields": [{
                            "form_name": "transaction_id",
                            "form_val": "transactionID"
                          }],
                          "cardForm": true,
                          "cardFormProps": {
                            "isFullwidth": true
                          },
                          "onSubmit": {
                            url: `${reactadmin.manifest_prefix}api/oauth2async/authorize?format=json`, //'/api/oauth2async/signin',
                            options: {
                              method: 'POST',
                            },
                            successCallback: 'func:this.props.redirect',
                          },
                          "footergroups": [{
                            "gridProps": {},
                            "formElements": [{
                              "type": "submit",
                              "value": "Submit Authorization",
                              "name": "authorization_request",
                              "passProps": {
                                "style": {
                                  "color": "#1fc8db"
                                }
                              },
                              "layoutProps": {}
                            }, ]
                          }],
                          "formgroups": [{
                              formElements: [{
                                type: 'layout',
                                value: {
                                  component: 'div',
                                  thisprops: {
                                    formdata: ['formdata']
                                  },
                                  bindprops: true,
                                  children: [{
                                      component: 'p',
                                      props: {
                                        style: {
                                          textAlign: 'center',
                                        }
                                      },
                                      bindprops: true,
                                      children: [{
                                          component: 'span',
                                          props: {
                                            style: {
                                              textAlign: 'center',
                                              fontWeight: 'bold',
                                            }
                                          },
                                          thisprops: {
                                            children: ['formdata', 'client', 'name']
                                          }
                                          // children: 'CLIENTNAME'
                                        },
                                        {
                                          component: 'span',
                                          children: ' is requesting '
                                        },
                                        {
                                          component: 'span',
                                          props: {
                                            style: {
                                              fontWeight: 'bold',
                                            }
                                          },
                                          children: 'full access '
                                        },
                                        {
                                          component: 'span',
                                          children: 'to your account'
                                        }
                                      ]
                                    },
                                    // {
                                    //   component: 'p',
                                    //   props: {
                                    //     style: {
                                    //       textAlign: 'center',
                                    //     }
                                    //   },
                                    //   children: 'Do you approve?'
                                    // }
                                  ]
                                }
                              }]
                            },
                            {
                              "gridProps": {},
                              "formElements": [{
                                  "type": "select",
                                  // "label": "Approve",
                                  "name": "Approve",
                                  value: 'approvalrequest',
                                  options: [
                                    { value: 'approvalrequest', label: 'Do you approve?', disabled: true },
                                    { value: 'Approve' },
                                    { value: 'Deny' }
                                  ],
                                  // value: 'Approve',
                                  "layoutProps": {
                                    // "horizontalform": true
                                  }
                                },
                                // {
                                //   "type": "radio",
                                //   "label": "Deny",
                                //   "name": "Approve",
                                //   value: 'Deny',
                                //   "layoutProps": {
                                //     // "horizontalform": true
                                //   }
                                // }
                              ]
                            },
                          ]
                        }
                      }
                    ]
                  },
                  {
                    "component": "Column",
                    "props": {
                      "size": "is3"
                    }
                  }
                ]
              }]
            }]
          }]
        },
        "resources": {
          oauth2data: `${reactadmin.manifest_prefix}api/oauth2async/authorize?format=json`,
        },
        "onFinish": "render"
      }
    },
  };
};
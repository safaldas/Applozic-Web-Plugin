(function(window){
    'use strict';
    function define_ALApiService(){
        var ALApiService = {};

        var MCK_APP_ID = "";
        var mckUtils = new MckUtils();

        var MCK_BASE_URL = "https://apps.applozic.com";
        var INITIALIZE_APP_URL = "/v2/tab/initialize.page";
        var MESSAGE_LIST_URL = "/rest/ws/message/list";
        var MESSAGE_SEND_URL = "/rest/ws/message/send";
        var GROUP_CREATE_URL = "/rest/ws/group/create";
        var GROUP_LIST_URL = "/rest/ws/group/list";
        var UPDATE_REPLY_MAP ="/rest/ws/message/detail"
        var MESSAGE_DELETE_URL = "/rest/ws/message/delete";
        var MESSAGE_READ_UPDATE_URL = "/rest/ws/message/read";
        var MESSAGE_DELIVERY_UPDATE_URL = "/rest/ws/message/delivered";    

        ALApiService.initServerUrl = function(serverUrl) {
            MCK_BASE_URL = serverUrl;
        }

        ALApiService.login = function(options) {
            MCK_APP_ID = options.alUser.applicationId;
            mckUtils.ajax({
                url: MCK_BASE_URL + INITIALIZE_APP_URL,
                type: 'post',
                data: w.JSON.stringify(options.alUser),
                contentType: 'application/json',
                headers: {
                    'Application-Key': MCK_APP_ID
                },
                success: function(response) {
                    if (options.success) {
                      options.success(response);
                    }
                },
                error: function(response) {
                    if (options.error) {
                      options.error(response);
                    }
                }
            });
        }

        ALApiService.getConversations = function(reqData, successCallback, errorCallback) {
            var response = new Object();
            mckUtils.ajax({
                url: MCK_BASE_URL + MESSAGE_LIST_URL + "?startIndex=0" + reqData,
                type: 'get',
                success: function(data) {
                    response.status = "success";
                    response.data = data;
                    if (successCallback) {
                        successCallback(response);
                    }
                    return;
                },
                error: function(xhr, desc, err) {
                    response.status = "error";
                    if (errorCallback) {
                        errorCallback(response);
                    }
                }
            });
        }

        ALApiService.sendMessage = function(options) {
            mckUtils.ajax({
                type: 'POST',
                url: MCK_BASE_URL + MESSAGE_SEND_URL,
                global: false,
                data: w.JSON.stringify(options.message),
                contentType: 'application/json',
                success: function(response) {
                    if (options.success) {
                      options.success(response);
                    }
                },
                error: function(response) {
                    if (options.error) {
                      options.error(response);
                    }
                }
            });
        }

        ALApiService.updateReplyMessage = function(options) {
            mckUtils.ajax({
                url: MCK_BASE_URL + UPDATE_REPLY_MAP,
                async: false,
                type: 'get',
                data: "keys=" + options.key,
                success: function(response) {
                    if (options.success) {
                      options.success(response);
                    }
                },
                error: function(response) {
                    if (options.error) {
                      options.error(response);
                    }
                }
            });
        }

        ALApiService.sendReadUpdate = function(options) {            
            mckUtils.ajax({
                url: MCK_BASE_URL + MESSAGE_READ_UPDATE_URL,
                data: "key=" + options.key,
                global: false,
                type: 'get',
                success: function() {},
                error: function() {}
            });
        }

        ALApiService.sendDeliveryUpdate = function(options) {
            mckUtils.ajax({
                url: MCK_BASE_URL + MESSAGE_DELIVERY_UPDATE_URL,
                data: "key=" + options.key,
                global: false,
                type: 'get',
                success: function() {},
                error: function() {}
            });
        }

        ALApiService.deleteMessage = function(options) {
            mckUtils.ajax({
                url: MCK_BASE_URL + MESSAGE_DELETE_URL + "?key=" + options.key,
                global: false,                
                type: 'get',
                success: function(response) {
                    if (options.success) {
                      options.success(response);
                    }
                },
                error: function(response) {
                    if (options.error) {
                      options.error(response);
                    }
                }
            });
        }

        ALApiService.deleteConversation = function(options) {
            mckUtils.ajax({
                type: "get",
                url: MCK_BASE_URL + CONVERSATION_DELETE_URL,
                global: false,
                data: options.data,
                success: function(response) {
                    if (options.success) {
                      options.success(response);
                    }
                },
                error: function(response) {
                    if (options.error) {
                      options.error(response);
                    }
                }
            });
        }

        ALApiService.createGroup = function(options) {
            mckUtils.ajax({
                url: MCK_BASE_URL + GROUP_CREATE_URL,
                global: false,
                data: options.data,
                type: 'post',
                contentType: 'application/json',
                success: function(response) {
                    if (options.success) {
                      options.success(response);
                    }
                },
                error: function(response) {
                    if (options.error) {
                      options.error(response);
                    }
                }
            });
        }

        ALApiService.loadGroups = function(options) {
            mckUtils.ajax({
                url: MCK_BASE_URL + GROUP_LIST_URL,
                type: 'get',
                global: false,
                success: function(response) {
                    if (options.success) {
                      options.success(response);
                    }
                },
                error: function(response) {
                    if (options.error) {
                      options.error(response);
                    }
                }
            });
        }

        ALApiService.getUsers = function(params, callback) {

        }

        return ALApiService;
    }

    //define globally if it doesn't already exist
    if(typeof(ALApiService) === 'undefined'){
        window.Applozic.ALApiService = define_ALApiService();
    }
    else{
        console.log("ALApiService already defined.");
    }
})(window);

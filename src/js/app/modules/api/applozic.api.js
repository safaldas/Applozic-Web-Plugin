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

        function getAsUriParameters(data) {
            var url = '';
            for (var prop in data) {
               url += encodeURIComponent(prop) + '=' + 
                   encodeURIComponent(data[prop]) + '&';
            }
            return url.substring(0, url.length - 1)
        }

        ALApiService.initServerUrl = function(serverUrl) {
            MCK_BASE_URL = serverUrl;
        }


        /**
         * Login user to the chat session, must be done once in a session.
         * Usage Example:
         * Applozic.ALApiService.login({data: {alUser: {userId: 'debug4', accessToken: 'debug4', appVersionCode: 108, applicationId: 'applozic-sample-app'}}, success: function(response) {console.log(response);}, error: function() {}});
         */
        ALApiService.login = function(options) {
            MCK_APP_ID = options.data.alUser.applicationId;
            mckUtils.ajax({
                url: MCK_BASE_URL + INITIALIZE_APP_URL,
                type: 'post',
                data: w.JSON.stringify(options.data.alUser),
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

        /**
         * Get messages list.
         * 
         * Usage Examples:
         * 
         * Get latest messages group by users and groups:
         * Applozic.ALApiService.getMessages({data: {}, success: function(response) {console.log(response);}, error: function() {}});
         * 
         * Messages between logged in user and a specific userId:
         * Applozic.ALApiService.getMessages({data: {userId: 'debug4'}, success: function(response) {console.log(response);}, error: function() {}});
         * 
         * Messages between logged in user and a specific groupId:
         * Applozic.ALApiService.getMessages({data: {groupId: 'debug4'}, success: function(response) {console.log(response);}, error: function() {}});
         * 
         * Messages history before a timestamp, for loading message list, pass the endTime = createdAt of the last message received in the message list api response
         * Applozic.ALApiService.getMessages({data: {userId: 'debug4', endTime: 1508177918406}, success: function(response) {console.log(response);}, error: function() {}});
         */
        ALApiService.getMessages = function(options) {
            if ((options.data.userId || options.data.groupId) && typeof options.data.pageSize === 'undefined') {
                options.data.pageSize = 30;
            } else if (typeof options.data.mainPageSize === 'undefined') {
                options.data.mainPageSize = 60;
            }
            var data = getAsUriParameters(options.data);
            var response = new Object();
            mckUtils.ajax({
                url: MCK_BASE_URL + MESSAGE_LIST_URL,
                data: data,
                type: 'get',
                success: function(data) {
                    response.status = "success";
                    response.data = data;
                    if (options.success) {
                        options.success(response);
                    }
                    return;
                },
                error: function(xhr, desc, err) {
                    response.status = "error";
                    if (options.error) {
                        options.error(response);
                    }
                }
            });
        }

        ALApiService.sendMessage = function(options) {
            mckUtils.ajax({
                type: 'POST',
                url: MCK_BASE_URL + MESSAGE_SEND_URL,
                global: false,
                data: w.JSON.stringify(options.data.message),
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
                data: "keys=" + options.data.key,
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
                data: "key=" + options.data.key,
                global: false,
                type: 'get',
                success: function() {},
                error: function() {}
            });
        }

        ALApiService.sendDeliveryUpdate = function(options) {
            mckUtils.ajax({
                url: MCK_BASE_URL + MESSAGE_DELIVERY_UPDATE_URL,
                data: "key=" + options.data.key,
                global: false,
                type: 'get',
                success: function() {},
                error: function() {}
            });
        }

        ALApiService.deleteMessage = function(options) {
            mckUtils.ajax({
                url: MCK_BASE_URL + MESSAGE_DELETE_URL + "?key=" + options.data.key,
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
                data: getAsUriParameters(options.data),
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
                data: w.JSON.stringify(options.data.group),
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

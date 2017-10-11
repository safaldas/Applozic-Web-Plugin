(function(window){
    'use strict';
    function define_ALApiService(){
        var ALApiService = {};

        var MCK_BASE_URL = "https://apps.applozic.com";
        var INITIALIZE_APP_URL = "/v2/tab/initialize.page";
        var MCK_APP_ID = "";
        var mckUtils = new MckUtils();

        ALApiService.initServerUrl = function(serverUrl) {
            MCK_BASE_URL = serverUrl;
        }

        ALApiService.login = function(userPxy, successCallback, errorCallback) {
            MCK_APP_ID = userPxy.applicationId;
            mckUtils.ajax({
                url: MCK_BASE_URL + INITIALIZE_APP_URL,
                type: 'post',
                data: w.JSON.stringify(userPxy),
                contentType: 'application/json',
                headers: {
                    'Application-Key': MCK_APP_ID
                },
                success: function(result) {
                    successCallback(result);
                },
                error: function() {
                    errorCallback();
                }
            });
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

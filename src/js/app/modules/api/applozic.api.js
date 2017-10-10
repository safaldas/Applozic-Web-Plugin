var ALApiService = (function(win){

  var MCK_BASE_URL = "https://apps.applozic.com";
  var INITIALIZE_APP_URL = "/v2/tab/initialize.page";
  var MCK_APP_ID = "";

  var mckUtils = new MckUtils();

  return {

    initServerUrl: function(serverUrl) {
        BASE_URL = serverUrl;
    },

    login: function(userPxy, successCallback, errorCallback) {
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

  };
})(window);

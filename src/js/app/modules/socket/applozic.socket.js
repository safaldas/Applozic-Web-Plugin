(function(window){
    'use strict';
    function define_ALSocket() {
        var ALSocket = {};
        var MCK_APP_ID;
        var events = {};
        var subscriber = null;
        var stompClient = null;
        var TYPING_TAB_ID = '';
        var typingSubscriber = null;
        var openGroupSubscriber = [];
        var checkConnectedIntervalId;
        var sendConnectedStatusIntervalId;
        var MCK_TYPING_STATUS;
        var SOCKET = '';
        var MCK_WEBSOCKET_URL = 'https://apps.applozic.com';
        var MCK_TOKEN;
        var USER_DEVICE_KEY;
        var mckUtils = new MckUtils();

        /**
         * var events = {
                'onConnectFailed': function() {},
                'onConnect': function() {},
                'onMessageDelivered': function() {},
                'onMessageRead': function() {},
                'onMessageDeleted': function() {},
                'onConversationDeleted': function() {},
                'onUserConnect': function() {},
                'onUserDisconnect': function() {},
                'onConversationReadFromOtherSource': function() {},
                'onConversationRead': function() {},
                'onMessageReceived': function() {},
                'onMessageSentUpdate': function() {},
                'onMessageSent': function() {},
                'onUserBlocked': function() {},
                'onUserUnblocked': function() {},
                'onUserActivated': function() {},
                'onUserDeactivated': function() {},
                'connectToSocket': function() {},
                'onMessage': function(resp) { console.log(resp); },
                'onTypingStatus': function(resp) {}
               }; 
        window.Applozic.ALSocket.init("applozic-sample-app", "https://apps.applozic.com", events);
        */
        ALSocket.init = function(appId, data, _events) {
            if (appId) {
                MCK_APP_ID = appId;                
            }
            if (typeof data !== "undefined") {
                MCK_TOKEN = data.token;   
                USER_DEVICE_KEY = data.deviceKey;
                MCK_WEBSOCKET_URL = data.websocketUrl;                                  
            }
            
            events = _events;
            if (typeof MCK_WEBSOCKET_URL !== 'undefined') {
                var port = (!mckUtils.startsWith(MCK_WEBSOCKET_URL, "https")) ? "15674" : "15675";
                if (typeof SockJS === 'function') {
                    if (!SOCKET) {
                        SOCKET = new SockJS(MCK_WEBSOCKET_URL + ":" + port + "/stomp");
                    }
                    stompClient = Stomp.over(SOCKET);
                    stompClient.heartbeat.outgoing = 0;
                    stompClient.heartbeat.incoming = 0;
                    stompClient.onclose = function() {
                        ALSocket.disconnect();
                    };
                    stompClient.connect("guest", "guest", ALSocket.onConnect, ALSocket.onError, '/');
                    window.addEventListener("beforeunload", function(e) {
                        ALSocket.disconnect();
                    });
                }
            }
        };
        ALSocket.checkConnected = function(isFetchMessages) {
            if (stompClient.connected) {
                if (checkConnectedIntervalId) {
                    clearInterval(checkConnectedIntervalId);
                }
                if (sendConnectedStatusIntervalId) {
                    clearInterval(sendConnectedStatusIntervalId);
                }
                checkConnectedIntervalId = setInterval(function() {
                    ALSocket.connectToSocket(isFetchMessages);
                }, 600000);
                sendConnectedStatusIntervalId = setInterval(function() {
                    ALSocket.sendStatus(1);
                }, 1200000);
            } else {
                ALSocket.connectToSocket(isFetchMessages);
            }
        };
        ALSocket.connectToSocket = function(isFetchMessages) {
            if (typeof events.connectToSocket === "function") { 
                events.connectToSocket(isFetchMessages);
            }
        };
        ALSocket.stopConnectedCheck = function() {
            if (checkConnectedIntervalId) {
                clearInterval(checkConnectedIntervalId);
            }
            if (sendConnectedStatusIntervalId) {
                clearInterval(sendConnectedStatusIntervalId);
            }
            checkConnectedIntervalId = '';
            sendConnectedStatusIntervalId = '';
            ALSocket.disconnect();
        };
        ALSocket.disconnect = function() {
            if (stompClient && stompClient.connected) {
                ALSocket.sendStatus(0);
                stompClient.disconnect();
            }
        };
        ALSocket.unsubscibeToTypingChannel = function() {
            if (stompClient && stompClient.connected) {
                if (typingSubscriber) {
                    if (MCK_TYPING_STATUS === 1) {
                        ALSocket.sendTypingStatus(0, TYPING_TAB_ID);
                    }
                    typingSubscriber.unsubscribe();
                }
            }
            typingSubscriber = null;
        };
        ALSocket.unsubscibeToNotification = function() {
            if (stompClient && stompClient.connected) {
                if (subscriber) {
                    subscriber.unsubscribe();
                }
            }
            subscriber = null;
        };
        ALSocket.subscibeToTypingChannel = function(subscribeId) {
            if (stompClient && stompClient.connected) {
                typingSubscriber = stompClient.subscribe("/topic/typing-" + MCK_APP_ID + "-" + subscribeId, ALSocket.onTypingStatus);
            } else {
                ALSocket.reconnect();
            }
        };
        ALSocket.subscribeToOpenGroup = function(group) {
            if (stompClient && stompClient.connected) {
                var subs = stompClient.subscribe("/topic/group-" + MCK_APP_ID + "-" + group.contactId, ALSocket.onOpenGroupMessage);
                openGroupSubscriber.push(subs.id);
                OPEN_GROUP_SUBSCRIBER_MAP[group.contactId] = subs.id;
            } else {
                ALSocket.reconnect();
            }
        };
        ALSocket.sendTypingStatus = function(status, mck_typing_status,tabId) {
            MCK_TYPING_STATUS =mck_typing_status;
            if (stompClient && stompClient.connected) {
                if (status === 1 && MCK_TYPING_STATUS === 1) {
                    stompClient.send('/topic/typing-' + MCK_APP_ID + "-" + TYPING_TAB_ID, {
                        "content-type": "text/plain"
                    }, MCK_APP_ID + "," + MCK_USER_ID + "," + status);
                }
                if (tabId) {
                    if (tabId === TYPING_TAB_ID && status === MCK_TYPING_STATUS && status === 1) {
                        return;
                    }
                    TYPING_TAB_ID = tabId;
                    stompClient.send('/topic/typing-' + MCK_APP_ID + "-" + tabId, {
                        "content-type": "text/plain"
                    }, MCK_APP_ID + "," + MCK_USER_ID + "," + status);
                    setTimeout(function() {
                        MCK_TYPING_STATUS = 0;
                    }, 60000);
                } else if (status === 0) {
                    stompClient.send('/topic/typing-' + MCK_APP_ID + "-" + TYPING_TAB_ID, {
                        "content-type": "text/plain"
                    }, MCK_APP_ID + "," + MCK_USER_ID + "," + status);
                }
                MCK_TYPING_STATUS = status;
            }
        };
        ALSocket.onTypingStatus = function(resp) {
            if (typeof events.onTypingStatus === "function") { 
                events.onTypingStatus(resp);                
            }
        };
        ALSocket.reconnect = function() {
            ALSocket.unsubscibeToTypingChannel();
            ALSocket.unsubscibeToNotification();
            ALSocket.disconnect();
            ALSocket.init();
        };
        ALSocket.onError = function(err) {
            console.log("Error in channel notification. " + err);
            if (typeof events.onConnectFailed === "function") { 
                events.onConnectFailed();                
            }
        };
        ALSocket.sendStatus = function(status) {
            if (stompClient && stompClient.connected) {
                stompClient.send('/topic/status-v2', {
                    "content-type": "text/plain"
                }, MCK_TOKEN + "," + USER_DEVICE_KEY + "," + status);
            }
        };
        ALSocket.onConnect = function() {
            if (stompClient.connected) {
                if (subscriber) {
                    ALSocket.unsubscibeToNotification();
                }
                subscriber = stompClient.subscribe("/topic/" + MCK_TOKEN, ALSocket.onMessage);
                ALSocket.sendStatus(1);
                ALSocket.checkConnected(true);
            } else {
                setTimeout(function() {
                    subscriber = stompClient.subscribe("/topic/" + MCK_TOKEN, ALSocket.onMessage);
                    ALSocket.sendStatus(1);
                    ALSocket.checkConnected(true);
                }, 5000);
            }
            if (typeof events.onConnect === "function") { 
                events.onConnect();             
            }
        };
        ALSocket.onOpenGroupMessage = function(obj) {
            if (typeof events.onOpenGroupMessage === "function") { 
                events.onOpenGroupMessage(obj);      
            }
        };
        ALSocket.onMessage = function(obj) {
            if (subscriber != null && subscriber.id === obj.headers.subscription) {
                var resp = JSON.parse(obj.body);
                if (typeof events.onMessage === "function") { 
                    events.onMessage(resp);     
                }
            }
        };

        return ALSocket;
    }

    if(typeof(ALSocket) === 'undefined'){
        window.Applozic.ALSocket = define_ALSocket();
    } else{
        console.log("ALSocket already defined.");
    }
})(window);

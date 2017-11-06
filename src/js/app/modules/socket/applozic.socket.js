(function(window,document){
function define_MckInitializeChannel() {
	
    var MckInitializeChannel = {};
	var _this = this;
    var MCK_APP_ID;
    var events = {};
    var subscriber = null;
    var stompClient = null;
    var TYPING_TAB_ID = '';
    var typingSubscriber = null;
    var openGroupSubscriber = [];
    var checkConnectedIntervalId;
    var sendConnectedStatusIntervalId;
    var SOCKET = '';
    var MCK_WEBSOCKET_URL = 'https://apps.applozic.com';

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
            'onMessage': function(resp) { console.log(resp); } }; 
    window.Applozic.MckInitializeChannel.init("applozic-sample-app", events);
     */
    MckInitializeChannel.init = function(appId, websocketUrl, _events) {
        MckInitializeChannel.MCK_APP_ID = appId;
        MckInitializeChannel.MCK_WEBSOCKET_URL = websocketUrl;
        MckInitializeChannel.events = _events;
        if (typeof MCK_WEBSOCKET_URL !== 'undefined') {
            var port = (!mckUtils.startsWith(MCK_WEBSOCKET_URL, "https")) ? "15674" : "15675";
            if (typeof w.SockJS === 'function') {
                if (!SOCKET) {
                    SOCKET = new SockJS(MCK_WEBSOCKET_URL + ":" + port + "/stomp");
                }
                stompClient = w.Stomp.over(SOCKET);
                stompClient.heartbeat.outgoing = 0;
                stompClient.heartbeat.incoming = 0;
                stompClient.onclose = function() {
                    MckInitializeChannel.disconnect();
                };
                stompClient.connect("guest", "guest", MckInitializeChannel.onConnect, MckInitializeChannel.onError, '/');
                w.addEventListener("beforeunload", function(e) {
                    MckInitializeChannel.disconnect();
                });
            }
        }
    };
    MckInitializeChannel.checkConnected = function(isFetchMessages) {
        if (stompClient.connected) {
            if (checkConnectedIntervalId) {
                clearInterval(checkConnectedIntervalId);
            }
            if (sendConnectedStatusIntervalId) {
                clearInterval(sendConnectedStatusIntervalId);
            }
            checkConnectedIntervalId = setInterval(function() {
                MckInitializeChannel.connectToSocket(isFetchMessages);
            }, 600000);
            sendConnectedStatusIntervalId = setInterval(function() {
                MckInitializeChannel.sendStatus(1);
            }, 1200000);
        } else {
            MckInitializeChannel.connectToSocket(isFetchMessages);
        }
    };
    MckInitializeChannel.connectToSocket = function(isFetchMessages) {
        events.connectToSocket(isFetchMessages);
    };
    MckInitializeChannel.stopConnectedCheck = function() {
        if (checkConnectedIntervalId) {
            clearInterval(checkConnectedIntervalId);
        }
        if (sendConnectedStatusIntervalId) {
            clearInterval(sendConnectedStatusIntervalId);
        }
        checkConnectedIntervalId = '';
        sendConnectedStatusIntervalId = '';
        MckInitializeChannel.disconnect();
    };
    MckInitializeChannel.disconnect = function() {
        if (stompClient && stompClient.connected) {
            MckInitializeChannel.sendStatus(0);
            stompClient.disconnect();
        }
    };
    MckInitializeChannel.unsubscibeToTypingChannel = function() {
        if (stompClient && stompClient.connected) {
            if (typingSubscriber) {
                if (MCK_TYPING_STATUS === 1) {
                    MckInitializeChannel.sendTypingStatus(0, TYPING_TAB_ID);
                }
                typingSubscriber.unsubscribe();
            }
        }
        typingSubscriber = null;
    };
    MckInitializeChannel.unsubscibeToNotification = function() {
        if (stompClient && stompClient.connected) {
            if (subscriber) {
                subscriber.unsubscribe();
            }
        }
        subscriber = null;
    };
    MckInitializeChannel.subscibeToTypingChannel = function(subscribeId) {
        if (stompClient && stompClient.connected) {
            typingSubscriber = stompClient.subscribe("/topic/typing-" + MCK_APP_ID + "-" + subscribeId, MckInitializeChannel.onTypingStatus);
        } else {
            MckInitializeChannel.reconnect();
        }
    };
    MckInitializeChannel.subscribeToOpenGroup = function(group) {
        if (stompClient && stompClient.connected) {
            var subs = stompClient.subscribe("/topic/group-" + MCK_APP_ID + "-" + group.contactId, MckInitializeChannel.onOpenGroupMessage);
            openGroupSubscriber.push(subs.id);
            OPEN_GROUP_SUBSCRIBER_MAP[group.contactId] = subs.id;
        } else {
            MckInitializeChannel.reconnect();
        }
    };
    MckInitializeChannel.sendTypingStatus = function(status, tabId) {
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
    MckInitializeChannel.onTypingStatus = function(resp) {
        events.onTypingStatus(resp);
    };
    MckInitializeChannel.reconnect = function() {
        MckInitializeChannel.unsubscibeToTypingChannel();
        MckInitializeChannel.unsubscibeToNotification();
        MckInitializeChannel.disconnect();
        MckInitializeChannel.init();
    };
    MckInitializeChannel.onError = function(err) {
        w.console.log("Error in channel notification. " + err);
        events.onConnectFailed();
    };
    MckInitializeChannel.sendStatus = function(status) {
        if (stompClient && stompClient.connected) {
            stompClient.send('/topic/status-v2', {
                "content-type": "text/plain"
            }, MCK_TOKEN + "," + USER_DEVICE_KEY + "," + status);
        }
    };
    MckInitializeChannel.onConnect = function() {
        if (stompClient.connected) {
            if (subscriber) {
                MckInitializeChannel.unsubscibeToNotification();
            }
            subscriber = stompClient.subscribe("/topic/" + MCK_TOKEN, MckInitializeChannel.onMessage);
            MckInitializeChannel.sendStatus(1);
            MckInitializeChannel.checkConnected(true);
        } else {
            setTimeout(function() {
                subscriber = stompClient.subscribe("/topic/" + MCK_TOKEN, MckInitializeChannel.onMessage);
                MckInitializeChannel.sendStatus(1);
                MckInitializeChannel.checkConnected(true);
            }, 5000);
        }
        events.onConnect();
    };
    MckInitializeChannel.onOpenGroupMessage = function(obj) {
        events.onOpenGroupMessage(obj);
    };
    MckInitializeChannel.onMessage = function(obj) {
        if (subscriber != null && subscriber.id === obj.headers.subscription) {
            var resp = JSON.parse(obj.body);
			events.onMessage(resp);
        }
    };
	MckInitializeChannel.subscriber =  subscriber;
    MckInitializeChannel.stompClient = stompClient;
    MckInitializeChannel.TYPING_TAB_ID = TYPING_TAB_ID;
    MckInitializeChannel.typingSubscriber = typingSubscriber;
    MckInitializeChannel.openGroupSubscriber = openGroupSubscriber;
    MckInitializeChannel.checkConnectedIntervalId = checkConnectedIntervalId;
    MckInitializeChannel.sendConnectedStatusIntervalId = sendConnectedStatusIntervalId;
    MckInitializeChannel.SOCKET = SOCKET;
	return MckInitializeChannel;
}
if(typeof(MckInitializeChannel) === 'undefined'){
        window.Applozic.MckInitializeChannel = define_MckInitializeChannel();
    }
    else{
        console.log("MckInitializeChannel already defined.");
    }
})(window,document);

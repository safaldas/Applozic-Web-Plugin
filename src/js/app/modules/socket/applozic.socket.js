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
    var mck_sidebox = document.getElementById("mck-sidebox");
    var mck_tab_title = document.getElementById("mck-tab-title");
    var mck_typing_box = document.getElementsByClassName('mck-typing-box')[0];
    var mck_tab_status = document.getElementById("mck-tab-status");
    var mck_offline_message_box = document.getElementById("mck-offline-message-box");
    var mck_typing_label = document.getElementById("mck-typing-label");
    var mck_message_inner = document.getElementById("mck-message-cell").getElementsByClassName("mck-message-inner")[0];
    MckInitializeChannel.init = function(appId) {
        MckInitializeChannel.MCK_APP_ID = appId;
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
	MckInitializeChannel.initEvents = function(_events)
	{
		events = _events;
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
        if (!stompClient.connected) {
            if (isFetchMessages && mck_sidebox.style.display === 'block') {
                var currTabId = mck_message_inner.getAttribute('data-mck-id');
                if (currTabId) {
                    var isGroup = mck_message_inner.getAttribute('data-isgroup');
                    var conversationId = mck_message_inner.getAttribute('data-mck-conversationid');
                    var topicId = mck_message_inner.getAttribute('data-mck-topicid');
                    ALStorage.clearMckMessageArray();
                    mckMessageLayout.loadTab({
                        'tabId': currTabId,
                        'isGroup': isGroup,
                        'conversationId': conversationId,
                        'topicId': topicId
                    });
                } else {
                    ALStorage.clearMckMessageArray();
                    mckMessageLayout.loadTab({
                        'tabId': '',
                        'isGroup': false
                    });
                }
            }
            MckInitializeChannel.init();
        }
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
        if (typingSubscriber != null && typingSubscriber.id === resp.headers.subscription) {
            var message = resp.body;
            var publisher = message.split(",")[1];
            var status = Number(message.split(",")[2]);
            var tabId = resp.headers.destination.substring(resp.headers.destination.lastIndexOf("-") + 1, resp.headers.destination.length);
            var currTabId = mck_message_inner.getAttribute('data-mck-id');
            var isGroup = mck_message_inner.getAttribute('data-isgroup');
            var group = mckGroupUtils.getGroup(currTabId);
            if (!MCK_BLOCKED_TO_MAP[publisher] && !MCK_BLOCKED_BY_MAP[publisher]) {
                if (status === 1) {
                    if ((MCK_USER_ID !== publisher || !isGroup) && (currTabId === publisher || currTabId === tabId)) {
                        var isGroup = mck_message_inner.getAttribute('data-isgroup');
                        if (isGroup) {
                            if (publisher !== MCK_USER_ID) {
                                if (mckGroupLayout.authenticateGroupUser(group) || (group.type === 6 && !MCK_OPEN_GROUP_SETTINGS.disableChatForNonGroupMember)) {
                                    mck_tab_title.classList.add('mck-tab-title-w-typing');
                                    mck_tab_status.classList.remove('vis');
									mck_tab_status.classList.add('n-vis');
                                    var displayName = mckMessageLayout.getTabDisplayName(publisher, false);
                                    displayName = displayName.split(' ')[0];
                                    mck_typing_label.innerHTML = displayName + ' ' + MCK_LABELS['is.typing'];
                                }
                                if (group.type === 7) {
                                    mck_tab_title.classList.add('mck-tab-title-w-typing');
                                    mck_typing_label.innerHTML = MCK_LABELS['is.typing'];
                                    mck_tab_status.innerHTML = '';
                                }
                            }
                        } else {
                            mck_tab_title.classList.add('mck-tab-title-w-typing');
                            mck_tab_status.classList.remove('vis');
							mck_tab_status.classList.add('n-vis');
                            mck_typing_label.innerHTML = MCK_LABELS['typing'];
                        }
                        mck_typing_box.classList.remove('n-vis');
						mck_typing_box.classList.add('vis');
                        setTimeout(function() {
                            mck_tab_title.classList.remove("mck-tab-title-w-typing");
                            mck_typing_box.classList.remove('vis');
							mck_typing_box.classList.add('n-vis');
                            if (mck_tab_title.classList.contains("mck-tab-title-w-status" && (typeof group === "undefined" || group.type != 7))) {
                                mck_tab_status.classList.remove('n-vis');
								mck_typing_box.classList.add('vis');
                            }
                            mck_typing_label.innerHTML = MCK_LABELS['typing'];
                        }, 60000);
                    }
                } else {
                    mck_tab_title.classList.remove("mck-tab-title-w-typing");
                    mck_typing_box.classList.remove('vis');
					mck_typing_box.classList.add('n-vis');
                    if (mck_tab_title.classList.contains("mck-tab-title-w-status") && (typeof group === "undefined" || group.type != 7)) {
                        mck_tab_status.classList.remove('n-vis')
						mck_tab_status.classList.add('vis');
                    }
                    mck_typing_label.innerHTML = MCK_LABELS['typing'];
                }
            }
        }
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
        if (openGroupSubscriber.indexOf(obj.headers.subscription) !== -1) {
            var resp = JSON.parse(obj.body);
            var messageType = resp.type;
            var message = resp.message;
            // var userIdArray =
            // mckMessageLayout.getUserIdFromMessage(message);
            // mckContactService.getContactDisplayName(userIdArray);
            // mckMessageLayout.openConversation();
            if (messageType === "APPLOZIC_03") {
                ALStorage.updateLatestMessage(message);
                if (message.type !== 0 && message.type !== 4) {
                    document.querySelector("." + message.key + " .mck-message-status").classList.remove('mck-icon-time');
					document.querySelector("." + message.key + " .mck-message-status").classList.add('mck-icon-sent');
                    mckMessageLayout.addTooltip(message.key);
                }
                events.onMessageSentUpdate({
                    'messageKey': message.key
                });
            } else if (messageType === "APPLOZIC_01" || messageType === "APPLOZIC_02" || messageType === "MESSAGE_RECEIVED") {
                ALStorage.updateLatestMessage(message);
                var contact = (message.groupId) ? mckGroupUtils.getGroup(message.groupId) : mckMessageLayout.getContact(message.to);
                var mck_sidebox_content = document.getElementById("mck-sidebox-content");
                var tabId = mck_message_inner.getAttribute('data-mck-id');
                if (messageType === "APPLOZIC_01" || messageType === "MESSAGE_RECEIVED") {
                    var messageFeed = mckMessageLayout.getMessageFeed(message);
                    events.onMessageReceived({
                        'message': messageFeed
                    });
                } else if (messageType === "APPLOZIC_02") {
                    var messageFeed = mckMessageLayout.getMessageFeed(message);
                    events.onMessageSent({
                        'message': messageFeed
                    });
                }
                if (message.conversationId) {
                    var conversationPxy = MCK_CONVERSATION_MAP[message.conversationId];
                    if ((IS_MCK_TOPIC_HEADER || IS_MCK_TOPIC_BOX) && ((typeof conversationPxy !== 'object') || (typeof(MCK_TOPIC_DETAIL_MAP[conversationPxy.topicId]) !== 'object'))) {
                        mckMessageService.getTopicId({
                            'conversationId': message.conversationId,
                            'messageType': messageType,
                            'message': message,
                            'notifyUser': resp.notifyUser,
                            'async': false,
                            'populate': false
                        });
                    }
                }

                if (typeof contact === 'undefined') {
                    var params = {
                        'message': message,
                        'messageType': messageType,
                        'notifyUser': resp.notifyUser
                    };
                    if (message.groupId) {
                        mckGroupLayout.getGroupFeedFromMessage(params);
                    } else {
                        var userIdArray = [];
                        userIdArray.push(message.to);
                        mckContactService.getUsersDetail(userIdArray, params);
                    }
                    return;
                }

                mckMessageLayout.populateMessage(messageType, message, resp.notifyUser);
            }
        }
    };
    MckInitializeChannel.onMessage = function(obj) {
        if (subscriber != null && subscriber.id === obj.headers.subscription) {
            var resp = JSON.parse(obj.body);
			events.onMessage(resp);
        }
    };
	return MckInitializeChannel;
}
if(typeof(MckInitializeChannel) === 'undefined'){
        window.Applozic.MckInitializeChannel = define_MckInitializeChannel();
    }
    else{
        console.log("MckInitializeChannel already defined.");
    }
})(window,document);

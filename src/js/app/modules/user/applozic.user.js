
var mckUserDir = new MckUserDir();
var mckUtils = new MckUtils();
mckUtils.init();

function MckUserDir() {
    var _this = this;

    var $mck_msg_form = $applozic("#mck-msg-form");
    var $mck_msg_error = $applozic("#mck-msg-error");
    var $mck_tab_title = $applozic("#mck-tab-title");
    var $mck_tab_status = $applozic("#mck-tab-status");
    var $mck_typing_box = $applozic('.mck-typing-box');
    var $mck_block_button = $applozic("#mck-block-button");
    var $mck_message_inner = $applozic("#mck-message-cell .mck-message-inner");

    var MCK_USER_DETAIL_MAP = [];
    var MCK_BLOCKED_TO_MAP = [];
    var MCK_GROUP_MEMBER_SEARCH_ARRAY = new Array();
    var USER_BLOCK_URL = "/rest/ws/user/block";
    var USER_DETAIL_URL = "/rest/ws/user/v2/detail";
    var USER_STATUS_URL = "/rest/ws/user/chat/status";

    _this.updateUserStatus = function(params) {
        if (typeof MCK_USER_DETAIL_MAP[params.userId] === 'object') {
            var userDetail = MCK_USER_DETAIL_MAP[params.userId];
            if (params.status === 0) {
                userDetail.connected = false;
                userDetail.lastSeenAtTime = params.lastSeenAtTime;
            } else if (params.status === 1) {
                userDetail.connected = true;
            }
        } else {
            var userIdArray = new Array();
            userIdArray.push(params.userId);
            mckUserDir.getUsersDetail(userIdArray, {});
        }
    };
    _this.getUserDetail = function(userId) {
        if (typeof MCK_USER_DETAIL_MAP[userId] === 'object') {
            return MCK_USER_DETAIL_MAP[userId];
        } else {
            return;
        }
    };
    _this.checkUserConnectedStatus = function() {
        var userIdArray = new Array();
        var otherUserIdArray = new Array();
        $applozic(".mck-user-ol-status").each(function() {
            var tabId = $applozic(this).data('mck-id');
            if (typeof tabId !== "undefined" && tabId !== '') {
                userIdArray.push(tabId);
                var htmlId = mckContactUtils.formatContactId('' + tabId);
                $applozic(this).addClass(htmlId);
                $applozic(this).next().addClass(htmlId);
            }
        });
        if (userIdArray.length > 0) {
            $applozic.each(userIdArray, function(i, userId) {
                if (typeof MCK_USER_DETAIL_MAP[userId] === 'undefined') {
                    otherUserIdArray.push(userId);
                }
            });
            (otherUserIdArray.length > 0) ? mckUserDir.getUsersDetail(otherUserIdArray, {
                setStatus: true
            }): mckUserDir.updateUserConnectedStatus();
        }
    };
    _this.updateUserConnectedStatus = function() {
        $applozic('.mck-user-ol-status').each(function() {
            var $this = $applozic(this);
            var tabId = $this.data('mck-id');
            if (tabId) {
                var userDetail = MCK_USER_DETAIL_MAP[tabId];
                if (typeof MCK_USER_DETAIL_MAP[tabId] !== 'undefined' && userDetail.connected) {
                    $this.removeClass('n-vis').addClass('vis');
                    $this.next().html('(' + MCK_LABELS['online'] + ')');
                } else {
                    $this.removeClass('vis').addClass('n-vis');
                    $this.next().html('(Offline)');
                }
            }
        });
    };
    _this.loadUserProfile = function(userId) {
        if (typeof userId !== "undefined") {
            var userIdArray = [];
            var memberId = '' + userId.split(",")[0];
            userIdArray.push(memberId);
            mckUserDir.loadUserProfiles(userIdArray);
        }
    };
    _this.loadUserProfiles = function(userIds, callback) {
        var userIdArray = [];
        if (typeof callback === "function") {
        callback(userIds);
      }
        mckUserDir.getUsersDetail(userIdArray, { 'async': false });
    };

    _this.getUsersDetail = function(userIdArray, params) {
        if (typeof userIdArray === 'undefined' || userIdArray.length < 1) {
            return;
        }
        var cached = (typeof params.cached !== 'undefined') ? params.cached : true;
        var userIdList = [];
        var uniqueUserIdArray = userIdArray.filter(function(item, pos) {
            return userIdArray.indexOf(item) === pos;
        });

        for (var i = 0; i < uniqueUserIdArray.length; i++) {
            var userId = uniqueUserIdArray[i];
            if (!cached || typeof MCK_USER_DETAIL_MAP[userId] === 'undefined') {
                userIdList.push(userId);
            }
        }

        if (userIdList.length === 0) {
            if (params.setStatus) {
                mckUserDir.updateUserConnectedStatus();
            } else if (params.message) {
                mckMessageLayout.populateMessage(params.messageType, params.message, params.notifyUser);
            } else if (params.isLoadMessageList) {
                mckMessageLayout.loadMessageListOnUserDetailFetch(params);
            }
            return;
        }

        var response = new Object();
        window.Applozic.ALApiService.getUserDetail({data:{userIdList: userIdList},
        success: function(data) {
            if (data.status === 'success') {
                if (data.response.length > 0) {
                    $applozic.each(data.response, function(i, userDetail) {
                        MCK_USER_DETAIL_MAP[userDetail.userId] = userDetail;
                        w.MCK_OL_MAP[userDetail.userId] = (userDetail.connected);
                        var contact = mckMessageLayout.getContact('' + userDetail.userId);
                        contact = (typeof contact === 'undefined') ? mckMessageLayout.createContactWithDetail(userDetail) : mckMessageLayout.updateContactDetail(contact, userDetail);
                    });
                }
            }
            if (params.setStatus) {
                mckUserDir.updateUserConnectedStatus();
            } else if (params.message) {
                mckMessageLayout.populateMessage(params.messageType, params.message, params.notifyUser);
            } else if (params.isLoadMessageList) {
                mckMessageLayout.loadMessageListOnUserDetailFetch(params);
            }

            response.status = "success";
            response.data = data;
            if (params.callback) {
                params.callback(response);
            }
        },
        error: function() {
            if (params.setStatus) {
                mckUserDir.updateUserConnectedStatus();
            } else if (params.message) {
                mckMessageLayout.populateMessage(params.messageType, params.message, params.notifyUser);
            } else if (params.isLoadMessageList) {
                mckMessageLayout.loadMessageListOnUserDetailFetch(params);
            }

            response.status = "error";
            if (params.callback) {
                params.callback(response);
            }
        }
     });
    };
    _this.getUserStatus = function (params, callback) {
        var response = new Object();
        window.Applozic.ALApiService.getUserStatus({
            success: function (data) {
                if (data.users.length > 0) {
                    MCK_GROUP_MEMBER_SEARCH_ARRAY = [];
                    if (typeof callback === "function") {
                    callback(data);
                  }
                }
                response.status = "success";
                response.data = data;
                if (params.callback) {
                    params.callback(response);
                }
                return;
            },
            error: function () {
                response.status = "error";
                if (params.callback) {
                    params.callback(response);
                }
            }
        });
    };
    _this.blockUser = function(userId, isBlock, callback) {
        if (!userId || typeof isBlock === 'undefined') {
            return;
        }
        var data = "userId=" + userId + "&block=" + isBlock;
        mckUtils.ajax({
            url: MCK_BASE_URL + USER_BLOCK_URL,
            type: 'get',
            data: data,
            success: function(data) {
                if (typeof data === 'object') {
                    if (data.status === 'success') {
                        MCK_BLOCKED_TO_MAP[userId] = isBlock;
                        if (typeof callback === "function") {
                          callback(userId);
                        }
                    }
                }
            },
            error: function() {}
        });
    };

}

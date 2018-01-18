var mckGroupUtils = new MckGroupUtils();
var mckGroupService = new MckGroupService();

function MckGroupUtils() {
    var _this = this
    _this.getGroup = function(groupId) {
        if (typeof MCK_GROUP_MAP[groupId] === 'object') {
            return MCK_GROUP_MAP[groupId];
        } else {
            return;
        }
    };
    _this.getGroupByClientGroupId = function(clientGroupId) {
        if (typeof MCK_CLIENT_GROUP_MAP[clientGroupId] === 'object') {
            return MCK_CLIENT_GROUP_MAP[clientGroupId];
        } else {
            return;
        }
    };
    _this.addGroup = function(group) {
        var name = (group.name) ? group.name : group.id;
        var users = [];
        $applozic.each(group.groupUsers, function(i, user) {
            if (user.userId) {
                users[user.userId] = user;
            }
        });
        var removedMembersId = (typeof group.removedMembersId !== 'undefined') ? group.removedMembersId : [];
        var groupFeed = {
            'contactId': group.id.toString(),
            'htmlId': mckContactUtils.formatContactId('' + group.id),
            'displayName': name,
            'value': group.id.toString(),
            'adminName': group.adminName,
            'type': group.type,
            'members': group.membersName,
            'imageUrl': group.imageUrl,
            'users': users,
            'userCount': group.userCount,
            'removedMembersId': removedMembersId,
            'clientGroupId': group.clientGroupId,
            'isGroup': true,
            'deletedAtTime' :group.deletedAtTime
        };
        MCK_GROUP_MAP[group.id] = groupFeed;
        if (group.clientGroupId) {
            MCK_CLIENT_GROUP_MAP[group.clientGroupId] = groupFeed;
        }
        return groupFeed;
    };
    _this.createGroup = function(groupId) {
        var group = {
            'contactId': groupId.toString(),
            'htmlId': mckContactUtils.formatContactId('' + groupId),
            'displayName': groupId.toString(),
            'value': groupId.toString(),
            'type': 2,
            'adminName': '',
            'imageUrl': '',
            'userCount': '',
            'users': [],
            'removedMembersId': [],
            'clientGroupId': '',
            'isGroup': true,
            'deletedAtTime':''

        };
        MCK_GROUP_MAP[groupId] = group;
        return group;
    };
}
function MckGroupService() {
    var _this = this;
    var GROUP_FEED_URL = "/rest/ws/group/info";
    var GROUP_LEAVE_URL = "/rest/ws/group/left";
    var GROUP_UPDATE_INFO_URL = "/rest/ws/group/update";
    var GROUP_ADD_MEMBER_URL = "/rest/ws/group/add/member";
    var GROUP_REMOVE_MEMBER_URL = "/rest/ws/group/remove/member";
    _this.loadGroups = function (params) {
        var response = new Object();
        window.Applozic.ALApiService.loadGroups({baseUrl:MCK_BASE_URL,
            success: function (data) {
                if (data.status === 'success') {
                    response.status = 'success';
                    response.data = data.response;
                    if (params.apzCallback) {
                        params.apzCallback(response);
                    }
                } else {
                    response.status = 'error';
                }
                if (params.callback) {
                    params.callback(response);
                }
            },
            error: function () {
                console.log('Unable to load groups. Please reload page.');
                response.status = 'error';
                if (params.callback) {
                    params.callback(response);
                }
                if (params.apzCallback) {
                    params.apzCallback(response);
                }
            }
        });
    };
    _this.getGroupFeed = function (params) {
        var group = {};
        if (typeof params.callback === 'function' || typeof params.apzCallback === 'function') {
            var response = new Object();
        } else {
            return;
        }
        if (params.groupId) {
            group.groupId = params.groupId;
        } else if (params.clientGroupId) {
            group.clientGroupId = params.clientGroupId;
        } else {
            if (typeof params.callback === 'function') {
                response.status = "error";
                response.errorMessage = "GroupId or Client GroupId Required";
                params.callback(response);
            }
            return;
        }
        if (params.conversationId) {
            group.conversationId = params.conversationId;
        }

        Applozic.ALApiService.getGroupInfo({
            data: { group }, success: function (response) {
                if (response.status === "success") {
                    var groupFeed = response.response;
                    if (groupFeed + '' === "null" || typeof groupFeed !== "object") {
                        response.status = "error";
                        response.errorMessage = "GroupId not found";
                    } else {
                        var group = mckGroupUtils.addGroup(groupFeed);
                        response.status = "success";
                        response.data = group;
                    }
                } else if (data.status === "error") {
                    response.status = "error";
                    response.errorMessage = data.errorResponse[0].description;
                }
                if (params.callback) {
                    params.callback(response);
                }
                if (params.apzCallback) {
                    if (response.status === "success") {
                        response.data = groupFeed;
                    }
                    params.apzCallback(response, params);
                }
            },
            error: function () {
                console.log('Unable to load group. Please reload page.');
                response.status = "error";
                response.errorMessage = 'Please reload page.';
                if (params.callback) {
                    params.callback(response);
                }
                if (params.apzCallback) {
                    params.apzCallback(response, params);
                }
            }
        });
    };
    _this.leaveGroup = function (params) {
        var group = {};
        var response = new Object();
        if (params.groupId) {
            group.groupId = params.groupId;
        } else if (params.clientGroupId) {
            group.clientGroupId = params.clientGroupId;
        } else {
            response.status = "error";
            response.errorMessage = "GroupId or Client GroupId Required";
            if (params.callback) {
                params.callback(response);
            }
            return;
        }
        Applozic.ALApiService.groupLeave({
            data: { group },
            success: function (data) {
                if (data.status === "success") {
                    if (params.clientGroupId) {
                        var group = mckGroupUtils.getGroupByClientGroupId(params.clientGroupId);
                        if (typeof group === 'object') {
                            params.groupId = group.contactId;
                        }
                    }
                    response.status = "success";
                    response.data = {
                        groupId: params.groupId
                    };
                } else {
                    response.status = "error";
                    response.errorMessage = data.errorResponse[0].description;
                }
                if (params.callback) {
                    params.callback(response);
                }
                if (params.apzCallback) {
                    params.apzCallback(response, {
                        groupId: params.groupId
                    });
                }
            },
            error: function () {
                console.log('Unable to process your request. Please reload page.');
                response.status = "error";
                response.errorMessage = "";
                if (params.callback) {
                    params.callback(response);
                }
                if (params.apzCallback) {
                    params.apzCallback(response);
                }
            }
        });
    };
    _this.removeGroupMember = function (params) {
        var group = {};
        var response = new Object();
        if (params.groupId) {
            group.groupId = params.groupId;
        } else if (params.clientGroupId) {
            group.clientGroupId = params.clientGroupId;
        } else {
            response.status = 'error';
            response.errorMessage = "GroupId or Client GroupId Required";
            if (typeof params.callback === 'function') {
                params.callback(response);
            }
            return;
        }
        group.userId = params.userId;
        Applozic.ALApiService.removeGroupMember({
            data: { group: group },
            success: function (response) {
                if (data.status === 'success') {
                    if (params.clientGroupId) {
                        var group = mckGroupUtils.getGroupByClientGroupId(params.clientGroupId);
                        if (typeof group === 'object') {
                            params.groupId = group.contactId;
                        }
                    }
                    response.status = "success";
                    response.data = data.response;
                } else {
                    response.status = "error";
                    response.errorMessage = data.errorResponse[0].description;
                }
                if (params.callback) {
                    params.callback(response);
                }
                if (params.apzCallback) {
                    params.apzCallback(response, params)
                }
            },
            error: function () {
                console.log('Unable to process your request. Please reload page.');
                response.status = 'error';
                response.errorMessage = '';
                if (params.callback) {
                    params.callback(response);
                }
                if (params.apzCallback) {
                    params.apzCallback(response);
                }
                params.apzCallback(response);
            }
        });
    };
    _this.addGroupMember = function (params) {
        var group = {};
        var response = new Object();
        if (params.groupId) {
            group.groupId = params.groupId;
        } else if (params.clientGroupId) {
            group.clientGroupId = params.clientGroupId;
        } else {
            if (typeof params.callback === 'function') {
                params.callback(response);
            }
            return;
        }
        group.userId = params.userId;
        if (typeof params.role !== 'undefined') {
            group.role = params.role;
        }
        Applozic.ALApiService.addGroupMember({
            data: { group: group },
            success: function (data) {
                if (data.status === "success") {
                    if (params.clientGroupId) {
                        var group = mckGroupUtils.getGroupByClientGroupId(params.clientGroupId);
                        if (typeof group === 'object') {
                            params.groupId = group.contactId;
                        }
                    }
                    response.status = 'success';
                    response.data = data.response;
                } else {
                    response.status = 'error';
                    response.errorMessage = data.errorResponse[0].description;
                }
                if (params.callback) {
                    params.callback(response);
                }
                if (params.apzCallback) {
                    params.apzCallback(response, params)
                }
            },
            error: function () {
                console.log('Unable to process your request. Please reload page.');
                response.status = "error";
                response.errorMessage = '';
                if (params.callback) {
                    params.callback(response);
                }
                if (params.apzCallback) {
                    params.apzCallback(response);
                }
            }
        });
    };
    _this.updateGroupInfo = function (params) {
        var group = {};
        var response = new Object();
        if (params.groupId) {
            group.groupId = params.groupId;
        } else if (params.clientGroupId) {
            group.clientGroupId = params.clientGroupId;
        } else {
            if (typeof params.callback === 'function') {
                response.status = 'error';
                response.errorMessage = 'GroupId or Client GroupId Required';
                params.callback(response);
            }
            return;
        }
        if (params.name) {
            group.newName = params.name;
        }
        if (params.imageUrl) {
            group.imageUrl = params.imageUrl;
        }
        if (params.users && params.users.length > 0) {
            group.users = params.users;
        }
        Applozic.ALApiService.groupUpdate({
            data: { group },
            success: function (data) {
                if (data.status === "success") {
                    if (params.clientGroupId) {
                        var group = mckGroupLayout.getGroupByClientGroupId(params.clientGroupId);
                        if (typeof group === 'object') {
                            params.groupId = group.contactId;
                        }
                    }
                    response.status = "success";
                    response.data = data.response;
                } else {
                    response.status = "error";
                    response.errorMessage = data.errorResponse[0].description;
                }
                if (params.callback) {
                    params.callback(response);
                }
                if (params.apzCallback) {
                    params.apzCallback(response, {
                        groupId: params.groupId,
                        groupInfo: group
                    })
                }
            },
            error: function () {
                console.log('Unable to process your request. Please reload page.');
                response.status = "error";
                response.errorMessage = "Unable to process your request. Please reload page.";
                if (params.callback) {
                    params.callback(response);
                }
                if (params.apzCallback) {
                    params.apzCallback(response);
                }
            }
        });
    };
    _this.getGroupList = function(params) {
        if (typeof params.callback === 'function') {
            params.apzCallback = mckGroupLayout.loadgroupsCallbackFunction;
            mckGroupService.loadGroups(params);
            return 'success';
        } else {
            return 'Callback Function Required';
        }
    };
    _this.createGroup = function(params) {
        if (typeof params === 'object') {
            if (typeof params.callback === 'function') {
                var users = params.users;
                if (typeof users === 'undefined' || users.length < 1) {
                    params.callback({
                        'status': 'error',
                        'errorMessage': 'Users list required'
                    });
                    return;
                }
                if (users.length > MCK_GROUPMAXSIZE) {
                    params.callback({
                        'status': 'error',
                        'errorMessage': "Users limit exceeds " + MCK_GROUPMAXSIZE + ". Max number of users allowed is " + MCK_GROUPMAXSIZE + "."
                    });
                    return;
                }
                if (!params.groupName) {
                    params.callback({
                        'status': 'error',
                        'errorMessage': 'Group name required'
                    });
                    return;
                }
                if (typeof params.type === 'undefined' || params.type === '') {
                    params.callback({
                        'status': 'error',
                        'errorMessage': 'Group type required'
                    });
                    return;
                }
                if (GROUP_TYPE_MAP.indexOf(params.type) === -1) {
                    params.callback({
                        'status': 'error',
                        'errorMessage': 'Invalid group type'
                    });
                    return;
                }
                mckMessageService.getGroup(params);
                return 'success';
            } else {
                return 'Callback function required';
            }
        } else {
            return 'Unsupported Format. Please check format';
        }
    };
    _this.initGroupTab = function(params) {
        if (typeof params === "object") {
            var users = params.users;
            if (typeof users === 'undefined' || users.length < 1) {
                return 'Users List Required';
            }
            if (users.length > MCK_GROUPMAXSIZE) {
                return 'Users limit exceeds ' + MCK_GROUPMAXSIZE + '. Max number of users allowed is ' + MCK_GROUPMAXSIZE + '.';
            }
            if (!params.groupName) {
                return 'Group name required';
            }
            if (typeof params.type === 'undefined') {
                return 'Group type required';
            }
            if (GROUP_TYPE_MAP.indexOf(params.type) === -1) {
                return 'Invalid group type';
            }
            mckMessageService.getGroup(params);
            return 'success';
        } else {
            return 'Unsupported format. Please check format';
        }
    };
    _this.getContactFromGroupOfTwo = function(group) {
        for (var i = 0; i < group.members.length; i++) {
            if (MCK_USER_ID === '' + group.members[i]) {
                continue;
            }
            return mckMessageLayout.fetchContact('' + group.members[i]);
        }
    };
    _this.addGroupFromMessage = function(message, update) {
        var groupId = message.groupId;
        var group = mckGroupUtils.getGroup('' + groupId);
        if (typeof group === 'undefined') {
            group = mckGroupUtils.createGroup(groupId);
            mckGroupService.loadGroups({
                apzCallback: mckGroupLayout.loadGroupsCallback
            });
        }
        _this.updateRecentConversationList(group, message, update);
    };
    _this.isGroupDeleted = function(tabId, isGroup) {
        if (isGroup) {
            var deletedAtTime = mckGroupLayout.getDeletedAtTime(tabId);
            return (typeof deletedAtTime !== 'undefined' && deletedAtTime > 0);
        }
        return false;
    };
    _this.loadGroupsCallback = function(response) {
        var groups = response.data;
        MCK_GROUP_ARRAY.length = 0;
        $applozic.each(groups, function(i, group) {
            if ((typeof group.id !== 'undefined')) {
                var group = mckGroupUtils.addGroup(group);
                MCK_GROUP_ARRAY.push(group);
            }
        });
    };
    _this.getGroupDisplayName = function(groupId) {
        if (typeof MCK_GROUP_MAP[groupId] === 'object') {
            var group = MCK_GROUP_MAP[groupId];
            var displayName = group['displayName'];
            if (group.type === 7) {
                var contact = mckMessageLayout.getContactFromGroupOfTwo(group);
                if (typeof contact !== 'undefined') {
                    displayName = mckMessageLayout.getTabDisplayName(contact.contactId, false);
                }
            }
            if (group.type === 3) {
                if (displayName.indexOf(MCK_USER_ID) !== -1) {
                    displayName = displayName.replace(MCK_USER_ID, '').replace(":", '');
                    if (typeof(MCK_GETUSERNAME) === "function") {
                        var name = (MCK_GETUSERNAME(displayName));
                        displayName = (name) ? name : displayName;
                    }
                }
            }
            if (!displayName && group.type === 5) {
                displayName = 'Broadcast';
            }
            if (!displayName) {
                displayName = group.contactId;
            }
            return displayName;
        } else {
            return groupId;
        }
    };
    _this.getGroupImage = function(imageSrc) {
        return (imageSrc) ? '<img src="' + imageSrc + '"/>' : '<img src="' + MCK_BASE_URL + '/resources/sidebox/css/app/images/mck-icon-group.png"/>';
    };
    _this.getGroupDefaultIcon = function() {
        return '<div class="mck-group-icon-default"></div>';
    };
    _this.addMemberToGroup = function(group, userId) {
        if (typeof group.members === 'object') {
            if (group.members.indexOf(userId) === -1) {
                group.members.push(userId);
            }
            if (typeof group.removedMembersId === 'object' && (group.removedMembersId.indexOf(userId) !== -1)) {
                group.removedMembersId.splice(group.removedMembersId.indexOf(userId), 1);
            }
            MCK_GROUP_MAP[group.contactId] = group;
        }
        return group;
    };
    _this.removeMemberFromGroup = function(group, userId) {
        if (typeof group.removedMembersId !== 'object' || group.removedMembersId.length < 1) {
            group.removedMembersId = [];
            group.removedMembersId.push(userId);
        } else if (group.removedMembersId.indexOf(userId) === -1) {
            group.removedMembersId.push(userId);
        }
        MCK_GROUP_MAP[group.contactId] = group;
        return group;
    };
    _this.authenticateGroupUser = function(group) {
        var isGroupLeft = _this.isGroupLeft(group);
        var isGroupMemeber = false;
        if (!isGroupLeft && group.members.length > 0) {
            for (var i = 0; i < group.members.length; i++) {
                if (MCK_USER_ID === '' + group.members[i]) {
                    isGroupMemeber = true;
                    return true;
                }
            }
        }
        return isGroupMemeber;
    };
    _this.isAppendOpenGroupContextMenu = function(group) {
        if (MCK_OPEN_GROUP_SETTINGS.deleteChatAccess === 0) {
            return false;
        }
        var isGroupMember = _this.authenticateGroupUser(group);
        if (!isGroupMember) {
            return false;
        }
        if (group.adminName === MCK_USER_ID) {
            return true;
        }

        if (MCK_OPEN_GROUP_SETTINGS.deleteChatAccess === 2) {
            return true;
        }
        return false;
    }
    _this.isGroupLeft = function(group) {
        var isGroupLeft = false;
        if (group.removedMembersId && group.removedMembersId.length > 0) {
            $applozic.each(group.removedMembersId, function(i, removedMemberId) {
                if (removedMemberId === MCK_USER_ID) {
                    isGroupLeft = true;
                }
            });
        }
        return isGroupLeft;
    };
    _this.reloadGroupTab = function(group) {
        var currTabId = $mck_msg_inner.data('mck-id');
        var isGroupTab = $mck_msg_inner.data('isgroup');
        if (currTabId === group.contactId.toString() && isGroupTab) {
            _this.addGroupStatus(group);
        }
    };
    _this.loadGroupTab = function(response) {
        if (response.status === 'error') {
            alert("Unable to process your request. " + response.errorMessage);
        } else {
            var group = response.data;
            mckMessageLayout.loadTab({
                tabId: group.contactId,
                'isGroup': true
            });
            $applozic("#mck-search").val('');
        }
    };
    _this.addMembersToGroupInfoList = function(group) {
        var userIdArray = group.members;
        userIdArray.sort();
        $mck_group_member_List.html('');
        $applozic.each(userIdArray, function(i, userId) {
            if (userId) {
                var contact = mckMessageLayout.fetchContact('' + userId);
                if ($applozic('#li-gm-' + contact.htmlId).length === 0) {
                    _this.addGroupMemberTemplate(group, contact);
                }
            }
        });
        _this.sortGroupMemberHtmlList();
        _this.enableGroupAdminMenuToggle();
    };
    _this.addGroupMemberTemplate = function(group, contact) {
        var isGroupAdminExpr = 'n-vis';
        var enableAdminMenuExpr = 'n-vis';
        var groupUser = group.users[contact.contactId];
        var roleExpr = 'Member';
        var roleValue = 3;
        if (groupUser && typeof groupUser.role !== 'undefined') {
            roleValue = groupUser.role;
            roleExpr = ROLE_MAP[groupUser.role];
        }
        var displayName = mckMessageLayout.getTabDisplayName(contact.contactId, false);
        if (contact.contactId === group.adminName) {
            isGroupAdminExpr = "vis";
        }
        if (group.adminName === MCK_USER_ID) {
            enableAdminMenuExpr = "vis";
        }
        if (contact.contactId === MCK_USER_ID) {
            displayName = 'You';
            enableAdminMenuExpr = 'n-vis';
        }
        var imgsrctag = mckMessageLayout.getContactImageLink(contact, displayName);
        var lastSeenStatus = '';
        if (!MCK_BLOCKED_TO_MAP[contact.contactId]) {
            if (w.MCK_OL_MAP[contact.contactId]) {
                lastSeenStatus = MCK_LABELS['online'];
            } else if (MCK_LAST_SEEN_AT_MAP[contact.contactId]) {
                lastSeenStatus = mckDateUtils.getLastSeenAtStatus(MCK_LAST_SEEN_AT_MAP[contact.contactId]);
            }
        }
        var contactList = [{
            roleExpr: roleExpr,
            roleVal: roleValue,
            removeMemberLabel: MCK_LABELS['remove.member'],
            changeRoleLabel: MCK_LABELS['change.role'],
            contHtmlExpr: contact.htmlId,
            contIdExpr: contact.contactId,
            contImgExpr: imgsrctag,
            contLastSeenExpr: lastSeenStatus,
            contNameExpr: displayName,
            contFirstAlphaExpr: displayName.charAt(0).toUpperCase(),
            isAdminExpr: isGroupAdminExpr,
            enableAdminMenuExpr: enableAdminMenuExpr
        }];
        $applozic.tmpl('groupMemberTemplate', contactList).appendTo('#mck-group-member-list');
    };


  }

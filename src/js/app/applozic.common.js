var $applozic = jQuery.noConflict(true);
if (typeof $original !== 'undefined') {
    $ = $original;
    jQuery = $original;
    if (typeof $.fn.template === 'function') {
        $applozic.fn.template = $.fn.template;
        jQuery.fn.template = $.fn.template;
    } else if (typeof $applozic.fn.template === 'function') {
        $.fn.template = $applozic.fn.template;
        jQuery.fn.template = $applozic.fn.template;
    }
}
var w = window,
    d = document;
var MCK_LABELS;
var MCK_BASE_URL;
var MCK_CURR_LATITIUDE = 40.7324319;
var MCK_CURR_LONGITUDE = -73.82480777777776;
var mckUtils = new MckUtils();
mckUtils.init();
var mckDateUtils = new MckDateUtils();
var mckGroupUtils = new MckGroupUtils();
var mckContactUtils = new MckContactUtils();
var mckGroupService = new MckGroupService();
var mckMapUtils = new MckMapUtils();
var mckNotificationUtils = new MckNotificationUtils();
function MckUtils() {
    var _this = this;
    var TEXT_NODE = 3,
        ELEMENT_NODE = 1,
        TAGS_BLOCK = [ 'p', 'div', 'pre', 'form' ];
    _this.init = function() {
        $applozic.ajax({
            url: "https://apps.applozic.com/v2/tab/initialize.page",
            contentType: 'application/json',
            type: 'OPTIONS'
        }).done(function(data) {});

        $applozic.ajax({
            url: "https://apps.applozic.com/rest/ws/message/list",
            contentType: 'application/json',
            type: 'OPTIONS'
        }).done(function(data) {});
    }
    _this.randomId = function() {
        return w.Math.random().toString(36).substring(7);
    };
    _this.textVal = function($element) {
        var lines = [];
        var line = [];
        var flush = function() {
            lines.push(line.join(''));
            line = [];
        };
        var sanitizeNode = function(node) {
            if (node.nodeType === TEXT_NODE) {
                line.push(node.nodeValue);
            } else if (node.nodeType === ELEMENT_NODE) {
                var tagName = node.tagName.toLowerCase();
                var isBlock = TAGS_BLOCK.indexOf(tagName) !== -1;
                if (isBlock && line.length) {
                    flush();
                }
                if (tagName === 'img') {
                    var alt = node.getAttribute('alt') || '';
                    if (alt) {
                        line.push(alt);
                    }
                    return;
                } else if (tagName === 'style') {
                    return;
                } else if (tagName === 'br') {
                    flush();
                }
                var children = node.childNodes;
                for (var i = 0; i < children.length; i++) {
                    sanitizeNode(children[i]);
                }
                if (isBlock && line.length) {
                    flush();
                }
            }
        };
        var children = $element.childNodes;
        for (var i = 0; i < children.length; i++) {
            sanitizeNode(children[i]);
        }
        if (line.length) {
            flush();
        }
        return lines.join('\n');
    };
    _this.mouseX = function(evt) {
        if (evt.pageX) {
            return evt.pageX;
        } else if (evt.clientX) {
            return evt.clientX + (d.documentElement.scrollLeft ? d.documentElement.scrollLeft : d.body.scrollLeft);
        } else {
            return null;
        }
    };
    _this.mouseY = function(evt) {
        if (evt.pageY) {
            return evt.pageY;
        } else if (evt.clientY) {
            return evt.clientY + (d.documentElement.scrollTop ? d.documentElement.scrollTop : d.body.scrollTop);
        } else {
            return null;
        }
    };
    _this.startsWith = function(matcher, str) {
        if (str === null || typeof matcher === 'undefined')
            return false;
        var i = str.length;
        if (matcher.length < i)
            return false;
        for (--i; (i >= 0) && (matcher[i] === str[i]); --i)
            continue;
        return i < 0;
    };
    _this.setEndOfContenteditable = function(contentEditableElement) {
        var range,
            selection;
        if (document.createRange) //Firefox, Chrome, Opera, Safari, IE 9+
        {
            range = document.createRange(); //Create a range (a range is a like the selection but invisible)
            range.selectNodeContents(contentEditableElement); //Select the entire contents of the element with the range
            range.collapse(false); //collapse the range to the end point. false means collapse to end rather than the start
            selection = window.getSelection(); //get the selection object (allows you to change selection)
            selection.removeAllRanges(); //remove any selections already made
            selection.addRange(range); //make the range you have just created the visible selection
        } else if (document.selection) //IE 8 and lower
        {
            range = document.body.createTextRange(); //Create a range (a range is a like the selection but invisible)
            range.moveToElementText(contentEditableElement); //Select the entire contents of the element with the range
            range.collapse(false); //collapse the range to the end point. false means collapse to end rather than the start
            range.select(); //Select the range (make it the visible selection
        }
    };

    this.encryptionKey = null;
    this.getEncryptionKey = function() {
        return this.encryptionKey;
    }
    this.setEncryptionKey = function(key) {
        this.encryptionKey = key;
    }

    _this.b64EncodeUnicode = function(str) {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
            return String.fromCharCode('0x' + p1);
        }));
    };

    _this.b64DecodeUnicode = function(str) {
        return decodeURIComponent(Array.prototype.map.call(atob(str), function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    };

    _this.ajax = function(options) {
        //var reqOptions = Object.assign({}, options);
        var reqOptions = $applozic.extend({}, {}, options);
        if (this.getEncryptionKey()) {
            var key = aesjs.util.convertStringToBytes(this.getEncryptionKey());
            var iv = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];

            if (reqOptions.type.toLowerCase() === 'post') {
                // encrypt Data
                while (options.data.length % 16 != 0) {
                    options.data += ' ';
                }
                var aesCtr = new aesjs.ModeOfOperation.ecb(key);
                var bytes = aesjs.util.convertStringToBytes(options.data);
                var encryptedBytes = aesCtr.encrypt(bytes);
                var encryptedStr = String.fromCharCode.apply(null, encryptedBytes);
                reqOptions.data = btoa(encryptedStr);
            }

            reqOptions.success = function(data) {
                // Decrypt response
                var decodedData = atob(data);
                var arr = [];
                for (var i = 0; i < decodedData.length; i++) {
                    arr.push(decodedData.charCodeAt(i));
                }
                var aesCtr = new aesjs.ModeOfOperation.ecb(key);
                var decryptedBytes = aesCtr.decrypt(arr);
                var res = aesjs.util.convertBytesToString(decryptedBytes);
                res = res.replace(/\\u0000/g, '').replace(/^\s*|\s*[\x00-\x10]*$/g, '');
                if (_this.isJsonString(res)) {
                    options.success(JSON.parse(res));
                } else {
                    options.success(res);
                }
            }
        }
        $applozic.ajax(reqOptions);
    };

    _this.isJsonString = function(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    };

}
function MckContactUtils() {
    var _this = this;
    _this.getContactId = function(contact) {
        var contactId = contact.contactId;
        return _this.formatContactId(contactId);
    };
    _this.formatContactId = function(contactId) {
        if (contactId.indexOf('+') === 0) {
            contactId = contactId.substring(1);
        }
        contactId = decodeURIComponent(contactId);
        return $applozic.trim(contactId.replace(/\@/g, 'AT').replace(/\./g, 'DOT').replace(/\*/g, 'STAR').replace(/\#/g, 'HASH').replace(/\|/g, 'VBAR').replace(/\+/g, 'PLUS').replace(/\;/g, 'SCOLON').replace(/\?/g, 'QMARK').replace(/\,/g, 'COMMA').replace(/\:/g, 'COLON'));
    };
}
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
    var GROUP_LIST_URL = "/rest/ws/group/list";
    var GROUP_FEED_URL = "/rest/ws/group/info";
    var GROUP_LEAVE_URL = "/rest/ws/group/left";
    var GROUP_UPDATE_INFO_URL = "/rest/ws/group/update";
    var GROUP_ADD_MEMBER_URL = "/rest/ws/group/add/member";
    var GROUP_REMOVE_MEMBER_URL = "/rest/ws/group/remove/member";
    _this.loadGroups = function(params) {
        var response = new Object();
        mckUtils.ajax({
            url: MCK_BASE_URL + GROUP_LIST_URL,
            type: 'get',
            global: false,
            success: function(data) {
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
            error: function(xhr, desc, err) {
                 if (xhr.status === 401) {
                    sessionStorage.clear();
                }
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
    _this.getGroupFeed = function(params) {
        var data = "";
        if (typeof params.callback === 'function' || typeof params.apzCallback === 'function') {
            var response = new Object();
        } else {
            return;
        }
        if (params.groupId) {
            data += "groupId=" + params.groupId;
        } else if (params.clientGroupId) {
            data += "clientGroupId=" + params.clientGroupId;
        } else {
            if (typeof params.callback === 'function') {
                response.status = "error";
                response.errorMessage = "GroupId or Client GroupId Required";
                params.callback(response);
            }
            return;
        }
        if (params.conversationId) {
            data += "&conversationId=" + params.conversationId;
        }
        mckUtils.ajax({
            url: MCK_BASE_URL + GROUP_FEED_URL,
            data: data,
            type: 'get',
            global: false,
            success: function(data) {
                if (data.status === "success") {
                    var groupFeed = data.response;
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
            error: function() {
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
    _this.leaveGroup = function(params) {
        var data = "";
        var response = new Object();
        if (params.groupId) {
            data += "groupId=" + params.groupId;
        } else if (params.clientGroupId) {
            data += "clientGroupId=" + params.clientGroupId;
        } else {
            response.status = "error";
            response.errorMessage = "GroupId or Client GroupId Required";
            if (params.callback) {
                params.callback(response);
            }
            return;
        }
        mckUtils.ajax({
            url: MCK_BASE_URL + GROUP_LEAVE_URL,
            data: data,
            type: 'get',
            global: false,
            success: function(data) {
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
            error: function() {
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
    _this.removeGroupMember = function(params) {
        var data = '';
        var response = new Object();
        if (params.groupId) {
            data += 'groupId=' + params.groupId;
        } else if (params.clientGroupId) {
            data += 'clientGroupId=' + params.clientGroupId;
        } else {
            response.status = 'error';
            response.errorMessage = "GroupId or Client GroupId Required";
            if (typeof params.callback === 'function') {
                params.callback(response);
            }
            return;
        }
        data += '&userId=' + encodeURIComponent(params.userId);
        mckUtils.ajax({
            url: MCK_BASE_URL + GROUP_REMOVE_MEMBER_URL,
            data: data,
            type: 'get',
            global: false,
            success: function(data) {
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
            error: function() {
                console.log('Unable to process your request. Please reload page.');
                response.status = 'error';
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
    _this.addGroupMember = function(params) {
        var data = '';
        var response = new Object();
        if (params.groupId) {
            data += 'groupId=' + params.groupId;
        } else if (params.clientGroupId) {
            data += 'clientGroupId=' + params.clientGroupId;
        } else {
            if (typeof params.callback === 'function') {
                params.callback(response);
            }
            return;
        }
        data += '&userId=' + encodeURIComponent(params.userId);
        if (typeof params.role !== 'undefined') {
            data += '&role=' + params.role;
        }
        mckUtils.ajax({
            url: MCK_BASE_URL + GROUP_ADD_MEMBER_URL,
            data: data,
            type: 'get',
            global: false,
            success: function(data) {
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
            error: function() {
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
    _this.updateGroupInfo = function(params) {
        var groupInfo = {};
        var response = new Object();
        if (params.groupId) {
            groupInfo.groupId = params.groupId;
        } else if (params.clientGroupId) {
            groupInfo.clientGroupId = params.clientGroupId;
        } else {
            if (typeof params.callback === 'function') {
                response.status = 'error';
                response.errorMessage = 'GroupId or Client GroupId Required';
                params.callback(response);
            }
            return;
        }
        if (params.name) {
            groupInfo.newName = params.name;
        }
        if (params.imageUrl) {
            groupInfo.imageUrl = params.imageUrl;
        }
        if (params.users && params.users.length > 0) {
            groupInfo.users = params.users;
        }
        mckUtils.ajax({
            url: MCK_BASE_URL + GROUP_UPDATE_INFO_URL,
            type: 'post',
            data: JSON.stringify(groupInfo),
            contentType: 'application/json',
            global: false,
            success: function(data) {
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
                        groupInfo: groupInfo
                    })
                }
            },
            error: function() {
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
}

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
var mckDateUtils = new MckDateUtils();
var mckContactUtils = new MckContactUtils();
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
    _this.badgeCountOnLaucher = function(enablebadgecount,totalunreadCount) {
    	   var element = document.getElementById("applozic-badge-count");
       if(enablebadgecount === true && totalunreadCount > 0){
    	       element.innerHTML = totalunreadCount;
    	       element.classList.add("mck-badge-count");
        }
        if(enablebadgecount === true && totalunreadCount === 0){
        	   element.innerHTML ="";
        	   element.classList.remove("mck-badge-count");
        }
    };
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

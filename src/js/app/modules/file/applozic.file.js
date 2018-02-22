function MckFileService() {
    var _this = this;

    var ONE_KB = 1024;
    var ONE_MB = 1048576;
    var UPLOAD_VIA = ['CREATE', 'UPDATE'];
    var $file_box = $applozic("#mck-file-box");
    var $mck_overlay = $applozic(".mck-overlay");
    var $mck_msg_sbmt = $applozic("#mck-msg-sbmt");
    var $mck_text_box = $applozic("#mck-text-box");
    var $mck_file_input = $applozic("#mck-file-input");
    var $mck_overlay_box = $applozic(".mck-overlay-box");
    var $mck_file_upload = $applozic(".mck-file-upload");
    var $mck_group_icon_upload = $applozic("#mck-group-icon-upload");
    var $mck_group_icon_change = $applozic("#mck-group-icon-change");
    var $mck_group_info_icon_box = $applozic("#mck-group-info-icon-box");
    var $mck_btn_group_icon_save = $applozic("#mck-btn-group-icon-save");
    var $mck_msg_inner = $applozic("#mck-message-cell .mck-message-inner");
    var $mck_group_create_icon_box = $applozic("#mck-group-create-icon-box");
    var $mck_group_info_icon_loading = $applozic("#mck-group-info-icon-loading");
    var $mck_group_create_icon_loading = $applozic("#mck-group-create-icon-loading");
    var $mck_group_info_icon = $applozic("#mck-group-info-icon-box .mck-group-icon");
    var $mck_group_create_icon = $applozic("#mck-group-create-icon-box .mck-group-icon");
    var $mck_gc_overlay_label = $applozic("#mck-gc-overlay-label");
    var FILE_PREVIEW_URL = "/rest/ws/aws/file";
    var FILE_UPLOAD_URL = "/rest/ws/aws/file/url";
    var FILE_AWS_UPLOAD_URL = "/rest/ws/upload/file";
    var FILE_DELETE_URL = "/rest/ws/aws/file/delete";
    var mck_filebox_tmpl = '<div id="mck-filebox-${fileIdExpr}" class="mck-file-box ${fileIdExpr}">' + '<div class="mck-file-expr">' + '<span class="mck-file-content blk-lg-8"><span class="mck-file-lb">{{html fileNameExpr}}</span>&nbsp;<span class="mck-file-sz">${fileSizeExpr}</span></span>' + '<span class="progress progress-striped active blk-lg-3" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span class="progress-bar progress-bar-success bar" stye></span></span>' + '<span class="move-right">' + '<button type="button" class="mck-box-close mck-remove-file" data-dismiss="div" aria-hidden="true">x</button>' + '</span></div></div>';
    $applozic.template("fileboxTemplate", mck_filebox_tmpl);
    _this.init = function() {
        $mck_file_upload.on('click', function() {
            $mck_file_input.trigger('click');
        });
        $mck_group_icon_upload.on('change', function() {
            var file = $applozic(this)[0].files[0];
            _this.uplaodFileToAWS(file, UPLOAD_VIA[0]);
            return false;
        });
        $mck_group_icon_change.on('change', function() {
            var file = $applozic(this)[0].files[0];
            _this.uplaodFileToAWS(file, UPLOAD_VIA[1]);
            return false;
        });
        $mck_file_input.on('change', function() {
            var file = $applozic(this)[0].files[0];
            var params = {};
            params.file = file;
            params.name = file.name;
            _this.uploadFile(params);
        });
        $applozic(d).on("click", '.mck-remove-file', function() {
            var $currFileBox = $applozic(this).parents('.mck-file-box');
            var currFileMeta = $currFileBox.data('mckfile');
            $currFileBox.remove();
            $mck_msg_sbmt.attr('disabled', false);
            if ($file_box.find('.mck-file-box').length === 0) {
                $file_box.removeClass('vis').addClass('n-vis');
                $mck_text_box.attr("required", '');
            }
            if (typeof currFileMeta === 'object') {
                _this.deleteFileMeta(currFileMeta.blobKey);
                $applozic.each(FILE_META, function(i, fileMeta) {
                    if (typeof fileMeta !== 'undefined' && fileMeta.blobKey === currFileMeta.blobKey) {
                        FILE_META.splice(i, 1);
                    }
                });
            }
        });
    };
    _this.audioRecoder = function(params) {
           var file = params.file;
        // $mck_msg_inner = mckMessageLayout.getMckMessageInner();
          var data = new Object();
           var uploadErrors = [];
           if (typeof file === 'undefined') {
               return;
           }
           if ($applozic(".mck-file-box").length > 4) {
               uploadErrors.push("Can't upload more than 5 files at a time");
           }
           if (file['size'] > (MCK_FILEMAXSIZE * ONE_MB)) {
               uploadErrors.push("file size can not be more than " + MCK_FILEMAXSIZE + " MB");
           }
           if (uploadErrors.length > 0) {
               alert(uploadErrors.toString());
           } else {
               var randomId = mckUtils.randomId();
               var fileboxList = [ {
                   fileIdExpr : randomId,
                   fileName : params.name,
                   fileNameExpr : '<a href="#" target="_self" >' + params.name + '</a>',
                   fileSizeExpr : _this.getFilePreviewSize(file.size)
               } ];
               $applozic.tmpl("fileboxTemplate", fileboxList).appendTo('#mck-file-box');
               var $fileContainer = $applozic(".mck-file-box." + randomId);
               var $file_name = $applozic(".mck-file-box." + randomId + " .mck-file-lb");
               var $file_progressbar = $applozic(".mck-file-box." + randomId + " .progress .bar");
               var $file_progress = $applozic(".mck-file-box." + randomId + " .progress");
               var $file_remove = $applozic(".mck-file-box." + randomId + " .mck-remove-file");
               $file_progressbar.css('width', '0%');
               $file_progress.removeClass('n-vis').addClass('vis');
               $file_remove.attr("disabled", true);
               $mck_file_upload.attr("disabled", true);
               $file_box.removeClass('n-vis').addClass('vis');
               if (params.name === $applozic(".mck-file-box." + randomId + " .mck-file-lb a").html()) {
                   var currTab = $mck_msg_inner.data('mck-id');
                   var uniqueId = params.name + file.size;
                   TAB_FILE_DRAFT[uniqueId] = currTab;
                   $mck_msg_sbmt.attr('disabled', true);
                   data.files = [];
                   data.files.push(file);
                   var xhr = new XMLHttpRequest();
                   (xhr.upload || xhr).addEventListener('progress', function(e) {
                       var progress = parseInt(e.loaded / e.total * 100, 10);
                       $file_progressbar.css('width', progress + '%');
                   });
                   xhr.addEventListener('load', function(e) {
                       var responseJson = $applozic.parseJSON(this.responseText);
                       if (typeof responseJson.fileMeta === "object") {
                           var file_meta = responseJson.fileMeta;
                           var fileExpr = _this.getFilePreviewPath(file_meta);
                           var name = file_meta.name;
                           var size = file_meta.size;
                           var currTabId = $mck_msg_inner.data('mck-id');
                           var uniqueId = name + size;
                           var fileTabId = TAB_FILE_DRAFT[uniqueId];
                           if (currTab !== currTabId) {
                               mckMessageLayout.updateDraftMessage(fileTabId, file_meta);
                               delete TAB_FILE_DRAFT[uniqueId];
                               return;
                           }
                           $file_remove.attr("disabled", false);
                           $mck_file_upload.attr("disabled", false);
                           $mck_msg_sbmt.attr('disabled', false);
                           delete TAB_FILE_DRAFT[uniqueId];
                           $file_name.html(fileExpr);
                           $file_progress.removeClass('vis').addClass('n-vis');
                           $applozic(".mck-file-box .progress").removeClass('vis').addClass('n-vis');
                           $mck_text_box.removeAttr('required');
                           FILE_META.push(file_meta);
                           $fileContainer.data('mckfile', file_meta);
                           $mck_file_upload.children('input').val("");
                           return false;
                       } else {
                           $file_remove.attr("disabled", false);
                           $mck_msg_sbmt.attr('disabled', false);
                           // FILE_META
                           // = "";
                           $file_remove.trigger('click');
                       }
                   });
                   var url = MCK_FILE_URL + FILE_UPLOAD_URL;

                   window.Applozic.ALApiService.fileUpload({
                       data: { url: url },
                       success: function (result) {
                           var fd = new FormData();
                           fd.append('files[]', file);
                           xhr.open("POST", result, true);
                           xhr.send(fd);
                       },
                       error: function () { }
                   }
                   );
               }
               return false;
           }

       };
    _this.uploadFile = function(params) {
        var file = params.file;
        var data = new Object();
        var uploadErrors = [];
        if (typeof file === 'undefined') {
            return;
        }
        if ($applozic(".mck-file-box").length > 4) {
            uploadErrors.push("Can't upload more than 5 files at a time");
        }
        if (file['size'] > (MCK_FILEMAXSIZE * ONE_MB)) {
            uploadErrors.push("file size can not be more than " + MCK_FILEMAXSIZE + " MB");
        }
        if (uploadErrors.length > 0) {
            alert(uploadErrors.toString());
        } else {
            var randomId = mckUtils.randomId();
            var fileboxList = [{
                fileIdExpr: randomId,
                fileName: params.name,
                fileNameExpr: '<a href="#" target="_self">' + params.name + '</a>',
                fileSizeExpr: _this.getFilePreviewSize(file.size)
            }];
            $applozic.tmpl("fileboxTemplate", fileboxList).appendTo('#mck-file-box');
            var $fileContainer = $applozic(".mck-file-box." + randomId);
            var $file_name = $applozic(".mck-file-box." + randomId + " .mck-file-lb");
            var $file_progressbar = $applozic(".mck-file-box." + randomId + " .progress .bar");
            var $file_progress = $applozic(".mck-file-box." + randomId + " .progress");
            var $file_remove = $applozic(".mck-file-box." + randomId + " .mck-remove-file");
            $file_progressbar.css('width', '0%');
            $file_progress.removeClass('n-vis').addClass('vis');
            $file_remove.attr("disabled", true);
            $mck_file_upload.attr("disabled", true);
            $file_box.removeClass('n-vis').addClass('vis');
            if (params.name === $applozic(".mck-file-box." + randomId + " .mck-file-lb a").html()) {
                var currTab = $mck_msg_inner.data('mck-id');
                var uniqueId = params.name + file.size;
                TAB_FILE_DRAFT[uniqueId] = currTab;
                $mck_msg_sbmt.attr('disabled', true);
                data.files = [];
                data.files.push(file);
                var xhr = new XMLHttpRequest();
                (xhr.upload || xhr).addEventListener('progress', function(e) {
                    var progress = parseInt(e.loaded / e.total * 100, 10);
                    $file_progressbar.css('width', progress + '%');
                });
                xhr.addEventListener('load', function(e) {
                    var responseJson = $applozic.parseJSON(this.responseText);
                    if (typeof responseJson.fileMeta === "object") {
                        var file_meta = responseJson.fileMeta;
                        var fileExpr = _this.getFilePreviewPath(file_meta);
                        var name = file_meta.name;
                        var size = file_meta.size;
                        var currTabId = $mck_msg_inner.data('mck-id');
                        var uniqueId = name + size;
                        var fileTabId = TAB_FILE_DRAFT[uniqueId];
                        if (currTab !== currTabId) {
                            mckMessageLayout.updateDraftMessage(fileTabId, file_meta);
                            delete TAB_FILE_DRAFT[uniqueId];
                            return;
                        }
                        $file_remove.attr('disabled', false);
                        $mck_file_upload.attr('disabled', false);
                        $mck_msg_sbmt.attr('disabled', false);
                        delete TAB_FILE_DRAFT[uniqueId];
                        $file_name.html(fileExpr);
                        $file_progress.removeClass('vis').addClass('n-vis');
                        $applozic(".mck-file-box .progress").removeClass('vis').addClass('n-vis');
                        $mck_text_box.removeAttr('required');
                        FILE_META.push(file_meta);
                        $fileContainer.data('mckfile', file_meta);
                        $mck_file_upload.children('input').val('');
                        return false;
                    } else {
                        $file_remove.attr("disabled", false);
                        $mck_msg_sbmt.attr('disabled', false);
                        // FILE_META
                        // = '';
                        $file_remove.trigger('click');
                    }
                });
                var url = MCK_FILE_URL + FILE_UPLOAD_URL;

                window.Applozic.ALApiService.fileUpload({
                    data: { url: url },
                    success: function (result) {
                        var fd = new FormData();
                        fd.append('files[]', file);
                        xhr.open("POST", result, true);
                        xhr.send(fd);
                    },
                    error: function () { }
                }
                );
            }
            return false;
        }
    };
    _this.uplaodFileToAWS = function(file, medium) {
        var data = new FormData();
        var uploadErrors = [];
        if (typeof file === 'undefined') {
            return;
        }
        if (file['type'].indexOf("image") === -1) {
            uploadErrors.push("Please upload image file.");
        }
        if (uploadErrors.length > 0) {
            alert(uploadErrors.toString());
        } else {
            $mck_overlay.attr('disabled', true);
            if (UPLOAD_VIA[0] === medium) {
                $mck_group_create_icon_box.find('.mck-overlay-box').removeClass('n-vis');
                $mck_group_create_icon_box.removeClass('mck-hover-on');
                $mck_group_create_icon_loading.removeClass('n-vis').addClass('vis');
            } else {
                $mck_group_info_icon_box.find('.mck-overlay-box').removeClass('n-vis');
                $mck_group_info_icon_box.removeClass('mck-hover-on');
                $mck_group_info_icon_loading.removeClass('n-vis').addClass('vis');
            }
            var xhr = new XMLHttpRequest();
            xhr.addEventListener('load', function(e) {
                var fileUrl = this.responseText;
                if (fileUrl) {
                    if (UPLOAD_VIA[0] === medium) {
                        $mck_group_create_icon.html('<img src="' + fileUrl + '"/>');
                        $mck_group_create_icon.data('iconurl', fileUrl);
                        $mck_gc_overlay_label.html(MCK_LABELS['change.group.icon']);
                        $mck_group_create_icon_loading.removeClass('vis').addClass('n-vis');
                        $mck_group_create_icon_box.addClass('mck-hover-on');
                    } else {
                        $mck_group_info_icon.html('<img src="' + fileUrl + '"/>');
                        $mck_group_info_icon.data('iconurl', fileUrl);
                        $mck_group_info_icon_loading.removeClass('vis').addClass('n-vis')
                        $mck_group_info_icon_box.addClass('mck-hover-on');
                        setTimeout(function() {
                            $mck_btn_group_icon_save.removeClass('n-vis').addClass('vis');
                        }, 1500);
                    }
                    setTimeout(function() {
                        $mck_overlay_box.addClass('n-vis');
                    }, 1500);
                }
                $mck_overlay.attr("disabled", false);
                (UPLOAD_VIA[0] === medium) ? $mck_group_icon_upload.val(''): $mck_group_icon_change.val('');
                return false;
            });
            data.append("file", file);
            xhr.open('post', MCK_BASE_URL + FILE_AWS_UPLOAD_URL, true);
            xhr.setRequestHeader("UserId-Enabled", true);
            xhr.setRequestHeader("Authorization", "Basic " + AUTH_CODE);
            xhr.setRequestHeader("Application-Key", MCK_APP_ID);
            xhr.setRequestHeader("Device-Key", USER_DEVICE_KEY);
            if (MCK_ACCESS_TOKEN) {
                xhr.setRequestHeader("Access-Token", MCK_ACCESS_TOKEN);
            }
            xhr.send(data);
        }
    };

    _this.deleteFileMeta = function (blobKey) {
        window.Applozic.ALApiService.deleteFileMeta({
            data: { blobKey: blobKey, url: MCK_FILE_URL + FILE_DELETE_URL + '?key=' + blobKey, },
            success: function (response) { console.log(response); }, error: function () { }
        });
    };
    _this.getFilePreviewPath = function(fileMeta) {
        return (typeof fileMeta === "object") ? '<a href="' + MCK_FILE_URL + FILE_PREVIEW_URL + fileMeta.blobKey + '" target="_blank">' + fileMeta.name + '</a>' : '';
    };
    _this.getFilePreviewSize = function(fileSize) {
        if (fileSize) {
            if (fileSize > ONE_MB) {
                return "(" + parseInt(fileSize / ONE_MB) + " MB)";
            } else if (fileSize > ONE_KB) {
                return "(" + parseInt(fileSize / ONE_KB) + " KB)";
            } else {
                return "(" + parseInt(fileSize) + " B)";
            }
        }
        return '';
    };
    _this.addFileBox = function(file) {
        var fileboxId = mckUtils.randomId();
        var fileName = '';
        if (typeof file.fileMeta === 'object') {
            fileboxId = file.fileMeta.createdAtTime;
            fileName = file.fileMeta.name;
        }
        var fileboxList = [{
            fileNameExpr: file.filelb,
            fileSizeExpr: file.filesize,
            fileIdExpr: fileboxId,
            fileName: fileName
        }];
        $applozic.tmpl("fileboxTemplate", fileboxList).appendTo('#mck-file-box');
        var $fileContainer = $applozic(".mck-file-box." + fileboxId);
        var $file_remove = $fileContainer.find(".mck-remove-file");
        var $file_progress = $fileContainer.find(".progress");
        if (typeof file.fileMeta === 'object') {
            $fileContainer.data('mckblob', file.fileMeta.blobKey);
            $mck_text_box.removeAttr('required');
            $mck_msg_sbmt.attr('disabled', false);
            $file_remove.attr('disabled', false);
            $file_progress.removeClass('vis').addClass('n-vis');
            FILE_META.push(file.fileMeta);
        } else {
            $mck_msg_sbmt.attr('disabled', true);
            $file_remove.attr('disabled', true);
            $file_progress.removeClass('n-vis').addClass('vis');
        }
    };
}

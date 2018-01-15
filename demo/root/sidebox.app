

window.applozic = window.applozic || {};
var MCK_CONTEXTPATH = "https://apps.applozic.com:443";
var MCK_STATICPATH = "https://apps.applozic.com/resources/2636";
var MCK_ONINIT = "";
 window.applozic.PRODUCT_ID= ""?"":"applozic-chat";
// $.getScript(MCK_STATICPATH + '/sidebox/js/app/mck-app.js');
var options = applozic._globals;
if (typeof options !== 'undefined') {
    MCK_ONINIT = options.onInit;
}
window.addEventListener('error', function (e) {
    if (typeof (e.target.src) !== 'undefined' &&  e.target.src.indexOf('sidebox') !== -1 && typeof MCK_ONINIT === 'function') {
        console.log("Plugin loading error. Refresh page.");
        MCK_ONINIT("error");
    }
}, true);
var imported = document.createElement('script');
imported.src = MCK_STATICPATH + '/sidebox/js/app/mck-app.js';
document.head.appendChild(imported);
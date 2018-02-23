var http = require("http");
var fs = require('fs');
var express = require('express');
var path = require('path');
var compressor = require('node-minify');
var app = express();
const argv = require('yargs').argv
var conf = require('config');
const port = conf.get('port');
const baseUrl = conf.get('baseUrl');
var replace = require("replace");

console.log(baseUrl);

compressor.minify({
  compressor: 'gcc',
  input: ['./public/plugin/js/applozic.socket.min.js', './public/plugin/js/app/modules/applozic.utils.js',
  './public/plugin/js/app/modules/applozic.chat.js', './public/plugin/js/app/modules/api/applozic.api.js',
  './public/plugin/js/app/modules/socket/applozic.socket.js' ],
  output: './public/concat-min.js',
  callback: function (err, min) {}
});

// Define the port to run on
app.set('port', port); //

app.use('/nodejs-web-plugin',express.static(path.join(__dirname,'')));
app.get('/',function(request,response){
       response.sendFile(__dirname+'/index.html');
    });

//Listen for requests
var server = app.listen(app.get('port'), function(){
var port = server.address().port;
fs.readFile(path.join(__dirname,"./public/plugin/sample/temp/sideboxtest.html"), 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  var result = data.replace(":getBaseurl", baseUrl);

  fs.writeFile("./public/plugin/sample/sidebox.html",result, 'utf8', function (err) {
     if (err) return console.log(err);
  });
});
fs.readFile(path.join(__dirname,"./public/plugin/sample/temp/fullviewtest.html"), 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  var result = data.replace(":getBaseurl", baseUrl);

  fs.writeFile("./public/plugin/sample/fullview.html",result, 'utf8', function (err) {
     if (err) return console.log(err);
  });
});
fs.readFile(path.join(__dirname,"./public/plugin/sample/temp/coretest.html"), 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  var result = data.replace(":getBaseurl", baseUrl);

  fs.writeFile("./public/plugin/sample/core.html",result, 'utf8', function (err) {
     if (err) return console.log(err);
  });
});

fs.readFile(path.join(__dirname,"./public/demo/root/temp/indextest.js"), 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  var result = data.replace(":getBaseurl", baseUrl);

  fs.writeFile("./public/demo/index.js",result, 'utf8', function (err) {
     if (err) return console.log(err);
  });
});

console.log('Open localhost using port ' + port );//
});

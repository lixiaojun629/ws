/**
 * Created by L on 2015/12/8.
 */
var express = require('express');
var app = express();

//获取config 配置文件
var config = GLOBAL.config = require("./config.json")[app.get("env")];
var appId = GLOBAL.appId = process.argv[2] || 0;
var api_domain = GLOBAL.API_PATH = config.api_domain;

//创建http，ws链接
var http = require('http').Server(app);
var io = require('socket.io')(http);
var auth = require('./lib/auth.js');
var socket = require('./lib/socket.js');

//设置环境变量
app.set('port', config.app_port);
app.get('/', function(req, res){
    res.send('<h1>Welcome WebSocket Server</h1>');
});

/*
*
*设置CROS跨域头
app.all("*",function(req, res, next){
    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader("Access-Control-Allow-Methods","POST, GET, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Credentials",true);
    res.setHeader("Access-Control-Max-Age",'86400'); // 24 hours
    res.setHeader("Access-Control-Allow-Headers","Set-Cookie, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Access-Control-Allow-Origin, X-HTTP-Method-Override, Authorization");
    next();
});
*
*
*/

io.on('connection',socket);

io.use(auth);


function sendHandle(){
    var i = 0;
    var time;
    function s(){
        time && clearTimeout(time);
        if(i>=3) return;
        producer("broadcast.ddd",{a:'sss'});
        producer("single.dasd",{email:'wangjianliang@ucloud.cn'});
        i++;
        time = setTimeout(s,1000);
    }
    s();
}
var producer = require("./lib/producer.js");
setTimeout(sendHandle,5000)


var server = http.listen(app.get('port'), function(){
    console.log('WebSocket server listening on port :' + server.address().port);
});
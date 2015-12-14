/**
 * Created by L on 2015/12/8.
 */
var path = require('path');
var express = require('express');
var app = express();

//创建http，ws链接
var http = require('http').Server(app);
var io = require('socket.io')(http);

//获取config 配置文件
var config = GLOBAL.config = require("./config.json")[app.get("env")];
var appId = GLOBAL.appId = process.argv[2] || 0;

var socket = require('./lib/socket.js');

//设置环境变量
app.set('port', config.app_port);
app.get('/', function(req, res){
    res.send('<h1>Welcome WebSocket Server</h1>');
});

io.on('connection',function(socket){
    console.log('SocketIO connection success'+socket.id+":connection "+appId);
});
io.use(socket);

var server = http.listen(app.get('port'), function(){
    console.log('WebSocket server listening on port :' + server.address().port);
});
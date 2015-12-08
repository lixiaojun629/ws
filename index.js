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

//创建redis 客户端
var redis = require('redis');
var redis_client = redis.createClient(config.redis_store.port, config.redis_store.host);

//设置环境变量
app.set('port', config.app_port);

app.get('/', function(req, res){
    res.send('<h1>Welcome WebSocket Server</h1>');
});

var server = http.listen(app.get('port'), function(){
    console.log('WebSocket server listening on port :' + server.address().port);
});
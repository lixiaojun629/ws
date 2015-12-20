/**
 * Created by L on 2015/12/8.
 */
var _ = require('lodash');
var express = require('express');
var app = express();
//获取config 配置文件
var config = GLOBAL.config = require("./config.json")[app.get("env")];
var appId = GLOBAL.appId = process.argv[2] || 0;
var api_domain = GLOBAL.API_PATH = config.api_domain;
//创建http，ws链接
var http = require('http').Server(app);
//设置环境变量
app.set('port', config.app_port);
app.get('/', function(req, res){
    res.send('<h1>Welcome WebSocket Server</h1>');
});

var rabbit = require('./lib/rabbit.js');//全局消费者 所有的消息接收方
var consumer = require('./lib/consumer.js')();
var simple_map = require('./lib/simple_map.js')();
var rabbitConnection = rabbit.connection();
var rabbitLogger=require('./lib/logger.js').logger("rabbit");
var socketLogger=require('./lib/logger.js').logger("socket");

rabbitLogger.info('RabbitMQ Consumer connection start');

function rabbitConnectionHandle(){
    rabbitLogger.info('RabbitMQ Consumer connection success');
    var io = require('socket.io')(http);
    var auth = require('./lib/auth.js');
    io.use(auth);
    io.on('connection',function(socket){
        var socket_map = simple_map.get(socket.user)['socket_map'] || {};
        socket_map[socket.id] = {user:socket.user};
        simple_map.set(socket.user,{
            socket_map:socket_map
        });
        socketLogger.info(socket.user + ' : socket' + socket.id +'socketid : connection success');
        socket.on('disconnect',function(){
            delete simple_map.get(socket.user)['socket_map'][socket.id];
            if(_.isEmpty(socket_map)){
                simple_map.remove(socket.user);
            }
            socketLogger.info(socket.id+":disconnect "+appId);
        });
    });
    consumer.bind(rabbitConnection,'broadcast','broadcast.#',function(message){
        io.emit('message',message);
        rabbitLogger.info(message);
    });
    consumer.bind(rabbitConnection,'single','single.#',function(message){
        var user = message.email;
        if(user){
            var socket_map = simple_map.get(user)['socket_map'] || {};
            _.each(io.sockets.sockets,function(socket){
                if(socket_map[socket.id]){
                    socket.emit('message',message);
                }
            });
            rabbitLogger.info(message);
        }
    });
}

rabbitConnection.on('ready',rabbitConnectionHandle);




var a = require('./lib/producer.js');
setTimeout(function(){
    a('broadcast.adasdasd',{'aaaa':'asdsd'})
    a('broadcast.adasdasd',{'aaaa':'asdsd'})
    a('broadcast.adasdasd',{'aaaa':'asdsd'})
    a('broadcast.adasdasd',{'aaaa':'asdsd'})
    a('broadcast.adasdasd',{'aaaa':'asdsd'})
    a('broadcast.adasdasd',{'aaaa':'asdsd'})
    a('single.adasdasd',{'email':'wangjianliang@ucloud.cn',aaaaaa:'sssssss'})
},5000);


var server = http.listen(app.get('port'), function(){
    console.log('WebSocket server listening on port :' + server.address().port);
});
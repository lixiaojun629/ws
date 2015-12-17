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

var consumer = require("./lib/consumer.js")();
var producer = require("./lib/producer.js");
var logger=require('./lib/logger.js').logger("socket");

io.on('connection',function(socket){
    function broadcastHandle(message){
        logger.info('broadcast : ============================ : '+JSON.stringify(message));
        logger.info(socket.id +' : ===============================================================================================================');
        io.emit('message',JSON.stringify(message));
    }
    function singleHandle(message){
        var email = (message||{}).email;

        if(!email || email != socket.user){
            return;
        }

        logger.info('single : ============================ : '+JSON.stringify(message));
        logger.info(socket.id+'===============================================================================================================');
        socket.emit('message',JSON.stringify(message));
    }
    function consumerHandle(){
        //广播消息消费者
        consumer.bind('broadcast','broadcast.#',broadcastHandle);
        //定点消息消费者
        consumer.bind('single','single.#',singleHandle);
    }
    consumerHandle();
    console.log('SocketIO connection success'+socket.id+":connection "+appId);
});
io.use(socket);

var server = http.listen(app.get('port'), function(){
    console.log('WebSocket server listening on port :' + server.address().port);
});
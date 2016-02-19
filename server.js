/**
 * Created by L on 2015/12/8.
 */
var _ = require('lodash');
var express = require('express');
var consumer = require('./lib/consumer')();
var socketLogger = require('./lib/logger').logger("socket");
var auth = require('./lib/auth.js');
var subscribe = require('./lib/subscriber');

var dao = require('./lib/dao.js');
var messageDao =  dao.messageDao;
var userConnDao = dao.userConnDao;
var app = express();

//获取config 配置文件
var config = GLOBAL.config = require("./config.json")[app.get("env")];
var appId = GLOBAL.appId = process.argv[2] || 0;
var api_domain = GLOBAL.API_PATH = config.api_domain;
//创建http，ws链接
var server = require('http').Server(app);
var io = require('socket.io')(server);


//设置环境变量
app.set('port', config.app_port);

app.get('/', function (req, res) {
	res.send('<h1>Welcome WebSocket Server</h1>');
});

//校验用户登录态,绑定用户email到socket连接对象
io.use(auth);

/**
 * ws连接建立,把用户的ws连接id存放在redis相应的Set中
 * ws连接断开,在用户的ws连接Set中删除此连接id,若Set为空,则删除Set
 */
io.on('connection', function (socket) {
	var email = socket.UserEmail;
	socketLogger.info(email + ' : socket' + socket.id + 'socketid : connection success');
	userConnDao.save(email ,socket.id);

	//新连接建立,从 持久消息缓存(存储在redis)中取出需要发给此用户的所有消息,发送到客户端
	messageDao.getUserMessages(socket.UserEmail).then(function(userMessages){
		userMessages.forEach(function(message){
			socket.emit('message',message);
		})
	});

	socket.on('disconnect', function () {
		socketLogger.info(socket.id + ":disconnect " + appId);
		userConnDao.remove(socket.UserEmail,socket.id);
	});
});


server.listen(app.get('port'), function () {
	socketLogger.info('WebSocket server listening on port :' + server.address().port);
	subscribe('test_channel').then(function(client){
        socketLogger.info('subscribe test_channel');
		client.on('message',function(channel,messageStr){
            socketLogger.info('receive message:',messageStr);
			message = JSON.parse(messageStr);
            var nowTimeStamp = (Date.now()/1000).toFixed(0);
            if(message.BeginTime > nowTimeStamp){
                setTimeout(onMessage, (message.BeginTime - nowTimeStamp) * 1000);
            }else {
                onMessage(message);
            }
		})
	})
});

function onMessage (message){
    if(message.ExpireTime && message.ExpireTime > Date.now()/1000){
        messageDao.save(JSON.stringify(message));
    }
    sendMessage(message);
}

function sendMessage(message){
    var messageStr = JSON.stringify(message.Body);
    var sockets = [];

    if(message.SessionId){
        sockets = io.sockets.sockets.filter(function(socket){
            return message.SessionId === socket.id;
        })
    }

    if(message.UserEmail){
        sockets = io.sockets.sockets.filter(function(socket){
            return socket.UserEmail === socket.UserEmail;
        });
    }

    if(message.CompanyId){
        sockets = io.sockets.sockets.filter(function(socket){
            return socket.CompanyId === socket.CompanyId;
        });
    }

    if(message.AllUser === true){
        io.emit('message',messageStr);
    }

    sockets.forEach(function(socket){
        socket.emit('message',messageStr);
    });
}

/**
 * Created by L on 2015/12/8.
 */
var express = require('express');
var uuid = require('node-uuid');
var http = require('http');
var WebSocketServer = require('ws').Server;

var config = require("./config.json");

var logger = require('./lib/logger').logger("socket");
var auth = require('./lib/auth');
var util = require('./lib/util');
var cache = require('./lib/cache');
var dao = require('./lib/dao');
var user = require('./lib/user');
var Const = require('./lib/const');

var app = express();
var server = http.createServer(app);
var wss = new WebSocketServer({server: server,perMessageDeflate:false});
var messageDao = dao.messageDao;

config = config[app.get('env')];
app.set('port', config.app_port);

server.listen(app.get('port'), function () {
    logger.info('WebSocket Server listening on port :' + server.address().port);
    util.subscribe(Const.CHANNEL).then(function (client) {
        client.on('message', function (channel, messageStr) {
            logger.info('receive message:', messageStr);
            message = JSON.parse(messageStr);
            onMessage(message);
        })
    });
});

wss.on('connection', function (socket) {
	auth.verify(socket)
        .then(user.fetchProjectList)
		.then(onConnect)
        .fail(function(error){
            logger.error(error);
        })
});

function onConnect(socket) {
	socket.id = uuid.v4();
	logger.info("UserId:" + socket.UserId + "##" + "SessionId:" + socket.id + '  connected');
	//把SocketId发送到客户端，作为SessionId

	socket.send(socket.id);
	cache.save(socket);

	socket.on('open', function open() {
		console.log("opened");
	});

	socket.on('close', function close() {
		logger.info("UserId:" + socket.UserId + "##" + "SessionId:" + socket.id + '  closed');
		cache.remove(socket);
	});

	socket.on('message', function message(data, flags) {
        socket.send('pong');
		console.log("receive message", arguments);
        console.log("send pong");
	});

	//新连接建立,从 持久消息缓存(存储在redis)中取出需要发给此用户的所有消息,发送到客户端
	messageDao.getConnMessages(socket)
		.then(function (userMessages) {
			userMessages.forEach(function (message) {
				socket.send(JSON.stringify(message.Body));
			})
		}, function (error) {
			logger.error(error);
		});
}

function onMessage(message) {
	if (message.ExpireTime && message.ExpireTime > Date.now() / 1000) {
		messageDao.save(message);
	}
	sendMessage(message);
}

function sendMessage(message) {
	var messageStr = JSON.stringify(message.Body);
	var sockets = [];
	if (message.AllUser === true) {
		sockets = wss.clients;
	} else if (message.SessionId) {
		sockets = [cache.session[message.SessionId]];
	} else if (message.UserId) {
		sockets = cache.user[message.UserId];
	} else if (message.ProjectId) {
		sockets = cache.project[message.ProjectId];
	} else if (message.CompanyId) {
		sockets = cache.company[message.CompanyId];
	}
	sockets && sockets.forEach(function (socket) {
		socket.send(messageStr);
	});
}

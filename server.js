/**
 * Created by L on 2015/12/8.
 */
var express = require('express');
var uuid = require('node-uuid');
var http = require('http');
var WebSocketServer = require('ws').Server;

var config = require("./config.json");
var app = express();
config = config[app.get['env']];
GLOBAL.config = config;

var logger = require('./lib/logger').logger("socket");
var auth = require('./lib/auth');
var util = require('./lib/util');
var cache = require('./lib/cache');
var dao = require('./lib/dao');
var Const = require('./lib/const');

var server = http.createServer(app);
var wss = new WebSocketServer({server: server});
var messageDao = dao.messageDao;


app.set('port', config.app_port);

server.listen(app.get('port'), function () {
	logger.info('WebSocket Server listening on port :' + server.address().port);
});

wss.on('connection', function (socket) {
	auth.verify(socket)
		.then(onConnect)
		.fail(function (error) {
			socket.send(error);
			socket.close();
		});
});

util.subscribe(Const.CHANNEL).then(function (client) {
	client.on('message', function (channel, messageStr) {
		logger.info('receive message:', messageStr);
		message = JSON.parse(messageStr);
		onMessage(message);
	})
});

function onConnect(socket) {
	socket.id = uuid.v4();
	logger.info("UserId:" + socket.UserId + "##" + "SessionId: " + socket.id + '  connected');
	//把SocketId发送到客户端，作为SessionId

	socket.on('open', function open() {
		console.log("opened");
		socket.send(socket.id);
		cache.save(socket);
	});

	socket.on('close', function close() {
		logger.info("UserId:" + socket.UserId + "##" + "SessionId: " + socket.id + '  closed');
		cache.remove(socket);
	});

	socket.on('message', function message(data, flags) {
		console.log("receive message", arguments);
	});

	//新连接建立,从 持久消息缓存(存储在redis)中取出需要发给此用户的所有消息,发送到客户端
	messageDao.getConnMessages(socket)
		.then(function (userMessages) {
			userMessages.forEach(function (message) {
				socket.emit('message', message.Body);
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
		socket.send("message", messageStr);
	});
}

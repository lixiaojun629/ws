/**
 *
 * Created by L on 2015/12/8.
 */
var express = require('express');
var app = express();
var config = GLOBAL.config = require("./config.json")[app.get('env')];
var server = require('http').Server(app);
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({server: server});

var _ = require('lodash');
var socketLogger = require('./lib/logger').logger("socket");
var auth = require('./lib/auth');
var subscribe = require('./lib/subscriber');

var connCache = require('./lib/conn_cache');
var dao = require('./lib/dao');
var messageDao = dao.messageDao;

//获取config 配置文件
var appId = GLOBAL.appId = process.argv[2] || 0;
GLOBAL.API_PATH = config.api_domain;
//创建http，ws链接
var getProjectIds = require('./lib/get_project_ids');


//设置环境变量
app.set('port', config.app_port);

app.get('/', function (req, res) {
	res.send('<h1>Welcome WebSocket Server</h1>');
});

//校验用户登录态,绑定用户Id到socket连接对象
app.use(auth);
//获取用户参与项目ID列表
app.use(getProjectIds);

/**
 * ws连接建立,把用户的ws连接id存放在redis相应的Set中
 * ws连接断开,在用户的ws连接Set中删除此连接id,若Set为空,则删除Set
 */
wss.on('connection', function (socket) {
	var userId = socket.UserId;
	socketLogger.info(userId + ' : socket' + socket.id + 'socketid : connection success');
	//把SocketId发送到客户端，作为SessionId

    socket.on('open', function open() {
        console.log('connected');
        socket.send(Date.now().toString());
    });

    socket.on('close', function close() {
        console.log('disconnected');
    });

    socket.on('message', function message(data, flags) {
        console.log('Roundtrip time: ' + (Date.now() - parseInt(data)) + 'ms', flags);

        setTimeout(function timeout() {
            socket.send(Date.now().toString());
        }, 500);
    });

	//connCache.save(socket);


	//新连接建立,从 持久消息缓存(存储在redis)中取出需要发给此用户的所有消息,发送到客户端
	messageDao.getConnMessages(socket).then(function (userMessages) {
		userMessages.forEach(function (message) {
			socket.emit('message', message.Body);
		})
	}, function (error) {
		socketLogger.error(error);
	});

	socket.on('disconnect', function () {
		socketLogger.info(socket.id + ":disconnect " + appId);
		connCache.remove(socket);
	});
});


server.listen(app.get('port'), function () {
	socketLogger.info('WebSocket server listening on port :' + server.address().port);
	subscribe('test_channel').then(function (client) {
		client.on('message', function (channel, messageStr) {
			socketLogger.info('receive message:', messageStr);
			message = JSON.parse(messageStr);
			var nowTimeStamp = (Date.now() / 1000).toFixed(0);
			if (message.BeginTime > nowTimeStamp) {
				setTimeout(function () {
					onMessage(message);
				}, (message.BeginTime - nowTimeStamp) * 1000);
			} else {
				onMessage(message);
			}
		})
	})
});

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
		io.emit(message.Action, messageStr);
	} else if (message.SessionId) {
		sockets = [connCache.session[message.SessionId]];
	} else if (message.UserId) {
		sockets = connCache.user[message.UserId];
	} else if (message.ProjectId) {
		sockets = connCache.project[message.ProjectId]	;
	} else if (message.CompanyId) {
		sockets = connCache.company[message.CompanyId];
	}
	sockets && sockets.forEach(function (socket) {
		socket.send("message", messageStr);
	});
}

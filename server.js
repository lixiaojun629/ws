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
	console.log("sasddddddd");
	var email = socket.userEmail;
	socketLogger.info(email + ' : socket' + socket.id + 'socketid : connection success');
	userConnDao.save(email ,socket.id);

	console.log(io.sockets.sockets);

	//新连接建立,从 持久消息缓存(存储在redis)中取出需要发给此用户的所有消息,发送到客户端
	messageDao.getUserMessages(socket.userEmail).then(function(userMessages){
		userMessages.forEach(function(message){
			socket.emit('message',message);
		})
	});

	socket.on('disconnect', function () {
		socketLogger.info(socket.id + ":disconnect " + appId);
		userConnDao.remove(socket.userEmail,socket.id);
	});
});


server.listen(app.get('port'), function () {
	console.log('WebSocket server listening on port :' + server.address().port);
	subscribe('test_channel').then(function(client){
		client.on('message',function(channel,messageStr){
			message = JSON.parse(messageStr);
			if(message.userEmailList === 'ALL'){

			}else{
				message.userEmailList.forEach(function(email){
					userConnDao.getAllUserConn(email).then(function(socketIds){

					})
				})
			}
		})
	})
});
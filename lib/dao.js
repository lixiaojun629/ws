/**
 * 数据访问对象
 * Created by rilke on 16/1/13.
 */

var uuid = require('node-uuid');
var Q = require('q');
var _ = require('lodash');
var logger = require('./logger').logger('redis');
var redisClient = require('./redis')();

/**
 * 消息数据访问对象
 */

function MessageDao() {
	this.client = redisClient;
	this.prefix = 'MESSAGE-';
}


/**
 * 保存消息到Redis 异步,支持回调函数 & Promise
 * message = {
 *  //消息体,会推送到浏览器
 *  body: {
 *      content: "this is a test",
 *      resourceId: "uhost-xsdfa"
 *  },
 *  expireTimeStamp: 1452654692742, //毫秒
 *  userEmailList: ['lixiaojun@ucloud.cn', 'wangjianliang@ucloud.cn', 'uweb@ucloud.cn']
 * };
 *
 * @param {String} messageStr required
 * @param {Function} callback optional
 * @returns {*|promise}
 */

MessageDao.prototype.save = function (messageStr, callback) {
	var self = this;
	var message = JSON.parse(messageStr);
	var key = self.prefix + uuid.v1();
	var deferred = Q.defer();
	//消息存活时长
	var liveMillSeconds = message.ExpireTime - (Date.now()/1000).toFixed(0);
	self.client.setex(key, liveMillSeconds, messageStr, function (err, response) {
		if (err) {
			deferred.reject(err);
			logger.error("添加消息异常  " + messageStr + "   " + err);
		} else {
			deferred.resolve(response);
			logger.info("添加消息成功 " + response + "  message:" + messageStr);
		}
		if (callback) {
			callback(err, response);
		}
	});
	return deferred.promise;
};


/**
 * 获取所有消息,异步,支持回调函数 & Promise
 * @param {Function} callback optional 回调函数
 * @returns {*|promise}
 */
MessageDao.prototype.getAll = function (callback) {
	var self = this;
	var deferred = Q.defer();
	var keys = [];
	var stream = self.client.scanStream({
		match: self.prefix + '*'
	});
	var messages;

	//var stream = this.client.scanStream();
	stream.on('data', function (data) {
		keys = keys.concat(data);
	});
	stream.on('end', function () {
		self.client.mget(keys, function (err, result) {
			if (err) {
				deferred.reject(err);
			} else {
				messages = result.map(function (str) {
					return JSON.parse(str);
				});
				deferred.resolve(messages);
			}
			if (typeof callback === 'function') {
				callback(err, messages || result);
			}
		});

	});
	stream.on('error', function (err) {
		deferred.reject(err);
		if (typeof callback === 'function') {
			callback(err);
		}
	});
	return deferred.promise;
};

MessageDao.prototype.getUserMessages = function (email, callback) {
	var self = this;
	var deferred = Q.defer();
	self.getAll().then(function (messages) {
		var userMessages = messages.filter(function (message) {
			return _.contains(message.userEmailList, email);
		});
		deferred.resolve(userMessages);
	}).catch(function(err){
		deferred.reject(err);
	})
    return deferred.promise;
};

function UserConnDao() {
	this.client = redisClient;
	this.prefix = 'EMAIL-';
}

UserConnDao.prototype.save = function (email, socketId, callback) {
	var self = this;
	var deferred = Q.defer();
	var key = self.prefix + email;
	self.client.sadd(key, socketId, function (err, res) {
		if (err) {
			deferred.reject(err);
			logger.error("添加用户ws连接异常  " + email + "  " + socketId + "  " + err);
		} else {
			deferred.resolve(res);
			logger.info("添加用户ws连接成功  " + email + "  " + socketId + "  " + err);
		}
		_.isFunction(callback) && callback(err, res);
	});
};

UserConnDao.prototype.getAllUserConn = function (email, callback) {
	var self = this;
	var deferred = Q.defer();
	var key = self.prefix + email;
	self.client.smembers(key, function (err, res) {
		if (err) {
			deferred.reject(err);
			logger.error("获取用户ws连接异常  " + email + "  " + err);
		} else {
			deferred.resolve(res);
			logger.info("获取用户ws连接成功  " + email + "  " + err);
		}
		callback(err, res);
	})

};

UserConnDao.prototype.remove = function (email, socketId, callback) {
	var self = this;
	var deferred = Q.defer();
	var key = self.prefix + email;
	self.client.srem(key, socketId)
		.then(isDeleteSet)
		.then(function (result) {
			callback(null, result);
			deferred.resolve(result);
			logger.info("删除用户ws连接成功:  " + email + "  " + result);
		})
		.catch(function (err) {
			callback(err);
			deferred.reject(err);
			logger.error("删除用户ws连接错误:  " + email + "  " + err);
		});
	return deferred.promise;

	//若删除ws连接后,用户连接集合为空,则删除集合
	function isDeleteSet() {
		self.client.scard(key).then(function (length) {
			return length === 0 ? self.client.del(key) : null;
		})
	}
};

var messageDao = new MessageDao();
var userConnDao = new UserConnDao();

module.exports = {
	messageDao: messageDao,
	userConnDao: userConnDao
};

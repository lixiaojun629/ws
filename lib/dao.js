/**
 * 数据访问对象
 * Created by rilke on 16/1/13.
 */

var Q = require('q');
var _ = require('lodash');
var logger = require('./logger').logger('redis');
var redisClient = require('./redis')();
var Const = require('./const');

/**
 * 消息数据访问对象
 */

function MessageDao() {
	this.client = redisClient;
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
 * @param {Object} message required
 * @returns {*|promise}
 */

MessageDao.prototype.save = function (message) {
	var self = this;
	var key = getMessageKey(message);
	var deferred = Q.defer();
	var messageStr = JSON.stringify(message);
	//消息存活时长
	self.client.ttl(key)
		.then(function (setLiveSeconds) {
			var deferred = Q.defer();
			if (setLiveSeconds < message.ExpireTime) {
				self.client.expireat(key, message.ExpireTime, function (err, res) {
					if (err) {
						deferred.reject(err);
						logger.error("设置消息集合过期时间异常##  " + messageStr + "   ##error:" + err);
					} else {
						deferred.resolve(res);
					}
				})
			}
			return deferred.promise;
		})
		.then(function () {
			self.client.sadd(key, messageStr, function (err, res) {
				if (err) {
					deferred.reject(err);
					logger.error("保存消息异常  " + messageStr + "   " + err);
				} else {
					deferred.resolve(res);
					logger.info("保存消息成功 " + res + "  message:" + messageStr);
				}
			});
		})
		.fail(function (err) {
			deferred.reject(err);
		});
	return deferred.promise;
};

function getMessageKey(message) {
	if (message.SessionId) {
		return Const.KEY_PREFIX + Const.SESSION_ID_KEY + message.SessionId;
	} else if (message.UserId) {
		return Const.KEY_PREFIX + Const.USER_ID_KEY + message.UserId;
	} else if (message.CompanyId) {
		return Const.KEY_PREFIX + Const.COMPANY_ID_KEY + message.CompanyId;
	} else if (message.AllUser) {
		return Const.KEY_PREFIX + Const.ALL_USER_KEY;
	}
}


/**
 * 从Redis中获取应该向某个连接推送的消息集合
 * @param socket
 * @param callback
 * @returns {*|promise}
 */
MessageDao.prototype.getConnMessages = function (socket, callback) {
	var self = this;
	var deferred = Q.defer();
	var userIdKey = Const.KEY_PREFIX + Const.USER_ID_KEY + socket.UserId;
	var companyIdKey = Const.KEY_PREFIX + Const.COMPANY_ID_KEY + socket.CompanyId;
	var allUserKey = Const.KEY_PREFIX + Const.ALL_USER_KEY;
	
	var promises = [];
	promises.push(self.client.get(userIdKey));
	promises.push(self.client.get(companyIdKey));
	promises.push(self.client.get(allUserKey));
	
	Q.all(promises).then(function (datas) {
		deferred.resolve(datas);
	}, function (error) {
		deferred.reject(error);
	});
	return deferred.promise;
};

var messageDao = new MessageDao();

module.exports = {
	messageDao: messageDao
};

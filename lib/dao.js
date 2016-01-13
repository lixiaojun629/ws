/**
 * 数据访问对象
 * Created by rilke on 16/1/13.
 */

var uuid = require('node-uuid');
var Q = require('q');
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
 * @param {Object} messageStr required
 * @param {Function} callback optional
 * @returns {*|promise}
 */

MessageDao.prototype.save = function (messageStr, callback) {
	var self = this;
	var message = JSON.parse(messageStr);
	var key = self.prefix + uuid.v1();
	var deferred = Q.defer();
	//消息存活时长
	var liveMillSeconds = message.expireTimeStamp - new Date().getTime();
	console.log(liveMillSeconds);
	self.client.psetex(key, liveMillSeconds, messageStr, function (err, response) {
		if (err) {
			deferred.reject(err);
			logger.error("添加消息异常  " + messageStr + "   " + err);
		} else {
			deferred.resolve(response);
			logger.info("添加消息成功 " + response + "  message:" + messageStr);
		}
		if(callback){
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

	//var stream = this.client.scanStream();
	stream.on('data', function (data) {
		keys = keys.concat(data);
	});
	stream.on('end', function () {
		self.client.mget(keys,function(err,result){
			if(err){
				deferred.reject(err);
			}else{
				deferred.resolve(result);
			}
			if(typeof callback === 'function'){
				callback(err,result);
			}
		});

	});
	stream.on('error', function (err) {
		deferred.reject(err);
		if(typeof callback === 'function'){
			callback(err);
		}
	});
	return deferred.promise;
};

module.exports = new MessageDao();

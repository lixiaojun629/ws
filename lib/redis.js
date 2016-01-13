/**
 *
 * Created by rilke on 16/1/12.
 */


var Redis = require('ioredis');
var uuid = require('node-uuid');
var Q = require('q');
var logger = require('./logger').logger('redis');

var redisClient = new Redis({
	port: 6379,
	host: "172.16.2.100",
	db: 0
});

/**
 * 消息 数据访问对象
 * @param prefix
 * @param client
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
 *};
 * @param {Object} message required
 * @param {Function} callback optional
 * @returns {*|promise}
 */

MessageDao.prototype.save = function (message, callback) {
	var self = this;
	var messageStr = JSON.stringify(message);
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


//===========test======================
var message = {
	//消息体,会推送到浏览器
	body: {
		content: "this is a test",
		resourceId: "uhost-xsdfa"
	},
	expireTimeStamp: 1452674692742, //毫秒
	userEmailList: ['lixiaojun@ucloud.cn', 'wangjianliang@ucloud.cn', 'uweb@ucloud.cn']
};

var dao = new MessageDao();
dao.save(message).then(dao.getAll.bind(dao)).then(function(data){
	console.log(data)
});



/**
 * Created by rilke on 16/1/13.
 */

var client = require('./redis')();
var Q = require('q');
var logger = require('./logger').logger('redis');
var _ = require('lodash');

/**
 * 订阅频道 异步 支持Promise & callback
 * @param channels
 * @param callback
 * @returns {*|promise}
 */
function subscribe (channels, callback) {
	var deferred = Q.defer();
	client.subscribe(channels, function (err, count) {
		if (err) {
			deferred.reject(err);
			logger.error("订阅失败: "+channels+ "  error: " +err);
		} else {
			deferred.resolve(client,count);
			logger.info("订阅成功: "+channels+ "  count: " +count);
		}
		if (_.isFunction(callback)) {
			callback(err, client, count);
		}
	});
	return deferred.promise;
}

module.exports = subscribe;
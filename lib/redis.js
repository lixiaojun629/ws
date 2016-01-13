/**
 *
 * Created by rilke on 16/1/12.
 */


var Redis = require('ioredis');

module.exports = function getNewRedisClient() {
	var redisClient = new Redis({
		port: 6379,
		host: "172.16.2.100",
		db: 0
	});
	return redisClient;
};


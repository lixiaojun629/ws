/**
 *
 * Created by rilke on 16/1/12.
 */


var Redis = require('ioredis');
var redisStore = config.redis_store;

module.exports = function getNewRedisClient() {
	var redisClient = new Redis({
		port: redisStore.port,
		host: redisStore.host,
		db: 0
	});
	return redisClient;
};


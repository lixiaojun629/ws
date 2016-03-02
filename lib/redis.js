/**
 *
 * Created by rilke on 16/1/12.
 */


var Redis = require('ioredis');
var redisStore = config.redis_store;

function getNewRedisClient() {
	var redisClient = new Redis.Cluster(redisStore);
	return redisClient;
};

module.exports = getNewRedisClient;

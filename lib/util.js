var request = require("request");
var querystring = require("querystring");
var moment = require('moment');
var promise = require('q').Promise;
var _ = require("lodash");
var Redis = require('ioredis');
var logger = require('./logger').logger('api');

var TIME_OUT = 20000;
var ERROR_RESPONSE = {
	RetCode: "-1",
	Message: "api-gateway error"
};

var api = function (url, params, method) {
	this.url = url || config.api_domain;
	this.params = _.extend({
		_timestamp: moment().format('YYYY-MM-DD HH:mm:ss') + ' ' + _.uniqueId()
	}, params || {});
	this.method = method || 'POST';
	this.j = request.jar();
};
api.prototype.setUrl = function (url) {
	this.url = url;
	return this;
};
api.prototype.setMethod = function (method) {
	this.method = method;
	return this;
};
api.prototype.setParams = function (params) {
	this.params = _.extend({
		_timestamp: moment().format('YYYY-MM-DD HH:mm:ss') + ' ' + _.uniqueId()
	}, params);
	return this;
};
api.prototype.setCookies = function (cookies) {
	var _this = this;
	var url = _this.url;
	cookies.split(';').forEach(function (cookie) {
		_this.j.setCookie(request.cookie(cookie), url);
	});
	_this.cookies = cookies;
	return this;
};

api.prototype.setReq = function (req) {
	var cookies;
	var _this = this;
	_this.req = req;
	if (req.headers['cookie']) {
		cookies = req.headers['cookie']
		_this.setCookies(cookies);
	}
	return this;
};
api.prototype.request = function () {
	var _this = this;
	var params = _this.params;
	var url = _this.url;
	var method = _this.method;
	var cookie = _this.cookie;
	var req = _this.req;

	var data = {
		timeout: TIME_OUT,
		jar: _this.j,
		headers: {
			'x-real-ip': req.headers['x-real-ip'],
			'x-forwarded-for': req.headers['x-forwarded-for'],
			'remote_addr': req.headers['remote_addr'],
			'referer': req.headers['referer']
		}
	};

	data.method = method;

	switch (data.method) {
		case "GET":
			data.uri = url + "?" + querystring.stringify(params);
			break;

		case "POST":
			data.uri = url + "?" + querystring.stringify({
					Action: params.Action
				});
			data.form = params;
			break;

		default:
			data.method = "GET";
			data.uri = url + "?" + querystring.stringify(params);
			break;
	}


	var startReq = new Date().getTime();

	return promise(function (resolve, reject, notify) {
		request(data, function (error, response, body) {
			//记录请求延时
			try {
				var reqTime = new Date().getTime() - startReq;
				logger.info('[' + (params._timestamp || '') + ']' + (params.Action || '') + '::' + (params.Region || '') + '::request_time == ' + reqTime);
			} catch (e) {

			}

			if (error) {
				logger.error('\n\tparams:\t\t' + params + '\n\tresponse:\t' + error);
				reject(ERROR_RESPONSE);
			} else {
				try {
					logger.info('\n\tparams:\t\t' + JSON.stringify(params) + '\n\tresponse:\t' + body);
					resolve(JSON.parse(body));
				} catch (e) {
					logger.error('\n\tparams:\t\t' + params + '\n\tresponse:\t' + e);
					reject(ERROR_RESPONSE);

				}
			}
		});
	});
};
api.prototype.sha1 = function (str) {
	var crypto = require("crypto").createHash("sha1");
	return crypto.update(str, 'utf8').digest('hex');
};
api.prototype.verfyAC = function (params, private_key) {
	var params_data = "";
	delete params['Signature'];
	var params = this.keySort(params);

	for (var key in params) {
		params_data += key;
		params_data += params[key];
	}

	params["Signature"] = this.sha1(params_data + private_key);
	return params;
};
api.prototype.keySort = function (params) {
	params = params || this.params;
	var keys = _.keys(params),
		params_sort = {};
	keys.sort();

	_.each(keys, function (key) {
		params_sort[key] = params[key];
	});
	return params_sort;
};
api.prototype.getMemCache = function (region) {
	var memList = {
		"cn-east-01": ["172.17.0.1:11211", "172.17.0.2:11211"],
		"cn-east-02": ["172.29.13.118:11211", "172.29.13.119:11211"],
		"cn-north-01": ["172.19.1.2:11211", "172.19.1.3:11211"],
		"cn-south-01": ["172.20.1.2:11211", "172.20.1.3:11211"],
		"cn-south-02": ["172.27.117.178:11211", "172.27.117.179:11211"],
		"hk-01": ["172.26.0.45:11211", "172.26.0.48:11211"],
		"cn-north-02": ["172.27.246.10:11211", "172.27.246.11:11211"],
		"cn-north-03": ["172.23.0.53:11211", "172.23.0.54:11211"],
		"us-west-01": ["172.25.0.53:11211", "172.25.0.54:11211"]
	};
	return memList[region] ? memList[region] : '';
};
api.prototype.parseCookie = function (cookie) {
	var array = (cookie || "").split("; ");
	var cookies = {};
	for (var i = 0; i < array.length; i++) {
		var item = array[i].split("=");
		if (item.length == 2) {
			cookies[item[0]] = item[1];
		}
	}
	return cookies;
};
api.prototype.getClientIp = function (req) {
	return req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0] : req.connection.remoteAddress;
};


/**
 * 返回新建的Redis客户端
 * @returns {*}
 */
function getNewRedisClient() {
	var redisStore = config.redis_store;
	return new Redis.Cluster(redisStore);
}

/**
 * 订阅频道 异步 支持Promise & callback
 * @param {String|Array} channels
 * @param {Function} callback
 * @returns {*|promise}
 */
function subscribe (channels, callback) {
	var deferred = Q.defer();
	client.subscribe(channels, function (err, count) {
		if (err) {
			deferred.reject(err);
			logger.error("消息通道: "+channels+ "  订阅失败: " +err);
		} else {
			deferred.resolve(client,count);
			logger.info("消息通道: "+channels+ "  订阅成功");
		}
		if (_.isFunction(callback)) {
			callback(err, client, count);
		}
	});
	return deferred.promise;
}

module.exports = {
	getHttpRequest: function (url, params, method) {
		return new api(url, params, method);
	},
	getNewRedisClinet: getNewRedisClient,
	subscribe: subscribe
};


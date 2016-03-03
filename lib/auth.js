/**
 * Created by L on 2015/12/14.
 */
"use strict";
var logger = require('./logger').logger("socket");
var util = require("./util");
var Q = require("q");

function verify(socket) {
	var deferred = Q.defer();
	var cookie = api.parseCookie(socket.request.headers['cookie']);
	var token = cookie['U_SSO_TOKEN'];
	if (token) {
		return util.fetchUserInfo(socket);
	} else {
		deferred.reject("用户未登录,无Token");
		return deferred.promise;
	}
}

module.exports = {
	verify: verify
};


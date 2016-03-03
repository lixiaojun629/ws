/**
 * Created by L on 2015/12/14.
 */
"use strict";
var logger = require('./logger').logger("socket");
var util = require("./util");
var user = require("./user");
var Q = require("q");

function verify(socket) {
	var deferred = Q.defer();
    var api = util.getHttpRequest();
	var cookie = api.parseCookie(socket.upgradeReq.headers['cookie']);
	var token = cookie['U_SSO_TOKEN'];
	socket.CompanyId = cookie['U_COMPANY_ID'];
	if (token) {
		return user.fetchUserInfo(socket);
	} else {
		deferred.reject("用户未登录,无Token");
		return deferred.promise;
	}
}

module.exports = {
	verify: verify
};


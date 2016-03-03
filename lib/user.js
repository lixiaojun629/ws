/**
 * Created by rilke on 16/3/3.
 */

"use strict";
var Q = require('q');
var logger = require('./logger').logger("api");
var util = require("./util");


//验证用户身份,获取用户ID
function fetchUserInfo(socket) {
	var deferred = Q.defer();
	var param = {Action: 'GetUserInfo'};
	var req = socket.upgradeReq;
	var api = util.getHttpRequest();
	socket.CompanyId = cookie['U_COMPANY_ID'];

	api.setReq(req).setParams(param).request().then(function (data) {
		var userinfo = data.RetCode === 0 ? data['DataSet'][0] : null;
		if (userinfo) {
			socket.UserId = userinfo["UserId"];
			deferred.resolve(socket);
		} else {
			deferred.reject("用户未登录,Token失效");
		}
	}, function (data) {
		deferred.reject(data);
	});

	return deferred.promise;
}



function fetchProjectList(socket) {
	var deferred = Q.defer();
	var api = util.getHttpRequest();
	var req = socket.request;
	var param = {Action: 'GetProjectList'};
	api.setReq(req).setParams(param).request().then(function (data) {
		var projects = data.RetCode === 0 ? data['ProjectSet'] : [];
		socket.ProjectIds = projects.map(function (item) {
			return item.ProjectId;
		});
		deferred.resolve(socket.ProjectIds);
	}, function (data) {
		socket.ProjectIds = [];
		logger.error("获取项目ID出错 Action:GetProjectList : " + data);
		deferred.reject(data);
	});

	return deferred.promise;
}

module.exports = {
	fetchUserInfo: fetchUserInfo,
	fetchProjectList: fetchProjectList
};

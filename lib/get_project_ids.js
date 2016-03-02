"use strict";
var logger=require('./logger').logger("socket");
var util = require("./util");

module.exports = function(socket, next){
    var api = util();
    var req = socket.request;
    var cookie = api.parseCookie(socket.request.headers['cookie']);
    var token = cookie['U_SSO_TOKEN'];
    socket.CompanyId = cookie['U_COMPANY_ID']; 

    //验证用户身份,获取用户email
    function getProjectIds(){
        var param = {Action:'GetProjectList'};
        api.setReq(req).setParams(param).request().then(function(data){
            var projects = data.RetCode === 0 ? data['ProjectSet']: [];
            socket.ProjectIds = projects.map(function(item){
               return item.ProjectId;
            });
            next();
        },function(data){
            socket.ProjectIds = [];
            logger.error("获取项目ID出错 Action:GetProjectList : " + data);
        });
    }

    if(token){
        getProjectIds();
    }else{
        next(new Error('Authentication error'));
    }

};

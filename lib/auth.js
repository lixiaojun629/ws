/**
 * Created by L on 2015/12/14.
 */
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
    function fibersHandle(){
        var param = {Action:'GetUserInfo'};
        api.setReq(req).setParams(param).request().then(function(data){
            var userinfo = data.RetCode === 0 ? data['DataSet'][0]: null;
            if (userinfo) {
                socket.UserId = userinfo["UserId"];
                next();
            }else{
                logger.error("Authentication Error : " + data);
            }
        },function(data){
            logger.error("Authentication Error : " + data);
        });
    }

    if(token){
        fibersHandle();
    }else{
        next(new Error('Authentication error'));
    }

};

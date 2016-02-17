/**
 * Created by L on 2015/12/14.
 */
"use strict";
var logger=require('./logger.js').logger("socket");
var util = require("./util.js");

module.exports = function(socket, next){
    console.log("use auth");
    var api = util();

    //logger.info(socket.handshake.headers);
    logger.info('===========================');
    //logger.info(socket.request.headers);
    //logger.info(api.getClientIp(socket.request));

    var req = socket.request;
    var ip = api.getClientIp(socket.request);
    var cookie = api.parseCookie(socket.request.headers['cookie']);
    var token = cookie['U_SSO_TOKEN'];

    logger.info(token + ' , token==========================================');

    //验证用户身份,获取用户email
    function fibersHandle(){
        var data = {Action:'GetUserInfo'};
        api.setReq(req).setParams(data).request().then(function(data){
            var userinfo = data.RetCode == 0 ? data['DataSet'][0]: null;
            if (userinfo) {
                socket.userEmail = userinfo["UserEmail"];
                logger.info(socket.userEmail+' : ========================= : socket.userEmail');
                next();
            }else{
                logger.error("Authentication Error : " + data);
            }
        },function(data){
            //console.log(data);
            logger.error("Authentication Error : " + data);
        });

    }

    if(token){
        fibersHandle();
    }else{
        next(new Error('Authentication error'));
    }

};

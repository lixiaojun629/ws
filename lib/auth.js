/**
 * Created by L on 2015/12/14.
 */
"use strict";
var logger=require('./logger.js').logger("socket");
var util = require("./util.js");

module.exports = function(socket, next){
    var api = util();

    logger.debug(socket.handshake.headers);
    logger.debug('===========================');
    logger.debug(socket.request.headers);
    logger.debug(api.getClientIp(socket.request));

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
                socket.user = userinfo["UserEmail"];
                logger.info(socket.user+' : ========================= : socket.user');
                next();
            }else{
                logger.error("Authentication Error : " + data);
                next(new Error('Authentication error'));
            }
        },function(data){
            logger.error("Authentication Error : " + data);
            next(new Error('Authentication error' + data));
        });

    }

    if(token){
        fibersHandle();
    }else{
        next(new Error('Authentication error'));
    }

};
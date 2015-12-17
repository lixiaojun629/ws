/**
 * Created by L on 2015/12/14.
 */
"use strict";
var fibers = require("fibers");
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

    function fibersHandle(){
        var data = {Action:'GetUserInfo'};
        var response = api.setReq(req).setParams(data).request();
        var userinfo = response.RetCode == 0 ? response['DataSet'][0]: null;
        if (userinfo) {
            socket.user = userinfo["UserEmail"];
            logger.info(socket.user+' : ========================= : socket.user');
            next();
        }else{
            logger.error("Authentication Error : " + response);
            next(new Error('Authentication error'));
        }
    }

    if(token){
        fibers(fibersHandle).run();
    }else{
        next(new Error('Authentication error'));
    }

};
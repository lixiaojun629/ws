/**
 * Created by L on 2015/12/14.
 */
"use strict";
var logger=require('./logger.js').logger("socket");
var fibers = require("fibers");

var util = require("./util.js");

var producer = require("./producer.js");
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

    function sendHandle(){
        var i = 0;
        var time;
        function s(){
            time && clearTimeout(time);
            if(i>=3) return;
            producer("broadcast."+i,{i:i});
            producer("single."+i,{email:'wangjianliang@ucloud.cn',i:i});
            i++;
            time = setTimeout(s,1000);
        }
        s();
    }

    function fibersHandle(){
        var data ={Action:'GetUserInfo'};
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

    //关闭时清除连接
    socket.on('disconnect',function(){
        logger.info(socket.id+":disconnect "+appId);
    });

    if(token){
        fibers(fibersHandle).run();
    }else{
        next(new Error('Authentication error'));
    }

};
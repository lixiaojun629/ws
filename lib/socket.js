/**
 * Created by L on 2015/12/14.
 */
"use strict";
var logger=require('./logger.js').logger("socket");
var fibers = require("fibers");
var consumer = require("./consumer.js")();
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

    function broadcastHandle(message){
        logger.info('broadcast'+JSON.stringify(message));
        socket.emit('broadcast',JSON.stringify(message));
    }
    function singleHandle(message,user){
        logger.info('single user:'+user);
        logger.info('single'+JSON.stringify(message));
        socket.emit('single',JSON.stringify(message));
    }
    function consumerHandle(user){
        //广播消息消费者
        consumer.bind('broadcast','broadcast.#',broadcastHandle);
        //定点消息消费者
        consumer.bind('single','single.#',function(message){
            singleHandle(message,user)
        });
    }


    var i = 0;
    var time;
    function sendHandle(){
        time && clearTimeout(time);
        if(i>=10) return;
        producer("single."+i,{i:i});
        producer("broadcast."+i,{i:i});
        i++;
        time = setTimeout(sendHandle);
    }


    function fibersHandle(){
        var data ={Action:'GetUserInfo'};
        var response = api.setReq(req).setParams(data).request();
        var userinfo = response.RetCode == 0 ? response['DataSet'][0]: null;
        if (userinfo) {
            var user = userinfo["UserEmail"];
            consumerHandle(user);
            sendHandle();
            next()
        }else{
            logger.error("Authentication Error : " + response);
            next(new Error('Authentication error'));
        }
        //关闭时清除连接
        socket.on('disconnect',function(){
            logger.info(socket.id+":disconnect "+appId);
        });
    }

    if(token){
        fibers(fibersHandle).run();
    }else{
        next(new Error('Authentication error'));
    }

};
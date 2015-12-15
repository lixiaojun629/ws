/**
 * Created by L on 2015/12/14.
 */
"use strict";
var logger=require('./logger.js').logger("socket");
var fibers = require("fibers");
var consumer = require("./queue.js").consumer;
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

    function consumerHandle(){
        //广播消息消费者
        consumer('broadcast','broadcast.*',function(data){
            socket.emit('broadcast',data);
        });
        //定点消息消费者
        consumer('single','single.*',function(data){
            socket.emit('single',data);
        });
    }

    function fibersHandle(){
        var data ={Action:'GetUserInfo'};
        var response = api.setReq(req).setParams(data).request();
        var userinfo = response.RetCode == 0? response['DataSet'][0]: null;
        var email = userinfo["UserEmail"];
        if (email) {
            consumerHandle();
            next()
        }else{
            consumer.disconnect();
            next(new Error('Authentication error'));
        }
        //关闭时清除连接
        socket.on('disconnect',function(){
            consumer.disconnect();
            logger.info(socket.id+":disconnect "+appId);
        });
    }

    if(token){
        fibers(fibersHandle).run();
    }else{
        consumer.disconnect();
        next(new Error('Authentication error'));
    }

};
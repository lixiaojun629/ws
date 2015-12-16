/**
 * Created by L on 2015/12/14.
 */
"use strict";
var logger=require('./logger.js').logger("socket");
var fibers = require("fibers");
var queue = require("./queue.js")();
var util = require("./util.js");

var exchange = require("./exchange.js")();
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
        queue.consumer('broadcast','broadcast.#',function(message){
            console.log('broadcast'+JSON.stringify(message));
            socket.emit('broadcast',JSON.stringify(message));
        });
        //定点消息消费者
        queue.consumer('single','single.#',function(message){
            console.log('single'+JSON.stringify(message));
            socket.emit('single',JSON.stringify(message));
        });
        exchange.producer("single.dddddd",'asdasdsadsadsadsa');
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
            queue.connection.disconnect();
            next(new Error('Authentication error'));
        }
        //关闭时清除连接
        socket.on('disconnect',function(){
            queue.connection.disconnect();
            logger.info(socket.id+":disconnect "+appId);
        });
    }

    if(token){
        fibers(fibersHandle).run();
    }else{
        queue.connection.disconnect();
        next(new Error('Authentication error'));
    }

};
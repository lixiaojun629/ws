/**
 * Created by L on 2015/12/14.
 */
"use strict";
var logger=require('./logger.js').logger("socket");
var consumer = require("./queue.js").consumer;
function getClientIp(req) {
    return req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0] : req.connection.remoteAddress;
}
module.exports = function(socket, next){
    logger.info(socket.handshake.headers);
    logger.info('===========================')
    logger.info(socket.request.headers);
    logger.info(getClientIp(socket.request));
    if (socket.request.headers.cookie) return next();
    next(new Error('Authentication error'));
    //关闭时清除连接
    socket.on('disconnect',function(){
        logger.info(socket.id+":disconnect "+appId);
        consumer.disconnect()
    });
    //广播消息消费者
    consumer('broadcast','broadcast.*',function(data){

    });
    //定点消息消费者
    consumer('single','single.*',function(data){

    });
};
/**
 * Created by L on 2015/12/14.
 */
"use strict";
var logger=require('./logger.js').logger("socket");
var consumer = require("./queue.js").consumer;
function getClientIp(req) {
    var ipAddress;
    // Amazon EC2 / Heroku workaround to get real client IP
    var forwardedIpsStr = req.header('x-forwarded-for');
    if (forwardedIpsStr) {
        // 'x-forwarded-for' header may return multiple IP addresses in
        // the format: "client IP, proxy 1 IP, proxy 2 IP" so take the
        // the first one
        var forwardedIps = forwardedIpsStr.split(',');
        ipAddress = forwardedIps[0];
    }
    if (!ipAddress) {
        // Ensure getting client IP address still works in
        // development environment
        ipAddress = req.connection.remoteAddress;
    }
    return ipAddress;
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
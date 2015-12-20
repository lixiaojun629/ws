/**
 * Created by L on 2015/12/18.
 */
var consumer = require("./consumer.js")();
var logger=require('./logger.js').logger("socket");

module.exports = function(socket){
    logger.info('SocketIO connection success'+socket.id+":connection "+appId);

    //关闭时清除连接
    socket.on('disconnect',function(){
        logger.info(socket.id+":disconnect "+appId);
    });
};
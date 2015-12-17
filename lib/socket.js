/**
 * Created by L on 2015/12/18.
 */
var consumer = require("./consumer.js")();
var logger=require('./logger.js').logger("socket");


module.exports = function(socket,io){

    function broadcastHandle(message){
        logger.info('broadcast : ============================ : '+JSON.stringify(message));
        logger.info(socket.id +' : ===============================================================================================================');
        io.emit('message',JSON.stringify(message));
    }
    //广播消息消费者
    consumer.bind('broadcast','broadcast.#',broadcastHandle);

    function singleHandle(message){
        var email = (message||{}).email;

        if(!email || email != socket.user){
            return;
        }

        logger.info('single : ============================ : '+JSON.stringify(message));
        logger.info(socket.id+'===============================================================================================================');
        socket.emit('message',JSON.stringify(message));
    }

    //定点消息消费者
    consumer.bind('single','single.#',singleHandle);

    logger.info('SocketIO connection success'+socket.id+":connection "+appId);

    //关闭时清除连接
    socket.on('disconnect',function(){
        logger.info(socket.id+":disconnect "+appId);
    });
};
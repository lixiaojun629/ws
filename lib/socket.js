/**
 * Created by L on 2015/12/18.
 */
var consumer = require("./consumer.js")();
var logger=require('./logger.js').logger("socket");
var producer = require("./producer.js");

module.exports = function(socket){

    function broadcastHandle(message){
        logger.info('broadcast : ============================ : '+JSON.stringify(message));
        //logger.info(socket.id +' : ===============================================================================================================');
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

    console.log('SocketIO connection success'+socket.id+":connection "+appId);


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

    sendHandle();
    //关闭时清除连接
    socket.on('disconnect',function(){
        logger.info(socket.id+":disconnect "+appId);
    });
};
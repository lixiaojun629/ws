/**
 * Created by L on 2015/12/14.
 */
"use strict";
//var rabbit = require('./rabbit.js');
var _ = require('lodash');
var logger = require('./logger').logger('consumer');
function init(){
    return new consumer();
}
function consumer(){
}

consumer.prototype.bind = function(conn,queueName,route,cb){
    var self = this;
    conn.exchange('exchange_global',{type: 'topic',autoDelete:false,confirm:true,durable:true,deliveryMode:2},function(exchange){
        conn.queue(queueName||'',{autoDelete:false,durable:true,closeChannelOnUnsubscribe:true}, function(queue){
            queue.bind(exchange,route||'');
            logger.info('Consumer Queue bind Exchange success');
            queue.subscribe({prefetchCount : 1},function (message) {
                cb(message);
                logger.info('Consumer Queue subscribe Message：' +JSON.stringify(message) + ', success');
            });
        });
    });
    return self;
};
module.exports = init;
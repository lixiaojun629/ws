/**
 * Created by L on 2015/12/14.
 */
"use strict";
var rabbit = require('./rabbit.js');
var _ = require('lodash');
var logger = require('./logger').logger('consumer');
function init(){
    return new consumer();
}
function consumer(){
    var self = this;
    self.connection = rabbit.connection();
    logger.info('RabbitMQ Consumer connection start');
    self.connection.on('ready', function () {
        logger.info('RabbitMQ Consumer connection success');
    });
    return self;
}
consumer.prototype.bind = function(queueName,route,cb){
    var self = this;
    self.connection.exchange('exchange_global', _.extend({type: 'topic',autoDelete:false}));
    self.connection.queue(queueName||'',{autoDelete:false}, function(queue){
        queue.bind('exchange_global',route||'');
        logger.info('Consumer Queue bind Exchange success');
        queue.subscribe(function (message) {
            cb(message);
            logger.info('Consumer Queue subscribe Message：' +JSON.stringify(message) + ', success');
        });
    });
    return self;
};
module.exports = init;
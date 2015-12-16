/**
 * Created by L on 2015/12/14.
 */
"use strict";
var rabbit = require('./rabbit.js');
var _ = require('lodash');
var logger = require('./logger').logger('rabbit');
function queue(){
    var self = this;
    self.connection = rabbit.connection();
    self.connection.on('ready', function () {
        logger.info('RabbitMQ Queue connection success');
    });
    return self;
}
queue.prototype.consumer = function(queueName,route,cb){
    var self = this;
    self.connection.exchange('exchange_global', _.extend({type: 'topic',autoDelete:false}));
    self.connection.queue(queueName||'',{autoDelete:false}, function(queue){
        queue.bind('exchange_global',route||'');
        logger.info('Queue bind Exchange success');
        queue.subscribe(function (message) {
            cb(message);
            logger.info('Queue subscribe Message：' +JSON.stringify(message) + ', success');
        });
    });
    return self;
};
module.exports = function(){
    return new queue();
};
/**
 * Created by L on 2015/12/14.
 */
"use strict";
var rabbit = require('./rabbit.js');
var _ = require('lodash');
var logger = require('./logger').logger('producer');
function init(route,message,option){
    return new producer(route,message,option);
}
function producer(route,message,option){
    var self = this;
    self.connection = rabbit.connection();
    logger.info('RabbitMQ Producer connection start');
    self.connection.on('ready', function () {
        logger.info('RabbitMQ Producer connection success');
        self.connection.exchange('exchange_global',{type: 'topic',autoDelete:false,confirm:true,durable:true,deliveryMode:2},function(exchange){
            logger.info('Producer Exchange ' + exchange.name + ' is open');
            exchange.publish(route , message,{},function(state,err) {
                logger.info('Producer Exchange Route：'+ route +' , Message：' + JSON.stringify(message) + ' , published');
                if(state){
                    logger.error('Producer Exchange Message publish Error : ' + err);
                }
                self.connection.end();
                self.connection.destroy();
                init = null;
            });
        });
    });
    return self;
}
producer.prototype.bind = function(){

};
module.exports = init;
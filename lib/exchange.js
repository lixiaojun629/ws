/**
 * Created by L on 2015/12/14.
 */
"use strict";
var rabbit = require('./rabbit.js');
var _ = require('lodash');
var logger = require('./logger').logger('rabbit');
function exchange(){
    var self = this;
    self.connection = rabbit.connection();
    self.connection.on('ready', function () {
        logger.info('RabbitMQ Exchange connection success');
    });
    return self;
}
exchange.prototype.producer = function(route,message,option){
    var self = this;
    self.connection.exchange('exchange_global',_.extend((option||{}),{type: 'topic',autoDelete:false,confirm:true}),function(exchange){
        logger.info('Exchange ' + exchange.name + ' is open');
        exchange.publish(route,message,{},function(state,err) {
            logger.info('Exchange Route：'+ route +' , Message：' + JSON.stringify(message) + ' , published');
            if(state){
                logger.error('Exchange Message publish Error : ' + err);
            }
            self.connection.end();
            self.connection.destroy();
        });
    });
    return self;
};
module.exports = function(){
    return new exchange();
};
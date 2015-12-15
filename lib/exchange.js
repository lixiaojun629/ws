/**
 * Created by L on 2015/12/14.
 */
"use strict";
var rabbit = require('./rabbit.js');
function exchange(){
    var self = this;
    self.connection = rabbit.connection();
    self.connection.on('ready', function () {
        console.log('RabbitMQ connection success');
    });
    return self;
}
exchange.prototype.producer = function(route,data,option){
    var self = this;
    var exchange = self.connection.exchange('exchange_global', _.extend({type: 'direct',autoDelete:false},(option||{})));
    exchange.publish(route,data);
    self.connection.end();
    self.connection.destroy();
    return self;
};
module.exports = function(){
    return new exchange();
};
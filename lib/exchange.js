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
exchange.prototype.producer = function(queueName,route,cb){
    var self = this;
    self.connection.queue(queueName,{autoDelete:false}, function(queue){
        queue.bind('exchange_global',route);
        queue.subscribe(function (message) {
            cb(message);
        });
    });
    return self;
};
module.exports = function(){
    return new exchange();
};
//
//function send(route,data,option){
//    connection.on('ready', function () {
//        var exchangeName = 'exchange_global';
//        var exchange = connection.exchange(exchangeName, _.extend({type: 'direct',autoDelete:false},(option||{})));
//        exchange.publish(route,data);
//        connection.end();
//        connection.destroy();
//    })
//}
//exports.send = send;
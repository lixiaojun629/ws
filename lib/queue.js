/**
 * Created by L on 2015/12/14.
 */
"use strict";
var rabbit = require('./rabbit.js');
function queue(){
    var self = this;
    self.connection = rabbit.connection();
    self.connection.on('ready', function () {
        console.log('RabbitMQ connection success');
    });
    return self;
}
queue.prototype.consumer = function(queueName,route,cb){
    var self = this;
    self.connection.queue(queueName||'',{autoDelete:false}, function(queue){
        queue.bind('exchange_global',route||'');
        queue.subscribe(function (message) {
            cb(message);
        });
    });
    return self;
};
module.exports = function(){
    return new queue();
};
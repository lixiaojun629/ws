/**
 * Created by L on 2015/12/14.
 */
"use strict";
var rabbit = require('./rabbit.js');
var connection = rabbit.connection();
connection.on('ready', function () {
    console.log('RabbitMQ connection success');
});
exports.consumer = function(queueName,route,cb){
    connection.queue(queueName,{autoDelete:false}, function(queue){
        queue.bind('exchange_global',route);
        queue.subscribe(function (message) {
            cb(message);
        });
    });
    return connection;
};

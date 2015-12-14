/**
 * Created by L on 2015/12/14.
 */
"use strict";
var rabbit = require('./rabbit.js');
var _ = require('lodash');
var connection = rabbit.connection();
function send(route,data,option){
    connection.on('ready', function () {
        var exchangeName = 'exchange_global';
        var exchange = connection.exchange(exchangeName, _.extend({type: 'direct',autoDelete:false},(option||{})));
        exchange.publish(route,data);
        connection.end();
        connection.destroy();
    })
}
exports.send = send;
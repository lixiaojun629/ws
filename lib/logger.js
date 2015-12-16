/**
 *
 * Created by Roc on 15/7/28.
 */
var express = require('express');
var app =  express.Router();
var log4js = require("log4js");

log4js.configure({
    appenders: [
        { type: 'console' },
        {
            type: 'file',
            filename: '/var/log/socket/connect.log',
            maxLogSize: 2048000000,
            backups:7,
            category: 'normal'
        },
        {
            type: 'file',
            filename: '/var/log/socket/api.log',
            maxLogSize: 2048000000,
            backups:7,
            category: 'api'
        },
        {
            type: 'file',
            filename: '/var/log/socket/socket.log',
            maxLogSize: 2048000000,
            backups:7,
            category: 'socket'
        },
        {
            type: 'file',
            filename: '/var/log/socket/rabbit.log',
            maxLogSize: 204800000,
            backups:7,
            category: 'rabbit'
        },
        {
            type: 'file',
            filename: '/var/log/socket/consumer.log',
            maxLogSize: 204800000,
            backups:7,
            category: 'consumer'
        },
        {
            type: 'file',
            filename: '/var/log/socket/producer.log',
            maxLogSize: 204800000,
            backups:7,
            category: 'producer'
        }
    ],
    replaceConsole: true
});

exports.logger=function(name){
    var logger = log4js.getLogger(name);
    logger.setLevel('INFO');
    return logger;
};

app.use(log4js.connectLogger(this.logger('normal'), {level:'auto', format:':method :url'}));


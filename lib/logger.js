/**
 *
 * Created by Roc on 15/7/28.
 */
var express = require('express');
var path = __dirname + '/var/log/socket/';
var log4js = require("log4js");

log4js.configure({
    appenders: [
        { type: 'console' },
        {
            type: 'file',
            filename: path +'connect.log',
            maxLogSize: 2048000000,
            backups:7,
            category: 'normal'
        },
        {
            type: 'file',
            filename: path + 'redis.log',
            maxLogSize: 2048000000,
            backups:7,
            category: 'redis'
        },
        {
            type: 'file',
            filename: path + 'api.log',
            maxLogSize: 2048000000,
            backups:7,
            category: 'api'
        },
        {
            type: 'file',
            filename: path + 'socket.log',
            maxLogSize: 2048000000,
            backups:7,
            category: 'socket'
        }
    ],
    replaceConsole: true
});


exports.logger=function(name){
    var logger = log4js.getLogger(name);
    logger.setLevel('INFO');
    return logger;
};



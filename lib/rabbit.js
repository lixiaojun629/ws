/**
 * Created by L on 2015/12/14.
 */
var amqp = require('amqp');
var logger = require('./logger').logger('rabbit');
var _ = require('lodash');
var addresses=[];

if(config.rabbit_store.addresses){
    var addreGroups=config.rabbit_store.addresses.split(",");
    for(var i=0;i<addreGroups.length;i++){
        var addres=addreGroups[i].split(":");
        if(addres.length ==2){
            addresses.push({host:addres[0],port:addres[1]});
        }
    }
}

function getAddre(host){
    if(addresses.length ==0){
        throw "not find rabbit host";
    }
    var conf = {
        login:config.rabbit_store.username,
        password:config.rabbit_store.password
    };
    var addr = addresses[0];
    if(host){
        var ohost = _.find(addresses,function(addre){
            return addre.host != host;
        });
        addr = ohost ? ohost : addresses[0];
    }
    return _.extend({},conf,addr);
}

exports.connection=function (){
    if(addresses.length ==0){
        throw "not find rabbit host";
    }
    var connection =amqp.createConnection(getAddre(),{reconnect: false,defaultExchangeName: 'amq.topic'});
    connection.on('error', function (error) {
        //如果有异常尝试连接其它机器
        logger.error('Rabbit Connection error' + error+' ; host : '+connection.options.host + ' ; port : '+connection.options.port);
        var addre = getAddre(connection.options.host);
        if(addre) {
            setTimeout(function(){
                connection.setOptions(addre);
                connection.reconnect();
            },1000);
        }
        logger.info('Rabbit Attempts to reconnect'+' ; host : '+connection.options.host + ' ; port : '+connection.options.port);
    });
    connection.on('close', function () {
        logger.info('Rabbit Connection close'+' ; host : '+connection.options.host + ' ; port : '+connection.options.port);
    });
    connection.on('connect', function () {
        logger.info('Rabbit Connection connect Success'+' ; host : '+connection.options.host + ' ; port : '+connection.options.port);
    });
    if(connection){
        return connection;
    }
};
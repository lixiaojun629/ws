/**
 * Created by L on 2015/12/14.
 */

var eventEmitter = require('events').EventEmitter
    , util = require('util');

exports.group= function(){
    new groupManage();
};

function groupManage(){
    //socket 的分组key
    this.group={};

    //socket id 映射,格式为 {自定义 ID:原ID}
    this.idMap={};
    //
    this.idMapInverse={};
}

util.inherits(groupManage, eventEmitter);

/**
 * 删除 group item
 */
groupManage.prototype.removeGroupItem=function(flag,item) {
    var items=this.group[flag];
    if(items){
        items.splice(items.indexOf(item), 1);
    }
    if(items.length == 0){
        delete this.group[flag];
        this.emit("group_null",flag);
    }
};
/**
 *  得到Group
 */
groupManage.prototype.getGroupItme=function(flag,call) {
    var items=this.group[flag];
    return items || {};
};

/**
 * 添加 group
 */
groupManage.prototype.addGroupItem=function(flag,item) {
    var items=this.group[flag];
    if(!items){
        items=[];
        this.group[flag]=items;
        this.emit("group_new",flag);
    }
    items.push(item);
};

/**
 * 删除 idMap
 */
groupManage.prototype.removeIdMap=function(oldId) {
    var socketSessionId=this.idMapInverse[oldId];
    if(socketSessionId){
        delete this.idMapInverse[oldId];
        delete this.idMap[socketSessionId];
    }
};
/**
 *  得到原ID
 */
groupManage.prototype.getOldId=function(socketSessionId) {
    return this.idMap[socketSessionId];
};

/**
 * 添加idMap
 */
groupManage.prototype.addIdMap=function(socketSessionId,oldId) {
    this.idMap[socketSessionId]=oldId;
    this.idMapInverse[oldId]=socketSessionId;
};

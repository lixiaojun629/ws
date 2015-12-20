/**
 * Created by L on 2015/12/20.
 */

module.exports = function(){
    return new SimpleMap();
};

function SimpleMap() {
    this.map = {};
    this.mapSize = 0;
}

SimpleMap.prototype.set = function(key, value) {
    var oldValue = this.map[key];
    this.map[key] = value;
    if (!oldValue) {
        this.mapSize++;
    }
    return (oldValue || value);
};

SimpleMap.prototype.get = function(key) {
    return this.map[key] || {};
};

SimpleMap.prototype.remove = function(key) {
    var v = this.map[key];
    if (v) {
        delete this.map[key];
        this.mapSize--;
    }
    return v;
};

SimpleMap.prototype.size = function() {
    return this.mapSize;
};

SimpleMap.prototype.clear = function() {
    this.map = {};
    this.mapSize = 0;
};

SimpleMap.prototype.keys = function() {
    var theKeySet = [];
    for (var i in this.map) {
        theKeySet.push(i);
    }
    return theKeySet;
};

SimpleMap.prototype.values = function() {
    var theValue = [];
    for (var i in this.map) {
        theValue.push(this.map[i]);
    }
    return theValue;
};
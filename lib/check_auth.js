/**
 * Created by L on 2015/12/14.
 */
"use strict";
var fibers = require("fibers");
exports.checkAuth=function(req) {
    fibers(function() {
        var token = req.signedCookies.token;
        if (token && req.session.user && req.session.user.token === token){

        }else{

        }
    }).run();
};
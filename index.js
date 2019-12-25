"use strict";

const make = require('./make');
const loader = require('./loader');
//模块加载器


module.exports = loader;

module.exports.is = function (o) {
    if( !o || typeof o !== 'object'){
        return false;
    }
    else if( o instanceof loader ){
        return true;
    }
    else{
        return false;
    }
}

module.exports.bind = function(){
    let _package_loader= module.exports.is(arguments[1]) ? arguments[1]:loader(arguments[1],arguments[2],arguments[3]);
    return make.bind(arguments[0],_package_loader);
}
//闭包执行
module.exports.package = function (){
    let _package_loader= module.exports.is(arguments[0]) ? arguments[0]:loader(arguments[0],arguments[1],arguments[2]);
    return make.package(_package_loader);
}
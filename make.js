"use strict";


module.exports.bind = function(){
    let _package_handle = arguments[0];
    let _package_loader= arguments[1];
    function _package_function() {
        if(arguments.length < 1){
            return _package_loader;
        }
        return _package_handle.call(this,_package_loader,...arguments);
    }
    Object.defineProperty(_package_function, 'require', {
        value: _package_loader.require.bind(_package_loader),
        writable: false,
        enumerable: true,
        configurable: false
    });
    Object.defineProperty(_package_function, 'namespace', {
        value: namespace_bind.bind(_package_function,_package_loader),
        writable: false,
        enumerable: true,
        configurable: false
    });
    return _package_function;
}
//闭包执行
module.exports.package = function (){
    let _package_loader= arguments[0];
    return module.exports.bind(loader_package,_package_loader);
}



function namespace_bind(loader,...args){
    for(let name of args){
        if(!this[name]) {
            Object.defineProperty(this, name, { value: namespace_loader.call(this,loader,name), writable: false, enumerable: true, configurable: false  });
        }
    }
}

function namespace_loader(loader,ns) {
    let newLoader = Object.create(loader);
    newLoader._namespace = ns;
    function _package_function(name,...args) {
        if(arguments.length < 1){
            return newLoader;
        }
        return loader_package.call(this,newLoader,name,...args);
    }
    Object.defineProperty(_package_function, 'require', {
        value: newLoader.require.bind(newLoader),
        writable: false,
        enumerable: true,
        configurable: false
    });
    return _package_function;
}

function loader_package(loader,name,...args) {
    let fun = loader.parse(name);
    if(!fun){
        throw new Error(`loader[${name}] not exist!`);
    }
    if(typeof fun === 'function'){
        return fun.apply(this,args);
    }
    else{
        return fun;
    }
}
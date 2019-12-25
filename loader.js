"use strict";
const FSPath = require('path');
const cosjsFiles = require('cosjs.files');

//模块加载器
function loader(path,safe,ext){
    if (!(this instanceof loader)) {
        return new loader(path,safe,ext);
    }
    this._fileExt      = ext || ['.js','.json','.node'];
    this._safeMode     = safe||0;                             //0：覆盖，1：合并，2：禁止
    this._pathCache    = new Set();
    this._namespace    = '';                                 //名字空间，用来创建镜像
    this._moduleCache  = {};
    this._disableCache = new Set();
    if(path){
        cosjsFiles.sync(path,'/',verify_file.bind(this,path,'') );
    }
}

module.exports = loader;



loader.prototype.require = function(name){
    name = verify_name.call(this,name,arguments[1]);
    if( !this._moduleCache[name] ){
        return null;
    }
    let file = this._moduleCache[name];
    let mods = require(file);
    return mods;
}



loader.prototype.parse = function(name){
    if( !name || name.length <=1 ){
        return false;
    }
    if(name.indexOf('/') < 0){
        name = ['/',name,'/'].join('');
    }
    name = verify_name.call(this,name,arguments[1]);

    if(this._disableCache.has(name)){
        return false;
    }
    let i = name.lastIndexOf('/');
    let k = name.substr(0,i);
    if(!this._moduleCache[k]){
        return null;
    }
    let file = this._moduleCache[k];

    let mod = require(file);
    if(!mod){
        return false;
    }

    let key = name.substr(i+1);
    if(!key){
        return mod;
    }
    else {
        return mod[key] || null;
    }
}

//禁用一个接口
loader.prototype.disable = function(name){
    if( !name || name.length <=1 ){
        return false;
    }
    if(name.indexOf('/') < 0){
        name = ['/',name,'/'].join('');
    }
    name = verify_name.call(this,name,arguments[1]);
    this._disableCache.add(name);
}

loader.prototype.addPath = function(path,dir) {
    if( !path || this._pathCache.has(path)){
        return false;
    }
    let namespace = verify_name.call(this,dir,arguments[2]);
    this._pathCache.add(path);
    return cosjsFiles(path,'/',verify_file.bind(this,path,namespace) );
}

loader.prototype.addFile = function(path,name) {
    if(!name){
        let ext = FSPath.extname(path);
        name = FSPath.basename(path,ext);
    }
    let api = verify_name.call(this,name,arguments[2]);
    newly_file.call(this, api, path)
}

loader.prototype.getPath = function() {
    return Array.from(this._pathCache);
}

loader.prototype.getFile = function(name) {
    name = verify_name.call(this,name,arguments[1]);
    return this._moduleCache[name]||null;
}

loader.prototype.forEach = function(fun){
    let NS = verify_name.call(this,arguments[1])||'';
    let RL = NS.length;
    for(let k in this._moduleCache){
        if(!NS){
            fun(k,this._moduleCache[k]);
        }
        else if(k.substr(0,RL) === NS){
            fun(k.substr(RL),this._moduleCache[k]);
        }
    }
}



function verify_name(name){
    let arr = [];
    if(name){
        arr.unshift(name);
    }
    if( name && String(name).substr(0,1) !== '/'){
        arr.unshift('/');
    }
    let namespace = arguments[1] || this._namespace;
    if(namespace){
        arr.unshift(namespace);
    }
    if( namespace && String(namespace).substr(0,1) !== '/'){
        arr.unshift('/');
    }
    return arr.join('');
}

function verify_file(root,prefix,file){
    let ext = FSPath.extname(file);
    let path = FSPath.resolve([root,file].join(''));
    if(this._fileExt.indexOf(ext) >=0){
        let api = file.replace(ext,'');
        if(prefix){
            api = [prefix,api].join("");
        }
        newly_file.call(this,api,path)
    }
}

function newly_file(api,path){
    if( !this._moduleCache[api] || !this._safeMode  ){
        this._moduleCache[api] = path;
    }
    else if( this._safeMode == 1 ){
        merge_file.call(this,api,path)
    }
    else{
        console.log('file['+api+'] exist');
    }
}


function merge_file(api,path){
    let data = this.require(api);
    if(!data){
        this._moduleCache[api] = path;
    }
    else{
        let newData = require(path);
        if(newData){
            Object.assign(data,newData)
        }
    }
}
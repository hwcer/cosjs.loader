"use strict";
const fs = require('fs');
//模块加载器


function loader(path,safe,ext){
    if (!(this instanceof loader)) {
        return new loader(path,safe,ext);
    }
    this._fileExt      = ext || ['.js','.json','.node'];
    this._safeMode     = safe||0;   //0：覆盖，1：合并，2：禁止
    this._pathCache    = new Set();
    this._moduleCache  = {};
    if(path) {
        this.addPath(path);
    }
}

module.exports = loader;



loader.prototype.require = function(name){
    name = real_name(name);
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
    let i = name.lastIndexOf('/');
    let mod = this.require(name.substr(0,i));
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


loader.prototype.addPath = function(path,namespace) {
    if( !path || this._pathCache.has(path)){
        return;
    }
    namespace = real_name(namespace);
    this._pathCache.add(path);
    getFiles.call(this, path,namespace);
}

loader.prototype.addFile = function(api,path) {
    api = real_name(api);
    newly_file.call(this,api,path)
}


loader.prototype.forEach = function(callback){
    for(let k in this._moduleCache){
        callback(k,this._moduleCache[k]);
    }
}

function getFiles(root,dir,namespace) {
    dir = dir||'/';
    let stats, path = root + dir;
    try {
        stats = fs.statSync(path);
    }
    catch (e){
        stats = null;
    }
    if(!stats){
        return;
    }
    if(!stats.isDirectory()){
        return;
    }
    let files = fs.readdirSync(path);
    if(!files || !files.length){
        return;
    }
    for(let name of files){
        filesForEach.call(this,root,dir,name,namespace);
    }
}


function filesForEach(root,dir,name,namespace){
    let FSPath = require('path');
    let realPath = FSPath.resolve([root,dir,name].join('/'));
    let realName = dir+name;
    let stats = fs.statSync(realPath);
    if (stats.isDirectory()) {
        return getFiles.call(this,root,realName+'/');
    }

    let ext = FSPath.extname(name);
    if(this._fileExt.indexOf(ext) >=0){
        let api = realName.replace(ext,'');
        if(namespace){
            api = [namespace,api].join("");
        }
        newly_file.call(this,api,realPath)
    }
}

function real_name(name){
    if( name && name.substr(0,1) !== '/'){
        return '/' + name;
    }
    else{
        return name;
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
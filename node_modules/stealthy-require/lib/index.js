'use strict';

function forEach(obj, callback) {
    for ( var key in obj ) {
        if (!Object.prototype.hasOwnProperty.call(obj, key)) {
            continue;
        }
        callback(key);
    }
}

function assign(target, source) {
    var keys = [];
    forEach(source, function (key) {
        keys.push(key);
    });
    for ( var i = 0; i < keys.length; i+=1 ) {
        target[keys[i]] = source[keys[i]];
    }
    return target;
}

function clearCache(requireCache) {
    forEach(requireCache, function (resolvedPath) {
        if (resolvedPath.match(/\.node$/) === null) {
            delete requireCache[resolvedPath];
        }
    });
}

module.exports = function (requireCache, callback) {

    var temp = assign({}, requireCache);
    clearCache(requireCache);

    var freshModule = callback();

    clearCache(requireCache);
    assign(requireCache, temp);

    return freshModule;

};

'use strict';

var path = require('path');
var thing = require('core-util-is');


exports.env = {
    development: /^dev/i,
    test       : /^test/i,
    staging    : /^stag/i,
    production : /^prod/i
};


exports.isAbsolute = function absPath(file) {
    if (thing.isString(file)) {
        return path.resolve(file) === file;
    }
    return undefined;
};


exports.merge = function marge(src, dest) {
    // NOTE: Do not merge arrays.
    if (thing.isObject(src) && !thing.isArray(src) && !thing.isNullOrUndefined(dest)) {

        Object.getOwnPropertyNames(src).forEach(function(prop) {
            var descriptor;
            descriptor = Object.getOwnPropertyDescriptor(src, prop);
            descriptor.value = marge(descriptor.value, dest[prop]);
            Object.defineProperty(dest, prop, descriptor);
        });

        return dest;

    }

    return src;
};

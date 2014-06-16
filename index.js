/*───────────────────────────────────────────────────────────────────────────*\
 │  Copyright (C) 2014 eBay Software Foundation                               │
 │                                                                            │
 │  Licensed under the Apache License, Version 2.0 (the "License");           │
 │  you may not use this file except in compliance with the License.          │
 │  You may obtain a copy of the License at                                   │
 │                                                                            │
 │    http://www.apache.org/licenses/LICENSE-2.0                              │
 │                                                                            │
 │  Unless required by applicable law or agreed to in writing, software       │
 │  distributed under the License is distributed on an "AS IS" BASIS,         │
 │  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  │
 │  See the License for the specific language governing permissions and       │
 │  limitations under the License.                                            │
 \*───────────────────────────────────────────────────────────────────────────*/
'use strict';

var path = require('path');
var async = require('async');
var shush = require('shush');
var caller = require('caller');
var thing = require('core-util-is');
var shortstop = require('shortstop');
var debug = require('debuglog')('confit');
var handlers = require('shortstop-handlers');
var common = require('./lib/common');
var provider = require('./lib/provider');


function config(store) {
    return {

        _store: store,

        get: function get(key) {
            var obj;

            if (thing.isString(key) && key.length) {

                key = key.split(':');
                obj = store;

                while (obj && key.length) {
                    if (obj.constructor !== Object) {
                        // Do not allow traversal into complex types,
                        // such as Buffer, Date, etc. So, this type
                        // of key will fail: 'foo:mystring:length'
                        return undefined;
                    }
                    obj = obj[key.shift()];
                }

                return obj;

            }

            return undefined;
        },

        set: function set(key, value) {
            var obj, prop;

            if (thing.isString(key) && key.length) {

                key = key.split(':');
                obj = store;

                while (key.length - 1) {
                    prop = key.shift();

                    // Create new object for property, if nonexistent
                    if (!obj.hasOwnProperty(prop)) {
                        obj[prop] = {};
                    }

                    obj = obj[prop];
                    if (obj && obj.constructor !== Object) {
                        // Do not allow traversal into complex types,
                        // such as Buffer, Date, etc. So, this type
                        // of key will fail: 'foo:mystring:length'
                        return undefined;
                    }
                }

                return (obj[key.shift()] = value);
            }

            return undefined;
        },

        use: function use(obj) {
            common.merge(obj, store);
        },

        merge: function merge(obj) {
            this.use(obj._store);
        }
    };
}


function resolveImport(data, basedir) {
    return function importer(next) {
        var resolve, shorty;

        resolve = handlers.path(basedir);
        shorty = shortstop.create();
        shorty.use('import', function (file, cb) {
            try {
                file = resolve(file);
                return shorty.resolve(shush(file), cb);
            } catch (err) {
                cb(err);
            }
        });

        shorty.resolve(data, next);
    };
}


function resolveCustom(protocols) {
    return function custom(data, next) {
        var shorty;

        shorty = shortstop.create();
        Object.keys(protocols).forEach(function (protocol) {
            shorty.use(protocol, protocols[protocol]);
        });

        shorty.resolve(data, next);
    };
}


function resolveConfigs() {
    return function config(data, next) {
        var shorty, usedHandler;

        shorty = shortstop.create();
        shorty.use('config', function (key) {
            var keys, result, prop;

            usedHandler = true;
            keys = key.split('.');
            result = data;

            while (result && keys.length) {
                prop = keys.shift();
                if (!result.hasOwnProperty(prop)) {
                    return undefined;
                }
                result = result[prop];
            }

            return keys.length ? null : result;
        });

        async.doWhilst(
            function exec(cb) {
                usedHandler = false;
                shorty.resolve(data, function (err, result) {
                    if (err) {
                        cb(err);
                        return;
                    }
                    data = result;
                    cb();
                });
            },

            function test() {
                return usedHandler;
            },

            function complete(err) {
                if (err) {
                    next(err);
                    return;
                }
                next(null, data);
            }
        );
    };
}

function builder(options) {

    function wrapper(fn) {
        return function(thing) {
            var file;
            if (typeof thing === 'string') {
                file = common.isAbsolute(thing) ? thing : path.join(options.basedir, thing);
                thing = shush(file);
            }
            return fn.call(this, thing);
        };
    }


    return {

        _store: {},

        addDefault: wrapper(function addDefaults(obj) {
            this._store = common.merge(this._store, obj);
            return this;
        }),

        addOverride: wrapper(function addOverride(obj) {
            this._store = common.merge(obj, this._store);
            return this;
        }),

        create: function create(callback) {
            async.waterfall(
                [
                    resolveImport(this._store, options.basedir),
                    resolveCustom(options.protocols),
                    resolveConfigs()
                ],
                function complete(err, data) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    callback(null, config(data));
                }
            );
        }

    };
}

function possibly(resolve, reject) {
    return function maybe() {
        try {
            return resolve.apply(null, arguments);
        } catch (err) {
            reject(err);
        }
    };
}


function resolve(file, store) {
    return common.merge(shush(file), store);
}


function reject(err) {
    if (err.code && err.code === 'MODULE_NOT_FOUND') {
        debug('WARNING:', err.message);
        return;
    }
    throw err;
}


module.exports = function confit(options) {
    var factory, margeFile, file;

    // Normalize arguments
    if (thing.isString(options)) {
        options = { basedir: options };
    }

    // ¯\_(ツ)_/¯ ... still normalizing
    options = options || {};
    options.defaults = options.defaults || 'config.json';
    options.basedir = options.basedir || path.dirname(caller());
    options.protocols = options.protocols || {};

    factory = builder(options);
    common.merge(provider.argv(), factory._store);
    common.merge(provider.env(), factory._store);
    common.merge(provider.convenience(), factory._store);

    // Backdoor a couple files before we get going.
    margeFile = possibly(resolve, reject);

    // File 1: The default config file.
    file = path.join(options.basedir, options.defaults);
    margeFile(file, factory._store);

    // File 2: The env-specific config file.
    file = path.join(options.basedir, factory._store.env.env + '.json');
    margeFile(file, factory._store);

    return factory;
};

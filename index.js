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
var BB = require('bluebird');


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

function resolveCustom(data, protocols) {
    return function custom(next) {
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

function resolveImport(data, basedir, cb) {

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
    shorty.resolve(data, cb);

}


/**
 * function marge: Used to merge the contents of data into the store
 *  data : It is either a file name or an object
 *      if a filename, we load the file & resolve any import shortstop handlers
 *  store: an object
 *  options: an object with 3 useful properties
 *      eatErr: if while loading the file, module not found ,
 *              eat the error and continue like nothing happened
 *      mergeToData: Merge the store into data.
 *                  (by default data will always get merged into store)
 *      basedir: the directory to scan for the imported configs
 **/
function marge(data, store, options) {
    var file;

    return new BB(function(resolve, reject) {
        //this is the case when it is the name of a file
        if (typeof data === 'string') {
            file = common.isAbsolute(data) ? data : path.join(options.basedir, data);
            try {
                data = shush(file);
            } catch(err) {
                if (err.code &&
                    err.code === 'MODULE_NOT_FOUND' &&
                    (options && options.eatErr)) {
                    debug('WARNING:', err.message);
                    resolve(store);
                } else {
                    reject(err);
                }
                return;
            }

            resolveImport(data, options.basedir, function(err, result) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve( (options && options.mergeToData) ?
                    common.merge(store, result) : common.merge(result, store));
            });
        //the case when the data is a json object
        } else {
            resolve( (options && options.mergeToData) ?
                common.merge(store, data) : common.merge(data, store));
        }
    });
}

function builder(options) {
    return {

        _promise: new BB(function(resolve) {
            resolve({});
        }),

        addDefault: function addDefaults(obj) {
            var self = this;
            self._promise = self._promise
                .then(function(result) {
                    return marge(obj, result, {
                        mergeToData: true,
                        basedir: options.basedir
                    });
                });
            return this;
        },

        addOverride: function addOverride(obj) {
            var self = this;
            self._promise = self._promise
                .then(function(result) {
                    return marge(obj, result, { basedir: options.basedir});
                });
            return this;
        },

        create: function create(callback) {
            this._promise.then(function(data) {
                async.waterfall(
                    [
                        resolveCustom(data, options.protocols),
                        resolveConfigs()
                    ],
                    function complete(err, result) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        callback(null, config(result));
                    }
                );
            }).catch(function(err) {
                callback(err);
            });
        }
    };
}

function resolveConfFiles(data, options) {
    // File 1: The default config file.
    var file = path.join(options.basedir, options.defaults);

    return new BB(function(resolve) {
        marge(file, data, {
                eatErr: true,
                basedir: options.basedir
            })
            .then(function(result) {
                file = path.join(options.basedir, result.env.env + '.json');
                marge(file, result, {
                        eatErr: true,
                        basedir: options.basedir
                    })
                    .then(function(result) {
                        resolve(result);
                    });
            });
    });
}

module.exports = function confit(options) {
    var factory;

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

    factory._promise = factory._promise
        .then(function(result) {
            result = common.merge(provider.argv(), result);
            result = common.merge(provider.env(), result);
            result = common.merge(provider.convenience(), result);
            return resolveConfFiles(result, options);
        });

    return factory;
};

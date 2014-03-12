'use strict';

var fs = require('fs');
var path = require('path');
var nconf = require('nconf');
var caller = require('caller');
var thing = require('core-util-is');
var shortstop = require('shortstop');
var env = require('./lib/env');


/**
 * Creates a local nconf provider instance. NO GLOBAL!
 * @returns {Object} an nconf provider
 */
function provider() {
    var config;

    config = new nconf.Provider();
    config.add('argv');
    config.add('env');
    config.add('memory');

    return environment(config);
}


/**
 * Initializes environment convenience properties in the provided nconf provider.
 * @param config an nconf Provider.
 * @returns {Object} the newly configured nconf Provider.
 */
function environment(config) {
    var nodeEnv, data;

    nodeEnv = config.get('NODE_ENV') || 'development';
    data = {};

    // Normalize env and set convenience values.
    Object.keys(env).forEach(function (current) {
        var match;
        match = env[current].test(nodeEnv);
        match && (nodeEnv = current);
        data[current] = match;
    });

    // Set (or re-set) env:{nodeEnv} value in case
    // NODE_ENV was not one of our predetermined env
    // keys (so `config.get('env:blah')` will be true).
    data[nodeEnv] = true;
    data.env = nodeEnv;

    // Add derived environment data to config.
    config.use('environment', {
        type: 'literal',
        store: {
            env: data
        }
    });

    return config;
}


/**
 * Creates a file loader that uses the provided `basedir`.
 * @param basedir the root directory against which file paths will be resolved.
 * @returns {Function} the file loader implementation.
 */
function loader(basedir) {

    return function load(file) {
        var config, filename, data;

        config = path.join(basedir, file);
        filename = path.basename(file, path.extname(file));
        data = fs.existsSync(config) ? shush(config) : {};

        return {
            name: filename,
            data: data
        };
    };

}


/**
 * Wraps the provided nconf Provider in a simpler convenience API.
 * @param config an nconf Provider.
 */
function wrap(config) {
    return {

        get: function get(key) {
            return config.get(key);
        },

        set: function set(key, value) {
            return config.set(key, value);
        },

        use: function use(name, obj) {
            config.use(name, {
                type: 'literal',
                store: obj
            });
        }

    };
}


/**
 * Main module entrypoint. Creates a confit config object using the provided
 * options.
 * @param options the configuration settings for this config instance.
 * @param callback the continuation function to which error or config object will be passed.
 */
module.exports = function confit(options, callback) {
    var shorty, config, load, file, impl;

    // Normalize arguments
    if (thing.isFunction(options)) {
        callback = options;
        options = undefined;
    }

    if (thing.isString(options)) {
        options = { basedir: options };
    }

    options = options || {};


    // Configure shortstop using provided protocols
    shorty = shortstop.create();
    if (thing.isObject(options.protocols)) {
        Object.keys(options.protocols).forEach(function (protocol) {
            shorty.use(protocol, options.protocols[protocol]);
        });
    }


    // Create provider and initialize.
    config = provider();
    config.set('basedir', options.basedir || path.dirname(caller()));

    // create file loader and confit instance
    load = loader(config.get('basedir'));
    impl = wrap(config);

    [ env + '.json', 'config.json' ].forEach(function (file) {
        file = load(file);
        impl.use(file.name, shorty.resolve(file.data));
    });

    // force async until new shortstop is integrated
    setImmediate(callback.bind(null, null, impl));
};

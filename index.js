'use strict';

var fs = require('fs');
var path = require('path');
var nconf = require('nconf');
var shush = require('shush');
var caller = require('caller');
var thing = require('core-util-is');
var shortstop = require('shortstop');
var debug = require('debuglog')('confit');
var env = require('./lib/env');


/**
 * Initializes environment convenience props in the provided nconf provider.
 * @param config an nconf Provider.
 * @returns {Object} the newly configured nconf Provider.
 */
function environment(nodeEnv) {
    var data = {};

    debug('NODE_ENV set to \'%s\'', nodeEnv);

    // Normalize env and set convenience values.
    Object.keys(env).forEach(function (current) {
        var match;

        match = env[current].test(nodeEnv);
        if (match) { nodeEnv = current; }

        data[current] = match;
    });

    debug('env:env set to \'%s\'', nodeEnv);

    // Set (or re-set) env:{nodeEnv} value in case
    // NODE_ENV was not one of our predetermined env
    // keys (so `config.get('env:blah')` will be true).
    data[nodeEnv] = true;
    data.env = nodeEnv;
    return { env: data };
}


/**
 * Creates a local nconf provider instance. NO GLOBAL!
 * @returns {Object} an nconf provider
 */
function provider() {
    var config;

    config = new nconf.Provider();
    config.add('argv');
    config.add('env');

    // Put override before memory to ensure env
    // values are immutable.
    config.overrides({
        type: 'literal',
        store: environment(config.get('NODE_ENV') || 'development')
    });

    config.add('memory');

    return config;
}


/**
 * Creates a file loader that uses the provided `basedir`.
 * @param basedir the root directory against which file paths will be resolved.
 * @returns {Function} the file loader implementation.
 */
function loader(basedir) {

    return function load(file) {
        var config, name, data;

        config = path.join(basedir, file);
        name = path.basename(file, path.extname(file));

        if (fs.existsSync(config)) {
            data = shush(config);
        } else {
            data = {};
            debug('WARNING: Unable to load file \'%s\'', config);
        }

        return {
            name: name,
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
            var original, current;

            original = this.get(key);
            config.set(key, value);
            current = this.get(key);

            if (value !== original && value !== current) {
                debug('WARNING: Property \'%s\' is readonly.', key);
            }
        },

        use: function use(obj) {
            // Merge into memory store.
            // This must be done b/c nconf applies things kind of backward.
            // If we just used a literal store it would get added to the END
            // so no values would be overridden. Additionally, only the memory
            // store is writable at this point so all updates live there.
            config.merge(obj);
        }

    };
}


/**
 * Main module entrypoint. Creates a confit config object using the provided
 * options.
 * @param options the configuration settings for this config instance.
 * @param callback the function to which error or config object will be passed.
 */
module.exports = function confit(options, callback) {
    var shorty, config, load, file;

    // Normalize arguments
    if (thing.isFunction(options)) {
        callback = options;
        options = undefined;
    }

    // ... still normalizing
    if (thing.isString(options)) {
        options = { basedir: options };
    }

    // ¯\_(ツ)_/¯ ... still normalizing
    options = options || {};
    options.defaults = options.defaults || 'config.json';
    options.basedir = options.basedir || path.dirname(caller());


    // Configure shortstop using provided protocols
    shorty = shortstop.create();
    if (thing.isObject(options.protocols)) {
        Object.keys(options.protocols).forEach(function (protocol) {
            shorty.use(protocol, options.protocols[protocol]);
        });
    }

    // Our file loader
    load = loader(options.basedir);

    // Create config provider and initialize basedir
    // TODO: Add basedir to overrides so it's readonly?
    config = provider();
    config.set('basedir', options.basedir);

    // Load the env-specific config file as a literal
    // datastore. Can't use `file` b/c we preprocess it.
    file = load(config.get('env:env') + '.json');
    config.use(file.name, {
        type: 'literal',
        store: shorty.resolve(file.data)
    });

    // Set defaults from `defaults` file.
    file = load(options.defaults);
    config.defaults(shorty.resolve(file.data));

    // XXX: Force async until shortstop@1.0 is integrated.
    config = wrap(config);
    setImmediate(callback.bind(null, null, config));
};

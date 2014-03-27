'use strict';

var minimist = require('minimist');
var common = require('./common');
var debug = require('debuglog')('confit');


exports.argv = function argv() {
    var result, args;

    result = {};
    args = minimist(process.argv.slice(2));

    Object.keys(args).forEach(function (key) {
        if (key === '_') {
            // Since the '_' args are standalone,
            // just set keys with null values.
            args._.forEach(function (prop) {
                result[prop] = null;
            });
            return;
        }

        result[key] = args[key];
    });

    return result;
};


exports.env = function env() {
    var result = {};

    // process.env is not a normal object, so we
    // need to map values.
    Object.keys(process.env).forEach(function (env) {
        result[env] = process.env[env];
    });

    return result;
};


exports.convenience = function convenience() {
    var env, data;

    env = process.env.NODE_ENV || 'development';
    data = {};

    debug('NODE_ENV set to \'%s\'', env);

    // Normalize env and set convenience values.
    Object.keys(common.env).forEach(function (current) {
        var match;

        match = common.env[current].test(env);
        if (match) { env = current; }

        data[current] = match;
    });

    debug('env:env set to \'%s\'', env);

    // Set (or re-set) env:{nodeEnv} value in case
    // NODE_ENV was not one of our predetermined env
    // keys (so `config.get('env:blah')` will be true).
    data[env] = true;
    data.env = env;
    return { env: data };
};

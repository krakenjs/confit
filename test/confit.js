'use strict';

var path = require('path');
var test = require('tape');
var confit = require('../');


var env = process.env.NODE_ENV;

test('confit', function (t) {

    t.on('end', function () {
        process.env.NODE_ENV = env;
    });


    t.test('environment', function (t) {

        t.test('dev', function (t) {
            process.env.NODE_ENV = 'dev';
            confit(function (err, config) {
                console.log(err);
                t.error(err);
                t.equal(config.get('NODE_ENV'), 'dev');
                t.equal(config.get('env:env'), 'development');
                t.ok(config.get('env:development'));
                t.notOk(config.get('env:test'));
                t.notOk(config.get('env:staging'));
                t.notOk(config.get('env:production'));
                t.end();
            });
        });


        t.test('test', function (t) {
            process.env.NODE_ENV = 'test';
            confit(function (err, config) {
                t.error(err);
                t.equal(config.get('NODE_ENV'), 'test');
                t.equal(config.get('env:env'), 'test');
                t.notOk(config.get('env:development'));
                t.ok(config.get('env:test'));
                t.notOk(config.get('env:staging'));
                t.notOk(config.get('env:production'));
                t.end();
            });
        });


        t.test('stage', function (t) {
            process.env.NODE_ENV = 'stage';
            confit(function (err, config) {
                t.error(err);
                t.equal(config.get('NODE_ENV'), 'stage');
                t.equal(config.get('env:env'), 'staging');
                t.notOk(config.get('env:development'));
                t.notOk(config.get('env:test'));
                t.ok(config.get('env:staging'));
                t.notOk(config.get('env:production'));
                t.end();
            });
        });


        t.test('prod', function (t) {
            process.env.NODE_ENV = 'prod';
            confit(function (err, config) {
                t.error(err);
                t.equal(config.get('NODE_ENV'), 'prod');
                t.equal(config.get('env:env'), 'production');
                t.notOk(config.get('env:development'));
                t.notOk(config.get('env:test'));
                t.notOk(config.get('env:staging'));
                t.ok(config.get('env:production'));
                t.end();
            });
        });


        t.test('none', function (t) {
            process.env.NODE_ENV = 'none';
            confit(function (err, config) {
                t.error(err);
                t.equal(config.get('NODE_ENV'), 'none');
                t.equal(config.get('env:env'), 'none');
                t.notOk(config.get('env:development'));
                t.notOk(config.get('env:test'));
                t.notOk(config.get('env:staging'));
                t.notOk(config.get('env:production'));
                t.ok(config.get('env:none'));
                t.end();
            });
        });


        t.test('not set', function (t) {
            process.env.NODE_ENV = '';
            confit(function (err, config) {
                t.error(err);
                t.equal(config.get('NODE_ENV'), '');
                t.equal(config.get('env:env'), 'development');
                t.ok(config.get('env:development'));
                t.notOk(config.get('env:test'));
                t.notOk(config.get('env:staging'));
                t.notOk(config.get('env:production'));
                t.end();
            });
        });

    });


    test('overrides', function (t) {
        var basedir;

        process.env.NODE_ENV = 'dev';
        basedir = path.join(__dirname, 'fixtures', 'defaults');

        confit(basedir, function (err, config) {
            t.error(err);

            // File-based overrides
            t.equal(config.get('default'), 'config');
            t.equal(config.get('override'), 'development');

            // Manual overrides
            config.set('override', 'runtime');
            t.equal(config.get('override'), 'runtime');

            config.use({ override: 'literal' });
            t.equal(config.get('override'), 'literal');

            // env values should be immutable
            config.set('env:env', 'foobar');
            t.equal(config.get('env:env'), 'development');
            t.end();
        });

    });


    test('protocols', function (t) {
        var basedir, options;

        process.env.NODE_ENV = 'dev';
        basedir = path.join(__dirname, 'fixtures', 'defaults');
        options = {
            basedir: basedir,
            protocols: {
                path: function (value) {
                    return path.join(basedir, value);
                }
            }
        };

        confit(options, function (err, config) {
            t.error(err);
            // Ensure handler was run correctly on default file.
            t.equal(config.get('path'), path.join(basedir, 'development.json'));

            config.use({ path: __filename });
            t.equal(config.get('path'), __filename);
            t.end();
        });
    });


    test('error', function (t) {
        var basedir, options;

        process.env.NODE_ENV = 'dev';
        basedir = path.join(__dirname, 'fixtures', 'defaults');
        options = {
            basedir: basedir,
            protocols: {
                path: function (value) {
                    throw new Error('exec');
                }
            }
        };

        confit(options, function (err, config) {
            t.ok(err);
            t.notOk(config);
            t.end();
        });
    });

});

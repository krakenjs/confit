'use strict';

var path = require('path');
var test = require('tape');
var confit = require('../');


var env = process.env.NODE_ENV;

test('confit', function (t) {

    t.on('end', function () {
        process.env.NODE_ENV = env;
    });


    t.test('api', function (t) {
        var factory = confit();
        factory.create(function (err, config) {
            t.error(err);
            t.equal(typeof config.get, 'function');
            t.equal(typeof config.set, 'function');
            t.equal(typeof config.use, 'function');
            t.end();
        });
    });


    t.test('environment', function (t) {

        t.test('dev', function (t) {
            process.env.NODE_ENV = 'dev';
            confit().create(function (err, config) {
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
            confit().create(function (err, config) {
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
            confit().create(function (err, config) {
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
            confit().create(function (err, config) {
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
            confit().create(function (err, config) {
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
            confit().create(function (err, config) {
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


    t.test('get', function (t) {
        confit().create(function (err, config) {
            var val;

            t.error(err);

            val = config.get('env')
            t.equal(typeof val, 'object');

            val = config.get('env:env');
            t.equal(typeof val, 'string');

            val = config.get('env:env:length');
            t.equal(typeof val, 'undefined');

            val = config.get('env:development');
            t.equal(typeof val, 'boolean');

            val = config.get('env:a');
            t.equal(typeof val, 'undefined');

            val = config.get('a');
            t.equal(typeof val, 'undefined');

            val = config.get('a:b');
            t.equal(typeof val, 'undefined');

            val = config.get('a:b:c');
            t.equal(typeof val, 'undefined');

            val = config.get(undefined);
            t.equal(typeof val, 'undefined');

            val = config.get(null);
            t.equal(typeof val, 'undefined');

            val = config.get('');
            t.equal(typeof val, 'undefined');

            val = config.get(false);
            t.equal(typeof val, 'undefined');

            t.end();
        });
    });


    t.test('set', function (t) {
        confit().create(function (err, config) {
            var val;

            t.error(err);

            val = config.set('foo', 'bar');
            t.equal(val, 'bar');
            t.equal(config.get('foo'), 'bar');

            val = config.set('foo:bar', 'baz');
            t.equal(val, undefined);
            t.equal(config.get('foo:bar'), undefined);

            val = config.set('new:thing', 'foo');
            t.equal(val, 'foo');
            t.equal(config.get('new:thing'), 'foo');

            val = config.set('', 'foo');
            t.equal(val, undefined);
            t.equal(config.get(''), undefined);

            val = config.set(undefined, undefined);
            t.equal(val, undefined);

            val = config.set('my:prop', 10);
            t.equal(val, 10);
            t.equal(config.get('my:prop'), 10);

            // Test non-primitives
            val = config.set('another:obj', { with: 'prop' });
            t.equal(val.with, 'prop');

            val = config.get('another:obj');
            t.equal(val.with, 'prop');

            val = config.get('another:obj:with');
            t.equal(val, 'prop');

            // Try out arrays
            val = config.set('arr', [0,1,2]);
            t.ok(Array.isArray(val));

            val = config.get('arr');
            t.ok(Array.isArray(val));
            t.equal(val[0], 0);
            t.equal(val[1], 1);
            t.equal(val[2], 2);

            val = config.set('arr:0', 'a');
            t.notOk(val);

            t.end();
        });
    });


    t.test('use', function (t) {
        confit().create(function (err, config) {
            var val;

            t.error(err);

            val = config.use({ foo: { bar: 'baz' } });
            t.notOk(val);

            val = config.get('foo');
            t.equal(typeof val, 'object');
            t.equal(val.bar, 'baz');

            val = config.get('foo:bar');
            t.equal(val, 'baz');

            config.use({ arr: [0,1,2] });
            val = config.get('arr');
            t.ok(Array.isArray(val));
            t.equal(val[0], 0);
            t.equal(val[1], 1);
            t.equal(val[2], 2);

            // Arrays are not merged
            config.use({ arr: ['a', 'b', 'c', 'd'] });
            val = config.get('arr');
            t.ok(Array.isArray(val));
            t.equal(val[0], 'a');
            t.equal(val[1], 'b');
            t.equal(val[2], 'c');
            t.equal(val[3], 'd');

            t.end();
        });
    });


    t.test('defaults', function (t) {
        var basedir;

        // This case should still load the default values
        // even though a 'test.json' file does not exist.
        process.env.NODE_ENV = 'test';
        basedir = path.join(__dirname, 'fixtures', 'defaults');

        confit(basedir).create(function (err, config) {
            t.error(err);

            // File-based overrides
            t.equal(config.get('default'), 'config');
            t.equal(config.get('override'), 'config');

            // Manual overrides
            config.set('override', 'runtime');
            t.equal(config.get('override'), 'runtime');

            config.use({ override: 'literal' });
            t.equal(config.get('override'), 'literal');

            t.end();
        });
    });


    t.test('overrides', function (t) {
        var basedir;

        process.env.NODE_ENV = 'dev';
        basedir = path.join(__dirname, 'fixtures', 'defaults');

        confit(basedir).create(function (err, config) {
            t.error(err);

            // File-based overrides
            t.equal(config.get('default'), 'config');
            t.equal(config.get('override'), 'development');

            // Manual overrides
            config.set('override', 'runtime');
            t.equal(config.get('override'), 'runtime');

            config.use({ override: 'literal' });
            t.equal(config.get('override'), 'literal');

            t.end();
        });

    });


    t.test('protocols', function (t) {
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

        confit(options).create(function (err, config) {
            t.error(err);
            // Ensure handler was run correctly on default file
            t.equal(config.get('misc'), path.join(basedir, 'config.json'));
            t.equal(config.get('path'), path.join(basedir, 'development.json'));

            config.use({ path: __filename });
            t.equal(config.get('path'), __filename);
            t.end();
        });
    });


    t.test('error', function (t) {
        var basedir, options;

        process.env.NODE_ENV = 'dev';
        basedir = path.join(__dirname, 'fixtures', 'defaults');
        options = {
            basedir: basedir,
            protocols: {
                path: function (value) {
                    throw new Error('path');
                }
            }
        };

        t.throws(function () {
            confit(path.join(__dirname, 'fixtures', 'malformed'));
        });

        confit(options).create(function (err, config) {
            t.ok(err);
            t.notOk(config);
            t.end();
        });
    });


    t.test('addOverride', function (t) {
        var basedir, factory;

        process.env.NODE_ENV = 'test';
        basedir = path.join(__dirname, 'fixtures', 'defaults');

        factory = confit(basedir);
        factory.addOverride('development.json');
        factory.addOverride(path.join(basedir, 'supplemental.json'));
        factory.create(function (err, config) {
            t.error(err);
            t.ok(config);
            t.equal(config.get('default'), 'config');
            t.equal(config.get('override'), 'supplemental');
            t.end();
        });
    });


    t.test('addOverride error', function (t) {
        var basedir;


        t.throws(function () {
            confit(path.join(__dirname, 'fixtures', 'defaults'))
                .addOverride('nonexistent.json');
        });

        t.throws(function () {
            confit(path.join(__dirname, 'fixtures', 'defaults'))
                .addOverride('malformed.json');
        });

        t.end();
    });


});

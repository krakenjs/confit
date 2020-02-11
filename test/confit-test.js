'use strict';

var path = require('path');
var test = require('tap').test;
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


    t.test('get', function (t) {
        //setting process.env.env to development, should not change 'env:env'.
        //This should be ignored and 'env:env' should solely depend on process.env.NODE_ENV
        process.env.env = 'development';

        confit().create(function (err, config) {
            var val;

            t.error(err);

            val = config.get('env');
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

            val = config.set('thing:isEnabled', true);
            t.strictEqual(val, true);
            t.strictEqual(config.get('thing:isEnabled'), true);

            val = config.set('thing:isEnabled', false);
            t.strictEqual(val, false);
            t.strictEqual(config.get('thing:isEnabled'), false);

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


    t.test('import protocol', function (t) {
        var basedir;

        basedir = path.join(__dirname, 'fixtures', 'import');
        confit(basedir).create(function (err, config) {
            t.error(err);
            t.equal(config.get('name'), 'parent');
            t.equal(config.get('child:name'), 'child');
            t.equal(config.get('child:grandchild:name'), 'grandchild');
            t.equal(config.get('child:grandchildJson:name'), 'grandchild');
            t.end();
        });
    });


    t.test('missing file import', function (t) {
        var basedir;

        basedir = path.join(__dirname, 'fixtures', 'import');
        confit(basedir)
            .addOverride('./missing.json')
            .create(function (err, config) {
                t.ok(err);
                t.notOk(config);
                t.equal(err.code, 'MODULE_NOT_FOUND');
                t.end();
            });
    });


    t.test('config protocol', function (t) {
        var basedir;

        basedir = path.join(__dirname, 'fixtures', 'config');
        confit(basedir).create(function (err, config) {
            t.error(err);
            t.ok(config);
            t.equal(config.get('name'), 'config');
            t.equal(config.get('foo'), config.get('imported:foo'));
            t.equal(config.get('bar'), config.get('foo'));
            t.strictEqual(config.get('path:to:nested:value'), config.get('value'));
            t.strictEqual(config.get('baz'), config.get('path:to:nested:value'));
            t.end();
        });
    });

    t.test('default file import', function (t) {
        var basedir;

        basedir = path.join(__dirname, 'fixtures', 'import');
        confit(basedir)
            .addDefault('./default.json')
            .create(function (err, config) {
                t.error(err);
                t.equal(config.get('name'), 'parent');
                t.equal(config.get('foo'), 'bar');
                t.equal(config.get('child:name'), 'child');
                t.equal(config.get('child:grandchild:name'), 'grandchild');
                t.end();
            });
    });


    t.test('missing config value', function (t) {
        var basedir;

        basedir = path.join(__dirname, 'fixtures', 'config');
        confit(basedir)
            .addOverride('./error.json')
            .create(function (err, config) {
                t.error(err);
                t.ok(config);
                t.equal(config.get('foo'), undefined);
                t.end();
            });
    });


    t.test('merge', function (t) {
        var basedir;

        basedir = path.join(__dirname, 'fixtures', 'defaults');
        confit(basedir).create(function (err, configA) {
            confit().create(function (err, configB) {
                t.error(err);
                t.doesNotThrow(function () {
                    configA.merge(configB);
                });
                t.end();
            });
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


    t.test('confit addOverride as json object', function (t) {
        var basedir;
        basedir = path.join(__dirname, 'fixtures', 'config');
        confit(basedir)
            .addOverride({
                tic: {
                    tac: 'toe'
                },
                foo: 'bar'
            }).create(function (err, config) {
                t.error(err);
                t.ok(config);
                t.equal(config.get('tic:tac'), 'toe');
                t.equal(config.get('foo'),'bar');
                t.equal(config.get('name'), 'config');
                t.end();
            });
    });

    t.test('confit without files, using just json objects', function(t) {
        confit().addDefault({
            foo: 'bar',
            tic: {
                tac: 'toe'
            },
            blue: false
        }).addOverride({
            blue: true
        }).create(function(err, config) {
            t.equal(config.get('foo'), 'bar');
            t.equal(config.get('tic:tac'), 'toe');
            t.equal(config.get('blue'), true);
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


    t.test('protocols (array)', function (t) {
        var basedir, options;

        process.env.NODE_ENV = 'dev';
        basedir = path.join(__dirname, 'fixtures', 'defaults');
        options = {
            basedir: basedir,
            protocols: {
                path: [
                    function (value) {
                        return path.join(basedir, value);
                    },
                    function (value) {
                        return value + '!';
                    }
                ]
            }
        };

        confit(options).create(function (err, config) {
            t.error(err);
            // Ensure handler was run correctly on default file
            t.equal(config.get('misc'), path.join(basedir, 'config.json!'));
            t.equal(config.get('path'), path.join(basedir, 'development.json!'));

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

        confit(options).create(function (err, config) {
            t.ok(err);
            t.notOk(config);
            t.end();
        });
    });


    t.test('malformed', function (t) {
        var basedir = path.join(__dirname, 'fixtures', 'malformed');
        confit(basedir).create(function (err, config) {
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

    t.test('import: with merging objects in imported files', function(t) {

        var basedir = path.join(__dirname, 'fixtures', 'import');
        var factory = confit(basedir);
        factory.addDefault('override.json');

        factory.create(function(err, config) {
            t.error(err);
            t.ok(config);
            t.equal(config.get('child:grandchild:secret'), 'santa');
            t.equal(config.get('child:grandchild:name'), 'grandchild');
            t.equal(config.get('child:grandchild:another'), 'claus');
            t.end();
        });
    });

    t.test('precedence', function (t) {
        var factory;
        var argv = process.argv;
        var env = process.env;

        process.argv = [ 'node', __filename, '--override=argv'];
        process.env = {
            NODE_ENV: 'development',
            override: 'env',
            misc: 'env'
        };

        factory = confit(path.join(__dirname, 'fixtures', 'defaults'));
        factory.create(function (err, config) {
            t.error(err);
            t.ok(config);
            t.equal(config.get('override'), 'argv');
            t.equal(config.get('misc'), 'env');
            process.argv = argv;
            process.env = env;
            t.end();
        });
    });
    t.test('env ignore', function (t) {
        var basedir, options;

        var env = process.env = {
            NODE_ENV: 'development',
            fromlocal: 'config:local',
            local: 'motion',
            ignoreme: 'file:./path/to/mindyourbusiness'
        };
        basedir = path.join(__dirname, 'fixtures', 'defaults');
        options = {
            basedir: basedir,
            envignore: ['ignoreme']
        };

        confit(options).create(function (err, config) {
            t.error(err);
            // Ensure env is read except for the desired ignored property
            t.equal(config.get('fromlocal'), env.local);
            t.equal(config.get('ignoreme'), undefined);
            t.end();
        });
    });

    t.end();
});

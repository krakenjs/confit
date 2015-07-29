'use strict';

require('babel/register');
var test = require('tap').test;
var provider = require('../lib/provider');

test('env', function (t) {
    var env = process.env;

    t.on('end', function () {
        process.env = env;
    });

    t.test('env variables', function () {
        var val;

        process.env = {
            foo: 'bar'
        };

        val = provider.env();
        t.equal(val.foo, 'bar');
        t.end();
    });
});


test('argv', function (t) {
    var argv = process.argv;

    t.on('end', function () {
        process.argv = argv;
    });

    t.test('arguments', function (t) {
        var val;

        process.argv = [ 'node', __filename, '-a', 'b', '-c', 'd', '--e=f', 'g', 'h' ];

        val = provider.argv();
        t.equal(typeof val, 'object');
        t.equal(val.a, 'b');
        t.equal(val.c, 'd');
        t.equal(val.e, 'f');
        t.equal(val.g, null);
        t.equal(val.h, null);
        t.end();
    });

    t.end();
});


test('convenience', function (t) {
    var env = process.env.NODE_ENV;

    t.on('end', function () {
        process.env.NODE_ENV = env;
    });

    t.test('dev', function (t) {
        var val;

        process.env.NODE_ENV = 'dev';

        val = provider.convenience();
        t.equal(val.env.env, 'development');
        t.ok(val.env.development);
        t.notOk(val.env.test);
        t.notOk(val.env.staging);
        t.notOk(val.env.production);
        t.end();
    });


    t.test('test', function (t) {
            var val;

        process.env.NODE_ENV = 'test';

        val = provider.convenience();
        t.equal(val.env.env, 'test');
        t.notOk(val.env.development);
        t.ok(val.env.test);
        t.notOk(val.env.staging);
        t.notOk(val.env.production);
        t.end();
    });


    t.test('stage', function (t) {
        var val;

        process.env.NODE_ENV = 'stage';

        val = provider.convenience();
        t.equal(val.env.env, 'staging');
        t.notOk(val.env.development);
        t.notOk(val.env.test);
        t.ok(val.env.staging);
        t.notOk(val.env.production);
        t.end();
    });


    t.test('prod', function (t) {
        var val;

        process.env.NODE_ENV = 'prod';

        val = provider.convenience();
        t.equal(val.env.env, 'production');
        t.notOk(val.env.development);
        t.notOk(val.env.test);
        t.notOk(val.env.staging);
        t.ok(val.env.production);
        t.end();
    });


    t.test('none', function (t) {
        var val;

        process.env.NODE_ENV = 'none';

        val = provider.convenience();
        t.equal(val.env.env, 'none');
        t.notOk(val.env.development);
        t.notOk(val.env.test);
        t.notOk(val.env.staging);
        t.notOk(val.env.production);
        t.ok(val.env.none);
        t.end();
    });


    t.test('not set', function (t) {
        var val;

        process.env.NODE_ENV = '';

        val = provider.convenience();
        t.equal(val.env.env, 'development');
        t.ok(val.env.development);
        t.notOk(val.env.test);
        t.notOk(val.env.staging);
        t.notOk(val.env.production);
        t.end();
    });

    t.end();
});

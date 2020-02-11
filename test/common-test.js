'use strict';

const test = require('tap').test;
const common = require('../lib/common');


test('isAbsolute', function (t) {
    t.ok(common.isAbsolute(__dirname));
    t.ok(common.isAbsolute(__filename));

    t.notOk(common.isAbsolute('./foo.js'));
    t.notOk(common.isAbsolute('foo.js'));
    t.notOk(common.isAbsolute());
    t.notOk(common.isAbsolute(0));
    t.notOk(common.isAbsolute(1));
    t.notOk(common.isAbsolute(true));
    t.notOk(common.isAbsolute(false));
    t.notOk(common.isAbsolute({}));
    t.end();
});


test('merge', function (t) {
    var src, dest;

    src = { a: 'a' };
    dest = {};

    common.merge(src, dest);
    t.notEqual(src, dest);
    t.deepEqual(src, dest);

    src = { a: 'a' };
    dest = { a: 'b' };

    common.merge(src, dest);
    t.notEqual(src, dest);
    t.deepEqual(src, dest);

    src = { a: 'a' };
    dest = { a: 'b', b: 'b' };
    common.merge(src, dest);
    t.notEqual(src, dest);
    t.notDeepEqual(src, dest);
    t.equal(src.a, dest.a);
    t.equal(src.b, undefined);
    t.equal(dest.b, 'b');

    src = { a: { b: 0, c: [ 0, 1, 2 ] } };
    dest = { a: { b: 1, c: [ 'a', 'b', 'c', 'd' ], d: true } };
    common.merge(src, dest);
    t.notEqual(src, dest);
    t.notDeepEqual(src, dest);
    t.notEqual(src.a, dest.a);
    t.equal(src.a.b, dest.a.b);
    t.equal(src.a.c, dest.a.c);
    t.equal(dest.a.d, true);

    t.end();
});


test('merge with existing props', function (t) {
    var src, dest;

    src = {
        'a': {
            'foo': false
        }
    };
    dest = { 'a': '[Object object]' };

    t.doesNotThrow(function () {
        common.merge(src, dest);
        t.deepEqual(src.a, dest.a);
    });

    t.end();
});

test('merge special objects', function (t) {
    const TestClass = class TestClass {};
    const dest = {};
    const src = {
        'a': {
            'foo': false
        },
        'b': new TestClass(),
    };
    src.b['bar'] = true;

    t.doesNotThrow(function () {
        common.merge(src, dest);
    });
    t.notEqual(src, dest);
    t.equal(src.a, dest.a);
    t.equal(src.b, dest.b);
    t.equal(src.b.bar, dest.b.bar);

    dest.b = new TestClass();
    t.doesNotThrow(function () {
        common.merge(src, dest);
    });
    t.equal(src.b, dest.b);
    t.equal(src.b.bar, dest.b.bar);

    t.end();
});

'use strict';

var test = require('tape');
var common = require('../lib/common');


test('common', function (t) {

    t.test('isAbsolute', function (t) {
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


    t.test('marge', function (t) {
        t.end();
    });

});

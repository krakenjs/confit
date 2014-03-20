'use strict';

var test = require('tape');
var util = require('../lib/util');

test('each', function (t) {

    function tasker(obj) {
        return function task(done) {
            obj.count += 1;
            done();
        };
    }

    function thrower(obj) {
        obj.count += 1;
        throw new Error('confit');
    }

    function passer(obj) {
        return function pass(done) {
            try {
                thrower(obj);
            } catch (err) {
                done(err);
            }
        }
    }

    t.test('tasks', function (t) {
        var state, tasks;

        state = { count: 0 };
        tasks = [ tasker(state), tasker(state), tasker(state) ];

        util.every(tasks, function (errs) {
            t.ok(errs);
            t.equal(errs.length, 3);
            t.equal(errs[0], null);
            t.equal(errs[1], null);
            t.equal(errs[2], null);
            t.equal(state.count, 3);
            t.end();
        });
    });


    t.test('passed errors', function (t) {
        var state, tasks;

        state = { count: 0 };
        tasks = [ tasker(state), passer(state), tasker(state) ];

        util.every(tasks, function (errs) {
            t.ok(errs);
            t.equal(errs.length, 3);
            t.equal(errs[0], null);
            t.ok(errs[1]);
            t.equal(errs[1].message, 'confit');
            t.equal(errs[2], null);
            t.equal(state.count, 3);
            t.end();
        });
    });


    t.test('thrown errors', function (t) {
        var state, tasks;

        state = { count: 0 };
        tasks = [ tasker(state), thrower.bind(null, state), tasker(state) ];

        util.every(tasks, function (errs) {
            t.ok(errs);
            t.equal(errs.length, 3);
            t.equal(errs[0], null);
            t.ok(errs[1]);
            t.equal(errs[1].message, 'confit');
            t.equal(errs[2], null);
            t.equal(state.count, 3);
            t.end();
        });
    });

});

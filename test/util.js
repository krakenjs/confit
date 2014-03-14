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

    function thrower() {
        throw new Error('confit');
    }

    function passer(done) {
        try {
            thrower();
        } catch (err) {
            done(err);
        }
    }

    t.test('tasks', function (t) {
        var state, tasks;

        state = { count: 0 };
        tasks = [ tasker(state), tasker(state), tasker(state) ];

        util.each(tasks, function (err) {
            t.error(err);
            t.equal(state.count, 3);
            t.end();
        });
    });


    t.test('passed errors', function (t) {
        var state, tasks;

        state = { count: 0 };
        tasks = [ tasker(state), passer, tasker(state) ];

        util.each(tasks, function (err) {
            t.ok(err);
            t.equal(err.message, 'confit');
            t.equal(state.count, 1);
            t.end();
        });
    });


    t.test('thrown errors', function (t) {
        var state, tasks;

        state = { count: 0 };
        tasks = [ tasker(state), thrower, tasker(state) ];

        util.each(tasks, function (err) {
            t.ok(err);
            t.equal(err.message, 'confit');
            t.equal(state.count, 1);
            t.end();
        });
    });

});

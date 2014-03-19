'use strict';


exports.every = function every(tasks, callback) {
    var len, errors;

    len = tasks.length;
    errors = [];

    (function run(idx) {

        if (idx >= len) {
            callback(errors);
            return;
        }

        try {
            tasks[idx](function done(err) {
                errors.push(err === undefined ? null : err);
                run(idx + 1);
            });
        } catch (err) {
            errors.push(err);
            run(idx + 1);
        }

    }(0));

};

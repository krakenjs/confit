'use strict';


exports.each = function (tasks, callback) {
    var len = tasks.length;

    (function run(idx) {

        if (idx < len) {

            try {
                tasks[idx](function done(err) {
                    if (err) {
                        callback(err);
                        return;
                    }

                    run(idx + 1);
                });
            } catch (err) {
                callback(err);
            }
            return;

        }

        callback(null);

    }(0));

};

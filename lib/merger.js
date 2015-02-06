'use strict';
var BB = require('bluebird');
var common = require('./common');
var shush = require('shush');
var debug = require('debuglog')('confit:merger');
var handlers = require('shortstop-handlers');
var shortstop = require('shortstop');
var path = require('path');

function resolveImport(data, basedir, cb) {

    var resolve, shorty;

    resolve = handlers.path(basedir);
    shorty = shortstop.create();
    shorty.use('import', function (file, cb) {
        try {
            file = resolve(file);
            return shorty.resolve(shush(file), cb);
        } catch (err) {
            cb(err);
        }
    });
    shorty.resolve(data, cb);

}
/**
 *  Marger: Used to merge the contents of data into the store
 *  options: an object with 3 useful properties
 *      eatErr: if while loading the file, module not found ,
 *              eat the error and continue like nothing happened
 *      mergeToData: Merge the store into data.
 *                  (by default data will always get merged into store)
 *      basedir: the directory to scan for the imported configs
 **/

var Marger = function Marger(options) {
    this.basedir = options.basedir;
    this.eatErr = options.eatErr;
    this.mergeToData = options.mergeToData;
};

Marger.prototype.marge = function marge(data, store) {
    var file;
    var self = this;
    return new BB(function(resolve, reject) {
        //this is the case when it is the name of a file
        if (typeof data === 'string') {
            file = common.isAbsolute(data) ? data : path.join(self.basedir, data);
            try {
                data = shush(file);
            } catch(err) {
                if (err.code &&
                    err.code === 'MODULE_NOT_FOUND' &&
                    self.eatErr) {
                    debug('WARNING:', err.message);
                    resolve(store);
                } else {
                    reject(err);
                }
                return;
            }

            resolveImport(data, self.basedir, function(err, result) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(self.mergeToData ?
                    common.merge(store, result) : common.merge(result, store));
            });
            //the case when the data is a json object
        } else {
            resolve(self.mergeToData ?
                common.merge(store, data) : common.merge(data, store));
        }
    });
};

module.exports = Marger;
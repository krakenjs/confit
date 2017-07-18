/*───────────────────────────────────────────────────────────────────────────*\
 │  Copyright (C) 2016 PayPal                                                 │
 │                                                                            │
 │  Licensed under the Apache License, Version 2.0 (the "License");           │
 │  you may not use this file except in compliance with the License.          │
 │  You may obtain a copy of the License at                                   │
 │                                                                            │
 │    http://www.apache.org/licenses/LICENSE-2.0                              │
 │                                                                            │
 │  Unless required by applicable law or agreed to in writing, software       │
 │  distributed under the License is distributed on an "AS IS" BASIS,         │
 │  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  │
 │  See the License for the specific language governing permissions and       │
 │  limitations under the License.                                            │
 \*───────────────────────────────────────────────────────────────────────────*/
import loadJsonicSync from 'load-jsonic-sync';
import async from 'async';
import Shortstop from 'shortstop'
import { path as createPath } from 'shortstop-handlers';


export default class Handlers {

    static resolveConfig(data) {
        return new Promise((resolve, reject) => {
            let usedHandler = false;

            let shorty = Shortstop.create();
            shorty.use('config', function (key) {
                usedHandler = true;

                let keys = key.split('.');
                let result = data;

                while (result && keys.length) {
                    let prop = keys.shift();
                    if (!result.hasOwnProperty(prop)) {
                        return undefined;
                    }
                    result = result[prop];
                }

                return keys.length ? null : result;
            });

            async.doWhilst(
                function exec(cb) {
                    usedHandler = false;
                    shorty.resolve(data, function (err, result) {
                        if (err) {
                            cb(err);
                            return;
                        }
                        data = result;
                        cb();
                    });
                },

                function test() {
                    return usedHandler;
                },

                function complete(err) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(data);
                }
            );
        });
    }

    static resolveImport(data, basedir) {
        return new Promise((resolve, reject) => {
            let path = createPath(basedir);
            let shorty = Shortstop.create();

            shorty.use('import', function (file, cb) {
                //check for json extension
                file = (/\.json$/.test(file)) ? file : `${file}.json`;
                try {
                    file = path(file);
                    return shorty.resolve(loadJsonicSync(file), cb);
                } catch (err) {
                    cb(err);
                }
            });

            shorty.resolve(data, function (err, data) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(data);
            });
        });
    }

    static resolveCustom(data, protocols) {
        return new Promise(function (resolve, reject) {
            let shorty = Shortstop.create();

            for (let protocol of Object.keys(protocols)) {
                let impls = protocols[protocol];
                
                if (Array.isArray(impls)) {
                    for (let impl of impls) {
                        shorty.use(protocol, impl);
                    }
                } else {
                    shorty.use(protocol, impls);
                }
            }

            shorty.resolve(data, function (err, data) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(data);
            });
        });

    }
}

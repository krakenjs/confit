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
import Path from 'path';
import loadJsonicSync from 'load-jsonic-sync';
import debuglog from 'debuglog';
import Thing from 'core-util-is';
import Config from './config';
import Common from './common';
import Handlers from './handlers';
import Provider from './provider';


const debug = debuglog('confit');

export default class Factory {

    constructor({ basedir, protocols =  {}, defaults = 'config.json', envignore = []}) {
        this.envignore = envignore.push('env');
        this.basedir = basedir;
        this.protocols = protocols;
        this.promise = Promise.resolve({})
            .then(store => Common.merge(Provider.convenience(), store))
            .then(Factory.conditional(store => {
                let file = Path.join(this.basedir, defaults);
                return Handlers.resolveImport(loadJsonicSync(file), this.basedir)
                    .then(data => Common.merge(data, store));
            }))
            .then(Factory.conditional(store => {
                let file = Path.join(this.basedir, `${store.env.env}.json`);
                return Handlers.resolveImport(loadJsonicSync(file), this.basedir)
                    .then(data => Common.merge(loadJsonicSync(file), store));
            }))
            .then(store => Common.merge(Provider.env(envignore), store))
            .then(store => Common.merge(Provider.argv(), store));
    }

    addDefault(obj) {
        this._add(obj, (store, data) => Common.merge(store, data));
        return this;
    }

    addOverride(obj) {
        this._add(obj, (store, data) => Common.merge(data, store));
        return this;
    }

    create(cb) {
        this.promise
            .then(store => Handlers.resolveImport(store, this.basedir))
            .then(store => Handlers.resolveCustom(store, this.protocols))
            .then(store => Handlers.resolveConfig(store))
            .then(store => cb(null, new Config(store)), cb);
    }

    _add(obj, fn) {
        let data = this._resolveFile(obj);
        let handler = Handlers.resolveImport(data, this.basedir);
        this.promise = this.promise.then(store => handler.then(data => fn(store, data)));
    }

    _resolveFile(path) {
        if (Thing.isString(path)) {
            let file = Common.isAbsolute(path) ? path : Path.join(this.basedir, path);
            return loadJsonicSync(file);
        }
        return path;
    }

    static conditional(fn) {
        return function (store) {
            try {
                return fn(store);
            } catch (err) {
                if (err.cause() && err.cause().code === 'ENOENT') {
                    debug(`WARNING: ${err.message}`);
                    return store;
                }
                throw err;
            }
        }
    }

}

/*───────────────────────────────────────────────────────────────────────────*\
 │  Copyright (C) 2015 eBay Software Foundation                               │
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
import shush from 'shush'
import Path from 'path';
import Config from './config';
import Common from './common';
import Handlers from './handlers';


export default class Factory {

    constructor({ basedir, protocols =  {} }) {
        this.basedir = basedir;
        this.protocols = protocols;
        this.promise = Promise.resolve({});
    }

    addDefault(obj) {
        obj = this._resolveFile(obj);

        this.promise = this.promise.then((store) => {
            let handler = Handlers.resolveImport(obj, this.basedir);
            return handler.then((obj) => Common.merge(store, obj))
        });

        return this;
    }

    addOverride(obj) {
        obj = this._resolveFile(obj);

        this.promise = this.promise.then((store) => {
            let handler = Handlers.resolveImport(obj, this.basedir);
            return handler.then((obj) => Common.merge(obj, store))
        });

        return this;
    }

    create(cb) {
        this.promise
            .then(store => Handlers.resolveImport(store, this.basedir))
            .then(store => Handlers.resolveCustom(store, this.protocols))
            .then(store => Handlers.resolveConfig(store))
            .then(store => cb(null, new Config(store)), cb);
    }

    _resolveFile(path) {
        if (typeof path === 'string') {
            let file = Common.isAbsolute(path) ? path : Path.join(this.basedir, path);
            return shush(file);
        }
        return path;
    }

}
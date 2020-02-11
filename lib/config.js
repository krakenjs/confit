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
import Thing from 'core-util-is';
import Common from './common.js';


export default class Config {
    constructor(data) {
        this._store = data;
    }

    get(key) {
        var obj;

        if (Thing.isString(key) && key.length) {

            key = key.split(':');
            obj = this._store;

            while (obj && key.length) {
                if (obj.constructor !== Object) {
                    // Do not allow traversal into complex types,
                    // such as Buffer, Date, etc. So, this type
                    // of key will fail: 'foo:mystring:length'
                    return undefined;
                }
                obj = obj[key.shift()];
            }

            return obj;

        }

        return undefined;
    }

    set(key, value) {
        var obj, prop;

        if (Thing.isString(key) && key.length) {

            key = key.split(':');
            obj = this._store;

            while (key.length - 1) {
                prop = key.shift();

                // Create new object for property, if nonexistent
                if (!obj.hasOwnProperty(prop)) {
                    obj[prop] = {};
                }

                obj = obj[prop];
                if (obj && obj.constructor !== Object) {
                    // Do not allow traversal into complex types,
                    // such as Buffer, Date, etc. So, this type
                    // of key will fail: 'foo:mystring:length'
                    return undefined;
                }
            }

            return (obj[key.shift()] = value);
        }

        return undefined;
    }

    use(obj) {
        Common.merge(obj, this._store);
    }

    merge(config) {
        this.use(config._store);
    }
}
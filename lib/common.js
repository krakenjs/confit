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
'use strict';

const Path = require('path');

/**
 * Returns `true` if the given object is strictly an `Object` and not a `Function` (even though functions are objects in JavaScript). Otherwise, returns `false`
 * @param {unknown} val
 * @returns {boolean}
 */
const isObject = (value) => value !== null && typeof value === "object";


module.exports = {

    env: {
        development: /^dev/i,
        test       : /^test/i,
        staging    : /^stag/i,
        production : /^prod/i
    },

    isAbsolute(path) {
        if (typeof path === 'string') {
            path = Path.normalize(path);
            return path === Path.resolve(path);
        }
        return false;
    },

    merge(src, dest) {
        // NOTE: Do not merge arrays and only merge objects into objects. Do not merge special objects created from custom Classes.
        if (!Array.isArray(src) && isObject(src) && isObject(dest) && Object.getPrototypeOf(src) ===  Object.prototype) {
            for (let prop of Object.getOwnPropertyNames(src)) {
                let descriptor = Object.getOwnPropertyDescriptor(src, prop);
                descriptor.value = this.merge(descriptor.value, dest[prop]);
                Object.defineProperty(dest, prop, descriptor);
            }
            return dest;
        }

        return src;
    }

};

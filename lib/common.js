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
import Path from 'path';
import Thing from 'core-util-is';


export default {

    env: {
        development: /^dev/i,
        test       : /^test/i,
        staging    : /^stag/i,
        production : /^prod/i
    },

    isAbsolute(path) {
        if (Thing.isString(path)) {
            path = Path.normalize(path);
            return path === Path.resolve(path);
        }
        return false;
    },

    merge(src, dest) {
        // NOTE: Do not merge arrays and only merge objects into objects.
        if (!Thing.isArray(src) && Thing.isObject(src) && Thing.isObject(dest)) {
            for (let prop of Object.getOwnPropertyNames(src)) {
                let descriptor = Object.getOwnPropertyDescriptor(src, prop);
                descriptor.value = this.merge(descriptor.value, dest[prop]);
                Object.defineProperty(dest, prop, descriptor);
            }
            return dest;
        }

        return src;
    }

}

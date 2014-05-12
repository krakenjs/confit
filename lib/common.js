/*───────────────────────────────────────────────────────────────────────────*\
 │  Copyright (C) 2014 eBay Software Foundation                               │
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

var path = require('path');
var thing = require('core-util-is');


exports.env = {
    development: /^dev/i,
    test       : /^test/i,
    staging    : /^stag/i,
    production : /^prod/i
};


exports.isAbsolute = function absPath(file) {
    if (thing.isString(file)) {
        return path.resolve(file) === file;
    }
    return false;
};


exports.merge = function marge(src, dest) {
    // NOTE: Do not merge arrays and only merge objects into objects.
    if (!thing.isArray(src) && thing.isObject(src) && thing.isObject(dest)) {

        Object.getOwnPropertyNames(src).forEach(function(prop) {
            var descriptor;
            descriptor = Object.getOwnPropertyDescriptor(src, prop);
            descriptor.value = marge(descriptor.value, dest[prop]);
            Object.defineProperty(dest, prop, descriptor);
        });

        return dest;

    }

    return src;
};

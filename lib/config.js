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
import Thing from 'core-util-is';
import Common from './common.js';


export default class Config {
    constructor(data) {
        this._store = data;
    }

    get(key) {
		return Common.getPropFromColonSepString(this._store, key);
    }

    set(key, value) {
		return Common.setPropFromColonSepString(this._store, key, value);
    }

    use(obj) {
        Common.merge(obj, this._store);
    }

    merge(config) {
        this.use(config._store);
    }
}

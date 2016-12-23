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
import minimist from 'minimist';
import debuglog from 'debuglog';
import Common from './common.js';


const debug = debuglog('confit');

export default {

    argv() {
        let result = {};
        let args = minimist(process.argv.slice(2));

        for (let key of Object.keys(args)) {
            if (key === '_') {
                // Since the '_' args are standalone,
                // just set keys with null values.
                for (let prop of args._) {
                    result[prop] = null;
                }
            } else {
                result[key] = args[key];
            }
        }

        return result;
    },

    env(ignore) {
        let result = {};

        // process.env is not a normal object, so we
        // need to map values.
        for (let env of Object.keys(process.env)) {
            //env:env is decided by process.env.NODE_ENV.
            //Not allowing process.env.env to override the env:env value.
            if (ignore.indexOf(env) < 0) {
                result[env] = process.env[env];
            }
        }

        return result;
    },


    convenience() {
        var nodeEnv, env;

        nodeEnv = process.env.NODE_ENV || 'development';
        env = {};

        debug(`NODE_ENV set to ${nodeEnv}`);

        // Normalize env and set convenience values.
        for (let current of Object.keys(Common.env)) {
            let match = Common.env[current].test(nodeEnv);
            nodeEnv = match ? current : nodeEnv;
            env[current] = match;
        }

        debug(`env:env set to ${nodeEnv}`);

        // Set (or re-set) env:{nodeEnv} value in case
        // NODE_ENV was not one of our predetermined env
        // keys (so `config.get('env:blah')` will be true).
        env[nodeEnv] = true;
        env.env = nodeEnv;
        return { env };
    }
}

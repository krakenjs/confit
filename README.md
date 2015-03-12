confit
======

Lead Maintainer: [Poornima Venkat](https://github.com/pvenkatakrishnan/)  

[![Build Status](https://travis-ci.org/krakenjs/confit.svg?branch=2.x)](https://travis-ci.org/krakenjs/confit)  

Simple, environment-based configuration. `confit` loads a default JSON
configuration file, additionally loading environment-specific files, if applicable.
It will also process the loaded files using any configured
[shortstop](https://github.com/paypal/shortstop) protocol handlers—see **Options** below.

`confit` adds support for adding JavaScript-style comments in your json files as each file is processed by [shush](https://github.com/totherik/shush) before being merged into your config.


## Usage
```javascript
var confit = require('confit');
```

### confit([options])
* `options` (*String* | *Object*) - the base directory in which config files live or a configuration object. If no
arguments is provided, defaults to the directory of the calling file. Signature `function (err, config) {}`
* returns - config factory.

```javascript
'use strict';

var path = require('path');
var confit = require('confit');

var basedir = path.join(__dirname, 'config');
confit(basedir).create(function (err, config) {
    config.get; // Function
    config.set; // Function
    config.use; // Function

    config.get('env:env'); // 'development'
});
```

### config factory
* `addOverride(filepath)` (or) `addOverride(obj)` - Use this to add file (.json or .js), to merge with the config datastore and override the overlapping data if any. Alternatively, you can also pass a json object to override.
* `addDefault(filepath)` (or) `addDefault(obj)` - Use this to add default file (.json or .js), to merge with the config datastore and serve as the default datastore. Alternatively, you can also pass a json object for defaults.
* `create(callback)` - Creates the config object, ready for use. Callback signature: `function (err, config) {}`

```javascript
// All methods besides `create` are chainable
confit(options)
    .addDefault('./mydefaults.json')  //or .addDefault({foo: 'bar'})
    .addOverride('./mysettings.json') //or .addOverride({foo: 'baz'})
    .create(function (err, config) {
        // ...
    });

// - or -
//
// var factory = confit(options);
// factory.addOverride('./mysettings.json');
// factory.create(function (err, config) {
//     // ...
// });
```

## Options
* `basedir` (*String*) - the base directory in which config files can be found.
* `protocols` (*Object*) - An object containing a mapping of
[shortstop](https://github.com/paypal/shortstop) protocols to handler implementations.
This protocols will be used to process the config data prior to registration.
* `defaults` (*String*) - the name of the file containing all default values.
Defaults to `config.json`.

```javascript
'use strict';

var path = require('path');
var confit = require('confit');
var handlers = require('shortstop-handlers');


var options = {
    basedir: path.join(__dirname, 'config');
    protocols: {
        file: handlers.file,
        glob: handlers.glob
    }
};

confit(options).create(function (err, config) {
    // ...
});
```


## Config API
* `get(key)` - Retrieve the value for a given key. Colon-delimited keys can be used to traverse the object hierarchy.
* `set(key, value)` - Set a value for the given key. Colon-delimited keys can be used to traverse the object hierarchy.
* `use(obj)` - merge provided object into config.

```javascript
config.set('foo', 'bar');
config.get('foo'); // 'bar'

config.use({ foo: 'baz' });
config.get('foo'); // 'baz'

config.use({ a: { b: { c: 'd' } } } );
config.get('a:b:c'); // 'd'
```

## Default Behavior
By default, `confit` loads `process.env` and `argv` values upon initialization.
Additionally, it creates convenience environment properties prefixed with
`env:` based on the current `NODE_ENV` setting, defaulting to `development`. It
also normalizes `NODE_ENV` settings so values starting with `prod` become
`production`, starting with `stag` become `staging`, starting with `test`
become `test` and starting with `dev` become `development`.

```javascript
// NODE_ENV='dev'
config.get('NODE_ENV');        // 'dev'
config.get('env:env');         // 'development'
config.get('env:development'); // true
config.get('env:test');        // false
config.get('env:staging');     // false
config.get('env:production');  // false
```

```javascript
// NODE_ENV='custom'
config.get('NODE_ENV');        // 'custom'
config.get('env:env');         // 'custom'
config.get('env:development'); // false
config.get('env:test');        // false
config.get('env:staging');     // false
config.get('env:production');  // false
config.get('env:custom');      // true
```
#### Precedence

Precedence takes the following form (lower numbers overwrite higher numbers):

1. command line arguments
2. env variables
3. environment-specific config (e.g., `development.json`)
4. main config (`config.json`)
5. `env` normalization (`env`, `env:development`, etc)

#### Shortstop Handlers

Confit by default comes with 2 shortstop handlers enabled.

* `import:`
Merges the contents of the specified file into configuration under a given key.
```json
{
    "foo": "import:./myjsonfile"
}
```

* `config:`
Replaces with the value at a given key. Note that the keys in this case are dot (.) delimited.
```json
{
    "foo": {
        "bar": true
    },
    "foobar": "config:foo.bar"
}
```

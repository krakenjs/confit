# confit

Simple, environment-based configuration. `confit` loads a default JSON
configuration file, additionally loading environment-specific files, if applicable.
It will also process the loaded files using any configured
[shortstop](https://github.com/paypal/shortstop) protocol handlers.
(See **Options** below.)

[![Build Status](https://travis-ci.org/krakenjs/confit.png)](https://travis-ci.org/krakenjs/confit)

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
* `addOverride(filepath)` - Use this to add file (JSON or JS), to merge with the config datastore and override the overlapping data if any.
* `addDefault(filepath)` - Use this to add default file (JSON or JS), to merge with the config datastore and serve as the default datastore.
* `create(callback)` - Creates the config object, ready for use. Callback signature: `function (err, config) {}`

```javascript
// All methods besides `create` are chainable
confit(options)
    .addDefault('./mydefaults.json')
    .addOverride('./mysettings.json')
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
By default, `confit` loads `process.env` and `argv` values upon initialization. Additionally,
it creates convenience environment properties prefixed with `env:` based on the
current `NODE_ENV` setting, defaulting to `development`. It also normalizes
`NODE_ENV` settings to the long form, so `dev` becomes `development`, `prod`
becomes `production`, etc.
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

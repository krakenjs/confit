'use strict';

var path = require('path');
var confit = require('./')


confit(path.join(__dirname, 'test', 'fixtures', 'defaults'))
    .addOverride('supplemental.json')
    .create(function (err, config) {
        config.set('env:bar', new Buffer('foorbar'));
        console.log(config.get('env:bar'));
        console.log(config.set('env:bar:length', 10));
        console.log(config.get('override'));
        console.log(config.get('misc'));
        console.log(config.get('env:bar'));
    });

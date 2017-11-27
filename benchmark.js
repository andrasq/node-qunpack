'use strict';

var qtimeit = require('qtimeit');
var qunpack = require('./');

var bytes = new Buffer([84,90,105,102, 0, 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15, 1,2,3,4, 1,2,3,5, 1,2,3,6, 1,2,3,7, 1,2,3,8, 1,2,3,9 ]);
var x;

var jsonObj = JSON.stringify({magic:'TZif',version:0,_pad:'...............',h6:[12345670,12345671,12345672,12345673,12345674,12345675,12345676]});
var jsonArray = JSON.stringify(['TZif',0,'...............',[12345670,12345671,12345672,12345673,12345674,12345675,12345676]]);
var jsonArray = JSON.stringify(['TZif',0,'...............', 12345670,12345671,12345672,12345673,12345674,12345675,12345676 ]);

qtimeit.bench.timeGoal = 0.50;
qtimeit.bench.visualize = true;
qtimeit.bench({
    // unpack a zoneinfo file header
    'qunpack': function() { x = qunpack.unpack('A4Cx15L6', bytes); },
    'qunpack 2': function() { x = qunpack.unpack('A4Cx15L6', bytes); },
    // 1.3 m/s node-v6.11.4, 880 k/s v8.9.1

    'json obj': function() { x = JSON.parse(jsonObj) },
    'json obj 2': function() { x = JSON.parse(jsonObj) },
    // 1.2 m/s

    'json arr': function() { x = JSON.parse(jsonArray) },
    'json arr 2': function() { x = JSON.parse(jsonArray) },
    // 1.8 m/s w subarray, 2.15 flat
});

//console.log(x);

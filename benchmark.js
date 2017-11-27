'use strict';

var qtimeit = require('qtimeit');
var qunpack = require('./');

var bytes = new Buffer([84,90,105,102, 0, 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15, 1,2,3,4, 1,2,3,5, 1,2,3,6, 1,2,3,7, 1,2,3,8, 1,2,3,9 ]);
var jsonObj = JSON.stringify({magic:'TZif',version:0,_pad:'...............',h6:[12345670,12345671,12345672,12345673,12345674,12345675,12345676]});
var jsonArray = JSON.stringify(['TZif',0,'...............',[12345670,12345671,12345672,12345673,12345674,12345675,12345676]]);
var jsonArray = JSON.stringify(['TZif',0,'...............', 12345670,12345671,12345672,12345673,12345674,12345675,12345676 ]);

// note: including this tracer here sharply drops the benchmarked throughput !?
// console.log("AR: unpack obj", qunpack.unpack('{ magic:A4, version:C, _pad:x15, headers:[L6] }', bytes));

var x;
qtimeit.bench.timeGoal = 0.50;
qtimeit.bench.visualize = true;
qtimeit.bench({
    // unpack a zoneinfo file header
    'qunpack': function() { x = qunpack.unpack('A4Cx15L6', bytes); },
    'qunpack 2': function() { x = qunpack.unpack('A4Cx15L6', bytes); },
    // 2.2 m/s node-v6.11.4, 1.65 m/s k/s v8.9.1 (old 33% faster)

    'qunpack []': function() { x = qunpack.unpack('A4Cx15[L6]', bytes); },
    'qunpack [] 2': function() { x = qunpack.unpack('A4Cx15[L6]', bytes); },
    // 1.2 m/s 6.11.1, 1.0 m/s 8.9.1

    'qunpack {}': function() { x = qunpack.unpack('{ magic:A4, version:C, _pad:x15, headers:[L6] }', bytes); },
    'qunpack {} 2': function() { x = qunpack.unpack('{ magic:A4, version:C, _pad:x15, headers:[L6] }', bytes); },
    // 490 k/s 6.11.1, 350 k/s 8.9.1 (old 40% faster)

    'json obj': function() { x = JSON.parse(jsonObj) },
    'json obj 2': function() { x = JSON.parse(jsonObj) },
    // 1.2 m/s 6.11.1, 1.2 m/s 8.9.1

    'json arr': function() { x = JSON.parse(jsonArray) },
    'json arr 2': function() { x = JSON.parse(jsonArray) },
    // 2.15 m/s flat array, 1.8 m/s w subarray (both 6.11.1 and 8.9.1)
});

//console.log(x);

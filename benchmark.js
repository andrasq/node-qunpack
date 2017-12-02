// npm install msgpack@1.0.2 msgpackjs@0.9.0 qunpack@0.5.0

'use strict';

var qtimeit = require('qtimeit');
var qunpack = require('./');
var msgpack = require('msgpack');
var msgpackjs = require('msgpackjs');

// the America/Jamaica timezone header
var tzJamaica = new Buffer([
0x54, 0x5a, 0x69, 0x66, // 'TZif'
0x32,                   // '2'
0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
0x00, 0x00, 0x00, 0x03,
0x00, 0x00, 0x00, 0x03,
0x00, 0x00, 0x00, 0x02,
0x00, 0x00, 0x00, 0x15,
0x00, 0x00, 0x00, 0x03,
0x00, 0x00, 0x00, 0x0c,
]);

//var bytes = new Buffer([84,90,105,102, 0, 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15, 1,2,3,4, 1,2,3,5, 1,2,3,6, 1,2,3,7, 1,2,3,8, 1,2,3,9 ]);
var bytes = tzJamaica;
var jsonObj = JSON.stringify({magic:'TZif',version:0,_pad:'...............',h6:[12345670,12345671,12345672,12345673,12345674,12345675,12345676]});
var jsonArray = JSON.stringify(['TZif',0,'...............',[12345670,12345671,12345672,12345673,12345674,12345675,12345676]]);
var jsonArray = JSON.stringify(['TZif',0,'...............', 12345670,12345671,12345672,12345673,12345674,12345675,12345676 ]);

// tweak the msgpack payload to extract the same size ints
var mpack = msgpack.pack(['TZif', 0x32, '\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0', 0x10000003, 0x10000003, 0x10000002, 0x10000015, 0x10000003, 0x1000000c]);

// note: including this tracer here sharply drops the benchmarked throughput !? (30%, 1.7 -> 1.3 m/s v9)
// ... ?messes with the optimizer, which de-optimizes if more than one codepath is used?
// to fix, split format walking from field extraction, walk list vs subarray vs hash separately
// console.log("AR: unpack obj", qunpack.unpack('{ magic:A4, version:C, _pad:x15, headers:[L6] }', bytes));

var x, y;
qtimeit.bench.timeGoal = 0.50;
qtimeit.bench.visualize = true;
qtimeit.bench({
    // unpack a zoneinfo file header
    'qunpack': function() { x = qunpack.unpack('A4Cx15L6', bytes); },
    'qunpack 2': function() { x = qunpack.unpack('A4Cx15L6', bytes); },
    // 2.2 m/s node-v6.11.4, 1.65 m/s v8.9.1 (old 33% faster)
    // 2.0 m/s with s< little-e support, 1.7 m/s node-v8,v9

    'qunpack []': function() { x = qunpack.unpack('A4Cx15[L6]', bytes); },
    'qunpack [] 2': function() { x = qunpack.unpack('A4Cx15[L6]', bytes); },
    // 1.2 m/s 6.11.1, 1.0 m/s 8.9.1

    'qunpack {}': function() { x = qunpack.unpack('{ magic:A4, version:C, _pad:x15, headers:[L6] }', bytes); },
    'qunpack {} 2': function() { x = qunpack.unpack('{ magic:A4, version:C, _pad:x15, headers:[L6] }', bytes); },
    // 490 k/s 6.11.1, 350 k/s 8.9.1 (old 40% faster)
    // 440 k/s w little-e int support, 345 k/s v9

    'json obj': function() { x = JSON.parse(jsonObj) },
    'json obj 2': function() { x = JSON.parse(jsonObj) },
    // 1.2 m/s 6.11.1, 1.2 m/s 8.9.1

    'json arr': function() { x = JSON.parse(jsonArray) },
    'json arr 2': function() { x = JSON.parse(jsonArray) },
    // 2.15 m/s flat array, 1.8 m/s w subarray (both 6.11.1 and 8.9.1)

    'msgpack': function() { x = msgpack.unpack(mpack) },
    // 600 k/s, 630 k/s v9

    'msgpackjs': function() { x = msgpackjs.unpack(mpack) },
    // 2.8 m/s node-v6, 4.4 m/s node-v8,v9
});

//console.log(x);

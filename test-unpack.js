/**
 * test for unpack()
 *
 * Copyright (C) 2017 Andras Radics
 * Licensed under the Apache License, Version 2.0
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

'use strict';

var qunpack = require('./');
var unpack = qunpack.unpack;
var pack = qunpack.pack;

module.exports = {
    'unpack': {
        'numbers': {
            'should unpack unsigned 8-bit char': function(t) {
                var buf = new Buffer([128, 0, 1, 255]);
                t.equal(unpack('C', buf, 0), 128);
                t.equal(unpack('C', buf, 1), 0);
                t.equal(unpack('C', buf, 2), 1);
                t.equal(unpack('C', buf, 3), 255);

                t.done();
            },

            'should unpack signed 8-bit char': function(t) {
                var buf = new Buffer([128, 0, 1, 255]);
                t.equal(unpack('c', buf, 0), -128);
                t.equal(unpack('c', buf, 1), 0);
                t.equal(unpack('c', buf, 2), 1);
                t.equal(unpack('c', buf, 3), -1);

                t.done();
            },

            'should unpack unsigned 16-bit short': function(t) {
                var buf = new Buffer([128, 0, 0, 128]);
                t.equal(unpack('S', buf, 0), 0x8000);
                t.equal(unpack('S', buf, 1), 0);
                t.equal(unpack('S', buf, 2), 128);
                t.ok(isNaN(unpack('S', buf, 3)));

                var buf = new Buffer([1,2]);
                t.equal(unpack('n', buf, 0), 0x0102);

                var buf = new Buffer([255,255,1,2]);
                t.equal(unpack('S', buf, 0), 0xffff);
                t.equal(unpack('S', buf, 1), 0xff01);
                t.equal(unpack('S', buf, 2), 0x0102);
                t.ok(isNaN(unpack('S', buf, 3)));

                t.done();
            },

            'should unpack signed 16-bit short': function(t) {
                var buf = new Buffer([128, 0, 0, 128]);
                t.equal(unpack('s', buf, 0), -0x8000);
                t.equal(unpack('s', buf, 1), 0);
                t.equal(unpack('s', buf, 2), 128);
                t.ok(isNaN(unpack('s', buf, 3)));

                var buf = new Buffer([255,255,1,2]);
                t.equal(unpack('s', buf, 0), -1);
                t.equal(unpack('s', buf, 1), -256 + 1);
                t.equal(unpack('s', buf, 2), 0x0102);

                t.done();
            },

            'should unpack unsigned 32-bit long': function(t) {
                var buf = new Buffer([128, 0, 0, 0, 0, 128]);
                t.equal(unpack('L', buf, 0), 0x80000000);
                t.equal(unpack('L', buf, 1), 0);
                t.equal(unpack('L', buf, 2), 128);
                t.ok(isNaN(unpack('L', buf, 3)));

                var buf = new Buffer([1,2,3,4]);
                t.equal(unpack('N', buf, 0), 0x01020304);

                var buf = new Buffer([255,255,255,255,1,2,3,4]);
                t.equal(unpack('L', buf, 0), 0xffffffff);
                t.equal(unpack('L', buf, 1), 0xffffff01);
                t.equal(unpack('L', buf, 2), 0xffff0102);
                t.equal(unpack('L', buf, 3), 0xff010203);
                t.equal(unpack('L', buf, 4), 0x01020304);
                t.ok(isNaN(unpack('L', buf, 5)));

                t.done();
            },

            'should unpack signed 32-bit long': function(t) {
                var buf = new Buffer([128, 0, 0, 0, 0, 128]);
                t.equal(unpack('l', buf, 0), -0x80000000);
                t.equal(unpack('l', buf, 1), 0);
                t.equal(unpack('l', buf, 2), 128);
                t.ok(isNaN(unpack('l', buf, 3)));

                var buf = new Buffer([255,255,255,255,1,2,3,4]);
                t.equal(unpack('l', buf, 0), -1);
                t.equal(unpack('l', buf, 1), -256 + 1);
                t.equal(unpack('l', buf, 2), -256*256 + 0x0102);
                t.equal(unpack('l', buf, 3), -256*256*256 + 0x010203);
                t.equal(unpack('l', buf, 4), 0x01020304);
                t.ok(isNaN(unpack('L', buf, 5)));

                t.done();
            },

            'should unpack unsigned 64-bit quad': function(t) {
                var buf = new Buffer([128, 0, 0, 0, 0, 0, 0, 0, 0, 128]);
                t.equal(unpack('Q', buf, 0), 0x8000000000000000);
                t.equal(unpack('Q', buf, 1), 0);
                t.equal(unpack('Q', buf, 2), 128);
                t.ok(isNaN(unpack('Q', buf, 3)));

                var buf = new Buffer([1,2,3,4,5,6,7,8]);
                t.equal(unpack('J', buf, 0), 0x0102030405060708);

                var buf = new Buffer([255,255,255,255,255,255,255,255,1,2,3,4,5,6,7,8]);
                t.equal(unpack('Q', buf, 0), 0xffffffffffffffff);
                t.equal(unpack('Q', buf, 1), 0xffffffffffffff01);
                t.equal(unpack('Q', buf, 6), 0xffff010203040506);
                t.equal(unpack('Q', buf, 8), 0x0102030405060708);

                t.done();
            },

            'should unpack signed 64-bit quad': function(t) {
                var buf = new Buffer([128, 0, 0, 0, 0, 0, 0, 0, 0, 128]);
                t.equal(unpack('q', buf, 0), -0x8000000000000000);
                t.equal(unpack('q', buf, 1), 0);
                t.equal(unpack('q', buf, 2), 128);
                t.ok(isNaN(unpack('Q', buf, 3)));

                var buf = new Buffer([255,255,255,255,255,255,255,255,1,2,3,4,5,6,7,8]);
                t.equal(unpack('q', buf, 0), -1);
                t.equal(unpack('q', buf, 1), -256 + 1);
                t.equal(unpack('q', buf, 6), -0x1000000000000 + 0x010203040506);
                t.equal(unpack('q', buf, 8), 0x0102030405060708);

                t.done();
            },

            'should unpack 4-byte float': function(t) {
                var buf = new Buffer(8);

                buf.writeFloatBE(1234.5, 0);
                t.equal(unpack('G', buf, 0), 1234.5);
                buf.writeFloatBE(1234.5, 2);
                t.equal(unpack('G', buf, 2), 1234.5);

                t.equal(unpack('f', buf, 2), 1234.5);

                var _2e40 = (1<<10)*(1<<10)*(1<<10)*(1<<10);
                var tests = [
                    0, -0, 1, -1, 1234.5, -1234.5, _2e40, 1/_2e40, -1*_2e40, -1/_2e40, Infinity, -Infinity, NaN,
                ];
                for (var i=0; i<tests.length; i++) {
                    buf.writeFloatBE(tests[i], 0);
                    var val = unpack('G', buf, 0);
                    isNaN(tests[i]) ? t.ok(isNaN(val)) : t.equal(val, tests[i]);
                }

                t.done();
            },

            'should unpack 8-byte double': function(t) {
                // TODO: needs more tests...
                var buf = new Buffer(16);

                buf.writeDoubleBE(1234.5, 0);
                t.equal(unpack('E', buf, 0), 1234.5);
                buf.writeDoubleBE(1234.5, 2);
                t.equal(unpack('E', buf, 2), 1234.5);

                t.equal(unpack('d', buf, 2), 1234.5);

                var tests = [
                    0, -0, 1, -1, 1234.5, -1234.5, 1e10, 1e-10, -1e10, -1e-10, 1e200, 1e-200, Infinity, -Infinity, NaN,
                ];
                for (var i=0; i<tests.length; i++) {
                    buf.writeDoubleBE(tests[i], 0);
                    var val = unpack('E', buf, 0);
                    isNaN(tests[i]) ? t.ok(isNaN(val)) : t.equal(val, tests[i]);
                }

                t.done();
            },
        },

        'strings': {
            'should unpack unpadded fixed-length string': function(t) {
                var buf = new Buffer("abcdefgh");
                t.equal(unpack('a0', buf, 0), '');
                t.equal(unpack('a', buf, 0), 'a');
                t.equal(unpack('a1', buf, 0), 'a');
                t.equal(unpack('a', buf, 1), 'b');
                t.equal(unpack('a1', buf, 1), 'b');
                t.equal(unpack('a2', buf, 0), 'ab');
                t.equal(unpack('a2', buf, 1), 'bc');
                t.equal(unpack('a2', buf, 3), 'de');

                var buf = new Buffer("ab\0\0");
                t.equal(unpack('a4', buf, 0), 'ab\0\0');
                t.equal(unpack('a4', buf, 1), 'b\0\0');

                t.done();
            },

            'should unpack SPACE-padded string': function(t) {
                var buf = new Buffer("abcd    ");
                t.equal(unpack('A', buf, 0), 'a');
                t.equal(unpack('A2', buf, 2), 'cd');
                t.equal(unpack('A3', buf, 2), 'cd');
                t.equal(unpack('A4', buf, 2), 'cd');
                t.equal(unpack('A40', buf, 2), 'cd');

                t.done();
            },

            'should unpack NUL-padded string': function(t) {
                var buf = new Buffer("abcd\0\0\0\0");
                t.equal(unpack('Z', buf, 0), 'a');
                t.equal(unpack('Z2', buf, 2), 'cd');
                t.equal(unpack('Z3', buf, 2), 'cd');
                t.equal(unpack('Z4', buf, 2), 'cd');
                t.equal(unpack('Z40', buf, 2), 'cd');

                t.done();
            },

            'should unpack H hex string': function(t) {
                var buf = new Buffer([0x12, 0x34, 0x56, 0x78]);
                t.equal(unpack('H', buf, 0), '12');
                t.equal(unpack('H2', buf, 0), '1234');
                t.equal(unpack('H2', buf, 1), '3456');
                t.equal(unpack('H2', buf, 3), '78');

                t.done();
            }
        },

        'seek': {
            'should seek forward': function(t) {
                var buf = new Buffer([1,2,3,4,5,6]);
                t.deepEqual(unpack('SS', buf, 0), [0x0102, 0x0304]);
                t.deepEqual(unpack('SxS', buf, 0), [0x0102, 0x0405]);
                t.deepEqual(unpack('Sx2S', buf, 0), [0x0102, 0x0506]);
                t.done();
            },

            'should seek backward': function(t) {
                var buf = new Buffer([1,2,3,4,5,6]);
                t.deepEqual(unpack('SS', buf, 0), [0x0102, 0x0304]);
                t.deepEqual(unpack('SXS', buf, 0), [0x0102, 0x0203]);
                t.deepEqual(unpack('SSX3S', buf, 0), [0x0102, 0x0304, 0x0203]);
                t.done();
            },

            'should seek to absolute position': function(t) {
                var buf = new Buffer([1,2,3,4]);
                t.deepEqual(unpack('SS@1S@2S', buf, 0), [0x0102, 0x0304, 0x0203, 0x0304]);
                t.done();
            },
        },
    },

    'pack': {
        'should throw unless implemented': function(t) {
            try {
                pack('a3', "abc");
            } catch (err) {
                t.contains(err.message, 'not implemented');
                t.done();
            }
        },
    },
};

module.oldexports = {
    'unpack': {
        'should unpack unsigned values': function(t) {
            t.equal(unpack([1,2,123], 0, 'C'), 1);
            t.equal(unpack([1,2,123], 1, 'C'), 2);
            t.equal(unpack([1,2,123], 2, 'C'), 123);
            t.equal(unpack([254], 0, 'C'), 254);
            t.equal(unpack([254], 0, 'C'), 254);
            t.deepEqual(unpack([1,2,3], 0, 'C', 3), [1,2,3]);
            t.deepEqual(unpack([1,2,3], 1, 'C', 2), [2,3]);
            t.deepEqual(unpack([1,2,3], 2, 'C', 1), [3]);
            t.deepEqual(unpack([1,2,3], 3, 'C', 0), []);

            t.equal(unpack([1, 2, 3, 4], 0, 'H'), 0x0102);
            t.equal(unpack([1, 2, 3, 4], 1, 'H'), 0x0203);
            t.equal(unpack([1, 2, 3, 4], 2, 'H'), 0x0304);
            t.deepEqual(unpack([0, 1, 2, 3, 4], 1, 'H', 0), []);
            t.deepEqual(unpack([0, 1, 2, 3, 4], 1, 'H', 1), [0x0102]);
            t.deepEqual(unpack([0, 1, 2, 3, 4], 1, 'H', 2), [0x0102, 0x0304]);

            t.equal(unpack([3,1,2,3,4], 1, 'L'), 16909060);
            t.equal(unpack([3,4,255,2,3,4], 2, 'L'), 4278321924);
            t.deepEqual(unpack([0, 1, 2, 3, 4, 5, 6, 7, 8], 1, 'L', 1), [0x01020304]);
            t.deepEqual(unpack([0, 1, 2, 3, 4, 5, 6, 7, 8], 1, 'L', 2), [0x01020304, 0x05060708]);

            t.equal(unpack([0,0,0,0,1,2,3,4], 0, 'Q'), 0x01020304);
            t.equal(unpack([0,0,0,1,2,3,4,0], 0, 'Q'), 0x0102030400);
            t.equal(unpack([0,0,1,2,3,4,0,0], 0, 'Q'), 0x010203040000);
            t.equal(unpack([0,0,0,0,0,0,1,2,3,4], 2, 'Q'), 0x01020304);
            t.equal(unpack([0,0,0,0,0,0,1,2,3,4], 1, 'Q'), 0x010203);
            t.equal(unpack([0,0,0,0,0,0,1,2,3,4], 0, 'Q'), 0x0102);
            t.done();
        },

        'should unpack signed values': function(t) {
            t.equal(unpack([192], 0, 'c'), -64);
            t.equal(unpack([255,192], 0, 'h'), -64);
            t.equal(unpack([255,255,255,192], 0, 'l'), -64);
            t.equal(unpack([255,255,255,255,255,255,255,192], 0, 'q'), -64);
            t.done();
        },

        'should unpack fixed-length strings': function(t) {
            t.equal(unpack(new Buffer("1234"), 0, 'A4'), '1234');
            t.equal(unpack(new Buffer("1234"), 2, 'A1'), '3');
            t.deepEqual(unpack(new Buffer("1234"), 2, 'A2', 1), ['34']);
            t.deepEqual(unpack(new Buffer("00012345678"), 3, 'A', 3), '123');
            t.deepEqual(unpack(new Buffer("00012345678"), 4, 'A', 5), '23456');
            t.deepEqual(unpack(new Buffer("00012345678"), 3, 'A3', 2), ['123', '456']);
            t.deepEqual(unpack(new Buffer("00012345678"), 3, 'A5', 1), ['12345']);
            t.deepEqual(unpack(new Buffer("00012345678"), 3, 'A5'), '12345');
            t.done();
        },

        'should unpack compound values': function(t) {
            t.deepEqual(unpack([1,2,3,4], 0, {'a': 'C', 'b': 'C'}), { a: 1, b: 2 });
            t.deepEqual(unpack([1,2,3,4], 1, {'a': 'C', 'b': 'C'}), { a: 2, b: 3 });
            t.deepEqual(unpack([1,2,3,4], 2, {'a': 'C', 'b': 'C'}), { a: 3, b: 4 });
            t.deepEqual(unpack([1,2,3,4], 1, {'a': 'C', 'b': { c: 'C', d: 'C'}}), { a: 2, b: {c: 3, d: 4} });
            t.done();
        },

        'should unpack NaN on bounds overrun': function(t) {
            t.ok(isNaN(unpack([1], 0, 'h')));
            t.done();
        },
    },
}

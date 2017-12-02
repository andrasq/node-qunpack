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
        'should return an array': function(t) {
            t.deepEqual(unpack('S', [1,2], 0), [0x0102]);
            t.done();
        },

        'should unpack 0 items': function(t) {
            t.deepEqual(unpack('S0', [1,2], 0), []);
            t.done();
        },

        'should unpack 2 items': function(t) {
            t.deepEqual(unpack('C2', [1,2], 0), [0x01, 0x02]);
            t.done();
        },

        'offset should be optional': function(t) {
            t.deepEqual(unpack('C', [1,2]), [0x01]);
            t.done();
        },

        'unsigned integers': {
            'C: unsigned 8-bit char': function(t) {
                var buf = new Buffer([128, 0, 1, 255]);
                t.equal(unpack('C', buf, 0), 128);
                t.equal(unpack('C', buf, 1), 0);
                t.equal(unpack('C', buf, 2), 1);
                t.equal(unpack('C', buf, 3), 255);
                t.deepEqual(unpack('C2', buf, 0), [128, 0]);
                t.deepEqual(unpack('C<2', buf, 0), [128, 0]);

                t.done();
            },

            'n,S: unsigned 16-bit short': function(t) {
                var buf = new Buffer([128, 0, 0, 128]);
                t.equal(unpack('S', buf, 0), 0x8000);
                t.equal(unpack('S', buf, 1), 0);
                t.equal(unpack('S', buf, 2), 128);
                t.ok(isNaN(unpack('S', buf, 3)));
                t.deepEqual(unpack('S2', buf, 0), [0x8000, 0x0080]);

                var buf = new Buffer([1,2]);
                t.equal(unpack('n', buf, 0), 0x0102);

                var buf = new Buffer([255,255,1,2]);
                t.equal(unpack('S', buf, 0), 0xffff);
                t.equal(unpack('S', buf, 1), 0xff01);
                t.equal(unpack('S', buf, 2), 0x0102);
                t.ok(isNaN(unpack('S', buf, 3)));

                t.done();
            },

            'v: unsigned 16-bit little-e short': function(t) {
                var buf = new Buffer([128, 0, 0, 128]);
                t.equal(unpack('v', buf, 0), 128);
                t.equal(unpack('v', buf, 1), 0);
                t.equal(unpack('v', buf, 2), 0x8000);
                t.ok(isNaN(unpack('v', buf, 3)));
                t.deepEqual(unpack('v2', buf, 0), [0x0080, 0x8000]);

                t.done();
            },

            'N,L: unsigned 32-bit long': function(t) {
                var buf = new Buffer([128, 0, 0, 0, 0, 128, 0, 0]);
                t.equal(unpack('L', buf, 0), 0x80000000);
                t.equal(unpack('L', buf, 1), 0);
                t.equal(unpack('L', buf, 2), 128);
                t.ok(isNaN(unpack('L', buf, 5)));
                t.deepEqual(unpack('L2', buf, 0), [0x80000000, 0x00800000]);

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

            'J,Q: unsigned 64-bit quad': function(t) {
                var buf = new Buffer([128, 0, 0, 0, 0, 0, 0, 0, 0, 128, 1, 2, 3, 4, 0, 0]);
                t.equal(unpack('Q', buf, 0), 0x8000000000000000);
                t.equal(unpack('Q', buf, 1), 0);
                t.equal(unpack('Q', buf, 2), 128);
                t.ok(isNaN(unpack('Q', buf, 10)));
                t.deepEqual(unpack('Q2', buf, 0), [0x8000000000000000, 0x0080010203040000]);

                var buf = new Buffer([1,2,3,4,5,6,7,8]);
                t.equal(unpack('J', buf, 0), 0x0102030405060708);

                var buf = new Buffer([255,255,255,255,255,255,255,255,1,2,3,4,5,6,7,8]);
                t.equal(unpack('Q', buf, 0), 0xffffffffffffffff);
                t.equal(unpack('Q', buf, 1), 0xffffffffffffff01);
                t.equal(unpack('Q', buf, 6), 0xffff010203040506);
                t.equal(unpack('Q', buf, 8), 0x0102030405060708);

                t.done();
            },

            'P: unsigned 64-bit little-e quad': function(t) {
                var buf = new Buffer([128, 0, 0, 0, 0, 0, 0, 0, 0, 128, 1, 2, 3, 4, 0, 0]);
                t.equal(unpack('P', buf, 0), 128);
                t.equal(unpack('P', buf, 1), 0);
                t.equal(unpack('P', buf, 2), 0x8000000000000000);
                t.ok(isNaN(unpack('P', buf, 10)));
                t.deepEqual(unpack('P2', buf, 0), [128, 0x0000040302018000]);

                t.done();
            },
        },

        'signed integers': {
            'c: signed 8-bit char': function(t) {
                var buf = new Buffer([128, 0, 1, 255]);
                t.equal(unpack('c', buf, 0), -128);
                t.equal(unpack('c', buf, 1), 0);
                t.equal(unpack('c', buf, 2), 1);
                t.equal(unpack('c', buf, 3), -1);
                t.deepEqual(unpack('c2', buf, 0), [-128, 0]);
                t.deepEqual(unpack('c<2', buf, 0), [-128, 0]);

                t.done();
            },

            's: signed 16-bit short': function(t) {
                var buf = new Buffer([128, 0, 0, 128]);
                t.equal(unpack('s', buf, 0), -0x8000);
                t.equal(unpack('s', buf, 1), 0);
                t.equal(unpack('s', buf, 2), 128);
                t.ok(isNaN(unpack('s', buf, 3)));
                t.ok(isNaN(unpack('s<', buf, 3)));
                t.deepEqual(unpack('s2', buf, 0), [-0x8000, 128]);
                t.deepEqual(unpack('s<2', buf, 0), [128, -0x8000]);

                var buf = new Buffer([255,255,1,2]);
                t.equal(unpack('s', buf, 0), -1);
                t.equal(unpack('s<', buf, 0), -1);
                t.equal(unpack('s', buf, 1), -256 + 1);
                t.equal(unpack('s<', buf, 1), 256 + 255);
                t.equal(unpack('s', buf, 2), 0x0102);
                t.equal(unpack('s<', buf, 2), 0x0201);

                t.done();
            },

            'l: signed 32-bit long': function(t) {
                var buf = new Buffer([128, 0, 0, 0, 0, 128, 0, 0]);
                t.equal(unpack('l', buf, 0), -0x80000000);
                t.equal(unpack('l', buf, 1), 0);
                t.equal(unpack('l<', buf, 1), 0);
                t.equal(unpack('l', buf, 2), 128);
                t.equal(unpack('l<', buf, 2), -0x80000000);
                t.ok(isNaN(unpack('l', buf, 5)));
                t.ok(isNaN(unpack('l<', buf, 5)));
                t.deepEqual(unpack('l2', buf, 0), [-0x80000000, 0x00800000]);
                t.deepEqual(unpack('l<2', buf, 0), [128, 128 * 256]);

                var buf = new Buffer([255,255,255,255,1,2,3,4,128]);
                t.equal(unpack('l', buf, 0), -1);
                t.equal(unpack('l<', buf, 0), -1);
                t.equal(unpack('l', buf, 1), -256 + 1);
                t.equal(unpack('l<', buf, 1), 0x01ffffff);
                t.equal(unpack('l', buf, 2), -256*256 + 0x0102);
                t.equal(unpack('l<', buf, 2), 0x0201ffff);
                t.equal(unpack('l', buf, 3), -256*256*256 + 0x010203);
                t.equal(unpack('l<', buf, 3), 0x030201ff);
                t.equal(unpack('l', buf, 4), 0x01020304);
                t.equal(unpack('l<', buf, 4), 0x04030201);
                t.equal(unpack('l<', buf, 5), -128*256*256*256 + 0x040302);
                t.ok(isNaN(unpack('L', buf, 6)));
                t.ok(isNaN(unpack('l', buf, 6)));
                t.ok(isNaN(unpack('l<', buf, 6)));

                t.done();
            },

            'q: signed 64-bit quad': function(t) {
                var buf = new Buffer([128, 0, 0, 0, 0, 0, 0, 0, 0, 128]);
                t.equal(unpack('q', buf, 0), -0x8000000000000000);
                t.equal(unpack('q<', buf, 0), 0x0000000000000080);
                t.equal(unpack('q', buf, 1), 0);
                t.equal(unpack('q<', buf, 1), 0);
                t.equal(unpack('q', buf, 2), 128);
                t.equal(unpack('q<', buf, 2), -0x8000000000000000);
                t.ok(isNaN(unpack('Q', buf, 3)));

                var buf = new Buffer([255,255,255,255,255,255,255,255,1,2,3,4,5,6,7,8,128]);
                t.equal(unpack('q', buf, 0), -1);
                t.equal(unpack('q<', buf, 0), -1);
                t.equal(unpack('q', buf, 1), -256 + 1);
                t.equal(unpack('q<', buf, 1), 0x01ffffffffffffff);
                t.equal(unpack('q', buf, 6), -0x1000000000000 + 0x010203040506);
                t.equal(unpack('q', buf, 8), 0x0102030405060708);
                t.equal(unpack('q<', buf, 9), -128 * 256*256*256*256*256*256*256 + 0x08070605040302);
                t.ok(isNaN(unpack('q', buf, 10)));

                t.done();
            },
        },

        'floating-point': {
            'f,G: 4-byte float, e: 4-byte little-e float': function(t) {
                var buf = new Buffer(8);

                var writeMethods = {
                    'f': 'writeFloatBE',
                    'G': 'writeFloatBE',
                    'g': 'writeFloatLE'
                };
                for (var fmt in writeMethods) {
                    var writeFloatXX = writeMethods[fmt];

                    buf[writeFloatXX](1234.5, 0);
                    buf[writeFloatXX](5678.5, 4);
                    t.equal(unpack(fmt, buf, 0), 1234.5, writeFloatXX + ' ' + fmt);
                    t.deepEqual(unpack(fmt + '2', buf, 0), [1234.5, 5678.5]);

                    buf[writeFloatXX](1234.5, 2);
                    t.equal(unpack(fmt, buf, 2), 1234.5);

                    var _2e40 = (1<<10)*(1<<10)*(1<<10)*(1<<10);
                    var tests = [
                        0, -0, 1, -1, 1234.5, -1234.5, _2e40, 1/_2e40, -1*_2e40, -1/_2e40, Infinity, -Infinity, NaN,
                    ];
                    for (var i=0; i<tests.length; i++) {
                        buf[writeFloatXX](tests[i], 0);
                        var val = unpack(fmt, buf, 0);
                        isNaN(tests[i]) ? t.ok(isNaN(val)) : t.equal(val, tests[i]);
                    }
                }

                t.done();
            },

            'd,E: 8-byte double': function(t) {
                // TODO: needs more tests...
                var buf = new Buffer(16);

                var writeMethods = {
                    'd': 'writeDoubleBE',
                    'E': 'writeDoubleBE',
                    'e': 'writeDoubleLE',
                };
                for (var fmt in writeMethods) {
                    var writeDoubleXX = writeMethods[fmt];

                    buf[writeDoubleXX](1234.5, 0);
                    buf[writeDoubleXX](5678.5, 8);
                    t.equal(unpack(fmt, buf, 0), 1234.5);
                    t.deepEqual(unpack(fmt + '2', buf, 0), [1234.5, 5678.5]);

                    buf[writeDoubleXX](1234.5, 2);
                    t.equal(unpack(fmt, buf, 2), 1234.5);

                    var tests = [
                        0, -0, 1, -1, 1234.5, -1234.5, 1e10, 1e-10, -1e10, -1e-10, 1e200, 1e-200, Infinity, -Infinity, NaN,
                    ];
                    for (var i=0; i<tests.length; i++) {
                        buf[writeDoubleXX](tests[i], 0);
                        var val = unpack(fmt, buf, 0);
                        isNaN(tests[i]) ? t.ok(isNaN(val)) : t.equal(val, tests[i]);
                    }
                }

                t.done();
            },
        },

        'strings': {
            'should a: fixed-length string': function(t) {
                var buf = new Buffer("abcdef\nh");
                t.equal(unpack('a0', buf, 0), '');
                t.equal(unpack('a', buf, 0), 'a');
                t.equal(unpack('a1', buf, 0), 'a');
                t.equal(unpack('a', buf, 1), 'b');
                t.equal(unpack('a1', buf, 1), 'b');
                t.equal(unpack('a2', buf, 0), 'ab');
                t.equal(unpack('a2', buf, 1), 'bc');
                t.equal(unpack('a2', buf, 3), 'de');
                t.equal(unpack('a4', buf, 4), 'ef\nh');

                var buf = new Buffer("ab\0\0");
                t.equal(unpack('a4', buf, 0), 'ab\0\0');
                t.equal(unpack('a4', buf, 1), 'b\0\0');

                t.done();
            },

            'A: SPACE-padded string': function(t) {
                var buf = new Buffer("abcd\t\n\n  ");
                t.equal(unpack('A', buf, 0), 'a');
                t.equal(unpack('A2', buf, 2), 'cd');
                t.equal(unpack('A3', buf, 2), 'cd');
                t.equal(unpack('A4', buf, 2), 'cd');
                t.equal(unpack('A40', buf, 2), 'cd');

                var buf = new Buffer("ab \t\n cd");
                t.equal(unpack('A6', buf, 0), 'ab');
                t.equal(unpack('A7', buf, 0), 'ab \t\n c');

                t.done();
            },

            'Z: NUL-padded string': function(t) {
                var buf = new Buffer("abcd\0\0\0\0");
                t.equal(unpack('Z', buf, 0), 'a');
                t.equal(unpack('Z2', buf, 2), 'cd');
                t.equal(unpack('Z3', buf, 2), 'cd');
                t.equal(unpack('Z4', buf, 2), 'cd');
                t.equal(unpack('Z40', buf, 2), 'cd');

                var buf = new Buffer("ab\0\0cd");
                t.equal(unpack('A4', buf, 0), 'ab');
                t.equal(unpack('A5', buf, 0), 'ab\0\0c');

                t.done();
            },

            'Z+: variable-length NUL-terminated string': function(t) {
                var buf = new Buffer("ABC\0DE\0F\0\0\0");
                t.deepEqual(unpack('Z+', buf, 0), ['ABC']);
                t.deepEqual(unpack('Z+', buf, 1), ['BC']);
                t.deepEqual(unpack('Z+2', buf, 0), ['ABC','DE']);
                t.deepEqual(unpack('Z+2', buf, 1), ['BC','DE']);
                t.deepEqual(unpack('Z+3', buf, 0), ['ABC','DE','F']);
                t.deepEqual(unpack('Z+4', buf, 0), ['ABC','DE','F','']);
                t.deepEqual(unpack('Z+5', buf, 0), ['ABC','DE','F','','']);
                t.done();
            },

            'H: hex string': function(t) {
                var buf = new Buffer([0x12, 0x34, 0x56, 0x78]);
                t.equal(unpack('H', buf, 0), '1');
                t.equal(unpack('H2', buf, 0), '12');
                t.equal(unpack('H2', buf, 1), '34');
                t.equal(unpack('H3', buf, 2), '567');
                t.deepEqual(unpack('H3H', buf, 0), ['123', '5']);

                t.done();
            },

            'h: hex string': function(t) {
                var buf = new Buffer([0x12, 0x34, 0x56, 0x78]);
                t.equal(unpack('h', buf, 0), '2');
                t.equal(unpack('h2', buf, 0), '21');
                t.equal(unpack('h2', buf, 1), '43');
                t.equal(unpack('h3', buf, 2), '658');
                t.deepEqual(unpack('h3h', buf, 0), ['214', '6']);

                t.done();
            }
        },

        'seek': {
            'x: seek forward': function(t) {
                var buf = new Buffer([1,2,3,4,5,6]);
                t.deepEqual(unpack('SS', buf, 0), [0x0102, 0x0304]);
                t.deepEqual(unpack('SxS', buf, 0), [0x0102, 0x0405]);
                t.deepEqual(unpack('Sx2S', buf, 0), [0x0102, 0x0506]);
                t.done();
            },

            'X: seek backward': function(t) {
                var buf = new Buffer([1,2,3,4,5,6]);
                t.deepEqual(unpack('SS', buf, 0), [0x0102, 0x0304]);
                t.deepEqual(unpack('SXS', buf, 0), [0x0102, 0x0203]);
                t.deepEqual(unpack('SSX3S', buf, 0), [0x0102, 0x0304, 0x0203]);
                t.done();
            },

            '@: seek to absolute position': function(t) {
                var buf = new Buffer([1,2,3,4]);
                t.deepEqual(unpack('SS@1S@2S', buf, 0), [0x0102, 0x0304, 0x0203, 0x0304]);
                t.done();
            },
        },

        'sub-arrays': {
            'should extract sub-array': function(t) {
                var buf = new Buffer([1,65,0,66,0,4]);
                t.deepEqual(unpack('C[Z+2]', buf), [1, ['A', 'B']]);
                t.done();
            },

            'should ignore extra ]': function(t) {
                var buf = new Buffer([1,2,3,4]);
                t.deepEqual(unpack(']C]C]C]C]]', buf), [1, 2, 3, 4]);
                t.done();
            },

            'should throw on unterminatede sub-group': function(t) {
                var buf = new Buffer([1,2,3,4]);
                try { unpack('C[C', buf, 0); }
                catch (err) {
                    t.contains(err.message, 'unterminated');
                    t.done()
                }
            },

            'should extract empty sub-array': function(t) {
                var buf = new Buffer([1,2,3,4]);
                t.deepEqual(unpack('', buf, 0), []);
                t.deepEqual(unpack('C[]', buf, 0), [1, []]);
                t.done();
            },

            'should extract deeper nested sub-array': function(t) {
                var buf = new Buffer([1,2,3,4]);
                t.deepEqual(unpack('C[C[C]]', buf, 1), [2, [3, [4]]]);
                t.done();
            },

            'should extract a count of sub-arrays': function(t) {
                var buf = new Buffer([1,2,3,4,5,6,7,8]);
                t.deepEqual(unpack('C[1 C2]C', buf), [1, [2, 3], 4]);
                t.deepEqual(unpack('C[3 C2]C', buf), [1, [2, 3], [4, 5], [6, 7], 8]);

                t.throws(function() { unpack('C[0 C2]c', buf) });
                t.deepEqual(unpack('C[-0 C2]C', buf), [1, [2, 3], 4]);  // not a count

                t.done();
            },
        },

        'hashes': {
            'should extract hash with name-value pairs': function(t) {
                var buf = new Buffer([1,2,3,4,5,6]);
                t.deepEqual(unpack('C{foo:C, foobar:S}', buf, 0), [0x01, { foo: 0x02, foobar: 0x0304 }]);
                t.deepEqual(unpack('C{foo:C2, foobar:C}', buf, 0), [0x01, { foo: [0x02, 0x03], foobar: 0x04 }]);
                t.done();
            },

            'names should start names with valid initial js varname chars': function(t) {
                var buf = new Buffer([1,2,3,4,5,6]);
                // unrecognized punctuation eg ' ,' should get skipped, varnames start with [a-zA-Z_$]
                t.deepEqual(unpack('{-+a#:C ,;_!@:C ,>A[:C ,%=^&$()]:C}', buf, 0), [{ 'a#': 1, '_!@': 2, 'A[': 3, '$()]': 4 }]);
                t.done();
            },

            'should allow escaped chars in name': function(t) {
                var buf = new Buffer([1,2,3,4,5,6]);
                t.deepEqual(unpack('SX2{ab:S,cde:S}', buf, 0), [0x0102, { ab: 0x0102, cde: 0x0304 }]);
                t.deepEqual(unpack('{ab:S,cde:S}', buf, 0), [{ ab: 0x0102, cde: 0x0304 }]);
                t.deepEqual(unpack('{ab:C,_:X1,cde:S}', buf, 0), [{ ab: 0x01, cde: 0x0102 }]);
                t.deepEqual(unpack('{a\\b:C,_:X1,cde:S}', buf, 0), [{ 'a\\b': 0x01, cde: 0x0102 }]);
                t.deepEqual(unpack('{a\\\\\\:b:C,_:X1,cde:S}', buf, 0), [{ 'a\\:b': 0x01, cde: 0x0102 }]);
                t.deepEqual(unpack('C{a\b\\:b:C,cd\\:e:S}', buf, 0), [1, { 'a\b:b': 2, 'cd:e': 0x0304 }]);
                t.done();
            },

            'should skip escaped chars before name': function(t) {
                var buf = new Buffer([1,2,3,4]);
                t.deepEqual(unpack('{\\ab:S}', buf), [{ b: 0x0102 }]);
                t.done();
            },

            'should omit field if no value extracted': function(t) {
                var buf = new Buffer([1,2,3,4,5,6]);
                t.deepEqual(unpack('{a:C, b:X, c:C2, d:@0, e:C}', buf), [{ a:1, c:[1,2], e:1 }]);
                t.done();
            },

            'should extract multiple hashes': function(t) {
                var buf = new Buffer([1,2,3,4,5,6]);
// FIXME: throws if upper unterminated name is enabled in scanPropertyName
                t.deepEqual(unpack('x1, {3 a:C, _:x1 }', buf), [{ a:2 }, { a:4 }, { a:6 }]);
                t.deepEqual(unpack('{2 a:C, x:X1, b:S}', buf), [ {a:1, b:0x0102}, {a:3, b:0x0304} ]);
                t.done();
            },

            'should extract nested hashes': function(t) {
                var buf = new Buffer([1,2,3,4,5,6]);
t.skip();
// FIXME: extracts not 'aa' but empty string '' nested name
                t.deepEqual(unpack('{ a:C, b:{ +aa: S } }', buf), [{ a:1, b:{ aa: 0x0203 }}]);
                t.done();
            },

            'errors': {
                'should throw on non-positive hash count': function(t) {
                    var buf = new Buffer([1,2,3,4]);
                    t.throws(function(){ unpack('{0 a:C}',buf) });
                    t.done();
                },

                'should throw if {...} group is not terminated': function(t) {
                    var buf = new Buffer([1,2,3,4]);
                    try { unpack('{ a:C, ', buf) }
                    catch (err) {
                        t.contains(err.message, 'unterminated');
                        t.done();
                    }
                },

                'should throw if field name is not terminated': function(t) {
                    var buf = new Buffer([1,2,3,4]);
                    t.throws(function(){ unpack('{ a', buf) });
                    try { unpack('{ a', buf) }
                    catch (err) {
                        t.contains(err.message, 'unterminated');
                        t.notContains(err.message, '...');
                        t.done();
                    }
                },

                'should trim overlong field name in error': function(t) {
                    var buf = new Buffer([1,2,3,4]);
                    try { unpack('{ veryverylongnamethatafieldnamethatisTooLong', buf) }
                    catch (err) {
                        t.contains(err.message, 'unterminated');
                        t.notContains(err.message, 'TooLong');
                        t.done();
                    }
                },

                'should throw if field name is not followed by a colon': function(t) {
                    var buf = new Buffer([1,2,3,4]);
t.skip();
// FIXME: does not throw, extracts { '': '\1' } instead of erroring out
//console.log("AR: got", unpack('{ a }', buf));
                    try { var x = unpack('{ a }', buf); }
                    catch (err) {
console.log("AR: got err", err);
                        t.contains(err.message, 'unterminated');
                        t.done();
                    }
                },
            },
        },

        'corner cases': {
            'should ignore negative offset': function(t) {
                t.equal(unpack('S', [1,2,3,4], -2), 0x0102);
                t.done();
            },

            'should extract zero args': function(t) {
                t.deepEqual(unpack('', [], 0), []);
                t.done();
            },

            'should extract zero sub-args': function(t) {
                t.deepEqual(unpack('[]', [], 0), [[]]);
                t.done();
            },

            'should extract zero deeper sub-args': function(t) {
                t.deepEqual(unpack('[][[][]]', [], 0), [[], [[], []]]);
                t.done();
            },

            'end of input should terminate final string': function(t) {
                var buf = new Buffer('abcd');
                t.equal(unpack('a5', buf, 0), 'abcd');
                t.equal(unpack('A5', buf, 0), 'abcd');
                t.equal(unpack('Z5', buf, 0), 'abcd');
                t.equal(unpack('Z+', buf, 0), 'abcd');
                t.deepEqual(unpack('Z+2', buf, 0), ['abcd','']);
                t.done();
            },
        },

        'errors': {
            'should ignore unrecognized format chars': function(t) {
                var buf = new Buffer([1,2,3,4,5,6]);
                t.deepEqual(unpack('S-3,+7-S2', buf, 0), [0x0102, 0x0304, 0x0506]);
                t.deepEqual(unpack('S3-X6,+7-:=S2', buf, 0), [0x0102, 0x0304, 0x0506, 0x0102, 0x0304]);
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

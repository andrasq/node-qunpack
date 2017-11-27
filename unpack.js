/**
 * unpack bytes into integers or structs of integers,
 * kinda like php or perl `unpack`.
 *
 * Copyright (C) 2017 Andras Radics
 * Licensed under the Apache License, Version 2.0
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * 2017-11-25 - Started - AR.
 */

/*
 * Php pack() format described in http://php.net/manual/en/function.pack.php
 */

'use strict';

module.exports = {
    pack: qpack,
    unpack: qunpack,
};


function qpack( format, args ) {
    throw new Error("pack: not implemented.");
    // allocate a sufficiently large buffer, and pack into it
    // var endOffset = qpackInto(format, buf, 0, argv);
    // return buf.slice(0, endOffset);
}

//function qpackInto( format, buf, offset, argv ) {
//}

// sizes for supported fixed-size conversions
var sizes = { c:1, C:1,   s:2, S:2, n:2,   l:4, L:4, N:4,   q:8, Q:8, J:8,   f:4, G:4,   d:8, E:8 }

function qunpack( format, bytes, offset ) {
    offset = offset > 0 ? offset : 0;
    var state = { fmt: format, buf: bytes, fi: 0, ofs: offset, v: null, depth: 0 };
    return _qunpack(format, state);
}

// TODO: bounds test? (ie, if doesn't fit)
// TODO: switch on charcode, not char
function _qunpack( format, state ) {
    var retArray = new Array();
    state.depth += 1;

    var fmt, cnt, ch;
    for ( ; state.fi < format.length; ) {
        // conversion specifier
        fmt = format[state.fi++];

        // meta-conversions and two-byte conversion specifiers
        switch (fmt) {
        case '[':
            cnt = getCount(state);
            if (!cnt) throw new Error("qunpack: [#...] count must be non-zero");
            var subgroupFormatIndex = state.fi;
            for (var i=0; i<cnt; i++) {
                state.fi = subgroupFormatIndex;
                retArray.push(_qunpack(format, state));
            }
            break;
        case ':':
            break;
        case 'Z':
            if (format[state.fi] === '+') { fmt = 'Z+'; state.fi++ }; break;
        }

        cnt = getCount(state);

        // unpack bytes according to the conversion
        switch (fmt) {
        case 'C': case 'S': case 'L': case 'Q':         // unsigned ints
        case 'c': case 's': case 'l': case 'q':         // signed ints
        case 'n': case 'N': case 'J':                   // network byte order unsigned ints
        case 'f': case 'G': case 'd': case 'E':         // float and double
            for (var i=0; i<cnt; i++) {
                retArray.push(unpackFixed(fmt, state));
            }; break;

        case 'a': case 'A': case 'Z':
        case 'H':
            retArray.push(unpackString(fmt, state, cnt));
            break;

        case 'Z+':
            for (var i=0; i<cnt; i++) {
                retArray.push(unpackString('az', state, findAsciizLength(state)));
            }
            break;

        case 'x': state.ofs += cnt; break;
        case 'X': state.ofs -= cnt; break;
        case '@': state.ofs = cnt; break;

        case ']':
            if (state.depth > 1) {
                state.depth -= 1;
                return retArray;
            }
            break;
        }
    }

    state.depth -= 1;
    if (state.depth > 0) throw new Error("qunpack: unterminated [] subgroup");

    return retArray;
}

/*
 * extract a fixed-size value from the bytes
 * Notes:
 * - a left shift of a 1 into bit position 32 makes the value negative
 * - a large negative eg FFFE can be built out of a scaled negative prefix FF * 256
 *   and and a positive additive offset FE, ie (-1 * 256) + 254 = -2.
 */
function unpackFixed( format, state ) {
    var val;
    switch (format) {
    case 'C':
        return state.buf[state.ofs++];
    case 'c':
        return state.buf[state.ofs] >= 128 ? -256 + state.buf[state.ofs++] : state.buf[state.ofs++];
    case 'S': case 'n':
    case 's':
        val = (state.buf[state.ofs++] << 8) + state.buf[state.ofs++];
        if (format === 's' && val >= 0x8000) val -= 0x10000;
        return val;
    case 'L': case 'N':
    case 'l':
        val = (state.buf[state.ofs++] * 0x1000000) + (state.buf[state.ofs++] << 16) + (state.buf[state.ofs++] << 8) + state.buf[state.ofs++];
        if (format === 'l' && val >= 0x80000000) val -= 0x100000000;
        return val;
    case 'Q': case 'J':
    case 'q':
        var fmt = format === 'Q' ? 'L' : 'l';
        val = (unpackFixed(fmt, state) * 0x100000000) + unpackFixed('L', state);
        return val;
    case 'f': case 'G':
        state.v = state.buf.readFloatBE(state.ofs);
        state.ofs += 4;
        return state.v;
    case 'd': case 'E':
        state.v = state.buf.readDoubleBE(state.ofs);
        state.ofs += 8;
        return state.v;
    }
}

// TODO: decode utf8 or ascii/latin1?  Here we do utf8.
// TODO: avoid depending on Buffer, use decodeUtf8 and read float/double
var stringWhitespace = [ ' ', '\t', '\n', '\r', '\0' ];
// var stringWhitespaceRegex = /[ \t\n\r\0]+$/g;
function unpackString( format, state, size ) {
    var encoding = (format === 'H') ? 'hex' : undefined;
    var val = state.buf.toString(encoding, state.ofs, state.ofs += size);

    switch (format) {
    case 'a':
        return val;
    case 'az':
        // asciiz string, advance past its terminating NUL
        state.ofs += 1;
        return val;
    case 'A':
        //if (stringWhitespaceRegex.test(val)) val = val.replace(stringWhitespaceRegex, '');
        for (var len = val.length; len > 0 && stringWhitespace.indexOf(val[len - 1]) >= 0; len--) ;
        return (len < val.length) ? val.slice(0, len) : val;
    case 'Z':
        for (var len = val.length; len > 0 && val[len - 1] === '\0'; len--) ;
        return (len < val.length) ? val.slice(0, len) : val;
    case 'H':
        return val;
    }
}

function getCount( state ) {
    // test '9' first, avoid the '0' test for non-numeric chars
    var ch = state.fmt[state.fi];
    return (ch <= '9' && ch >= '0') ? scanInt(state.fmt, state) : 1;
}

// scan in the number in the string starting at position state.fi
// Stop on non-number or end of string.
function scanInt( string, state ) {
    var ival = 0, ch, cc, fi = state.fi;
    while (true) {
        cc = string.charCodeAt(fi);
        if (cc >= 0x30 && cc <= 0x39) { ival = ival * 10 + (cc - 0x30); fi++; }
        else { state.fi = fi; return ival; }
    }
}

// count the length of the asciiz string starting at the current offset
// A NUL or the end of the buffer terminate the string.
function findAsciizLength( state ) {
    for (var pos=state.ofs; state.buf[pos]; pos++) ;
    return pos - state.ofs;
}

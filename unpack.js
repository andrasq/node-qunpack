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
    var state = { fmt: format, fi: 0, ofs: offset, v: null };
    _qunpack(format, bytes, state);
    return state.v;
}

// TODO: bounds test? (ie, if doesn't fit)
// TODO: switch on charcode, not char
function _qunpack( format, bytes, state, isNested ) {
    var offset = state.ofs;
    var retArray = new Array();

    var fmt, cnt, ch;
    for ( ; state.fi < format.length; ) {
        // conversion specifier
        fmt = format[state.fi++];

        // meta-conversions and two-byte conversion specifiers
        switch (fmt) {
        case '[':
            state.ofs = offset;
            _qunpack(format, bytes, state, true)
            retArray.push(state.v);
            offset = state.ofs;
            break;
        case ':':
            break;
        case 'Z':
            if (format[state.fi] === '+') { fmt = 'Z+'; state.fi++ }
            break;
        }

        // count: test '9' first, avoid the '0' test for non-numeric chars
        cnt = ((ch = format[state.fi]) <= '9' && ch >= '0') ? scanInt(format, state) : 1;

        // unpack bytes according to the conversion
        switch (fmt) {
        case 'C': case 'S': case 'L': case 'Q':         // unsigned ints
        case 'c': case 's': case 'l': case 'q':         // signed ints
        case 'n': case 'N': case 'J':                   // network byte order unsigned ints
        case 'f': case 'G': case 'd': case 'E':         // float and double
            for (var i=0; i<cnt; i++) {
                state.ofs = offset;
                retArray.push(unpackFixed(fmt, bytes, state));
                offset = state.ofs;
            }; break;

        case 'a': case 'A': case 'Z':
        case 'H':
            retArray.push(unpackString(fmt, bytes, offset, cnt));
            offset += cnt;
            break;

        case 'Z+':
            for (var i=0; i<cnt; i++) {
                var len = findAsciizLength(bytes, offset);
                retArray.push(unpackString('a', bytes, offset, len));
                offset += len + 1;
            }
            break;

        case 'x': offset += cnt; break;
        case 'X': offset -= cnt; break;
        case '@': offset = cnt; break;

        case ']':
            if (isNested) {
                state.ofs = offset;
                state.v = retArray;
                return;
            }
            break;
        }
    }

    if (isNested) throw new Error("qunpack: unterminated [] subgroup");

    state.ofs = offset;
    state.v = retArray;
}

/*
 * extract a fixed-size value from the bytes
 * Notes:
 * - a left shift of a 1 into bit position 32 makes the value negative
 * - a large negative eg FFFE can be built out of a scaled negative prefix FF * 256
 *   and and a positive additive offset FE, ie (-1 * 256) + 254 = -2.
 */
function unpackFixed( format, bytes, state, size ) {
    var val;
    switch (format) {
    case 'C':
        return bytes[state.ofs++];
    case 'c':
        return bytes[state.ofs] >= 128 ? -256 + bytes[state.ofs++] : bytes[state.ofs++];
    case 'S': case 'n':
    case 's':
        val = (bytes[state.ofs++] << 8) + bytes[state.ofs++];
        if (format === 's' && val >= 0x8000) val -= 0x10000;
        return val;
    case 'L': case 'N':
    case 'l':
        val = (bytes[state.ofs++] * 0x1000000) + (bytes[state.ofs++] << 16) + (bytes[state.ofs++] << 8) + bytes[state.ofs++];
        if (format === 'l' && val >= 0x80000000) val -= 0x100000000;
        return val;
    case 'Q': case 'J':
    case 'q':
        var fmt = format === 'Q' ? 'L' : 'l';
        val = (unpackFixed(fmt, bytes, state) * 0x100000000) + unpackFixed('L', bytes, state);
        return val;
    case 'f': case 'G':
        state.v = bytes.readFloatBE(state.ofs);
        state.ofs += 4;
        return state.v;
    case 'd': case 'E':
        state.v = bytes.readDoubleBE(state.ofs);
        state.ofs += 8;
        return state.v;
    }
}

// TODO: decode utf8 or ascii/latin1?  Here we do utf8.
// TODO: avoid depending on Buffer, use decodeUtf8 and read float/double
var stringWhitespace = [ ' ', '\t', '\n', '\r', '\0' ];
// var stringWhitespaceRegex = /[ \t\n\r\0]+$/g;
function unpackString( format, bytes, offset, size ) {
    var encoding = (format === 'H') ? 'hex' : undefined;
    var val = bytes.toString(encoding, offset, offset + size);

    switch (format) {
    case 'a':
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

// count the length of the asciiz string starting at offset
// A NUL or the end of the buffer terminate the string.
function findAsciizLength( buf, offset ) {
    for (var pos=offset; buf[pos]; pos++) ;
    return pos - offset;
}

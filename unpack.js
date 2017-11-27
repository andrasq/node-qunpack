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


function qpack( format, vars ) {
    throw new Error("pack: not implemented.");
}

// sizes for supported fixed-size conversions
var sizes = { c:1, C:1,   s:2, S:2, n:2,   l:4, L:4, N:4,   q:8, Q:8, J:8,   f:4, G:4,   d:8, E:8 }

// TODO: bounds test? (ie, if doesn't fit)
function qunpack( format, bytes, offset, state ) {
    offset = offset || 0;
    state = state || { p: offset, v: null };
    var retArray = new Array();

    var fmt, cnt;
    for (var fi = 0; fi < format.length; ) {
        // TODO: switch on charcode, not char
        fmt = format[fi++];
        cnt = (format[fi] <= '9' && format[fi] >= '0') ? scanInt(format, fi) : 1;
        switch (fmt) {
        case 'C': case 'S': case 'L': case 'Q':         // unsigned ints
        case 'c': case 's': case 'l': case 'q':         // signed ints
        case 'n': case 'N': case 'J':                   // network byte order unsigned ints
        case 'f': case 'G': case 'd': case 'E':         // float and double
            for (var i=0; i<cnt; i++) {
                retArray.push(unpackFixed(fmt, bytes, offset));
                offset += sizes[fmt];
            }; break;

        case 'a': case 'A': case 'Z':
            retArray.push(unpackString(fmt, bytes, offset, cnt));
            offset += cnt;
            break;

        case 'H':
            retArray.push(bytes.toString('hex', offset, offset + cnt));
            offset += cnt;
            break;

        case 'x': offset += cnt; break;
        case 'X': offset -= cnt; break;
        case '@': offset = cnt; break;

        case '0': case '1': case '2': case '3': case '4':
        case '5': case '6': case '7': case '8': case '9':
            break;
        }
    }

    return retArray;
}

/*
 * extract a fixed-size value from the bytes
 * Notes:
 * - a left shift of a 1 into bit position 32 makes the value negative
 * - a large negative eg FFFE can be built out of a scaled negative prefix FF * 256
 *   and and a positive additive offset FE, ie (-1 * 256) + 254 = -2.
 */
function unpackFixed( format, bytes, offset, size ) {
    var val;
    switch (format) {
    case 'C':
        return bytes[offset];
    case 'c':
        return bytes[offset] >= 128 ? -256 + bytes[offset] : bytes[offset];
    case 'S': case 'n':
    case 's':
        val = (bytes[offset++] << 8) + bytes[offset++];
        if (format === 's' && val >= 0x8000) val -= 0x10000;
        return val;
    case 'L': case 'N':
    case 'l':
        val = (bytes[offset++] * 0x1000000) + (bytes[offset++] << 16) + (bytes[offset++] << 8) + bytes[offset++];
        if (format === 'l' && val >= 0x80000000) val -= 0x100000000;
        return val;
    case 'Q': case 'J':
    case 'q':
        var fmt = format === 'Q' ? 'L' : 'l';
        val = (unpackFixed(fmt, bytes, offset) * 0x100000000) + unpackFixed('L', bytes, offset + 4);
        return val;
    case 'f': case 'G':
        return bytes.readFloatBE(offset);
    case 'd': case 'E':
        return bytes.readDoubleBE(offset);
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

// scan*: extract from position
// state: { v: value, p: position }
// read*: set state.v, update state.p

function scanInt( string, offset ) {
    var ival = 0, ch, cc;
    while (true) {
        cc = string.charCodeAt(offset++);
        // stop on non-number or end of string
        if (cc >= 0x30 && cc <= 0x39) ival = ival * 10 + (cc - 0x30);
        else return ival;
    }
}


/***
// not working, off-by-one?
function decodeAscii( bytes, base, bound ) {
    var s = '';
    for (var i=base; i<bound; i++) s += String.fromCharCode(bytes[i]);
    return s;
}

// decodeUtf8() lifted from q-utf8
// recover the utf8 string between base and bound
// The bytes are expected to be valid utf8, no checking is done.
// Returns a string.
// Handles utf16 only (16-bit code points), same as javascript.
// Note: faster for short strings, slower for long strings
// Note: generates more gc activity than buf.toString
//
function decodeUtf8( buf, base, bound ) {
    var ch, str = "", code;
    for (var i=base; i<bound; i++) {
        ch = buf[i];
        // 0xxx xxxx
        if (ch < 0x80) str += String.fromCharCode(ch);
        // 110x xxxx  10xx xxxx
        else if (ch < 0xE0) str += String.fromCharCode(((ch & 0x1F) <<  6) + (buf[++i] & 0x3F));
        // 1110 xxxx  10xx xxxx  10xx xxxx
        else if (ch < 0xF0) str += String.fromCharCode(((ch & 0x0F) << 12) + ((buf[++i] & 0x3F) << 6) + (buf[++i] & 0x3F));
    }
    return str;
}

// return the NUL-terminated string from buf at offset
function readStringZ( buf, offset ) {
    for (var end=offset; buf[end]; end++) ;
    return buf.toString(undefined, offset, end);
}
**/

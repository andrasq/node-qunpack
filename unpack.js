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

function qunpack( format, bytes, offset ) {
    offset = offset > 0 ? offset : 0;
    var state = { fmt: format, buf: bytes, fi: 0, ofs: offset, v: null, depth: 0, hashDepth: 0 };
    return _qunpack(format, state);
}

// TODO: bounds test? (ie, if doesn't fit)
// TODO: switch on charcode, not char
// TODO: gather into a Retval that can be either an array or a hash.
//       Currently we return an array annotated with enumerable properties.
// TODO: split into one-item extractor (updating state) and subgroup/hash unpack loops.
//       Note that the main unpack is a subgroup loop without a closing ']'.
function _qunpack( format, state ) {
    var retArray = new Array();
    state.depth += 1;

    var fmt, name, cnt, ch;
    for ( ; state.fi < format.length; ) {
        // in {#...} hashes the fmt is preceded by name:
        if (state.hashDepth > 0) name = scanPropertyName(format, state);

        // conversion specifier
        fmt = format[state.fi++];

        // two-byte conversion specifiers
        if (fmt === 'Z') if (format[state.fi] === '+') { fmt = 'Z+'; state.fi++ };

        cnt = getCount(state);

        // unpack bytes according to the conversion
        switch (fmt) {
        case 'c': case 's': case 'i': case 'l': case 'q':       // native signed integers
        case 'C': case 'S': case 'I': case 'L': case 'Q':       // native unsigned integers
        case 'n': case 'N': case 'J':                           // network order (big-e) unsigned ints
        case 'f': case 'd': case 'G': case 'E':                 // native and big-e float and double
            for (var i=0; i<cnt; i++) {
                retArray.push(unpackFixedBE(fmt, state));
            }; break;

        case 'v': case 'V': case 'P':                           // little-e ints
        case 'g': case 'e':                                     // little-e float and double
            for (var i=0; i<cnt; i++) {
                retArray.push(unpackFixedLE(fmt, state));
            }; break;

        case 'a': case 'A': case 'Z':                           // byte-counted strings
        case 'H': case 'h':                                     // hex strings
            retArray.push(unpackString(fmt, state, cnt));
            break;

        case 'Z+':
            for (var i=0; i<cnt; i++) {
                retArray.push(unpackString('az', state, findAsciizLength(state)));
            }; break;

        case 'x': state.ofs += cnt; break;              // skip ahead
        case 'X': state.ofs -= cnt; break;              // back up
        case '@': state.ofs = cnt; break;               // seek to absolute

        case '[':                                       // [# ... ] sub-array
            unpackSubgroup(retArray, cnt, state); break;
        case '{':                                       // {# ... } sub-object
            unpackHash(retArray, cnt, state); break;
        case ']': case '}':
            if (state.depth > 1) { state.depth -= 1; return retArray; }; break;
        }
        if (state.hashDepth > 0) {
            // assign {a:S} as a direct value, but {a:C2} as an array of 2 shorts
            if (retArray.length === 1) retArray[name] = retArray.pop();
            else if (retArray.length) { retArray[name] = retArray.slice(0); retArray.length = 0 }
            // if no value generated for conversion character, do not assign to name
        }
    }

    state.depth -= 1;
    if (state.depth > 0) throw new Error("qunpack: unterminated [...] or {...} subgroup");

    return retArray;
}

// separate function to keep the fi rewind clutter out of the main unpack loop
function unpackSubgroup( retArray, cnt, state ) {
    if (!cnt) throw new Error("qunpack: [#...] count must be non-zero");

    // gather the subgroup as when outside a hash, to not expect field names
    var saveHashDepth = state.hashDepth;
    state.hashDepth = false;

    var subgroupFormatIndex = state.fi;
    for (var i=0; i<cnt; i++) {
        state.fi = subgroupFormatIndex;
        retArray.push(_qunpack(state.fmt, state));
    }
    state.hashDepth = saveHashDepth;
}

// separate function to keep the fi rewind clutter out of the main unpack loop
function unpackHash( retArray, cnt, state ) {
    if (!cnt) throw new Error("qunpack: {#...} count must be non-zero");

    var hashFormatIndex = state.fi;
    state.hashDepth += 1;
    for (var i=0; i<cnt; i++) {
        state.fi = hashFormatIndex;
        retArray.push(_qunpack(state.fmt, state));
    }
    state.hashDepth -= 1;
}

/*
 * extract a fixed-size value from the bytes
 * Notes:
 * - a left shift of a 1 into bit position 32 makes the value negative
 * - a large negative eg FFFE can be built out of a scaled negative prefix FF * 256
 *   and and a positive additive offset FE, ie (-1 * 256) + 254 = -2.
 */
function unpackFixedBE( format, state ) {
    var val;
    switch (format) {
    case 'C':
        return state.buf[state.ofs++];
    case 'c':
        return state.buf[state.ofs] >= 128 ? -256 + state.buf[state.ofs++] : state.buf[state.ofs++];
    case 'S': case 'n':
    case 's':
        val = (state.buf[state.ofs++] << 8) + state.buf[state.ofs++];
        return (val >= 0x8000 && (format === 's')) ? val - 0x10000 : val;
    case 'L': case 'I': case 'N':
    case 'l': case 'i':
        val = (state.buf[state.ofs++] * 0x1000000) + (state.buf[state.ofs++] << 16) + (state.buf[state.ofs++] << 8) + (state.buf[state.ofs++]);
        return (val >= 0x80000000 && (format === 'l' || format === 'i')) ? val - 0x100000000 : val;
    case 'Q': case 'J':
    case 'q':
        var fmt = format === 'Q' ? 'L' : 'l';
        return (unpackFixedBE(fmt, state) * 0x100000000) + unpackFixedBE('L', state);
    case 'f': case 'G':
        return (state.ofs += 4, state.buf.readFloatBE(state.ofs - 4));
    case 'd': case 'E':
        return (state.ofs += 8, state.buf.readDoubleBE(state.ofs - 8));
    }
}

/*
 * extract a fixed-size little-endian value from the bytes
 * Note that P (little-e quadword) needs a signed little-endian 'l' format,
 * also implemented here.
 */
function unpackFixedLE( format, state ) {
    switch (format) {
    case 'C':
        return state.buf[state.ofs++];
    case 'c':
        return state.buf[state.ofs] >= 128 ? -256 + state.buf[state.ofs++] : state.buf[state.ofs++];
    case 'S': case 'v':
    case 's':
        val = (state.buf[state.ofs++]) + (state.buf[state.ofs++] << 8);
        return (val >= 0x8000 && (format === 's')) ? val - 0x10000 : val;
    case 'L': case 'I': case 'V':
    case 'l': case 'i':
        val = (state.buf[state.ofs++]) + (state.buf[state.ofs++] << 8) + (state.buf[state.ofs++] << 16) + (state.buf[state.ofs++] * 0x1000000);
        return (val >= 0x80000000 && (format === 'l' || format === 'i')) ? val - 0x100000000 : val;
    case 'Q': case 'P':
    case 'q':
        var fmt = (format === 'q') ? 'i' : 'V';
        return unpackFixedLE('V', state) + (unpackFixedLE(fmt, state) * 0x100000000);
    case 'f': case 'G':
        return (stats.ofs += 4, state.buf.readFloatLE(state.ofs - 4));
    case 'd': case 'E':
        return (stats.ofs += 8, state.buf.readDoubleLE(state.ofs - 8));
    }
}

// TODO: decode utf8 or ascii/latin1?  Here we do utf8.
// TODO: avoid depending on Buffer, use decodeUtf8 and read float/double
var stringWhitespace = [ ' ', '\t', '\n', '\r', '\0' ];
// var stringWhitespaceRegex = /[ \t\n\r\0]+$/g;
function unpackString( format, state, size ) {
    var val;
    if (format === 'H' || format === 'h') val = state.buf.toString('hex', state.ofs, state.ofs += (size + 1) >> 1);
    else val = state.buf.toString(undefined, state.ofs, state.ofs += size);

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
        return val.slice(0, size);
    case 'h':
        // swap nybbles in each hex byte, but low address bytes still goes first
        // Hex output consumes the entire last byte, even if not all its bits are converted.
        var hexbuf = new Buffer(val);
        for (var t, i=0; i<hexbuf.length; i+=2) { t = hexbuf[i]; hexbuf[i] = hexbuf[i+1]; hexbuf[i+1] = t; }
        return hexbuf.toString(undefined, 0, size);
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

// extract the colon-terminated substring starting at state.fi
function scanPropertyName( format, state ) {
    var name, cc, hasSlash = false, fi;

    // advance to the start of the name
    // The name begins with the first char that can start a js varname, [a-zA-Z_$]
    while (state.fi < format.length && format[state.fi] !== '}' && !canStartVarname(format[state.fi])) {
        if (format[state.fi] === '\\') state.fi++;
        state.fi++;
    }

    // find the ':' at the end of name:
    fi = state.fi;
    while (fi < format.length) {
        switch (format[fi++]) {
        case '}':
// FIXME: breaks multiple-hashes test 
//            if (fi > state.fi + 1) throwUnterminatedNameError(format, state.fi - 1);
            return '';
        case '\\':
            fi++;
            hasSlash = true;
            break;
        case ':':
            var str = format.slice(state.fi, fi - 1);
            if (hasSlash) str = str.replace(/\\:/g, ':').replace(/\\\\/g, '\\');
            state.fi = fi;
            return str;
        }
    }
    throwUnterminatedNameError(format, state.fi - 1);
}
function throwUnterminatedNameError( format, fi ) {
    throw new Error("qunpack: unterminated property name starting at " + fi + ": '" + format.slice(fi, fi + 20) + (format.length - fi > 20 ? '...' : "'"));
}
function canStartVarname( ch ) {
    // var names must start with a letter, underscore, or $
    return ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch === '_') || (ch === '$'));
}

// count the length of the asciiz string starting at the current offset
// A NUL or the end of the buffer terminate the string.
function findAsciizLength( state ) {
    for (var pos=state.ofs; state.buf[pos]; pos++) ;
    return pos - state.ofs;
}

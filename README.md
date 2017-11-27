qunpack
=======
[![Build Status](https://api.travis-ci.org/andrasq/node-qunpack.svg?branch=master)](https://travis-ci.org/andrasq/node-qunpack?branch=master)
[![Coverage Status](https://codecov.io/github/andrasq/node-qunpack/coverage.svg?branch=master)](https://codecov.io/github/andrasq/node-qunpack?branch=master)

Simplified subset of PERL and PHP [`unpack()`](http://php.net/manual/en/function.unpack.php).

Currently only "native" format values are supported, where "native" is implemented as
network order (big-endian).  The syntax is more like PERL than PHP; the format string is
a concatenated series of conversion specifiers without names, ie "SL" for `[ short, long ]`
and not "Ssval/Llval" for `{ sval: short, lval: long }`.


Api
---

### qunpack.unpack( format, bytes )

Unpack the `bytes` according to the `format` string.  Bytes can be a `Buffer` or an
array of numbers.  See below for the format specification.

### qunpack.pack( format, data )

TBD.  Maybe later.


Formats
-------

The format string is a concatenated list of conversion specifiers, like for PERL
`unpack`.  Each conversion specifier is a format letter optionally followed by a
count.

TBD.  Tentatively:

    <[aAHZ]><length> - a `length` byte string (default 1 byte)
    <CONV><count> - `count` instances of the value specified by CONV
    <[x]><counte> - skip ahead `count` bytes (NUL fill if packing)
    <[X]><count> - back up `count` bytes
    <[@]><offset> - seek to absolute position `offset` (NUL fill if packing)

Conversion specifiers:

    a - NUL-padded string, retains NUL padding
    A - SPACE-padded string, trailing whitespace stripped
    Z - NUL-padded string, trailing NULs stripped
    H - hex string, high nybble first

    c,C - signed, unsigned 8-bit char
    s,S - signed, unsigned 16-bit short (word)
    l,L - signed, unsigned 32-bit long (dword)
    q,Q - signed, unsigned 64-bit long long (quadword)

    G,E - 32-bit, 64-bit float / double

    x - skip a byte (NUL-fill if packing)
    X - back up a byte
    @ - seek to absolute offset

    G - 32-bit big-endian `float` (note: php specs native size)
    E - 64-bit big-endian `double` (note: php specs native size)

Possible extensions:

    T - extract a variable-length NUL-terminated string
    [<format>] - subgroup, extract into a sub-array
    {<objformat>} - subgroup, extract into an object.  Format idea: typed names, eg
      "{A4:prop1,L:prop2,S4:prop3}" => eg { prop1: 'abcd', prop2: 1234, prop3: [1,2,3,4] }

Examples:

    "a5" - extract a 5-byte NUL-padded string, eg "ABC\0\0" -> "ABC\0\0"
    "A5" - extract a 5-byte SPACE-padded string, eg "ABC  " => "ABC"
    "S2" - extract two unsigned shorts, eg "\1\2\3\4" => 0x0102, 0x0304

Differences
-----------

- `qunpack` does not try to emulate PHP or PERL `unpack`.  It does borrow some of
  their syntax, but only implements big-endian values (network byte order).

- the `unpack` format is interpreted like PERL, where `S1L1` means one short followed by
  one long, not a short stored into property named 'L1'.  The PHP syntax would be e.g.
  `S1shortName/L1longName`, returning `{ shortName: <16 bits>, longName: <32 bits> }`.


Related Work
------------

- [`hipack`](https://npmjs.com/package/hipack) - php compatible pack/unpack
- [`php-pack`](https://npmjs.com/package/php-pack) - fork of `hipack`
- [`qmsgpack`](https://github.com/andrasq/node-q-msgpack) - experimental nodejs `msgpack` with related works bibliography
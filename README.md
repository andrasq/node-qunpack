qunpack
=======
[![Build Status](https://api.travis-ci.org/andrasq/node-qunpack.svg?branch=master)](https://travis-ci.org/andrasq/node-qunpack?branch=master)
[![Coverage Status](https://codecov.io/github/andrasq/node-qunpack/coverage.svg?branch=master)](https://codecov.io/github/andrasq/node-qunpack?branch=master)

Javascript-only simplified subset of PERL and PHP [`unpack()`](http://php.net/manual/en/function.unpack.php).

Currently only big-endian and "native" values are supported, and "native" is implemented as
network byte order (big-endian).  The syntax is more like PERL than PHP; the format string is
a concatenated series of conversion specifiers without names, ie "SL" for `[ short, long ]`
and not "Ssval/Llval" for `{ sval: short, lval: long }`.


Api
---

### qunpack.unpack( format, bytes, [offset] )

Unpack the Buffer `bytes` according to the `format` string.  See below for the format
specification.  Returns an array of values.  If an `offset` is given, unpack starting
that many bytes from the start of `bytes`.

### qunpack.pack( format, data )

TBD.  Maybe later.


Formats
-------

The format string is a concatenated list of conversion specifiers, like for PERL
`unpack`.  Each conversion specifier is a format letter followed by an optional
count (default `1`).

Note that the `pack/unpack` conversions are incomplete, it is not possible to specify
all four combinations of signed/unsigned + little-e/big-e: endianness can be controlled
only for unsigneds and only for integers.  I needed signed big-endian support, so
this implementation interprets "machine byte order" as being big-endian.

The conversion count is interpreted as:

    [aAHZ]<length> - a `length` byte string (default 1 byte)
    <CONV><count> - `count` instances of the type specified by CONV
    x<count> - skip ahead `count` bytes
    X<count> - back up `count` bytes
    @<offset> - seek to absolute position `offset`

    Z+<count> - `count` NUL-terminated variable-length strings

The available conversion specifiers are:

    Strings, decoded as javascript utf8:

    a - NUL-padded string, retains NUL padding
    A - SPACE-padded string, trailing whitespace stripped
    Z - NUL-padded string, trailing NULs stripped
    H - hex string, high nybble first

    Z+ - NUL-terminated variable-length string, NUL stripped

    Numbers, stored in big-endian network byte order:

    c,C - signed, unsigned 8-bit char
    s,S - signed, unsigned 16-bit "native" (big-e) short (word)
    l,L - signed, unsigned 32-bit "native" (big-e) long (longword)
    q,Q - signed, unsigned 64-bit "native" (big-e) long long (quadword),
          extracted into a native JavaScript number.  Note that JavaScript
          numbers are 64-bit doubles and support only 53 bits of precision.
          Larger values may lose least significant bits.
    n - unsigned 16-bit big-e short
    N - unsigned 32-bit big-e long
    J - unsigned 64-bit big-e long long, with 53 bits of precision

    f,G - 32-bit big-e float (note: php spec says "native" size)
    d,E - 64-bit big-e double (note: php spec says "native" size)

    Grouping:

    [# ... ] - subformat inside the [ ] will be gathered into a sub-array.
               The subformat may have a non-zero repeat count, in which case
               that many sub-arrays will be extracted.  A negative count is
               ignored.  It is an error for the count to be zero.
               Eg, 'C[S2]' on [1,2,3,4,5,6] => [ 0x01, [0x0203, 0x0405] ]

    {# ... } - extracts # objects with properties determined by the named conversion
               specifiers contained inside the `{ ... }` (default 1 object).
               A negative count is ignored.  The count must not be zero.
               Eg, '{2 a:C, x:X1, b:S}' on [1,2,3,4] => [ {a:1, b:0x0102}, {a:3, b:0304} ]

    Position control:

    x - skip a byte (NUL-fill if packing)
    X - back up a byte
    @ - seek to absolute offset (NUL-fill if packing)

Not supported conversion specifiers (for completeness):

    h - hex string, low nybble first
    i, I - native-e native-bit signed, unsigned integers
    v, V, P, g, e - 16-, 32-, 64-bit little-e unsigned integers, little-e float, little-e double
    * - "all remaining" repetition specifier
    ( ... ) - grouping specifier

Examples:

    "a5" - extract a 5-byte NUL-padded string, eg "ABC\0\0" -> "ABC\0\0"
    "A5" - extract a 5-byte SPACE-padded string, eg "ABC  " => "ABC"
    "S2" - extract two unsigned shorts, eg "\1\2\3\4" => [ 0x0102, 0x0304 ]
    "Z+3L" - extract three variable-length NUL-terminated strings, then a 32-bit long.
             Eg, '1\0two\0three\0\1\2\3\4' => [ '1', 'two', 'three', 0x01020304 ].

Differences
-----------

- `qunpack` does not try to emulate PHP or PERL `unpack`.  It does borrow some of
  their syntax, but only implements big-endian values (network byte order).

- the `unpack` format is interpreted like PERL, where `S1L1` means one short followed by
  one long, not a short stored into property named 'L1'.  The PHP syntax would be e.g.
  `S1shortName/L1longName`, returning `{ shortName: <16 bits>, longName: <32 bits> }`.

- the `Z+#` conversion is a `qunpack` extension.  It extracts `count` (default 1)
  variable-length NUL-terminated strings from the input.

- the `[# ... ]` grouping conversion is a `qunpack` extension.  It extracts `count`
  (default 1) sub-arrays with the format contained between the brackets.

- the `{# ... }` grouping conversion is a `qunpack` extension.  It extracts `count`
  (default 1) objects with properties according to the named formats contained between
  the braces.


Change Log
----------

- 0.4.0-dev - initial version of `{# ... }` grouping
- 0.3.2 - support for `[# ... ]` sub-group count
- 0.3.1 - speed up by passing a around state object, fewer arguments
- 0.3.0 - `[ ... ]` sub-group parsing, also much faster due to faster state passing
- 0.2.0 - `Z+#` countable variable-length asciiz string conversion specifier
- 0.1.1 - fix c,C count, ignore negative unpack offset
- 0.1.0 - initial implementation, with unit tests


Todo
----

- implement `pack`
- make bounds errors fatal, to not slip by undetected
- omit the wrapping array if unpacking just 1 value and no count specified
  (ie, 'L2' => [0,0], 'L1' => [0], but 'L' => 0.  However, 'A6' => 'string'
  because '6' is the size, not a count.)
- speed up `{# ... }` extraction (avoid unused array)


Related Work
------------

- [`hipack`](https://npmjs.com/package/hipack) - php compatible pack/unpack, uses C++ extension, needs node sources to install
- [`php-pack`](https://npmjs.com/package/php-pack) - fork of `hipack`
- [`qmsgpack`](https://github.com/andrasq/node-q-msgpack) - experimental nodejs `msgpack` with related works bibliography

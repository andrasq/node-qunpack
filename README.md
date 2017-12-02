qunpack
=======
[![Build Status](https://api.travis-ci.org/andrasq/node-qunpack.svg?branch=master)](https://travis-ci.org/andrasq/node-qunpack?branch=master)
[![Coverage Status](https://codecov.io/github/andrasq/node-qunpack/coverage.svg?branch=master)](https://codecov.io/github/andrasq/node-qunpack?branch=master)

`Unpack` decodes a binary string into numbers and strings according to the specified format.
This implementation is a javascript-only mostly compatible work-alike of PERL and PHP
[`unpack()`](http://php.net/manual/en/function.unpack.php).

`qunpack` favors big-endian storage; I needed both signed and unsigned big-endian support,
so I store generic "native" ("machine byte order") values in
network byte order (big-endian).  Later I added full little-endian support as well,
but the default is still network byte order.

The syntax is more like PERL than PHP; the format string is
a concatenated series of conversion specifiers without names, like PERL "SL" meaning
`[ short, long ]` and not PHP "S`sname`/L`lname`" for `{ sname: short, lname: long }`.

Full signed little-endian support is now available with eg `s<` extensions.  It is also
possible to extract nested lists and nested hashes with with `qunpack`-specific extensions.

Example:

    var bytes = new Buffer([129,2,3,4,5,6,7,8,9,10,11,12]);

    // interpret bytes as a signed short, two bytes and two unsigned shorts:
    var valuesArray = qunpack.unpack('sCCSS', bytes);
    // => [ -32510, 3, 4, 0x0506, 0x0708 ]

    // interpret as 6 bytes then a little-endian unsigned long:
    var valuesArray = qunpack.unpack('C6V', bytes);
    // => [ 129, 2, 3, 4, 5, 6, 0x0a090807 ]


Api
---

### qunpack.unpack( format, bytes, [offset] )

Unpack the binary string `bytes` in the Buffer according to the `format` string.  See below for the format
specification.  Returns an array of values.  If an `offset` is given, unpack starting
that many bytes from the start of the binary string.

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
this implementation interprets "machine byte order" as being big-endian.  I later
added full little-endian support, some via the `s<`, `l<` and `q<` conversion extensions.

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
    H - hex string, high nybble first ABC => '414243'
    h - hex string, low nybble first ABC => '142434'

    Z+ - NUL-terminated variable-length string, NUL stripped (extension)

    Portable numeric conversions:

    n - unsigned 16-bit big-e short
    N - unsigned 32-bit big-e long
    J - unsigned 64-bit big-e long long, with 53 bits of precision

    v - unsigned 16-bit little-e short
    V - unsigned 32-bit little-e long
    P - unsigned 64-bit little-e long long

    Native numbers, stored in big-endian network byte order:

    c,C - signed, unsigned 8-bit char
    s,S - signed, unsigned 16-bit "native" (big-e) short (word)
    i,I - signed, unsigned "native" int (32-bit big-e)
    l,L - signed, unsigned 32-bit "native" (big-e) long (longword)
    q,Q - signed, unsigned 64-bit "native" (big-e) long long (quadword),
          extracted into a native JavaScript number.  Note that JavaScript
          numbers are 64-bit doubles and support only 53 bits of precision.
          Larger values may lose least significant bits.

    f,d - 32-bit and 64-bit "native" big-e float and double
    G,E - 32-bit and 64-bit big-e float and double
    g,e - 32-bit and 64-bit little-e float and double

    g - 32-bit little-float
    e - 64-bit littl-e double

    s<,l<,q< - signed 16-bit, 32-bit and 64-bit little-e integers (extensions)

    Grouping extensions:

    [# ... ] - subformat inside the [ ] will be gathered into a sub-array.
               The subformat may have a non-zero repeat count, in which case
               that many sub-arrays will be extracted.  A negative count is
               ignored.  It is an error for the count to be zero.
               Eg, 'C[S2]' on [1,2,3,4,5,6] => [ 0x01, [0x0203, 0x0405] ]
               EXPERIMENTAL.

    {# ... } - extracts # objects with properties determined by the named conversion
               specifiers contained inside the `{ ... }` (default 1 object).
               A negative count is ignored.  The count must not be zero.
               Eg, '{2 a:C, x:X1, b:S}' on [1,2,3,4] => [ {a:1, b:0x0102}, {a:3, b:0304} ]
               EXPERIMENTAL.

    Position control:

    x - skip a byte (NUL-fill if packing)
    X - back up a byte
    @ - seek to absolute offset (NUL-fill if packing)

Not supported conversion specifiers (for completeness):

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

- `qunpack` does not try to emulate PHP or full PERL `unpack`.  It does borrow some of
  their syntax, but favors big-endian values and provides some non-standard extensios.

- `qunpack` supports non-standard extensions like `s<` and `{# ... }` hashes

- the `unpack` format is interpreted like PERL, where `S1L1` means one short followed by
  one long, not a short stored into property named 'L1'.  The PHP syntax would be e.g.
  `S1shortName/L1longName`, returning `{ shortName: <16 bits>, longName: <32 bits> }`.

- the `Z+#` conversion is a `qunpack` extension.  It extracts `count` (default 1)
  variable-length NUL-terminated strings from the input.

- the `[# ... ]` grouping conversion is a `qunpack` extension.  It extracts `count`
  (default 1) sub-arrays with the format contained between the brackets.
  EXPERIMENTAL.

- the `{# ... }` grouping conversion is a `qunpack` extension.  It extracts `count`
  (default 1) objects with properties according to the named formats contained between
  the braces.  EXPERIMENTAL.

- the `s<` etc little-endian conversions are a `qunpack` extension.  The two-character
  format specifiers `s<`, `l<` and `q<` read signed 16-bit, 32-bit and 64-bit integers
  from

- 64-bit integer support is limited to 53 bits, since that's the precision available
  in javascript numbers.  There is no built-in support for assembling quadword longs
  out of parts.


Change Log
----------

- 0.5.1 - fix node-v0.10 H,h hex conversion (use integer base,bound)
- 0.5.0 - full little-endian support, fix 'h' and 'H' string length
- 0.4.0 - initial version of `{# ... }` grouping, fix H conversion, add h conversion
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
- fix nested hash extraction
- fix multiple-subarray extraction
- maybe an option for the default storage-endian operating mode
- maybe `s>`, `l>`, `q>` explicit-endian short, long and quad support


Related Work
------------

- [`hipack`](https://npmjs.com/package/hipack) - php compatible pack/unpack, uses C++ extension, needs node sources to install
- [`php-pack`](https://npmjs.com/package/php-pack) - fork of `hipack`
- [`qmsgpack`](https://github.com/andrasq/node-q-msgpack) - experimental nodejs `msgpack` with related works bibliography

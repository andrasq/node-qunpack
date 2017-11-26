qunpack
=======

Simplified subset of php [`unpack()`](http://php.net/manual/en/function.unpack.php).

Currently only "native" format values are supported, where "native" is implemented as
network order (big-endian).


Api
---

### qunpack.unpack( format, bytes )

Unpack the `bytes` according to the `format` string.  Bytes can be a `Buffer` or an
array of numbers.

### qunpack.pack( format, data )

TBD.  Maybe later.


Formats
-------

TBD.  Tentatively:

    <[aA]><length> - a `length` byte string (default 1 byte)
    <CONV><count> - `count` instances of the value specified by CONV
    <[x]><counte> - skip ahead `count` bytes (NUL fill if packing)
    <[X]><count> - back up `count` bytes
    <[@]><offset> - seek to absolute position `offset` (NUL fill if packing)

Conversion specifiers:

    a - NUL-padded string
    A - SPACE-padded string

    Z - NUL-padded string

    c,C - signed, unsigned 8-bit char
    s,S - signed, unsigned 16-bit short (word)
    l,L - signed, unsigned 32-bit long (dword)
    q,Q - signed, unsigned 32-bit long long (quadword)

Maybe later:

    x - skip a byte (NUL-fill if packing)
    X - back up a byte
    @ - seek to absolute offset

    H - hex string, high nybble first
    G - 32-bit big-endian `float` (note: php specs native size)
    E - 64-bit big-endian `double` (note: php specs native size)

Unpack examples:

    "a5" - extract a 5-byte NUL-padded string


Differences
-----------

- `qunpack` does not try to emulate PHP or PERL `unpack`.  It does borrow some of
  their syntax, but it only works with big-endian values (network byte order).

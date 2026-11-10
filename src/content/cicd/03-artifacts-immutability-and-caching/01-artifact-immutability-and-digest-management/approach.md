1. Validate the expected digest against the sha256 format and throw the format error when it does not fit.
2. Lower-case both digests.
3. Compare them for equality.
4. Return the matching or the mismatch result, always with `verified` true.

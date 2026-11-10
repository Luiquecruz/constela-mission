1. Reject a malformed artifact digest with the error the challenge names.
2. Compare the statement's predicate type with the expected one.
3. Take the hexadecimal part of the artifact digest and search every subject for a matching sha256 value, ignoring case.
4. Check that the builder id is in the allowed list.
5. Return the success result only when every check passed.

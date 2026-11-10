Keep the checks in a fixed order and return at the first failure: digest, then gate, then the target, then the proof from the previous environment.
---
Find the target in the ordered list of environments. The environment just before it is the one whose verification counts; the first environment has no predecessor and needs no proof.
---
Proof is a history entry that matches on all three things: the previous environment, the `VERIFIED` status and this very digest, compared in lower case.
---
Build the patch text line by line (`images:`, the service name, the digest) and finish with a newline, so the output is exactly what the file should contain.

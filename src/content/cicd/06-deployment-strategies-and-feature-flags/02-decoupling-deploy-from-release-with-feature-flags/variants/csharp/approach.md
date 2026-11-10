1. Implement the FNV-1a hash over the bytes of `<key>:<userId>` and take it modulo 100.
2. Return the kill switch result when the kill switch is on.
3. Return the disabled result when the flag is not enabled.
4. Return the segment result when segments are listed and the user's is not among them.
5. Return the rollout result when the user's bucket is not below the rollout percentage.
6. Otherwise the flag is active.

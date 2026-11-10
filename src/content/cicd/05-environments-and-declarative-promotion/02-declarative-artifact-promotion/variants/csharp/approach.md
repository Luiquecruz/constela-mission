1. Reject a digest that is not `sha256:` plus 64 hexadecimal characters.
2. For staging, refuse when the history has a failed staging run of this digest.
3. For production, look for a verified staging run of this digest and refuse when there is none.
4. Refuse an unknown environment.
5. Otherwise return the approval for the target environment.

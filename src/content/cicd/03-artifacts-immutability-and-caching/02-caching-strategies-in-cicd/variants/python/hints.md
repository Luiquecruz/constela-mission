Filter first. Build the list of visible entries (not expired, written by the request's branch or its default branch) and do every lookup on that list, so an invisible entry can never win.
---
An entry exactly at its time to live is still valid: only `now - createdAt` strictly greater than `ttlMs` expires it.
---
The exact key beats every fallback, even a newer fallback entry. Only when no visible entry has the primary key do the restore keys come into play.
---
Try the restore keys in the order given. The first one that matches at least one visible entry decides, and among its matches the newest entry wins.

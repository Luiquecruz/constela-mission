In `closeInterceptedModal(router, historyLength, fallbackPath = '/feed')`, check `if (historyLength > 1)` to decide between `router.back()` and `router.push(fallbackPath)`.
---
Extract the photo ID when `path.startsWith('/photo/')` by taking `path.replace('/photo/', '')` and looking it up in `PHOTOS`.
---
Distinguish between soft and hard navigation on `/photo/:id`: when `navType === 'soft'`, render the `"Photo Feed"` section **plus** `<div role="dialog" aria-label={activePhoto.title}>`. When `navType === 'hard'`, render only the canonical page heading `"Canonical Photo Page: ${activePhoto.title}"` without the feed or dialog.

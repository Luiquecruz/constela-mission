In `closeInterceptedModal(router, historyLength, fallbackPath = '/feed')`, check `if (historyLength > 1)` to decide between `router.back()` and `router.push(fallbackPath)`.
---
Extract the photo ID when `path.startsWith('/photo/')` by taking `path.replace('/photo/', '')` and looking it up in `PHOTOS`.
---
Distinguish between soft and hard navigation on `/photo/:id`: when `navType === 'soft'`, render the `"Photo Feed"` `<section>` (with `inert` set while the modal is open) **plus** `<div role="dialog" aria-modal="true" aria-label={activePhoto.title}>`. Move focus into the dialog on open, trap `Tab` focus inside the dialog, close on `Escape`, and restore focus to the button that opened the modal when it closes.

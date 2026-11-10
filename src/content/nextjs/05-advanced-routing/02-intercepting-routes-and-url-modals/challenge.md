# Challenge: URL-Driven Photo Modal with Intercepting Routes

Build a photo feed that models Next.js `@modal` + `(.)photo/[id]` route interception: clicking a photo from `/feed` opens an accessible modal overlay while keeping the feed mounted behind it, whereas a hard reload on `/photo/[id]` renders the standalone canonical photo page.

## Requirements

1. Export `PHOTOS`:
   ```ts
   export const PHOTOS = [
     { id: '1', title: 'Nebula Ridge', author: 'Ada' },
     { id: '2', title: 'Orbital Dawn', author: 'Alan' },
   ];
   ```
2. Implement and export `closeInterceptedModal(router, historyLength, fallbackPath = '/feed')`:
   - If `historyLength > 1`, call `router.back()`.
   - Otherwise, call `router.push(fallbackPath)`.
3. Implement and export `<PhotoFeedApp initialPath="/feed" initialNavType="soft" />` (and export it as `default`):
   - When at `/feed`, render a heading `"Photo Feed"` and a button for each photo in `PHOTOS`: `"Open Nebula Ridge"` and `"Open Orbital Dawn"`.
   - Clicking `"Open Nebula Ridge"` (or `"Open Orbital Dawn"`) performs a **soft** navigation to `/photo/1` (or `/photo/2`):
     - Keep `"Photo Feed"` and its photo buttons mounted in the background (`@children` slot retention).
     - Render an intercepted modal with `role="dialog"` and `aria-label={photo.title}` containing the photo title, author, a `"Close modal"` button (which returns to `/feed` and closes the dialog), and a `"Simulate hard reload"` button.
   - When rendered with `initialPath="/photo/1"` and `initialNavType="hard"` (or after clicking `"Simulate hard reload"` while viewing a photo), render the canonical standalone page:
     - Render a heading `"Canonical Photo Page: Nebula Ridge"` (matching the active photo's title).
     - Do **not** render `"Photo Feed"` or any `role="dialog"` modal.
     - Include a `"Back to feed"` button that navigates back to `/feed`.

# Images, Fonts, Scripts, Styling, and Environment Variables

Shipping a fast, reliable Next.js application depends on more than server rendering alone. Unsized images cause layout jumps, external font requests delay text paint, eager third-party scripts block hydration, and misnamed environment variables can leak private database secrets directly into the browser bundle. Next.js ships built-in primitives to handle all five concerns systematically.

## `next/image`: Preventing CLS and Optimizing LCP

Raw HTML `<img>` tags ship unresized source files and leave the browser guessing image dimensions until bytes arrive, causing **Cumulative Layout Shift (CLS)** when content below jumps downward. The `<Image />` component from `next/image` solves both layout stability and responsive delivery:

- **Explicit `width` & `height` (or `fill`)**: Reserves the exact aspect-ratio box in CSS before the image downloads, eliminating CLS. Use `fill` inside a `position: relative` container when the parent layout dictates the frame.
- **`sizes` for responsive `srcset`**: Tells the browser how wide the image renders at different viewport breakpoints (e.g., `sizes="(max-width: 768px) 100vw, 50vw"`) so mobile devices do not download desktop-sized hero assets.
- **`priority` for the LCP hero image**: Marks above-the-fold hero images so Next.js injects a preload hint and skips lazy loading, directly improving **Largest Contentful Paint (LCP)**.
- **`remotePatterns` allowlist in `next.config.ts`**: External image URLs must match explicit protocol, hostname, and pathname patterns in `images.remotePatterns` so attackers cannot abuse your image optimization endpoint as an open proxy for arbitrary remote hosts.

```ts
// next.config.ts
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.constela.dev', pathname: '/media/**' },
    ],
  },
};
```

## `next/font`: Zero-CLS Self-Hosted Typography

Loading fonts via external `<link>` tags forces extra DNS, TLS, and CSS round-trips before custom glyphs render, causing a **Flash of Unstyled Text (FOUT)** or layout shift. `next/font/google` and `next/font/local` download and **self-host** font files at build time, serve them from your own origin, and automatically generate fallback font metrics (`size-adjust`) to achieve zero font CLS.

Exposing a CSS variable (`variable: '--font-sans'`) lets you attach the font to `<html>` in `app/layout.tsx` and reference `var(--font-sans)` cleanly across Tailwind CSS or CSS Modules.

## `next/script`: Controlling Third-Party Execution

Third-party analytics, chat widgets, or consent managers can stall the main thread if loaded indiscriminately. `next/script` lets you declare exact scheduling intent via `strategy`:

- **`beforeInteractive`**: Injects critical scripts (such as bot protection or polyfills) into the document `<head>` before Next.js hydration runs; valid only in the root `app/layout.tsx`.
- **`afterInteractive` (default)**: Loads immediately after the page becomes interactive—ideal for tag managers and core analytics.
- **`lazyOnload`**: Defers loading until browser idle time after all page resources finish—ideal for live chat widgets or feedback embeds.

## CSS Modules & Tailwind CSS in Server Components

Because Server Components execute on the server and stream HTML/RSC payloads, styling approaches that rely on runtime JavaScript `useContext` or dynamic style-tag injection in the browser do not work inside Server Components. Both **CSS Modules** (`Component.module.css`) and **Tailwind CSS** compile into static, zero-runtime CSS stylesheets on the server, giving Server Components scoped class names and utility classes with zero client JavaScript overhead.

## Environment Variables: `NEXT_PUBLIC_` vs. Server-Only Secrets

Environment variable naming directly controls security boundaries in Next.js:

- **Server-only variables** (such as `DATABASE_URL`, `STRIPE_SECRET_KEY`, `INTERNAL_API_TOKEN`): Accessible **only** in Server Components, Route Handlers, Server Actions, and server utilities. In Client Components, `process.env.DATABASE_URL` evaluates to `undefined`.
- **`NEXT_PUBLIC_` variables** (such as `NEXT_PUBLIC_ANALYTICS_ID`, `NEXT_PUBLIC_APP_URL`): Next.js statically **inlines** every `NEXT_PUBLIC_*` value into the client JavaScript bundle at **build time**. Never store credentials or private tokens under `NEXT_PUBLIC_`, because anyone viewing browser JS source can read them—and remember that changing a `NEXT_PUBLIC_` value requires rebuilding the client bundle.

## When to choose it

- **Use `<Image>` with `width`/`height` + `priority`** for static-aspect hero graphics above the fold, and **`fill` + `sizes`** for responsive CMS cards inside fluid aspect-ratio containers.
- **Use `next/font` with `variable`** whenever adding brand or monospace typography so font assets self-host automatically without layout shifts.
- **Use `afterInteractive` vs. `lazyOnload` in `next/script`**: Choose `afterInteractive` for primary product analytics and `lazyOnload` for non-essential widgets like customer support chat; reserve `beforeInteractive` strictly for scripts that must execute prior to hydration.
- **Use CSS Modules or Tailwind CSS** across Server Components so styles compile statically without shipping a CSS-in-JS runtime.
- **Prefix with `NEXT_PUBLIC_` only for public, non-sensitive build-time configuration** (public site URL, public analytics key); keep all secrets unprefixed and read them exclusively inside server modules.

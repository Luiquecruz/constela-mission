# Metadata API, Open Graph, and SEO Files

In a traditional React SPA, `<head>` tags are often mutated client-side after JavaScript boots, leaving search crawlers and social link unfurlers (Slack, X, LinkedIn) staring at a generic `<title>` and blank preview card. The Next.js App Router solves this natively on the server with a declarative **Metadata API** and typed file conventions for `sitemap.xml` and `robots.txt`.

## Static `metadata` and `title.template` Inheritance

Any `layout.tsx` or `page.tsx` can export a static `metadata` object. In a root `app/layout.tsx`, defining `title: { default, template }` sets both a fallback title for child routes that omit `title` and a formatting pattern (such as `'%s | Constela'`) applied whenever a child segment supplies a string `title`:

```tsx
// app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Constela Engineering',
    template: '%s | Constela',
  },
  description: 'Production architecture guides for modern web teams.',
  openGraph: {
    siteName: 'Constela',
    type: 'website',
  },
};
```

When a child `page.tsx` exports `title: 'Routing Guide'`, Next.js resolves `<title>Routing Guide | Constela</title>`. If a child route omits `title` altogether, Next.js falls back to `title.default` (`Constela Engineering`).

## Dynamic `generateMetadata({ params })` and Merging

For dynamic routes like `app/blog/[slug]/page.tsx`, static constants cannot describe every post. Export an `async function generateMetadata({ params })` instead:

```tsx
// app/blog/[slug]/page.tsx
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: 'article',
    },
  };
}
```

Two important merging rules apply across segments:

1. **Shallow merging per segment**: Child keys override matching parent keys (`description`, `openGraph`), while nested objects like `openGraph` replace or merge carefully—meaning you should explicitly include `openGraph.title` and `openGraph.description` on child pages when overriding social cards so shared `siteName` or defaults stay coherent.
2. **Automatic deduplication**: Next.js automatically deduplicates `fetch()` calls (and React `cache()` helpers) shared between `generateMetadata` and the `Page` component during the same request.

## Built-in `app/sitemap.ts` and `app/robots.ts`

Instead of hand-editing brittle XML or static text files, Next.js provides typed App Router file conventions:

- **`app/sitemap.ts`**: Exports a default function returning `MetadataRoute.Sitemap`—an array of `{ url, lastModified, changeFrequency, priority }` objects that Next.js serializes into `/sitemap.xml`.
- **`app/robots.ts`**: Exports a default function returning `MetadataRoute.Robots`—specifying `{ rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api'] }], sitemap: 'https://example.com/sitemap.xml' }` which renders `/robots.txt`.

## When to choose it

- **Static `export const metadata`**: Choose for layouts and fixed pages (`/` home, `/pricing`, `/about`) whose title and description do not depend on route parameters or database records.
- **Dynamic `generateMetadata({ params })`**: Choose for dynamic routes (`/blog/[slug]`, `/products/[id]`) where the `<title>`, `description`, and Open Graph tags must reflect fetched content.
- **Root `title: { default, template }`**: Always define this in `app/layout.tsx` so every child route inherits consistent branding automatically without duplicating `' | Brand'` in every page file.
- **Programmatic `app/sitemap.ts` & `app/robots.ts`**: Choose whenever URLs grow dynamically from a CMS or database, or when staging/private paths (`/admin`, `/preview`) must be blocked cleanly in `robots.txt`.

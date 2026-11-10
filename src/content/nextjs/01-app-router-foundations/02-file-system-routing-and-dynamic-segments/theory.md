# File-System Routing and Dynamic Segments

In the Next.js App Router, URL structure is derived directly from folder paths inside `app/`. Each folder represents a route segment, and nested folders compose nested URL segments—until a leaf folder defines a special `page.tsx` file that makes that path publicly reachable.

## Folder Conventions: Public Routes, Colocation, Private Folders, and Route Groups

Understanding what **does** and **does not** become a URL keeps large codebases clean and modular:

- **Public Routes (`page.tsx`)**: Creating `app/about/page.tsx` exposes `/about`. Creating `app/about/team/Chart.tsx` without a `page.tsx` inside `team/` does **not** expose `/about/team`. This makes **colocation** safe by default—components, utilities, and tests can live right next to the pages that use them.
- **Private Folders (`_folderName`)**: Prefixing any folder with an underscore (for example, `app/blog/_components/PostCard.tsx` or `app/_internal/page.tsx`) opts that folder and all of its subfolders out of routing completely, even if a `page.tsx` exists inside.
- **Route Groups (`(groupName)`)**: Wrapping a folder name in parentheses (for example, `app/(marketing)/pricing/page.tsx` or `app/(app)/dashboard/page.tsx`) lets you organize routes by domain or assign separate shared layouts without adding `(marketing)` or `(app)` to the URL. Both resolve cleanly to `/pricing` and `/dashboard`.

## Static, Dynamic, Catch-All, and Optional Catch-All Segments

Next.js uses bracket notation on folder names to capture variable URL segments as `params`:

| Folder Pattern | Example URL | Extracted `params` | Matches Segment Count |
| --- | --- | --- | --- |
| `app/blog/featured/page.tsx` | `/blog/featured` | `{}` | Exact static match |
| `app/blog/[slug]/page.tsx` | `/blog/app-router` | `{ slug: 'app-router' }` | Exactly 1 segment |
| `app/docs/[...slug]/page.tsx` | `/docs/a/b` | `{ slug: ['a', 'b'] }` | 1 or more segments |
| `app/shop/[[...cats]]/page.tsx` | `/shop` | `{}` | 0 or more segments |
| `app/shop/[[...cats]]/page.tsx` | `/shop/audio/mics` | `{ cats: ['audio', 'mics'] }` | 0 or more segments |

Notice the subtle difference between `[...slug]` and `[[...slug]]`:
- A **catch-all segment** (`[...slug]`) requires **at least one** segment after `/docs`, so `/docs` itself returns 404 unless `app/docs/page.tsx` also exists.
- An **optional catch-all segment** (`[[...cats]]`) also matches the parent path `/shop` with `cats` omitted (`undefined`), which means a folder cannot define both `app/shop/page.tsx` and `app/shop/[[...cats]]/page.tsx` at the same level.

## Route Precedence and Specificity

When a URL could satisfy more than one route pattern—such as `/blog/featured` matching both `app/blog/featured/page.tsx`, `app/blog/[slug]/page.tsx`, and `app/blog/[...rest]/page.tsx`—Next.js resolves routes deterministically by segment specificity from left to right:

1. **Static segments** (`featured`) have highest priority.
2. **Dynamic segments** (`[slug]`) come next.
3. **Catch-all segments** (`[...rest]`) follow.
4. **Optional catch-all segments** (`[[...rest]]`) have lowest priority.

This guarantees that curated static pages (like `/blog/featured` or `/docs/getting-started`) always win over generic dynamic fallbacks without manual route ordering.

## Common Pitfalls

- **Confusing `[...slug]` with `[[...slug]]`**: Using `[...slug]` for a root docs or store index causes `/docs` to 404 when no `app/docs/page.tsx` exists. Use `[[...slug]]` if one catch-all page should handle both the index and nested paths.
- **Expecting `(group)` names in the URL**: Route groups are purely organizational. Linking to `/(marketing)/pricing` will 404; always link to `/pricing`.
- **Two route groups resolving to the same URL**: Defining `app/(marketing)/about/page.tsx` and `app/(legal)/about/page.tsx` creates a conflict because both strip their group segment and resolve to `/about`.

## When to choose it

- **Static segments** when routes represent fixed destinations (`/pricing`, `/settings`, `/login`) for clear URLs and optimal static prerendering.
- **Dynamic segments (`[slug]`)** when a template page renders a single entity identified by one URL parameter, such as a blog post, product, or user profile.
- **Catch-all (`[...slug]`) / optional catch-all (`[[...slug]]`)** for deeply nested documentation trees, multi-level category filters, or CMS-driven arbitrary paths.
- **Route groups (`(group)`)** to partition an application into distinct layout shells (marketing site vs. authenticated workspace) without changing public URLs.

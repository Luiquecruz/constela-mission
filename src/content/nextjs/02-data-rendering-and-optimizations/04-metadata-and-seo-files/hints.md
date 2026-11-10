In `resolvePageMetadata`, resolve `const child = typeof pageMetaOrFn === 'function' ? pageMetaOrFn(context) : (pageMetaOrFn ?? {})` first.
---
For the title template: if `child.title?.trim()` is present and `typeof parentMeta.title === 'object'` with `parentMeta.title.template.includes('%s')`, compute `parentMeta.title.template.replace('%s', child.title.trim())`. Otherwise fall back to `typeof parentMeta.title === 'string' ? parentMeta.title : parentMeta.title.default`.
---
In `buildSitemap` and `buildRobots`, normalize the base URL with `baseUrl.replace(/\/+$/, '')` so neither `${cleanBase}/blog/${post.slug}` nor `${cleanBase}/sitemap.xml` ends up with double slashes.

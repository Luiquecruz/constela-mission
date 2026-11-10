Normalize `pathname` first by stripping query/hash and trailing slashes (keeping `"/"` as `"/"`). Then push the root layout layer `{ segment: '/', kind: 'layout', file: 'app/layout.tsx' }`.
---
Check `normalized === '/dashboard' || normalized.startsWith('/dashboard/')` to append the `/dashboard` layout layer followed by the `/dashboard` template layer, and finish by pushing the leaf `page` layer.
---
In `<LayoutVsTemplateDemo />`, React preserves component state when a component remains at the same position in the tree without a changing `key`, and resets state when its `key` changes. Pass `key={activePath}` to `<DashboardTemplate>` while keeping `<DashboardLayout>` unkeyed!

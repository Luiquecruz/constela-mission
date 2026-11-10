1. **Normalize the pathname**: Strip query/hash fragments (`pathname.split(/[?#]/)[0]`), trim trailing slashes (except root `"/"`), and ensure a leading slash.
2. **Assemble layers in order**:
   - Push `{ segment: '/', kind: 'layout', file: 'app/layout.tsx' }`.
   - If the path equals `'/dashboard'` or starts with `'/dashboard/'`, push `{ segment: '/dashboard', kind: 'layout', file: 'app/dashboard/layout.tsx' }` and `{ segment: '/dashboard', kind: 'template', file: 'app/dashboard/template.tsx' }`.
   - Push the leaf page `{ segment: normalized, kind: 'page', file: normalized === '/' ? 'app/page.tsx' : `app${normalized}/page.tsx` }`.
3. **Simulate layout persistence vs. template remounting**: Keep `<DashboardLayout>` mounted without a route-dependent key so its `note` and `layoutCount` state survive sibling route transitions, while giving `<DashboardTemplate key={activePath}>` a route-dependent `key` so React unmounts and remounts it cleanly on every navigation.

# Step-by-Step Approach

1. **Compare Semver Strings Accurately**:
   Split version strings like `'20.9.0'` using `.split('.').map(Number)`. Compare `[majA, minA, patA]` against `[majB, minB, patB]` from left to right:
   ```ts
   function isBelowSemver(actual: string, minimum: string): boolean {
     const a = actual.split('.').map(Number);
     const m = minimum.split('.').map(Number);
     for (let i = 0; i < 3; i++) {
       if ((a[i] ?? 0) < (m[i] ?? 0)) return true;
       if ((a[i] ?? 0) > (m[i] ?? 0)) return false;
     }
     return false;
   }
   ```

2. **Evaluate Baseline and Codemod Checks**:
   - Check `isBelowSemver(project.nodeVersion, '20.9.0')` and `isBelowSemver(project.tsVersion, '5.1.0')`.
   - Check `project.hasMiddlewareFile` and `project.syncRequestApiUsages > 0`, appending both the blocker message and the matching codemod name.

3. **Evaluate Caching and Self-Hosting Checks**:
   - Check `!project.cacheComponentsEnabled`, `project.singleArgRevalidateTags > 0`, and `project.replicas > 1 && !project.hasSharedCacheHandler`.

4. **Return Readiness Report**:
   Return `{ ready: blockers.length === 0, blockers, codemods }`.

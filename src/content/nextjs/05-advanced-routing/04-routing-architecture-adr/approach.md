# Approach: CloudStudio Routing Architecture ADR

## 1. Documenting Forces and Decision

An effective routing ADR links concrete UX and operational forces to specific App Router conventions:
- **Context** explains why a flat folder structure fails when marketing pages, authenticated console workspaces, fault-isolated billing panels, and shareable asset modals coexist.
- **Decision** commits to Route Groups for shell separation, Parallel Routes (`@slot`) with `default.tsx` guards for independent dashboard panels, and `@modal` + Intercepting Routes for dual-context asset previews.

## 2. Rejecting Inferior Alternatives

Documenting rejected options (such as query-string client modals `?assetId=123` or URL-polluting `/marketing/*` folder prefixes) prevents regressions when new engineers join the project.


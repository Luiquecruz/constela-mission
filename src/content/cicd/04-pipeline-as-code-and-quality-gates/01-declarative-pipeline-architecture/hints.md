Write one small reader per provider that returns neutral tasks, and keep the shared work (the provider lookup and the missing-dependency check) in one place after the reader ran.
---
Dependencies can be a single id or a list. Turn both into a list so the rest of the code sees one shape, and treat a missing field as an empty list.
---
Cloud Build is the odd one: with no `waitFor`, a step waits for all earlier steps, not none. Compute the ids first (a missing `id` becomes `step-<position>`) so every step can name the steps before it.
---
Read the command of a Cloud Build step as the entrypoint, or the image name when there is none, followed by the arguments. For CodeBuild, only the phases that are present become tasks, and each depends on the one before it.

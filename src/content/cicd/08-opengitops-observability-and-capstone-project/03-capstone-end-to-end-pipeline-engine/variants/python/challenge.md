The capstone joins what the course built into one release check. A release request carries everything the pipeline knows: the build tasks, the facts the quality gate reads, the identity token, the artifact with its provenance and the target environment. The orchestrator runs the stages in order and stops at the first one that fails, so the report names the stage to fix.

The building blocks of the earlier lessons are already in the file: the build order, the policy rules, the identity check, the provenance check and the promotion planner. Your job is the orchestration.

### Requirements

Complete `run_release(request, now)` in the file. `request` is a dict with `tasks`, `facts`, `rules`, `oidc`, `artifact` and `promotion`, and `now` is a Unix timestamp in seconds. A `ValueError` raised by a building block is a failed stage, not a crash. The report is a dict with `outcome`, `stage`, `passedStages`, `reasons`, `batches` and `patch`.

Run these stages in order. A stage that fails ends the run:

1. **build**: resolve the batches of the tasks. A failure (a missing dependency or a cycle) is reported with its error message.
2. **gate**: collect the messages of the failed rules. Any failed rule rejects the release, and all the messages are reported.
3. **identity**: check the token. An error (wrong issuer, wrong audience or expired token) is reported with its message; a returned problem is reported as it is.
4. **provenance**: check the artifact against its provenance. A returned problem is the reason.
5. **promotion**: plan the promotion. A returned reason rejects the release.

The report has the shape `{ outcome, stage, passedStages, reasons, batches, patch }`:

- On success: `outcome` is `RELEASED`, `stage` is `promotion`, `passedStages` lists all five stages, `reasons` is an empty list, `batches` holds the build batches and `patch` the manifest patch from the promotion planner.
- On a failure: `outcome` is `REJECTED`, `stage` is the stage that failed, `passedStages` lists the stages that passed before it, `reasons` lists the reasons of the failed stage, `patch` is `None` and `batches` holds the build batches once the build stage passed (an empty list before that).

No later stage runs after a failure: a release that fails the gate and the promotion reports only the gate.

Teams that keep their pipeline as code on different providers still want one view of it: which tasks exist, what each one depends on and which commands it runs. A pipeline normalizer reads a provider's definition and returns neutral tasks, the first step of every portable check, report or migration tool.

### Requirements

In the static class `PipelineNormalizer`, write `NeutralTask[] NormalizePipeline(string provider, JsonElement definition)`; the definition is the parsed file as a `JsonElement` and `NeutralTask(Id, Dependencies, Commands)` is declared in the file. An unsupported provider throws `ArgumentException`; a missing dependency throws `InvalidOperationException`.

Each provider has its own vocabulary:

- **github**: `{ jobs: { <id>: { needs?, steps } } }`. `needs` is a job id or a list of ids. A step contributes a command when it has `run`; steps with `uses` are ignored.
- **azure**: `{ jobs: [ { job, dependsOn?, steps } ] }`. `dependsOn` is an id or a list. A step contributes a command when it has `script`; `task` steps are ignored.
- **gcp** (Cloud Build): `{ steps: [ { id?, name, entrypoint?, args?, waitFor? } ] }`. A step without `id` is called `step-<position>`, counting from 1. A step without `waitFor` waits for **every earlier step**. `waitFor: ['-']` waits for nothing; any other list names the steps it waits for. The command is `entrypoint` (or `name` when there is no entrypoint) followed by the arguments, joined by spaces.
- **aws** (CodeBuild): `{ phases: { install?, pre_build?, build?, post_build? } }`. The task ids are the phase names that exist. They run in the fixed order install, pre_build, build, post_build, each depending on the previous phase that exists. The commands are the phase's `commands`.

Return the tasks in the order the definition lists them (for aws, in phase order), each as `{ id, dependencies, commands }`.

Fail with `Unsupported provider: <provider>` for any other provider, and with `Dependency <dep> is missing from pipeline jobs` when a task depends on an id that is not one of the tasks.

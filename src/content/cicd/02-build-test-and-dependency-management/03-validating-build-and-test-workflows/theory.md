# Validating Build and Test Workflows

A robust CI pipeline engine must resolve task execution order, optimize parallel job execution, and enforce security scan evaluation gates. Modeling pipeline execution logic in code allows developers to understand dependency resolution algorithms, job batching, and vulnerability threshold evaluation.

You need: Dependency Management and Security Scanning

## Case study

Google's testing blog describes flaky tests, which pass and fail without a change in the code, and how the company mitigates them at its scale. A flaky test is not an annoyance: it trains engineers to rerun and ignore red builds, and it hides the failures that matter. Teams respond by isolating flaky tests, running independent work in parallel and keeping the gate deterministic. A workflow is validated when its order is right and its signals can be trusted.

## DAG Task Scheduling and Parallel Batching

Complex build pipelines are modeled as Directed Acyclic Graphs (DAGs). Each task defines explicit dependencies on prior tasks (e.g., `test` depends on `compile`, `docker-build` depends on `test`).

The pipeline engine processes task DAGs using two key operations:

- **Topological Sorting**: Ordering tasks so that no task executes before its declared dependencies complete successfully.
- **Parallel Batching**: Grouping independent tasks whose dependencies have been satisfied into concurrent execution batches to minimize build duration.

Detecting cyclic dependencies (e.g., Task A depends on Task B, which depends on Task A) is essential to prevent infinite loops during pipeline scheduling.

::: github
Parallel work is not only a graph of different jobs; the same job often runs for several versions or platforms. GitHub Actions expresses that with a `strategy.matrix`, and the job that follows waits for every matrix entry:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: true
      matrix:
        node: [lts/*, current]
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: ${{ matrix.node }}
      - run: npm ci
      - run: npm test
  gate:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: echo "every matrix entry passed"
```
:::

::: azure
Azure Pipelines expresses a matrix with named entries, each one a set of variables, and `maxParallel` caps the number of simultaneous legs:

```yaml
jobs:
  - job: test
    strategy:
      matrix:
        node_lts:
          nodeVersion: lts
        node_current:
          nodeVersion: current
      maxParallel: 2
    steps:
      - script: echo "testing on Node $(nodeVersion)"
```
:::

::: aws
AWS CodeBuild declares a build matrix in a batch buildspec; it creates one build for every combination of the dynamic values:

```yaml
version: 0.2
batch:
  build-matrix:
    static:
      ignore-failure: false
    dynamic:
      env:
        variables:
          NODE_VERSION:
            - lts
            - current
```
:::

::: gcp
Google Cloud Build has no matrix. The same effect comes from repeating a step and letting the steps start together with `waitFor: ['-']`:

```yaml
steps:
  - id: test-lts
    name: node
    entrypoint: npm
    args: [test]
    waitFor: ['-']
  - id: test-current
    name: node
    entrypoint: npm
    args: [test]
    waitFor: ['-']
```
:::

## Vulnerability Gate Threshold Evaluation

Security scanners emit vulnerability reports containing detected issues categorized by severity (`low`, `medium`, `high`, `critical`).

A security quality gate evaluates scan results against organizational policy thresholds:

- **Non-Blocking Policy**: `low` and `medium` severity findings are logged for remediation without failing the pipeline.
- **Blocking Policy**: Findings meeting or exceeding the configured severity threshold (e.g., `high` or `critical`) immediately fail the quality gate, blocking artifact packaging.

::: github
The gate is the exit code of the scanner: a non-zero code stops the pipeline. With Trivy as the scanner, in GitHub Actions:

```yaml
- run: trivy image --exit-code 1 --severity HIGH,CRITICAL "$IMAGE"
```
:::

::: azure
In Azure Pipelines:

```yaml
- script: trivy image --exit-code 1 --severity HIGH,CRITICAL "$IMAGE"
  displayName: Vulnerability gate
```
:::

::: aws
In AWS CodeBuild:

```yaml
version: 0.2
phases:
  build:
    commands:
      - trivy image --exit-code 1 --severity HIGH,CRITICAL "$IMAGE"
```
:::

::: gcp
In Google Cloud Build the same command runs in a shell step:

```yaml
steps:
  - name: aquasec/trivy
    args: [image, --exit-code, "1", --severity, "HIGH,CRITICAL", IMAGE]
```
:::

## Across the platforms

Azure Pipelines has the same idea under `strategy.matrix`, with each entry a named set of variables, and `maxParallel` to cap the number of simultaneous legs. A last job with `dependsOn` plays the role of the gate. In AWS CodeBuild a build matrix is declared in a batch buildspec, and Google Cloud Build repeats a step by listing several steps that share `waitFor`.

The scan gate then reads the result of the scan job, for example the number of findings at or above the threshold, and fails the pipeline when it is not zero. Keeping that decision in one small function, as the challenge does, makes it easy to test and to reuse in every provider.

## Common mistakes

- **Allowing unresolved cyclic task dependencies**: Failing to detect dependency cycles causes pipeline scheduling deadlocks.
- **Treating critical security findings as non-blocking**: Logging security vulnerabilities without failing the pipeline allows vulnerable code into production.
- **Serializing independent tasks**: Executing independent tasks sequentially instead of in parallel artificially increases pipeline run times. Feedback slows down for every change waiting in the queue.

## In practice

Try it in a repository of your own.

1. Run the tests on two runtime versions with a matrix, or with parallel steps where your platform has no matrix.
2. Add a security scan that runs at the same time as the tests and a final step that waits for both.
3. Compare the total time with a sequential run.

The challenge schedules tasks that depend on each other and applies the gate to the scan results.

## Check yourself

1. Why are build pipelines modeled as Directed Acyclic Graphs (DAGs)?
2. How does parallel batching reduce overall pipeline execution time?
3. What criteria determine whether a security vulnerability finding blocks a pipeline execution?

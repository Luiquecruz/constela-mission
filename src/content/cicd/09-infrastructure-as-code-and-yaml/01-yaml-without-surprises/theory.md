# YAML Without Surprises

Every pipeline in this course is a YAML file, and so are Kubernetes manifests, CloudFormation templates and most tools around them. YAML looks like plain indented text, and that is exactly why it hides errors: a file can be valid and still mean something other than what the author wrote. This lesson covers the parts of YAML that pipelines use and the places where it surprises people.

You need: Capstone: the Release Check

## Case study

Version 1.1 of the YAML specification treats some plain words as booleans, so a list of country codes that contains `NO` for Norway is read as the value false by parsers that follow it. Engineers have lost data and failed deployments to this, and it is known as the Norway problem. A linter that knows the typing rules, and a habit of quoting values that must stay strings, turns that surprise into an error at review time.

## The Parts You Use Every Day

YAML has three building blocks. A **mapping** is a set of `key: value` pairs, a **sequence** is a list of items that each start with `- `, and a **scalar** is a single value: text, a number, a boolean or null. Indentation shows the nesting, with spaces only; a tab is not allowed for indentation. A pipeline is mostly mappings that contain sequences of mappings:

```yaml
name: ci
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - name: Run the tests
        run: npm test
```

Long commands use block scalars. A literal block (`|`) keeps the line breaks, which is what a shell script needs, and a folded block (`>`) joins the lines into one:

```yaml
run: |
  npm ci
  npm test
description: >
  This sentence is written on two lines
  but read as a single line.
```

A file can hold several documents separated by `---`, which Kubernetes manifests use to put a Deployment and a Service in one file, and `#` starts a comment.

::: github
In GitHub Actions the file is a workflow: mappings for the settings, a sequence for the steps and a literal block for the commands:

```yaml
name: ci
on: push
env:
  CI: "true"
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: |
          npm ci
          npm test
```
:::

::: azure
In Azure Pipelines it is `azure-pipelines.yml`:

```yaml
trigger:
  - main
pool:
  vmImage: ubuntu-latest
steps:
  - script: |
      npm ci
      npm test
    displayName: Run the tests
```
:::

::: aws
In AWS CodeBuild it is `buildspec.yml`:

```yaml
version: 0.2
phases:
  build:
    commands:
      - npm ci
      - npm test
```
:::

::: gcp
In Google Cloud Build it is `cloudbuild.yaml`:

```yaml
steps:
  - name: node
    entrypoint: npm
    args: [ci]
  - name: node
    entrypoint: npm
    args: [test]
```
:::

## Typing: Why a Value Is Not Always a String

A plain scalar is not always text. The parser looks at its shape and picks a type, so `true` is a boolean, `20` is a number and `null` is null. The same word can be read differently by two parsers: the YAML 1.2 core schema defines booleans only as `true`, `True`, `TRUE`, `false`, `False` and `FALSE`, while YAML 1.1 also treated `yes`, `no`, `on` and `off` as booleans, and yamllint documents that difference in its `truthy` rule. A tool built on a 1.1 parser reads `on: push` as the key `true`, and a country list that contains `NO` for Norway turns into `false`.

Numbers cause the quietest failures. By the float pattern of the YAML 1.2 core schema, an unquoted `3.10` is a number, and the number is 3.1, so a matrix of Python versions `[3.8, 3.9, 3.10]` asks for Python 3.1 in a parser that follows it: loading `python-version: 3.10` with PyYAML returns the number 3.1, while `"3.10"` stays a string. GitHub's own Python tutorial writes every version as a quoted string, such as `"3.10"`. Under the YAML 1.1 rules a number that starts with `0`, such as `0777`, is read as octal, which yamllint can flag with its `octal-values` rule, and YAML 1.2 writes octal as `0o777`. The rule is short: quote anything that must stay text. That is why the examples of setup actions quote their versions.

```yaml
python-version: "3.10"
node-version: "20"
enabled: "yes"
```

::: github
In GitHub Actions, quote the versions of a matrix so that `3.10` is not read as `3.1`:

```yaml
strategy:
  matrix:
    python-version: ["3.10", "3.12"]
```
:::

::: azure
In Azure Pipelines, quote the version of a task input:

```yaml
- task: UsePythonVersion@0
  inputs:
    versionSpec: "3.10"
```
:::

::: aws
In an AWS CodeBuild buildspec, quote the runtime version:

```yaml
phases:
  install:
    runtime-versions:
      python: "3.10"
```
:::

::: gcp
In Google Cloud Build, quote the value of a substitution that names a version:

```yaml
substitutions:
  _PYTHON_VERSION: "3.10"
steps:
  - name: python:${_PYTHON_VERSION}
    entrypoint: python
    args: [--version]
```
:::

## Reuse and Duplicates

Anchors let one block be defined once and used elsewhere. `&defaults` names a block, `*defaults` inserts it, and the merge key `<<` copies its pairs into another mapping, which can override some of them:

```yaml
defaults: &defaults
  retries: 2
  timeout: 10
staging:
  <<: *defaults
  timeout: 30
```

GitHub Actions documents anchors and aliases as a way to reduce repetition in workflows. The merge key `<<` comes from the YAML 1.1 draft and is not part of the 1.2 specification, so check that the tool reading your file supports it before relying on it. The YAML specification says the keys of a mapping must be unique, but many parsers accept a duplicate and keep the last value, so a repeated key is a silent override. A linter catches it before the pipeline runs.

::: github
GitHub Actions documents anchors and aliases, so a block defined once can be reused in the same workflow:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    env: &shared
      CI: "true"
      LOG_LEVEL: info
    steps:
      - run: npm test
  lint:
    runs-on: ubuntu-latest
    env: *shared
    steps:
      - run: npm run lint
```
:::

::: azure
In Azure Pipelines, the way to reuse a block is a template with parameters, which is checked by the pipeline and not only by the YAML parser:

```yaml
steps:
  - template: templates/test.yml
    parameters:
      nodeVersion: "22"
```
:::

::: aws
AWS CodeBuild does not define a reuse mechanism inside the buildspec. Share a file between projects and select it when a build starts:

```bash
aws codebuild start-build --project-name api-service --buildspec-override shared/buildspec.yml
```
:::

::: gcp
In Google Cloud Build, repeated values become substitutions with defaults:

```yaml
substitutions:
  _RETRIES: "2"
steps:
  - name: node
    entrypoint: npm
    args: [test]
    env:
      - RETRIES=${_RETRIES}
```
:::

## Linting in the Pipeline

A syntax check is not enough, because a duplicate key or an unquoted version is valid syntax. Linters such as yamllint add rules for these cases, with names such as `key-duplicates`, `truthy`, `octal-values` and `quoted-strings`, and every provider also validates its own schema: GitHub Actions reports a malformed workflow when you push it, Azure Pipelines has a YAML validation endpoint, `aws cloudformation validate-template` checks a template and Cloud Build rejects an unknown field. Run the generic linter first, because it fails in seconds and before any provider-specific check:

```yaml
- name: Lint YAML
  run: yamllint .
```

::: github
Run the generic linter first in every provider, because it fails in seconds. GitHub Actions:

```yaml
- run: python -m pip install yamllint && yamllint .
```
:::

::: azure
Azure Pipelines:

```yaml
- script: python -m pip install yamllint && yamllint .
  displayName: Lint YAML
```
:::

::: aws
AWS CodeBuild, in the buildspec:

```yaml
phases:
  pre_build:
    commands:
      - python -m pip install yamllint
      - yamllint .
```

An AWS CloudFormation template can also be checked by the service itself before it is deployed:

```bash
aws cloudformation validate-template --template-body file://template.yaml
```
:::

::: gcp
Google Cloud Build, in a step that uses a Python image:

```yaml
steps:
  - name: python
    entrypoint: bash
    args: ['-c', 'python -m pip install yamllint && yamllint .']
```
:::

## Common mistakes

- **Leaving a version number unquoted**: `3.10` is read as `3.1`, and the job installs a different runtime than the one the author asked for, usually with no error.
- **Using tabs or inconsistent indentation**: a tab is invalid, and an indentation that is off by one space moves a key into another mapping without a syntax error.
- **Repeating a key**: the parser keeps one of the two values, so a pipeline can run with a setting that was meant to be overridden.

## In practice

Try it in a repository of your own.

1. Add the linter as the first step of the pipeline.
2. Write a file with a country code `NO` and a duplicated key, and see which problems the linter reports.
3. Quote the value and remove the duplicate.

The challenge is a small linter for the rules you just met.

## Check yourself

1. Why is `python-version: 3.10` different from `python-version: "3.10"`?
2. What does a YAML 1.1 parser do with the value `no`, and how do you keep it as text?
3. Why can a duplicate key be dangerous even when the file is valid YAML?

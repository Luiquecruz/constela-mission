# YAML Without Surprises

Every pipeline in this course is a YAML file, and so are Kubernetes manifests, CloudFormation templates and most tools around them. YAML looks like plain indented text, and that is exactly why it hides errors: a file can be valid and still mean something other than what the author wrote. This lesson covers the parts of YAML that pipelines use and the places where it surprises people.

You need: Capstone: the Release Check

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

A document can hold several documents separated by `---`, which Kubernetes manifests use to put a Deployment and a Service in one file, and `#` starts a comment.

## Typing: Why a Value Is Not Always a String

A plain scalar is not always text. The parser looks at its shape and picks a type, so `true` is a boolean, `20` is a number and `null` is null. The same word can be read differently by two parsers: the YAML 1.2 core schema defines booleans only as `true`, `True`, `TRUE`, `false`, `False` and `FALSE`, while YAML 1.1 also treated `yes`, `no`, `on` and `off` as booleans, and yamllint documents that difference in its `truthy` rule. A tool built on a 1.1 parser reads `on: push` as the key `true`, and a country list that contains `NO` for Norway turns into `false`.

Numbers cause the quietest failures. By the float pattern of the YAML 1.2 core schema, an unquoted `3.10` is a number, and the number is 3.1, so a matrix of Python versions `[3.8, 3.9, 3.10]` asks for Python 3.1 in a parser that follows it: loading `python-version: 3.10` with PyYAML returns the number 3.1, while `"3.10"` stays a string. GitHub's own Python tutorial writes every version as a quoted string, such as `"3.10"`. Under the YAML 1.1 rules a number that starts with `0`, such as `0777`, is read as octal, which yamllint can flag with its `octal-values` rule, and YAML 1.2 writes octal as `0o777`. The rule is short: quote anything that must stay text. That is why the examples of setup actions quote their versions.

```yaml
python-version: "3.10"
node-version: "20"
enabled: "yes"
```

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

## Linting in the Pipeline

A syntax check is not enough, because a duplicate key or an unquoted version is valid syntax. Linters such as yamllint add rules for these cases, with names such as `key-duplicates`, `truthy`, `octal-values` and `quoted-strings`, and every provider also validates its own schema: GitHub Actions reports a malformed workflow when you push it, Azure Pipelines has a YAML validation endpoint, `aws cloudformation validate-template` checks a template and Cloud Build rejects an unknown field. Run the generic linter first, because it fails in seconds and before any provider-specific check:

```yaml
- name: Lint YAML
  run: yamllint .
```

## The Same Lint Step in Each Provider

Run the generic linter first in every provider, because it fails in seconds. GitHub Actions:

```yaml
- run: python -m pip install yamllint && yamllint .
```

Azure Pipelines:

```yaml
- script: python -m pip install yamllint && yamllint .
  displayName: Lint YAML
```

AWS CodeBuild, in the buildspec:

```yaml
phases:
  pre_build:
    commands:
      - python -m pip install yamllint
      - yamllint .
```

Google Cloud Build, in a step that uses a Python image:

```yaml
steps:
  - name: python
    entrypoint: bash
    args: ['-c', 'python -m pip install yamllint && yamllint .']
```

An AWS CloudFormation template can also be checked by the service itself before it is deployed:

```bash
aws cloudformation validate-template --template-body file://template.yaml
```

## Common mistakes

- **Leaving a version number unquoted**: `3.10` is read as `3.1`, and the job installs a different runtime than the one the author asked for, usually with no error.
- **Using tabs or inconsistent indentation**: a tab is invalid, and an indentation that is off by one space moves a key into another mapping without a syntax error.
- **Repeating a key**: the parser keeps one of the two values, so a pipeline can run with a setting that was meant to be overridden.

## In practice

A team copied a workflow from one repository to another and the Python matrix stopped installing the newest version. The matrix read `python-version: [3.9, 3.10]`, and the second entry had always been installed as 3.1, which the old runner image still provided. A YAML lint step with a rule for unquoted versions found the problem in the first run, and the fix was two pairs of quotes. The same lint step later rejected a duplicate `timeout-minutes` key that had been silently shortening a deployment job.

## Check yourself

1. Why is `python-version: 3.10` different from `python-version: "3.10"`?
2. What does a YAML 1.1 parser do with the value `no`, and how do you keep it as text?
3. Why can a duplicate key be dangerous even when the file is valid YAML?

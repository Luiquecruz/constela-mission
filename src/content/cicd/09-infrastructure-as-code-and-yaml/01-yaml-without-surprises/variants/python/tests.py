def doc(*lines):
    return "\n".join(lines)


def summary(issues):
    return [f"{issue['line']}:{issue['rule']}" for issue in issues]


@test("accepts a well-formed workflow, including an unquoted on key and list items that repeat a key")
def _():
    text = doc("name: ci", "on:", "  push:", "    branches: [main]", "jobs:", "  test:", "    steps:", "      - uses: actions/checkout@v4", "      - run: npm test", "      - run: npm run lint")
    assert mod.lint_yaml(text) == []


@test("rejects tabs for indentation and indentation that is not a multiple of two spaces")
def _():
    assert mod.lint_yaml(doc("jobs:", "\ttest: true")) == [{"line": 2, "rule": "tab-indent", "message": "Tabs are not allowed for indentation"}]
    assert mod.lint_yaml(doc("jobs:", "   test: true")) == [{"line": 2, "rule": "indent-step", "message": "Indentation must be a multiple of 2 spaces"}]


@test("reports a key that appears twice in one mapping but not the same key in different mappings")
def _():
    text = doc("jobs:", "  build:", "    runs-on: a", "    runs-on: b", "  test:", "    runs-on: a")
    assert mod.lint_yaml(text) == [{"line": 4, "rule": "duplicate-key", "message": "Duplicate key 'runs-on'"}]
    items = doc("steps:", "  - name: one", "    run: a", "  - name: two", "    run: b", "    run: c")
    assert summary(mod.lint_yaml(items)) == ["6:duplicate-key"]


@test("flags unquoted words that YAML 1.1 reads as booleans and ignores quoted ones and comments")
def _():
    text = doc("debug: yes", 'cache: "no"', "enabled: true", "verbose: Off # keep quiet", "mode: 'on'")
    assert mod.lint_yaml(text) == [
        {"line": 1, "rule": "ambiguous-boolean", "message": "Unquoted 'yes' is read as a boolean by YAML 1.1 parsers"},
        {"line": 4, "rule": "ambiguous-boolean", "message": "Unquoted 'Off' is read as a boolean by YAML 1.1 parsers"},
    ]


# beginner mistake: writing a version such as 3.10 unquoted, which a parser reads as the number 3.1
@test("asks for quotes around two-part versions under a version key")
def _():
    text = doc("python-version: 3.10", 'node-version: "20"', "go-version: 1.22", "timeout: 3.5")
    assert mod.lint_yaml(text) == [
        {"line": 1, "rule": "version-float", "message": "Quote the version '3.10' so it stays a string"},
        {"line": 3, "rule": "version-float", "message": "Quote the version '1.22' so it stays a string"},
    ]


@test("ignores blank lines and comments and lists the issues of one document in line order")
def _():
    assert mod.lint_yaml(doc("# comment", "\t# tabbed comment", "", "a: 1")) == []
    text = doc("name: ci", "debug: on", "# a comment", "jobs:", "   test:", "    steps: 1", "    steps: 2", "python-version: 3.9")
    assert summary(mod.lint_yaml(text)) == ["2:ambiguous-boolean", "5:indent-step", "7:duplicate-key", "8:version-float"]

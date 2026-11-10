using Dojo;

public static class YamlLinterTests
{
    private static string Doc(params string[] lines) => string.Join("\n", lines);

    private static string Summary(LintIssue[] issues) => string.Join(",", issues.Select(issue => $"{issue.Line}:{issue.Rule}"));

    [Test("accepts a well-formed workflow, including an unquoted on key and list items that repeat a key")]
    public static void AcceptsWellFormedWorkflow()
    {
        var text = Doc("name: ci", "on:", "  push:", "    branches: [main]", "jobs:", "  test:", "    steps:", "      - uses: actions/checkout@v4", "      - run: npm test", "      - run: npm run lint");
        Assert.Equal(0, YamlLinter.LintYaml(text).Length);
    }

    [Test("rejects tabs for indentation and indentation that is not a multiple of two spaces")]
    public static void RejectsTabsAndOddIndentation()
    {
        var tab = YamlLinter.LintYaml(Doc("jobs:", "\ttest: true"));
        Assert.Equal(new LintIssue(2, "tab-indent", "Tabs are not allowed for indentation"), tab.Single());
        var odd = YamlLinter.LintYaml(Doc("jobs:", "   test: true"));
        Assert.Equal(new LintIssue(2, "indent-step", "Indentation must be a multiple of 2 spaces"), odd.Single());
    }

    [Test("reports a key that appears twice in one mapping but not the same key in different mappings")]
    public static void ReportsDuplicateKeys()
    {
        var text = Doc("jobs:", "  build:", "    runs-on: a", "    runs-on: b", "  test:", "    runs-on: a");
        Assert.Equal(new LintIssue(4, "duplicate-key", "Duplicate key 'runs-on'"), YamlLinter.LintYaml(text).Single());
        var items = Doc("steps:", "  - name: one", "    run: a", "  - name: two", "    run: b", "    run: c");
        Assert.Equal("6:duplicate-key", Summary(YamlLinter.LintYaml(items)));
    }

    [Test("flags unquoted words that YAML 1.1 reads as booleans and ignores quoted ones and comments")]
    public static void FlagsAmbiguousBooleans()
    {
        var issues = YamlLinter.LintYaml(Doc("debug: yes", "cache: \"no\"", "enabled: true", "verbose: Off # keep quiet", "mode: 'on'"));
        Assert.Equal(2, issues.Length);
        Assert.Equal(new LintIssue(1, "ambiguous-boolean", "Unquoted 'yes' is read as a boolean by YAML 1.1 parsers"), issues[0]);
        Assert.Equal(new LintIssue(4, "ambiguous-boolean", "Unquoted 'Off' is read as a boolean by YAML 1.1 parsers"), issues[1]);
    }

    // beginner mistake: writing a version such as 3.10 unquoted, which a parser reads as the number 3.1
    [Test("asks for quotes around two-part versions under a version key")]
    public static void AsksForQuotedVersions()
    {
        var issues = YamlLinter.LintYaml(Doc("python-version: 3.10", "node-version: \"20\"", "go-version: 1.22", "timeout: 3.5"));
        Assert.Equal(2, issues.Length);
        Assert.Equal(new LintIssue(1, "version-float", "Quote the version '3.10' so it stays a string"), issues[0]);
        Assert.Equal(new LintIssue(3, "version-float", "Quote the version '1.22' so it stays a string"), issues[1]);
    }

    [Test("ignores blank lines and comments and lists the issues of one document in line order")]
    public static void IgnoresCommentsAndOrdersIssues()
    {
        Assert.Equal(0, YamlLinter.LintYaml(Doc("# comment", "\t# tabbed comment", "", "a: 1")).Length);
        var text = Doc("name: ci", "debug: on", "# a comment", "jobs:", "   test:", "    steps: 1", "    steps: 2", "python-version: 3.9");
        Assert.Equal("2:ambiguous-boolean,5:indent-step,7:duplicate-key,8:version-float", Summary(YamlLinter.LintYaml(text)));
    }
}

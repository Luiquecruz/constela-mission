using System.Text.RegularExpressions;

public record LintIssue(int Line, string Rule, string Message);

public static class YamlLinter
{
    private static readonly Regex KeyLine = new(@"^([^\s:#'""][^:]*?):(?:\s+(.*))?$");

    public static LintIssue[] LintYaml(string text)
    {
        var issues = new List<LintIssue>();
        var scopes = new List<(int Indent, HashSet<string> Keys)>();
        var lines = text.Split('\n');

        for (var index = 0; index < lines.Length; index++)
        {
            var raw = lines[index];
            var line = index + 1;
            if (raw.Trim() == "" || raw.Trim().StartsWith('#'))
            {
                continue;
            }

            var indentation = Regex.Match(raw, @"^[ \t]*").Value;
            if (indentation.Contains('\t'))
            {
                issues.Add(new LintIssue(line, "tab-indent", "Tabs are not allowed for indentation"));
                continue;
            }
            if (indentation.Length % 2 != 0)
            {
                issues.Add(new LintIssue(line, "indent-step", "Indentation must be a multiple of 2 spaces"));
            }

            var content = raw[indentation.Length..];
            var indent = indentation.Length;
            var isItem = content.StartsWith("- ", StringComparison.Ordinal);
            if (isItem)
            {
                content = content[2..].TrimStart();
                indent += 2;
            }

            var match = KeyLine.Match(content);
            if (!match.Success)
            {
                continue;
            }
            var key = match.Groups[1].Value;
            var value = Regex.Replace(match.Groups[2].Value, @"\s+#.*$", "").Trim();

            while (scopes.Count > 0 && (isItem ? scopes[^1].Indent >= indent : scopes[^1].Indent > indent))
            {
                scopes.RemoveAt(scopes.Count - 1);
            }
            if (scopes.Count == 0 || scopes[^1].Indent != indent)
            {
                scopes.Add((indent, new HashSet<string>()));
            }
            if (!scopes[^1].Keys.Add(key))
            {
                issues.Add(new LintIssue(line, "duplicate-key", $"Duplicate key '{key}'"));
            }

            if (value.StartsWith('"') || value.StartsWith('\''))
            {
                continue;
            }
            if (Regex.IsMatch(value, "^(yes|no|on|off|y|n)$", RegexOptions.IgnoreCase))
            {
                issues.Add(new LintIssue(line, "ambiguous-boolean", $"Unquoted '{value}' is read as a boolean by YAML 1.1 parsers"));
            }
            if (key.ToLowerInvariant().EndsWith("version", StringComparison.Ordinal) && Regex.IsMatch(value, @"^\d+\.\d+$"))
            {
                issues.Add(new LintIssue(line, "version-float", $"Quote the version '{value}' so it stays a string"));
            }
        }

        return issues.ToArray();
    }
}

export interface LintIssue {
  line: number;
  rule: string;
  message: string;
}

interface Scope {
  indent: number;
  keys: Set<string>;
}

const KEY_LINE = /^([^\s:#'"][^:]*?):(?:\s+(.*))?$/;

export function lintYaml(text: string): LintIssue[] {
  const issues: LintIssue[] = [];
  const scopes: Scope[] = [];

  text.split('\n').forEach((raw, index) => {
    const line = index + 1;
    if (raw.trim() === '' || raw.trim().startsWith('#')) {
      return;
    }

    const indentation = /^[ \t]*/.exec(raw)![0];
    if (indentation.includes('\t')) {
      issues.push({ line, rule: 'tab-indent', message: 'Tabs are not allowed for indentation' });
      return;
    }
    if (indentation.length % 2 !== 0) {
      issues.push({ line, rule: 'indent-step', message: 'Indentation must be a multiple of 2 spaces' });
    }

    let content = raw.slice(indentation.length);
    let indent = indentation.length;
    const isItem = content.startsWith('- ');
    if (isItem) {
      content = content.slice(2).trimStart();
      indent += 2;
    }

    const match = KEY_LINE.exec(content);
    if (!match) {
      return;
    }
    const key = match[1];
    const value = (match[2] ?? '').replace(/\s+#.*$/, '').trim();

    while (scopes.length > 0 && (isItem ? scopes[scopes.length - 1].indent >= indent : scopes[scopes.length - 1].indent > indent)) {
      scopes.pop();
    }
    if (scopes.length === 0 || scopes[scopes.length - 1].indent !== indent) {
      scopes.push({ indent, keys: new Set() });
    }
    const scope = scopes[scopes.length - 1];
    if (scope.keys.has(key)) {
      issues.push({ line, rule: 'duplicate-key', message: `Duplicate key '${key}'` });
    }
    scope.keys.add(key);

    if (value.startsWith('"') || value.startsWith("'")) {
      return;
    }
    if (/^(yes|no|on|off|y|n)$/i.test(value)) {
      issues.push({ line, rule: 'ambiguous-boolean', message: `Unquoted '${value}' is read as a boolean by YAML 1.1 parsers` });
    }
    if (key.toLowerCase().endsWith('version') && /^\d+\.\d+$/.test(value)) {
      issues.push({ line, rule: 'version-float', message: `Quote the version '${value}' so it stays a string` });
    }
  });

  return issues;
}

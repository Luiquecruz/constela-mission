YAML is the file format of almost every pipeline and cloud template, and its small traps cause real outages: a version that silently changes value, a setting that flips because of a word, a key that is defined twice and wins by accident. Write a linter that finds the most common ones in a text.

### Requirements

Write `lint_yaml(text: str) -> list`, which returns a list of dicts with `line`, `rule` and `message`.

Process the text line by line, counting lines from 1. Skip blank lines and lines whose first non-space character is `#`.

Each issue has the line number, a rule name and a message. Check, for each line, in this order:

1. **tab-indent**: the indentation contains a tab. Message `Tabs are not allowed for indentation`. Skip the other checks for this line.
2. **indent-step**: the indentation is not a multiple of 2 spaces. Message `Indentation must be a multiple of 2 spaces`. The line still goes through the checks below.

A line that starts with `- ` is a list item: its content starts a new mapping, two columns further in. A key line is `key: value` or `key:` (a key that does not start with a quote). Take the value without a trailing comment (` #` and what follows) and trimmed. For a key line:

3. **duplicate-key**: the same key already appeared in the same mapping. Message `Duplicate key '<key>'`. A mapping ends when a line with less indentation arrives, and every list item starts a fresh mapping, so the same key in different jobs or different list items is fine.
4. Skip the next two checks when the value starts with a quote.
5. **ambiguous-boolean**: the value is `yes`, `no`, `on`, `off`, `y` or `n` in any letter case. Message `Unquoted '<value>' is read as a boolean by YAML 1.1 parsers`.
6. **version-float**: the key ends in `version` (any letter case) and the value looks like `digits.digits`. Message `Quote the version '<value>' so it stays a string`.

Return the issues in the order they were found.

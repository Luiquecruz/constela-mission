import re

KEY_LINE = re.compile(r"^([^\s:#'\"][^:]*?):(?:\s+(.*))?$")


def lint_yaml(text: str) -> list:
    issues = []
    scopes = []

    for index, raw in enumerate(text.split("\n")):
        line = index + 1
        if raw.strip() == "" or raw.strip().startswith("#"):
            continue

        indentation = re.match(r"^[ \t]*", raw).group(0)
        if "\t" in indentation:
            issues.append({"line": line, "rule": "tab-indent", "message": "Tabs are not allowed for indentation"})
            continue
        if len(indentation) % 2 != 0:
            issues.append({"line": line, "rule": "indent-step", "message": "Indentation must be a multiple of 2 spaces"})

        content = raw[len(indentation):]
        indent = len(indentation)
        is_item = content.startswith("- ")
        if is_item:
            content = content[2:].lstrip()
            indent += 2

        match = KEY_LINE.match(content)
        if not match:
            continue
        key = match.group(1)
        value = re.sub(r"\s+#.*$", "", match.group(2) or "").strip()

        while scopes and (scopes[-1]["indent"] >= indent if is_item else scopes[-1]["indent"] > indent):
            scopes.pop()
        if not scopes or scopes[-1]["indent"] != indent:
            scopes.append({"indent": indent, "keys": set()})
        scope = scopes[-1]
        if key in scope["keys"]:
            issues.append({"line": line, "rule": "duplicate-key", "message": f"Duplicate key '{key}'"})
        scope["keys"].add(key)

        if value.startswith('"') or value.startswith("'"):
            continue
        if re.fullmatch(r"(?i)yes|no|on|off|y|n", value):
            issues.append({"line": line, "rule": "ambiguous-boolean", "message": f"Unquoted '{value}' is read as a boolean by YAML 1.1 parsers"})
        if key.lower().endswith("version") and re.fullmatch(r"\d+\.\d+", value):
            issues.append({"line": line, "rule": "version-float", "message": f"Quote the version '{value}' so it stays a string"})

    return issues

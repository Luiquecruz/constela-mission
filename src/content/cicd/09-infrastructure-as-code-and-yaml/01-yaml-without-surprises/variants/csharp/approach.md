1. Split the text into lines and skip blank and comment lines.
2. Report tab indentation and stop for that line, then report an odd indentation.
3. Detect a list item and compute the indentation of its key.
4. Match a key line and cut the comment off its value.
5. Open or reuse the mapping for that indentation and report a repeated key.
6. Unless the value is quoted, report an ambiguous boolean and an unquoted version.

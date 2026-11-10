Work one line at a time and keep a stack of mappings, each with its indentation and the keys seen so far. A line with less indentation closes the deeper mappings.
---
Check the tab first and stop for that line: a tab makes the indentation meaningless, so the other checks would only add noise. The odd indentation is different, the line still counts for the other rules.
---
A list item such as `- name: one` starts a mapping whose keys sit two columns after the dash, and each new item starts a new one, which is why two items may both have a `run` key.
---
Remove a trailing comment from the value before testing it, and test the quoted case first: a quoted value is a string and must be left alone.

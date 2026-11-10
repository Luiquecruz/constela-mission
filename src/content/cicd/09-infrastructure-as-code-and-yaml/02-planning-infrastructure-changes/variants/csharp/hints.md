Start with the order. A function that returns the ids so that each resource follows its dependencies is used twice: forward for creating and updating, backward for deleting.
---
Compare properties as maps: a key present on one side only is a difference, just like a key with a different value.
---
A difference in an immutable property means the resource cannot be edited in place. The tool has to create a new one and remove the old one, which a plan shows as a replacement.
---
Deletes come last and go backwards: a resource must be deleted before the resources it depends on, otherwise the cloud refuses because something still uses it.

Turn the list of actions into one kind first. A replacement is two actions, a delete and a create, and the tool lists them in a different order depending on whether the new resource is created before the old one is destroyed.
---
Ignore `no-op` and `read` entirely, and do not count them. Everything else is counted, and anything you do not recognize is an error, never a silent pass.
---
A resource that is deleted has nothing left to tag or expose, so the tag and public access rules only look at changes that leave a resource behind.
---
Rejections and approvals are different severities. A missing tag or an open resource is a rule violation that blocks the plan, while destroying a protected resource only needs a person to say yes.

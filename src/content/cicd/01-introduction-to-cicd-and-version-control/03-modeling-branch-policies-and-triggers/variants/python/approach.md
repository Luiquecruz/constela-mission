1. Start an empty list of violations.
2. Check that the target branch is allowed.
3. Check that the branch name starts with an allowed prefix.
4. Compare the number of changed files with the maximum.
5. Compare the number of approvals with the minimum.
6. Return the list, with approval only when it is empty.

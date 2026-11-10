1. Keep the entries that are not expired and belong to the request's branch or default branch.
2. Look for visible entries with the primary key and return the newest one as an exact hit.
3. For each restore key in order, collect the visible entries whose key starts with it.
4. Return the newest entry of the first non-empty collection as a fallback hit.
5. Return the miss result when nothing matched.

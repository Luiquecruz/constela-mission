1. Start an empty list of violations.
2. Compare the line coverage with the minimum and add the coverage message when it is lower.
3. Convert the threshold to its rank.
4. Walk the vulnerabilities in order and add a message for each one whose rank reaches the threshold.
5. Return the list, approving the build only when it is empty.

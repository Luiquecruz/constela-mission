1. Return the "No commits recorded" result when the list is empty.
2. Sort the commits by timestamp.
3. Measure the gap between each pair of neighbours and keep the largest.
4. Measure the gap between the last commit and `now`, and keep it if it is larger.
5. Convert the largest gap to hours and round it to two decimals.
6. Compare it with the threshold and return the matching result.

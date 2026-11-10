Handle the empty history first: there is no gap to measure, so the result is not compliant with a gap of zero.
---
Sort a copy of the commits by timestamp. Gaps only make sense between neighbours in time, and the input can arrive in any order.
---
The history does not end at the last commit: the time between the last commit and `now` is a gap too, and often the largest one.
---
Convert the largest gap from milliseconds to hours, round it to two decimals, and compare with `>`: a gap equal to the threshold is still compliant.

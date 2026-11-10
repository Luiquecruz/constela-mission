This lesson has two small functions. Write the scheduler as rounds of ready tasks and the scan gate as a rank comparison; they share nothing but the pipeline they belong to.
---
In the scheduler, report a missing dependency before anything else, then build batches in rounds. A round that finds nothing ready while tasks remain means a cycle.
---
Tasks in the same batch keep the order they had in the input list.
---
In the gate, convert both severities to ranks. The result is `false` as soon as one vulnerability has a rank greater than or equal to the threshold, and `true` for an empty scan.

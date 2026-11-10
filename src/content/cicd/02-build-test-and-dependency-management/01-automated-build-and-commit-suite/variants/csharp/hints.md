Check every dependency id against the list of tasks before scheduling anything: a missing id is a configuration error, and it has to be reported even when the graph also contains a cycle.
---
Build the batches in rounds. In each round, take every remaining task whose dependencies all finished in earlier rounds, in the order the tasks were given.
---
If a round finds no ready task while tasks remain, nothing can ever become ready: the remaining tasks wait on each other. That is the cycle, including a task that waits on itself.
---
Mark the tasks of a round as finished only after the whole round was chosen, so that two tasks in the same batch never depend on each other.

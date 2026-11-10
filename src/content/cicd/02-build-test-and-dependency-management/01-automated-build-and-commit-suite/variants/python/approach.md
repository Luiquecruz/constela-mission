1. Index the tasks by id and verify that every dependency exists.
2. Keep the list of tasks still to run and the set of finished ids.
3. In each round, collect the tasks whose dependencies are all finished.
4. If the round is empty while tasks remain, fail with the cycle error.
5. Record the batch, mark its tasks as finished and remove them from the list.
6. Return the batches when no task remains.

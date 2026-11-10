1. Validate that every dependency refers to a task in the list.
2. Repeat: pick every task whose dependencies are done, record them as a batch, mark them done.
3. Stop with the cycle error when a round picks nothing while tasks remain.
4. Map each severity name to a rank.
5. Return `false` when any vulnerability reaches the threshold rank, `true` otherwise.

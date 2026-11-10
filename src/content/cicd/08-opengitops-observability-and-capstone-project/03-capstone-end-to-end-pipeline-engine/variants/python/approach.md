1. Start with no passed stages and no batches.
2. Run the build stage, turning an error into a rejection, and record the batches.
3. Run the gate and reject with every failed rule.
4. Run the identity check, turning an error or a returned problem into a rejection.
5. Run the provenance check, then the promotion planner, rejecting on any problem.
6. Return the released report with the five stages, the batches and the patch.

export interface BuildTask {
  id: string;
  dependencies: string[];
  command: string;
}

export function resolveBuildOrder(tasks: BuildTask[]): string[][] {
  const taskMap = new Map<string, BuildTask>();
  for (const task of tasks) {
    taskMap.set(task.id, task);
  }

  for (const task of tasks) {
    for (const dep of task.dependencies) {
      if (!taskMap.has(dep)) {
        throw new Error(`Missing dependency: ${dep}`);
      }
    }
  }

  let remaining = [...tasks];
  const completed = new Set<string>();
  const batches: string[][] = [];

  while (remaining.length > 0) {
    const batch: string[] = [];
    for (const task of remaining) {
      if (task.dependencies.every((dep) => completed.has(dep))) {
        batch.push(task.id);
      }
    }

    if (batch.length === 0) {
      throw new Error("Cyclic dependency detected");
    }

    batches.push(batch);
    for (const id of batch) {
      completed.add(id);
    }
    remaining = remaining.filter((task) => !completed.has(task.id));
  }

  return batches;
}

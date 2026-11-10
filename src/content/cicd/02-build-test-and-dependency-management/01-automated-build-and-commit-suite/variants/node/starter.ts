export interface BuildTask {
  id: string;
  dependencies: string[];
  command: string;
}

export function resolveBuildOrder(tasks: BuildTask[]): string[][] {
  // TODO: Resolve DAG tasks into topological execution batches
  return [];
}

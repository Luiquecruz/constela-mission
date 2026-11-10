export interface BuildTask {
  id: string;
  name: string;
  dependencies: string[];
}

export type Severity = "low" | "medium" | "high" | "critical";

export interface Vulnerability {
  id: string;
  severity: Severity;
  package: string;
}

const SEVERITY_RANK: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export function scheduleDagTasks(tasks: BuildTask[]): string[][] {
  const taskMap = new Map<string, BuildTask>();
  for (const t of tasks) taskMap.set(t.id, t);

  for (const t of tasks) {
    for (const dep of t.dependencies) {
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
    for (const t of remaining) {
      if (t.dependencies.every((dep) => completed.has(dep))) {
        batch.push(t.id);
      }
    }

    if (batch.length === 0) {
      throw new Error("Cyclic dependency detected");
    }

    batches.push(batch);
    for (const id of batch) completed.add(id);
    remaining = remaining.filter((t) => !completed.has(t.id));
  }

  return batches;
}

export function evaluateScanResults(
  vulnerabilities: Vulnerability[],
  threshold: Severity
): boolean {
  const thresholdRank = SEVERITY_RANK[threshold];
  return !vulnerabilities.some((v) => SEVERITY_RANK[v.severity] >= thresholdRank);
}

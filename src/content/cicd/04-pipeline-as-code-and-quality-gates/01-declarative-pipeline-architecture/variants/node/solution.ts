export type Provider = 'github' | 'azure' | 'gcp' | 'aws';

export interface NeutralTask {
  id: string;
  dependencies: string[];
  commands: string[];
}

const toList = (value: unknown): string[] => (value === undefined ? [] : Array.isArray(value) ? value : [value as string]);

const commandsOf = (steps: Array<Record<string, string>> | undefined, key: string): string[] =>
  (steps ?? []).flatMap((step) => (step[key] === undefined ? [] : [step[key]]));

function fromGithub(definition: any): NeutralTask[] {
  return Object.entries<any>(definition.jobs).map(([id, job]) => ({ id, dependencies: toList(job.needs), commands: commandsOf(job.steps, 'run') }));
}

function fromAzure(definition: any): NeutralTask[] {
  return definition.jobs.map((job: any) => ({ id: job.job, dependencies: toList(job.dependsOn), commands: commandsOf(job.steps, 'script') }));
}

function fromGcp(definition: any): NeutralTask[] {
  const steps: any[] = definition.steps;
  const ids = steps.map((step, index) => step.id ?? `step-${index + 1}`);
  return steps.map((step, index) => {
    const waitFor: string[] | undefined = step.waitFor;
    const dependencies = waitFor === undefined ? ids.slice(0, index) : waitFor.includes('-') ? [] : waitFor;
    return { id: ids[index], dependencies, commands: [[step.entrypoint ?? step.name, ...(step.args ?? [])].join(' ')] };
  });
}

function fromAws(definition: any): NeutralTask[] {
  const present = ['install', 'pre_build', 'build', 'post_build'].filter((phase) => definition.phases[phase] !== undefined);
  return present.map((phase, index) => ({ id: phase, dependencies: index === 0 ? [] : [present[index - 1]], commands: definition.phases[phase].commands ?? [] }));
}

const READERS: Record<Provider, (definition: any) => NeutralTask[]> = { github: fromGithub, azure: fromAzure, gcp: fromGcp, aws: fromAws };

export function normalizePipeline(provider: string, definition: unknown): NeutralTask[] {
  if (!Object.hasOwn(READERS, provider)) {
    throw new Error(`Unsupported provider: ${provider}`);
  }
  const tasks = READERS[provider as Provider](definition);
  const ids = new Set(tasks.map((task) => task.id));
  for (const task of tasks) {
    for (const dependency of task.dependencies) {
      if (!ids.has(dependency)) {
        throw new Error(`Dependency ${dependency} is missing from pipeline jobs`);
      }
    }
  }
  return tasks;
}

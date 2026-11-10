export type Provider = 'github' | 'azure' | 'gcp' | 'aws';

export interface NeutralTask {
  id: string;
  dependencies: string[];
  commands: string[];
}

export function normalizePipeline(provider: string, definition: unknown): NeutralTask[] {
  // TODO: reject a provider other than github, azure, gcp and aws.
  // TODO: GitHub jobs use `needs` and `run` steps; Azure jobs use `dependsOn` and `script` steps.
  // TODO: Cloud Build steps wait for every earlier step unless `waitFor` says otherwise; CodeBuild phases run one after another.
  // TODO: fail when a task depends on an id that is not in the pipeline.
  return [];
}

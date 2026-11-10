export interface PolicyRule {
  id: string;
  field: string;
  operator: string;
  value: number | string | string[];
  message: string;
}

export type PolicyFacts = Record<string, number | string>;

export interface PolicyFailure {
  ruleId: string;
  message: string;
}

export interface PolicyOutcome {
  allowed: boolean;
  failures: PolicyFailure[];
}

export function evaluatePolicy(rules: PolicyRule[], facts: PolicyFacts): PolicyOutcome {
  // TODO: reject any operator other than gte, lte, eq and in before evaluating anything.
  // TODO: a rule fails when its fact is missing or the comparison is false; collect the failures in rule order.
  return { allowed: true, failures: [] };
}

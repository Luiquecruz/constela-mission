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

const OPERATORS: Record<string, (fact: number | string, value: PolicyRule['value']) => boolean> = {
  gte: (fact, value) => Number(fact) >= Number(value),
  lte: (fact, value) => Number(fact) <= Number(value),
  eq: (fact, value) => fact === value,
  in: (fact, value) => Array.isArray(value) && value.includes(String(fact)),
};

export function evaluatePolicy(rules: PolicyRule[], facts: PolicyFacts): PolicyOutcome {
  for (const rule of rules) {
    if (!Object.hasOwn(OPERATORS, rule.operator)) {
      throw new Error(`Unsupported operator: ${rule.operator}`);
    }
  }

  const failures: PolicyFailure[] = [];
  for (const rule of rules) {
    const known = Object.hasOwn(facts, rule.field);
    if (!known || !OPERATORS[rule.operator](facts[rule.field], rule.value)) {
      failures.push({ ruleId: rule.id, message: rule.message });
    }
  }
  return { allowed: failures.length === 0, failures };
}

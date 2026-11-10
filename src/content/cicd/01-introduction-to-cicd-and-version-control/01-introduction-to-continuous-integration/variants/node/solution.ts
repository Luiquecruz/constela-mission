export interface CommitEntry {
  hash: string;
  timestamp: number;
}

export interface CiEvaluationResult {
  compliant: boolean;
  maxGapHours: number;
  reason: string;
}

export function evaluateCommitFrequency(
  commits: CommitEntry[],
  maxIntervalHours: number,
  now: number
): CiEvaluationResult {
  if (commits.length === 0) {
    return {
      compliant: false,
      maxGapHours: 0,
      reason: "No commits recorded",
    };
  }

  const sorted = [...commits].sort((a, b) => a.timestamp - b.timestamp);
  let maxGapMs = 0;

  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i].timestamp - sorted[i - 1].timestamp;
    if (gap > maxGapMs) maxGapMs = gap;
  }

  const lastGap = now - sorted[sorted.length - 1].timestamp;
  if (lastGap > maxGapMs) maxGapMs = lastGap;

  const maxGapHours = Math.round((maxGapMs / 3600000) * 100) / 100;

  if (maxGapHours > maxIntervalHours) {
    return {
      compliant: false,
      maxGapHours,
      reason: "Commit gap exceeds threshold",
    };
  }

  return {
    compliant: true,
    maxGapHours,
    reason: "Commit frequency satisfies CI policy",
  };
}

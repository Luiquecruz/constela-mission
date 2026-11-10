import { describe, expect, it } from 'vitest';
import { LANGUAGES } from '../content/languages';
import type { Lesson } from '../content/types';
import { nodeAdapter } from '../engines/node/adapter';
import { TEST_FILES } from '../engines/testFiles';
import { defineChallengeSuite } from './challengeSuite';
import { csharpGrader, frameworkGrader, pythonGrader } from './graders';
import { datedIn } from './noDates';
import { createTrackStandards, languageOf, testNamesOf, variantViolations, type Violation } from './trackStandards';

/**
 * Verification of the CI/CD track: the shared content standards (theory template, quiz, concepts, resources, no dates, no bridges) and,
 * through the engine of each language the learner can choose, every challenge's solution passing and starter failing.
 */

const TRACK_ID = 'cicd';
/** Lessons whose challenge still ships fewer languages than the track offers; an entry whose lesson became complete fails the suite. */
const PENDING_LANGUAGES: ReadonlyMap<string, readonly string[]> = new Map();
/** Official documentation, specifications and primary engineering references the track cites. */
const RESOURCE_HOSTS = new Set([
  'dora.dev', 'martinfowler.com', 'trunkbaseddevelopment.com', 'docs.github.com', 'github.com', 'owasp.org', 'sre.google', 'nx.dev',
  'docs.docker.com', 'www.openpolicyagent.org', 'docs.sonarsource.com', 'kubernetes.io', 'opengitops.dev', 'argo-cd.readthedocs.io',
  'argo-rollouts.readthedocs.io', 'istio.io', 'spiffe.io', 'slsa.dev', 'docs.sigstore.dev', 'learn.microsoft.com', 'docs.aws.amazon.com', 'yaml.org', 'yamllint.readthedocs.io', 'developer.hashicorp.com', 'docs.cloud.google.com',
]);
const BRIDGE =
  /^## Coming from\b|\b(?:[Ii]f|[Ww]hen) you (?:know|come from|are used to|have used) (?:PHP|Java|Python|C#|Ruby|Go|JavaScript)(?![\w#])|\bPHP\b|[Mm]agento|\bLaravel\b|\bSymfony\b/m;
/** A word that belongs to one language: a camelCase or snake_case identifier, or the verb one language uses for errors. */
const LANGUAGE_SPECIFIC_WORD = /\b[a-z][a-z0-9]*[A-Z][A-Za-z0-9]*\b|\b[a-z0-9]+_[a-z0-9_]+\b|\b(?:throws|raises)\b/;

const standards = createTrackStandards({
  trackId: TRACK_ID,
  resourceHosts: RESOURCE_HOSTS,
  extraTags: ['core', 'capstone'],
  bridge: BRIDGE,
  theoryWordLimits: (moduleNumber) => (moduleNumber === 1 ? [300, 1000] : [300, 1300]),
});
const { track, modules, eachLesson } = standards;

/** A learner who switches language meets the same lesson: every variant declares the same test names, in the same order. */
function sameTestsViolations(lesson: Lesson): Violation[] {
  const [first, ...others] = lesson.variants;
  if (!first) {
    return [];
  }
  const expected = testNamesOf(first).join('\n');
  return others
    .filter((challenge) => testNamesOf(challenge).join('\n') !== expected)
    .map((challenge) => ({ rule: 'same-tests', detail: `[${languageOf(challenge)}] declares different test names or order than [${languageOf(first)}]` }));
}

/** Test names describe behavior in plain words, so the same name reads naturally in every language. */
function neutralNameViolations(lesson: Lesson): Violation[] {
  return lesson.variants.flatMap((challenge) =>
    testNamesOf(challenge)
      .filter((name) => LANGUAGE_SPECIFIC_WORD.test(name))
      .map((name) => ({ rule: 'test-name-neutral', detail: `[${languageOf(challenge)}] "${name}" names "${LANGUAGE_SPECIFIC_WORD.exec(name)?.[0]}"` })),
  );
}

const challengeViolations = (lesson: Lesson): Violation[] => [
  ...lesson.variants.flatMap(variantViolations),
  ...sameTestsViolations(lesson),
  ...neutralNameViolations(lesson),
];

const violationsOf = (lesson: Lesson): Violation[] => [...standards.violationsOf(lesson), ...challengeViolations(lesson)];

describe('cicd track', () => {
  it('offers Node.js first, only languages whose test file has a beginner-mistake marker, and numbers its required modules consecutively from 01', () => {
    expect(track!.languages).toEqual(['node', 'python', 'csharp']);
    expect(track!.languages.filter((language) => !TEST_FILES[LANGUAGES[language].engine].marker)).toEqual([]);
    expect(modules.map((module) => module.number)).toEqual(modules.map((_, index) => index + 1));
    expect(modules.filter((module) => module.optional)).toEqual([]);
  });

  it('carries no dates and no language bridges in the track and module texts', () => {
    const texts = [`${track!.title}\n${track!.description}\n${track!.version}`, ...modules.map((module) => `${module.title}\n${module.description}`)];
    expect(texts.filter((text) => datedIn(text) !== undefined || BRIDGE.test(text))).toEqual([]);
  });

  it('lists as pending only lessons that still miss a language', () => {
    const complete = [...PENDING_LANGUAGES.keys()].filter((key) => {
      const lesson = eachLesson.find(([lessonKey]) => lessonKey === key)?.[1];
      return lesson !== undefined && lesson.variants.length === track!.languages.length;
    });
    expect(complete).toEqual([]);
  });

  it.each(eachLesson)('%s ships its challenge, if any, in every language of the track, each graded by its own engine', (key, lesson) => {
    const languages = PENDING_LANGUAGES.get(key) ?? track!.languages;
    const expected = lesson.hasChallenge ? languages.map((language) => [language, LANGUAGES[language].engine]) : [];
    expect(lesson.variants.map((challenge) => [challenge.language, challenge.engine])).toEqual(expected);
  });

  it.each(eachLesson)('%s follows the content standards', (_, lesson) => {
    expect(violationsOf(lesson).map(({ rule, detail }) => `${rule}: ${detail}`)).toEqual([]);
  });
});

defineChallengeSuite(TRACK_ID, frameworkGrader(nodeAdapter), 'node');
defineChallengeSuite(TRACK_ID, pythonGrader(), 'python');
defineChallengeSuite(TRACK_ID, csharpGrader(), 'csharp');

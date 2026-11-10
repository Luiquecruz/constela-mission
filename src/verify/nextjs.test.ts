import { describe, expect, it } from 'vitest';
import { trackById } from '../content/allContent';
import { reactAdapter } from '../engines/react/adapter';
import { TEST_FILES } from '../engines/testFiles';
import { defineChallengeSuite } from './challengeSuite';
import { frameworkGrader } from './graders';
import { datedIn, datedTextsOf } from './noDates';

const TRACK_ID = 'nextjs';
const RESOURCE_HOSTS = new Set([
  'nextjs.org',
  'react.dev',
  'developer.mozilla.org',
  'web.dev',
  'opentelemetry.io',
  'adr.github.io',
  'cognitect.com',
  'datatracker.ietf.org',
  'www.rfc-editor.org',
  'w3c.github.io',
  'www.w3.org',
]);

const track = trackById.get(TRACK_ID);
const modules = track?.modules ?? [];
const lessons = track?.lessons ?? [];

describe('nextjs track standards', () => {
  it('declares the react engine and eight consecutive required modules', () => {
    expect(track).toBeDefined();
    expect(track!.engine).toBe('react');
    expect(modules.map((module) => module.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(modules.filter((module) => module.optional)).toEqual([]);
    expect(lessons.length).toBe(35);
  });

  it('carries no dated or changelog wording in track and module metadata', () => {
    const texts = [
      `${track!.title}\n${track!.description}\n${track!.version}`,
      ...modules.map((module) => `${module.title}\n${module.description}`),
    ];
    expect(texts.filter((text) => datedIn(text) !== undefined)).toEqual([]);
  });

  it.each(lessons.map((lesson) => [lesson.key, lesson] as const))('%s follows the Next.js track standards', (_, lesson) => {
    expect(datedTextsOf(lesson)).toEqual([]);
    expect(lesson.theory).toContain('## When to choose it');
    expect(lesson.concepts.length).toBeGreaterThanOrEqual(4);
    expect(lesson.concepts.length).toBeLessThanOrEqual(6);
    lesson.concepts.forEach((concept) => {
      expect(typeof concept.term).toBe('string');
      expect(concept.term.trim().length).toBeGreaterThan(0);
      expect(typeof concept.description).toBe('string');
      expect(concept.description.trim().length).toBeGreaterThan(10);
      expect(concept.description.trim().endsWith('.')).toBe(true);
    });
    expect(lesson.quiz.length).toBeGreaterThanOrEqual(4);
    expect(lesson.quiz.length).toBeLessThanOrEqual(5);
    lesson.quiz.forEach((question) => {
      expect(question.options.length).toBe(4);
      expect(new Set(question.options).size).toBe(4);
      expect(question.explanation.trim().length).toBeGreaterThan(40);
    });
    expect(lesson.resources.length).toBeGreaterThanOrEqual(2);
    expect(lesson.resources.length).toBeLessThanOrEqual(4);
    lesson.resources.forEach(({ url }) => {
      expect(URL.canParse(url)).toBe(true);
      expect(url.startsWith('https://')).toBe(true);
      expect(RESOURCE_HOSTS.has(new URL(url).hostname)).toBe(true);
    });
    if (lesson.challenge) {
      const testNames = TEST_FILES[lesson.challenge.engine].listTestNames(lesson.challenge.tests);
      expect(testNames.length).toBeGreaterThanOrEqual(3);
      expect(testNames.length).toBeLessThanOrEqual(6);
      expect(lesson.challenge.hints.length).toBeGreaterThanOrEqual(2);
      expect(lesson.challenge.hints.length).toBeLessThanOrEqual(4);
    }
  });
});

defineChallengeSuite(TRACK_ID, frameworkGrader(reactAdapter));


import { describe, expect, it } from 'vitest';
import { providersIn, selectProviderBlocks } from './providerBlocks';

const SOURCE = ['Intro.', '', '::: github', 'GitHub text', '', '```yaml', 'on: push', '```', ':::', '', '::: azure', 'Azure text', ':::', '', 'Outro.', ''].join('\n');

describe('selectProviderBlocks', () => {
  it('keeps only the chosen provider block, unwrapped', () => {
    const result = selectProviderBlocks(SOURCE, 'azure');
    expect(result).toContain('Azure text');
    expect(result).not.toContain('GitHub text');
    expect(result).not.toContain(':::');
    expect(result).toContain('Intro.');
    expect(result).toContain('Outro.');
  });

  it('keeps code fences of the chosen block intact', () => {
    expect(selectProviderBlocks(SOURCE, 'github')).toContain('```yaml\non: push\n```');
  });

  it('keeps every block when no provider is chosen', () => {
    const result = selectProviderBlocks(SOURCE, undefined);
    expect(result).toContain('GitHub text');
    expect(result).toContain('Azure text');
  });
});

describe('selectProviderBlocks with fenced samples', () => {
  const FENCED = ['::: github', 'Sample:', '', '```text', ':::', 'still inside the github block', '```', ':::', '', '::: azure', 'Azure text', ':::', ''].join('\n');

  it('does not end a block at a bare delimiter inside a code fence', () => {
    const azure = selectProviderBlocks(FENCED, 'azure');
    expect(azure).toContain('Azure text');
    expect(azure).not.toContain('still inside the github block');
    expect(selectProviderBlocks(FENCED, 'github')).toContain('still inside the github block');
  });
});

describe('providersIn', () => {
  it('lists the providers with a block, once each', () => {
    expect(providersIn(`${SOURCE}\n::: github\nmore\n:::\n`)).toEqual(['github', 'azure']);
    expect(providersIn('plain text')).toEqual([]);
  });
});

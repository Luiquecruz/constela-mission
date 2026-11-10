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

describe('providersIn', () => {
  it('lists the providers with a block, once each', () => {
    expect(providersIn(`${SOURCE}\n::: github\nmore\n:::\n`)).toEqual(['github', 'azure']);
    expect(providersIn('plain text')).toEqual([]);
  });
});

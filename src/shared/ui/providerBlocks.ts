const BLOCK = /^::: ([a-z][a-z0-9-]*)[ \t]*\n([\s\S]*?)^:::[ \t]*$\n?/gm;

/**
 * Keeps the `::: <id>` blocks of the chosen provider (unwrapped) and drops the others; without a choice every block is kept.
 */
export function selectProviderBlocks(source: string, provider: string | undefined): string {
  return source.replace(BLOCK, (_block, id: string, body: string) => (provider === undefined || id === provider ? body : ''));
}

/**
 * The provider ids that have a `::: <id>` block in the source, in order of first appearance.
 */
export function providersIn(source: string): string[] {
  return [...new Set([...source.matchAll(BLOCK)].map((match) => match[1]))];
}

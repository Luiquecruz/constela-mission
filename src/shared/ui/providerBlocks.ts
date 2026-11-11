const OPEN = /^::: ([a-z][a-z0-9-]*)[ \t]*$/;
const CLOSE = /^:::[ \t]*$/;
const FENCE = /^ {0,3}(`{3,}|~{3,})/;

interface ProviderBlock {
  id: string;
  start: number;
  end: number;
}

/**
 * Finds the `::: <id>` blocks, ignoring any `:::` line that sits inside a fenced code sample.
 */
function findBlocks(lines: string[]): ProviderBlock[] {
  const blocks: ProviderBlock[] = [];
  let fence: string | undefined;
  let open: { id: string; start: number } | undefined;
  lines.forEach((line, index) => {
    const marker = FENCE.exec(line)?.[1];
    if (fence !== undefined) {
      if (marker !== undefined && marker[0] === fence[0] && marker.length >= fence.length && line.trim() === marker) {
        fence = undefined;
      }
      return;
    }
    if (marker !== undefined) {
      fence = marker;
      return;
    }
    if (open === undefined) {
      const id = OPEN.exec(line)?.[1];
      if (id !== undefined) {
        open = { id, start: index };
      }
      return;
    }
    if (CLOSE.test(line)) {
      blocks.push({ id: open.id, start: open.start, end: index });
      open = undefined;
    }
  });
  return blocks;
}

/**
 * Keeps the `::: <id>` blocks of the chosen provider (unwrapped) and drops the others; without a choice every block is kept.
 */
export function selectProviderBlocks(source: string, provider: string | undefined): string {
  const lines = source.split('\n');
  const blocks = findBlocks(lines);
  if (blocks.length === 0) {
    return source;
  }
  const output: string[] = [];
  let cursor = 0;
  for (const block of blocks) {
    output.push(...lines.slice(cursor, block.start));
    if (provider === undefined || block.id === provider) {
      output.push(...lines.slice(block.start + 1, block.end));
    }
    cursor = block.end + 1;
    if (lines[cursor] === '' && output[output.length - 1] === '') {
      cursor += 1;
    }
  }
  output.push(...lines.slice(cursor));
  return output.join('\n');
}

/**
 * The provider ids that have a `::: <id>` block in the source, in order of first appearance.
 */
export function providersIn(source: string): string[] {
  return [...new Set(findBlocks(source.split('\n')).map((block) => block.id))];
}

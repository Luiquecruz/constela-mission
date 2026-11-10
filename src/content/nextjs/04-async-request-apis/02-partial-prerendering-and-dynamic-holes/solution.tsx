export interface RouteSection {
  id: string;
  kind: 'static' | 'dynamic';
  wrappedInSuspense: boolean;
  html: string;
  fallbackHtml?: string;
  renderDynamic?: () => Promise<string>;
}

export interface RouteDefinition {
  path: string;
  rootReadsDynamic: boolean;
  sections: RouteSection[];
}

export interface RouteAnalysis {
  mode: 'static' | 'ppr' | 'dynamic';
  unguardedDynamicIds: string[];
}

export interface PrerenderResult {
  shellHtml: string;
  streamedChunks: Array<{ id: string; html: string }>;
}

export function analyzeRouteTree(route: RouteDefinition): RouteAnalysis {
  const unguardedDynamicIds = route.sections
    .filter((section) => section.kind === 'dynamic' && !section.wrappedInSuspense)
    .map((section) => section.id);

  if (route.rootReadsDynamic || unguardedDynamicIds.length > 0) {
    return {
      mode: 'dynamic',
      unguardedDynamicIds,
    };
  }

  const hasDynamicSection = route.sections.some(
    (section) => section.kind === 'dynamic'
  );

  return {
    mode: hasDynamicSection ? 'ppr' : 'static',
    unguardedDynamicIds: [],
  };
}

export async function prerenderRouteShell(
  route: RouteDefinition
): Promise<PrerenderResult> {
  const shellParts: string[] = [];
  const pendingChunks: Array<Promise<{ id: string; html: string }>> = [];

  for (const section of route.sections) {
    if (section.kind === 'static') {
      shellParts.push(section.html);
    } else if (section.wrappedInSuspense) {
      const fallback =
        section.fallbackHtml ??
        `<div data-fallback="${section.id}">Loading...</div>`;
      shellParts.push(fallback);

      pendingChunks.push(
        Promise.resolve(
          section.renderDynamic ? section.renderDynamic() : section.html
        ).then((html) => ({
          id: section.id,
          html,
        }))
      );
    } else {
      const resolvedHtml = section.renderDynamic
        ? await section.renderDynamic()
        : section.html;
      shellParts.push(resolvedHtml);
    }
  }

  const streamedChunks = await Promise.all(pendingChunks);

  return {
    shellHtml: shellParts.join(''),
    streamedChunks,
  };
}

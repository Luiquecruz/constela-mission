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
  // TODO: Inspect route.rootReadsDynamic and route.sections to classify
  // mode ('static' | 'ppr' | 'dynamic') and list unguardedDynamicIds.
  return {
    mode: 'static',
    unguardedDynamicIds: [],
  };
}

export async function prerenderRouteShell(
  route: RouteDefinition
): Promise<PrerenderResult> {
  // TODO: Build shellHtml using static HTML and Suspense fallbacks for guarded
  // dynamic sections, and resolve streamedChunks in parallel.
  return {
    shellHtml: '',
    streamedChunks: [],
  };
}

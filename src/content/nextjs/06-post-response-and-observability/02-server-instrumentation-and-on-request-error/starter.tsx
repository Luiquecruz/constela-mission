export interface ErrorWithDigest extends Error {
  digest?: string;
}

export interface InstrumentationRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
}

export interface InstrumentationContext {
  routerKind: 'Pages Router' | 'App Router';
  routePath: string;
  routeType: 'render' | 'route' | 'action' | 'middleware';
  renderSource?: string;
}

export interface TelemetryExporter {
  init: (config: {
    runtime: 'nodejs' | 'edge';
    sdkKind: 'node-otel' | 'edge-lightweight';
  }) => void | Promise<void>;
  captureError: (payload: Record<string, unknown>) => void | Promise<void>;
}

export function createInstrumentation({
  runtime,
  exporter,
}: {
  runtime: 'nodejs' | 'edge';
  exporter: TelemetryExporter;
}) {
  return {
    async register() {
      // TODO: Initialize exporter only once and select sdkKind based on runtime
      const sdkKind = 'node-otel' as const;
      await exporter.init({ runtime, sdkKind });
      return { runtime, sdkKind };
    },

    async onRequestError(
      err: ErrorWithDigest,
      request: InstrumentationRequest,
      context: InstrumentationContext
    ) {
      // TODO: Lowercase header keys, redact sensitive headers, and report full context
      const payload = {
        message: err.message,
        digest: err.digest,
        method: request.method,
        path: request.path,
        headers: request.headers,
        routerKind: context.routerKind,
        routePath: context.routePath,
        routeType: context.routeType,
        renderSource: context.renderSource,
      };
      await exporter.captureError(payload);
      return payload;
    },
  };
}

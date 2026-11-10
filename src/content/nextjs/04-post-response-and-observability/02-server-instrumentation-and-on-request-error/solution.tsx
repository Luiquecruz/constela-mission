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

const REDACTED_HEADER_KEYS = new Set(['authorization', 'cookie', 'x-api-key']);

export function createInstrumentation({
  runtime,
  exporter,
}: {
  runtime: 'nodejs' | 'edge';
  exporter: TelemetryExporter;
}) {
  let initialized = false;
  const sdkKind: 'node-otel' | 'edge-lightweight' =
    runtime === 'nodejs' ? 'node-otel' : 'edge-lightweight';

  return {
    async register() {
      if (!initialized) {
        initialized = true;
        await exporter.init({ runtime, sdkKind });
      }
      return { runtime, sdkKind };
    },

    async onRequestError(
      err: ErrorWithDigest,
      request: InstrumentationRequest,
      context: InstrumentationContext
    ) {
      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries(request.headers ?? {})) {
        const lowerKey = key.toLowerCase();
        headers[lowerKey] = REDACTED_HEADER_KEYS.has(lowerKey)
          ? '[REDACTED]'
          : value;
      }

      const payload = {
        message: err.message,
        digest: err.digest ?? 'unknown',
        method: request.method,
        path: request.path,
        headers,
        routerKind: context.routerKind,
        routePath: context.routePath,
        routeType: context.routeType,
        renderSource: context.renderSource ?? 'server-rendering',
      };

      await exporter.captureError(payload);
      return payload;
    },
  };
}

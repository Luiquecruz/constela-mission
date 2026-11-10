export interface RequestContextInput {
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
}

export interface RequestApi {
  after: (callback: () => unknown | Promise<unknown>) => void;
  cookies: {
    get: (name: string) => string | undefined;
    set: (name: string, value: string) => void;
  };
  headers: {
    get: (name: string) => string | undefined;
  };
  redirect: (url: string) => never;
  notFound: () => never;
}

export function createRequestExecutor({
  waitUntil,
}: {
  waitUntil: (promise: Promise<void>) => void;
}) {
  return {
    async runRequest<T>(
      requestContext: RequestContextInput,
      handler: (api: RequestApi) => T | Promise<T>
    ) {
      const cookieStore: Record<string, string> = {
        ...(requestContext.cookies ?? {}),
      };
      const afterErrors: string[] = [];

      // TODO: Implement headers lookup, cookie mutation lock after response,
      // redirect() / notFound() control-flow handling, and waitUntil() queue draining.
      const api: RequestApi = {
        after: (_callback) => {},
        cookies: {
          get: (name) => cookieStore[name],
          set: (name, value) => {
            cookieStore[name] = value;
          },
        },
        headers: {
          get: (_name) => undefined,
        },
        redirect: (url) => {
          throw new Error(`Unimplemented redirect to ${url}`);
        },
        notFound: () => {
          throw new Error('Unimplemented notFound');
        },
      };

      const body = await handler(api);
      waitUntil(Promise.resolve());

      return {
        status: 200,
        body,
        cookies: { ...cookieStore },
        afterErrors,
      };
    },
  };
}

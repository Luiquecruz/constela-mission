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
      const normalizedHeaders: Record<string, string> = {};
      for (const [key, value] of Object.entries(requestContext.headers ?? {})) {
        normalizedHeaders[key.toLowerCase()] = value;
      }

      const afterQueue: Array<() => unknown | Promise<unknown>> = [];
      const afterErrors: string[] = [];
      let responseSent = false;

      const api: RequestApi = {
        after(callback) {
          afterQueue.push(callback);
        },
        cookies: {
          get(name) {
            return cookieStore[name];
          },
          set(name, value) {
            if (responseSent) {
              throw new Error(
                'Cookies cannot be modified inside after() after the response has been sent'
              );
            }
            cookieStore[name] = value;
          },
        },
        headers: {
          get(name) {
            return normalizedHeaders[name.toLowerCase()];
          },
        },
        redirect(url: string): never {
          throw { type: 'REDIRECT', url, status: 307 };
        },
        notFound(): never {
          throw { type: 'NOT_FOUND', status: 404 };
        },
      };

      let response: Record<string, unknown>;
      try {
        const body = await handler(api);
        response = {
          status: 200,
          body,
          cookies: { ...cookieStore },
          afterErrors,
        };
      } catch (err: any) {
        if (err && err.type === 'REDIRECT') {
          response = {
            status: 307,
            redirectUrl: err.url,
            cookies: { ...cookieStore },
            afterErrors,
          };
        } else if (err && err.type === 'NOT_FOUND') {
          response = {
            status: 404,
            cookies: { ...cookieStore },
            afterErrors,
          };
        } else {
          response = {
            status: 500,
            error: err instanceof Error ? err.message : String(err?.message ?? err),
            cookies: { ...cookieStore },
            afterErrors,
          };
        }
      } finally {
        responseSent = true;
      }

      const drainPromise = (async () => {
        for (let i = 0; i < afterQueue.length; i += 1) {
          try {
            await afterQueue[i]();
          } catch (afterErr: any) {
            afterErrors.push(
              afterErr instanceof Error
                ? afterErr.message
                : String(afterErr?.message ?? afterErr)
            );
          }
        }
      })();

      waitUntil(drainPromise);

      return response;
    },
  };
}

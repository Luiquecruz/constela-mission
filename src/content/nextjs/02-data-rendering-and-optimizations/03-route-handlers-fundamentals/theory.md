# Route Handlers Fundamentals

While Server Components cover initial page reads and Server Actions handle React UI form mutations, many applications still need explicit HTTP endpoints—for mobile apps, third-party webhooks, OAuth callbacks, or REST integrations. In the Next.js App Router, those endpoints live in **`route.ts`** (or `route.js`) files built directly on Web-standard `Request` and `Response` APIs.

## Named HTTP Method Exports

A `route.ts` file inside `app/api/...` exports async functions named after standard HTTP verbs: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, and `OPTIONS`.

```ts
// app/api/notes/route.ts
const notes = [
  { id: 'n-1', title: 'Read Request API', tag: 'nextjs' },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get('tag')?.trim();

  const items = tag
    ? notes.filter((note) => note.tag === tag)
    : notes;

  return Response.json({ notes: items }, { status: 200 });
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body?.title?.trim() || !body?.tag?.trim()) {
    return Response.json(
      { error: 'title and tag are required' },
      { status: 400 }
    );
  }

  const created = {
    id: `n-${notes.length + 1}`,
    title: body.title.trim(),
    tag: body.tag.trim(),
  };
  notes.push(created);

  return Response.json({ note: created }, { status: 201 });
}
```

Key Web API conventions to follow:

- **Query parameters**: Parse `new URL(request.url).searchParams` rather than inventing custom string-splitting logic.
- **Request bodies**: Await `request.json()` inside a `try/catch` block so malformed payloads return **`400 Bad Request`** instead of an unhandled `500` crash.
- **Explicit status codes**: Return **`200 OK`** for successful reads, **`201 Created`** when persisting a new resource, **`400 Bad Request`** for validation failures, and **`404 Not Found`** when a requested ID does not exist.

## Why `route.ts` and `page.tsx` Cannot Share a Folder

In the App Router, both `page.tsx` and `route.ts` map to the **exact same URL path**. A folder like `app/notes/` cannot serve both an HTML page (`GET /notes`) and a JSON API endpoint (`GET /notes`) simultaneously—Next.js throws a build-time conflict if both files exist in the same segment directory.

Keep API endpoints cleanly separated under `app/api/...` (such as `app/api/notes/route.ts`) or in dedicated sub-folders away from `page.tsx` UI routes.

## Route Handlers vs. Server Actions

One of the most common architectural questions in Next.js is whether a mutation belongs in a **Route Handler** or a **Server Action**:

- **Server Actions** (`'use server'`) are tightly coupled to your React UI: they integrate with `<form action={...}>`, progressive enhancement, `useActionState`, and automatic UI revalidation from the browser. However, they are designed as internal React RPC calls—not stable public REST contracts.
- **Route Handlers** (`route.ts`) expose standard HTTP endpoints with full control over HTTP verbs, custom status codes (`201`, `400`, `404`), response headers, and raw payloads.

## When to choose it

- **Choose a Route Handler (`route.ts`)** for **public webhooks** (Stripe, GitHub, CMS publish hooks), **third-party integrations**, **non-React clients** (iOS/Android apps, CLI tools, cron jobs), OAuth callbacks, or when you need explicit REST semantics (`GET` + `POST` + status codes + custom headers).
- **Choose a Server Action (`'use server'`)** for **form submissions and UI-triggered mutations** inside your own React/Next.js application where progressive enhancement, TypeScript safety between form and server, and seamless cache revalidation matter most.
- **Never fetch your own `route.ts` from a Server Component**: Server Components already run on the server—call your shared data-access function directly instead of making an unnecessary HTTP loopback request.

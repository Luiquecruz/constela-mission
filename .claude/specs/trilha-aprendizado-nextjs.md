# Especificação Técnica e Arquitetural: Trilha de Aprendizado em Next.js 15 & 16

Esta especificação define os requisitos técnicos, padrões de código, modelo mental de produção e diretrizes arquiteturais para a implementação de uma trilha de aprendizado voltada à formação de especialistas no ecossistema Next.js.

## 1. Visão Geral e Diretrizes Arquiteturais

A evolução do Next.js (consolidada nas versões 15 e 16 com React 19) estabelece um divisor de águas na construção de aplicações web full-stack. O modelo mental do framework transicionou de comportamentos implícitos (como cache automático agressivo e acesso síncrono ao contexto de requisição) para um **controle declarativo explícito** validado pelo compilador e pelo runtime.

**Objetivo da trilha:** conduzir quem concluiu a trilha de React desde os fundamentos do framework (App Router, roteamento baseado em sistema de arquivos, layouts/templates, navegação, busca de dados, renderização estática vs dinâmica, Route Handlers, metadados e otimizações nativas) até formar engenheiros capazes de projetar, implementar, depurar, instrumentar e migrar aplicações Next.js de alta escala em produção, dominando:

0. **Fundamentos do App Router e Construção de Sites de Conteúdo (Módulos 1–2)**: anatomia do projeto Next.js vs SPA com Vite, App Router vs Pages Router, roteamento por diretórios (`[slug]`, `[...slug]`, `[[...slug]]`, `_lib`, `(grupos)`), `layout.tsx` (estado preservado) vs `template.tsx` (remount por navegação), `<Link>`, `usePathname`, `useSearchParams`, `useRouter`, `redirect()`, `loading.tsx`/`error.tsx`/`not-found.tsx`, fetch em Server Components com props serializáveis, `generateStaticParams` e `dynamicParams`, Route Handlers (`GET`/`POST`), `generateMetadata`/`sitemap`/`robots`, `next/image`/`next/font`/`next/script`/`NEXT_PUBLIC_*`, fechando com um projeto intermediário de site de conteúdo.
1. **Fronteira Híbrida Servidor/Cliente (RSC, Streaming e Server Actions)**: onde cada componente executa, o que atravessa a rede pelo protocolo Flight, como evitar waterfalls com `<Suspense>` e como construir mutações resilientes.
2. **Isolamento de Contexto Assíncrono, Partial Prerendering (PPR) e Data Access Layer (DAL)**: por que `params`, `searchParams`, `cookies()` e `headers()` são Promises, como preservar cascas estáticas (static shells) empurrando leituras dinâmicas para dentro de `<Suspense>` e como proteger dados com memoização por requisição (`React.cache`).
3. **Arquitetura Declarativa de Cache (`use cache`, `cacheLife`, `cacheTag`, `revalidateTag`, `updateTag`)**: inversão para dinâmico por padrão, chaves de cache derivadas de argumentos e closures, perfis de expiração em múltiplas camadas e semântica Stale-While-Revalidate vs Read-Your-Own-Writes.
4. **Processamento Pós-Resposta (`after()`) e Observabilidade (`instrumentation.ts`)**: desacoplamento entre latência de resposta e efeitos colaterais, limites do contexto pós-resposta, captura estruturada com `onRequestError` e pipelines de webhooks em Route Handlers.
5. **Roteamento Concorrente Avançado (Parallel Routes, Intercepting Routes e Fronteiras de Erro)**: slots nomeados (`@slot`), fallback `default.tsx`, modais orientados à URL (`(.)`, `(..)`), e recuperação granular com `error.tsx` e `not-found.tsx` por slot.
6. **Fronteira de Rede (`proxy.ts`), Hardening de Produção e Migração**: transição de `middleware.ts` na Edge para `proxy.ts` no Node.js, defesa em profundidade (proxy otimista + verificação no DAL/Actions), metadados dinâmicos, CSP com nonces, `cacheHandler` distribuído para self-hosting e automação de migração com codemods.

---

## 1B. Módulos de Fundamentos (Ponte a partir da Trilha de React)

Antes de entrar nas decisões arquiteturais avançadas (RSC Flight serialization, PPR, `'use cache'`, `after()`, Parallel/Intercepting Routes e `proxy.ts`), os **Módulos 1 e 2** preenchem a lacuna entre uma aplicação SPA em React (Vite + React Router) e o modelo full-stack do App Router:

### Módulo 1 (`01-app-router-foundations`): Roteamento, Layouts e Navegação
- **App Router vs Pages Router & Anatomia de Projeto**: por que um framework full-stack vai além da biblioteca de UI (`app/`, `public/`, `next.config.ts`, `dev`/`build`/`start`, Turbopack).
- **File-System Routing & Precedência**: `page.tsx`, segmentos dinâmicos (`[slug]`), catch-all (`[...slug]`), catch-all opcional (`[[...slug]]`), pastas privadas (`_lib`) e route groups (`(group)`).
- **`layout.tsx` vs `template.tsx`**: root layout (`<html>`/`<body>`), aninhamento por segmento, preservação de estado em layouts e remount intencional em templates.
- **Navegação & URL State**: `<Link>` (prefetch), `usePathname()`, `useSearchParams()`, `useRouter()` e `redirect()` no servidor.
- **Boundaries Básicas de Segmento**: `loading.tsx` (`<Suspense>`), `error.tsx` (Client Component com `reset()`) e `not-found.tsx` / `notFound()`.

### Módulo 2 (`02-data-rendering-and-optimizations`): Dados, Renderização e Otimizações
- **Data Fetching em Server Components**: componentes `async` sem cascata de `useEffect`, tratamento de erro/vazio e serialização JSON na fronteira Server → Client.
- **Renderização Estática vs Dinâmica**: `generateStaticParams`, `dynamicParams` (`true` vs `false`) e o impacto de APIs dinâmicas (`cookies()`, `headers()`, `searchParams`, `connection()`).
- **Route Handlers Fundamentais**: `app/api/.../route.ts` com `GET`/`POST`, validação, códigos HTTP, `Response.json` e escolha entre Route Handler e Server Action.
- **Metadados & Arquivos de SEO**: `metadata` estático, `title.template`, `generateMetadata`, `app/sitemap.ts` e `app/robots.ts`.
- **Otimizações Nativas & Ambiente**: `next/image` (`sizes`, `fill`, `priority`, `remotePatterns`), `next/font`, `next/script`, CSS Modules/Tailwind em RSC e `NEXT_PUBLIC_*` vs segredos server-only.
- **Projeto Intermediário (`06-project-content-site`)**: site editorial/blog multi-arquivo integrando layout persistente, `[slug]`, `generateStaticParams`, `generateMetadata`, `not-found` e `loading` antes da entrada nos módulos avançados `03–08`.

---

## 2. Módulo 3 (Avançado 1): Modelo de Execução e Renderização Híbrida (RSC & React 19)

### 2.1 Server Components, Redução de Bundle e a Fronteira `'use client'`

Por padrão no App Router, todos os componentes dentro do diretório `app/` são React Server Components (RSC). Componentes no servidor executam exclusivamente no ambiente Node.js/Edge, permitindo acesso direto ao banco de dados, mantendo dependências pesadas fora do bundle do cliente e garantindo que segredos ou campos internos jamais vazem se não forem passados como props.

```tsx
// app/produtos/page.tsx
import { db } from '@/lib/db';
import { Suspense } from 'react';

async function ProductList() {
  const products = await db.product.findMany();

  return (
    <ul className="grid grid-cols-3 gap-4">
      {products.map((product) => (
        <li key={product.id} className="p-4 border rounded">
          <h3>{product.name}</h3>
          <p>R$ {product.price}</p>
        </li>
      ))}
    </ul>
  );
}

export default function Page() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Catálogo de Produtos</h1>
      <Suspense fallback={<p>Carregando produtos...</p>}>
        <ProductList />
      </Suspense>
    </main>
  );
}
```

#### Regras de Composição para Especialistas
- **Fronteira de Módulo (`'use client'`)**: A diretiva `'use client'` marca o ponto de corte no grafo de importações. Todos os módulos importados por um Client Component entram no bundle do cliente.
- **Padrão Donut (Interleaving via `children`)**: Um Client Component não pode importar um Server Component diretamente, mas pode recebê-lo já renderizado através da prop `children` (ou qualquer slot `ReactNode`). O servidor avalia a árvore RSC antes de passar a referência serializada ao cliente.
- **Serialização do Payload Flight**: Props enviadas de um Server Component para um Client Component precisam ser serializáveis pelo protocolo RSC (primitivos, objetos planos, arrays, Promises, `ReactNode` e Server Actions). Funções comuns e instâncias de classes com métodos não atravessam a fronteira.

### 2.2 Streaming com `<Suspense>` e Eliminação de Waterfalls

Especialistas evitam bloqueios sequenciais (`await a(); await b();`) iniciando buscas independentes em paralelo ou isolando cada consulta lenta em seu próprio componente assíncrono envolvido por `<Suspense>`. Isso reduz o TTFB da casca principal e permite hidratação seletiva conforme cada bloco chega pelo stream HTTP.

### 2.3 Server Actions, `<Form>` e Mutações Otimistas

O Next.js aprimora o funcionamento das Server Actions (`'use server'`) através de dois mecanismos automáticos:
1. **Remoção de Código Não Utilizado (Dead-Code Elimination)**: ações não referenciadas são podadas do bundle.
2. **Identificadores Rotativos e Criptografia de Closures**: variáveis capturadas do escopo do servidor são criptografadas antes de transitar pelo cliente.

Como toda Server Action expõe um endpoint HTTP `POST` público, um especialista **sempre valida os argumentos de entrada** (por exemplo, com Zod) e verifica autorização dentro da própria action.

O componente `<Form>` (`next/form`) estende o elemento HTML `<form>`:
- Quando `action` é uma **string (URL)**, funciona como formulário de busca GET com navegação client-side (`soft navigation`), pré-carregamento (`prefetch`) do `loading.tsx` e do layout de destino, e preservação de estado.
- Quando `action` é uma **função (Server Action)**, integra-se com `useActionState`, `useFormStatus` e `useOptimistic` do React 19 para feedback imediato e aprimoramento progressivo.

```tsx
// app/busca/page.tsx
import Form from 'next/form';

export default function SearchPage() {
  return (
    <Form action="/busca/resultados" className="flex gap-2">
      <input
        name="q"
        placeholder="Buscar no catálogo..."
        required
        className="border p-2 rounded"
      />
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        Pesquisar
      </button>
    </Form>
  );
}
```

---

## 3. Módulo 2: Inversão de Paradigma, APIs de Requisição Assíncronas, PPR e DAL

### 3.1 A Mudança Estrutural nas APIs Orientadas à Requisição

No Next.js 14, APIs de contexto de requisição como `cookies()`, `headers()`, `draftMode()`, `params` e `searchParams` eram síncronas. A partir do Next.js 15 e consolidado no Next.js 16, todas essas funções e propriedades retornam Promises e exigem o uso explícito de `await` (ou `use()` em Client Components para `params` e `searchParams`).

Essa mudança descola a fase de pré-renderização da rota em relação ao bloqueio de entrada/saída de rede, permitindo que o motor do Next.js prepare a **casca estática (static shell)** de uma rota antes que os dados específicos da requisição do cliente sejam resolvidos.

```tsx
// app/dashboard/[tenant]/page.tsx
import { cookies, headers } from 'next/headers';

type PageProps = {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ view?: string }>;
};

export default async function TenantDashboard(props: PageProps) {
  const { tenant } = await props.params;
  const { view } = await props.searchParams;

  const cookieStore = await cookies();
  const headerStore = await headers();

  const userTheme = cookieStore.get('theme')?.value;
  const userAgent = headerStore.get('user-agent');

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Organização: {tenant}</h1>
      <p>Modo de Visualização: {view || 'padrão'}</p>
      <p className="text-sm text-gray-500">Tema Preferido: {userTheme || 'claro'}</p>
      <p className="sr-only">{userAgent}</p>
    </div>
  );
}
```

### 3.2 Partial Prerendering (PPR) e isolamento de leituras dinâmicas

Quando um componente faz `await cookies()`, `await headers()`, `await searchParams` ou `await connection()`, a árvore a partir daquele ponto torna-se dinâmica em tempo de requisição.
- **Anti-padrão**: fazer `await cookies()` no topo do `RootLayout` ou da `Page` sem `<Suspense>`, forçando toda a rota a renderizar dinamicamente.
- **Padrão Especialista**: manter o layout e a estrutura da página livres de `await` dinâmicos e isolar o acesso a `cookies()` / `searchParams` dentro de subcomponentes filhos envolvidos por `<Suspense>`. Assim, o Next.js serve a casca estática instantaneamente a partir da CDN e faz streaming apenas das lacunas dinâmicas (*dynamic holes*).

### 3.3 Data Access Layer (DAL) e Memoização por Requisição (`React.cache`)

Como múltiplos Server Components na mesma árvore frequentemente precisam da sessão do usuário ou dos dados do tenant, centraliza-se o acesso em uma **Data Access Layer (DAL)** protegida com `server-only` e `React.cache()`:
- `React.cache(fn)` deduplica chamadas com os mesmos argumentos **apenas durante o ciclo de vida de uma única requisição**, evitando que dados vazem entre usuários distintos.
- O DAL valida permissões e retorna **DTOs (Data Transfer Objects)** enxutos, nunca entidades brutas do banco de dados.

### 3.4 Execução de Automação de Migração com Codemods e Typegen

Para transformar código legado que utiliza chamadas síncronas e gerar tipagens estáticas de rotas (`PageProps`, `LayoutProps`):

```bash
npx @next/codemod@canary next-async-request-api .
npx next typegen
```

---

## 4. Módulo 3: Arquitetura Declarativa de Cache (`use cache` & `cacheComponents`)

### 4.1 Inversão dos Padrões de Retenção de Dados

A alteração arquitetural de maior impacto comportamental no Next.js 15/16 é a inversão do modelo de retenção de cache:
- **Modelo antigo (Next.js 14)**: requisições `fetch` e Route Handlers `GET` eram mantidos em cache estático por padrão, surpreendendo desenvolvedores com dados obsoletos.
- **Modelo declarativo (Next.js 15 & 16)**: operações assíncronas são dinâmicas por padrão, e o Router Cache de páginas no cliente utiliza `staleTime: 0` por padrão (mantendo layouts compartilhados e estados de back/forward).

Para ativar a arquitetura declarativa de compilação de cache no Next.js 16 (`cacheComponents`, evolução do antigo flag experimental `dynamicIO`):

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    catalogo: {
      stale: 300,      // 5 minutos no cliente sem reconsultar o servidor
      revalidate: 3600, // 1 hora no servidor antes de revalidar em background
      expire: 86400,   // Expiração máxima de 1 dia antes de exigir regeneração
    },
  },
};

export default nextConfig;
```

Com `cacheComponents: true`, o compilador impõe uma escolha explícita para qualquer acesso a dados assíncrono: **ou** envolver os dados em `<Suspense>` para streaming dinâmico, **ou** declarar `'use cache'` para retenção controlada.

### 4.2 A Diretiva `'use cache'`, Chaves de Cache e Perfis `cacheLife`

A diretiva `'use cache'` pode ser aplicada em três níveis:
1. **Nível de Função**: armazena o resultado de consultas a banco, chamadas de SDK ou cálculos assíncronos.
2. **Nível de Componente**: isola subárvores de UI assíncronas.
3. **Nível de Arquivo**: aplica cache a todas as funções exportadas no módulo.

#### Composição da Chave de Cache
O compilador gera a chave de cache combinando:
- `buildId` + `functionId`
- Argumentos serializáveis passados para a função/componente
- Variáveis capturadas por closure de escopos externos (automaticamente criptografadas/incluídas na chave)
- Valores não-serializáveis como `children` (JSX) podem atravessar um componente com `'use cache'` como *pass-through slots* sem invalidar ou compor a chave, desde que o componente em cache não os inspecione.

Quando múltiplos blocos `'use cache'` são aninhados com perfis `cacheLife` diferentes, o escopo externo herda os limites mais restritivos (menor `revalidate` e menor `expire`) para preservar a frescura prometida.

```tsx
// lib/data-service.ts
import { cacheLife, cacheTag } from 'next/cache';

export async function getCategorias() {
  'use cache';
  cacheLife('catalogo');
  cacheTag('categorias-data');

  const res = await fetch('http://localhost:3000/api/categorias');
  if (!res.ok) throw new Error('Falha ao buscar categorias');
  return res.json();
}
```

### 4.3 Invalidação e Revalidação Dinâmica (`cacheTag`, `revalidateTag`, `updateTag`)

No Next.js 16, existem duas primitivas complementares para invalidação por tag:

1. **`revalidateTag(tag, profile)` — Stale-While-Revalidate (SWR)**: exige um perfil `cacheLife` como segundo argumento (ex.: `'max'` ou `'catalogo'`). Visitantes continuam recebendo o dado em cache enquanto a regeneração ocorre em background. Ideal para webhooks de CMS e atualizações em segundo plano.
2. **`updateTag(tag)` — Read-Your-Own-Writes**: invocada exclusivamente dentro de **Server Actions**. Expira imediatamente a entrada de cache para que o próprio usuário que executou a mutação veja o dado atualizado na mesma resposta de redirecionamento ou re-renderização.

```tsx
// app/acoes/categoria.ts
'use server';

import { updateTag, revalidateTag } from 'next/cache';

export async function criarCategoria(formData: FormData) {
  const nome = formData.get('nome') as string;
  await db.category.create({ data: { nome } });

  // O autor da mutação lê imediatamente a nova categoria:
  updateTag('categorias-data');
}
```

---

## 5. Módulo 4: Processamento Assíncrono Pós-Resposta (`after()` & Observabilidade)

### 5.1 O Ciclo de Vida da Primitiva `after()`

A primitiva `after()` (`next/server`) agenda tarefas e efeitos colaterais para ocorrerem **após** o envio da resposta HTTP ao cliente ou após a conclusão da pré-renderização. Isso elimina o bloqueio do streaming para auditoria, telemetria, analytics ou aquecimento de cache.

```tsx
// app/api/pedido/route.ts
import { NextResponse, after } from 'next/server';
import { registrarLog, enviarNotificacao } from '@/lib/servicos';

export async function POST(request: Request) {
  const body = await request.json();
  const pedido = await db.order.create({ data: body });

  after(async () => {
    await registrarLog({
      pedidoId: pedido.id,
      evento: 'PEDIDO_CRIADO',
      timestamp: Date.now(),
    });
    await enviarNotificacao(pedido.email, pedido.id);
  });

  return NextResponse.json({ sucesso: true, pedidoId: pedido.id }, { status: 201 });
}
```

### 5.2 Regras de Execução, Limites Funcionais e Quando Usar Filas Duráveis

- **Execução Garantida**: o callback de `after()` executa mesmo se a rota terminar em erro HTTP (4xx/5xx), ou se forem invocadas `notFound()` ou `redirect()`.
- **Impossibilidade de Mutação da Resposta**: como os headers e o corpo já foram enviados, chamar `cookies().set()`, `cookies().delete()`, alterar status HTTP ou chamar `redirect()` dentro de `after()` lança erro. Leituras de contexto capturadas antes ou via `AsyncLocalStorage` permanecem acessíveis.
- **Mecanismo Subjacente**: o runtime do Next.js usa `globalThis[Symbol.for('@next/request-context')]` com `AsyncLocalStorage` para delegar a promessa ao `waitUntil()` da plataforma serverless ou ao event loop do processo Node.js.
- **`after()` vs Fila Durável (Outbox/Queue)**: `after()` não possui retentativas persistentes em caso de crash do container ou estouro de timeout da função serverless. Pagamentos, faturamento e integrações críticas exigem Transactional Outbox / filas duráveis; `after()` é ideal para logs, métricas e efeitos colaterais best-effort.

### 5.3 Observabilidade do Servidor com `instrumentation.ts` e Route Handlers

O arquivo `instrumentation.ts` na raiz do projeto executa uma vez na inicialização do servidor (`register()`) e expõe o hook `onRequestError` para capturar o contexto estruturado de qualquer exceção não tratada em Server Components, Server Actions ou Route Handlers.

```typescript
// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[Instrumentation] Telemetria Node.js inicializada.');
  }
}

export async function onRequestError(
  err: Error & { digest?: string },
  request: { path: string; method: string; headers: Record<string, string> },
  context: {
    routerKind: 'Pages Router' | 'App Router';
    routePath: string;
    routeType: 'render' | 'route' | 'action' | 'middleware';
    renderSource?: 'react-server-components' | 'react-server-components-payload' | 'server-rendering';
  }
) {
  console.error(`[Erro] ${request.method} ${request.path} (${context.routeType} em ${context.routePath})`);
}
```

---

## 6. Módulo 5: Roteamento Avançado e UI Concorrente (Parallel & Intercepting Routes)

### 6.1 Parallel Routes (`@slot`), Estados Ativos e `default.tsx`

**Parallel Routes** são definidas por pastas prefixadas com `@` (ex.: `@analytics`, `@modal`) e injetadas como props no `layout.tsx` do mesmo segmento. Os diretórios `@slot` **não adicionam segmentos à URL**.

- **Navegação Suave (Soft Navigation)**: quando a URL muda para uma sub-rota que existe em apenas um dos slots, o Next.js preserva o estado ativo anterior dos demais slots.
- **Navegação Direta / Reload (Hard Navigation)**: como não há estado anterior em memória, o Next.js procura o segmento correspondente em cada `@slot`. Se um slot não possuir aquela rota, ele **obrigatoriamente** renderiza seu `default.tsx`. A ausência de `default.tsx` resulta em erro 404.

### 6.2 O Padrão Modal Orientado à URL com Intercepting Routes

A combinação de **Parallel Routes** (`@modal`) e **Intercepting Routes** (`(.)`, `(..)`, `(..)(..)`, `(...)`) resolve a criação de modais e drawers com URLs compartilháveis:
- As convenções `(.)` (mesmo nível) e `(..)` (um nível acima) contam **segmentos de rota na URL**, ignorando pastas de grupo `(group)` e pastas de slot `@slot`.
- **Clique via `<Link>` (Soft Navigation)**: renderiza `@modal/(.)photo/[id]/page.tsx` sobre o layout atual (ex.: o feed permanece montado ao fundo).
- **Acesso Direto ou F5 (Hard Navigation)**: ignora a interceptação, renderiza `default.tsx` (`null`) no `@modal` e monta a página canônica `app/photo/[id]/page.tsx` em tela cheia.

```text
app/
├── layout.tsx                // Layout raiz com suporte ao slot {modal}
├── feed/
│   ├── page.tsx              // Grade de fotos do feed
├── @modal/
│   ├── default.tsx           // OBRIGATÓRIO: retorna null para navegação padrão
│   └── (.)photo/[id]/
│       └── page.tsx          // Versão exibida no Modal (Interceptada)
└── photo/
    └── [id]/
        └── page.tsx          // Versão de Página Inteira Canônica (Hard Load)
```

```tsx
// components/modal-wrapper.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

export function ModalWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!dialogRef.current?.open) {
      dialogRef.current?.showModal();
    }
  }, []);

  const handleClose = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/feed');
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      onClick={(e) => e.target === dialogRef.current && handleClose()}
      className="backdrop:bg-black/50 p-0 rounded-lg shadow-xl"
    >
      {children}
    </dialog>
  );
}
```

### 6.3 Isolamento de Falhas por Slot (`error.tsx`, `not-found.tsx` e `global-error.tsx`)

Cada segmento e cada `@slot` pode declarar seu próprio `loading.tsx`, `error.tsx` (obrigatoriamente `'use client'`, recebendo `{ error, reset }`) e `not-found.tsx`. Uma falha em `@analytics` fica contida naquele slot enquanto `@main` permanece funcional. Erros ocorridos no `layout.tsx` do próprio segmento sobem para o `error.tsx` do segmento pai (ou `global-error.tsx` na raiz, que deve renderizar suas próprias tags `<html>` e `<body>`).

---

## 7. Módulo 6: Fronteira de Rede (`proxy.ts`), Hardening de Produção e Migração

### 7.1 De `middleware.ts` para `proxy.ts` e Defesa em Profundidade

No Next.js 16, o arquivo `middleware.ts` foi substituído por `proxy.ts` (exportando a função `proxy(request: NextRequest)`), que executa explicitamente no **runtime Node.js** como fronteira de rede da aplicação.
- **Responsabilidades do `proxy.ts`**: rewrites multi-tenant por subdomínio, redirecionamentos de localização/autenticação otimista (leitura rápida do cookie de sessão), injeção de headers de correlação (`x-request-id`) e rate limiting de borda.
- **Defesa em Profundidade**: o `proxy.ts` **nunca** deve ser a única barreira de segurança. Toda leitura no Data Access Layer (DAL) e toda mutação em Server Actions ou Route Handlers deve revalidar a sessão e as permissões junto à fonte de verdade.

### 7.2 Metadados Dinâmicos, Otimização de Imagens, CSP e Self-Hosting

- **`generateMetadata`**: recebe `params` assíncronos (`Promise`) e compartilha memoização de `fetch` / `React.cache` com a árvore de Server Components da página.
- **Guardrails de Imagem (`next/image`)**: configuração explícita de `images.qualities` (ex.: `[75]`), `remotePatterns` restritos e `minimumCacheTTL` alinhado ao CDN (4 horas / 14.400s por padrão no Next.js 16).
- **Self-Hosting em Múltiplas Instâncias**: uso de `output: 'standalone'` para imagens Docker enxutas e configuração de um `cacheHandler` compartilhado (ex.: Redis/S3) para que chamadas a `revalidateTag` e `updateTag` sincronizem entre todos os pods.

### 7.3 Requisitos de Infraestrutura e Roteiro de Migração

- **Node.js**: LTS moderno (`v20.9.0+`).
- **TypeScript**: `v5.1.0+`.
- **Bundler**: Turbopack como bundler padrão para `next dev` e `next build`.

Checklist passo a passo de migração:
1. Executar `npx @next/codemod@canary upgrade latest` e `npx @next/codemod@canary next-async-request-api .`.
2. Migrar `middleware.ts` para `proxy.ts` (`npx @next/codemod@canary middleware-to-proxy .`).
3. Habilitar `cacheComponents: true` no `next.config.ts` e envolver acessos assíncronos em `'use cache'` (com `cacheLife` e `cacheTag`) ou `<Suspense>`.
4. Atualizar chamadas `revalidateTag(tag)` para `revalidateTag(tag, profile)` (SWR) ou `updateTag(tag)` (Read-Your-Own-Writes em Server Actions).
5. Validar `images.qualities`, `minimumCacheTTL` e rodar `next typegen && next build`.

---

## 8. Adaptação para a Constela Mission

A trilha roda em `src/content/nextjs` (track `nextjs`, engine `react`) e o plano completo de lições fica em `.claude/docs/CURRICULUM.md`. Como a Constela Mission executa inteiramente no navegador sem backend externo, os mecanismos de servidor e compilador do Next.js (RSC, streaming, PPR, `'use cache'`, `cacheLife`, `revalidateTag`/`updateTag`, `after()`, `instrumentation.ts`, Parallel/Intercepting Routes e `proxy.ts`) são exercitados através de implementações didáticas testáveis no sandbox React 19 + Testing Library, quizzes conceituais e checkpoints de ADR (Architecture Decision Records).

### Mapa spec → lições (`src/content/nextjs`)

| Módulo | Item da spec / competência | Lição | Formato |
| --- | --- | --- | --- |
| `01-app-router-foundations` | Por que Next.js, App Router vs Pages Router, anatomia e Turbopack | `01-what-is-nextjs-and-the-app-router` | Quiz |
| `01-app-router-foundations` | Roteamento por pastas, `[slug]`, `[...slug]`, `[[...slug]]`, grupos e `_private` | `02-file-system-routing-and-dynamic-segments` | Desafio |
| `01-app-router-foundations` | Root layout, layouts aninhados (estado preservado) vs `template.tsx` (remount) | `03-layouts-templates-and-nested-ui` | Desafio |
| `01-app-router-foundations` | `<Link>`, `usePathname`, `useSearchParams`, `useRouter` e `redirect()` | `04-linking-and-navigation` | Desafio |
| `01-app-router-foundations` | Boundaries básicas de segmento: `loading.tsx`, `error.tsx` (`reset`) e `notFound()` | `05-loading-error-and-not-found` | Desafio |
| `02-data-rendering-and-optimizations` | Busca de dados em Server Components `async` e serialização para Client Components | `01-fetching-data-in-server-components` | Desafio |
| `02-data-rendering-and-optimizations` | Renderização estática vs dinâmica, `generateStaticParams` e `dynamicParams` | `02-static-and-dynamic-rendering` | Desafio |
| `02-data-rendering-and-optimizations` | Route Handlers (`GET`/`POST`, `Response.json`) e quando preferir sobre Server Action | `03-route-handlers-fundamentals` | Desafio |
| `02-data-rendering-and-optimizations` | `metadata`, `title.template`, `generateMetadata`, `sitemap.ts` e `robots.ts` | `04-metadata-and-seo-files` | Desafio |
| `02-data-rendering-and-optimizations` | `next/image`, `next/font`, `next/script`, estilização e `NEXT_PUBLIC_*` vs server env | `05-images-fonts-styling-and-environment` | Quiz |
| `02-data-rendering-and-optimizations` | Projeto Intermediário: blog/site de conteúdo multi-arquivo (ponte para módulos 03–08) | `06-project-content-site` | Desafio Multi-arquivo |
| `03-hybrid-rendering` | RSC, redução de bundle, fronteira `'use client'` e padrão Donut (`children`) | `01-server-components-and-bundle-boundary` | Desafio |
| `03-hybrid-rendering` | Streaming com `<Suspense>`, pré-carregamento paralelo e eliminação de waterfalls | `02-streaming-suspense-and-waterfalls` | Desafio |
| `03-hybrid-rendering` | Server Actions (`'use server'`), `<Form>` (`next/form`), validação e `useActionState` | `03-server-actions-and-progressive-forms` | Desafio |
| `03-hybrid-rendering` | Decisão arquitetural da fronteira servidor/cliente e mutações | `04-hybrid-rendering-adr` | ADR (Desafio) |
| `04-async-request-apis` | `params`, `searchParams`, `cookies()` e `headers()` assíncronos | `01-async-request-context` | Desafio |
| `04-async-request-apis` | Partial Prerendering (PPR): casca estática vs lacunas dinâmicas em `<Suspense>` | `02-partial-prerendering-and-dynamic-holes` | Desafio |
| `04-async-request-apis` | Data Access Layer (DAL), DTOs seguros e memoização por requisição (`React.cache`) | `03-data-access-layer-and-request-memoization` | Desafio |
| `04-async-request-apis` | Automação com `@next/codemod`, `next typegen` e migração de APIs síncronas | `04-async-migration-and-codemods` | Quiz |
| `05-declarative-caching` | Inversão do padrão de cache (dinâmico por padrão, `staleTime: 0`, `cacheComponents`) | `01-caching-paradigm-inversion` | Quiz |
| `05-declarative-caching` | Diretiva `'use cache'`, chaves de cache, closures e perfis `cacheLife` | `02-use-cache-and-cache-life-profiles` | Desafio |
| `05-declarative-caching` | `cacheTag`, `revalidateTag(tag, profile)` (SWR) vs `updateTag(tag)` (Read-Your-Writes) | `03-tag-invalidation-and-read-your-writes` | Desafio |
| `05-declarative-caching` | Decisão arquitetural de perfis `cacheLife` e topologia de invalidação | `04-caching-architecture-adr` | ADR (Desafio) |
| `06-post-response-and-observability` | Ciclo de vida do `after()`, limites pós-resposta e `waitUntil` | `01-after-post-response-lifecycle` | Desafio |
| `06-post-response-and-observability` | `instrumentation.ts`, `register()` por runtime e captura estruturada em `onRequestError` | `02-server-instrumentation-and-on-request-error` | Desafio |
| `06-post-response-and-observability` | Route Handlers (`route.ts`), verificação de webhooks, `revalidateTag` e `after()` | `03-route-handlers-and-webhooks` | Desafio |
| `06-post-response-and-observability` | Decisão entre `after()`, filas duráveis/outbox e observabilidade | `04-observability-and-reliability-adr` | ADR (Desafio) |
| `07-advanced-routing` | Parallel Routes (`@slot`), preservação em soft navigation e fallback `default.tsx` | `01-parallel-routes-and-slot-states` | Desafio |
| `07-advanced-routing` | Intercepting Routes (`(.)`, `(..)`) e modais `<dialog>` orientados à URL | `02-intercepting-routes-and-url-modals` | Desafio |
| `07-advanced-routing` | Isolamento de erros por slot (`error.tsx`, `reset()`, `not-found.tsx`, `global-error.tsx`) | `03-error-boundaries-not-found-and-slot-isolation` | Desafio |
| `07-advanced-routing` | Decisão arquitetural de slots paralelos e rotas interceptadas | `04-routing-architecture-adr` | ADR (Desafio) |
| `08-proxy-migration-and-production` | De `middleware.ts` para `proxy.ts` no Node.js e defesa em profundidade com DAL | `01-from-middleware-to-node-proxy` | Desafio |
| `08-proxy-migration-and-production` | `generateMetadata`, guardrails de `next/image` (`qualities`, `minimumCacheTTL`) e CSP | `02-metadata-images-and-security-headers` | Quiz |
| `08-proxy-migration-and-production` | Auditoria de migração, codemods, Turbopack e `cacheHandler` para self-hosting | `03-migration-playbook-and-runtime-lifecycle` | Desafio |
| `08-proxy-migration-and-production` | Projeto Final (Capstone): motor full-stack com `proxy`, DAL, `'use cache'`, `updateTag`, `after()` e `@modal` | `04-capstone-commerce-architecture` | Desafio Multi-arquivo |

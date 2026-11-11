# Trilha CI/CD — Briefing para o NotebookLM

Sete mensagens prontas, sem campos a preencher, para colar no chat do caderno depois da pesquisa. A mensagem 0 avisa o NotebookLM de que ele vai receber 6 prompts e deve esperar; as mensagens 1 a 5 só configuram e terminam com "OK"; a mensagem 6 começa com INICIAR e gera o plano de módulos e lições. As mensagens 4 e 5 definem o formato exato dos arquivos para que o resultado possa ser copiado para o repositório sem retrabalho. Cole na ordem e espere o "OK" antes de enviar a próxima.

Valores assumidos (ajuste nas mensagens 1, 2 e 6 se discordar): público de desenvolvedores que nunca configuraram pipeline, nível iniciante → intermediário, 8 módulos, foco neutro em vendor, desafios em TypeScript com pipelines modelados como funções e objetos (a plataforma não tem biblioteca de YAML registrada) e capstone de pipeline completo para um serviço de exemplo.

## Mensagem 0 — Aviso de fila

```
Vou enviar 6 mensagens em sequência. Nas mensagens 1 a 5, NÃO produza nenhum conteúdo: responda apenas "OK" e aguarde. Elas contêm o papel, as restrições, as decisões da trilha, as regras de saída, o template de lição e o formato exato de entrega dos arquivos, que valem para todo o trabalho seguinte. Só comece a trabalhar quando receber a mensagem 6, que começa com a palavra INICIAR. Até lá, não resuma, não antecipe e não faça perguntas.

Responda apenas "OK".
```

## Mensagem 1 de 6 — Papel, público e restrições

```
Você é um autor de currículo técnico. Usando somente as fontes do caderno, escreva material de aprendizado para uma trilha de CI/CD em uma plataforma de ensino que roda inteira no navegador. Não invente fatos; quando uma fonte for omissa, escreva [fonte necessária].

Público: desenvolvedores que já entregam software, mas nunca configuraram um pipeline.
Conhecimento assumido: Git básico, terminal e noções de uma linguagem de programação.
Progressão: iniciante → intermediário.

Restrições da plataforma:
- Tudo roda no navegador. Não há backend, runner, registry nem conta em nuvem.
- A prática é simulada: o aluno lê, edita e valida definições de pipeline contra testes automatizados.
- Engines, vendors e serviços são citados na teoria e linkados em resources; nunca executados.
- Sem datas, números de versão de produtos nem linguagem de changelog.
- Conteúdo das lições em inglês. Nomes de arquivos, títulos de seção e marcadores literais ficam em inglês.

Responda apenas "OK" e aguarde a próxima mensagem.
```

## Mensagem 2 de 6 — Decisões da trilha e regras de saída

```
Decisões da trilha:
- Título e descrição em uma linha: CI/CD — Entrega contínua de software. Do commit à produção: pipelines, ambientes, estratégias de deploy, segurança e observabilidade.
- Linguagem de prática dos desafios: TypeScript, com pipelines modelados como funções e objetos; YAML e as plataformas são citados só na teoria.
- Foco em vendor: neutro.
- Número de módulos: 8.
- Projeto final (capstone): desenhar e validar um pipeline completo para um serviço de exemplo.

Regras de saída, valem para todas as respostas:
- Markdown puro, um arquivo por bloco, cada um introduzido pelo nome do arquivo como título.
- Tom neutro, frases curtas, sem marketing.
- Toda afirmação rastreável a uma fonte do caderno; cite o nome da fonte após o parágrafo.
- Não compare ferramentas, a menos que uma fonte o faça.
- Termine cada resposta com a lista de lacunas [fonte necessária].

Responda apenas "OK" e aguarde a próxima mensagem.
```

## Mensagem 3 de 6 — Template de teoria, quiz e conceitos

```
Template de lição. Cada lição que eu pedir deve seguir exatamente esta estrutura.

theory.md:
1. Título e um parágrafo de introdução.
2. Linha "You need:" com os títulos exatos das lições anteriores (primeira lição: "nothing. This is the first lesson of the track.").
3. Seções de conceito.
4. "## Common mistakes": 2 a 4 itens, 60 a 180 palavras.
5. "## In practice": um cenário concreto.
6. "## Check yourself": 2 a 4 perguntas numeradas.
Tamanho: 300 a 1000 palavras no módulo 1; 500 a 1300 nos seguintes.

quiz.json: 5 a 6 questões, 4 opções distintas, explicação com mais de 40 caracteres, posição correta distribuída (nenhuma com mais da metade).
concepts.json: 4 a 8 termos, definição de uma frase terminada em ponto.
Resources: 2 a 6 links de documentação oficial vindos das fontes.

Responda apenas "OK" e aguarde a próxima mensagem.
```

## Mensagem 4 de 6 — Formato de entrega dos arquivos

```
FORMATO DE ENTREGA DOS ARQUIVOS. Tudo o que você produzir será copiado para um repositório, então siga este formato exatamente. Entregue cada arquivo em um bloco de código próprio, precedido de um título com o caminho relativo.

Estrutura (prefixos numéricos de 2 dígitos definem a ordem; ids em kebab-case, únicos na trilha inteira; módulos numerados de 01 em diante, sem lacunas):
cicd/track.json
cicd/NN-modulo/module.json
cicd/NN-modulo/NN-id-da-licao/ (arquivos da lição)

track.json: {"engine": "node", "title": "...", "monogram": "CI", "shortTitle": "...", "description": "...", "version": "frase curta sem data"}
module.json: {"title": "...", "description": "..."}
meta.json: {"title": "...", "summary": "...", "level": "beginner | intermediate | advanced | expert", "tags": ["theory ou practice", "core"], "resources": [{"label": "...", "url": "..."}]}
concepts.json: [{"term": "...", "description": "..."}]
quiz.json: [{"question": "...", "options": ["...", "...", "...", "..."], "answer": 0, "explanation": "..."}] (answer é o índice de 0 a 3)

Toda lição tem theory.md, concepts.json, quiz.json e meta.json. Lição de prática tem também os arquivos do desafio (próxima mensagem). Escreva o meta.json por último. Tudo em inglês, sem datas, anos, números de versão nem "última versão".

Responda apenas "OK" e aguarde a próxima mensagem.
```

## Mensagem 5 de 6 — Formato dos desafios de prática

```
FORMATO DOS DESAFIOS DE PRÁTICA. Linguagem: TypeScript, executada no navegador por um runtime que imita o Node.js. Arquivos: starter.ts, solution.ts, tests.ts, challenge.md, hints.md, approach.md.

Regras do código:
- O pipeline é modelado como funções e objetos TypeScript exportados (por exemplo, validar um grafo de etapas, resolver dependências, avaliar uma política de promoção, simular um rollback). Nada de rede, arquivos reais, processos ou YAML.
- Sem arquivos .json dentro do desafio. Sem await no topo do arquivo e sem import.meta. Só importe módulos "node:" (util, assert, crypto). Tempo e aleatoriedade entram por parâmetro (por exemplo now: () => number).
- starter.ts compila, falha em pelo menos um teste e marca cada lugar a escrever com // TODO: ...
- solution.ts passa em todos os testes, com os mesmos exports do starter.

tests.ts: script simples, sem imports. Cada teste fica no nível raiz: test('frase que descreve o requisito', async () => { ... }). Os exports do aluno vêm em mod (por exemplo mod.resolveStages(...)). Use expect(...).toBe, toEqual, toThrow, toContain; captureError(promiseOuFunção) para erros; captureLogs() para console. De 3 a 6 testes, no máximo 4 segundos cada. Exatamente um teste tem, na linha acima, o comentário "// beginner mistake:" seguido do erro típico de iniciante que ele pega.

challenge.md: sem título; nomeia todo export, assinatura, mensagem de erro e comportamento que os testes verificam, porque os testes são o contrato.
hints.md: de 2 a 4 dicas separadas por uma linha contendo só ---, da pista leve à quase resposta.
approach.md: passos numerados do raciocínio, sem colar a solução completa.

Responda apenas "OK" e aguarde a próxima mensagem.
```

## Mensagem 6 de 6 — Primeiro pedido

```
INICIAR. Usando as fontes do caderno e as instruções anteriores, produza o plano de módulos e lições como tabela com as colunas: Módulo | Lição | Tipo (theory ou practice) | Objetivo de aprendizado | Lições pré-requisito.

Temas a cobrir: controle de versão e branching; etapas de build e teste; artefatos e cache; ambientes e promoção; estratégias de deploy; segredos e permissões; pipeline como código; quality gates; observabilidade e rollback; segurança da cadeia de suprimentos; infraestrutura como código e GitOps.

Entregue somente a tabela e as lacunas. Aguarde minha aprovação antes de escrever qualquer lição.
```

## Verified facts

Checked against the primary source while the track was reviewed; anything not listed here has not been checked against a source.

| Where | Claim | Source |
| --- | --- | --- |
| 02-01 case study | a WAF rule regular expression exhausted the CPU, and the test suite had no check for CPU use | the provider's post-mortem of the outage |
| 03-03 case study | a coverage uploader script was modified to send environment variables, found when a customer compared its checksum | the vendor's security update |
| 04-03 case study | a mistyped command removed more capacity than intended, and the tool was changed to remove capacity more slowly and to keep a minimum | the cloud provider's post-event summary |
| 06-01 case study | a content update with an undetected error crashed Windows computers, and the report lists a staggered deployment starting with a canary group | the vendor's preliminary post-incident report |
| 06-02 case study | new code reached the equity router incorrectly, a loss of more than 460 million dollars in the first 45 minutes | the SEC press release on the order |
| 07-03 case study | version tags were retargeted to a malicious commit and secrets were printed in logs; pinning to a full commit hash is the recommended defense | the security vendor's analysis |
| 07-03 Azure example | a federated credential has `name`, `issuer`, `subject` and `audiences` (`api://AzureADTokenExchange`), all required | the Microsoft Graph `federatedIdentityCredential` reference |
| 01-03 AWS example | a webhook filter has `type` and `pattern`; `EVENT` takes comma-separated events such as `PUSH`, `PULL_REQUEST_CREATED`; `HEAD_REF` takes an RE2 pattern; `filterGroups` is an array of arrays | the CodeBuild `WebhookFilter` and `Webhook` API references |
| every provider example | each `gcloud`, `aws` and `az` command in the theory exists and accepts the flags used (for example `gcloud builds triggers create github --require-approval`, `aws deploy create-deployment --auto-rollback-configuration`, `az repos policy approver-count create`) | the command reference pages of Google Cloud, AWS and Azure |

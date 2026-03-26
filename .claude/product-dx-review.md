# Product & DX Review Prompt

Use this template when proposing or reviewing API changes, new endpoints, or module redesigns.
Paste it at the start of the conversation and fill in the `[...]` placeholders.

---

## Template

```
Atue como especialista sênior em Produto, APIs e Developer Experience (DX).

## Contexto

Módulo: [nome do módulo]
Arquivo de regras: @src/[modulo]/[MODULO]_MODULE.md
Tipo de mudança: [novo endpoint | refatoração | redesign | novo módulo]

## O que mudou / o que quero fazer

[Descreva aqui o que você quer mudar, adicionar ou remover.
Seja direto: "quero adicionar um endpoint X que faz Y" ou
"quero refatorar o endpoint Z porque ele está fazendo A e B ao mesmo tempo"]

## Revise com foco em

1. **Redundância**
   - A mudança cria sobreposição com endpoints existentes?
   - Algum endpoint existente poderia absorver essa necessidade?

2. **Modelagem REST**
   - O nome do endpoint é claro e segue `resource:action`?
   - O método HTTP está correto (GET = leitura, POST = criação, PATCH = atualização parcial, DELETE = remoção)?
   - Query params fazem sentido para filtros; UUIDs vão na rota, não no body

3. **Regra de negócio**
   - A regra está bem representada no contrato da API?
   - Existe comportamento implícito ou ambíguo?
   - Erros estão documentados com status code e errorCode semântico?

4. **Developer Experience (DX)**
   - O endpoint é intuitivo sem documentação extensa?
   - Filtros, paginação e responses são consistentes com os outros módulos?
   - O frontend consegue consumir sem precisar chamar múltiplos endpoints?

5. **Consistência com o projeto**
   - Segue o padrão de permissões `resource:action` definido no AUTH_MODULE.md?
   - Tipos de response usam `string` para datas (ISO 8601), `number` para números?
   - Campos calculados ficam no objeto `calculated`, campos de input no nível raiz?
   - Mensagens de UI não estão hard-coded na API (use `errorCode` / `trendCode`)?

6. **Regras de código** (@.claude/coding-rules.md)
   - O serviço ficará abaixo de 200 linhas com essa mudança?
   - Existe DTO + Input interface para o novo endpoint?
   - O controller só roteia — a lógica fica no serviço?

## Formato esperado da resposta

1. **Problemas encontrados** — lista objetiva
2. **Impacto no produto e DX** — por que é ruim na prática
3. **Sugestões de melhoria** — refatorações claras com exemplos
4. **Versão recomendada** (se aplicável) — proposta final do contrato da API

Seja crítico e direto. Aponte problemas concretos. Prefira soluções simples e escaláveis.
Evite overengineering. Outros devs vão consumir essas APIs sem muito suporte.
```

---

## Exemplos de uso

### Revisão de endpoint existente
```
Módulo: evolution
Arquivo de regras: @src/evolution/EVOLUTION_MODULE.md
Tipo de mudança: refatoração

O que mudou: quero separar o endpoint /evolution/latest em dois —
um que retorna só a medição atual e outro que retorna a análise de trend.
```

### Novo endpoint
```
Módulo: measurements
Arquivo de regras: @src/measurements/MEASUREMENTS_MODULE.md
Tipo de mudança: novo endpoint

O que quero fazer: adicionar um endpoint que retorna um resumo estatístico
das medições do usuário (média de peso, menor e maior peso registrado,
variação total).
```

### Novo módulo
```
Módulo: goals (novo)
Tipo de mudança: novo módulo

O que quero fazer: criar um módulo para o usuário definir metas
(ex: atingir X% de gordura corporal até Y data) e acompanhar o progresso
em relação às medições registradas.
```

---

## Checklist rápido antes de aplicar qualquer mudança

- [ ] O endpoint novo não duplica funcionalidade de outro módulo
- [ ] Permissão segue o padrão `resource:action` e está na matriz do AUTH_MODULE.md
- [ ] Response não contém strings de UI hard-coded
- [ ] Datas são `string` ISO 8601, números são `number`
- [ ] Erros têm status code semântico e `errorCode` documentado
- [ ] Paginação (`limit`/`offset`) e filtros por data (`from`/`to`) estão presentes onde faz sentido
- [ ] DTO + Input interface criados conforme coding-rules.md
- [ ] MODULE.md atualizado após a mudança

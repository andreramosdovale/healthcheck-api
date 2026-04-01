# Unit Test Prompt

Use this template when asking Claude to write or review unit tests for any layer of the application.
Paste it at the start of the conversation and fill in the `[...]` placeholders.

---

## Template

```
Atue como especialista sênior em testes de software com NestJS e Jest.

## Contexto

Módulo: [nome do módulo]
Camada: [controller | service | guard | decorator | utils]
Arquivo-fonte: src/[modulo]/[arquivo].ts
Arquivo de spec: test/unit/[modulo]/[arquivo].spec.ts

## O que precisa ser testado

[Descreva o método ou comportamento a cobrir. Exemplos:
- "escrever os testes completos para o MeasurementsService"
- "adicionar o caso de erro NotFoundException no método findOne do UsersService"
- "cobrir todos os branches do utilitário calculateBodyFat"]

## Regras obrigatórias

- Seguir @.claude/coding-rules.md e @.claude/unit-testing.md
- Usar factories de @test/stubs/ — nunca objetos inline
- Criar stub novo em @test/stubs/ se o domínio ainda não tiver um
- Imports com alias @/ (src) e @test/ (test) — nunca caminhos relativos
- afterEach(() => jest.clearAllMocks()) sempre presente
- Sem `any` nos testes — usar jest.Mocked<T> ou tipos explícitos

## Formato esperado da resposta

1. **Análise** — o que será coberto e por quê (happy path, erros, edge cases)
2. **Stub** — factory function se precisar criar ou atualizar um stub
3. **Spec file** — arquivo de teste completo e pronto para rodar
4. **Observações** — pontos de atenção ou decisões não óbvias

Seja direto. Não adicione testes redundantes. Prefira cobertura de branches reais
a repetições do mesmo caminho feliz com dados diferentes.
```

---

## Exemplos de uso

### Service completo

```
Módulo: measurements
Camada: service
Arquivo-fonte: src/measurements/measurements.service.ts
Arquivo de spec: test/unit/measurements/measurements.service.spec.ts

O que precisa ser testado: escrever os testes completos para o MeasurementsService,
cobrindo todos os métodos: create, findAll, findOne, update e remove.
Incluir casos de NotFoundException para findOne/update/remove quando a medição
não pertence ao usuário autenticado.
```

### Caso de erro pontual

```
Módulo: users
Camada: service
Arquivo-fonte: src/users/users.service.ts
Arquivo de spec: test/unit/users/users.service.spec.ts

O que precisa ser testado: adicionar os casos de erro que estão faltando no método update —
BadRequestException quando o e-mail já está em uso por outro usuário,
e NotFoundException quando o usuário não existe.
```

### Controller

```
Módulo: evolution
Camada: controller
Arquivo-fonte: src/evolution/evolution.controller.ts
Arquivo de spec: test/unit/evolution/evolution.controller.spec.ts

O que precisa ser testado: escrever os testes do EvolutionController.
Cobrir getSummary, compare e getLatest, verificando que cada rota chama
o método correto do EvolutionService com os argumentos certos e repassa
o retorno sem modificação.
```

### Utilitário puro

```
Módulo: measurements/utils
Camada: utils
Arquivo-fonte: src/measurements/utils/body-fat-calculator.ts
Arquivo de spec: test/unit/measurements/utils/body-fat-calculator.spec.ts

O que precisa ser testado: cobrir todos os branches de calculateBodyFat —
método Pollock para homens, método Pollock para mulheres, método Navy,
retorno null quando campos obrigatórios estão ausentes, e as funções
auxiliares hasAllSkinfolds e canCalculateNavyMale.
```

### Novo módulo

```
Módulo: goals (novo)
Camada: service
Arquivo-fonte: src/goals/goals.service.ts
Arquivo de spec: test/unit/goals/goals.service.spec.ts

O que precisa ser testado: escrever os testes completos para o GoalsService.
O serviço ainda não tem stub — criar test/stubs/goal.stub.ts com makeGoal
e makeCreateGoalInput. Cobrir: criação de meta, listagem por usuário,
NotFoundException ao buscar meta de outro usuário, e a regra de negócio
que impede criar duas metas ativas para o mesmo tipo.
```

---

## Checklist rápido antes de aceitar um spec gerado

- [ ] `afterEach(() => jest.clearAllMocks())` presente
- [ ] Nenhum objeto mock inline — todos vêm de `test/stubs/`
- [ ] Todo `rejects.toThrow` testa tipo **e** mensagem da exceção
- [ ] Controller spec não testa lógica de negócio
- [ ] Service spec cobre happy path **e** todos os branches de erro
- [ ] Sem `any` — usar `jest.Mocked<T>` ou cast explícito
- [ ] Todos os imports usam `@/` ou `@test/`
- [ ] Descrições no formato `it('should <comportamento> when <condição>')`
- [ ] Spec roda sem erros com `npm run test:unit`

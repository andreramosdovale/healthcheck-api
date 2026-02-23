# HealthCheck API

API para acompanhamento de composição corporal com múltiplos métodos de cálculo (Pollock 7 Dobras e Navy Method), sistema de autenticação JWT com refresh token e controle de acesso baseado em papéis (RBAC).

## Stack

- **Runtime:** Node.js 20
- **Framework:** NestJS 10
- **ORM:** Drizzle
- **Banco:** PostgreSQL 16
- **Deploy:** Vercel

## Pré-requisitos

- Node.js 20+
- Docker e Docker Compose
- npm

## Setup

### 1. Clonar e instalar

```bash
git clone <repo>
cd healthcheck-api
npm install
```

### 2. Configurar ambiente

```bash
cp .env.example .env
```

### 3. Subir o banco

```bash
docker compose up -d
```

### 4. Rodar migrations

```bash
npm run db:push
```

### 5. Popular dados iniciais

```bash
npm run db:seed
```

### 6. Iniciar

```bash
npm run start:dev
```

API disponível em `http://localhost:3000`

## Scripts

| Comando                    | Descrição                         |
| -------------------------- | --------------------------------- |
| `npm run start:dev`        | Inicia em modo desenvolvimento    |
| `npm run build`            | Build para produção               |
| `npm run test:unit`        | Executa testes unitários          |
| `npm run test:unit:cov`    | Testes unitários com cobertura    |
| `npm run test:e2e`         | Executa testes e2e                |
| `npm run db:generate`      | Gera migration do schema          |
| `npm run db:migrate`       | Aplica migrations pendentes       |
| `npm run db:push`          | Sincroniza schema direto no banco |
| `npm run db:studio`        | Abre interface visual do banco    |
| `npm run db:seed`          | Popula dados iniciais (RBAC)      |

## Banco de Dados

### Comandos Docker

```bash
# Subir
docker compose up -d

# Parar
docker compose down

# Resetar (apaga dados)
docker compose down -v

# Logs
docker compose logs -f db

# Acessar psql
docker exec -it healthcheck-db psql -U healthcheck -d healthcheck
```

### Estrutura

```
src/database/
├── db.ts
├── schema/
│   ├── index.ts              # Export central
│   ├── users.ts              # Tabela users
│   ├── measurements.ts       # Tabela measurements
│   ├── roles.ts              # Tabela roles
│   ├── permissions.ts        # Tabela permissions
│   ├── user-roles.ts         # Relação user <-> role
│   ├── role-permissions.ts   # Relação role <-> permission
│   ├── refresh-tokens.ts     # Tokens de refresh
│   ├── rbac-relations.ts     # Relations Drizzle
│   ├── sex-enum.ts           # Enum: male | female
│   └── plan-enum.ts          # Enum: free | pro
├── migrations/               # Migrations geradas (0000–0005)
└── seeds/                    # Seeds de RBAC
    ├── index.ts
    ├── roles.seed.ts
    ├── permissions.seed.ts
    ├── role-permissions.seed.ts
    ├── users.seed.ts
    └── user-roles.seed.ts
```

## Estrutura do Projeto

```
src/
├── auth/                     # Autenticação JWT + refresh token
│   ├── dto/
│   ├── guards/
│   └── strategies/
├── common/
│   ├── decorators/           # @Permissions()
│   └── guards/               # PermissionsGuard
├── database/                 # Drizzle (schema, migrations, seeds)
├── evolution/                # Evolução e comparativo de medições
├── measurements/             # Medições corporais
│   ├── dto/
│   └── utils/body-fat-calculator.ts
├── users/                    # Usuários
│   └── dto/
├── app.module.ts
└── main.ts
```

## Autenticação

JWT com refresh token. Login aceita email ou nickname.

```
POST /auth/register    # Criar conta
POST /auth/login       # Login (email ou nickname)
POST /auth/refresh     # Renovar access token
POST /auth/logout      # Revogar refresh token
```

## RBAC

Sistema de controle de acesso baseado em papéis com três roles de sistema:

| Role           | Descrição                  |
| -------------- | -------------------------- |
| `admin`        | Administrador do sistema   |
| `user`         | Usuário padrão             |
| `professional` | Profissional de saúde      |

Permissões disponíveis:

| Grupo          | Permissões                                                     |
| -------------- | -------------------------------------------------------------- |
| `users`        | `users:read`, `users:update`, `users:delete`                   |
| `measurements` | `measurements:create`, `measurements:read`, `measurements:update`, `measurements:delete` |
| `admin`        | `admin:access`, `roles:manage`, `permissions:manage`           |

## Endpoints

### Auth

```
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
```

### Usuários (requer JWT + permissão)

```
POST   /users          # Criar usuário (admin:access)
GET    /users          # Listar todos (users:read)
GET    /users/:id      # Buscar por ID (users:read)
PUT    /users/:id      # Atualizar (users:update)
DELETE /users/:id      # Excluir (users:delete)
```

### Medições (requer JWT + permissão)

```
POST   /measurements        # Nova medição (measurements:create)
GET    /measurements        # Listar do usuário (measurements:read)
GET    /measurements/:id    # Buscar por ID (measurements:read)
PUT    /measurements/:id    # Atualizar (measurements:update)
DELETE /measurements/:id    # Excluir (measurements:delete)
```

### Evolução (requer JWT + permissão)

```
GET    /evolution/summary?limit=30   # Série histórica para gráfico (measurements:read)
GET    /evolution/compare?from=&to=  # Comparar duas medições (measurements:read)
GET    /evolution/latest             # Última medição (measurements:read)
```

## Métodos de Cálculo

| Método      | Dobras/Circunferências necessárias          | Precisão |
| ----------- | ------------------------------------------- | -------- |
| **Pollock** | Tríceps, Subescapular, Peitoral, Axilar Médio, Suprailíaco, Abdominal, Coxa | ±3% |
| **Navy**    | Pescoço + Cintura (+ Quadril para mulheres) | ±3–5%   |

O cálculo é automático na criação/atualização da medição: se os dados necessários estiverem presentes, `bodyFatPercentage`, `navyBodyFatPercentage`, `leanMass` e `fatMass` são preenchidos automaticamente.

## Testes

Testes unitários cobrem controllers, services, guards, decorators e a calculadora de gordura corporal.

```bash
# Unitários
npm run test:unit

# Unitários com cobertura
npm run test:unit:cov

# E2E
npm run test:e2e
```

Módulos com cobertura de testes unitários:
- `auth` (controller + service)
- `users` (controller + service)
- `measurements` (controller + service + body-fat-calculator)
- `evolution` (controller + service)
- `common` (permissions guard + permissions decorator)

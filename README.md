# HealthCheck API

API para acompanhamento de composição corporal com múltiplos métodos de cálculo (Pollock 7 Dobras e Navy Method).

## 🚀 Stack

- **Runtime:** Node.js 20
- **Framework:** NestJS 10
- **ORM:** Drizzle
- **Banco:** PostgreSQL 16
- **Deploy:** Vercel

## 📋 Pré-requisitos

- Node.js 20+
- Docker e Docker Compose
- npm ou yarn

## 🛠️ Setup

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

### 5. Iniciar

```bash
npm run start:dev
```

API disponível em `http://localhost:3000`

## 📦 Scripts

| Comando               | Descrição                         |
| --------------------- | --------------------------------- |
| `npm run start:dev`   | Inicia em modo desenvolvimento    |
| `npm run build`       | Build para produção               |
| `npm run db:generate` | Gera migration do schema          |
| `npm run db:migrate`  | Aplica migrations pendentes       |
| `npm run db:push`     | Sincroniza schema direto no banco |
| `npm run db:studio`   | Abre interface visual do banco    |

## 🗄️ Banco de Dados

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
├── db.ts              # Conexão
├── schema/
│   ├── index.ts       # Export central
│   ├── enums.ts       # Enums (sex, plan)
│   └── users.ts       # Tabela users
└── migrations/        # Migrations geradas
```

## 📁 Estrutura do Projeto

```
src/
├── database/          # Drizzle (schema, migrations)
├── modules/
│   ├── auth/          # Autenticação (JWT)
│   ├── users/         # Usuários
│   ├── measurements/  # Medições
│   └── evolution/     # Evolução/comparativo
├── common/            # Guards, decorators, filters
├── config/            # Configurações
├── app.module.ts
└── main.ts
```

## 🔐 Autenticação

JWT com refresh token.

```
POST /auth/register    # Criar conta
POST /auth/login       # Login (email ou nickname)
POST /auth/refresh     # Renovar token
POST /auth/logout      # Revogar refresh token
```

## 📊 Endpoints Principais

```
# Usuários
GET    /users/me       # Perfil
PUT    /users/me       # Atualizar
DELETE /users/me       # Excluir conta

# Medições
POST   /measurements   # Nova medição
GET    /measurements   # Listar
GET    /measurements/:id
DELETE /measurements/:id

# Evolução
GET    /evolution/summary   # Dados para gráfico
GET    /evolution/compare   # Comparar medições
```

## 🧮 Métodos de Cálculo

| Método      | Requisitos                      | Precisão |
| ----------- | ------------------------------- | -------- |
| **Pollock** | 7 dobras cutâneas               | ±3%      |
| **Navy**    | Pescoço + Cintura (+ Quadril ♀) | ±3-5%    |

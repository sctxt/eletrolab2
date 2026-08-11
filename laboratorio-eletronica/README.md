# Plataforma do Laboratório de Eletrônica — IFCE Campus Maranguape

Plataforma web full-stack em português (pt-BR) para gestão do Laboratório de Eletrônica do IFCE Campus Maranguape. Permite ao professor criar e corrigir listas de exercícios, gerenciar alunos e equipes, e acompanhar relatórios de desempenho. Os alunos resolvem listas, recebem notas e notificações, e trabalham em equipes com convites.

## Funcionalidades

### Autenticação e Perfis (RBAC)
- Login por matrícula para **alunos** e por e-mail para **professor**.
- Tokens JWT com expiração e senhas criptografadas com `bcrypt`.
- Rotas protegidas por papel (`ALUNO` / `PROFESSOR`) no backend e no frontend.

### Aluno
- **Início**: resumo com estatísticas, convites pendentes, prazos, atividades recentes e notificações.
- **Minha Equipe**: criar equipe, convidar colegas, aceitar/recusar convites, transferir liderança, remover membros e sair/excluir equipe.
- **Listas**: visualizar listas publicadas, prazos e responder questões de 4 tipos (múltipla escolha, verdadeiro/falso, resposta curta e dissertativa).
- **Histórico**: notas e feedback de todas as entregas corrigidas.
- **Notificações**: avisos de novos convites, listas publicadas e correções realizadas.

### Professor
- **Início**: estatísticas da turma, listas pendentes de correção e atividades recentes.
- **Listas**: criar, editar, publicar, duplicar e excluir listas, com configuração de prazo e turma.
- **Correções**: revisar entregas, atribuir nota e feedback (com sugestão automática de pontos objetivos), e registrar notificação para o aluno.
- **Alunos**: lista de estudantes com matrícula, curso, semestre e desempenho.
- **Equipes**: visualizar todas as equipes e seus integrantes.
- **Relatórios**: gráficos de desempenho por aluno e por lista, com dados agregados do banco.

## Tecnologias

### Backend (`backend/`)
- Node.js + Express
- **Firebase** (Firebase Admin SDK) com **Firestore** como banco de dados (camada `src/db/firestore.js` com API compatível com a utilizada anteriormente pelo Prisma)
- JWT (`jsonwebtoken`) + `bcryptjs`
- CORS e variáveis de ambiente via `dotenv`

### Frontend (`frontend/`)
- React 18 + Vite
- React Router v6
- CSS padrão (sem frameworks), tema verde institucional, responsivo (desktop/tablet/mobile)
- Proxy de desenvolvimento `/api` → backend (`localhost:3001`)

## Estrutura

```
laboratorio-eletronica/
├── backend/
│   ├── src/
│   │   ├── server.js          # Entrada da API (porta 3001)
│   │   ├── config/            # env + inicialização do Firebase (firebase.js)
│   │   ├── db/firestore.js    # Camada de acesso ao Firestore
│   │   ├── controllers/       # Auth, aluno, professor, equipes, listas, entregas, etc.
│   │   ├── services/          # Notificações e Storage
│   │   ├── middleware/        # Auth JWT, autorização por papel e upload
│   │   └── routes/            # Rotas /api
│   ├── prisma/seed.js         # Seed compatível (popula o Firestore)
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── pages/             # páginas públicas, do aluno e do professor
    │   ├── components/        # componentes de UI, sidebar, rotas protegidas
    │   ├── context/           # Auth e Toast
    │   ├── services/api.js    # cliente HTTP da API
    │   ├── layouts/           # PublicLayout e PanelLayout
    │   └── routes/            # árvore de rotas com guardas de papel
    ├── vite.config.js         # porta 5173 + proxy /api
    └── package.json
```

## Pré-requisitos

- Node.js 18+
- Projeto no **Firebase** (Firestore + Storage) e o **service account** correspondente

## Configuração

### 1. Firebase

Crie um projeto no Firebase com **Firestore** e **Storage** habilitados e gere um **service account** (console > Configurações do projeto > Contas de serviço > Gerar nova chave privada). Em seguida configure `backend/.env` (copie de `.env.example`):

```env
PORT=3001
JWT_SECRET="um-segredo-bem-longo-e-aleatorio"
JWT_EXPIRES_IN="8h"
BCRYPT_SALT_ROUNDS=10
CLIENT_URL="http://localhost:5173"
FIREBASE_PROJECT_ID="eletrolab2"
FIREBASE_SERVICE_ACCOUNT='{ "type": "service_account", ... }'
```

> O `FIREBASE_SERVICE_ACCOUNT` pode ser o JSON do service account **ou** sua versão em base64. Sem ele a API inicia, mas as operações no Firestore retornam erro `FIREBASE_NOT_CONFIGURED`.

### 2. Backend

# Instalar dependências
cd backend
npm install

# (Opcional) Popular o Firestore com dados iniciais
npm run seed

# Iniciar a API
npm start
```

A API fica disponível em `http://localhost:3001` (health check em `GET /api/health`).

### 3. Frontend

# Em outro terminal
cd frontend
npm install
npm run dev
```

O frontend fica em `http://localhost:5173` e redireciona requisições `/api/*` para o backend via proxy.

## Deploy na Vercel

O repositório já inclui um `vercel.json` na **raiz do repositório** que faz o deploy de **frontend e backend em um único projeto**:

- `laboratorio-eletronica/frontend/` é compilado com `vite build` (build estático servido como SPA).
- `laboratorio-eletronica/backend/src/server.js` é publicado como função serverless (`@vercel/node`), servindo todas as rotas `/api/*`.
- Rotas de SPA (`/aluno/*`, `/professor/*`, etc.) caem no `index.html`.

### Passos

1. Importe o repositório em [vercel.com/new](https://vercel.com/new). Mantenha o **Root Directory** na raiz do repositório (o `vercel.json` já fica lá).
2. Em **Settings → Environment Variables**, configure:

   ```env
   JWT_SECRET="um-segredo-bem-longo-e-aleatorio"
   JWT_EXPIRES_IN="8h"
   BCRYPT_SALT_ROUNDS=10
   CLIENT_URL="https://seu-dominio.vercel.app"
   FIREBASE_PROJECT_ID="eletrolab2"
   FIREBASE_SERVICE_ACCOUNT='{ "type": "service_account", ... }'
   ```

   O `FIREBASE_SERVICE_ACCOUNT` aceita o JSON do service account (com quebras de linha) ou a versão base64.
3. Deploy. Depois rode o seed uma vez apontando para o mesmo projeto Firestore para popular os dados iniciais (ou execute `npm run seed` localmente com as mesmas variáveis).

> No Vercel o frontend e a API ficam no mesmo domínio, então as chamadas a `/api/*` são same-origin e não dependem do proxy de desenvolvimento nem de CORS.

## Credenciais de teste (seed)

| Papel | Usuário | Senha |
|-------|---------|-------|
| Professor | `professor@lab.com` | `123456` |
| Aluno | `2024101001` (Ana Beatriz Souza) | `123456` |
| Aluno | `2024101002` (Bruno Oliveira) | `123456` |
| Aluno | `2024101003` (Carla Fernanda Lima) | `123456` |
| Aluno | `2024101004` (Diego Almeida) | `123456` |
| Aluno | `2024101005` (Eduarda Santos) | `123456` |

O seed cria ainda 2 equipes, 4 listas de exercícios e entregas já corrigidas para demonstração. Execute o seed novamente a qualquer momento para restaurar o estado inicial (o script limpa e recria todos os dados).

## Principais rotas da API

- `POST /api/auth/student/login` e `POST /api/auth/professor/login`
- `GET /api/profile`
- `GET /api/dashboard`
- `GET/POST /api/teams`, `POST /api/teams/:id/invitations`
- `POST /api/invitations/:id/accept` e `POST /api/invitations/:id/reject`
- `GET/POST /api/assignments`, `POST /api/assignments/:id/submit`
- `GET /api/submissions`, `PUT /api/submissions/:id/grade`
- `GET/PUT /api/notifications`
- `GET /api/reports`

# STS Presentations

Full-stack TypeScript app for creating and editing presentations.

## Stack

- **Backend** — Node.js + TypeScript + Fastify + Prisma + Zod
- **Frontend** — React + Vite + TypeScript + TanStack Query + Zustand + @dnd-kit
- **Database** — Postgres (via docker-compose)
- **Storage** — AWS S3 with presigned URLs

## Repo layout

```
sts-project/
├── packages/
│   ├── shared/      # Zod schemas + shared types
│   ├── backend/     # Fastify API
│   └── frontend/    # React SPA
├── docker-compose.yml
└── README.md
```

## Setup

_Detailed instructions land in phase 13. The notes below are enough to get the scaffold running._

### Prerequisites

- Node.js 20+
- Docker (for Postgres)

### Quickstart

```bash
npm install
cp .env.example .env
npm run db:up           # starts Postgres
npm run dev             # starts backend + frontend
```

Backend: http://localhost:3000
Frontend: http://localhost:5173

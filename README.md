# STS Presentations

Full-stack TypeScript app for creating and editing presentations.

## Stack

- **Backend** — Node.js + TypeScript + Fastify + Prisma + Zod
- **Frontend** — React + Vite + TypeScript + TanStack Query + Zustand + @dnd-kit
- **Database** — Postgres on [Neon](https://neon.tech) (serverless)
- **Storage** — AWS S3 with presigned URLs
- **Hosting** — Frontend on Vercel, backend on Render

## Repo layout

```
sts-project/
├── packages/
│   ├── shared/      # Zod schemas + shared types
│   ├── backend/     # Fastify API
│   └── frontend/    # React SPA
└── README.md
```

## Setup

_Detailed instructions land in phase 13. The notes below are enough to get the scaffold running._

### Prerequisites

- Node.js 20+
- A Neon Postgres project ([sign up](https://neon.tech))
- An AWS account + S3 bucket (for phase 9 onward)

### Quickstart

```bash
npm install
cp .env.example .env
# Fill DATABASE_URL with your Neon connection string
npm run dev             # starts backend + frontend
```

Backend: http://localhost:3000
Frontend: http://localhost:5173

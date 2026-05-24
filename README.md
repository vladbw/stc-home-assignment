# STC Presentations home assignment

App for creating and editing presentations.

## Stack

- **Backend** — Node.js + TypeScript + Fastify + Prisma + Zod
- **Frontend** — React + Vite + TypeScript + TanStack Query + Zustand
- **Database** — Postgres on [Neon](https://neon.tech) (serverless)
- **Media Storage** — AWS S3 with presigned URLs
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

### Prerequisites

- Node.js 20+
- A Neon Postgres project (to run the backend locally, not a must)
- An AWS account + S3 bucket (to run the backend locally, not a must)


## Setup

- The app has already been deployed (both backend and frontend), so it can already be accessed in the browser at https://stc-home-assignment-frontend.vercel.app

- To run the app locally: the backend depends on an AWS account + Neon for the db and it can only run locally if these are configured in your local .env file (will provide an example later). However, it is easy to run just the frontend locally and have it point to production for backend operations.

- To do this, go to vite.config.js and set the api proxy to https://stc-home-assignment-frontend.vercel.app

- Then run the frontend locally:

```bash
cd packages/frontend
npm install
npm run dev
```

- Now the app should be running in your browser.


- Default local backend: http://localhost:3000
- Default local frontend: http://localhost:5173

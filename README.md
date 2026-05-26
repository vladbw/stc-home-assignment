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

- To run the app locally: the backend depends on an AWS bucket + Neon for the db and it can only run locally if these are configured in your local .env file. However, it is easy to run just the frontend locally and have it point to production for backend operations.

- To do this, go to vite.config.js and set the api proxy to https://stc-home-assignment-frontend.vercel.app (the app will run regardless of this step, but the request to fetch presentations will fail)

- Then run the frontend locally:

```bash
cd packages/frontend
npm install
npm run dev
```

- Now the app should be running in your browser.

- In order to run the backend locally, the app needs an .env file with the connection string and the AWS setup. I have attached a .env-example file; if you are curious to run the backend on your computer, create your own .env file next to the .env-example and populate it with your own data following the pattern.

- After that:
```bash
cd packages/backend
npm install
npm run db:generate
npm run db:migrate
npm run dev
```



- Default local backend: http://localhost:3000
- Default local frontend: http://localhost:5173

## Keyboard shortcuts per page


### Presentations list (home)

| Shortcut       | Action               |
| -------------- | -------------------- |
| `Ctrl/Cmd + .` | New presentation     |

### Editor

| Shortcut               | Action                       |
| ---------------------- | ---------------------------- |
| `Ctrl/Cmd + .`         | New page                     |
| `Ctrl/Cmd + Z`         | Undo                         |
| `Ctrl/Cmd + Shift + Z` | Redo                         |
| `←`                    | Previous page                |
| `→`                    | Next page                    |
| `Delete`               | Delete selected content      |
| `Backspace`            | Delete selected content      |
| `Esc`                  | Deselect                     |

### Presentation mode

| Shortcut    | Action            |
| ----------- | ----------------- |
| `←`         | Previous slide    |
| `→`         | Next slide        |
| `Space`     | Next slide        |
| `Esc`       | Exit presentation |

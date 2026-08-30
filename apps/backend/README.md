# ZH-LAO Backend Foundation

Node.js 22, TypeScript, ESM, Fastify, and PostgreSQL foundation for the modular monolith. It contains technical infrastructure only; business domains are added in later phases.

## Local commands

```bash
pnpm install --frozen-lockfile
pnpm verify
pnpm build
```

Run integration tests against an administrator database URL. The test harness creates a unique database from `template0`, applies the frozen `database/v2` migrations, and drops the database afterward.

```bash
ADMIN_DATABASE_URL=postgresql://.../postgres pnpm test:integration
```

Start the API or Worker only after applying the frozen migrations through `database/v2`:

```bash
DATABASE_URL=postgresql://... pnpm dev
DATABASE_URL=postgresql://... pnpm build && pnpm worker
```

The API exposes only `GET /health/live` and `GET /health/ready` in this phase. Package start scripts automatically load the ignored local `.env` when present; process-manager environment variables remain the production configuration path. Never commit credentials.

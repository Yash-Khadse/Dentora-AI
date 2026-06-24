# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dentora AI is an AI-powered BDS (Bachelor of Dental Surgery) final year exam preparation platform. It targets dental students with features including an AI study planner, RAG-based AI tutor, viva simulator, flashcards (spaced repetition), clinical case simulator, and analytics.

## Commands

```bash
npm run dev          # Development server with Turbopack
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # TypeScript check (no emit)
npm run db:push      # Push Supabase migrations to remote
npm run db:reset     # Reset local Supabase database
npm run db:types     # Regenerate TypeScript types from DB schema
```

No test runner is configured yet. Node.js 20+ required.

## Architecture

### Routing (Next.js 15 App Router)

Three route groups with distinct auth requirements:
- `(auth)/` — public login/register/forgot-password pages
- `(onboarding)/` — 6-step onboarding wizard (post-registration, pre-dashboard)
- `(dashboard)/` — all protected pages; `layout.tsx` enforces auth + onboarding completion

`src/middleware.ts` guards the route groups at the edge before any page renders.

### AI Layer (`src/lib/ai/`)

`client.ts` is the unified AI client with a fallback chain: **Gemini 2.5 Flash → OpenRouter → Ollama**. It exposes `generateText()`, `streamText()`, and `generateEmbedding()`. All AI route handlers call this client — never call provider SDKs directly from routes.

`prompts.ts` holds all system prompts (tutor, planner, viva, case simulator). When adding a new AI feature, add its prompt here.

### API Routes (`src/app/api/`)

All route handlers run on Vercel Edge Runtime (60s max). Streaming responses use Server-Sent Events with `text/plain` content type. Auth is validated via Supabase JWT at the start of every handler.

Key flows:
- **AI Tutor** (`/api/ai/tutor`): Auth → optional pgvector RAG lookup → Gemini streaming → SSE to client
- **Study Plan** (`/api/ai/planner`): Auth → build prompt from profile → Gemini JSON → save to `study_plans` + `study_sessions` + `revision_schedule`
- **PDF Upload** (`/api/upload`): Auth → Supabase Storage → pdfjs text extraction → Gemini embeddings (text-embedding-004) → pgvector in `document_chunks`

### Database (`supabase/`)

PostgreSQL via Supabase with pgvector for embeddings. All user-data tables have Row Level Security (RLS); students can only access their own rows. Use `createAdminClient()` only in server-side code that needs to bypass RLS (e.g., admin routes, background jobs).

Two Supabase client files (split to avoid `next/headers` bundling into Client Components):
- `src/lib/db/supabase.ts` — `createClient()` browser client, safe to import in Client Components
- `src/lib/db/supabase-server.ts` — `createServerSupabaseClient()` and `createAdminClient()`, server-only; never import in Client Components

The `src/types/supabase.ts` file is a hand-written stub. Run `npm run db:types` after connecting the Supabase CLI to regenerate it with full type safety. Until then, server components use `as any` casts on query results.

### Spaced Repetition

Flashcards use the SM-2 algorithm. Revision intervals: 1, 3, 7, 15, 30, 60 days. Logic lives in the flashcards API route and `revision_schedule` table.

### Frontend State

React Query (TanStack v5) for server state. Zustand is installed but stores are not yet populated — the `src/store/` directory is empty. `src/lib/hooks/` and `src/lib/validations/` are also empty stubs ready for new additions.

### Path Aliases

Configured in `tsconfig.json`:
- `@/*` → `src/*`
- `@/components/*`, `@/lib/*`, `@/types/*`, `@/store/*`, `@/styles/*`

### Environment Variables

See `.env.example` for required variables: Supabase URL/keys, Gemini API key, OpenRouter API key, PostHog key, and feature flags. Copy to `.env.local` for local development.

### Subjects

The 6 BDS final-year subjects are defined in `src/lib/constants/subjects.ts`. This is the source of truth for subject IDs and metadata used across the app.

## Key Docs

- `docs/ARCHITECTURE.md` — detailed data flows, security model, scalability notes
- `docs/SETUP.md` — full developer setup and Vercel deployment guide
- `docs/PRD.md` — product requirements and feature specifications
- `supabase/migrations/001_initial_schema.sql` — complete DB schema with RLS policies

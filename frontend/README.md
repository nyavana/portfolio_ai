# Portfolio AI — Frontend

React 19 + Vite 7 + TypeScript frontend for the Portfolio AI Assistant.

## Stack

- **React 19** — UI framework
- **Vite 7** — dev server and build tool
- **TypeScript** — strict mode, `erasableSyntaxOnly: true`
- **CSS Modules** — "Dark Terminal Editorial" design system, no CSS framework
- **React Router 7** — client-side routing

## Quick Start

```bash
npm install
npm run dev        # → http://localhost:5173  (requires backend on :8000)
npm run build      # production build → dist/
npm run lint       # ESLint flat config
npm run preview    # preview the production build locally
```

## API Configuration

The frontend sends all LLM credentials as request headers on every call — it never stores them server-side:

| Header | Purpose |
|---|---|
| `X-Api-Key` | User's LLM API key (set via Settings modal) |
| `X-Api-Base-Url` | Optional endpoint override |
| `X-Api-Model` | Optional model override |

Set via the gear icon (Settings modal). On first load, if `api_key_configured` is `false` in `/health`, the modal auto-opens.

Override the API base URL for local dev:

```bash
# frontend/.env.local
VITE_API_BASE_URL=http://127.0.0.1:8000
```

In Docker (single-container), `VITE_API_BASE_URL=""` at build time makes all API calls relative to the same origin.

## Project Structure

```
src/
├── api/           # Typed fetch wrappers (client.ts, system.ts, chat.ts, …)
├── components/    # Layout shell, AiCard, charts, Settings modal
├── hooks/         # useApi (generic GET), useChatHistory
├── pages/         # Dashboard, RiskFlags, NewsImpact, Chat, Upload, Status
├── styles/        # CSS design tokens, global reset
└── types/api.ts   # TypeScript interfaces mirroring all backend contracts
```

## Code Conventions

- Named exports only — no default-export components.
- `readonly` on all interface properties.
- `import type` for type-only imports (`verbatimModuleSyntax: true`).
- No TypeScript `enum` — use `const` maps.
- No `console.log` in production code.
- All API calls go through `src/api/client.ts` (`apiGet`, `apiPost`, `apiUpload`).

See `AGENTS.md` in the repo root for full project conventions.

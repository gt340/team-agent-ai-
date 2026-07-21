# Atlas — Team Agent AI Website

A production-ready Next.js 15 + TypeScript + Tailwind marketing site for a
unified AI agent team product, with an immersive React Three Fiber hero.

## Run it

```bash
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000. Requires Node 18.18+.

```bash
npm run build && npm run start   # production build
```

## The live agent console

The orange button in the bottom-right corner is a real, working chat
widget — it calls `POST /api/agent`, which runs the actual orchestrator
in `server/orchestrator.ts` (routes to a specialist, runs the tool-use
loop, returns a real Claude response).

**What actually works end-to-end today:** the `code` agent, wired to
GitHub's official remote MCP server (`https://api.githubcopilot.com/mcp/readonly`
— confirmed at [github.com/github/github-mcp-server](https://github.com/github/github-mcp-server/blob/main/docs/remote-server.md)).
Set `GITHUB_MCP_TOKEN` in `.env.local` to a GitHub personal access token
and ask the console something like "what's in this repo?" or "summarize
open pull requests" — it's a real call to a real GitHub server. It's
pinned to `/readonly`, so it can search and read but has no write tools
available at all (by GitHub's own server-side restriction, not just a
prompt instruction).

The `insight` agent also responds directly since it has no MCP servers
attached at all.

**Partially wired:** `support` and `flow` point at Slack's real, verified
endpoint (`https://mcp.slack.com/mcp` — confirmed via its own OAuth
discovery document at `mcp.slack.com/.well-known/oauth-authorization-server`).
Unlike GitHub's PAT, this needed a real OAuth 2.1 + PKCE authorization-code
flow, which is now implemented (`server/mcp/slack-oauth.ts`,
`server/credentials/store.ts`, `app/api/oauth/slack/start` + `/callback`),
including automatic token refresh. To connect a workspace:

1. Create an app at [api.slack.com/apps](https://api.slack.com/apps),
   open **Agents & AI Apps → Enable MCP**.
2. Under **OAuth & Permissions**, add a redirect URL matching
   `SLACK_REDIRECT_URI` (default `http://localhost:3000/api/oauth/slack/callback`).
3. Copy the app's Client ID / Client Secret into `.env.local` as
   `SLACK_CLIENT_ID` / `SLACK_CLIENT_SECRET`.
4. With the dev server running, visit `/api/oauth/slack/start` in a
   browser, approve the Slack prompt — you'll land on `/connections`
   showing Slack as connected once the token exchange succeeds.
5. `support` and `flow` can now reach Slack for real, refreshing their
   token automatically as it nears expiry. Visit `/connections` any time
   to check status or disconnect.

One caveat I can't fully close from here: the token endpoint's exact JSON
response shape isn't independently verified against a live call (no
network access in the environment I built this in) — Slack's Web API
often wraps responses as `{ ok, ... }` rather than plain OAuth JSON, so
`parseTokenResponse` in `slack-oauth.ts` checks both shapes, but log the
raw response the first time you run step 4 for real and adjust if it
doesn't match.

**What's still a placeholder:** `docs`, `zendesk` (used by `support`),
`gmail` (used by `flow`), and `write` all reference Drive/Notion/Zendesk/
Gmail, none of which have a verified MCP endpoint yet — they're marked
`verified: false` in `server/mcp/servers.config.ts` and get silently
skipped, so those agents still respond, just without those tools.

## API routes

- `POST /api/agent` — `{ text, tenantId?, channel?, history? }` → `{ agentId, response }`
- `GET /api/agent/approvals/:id` — check a pending guardrail approval
- `POST /api/agent/approvals/:id` — `{ decision: "approved" | "rejected", resolvedBy }`

## Wiring up the next integration

1. Set up the provider's app/OAuth flow to get a real MCP server URL
   (Drive and Notion both require creating an app in their respective
   developer consoles — there's no shortcut like GitHub's PAT for either).
2. Add the real URL to `MCP_SERVERS` in `server/mcp/servers.config.ts`,
   flip `verified: true`, and set `authMethod` honestly (`"pat"` only if
   the provider genuinely supports a static token — most don't).
3. Set the matching env var (`DRIVE_MCP_TOKEN`, etc.) — `getTenantToken()`
   already reads `<SERVICE>_MCP_TOKEN` generically, no code change needed.
4. Make one test call with `allowedTools: []` on that agent (allows
   everything the server exposes) so you can see the real tool names in
   the response, then narrow `allowedTools` in `server/agents/index.ts`
   down to exactly what that agent should be able to call.
5. If it's OAuth-based like Slack, reuse the pattern in `server/mcp/slack-oauth.ts`
   and `app/api/oauth/slack/` rather than a manually-pasted token — you
   already have a working reference for the PKCE + refresh mechanics.
6. Move `server/credentials/store.ts` off its in-memory `Map` onto a real
   encrypted table before any tenant other than you relies on it — and
   do the same for `server/guardrails/approval.ts`'s queue.
7. Swap `tenantId: "demo-tenant"` in `app/api/agent/route.ts` (and
   `app/api/oauth/slack/start/route.ts`) for the real tenant id from your
   auth session once auth exists.

## Project structure

```
app/
  layout.tsx        Fonts, metadata, global providers (smooth scroll, cursor)
  page.tsx           Section order
  globals.css        Design tokens as CSS, focus states, reduced-motion rules
components/
  Nav.tsx
  Hero3D.tsx         Canvas mount + overlay copy + pointer tracking
  three/
    Scene.tsx        Composes orb + agent nodes + particles + postprocessing
    TeamOrb.tsx       Central signature element
    AgentNode.tsx     Orbiting sub-agent + data-stream line + label
    Particles.tsx     Ambient point field
  TeamSection.tsx     Agent cards
  Capabilities.tsx    Bento grid
  Integrations.tsx    Dual marquee
  HowItWorks.tsx      Numbered sequence (real 4-step onboarding flow)
  DashboardPreview.tsx Tilgit glass panel with live-feeling activity feed
  Testimonials.tsx
  Pricing.tsx
  Footer.tsx
  SmoothScroll.tsx    Lenis
  CursorFX.tsx        Custom cursor, desktop only
lib/
  data.ts             All copy/content in one place — edit here first
```

## Design system

**Palette**
| Token | Hex | Use |
|---|---|---|
| `base-950` | `#0A0B0D` | Primary background |
| `base-800` | `#14161A` | Card surfaces |
| `ink` | `#F5F3EE` | Primary text (warm off-white, not pure white) |
| `ink-muted` | `#9A9FA8` | Secondary text |
| `heat` | `#FA5D19` | Primary accent — CTAs, the orb core |
| `volt` | `#3DD9EB` | Secondary accent — data streams, links |
| `signal` | `#4ADE80` | Live/status indicators only |

**Type**
- Display: Bricolage Grotesque (bold, geometric, a little unexpected — avoids the generic Inter-everywhere look)
- Body: Inter
- Utility/mono: JetBrains Mono, used for labels, timestamps, eyebrows

**Signature element**: the holographic Team Orb — a distorted icosahedron
core with two counter-rotating wireframe shells and six orbiting,
labeled agent nodes connected by live data-stream lines. The same motif
recurs in miniature (nav mark, footer mark) so it reads as a system, not
a one-off hero effect.

**Anti-patterns avoided**: no warm-cream/terracotta serif template, no
generic centered-stat hero, numbered steps used only where a real
sequence exists (How It Works), no stock "AI slop" gradient blobs behind
copy without a compositional reason.

## Performance notes

- `Hero3D` lazy-loads the R3F `Scene` via `next/dynamic` with `ssr: false`.
- Device capability check (`window.innerWidth < 768`) drops particle count,
  disables postprocessing, and caps DPR at 1.3 for a graceful 2.5D mobile
  fallback, per the brief.
- `prefers-reduced-motion` disables camera parallax, marquees, and the
  particle field via the `reduced` flag and the global CSS media query.
- Bloom uses `mipmapBlur` and `multisampling={0}` to stay cheap on
  integrated GPUs; drop `DepthOfField` first if you need more headroom.

## Customization

- All copy and content lives in `lib/data.ts` — agents, integrations,
  pricing, testimonials, steps. Edit there, not in components.
- Swap the accent colors in `tailwind.config.ts` (`heat` / `volt`) — every
  component references the token, not a hard-coded hex.
- To add a 7th agent orbiting the core, add one entry to the `AGENTS`
  array in `components/three/Scene.tsx` and one to `agents` in `lib/data.ts`.
- Fonts are loaded via `next/font/google` in `app/layout.tsx` — swap
  `Bricolage_Grotesque` for a licensed display face (e.g. Departure Mono,
  Clash Display via a local `@font-face`) by replacing that import.

## Deployment

Optimized for Vercel (zero-config for Next.js 15 App Router):

```bash
npm i -g vercel
vercel
```

Any Node host works too (`npm run build && npm run start`, or export via a
custom server). No environment variables are required for the base site.

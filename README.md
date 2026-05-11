# Shortcut Showdown API

```mermaid
flowchart TB
    subgraph Clients["Game Clients"]
        C1["Player 1<br/>(Browser)"]
        C2["Player 2<br/>(Browser)"]
        CN["Player N<br/>(Browser)"]
    end

    subgraph Vercel["Vercel (Edge)"]
        FE["Next.js 16 App Router<br/>React 19 + Tailwind<br/>WS client + REST fallback"]
    end

    subgraph Render["Render (Origin)"]
        BE["FastAPI ASGI Server<br/>uvicorn worker<br/>(single instance)"]
    end

    C1 -->|HTTPS<br/>page loads| FE
    C2 -->|HTTPS<br/>page loads| FE
    CN -->|HTTPS<br/>page loads| FE

    FE -.->|REST snapshots<br/>fallback only| BE
    C1 ===|"WSS /ws<br/>(primary realtime)"| BE
    C2 ===|"WSS /ws<br/>(primary realtime)"| BE
    CN ===|"WSS /ws<br/>(primary realtime)"| BE

    classDef client fill:#dbeafe,stroke:#1e40af
    classDef edge fill:#fef3c7,stroke:#a16207
    classDef origin fill:#dcfce7,stroke:#15803d
    class C1,C2,CN client
    class FE edge
    class BE origin
```

Backend and HTTP surface for **Shortcut Showdown**, implemented with the [Next.js](https://nextjs.org) App Router. The stack uses **TypeScript**, **React 19**, and **Tailwind CSS** for any app-facing routes and tooling.

## Requirements

- Node.js (LTS recommended)
- [pnpm](https://pnpm.io) (see `package.json` → `packageManager` for the version Corepack should use)

## Setup

Install dependencies:

```bash
pnpm install
```

## Scripts

| Command       | Description              |
| ------------- | ------------------------ |
| `pnpm dev` | Start the dev server     |
| `pnpm build` | Production build       |
| `pnpm start`   | Run the production server |
| `pnpm lint` | Run ESLint              |

Local development defaults to [http://localhost:3000](http://localhost:3000).

## Project layout

- `app/` — App Router entry (`layout.tsx`, `page.tsx`, and future API routes under `app/api/` as you add them)

---

## 👥 Team

<div align="center">

<table>
<tr>
<td align="center" width="50%" valign="top">
  <img src="https://github.com/hdmGOAT.png" width="88" height="88" alt="Hans Matthew Del Mundo" /><br />
  <strong>Hans Matthew Del Mundo</strong><br />
  <a href="https://github.com/hdmGOAT"><kbd>@hdmGOAT</kbd></a>
</td>
<td align="center" width="50%" valign="top">
  <img src="https://github.com/potakaaa.png" width="88" height="88" alt="Gerald Helbiro Jr." /><br />
  <strong>Gerald Helbiro Jr.</strong><br />
  <a href="https://github.com/potakaaa"><kbd>@potakaaa</kbd></a>
</td>
</tr>
<tr>
<td align="center" width="50%" valign="top">
  <img src="https://github.com/areeesss.png" width="88" height="88" alt="Vin Marcus Gerebise" /><br />
  <strong>Vin Marcus Gerebise</strong><br />
  <a href="https://github.com/areeesss"><kbd>@areeesss</kbd></a>
</td>
<td align="center" width="50%" valign="top">
  <img src="https://github.com/unripelo.png" width="88" height="88" alt="Ira Chloie Narisma" /><br />
  <strong>Ira Chloie Narisma</strong><br />
  <a href="https://github.com/unripelo"><kbd>@unripelo</kbd></a>
</td>
</tr>
</table>

</div>

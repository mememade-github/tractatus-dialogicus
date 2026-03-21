# REFERENCE.md -- Commands & Procedures

> Actionable commands and project reference.
> For project overview, see [CLAUDE.md](CLAUDE.md).

---

## Directory Structure

```
tractatus-dialogicus/
├── CLAUDE.md               # Project instructions
├── REFERENCE.md            # This file
├── README.md               # Project description (EN)
├── README_KO.md            # Project description (KO)
├── metadata.json           # Project metadata
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite build config (port 3000)
├── index.html              # HTML entry point
├── index.tsx               # App entry point
├── App.tsx                 # Main application (session management)
├── constants.ts            # System prompt (INPUT/TRACE/OUTPUT)
├── types.ts                # TypeScript interfaces (ChatState, Message)
├── components/
│   ├── ChatMessage.tsx      # Tractatus-style numbered messages
│   ├── ContextInspector.tsx # Raw prompt context viewer
│   ├── ErrorBoundary.tsx    # Error boundary
│   ├── ReasoningPanel.tsx   # TRACE reasoning display
│   ├── Sidebar.tsx          # Session list and management
│   └── TokenInspectorModal.tsx  # Phase 1/2 raw data inspector
├── services/
│   └── gemini.ts           # 3-phase pipeline (TRACE -> OUTPUT -> translate)
└── history/
    └── exampleData.ts      # Wittgenstein TLP example conversation
```

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server (port 3000)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @google/genai | ^1.34.0 | Google Gemini API SDK |
| react | ^19.2.3 | UI framework |
| react-dom | ^19.2.3 | React DOM renderer |
| vite | ^6.2.0 | Build tool and dev server |
| typescript | ~5.8.2 | TypeScript compiler |
| @vitejs/plugin-react | ^5.0.0 | Vite React plugin |

## Environment Variables

| Variable | Source | Used By |
|----------|--------|---------|
| GEMINI_API_KEY | `.env` (local, gitignored) | vite.config.ts -> services/gemini.ts |

## Services

| Service | Port | URL |
|---------|------|-----|
| Vite dev server | 3000 | http://localhost:3000 |

---

*Last updated: 2026-03-21*

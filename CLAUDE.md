# CLAUDE.md -- Tractatus Dialogicus

## Identity

- **Project**: Tractatus Dialogicus
- **Path**: `/workspaces/products/derived/tractatus-dialogicus/`
- **Tech Stack**: React 19, TypeScript 5.8, Vite 6.2, Google GenAI SDK 1.34
- **Purpose**: Google Gemini API 기반 논리적 추론 웹 애플리케이션. 사용자 입력을 3단계 파이프라인(TRACE 추론 -> OUTPUT 생성 -> 이중 언어 동기화)으로 변환. Wittgenstein의 Tractatus Logico-Philosophicus를 철학적 프레임워크로 활용.

## Project Structure

```
tractatus-dialogicus/
├── CLAUDE.md               # Project instructions (this file)
├── REFERENCE.md            # Commands and procedures
├── README.md / README_KO.md # Project description (EN/KO)
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite config (port 3000)
├── tsconfig.json           # TypeScript configuration
├── index.html              # HTML entry point
├── index.tsx               # App entry point
├── App.tsx                 # Main app (session management, localStorage)
├── constants.ts            # System prompt (INPUT/TRACE/OUTPUT fields)
├── types.ts                # Interfaces (ChatState, Message, SavedSession)
├── components/             # UI components
│   ├── ChatMessage.tsx      # Tractatus-style numbered messages (N.0, N.1)
│   ├── ContextInspector.tsx # Raw prompt context viewer
│   ├── ErrorBoundary.tsx    # Error boundary
│   ├── ReasoningPanel.tsx   # TRACE reasoning display
│   ├── Sidebar.tsx          # Session list and management
│   └── TokenInspectorModal.tsx  # Phase 1/2 raw data inspector
├── services/
│   └── gemini.ts           # 3-phase Gemini API pipeline
└── history/
    └── exampleData.ts      # Wittgenstein TLP example conversation
```

## Core Architecture

### 3-Phase Message Pipeline (services/gemini.ts)

| Phase | Function | Model | Purpose |
|-------|----------|-------|---------|
| 1 | `getReasoningTrace()` | gemini-3-pro-preview | TRACE 논리적 추론 생성 (thinkingBudget: 32768) |
| 2 | `getManifestation()` | gemini-3-pro-preview | TRACE 기반 OUTPUT 생성 |
| 3 | `translateTurn()` | gemini-3-flash-preview | 한/영 이중 언어 동기화 |

- TRACE가 다음 턴의 컨텍스트에 재주입 (Metacognitive Persistence)
- 모든 API 호출에 지수 백오프 재시도 적용 (최대 5회)

### Bilingual State Management

`ChatState`: `historyKO` + `historyEN` 병렬 유지, 언어 전환 시 즉시 해당 이력으로 전환.

### Session Management

- localStorage 기반 자동 저장 (500ms debounce)
- 최대 10개 세션 유지, JSON import/export 지원

## Core Principles

1. **Verify before claim** -- 실행 결과로 검증한 후에만 동작을 주장
2. **Read first** -- 기존 코드를 읽은 후 수정
3. **No secrets** -- API 키를 코드에 하드코딩하지 않음 (`.env` 사용)

## Coding Rules

1. **TypeScript strict** -- 타입 안전성 유지
2. **React 19 패턴** -- 함수형 컴포넌트, hooks 사용
3. **단일 책임** -- 컴포넌트별 명확한 역할 분리
4. **Vite 빌드** -- `npm run build`로 프로덕션 빌드 검증

## Build & Test

```bash
# Install dependencies
npm install

# Dev server (port 3000)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Communication

- **Language**: 사용자에게 응답할 때 반드시 한국어를 사용합니다.

## Environment

- **Dev Server**: Vite, port 3000
- **API Key**: `GEMINI_API_KEY` in `.env` (local, gitignored)
- **Node.js**: Required for npm/Vite toolchain

@REFERENCE.md

---

*Last updated: 2026-03-21*

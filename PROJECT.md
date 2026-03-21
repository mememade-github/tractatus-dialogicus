# PROJECT.md — Tractatus Dialogicus Domain Context

> Gemini API 기반 논리적 추론 웹 애플리케이션.
> For governance rules, see [CLAUDE.md](CLAUDE.md).
> For commands and procedures, see [REFERENCE.md](REFERENCE.md).

---

## Overview

Google Gemini API를 활용한 3단계 파이프라인(TRACE 추론 -> OUTPUT 생성 -> 이중 언어 동기화) 기반 논리적 추론 웹 애플리케이션. Wittgenstein의 Tractatus Logico-Philosophicus를 철학적 프레임워크로 활용합니다.

## Tech Stack

| Category | Technology |
|----------|-----------|
| Frontend | React 19, TypeScript 5.8 |
| Build | Vite 6.2 |
| AI | Google Gemini API (gemini-3-pro-preview, gemini-3-flash-preview) |
| State | localStorage (session persistence) |

## Services

| Service | Port | URL |
|---------|------|-----|
| Vite dev server | 3000 | http://localhost:3000 |

## Environment

| Variable | Source | Purpose |
|----------|--------|---------|
| GEMINI_API_KEY | `.env` (gitignored) | Google Gemini API access |

---

*Last updated: 2026-03-22*

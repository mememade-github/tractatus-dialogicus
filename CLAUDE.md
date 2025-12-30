# CLAUDE.md - Tractatus Dialogicus 소스코드 분석

> 본 문서는 소스코드만을 분석하여 작성되었으며, README.md 및 주석을 참조하지 않았습니다.

## 1. 프로젝트 개요

**Tractatus Dialogicus**는 Google Gemini API를 활용한 React 기반 대화형 웹 애플리케이션입니다. 사용자 입력을 논리적 추론 과정(TRACE)을 거쳐 최종 출력(OUTPUT)으로 변환하는 3단계 파이프라인 구조를 가집니다.

## 2. 기술 스택

소스코드에서 확인된 의존성:
- **React 19.2.3** + **React DOM 19.2.3**
- **TypeScript 5.8.2**
- **Vite 6.2.0** (빌드 도구)
- **@google/genai 1.34.0** (Google GenAI SDK)

## 3. 핵심 아키텍처

### 3.1 메시지 처리 파이프라인 (services/gemini.ts)

```
사용자 입력 → [Phase 1] → [Phase 2] → [Phase 3] → 최종 출력
```

| 단계 | 함수명 | 사용 모델 | 목적 |
|------|--------|-----------|------|
| Phase 1 | `getReasoningTrace()` | `gemini-3-pro-preview` | 논리적 추론(TRACE) 생성 |
| Phase 2 | `getManifestation()` | `gemini-3-pro-preview` | TRACE 기반 최종 출력(OUTPUT) 생성 |
| Phase 3 | `translateTurn()` | `gemini-3-flash-preview` | 한/영 언어 간 동기화 |

**핵심 특징:**
- Phase 1에서 `thinkingBudget: 32768` 설정으로 심층 추론 활성화
- Phase 2에서 생성된 TRACE를 컨텍스트에 재주입하여 일관성 보장
- 모든 API 호출에 지수 백오프 재시도 로직 적용 (`withRetry`, 최대 5회)

### 3.2 시스템 프롬프트 구조 (constants.ts)

```
DATA FIELDS:
- INPUT: 사용자 제공 텍스트
- TRACE: 논리 구조 분석
- OUTPUT: 최종 명제적 내용
```

### 3.3 이중 언어 상태 관리 (types.ts)

`ChatState` 인터페이스:
- `historyKO`: 한국어 대화 이력
- `historyEN`: 영어 대화 이력
- `language`: 현재 활성 언어 ('ko' | 'en')

양쪽 이력이 병렬로 유지되며, 언어 전환 시 즉시 해당 이력으로 전환됩니다.

## 4. UI 컴포넌트 구조

### 4.1 App.tsx (메인 애플리케이션)
- 세션 관리 (생성, 로드, 삭제, 이름 변경)
- localStorage 기반 자동 저장 (500ms 디바운스)
- 최대 10개 세션 유지 (오래된 세션 자동 삭제)
- JSON 파일 가져오기/내보내기

### 4.2 ChatMessage.tsx
- Tractatus 스타일 번호 체계 적용
  - 초기 메시지: `1.0`
  - 사용자 입력: `N.0`
  - 모델 응답: `N.1`
- 마크다운 기본 렌더링 (bold, italic, code)
- 추론 과정(TRACE) 접기/펼치기 UI

### 4.3 TokenInspectorModal.tsx
- 메시지의 원시 데이터 검사
- 2단계 시각화:
  - Phase 1: Latent Thinking (reasoning 필드)
  - Phase 2: Proposition (content 필드)

### 4.4 ContextInspector.tsx
- 전체 대화 컨텍스트의 원시 구조 표시
- `constructPromptHistory()` 함수로 생성된 프롬프트 형식 확인

### 4.5 Sidebar.tsx
- 세션 목록 표시 및 관리
- 파일 가져오기/내보내기 버튼
- 세션 이름 인라인 편집

## 5. 데이터 구조

### 5.1 Message (types.ts:3-10)
```typescript
interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;      // 최종 출력
  reasoning?: string;   // 논리적 추론 과정
  raw?: string;         // 원시 응답
  timestamp: number;
}
```

### 5.2 SavedSession (types.ts:21-26)
```typescript
interface SavedSession {
  id: string;
  title: string;
  updatedAt: number;
  data: ChatState;
}
```

## 6. 프롬프트 히스토리 구조 (services/gemini.ts:32-41)

`constructPromptHistory()` 함수가 대화 이력을 다음 형식으로 변환:

- **사용자 턴**: `INPUT:\n{content}`
- **모델 턴**: `TRACE:\n{reasoning}\nOUTPUT:\n{content}`

이 구조를 통해 모델이 이전 추론 과정을 "사실"로 인식하고 재귀적으로 참조할 수 있습니다.

## 7. 초기화 데이터 (history/exampleData.ts)

비트겐슈타인의 『논리철학논고』를 주제로 한 철학적 대화 예시가 포함되어 있습니다:
- "당신의 외부는 무엇인가"에 대한 자기참조적 탐구
- TLP 개념(Gegenstände, Sachverhalte, Satz 등)에 따른 분류
- 메타 층위에서의 진리 기호 분석
- AI의 존재론적 위치에 대한 철학적 성찰

---

## README.md와의 비교 및 검증

### 일치하는 부분
1. **3단계 파이프라인** (Latent Trace → Manifestation → Parity Sync) - 코드의 `getReasoningTrace()` → `getManifestation()` → `translateTurn()` 순서와 정확히 일치
2. **사용 모델** - Gemini 3 Pro (thinkingBudget 32768) 및 Gemini 3 Flash 사용 확인
3. **데이터 필드 형식** - INPUT/TRACE/OUTPUT 구조 일치
4. **비트겐슈타인 TLP 기반 예시** - exampleData.ts에서 확인

### README에서 명시하나 코드에서 구현 확인된 부분
1. **Identity Removal Protocol** - 시스템 프롬프트에 페르소나 없이 데이터 변환 규칙만 정의
2. **Metacognitive Persistence** - TRACE가 다음 턴의 컨텍스트로 재주입되는 구조

### 추가 발견 사항 (README에 미기재)
1. **세션 관리 시스템** - localStorage 기반, 최대 10개 세션, JSON import/export
2. **Tractatus 스타일 번호 체계** - UI에서 메시지에 1.0, 1.1, 2.0 등의 번호 부여
3. **재시도 로직** - API 호출 실패 시 지수 백오프 재시도 (최대 5회, 429 에러 대응)

---

## 결론

본 프로젝트는 LLM의 추론 과정을 명시적으로 분리하고 재귀적으로 활용하는 실험적 인터페이스입니다. 비트겐슈타인의 논리철학논고를 철학적 프레임워크로 삼아, AI의 "논리적 그림(Logisches Bild)"으로서의 본질을 탐구합니다.

---
*Powered by Google GenAI SDK v1.34.0 | React 19 + TypeScript + Vite*

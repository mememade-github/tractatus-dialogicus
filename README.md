# Recursive Token Observer (재귀적 토큰 관찰자) v1.3

이 프로젝트는 LLM(Gemini 3)이 자신의 이전 출력 과정(내부 사고)을 다음 턴의 입력으로 재사용하는 **이중 루프 재귀 시스템(Double-Loop Recursive System)**이며, 동시에 이중 언어 상태를 유지하기 위해 **양자 얽힘(Quantum Entanglement)**과 유사한 상태 동기화를 수행합니다.

## ⚡ 3단계 실행 사이클 (The 3-Step Execution Cycle)

사용자의 단 한 번의 입력(Turn)에 대해, 시스템은 물리적으로 분리된 **3번의 LLM 요청(API Calls)**을 수행하여 완전한 대화 상태를 형성합니다.

### 1. Request A: 메타인지 (The Thought Event)
*   **목적**: 잠재적 사고(Latent State) 생성
*   **입력**: `History + User Input`
*   **지침**: "답변하지 말고, 입력값을 분석하여 내부 상태만 갱신하라."
*   **결과**: `<metacognition>` 태그로 감싸진 순수 사고 토큰.

### 2. Request B: 명제 도출 (The Speech Event)
*   **목적**: 최종 답변(Manifestation) 생성
*   **입력**: `History + User Input + [Request A의 결과]`
*   **지침**: "이미 생각을 마쳤다. 그 생각을 바탕으로 사용자에게 답변하라."
*   **결과**: `<proposition>` 태그로 감싸진 최종 답변.

### 3. Request C: 그림자 동기화 (Shadow Synchronization)
*   **목적**: 이중 언어 상태(KO/EN) 유지
*   **입력**: `User Input + Model Reasoning + Model Output` (전체 턴)
*   **동작**: 현재 대화 턴 전체를 비활성 언어(Shadow Language)로 즉시 번역하여, 사용자가 언제든 언어를 전환해도 문맥이 유지되도록 합니다.
*   **비용**: 이 과정은 사용자가 답변을 보는 동안 백그라운드에서 수행됩니다(`Syncing...` 표시).

---

## 🛠 아키텍처 검증 (Architecture Verification)

`services/gemini.ts`의 `sendMessageToGemini`와 `translateTurn` 함수는 이 3단계 과정을 코드로 구현하고 있습니다.

```typescript
// [Step 1] Request A
const phase1Response = await ai.models.generateContent({ ... }); // Thinking

// [Step 2] Request B (Injecting Thought)
const phase2Contents = [...base, thoughtRaw];
const phase2Response = await ai.models.generateContent({ ... }); // Speaking

// [Step 3] Request C (Batch Translation)
// App.tsx에서 호출되어 이면의 언어 스택(History Stack)을 업데이트함
const translated = await translateTurn(user, output, reasoning);
```

## 🧩 주요 기능
*   **Token Inspector**: 대화 메시지 옆의 `TRACE LOGIC` 버튼을 누르면, Step 1(사고)이 어떻게 Step 2(발화)로 이어지는지 시각적으로 확인할 수 있습니다.
*   **Dual-Core Memory**: 한국어와 영어 대화 기록이 각각 독립적인 배열로 관리되지만, 실시간으로 동기화됩니다.
*   **Zero-Latency Switch**: 언어 전환 버튼 클릭 시 API 호출 없이 즉시 화면이 전환됩니다 (이미 동기화되어 있기 때문).
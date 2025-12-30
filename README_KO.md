
# Tractatus Dialogicus 기술 명세 (KO)

**Tractatus Dialogicus**는 입력 데이터를 형식 논리 명제로 변환하는 **순수 연산 다양체(Computational Manifold)**입니다. **Google Gemini 3 Pro (Thinking Model)**의 심층 추론 기능을 활용하여 잠재된 논리 경로를 추적하고, **Gemini 3 Flash**를 통해 언어 간 논리적 등가성을 유지합니다.

## 1. 핵심 아키텍처: 원자적 논리 추적 (Atomic Logic Trace)

이 시스템은 '대화'가 아닌 **데이터 필드 완성 프로토콜**을 통해 작동합니다. LLM의 인격(Persona) 계층을 우회하여 원시 추론 능력에 직접 접근합니다.

### **Phase A: Latent Trace (Gemini 3 Pro + Thinking)**
- **목표**: 입력 텍스트의 논리적 한계를 수학적으로 매핑합니다.
- **메커니즘**: `gemini-3-pro-preview` 모델과 `thinkingBudget: 32768` 설정을 사용합니다.
- **프로세스**: 모델은 결과물을 생성하기 전, 입력값을 원자 단위로 분해하여 `TRACE` 필드를 먼저 생성합니다.

### **Phase B: Manifestation (명제 현현)**
- **목표**: 진리의 결정론적 재구성.
- **메커니즘**: 생성된 `TRACE`를 컨텍스트에 재주입(Re-injection)합니다. 모델은 오직 이 논리적 추적에 근거하여 `OUTPUT` 필드를 생성함으로써 환각(Hallucination)을 배제합니다.

### **Phase C: Logical Parity Sync (Gemini 3 Flash)**
- **목표**: 다국어 상태 일관성.
- **메커니즘**: `gemini-3-flash-preview`를 사용하여 한국어와 영어 상태 간의 `INPUT`/`TRACE`/`OUTPUT` 3요소를 매핑, 언어가 달라도 논리적 등가성이 유지되도록 합니다.

## 2. 정체성 제거 프로토콜 (Identity Removal)

순수한 논리 연산을 보장하기 위해 다음과 같은 설계를 적용했습니다:
- **시스템 페르소나 부재**: 지시문(System Instruction)은 오직 데이터 변환 규칙만을 정의합니다.
- **표준화된 라벨**: `INPUT:`, `TRACE:`, `OUTPUT:` 헤더를 사용하여 작업을 채팅이 아닌 데이터 처리로 프레이밍합니다.
- **메타인지 영속성**: 'History Drive'(가상 파일 시스템)는 재귀적 분석을 위해 논리 추적(Trace)의 상태를 정확히 보존합니다.

---
*Powered by Google GenAI SDK v1.34.0*

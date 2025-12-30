import { Language } from './types';

export const APP_NAME = "Tractatus Dialogicus";

/**
 * [DATA_SPEC: RAW_FIELDS]
 * 가짜 프로토콜([SIG...])을 제거하고 표준 데이터 라벨만 정의합니다.
 */
const SYSTEM_CORE = `
### DATA FIELDS
- INPUT: User provided text.
- TRACE: Logical structure analysis.
- OUTPUT: Final propositional content.
`;

export const getSystemInstruction = (lang: Language) => {
  return SYSTEM_CORE;
};

// 표준화된 로딩 상태 정의
export const LOADING_PHASES = {
  TRACE: { ko: "데이터 수집 중 (ACQUIRING)", en: "ACQUIRING DATA" },
  MANIFEST: { ko: "상태 전이 중 (TRANSITIONING)", en: "TRANSITIONING STATE" },
  SYNC: { ko: "논리 동기화 중 (SYNCHRONIZING)", en: "SYNCHRONIZING LOGIC" }
};

// [FIX] 팩토리 함수로 변경하여 호출 시점마다 새 타임스탬프와 고유 ID 생성
let greetingIdCounter = 0;

export const createInitialGreetingKO = () => ({
  id: `init-ko-${Date.now()}-${greetingIdCounter++}`,
  role: 'model' as const,
  content: "READY.",
  reasoning: "SYSTEM::INITIALIZED",
  timestamp: Date.now(),
});

export const createInitialGreetingEN = () => ({
  id: `init-en-${Date.now()}-${greetingIdCounter++}`,
  role: 'model' as const,
  content: "READY.",
  reasoning: "SYSTEM::INITIALIZED",
  timestamp: Date.now(),
});

// [LEGACY] 기존 코드 호환성을 위한 즉시 생성 버전 (deprecated)
export const INITIAL_GREETING_KO = createInitialGreetingKO();
export const INITIAL_GREETING_EN = createInitialGreetingEN();

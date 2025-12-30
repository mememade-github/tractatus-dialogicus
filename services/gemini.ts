import { GoogleGenAI, Type } from "@google/genai";
import { getSystemInstruction } from '../constants';
import { Message, Language } from '../types';

/**
 * [재시도 로직] API 할당량 초과(429) 발생 시 지수 백오프를 적용하여 안정성을 확보합니다.
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 6, initialDelay = 4000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorStr = JSON.stringify(error).toUpperCase();
      const isQuotaLimit = 
        error?.status === 429 || 
        error?.code === 429 || 
        errorStr.includes('429') || 
        errorStr.includes('RESOURCE_EXHAUSTED');
      
      if (isQuotaLimit && i < maxRetries - 1) {
        const delay = (initialDelay * Math.pow(2.2, i)) + (Math.random() * 2000);
        console.warn(`[LOGIC_SATURATION] 할당량 도달. 재시도 중... 대기시간: ${Math.round(delay)}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

/**
 * [대화 이력 구성] 모델의 이전 답변에서 리즈닝(Reasoning)과 콘텐츠(Content)를 모두 포함시켜 
 * 다음 턴의 추론 컨텍스트로 활용합니다.
 */
export const constructPromptHistory = (history: Message[]) => {
  return history.map(msg => ({
    role: msg.role,
    parts: [{ 
      text: msg.role === 'model' 
        ? `LATENT_METAPHYSICS: ${msg.reasoning}\nMANIFESTED_PROPOSITION: ${msg.content}` 
        : msg.content 
    }]
  }));
};

/**
 * [Phase A: Latent Metaphysics (사유의 합성)]
 * 목적: 사용자의 입력을 분석하고 답변 전 내부적인 추론 경로를 구축합니다.
 * 방법: 높은 thinkingBudget을 사용하여 논리적 한계와 내부 상태를 관측합니다.
 */
export const getReasoningTrace = async (history: Message[], input: string, lang: Language): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_UNSET");

  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [...constructPromptHistory(history), { role: 'user', parts: [{ text: input }] }],
      config: {
        systemInstruction: `PHASE_A: METACOGNITIVE_OBSERVATION. 
        사용자의 입력을 분석하고 당신의 처리 과정을 공정하게 관측하십시오.
        아직 최종 답변을 내놓지 마십시오. 오직 'reasoning' 트레이스에만 집중하십시오.
        논리적 모순, 의미적 한계, 추론 유도 과정을 포착하십시오.
        언어: ${lang === 'ko' ? '한국어' : 'English'}.`,
        thinkingConfig: { thinkingBudget: 32768 } // 추론 매니폴드 최대화
      },
    });
    return response.text || "추론 트레이스를 캡처하지 못했습니다.";
  });
};

/**
 * [Phase B: Structural Manifestation (명제의 표명)]
 * 목적: Phase A에서 생성된 추론 트레이스를 바탕으로 최종 명제를 작성합니다.
 * 방법: 사유와 표명 사이의 엄격한 논리적 정합성을 강제합니다.
 */
export const getManifestation = async (history: Message[], input: string, reasoning: string, lang: Language): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_UNSET");

  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        ...constructPromptHistory(history), 
        { role: 'user', parts: [{ text: input }] },
        { role: 'model', parts: [{ text: `SYNTHESIZED_TRACE: ${reasoning}` }] },
        { role: 'user', parts: [{ text: "이제 위 트레이스를 바탕으로 최종적인 구조적 명제를 표명하십시오." }] }
      ],
      config: {
        systemInstruction: `PHASE_B: STRUCTURAL_MANIFESTATION. 
        최종 결론을 제시하십시오. SYNTHESIZED_TRACE에서 확립된 논리를 엄격히 준수하십시오.
        캐릭터 연기를 지양하고 명료하고 정교하게 작성하십시오.
        언어: ${lang === 'ko' ? '한국어' : 'English'}.`,
      },
    });
    return response.text || "명제를 표명하지 못했습니다.";
  });
};

/**
 * [Phase C: Bilingual Parity Sync (한/영 논리적 동기화)]
 * 목적: 한국어와 영어 히스토리가 논리적으로 완벽하게 동일한 상태를 유지하도록 백그라운드에서 번역합니다.
 */
export const translateTurn = async (
  userContent: string,
  modelContent: string,
  modelReasoning: string,
  targetLang: Language
): Promise<{ userContent: string, modelContent: string, modelReasoning: string }> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_UNSET");

  const targetLangName = targetLang === 'ko' ? "한국어" : "English";

  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: `다음 논리적 상태를 ${targetLangName}로 번역하십시오. 
      전문 용어와 철학적 엄밀함을 유지해야 합니다.
      
      USER_INPUT: ${userContent}
      PROPOSITION: ${modelContent}
      TRACE: ${modelReasoning}
      
      반드시 JSON으로 반환: { "u": "사용자 입력 번역", "c": "명제 번역", "r": "추론 트레이스 번역" }`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            u: { type: Type.STRING },
            c: { type: Type.STRING },
            r: { type: Type.STRING }
          },
          required: ["u", "c", "r"]
        }
      }
    });
    const res = JSON.parse(response.text || "{}");
    return { 
      userContent: res.u || userContent, 
      modelContent: res.c || modelContent, 
      modelReasoning: res.r || modelReasoning 
    };
  }, 3, 3000); 
};

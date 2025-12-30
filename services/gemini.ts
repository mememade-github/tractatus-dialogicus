
import { GoogleGenAI, Type } from "@google/genai";
import { Message, Language, ModelType } from '../types';
import { getSystemInstruction } from '../constants';

/**
 * API 호출 실패 시 지수 백오프(Exponential Backoff)를 적용하여 재시도합니다.
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 5, initialDelay = 2000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const status = error?.status || error?.code;
      // 429 Too Many Requests 에러 처리
      if (status === 429 && i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

/**
 * 대화 기록을 단순 텍스트 데이터 블록으로 변환합니다.
 * LLM의 역할극(Roleplay)을 방지하기 위해 'role' 대신 명시적인 데이터 라벨(TRACE, OUTPUT, INPUT)을 사용합니다.
 */
export const constructPromptHistory = (history: Message[]) => {
  return history.map(msg => ({
    role: msg.role,
    parts: [{ 
      text: msg.role === 'model' 
        ? `TRACE:\n${msg.reasoning}\nOUTPUT:\n${msg.content}` 
        : `INPUT:\n${msg.content}` 
    }]
  }));
};

/**
 * [Phase A: Latent Trace Generation]
 * 목적: INPUT에 대한 심층 논리 분석 데이터를 생성합니다. (OUTPUT 필드 제외)
 * 모델: Gemini 3 Pro (Thinking Model)
 */
export const getReasoningTrace = async (history: Message[], input: string, lang: Language): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_UNSET");

  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: ModelType.GEMINI_3_PRO,
      contents: [
        ...constructPromptHistory(history), 
        { role: 'user', parts: [{ text: `INPUT:\n${input}\n\nGenerate TRACE field only.` }] }
      ],
      config: {
        systemInstruction: getSystemInstruction(lang),
        thinkingConfig: { thinkingBudget: 32768 } // Gemini 3 Native Thinking (Max Budget)
      },
    });
    return response.text || "";
  });
};

/**
 * [Phase B: Manifestation]
 * 목적: INPUT과 생성된 TRACE를 기반으로 최종 OUTPUT 필드를 완성합니다.
 * 모델: Gemini 3 Pro
 */
export const getManifestation = async (history: Message[], input: string, reasoning: string, lang: Language): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_UNSET");

  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: ModelType.GEMINI_3_PRO,
      contents: [
        ...constructPromptHistory(history), 
        { role: 'user', parts: [{ text: `INPUT:\n${input}` }] },
        { role: 'model', parts: [{ text: `TRACE:\n${reasoning}` }] }, // Re-inject logical trace
        { role: 'user', parts: [{ text: "Generate OUTPUT field only." }] }
      ],
      config: {
        systemInstruction: getSystemInstruction(lang),
      },
    });
    return response.text || "";
  });
};

/**
 * [Phase C: Data Mapping (Translation)]
 * 목적: 데이터 필드 간의 언어적 매핑 및 동기화를 수행합니다.
 * 모델: Gemini 3 Flash (High Throughput)
 */
export const translateTurn = async (
  userContent: string,
  modelContent: string,
  modelReasoning: string,
  targetLang: Language
): Promise<{ userContent: string, modelContent: string, modelReasoning: string }> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_UNSET");

  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: ModelType.GEMINI_3_FLASH, 
      contents: `TARGET_LANG: ${targetLang.toUpperCase()}
      
      SOURCE_DATA:
      - U: ${userContent}
      - C: ${modelContent}
      - R: ${modelReasoning}`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            u: { type: Type.STRING, description: "Translated User Input" },
            c: { type: Type.STRING, description: "Translated Model Output" },
            r: { type: Type.STRING, description: "Translated Reasoning Trace" }
          },
          required: ["u", "c", "r"]
        }
      }
    });
    const data = JSON.parse(response.text || "{}");
    return {
      userContent: data.u || userContent,
      modelContent: data.c || modelContent,
      modelReasoning: data.r || modelReasoning
    };
  });
};

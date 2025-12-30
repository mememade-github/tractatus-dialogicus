import { GoogleGenAI, Type } from "@google/genai";
import { Message, Language } from '../types';
import { getSystemInstruction } from '../constants';

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 5, initialDelay = 2000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const status = error?.status || error?.code;
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
 * 대화 기록을 단순 텍스트 데이터 블록으로 변환
 * 역할극을 방지하기 위해 'role' 대신 데이터 라벨 사용
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
 * Phase A: Trace Generation
 * 목적: INPUT에 대한 분석 데이터 생성 (OUTPUT 필드 제외)
 */
export const getReasoningTrace = async (history: Message[], input: string, lang: Language): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_UNSET");

  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        ...constructPromptHistory(history), 
        { role: 'user', parts: [{ text: `INPUT:\n${input}\n\nGenerate TRACE field only.` }] }
      ],
      config: {
        systemInstruction: getSystemInstruction(lang),
        thinkingConfig: { thinkingBudget: 32768 } // Gemini 3 Native Thinking 활용
      },
    });
    return response.text || "";
  });
};

/**
 * Phase B: Manifestation
 * 목적: INPUT + TRACE를 기반으로 OUTPUT 필드 완성
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
        { role: 'user', parts: [{ text: `INPUT:\n${input}` }] },
        { role: 'model', parts: [{ text: `TRACE:\n${reasoning}` }] },
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
 * Phase C: Data Mapping (Translation)
 * 목적: 데이터 필드 간의 단순 매핑
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
      model: 'gemini-3-flash-preview', 
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
            u: { type: Type.STRING },
            c: { type: Type.STRING },
            r: { type: Type.STRING }
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

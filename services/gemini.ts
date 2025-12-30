import { GoogleGenAI } from "@google/genai";
import { getSystemInstruction } from '../constants';
import { Message, Language } from '../types';

const apiKey = process.env.API_KEY; 
const ai = new GoogleGenAI({ apiKey: apiKey });

// Helper to parse the custom XML-like structure
export const parseResponse = (rawText: string): { reasoning: string | undefined, content: string } => {
  const reasoningMatch = rawText.match(/<metacognition>([\s\S]*?)<\/metacognition>/);
  const propositionMatch = rawText.match(/<proposition>([\s\S]*?)<\/proposition>/);

  let reasoning = reasoningMatch ? reasoningMatch[1].trim() : undefined;
  let content = propositionMatch ? propositionMatch[1].trim() : rawText;

  // Cleanup tags if they leak into content
  content = content.replace(/<metacognition>[\s\S]*?<\/metacognition>/g, '').trim();
  content = content.replace(/<proposition>/g, '').replace(/<\/proposition>/g, '').trim();

  return { reasoning, content };
};

// PURE FUNCTION: Exported for UI visualization
export const constructPromptHistory = (history: Message[]) => {
  return history.map(msg => ({
    role: msg.role,
    parts: [
      { text: msg.role === 'model' && msg.reasoning 
          ? `<metacognition>\n${msg.reasoning}\n</metacognition>\n<proposition>\n${msg.content}\n</proposition>` 
          : msg.content 
      }
    ]
  }));
};

/**
 * [STEP 1 & 2] Executes a "True Recursive Dialogue"
 * Request A: Reasoning Generation
 * Request B: Final Proposition Generation
 */
export const sendMessageToGemini = async (
  history: Message[], 
  newUserMessage: string, 
  language: Language
): Promise<{ reasoning?: string, content: string, raw: string }> => {
  if (!apiKey) throw new Error("API Key is missing.");

  try {
    const baseHistory = constructPromptHistory(history);
    
    // --- REQUEST A: METACOGNITION (Thought) ---
    const phase1Contents = [...baseHistory, { role: 'user', parts: [{ text: newUserMessage }] }];
    
    const phase1Response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: phase1Contents,
      config: {
        systemInstruction: getSystemInstruction(1, language),
        thinkingConfig: { thinkingBudget: 2048 },
      },
    });
    const thoughtRaw = phase1Response.text || "<metacognition>Error: No thought generated.</metacognition>";

    // --- REQUEST B: PROPOSITION (Speech) ---
    // Inject the thought as if the model had it internally
    const phase2Contents = [
      ...baseHistory, 
      { role: 'user', parts: [{ text: newUserMessage }] },
      { role: 'model', parts: [{ text: thoughtRaw }] }
    ];

    const phase2Response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: phase2Contents,
      config: {
        systemInstruction: getSystemInstruction(2, language),
        thinkingConfig: { thinkingBudget: 1024 },
      },
    });
    const propositionRaw = phase2Response.text || "<proposition>Error: No response generated.</proposition>";

    const combinedRaw = `${thoughtRaw}\n${propositionRaw}`;
    const parsed = parseResponse(combinedRaw);
    
    return { ...parsed, raw: combinedRaw };

  } catch (error) {
    console.error("Gemini Critical Error:", error);
    throw error;
  }
};

/**
 * [STEP 3] Synchronize Shadow State
 * Request C: Batch Translation of the entire turn (User Input + Model Output + Reasoning)
 */
export const translateTurn = async (
  userContent: string,
  modelContent: string,
  modelReasoning: string | undefined,
  targetLang: Language
): Promise<{ userContent: string, modelContent: string, modelReasoning?: string }> => {
  if (!apiKey) throw new Error("API Key is missing.");

  const targetLangName = targetLang === 'ko' ? "Korean" : "English";
  
  // Batch payload to save HTTP requests (3 calls -> 1 call)
  const payload = {
    user_input: userContent,
    model_output: modelContent,
    model_reasoning: modelReasoning || ""
  };

  const prompt = `
    You are a synchronization engine for a recursive AI.
    Translate the JSON payload below into ${targetLangName}.
    
    [RULES]
    1. Translate 'user_input' and 'model_output' naturally.
    2. Translate 'model_reasoning' strictly (preserve technical tags like [PROCESS_ID]).
    3. Return valid JSON only.

    [PAYLOAD]
    ${JSON.stringify(payload)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const text = response.text;
    if (!text) throw new Error("Sync failed.");
    
    const result = JSON.parse(text);
    return {
      userContent: result.user_input,
      modelContent: result.model_output,
      modelReasoning: result.model_reasoning || undefined
    };

  } catch (error) {
    console.warn("Shadow Sync Failed (Non-critical):", error);
    return { userContent, modelContent, modelReasoning }; // Fallback to original
  }
};
export type Language = 'ko' | 'en';

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string; // The visible content (최종 사용자에게 표시되는 명제/결과값)
  reasoning?: string; // The extracted metacognition/reasoning (LLM의 내부 사고 과정)
  raw?: string; // The raw unparsed XML response (검증을 위한 원본 데이터)
  timestamp: number;
}

export interface ChatState {
  historyKO: Message[]; // Dedicated Korean History
  historyEN: Message[]; // Dedicated English History
  isLoading: boolean;
  error: string | null;
  language: Language; // View pointer
}

export interface SavedSession {
  id: string;
  title: string;
  updatedAt: number;
  data: ChatState;
}

export enum ModelType {
  GEMINI_3_PRO = 'gemini-3-pro-preview',
}
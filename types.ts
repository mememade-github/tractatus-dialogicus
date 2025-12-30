
export type Language = 'ko' | 'en';

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string; 
  reasoning?: string; 
  raw?: string; 
  timestamp: number;
}

export interface ChatState {
  historyKO: Message[]; 
  historyEN: Message[]; 
  isLoading: boolean;
  loadingPhase: string | null;
  error: string | null;
  language: Language; 
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

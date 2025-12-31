
export type Language = 'ko' | 'en';

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string; 
  reasoning?: string; 
  raw?: string; 
  timestamp: number;
}

// [FIX] readonly 배열로 불변성 힌트 제공 (상태 변경 시 새 배열 생성 강제)
export interface ChatState {
  readonly historyKO: readonly Message[];
  readonly historyEN: readonly Message[];
  readonly isLoading: boolean;
  readonly loadingPhase: string | null;
  readonly error: string | null;
  readonly language: Language;
}

export interface SavedSession {
  id: string;
  title: string;
  updatedAt: number;
  data: ChatState;
}

export enum ModelType {
  GEMINI_3_PRO = 'gemini-3-pro-preview',
  GEMINI_3_FLASH = 'gemini-3-flash-preview',
}

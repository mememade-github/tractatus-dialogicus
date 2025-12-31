import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * [SECURITY WARNING]
 * API 키가 클라이언트 번들에 포함: https://console.cloud.google.com/apis/credentials, 웹사이트 제한사항 설정 수행
 */
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

    // [FIX] 환경변수 검증
    if (!env.GEMINI_API_KEY && mode === 'production') {
      console.warn('[WARNING] GEMINI_API_KEY is not set. API calls will fail.');
    }

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // [FIX] 빈 문자열 대신 명시적 undefined 처리
        'process.env.API_KEY': env.GEMINI_API_KEY ? JSON.stringify(env.GEMINI_API_KEY) : 'undefined',
        'process.env.GEMINI_API_KEY': env.GEMINI_API_KEY ? JSON.stringify(env.GEMINI_API_KEY) : 'undefined'
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});

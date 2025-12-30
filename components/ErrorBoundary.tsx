import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * [FIX] 전역 에러 바운더리 - 하위 컴포넌트 에러 시 앱 크래시 방지
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ERROR_BOUNDARY] Caught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    // localStorage 초기화 후 새로고침
    try {
      localStorage.removeItem('tractatus_sessions');
    } catch (e) {
      console.error('Failed to clear storage:', e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-8">
          <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-zinc-200 overflow-hidden">
            <div className="bg-red-50 border-b border-red-100 p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-red-800 font-bold text-lg">System Error</h1>
                  <p className="text-red-600 text-sm">논리적 단절이 발생했습니다</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-zinc-50 rounded-xl p-4 font-mono text-xs text-zinc-600 overflow-auto max-h-32">
                <div className="font-bold text-zinc-800 mb-1">ERROR_LOG::</div>
                {this.state.error?.message || 'Unknown error'}
              </div>

              <div className="space-y-3">
                <button
                  onClick={this.handleReload}
                  className="w-full py-3 px-4 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reload Application
                </button>

                <button
                  onClick={this.handleReset}
                  className="w-full py-3 px-4 bg-zinc-100 text-zinc-600 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors"
                >
                  Reset & Clear Data
                </button>
              </div>

              <p className="text-[10px] text-zinc-400 text-center font-mono uppercase tracking-wider">
                Tractatus Dialogicus • Error Recovery Protocol
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

import React, { Component, ErrorInfo, ReactNode } from 'react';
import logger from '../lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to our logger service
    logger.error('React Error Boundary caught an error', {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    });

    // Update state with error details
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 rounded-lg shadow-xl p-6 border border-red-500/20">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Something went wrong</h2>
                <p className="text-slate-400 text-sm">An unexpected error occurred</p>
              </div>
            </div>

            {/* Error details in development */}
            {import.meta.env.DEV && this.state.error && (
              <div className="mt-4 p-3 bg-slate-800 rounded text-xs text-slate-300 font-mono overflow-auto max-h-40">
                <p className="font-bold text-red-400 mb-2">{this.state.error.toString()}</p>
                {this.state.errorInfo && (
                  <pre className="whitespace-pre-wrap text-slate-500">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 transition-colors"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-500 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
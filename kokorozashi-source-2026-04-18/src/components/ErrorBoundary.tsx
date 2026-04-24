import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-12 text-center space-y-6 glass-card border-red-500/20 bg-red-500/5">
          <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center animate-pulse">
            <AlertTriangle size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Something went wrong</h2>
            <p className="text-white/60 max-w-md mx-auto leading-relaxed">
              We encountered an unexpected error while rendering this part of the application. 
              {this.state.error?.message && <code className="block mt-2 p-2 bg-black/40 rounded text-red-400 text-xs">{this.state.error.message}</code>}
            </p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="brand-gradient px-8 py-3 rounded-2xl text-white font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:scale-105 transition-all shadow-lg"
          >
            <RefreshCw size={18} />
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

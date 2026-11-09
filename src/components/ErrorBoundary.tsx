/**
 * HaulSense - Global Error Boundary
 * Modern Dark Operations Theme.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[HaulSense ErrorBoundary caught error]:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.href = '/manager';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070A0F] text-[#F3F4F6] flex items-center justify-center p-6">
          <div className="bg-[#121824] rounded-2xl border border-slate-800 p-8 max-w-md w-full shadow-2xl text-center">
            <div className="w-12 h-12 bg-red-950/80 border border-red-800 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white font-heading mb-2">
              Operational Exception Occurred
            </h2>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              An unexpected condition interrupted processing. Dispatch parameters have been preserved.
            </p>
            {this.state.error?.message && (
              <pre className="text-[11px] bg-[#0B0F17] p-3 rounded-xl border border-slate-800 text-slate-300 text-left overflow-x-auto mb-6 font-mono">
                {this.state.error.message}
              </pre>
            )}
            <button
              type="button"
              onClick={this.handleReset}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <RotateCcw className="w-4 h-4 text-indigo-200" />
              <span>Go Back to Operations Control</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

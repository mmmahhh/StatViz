import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch and display React errors gracefully
 * Prevents the entire app from crashing when a component throws an error
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });

    // TODO: Send error to logging service in production
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
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
        <div className="min-h-screen bg-linear-bg flex items-center justify-center p-8">
          <div className="max-w-2xl w-full bg-linear-surface border border-linear-border rounded-2xl p-8 shadow-linear-level2">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                <AlertTriangle className="text-red-500" size={32} />
              </div>
              <div className="flex-1">
                <h1 className="text-[24px] font-linear-semibold text-white mb-2">
                  Something went wrong
                </h1>
                <p className="text-[15px] text-linear-tertiary mb-4">
                  An unexpected error occurred. You can try refreshing the page or contact support if the problem persists.
                </p>

                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mb-4">
                    <summary className="text-[14px] text-linear-secondary cursor-pointer hover:text-linear-primary mb-2">
                      Error Details (Development Only)
                    </summary>
                    <div className="bg-[#0a0a0b] rounded-lg p-4 border border-linear-borderSubtle overflow-auto">
                      <pre className="text-[12px] text-red-400 font-mono whitespace-pre-wrap">
                        {this.state.error.toString()}
                        {this.state.errorInfo?.componentStack}
                      </pre>
                    </div>
                  </details>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={this.handleReset}
                    className="px-4 py-2 bg-linear-brand text-white rounded-lg text-[14px] font-linear-medium hover:bg-linear-brand/90 transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-white/5 text-linear-primary rounded-lg text-[14px] font-linear-medium hover:bg-white/10 transition-colors border border-linear-border"
                  >
                    Reload Page
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

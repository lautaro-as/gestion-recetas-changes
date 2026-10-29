import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary atrapó un error no controlado:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-[200px] p-6 m-4 bg-amber-50 rounded-3xl border border-amber-200 text-stone-800 flex flex-col items-center justify-center text-center space-y-3">
          <span className="material-symbols-outlined text-[32px] text-amber-700">warning</span>
          <h3 className="text-sm font-bold text-stone-900">Ocurrió un error al cargar este elemento</h3>
          <p className="text-xs text-stone-600 max-w-md">
            {this.state.error?.message || 'Error inesperado. Puedes continuar usando la plataforma.'}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-1.5 bg-[#E09F3E] text-white rounded-full text-xs font-bold hover:bg-[#835500] transition-colors cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

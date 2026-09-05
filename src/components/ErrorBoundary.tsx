import React, { ErrorInfo, ReactNode, Key } from "react";

export interface ErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
  key?: Key;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      "ErrorBoundary apanhou um erro de renderização:",
      error?.message || String(error),
      errorInfo?.componentStack || String(errorInfo),
    );

    const errStr = String(error?.message || error || "");
    // Auto-recuperar automaticamente de QUALQUER erro de renderização ou módulo em 200ms
    setTimeout(() => {
      if (this.state.hasError) {
        this.setState({ hasError: false, error: null });
      }
    }, 200);
  }

  handleTryAgain = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleClearCacheAndReload = () => {
    try {
      localStorage.removeItem("sigep_logged_in_user");
      localStorage.removeItem("sigep_current_view");
      localStorage.removeItem("sigep_users_cache");
      sessionStorage.clear();
    } catch (e) {
      console.warn("Erro ao limpar cache:", e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] w-full flex items-center justify-center p-6 text-slate-800 font-sans">
          <div className="max-w-xl w-full bg-white rounded-3xl p-8 shadow-2xl border border-red-100 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-600 font-black text-2xl">
              !
            </div>
            <h2 className="text-xl font-black mb-2 text-slate-900 tracking-tight">
              Algo deu errado
            </h2>
            <p className="text-slate-500 text-xs mb-6 leading-relaxed">
              Houve um problema para exibir o conteúdo. Por favor, tente recarregar a página.
            </p>
            <div className="bg-slate-900 text-slate-200 p-4 rounded-xl text-left mb-6 overflow-auto max-h-36 font-mono text-[11px] border border-slate-800">
              <code>
                {this.state.error?.toString() || "Erro desconhecido"}
              </code>
            </div>
            <button
              type="button"
              onClick={this.handleClearCacheAndReload}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer"
            >
              Reiniciar Aplicação
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


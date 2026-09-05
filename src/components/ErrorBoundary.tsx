import React, { ErrorInfo, ReactNode, Key } from "react";

export interface ErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
  key?: Key;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
  errorCount: number;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: any = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      "ErrorBoundary apanhou um erro de renderização:",
      error?.message || String(error),
      errorInfo?.componentStack || String(errorInfo),
    );

    const isChunkLoadError =
      String(error?.message || "").toLowerCase().includes("dynamically imported module") ||
      String(error?.message || "").toLowerCase().includes("failed to fetch") ||
      String(error?.message || "").toLowerCase().includes("loading chunk");

    // Se for erro temporário de chunk/rede no carregamento dinâmico e for a primeira tentativa, recarrega suavemente
    if (isChunkLoadError && this.state.errorCount === 0) {
      this.setState((prev) => ({ errorCount: prev.errorCount + 1 }));
      this.resetTimeoutId = setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  handleTryAgain = () => {
    this.setState({ hasError: false, error: null, errorCount: 0 });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleGoToHome = () => {
    try {
      localStorage.setItem("sigep_current_view", "home");
    } catch (e) {
      console.warn("Erro ao definir rota inicial:", e);
    }
    this.setState({ hasError: false, error: null, errorCount: 0 });
    window.location.href = window.location.origin + window.location.pathname;
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
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-slate-950 text-slate-100 font-sans">
          <div className="max-w-xl w-full bg-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-800 text-center">
            <div className="w-16 h-16 bg-blue-950/80 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#FFB800] font-black text-2xl shadow-lg">
              !
            </div>
            <h2 className="text-xl font-black mb-2 text-white tracking-tight">
              Recuperação do Sistema SIGEP
            </h2>
            <p className="text-slate-400 text-xs mb-6 leading-relaxed">
              Ocorreu uma instabilidade pontual na exibição do módulo atual. Pode tentar recarregar ou voltar ao ecrã inicial com segurança.
            </p>
            <div className="bg-black/50 text-slate-300 p-4 rounded-xl text-left mb-6 overflow-auto max-h-36 font-mono text-[11px] border border-slate-800/80">
              <code>
                {this.state.error?.message || this.state.error?.toString() || "Erro desconhecido"}
              </code>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={this.handleTryAgain}
                className="w-full bg-[#121c60] hover:bg-[#1b2880] text-white py-3 rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer border border-[#FFB800]/30"
              >
                Tentar Novamente
              </button>
              <button
                type="button"
                onClick={this.handleGoToHome}
                className="w-full bg-[#FFB800] hover:bg-[#ffc629] text-slate-950 py-3 rounded-xl font-black text-xs transition-all shadow-md cursor-pointer"
              >
                Ir para o Início
              </button>
            </div>
            <button
              type="button"
              onClick={this.handleClearCacheAndReload}
              className="mt-4 text-[11px] text-slate-500 hover:text-slate-300 underline transition-colors cursor-pointer block mx-auto"
            >
              Limpar cache da sessão e reiniciar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}



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
    return this.props.children;
  }
}


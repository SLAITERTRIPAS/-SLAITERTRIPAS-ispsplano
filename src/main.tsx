import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App, { ErrorBoundary } from "./App.tsx";
import "./index.css";

// Intercetor global para impedir que avisos de conexão/offline e asserções internas do Firestore
// poluam a consola ou disparem erros no ambiente da aplicação
if (typeof window !== "undefined") {
  const isFirestoreNetworkMsg = (msg: any) => {
    const m = String(msg?.message || msg?.stack || msg?.reason || msg || "").toLowerCase();
    return (
      m.includes("@firebase/firestore") ||
      m.includes("could not reach cloud firestore backend") ||
      m.includes("backend didn't respond within 10 seconds") ||
      m.includes("backend didn't respond") ||
      m.includes("internal assertion failed") ||
      m.includes("unexpected state") ||
      m.includes("client will operate in offline mode") ||
      m.includes("quota limit exceeded") ||
      m.includes("free daily read units") ||
      m.includes("resource-exhausted") ||
      m.includes("resource_exhausted") ||
      m.includes("quota exceeded") ||
      m.includes("firestore (11.")
    );
  };

  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    if (args.some((arg) => isFirestoreNetworkMsg(arg))) {
      return;
    }
    originalConsoleError.apply(console, args);
  };

  const originalConsoleWarn = console.warn;
  console.warn = (...args: any[]) => {
    if (args.some((arg) => isFirestoreNetworkMsg(arg))) {
      return;
    }
    originalConsoleWarn.apply(console, args);
  };

  const handleGlobalError = (event: ErrorEvent | any) => {
    const msg = event?.message || String(event?.error?.message || event?.error || "");
    if (isFirestoreNetworkMsg(msg) || isFirestoreNetworkMsg(event?.error)) {
      if (typeof event.preventDefault === "function") event.preventDefault();
      if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
      return true;
    }
  };

  window.addEventListener("error", handleGlobalError, true);
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event?.reason;
    const msg = reason?.message || String(reason || "");
    if (isFirestoreNetworkMsg(msg) || isFirestoreNetworkMsg(reason)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  window.onerror = (message, source, lineno, colno, error) => {
    if (isFirestoreNetworkMsg(message) || isFirestoreNetworkMsg(error)) {
      return true;
    }
  };
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);


import React, { useState } from "react";
import { Database, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { db } from "../lib/firebase";
import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { EFETIVO_GERAL_DATA } from "../constants/colaboradoresList";

export default function AdminSeedButton() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const seedData = async () => {
    if (
      !window.confirm(
        `Deseja sincronizar ${EFETIVO_GERAL_DATA.length} colaboradores com o Firestore?`,
      )
    )
      return;

    setLoading(true);
    setStatus("loading");
    setProgress(0);

    try {
      const total = EFETIVO_GERAL_DATA.length;
      const BATCH_SIZE = 400;

      for (let i = 0; i < total; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = EFETIVO_GERAL_DATA.slice(i, i + BATCH_SIZE);

        chunk.forEach((col: any, index: number) => {
          const docId = col.id || col.nuit || `col_${i + index}`;
          const colRef = doc(collection(db, "colaboradores"), String(docId));

          batch.set(
            colRef,
            {
              ...col,
              status: col.estado || "Ativo",
              updatedAt: serverTimestamp(),
              createdAt: serverTimestamp(),
              source: "System Sync",
            },
            { merge: true },
          );
        });

        await batch.commit();
        const currentProgress = Math.min(
          Math.round(((i + chunk.length) / total) * 100),
          100,
        );
        setProgress(currentProgress);
      }

      setStatus("success");
      setMessage(`Sucesso! ${total} colaboradores importados.`);
    } catch (error: any) {
      console.error("Erro na importação:", error);
      setStatus("error");
      setMessage(`Erro: ${error.message || "Falha na importação"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {status !== "idle" && (
        <div
          className={`p-4 rounded-2xl shadow-2xl backdrop-blur-md border ${
            status === "loading"
              ? "bg-blue-600/90 border-blue-400 text-white"
              : status === "success"
                ? "bg-emerald-600/90 border-emerald-400 text-white"
                : "bg-red-600/90 border-red-400 text-white"
          } transition-all animate-in fade-in slide-in-from-bottom-4`}
        >
          <div className="flex items-center gap-3 mb-2">
            {status === "loading" && (
              <Loader2 className="w-5 h-5 animate-spin" />
            )}
            {status === "success" && <CheckCircle2 className="w-5 h-5" />}
            {status === "error" && <AlertCircle className="w-5 h-5" />}
            <span className="font-bold text-sm">
              {message || (status === "loading" ? "Importando dados..." : "")}
            </span>
          </div>
          {status === "loading" && (
            <div className="w-48 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      )}

      <button
        onClick={seedData}
        disabled={loading}
        className="group relative flex items-center justify-center w-16 h-16 bg-amber-600 hover:bg-amber-500 text-white rounded-full shadow-[0_0_20px_rgba(217,119,6,0.4)] hover:shadow-[0_0_30px_rgba(217,119,6,0.6)] transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Importar Dados dos Colaboradores"
      >
        {loading ? (
          <Loader2 className="w-8 h-8 animate-spin" />
        ) : (
          <Database className="w-8 h-8 group-hover:scale-110 transition-transform" />
        )}

        {/* Tooltip */}
        <span className="absolute right-full mr-4 px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10 shadow-xl">
          Sincronizar Dados (Admin)
        </span>
      </button>
    </div>
  );
}

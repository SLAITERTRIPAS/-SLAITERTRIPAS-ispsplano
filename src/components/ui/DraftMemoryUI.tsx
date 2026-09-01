import React from "react";
import { motion } from "motion/react";
import { FileText, CheckCircle2 } from "lucide-react";

interface DraftModalProps {
  show: boolean;
  onRecover: () => void;
  onDiscard: () => void;
  title?: string;
  message?: string;
}

export const DraftModal: React.FC<DraftModalProps> = ({
  show,
  onRecover,
  onDiscard,
  title = "Rascunho Memorizado",
  message = "Encontramos dados de um preenchimento anterior que não foi finalizado. Deseja recuperar as informações?",
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl border border-blue-100 text-center"
      >
        <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-8 mx-auto rotate-3 shadow-inner">
          <FileText size={48} />
        </div>

        <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-4">
          {title}
        </h3>

        <p className="text-slate-600 text-lg leading-relaxed mb-10 px-4">
          {message}
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={onDiscard}
            className="flex-1 px-8 py-4 rounded-2xl font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all border-2 border-transparent"
          >
            Descartar
          </button>
          <button
            onClick={onRecover}
            className="flex-1 bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
          >
            Recuperar Dados
          </button>
        </div>
      </motion.div>
    </div>
  );
};

interface SyncIndicatorProps {
  isSyncing: boolean;
  className?: string;
}

export const SyncIndicator: React.FC<SyncIndicatorProps> = ({
  isSyncing,
  className = "",
}) => {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur border border-slate-200 rounded-full shadow-sm select-none ${className}`}
    >
      {isSyncing ? (
        <>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-slate-500  tracking-wider">
            A memorizar...
          </span>
        </>
      ) : (
        <>
          <CheckCircle2 className="w-3 h-3 text-green-500" />
          <span className="text-[10px] font-bold text-slate-500  tracking-wider">
            Memorizado
          </span>
        </>
      )}
    </div>
  );
};

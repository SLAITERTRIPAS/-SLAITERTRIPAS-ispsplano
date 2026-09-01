import React from "react";
import { ChevronRight } from "lucide-react";

interface ActiveFormWrapperProps {
  children: React.ReactNode;
  onBack: () => void;
  backLabel?: string;
}

export const ActiveFormWrapper: React.FC<ActiveFormWrapperProps> = ({
  children,
  onBack,
  backLabel = "Voltar para Documentos",
}) => {
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors mb-4"
      >
        <ChevronRight className="rotate-180" size={18} /> {backLabel}
      </button>
      {children}
    </div>
  );
};

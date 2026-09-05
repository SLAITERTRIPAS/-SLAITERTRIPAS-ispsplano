import React from "react";
import { Users, FileText, BarChart3, DollarSign, GraduationCap, FolderOpen } from "lucide-react";

interface CardKPIProps {
  label: string;
  onClick: () => void;
}

export const CardKPI: React.FC<CardKPIProps> = ({ label, onClick }) => {
  const upper = label.toUpperCase();
  let IconComp = FileText;
  let sub = "Consulta e Gestão";
  let color = "border-slate-900 bg-white text-slate-950 hover:bg-slate-50";

  if (upper.includes("EFETIVO")) {
    IconComp = Users;
    sub = "Consulta de Pessoal e Efetivo";
    color = "border-blue-900 bg-blue-50/30 text-blue-950 hover:bg-blue-50";
  } else if (upper.includes("PLANO")) {
    IconComp = FileText;
    sub = "Planificação de Actividades";
    color = "border-emerald-900 bg-emerald-50/30 text-emerald-950 hover:bg-emerald-50";
  } else if (upper.includes("RELATÓRIO")) {
    IconComp = BarChart3;
    sub = "Relatórios e Desempenho";
    color = "border-amber-900 bg-amber-50/30 text-amber-950 hover:bg-amber-50";
  } else if (upper.includes("RECURSOS")) {
    IconComp = DollarSign;
    sub = "Orçamento e Finanças";
    color = "border-purple-900 bg-purple-50/30 text-purple-950 hover:bg-purple-50";
  } else if (upper.includes("CORPO")) {
    IconComp = GraduationCap;
    sub = "Estudantes e Cursos";
    color = "border-indigo-900 bg-indigo-50/30 text-indigo-950 hover:bg-indigo-50";
  } else if (upper.includes("EXPEDIENTE")) {
    IconComp = FolderOpen;
    sub = "Gestão de Correspondência";
    color = "border-rose-900 bg-rose-50/30 text-rose-950 hover:bg-rose-50";
  }

  return (
    <button
      onClick={onClick}
      className={`w-full min-h-[140px] flex flex-col justify-between border-2 rounded-2xl p-4 text-left transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] cursor-pointer group ${color}`}
    >
      <div className="flex items-center justify-between">
        <IconComp className="w-6 h-6 shrink-0 text-slate-900 group-hover:scale-110 transition-transform" />
        <span className="text-[9px] font-black  px-2 py-0.5 bg-black/10 rounded">
          Aceder
        </span>
      </div>
      <div className="mt-3">
        <h3 className="font-sans font-black text-slate-900 text-xs sm:text-sm tracking-tighter ">
          {label}
        </h3>
        <p className="text-[11px] text-slate-600 font-medium mt-1 line-clamp-2">
          {sub}
        </p>
      </div>
    </button>
  );
};

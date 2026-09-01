import React from "react";
import { ArrowLeft, FileText, Download } from "lucide-react";

export default function RelatorioGeralView({ onBack }: { onBack: () => void }) {
  const reports = [
    { id: "1", title: "Relatório Trimestral DPEP", date: "30/06/2026" },
    { id: "2", title: "Relatório de Monitoria", date: "15/05/2026" },
  ];

  return (
    <div className="w-full space-y-8 pb-10 animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-blue-600 hover:underline font-medium"
      >
        <ArrowLeft size={16} /> Voltar para Visão Geral
      </button>

      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
          <FileText size={32} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          Relatório Institucional
        </h2>
      </div>

      <div className="space-y-4">
        {reports.map((r) => (
          <div
            key={r.id}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-blue-200 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-50 rounded-xl text-slate-500">
                <FileText />
              </div>
              <div>
                <p className="font-black text-slate-900">{r.title}</p>
                <p className="text-xs font-bold text-slate-400  tracking-widest mt-1">
                  Data: {r.date}
                </p>
              </div>
            </div>
            <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl text-sm font-bold shadow-lg transition-all">
              <Download size={16} />
              Ver Relatório
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

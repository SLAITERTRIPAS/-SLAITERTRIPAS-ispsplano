import React from "react";
import { ArrowLeft, DollarSign, Wallet } from "lucide-react";

export default function RecursosFinanceirosDetalheView({
  onBack,
}: {
  onBack: () => void;
}) {
  const rubricas = [
    { nome: "Salários", valor: 1000000 },
    { nome: "Manutenção", valor: 500000 },
    { nome: "Investimentos", valor: 1500000 },
  ];
  const total = rubricas.reduce((acc, r) => acc + r.valor, 0);

  return (
    <div className="w-full space-y-8 pb-10 animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-blue-600 hover:underline font-medium"
      >
        <ArrowLeft size={16} /> Voltar para Visão Geral
      </button>

      <div className="flex items-center gap-4">
        <div className="p-3 bg-green-100 text-green-600 rounded-2xl">
          <DollarSign size={32} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          Recursos Financeiros
        </h2>
      </div>

      <div className="p-8 bg-slate-900 text-white rounded-3xl shadow-xl">
        <p className="text-xs font-bold text-slate-400  tracking-widest">
          Valor Geral (OG + RP + Fonte Externa)
        </p>
        <p className="text-5xl font-black mt-2">{total.toLocaleString()} MZN</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
          <Wallet className="text-green-600" />
          Detalhamento por Rubrica
        </h3>
        <div className="space-y-4">
          {rubricas.map((r) => (
            <div
              key={r.nome}
              className="flex justify-between items-center border-b border-slate-100 pb-4 last:border-0 last:pb-0 font-bold"
            >
              <span className="text-slate-700">{r.nome}</span>
              <span className="text-slate-900 text-lg">
                {r.valor.toLocaleString()} MZN
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { ArrowLeft, Users, GraduationCap, BookOpen } from "lucide-react";

export default function CorpoDiscenteDetalheView({
  onBack,
}: {
  onBack: () => void;
}) {
  const data = {
    total: 1250,
    homens: 720,
    mulheres: 530,
    distribuicao: [
      { curso: "Engenharia Electrotécnica", total: 450 },
      { curso: "Engenharia de Construção Civil", total: 400 },
      { curso: "Engenharia de Construção Mecânica", total: 400 },
    ],
  };

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
          <GraduationCap size={32} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          Corpo Discente
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
          <Users className="text-slate-400 mb-2" size={24} />
          <p className="text-xs font-bold text-slate-400  tracking-widest">
            Total Geral
          </p>
          <p className="text-5xl font-black text-slate-900 mt-2">
            {data.total}
          </p>
        </div>
        <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
          <Users className="text-blue-400 mb-2" size={24} />
          <p className="text-xs font-bold text-slate-400  tracking-widest">
            Homens
          </p>
          <p className="text-5xl font-black text-blue-600 mt-2">
            {data.homens}
          </p>
        </div>
        <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
          <Users className="text-pink-400 mb-2" size={24} />
          <p className="text-xs font-bold text-slate-400  tracking-widest">
            Mulheres
          </p>
          <p className="text-5xl font-black text-pink-600 mt-2">
            {data.mulheres}
          </p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
          <BookOpen className="text-blue-600" />
          Distribuição por Curso
        </h3>
        <div className="space-y-4">
          {data.distribuicao.map((item) => (
            <div
              key={item.curso}
              className="flex justify-between items-center border-b border-slate-100 pb-4 last:border-0 last:pb-0"
            >
              <span className="font-bold text-slate-700">{item.curso}</span>
              <span className="font-black text-slate-900 text-lg">
                {item.total} estudantes
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

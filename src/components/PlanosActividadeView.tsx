import React, { useState, useEffect } from "react";
import { ArrowLeft, Building2, Calendar, Clock, Inbox } from "lucide-react";
import { collection, onSnapshot, query, limit } from "firebase/firestore";
import { db } from "../lib/firebase";

interface Activity {
  id: string;
  title?: string;
  nomeAtividade?: string;
  status?: string;
  dataExecucao?: string;
  direcao?: string;
  departamento?: string;
  reparticao?: string;
}

export default function PlanosActividadeView({
  onBack,
}: {
  onBack: () => void;
}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "matrix_activities"), limit(50));
    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Activity[];
      setActivities(items);
      setLoading(false);
    }, () => setLoading(false));

    return () => unsub();
  }, []);

  const activitiesEmCurso = activities.filter((a) => a.status === "em_curso" || a.status === "Em Execução" || a.status === "Aprovado");
  const activitiesProximoMes = activities.filter((a) => a.status === "proximo_mes" || a.status === "Pendente");

  return (
    <div className="w-full space-y-6 pb-10">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-blue-600 hover:underline font-medium"
      >
        <ArrowLeft size={16} /> Voltar para Visão Geral
      </button>
      <h2 className="text-2xl font-black text-slate-900">
        Planos de Actividade
      </h2>

      {/* Resumo Direções */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {["DAF", "DPEP", "DC"].map((dir) => {
          const count = activities.filter(a => (a.direcao || "").includes(dir) || (a.departamento || "").includes(dir)).length;
          return (
            <div
              key={dir}
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md"
            >
              <h3 className="text-lg font-black text-slate-800">{dir}</h3>
              <p className="text-sm text-slate-500">
                {count} {count === 1 ? "Actividade" : "Actividades"} Registo Oficial
              </p>
            </div>
          );
        })}
      </div>

      {/* Actividades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100">
          <h4 className="flex items-center gap-2 text-lg font-black text-slate-900 mb-4">
            <Clock size={20} /> Actividades em Curso
          </h4>
          <div className="space-y-4">
            {loading ? (
              <div className="p-4 text-xs text-slate-400">A carregar actividades...</div>
            ) : activitiesEmCurso.length > 0 ? (
              activitiesEmCurso.map((a) => (
                <div key={a.id} className="p-4 bg-slate-50 rounded-xl font-bold text-xs text-slate-800">
                  {a.nomeAtividade || a.title} {a.dataExecucao ? `- ${a.dataExecucao}` : ""}
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs flex flex-col items-center gap-2">
                <Inbox size={24} className="text-slate-300" />
                <span>Nenhuma actividade em curso registada.</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100">
          <h4 className="flex items-center gap-2 text-lg font-black text-slate-900 mb-4">
            <Calendar size={20} /> Próximas Actividades
          </h4>
          <div className="space-y-4">
            {loading ? (
              <div className="p-4 text-xs text-slate-400">A carregar actividades...</div>
            ) : activitiesProximoMes.length > 0 ? (
              activitiesProximoMes.map((a) => (
                <div key={a.id} className="p-4 bg-slate-50 rounded-xl font-bold text-xs text-slate-800">
                  {a.nomeAtividade || a.title} {a.dataExecucao ? `- ${a.dataExecucao}` : ""}
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs flex flex-col items-center gap-2">
                <Inbox size={24} className="text-slate-300" />
                <span>Nenhuma actividade planeada.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

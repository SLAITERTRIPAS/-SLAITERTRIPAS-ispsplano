import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Wrench,
  RefreshCw,
  AlertTriangle,
  Activity,
  Layers,
  Users,
  FileText,
  Building,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { intelligentDiagnostics, DiagnosticResult, SystemAnomaly } from "../../lib/intelligentDiagnostics";

export function IntelligentDiagnosticsView() {
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [fixingKey, setFixingKey] = useState<string | null>(null);
  const [fixingAll, setFixingAll] = useState(false);
  const [actionLog, setActionLog] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");

  const runScan = async () => {
    setLoading(true);
    try {
      const res = await intelligentDiagnostics.runDiagnostics();
      setResult(res);
    } catch (err: any) {
      console.error("Erro no diagnóstico:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runScan();
  }, []);

  const handleFixSingle = async (anomaly: SystemAnomaly) => {
    setFixingKey(anomaly.fixActionKey);
    try {
      const res = await intelligentDiagnostics.resolveAnomaly(anomaly.fixActionKey);
      setActionLog((prev) => [
        `[${new Date().toLocaleTimeString()}] ${res.message}`,
        ...prev,
      ]);
      await runScan();
    } catch (err: any) {
      setActionLog((prev) => [
        `[${new Date().toLocaleTimeString()}] Erro: ${err?.message || err}`,
        ...prev,
      ]);
    } finally {
      setFixingKey(null);
    }
  };

  const handleFixAll = async () => {
    setFixingAll(true);
    try {
      const res = await intelligentDiagnostics.resolveAllFixable();
      setActionLog((prev) => [
        `[${new Date().toLocaleTimeString()}] Autocura em Lote Concluída: ${res.totalResolved} anomalia(s) resolvida(s).`,
        ...res.details.map((d) => ` -> ${d}`),
        ...prev,
      ]);
      await runScan();
    } catch (err: any) {
      setActionLog((prev) => [
        `[${new Date().toLocaleTimeString()}] Erro na autocura em lote: ${err?.message || err}`,
        ...prev,
      ]);
    } finally {
      setFixingAll(false);
    }
  };

  const categories = [
    "Todas",
    "Matriz & POA",
    "Utilizadores & Segurança",
    "Workflow & Expedientes",
    "Património & Frota",
  ];

  const filteredAnomalies = result?.anomalies.filter((a) => {
    if (selectedCategory === "Todas") return true;
    return a.category === selectedCategory;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Activity size={240} className="text-white" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold mb-3">
              <Sparkles size={14} /> Motor de Diagnóstico Preditivo & Autocura
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              Saúde & Integridade do Sistema
            </h2>
            <p className="text-xs md:text-sm text-slate-300 font-medium max-w-2xl mt-1">
              O sistema monitoriza continuamente a base de dados para prever erros, identificar inconsistências orçamentais, fluxos parados e perfis incompletos, permitindo resolução automática em tempo real.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={runScan}
              disabled={loading}
              className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-xs flex items-center gap-2 transition-all border border-white/10"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              {loading ? "A Analisar..." : "Reanalisar Base de Dados"}
            </button>
            <button
              onClick={handleFixAll}
              disabled={fixingAll || !result || result.anomalies.filter((a) => a.autoFixable).length === 0}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {fixingAll ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  A Executar Autocura...
                </>
              ) : (
                <>
                  <Wrench size={16} />
                  Executar Autocura Automática
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Health Score & Key Metrics */}
      {result && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Health Gauge Card */}
          <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
            <span className="text-xs font-black tracking-widest text-slate-400 mb-2">
              Índice de Saúde Global
            </span>
            <div className="relative flex items-center justify-center my-2">
              <div className={`text-4xl font-black ${result.healthScore >= 90 ? "text-emerald-600" : result.healthScore >= 70 ? "text-amber-600" : "text-red-600"}`}>
                {result.healthScore}%
              </div>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
              <div
                className={`h-full transition-all duration-1000 ${result.healthScore >= 90 ? "bg-emerald-500" : result.healthScore >= 70 ? "bg-amber-500" : "bg-red-500"}`}
                style={{ width: `${result.healthScore}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 font-medium">
              {result.healthScore >= 90
                ? "Sistema em excelente estado operacional"
                : result.healthScore >= 70
                ? "Atenção necessária em algumas áreas"
                : "Ação corretiva urgente recomendada"}
            </p>
          </div>

          {/* Anomalias Críticas */}
          <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-400 tracking-widest">
                Erros Críticos
              </span>
              <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                <AlertTriangle size={18} />
              </div>
            </div>
            <div className="my-2">
              <span className="text-3xl font-black text-red-600">
                {result.criticalCount}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              Podem afetar orçamentos ou relatórios oficiais
            </p>
          </div>

          {/* Avisos Preventivos */}
          <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-400 tracking-widest">
                Avisos Preventivos
              </span>
              <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                <ShieldAlert size={18} />
              </div>
            </div>
            <div className="my-2">
              <span className="text-3xl font-black text-amber-600">
                {result.warningCount}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              Inconsistências sem bloqueio direto de operabilidade
            </p>
          </div>

          {/* Anomalias Corrigíveis */}
          <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-400 tracking-widest">
                Autocura Disponível
              </span>
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                <Wrench size={18} />
              </div>
            </div>
            <div className="my-2">
              <span className="text-3xl font-black text-indigo-600">
                {result.anomalies.filter((a) => a.autoFixable).length}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              Podem ser reparadas automaticamente com 1 clique
            </p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all ${selectedCategory === cat ? "bg-slate-900 text-white shadow" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Anomalies List */}
      <div className="space-y-4">
        {filteredAnomalies.length === 0 ? (
          <div className="bg-slate-50/50 p-12 rounded-3xl border border-slate-200 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-base font-black text-slate-800">
              Nenhuma anomalia detetada nesta categoria!
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              A base de dados e os fluxos organizacionais estão íntegros e devidamente sincronizados.
            </p>
          </div>
        ) : (
          filteredAnomalies.map((anom) => (
            <div
              key={anom.id}
              className={`bg-slate-50/50 p-6 rounded-3xl border transition-all shadow-sm ${anom.severity === "critical" ? "border-red-200 bg-red-50/20" : "border-slate-200"}`}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full ${anom.severity === "critical" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
                    >
                      {anom.severity === "critical" ? "Erro Crítico" : "Aviso"}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      • {anom.category}
                    </span>
                    {anom.affectedCount > 0 && (
                      <span className="text-[10px] font-extrabold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                        {anom.affectedCount} registos afetados
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-black text-slate-900">
                    {anom.title}
                  </h3>
                  <p className="text-xs text-slate-600 font-medium whitespace-pre-line">
                    {anom.description}
                  </p>

                  <div className="pt-2 flex items-center gap-1.5 text-xs text-indigo-700 font-semibold">
                    <HelpCircle size={14} className="text-indigo-500" />
                    <span>Recomendação: {anom.recommendation}</span>
                  </div>
                </div>

                <div>
                  {anom.autoFixable ? (
                    <button
                      onClick={() => handleFixSingle(anom)}
                      disabled={fixingKey === anom.fixActionKey}
                      className="px-5 py-2.5 bg-indigo-900 hover:bg-indigo-800 text-white rounded-2xl font-black text-xs flex items-center gap-2 transition-all shadow-md shadow-indigo-900/20 disabled:opacity-50"
                    >
                      {fixingKey === anom.fixActionKey ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          A Corrigir...
                        </>
                      ) : (
                        <>
                          <Wrench size={14} />
                          Resolver Agora
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-4 py-2 rounded-xl inline-block">
                      Intervenção Manual
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Action Log / Audit History */}
      {actionLog.length > 0 && (
        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
          <h4 className="text-xs font-black tracking-widest text-slate-400 mb-4 flex items-center gap-2">
            <Activity size={16} className="text-emerald-400" /> Histórico de Resoluções Automáticas
          </h4>
          <div className="font-mono text-[11px] space-y-1.5 max-h-40 overflow-y-auto text-slate-300">
            {actionLog.map((log, idx) => (
              <div key={idx} className="border-b border-slate-800 pb-1">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

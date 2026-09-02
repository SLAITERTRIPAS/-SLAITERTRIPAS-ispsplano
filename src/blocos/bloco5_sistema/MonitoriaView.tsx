import { printElementById } from "../../lib/printUtils";
import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Search,
  FileText,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BarChart3,
  Plus,
  DownloadCloud,
  Clock,
  Timer,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import MainHeader from "../bloco1_apresentacao/MainHeader";
import ActivityForm from "../bloco5_sistema/ActivityForm";
import { firestoreService } from "../../lib/firestoreService";
import { isSuperBossUser, getAuthorizedActivities } from "../../lib/auth";
import { isValidActivity } from "./plano/PlanoHelpers";

interface ActivityMonitor {
  id: string;
  referencia: string;
  title: string;
  setor: string;
  mes: string;
  orcamento: number;
  status:
    | "em_execucao"
    | "executada"
    | "nao_executada"
    | "pendente"
    | "agendada"
    | "em_realizacao"
    | "pendente_monitoria"
    | "realizada";
  motivo?: string;
  detalhes: string;
  isPlanificada: boolean;
  rubrica?: string;
  necessidade?: string;
  progresso?: number;
  data?: string;
  responsavel?: string;
  justificativa?: string;
  dataMes?: string;
  departamento?: string;
  valor?: number;
}

export default function MonitoriaView({
  onBack,
  activities = [],
  user,
  onLogout,
}: {
  onBack: () => void;
  activities?: any[];
  user?: any;
  onLogout?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<
    "tracking" | "report" | "setorial" | "scheduled" | "in_progress"
  >("tracking");
  const [searchRef, setSearchRef] = useState("");
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [selectedScheduledMonth, setSelectedScheduledMonth] = useState("Janeiro");

  const [monitoriaActivities, setMonitoriaActivities] = useState<
    ActivityMonitor[]
  >([]);
  const [loading, setLoading] = useState(true);

  const isAdmin =
    user?.role === "Administrador" ||
    (user?.cargoChefia &&
      user.cargoChefia.toLowerCase().includes("diretor geral"));

  useEffect(() => {
    // Subscribe to both general activities and matrix activities (plans)
    const unsubMatrix = firestoreService.matrixActivities.subscribe((data) => {
      const valid = (data || []).filter(isValidActivity);
      const filtered = getAuthorizedActivities(valid, user);

      const formatted = filtered.map((a) => ({
        id: a.id,
        referencia:
          a.codigoActividade || a.referencia || `ACT-P-${a.id.substring(0, 4)}`,
        title: a.nomeActividade || a.title || "Actividade Planificada",
        setor: a.unidadeSelecionada || a.direcao || a.setor || "-",
        mes: a.mesRealizacao || a.dataMes || "N/A",
        orcamento: a.valorTotal || a.orcamento || 0,
        status: (a.situacaoActividade || "agendada") as any,
        detalhes: a.objetivoActividade || a.detalhes || "Sem detalhes",
        isPlanificada: true,
        rubrica: a.rubricas?.[0]?.rubrica || "-",
        necessidade: a.rubricas?.[0]?.necessidade || "-",
        progresso: a.progresso || 0,
        data: a.dataRealizacao || "",
        responsavel: a.responsavel || "",
        justificativa: a.justificativa || a.motivo || "",
      }));

      setMonitoriaActivities((prev) => {
        const nonPlan = prev.filter((p) => !p.isPlanificada);
        return [...nonPlan, ...formatted];
      });
      setLoading(false);
    });

    const unsubActivities = firestoreService.actividades.subscribe((data) => {
      const valid = (data || []).filter(isValidActivity);
      const filtered = getAuthorizedActivities(valid, user);

      const formatted = filtered.map((a) => ({
        id: a.id,
        referencia: a.referencia || `ACT-NP-${a.id.substring(0, 4)}`,
        title: a.nomeActividade || a.title || "Actividade",
        setor: a.unidadeSelecionada || a.direcao || a.setor || "-",
        mes: a.mesRealizacao || a.dataMes || "N/A",
        orcamento: a.valorTotal || a.orcamento || 0,
        status: (a.status || "em_execucao") as any,
        detalhes: a.objetivoActividade || a.detalhes || "Sem detalhes",
        isPlanificada: a.isPlanificada !== undefined ? a.isPlanificada : false,
        rubrica: a.rubrica || "-",
        necessidade: a.necessidade || "-",
        progresso: a.progresso || 0,
        data: a.dataRealizacao || "",
        responsavel: a.responsavel || "",
        justificativa: a.justificativa || a.motivo || "",
      }));

      setMonitoriaActivities((prev) => {
        const plan = prev.filter((p) => p.isPlanificada);
        return [...plan, ...formatted];
      });
    });

    return () => {
      unsubMatrix();
      unsubActivities();
    };
  }, [user, isAdmin]);

  // Function to change status of an activity
  const updateActivityField = async (
    id: string,
    field: string,
    value: any,
    isPlanificada: boolean,
  ) => {
    try {
      if (isPlanificada) {
        await firestoreService.matrixActivities.update(id, { [field]: value });
      } else {
        await firestoreService.actividades.update(id, { [field]: value });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const [showForm, setShowForm] = useState(false);

  const handlePlanSubmit = async (data: any) => {
    try {
      const activityData = {
        ...data,
        isPlanificada: false,
        status: "em_execucao",
        createdAt: new Date().toISOString(),
      };
      await firestoreService.actividades.add(activityData);
      setShowForm(false);
      alert("Actividade não planificada registada com sucesso na monitoria!");
    } catch (error) {
      console.error(error);
      alert("Erro ao registar actividade.");
    }
  };

  const [newActivity, setNewActivity] = useState<any>({
    title: "",
    setor: "",
    mes: "",
    orcamento: 0,
    detalhes: "",
    status: "executada",
    motivo: "",
    isPlanificada: false,
  });

  React.useEffect(() => {
    // Importação automática simulada para Eventos Agendados (mês seguinte) e Em Realização (mês atual)
    // O sistema importa por si só, e no dia 1 transita de agendados para em realizacao.
    const autoScheduleActivities = [
      {
        id: "auto-plan-agendado",
        referencia: "ACT-AUTO-AGEND",
        title: "Revisão de Desempenho Institucional (Agendado)",
        setor: "Gabinete do Diretor-Geral",
        mes: "Próximo Mês",
        orcamento: 12000,
        rubrica: "Bens e Serviços",
        necessidade: "Logística",
        status: "agendada",
        detalhes:
          "Actividade importada automaticamente do plano para os próximos 6 dias.",
        isPlanificada: true,
      },
      {
        id: "auto-plan-exec",
        referencia: "ACT-AUTO-EXEC",
        title: "Sessão de Formação Contínua",
        setor: "Recursos Humanos",
        mes: "Mês Atual",
        orcamento: 5000,
        rubrica: "Formação",
        necessidade: "Materiais Didáticos",
        status: "em_execucao",
        detalhes:
          "Actividade já movida automaticamente do campo Agendado para Em Realização.",
        isPlanificada: true,
      },
    ];

    setMonitoriaActivities((prev) => {
      const newActivities = autoScheduleActivities.filter(
        (a) => !prev.some((p) => p.id === a.id),
      );
      if (newActivities.length > 0) {
        return [...prev, ...newActivities];
      }
      return prev;
    });
  }, []);

  const handleManualImport = () => {
    const month = prompt(
      "Digite o mês de realização para importar actividades:",
      "Agosto",
    );
    if (!month) return; // User cancelled

    const importActivities = [
      {
        id: `manual-import-${Date.now()}`,
        referencia: `ACT-IMPORT-${Math.floor(Math.random() * 1000)}`,
        title: `Actividade Importada do Plano (${month})`,
        setor: "Repartição de Planificação",
        mes: month,
        orcamento: 5000,
        status: "em_realizacao",
        detalhes: `Actividade importada manualmente pelo utilizador a partir do Plano de Actividades para o mês de ${month}.`,
        isPlanificada: true,
      },
    ];
    setMonitoriaActivities((prev: any) => [...(importActivities as any), ...prev]);
    alert(
      `Actividade(s) planificada(s) importada(s) para o mês de ${month} com sucesso!`,
    );
  };

  const handleSaveUnplanned = () => {
    if (!newActivity.title || !newActivity.setor) {
      alert("Por favor preencha os campos obrigatórios (Actividade e Setor).");
      return;
    }
    const activity = {
      ...newActivity,
      id: Math.random().toString(),
      referencia: `ACT-NP-${Math.floor(Math.random() * 1000)}`,
    };
    setMonitoriaActivities((prev) => [activity, ...prev]);
    setShowForm(false);
    setNewActivity({
      title: "",
      setor: "",
      mes: "",
      orcamento: 0,
      detalhes: "",
      status: "executada",
      motivo: "",
      isPlanificada: false,
    });
    alert("Actividade não planificada registada com sucesso na monitoria!");
  };

  const handleSearch = () => {
    const result = monitoriaActivities.find(
      (a) => a.referencia?.toUpperCase() === searchRef.toUpperCase(),
    );
    setSearchResult(result || null);
  };

  const generatePDF = () => {
    const element = document.getElementById("monitoria-report-print");
    if (!element) return;

    // Adicionar classe de impressão temporária
    element.classList.add("print-mode");

    const opt = {
      margin: [0, 0, 0, 0],
      filename: `Relatorio_Monitoria_Songo_${new Date().toLocaleDateString()}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        letterRendering: true,
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    if ((window as any).html2pdf) {
      (window as any)
        .html2pdf()
        .from(element)
        .set(opt)
        .toPdf()
        .get("pdf")
        .then((pdf: any) => {
          // O html2pdf não lida bem com troca de orientação no meio do fluxo via JS facilmente
          // mas o CSS @page resolve isso para o comando de impressão do browser
          printElementById("monitoria-report-print");
        })
        .catch(() => {
          printElementById("monitoria-report-print");
        });
    } else {
      printElementById("monitoria-report-print");
    }

    setTimeout(() => {
      element.classList.remove("print-mode");
    }, 1000);
  };

  return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-100 flex items-center justify-center p-2 flex-none sticky top-0 z-30">
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab("tracking")}
            className={`px-6 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === "tracking" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <Search size={16} /> Rastrear Actividade
          </button>
          <button
            onClick={() => setActiveTab("report")}
            className={`px-6 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === "report" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <BarChart3 size={16} /> Relatório Geral
          </button>
          <button
            onClick={() => setActiveTab("setorial")}
            className={`px-6 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === "setorial" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <BarChart3 size={16} /> Monitoria Setorial
          </button>
          <button
            onClick={() => setActiveTab("scheduled")}
            className={`px-6 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === "scheduled" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <CheckCircle2 size={16} /> Eventos Agendados
          </button>
          <button
            onClick={() => setActiveTab("in_progress")}
            className={`px-6 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === "in_progress" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <Activity size={16} /> Em Realização
          </button>
        </div>
      </div>

      <main className="flex-grow p-8 overflow-auto">
        <div className="w-[90%] mx-auto">
          <div className="flex justify-end gap-4 mb-6">
            <button
              onClick={() => setShowForm(true)}
              className="bg-orange-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm hover:bg-orange-700 transition-colors shadow-sm"
            >
              <Plus size={16} /> Registar Actividade Não Planificada
            </button>
            <button
              onClick={handleManualImport}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm"
            >
              <DownloadCloud size={16} /> Importar do Plano (Manual)
            </button>
          </div>

          <AnimatePresence>
            {showForm && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-3xl p-8 max-w-5xl w-full h-[80vh] shadow-2xl relative"
                >
                  <ActivityForm
                    onClose={() => setShowForm(false)}
                    onSubmit={handlePlanSubmit}
                    planType="Monitoria"
                    user={user}
                    plannedActivitiesProp={monitoriaActivities}
                    plannedActivitiesCount={monitoriaActivities.length}
                  />
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {activeTab === "tracking" ? (
              <motion.div
                key="tracking"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100">
                  <h2 className="text-3xl font-black text-blue-900 mb-6 tracking-tight font-serif">
                    Inserir Referência
                  </h2>
                  <div className="flex gap-4">
                    <div className="relative flex-grow">
                      <Search
                        className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400"
                        size={24}
                      />
                      <input
                        type="text"
                        placeholder="Ex: ACT-2024-1024"
                        autoComplete="off"
                        autoCorrect="off"
                        className="w-full pl-16 pr-6 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-xl font-bold focus:border-blue-500 focus:bg-white outline-none transition-all"
                        value={searchRef}
                        onChange={(e) => setSearchRef(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                      />
                    </div>
                    <button
                      onClick={handleSearch}
                      className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 tracking-tighter"
                    >
                      Pesquisar
                    </button>
                  </div>
                </div>

                {searchResult ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden"
                  >
                    <div
                      className={`p-8 flex items-center justify-between ${searchResult.status === "executada" || searchResult.executada ? "bg-green-50" : "bg-red-50"}`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-4 rounded-2xl ${searchResult.status === "executada" || searchResult.executada ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}
                        >
                          {searchResult.status === "executada" ||
                          searchResult.executada ? (
                            <CheckCircle2 size={32} />
                          ) : (
                            <XCircle size={32} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold tracking-widest opacity-60">
                            Estado de Execução
                          </p>
                          <h3
                            className={`text-3xl font-black tracking-tighter ${searchResult.status === "executada" || searchResult.executada ? "text-green-700" : "text-red-700"}`}
                          >
                            {searchResult.status === "executada" ||
                            searchResult.executada
                              ? "Executada"
                              : "Não Executada"}
                          </h3>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold tracking-widest text-gray-400">
                          Referência
                        </p>
                        <p className="text-2xl font-mono font-black text-gray-900">
                          {searchResult.referencia}
                        </p>
                      </div>
                    </div>

                    <div className="p-12 grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-8">
                        <div>
                          <h4 className="text-sm font-black text-gray-400 tracking-widest mb-2">
                            Actividade
                          </h4>
                          <p className="text-2xl font-bold text-gray-900 leading-tight">
                            {searchResult.title}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-gray-400 tracking-widest mb-2">
                            Setor Responsável
                          </h4>
                          <p className="text-xl font-bold text-blue-900">
                            {searchResult.setor ||
                              searchResult.direcao ||
                              searchResult.departamento ||
                              "-"}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                          <div>
                            <h4 className="text-sm font-black text-gray-400 tracking-widest mb-2">
                              Mês
                            </h4>
                            <p className="text-xl font-bold text-gray-900">
                              {searchResult.mes || searchResult.dataMes || "-"}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-gray-400 tracking-widest mb-2">
                              Orçamento
                            </h4>
                            <p className="text-xl font-bold text-green-600">
                              {(
                                searchResult.orcamento ||
                                searchResult.valor ||
                                0
                              ).toLocaleString("pt-MZ", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }) + " MZN"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-8">
                        <div>
                          <h4 className="text-sm font-black text-gray-400 tracking-widest mb-2">
                            Detalhes da Actividade
                          </h4>
                          <p className="text-gray-600 leading-relaxed bg-gray-50 p-6 rounded-2xl italic">
                            "
                            {searchResult.detalhes ||
                              searchResult.objetivoActividade ||
                              "Sem detalhes adicionais."}
                            "
                          </p>
                        </div>
                        {(searchResult.status === "nao_executada" ||
                          (!searchResult.executada &&
                            searchResult.motivoNaoExecucao)) && (
                          <div className="bg-red-50 p-8 rounded-3xl border border-red-100">
                            <h4 className="text-sm font-black text-red-600 tracking-widest mb-3 flex items-center gap-2">
                              <AlertCircle size={18} /> Motivo da Não Execução
                            </h4>
                            <p className="text-red-900 font-bold leading-relaxed">
                              {searchResult.motivo ||
                                searchResult.motivoNaoExecucao}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  searchRef && (
                    <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-200">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Search size={40} className="text-gray-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        Actividade não encontrada
                      </h3>
                      <p className="text-gray-500">
                        Verifique se a referência está correta e tente
                        novamente.
                      </p>
                    </div>
                  )
                )}
              </motion.div>
            ) : activeTab === "report" ? (
              <motion.div
                key="report"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden"
              >
                <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-blue-50/30">
                  <div>
                    <h2 className="text-3xl font-black text-blue-900 tracking-tighter font-serif">
                      Relatório de Monitoria
                    </h2>
                    <p className="text-gray-500 font-medium">
                      Resumo do estado das actividades planificadas
                    </p>
                  </div>
                  <button
                    onClick={generatePDF}
                    className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold border border-blue-100 shadow-sm hover:bg-blue-50 transition-all flex items-center gap-2"
                  >
                    <FileText size={18} /> Exportar PDF
                  </button>
                </div>

                <div
                  id="monitoria-report-print"
                  className="hidden print:block bg-white p-0 m-0"
                >
                  {/* CAPA - ORIENTAÇÃO VERTICAL */}
                  <div className="report-cover page-break-after">
                    <div className="space-y-4">
                      <h1 className="text-2xl font-black  text-slate-900">
                        Instituto Superior Politécnico de Songo
                      </h1>
                      <div className="w-24 h-1 bg-slate-900 mx-auto"></div>
                      <p className="text-lg font-bold text-slate-700">
                        DPEP - Departamento de Planificação, Estudos e Projetos
                        (DPEP)
                      </p>
                    </div>

                    <div className="space-y-6">
                      <h2 className="text-4xl font-black text-blue-900 tracking-tighter ">
                        Relatório de Monitoria de Actividades
                      </h2>
                      <p className="text-xl font-medium text-gray-500 italic">
                        "Uma escola superior de engenharia para o sector de
                        energia"
                      </p>
                    </div>

                    <div className="w-full max-w-md mx-auto space-y-8 text-left border-t-2 border-slate-100 pt-10">
                      <div className="flex justify-between items-end border-b border-slate-200 pb-2">
                        <span className="text-xs font-black  text-gray-400">
                          Setor/Unidade:
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          {isSuperBossUser(user)
                            ? "PROPRIETÁRIO / PROGRAMADOR"
                            : user?.departamento || user?.direcao || "Geral"}
                        </span>
                      </div>
                      <div className="flex justify-between items-end border-b border-slate-200 pb-2">
                        <span className="text-xs font-black  text-gray-400">
                          Data de Emissão:
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          {new Date().toLocaleDateString("pt-MZ")}
                        </span>
                      </div>
                      <div className="flex justify-between items-end border-b border-slate-200 pb-2">
                        <span className="text-xs font-black  text-gray-400">
                          Responsável:
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          {user?.displayName || "-"}
                        </span>
                      </div>
                    </div>

                    <div className="text-sm font-black text-gray-400  tracking-widest">
                      Songo, {new Date().getFullYear()}
                    </div>
                  </div>

                  {/* TABELA - ORIENTAÇÃO HORIZONTAL */}
                  <div className="report-table-container print-landscape">
                    <div className="mb-6 border-b-2 border-blue-900 pb-2 flex justify-between items-center">
                      <h3 className="text-lg font-black text-blue-900 ">
                        Detalhamento das Actividades
                      </h3>
                      <span className="text-[10px] font-bold text-gray-400">
                        SIGEP - Sistema Integrado de Gestão
                      </span>
                    </div>

                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-100 font-black  text-slate-800">
                          <th className="w-10 text-center">N/O</th>
                          <th className="w-24">Código</th>
                          <th>Nome da Actividade</th>
                          <th className="w-20">Mês</th>
                          <th className="w-20">Data</th>
                          <th className="w-32">Responsável</th>
                          <th>Justificação Estado</th>
                          <th className="w-16 text-center">Status %</th>
                          <th className="w-24 text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monitoriaActivities.map((activity, index) => (
                          <tr key={activity.id}>
                            <td className="text-center font-bold text-gray-400">
                              {index + 1}
                            </td>
                            <td className="font-mono text-blue-700 font-bold">
                              {activity.referencia}
                            </td>
                            <td className="font-bold">
                              {activity.title}
                              <div className="text-[7px] text-gray-400 font-medium ">
                                {activity.setor}
                              </div>
                            </td>
                            <td>{activity.mes}</td>
                            <td>{activity.data || "-"}</td>
                            <td>{activity.responsavel || "-"}</td>
                            <td className="italic text-gray-500">
                              {activity.justificativa || activity.motivo || "-"}
                            </td>
                            <td className="text-center font-black text-blue-900">
                              {activity.progresso || 0}%
                            </td>
                            <td className="text-center font-bold  text-[8px]">
                              {activity.status.replace("_", " ")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="mt-10 grid grid-cols-2 gap-20">
                      <div className="text-center">
                        <div className="border-t border-slate-900 pt-2 text-[10px] font-black ">
                          O Responsável do Setor
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="border-t border-slate-900 pt-2 text-[10px] font-black ">
                          Visto DPEP / Direção
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : activeTab === "in_progress" ? (
              <motion.div
                key="in_progress"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden"
              >
                <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-blue-50/30">
                  <div>
                    <h2 className="text-3xl font-black text-blue-900 tracking-tighter font-serif">
                      Actividades em Realização
                    </h2>
                    <p className="text-gray-500 font-medium">
                      Actividades atualmente em execução
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-max">
                    <thead>
                      <tr className="bg-slate-900 text-[9px] tracking-widest text-white font-black ">
                        <th className="px-4 py-4 border border-slate-800 text-center w-12">
                          N/O
                        </th>
                        <th className="px-4 py-4 border border-slate-800">
                          Cód. Actividade
                        </th>
                        <th className="px-4 py-4 border border-slate-800">
                          Nome da Actividade
                        </th>
                        <th className="px-4 py-4 border border-slate-800">
                          Mês Realização
                        </th>
                        <th className="px-4 py-4 border border-slate-800">
                          Data
                        </th>
                        <th className="px-4 py-4 border border-slate-800">
                          Responsável
                        </th>
                        <th className="px-4 py-4 border border-slate-800">
                          Justificação Estado
                        </th>
                        <th className="px-4 py-4 border border-slate-800 text-center w-28">
                          Status (%)
                        </th>
                        <th className="px-4 py-4 border border-slate-800 text-center">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {monitoriaActivities
                        .filter(
                          (activity) =>
                            activity.status === "em_execucao" ||
                            activity.status === "em_realizacao" ||
                            activity.status === "agendada" ||
                            activity.status === "pendente" ||
                            activity.status === "pendente_monitoria",
                        )
                        .map((activity, index) => (
                          <tr
                            key={activity.id}
                            className="hover:bg-blue-50/20 transition-colors"
                          >
                            <td className="px-4 py-4 font-bold text-gray-400 text-center border-x border-gray-100">
                              {index + 1}
                            </td>
                            <td className="px-4 py-4 border-r border-gray-100 font-mono text-[10px] text-blue-600 font-bold">
                              {activity.referencia}
                            </td>
                            <td className="px-4 py-4 border-r border-gray-100">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800 text-xs leading-tight">
                                  {activity.title}
                                </span>
                                <span className="text-[9px] text-gray-400 font-bold  mt-1">
                                  {activity.setor}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4 border-r border-gray-100 text-xs font-medium text-gray-600">
                              {activity.mes || activity.dataMes || "-"}
                            </td>
                            <td className="px-4 py-4 border-r border-gray-100">
                              <input
                                type="date"
                                defaultValue={activity.data || ""}
                                onBlur={(e) =>
                                  updateActivityField(
                                    activity.id,
                                    "dataRealizacao",
                                    e.target.value,
                                    activity.isPlanificada,
                                  )
                                }
                                className="text-[10px] bg-transparent outline-none focus:bg-white border-b border-transparent focus:border-blue-300 w-full"
                              />
                            </td>
                            <td className="px-4 py-4 border-r border-gray-100">
                              <input
                                type="text"
                                defaultValue={activity.responsavel || ""}
                                onBlur={(e) =>
                                  updateActivityField(
                                    activity.id,
                                    "responsavel",
                                    e.target.value,
                                    activity.isPlanificada,
                                  )
                                }
                                className="text-[10px] bg-transparent outline-none focus:bg-white border-b border-transparent focus:border-blue-300 w-full font-medium"
                                placeholder="Responsável..."
                              />
                            </td>
                            <td className="px-4 py-4 border-r border-gray-100">
                              <textarea
                                defaultValue={
                                  activity.justificativa ||
                                  activity.motivo ||
                                  ""
                                }
                                onBlur={(e) =>
                                  updateActivityField(
                                    activity.id,
                                    "justificativa",
                                    e.target.value,
                                    activity.isPlanificada,
                                  )
                                }
                                rows={1}
                                className="w-full text-[10px] bg-transparent outline-none focus:bg-white border-b border-transparent focus:border-blue-300 resize-none min-h-[32px] italic text-gray-500"
                                placeholder="Justificação..."
                              />
                            </td>
                            <td className="px-4 py-4 border-r border-gray-100">
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  defaultValue={activity.progresso || 0}
                                  onBlur={(e) =>
                                    updateActivityField(
                                      activity.id,
                                      "progresso",
                                      parseInt(e.target.value),
                                      activity.isPlanificada,
                                    )
                                  }
                                  className="w-12 text-[10px] font-black text-center bg-gray-50 border border-gray-200 rounded p-1 outline-none focus:ring-1 focus:ring-blue-400"
                                />
                                <span className="text-[10px] font-black text-gray-400">
                                  %
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4 border-r border-gray-100">
                              <select
                                value={activity.status}
                                onChange={(e) =>
                                  updateActivityField(
                                    activity.id,
                                    activity.isPlanificada
                                      ? "situacaoActividade"
                                      : "status",
                                    e.target.value,
                                    activity.isPlanificada,
                                  )
                                }
                                className={`px-2 py-1 rounded-full text-[9px] font-black tracking-widest outline-none cursor-pointer border focus:ring-2 transition-all w-full ${
                                  activity.status === "executada" ||
                                  activity.status === "realizada"
                                    ? "bg-green-100 text-green-700 border-green-200"
                                    : activity.status === "em_execucao" ||
                                        activity.status === "em_realizacao"
                                      ? "bg-blue-100 text-blue-700 border-blue-200"
                                      : activity.status === "pendente"
                                        ? "bg-amber-100 text-amber-700 border-amber-200"
                                        : "bg-red-100 text-red-700 border-red-200"
                                }`}
                              >
                                <option value="em_execucao">Em execução</option>
                                <option value="executada">Executada</option>
                                <option value="nao_executada">
                                  Não Executado
                                </option>
                                <option value="pendente">Pendente</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ) : activeTab === "setorial" ? (
              <motion.div
                key="setorial"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden"
              >
                <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-blue-50/30">
                  <div>
                    <h2 className="text-3xl font-black text-blue-900 tracking-tighter font-serif">
                      Monitoria Setorial
                    </h2>
                    <p className="text-gray-500 font-medium">
                      Actividades e orçamentos do seu setor
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-max">
                    <thead>
                      <tr className="bg-gray-50 text-xs tracking-widest text-gray-400 font-black">
                        <th className="px-6 py-6 border-b border-gray-100">
                          Actividade
                        </th>
                        <th className="px-6 py-6 border-b border-gray-100">
                          Mês
                        </th>
                        <th className="px-6 py-6 border-b border-gray-100 text-right">
                          Orçamento
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {monitoriaActivities.map((activity) => (
                        <tr
                          key={activity.id}
                          className="hover:bg-blue-50/20 transition-colors"
                        >
                          <td className="px-6 py-6 font-bold text-gray-900">
                            {activity.title}
                          </td>
                          <td className="px-6 py-6 text-gray-600">
                            {activity.mes}
                          </td>
                          <td className="px-6 py-6 text-right font-black text-green-600">
                            {activity.orcamento.toLocaleString("pt-MZ", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }) + " MZN"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ) : activeTab === "scheduled" ? (
              <motion.div
                key="scheduled"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden"
              >
                <div className="p-10 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center bg-blue-50/30 gap-4">
                  <div>
                    <h2 className="text-3xl font-black text-blue-900 tracking-tighter font-serif">
                      Capa de Eventos Agendados — Próximo Mês
                    </h2>
                    <p className="text-gray-500 font-medium mt-1">
                      Planilha publicada no dia 20 de cada mês (ex: 20 de Dezembro de 2026 publica as atividades de Janeiro de 2027).
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-bold text-gray-700 whitespace-nowrap">Mês de Referência:</label>
                    <select
                      value={selectedScheduledMonth}
                      onChange={(e) => setSelectedScheduledMonth(e.target.value)}
                      className="bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    >
                      {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].map((m) => (
                        <option key={m} value={m}>{m} 2027</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-max">
                    <thead>
                      <tr className="bg-gray-50 text-xs tracking-widest text-gray-400 font-black">
                        <th className="px-6 py-5 border-b border-gray-100">N/o</th>
                        <th className="px-6 py-5 border-b border-gray-100">Código da Atividade</th>
                        <th className="px-6 py-5 border-b border-gray-100">Mês de Realização</th>
                        <th className="px-6 py-5 border-b border-gray-100">Departamento</th>
                        <th className="px-6 py-5 border-b border-gray-100">Responsável</th>
                        <th className="px-6 py-5 border-b border-gray-100 text-right">Valor Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-800 font-medium">
                      {monitoriaActivities
                        .filter((activity) => {
                          const m = (activity.mes || activity.dataMes || "").toLowerCase();
                          return m.includes(selectedScheduledMonth.toLowerCase());
                        })
                        .map((activity, index) => (
                          <tr key={activity.id} className="hover:bg-blue-50/20 transition-colors">
                            <td className="px-6 py-5 font-mono text-sm font-bold text-gray-400">
                              {index + 1}
                            </td>
                            <td className="px-6 py-5 font-bold text-blue-900">
                              {activity.referencia || `ACT-${index + 1}`}
                            </td>
                            <td className="px-6 py-5 font-semibold text-blue-600">
                              {activity.mes || selectedScheduledMonth}
                            </td>
                            <td className="px-6 py-5 font-medium text-gray-700">
                              {activity.setor || activity.departamento || "-"}
                            </td>
                            <td className="px-6 py-5 font-medium text-gray-600">
                              {activity.responsavel || "Equipa do Departamento"}
                            </td>
                            <td className="px-6 py-5 text-right font-black text-gray-900">
                              {(activity.orcamento || activity.valor || 0).toLocaleString("pt-MZ", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }) + " MZN"}
                            </td>
                          </tr>
                        ))}
                      {monitoriaActivities.filter((activity) => {
                        const m = (activity.mes || activity.dataMes || "").toLowerCase();
                        return m.includes(selectedScheduledMonth.toLowerCase());
                      }).length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">
                            Nenhuma atividade agendada para {selectedScheduledMonth} de 2027.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-blue-50/60 font-black text-blue-950 border-t-2 border-blue-100">
                        <td colSpan={5} className="px-6 py-5 text-right  tracking-wider text-sm">
                          Soma Total do Orçamento para as Atividades em Referência:
                        </td>
                        <td className="px-6 py-5 text-right text-lg text-blue-700">
                          {monitoriaActivities
                            .filter((activity) => {
                              const m = (activity.mes || activity.dataMes || "").toLowerCase();
                              return m.includes(selectedScheduledMonth.toLowerCase());
                            })
                            .reduce((sum, a) => sum + (Number(a.orcamento || a.valor) || 0), 0)
                            .toLocaleString("pt-MZ", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }) + " MZN"}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

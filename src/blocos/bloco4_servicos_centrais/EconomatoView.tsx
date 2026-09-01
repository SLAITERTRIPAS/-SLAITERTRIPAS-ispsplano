import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Package,
  ClipboardList,
  BarChart3,
  LayoutGrid,
  Monitor,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  PlusCircle,
  X,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Boxes,
} from "lucide-react";
import { Bem } from "../../types";
import { firestoreService } from "../../lib/firestoreService";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import FormularioEntradaEstoque from "../bloco6_documentos/FormularioEntradaEstoque";
import FormularioRequisicaoInterna from "../bloco6_documentos/FormularioRequisicaoInterna";
import VisaoGeralLayout from "../bloco8_gerais/VisaoGeralLayout";
import MatrixView from "../bloco5_sistema/MatrixView";
import CalendarView from "../bloco5_sistema/CalendarView";
import AssinaturaDigitalView from "../bloco5_sistema/AssinaturaDigitalView";
import DocumentosView from "../bloco6_documentos/DocumentosView";
import GestaoDocumentosView from "../bloco4_servicos_centrais/GestaoDocumentosView";
import ReportsView from "../bloco7_relatorios/ReportsView";
import { Pen, Calendar, FileText, FolderOpen } from "lucide-react";
import BalancoMensalView from "../bloco4_servicos_centrais/BalancoMensalView";
import BalancoActividadesView from "../bloco4_servicos_centrais/BalancoActividadesView";
import { isSuperBossUser, isPatrimonioBossOrAdmin } from "../../lib/auth";
import ConsultarEstoqueModal from "../../components/ConsultarEstoqueModal";
import EstoqueCompletoView from "./EstoqueCompletoView";

export default function EconomatoView({
  user,
  onBack,
}: {
  user: any;
  onBack: () => void;
}) {
  const [bens, setBens] = React.useState<Bem[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeSubView, setActiveSubView] = useState("gestao_economato");
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showExitForm, setShowExitForm] = useState(false);
  const [showConsultarEstoqueModal, setShowConsultarEstoqueModal] = useState(false);
  const [stockEntries, setStockEntries] = React.useState<any[]>([]);
  const [movements, setMovements] = React.useState<any[]>([]);
  const [matrixActivities, setMatrixActivities] = React.useState<any[]>([]);

  // Dados fictícios para o ERP (Giro de Estoque)
  const turnoverData = [
    { name: "Jan", entradas: 400, saidas: 240, giro: 0.6 },
    { name: "Fev", entradas: 300, saidas: 139, giro: 0.5 },
    { name: "Mar", entradas: 200, saidas: 980, giro: 1.2 },
    { name: "Abr", entradas: 278, saidas: 390, giro: 0.8 },
    { name: "Mai", entradas: 189, saidas: 480, giro: 0.9 },
  ];

  const stockDistribution = [
    { name: "Limpeza", value: 400 },
    { name: "Escritório", value: 300 },
    { name: "Consumíveis", value: 300 },
    { name: "Outros", value: 200 },
  ];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  React.useEffect(() => {
    const unsub1 = firestoreService.materiais_bens.subscribe(setBens);
    const unsub2 = firestoreService.movimentos_economato.subscribe(
      (data: any[]) => {
        setMovements(data);
        // Filter for entries that might be "pending" or just the latest ones
        setStockEntries(data.filter((m) => m.tipo === "Entrada").slice(0, 10));
      },
    );
    const unsub3 =
      firestoreService.matrixActivities.subscribe(setMatrixActivities);
    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, []);

  const [categoryFilter, setCategoryFilter] = useState("Todos");

  const filteredBens = bens.filter(
    (b) =>
      b.setor === "Economato" &&
      (categoryFilter === "Todos" || b.categoria === categoryFilter),
  );

  const sideItems = [
    { id: "gestao_economato", title: "Gestão de Economato", icon: Package },
    { id: "plano", title: "Plano do Economato", icon: ClipboardList },
    { id: "estoque", title: "Estoque Completo", icon: Boxes },
    { id: "assinatura_digital", title: "Assinatura Digital", icon: Pen },
    {
      id: "documentos_normativos",
      title: "Documentos Normativos",
      icon: FileText,
    },
    {
      id: "gestao_expediente",
      title: "Gestão de Expediente",
      icon: FolderOpen,
    },
    { id: "relatorios", title: "Relatórios", icon: BarChart3 },
    { id: "balanco", title: "Balanço", icon: TrendingUp },
    { id: "erp", title: "Gestão ERP", icon: Monitor },
  ];

  const handleStockSubmit = async (data: any) => {
    try {
      const entryQty = Number(data.quantidade || data.quantidadeEntrada || 1);
      const itemDesc = data.descricao || data.descricaoMaterial || "Material de Consumo";

      // 1. Registar o movimento principal de Entrada no ERP (Almoxarifado Central)
      await firestoreService.movimentos_economato.add({
        ...data,
        descricao: itemDesc,
        quantidade: entryQty,
        tipo: "Entrada",
        origem: "Fornecedor",
        operador: user?.name || "Sistema",
        timestamp: new Date().toISOString(),
      });

      // 2. Atualizar/Criar o item no estoque geral do Economato Central
      const existingItem = bens.find(
        (b) => b.nome.toLowerCase() === itemDesc.toLowerCase() && (b.setor === "Economato" || !b.distribuicaoAutomatica),
      );

      if (existingItem) {
        const newQty =
          Number(existingItem.quantidadeDisponivel || 0) + entryQty;
        await firestoreService.materiais_bens.update(existingItem.id, {
          quantidadeDisponivel: newQty,
          updatedBy: user?.email,
          necessidade: data.necessidade || existingItem.necessidade || "",
        });
      } else {
        await firestoreService.materiais_bens.add({
          nome: itemDesc,
          quantidadeDisponivel: entryQty,
          quantidadePlanificada: entryQty,
          localizacaoAtual: data.localizacao || "Almoxarifado Central",
          grupo: data.grupo || data.classeMaterial || "Geral",
          estado: data.estado || "Novo",
          setor: "Economato",
          departamento: "Economato e Almoxarifado Central",
          direcao: "Direção de Serviços Centrais",
          updatedBy: user?.email,
          necessidade: data.necessidade || "",
        });
      }

      // 3. REDISTRIBUIÇÃO AUTOMÁTICA POR DEPARTAMENTO COM BASE NA QUANTIDADE DE ENTRADA:
      // Quotas: 35% Engenharia, 15% Gabinete DG, 20% DICOSAFA, 20% CIE, 10% DICOSSER
      const REGRAS_REDISTRIBUICAO = [
        {
          nome: "Divisão de Engenharia",
          setor: "Divisão de Engenharia",
          direcao: "Direção de Engenharia e Tecnologias",
          percent: 0.35,
          percentLabel: "35%",
        },
        {
          nome: "Gabinete do Diretor Geral",
          setor: "Gabinete da Direção Geral",
          direcao: "Gabinete do Diretor-Geral",
          percent: 0.15,
          percentLabel: "15%",
        },
        {
          nome: "DICOSAFA",
          setor: "Serviços Académicos (DICOSAFA)",
          direcao: "DICOSAFA - Direção de Serviços Académicos",
          percent: 0.20,
          percentLabel: "20%",
        },
        {
          nome: "CIE",
          setor: "Centro de Investigação (CIE)",
          direcao: "CIE - Centro de Investigação",
          percent: 0.20,
          percentLabel: "20%",
        },
        {
          nome: "DICOSSER",
          setor: "Serviços Centrais (DICOSSER)",
          direcao: "DICOSSER - Direção de Serviços Centrais",
          percent: 0.10,
          percentLabel: "10%",
        },
      ];

      let acumulado = 0;
      const planoRedistribuicao = REGRAS_REDISTRIBUICAO.map((regra, index) => {
        let qAlocada = 0;
        if (index === REGRAS_REDISTRIBUICAO.length - 1) {
          qAlocada = Math.max(0, entryQty - acumulado);
        } else {
          qAlocada = Math.floor(entryQty * regra.percent);
          acumulado += qAlocada;
        }
        return { ...regra, qAlocada };
      });

      // Gravar / Atualizar o estoque individual de cada departamento e registar o log de redistribuição
      for (const aloc of planoRedistribuicao) {
        if (aloc.qAlocada <= 0) continue;

        const existingDeptItem = bens.find(
          (b) =>
            (b.nome || "").toLowerCase() === itemDesc.toLowerCase() &&
            (b.setor || b.departamento || "").toLowerCase() === aloc.setor.toLowerCase()
        );

        if (existingDeptItem) {
          const currentPlan = Number(existingDeptItem.quantidadePlanificada || existingDeptItem.quantidadeDisponivel || 0);
          const currentDisp = Number(existingDeptItem.quantidadeDisponivel || 0);
          await firestoreService.materiais_bens.update(existingDeptItem.id, {
            quantidadeDisponivel: currentDisp + aloc.qAlocada,
            quantidadePlanificada: currentPlan + aloc.qAlocada,
            updatedBy: user?.email,
            percentualQuota: aloc.percentLabel,
            distribuicaoAutomatica: true,
          });
        } else {
          await firestoreService.materiais_bens.add({
            nome: itemDesc,
            quantidadeDisponivel: aloc.qAlocada,
            quantidadePlanificada: aloc.qAlocada,
            localizacaoAtual: `Armazém do Setor - ${aloc.nome}`,
            grupo: data.grupo || data.classeMaterial || "Consumíveis",
            estado: "Novo",
            setor: aloc.setor,
            departamento: aloc.setor,
            direcao: aloc.direcao,
            updatedBy: user?.email,
            necessidade: data.necessidade || "",
            distribuicaoAutomatica: true,
            percentualQuota: aloc.percentLabel,
          });
        }

        // Registar o log individual de redistribuição no ERP
        await firestoreService.movimentos_economato.add({
          descricao: itemDesc,
          quantidade: aloc.qAlocada,
          tipo: "ENTRADA_REDISTRIBUIDA",
          origem: `Redistribuição Automática (${aloc.percentLabel})`,
          fornecedor: data.fornecedor || "Economato Central",
          departamento: aloc.setor,
          direcao: aloc.direcao,
          quotaPercentual: aloc.percentLabel,
          operador: user?.name || "Redistribuição Automática ERP",
          timestamp: new Date().toISOString(),
        });
      }

      alert(
        `Entrada de ${entryQty} un de "${itemDesc}" registada com sucesso!\n\n` +
        `Redistribuição Automática Concluída:\n` +
        `- 35% Divisão de Engenharia: ${planoRedistribuicao[0].qAlocada} un\n` +
        `- 15% Gabinete DG: ${planoRedistribuicao[1].qAlocada} un\n` +
        `- 20% DICOSAFA: ${planoRedistribuicao[2].qAlocada} un\n` +
        `- 20% CIE: ${planoRedistribuicao[3].qAlocada} un\n` +
        `- 10% DICOSSER: ${planoRedistribuicao[4].qAlocada} un`
      );

      setShowEntryForm(false);
    } catch (error) {
      console.error("Erro ao guardar entrada:", error);
      alert("Falha na comunicação com o sistema ERP (Firestore).");
    }
  };

  const handleExitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const itemId = formData.get("item") as string;
    const qtd = Number(formData.get("quantidade"));
    const dept = formData.get("departamento") as string;

    const selectedItem = bens.find((b) => b.id === itemId);
    if (!selectedItem) {
      alert("Item não encontrado no inventário.");
      return;
    }

    if (Number(selectedItem.quantidadeDisponivel || 0) < qtd) {
      alert("Quantidade insuficiente em estoque!");
      return;
    }

    try {
      // 1. Registar a saída para consumo interno
      await firestoreService.movimentos_economato.add({
        descricao: selectedItem.nome,
        quantidade: qtd,
        departamento: dept,
        tipo: "SAIDA_CONSUMO",
        origem: "Almoxarifado",
        operador: user?.name || "Sistema",
        timestamp: new Date().toISOString(),
      });

      // 2. Decrementar do estoque real
      const newQty = Number(selectedItem.quantidadeDisponivel || 0) - qtd;
      await firestoreService.materiais_bens.update(selectedItem.id, {
        quantidadeDisponivel: newQty,
        updatedBy: user?.email,
      });

      alert(
        `Saída de ${qtd} unid. de ${selectedItem.nome} para ${dept} registada com sucesso!`,
      );
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error("Erro ao registar saída:", error);
      alert("Falha ao registar saída para consumo.");
    }
  };

  const renderContent = () => {
    if (showEntryForm) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowEntryForm(false)}
                className="bg-slate-100 p-2.5 rounded-xl text-[#121c60] hover:bg-slate-200 hover:scale-105 transition-all flex items-center justify-center shadow-sm"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <span className="text-[10px] font-bold text-slate-400  tracking-widest block">
                  Voltar para o Módulo de Suprimentos
                </span>
                <h3 className="text-sm font-black text-slate-850">
                  Registo ERP de Entrada de Produtos
                </h3>
              </div>
            </div>
            <button
              onClick={() => setShowEntryForm(false)}
              className="text-xs font-bold text-[#121c60] hover:text-[#0b113a] bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-all"
            >
              Retornar ao Almoxarifado
            </button>
          </div>
          <FormularioEntradaEstoque
            user={user}
            onCancel={() => setShowEntryForm(false)}
            onSubmit={handleStockSubmit}
          />
        </div>
      );
    }

    if (showExitForm) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowExitForm(false)}
                className="bg-slate-100 p-2.5 rounded-xl text-[#121c60] hover:bg-slate-200 hover:scale-105 transition-all flex items-center justify-center shadow-sm"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <span className="text-[10px] font-bold text-slate-400  tracking-widest block">
                  Voltar para o Módulo de Suprimentos
                </span>
                <h3 className="text-sm font-black text-slate-850">
                  Requisição & Saída Consolidada de Consumos
                </h3>
              </div>
            </div>
            <button
              onClick={() => setShowExitForm(false)}
              className="text-xs font-bold text-[#121c60] hover:text-[#0b113a] bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-all"
            >
              Retornar ao Almoxarifado
            </button>
          </div>
          <FormularioRequisicaoInterna
            user={user}
            onCancel={() => setShowExitForm(false)}
            onSubmit={() => setShowExitForm(false)}
          />
        </div>
      );
    }

    switch (activeSubView) {
      case "visao_geral":
        return <VisaoGeralLayout title="Economato" />;
      case "gestao_economato":
      case "estoque":
        return (
          <EstoqueCompletoView
            user={user}
            onOpenNovaEntrada={() => setShowEntryForm(true)}
            onOpenSaidaConsumo={() => setShowExitForm(true)}
          />
        );
      case "plano":
        return (
          <MatrixView
            title="Plano do Economato"
            isDepartment={true}
            user={user}
            externalActivities={matrixActivities}
            setExternalActivities={(acts) => {
              if (typeof acts === "function") {
                setMatrixActivities(acts);
              } else {
                setMatrixActivities(acts);
              }
            }}
            onActivityAdded={async (act) => {
              try {
                await firestoreService.matrixActivities.add({
                  ...act,
                  departamento: "Economato",
                  unidadeOrganica: "Economato",
                  updatedBy: user?.email,
                });
              } catch (e) {
                console.error("Erro ao adicionar atividade:", e);
              }
            }}
            onUpdateActivity={async (id, data) => {
              try {
                await firestoreService.matrixActivities.update(id, data);
              } catch (e) {
                console.error("Erro ao atualizar atividade:", e);
              }
            }}
            onDeleteActivity={async (id) => {
              try {
                await firestoreService.matrixActivities.delete(id);
              } catch (e) {
                console.error("Erro ao eliminar atividade:", e);
              }
            }}
          />
        );
      case "calendario":
        return (
          <CalendarView
            events={[]}
            notes={[]}
            title="Economato"
            onAddEvent={async () => {}}
            onUpdateEvent={async () => {}}
            onDeleteEvent={async () => {}}
            onAgendar={() => {}}
            onNota={() => {}}
          />
        );
      case "documentos_normativos":
        return <DocumentosView title="Economato" user={user} />;
      case "gestao_expediente":
        return (
          <GestaoDocumentosView
            title="Economato"
            expedientes={[]}
            onUpdateExpediente={() => {}}
            onBack={() => {}}
            onTrackingClick={() => {}}
            hideHeader={true}
          />
        );
      case "assinatura_digital":
        return <AssinaturaDigitalView user={user} onBack={() => {}} />;
      case "balanco":
        return (
          <BalancoActividadesView
            activities={matrixActivities}
            user={user}
            onBack={() => setActiveSubView("plano")}
            sectorTitle="Economato"
          />
        );
      case "erp":
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black text-slate-400 tracking-widest">
                    Giro ERP (Mês)
                  </span>
                  <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl">
                    <TrendingUp size={20} />
                  </div>
                </div>
                <div className="text-4xl font-black text-slate-800">1.25x</div>
                <div className="text-[11px] text-emerald-600 mt-2 font-bold flex items-center gap-1">
                  <ArrowUpRight size={14} /> Performance Superior vs Plano
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black text-slate-400 tracking-widest">
                    Monitoramento E/S
                  </span>
                  <div className="bg-blue-100 text-blue-600 p-2 rounded-xl">
                    <Package size={20} />
                  </div>
                </div>
                <div className="text-4xl font-black text-slate-800">
                  420 / 215
                </div>
                <div className="text-[11px] text-slate-500 mt-2 font-medium">
                  Entradas / Saídas Processadas (24h)
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black text-slate-400 tracking-widest">
                    Eficiência ERP
                  </span>
                  <div className="bg-purple-100 text-purple-600 p-2 rounded-xl">
                    <Monitor size={20} />
                  </div>
                </div>
                <div className="text-4xl font-black text-slate-800">97.8%</div>
                <div className="text-[11px] text-purple-600 mt-2 font-bold">
                  Taxa de Sincronização de Inventário
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-8 flex items-center gap-2">
                  <TrendingUp size={22} className="text-blue-600" />
                  Monitoramento Real de Giro
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={turnoverData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="giro"
                        name="Giro Gestão"
                        stroke="#3b82f6"
                        strokeWidth={4}
                        dot={{
                          fill: "#3b82f6",
                          r: 6,
                          strokeWidth: 2,
                          stroke: "#fff",
                        }}
                        activeDot={{ r: 8, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-8 flex items-center gap-2">
                  <Package size={22} className="text-emerald-600" />
                  Relação Entrada / Consumo ERP
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={turnoverData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                      />
                      <Tooltip cursor={{ fill: "#f8fafc" }} />
                      <Bar
                        dataKey="entradas"
                        fill="#3b82f6"
                        radius={[6, 6, 0, 0]}
                        barSize={24}
                      />
                      <Bar
                        dataKey="saidas"
                        fill="#ef4444"
                        radius={[6, 6, 0, 0]}
                        barSize={24}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <div className="bg-emerald-500 h-3 w-3 rounded-full animate-pulse"></div>
              </div>
              <h3 className="font-bold text-xl mb-8 flex items-center gap-3">
                <Monitor size={24} className="text-emerald-400" /> Real-Time
                Management Logs
              </h3>
              <div className="space-y-3">
                {movements.slice(0, 6).map((log, i) => (
                  <div
                    key={log.id || i}
                    className="flex items-center gap-6 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group"
                  >
                    <div className="text-slate-500 font-mono text-[11px] w-20">
                      {log.timestamp
                        ? new Date(log.timestamp).toLocaleTimeString()
                        : "--:--:--"}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold group-hover:text-emerald-300 transition-colors">
                        {log.descricao}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {log.tipo === "Entrada"
                          ? `Entrada de ${log.quantidade} unid`
                          : `Saída de ${log.quantidade} unid para ${log.departamento || "N/A"}`}
                      </div>
                    </div>
                    <div
                      className={`text-[9px] font-black px-3 py-1 rounded-full ${log.tipo === "Entrada" ? "bg-emerald-500" : "bg-red-500"} text-white  tracking-tighter`}
                    >
                      {log.tipo}
                    </div>
                  </div>
                ))}
                {movements.length === 0 && (
                  <div className="text-center py-8 text-slate-500 italic text-sm italic">
                    Nenhum evento registado em tempo real.
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case "relatorios":
        return (
          <ReportsView
            user={user}
            onShowAlert={(msg) => alert(msg)}
            initialDirection="Economato"
            onBack={() => setActiveSubView("visao_geral")}
          />
        );
    }
  };

  return (
    <div className="flex h-full bg-gray-50 relative">
      <div
        className={`bg-slate-900 text-white flex flex-col p-4 shadow-xl relative transition-all duration-300 ${
          isSidebarCollapsed ? "w-16 px-2" : "w-64"
        }`}
      >
        {/* Botão de minimização/maximização centrado no limite do submenu lateral */}
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          title={isSidebarCollapsed ? "Maximizar Menu Lateral" : "Minimizar Menu Lateral"}
          className="hidden md:flex absolute top-1/2 -translate-y-1/2 -right-3.5 z-40 w-7 h-7 bg-white text-slate-900 hover:bg-blue-600 hover:text-white rounded-full border-2 border-slate-300 hover:border-blue-600 shadow-xl items-center justify-center transition-all duration-300 transform hover:scale-110 focus:outline-none cursor-pointer"
        >
          {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Voltar Button */}
        {isPatrimonioBossOrAdmin(user) && (
          <button
            onClick={onBack}
            title="Voltar ao Menu"
            className={`w-full flex items-center gap-3 p-3 mb-3 rounded-xl transition-all duration-200 bg-slate-800/50 hover:bg-slate-800 text-amber-500 hover:text-amber-400 font-bold border border-slate-700/50 hover:border-slate-600 shadow-sm ${
              isSidebarCollapsed ? "justify-center px-0" : ""
            }`}
          >
            <ArrowLeft size={18} className="shrink-0" />
            {!isSidebarCollapsed && <span>Voltar ao Menu</span>}
          </button>
        )}

         {/* Header do Submenu Lateral de Economato removido a pedido do utilizador */}

        <div className="flex-1 space-y-2">
          {sideItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSubView(item.id)}
              title={item.title}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                isSidebarCollapsed ? "justify-center px-0" : ""
              } ${activeSubView === item.id ? "bg-slate-800 text-white font-bold" : "hover:bg-slate-800 text-slate-300"}`}
            >
              <item.icon size={20} className="shrink-0" />
              {!isSidebarCollapsed && <span>{item.title}</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 p-8 overflow-y-auto">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">
          Economato - {sideItems.find((i) => i.id === activeSubView)?.title}
        </h2>
        {renderContent()}
      </div>

      <ConsultarEstoqueModal
        user={user}
        isOpen={showConsultarEstoqueModal}
        onClose={() => setShowConsultarEstoqueModal(false)}
        onSelectProductForRequisition={() => {
          setShowConsultarEstoqueModal(false);
          setShowExitForm(true);
        }}
      />
    </div>
  );
}

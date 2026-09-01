import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Package,
  X,
  Search,
  Filter,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  TrendingDown,
  Layers,
  BarChart3,
  ShoppingCart,
  ShieldAlert,
} from "lucide-react";
import { firestoreService } from "../lib/firestoreService";

interface ConsultarEstoqueModalProps {
  user?: any;
  isOpen: boolean;
  onClose: () => void;
  onSelectProductForRequisition?: (product: any) => void;
  defaultSector?: string;
}

export interface SetorEstoqueItem {
  id: string;
  setor: string;
  nome: string;
  grupo?: string;
  categoria?: string;
  quantidadePlanificada: number;
  quantidadeRequisitada: number;
  saldoDisponivel: number;
  unidadeMedida?: string;
  localizacao?: string;
  percentualQuota?: string;
  source: "materiais_bens" | "matrix_activities";
}

const SETORES_PADRAO = [
  "Todos os Setores",
  "Gabinete do Diretor-Geral",
  "Secretaria Geral",
  "Departamento de Recursos Humanos",
  "Departamento de Património",
  "Economato",
  "Departamento TIC",
  "Direção Académica",
  "Serviços Académicos",
  "Departamento Lar de Estudantes",
  "Departamento de Produção Alimentar",
  "Repartição de Finanças",
  "Biblioteca Central",
];

export default function ConsultarEstoqueModal({
  user,
  isOpen,
  onClose,
  onSelectProductForRequisition,
  defaultSector,
}: ConsultarEstoqueModalProps) {
  const [selectedSetor, setSelectedSetor] = useState<string>(
    defaultSector || user?.departamento || user?.direcao || "Todos os Setores",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "disponivel" | "esgotado">("todos");

  const [bens, setBens] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [requisicoes, setRequisicoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (defaultSector) {
      setSelectedSetor(defaultSector);
    } else if (user?.departamento || user?.direcao) {
      setSelectedSetor(user.departamento || user.direcao);
    }
  }, [defaultSector, user]);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    const unsubBens = firestoreService.materiais_bens.subscribe((data: any[]) => {
      setBens(data || []);
      setLoading(false);
    });

    const unsubAct = firestoreService.matrixActivities.subscribe((data: any[]) => {
      setActivities(data || []);
    });

    const unsubReq = firestoreService.requisicoes_internas.subscribe((data: any[]) => {
      setRequisicoes(data || []);
    });

    return () => {
      unsubBens();
      unsubAct();
      unsubReq();
    };
  }, [isOpen]);

  // Consolidar produtos planificados e saldos por setor
  const estoqueConsolidado = useMemo(() => {
    const itemsMap = new Map<string, SetorEstoqueItem>();

    // Helper para criar chave única de Setor + Produto
    const getKey = (setorName: string, prodName: string) =>
      `${(setorName || "Geral").trim().toLowerCase()}:::${(prodName || "Sem Nome").trim().toLowerCase()}`;

    // 1. Processar itens existentes no inventário / materiais_bens
    bens.forEach((b) => {
      const setorNorm = (b.setor || b.unidadeOrganica || b.departamento || "Economato").trim();
      const nomeNorm = (b.nome || b.descricao || "Material de Consumo").trim();
      const key = getKey(setorNorm, nomeNorm);

      const qtdPlanificada = Number(b.quantidadePlanificada || b.quantidadeInicial || b.quantidadeDisponivel || 0);
      const qtdRequisitada = Number(b.quantidadeRequisitada || 0);
      const saldo = Number(b.quantidadeDisponivel !== undefined ? b.quantidadeDisponivel : Math.max(0, qtdPlanificada - qtdRequisitada));

      itemsMap.set(key, {
        id: b.id || key,
        setor: setorNorm,
        nome: nomeNorm,
        grupo: b.grupo || b.categoria || "Material de Consumo",
        categoria: b.categoria || "Consumíveis",
        quantidadePlanificada: Math.max(qtdPlanificada, saldo + qtdRequisitada),
        quantidadeRequisitada: qtdRequisitada,
        saldoDisponivel: saldo,
        unidadeMedida: b.unidadeMedida || "UN",
        localizacao: b.localizacaoAtual || "Almoxarifado",
        source: "materiais_bens",
      });
    });

    // 2. Processar itens de bens planificados em atividades/matriz orçamental
    activities.forEach((act) => {
      const setorNorm = (act.unidade || act.departamento || act.direcao || act.setor || "Serviços Gerais").trim();
      const rubricaLower = (act.rubrica || act.necessidade || "").toLowerCase();
      const descLower = (act.descricao || act.actividade || act.objeto || "").toLowerCase();

      // Verificar se é item de bens/materiais (121 ou bens)
      if (
        rubricaLower.includes("121") ||
        rubricaLower.includes("bens") ||
        rubricaLower.includes("material") ||
        descLower.includes("material") ||
        descLower.includes("resma") ||
        descLower.includes("papel") ||
        descLower.includes("toner") ||
        descLower.includes("caneta") ||
        descLower.includes("limpeza")
      ) {
        const prodName = act.necessidade || act.rubrica || act.objeto || act.descricao || "Material Planificado";
        const key = getKey(setorNorm, prodName);
        const qtdPlan = Number(act.quantidade || act.qtd || 1);

        if (itemsMap.has(key)) {
          const existing = itemsMap.get(key)!;
          existing.quantidadePlanificada += qtdPlan;
          existing.saldoDisponivel = Math.max(0, existing.quantidadePlanificada - existing.quantidadeRequisitada);
        } else {
          itemsMap.set(key, {
            id: act.id || key,
            setor: setorNorm,
            nome: prodName,
            grupo: "Planificado via Atividades",
            categoria: "Bens e Materiais (Cap. 12.1)",
            quantidadePlanificada: qtdPlan,
            quantidadeRequisitada: 0,
            saldoDisponivel: qtdPlan,
            unidadeMedida: "UN",
            localizacao: "Estoque Planificado",
            source: "matrix_activities",
          });
        }
      }
    });

    // 3. Subtrair requisições efetivamente aprovadas/processadas por setor
    requisicoes.forEach((req) => {
      if (req.status === "Rejeitada" || req.status === "Desfavorável") return;

      const reqSetor = (req.departamentoRequisitante || req.unidadeOrganica || req.setor || "").trim();
      const reqProd = (req.descricaoMaterial || (req.itens && req.itens[0]?.descricao) || "").trim();
      const reqQtd = Number(req.quantidade || (req.itens && req.itens[0]?.qtd) || 0);

      if (reqSetor && reqProd && reqQtd > 0) {
        const key = getKey(reqSetor, reqProd);
        if (itemsMap.has(key)) {
          const item = itemsMap.get(key)!;
          item.quantidadeRequisitada += reqQtd;
          item.saldoDisponivel = Math.max(0, item.quantidadePlanificada - item.quantidadeRequisitada);
        }
      }
    });

    return Array.from(itemsMap.values());
  }, [bens, activities, requisicoes]);

  // Lista de setores únicos para o filtro
  const setoresDisponiveis = useMemo(() => {
    const set = new Set<string>();
    SETORES_PADRAO.forEach((s) => set.add(s));
    estoqueConsolidado.forEach((item) => {
      if (item.setor) set.add(item.setor);
    });
    return Array.from(set);
  }, [estoqueConsolidado]);

  // Filtro de itens exibidos
  const itensFiltrados = useMemo(() => {
    return estoqueConsolidado.filter((item) => {
      // Filtro de Setor
      const matchesSetor =
        selectedSetor === "Todos os Setores" ||
        item.setor.toLowerCase().includes(selectedSetor.toLowerCase()) ||
        selectedSetor.toLowerCase().includes(item.setor.toLowerCase());

      // Filtro de Pesquisa
      const matchesSearch =
        !searchTerm.trim() ||
        item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.setor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.grupo || "").toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro de Estado
      const matchesStatus =
        statusFilter === "todos" ||
        (statusFilter === "disponivel" && item.saldoDisponivel > 0) ||
        (statusFilter === "esgotado" && item.saldoDisponivel <= 0);

      return matchesSetor && matchesSearch && matchesStatus;
    });
  }, [estoqueConsolidado, selectedSetor, searchTerm, statusFilter]);

  // Métricas do Setor Selecionado
  const metricas = useMemo(() => {
    const totalProdutos = itensFiltrados.length;
    const totalPlanificado = itensFiltrados.reduce((acc, i) => acc + i.quantidadePlanificada, 0);
    const totalRequisitado = itensFiltrados.reduce((acc, i) => acc + i.quantidadeRequisitada, 0);
    const totalSaldoDisponivel = itensFiltrados.reduce((acc, i) => acc + i.saldoDisponivel, 0);
    const itensEsgotados = itensFiltrados.filter((i) => i.saldoDisponivel <= 0).length;

    return {
      totalProdutos,
      totalPlanificado,
      totalRequisitado,
      totalSaldoDisponivel,
      itensEsgotados,
    };
  }, [itensFiltrados]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-6xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
        >
          {/* Header do Modal */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 text-white flex items-center justify-between relative overflow-hidden border-b border-blue-800/30">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600/30 p-3.5 rounded-2xl border border-blue-400/20 text-blue-300 shadow-inner">
                <Package size={28} />
              </div>
              <div>
                <span className="text-[10px] font-mono font-black text-blue-300  tracking-widest block">
                  Economato & Suprimentos Centrais
                </span>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  Consulta de Estoque por Setor
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Produtos planificados, aprovados e saldo disponível em tempo real
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="bg-white/10 hover:bg-white/20 p-2.5 rounded-full text-slate-300 hover:text-white transition-all border border-white/10 shadow-sm"
              title="Fechar Janela"
            >
              <X size={20} />
            </button>
          </div>

          {/* Painel de Filtros e Pesquisa */}
          <div className="p-6 bg-slate-50 border-b border-slate-200/80 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Seleção de Setor */}
              <div className="md:col-span-5">
                <label className="block text-[11px] font-black text-slate-600  tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Building2 size={14} className="text-blue-600" />
                  Setor / Departamento Planificador:
                </label>
                <select
                  value={selectedSetor}
                  onChange={(e) => setSelectedSetor(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all shadow-sm"
                >
                  {setoresDisponiveis.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Barra de Pesquisa */}
              <div className="md:col-span-4">
                <label className="block text-[11px] font-black text-slate-600  tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Search size={14} className="text-blue-600" />
                  Buscar Produto / Material:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nome do produto ou especificação..."
                    className="w-full bg-white border border-slate-300 rounded-2xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all shadow-sm"
                  />
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Filtro de Disponibilidade */}
              <div className="md:col-span-3">
                <label className="block text-[11px] font-black text-slate-600  tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Filter size={14} className="text-blue-600" />
                  Status de Saldo:
                </label>
                <div className="flex bg-white p-1 rounded-2xl border border-slate-300 shadow-sm">
                  <button
                    onClick={() => setStatusFilter("todos")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${statusFilter === "todos" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setStatusFilter("disponivel")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${statusFilter === "disponivel" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
                  >
                    🟢 Disponível
                  </button>
                  <button
                    onClick={() => setStatusFilter("esgotado")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${statusFilter === "esgotado" ? "bg-red-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
                  >
                    🔴 Esgotado
                  </button>
                </div>
              </div>
            </div>

            {/* Cartões KPI do Setor */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400  tracking-wider block">
                  Produtos do Setor
                </span>
                <span className="text-xl font-black text-slate-850 mt-0.5 block">
                  {metricas.totalProdutos} <span className="text-xs font-bold text-slate-400">itens</span>
                </span>
              </div>

              <div className="bg-blue-50/80 p-3.5 rounded-2xl border border-blue-200/80 shadow-sm">
                <span className="text-[10px] font-bold text-blue-600  tracking-wider block">
                  Total Planificado/Aprovado
                </span>
                <span className="text-xl font-black text-blue-900 mt-0.5 block">
                  {metricas.totalPlanificado} <span className="text-xs font-bold text-blue-600">unid.</span>
                </span>
              </div>

              <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200/80 shadow-sm">
                <span className="text-[10px] font-bold text-emerald-600  tracking-wider block">
                  Saldo Restante em Estoque
                </span>
                <span className="text-xl font-black text-emerald-900 mt-0.5 block">
                  {metricas.totalSaldoDisponivel} <span className="text-xs font-bold text-emerald-600">unid.</span>
                </span>
              </div>

              <div className="bg-red-50/80 p-3.5 rounded-2xl border border-red-200/80 shadow-sm">
                <span className="text-[10px] font-bold text-red-600  tracking-wider block">
                  Itens Esgotados
                </span>
                <span className="text-xl font-black text-red-700 mt-0.5 block">
                  {metricas.itensEsgotados} <span className="text-xs font-bold text-red-500">sem saldo</span>
                </span>
              </div>
            </div>
          </div>

          {/* Tabela de Estoque por Setor */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="py-20 text-center">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-500">
                  Carregando estoque consolidado dos setores...
                </p>
              </div>
            ) : itensFiltrados.length > 0 ? (
              <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-sm bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[10px] font-black  tracking-wider">
                      <th className="p-4 pl-6">SETOR PLANIFICADOR</th>
                      <th className="p-4">NOME DO PRODUTO</th>
                      <th className="p-4 text-center">QTD PLANIFI</th>
                      <th className="p-4 text-center">QUOTA DE REDISTRIBUIÇÃO</th>
                      <th className="p-4 text-center">SAÍDA</th>
                      <th className="p-4 text-center">SALDO</th>
                      <th className="p-4 text-right pr-6">AÇÃO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                    {itensFiltrados.map((item) => {
                      const temEstoque = item.saldoDisponivel > 0;
                      const quotaTag = item.percentualQuota || (item.setor?.includes("Engenharia") ? "35%" : item.setor?.includes("Gabinete") ? "15%" : "20%");
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-blue-50/40 transition-colors group"
                        >
                          <td className="p-4 pl-6 font-bold text-slate-900">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 text-[11px] font-extrabold border border-slate-200">
                              <Building2 size={12} className="text-blue-600" />
                              {item.setor}
                            </span>
                          </td>

                          <td className="p-4">
                            <div className="font-extrabold text-slate-900 text-sm group-hover:text-blue-900 transition-colors">
                              {item.nome}
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 mt-0.5">
                              {item.grupo || "Material de Consumo"} • {item.unidadeMedida || "UN"}
                            </div>
                          </td>

                          <td className="p-4 text-center font-bold text-slate-700">
                            {item.quantidadePlanificada} {item.unidadeMedida || "unid."}
                          </td>

                          <td className="p-4 text-center">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-300">
                              {quotaTag}
                            </span>
                          </td>

                          <td className="p-4 text-center font-bold text-amber-700">
                            {item.quantidadeRequisitada || 0} {item.unidadeMedida || "unid."}
                          </td>

                          <td className="p-4 text-center">
                            <span
                              className={`inline-block px-3 py-1 rounded-xl font-black text-sm ${temEstoque ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-red-100 text-red-700 border border-red-300"}`}
                            >
                              {item.saldoDisponivel} {item.unidadeMedida || "unid."}
                            </span>
                          </td>

                          <td className="p-4 text-center">
                            {temEstoque ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 size={12} /> Disponível
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-50 text-red-700 border border-red-200">
                                <ShieldAlert size={12} /> Esgotado
                              </span>
                            )}
                          </td>

                          <td className="p-4 text-right pr-6">
                            {onSelectProductForRequisition && (
                              <button
                                onClick={() => {
                                  if (temEstoque) {
                                    onSelectProductForRequisition(item);
                                    onClose();
                                  }
                                }}
                                disabled={!temEstoque}
                                className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 ml-auto shadow-sm ${temEstoque ? "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105" : "bg-slate-200 text-slate-400 cursor-not-allowed opacity-60"}`}
                                title={temEstoque ? "Preencher requisição com este item" : "Sem saldo disponível para requisição neste setor"}
                              >
                                <ShoppingCart size={13} />
                                Requisitar
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-16 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300 p-8">
                <ShieldAlert size={40} className="mx-auto text-slate-400 mb-3" />
                <h3 className="font-extrabold text-slate-800 text-base">
                  Nenhum produto planificado/encontrado
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Não foram localizados produtos no estoque planificado para o setor "
                  <strong className="text-slate-800">{selectedSetor}</strong>". Tente alterar o setor ou ajustar os termos da pesquisa.
                </p>
              </div>
            )}
          </div>

          {/* Footer do Modal */}
          <div className="p-4 px-6 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-bold">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sincronização em tempo real com o plano do setor e almoxarifado central</span>
            </div>

            <button
              onClick={onClose}
              className="bg-slate-900 text-white px-5 py-2 rounded-xl hover:bg-slate-800 transition-all shadow-sm font-extrabold"
            >
              Fechar Consulta
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

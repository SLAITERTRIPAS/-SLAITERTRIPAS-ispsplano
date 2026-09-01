import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Search,
  Plus,
  Filter,
  Trash2,
  Edit3,
  TrendingUp,
  Coins,
  Award,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  User,
  X,
  Save,
  FileText,
  Check,
  Landmark,
  Download,
} from "lucide-react";
import { firestoreService } from "../../lib/firestoreService";
import { motion, AnimatePresence } from "motion/react";
import { isSuperBossUser } from "../../lib/auth";

interface BolsaData {
  id?: string;
  estudanteNome: string;
  raCodigo: string;
  curso: string;
  tipoBolsa: "Integral" | "Parcial" | "Isenção de Propina";
  financiador: string;
  valorMensal: number;
  status: "Ativo" | "Suspenso" | "Concluído";
  dataInicio: string;
  observacoes?: string;
}

const CURSOS_Songo = [
  "Engenharia Elétrica",
  "Engenharia Eletrónica e Telecomunicações",
  "Engenharia de Energias Renováveis",
  "Engenharia de Construção Civil",
  "Engenharia Hidráulica",
  "Engenharia de Construção Mecânica",
  "Engenharia Termotécnica",
];

const FINANCIADORES = [
  "HCB - Hidroeléctrica de Cahora Bassa",
  "MINEDH - Ministério da Educação e Des. Humano",
  "FND - Fundo Nacional de Desenvolvimento",
  "Songo - Subsídio Interno do Instituto",
  "Autarquia de Songo",
  "Parceiros de Cooperação Internacional",
];

const SEED_BOLSAS: BolsaData[] = [];

export default function BolsasEstudosView({
  title,
  onEstatistica,
  user,
  viewMode = "form",
}: {
  title: string;
  onEstatistica?: () => void;
  user?: any;
  viewMode?: "summary" | "form";
}) {
  const isAdmin = isSuperBossUser(user);
  const [bolsas, setBolsas] = useState<BolsaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("Todos");
  const [filterStatus, setFilterStatus] = useState<string>("Todos");
  const [filterFinanciador, setFilterFinanciador] = useState<string>("Todos");

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBolsa, setEditingBolsa] = useState<BolsaData | null>(null);

  // Form fields
  const [nome, setNome] = useState("");
  const [ra, setRa] = useState("");
  const [curso, setCurso] = useState(CURSOS_Songo[0]);
  const [tipo, setTipo] = useState<
    "Integral" | "Parcial" | "Isenção de Propina"
  >("Integral");
  const [financiador, setFinanciador] = useState(FINANCIADORES[0]);
  const [valor, setValor] = useState(7000);
  const [status, setStatus] = useState<"Ativo" | "Suspenso" | "Concluído">(
    "Ativo",
  );
  const [dataIni, setDataIni] = useState(
    new Date().toISOString().substring(0, 10),
  );
  const [obs, setObs] = useState("");

  // Toast / Status state
  const [alertMsg, setAlertMsg] = useState<{
    text: string;
    type: "success" | "err";
  } | null>(null);

  // Subscribe to Bolsas From Firestore
  useEffect(() => {
    let unsubscribed = false;

    const unsubscribe = firestoreService.bolsas.subscribe(
      async (data: any[]) => {
        if (unsubscribed) return;

        setBolsas(data || []);
        setLoading(false);
      },
    );

    return () => {
      unsubscribed = true;
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  const triggerAlert = (text: string, type: "success" | "err" = "success") => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  const openAddForm = () => {
    setEditingBolsa(null);
    setNome("");
    setRa("");
    setCurso(CURSOS_Songo[0]);
    setTipo("Integral");
    setFinanciador(FINANCIADORES[0]);
    setValor(8000);
    setStatus("Ativo");
    setDataIni(new Date().toISOString().substring(0, 10));
    setObs("");
    setShowAddForm(true);
  };

  const openEditForm = (item: BolsaData) => {
    setEditingBolsa(item);
    setNome(item.estudanteNome);
    setRa(item.raCodigo);
    setCurso(item.curso);
    setTipo(item.tipoBolsa);
    setFinanciador(item.financiador);
    setValor(item.valorMensal);
    setStatus(item.status);
    setDataIni(item.dataInicio || new Date().toISOString().substring(0, 10));
    setObs(item.observacoes || "");
    setShowAddForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !ra.trim()) {
      triggerAlert(
        "Por favor, preencha o nome do estudante e código RA.",
        "err",
      );
      return;
    }

    const payload: BolsaData = {
      estudanteNome: nome,
      raCodigo: ra,
      curso,
      tipoBolsa: tipo,
      financiador,
      valorMensal: tipo === "Isenção de Propina" ? 0 : Number(valor),
      status,
      dataInicio: dataIni,
      observacoes: obs,
    };

    try {
      if (editingBolsa && editingBolsa.id) {
        await firestoreService.bolsas.update(editingBolsa.id, payload);
        triggerAlert("Registo de bolseiro atualizado com sucesso!");
      } else {
        await firestoreService.bolsas.add(payload);
        triggerAlert("Novo bolseiro registado com sucesso!");
      }
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
      triggerAlert("Ocorreu um erro ao gravar os dados académicos.", "err");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (
      window.confirm(
        `Tem a certeza que deseja eliminar o registo de bolsa de ${name}?`,
      )
    ) {
      try {
        await firestoreService.bolsas.delete(id);
        triggerAlert("Registo eliminado com sucesso.");
      } catch (err) {
        console.error(err);
        triggerAlert("Erro ao eliminar o registo.", "err");
      }
    }
  };

  // Calculations for Stats
  const activeBolsas = bolsas.filter((b) => b.status === "Ativo");
  const totalMonthlyPayout = activeBolsas.reduce(
    (sum, b) => sum + (b.valorMensal || 0),
    0,
  );
  const integralCount = activeBolsas.filter(
    (b) => b.tipoBolsa === "Integral",
  ).length;
  const parcialCount = activeBolsas.filter(
    (b) => b.tipoBolsa === "Parcial",
  ).length;
  const isencaoCount = activeBolsas.filter(
    (b) => b.tipoBolsa === "Isenção de Propina",
  ).length;

  // Course & Sponsor distribution calculations for summary mode
  const bolsasPorCurso = CURSOS_Songo.map((cursoName) => {
    const list = bolsas.filter((b) => b.curso === cursoName);
    const ativos = list.filter((b) => b.status === "Ativo").length;
    const valor = list
      .filter((b) => b.status === "Ativo")
      .reduce((sum, b) => sum + (b.valorMensal || 0), 0);
    return { curso: cursoName, total: list.length, ativos, valor };
  }).filter((c) => c.total > 0);

  const bolsasPorFinanciador = FINANCIADORES.map((finName) => {
    const list = bolsas.filter((b) => b.financiador === finName);
    const ativos = list.filter((b) => b.status === "Ativo").length;
    const valor = list
      .filter((b) => b.status === "Ativo")
      .reduce((sum, b) => sum + (b.valorMensal || 0), 0);
    return { financiador: finName, total: list.length, ativos, valor };
  }).filter((f) => f.total > 0);

  // Search and Filter logic
  const filteredBolsas = bolsas.filter((b) => {
    const matchesSearch =
      b.estudanteNome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.raCodigo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.curso.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === "Todos" || b.tipoBolsa === filterType;
    const matchesStatus = filterStatus === "Todos" || b.status === filterStatus;
    const matchesFinanciador =
      filterFinanciador === "Todos" || b.financiador === filterFinanciador;

    return matchesSearch && matchesType && matchesStatus && matchesFinanciador;
  });

  return (
    <div className="flex flex-col flex-1 h-full w-full bg-slate-50 overflow-hidden font-sans">
      {/* Header Panel */}
      <div className="bg-white text-slate-900 p-6 shadow-xs border-b border-slate-200 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl border border-blue-100">
              <GraduationCap className="w-10 h-10" />
            </div>
            <div>
              <p className="text-xs font-black tracking-widest text-blue-600 ">
                {viewMode === "summary" ? "Estatísticas & Consolidação" : "Serviços Sociais & Apoio ao Aluno"}
              </p>
              <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-slate-900 mt-0.5">
                {viewMode === "summary" ? "Visão Geral de Bolsas" : "Repartição de Bolsa de Estudos"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {onEstatistica && (
              <button
                onClick={onEstatistica}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20 active:scale-95 transition-all text-sm"
              >
                <TrendingUp className="w-5 h-5" /> Estatísticas
              </button>
            )}
            {viewMode === "form" && (
              <button
                onClick={openAddForm}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 active:scale-95 transition-all text-sm"
              >
                <Plus className="w-5 h-5" /> Registar Bolseiro
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0 bg-slate-100 border-b border-slate-200">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400  tracking-wider block">
              Total Ativos
            </span>
            <span className="text-2xl font-extrabold text-slate-800">
              {activeBolsas.length}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">
              De um total de {bolsas.length} registados
            </span>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <User className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400  tracking-wider block">
              Orçamento Geral
            </span>
            <span className="text-xl font-black text-emerald-600 tracking-tight block">
              {totalMonthlyPayout.toLocaleString("pt-MZ")} MZN
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">
              Despesa total mensal estimada
            </span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400  tracking-wider block">
              Bolsas Integrais
            </span>
            <span className="text-2xl font-extrabold text-indigo-600">
              {integralCount}
            </span>
            <span className="text-[10px] text-indigo-400/80 block mt-1">
              Cobertura 100% de propinas + subsídio
            </span>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400  tracking-wider block">
              Parciais / Isenções
            </span>
            <span className="text-2xl font-extrabold text-amber-600">
              {parcialCount + isencaoCount}
            </span>
            <span className="text-[10px] text-amber-500/80 block mt-1">
              Parciais: {parcialCount} | Isenções: {isencaoCount}
            </span>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Interactive Main Area vs Summary View */}
      {viewMode === "summary" ? (
        <div className="flex-grow min-h-0 overflow-y-auto p-6 space-y-8 scrollbar bg-slate-50">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
              <h2 className="text-xl font-bold text-slate-800">
                Resumo Consolidado das Bolsas de Estudo
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Distribuição por Curso */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-xs flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-sm  tracking-wider">
                    Distribuição por Curso Académico
                  </h3>
                </div>
                <div className="space-y-4 flex-1">
                  {bolsasPorCurso.length === 0 ? (
                    <div className="text-xs text-slate-400 italic text-center py-8">Nenhum registo ativo por curso.</div>
                  ) : (
                    bolsasPorCurso.map((item, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                          <span className="truncate max-w-[280px]">{item.curso}</span>
                          <span className="text-slate-500 font-mono">
                            {item.ativos} {item.ativos === 1 ? "bolseiro" : "bolseiros"} ({item.valor.toLocaleString("pt-MZ")} MZN)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all"
                            style={{
                              width: `${activeBolsas.length > 0 ? (item.ativos / activeBolsas.length) * 100 : 0}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Distribuição por Financiador */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-xs flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-sm  tracking-wider">
                    Fontes de Financiamento
                  </h3>
                </div>
                <div className="space-y-4 flex-1">
                  {bolsasPorFinanciador.length === 0 ? (
                    <div className="text-xs text-slate-400 italic text-center py-8">Nenhum registo ativo por financiador.</div>
                  ) : (
                    bolsasPorFinanciador.map((item, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                          <span className="truncate max-w-[280px]">{item.financiador}</span>
                          <span className="text-slate-500 font-mono">
                            {item.ativos} {item.ativos === 1 ? "bolseiro" : "bolseiros"} ({item.valor.toLocaleString("pt-MZ")} MZN)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{
                              width: `${activeBolsas.length > 0 ? (item.ativos / activeBolsas.length) * 100 : 0}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Informação adicional de enquadramento */}
            <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 text-xs text-blue-800 flex gap-4">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-black  tracking-wider text-[10px] text-blue-900">Nota de Informação</p>
                <p className="leading-relaxed font-medium">
                  Este painel apresenta o resumo estatístico consolidado do orçamento e da distribuição de bolseiros no Songo. Para registar, editar ou atualizar as informações individuais de cada estudante e os seus respetivos financiadores, aceda à aba <strong>Bolsa de Estudos</strong> no menu lateral.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col p-4">
          {/* Search, Filter & Actions bar */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 mb-4 flex flex-col lg:flex-row gap-4 shrink-0">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquisar bolseiro por nome, curso ou código RA..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-medium text-slate-700 placeholder-slate-400 transition-colors"
              />
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              {/* Type Filter */}
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-600">
                <span className="text-slate-400 font-bold mr-1.5  text-[9px]">
                  Tipo:
                </span>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-transparent border-0 outline-none font-bold text-slate-700 cursor-pointer"
                >
                  <option value="Todos">Todos</option>
                  <option value="Integral">Integral</option>
                  <option value="Parcial">Parcial</option>
                  <option value="Isenção de Propina">Isenção de Propina</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-600">
                <span className="text-slate-400 font-bold mr-1.5  text-[9px]">
                  Estado:
                </span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-transparent border-0 outline-none font-bold text-slate-700 cursor-pointer"
                >
                  <option value="Todos">Todos</option>
                  <option value="Ativo">Ativo</option>
                  <option value="Suspenso">Suspenso</option>
                  <option value="Concluído">Concluído</option>
                </select>
              </div>

              {/* Financiador Filter */}
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-600">
                <span className="text-slate-400 font-bold mr-1.5  text-[9px]">
                  Financiador:
                </span>
                <select
                  value={filterFinanciador}
                  onChange={(e) => setFilterFinanciador(e.target.value)}
                  className="bg-transparent border-0 outline-none font-bold text-slate-700 cursor-pointer max-w-[140px]"
                >
                  <option value="Todos">Todos</option>
                  {FINANCIADORES.map((f) => (
                    <option key={f} value={f}>
                      {f.split(" - ")[0]}
                    </option>
                  ))}
                </select>
              </div>

              {(filterType !== "Todos" ||
                filterStatus !== "Todos" ||
                filterFinanciador !== "Todos" ||
                searchQuery !== "") && (
                <button
                  onClick={() => {
                    setFilterType("Todos");
                    setFilterStatus("Todos");
                    setFilterFinanciador("Todos");
                    setSearchQuery("");
                  }}
                  className="text-xs text-rose-600 hover:text-rose-500 font-extrabold hover:underline px-2"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>

          {/* Alert Container */}
          <AnimatePresence>
            {alertMsg && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={`mb-4 overflow-hidden rounded-2xl text-xs font-bold ${
                  alertMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                <div className="p-4 flex items-center gap-2">
                  {alertMsg.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  )}
                  <span>{alertMsg.text}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Table/List View */}
          <div className="flex-1 min-h-0 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col">
            {loading ? (
              <div className="flex-grow flex flex-col items-center justify-center p-10 gap-2">
                <div className="w-10 h-10 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                <span className="text-sm font-bold text-slate-400">
                  Carregando registos de bolseiros...
                </span>
              </div>
            ) : filteredBolsas.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center p-12 text-center">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-full mb-3 text-slate-400">
                  <GraduationCap className="w-10 h-10" />
                </div>
                <h3 className="font-bold text-slate-700 text-lg">
                  Nenhum bolseiro encontrado
                </h3>
                <p className="text-sm text-slate-400 mt-1 max-w-md">
                  Não foram encontrados registos que correspondam aos filtros
                  selecionados ou pesquisa de texto.
                </p>
                <button
                  onClick={openAddForm}
                  className="mt-4 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition-colors"
                >
                  Registar primeiro bolseiro
                </button>
              </div>
            ) : (
              <div className="flex-grow overflow-x-auto scrollbar">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black tracking-widest text-slate-400 ">
                      <th className="p-4">Estudante</th>
                      <th className="p-4">Código RA</th>
                      <th className="p-4">Curso</th>
                      <th className="p-4">Tipo de Bolsa</th>
                      <th className="p-4">Financiador</th>
                      <th className="p-4 text-right">Mensalidade</th>
                      <th className="p-4 text-center">Estado</th>
                      <th className="p-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                    {filteredBolsas.map((bolsa) => (
                      <tr
                        key={bolsa.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="p-4 font-bold text-slate-900 leading-normal min-w-[180px]">
                          <div>{bolsa.estudanteNome}</div>
                          {bolsa.observacoes && (
                            <div className="text-[10px] text-amber-600 mt-0.5 leading-tight italic flex items-center gap-1 font-medium">
                              <AlertCircle className="w-3 h-3 text-amber-500 fill-amber-100 shrink-0" />
                              <span className="line-clamp-1">
                                {bolsa.observacoes}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-500">
                          {bolsa.raCodigo}
                        </td>
                        <td className="p-4 font-medium text-slate-600 max-w-[180px] break-words">
                          {bolsa.curso}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full font-black text-[10px] tracking-wide inline-block ${
                              bolsa.tipoBolsa === "Integral"
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                                : bolsa.tipoBolsa === "Parcial"
                                  ? "bg-amber-50 text-amber-700 border border-amber-100"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            }`}
                          >
                            {bolsa.tipoBolsa}
                          </span>
                        </td>
                        <td
                          className="p-4 font-medium text-slate-500 max-w-[160px] truncate"
                          title={bolsa.financiador}
                        >
                          {bolsa.financiador.split(" - ")[0]}
                        </td>
                        <td className="p-4 text-right font-black text-slate-900 font-mono">
                          {bolsa.tipoBolsa === "Isenção de Propina" ? (
                            <span className="text-emerald-600 block text-[10px] tracking-wide mr-1 italic">
                              Isento de Propinas
                            </span>
                          ) : (
                            `${(bolsa.valorMensal || 0).toLocaleString("pt-MZ")} MZN`
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded font-black text-[10px] tracking-widest inline-block ${
                              bolsa.status === "Ativo"
                                ? "bg-emerald-100 text-emerald-800"
                                : bolsa.status === "Suspenso"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {bolsa.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openEditForm(bolsa)}
                              className="p-1.5 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                              title="Editar Dados"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() =>
                                  bolsa.id &&
                                  handleDelete(bolsa.id, bolsa.estudanteNome)
                                }
                                className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                                title="Eliminar Registo"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="p-4 bg-slate-50 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400 font-medium shrink-0">
              <span>
                A mostrar {filteredBolsas.length} de {bolsas.length} estudantes
                bolseiros ativos/históricos.
              </span>
              <span>Repartição de Bolsas • Songo Songo</span>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over / Popup Modal Form */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col font-sans max-h-[90vh]"
            >
              <div className="bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center text-slate-900 shrink-0">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-6 h-6 text-blue-600" />
                  <h2 className="text-lg font-black tracking-tight text-slate-900">
                    {editingBolsa
                      ? "Atualizar Dados de Bolsa"
                      : "Registar Novo Bolseiro"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar"
              >
                {/* Nome */}
                <div>
                  <label className="block text-[11px] font-black text-slate-400  tracking-widest mb-1">
                    Nome Completo do Estudante *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Ex: Amélia Celeste Mandlate"
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-xl outline-none text-xs text-slate-700 font-bold transition-colors"
                    />
                  </div>
                </div>

                {/* Código RA e Curso */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-400  tracking-widest mb-1">
                      Código de Estudante (RA) *
                    </label>
                    <input
                      type="text"
                      required
                      value={ra}
                      onChange={(e) => setRa(e.target.value)}
                      placeholder="Ex: Songo-2024-049"
                      className="w-full px-4 py-2 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-xl outline-none text-xs text-slate-700 font-bold transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-400  tracking-widest mb-1">
                      Curso Académico
                    </label>
                    <select
                      value={curso}
                      onChange={(e) => setCurso(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-xl outline-none text-xs text-slate-700 font-bold transition-colors cursor-pointer"
                    >
                      {CURSOS_Songo.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tipo de Bolsa e Financiador */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-400  tracking-widest mb-1">
                      Tipo de Bolsa
                    </label>
                    <select
                      value={tipo}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setTipo(val);
                        if (val === "Isenção de Propina") setValor(0);
                      }}
                      className="w-full px-4 py-2 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-xl outline-none text-xs text-slate-700 font-bold transition-colors cursor-pointer"
                    >
                      <option value="Integral">Integral</option>
                      <option value="Parcial">Parcial</option>
                      <option value="Isenção de Propina">
                        Isenção de Propina
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-400  tracking-widest mb-1">
                      Entidade Financiadora
                    </label>
                    <select
                      value={financiador}
                      onChange={(e) => setFinanciador(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-xl outline-none text-xs text-slate-700 font-bold transition-colors cursor-pointer"
                    >
                      {FINANCIADORES.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Valor Mensal e Data */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-400  tracking-widest mb-1">
                      Subsídio Mensal (MZN)
                    </label>
                    <div className="relative">
                      <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                      <input
                        type="number"
                        disabled={tipo === "Isenção de Propina"}
                        value={valor}
                        onChange={(e) => setValor(Number(e.target.value))}
                        placeholder="Ex: 8500"
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-xl outline-none text-xs text-slate-700 font-bold transition-colors disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-400  tracking-widest mb-1">
                      Data de Início da Bolsa
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                      <input
                        type="date"
                        value={dataIni}
                        onChange={(e) => setDataIni(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-xl outline-none text-xs text-slate-700 font-bold transition-colors cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[11px] font-black text-slate-400  tracking-widest mb-1">
                    Estado de Utilização
                  </label>
                  <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 gap-1">
                    {(["Ativo", "Suspenso", "Concluído"] as const).map((s) => (
                      <button
                        key={s + "-" + Math.random()}
                        type="button"
                        onClick={() => setStatus(s)}
                        className={`flex-1 text-center py-2 text-xs font-bold rounded-xl transition-all ${
                          status === s
                            ? "bg-white shadow-sm text-slate-800"
                            : "text-slate-400 hover:text-slate-500"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-[11px] font-black text-slate-400  tracking-widest mb-1">
                    Observações / Notas Internas
                  </label>
                  <textarea
                    rows={2}
                    value={obs}
                    onChange={(e) => setObs(e.target.value)}
                    placeholder="Indique quaisquer restrições académicas, motivos de suspensão ou notas do financiador..."
                    className="w-full px-4 py-2 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-xl outline-none text-xs text-slate-700 font-medium transition-colors resize-none"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-bold transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                  >
                    <Save className="w-4 h-4" /> Gravar Dados
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { printElementById } from "../../lib/printUtils";
import React, { useState, useMemo } from "react";
import {
  Banknote,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  Calculator,
  Users,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Printer,
  ChevronRight,
  ArrowLeft,
  Building2,
  Award,
  CreditCard,
  PieChart,
} from "lucide-react";
import * as XLSX from "xlsx";
import * as Types from "../../types";

interface RemuneracoesRHViewProps {
  title?: string;
  user?: any;
  colaboradores?: Types.Colaborador[];
  initialCategory?: string;
  onCategoryChange?: (category: string) => void;
  onBack?: () => void;
}

// Tabela Salarial de Referência (Angola - Função Pública / Ensino Superior)
const TABELA_SALARIAL_REF = [
  { categoria: "Professor Titular", tipo: "Docente", nivel: "E-1", baseKz: 980000, subsidioKz: 245000 },
  { categoria: "Professor Associado", tipo: "Docente", nivel: "E-2", baseKz: 850000, subsidioKz: 212500 },
  { categoria: "Professor Auxiliar", tipo: "Docente", nivel: "E-3", baseKz: 720000, subsidioKz: 180000 },
  { categoria: "Assistente", tipo: "Docente", nivel: "E-4", baseKz: 580000, subsidioKz: 145000 },
  { categoria: "Assistente Estagiário", tipo: "Docente", nivel: "E-5", baseKz: 460000, subsidioKz: 115000 },
  { categoria: "Técnico Superior Principal", tipo: "CTA", nivel: "T-1", baseKz: 520000, subsidioKz: 104000 },
  { categoria: "Técnico Superior 1ª Classe", tipo: "CTA", nivel: "T-2", baseKz: 430000, subsidioKz: 86000 },
  { categoria: "Técnico Superior 2ª Classe", tipo: "CTA", nivel: "T-3", baseKz: 350000, subsidioKz: 70000 },
  { categoria: "Técnico Médio 1ª Classe", tipo: "CTA", nivel: "M-1", baseKz: 260000, subsidioKz: 52000 },
  { categoria: "Técnico Médio 2ª Classe", tipo: "CTA", nivel: "M-2", baseKz: 210000, subsidioKz: 42000 },
  { categoria: "Auxiliar Administrativo / Operário", tipo: "CTA", nivel: "O-1", baseKz: 150000, subsidioKz: 30000 },
];

export const RemuneracoesRHView: React.FC<RemuneracoesRHViewProps> = ({
  title = "Repartição de Pessoal",
  user,
  colaboradores = [],
  initialCategory = "todos",
  onCategoryChange,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<"folha" | "tabela" | "simulador" | "resumo">("folha");
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("todos");
  const [vinculoFilter, setVinculoFilter] = useState<string>("todos");

  React.useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    if (onCategoryChange) {
      onCategoryChange(cat);
    }
  };

  // State for Salary Simulator
  const [simBase, setSimBase] = useState<number>(350000);
  const [simSubsidios, setSimSubsidios] = useState<number>(70000);
  const [simIsencao, setSimIsencao] = useState<boolean>(false);

  // Helper to estimate salary for a colaborador if not set explicitly
  const getColabSalaryInfo = (c: Types.Colaborador) => {
    const isDocente = c.tipo === "Docente";
    const ref = TABELA_SALARIAL_REF.find((r) =>
      c.categoria ? c.categoria.toLowerCase().includes(r.categoria.toLowerCase()) : false
    ) || (isDocente ? TABELA_SALARIAL_REF[3] : TABELA_SALARIAL_REF[7]);

    const base = (c as any).vencimentoBase || ref.baseKz;
    const subs = (c as any).subsidiosTotal || ref.subsidioKz;
    const inss = Math.round(base * 0.03); // 3% INSS

    // Simplificado IRT Angola (~10-15% dependendo da faixa)
    const matTributavel = Math.max(0, base + subs - inss - 35000);
    const irt = Math.round(matTributavel * 0.13);
    const liquido = Math.max(0, base + subs - inss - irt);

    return {
      base,
      subs,
      inss,
      irt,
      liquido,
      categoria: c.categoria || ref.categoria,
    };
  };

  // Filtered colaboradores
  const filteredColabs = useMemo(() => {
    return colaboradores.filter((c) => {
      const isDocente = c.tipo === "Docente";
      const isQuadro = Boolean(c.efetivo || c.tipoVinculo === "Quadro de Pessoal");

      if (selectedCategory === "rem_quadro_docente" && (!isQuadro || !isDocente)) return false;
      if (selectedCategory === "rem_quadro_cta" && (!isQuadro || isDocente)) return false;
      if (selectedCategory === "rem_nao_quadro_docente" && (isQuadro || !isDocente)) return false;
      if (selectedCategory === "rem_nao_quadro_cta" && (isQuadro || isDocente)) return false;

      const matchSearch =
        !searchTerm ||
        c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.nif && c.nif.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.mecanografico && c.mecanografico.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchTipo =
        tipoFilter === "todos" ||
        (tipoFilter === "docente" && isDocente) ||
        (tipoFilter === "cta" && !isDocente);

      const matchVinculo =
        vinculoFilter === "todos" ||
        (vinculoFilter === "efetivo" && isQuadro) ||
        (vinculoFilter === "contratado" && !isQuadro);

      return matchSearch && matchTipo && matchVinculo;
    });
  }, [colaboradores, selectedCategory, searchTerm, tipoFilter, vinculoFilter]);

  // Aggregate Stats
  const totals = useMemo(() => {
    let totalBase = 0;
    let totalSubs = 0;
    let totalInss = 0;
    let totalIrt = 0;
    let totalLiquido = 0;

    filteredColabs.forEach((c) => {
      const info = getColabSalaryInfo(c);
      totalBase += info.base;
      totalSubs += info.subs;
      totalInss += info.inss;
      totalIrt += info.irt;
      totalLiquido += info.liquido;
    });

    return {
      count: filteredColabs.length,
      totalBase,
      totalSubs,
      totalInss,
      totalIrt,
      totalLiquido,
      totalBruto: totalBase + totalSubs,
    };
  }, [filteredColabs]);

  // Format currency
  const formatKz = (val: number) => {
    return new Intl.NumberFormat("pt-AO", {
      style: "currency",
      currency: "AOA",
      maximumFractionDigits: 0,
    }).format(val).replace("AOA", "Kz");
  };

  // Simulator calculations
  const simCalc = useMemo(() => {
    const base = Number(simBase) || 0;
    const subs = Number(simSubsidios) || 0;
    const isencao = simIsencao ? Math.round(base * 0.15) : 0;
    const bruto = base + subs + isencao;
    const inss = Math.round(base * 0.03);
    const matTributavel = Math.max(0, bruto - inss - 35000);
    const irt = Math.round(matTributavel * 0.125);
    const liquido = Math.max(0, bruto - inss - irt);

    return { base, subs, isencao, bruto, inss, irt, liquido };
  }, [simBase, simSubsidios, simIsencao]);

  // Export to Excel
  const handleExportExcel = () => {
    const dataToExport = filteredColabs.map((c, idx) => {
      const info = getColabSalaryInfo(c);
      return {
        "Nº": idx + 1,
        "Nome Completo": c.nome,
        "Nº Agente/Mecanográfico": c.mecanografico || c.nif || "-",
        "Tipo": c.tipo || "CTA",
        "Categoria": info.categoria,
        "Vínculo": c.efetivo ? "Efetivo / Quadro" : "Contratado",
        "Vencimento Base (Kz)": info.base,
        "Subsídios (Kz)": info.subs,
        "INSS 3% (Kz)": info.inss,
        "IRT Estimado (Kz)": info.irt,
        "Salário Líquido (Kz)": info.liquido,
        "Banco / NIB": c.banco ? `${c.banco} - ${c.nib || ""}` : "IBAN não registado",
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Folha de Remunerações");
    XLSX.writeFile(wb, `Folha_Remuneracoes_RH_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
      <div className="w-full h-full flex flex-col bg-slate-50 overflow-y-auto p-4 md:p-8 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all"
                title="Voltar"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px]  tracking-widest bg-blue-500/20 text-blue-300 font-black px-3 py-1 rounded-full border border-blue-400/30">
                  {title}
                </span>
                <span className="text-slate-400 text-xs">• Recursos Humanos</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                <Banknote className="text-amber-400" size={32} />
                Gestão de Remunerações & Processamento Salarial
              </h1>
              <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl">
                Controlo de vencimentos base, subsídios, descontos legais (INSS/IRT) e simulação da folha de pagamento dos colaboradores.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all active:scale-95"
            >
              <FileSpreadsheet size={16} />
              Exportar Folha (Excel)
            </button>
            <button
              onClick={() => printElementById("print-area")}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl backdrop-blur-md transition-all active:scale-95 border border-white/20"
            >
              <Printer size={16} />
              Imprimir Resumo
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 mt-8 border-b border-white/10 pb-0 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("folha")}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-black tracking-wider  transition-all border-b-2 ${
              activeTab === "folha"
                ? "border-amber-400 text-amber-400 bg-white/5 rounded-t-xl"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <CreditCard size={16} />
            Folha de Pagamento ({colaboradores.length})
          </button>

          <button
            onClick={() => setActiveTab("tabela")}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-black tracking-wider  transition-all border-b-2 ${
              activeTab === "tabela"
                ? "border-amber-400 text-amber-400 bg-white/5 rounded-t-xl"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <Award size={16} />
            Tabela Salarial / Escalões
          </button>

          <button
            onClick={() => setActiveTab("simulador")}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-black tracking-wider  transition-all border-b-2 ${
              activeTab === "simulador"
                ? "border-amber-400 text-amber-400 bg-white/5 rounded-t-xl"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <Calculator size={16} />
            Simulador de Salário Líquido
          </button>

          <button
            onClick={() => setActiveTab("resumo")}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-black tracking-wider  transition-all border-b-2 ${
              activeTab === "resumo"
                ? "border-amber-400 text-amber-400 bg-white/5 rounded-t-xl"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <PieChart size={16} />
            Resumo de Custos
          </button>
        </div>
      </div>

      {/* Category Filter Cards */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm mb-6">
        <div className="text-xs font-black  tracking-wider text-slate-500 mb-3 flex items-center justify-between">
          <span>Categorias Salariais por Vínculo e Carreira</span>
          {selectedCategory !== "todos" && (
            <button
              onClick={() => handleCategorySelect("todos")}
              className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
            >
              Mostrar Todos os Salários ({colaboradores.length})
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Grupo 1: Salário de Pessoal Quadro */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="text-blue-600" size={18} />
              <h4 className="text-xs font-black text-slate-800  tracking-wider">
                Salário de pessoal quadro
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() => handleCategorySelect("rem_quadro_docente")}
                className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                  selectedCategory === "rem_quadro_docente"
                    ? "bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-400/30"
                    : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"
                }`}
              >
                <span className="text-xs font-bold">Salário de Corpo docente</span>
                <span
                  className={`text-[10px] mt-1 font-mono ${
                    selectedCategory === "rem_quadro_docente" ? "text-blue-100" : "text-slate-400"
                  }`}
                >
                  Quadro de Pessoal
                </span>
              </button>

              <button
                onClick={() => handleCategorySelect("rem_quadro_cta")}
                className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                  selectedCategory === "rem_quadro_cta"
                    ? "bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-400/30"
                    : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"
                }`}
              >
                <span className="text-xs font-bold">Salário de CTA</span>
                <span
                  className={`text-[10px] mt-1 font-mono ${
                    selectedCategory === "rem_quadro_cta" ? "text-blue-100" : "text-slate-400"
                  }`}
                >
                  Quadro de Pessoal
                </span>
              </button>
            </div>
          </div>

          {/* Grupo 2: Salário de Pessoal Não Quadro */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
            <div className="flex items-center gap-2 mb-3">
              <Users className="text-amber-600" size={18} />
              <h4 className="text-xs font-black text-slate-800  tracking-wider">
                Salário de pessoal não quadro
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() => handleCategorySelect("rem_nao_quadro_docente")}
                className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                  selectedCategory === "rem_nao_quadro_docente"
                    ? "bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-400/30"
                    : "bg-white text-slate-700 border-slate-200 hover:border-amber-300 hover:bg-amber-50/50"
                }`}
              >
                <span className="text-xs font-bold">Salário de Corpo docente</span>
                <span
                  className={`text-[10px] mt-1 font-mono ${
                    selectedCategory === "rem_nao_quadro_docente" ? "text-amber-100" : "text-slate-400"
                  }`}
                >
                  Fora do Quadro / Contratado
                </span>
              </button>

              <button
                onClick={() => handleCategorySelect("rem_nao_quadro_cta")}
                className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                  selectedCategory === "rem_nao_quadro_cta"
                    ? "bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-400/30"
                    : "bg-white text-slate-700 border-slate-200 hover:border-amber-300 hover:bg-amber-50/50"
                }`}
              >
                <span className="text-xs font-bold">Salário de CTA</span>
                <span
                  className={`text-[10px] mt-1 font-mono ${
                    selectedCategory === "rem_nao_quadro_cta" ? "text-amber-100" : "text-slate-400"
                  }`}
                >
                  Fora do Quadro / Contratado
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <span className="text-[10px] font-black  text-slate-400 tracking-wider">
              Colaboradores Selecionados
            </span>
            <div className="text-2xl font-black text-slate-800">{totals.count}</div>
            <span className="text-[11px] text-slate-500">De um total de {colaboradores.length}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign size={24} />
          </div>
          <div>
            <span className="text-[10px] font-black  text-slate-400 tracking-wider">
              Massa Salarial Bruta
            </span>
            <div className="text-lg font-black text-slate-800">{formatKz(totals.totalBruto)}</div>
            <span className="text-[11px] text-emerald-600 font-bold">Base + Subsídios</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <span className="text-[10px] font-black  text-slate-400 tracking-wider">
              Retenções Legais (INSS + IRT)
            </span>
            <div className="text-lg font-black text-slate-800">{formatKz(totals.totalInss + totals.totalIrt)}</div>
            <span className="text-[11px] text-slate-500">INSS: {formatKz(totals.totalInss)}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Banknote size={24} />
          </div>
          <div>
            <span className="text-[10px] font-black  text-slate-400 tracking-wider">
              Total Salários Líquidos
            </span>
            <div className="text-lg font-black text-slate-800">{formatKz(totals.totalLiquido)}</div>
            <span className="text-[11px] text-amber-600 font-bold">A Pagar aos Colaboradores</span>
          </div>
        </div>
      </div>

      {/* TAB CONTENT 1: Folha de Pagamento */}
      {activeTab === "folha" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          {/* Filters Bar */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Pesquisar por nome, NIF, agente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-200 rounded-xl">
                <Filter size={14} className="text-slate-400" />
                <span className="text-[11px] font-bold text-slate-500">Tipo:</span>
                <select
                  value={tipoFilter}
                  onChange={(e) => setTipoFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value="todos">Todos</option>
                  <option value="docente">Docentes</option>
                  <option value="cta">CTA (Administrativo)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-200 rounded-xl">
                <span className="text-[11px] font-bold text-slate-500">Vínculo:</span>
                <select
                  value={vinculoFilter}
                  onChange={(e) => setVinculoFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value="todos">Todos</option>
                  <option value="efetivo">Efetivo (Quadro)</option>
                  <option value="contratado">Contratado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-[10px] font-black  text-slate-500 tracking-wider">
                  <th className="py-3.5 px-4">Colaborador</th>
                  <th className="py-3.5 px-4">Tipo & Categoria</th>
                  <th className="py-3.5 px-4 text-right">Vencimento Base</th>
                  <th className="py-3.5 px-4 text-right">Subsídios</th>
                  <th className="py-3.5 px-4 text-right">INSS (3%)</th>
                  <th className="py-3.5 px-4 text-right">IRT Est.</th>
                  <th className="py-3.5 px-4 text-right">Salário Líquido</th>
                  <th className="py-3.5 px-4 text-center">Estado RH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredColabs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Nenhum colaborador encontrado com os filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredColabs.map((colab) => {
                    const salary = getColabSalaryInfo(colab);
                    return (
                      <tr key={colab.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800">{colab.nome}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            NIF: {colab.nif || "-"} • Agente: {colab.mecanografico || "-"}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mb-1 ${
                              colab.tipo === "Docente"
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {colab.tipo || "CTA"}
                          </span>
                          <div className="text-[11px] text-slate-600 truncate max-w-[200px]">
                            {salary.categoria}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-700">
                          {formatKz(salary.base)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-emerald-600 font-semibold">
                          +{formatKz(salary.subs)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-rose-500 font-medium">
                          -{formatKz(salary.inss)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-rose-500 font-medium">
                          -{formatKz(salary.irt)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-slate-900 bg-slate-50/50">
                          {formatKz(salary.liquido)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
                            <CheckCircle2 size={12} /> Validado
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: Tabela Salarial de Referência */}
      {activeTab === "tabela" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Award className="text-blue-600" size={22} />
              Tabela Salarial de Referência da Função Pública (Ensino Superior & CTA)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Valores estipulados de vencimentos base e subsídios por carreira e escalão para os serviços do Estado.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] font-black  tracking-wider">
                  <th className="py-3.5 px-4">Carreira / Categoria</th>
                  <th className="py-3.5 px-4">Grupo</th>
                  <th className="py-3.5 px-4">Escalão / Nível</th>
                  <th className="py-3.5 px-4 text-right">Vencimento Base (Kz)</th>
                  <th className="py-3.5 px-4 text-right">Subsídio Est. (Kz)</th>
                  <th className="py-3.5 px-4 text-right">Total Estimado Bruto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {TABELA_SALARIAL_REF.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-800">{item.categoria}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          item.tipo === "Docente" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {item.tipo}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 font-bold">{item.nivel}</td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-800">{formatKz(item.baseKz)}</td>
                    <td className="py-3.5 px-4 text-right text-emerald-600 font-bold">{formatKz(item.subsidioKz)}</td>
                    <td className="py-3.5 px-4 text-right font-black text-blue-900">
                      {formatKz(item.baseKz + item.subsidioKz)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: Simulador de Salário */}
      {activeTab === "simulador" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 md:p-8 space-y-8">
          <div>
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Calculator className="text-amber-500" size={24} />
              Simulador de Vencimento e Retenção na Fonte (IRT/INSS)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Calcule instantaneamente os impostos e o valor líquido a receber segundo a legislação tributária angolana.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Form */}
            <div className="bg-slate-50/80 p-6 rounded-2xl border border-slate-200 space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-700  tracking-wider mb-2">
                  Vencimento Base (Kz)
                </label>
                <input
                  type="number"
                  value={simBase}
                  onChange={(e) => setSimBase(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700  tracking-wider mb-2">
                  Subsídios Diversos (Alimentação, Transporte) (Kz)
                </label>
                <input
                  type="number"
                  value={simSubsidios}
                  onChange={(e) => setSimSubsidios(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isencao"
                  checked={simIsencao}
                  onChange={(e) => setSimIsencao(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
                />
                <label htmlFor="isencao" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Incluir Subsídio de Isenção Horária / Chefia (+15% do Base)
                </label>
              </div>
            </div>

            {/* Results Output */}
            <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white p-6 md:p-8 rounded-2xl shadow-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="text-[10px]  font-black tracking-widest text-blue-300">
                  Resumo do Cálculo Simulado
                </div>

                <div className="flex justify-between items-center text-xs pb-2 border-b border-white/10">
                  <span className="text-slate-300">Vencimento Base:</span>
                  <span className="font-bold">{formatKz(simCalc.base)}</span>
                </div>

                <div className="flex justify-between items-center text-xs pb-2 border-b border-white/10">
                  <span className="text-slate-300">Total Subsídios:</span>
                  <span className="font-bold text-emerald-400">+{formatKz(simCalc.subs + simCalc.isencao)}</span>
                </div>

                <div className="flex justify-between items-center text-xs pb-2 border-b border-white/10">
                  <span className="text-slate-300">Salário Bruto Total:</span>
                  <span className="font-black text-white">{formatKz(simCalc.bruto)}</span>
                </div>

                <div className="flex justify-between items-center text-xs pb-2 border-b border-white/10">
                  <span className="text-slate-300">Desconto Segurança Social INSS (3%):</span>
                  <span className="font-bold text-rose-400">-{formatKz(simCalc.inss)}</span>
                </div>

                <div className="flex justify-between items-center text-xs pb-2 border-b border-white/10">
                  <span className="text-slate-300">Imposto de Trabalho (IRT Est.):</span>
                  <span className="font-bold text-rose-400">-{formatKz(simCalc.irt)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/20">
                <div className="text-xs  font-black text-amber-400 tracking-wider">
                  Salário Líquido Estimado a Receber
                </div>
                <div className="text-3xl font-black text-white mt-1">{formatKz(simCalc.liquido)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: Resumo de Custos */}
      {activeTab === "resumo" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-6">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <PieChart className="text-indigo-600" size={22} />
            Distribuição de Custos Salariais por Categoria
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black  text-purple-900 tracking-wider">
                  Corpo Docente
                </span>
                <span className="text-xs font-bold bg-purple-200 text-purple-800 px-2.5 py-0.5 rounded-full">
                  {colaboradores.filter((c) => c.tipo === "Docente").length} Colaboradores
                </span>
              </div>
              <p className="text-xs text-slate-600">
                A massa salarial para docentes abrange vencimentos base, subsídios de regência de aula, exames e qualificação académica.
              </p>
            </div>

            <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black  text-blue-900 tracking-wider">
                  Corpo Técnico Administrativo (CTA)
                </span>
                <span className="text-xs font-bold bg-blue-200 text-blue-800 px-2.5 py-0.5 rounded-full">
                  {colaboradores.filter((c) => c.tipo !== "Docente").length} Colaboradores
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Compreende os técnicos superiores, especialistas, pessoal administrativo e de apoio às operações institucionais.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemuneracoesRHView;

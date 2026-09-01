import React, { useState, useMemo, useRef, useEffect } from "react";
import { firestoreService } from "../../lib/firestoreService";
import { printElementById } from "../../lib/printUtils";
import { motion } from "motion/react";
import {
  FileSpreadsheet,
  Printer,
  TrendingUp,
  Calendar as CalendarIcon,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  Upload,
  Image as ImageIcon,
  Package,
  ArrowRight,
  TrendingDown,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";

interface BalancoMensalViewProps {
  movements: any[];
  user: any;
  setor?: "Economato" | "Patrimonio";
  onBack?: () => void;
}

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

// Years from 2025 up to 2035 (ANOS DE 2025 ATÉ ++)
const YEARS = Array.from({ length: 11 }, (_, i) => 2025 + i);

export default function BalancoMensalView({
  movements = [],
  user,
  setor,
  onBack,
}: BalancoMensalViewProps) {
  // Local state for uploaded logo
  const [logoImage, setLogoImage] = useState<string | null>(() => {
    return (
      localStorage.getItem("isps_balanco_logo") ||
      "https://lh3.googleusercontent.com/d/11zvvpOpZARM1yk_irEDpjJ-qBKlTlhad"
    );
  });

  useEffect(() => {
    const unsub = firestoreService.subscribeToDocument<any>("balanco_config", "main_balanco", (docData) => {
      if (docData && docData.logo) {
        setLogoImage(docData.logo);
        localStorage.setItem("isps_balanco_logo", docData.logo);
      }
    });
    return () => unsub();
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default to current date (e.g. May 2026 as per local context, or May 2025)
  const [selectedMonth, setSelectedMonth] = useState<number>(4); // Maio
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"balanco_geral" | "diario">(
    "balanco_geral",
  );

  // Handle Logo Upload and trigger base64 conversion & save
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setLogoImage(base64String);
        localStorage.setItem("isps_balanco_logo", base64String);
        try {
          await firestoreService.balancoConfig.set("main_balanco", {
            logo: base64String,
            updatedAt: new Date().toISOString(),
          });
        } catch (err) {
          console.error("Erro ao salvar logo no Firestore:", err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearLogo = async () => {
    const defaultLogo = "https://lh3.googleusercontent.com/d/11zvvpOpZARM1yk_irEDpjJ-qBKlTlhad";
    setLogoImage(defaultLogo);
    localStorage.removeItem("isps_balanco_logo");
    try {
      await firestoreService.balancoConfig.set("main_balanco", {
        logo: defaultLogo,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Erro ao limpar logo no Firestore:", err);
    }
  };

  // Helper method to parse movement's month and year
  const getMonthYear = (m: any) => {
    if (m.timestamp) {
      try {
        const d = new Date(m.timestamp);
        if (!isNaN(d.getTime())) {
          return { month: d.getMonth(), year: d.getFullYear() };
        }
      } catch (e) {}
    }
    if (m.data) {
      try {
        const d = new Date(m.data);
        if (!isNaN(d.getTime())) {
          return { month: d.getMonth(), year: d.getFullYear() };
        }
      } catch (e) {}
    }
    if (m.mes) {
      const idx = MONTHS.findIndex(
        (name) =>
          name.toLowerCase() === m.mes.toLowerCase() ||
          name.substring(0, 3).toLowerCase() === m.mes.toLowerCase(),
      );
      if (idx !== -1) {
        return { month: idx, year: 2026 }; // Fallback
      }
    }
    return { month: -1, year: -1 };
  };

  // Map and sanitize all incoming movements
  const processedMovements = useMemo(() => {
    return movements.map((m) => {
      const { month, year } = getMonthYear(m);
      const isEntrada = m.tipo === "Entrada" || m.tipo === "ENTRADA_PATRIMONIO";
      const isSaida = m.tipo === "SAIDA_CONSUMO";
      return {
        ...m,
        parsedMonth: month,
        parsedYear: year,
        isEntrada,
        isSaida,
        displayName: m.descricao || m.descricaoMaterial || "Artigo de Consumo",
        displayQtd: Number(m.quantidade || m.quantidadeRequisitada || 0),
        displayDate: m.timestamp
          ? new Date(m.timestamp).toLocaleDateString("pt-MZ")
          : m.data || "S/D",
        displayResp: m.operador || m.recebeu || "Responsável",
        displayDirecao: m.direcao || "N/A",
        displayDepartamento: m.departamento || "N/A",
        displayReparticao: m.reparticao || "N/A",
      };
    });
  }, [movements]);

  // Compute Balancete/Product Summary based on N-1 values & currents
  // For each distinct Designation keyword:
  // - Total Transited (N-1 to N) = aggregate (Entries - Exits) BEFORE selectedMonth/selectedYear
  // - Total Entry = sum of entries DURING selectMonth/selectYear
  // - Total Exit = sum of exits DURING selectMonth/selectYear
  // - Total Existing = Transited + Entry - Exit
  const balanceteData = useMemo(() => {
    const summaryMap: {
      [key: string]: {
        transited: number;
        currentEntry: number;
        currentExit: number;
      };
    } = {};

    processedMovements.forEach((m) => {
      const name = m.displayName;
      if (!name) return;

      if (!summaryMap[name]) {
        summaryMap[name] = { transited: 0, currentEntry: 0, currentExit: 0 };
      }

      const isBeforePeriod =
        m.parsedYear < selectedYear ||
        (m.parsedYear === selectedYear && m.parsedMonth < selectedMonth);
      const isDuringPeriod =
        m.parsedYear === selectedYear && m.parsedMonth === selectedMonth;

      if (isBeforePeriod) {
        if (m.isEntrada) {
          summaryMap[name].transited += m.displayQtd;
        } else if (m.isSaida) {
          summaryMap[name].transited -= m.displayQtd;
        }
      } else if (isDuringPeriod) {
        if (m.isEntrada) {
          summaryMap[name].currentEntry += m.displayQtd;
        } else if (m.isSaida) {
          summaryMap[name].currentExit += m.displayQtd;
        }
      }
    });

    return Object.entries(summaryMap)
      .map(([designacao, stats]) => {
        // Transit cannot fall below zero in clean books logic
        const safeTransited = Math.max(0, stats.transited);
        const existing = safeTransited + stats.currentEntry - stats.currentExit;
        return {
          designacao,
          transited: safeTransited,
          entry: stats.currentEntry,
          exit: stats.currentExit,
          existing: Math.max(0, existing),
        };
      })
      .filter((item) => {
        // Only keep items having transited, entries, exits, or existing > 0
        if (searchQuery.trim() !== "") {
          return item.designacao
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        }
        return (
          item.transited > 0 ||
          item.entry > 0 ||
          item.exit > 0 ||
          item.existing > 0
        );
      });
  }, [processedMovements, selectedMonth, selectedYear, searchQuery]);

  // General monthly entries & exits counts
  const totalStats = useMemo(() => {
    let transitedSum = 0;
    let entrySum = 0;
    let exitSum = 0;
    let existingSum = 0;

    balanceteData.forEach((item) => {
      transitedSum += item.transited;
      entrySum += item.entry;
      exitSum += item.exit;
      existingSum += item.existing;
    });

    return {
      transited: transitedSum,
      entry: entrySum,
      exit: exitSum,
      existing: existingSum,
    };
  }, [balanceteData]);

  // Build sequential comparison data for past months of the selected year
  const chartData = useMemo(() => {
    return MONTHS.map((mName, index) => {
      let ent = 0;
      let sai = 0;
      processedMovements.forEach((m) => {
        if (m.parsedYear === selectedYear && m.parsedMonth === index) {
          if (m.isEntrada) ent += m.displayQtd;
          if (m.isSaida) sai += m.displayQtd;
        }
      });
      return {
        name: mName.substring(0, 3),
        Entradas: ent,
        Saídas: sai,
        Saldo: ent - sai,
      };
    });
  }, [processedMovements, selectedYear]);

  // CSV Report Generator
  const handleExportCSV = () => {
    const headers = [
      "Designacao",
      "Qtd Transitado (N-1 para N)",
      "Qtd Entrada",
      "Qtd Saida",
      "Qtd Existente",
    ];
    const rows = balanceteData.map((item) => [
      item.designacao,
      item.transited,
      item.entry,
      item.exit,
      item.existing,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Balancete_Consolidado_${MONTHS[selectedMonth]}_${selectedYear}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    printElementById(
      "balanco-mensal-area",
      `Balancete Mensal ${MONTHS[selectedMonth]} ${selectedYear} - Songo`,
      "landscape",
      "A4",
    );
  };

  return (
    <div className="space-y-6">
      {/* SECTION 1: Standard Search and Action Controller */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 py-1.5 px-3 rounded-xl">
            <CalendarIcon size={16} className="text-[#121c60]" />
            <span className="text-xs font-bold text-slate-705">
              Exercício e Período:
            </span>
          </div>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="p-2 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-[#121c60] bg-white text-slate-800"
          >
            {MONTHS.map((name, idx) => (
              <option key={idx} value={idx}>
                {name}
              </option>
            ))}
          </select>

          {/* Years from 2025 up to ++ */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="p-2 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-[#121c60] bg-white text-slate-800"
          >
            {YEARS.map((yr) => (
              <option key={yr} value={yr}>
                Ano: {yr}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
            <input
              type="text"
              placeholder="Pesquisar designação..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-[#121c60] text-slate-700"
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="bg-emerald-50 text-emerald-700 p-2.5 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2 text-xs font-bold"
            title="Exportar CSV"
          >
            <FileSpreadsheet size={16} />
            <span className="hidden sm:inline">Exportar Excel</span>
          </button>

          <div className="flex items-center gap-2">
            {onBack && (
              <button
                onClick={onBack}
                className="bg-slate-100 text-[#121c60] border border-slate-200 p-2.5 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 text-xs font-bold"
                title="Voltar"
              >
                <span className="hidden sm:inline">Voltar</span>
              </button>
            )}
            <button
              onClick={handlePrint}
              className="bg-[#121c60] text-white p-2.5 rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2 text-xs font-bold"
              title="Imprimir Balanço"
            >
              <Printer size={16} />
              <span className="hidden sm:inline">Imprimir Ficha</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: Official Corporate Header Sheet (Visible always, styled for beautiful printable report) */}
      <div
        id="balanco-mensal-area"
        data-print-type="balanco"
        className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden font-serif pt-12"
      >
        {/* Decorative Top Bar */}
        <div className="h-4 w-full flex absolute top-0 left-0">
          <div className="w-2/3 bg-blue-900"></div>
          <div className="w-1/3 bg-red-600"></div>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-dashed border-slate-200 pb-6 mb-6">
          {/* Logo Area (Upload zone & preview) */}
          <div className="flex flex-col items-center gap-2 print:gap-4 select-none">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="group relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-dashed border-[#121c60]/30 hover:border-[#121c60] bg-slate-50 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all shadow-sm"
              title="Clique para carregar o logótipo oficial"
            >
              {logoImage ? (
                <>
                  <img
                    src={logoImage}
                    alt="Logo"
                    className="w-full h-full object-contain p-2"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity text-[10px] font-bold p-1 text-center print:hidden">
                    <Upload size={14} className="mb-1" />
                    Alterar Logo
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-[#121c60]/50 group-hover:text-[#121c60] p-3 text-center transition-colors">
                  <ImageIcon size={28} className="mb-1.5" />
                  <span className="text-[9px] font-bold leading-normal">
                    Escolher Logótipo
                  </span>
                  <span className="text-[8px] text-slate-400 mt-0.5 print:hidden">
                    JPG/PNG/SVG
                  </span>
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleLogoUpload}
              accept="image/*"
              className="hidden"
            />

            {logoImage && (
              <button
                onClick={handleClearLogo}
                className="text-[9px] font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-md transition-colors print:hidden"
              >
                Remover
              </button>
            )}
          </div>

          {/* Official Titles Information Area */}
          <div className="flex-1 text-center md:text-left space-y-1">
            <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight ">
              INSTITUTO SUPERIOR POLITÉCNICO DE SONGO
            </h1>
            <h2 className="text-xs sm:text-sm font-bold text-slate-700 leading-normal">
              Direção de Coordenação de Serviços de Administração, Finanças e de
              Apoio (DICOSAFA)
            </h2>
            <h3 className="text-xs font-semibold text-slate-500 block">
              Departamento de Património
            </h3>
            <div className="w-12 h-1 bg-[#121c60] rounded my-2 mx-auto md:mx-0"></div>
            <h4 className="text-sm sm:text-base font-black text-[#121c60]  tracking-wide">
              BALANÇO DE ENTRADA E SAÍDA NA ARRECADAÇÃO / ECONOMATO
            </h4>
          </div>

          {/* Year and period details panel */}
          <div className="bg-[#121c60]/5 border border-[#121c60]/10 p-4 rounded-xl text-center md:text-right w-full md:w-auto self-stretch flex flex-col justify-center min-w-[200px]">
            <span className="text-[9px] font-bold text-slate-400  tracking-widest block">
              Exercício Económico de
            </span>
            <span className="text-2xl font-black text-[#121c60] block">
              {selectedYear}
            </span>
            <div className="h-[1px] bg-[#121c60]/10 my-1.5"></div>
            <span className="text-[10px] font-extrabold text-[#121c60]  block">
              Mês: {MONTHS[selectedMonth]}
            </span>
          </div>
        </div>

        {/* Dynamic description info */}
        <p className="text-[11px] text-slate-500 leading-relaxed max-w-4xl text-center md:text-left print:hidden mb-1">
          Este balancete mensal consolida todas as movimentações de entradas e
          saídas de bens de consumo do Economato. Ele calcula o saldo de
          transição do período anterior, as entradas e saídas verificadas no mês
          de referência e calcula a quantidade real existente em armazém.
        </p>
      </div>

      {/* SECTION 3: Visual Progress Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[9px] font-bold text-slate-400  tracking-wider block">
              Transitados (N-1 para N)
            </span>
            <div className="text-xl font-black text-[#121c60]">
              {totalStats.transited} ud
            </div>
            <p className="text-[9px] text-slate-400">
              Saldo herança de meses passados
            </p>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl text-slate-500">
            <ArrowRight size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[9px] font-bold text-slate-400  tracking-wider block">
              Entradas de Produtos
            </span>
            <div className="text-xl font-black text-emerald-600">
              +{totalStats.entry} ud
            </div>
            <p className="text-[9px] text-slate-400">
              Registos efetuados em {MONTHS[selectedMonth]}
            </p>
          </div>
          <div className="p-3.5 bg-emerald-50 rounded-xl text-emerald-600">
            <ArrowDownRight size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[9px] font-bold text-slate-400  tracking-wider block">
              Saídas & Consumo
            </span>
            <div className="text-xl font-black text-amber-500">
              -{totalStats.exit} ud
            </div>
            <p className="text-[9px] text-slate-400">
              Requisições atendidas no mês
            </p>
          </div>
          <div className="p-3.5 bg-amber-50 rounded-xl text-amber-500">
            <ArrowUpRight size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[9px] font-bold text-slate-400  tracking-wider block">
              Estoque Existente
            </span>
            <div className="text-xl font-black text-blue-600">
              {totalStats.existing} ud
            </div>
            <p className="text-[9px] text-slate-400">
              Saldo consolidado disponível
            </p>
          </div>
          <div className="p-3.5 bg-blue-50 rounded-xl text-blue-600">
            <Scale size={20} />
          </div>
        </div>
      </div>

      {/* SECTION 4: Dual Subtabs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden font-serif">
        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 p-4 bg-slate-50/50 justify-between items-center print:hidden">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("balanco_geral")}
              className={`text-xs px-4 py-2 font-bold rounded-xl transition-all ${
                activeTab === "balanco_geral"
                  ? "bg-[#121c60] text-white shadow-md"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              Ficha do Balanço Mensal Consolidado
            </button>
            <button
              onClick={() => setActiveTab("diario")}
              className={`text-xs px-4 py-2 font-bold rounded-xl transition-all ${
                activeTab === "diario"
                  ? "bg-[#121c60] text-white shadow-md"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              Histórico Diário de Lançamentos
            </button>
          </div>

          <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">
            Status: Atualização em Tempo Real
          </span>
        </div>

        {/* RENDER TABLE VIEW */}
        {activeTab === "balanco_geral" ? (
          <div>
            <div className="p-4 bg-slate-[#121c60]/5 border-b border-slate-100 print:hidden">
              <span className="text-[10px] font-black text-[#121c60]  block">
                Resumo do Movimento Consolidado
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[#121c60] text-[10px] font-black  tracking-wider">
                    <th className="py-4 px-6">Designação do Material</th>
                    <th className="py-4 px-6 text-center bg-slate-100/30">
                      Total de Qtd Transitado de (N-1) para (N)
                    </th>
                    <th className="py-4 px-6 text-center text-emerald-700 bg-emerald-50/20">
                      Total de Qtd de Entrada
                    </th>
                    <th className="py-4 px-6 text-center text-amber-700 bg-amber-50/20">
                      Total de Qtd de Saída
                    </th>
                    <th className="py-4 px-6 text-center text-blue-800 bg-blue-50/20 font-extrabold">
                      Total de Qtd Existente
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                  {balanceteData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-16 text-center text-slate-400 font-medium"
                      >
                        Nenhum saldo ou movimentação de artigos registados em{" "}
                        {MONTHS[selectedMonth]} de {selectedYear}.
                      </td>
                    </tr>
                  ) : (
                    balanceteData.map((item, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-4 px-6 font-bold text-slate-800">
                          {item.designacao}
                        </td>
                        <td className="py-4 px-6 text-center font-bold text-slate-600 bg-slate-100/10">
                          {item.transited} ud
                        </td>
                        <td className="py-4 px-6 text-center font-bold text-emerald-600 bg-emerald-50/5">
                          {item.entry > 0 ? `+${item.entry}` : "0"} ud
                        </td>
                        <td className="py-4 px-6 text-center font-bold text-amber-600 bg-amber-50/5">
                          {item.exit > 0 ? `-${item.exit}` : "0"} ud
                        </td>
                        <td className="py-4 px-6 text-center font-black text-blue-700 bg-blue-50/5">
                          {item.existing} ud
                        </td>
                      </tr>
                    ))
                  )}
                  {balanceteData.length > 0 && (
                    <tr className="bg-slate-50 font-black text-slate-900 border-t-2 border-[#121c60]/20">
                      <td className="py-4 px-6  text-[10px] tracking-wider text-[#121c60]">
                        TOTAL CONSOLIDADO
                      </td>
                      <td className="py-4 px-6 text-center text-slate-700">
                        {totalStats.transited} ud
                      </td>
                      <td className="py-4 px-6 text-center text-emerald-700">
                        +{totalStats.entry} ud
                      </td>
                      <td className="py-4 px-6 text-center text-amber-600">
                        -{totalStats.exit} ud
                      </td>
                      <td className="py-4 px-6 text-center text-blue-700">
                        {totalStats.existing} ud
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-black  tracking-wider">
                    <th className="py-4 px-6">Data</th>
                    <th className="py-4 px-6">Fluxo</th>
                    <th className="py-4 px-6">Artigo</th>
                    <th className="py-4 px-6 text-center">Qtd</th>
                    <th className="py-4 px-6">Direção</th>
                    <th className="py-4 px-6">Departamento</th>
                    <th className="py-4 px-6">Repartição</th>
                    <th className="py-4 px-6">Colaborador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                  {processedMovements.filter(
                    (m) =>
                      m.parsedMonth === selectedMonth &&
                      m.parsedYear === selectedYear,
                  ).length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-16 text-center text-slate-400 font-medium"
                      >
                        Não existem lançamentos individuais registados de
                        entrada ou saída para o período fiscal escolhido.
                      </td>
                    </tr>
                  ) : (
                    processedMovements
                      .filter(
                        (m) =>
                          m.parsedMonth === selectedMonth &&
                          m.parsedYear === selectedYear,
                      )
                      .map((m, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="py-4 px-6 font-semibold whitespace-nowrap">
                            {m.displayDate}
                          </td>
                          <td className="py-4 px-6">
                            {m.isEntrada ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                <ArrowDownRight size={10} /> Entrada
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                                <ArrowUpRight size={10} /> Saída
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 font-bold text-slate-800">
                            {m.displayName}
                          </td>
                          <td className="py-4 px-6 text-center font-black text-slate-900">
                            {m.displayQtd} ud
                          </td>
                          <td className="py-4 px-6 font-semibold text-slate-600">
                            {m.displayDirecao}
                          </td>
                          <td className="py-4 px-6 font-semibold text-slate-600">
                            {m.displayDepartamento}
                          </td>
                          <td className="py-4 px-6 font-semibold text-slate-600">
                            {m.displayReparticao}
                          </td>
                          <td className="py-4 px-6 font-medium text-slate-600">
                            {m.displayResp}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 5: Beautiful Recharts evolution area inside print:hidden */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm print:hidden">
        <h4 className="text-xs font-black text-[#121c60] tracking-wide mb-4 flex items-center gap-2 ">
          <TrendingUp size={16} /> Evolução Histórica de Lançamentos (
          {selectedYear})
        </h4>
        <div className="h-60 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E2E8F0"
              />
              <XAxis
                dataKey="name"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: "11px", fontWeight: "bold" }} />
              <Bar dataKey="Entradas" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Saídas" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              <Line
                type="monotone"
                dataKey="Saldo"
                stroke="#121c60"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECTION 6: Official Formal Signatures Placeholders for Print output */}
      <div className="hidden print:grid grid-cols-2 gap-12 mt-16 pt-12 border-t text-center text-xs">
        <div className="space-y-12">
          <p className="font-bold">O Responsável pelo Economato</p>
          <div className="w-52 border-b border-black mx-auto"></div>
          <p className="text-slate-400">Data: ____/____/{selectedYear}</p>
        </div>
        <div className="space-y-12">
          <p className="font-bold">O Chefe do Departamento de Património</p>
          <div className="w-52 border-b border-black mx-auto"></div>
          <p className="text-slate-400">Data: ____/____/{selectedYear}</p>
        </div>
      </div>
    </div>
  );
}

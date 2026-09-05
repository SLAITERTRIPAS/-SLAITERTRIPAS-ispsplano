import React, { useState, useMemo } from "react";
import {
  FileText,
  X,
  Search,
  Calendar,
  Layers,
  DollarSign,
  Building2,
  Filter,
  Printer,
  Download,
  ChevronDown,
  ChevronUp,
  Tag,
  Clock,
  User,
  MapPin,
  Truck,
  ShoppingCart,
  Briefcase,
  Share2,
  Check,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  ListOrdered,
  Maximize2,
  Minimize2,
} from "lucide-react";
import * as XLSX from "xlsx";
import { openPrintDocumentWindow } from "../lib/printUtils";

export const SHARABLE_AREAS = [
  "Gabinete do Diretor-Geral",
  "Unidade Gestora e Executora de Aquisições (UGEA)",
  "Departamento de Recursos Humanos",
  "Departamento de Finanças",
  "Departamento de Património",
  "Departamento TIC",
  "Secretaria Geral",
  "DICOSAFA",
  "DICOSSER",
  "Divisão de Engenharia",
  "Departamento de Registo Académico",
  "Departamento de Assuntos Estudantis",
];

interface ConsultarPlanoActividadesModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: any[];
  title?: string;
  subtitle?: string;
  selectedSectorName?: string;
  onShowAlert?: (msg: string, type?: "success" | "info" | "warning" | "error") => void;
  onToggleShare?: (activity: any, area: string) => Promise<void> | void;
  isSavingShare?: string | null;
  sharingActivityId?: string | null;
  onSetSharingActivityId?: (id: string | null) => void;
}

type GroupMode = "trimestre" | "rubrica" | "setor" | "lista";

export default function ConsultarPlanoActividadesModal({
  isOpen,
  onClose,
  activities = [],
  title = "Consulta do Plano de Actividades",
  subtitle = "Visualização e organização de todas as actividades planificadas",
  selectedSectorName,
  onShowAlert,
  onToggleShare,
  isSavingShare,
  sharingActivityId,
  onSetSharingActivityId,
}: ConsultarPlanoActividadesModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTrimestre, setSelectedTrimestre] = useState("todos");
  const [selectedRubricaFilter, setSelectedRubricaFilter] = useState("todos");
  const [selectedFonteFilter, setSelectedFonteFilter] = useState("todos");
  const [groupMode, setGroupMode] = useState<GroupMode>("trimestre");
  const [expandedActivityIds, setExpandedActivityIds] = useState<Record<string, boolean>>({});
  const [allExpanded, setAllExpanded] = useState(false);
  const [localSharingId, setLocalSharingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentSharingId = sharingActivityId !== undefined ? sharingActivityId : localSharingId;
  const setSharingId = onSetSharingActivityId || setLocalSharingId;

  // Normalização de actividade
  const normalizedActivities = useMemo(() => {
    return (activities || []).map((act, index) => {
      const code =
        act.codigoActividade ||
        act.referencia ||
        act.codigo ||
        act.numeroActividade ||
        act.no ||
        `ACT-${String(index + 1).padStart(3, "0")}`;

      const name =
        act.nomeActividade ||
        act.title ||
        act.nome ||
        act.actividade ||
        act.designacao ||
        "Actividade sem título";

      const objective =
        act.objetivoActividade ||
        act.objetivo ||
        act.detalhes ||
        act.descricao ||
        "";

      const sector =
        act.setor ||
        act.reparticao ||
        act.departamento ||
        act.unidadeOrganica ||
        selectedSectorName ||
        "Setor Geral";

      const dept =
        act.departamento ||
        act.direcao ||
        act.unidadeOrganica ||
        "Geral";

      const dir =
        act.direcao ||
        act.unidadeOrganica ||
        "Direção Geral";

      // Resolver rubricas
      const rubricas = Array.isArray(act.rubricas) ? act.rubricas : [];
      const totalVal =
        Number(act.valor || act.orcamentoTotal || act.valorTotal || act.orcamentoCalculado || 0) ||
        rubricas.reduce((sum: number, r: any) => sum + Number(r.valorTotal || r.total || (Number(r.quantidade || 1) * Number(r.precoUnitario || 0)) || 0), 0);

      // Resolver trimestre e mês
      const rawMonth = act.mesRealizacao || (act.mesesRealizacao && act.mesesRealizacao[0]) || act.mes || act.dataMes || "";
      let trim = act.trimestre || "";
      if (!trim && rawMonth) {
        const m = String(rawMonth).toLowerCase();
        if (m.includes("jan") || m.includes("fev") || m.includes("mar")) trim = "1º Trimestre";
        else if (m.includes("abr") || m.includes("mai") || m.includes("jun")) trim = "2º Trimestre";
        else if (m.includes("jul") || m.includes("ago") || m.includes("set")) trim = "3º Trimestre";
        else if (m.includes("out") || m.includes("nov") || m.includes("dez")) trim = "4º Trimestre";
      }
      if (!trim) trim = "1º Trimestre";

      const mainRubric = act.rubrica || (rubricas[0]?.rubrica) || "Outras Despesas Correntes";
      const fonte = act.fonteReceita || act.orcamento || "Orçamento do Estado (OE)";

      return {
        ...act,
        id: act.id || `act-${index}`,
        normalizedCode: code,
        normalizedName: name,
        normalizedObjective: objective,
        normalizedSector: sector,
        normalizedDept: dept,
        normalizedDir: dir,
        normalizedTrimestre: trim,
        normalizedMonth: rawMonth,
        normalizedTotalValue: totalVal,
        normalizedRubricas: rubricas,
        normalizedMainRubric: mainRubric,
        normalizedFonte: fonte,
      };
    });
  }, [activities, selectedSectorName]);

  // Extrair listas únicas para filtros
  const availableRubricas = useMemo(() => {
    const set = new Set<string>();
    normalizedActivities.forEach((a) => {
      if (a.normalizedMainRubric) set.add(a.normalizedMainRubric);
      a.normalizedRubricas.forEach((r: any) => {
        if (r.rubrica) set.add(r.rubrica);
      });
    });
    return Array.from(set).sort();
  }, [normalizedActivities]);

  const availableFontes = useMemo(() => {
    const set = new Set<string>();
    normalizedActivities.forEach((a) => {
      if (a.normalizedFonte) set.add(a.normalizedFonte);
    });
    return Array.from(set).sort();
  }, [normalizedActivities]);

  // Filtragem
  const filteredActivities = useMemo(() => {
    return normalizedActivities.filter((act) => {
      // Busca textual
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const inCode = act.normalizedCode.toLowerCase().includes(term);
        const inName = act.normalizedName.toLowerCase().includes(term);
        const inObj = act.normalizedObjective.toLowerCase().includes(term);
        const inSec = act.normalizedSector.toLowerCase().includes(term);
        const inDept = act.normalizedDept.toLowerCase().includes(term);
        const inResp = String(act.responsavel || "").toLowerCase().includes(term);
        const inRubric = act.normalizedMainRubric.toLowerCase().includes(term) ||
          act.normalizedRubricas.some((r: any) => String(r.rubrica || r.necessidade || "").toLowerCase().includes(term));

        if (!inCode && !inName && !inObj && !inSec && !inDept && !inResp && !inRubric) {
          return false;
        }
      }

      // Filtro de Trimestre
      if (selectedTrimestre !== "todos") {
        if (!act.normalizedTrimestre.toLowerCase().includes(selectedTrimestre.toLowerCase())) {
          return false;
        }
      }

      // Filtro de Rúbrica
      if (selectedRubricaFilter !== "todos") {
        const hasRubric =
          act.normalizedMainRubric === selectedRubricaFilter ||
          act.normalizedRubricas.some((r: any) => r.rubrica === selectedRubricaFilter);
        if (!hasRubric) return false;
      }

      // Filtro de Fonte de Receita
      if (selectedFonteFilter !== "todos") {
        if (act.normalizedFonte !== selectedFonteFilter) return false;
      }

      return true;
    });
  }, [normalizedActivities, searchTerm, selectedTrimestre, selectedRubricaFilter, selectedFonteFilter]);

  // Métricas Totais
  const totalOrcamento = useMemo(() => {
    return filteredActivities.reduce((acc, curr) => acc + curr.normalizedTotalValue, 0);
  }, [filteredActivities]);

  const totalItemsCount = useMemo(() => {
    return filteredActivities.reduce((acc, curr) => {
      const rubCount = curr.normalizedRubricas.length;
      return acc + (rubCount > 0 ? rubCount : 1);
    }, 0);
  }, [filteredActivities]);

  // Estatísticas por Trimestre
  const statsTrimestres = useMemo(() => {
    const stats: Record<string, { count: number; total: number }> = {
      "1º Trimestre": { count: 0, total: 0 },
      "2º Trimestre": { count: 0, total: 0 },
      "3º Trimestre": { count: 0, total: 0 },
      "4º Trimestre": { count: 0, total: 0 },
    };

    filteredActivities.forEach((act) => {
      const trimKey = Object.keys(stats).find((t) => act.normalizedTrimestre.includes(t.charAt(0))) || "1º Trimestre";
      stats[trimKey].count += 1;
      stats[trimKey].total += act.normalizedTotalValue;
    });

    return stats;
  }, [filteredActivities]);

  // Agrupamento de Actividades conforme o Modo Selecionado
  const groupedData = useMemo(() => {
    if (groupMode === "trimestre") {
      const groups: Record<string, typeof filteredActivities> = {
        "1º Trimestre (Jan - Mar)": [],
        "2º Trimestre (Abr - Jun)": [],
        "3º Trimestre (Jul - Set)": [],
        "4º Trimestre (Out - Dez)": [],
      };

      filteredActivities.forEach((act) => {
        if (act.normalizedTrimestre.includes("1")) groups["1º Trimestre (Jan - Mar)"].push(act);
        else if (act.normalizedTrimestre.includes("2")) groups["2º Trimestre (Abr - Jun)"].push(act);
        else if (act.normalizedTrimestre.includes("3")) groups["3º Trimestre (Jul - Set)"].push(act);
        else if (act.normalizedTrimestre.includes("4")) groups["4º Trimestre (Out - Dez)"].push(act);
        else groups["1º Trimestre (Jan - Mar)"].push(act);
      });

      return Object.entries(groups)
        .filter(([_, items]) => items.length > 0)
        .map(([groupTitle, items]) => ({
          groupTitle,
          items,
          groupTotal: items.reduce((sum, item) => sum + item.normalizedTotalValue, 0),
        }));
    }

    if (groupMode === "rubrica") {
      const groups: Record<string, typeof filteredActivities> = {};

      filteredActivities.forEach((act) => {
        const key = act.normalizedMainRubric || "Outras Despesas";
        if (!groups[key]) groups[key] = [];
        groups[key].push(act);
      });

      return Object.entries(groups).map(([groupTitle, items]) => ({
        groupTitle,
        items,
        groupTotal: items.reduce((sum, item) => sum + item.normalizedTotalValue, 0),
      }));
    }

    if (groupMode === "setor") {
      const groups: Record<string, typeof filteredActivities> = {};

      filteredActivities.forEach((act) => {
        const key = act.normalizedSector || act.normalizedDept || "Setor Geral";
        if (!groups[key]) groups[key] = [];
        groups[key].push(act);
      });

      return Object.entries(groups).map(([groupTitle, items]) => ({
        groupTitle,
        items,
        groupTotal: items.reduce((sum, item) => sum + item.normalizedTotalValue, 0),
      }));
    }

    // Modo lista completa
    return [
      {
        groupTitle: "Todas as Actividades Planificadas",
        items: filteredActivities,
        groupTotal: totalOrcamento,
      },
    ];
  }, [filteredActivities, groupMode, totalOrcamento]);

  const toggleExpand = (id: string) => {
    setExpandedActivityIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleExpandAll = () => {
    const nextState = !allExpanded;
    setAllExpanded(nextState);
    const newMap: Record<string, boolean> = {};
    filteredActivities.forEach((a) => {
      newMap[a.id] = nextState;
    });
    setExpandedActivityIds(newMap);
  };

  // Exportar Excel
  const handleExportExcel = () => {
    if (filteredActivities.length === 0) {
      if (onShowAlert) onShowAlert("Não existem actividades para exportar.", "warning");
      return;
    }

    const excelRows = filteredActivities.map((act, index) => ({
      "Nº": index + 1,
      "Código / Referência": act.normalizedCode,
      "Designação da Actividade": act.normalizedName,
      "Objetivo / Justificação": act.normalizedObjective,
      "Direção": act.normalizedDir,
      "Departamento": act.normalizedDept,
      "Setor / Repartição": act.normalizedSector,
      "Trimestre": act.normalizedTrimestre,
      "Mês Realização": act.normalizedMonth || "Conforme Calendarização",
      "Responsável": act.responsavel || "Não atribuído",
      "Local Realização": act.localRealizacao || act.realizacaoProvincia || "Songo",
      "Necessita Transporte": act.necessitaTransporte || "Não",
      "Necessita Aquisição": act.necessitaAquisicao || "Não",
      "Necessita Contratação": act.necessitaContratacao || "Não",
      "Rúbrica Principal": act.normalizedMainRubric,
      "Fonte de Receita": act.normalizedFonte,
      "Orçamento Total (MZN)": act.normalizedTotalValue,
      "Qtd. Itens/Necessidades": act.normalizedRubricas.length,
    }));

    const ws = XLSX.utils.json_to_sheet(excelRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plano de Actividades");
    XLSX.writeFile(wb, `Plano_Actividades_${new Date().getFullYear()}_Consulta.xlsx`);

    if (onShowAlert) {
      onShowAlert("Ficheiro Excel exportado com sucesso!", "success");
    }
  };

  // Impressão Oficial do Plano
  const handlePrint = () => {
    if (filteredActivities.length === 0) {
      if (onShowAlert) onShowAlert("Não existem actividades para imprimir.", "warning");
      return;
    }

    const rowsHtml = filteredActivities
      .map(
        (act, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <td style="padding: 8px 6px; text-align: center; font-weight: bold; font-family: monospace;">${idx + 1}</td>
        <td style="padding: 8px 6px; font-weight: bold; font-family: monospace; color: #1e3a8a;">${act.normalizedCode}</td>
        <td style="padding: 8px 6px;">
          <strong style="color: #0f172a;">${act.normalizedName}</strong>
          ${act.normalizedObjective ? `<div style="font-size: 10px; color: #64748b; margin-top: 2px;">${act.normalizedObjective}</div>` : ""}
        </td>
        <td style="padding: 8px 6px; color: #334155;">${act.normalizedSector}</td>
        <td style="padding: 8px 6px; text-align: center; font-weight: 600;">${act.normalizedTrimestre}</td>
        <td style="padding: 8px 6px; text-align: center;">${act.normalizedMonth || "-"}</td>
        <td style="padding: 8px 6px; color: #475569;">${act.responsavel || "-"}</td>
        <td style="padding: 8px 6px; font-size: 10px;">${act.normalizedMainRubric}</td>
        <td style="padding: 8px 6px; text-align: right; font-weight: bold; font-family: monospace; color: #065f46;">
          ${act.normalizedTotalValue.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN
        </td>
      </tr>
    `
      )
      .join("");

    const contentHtml = `
      <div style="font-family: Arial, sans-serif; padding: 10px; color: #0f172a;">
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1e3a8a; padding-bottom: 12px;">
          <h2 style="margin: 0; font-size: 18px; color: #1e3a8a; text-transform: uppercase;">República de Moçambique</h2>
          <h3 style="margin: 4px 0; font-size: 14px; font-weight: bold; color: #334155;">Instituto Superior Politécnico de Songo</h3>
          <h4 style="margin: 4px 0; font-size: 13px; font-weight: 600; color: #64748b;">${title} - Exercício Económico ${new Date().getFullYear()}</h4>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 11px; background: #f8fafc; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px;">
          <div><strong>Total de Actividades:</strong> ${filteredActivities.length}</div>
          <div><strong>Setor / Unidade:</strong> ${selectedSectorName || "Todos"}</div>
          <div><strong>Orçamento Global:</strong> <span style="color: #065f46; font-weight: bold;">${totalOrcamento.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN</span></div>
        </div>

        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead>
            <tr style="background-color: #1e293b; color: #ffffff; font-size: 10px; text-transform: uppercase;">
              <th style="padding: 8px 6px; width: 30px; text-align: center;">Nº</th>
              <th style="padding: 8px 6px; width: 90px;">Código</th>
              <th style="padding: 8px 6px;">Actividade & Descrição</th>
              <th style="padding: 8px 6px; width: 110px;">Setor</th>
              <th style="padding: 8px 6px; width: 85px; text-align: center;">Trimestre</th>
              <th style="padding: 8px 6px; width: 75px; text-align: center;">Mês</th>
              <th style="padding: 8px 6px; width: 100px;">Responsável</th>
              <th style="padding: 8px 6px; width: 130px;">Rúbrica</th>
              <th style="padding: 8px 6px; width: 110px; text-align: right;">Orçamento</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
          <tfoot>
            <tr style="background: #f1f5f9; font-weight: bold; border-top: 2px solid #94a3b8; font-size: 11px;">
              <td colspan="8" style="padding: 10px 8px; text-align: right; text-transform: uppercase;">Total Geral Planificado:</td>
              <td style="padding: 10px 8px; text-align: right; font-family: monospace; color: #065f46; font-size: 12px;">
                ${totalOrcamento.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;

    openPrintDocumentWindow({
      title: `${title} - ${new Date().getFullYear()}`,
      subtitle: selectedSectorName || "Geral",
      contentHtml,
      orientation: "landscape",
      pageSize: "A4",
    });
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Cabeçalho do Modal */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-blue-600/30 text-blue-400 rounded-2xl border border-blue-500/20 shadow-inner shrink-0">
              <FileText size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white">{title}</h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2.5 py-0.5 rounded-full">
                  {filteredActivities.length} Registadas
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {subtitle} {selectedSectorName ? `• ${selectedSectorName}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700"
              title="Imprimir visualização oficial"
            >
              <Printer size={15} />
              <span className="hidden md:inline">Imprimir</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Exportar para Excel"
            >
              <Download size={15} />
              <span className="hidden md:inline">Excel</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Resumo de Indicadores Rápidos */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 sm:p-5 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex justify-between items-center text-slate-500 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider">Total Actividades</span>
              <ListOrdered size={16} className="text-blue-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {filteredActivities.length}
            </div>
            <span className="text-[10px] text-slate-400 font-medium">No plano selecionado</span>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex justify-between items-center text-slate-500 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider">Orçamento Global</span>
              <DollarSign size={16} className="text-emerald-600" />
            </div>
            <div className="text-lg sm:text-xl font-black text-emerald-700 font-mono tracking-tight">
              {totalOrcamento.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Meticais (MZN)</span>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex justify-between items-center text-slate-500 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider">Itens / Linhas</span>
              <Layers size={16} className="text-amber-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {totalItemsCount}
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Necessidades planificadas</span>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex justify-between items-center text-slate-500 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider">Distribuição Trimestral</span>
              <Calendar size={16} className="text-indigo-600" />
            </div>
            <div className="flex items-center gap-1.5 mt-1 font-mono text-xs font-bold text-slate-700">
              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]" title="T1">T1: {statsTrimestres["1º Trimestre"].count}</span>
              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]" title="T2">T2: {statsTrimestres["2º Trimestre"].count}</span>
              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]" title="T3">T3: {statsTrimestres["3º Trimestre"].count}</span>
              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]" title="T4">T4: {statsTrimestres["4º Trimestre"].count}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">4 Ciclos do ano</span>
          </div>
        </div>

        {/* Barra de Filtros e Modos de Organização */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-200 space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Campo de Busca */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                type="text"
                placeholder="Pesquisar por código, nome da actividade, objetivo, responsável, rúbrica..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Modos de Organização */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start md:self-auto overflow-x-auto">
              <button
                type="button"
                onClick={() => setGroupMode("trimestre")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  groupMode === "trimestre"
                    ? "bg-white text-blue-700 shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Calendar size={14} /> Por Trimestre
              </button>

              <button
                type="button"
                onClick={() => setGroupMode("rubrica")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  groupMode === "rubrica"
                    ? "bg-white text-blue-700 shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Tag size={14} /> Por Rúbrica
              </button>

              <button
                type="button"
                onClick={() => setGroupMode("setor")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  groupMode === "setor"
                    ? "bg-white text-blue-700 shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Building2 size={14} /> Por Setor
              </button>

              <button
                type="button"
                onClick={() => setGroupMode("lista")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  groupMode === "lista"
                    ? "bg-white text-blue-700 shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ListOrdered size={14} /> Lista Geral
              </button>
            </div>
          </div>

          {/* Filtros Dropdown Rápidos */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <Filter size={13} /> Filtrar:
            </span>

            {/* Trimestre */}
            <select
              value={selectedTrimestre}
              onChange={(e) => setSelectedTrimestre(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="todos">Todos os Trimestres</option>
              <option value="1">1º Trimestre</option>
              <option value="2">2º Trimestre</option>
              <option value="3">3º Trimestre</option>
              <option value="4">4º Trimestre</option>
            </select>

            {/* Rúbrica */}
            {availableRubricas.length > 0 && (
              <select
                value={selectedRubricaFilter}
                onChange={(e) => setSelectedRubricaFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[220px] truncate"
              >
                <option value="todos">Todas as Rúbricas</option>
                {availableRubricas.map((rub) => (
                  <option key={rub} value={rub}>
                    {rub}
                  </option>
                ))}
              </select>
            )}

            {/* Fonte de Receita */}
            {availableFontes.length > 0 && (
              <select
                value={selectedFonteFilter}
                onChange={(e) => setSelectedFonteFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[180px] truncate"
              >
                <option value="todos">Todas as Fontes</option>
                {availableFontes.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            )}

            {(searchTerm || selectedTrimestre !== "todos" || selectedRubricaFilter !== "todos" || selectedFonteFilter !== "todos") && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedTrimestre("todos");
                  setSelectedRubricaFilter("todos");
                  setSelectedFonteFilter("todos");
                }}
                className="text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                Limpar Filtros
              </button>
            )}

            <div className="ml-auto">
              <button
                type="button"
                onClick={toggleExpandAll}
                className="text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 cursor-pointer bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-all"
              >
                {allExpanded ? (
                  <>
                    <Minimize2 size={13} /> Recolher Todos
                  </>
                ) : (
                  <>
                    <Maximize2 size={13} /> Expandir Detalhes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Corpo com Actividades Organizadas */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-100/70">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
              <AlertCircle size={44} className="mx-auto text-amber-500 mb-3" />
              <h4 className="text-lg font-black text-slate-900">Nenhuma Actividade Encontrada</h4>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Não foram localizadas actividades planificadas com os critérios e filtros selecionados no momento.
              </p>
            </div>
          ) : (
            groupedData.map((group) => (
              <div key={group.groupTitle} className="space-y-3">
                {/* Cabeçalho do Grupo */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-3.5 px-5 rounded-2xl border border-slate-200 shadow-2xs gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                    <h4 className="text-sm font-black text-slate-900 tracking-tight">
                      {group.groupTitle}
                    </h4>
                    <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                      {group.items.length} {group.items.length === 1 ? "actividade" : "actividades"}
                    </span>
                  </div>

                  <div className="text-xs font-mono font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200/60">
                    Subtotal: {group.groupTotal.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN
                  </div>
                </div>

                {/* Lista de Actividades do Grupo */}
                <div className="space-y-3">
                  {group.items.map((act, idx) => {
                    const isExpanded = !!expandedActivityIds[act.id] || allExpanded;

                    return (
                      <div
                        key={act.id || idx}
                        className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all overflow-hidden"
                      >
                        {/* Linha Principal da Actividade */}
                        <div className="p-4 sm:p-5 space-y-3">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-black font-mono bg-blue-50 text-blue-800 px-3 py-1 rounded-lg border border-blue-200">
                                {act.normalizedCode}
                              </span>
                              <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                                <Calendar size={12} className="text-slate-500" />
                                {act.normalizedTrimestre} {act.normalizedMonth ? `• ${act.normalizedMonth}` : ""}
                              </span>
                              <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                                <Building2 size={12} className="text-slate-500" />
                                {act.normalizedSector}
                              </span>
                              {act.status && (
                                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                                  {act.status}
                                </span>
                              )}
                            </div>

                            <div className="text-right flex items-center gap-3 self-end sm:self-auto">
                              <div>
                                <span className="text-sm sm:text-base font-black font-mono text-emerald-700 block">
                                  {act.normalizedTotalValue.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold block">
                                  {act.normalizedFonte}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => toggleExpand(act.id)}
                                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-colors cursor-pointer"
                                title={isExpanded ? "Recolher detalhes" : "Ver todos os detalhes"}
                              >
                                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                              </button>
                            </div>
                          </div>

                          {/* Título e Descrição */}
                          <div>
                            <h4 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                              {act.normalizedName}
                            </h4>
                            {act.normalizedObjective && (
                              <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                                {act.normalizedObjective}
                              </p>
                            )}
                          </div>

                          {/* Metadados Essenciais em Linha */}
                          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600 pt-1">
                            {act.responsavel && (
                              <div className="flex items-center gap-1.5">
                                <User size={13} className="text-slate-400" />
                                <span>Responsável: <strong className="text-slate-800">{act.responsavel}</strong></span>
                              </div>
                            )}

                            {(act.localRealizacao || act.realizacaoProvincia || act.trabalhoProvincia) && (
                              <div className="flex items-center gap-1.5">
                                <MapPin size={13} className="text-slate-400" />
                                <span>Local: <strong className="text-slate-800">{act.localRealizacao || act.realizacaoProvincia || act.trabalhoProvincia}</strong></span>
                              </div>
                            )}

                            {act.normalizedMainRubric && (
                              <div className="flex items-center gap-1.5">
                                <Tag size={13} className="text-slate-400" />
                                <span>Rúbrica: <strong className="text-slate-800">{act.normalizedMainRubric}</strong></span>
                              </div>
                            )}
                          </div>

                          {/* Seção Expandida com Detalhes Ricos */}
                          {isExpanded && (
                            <div className="pt-4 border-t border-slate-100 space-y-4 animate-in fade-in duration-200">
                              {/* Logística e Meios */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                                  <div className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1 mb-1">
                                    <Truck size={12} /> Transporte
                                  </div>
                                  <div className="font-bold text-slate-800">
                                    {act.necessitaTransporte === "Sim" ? "Necessita Transporte" : "Não necessita"}
                                  </div>
                                  {act.viatura && <div className="text-[11px] text-slate-500 mt-0.5">Viatura: {act.viatura}</div>}
                                </div>

                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                                  <div className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1 mb-1">
                                    <ShoppingCart size={12} /> Aquisições
                                  </div>
                                  <div className="font-bold text-slate-800">
                                    {act.necessitaAquisicao === "Sim" ? "Requer Aquisição UGEA" : "Sem Aquisições"}
                                  </div>
                                </div>

                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                                  <div className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1 mb-1">
                                    <Briefcase size={12} /> Contratação
                                  </div>
                                  <div className="font-bold text-slate-800">
                                    {act.necessitaContratacao === "Sim" ? "Requer Contratação" : "Sem Contratações"}
                                  </div>
                                </div>
                              </div>

                              {/* Tabela de Rúbricas e Produtos / Necessidades */}
                              {act.normalizedRubricas.length > 0 ? (
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                                  <div className="text-xs font-black text-slate-800 flex justify-between items-center">
                                    <span>Rúbricas & Itens de Despesa Planificados</span>
                                    <span className="text-[10px] font-normal text-slate-500">
                                      {act.normalizedRubricas.length} {act.normalizedRubricas.length === 1 ? "item" : "itens"}
                                    </span>
                                  </div>

                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                      <thead>
                                        <tr className="border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500">
                                          <th className="pb-1.5">Rúbrica</th>
                                          <th className="pb-1.5">Necessidade / Item</th>
                                          <th className="pb-1.5 text-center">Qtd</th>
                                          <th className="pb-1.5 text-right">P. Unitário</th>
                                          <th className="pb-1.5 text-right">Subtotal</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-200/50">
                                        {act.normalizedRubricas.map((rub: any, rIdx: number) => {
                                          const qtd = Number(rub.quantidade || rub.pessoas || 1);
                                          const preco = Number(rub.precoUnitario || rub.valorDiario || 0);
                                          const sub = Number(rub.valorTotal || rub.total || qtd * preco);

                                          return (
                                            <tr key={rIdx} className="hover:bg-white/50">
                                              <td className="py-2 text-slate-700 font-medium">{rub.rubrica || act.normalizedMainRubric}</td>
                                              <td className="py-2 text-slate-900 font-bold">{rub.necessidade || rub.especificacao || rub.detalhes || "Despesa geral"}</td>
                                              <td className="py-2 text-center text-slate-700 font-mono">{qtd}</td>
                                              <td className="py-2 text-right text-slate-600 font-mono">
                                                {preco.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })}
                                              </td>
                                              <td className="py-2 text-right text-emerald-700 font-mono font-bold">
                                                {sub.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              ) : null}

                              {/* Partilha Manual de Actividade */}
                              {onToggleShare && (
                                <div className="pt-2 flex flex-col gap-2">
                                  <div className="flex justify-between items-center text-[11px]">
                                    <div className="flex items-center gap-1.5 text-slate-500 font-bold">
                                      <span
                                        className={`w-2 h-2 rounded-full ${
                                          Array.isArray(act.sharedWith) && act.sharedWith.length > 0
                                            ? "bg-emerald-500"
                                            : "bg-slate-300"
                                        }`}
                                      ></span>
                                      <span>
                                        {Array.isArray(act.sharedWith) && act.sharedWith.length > 0
                                          ? `Partilhada com ${act.sharedWith.length} departamento(s)`
                                          : "Actividade estritamente privada"}
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => setSharingId(currentSharingId === act.id ? null : act.id)}
                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                        currentSharingId === act.id
                                          ? "bg-slate-900 text-white"
                                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                      }`}
                                    >
                                      <Share2 size={13} />
                                      <span>
                                        {currentSharingId === act.id ? "Fechar Partilha" : "Partilhar com Outras Áreas"}
                                      </span>
                                    </button>
                                  </div>

                                  {currentSharingId === act.id && (
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                      <div>
                                        <h5 className="text-[11px] font-black text-slate-800">
                                          Selecione as áreas que poderão visualizar esta actividade
                                        </h5>
                                        <p className="text-[10px] text-slate-400 font-medium">
                                          Controle total manual de comunicação e partilha orçamental.
                                        </p>
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {SHARABLE_AREAS.map((area) => {
                                          const isShared =
                                            Array.isArray(act.sharedWith) &&
                                            act.sharedWith.some(
                                              (x: string) => x.toLowerCase().trim() === area.toLowerCase().trim()
                                            );
                                          return (
                                            <button
                                              key={area}
                                              type="button"
                                              onClick={() => onToggleShare(act, area)}
                                              disabled={isSavingShare === act.id}
                                              className={`flex items-center justify-between p-2 px-3 rounded-lg border text-left text-xs font-bold transition-all cursor-pointer ${
                                                isShared
                                                  ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs"
                                                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                                              }`}
                                            >
                                              <span className="truncate max-w-[200px]">{area}</span>
                                              {isShared && (
                                                <Check size={14} className="text-emerald-600 shrink-0" />
                                              )}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-xs text-slate-500 font-medium">
            Exibindo <strong>{filteredActivities.length}</strong> de <strong>{normalizedActivities.length}</strong> actividades planificadas
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm"
            >
              Fechar Consulta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

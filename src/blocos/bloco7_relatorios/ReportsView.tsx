import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  FileText,
  Calendar,
  Download,
  Filter,
  ChevronRight,
  History,
  Building2,
  LayoutGrid,
  FileCheck,
  ArrowLeft,
  Send,
  Cloud,
  GitMerge,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import StandardReportModel from "../bloco7_relatorios/StandardReportModel";
import { getRoles, isSuperBossUser } from "../../lib/auth";
import {
  FUNCIONARIOS,
  UNIDADES_ORGANICAS_SISTEMA,
  DEPARTAMENTOS,
  REPARTICOES,
  CURSOS,
} from "../../constants/formOptions";
import { firestoreService } from "../../lib/firestoreService";
import { ProcessingCircle } from "../../components/ui/ProcessingCircle";

interface ReportData {
  id: string;
  title: string;
  direction: string;
  department?: string;
  section?: string;
  year: number;
  semester?: number; // 1 or 2
  type: "Anual" | "Semestral";
  level: "reparticao" | "departamento" | "direcao" | "institucional";
  status: "draft" | "submitted" | "compiled" | "final";
  sections: { title: string; content: string }[];
  stats?: {
    cursos?: number;
    novosIngressos?: number;
    matriculados?: number;
    desistentes?: number;
    bolseiros?: number;
    aproveitamento?: number;
    docentesGlobal?: number;
    ctaGlobal?: number;
    orcamentoEstado?: number;
    receitasProprias?: number;
    financiamentoParceiros?: number;
    titulosBiblioteca?: number;
  };
  technicalSheet?: { name: string; role: string }[];
  abbreviations?: { sigla: string; significado: string }[];
  createdBy?: string;
  updatedAt?: any;
  childReports?: string[]; // IDs of reports that were compiled into this one
}

export default function ReportsView({
  onShowAlert,
  onBack,
  onSetHeaderActions,
  initialDirection,
  user,
}: {
  onShowAlert: (msg: string) => void;
  onBack: () => void;
  onSetHeaderActions?: (actions: React.ReactNode) => void;
  initialDirection?: string;
  user?: any;
}) {
  const directions = [
    {
      id: "DG",
      name: "Gabinete do Diretor-Geral",
      icon: <Building2 />,
      color: "blue",
    },
    {
      id: "DICOSAFA",
      name: "DICOSAFA (Direção de Coordenação de Serviços de Administração, Finanças e de Apoio)",
      icon: <LayoutGrid />,
      color: "purple",
    },
    {
      id: "DICOSSER",
      name: "DICOSSER (Direção de Coordenação de Serviços Sociais, Estudantis e Registo)",
      icon: <FileCheck />,
      color: "green",
    },
    {
      id: "DE",
      name: "Divisão de Engenharia",
      icon: <Building2 />,
      color: "orange",
    },
  ];

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12

  const [reportType, setReportType] = useState<"Anual" | "Semestral" | null>(
    null,
  );
  const [mode, setMode] = useState<
    | "type-selection"
    | "action-selection"
    | "consult"
    | "edit-report"
    | "view-report"
    | "workflow"
  >("type-selection");
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedDirection, setSelectedDirection] = useState<string | null>(
    initialDirection || null,
  );
  const [activeReport, setActiveReport] = useState<ReportData | null>(null);
  const [reports, setReports] = useState<ReportData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firestoreService.reports.subscribe((data) => {
      // Filter reports to show only those belonging to the user's sector (department or direction)
      const userDepartment = user?.departamento || user?.department || "";
      const userDirection = user?.direcao || user?.direction || "";

      const filteredData = data.filter((r) => {
        // Institutional/Super users can see everything
        if (userLevel === "institucional") return true;

        // Match direction or department
        return (
          (userDirection && r.direction === userDirection) ||
          (userDepartment && r.department === userDepartment)
        );
      });

      setReports(filteredData);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    // Apply logic for default year based on report type
    if (reportType === "Anual") {
      setSelectedYear(currentYear - 1);
    } else if (reportType === "Semestral") {
      setSelectedYear(currentYear);
    }
  }, [reportType]);

  const getUserLevel = () => {
    if (!user) return "reparticao";
    const role = (user.role || user.cargo || "").toLowerCase();
    const sector = (user.setor || user.direcao || "").toLowerCase();
    if (
      role.includes("geral") ||
      role.includes("planificacao") ||
      role.includes("academica") ||
      role.includes("académico") ||
      sector.includes("académica")
    )
      return "institucional";
    if (role.includes("diretor")) return "direcao";
    if (role.includes("chefe de departamento")) return "departamento";
    return "reparticao";
  };

  const userLevel = getUserLevel();

  const handleSaveReport = async (data: Partial<ReportData>) => {
    try {
      if (data.id) {
        await firestoreService.reports.update(data.id, {
          ...data,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await firestoreService.reports.add({
          ...data,
          status: "draft",
          level: userLevel,
          createdBy: user?.id,
          updatedAt: new Date().toISOString(),
        });
      }
      onShowAlert("Relatório guardado com sucesso!");
      setMode("consult");
    } catch (error) {
      console.error("Erro ao salvar relatório:", error);
      onShowAlert("Erro ao guardar relatório na base de dados.");
    }
  };

  const handleSubmitReport = async (report: ReportData) => {
    try {
      let targetLabel = "Nível Superior";
      if (report.level === "reparticao") targetLabel = "Departamento";
      if (report.level === "departamento") targetLabel = "Direção";
      if (report.level === "direcao" && isSuperBossUser(user))
        targetLabel = "Setor de Planificação";

      if (
        !window.confirm(
          `Tem a certeza que deseja enviar este relatório para o ${targetLabel}?`,
        )
      )
        return;

      setIsLoading(true);

      // Enviar para o arquivo morto
      await firestoreService.archive_documents.add({
        title: `Relatório: ${report.title} (${report.level.toUpperCase()}) - ${new Date().toLocaleDateString("pt-PT")}`,
        year: new Date().getFullYear(),
        type: "Relatórios de Actividades",
        date: new Date().toISOString().split("T")[0],
        sections: report.sections,
        author: user?.nome || user?.email,
        origin: report.level,
        isDigitalized: true,
      });

      await firestoreService.reports.update(report.id, {
        status: "submitted",
        updatedAt: new Date().toISOString(),
      });

      onShowAlert(`Relatório submetido e arquivado para consulta com sucesso!`);
    } catch (error) {
      console.error(error);
      onShowAlert("Erro ao submeter relatório.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderWorkflowStatus = (status: string) => {
    switch (status) {
      case "draft":
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-bold ">
            Rascunho
          </span>
        );
      case "submitted":
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-[10px] font-bold ">
            Enviado
          </span>
        );
      case "compiled":
        return (
          <span className="px-2 py-1 bg-purple-100 text-purple-600 rounded text-[10px] font-bold ">
            Compilado
          </span>
        );
      case "final":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-600 rounded text-[10px] font-bold ">
            Final
          </span>
        );
      default:
        return null;
    }
  };

  const MASTER_REPORT_SECTIONS = [
    { id: "intro", title: "I. INTRODUÇÃO", level: "institucional" },
    {
      id: "estrutura",
      title: "1. ESTRUTURA E ORGANOGRAMA",
      level: "institucional",
    },
    { id: "missao", title: "2. MISSÃO E VISÃO", level: "institucional" },
    { id: "swot", title: "3. ANÁLISE SWOT (FOFA)", level: "institucional" },
    {
      id: "act_dg",
      title: "4. ATIVIDADES: GABINETE DO DIRETOR-GERAL",
      level: "direcao",
      owner: "Gabinete do Diretor-Geral",
    },
    {
      id: "act_DICOSAFA",
      title: "5. ATIVIDADES: DICOSAFA",
      level: "direcao",
      owner: "DICOSAFA",
    },
    {
      id: "act_DICOSSER",
      title: "6. ATIVIDADES: DICOSSER",
      level: "direcao",
      owner: "DICOSSER",
    },
    {
      id: "act_de",
      title: "7. ATIVIDADES: DIVISÃO DE ENGENHARIA",
      level: "direcao",
      owner: "Divisão de Engenharia",
    },
    {
      id: "act_cie",
      title: "8. ATIVIDADES: CENTRO DE INCUBAÇÃO (CIE)",
      level: "direcao",
      owner: "Centro de Incubação de Empresas",
    },
    {
      id: "act_estudantil",
      title: "9. ATIVIDADES: GESTÃO ESTUDANTIL E ASSUNTOS ACADÉMICOS",
      level: "direcao",
      owner: "Gestão Estudantil",
    },
    {
      id: "constrangimentos",
      title: "10. CONSTRANGIMENTOS E DESAFIOS",
      level: "institucional",
    },
  ];

  const renderTypeSelection = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mx-auto mt-12">
      <button
        onClick={() => {
          // Check for existing master report for 2025
          const master = reports.find(
            (r) =>
              r.level === "institucional" &&
              r.year === 2025 &&
              r.title.includes("Digital Unificado"),
          );
          if (master) {
            setActiveReport(master);
            setMode("edit-report");
          } else {
            const newMaster: any = {
              title: `Relatório Digital Unificado Songo 2025`,
              direction: "Institucional",
              year: 2025,
              type: "Anual",
              level: "institucional",
              status: "draft",
              sections: MASTER_REPORT_SECTIONS.map((s) => ({
                title: s.title,
                content: "",
                id: s.id,
                owner: (s as any).owner,
              })),
            };
            setActiveReport(newMaster);
            setMode("edit-report");
          }
        }}
        className="group bg-gradient-to-br from-blue-600 to-indigo-700 p-10 rounded-3xl shadow-xl hover:scale-[1.02] transition-all flex flex-col items-center text-center gap-6 text-white border-4 border-white/20"
      >
        <div className="p-6 bg-white/20 rounded-2xl group-hover:bg-white/30 transition-colors">
          <GitMerge size={48} />
        </div>
        <div>
          <h3 className="text-2xl font-bold mb-2 tracking-tighter">
            Relatório Digital Unificado
          </h3>
          <p className="text-blue-100 text-sm">
            Modelo Mestre colaborativo para todas as direções (2025).
          </p>
          <span className="inline-block mt-4 px-3 py-1 bg-white/20 rounded-full text-[10px] font-black ">
            Recomendado
          </span>
        </div>
      </button>

      <button
        onClick={() => {
          setReportType("Anual");
          setMode("action-selection");
        }}
        className="group bg-slate-50/50 border-2 border-gray-100 p-10 rounded-3xl shadow-sm hover:border-blue-500 hover:shadow-xl transition-all flex flex-col items-center text-center gap-6"
      >
        <div className="p-6 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
          <Calendar size={48} />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2 tracking-tighter">
            Modelos Anuais
          </h3>
          <p className="text-gray-500 text-sm">
            Arquivos e modelos anuais independentes.
          </p>
        </div>
      </button>

      <button
        onClick={() => {
          setReportType("Semestral");
          setMode("action-selection");
        }}
        className="group bg-slate-50/50 border-2 border-gray-100 p-10 rounded-3xl shadow-sm hover:border-purple-500 hover:shadow-xl transition-all flex flex-col items-center text-center gap-6"
      >
        <div className="p-6 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
          <Calendar size={48} />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2 tracking-tighter">
            Modelos Semestrais
          </h3>
          <p className="text-gray-500 text-sm">
            Reportes parciais por período de 6 meses.
          </p>
        </div>
      </button>
    </div>
  );

  const renderActionSelection = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-4xl mx-auto mt-12 space-y-8"
    >
      <button
        onClick={() => setMode("type-selection")}
        className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-2"
      >
        ← Voltar aos tipos de relatório
      </button>

      <div className="text-center mb-8">
        <h3 className="text-3xl font-bold text-gray-900">
          Relatório {reportType}
        </h3>
        <p className="text-gray-500">
          Gestão hierárquica e fluxo de compilação.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => setMode("consult")}
          className="group bg-slate-50/50 border-2 border-gray-100 p-8 rounded-3xl shadow-sm hover:border-blue-500 hover:shadow-xl transition-all flex flex-col items-center text-center gap-4"
        >
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Search size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Consultar</h3>
            <p className="text-xs text-gray-500">
              Histórico de relatórios finalizados ou em curso.
            </p>
          </div>
        </button>

        <button
          onClick={() => {
            setActiveReport(null);
            setMode("edit-report");
          }}
          className="group bg-slate-50/50 border-2 border-gray-100 p-8 rounded-3xl shadow-sm hover:border-green-500 hover:shadow-xl transition-all flex flex-col items-center text-center gap-4"
        >
          <div className="p-4 bg-green-50 text-green-600 rounded-2xl group-hover:bg-green-600 group-hover:text-white transition-colors">
            <Plus size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Novo</h3>
            <p className="text-xs text-gray-500">
              Iniciar novo rascunho de relatório.
            </p>
          </div>
        </button>

        {(userLevel === "departamento" ||
          userLevel === "direcao" ||
          userLevel === "institucional") && (
          <button
            onClick={() => setMode("workflow")}
            className="group bg-slate-50/50 border-2 border-gray-100 p-8 rounded-3xl shadow-sm hover:border-purple-500 hover:shadow-xl transition-all flex flex-col items-center text-center gap-4"
          >
            <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <GitMerge size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Unificar</h3>
              <p className="text-xs text-gray-500">
                Compilar relatórios recebidos dos setores.
              </p>
            </div>
          </button>
        )}
      </div>
    </motion.div>
  );

  const years = Array.from(
    { length: new Date().getFullYear() - 2010 + 1 },
    (_, i) => 2010 + i,
  ).reverse();

  const renderWorkflow = () => {
    // Determine which reports the user should see for compilation
    const pendingReports = reports.filter((r) => {
      if (r.type !== reportType || r.year !== selectedYear) return false;
      if (r.status !== "submitted") return false;

      if (userLevel === "departamento") {
        return (
          r.department === (user?.department || user?.departamento) &&
          r.level === "reparticao"
        );
      }
      if (userLevel === "direcao") {
        return (
          r.direction === (user?.direction || user?.direcao) &&
          r.level === "departamento"
        );
      }
      if (userLevel === "institucional") {
        return r.level === "direcao";
      }
      return false;
    });

    const handleCompile = () => {
      if (pendingReports.length === 0) {
        onShowAlert("Não existem relatórios submetidos para compilar.");
        return;
      }

      // Determine compiled title based on level
      let compiledTitle = `Relatório de Actividades ${reportType} ${selectedYear}`;
      if (userLevel === "departamento")
        compiledTitle = `Relatório do Departamento de ${user?.department || user?.departamento || "Gestão"}`;
      if (userLevel === "direcao")
        compiledTitle = `Relatório da Direção de ${user?.direction || user?.direcao || "Coordenação"}`;
      if (userLevel === "institucional")
        compiledTitle = `Relatório de Actividades Institucional do Songo`;

      // Pre-fill a new report with compiled data
      const compiledSections: { title: string; content: string }[] = [
        {
          title: "Sumário Executivo Consolidado",
          content: `Este relatório é uma unificação de ${pendingReports.length} relatórios recebidos dos setores subordinados.`,
        },
        {
          title: "Introdução",
          content: `O presente documento consolida as actividades realizadas no âmbito do ${userLevel === "institucional" ? "Instituto" : userLevel === "direcao" ? "da Direção" : "do Departamento"} durante o período de ${selectedYear}.`,
        },
      ];

      // Group common sections if possible, or just list them
      pendingReports.forEach((r) => {
        compiledSections.push({
          title: `Contributo: ${r.section || r.department || r.direction}`,
          content: r.sections
            .map((s) => `${s.title}:\n${s.content}`)
            .join("\n\n"),
        });
      });

      // Sum up stats if they exist
      const summedStats: any = { ...reports[0]?.stats }; // Start with a template
      if (summedStats) {
        Object.keys(summedStats).forEach((key) => {
          summedStats[key] = pendingReports.reduce(
            (sum, r) => sum + ((r.stats as any)?.[key] || 0),
            0,
          );
        });
      }

      const newReport: any = {
        title: compiledTitle,
        direction: user?.direction || user?.direcao || "",
        department: user?.department || user?.departamento || "",
        year: selectedYear,
        semester: reportType === "Semestral" ? 1 : undefined,
        type: reportType,
        level: userLevel,
        status: "draft",
        sections: compiledSections,
        stats: summedStats,
        childReports: pendingReports.map((r) => r.id),
      };

      setActiveReport(newReport);
      setMode("edit-report");
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl mx-auto space-y-8"
      >
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMode("action-selection")}
            className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-2"
          >
            ← VOLTAR ÀS AÇÕES
          </button>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-gray-400">
              FILTRO: {selectedYear}
            </span>
          </div>
        </div>

        <div className="bg-slate-50/50 border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-8 border-b border-gray-100 bg-purple-50/50 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Unificação de Relatórios
              </h3>
              <p className="text-sm text-gray-500">
                Relatórios recebidos dos níveis inferiores aguardando
                compilação.
              </p>
            </div>
            <button
              onClick={handleCompile}
              disabled={pendingReports.length === 0}
              className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition-all disabled:opacity-50 shadow-lg shadow-purple-100"
            >
              <GitMerge size={20} /> UNIFICAR {pendingReports.length} RELATÓRIOS
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {pendingReports.length === 0 ? (
              <div className="p-12 text-center text-gray-400 italic flex flex-col items-center gap-4">
                <CheckCircle2 size={48} className="text-gray-200" />
                Nenhum relatório pendente de unificação no momento.
              </div>
            ) : (
              pendingReports.map((r) => (
                <div
                  key={r.id}
                  className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white border border-gray-100 text-purple-600 rounded-xl shadow-sm">
                      <FileText size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{r.title}</p>
                      <p className="text-xs text-gray-500  tracking-tighter">
                        {r.direction} {r.department ? `> ${r.department}` : ""}{" "}
                        {r.section ? `> ${r.section}` : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setActiveReport(r);
                      setMode("view-report");
                    }}
                    className="text-blue-600 font-bold text-xs hover:underline px-4 py-2"
                  >
                    VISUALIZAR
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderConsult = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full max-w-5xl mx-auto space-y-8"
    >
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            setMode("action-selection");
          }}
          className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-2"
        >
          ← VOLTAR ÀS AÇÕES
        </button>
        <div className="flex items-center gap-4">
          <label className="text-xs font-bold text-gray-400">Ano:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-white border border-gray-200 px-4 py-2 rounded-xl font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-slate-50/50 border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Histórico e Rascunhos
            </h3>
            <p className="text-sm text-gray-500">
              Gerencie seus relatórios em curso ou consulte finalizados.
            </p>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <ProcessingCircle size={32} />
            </div>
          ) : reports.filter(
              (r) => r.type === reportType && r.year === selectedYear,
            ).length === 0 ? (
            <div className="p-12 text-center text-gray-400 italic">
              Nenhum relatório encontrado para {selectedYear}.
            </div>
          ) : (
            reports
              .filter((r) => r.type === reportType && r.year === selectedYear)
              .sort(
                (a, b) =>
                  new Date(b.updatedAt).getTime() -
                  new Date(a.updatedAt).getTime(),
              )
              .map((doc) => (
                <div
                  key={doc.id}
                  className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-gray-100 text-gray-400 rounded-lg">
                      <FileText size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900">{doc.title}</p>
                        {renderWorkflowStatus(doc.status)}
                      </div>
                      <p className="text-[10px] text-gray-400  tracking-widest">
                        {doc.direction}{" "}
                        {doc.department ? `• ${doc.department}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setActiveReport(doc);
                        setMode("view-report");
                      }}
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-600 hover:text-white transition-all"
                    >
                      ABRIR
                    </button>
                    {doc.status === "draft" && (
                      <button
                        onClick={() => {
                          setActiveReport(doc);
                          setMode("edit-report");
                        }}
                        className="px-4 py-2 bg-gray-50 text-gray-600 rounded-xl font-bold text-xs hover:bg-gray-200 transition-all"
                      >
                        EDITAR
                      </button>
                    )}
                    {doc.status === "draft" && (
                      <button
                        onClick={() => handleSubmitReport(doc)}
                        className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2"
                      >
                        <Send size={14} /> ENVIAR AO{" "}
                        {doc.level === "reparticao"
                          ? "DEPARTAMENTO"
                          : doc.level === "departamento"
                            ? "DIREÇÃO"
                            : "SETOR DE PLANIFICAÇÃO"}
                      </button>
                    )}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="w-full h-full pb-20">
      <AnimatePresence mode="wait">
        {mode === "type-selection" && renderTypeSelection()}
        {mode === "action-selection" && renderActionSelection()}
        {mode === "consult" && renderConsult()}
        {mode === "workflow" && renderWorkflow()}
        {mode === "edit-report" && (
          <ReportEditor
            report={activeReport}
            reportType={reportType}
            onBack={() => setMode("action-selection")}
            onSave={handleSaveReport}
            user={user}
          />
        )}
        {mode === "view-report" && activeReport && (
          <StandardReportModel
            direction={activeReport.direction}
            year={activeReport.year}
            semester={activeReport.semester}
            stats={activeReport.stats}
            title={activeReport.title}
            sections={activeReport.sections.map((s) => ({
              title: s.title,
              content: <div className="whitespace-pre-wrap">{s.content}</div>,
            }))}
            technicalSheet={activeReport.technicalSheet}
            abbreviations={activeReport.abbreviations}
            onBack={() => setMode("consult")}
            user={user}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ReportEditor({
  report,
  reportType,
  onBack,
  onSave,
  user,
}: {
  report: ReportData | null;
  reportType: string | null;
  onBack: () => void;
  onSave: (data: Partial<ReportData>) => Promise<void>;
  user?: any;
}) {
  const currentYear = new Date().getFullYear();
  const defaultYear =
    report?.year || (reportType === "Anual" ? currentYear - 1 : currentYear);

  const getUserLevel = (u: any) => {
    if (!u) return "reparticao";
    const role = (u.role || u.cargo || "").toLowerCase();
    const sector = (u.setor || u.direcao || "").toLowerCase();
    if (
      role.includes("geral") ||
      role.includes("planificacao") ||
      role.includes("academica") ||
      role.includes("académico") ||
      sector.includes("académica")
    )
      return "institucional";
    if (role.includes("diretor")) return "direcao";
    if (role.includes("chefe de departamento")) return "departamento";
    return "reparticao";
  };

  const userLevel = report?.level || getUserLevel(user);

  const [direcao, setDirecao] = useState(
    report?.direction || user?.direction || user?.direcao || "",
  );
  const [departamento, setDepartamento] = useState(
    report?.department || user?.department || user?.departamento || "",
  );
  const [reparticao, setReparticao] = useState(
    report?.section || user?.reparticao || "",
  );

  const getDefaultTitle = () => {
    if (userLevel === "institucional")
      return `Relatório de Actividades Institucional ${reportType || ""}`;
    if (userLevel === "direcao")
      return `Relatório de Actividades da Direção de ${direcao || "..."}`;
    if (userLevel === "departamento")
      return `Relatório de Actividades do Departamento de ${departamento || "..."}`;
    return `Relatório de Actividades da Repartição de ${reparticao || "..."}`;
  };

  const [title, setTitle] = useState(report?.title || "");

  useEffect(() => {
    if (!report?.id && !title) {
      setTitle(getDefaultTitle());
    }
  }, [direcao, departamento, reparticao, userLevel]);

  const [year, setYear] = useState(defaultYear);
  const [semester, setSemester] = useState(report?.semester || 1);
  const [isSyncing, setIsSyncing] = useState(false);

  const [stats, setStats] = useState<ReportData["stats"]>(
    report?.stats || {
      cursos: 7,
      novosIngressos: 0,
      matriculados: 0,
      desistentes: 0,
      bolseiros: 0,
      aproveitamento: 0,
      docentesGlobal: 0,
      ctaGlobal: 0,
      orcamentoEstado: 0,
      receitasProprias: 0,
      financiamentoParceiros: 0,
      titulosBiblioteca: 0,
    },
  );

  const [sections, setSections] = useState<
    { title: string; content: string }[]
  >(
    report?.sections || [
      { title: "Sumário Executivo", content: "" },
      { title: "Introdução", content: "" },
      { title: "Actividades Desenvolvidas", content: "" },
      { title: "Dificuldades e Recomendações", content: "" },
      { title: "Conclusão", content: "" },
    ],
  );

  const [technicalSheet, setTechnicalSheet] = useState<
    { name: string; role: string }[]
  >(
    report?.technicalSheet || [
      { name: user?.name || "", role: user?.role || user?.cargo || "" },
    ],
  );

  const handleLocalSave = async () => {
    setIsSyncing(true);
    await onSave({
      id: report?.id,
      title,
      direction: direcao,
      department: departamento,
      section: reparticao,
      year,
      semester: reportType === "Semestral" ? semester : undefined,
      type: reportType as any,
      stats,
      sections,
      technicalSheet,
    });
    setIsSyncing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto bg-white shadow-2xl min-h-screen flex flex-col mb-12"
    >
      <div className="sticky top-0 z-50 bg-white border-b p-4 flex justify-between items-center no-print">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 font-bold hover:text-gray-900"
        >
          <ArrowLeft size={18} /> Cancelar
        </button>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full  tracking-widest">
            {reportType}{" "}
            {reportType === "Semestral" ? `• ${semester}º Semestre` : ""}
          </span>
          <button
            onClick={handleLocalSave}
            disabled={isSyncing}
            className="bg-emerald-600 text-white px-8 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-100"
          >
            {isSyncing ? <ProcessingCircle size={18} /> : <Cloud size={18} />}
            {isSyncing ? "SINCRONIZANDO..." : "GUARDAR E SINCRONIZAR"}
          </button>
        </div>
      </div>

      <div className="p-12 flex-grow space-y-12 font-serif">
        <div className="text-center space-y-6 border-b-2 border-black pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 font-sans no-print text-left bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <div>
              <label className="block text-[10px] font-black text-gray-400 mb-1 ">
                Direção Responsável
              </label>
              <select
                value={direcao}
                onChange={(e) => setDirecao(e.target.value)}
                className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-sans outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione...</option>
                {UNIDADES_ORGANICAS_SISTEMA.flatMap(
                  (u) => u.direcoes || [],
                ).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 mb-1 ">
                Departamento/Setor
              </label>
              <select
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value)}
                className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-sans outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione...</option>
                {direcao &&
                  (DEPARTAMENTOS[direcao] || DEPARTAMENTOS[direcao])?.map(
                    (d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ),
                  )}
              </select>
            </div>
          </div>

          <div className="text-2xl font-black tracking-tight leading-tight text-center w-full ">
            {direcao || "Instituto Superior Politécnico de Songo"}
          </div>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-4xl font-black text-center w-full outline-none border-b border-transparent hover:border-gray-200 focus:border-blue-500 transition-colors  leading-tight"
            placeholder="Título do Relatório"
          />

          <div className="flex items-center justify-center gap-8 text-xl font-bold font-sans">
            <div className="flex items-center gap-3">
              <span>ANO DE</span>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-24 text-center outline-none border-b border-black font-black"
              />
            </div>

            {reportType === "Semestral" && (
              <div className="flex items-center gap-3 border-l-2 border-gray-100 pl-8">
                <span>SEMESTRE:</span>
                <select
                  value={semester}
                  onChange={(e) => setSemester(Number(e.target.value))}
                  className="bg-transparent border-b border-black font-black outline-none"
                >
                  <option value={1}>1º</option>
                  <option value={2}>2º</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* INDICADORES ESTATISTICOS SECTION */}
        <div className="space-y-8 border-b-2 border-black pb-12 font-sans">
          <h3 className="text-xl font-black flex items-center gap-2">
            <LayoutGrid size={24} /> INDICADORES E DADOS QUANTITATIVOS
          </h3>
          <p className="text-sm text-gray-500 italic">
            Insira os dados numéricos consolidados para este período.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
              <h4 className="text-xs font-black text-blue-600  tracking-widest">
                Ensino e Discentes
              </h4>
              <div className="space-y-3">
                {[
                  { label: "Cursos Ativos", key: "cursos" },
                  { label: "Novos Ingressos", key: "novosIngressos" },
                  { label: "Total Matriculados", key: "matriculados" },
                  { label: "Desistentes", key: "desistentes" },
                  { label: "Bolseiros", key: "bolseiros" },
                  { label: "Aproveitamento (%)", key: "aproveitamento" },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-4"
                  >
                    <label className="text-[10px] font-bold text-gray-500 ">
                      {item.label}
                    </label>
                    <input
                      type="number"
                      value={(stats as any)[item.key] || 0}
                      onChange={(e) =>
                        setStats({
                          ...stats,
                          [item.key]: Number(e.target.value),
                        })
                      }
                      className="w-20 p-1.5 bg-white border border-gray-200 rounded-lg text-right font-bold text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
              <h4 className="text-xs font-black text-purple-600  tracking-widest">
                Recursos Humanos
              </h4>
              <div className="space-y-3">
                {[
                  { label: "Docentes (Total)", key: "docentesGlobal" },
                  { label: "CTA (Total)", key: "ctaGlobal" },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-4"
                  >
                    <label className="text-[10px] font-bold text-gray-500 ">
                      {item.label}
                    </label>
                    <input
                      type="number"
                      value={(stats as any)[item.key] || 0}
                      onChange={(e) =>
                        setStats({
                          ...stats,
                          [item.key]: Number(e.target.value),
                        })
                      }
                      className="w-20 p-1.5 bg-white border border-gray-200 rounded-lg text-right font-bold text-xs"
                    />
                  </div>
                ))}
              </div>
              <h4 className="text-xs font-black text-emerald-600  tracking-widest pt-4">
                Biblioteca
              </h4>
              <div className="flex items-center justify-between gap-4">
                <label className="text-[10px] font-bold text-gray-500 ">
                  Títulos Disponíveis
                </label>
                <input
                  type="number"
                  value={stats?.titulosBiblioteca || 0}
                  onChange={(e) =>
                    setStats({
                      ...stats,
                      titulosBiblioteca: Number(e.target.value),
                    })
                  }
                  className="w-20 p-1.5 bg-white border border-gray-200 rounded-lg text-right font-bold text-xs"
                />
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
              <h4 className="text-xs font-black text-orange-600  tracking-widest">
                Finanças (em 10^3 MZN)
              </h4>
              <div className="space-y-3">
                {[
                  { label: "Orçamento Estado", key: "orcamentoEstado" },
                  { label: "Receitas Próprias", key: "receitasProprias" },
                  { label: "Financ. Parceiros", key: "financiamentoParceiros" },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-4"
                  >
                    <label className="text-[10px] font-bold text-gray-500 ">
                      {item.label}
                    </label>
                    <input
                      type="number"
                      value={(stats as any)[item.key] || 0}
                      onChange={(e) =>
                        setStats({
                          ...stats,
                          [item.key]: Number(e.target.value),
                        })
                      }
                      className="w-24 p-1.5 bg-white border border-gray-200 rounded-lg text-right font-bold text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 border-b-2 border-black pb-12">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <FileCheck size={20} /> FICHA TÉCNICA
          </h3>
          <div className="space-y-4">
            {technicalSheet.map((member, idx) => (
              <div key={idx} className="flex gap-4">
                <input
                  type="text"
                  value={member.name}
                  onChange={(e) => {
                    const newSheet = [...technicalSheet];
                    newSheet[idx].name = e.target.value;
                    setTechnicalSheet(newSheet);
                  }}
                  placeholder="Nome Completo"
                  className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-sans"
                />
                <input
                  type="text"
                  value={member.role}
                  onChange={(e) => {
                    const newSheet = [...technicalSheet];
                    newSheet[idx].role = e.target.value;
                    setTechnicalSheet(newSheet);
                  }}
                  placeholder="Cargo / Função"
                  className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-sans"
                />
                {technicalSheet.length > 1 && (
                  <button
                    onClick={() =>
                      setTechnicalSheet(
                        technicalSheet.filter((_, i) => i !== idx),
                      )
                    }
                    className="text-red-500 hover:text-red-700"
                  >
                    <Plus size={20} className="rotate-45" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() =>
                setTechnicalSheet([...technicalSheet, { name: "", role: "" }])
              }
              className="text-blue-600 font-bold hover:underline font-sans text-sm"
            >
              + ADICIONAR RESPONSÁVEL
            </button>
          </div>
        </div>

        <div className="space-y-12">
          {sections.map((section, idx) => {
            const isMasterReport = report?.level === "institucional";
            const userDirecao = user?.direcao || user?.direction || "";
            const canEdit =
              !isMasterReport ||
              userLevel === "institucional" ||
              (section as any).owner === userDirecao;

            return (
              <div
                key={idx}
                className={`space-y-4 ${!canEdit ? "bg-gray-50/50 p-6 rounded-3xl border border-dashed border-gray-200" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <span className="bg-black text-white w-8 h-8 flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={section.title}
                    disabled={isMasterReport} // Title is locked in Master Report
                    onChange={(e) => {
                      const newSections = [...sections];
                      newSections[idx].title = e.target.value;
                      setSections(newSections);
                    }}
                    className={`text-xl font-bold w-full outline-none border-b border-transparent ${!isMasterReport ? "hover:border-gray-200 focus:border-blue-500" : ""} transition-colors `}
                    placeholder="Título da Secção"
                  />
                  {!isMasterReport && sections.length > 1 && (
                    <button
                      onClick={() =>
                        setSections(sections.filter((_, i) => i !== idx))
                      }
                      className="text-red-500 hover:text-red-700"
                    >
                      <Plus size={20} className="rotate-45" />
                    </button>
                  )}
                </div>

                {!canEdit && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center gap-3 text-amber-700 text-[11px] font-black  tracking-tight no-print">
                    <Lock size={14} className="text-amber-500" />
                    ACESSO RESTRITO À:{" "}
                    {(section as any).owner || "NÍVEL INSTITUCIONAL"}
                  </div>
                )}

                <textarea
                  value={section.content}
                  disabled={!canEdit}
                  onChange={(e) => {
                    const newSections = [...sections];
                    newSections[idx].content = e.target.value;
                    setSections(newSections);
                  }}
                  rows={12}
                  className={`w-full p-8 ${canEdit ? "bg-gray-50" : "bg-white/50 cursor-not-allowed"} border border-gray-200 rounded-3xl outline-none ${canEdit ? "focus:ring-2 focus:ring-blue-500 focus:bg-white" : ""} resize-y text-justify leading-relaxed font-sans transition-all`}
                  placeholder={
                    canEdit
                      ? "Descreva as actividades e resultados aqui..."
                      : "Esta seção será preenchida pela direção responsável."
                  }
                />
              </div>
            );
          })}

          {!report?.level || report.level !== "institucional" ? (
            <button
              onClick={() =>
                setSections([
                  ...sections,
                  { title: "Nova Secção", content: "" },
                ])
              }
              className="w-full py-6 border-2 border-dashed border-gray-200 text-gray-400 font-bold rounded-2xl hover:border-blue-500 hover:text-blue-600 transition-all flex items-center justify-center gap-2 bg-gray-50/50"
            >
              <Plus size={20} /> ADICIONAR NOVA SECÇÃO AO RELATÓRIO
            </button>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { openPrintDocumentWindow } from "../../lib/printUtils";
import {
  Send,
  CheckCircle2,
  FileText,
  LayoutGrid,
  Printer,
  TrendingUp,
  Filter,
  Search,
  Plus,
  Trash2,
  Edit2,
  Building2,
  ArrowRight,
  UserCheck,
  AlertCircle,
  Clock,
  BarChart3,
  Info,
  ChevronRight,
  Calendar,
  Lock,
  Upload,
  FileUp,
  Archive,
  RefreshCw,
  Copy,
  Maximize2,
  Minimize2,
  Eye,
  X,
  Download,
  ChevronDown,
  Save,
  PlayCircle,
  Folder,
  Users,
  Layers,
  Inbox,
  ShieldCheck,
} from "lucide-react";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "motion/react";
import { InstitutionalHeader } from "../../components/InstitutionalHeader";
import { firestoreService } from "../../lib/firestoreService";
import { getActivityTotal } from "./systemUtils";
import { MatrixActivity } from "../../types";
import {
  getAuthorizedActivities,
  isSuperBossUser,
  getRoles,
  canAccessArea,
} from "../../lib/auth";
import {
  isMatch,
  getDepartmentAbbreviation,
  getDirectionAbbreviation,
  getReparticaoAbbreviation,
  getActivityInitials,
  getCircularReplacer,
  safeJSONStringify,
} from "../../lib/utils";
import { EFETIVO_GERAL_DATA } from "../../constants/colaboradoresList";
import { determineSectorAllocation } from "../../lib/allocationUtils";
import { printElementById, printActivitiesPlanDocument } from "../../lib/printUtils";
import {
  getDirectionPriority,
  compareDirections,
  compareActivitiesStandardOrder,
  renderActivityRubricas,
  normalizeHeaderString,
  getExcelRowValue,
  getLatestWorkflowActivities,
  getActivityDisplayNo,
  getActivityGroup,
  getActMonthIndex,
  formatSafeDate,
  isDuplicateActivity,
  isValidActivity,
  ActivitySelectionContext,
  getParentRubrica,
} from "./plano/PlanoHelpers";
import { ActivityTableHeader } from "./plano/ActivityTableHeader";
import { ActivityTableRow } from "./plano/ActivityTableRow";
import {
  isSalaryActivity,
  getIsUserHR as isUserHRFunc,
  getDirectionKeysMatched,
  isDepartmentMatch,
} from "./plano/PlanoLogic";
import { usePlanoPermissions } from "./plano/usePlanoPermissions";
import ActivityForm from "../bloco5_sistema/ActivityForm";
import { DPEPDashboard } from "../../components/DPEPDashboard";
import {
  DEPARTAMENTOS,
  REPARTICOES,
  SECTORES,
  MESES,
  FONTES_RECEITA,
  PRIORIDADES,
} from "../../constants/formOptions";

// Standard divisions and sectors of Songo for mock grouping if not filled
const DEV_SECTORS = Object.keys(REPARTICOES);

const GABINETES_DESTINATARIOS = [
  "Gabinete do Diretor Geral",
  "Direção Administrativa e Financeira (DAF)",
  "Direção Acadêmica",
  "Direção de Planificação e Estudos (DPEP)",
  "Direção de Extensão",
  "Direção de Investigação e Pós-Graduação",
  "Departamento de Recursos Humanos",
  "Departamento de Finanças",
  "UGEA",
  "Secretaria Geral",
  "Conselho de Direção",
  "Conselho Académico",
];

interface PlanoWorkflowViewProps {
  user: any;
  title: string;
  matrixActivities: MatrixActivity[];
  colaboradores?: any[];
  onAddMatrixActivity: (data: any) => Promise<string | undefined>;
  onUpdateMatrixActivity: (id: string, data: any) => Promise<void>;
  onShowAlert: (msg: string) => void;
  onBack: () => void;
}


export default function PlanoWorkflowView({
  user: realUser,
  title,
  matrixActivities: initialActivities,
  colaboradores: externalColaboradores = [],
  onAddMatrixActivity,
  onUpdateMatrixActivity,
  onShowAlert,
  onBack,
}: PlanoWorkflowViewProps) {
  const [simulateSector, setSimulateSector] = useState(true);

  const user = useMemo(() => {
    const isCD_base =
      String(title || "").toUpperCase().includes("DEPARTAMENTO") ||
      String(title || "").toUpperCase().includes("CHEFE");
    const isDC_base =
      String(title || "").toUpperCase().includes("DIRETOR") ||
      String(title || "").toUpperCase().includes("DICO") ||
      String(title || "").toUpperCase().trim() === "DIRETOR GERAL";
    const isReparticao_base = String(title || "").toUpperCase().includes("REPARTIÇÃO");
    const isPlanificacao_base =
      String(title || "").toUpperCase().includes("PLANIFICAÇÃO") ||
      String(title || "").toUpperCase().includes("ESTUDOS") ||
      String(title || "").toUpperCase().includes("PLANEAMENTO");

    if (
      isSuperBossUser(realUser) &&
      simulateSector &&
      title &&
      title !== "Plano Setorial" &&
      title !== "Sistema" &&
      title !== "Geral"
    ) {
      return {
        ...realUser,
        direcao: isDC_base ? title : realUser?.direcao,
        departamento: isCD_base ? title : realUser?.departamento,
        reparticao: isReparticao_base ? title : realUser?.reparticao,
        setor:
          !isDC_base && !isCD_base && !isReparticao_base && !isPlanificacao_base
            ? title
            : realUser?.setor,
        title: title,
      };
    }
    return realUser;
  }, [realUser, simulateSector, title]);

  const { isAllocated, isDPEP } = usePlanoPermissions(user, title);
  
  if (!isAllocated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="p-12 text-center bg-red-50 rounded-3xl border border-red-200">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-red-900 mb-2">Acesso Restrito</h2>
          <p className="text-red-700">Utilizador não alocado corretamente a uma direção ou unidade.</p>
        </div>
      </div>
    );
  }

  const [rawActivities, setRawActivities] = useState(initialActivities);

  useEffect(() => {
    setRawActivities(initialActivities);
  }, [initialActivities]);

  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showTramitacaoModal, setShowTramitacaoModal] = useState(false);
  const [selectedDestinatario, setSelectedDestinatario] = useState("");
  const [workflowToProcess, setWorkflowToProcess] = useState<{
    fromStatus: string;
    toStatus: string;
    originLabel: string;
    destinationLabel: string;
    targetActivities?: any[];
  } | null>(null);
  const [activityForHistory, setActivityForHistory] = useState<any | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(2027);
  const isReadOnly = selectedYear < 2027;
  const [showYearMenu, setShowYearMenu] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState("");
  const [previewActivities, setPreviewActivities] = useState<any[]>([]);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importFileName, setImportFileName] = useState("");
  const [syncYear, setSyncYear] = useState<number>(2027);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");

  // Novo estado para gerir o fluxo de planeamento/consulta
  // Add print styles for A3
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        @page {
          size: A3 landscape;
          margin: 10mm;
        }
        body {
          -webkit-print-color-adjust: exact;
        }
        .print-a3-container {
          width: 100% !important;
          max-width: none !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const [workflowMode, setWorkflowMode] = useState<
    "landing" | "planning" | "consulting"
  >("landing");

  const userRoles = useMemo(
    () => getRoles(user?.title || user?.cargo || user?.cargoChefia || ""),
    [user],
  );
  const isBossOrAdmin = userRoles.isBoss || isSuperBossUser(user);

  useEffect(() => {
    if (isSyncModalOpen) {
      const loadPlans = async () => {
        const archiveDocs = await firestoreService.institucional_plans.get();
        const docsFromArchive = await firestoreService.archive_documents.get();
        const plans = [
          ...archiveDocs.filter(
            (p: any) =>
              (p.ano === syncYear || p.year === syncYear) &&
              (p.atividades || p.activities),
          ),
          ...docsFromArchive.filter(
            (p: any) =>
              (p.ano === syncYear || p.year === syncYear) &&
              (p.atividades ||
                p.activities ||
                p.planoAtividades ||
                p.title?.toLowerCase().endsWith(".pdf") ||
                p.title?.toLowerCase().endsWith(".xlsx")),
          ),
        ];
        setAvailablePlans(plans);
        if (plans.length > 0) {
          setSelectedPlanId(plans[0].id);
        } else {
          setSelectedPlanId("");
        }
      };
      loadPlans();
    }
  }, [syncYear, isSyncModalOpen]);

  useEffect(() => {
    if (showTramitacaoModal && workflowToProcess) {
      const { toStatus, targetActivities } = workflowToProcess;
      let options: string[] = [];

      const sampleAct = (targetActivities && targetActivities.length > 0)
        ? targetActivities[0]
        : (rawActivities && rawActivities.length > 0 ? rawActivities[0] : null);

      if (toStatus === "reparticao") {
        const rep = user?.reparticao || sampleAct?.reparticao || "Repartição";
        options = [rep];
      } else if (toStatus === "departamento") {
        const dep = user?.departamento || sampleAct?.departamento || "Departamento";
        options = [dep];
      } else if (toStatus === "direcao") {
        const dir = user?.direcao || sampleAct?.direcao || "Direção";
        options = [dir];
      } else if (toStatus === "planificacao") {
        options = ["Setor de Planificação (DPEP)", "Departamento de Planificação Estudos e Projetos (DPEP)"];
      } else if (toStatus === "dpep_chefe") {
        options = ["Chefe do DPEP (Departamento de Planificação Estudos e Projetos)"];
      } else if (toStatus === "institucional" || toStatus === "meritos") {
        options = ["Conselho de Direção", "Gabinete do Diretor Geral"];
      }
      
      const validOptions = options.filter(o => o && o.trim() !== "");
      if (validOptions.length > 0) {
        setSelectedDestinatario(validOptions[0]);
      }
    }
  }, [showTramitacaoModal, workflowToProcess, user, rawActivities]);

  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDirecao, setFilterDirecao] = useState("");

  // Detect real role
  const isChefeDPEP =
    title.toUpperCase().trim() === "CHEFE DO DPEP" ||
    title.toUpperCase().includes("DPEP") ||
    String(user?.departamento || "").toUpperCase().includes("DPEP");

  const isCD =
    title.toUpperCase().includes("DEPARTAMENTO") ||
    title.toUpperCase().includes("CHEFE");
  const isDC =
    title.toUpperCase().includes("DIRETOR") ||
    title.toUpperCase().includes("DICO") ||
    title.toUpperCase().trim() === "DIRETOR GERAL";
  const isPlanificacao =
    isChefeDPEP ||
    user?.role === "planificador" ||
    title.toUpperCase().includes("PLANIFICAÇÃO") ||
    title.toUpperCase().includes("ESTUDOS") ||
    title.toUpperCase().includes("PLANEAMENTO");

  const isAdminOrProgrammer = isSuperBossUser(user);

  // Let the user switch roles in sandbox mode for interactive testing!
  const [selectedRoleMode, setSelectedRoleMode] = useState<string>(
    isPlanificacao
      ? "Planificação"
      : isDC
        ? "Direção"
        : isCD
          ? "Departamento"
          : title.toUpperCase().includes("REPARTIÇÃO") ||
              (user?.titulo || "").toUpperCase().includes("REPARTIÇÃO")
            ? "Repartição"
            : "Setor",
  );

  const [showReceivedPlans, setShowReceivedPlans] = useState(false);

  const groupByDirecao = useCallback(
    (activities: any[]): Record<string, any[]> => {
      const grouped: Record<string, any[]> = {};
      activities.forEach((activity) => {
        if (!isValidActivity(activity)) return;
        const direcao = activity.direcao || activity.unidadeOrganica || activity.origin || "";
        if (!direcao || direcao === "-" || direcao.toLowerCase() === "departamento geral") return;
        if (!grouped[direcao]) {
          grouped[direcao] = [];
        }
        grouped[direcao].push(activity);
      });
      return grouped;
    },
    [],
  );

  const groupByDepartamento = useCallback(
    (activities: any[]): Record<string, any[]> => {
      const grouped: Record<string, any[]> = {};
      activities.forEach((activity) => {
        if (!isValidActivity(activity)) return;
        const dept = activity.departamento || activity.setor || activity.reparticao || "";
        if (!dept || dept === "-") return;
        if (!grouped[dept]) {
          grouped[dept] = [];
        }
        grouped[dept].push(activity);
      });
      return grouped;
    },
    [],
  );

  const authorizedActivities = useMemo(() => {
    if (!rawActivities) return [];

    // Filtrar apenas atividades válidas e depois por ano
    const validActs = rawActivities.filter(isValidActivity);

    let yearFiltered = validActs.filter((a) => {
      if (!a) return false;
      if (!a.ano) return true;
      return Number(a.ano) === Number(selectedYear);
    });

    if (yearFiltered.length === 0 && validActs.length > 0) {
      yearFiltered = validActs;
    }

    return getAuthorizedActivities(yearFiltered, user);
  }, [rawActivities, selectedYear, user]);

  const filteredActivities = useMemo(() => {
    let authorized = [...authorizedActivities].filter(isValidActivity);

    // Aplicar termo de busca
    if (searchTerm) {
      const s = String(searchTerm || "").toLowerCase();
      authorized = authorized.filter(
        (a) =>
          String(a.designacao || a.title || "")
            .toLowerCase()
            .includes(s) ||
          String(a.objetivo || "")
            .toLowerCase()
            .includes(s) ||
          String(a.referencia || "")
            .toLowerCase()
            .includes(s) ||
          String(a.setor || a.reparticao || "")
            .toLowerCase()
            .includes(s),
      );
    }

    // Filtro especial para o Setor de Planificação - agora mostra todas as atividades autorizadas
    if (user && isSuperBossUser(user) && simulateSector) {
      const target = (title || "").trim().toLowerCase();
      if (
        target &&
        target !== "plano setorial" &&
        target !== "sistema" &&
        target !== "geral"
      ) {
        authorized = authorized.filter((a) => {
          if (!a) return false;
          const aDir = String(a.direcao || "").toLowerCase();
          const aDept = String(a.departamento || "").toLowerCase();
          const aSect = String(a.setor || a.reparticao || "").toLowerCase();
          const aUOrg = String(a.unidadeOrganica || "").toLowerCase();

          return (
            aDir.includes(target) ||
            target.includes(aDir) ||
            aDept.includes(target) ||
            target.includes(aDept) ||
            aSect.includes(target) ||
            target.includes(aSect) ||
            aUOrg.includes(target) ||
            target.includes(aUOrg)
          );
        });
      }
    }

    const uniqueMap = new Map<string, any>();
    authorized.forEach((a) => {
      if (!a || !isValidActivity(a)) return;
      const key = a.id ? `id-${a.id}` : `${a.codigoAtividade || a.referencia || ""}-${a.designacao || a.title || ""}-${a.direcao || ""}-${a.setor || ""}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, a);
      }
    });

    const sortedList = Array.from(uniqueMap.values())
      .sort((a, b) => compareActivitiesStandardOrder(a, b, getActMonthIndex));

    const yearMatches = sortedList.filter((a) => Number(a?.ano || selectedYear) === Number(selectedYear));
    return yearMatches.length > 0 ? yearMatches : sortedList;
  }, [
    authorizedActivities,
    user,
    selectedYear,
    searchTerm,
    selectedRoleMode,
    simulateSector,
    title,
    getActMonthIndex,
  ]);

  const filteredActivitiesGrouped = useMemo(() => {
    const validActivities = filteredActivities.filter(isValidActivity);
    const byDirecao = groupByDirecao(validActivities);
    const result: Record<string, Record<string, any[]>> = {};

    Object.entries(byDirecao).forEach(([direcao, activities]) => {
      const validGroupActs = (activities as any[]).filter(isValidActivity);
      if (validGroupActs.length > 0) {
        const byDept = groupByDepartamento(validGroupActs);
        const validDepts: Record<string, any[]> = {};

        Object.entries(byDept).forEach(([dept, deptActivities]) => {
          const validDeptActs = (deptActivities as any[]).filter(isValidActivity);
          if (validDeptActs.length > 0) {
            validDepts[dept] = validDeptActs;
          }
        });

        // Se houver departamentos válidos com atividades válidas
        if (Object.keys(validDepts).length > 0) {
          result[direcao] = validDepts;
        } else if (validGroupActs.length > 0) {
          // Fallback se nenhum sub-departamento tiver sido mapeado
          result[direcao] = { [direcao]: validGroupActs };
        }
      }
    });

    return { byDirecao, byDirecaoAndDept: result };
  }, [filteredActivities, groupByDirecao, groupByDepartamento]);

  const startSyncProcess = async () => {
    setSyncYear(selectedYear);
    setIsSyncModalOpen(true);
  };

  const onUpdateExecution = async (activityId: string, execucao: string) => {
    try {
      await firestoreService.matrixActivities.update(activityId, { execucao });
      onShowAlert(`Estado de execução atualizado para: ${execucao}`);
    } catch (err) {
      console.error(err);
      alert("Falha ao atualizar estado de execução.");
    }
  };

  const onUpdateRelatorio = async (activityId: string, relatorio: string) => {
    try {
      await firestoreService.matrixActivities.update(activityId, { relatorio });
      onShowAlert(`Relatório da atividade atualizado com sucesso.`);
    } catch (err) {
      console.error(err);
      alert("Falha ao atualizar relatório da atividade.");
    }
  };

  const onUpdateApproval = async (
    activityId: string,
    approvalStatus: string,
  ) => {
    try {
      const act = rawActivities.find((a) => a.id === activityId);
      if (!act) return;
      const group = getActivityGroup(act, rawActivities);
      const groupIds =
        group.map((g) => g.id).length > 0
          ? group.map((g) => g.id)
          : [activityId];

      for (const id of groupIds) {
        await firestoreService.matrixActivities.update(id, {
          statusAprovacao: approvalStatus,
          aprovada: approvalStatus === "aprovada",
        });
      }

      setRawActivities((prev) =>
        prev.map((a) =>
          groupIds.includes(a.id)
            ? {
                ...a,
                statusAprovacao: approvalStatus,
                aprovada: approvalStatus === "aprovada",
              }
            : a,
        ),
      );
      onShowAlert(
        `Atividade e todas as rubricas/necessidades associadas marcadas como: ${approvalStatus === "aprovada" ? "Aprovada" : approvalStatus}`,
      );
    } catch (err) {
      console.error(err);
      onShowAlert("Erro ao atualizar estado de aprovação.");
    }
  };

  const onRolloverYear = async (activityId: string) => {
    try {
      const act = rawActivities.find((a) => a.id === activityId);
      if (!act) return;
      const group = getActivityGroup(act, rawActivities);
      const groupIds =
        group.map((g) => g.id).length > 0
          ? group.map((g) => g.id)
          : [activityId];

      const currentYear = Number(act.ano || selectedYear || 2027);
      const nextYear = currentYear + 1;

      for (const id of groupIds) {
        await firestoreService.matrixActivities.update(id, { ano: nextYear });
      }

      setRawActivities((prev) =>
        prev.map((a) =>
          groupIds.includes(a.id) ? { ...a, ano: nextYear } : a,
        ),
      );
      onShowAlert(
        `Atividade e toda a sua coluna, rubricas e necessidades reconduzidas com sucesso para o ano ${nextYear}!`,
      );
    } catch (err) {
      console.error(err);
      onShowAlert("Erro ao reconduzir atividade para o ano+1.");
    }
  };

  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);

  const handleToggleSelectActivity = (id: string) => {
    const act = rawActivities.find((a) => a.id === id);
    if (!act) return;
    const group = getActivityGroup(act, rawActivities);
    const groupIds = group.map((g) => g.id).filter(Boolean);
    if (groupIds.length === 0) groupIds.push(id);

    const allSelected = groupIds.every((item) =>
      selectedActivityIds.includes(item),
    );
    if (allSelected) {
      setSelectedActivityIds((prev) =>
        prev.filter((item) => !groupIds.includes(item)),
      );
    } else {
      const newSet = new Set([...selectedActivityIds, ...groupIds]);
      setSelectedActivityIds(Array.from(newSet));
    }
  };

  const handleToggleSelectAll = (allActivities: any[]) => {
    const allIds = allActivities.map((a) => a.id).filter(Boolean);
    const allSelected = allIds.every((id) => selectedActivityIds.includes(id));
    if (allSelected) {
      setSelectedActivityIds((prev) =>
        prev.filter((id) => !allIds.includes(id)),
      );
    } else {
      const newSet = new Set([...selectedActivityIds, ...allIds]);
      setSelectedActivityIds(Array.from(newSet));
    }
  };

  const handleBulkUpdateApproval = async (approvalStatus: string) => {
    if (selectedActivityIds.length === 0) {
      onShowAlert("Selecione pelo menos uma atividade.");
      return;
    }
    try {
      for (const id of selectedActivityIds) {
        await firestoreService.matrixActivities.update(id, {
          statusAprovacao: approvalStatus,
          aprovada: approvalStatus === "aprovada",
        });
      }
      setRawActivities((prev) =>
        prev.map((a) =>
          selectedActivityIds.includes(a.id)
            ? {
                ...a,
                statusAprovacao: approvalStatus,
                aprovada: approvalStatus === "aprovada",
              }
            : a,
        ),
      );
      onShowAlert(
        `${selectedActivityIds.length} atividades marcadas como: ${approvalStatus === "aprovada" ? "Aprovadas" : approvalStatus}`,
      );
      setSelectedActivityIds([]);
    } catch (err) {
      console.error(err);
      onShowAlert("Erro ao atualizar estado de aprovação em lote.");
    }
  };

  const handleBulkRolloverYear = async () => {
    if (selectedActivityIds.length === 0) {
      onShowAlert("Selecione pelo menos uma atividade.");
      return;
    }
    try {
      for (const id of selectedActivityIds) {
        const act = rawActivities.find((a) => a.id === id);
        if (!act) continue;
        const currentYear = Number(act.ano || selectedYear || 2027);
        const nextYear = currentYear + 1;
        await firestoreService.matrixActivities.update(id, { ano: nextYear });
      }
      setRawActivities((prev) =>
        prev.map((a) => {
          if (!selectedActivityIds.includes(a.id)) return a;
          const currentYear = Number(a.ano || selectedYear || 2027);
          return { ...a, ano: currentYear + 1 };
        }),
      );
      onShowAlert(
        `${selectedActivityIds.length} atividades reconduzidas com sucesso para o ano+1!`,
      );
      setSelectedActivityIds([]);
    } catch (err) {
      console.error(err);
      onShowAlert("Erro ao reconduzir atividades em lote para o ano+1.");
    }
  };

  const handleFileConversion = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      setImportProgress(0);
      setProcessingStatus("Iniciando digitalização...");

      const reader = new FileReader();
      
      const readFile = () => new Promise((resolve, reject) => {
        reader.onload = (e) => resolve(e.target?.result);
        reader.onerror = () => reject(new Error("Erro ao ler o ficheiro físico."));
        reader.readAsArrayBuffer(file);
      });

      setProcessingStatus("A ler o ficheiro físico...");
      setImportProgress(10);
      
      const buffer = await readFile();
      
      setProcessingStatus("A converter para formato digital...");
      setImportProgress(30);

      const data = new Uint8Array(buffer as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      const json: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (json.length === 0) {
        onShowAlert("O ficheiro importado parece estar vazio ou em formato inválido.");
        setIsProcessing(false);
        return;
      }

      setImportProgress(50);
      setProcessingStatus("A processar mapeamento SIGEP...");
      await new Promise(r => setTimeout(r, 600));

        const mapActivity = (row: any, index: number) => {
          const findVal = (keys: string[]) => {
            const foundKey = Object.keys(row).find((k) =>
              keys.some((search) =>
                String(k).toLowerCase().trim().includes(search.toLowerCase().trim()),
              ),
            );
            return foundKey ? row[foundKey] : undefined;
          };

          const toNum = (val: any) => {
            if (typeof val === "number") return val;
            if (!val) return 0;
            const clean = String(val).replace(/[^\d.-]/g, "");
            return isNaN(Number(clean)) ? 0 : Number(clean);
          };

          const actBase = { ...row };
          
          // Mapeamento Robusto de Custos e Recursos
          const quantity = toNum(findVal(["pessoas", "quantidade", "qtd", "nº de pessoas", "n de pessoas", "n de participantes", "quant", "qnt"]));
          const unitPrice = toNum(findVal(["unitário", "preço", "valor unit", "custo unitário", "valor", "preco unitario", "unit", "preco"]));
          const reportedTotal = toNum(findVal(["total", "valor total", "orçamento", "custo total", "orcamento"]));
          
          // Se o total não vier no Excel, calculamos
          const finalTotal = reportedTotal || (quantity * unitPrice);

          const mapped = {
            no: findVal(["nº", "numero", "id", "item", "ordem", "seq"]) || index + 1,
            numeroDirecao: findVal(["nº direção", "numero direcao", "n direcao", "ordem direção", "nº direcao"]),
            codigoAtividade: findVal(["codigo", "referência", "ref", "nº atividade", "código"]),
            title: findVal(["atividade", "designação", "descrição", "nome", "acção", "projeto", "tarefa", "acao", "designacao"]),
            objetivoAtividade: findVal(["objetivo", "meta", "finalidade", "proposito", "justificação", "justificacao", "objetivo geral"]),
            unidadeOrganica: findVal(["unidade", "isps", "instituição", "uo", "instituicao"]),
            direcao: findVal(["direção", "direccão", "direcao", "direccao"]),
            departamento: findVal(["departamento", "depto", "dept"]),
            reparticao: findVal(["repartição", "sector", "seção", "secção", "área", "reparticao", "area"]),
            setor: findVal(["setor", "sector", "seção", "secção", "área", "unidade orgânica"]),
            responsavel: findVal(["responsável", "ponto focal", "quem", "executor", "técnico", "responsavel"]),
            trimestre: findVal(["trimestre", "período", "quarta", "trim", "periodo"]),
            mesRealizacao: findVal(["mês", "tempo", "data", "quando", "mes", "meses"]),
            fonteReceita: findVal(["fonte", "recurso", "orçamento", "oe", "financiamento", "orcamento"]),
            prioridade: findVal(["prioridade", "importância", "urgência", "importancia"]) || "Média",
            trabalhoProvincia: findVal(["província", "local", "onde", "provincia"]) || "Tete",
            trabalhoDistrito: findVal(["distrito", "município", "distrito", "municipio"]) || "Cahora Bassa",
            necessitaTransporte: findVal(["transporte", "viagem", "deslocação", "transp"]) ? "Sim" : "Não",
            viatura: findVal(["viatura", "carro", "veículo", "veiculo"]),
            distanciaKm: toNum(findVal(["distancia", "km", "quilómetros", "klm", "quilometros"])),
            litrosGasoleo: toNum(findVal(["litros", "combustível", "gasóleo", "gasoleo", "combustivel"])),
            precoLitro: toNum(findVal(["preço litro", "valor litro", "combustível unitário", "preco litro"])) || 95,
            rubrica: findVal(["rubrica", "conta", "classificação", "classificacao", "rub"]),
            necessidade: findVal(["necessidade", "material", "recurso necessário", "recursos", "produto", "artigo"]),
            especificacoes: findVal(["especificações", "características", "especificacao", "especificacoes"]),
            detalhes: findVal(["detalhes", "pormenores", "info", "informação"]),
            numeroPessoas: quantity || 1,
            unitario: unitPrice,
            ajudaCusto: 0,
            total: finalTotal,
            ano: selectedYear,
            submetido: false,
            execucao: "Não Executada",
            tipoPlano: findVal(["tipo", "categoria", "plano", "tipo plano"]) || "Setorial",
            observacoes: findVal(["obs", "notas", "comentários", "anotações", "observação"]),
            createdAt: new Date().toISOString(),
          };
          return { ...actBase, ...mapped };
        };

      const mappedActivitiesRaw = json.map((row, idx) => {
        if (idx % 10 === 0) {
          const currentProgress = 50 + Math.floor((idx / json.length) * 40);
          setImportProgress(currentProgress);
        }
        return mapActivity(row, idx);
      });

      // Agrupamento Inteligente de Atividades e Rubricas
      const aggregatedActivities: any[] = [];
      mappedActivitiesRaw.forEach((mapped) => {
        const lastAct = aggregatedActivities[aggregatedActivities.length - 1];
        
        // Critérios para considerar a mesma atividade (Nº igual ou Título igual)
        const isSameActivity = lastAct && (
          (String(mapped.no) === String(lastAct.no)) || 
          (String(mapped.title).trim().toLowerCase() === String(lastAct.title).trim().toLowerCase() && mapped.title && lastAct.title)
        );

        if (isSameActivity) {
          if (!lastAct.rubricas) {
            lastAct.rubricas = [{
              rubrica: lastAct.rubrica,
              necessidade: lastAct.necessidade,
              especificacoes: lastAct.especificacoes,
              detalhes: lastAct.detalhes,
              quantidade: lastAct.numeroPessoas || lastAct.quantidade || 0,
              numeroPessoas: lastAct.numeroPessoas || 0,
              precoUnitario: lastAct.unitario || 0,
              valorTotal: lastAct.total || 0,
            }];
          }
          lastAct.rubricas.push({
            rubrica: mapped.rubrica,
            necessidade: mapped.necessidade,
            especificacoes: mapped.especificacoes,
            detalhes: mapped.detalhes,
            quantidade: mapped.numeroPessoas || mapped.quantidade || 0,
            numeroPessoas: mapped.numeroPessoas || 0,
            precoUnitario: mapped.unitario || 0,
            valorTotal: mapped.total || 0,
          });
          lastAct.total = (lastAct.total || 0) + (mapped.total || 0);
        } else {
          aggregatedActivities.push({
            ...mapped,
            rubricas: [{
              rubrica: mapped.rubrica,
              necessidade: mapped.necessidade,
              especificacoes: mapped.especificacoes,
              detalhes: mapped.detalhes,
              quantidade: mapped.numeroPessoas || mapped.quantidade || 0,
              numeroPessoas: mapped.numeroPessoas || 0,
              precoUnitario: mapped.unitario || 0,
              valorTotal: mapped.total || 0,
            }]
          });
        }
      });

      const finalActivities = aggregatedActivities.sort((a, b) => {
        const noA = typeof a.no === "number" ? a.no : parseInt(String(a.no || "").replace(/[^\d]/g, "")) || 0;
        const noB = typeof b.no === "number" ? b.no : parseInt(String(b.no || "").replace(/[^\d]/g, "")) || 0;
        return noA - noB;
      });

      setImportProgress(100);
      setProcessingStatus("Digitalização Concluída!");
      await new Promise(r => setTimeout(r, 600));

      setPreviewActivities(finalActivities);
      setImportFileName(file.name);
      setShowImportPreview(true);
    } catch (error) {
      console.error("Erro no processamento:", error);
      onShowAlert("Erro técnico ao converter o ficheiro. Certifique-se que é um Excel válido.");
    } finally {
      setIsProcessing(false);
      setImportProgress(0);
      if (event.target) event.target.value = "";
    }
  };

  const handleConfirmImport = async () => {
    if (previewActivities.length === 0) return;
    
    setIsProcessing(true);
    setImportProgress(0);
    try {
      setProcessingStatus(`A preparar base de dados para o ciclo ${selectedYear}...`);
      setImportProgress(5);

      // 1. Limpeza do Ciclo de Planificação Atual
      const existingActivities = await firestoreService.matrixActivities.get();
      const toDelete = existingActivities.filter(
        (act) =>
          act.ano === selectedYear &&
          (act.setor === user?.setor || act.userId === user?.uid),
      );

      for (let i = 0; i < toDelete.length; i++) {
        await firestoreService.matrixActivities.delete(toDelete[i].id);
        const delProgress = 5 + Math.floor((i / toDelete.length) * 15);
        setImportProgress(delProgress);
      }

      setProcessingStatus("A guardar cópia no arquivo morto...");
      setImportProgress(25);

      // 2. Salvar no Arquivo Morto
      await firestoreService.archive_documents.add({
        title: importFileName,
        type: "Planos de Atividades e Orçamentos",
        origin: user?.direcao || user?.departamento || user?.setor || "Unidade Importada",
        year: selectedYear,
        atividades: previewActivities,
        dataImportacao: new Date().toISOString(),
        formato: String(importFileName || "").split(".").pop()?.toUpperCase() || "EXCEL",
      });

      setImportProgress(30);
      setProcessingStatus(`A gravar ${previewActivities.length} atividades na base de dados...`);

      // 3. Injetar na base de dados ativa
      let importedCount = 0;
      for (let i = 0; i < previewActivities.length; i++) {
        const act = previewActivities[i];
        if (act.title || act.objetivoAtividade) {
          const unitario = Number(act.unitario || 0);
          const qtd = Number(act.numeroPessoas || 1);
          const ajuda = Number(act.ajudaCusto || 0);
          const totalCalculado = unitario * qtd + ajuda;

          await firestoreService.matrixActivities.add({
            ...act,
            total: act.total || totalCalculado,
            userId: user?.uid,
            userEmail: user?.email,
            setor: act.setor || act.reparticao || user?.setor || "Importado",
            unidadeSelecionada: act.unidadeOrganica || user?.unidadeOrganica || "Songo",
            direcao: act.direcao || user?.direcao || "-",
            departamento: act.departamento || user?.departamento || "-",
            dataSincronizacao: new Date().toISOString(),
          });
          importedCount++;
          
          // Progresso real da gravação (de 30% a 95%)
          const saveProgress = 30 + Math.floor((i / previewActivities.length) * 65);
          setImportProgress(saveProgress);
        }
      }

      setImportProgress(100);
      setProcessingStatus("Sincronização concluída!");
      await new Promise(r => setTimeout(r, 500));

      onShowAlert(`Ciclo de ${selectedYear} Atualizado: ${importedCount} atividades importadas!`);
      setShowImportPreview(false);
      setPreviewActivities([]);
    } catch (error) {
      console.error("Erro na importação:", error);
      onShowAlert("Falha ao gravar os dados na base de dados.");
    } finally {
      setIsProcessing(false);
      setImportProgress(0);
    }
  };

  const handleSyncPlano = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      let count = 0;
      let sourceActivities = [];

      // 1. Tentar buscar o plano selecionado ou priorizar o Institucional
      let selectedPlan = null;
      if (selectedPlanId) {
        selectedPlan = availablePlans.find((p) => p.id === selectedPlanId);
      } else {
        // Busca automática por Plano Institucional ou PESOE
        selectedPlan = availablePlans.find(
          (p) =>
            (p.title || "").toUpperCase().includes("INSTITUCIONAL") ||
            (p.title || "").toUpperCase().includes("PESOE"),
        );
      }

      if (selectedPlan) {
        console.log("Selected Plan:", selectedPlan);
        sourceActivities =
          selectedPlan.atividades ||
          selectedPlan.activities ||
          selectedPlan.planoAtividades;

        if (
          !sourceActivities &&
          (selectedPlan.title?.toLowerCase().endsWith(".pdf") ||
            selectedPlan.title?.toLowerCase().endsWith(".xlsx"))
        ) {
          onShowAlert(
            `O ficheiro ${selectedPlan.title} requer conversão. Por favor, utilize uma ferramenta de conversão externa.`,
          );
          setIsSyncModalOpen(false);
          setIsLoading(false);
          return;
        }
      }

      // 2. Fallback para os planos se nada for encontrado ou selecionado
      if (sourceActivities.length === 0) {
        // Removido fallbacks estáticos para manter sistema limpo
      }

      if (sourceActivities.length === 0) {
        onShowAlert(
          `Não foram encontradas atividades para o ano ${syncYear} no Arquivo Morto.`,
        );
        setIsSyncModalOpen(false);
        setIsLoading(false);
        return;
      }

      const userRoles = getRoles(
        user.title || user.cargo || user.cargoChefia || "",
      );
      const isSongo = (user.direcao || "").toUpperCase().includes("Songo");

      const userActivities = sourceActivities.filter((activity: any) => {
        const aDir = (activity.direcao || "").toUpperCase();
        const aDept = String(activity.departamento || "").toUpperCase();
        const aSect = (
          activity.setor ||
          activity.reparticao ||
          ""
        ).toUpperCase();

        const uDir = (user.direcao || "").toUpperCase();
        const uDept = String(user.departamento || "").toUpperCase();
        const uSect = (user.reparticao || user.setor || "").toUpperCase();

        const matchDir = aDir === uDir || (isSongo && aDir.includes("Songo"));
        const matchDept = aDept === uDept;
        const matchSect =
          aSect === uSect || aSect.includes(uSect) || uSect.includes(aSect);

        // Strict filtering: each user only syncs their own sector's activities
        if (userRoles.isCR) return matchDir && matchDept && matchSect;
        if (userRoles.isCD) return matchDir && matchDept;
        if (userRoles.isDC) return matchDir;

        return matchDir && matchDept && matchSect;
      });

      if (userActivities.length === 0) {
        onShowAlert(
          `Não foram encontradas atividades específicas do seu setor no Plano ${syncYear} institucional.`,
        );
        setIsSyncModalOpen(false);
        setIsLoading(false);
        return;
      }

      for (const activity of userActivities) {
        const ref = activity.referencia || activity.codigoAtividade;
        const exists = rawActivities.some(
          (a) =>
            (a.referencia === ref || a.codigoAtividade === ref) &&
            a.ano === syncYear,
        );

        if (!exists) {
          await firestoreService.matrixActivities.add({
            ...activity,
            ano: syncYear,
            createdAt: new Date().toISOString(),
            title: activity.designacao || activity.title,
            objetivoAtividade: activity.objetivo || activity.objetivoAtividade,
            no: ref ? String(ref).split("/")[0].replace("A", "") : "00",
            isPESOE: false,
            submetido: false,
            requiresUpdate: true,
            isImported: true,
            direcao: activity.direcao,
            departamento: activity.departamento,
            reparticao: activity.setor || activity.reparticao,
            unidadeOrganica: activity.direcao,
          } as any);
          count++;
        }
      }

      if (count > 0) {
        onShowAlert(
          `Sucesso: ${count} atividades do seu plano foram sincronizadas com base no Arquivo Morto.`,
        );
        setIsSyncModalOpen(false);
      } else {
        onShowAlert(
          `As atividades do ano ${syncYear} já constam no seu plano de atividades.`,
        );
        setIsSyncModalOpen(false);
      }
    } catch (error: any) {
      console.error("Erro na sincronização:", error);
      onShowAlert(
        `Erro ao sincronizar plano: ${error?.message || "Tente novamente."}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Consolidação Orçamental Hierárquica:
  // 1. Orçamento do Departamento = soma do valor total de todas as atividades planificadas para o departamento
  // 2. Orçamento da Direção = soma dos orçamentos de todos os departamentos que respondem a essa direção
  // 3. Orçamento Institucional = soma dos orçamentos de todas as direções

  const deptBudgetTotal = useMemo(() => {
    const nonSalaryActs = filteredActivities.filter(
      (a) => !isSalaryActivity(a),
    );
    return nonSalaryActs.reduce((acc, act) => acc + getActivityTotal(act), 0);
  }, [filteredActivities]);

  const isUserHR = useMemo(() => isUserHRFunc(user, title), [user, title]);

  const deptSalaryTotal = useMemo(() => {
    // Lista estrita de departamentos de RH
    const validHRDepartments = ["RECURSOS HUMANOS", "DEPARTAMENTO DE RECURSOS HUMANOS", "RH", "DEPARTAMENTO DE RH"];
    const deptName = String(user?.departamento || title || "").trim().toUpperCase();
    
    // Comparação estrita
    const isThisDeptHR = validHRDepartments.includes(deptName);
    
    if (!isThisDeptHR && !isUserHR) return 0;
    
    const salaryActs = filteredActivities.filter((a) => {
        // A atividade só conta para o RH se o departamento dela for estritamente o RH
        const activityDept = String(a.departamento || "").trim().toUpperCase();
        return isSalaryActivity(a) && validHRDepartments.includes(activityDept);
    });
    
    return salaryActs.reduce((acc, act) => acc + getActivityTotal(act) * 12, 0);
  }, [filteredActivities, user, title, isUserHR]);

  const directionKey = getDirectionKeysMatched(title, user?.departamento);
  const departmentsForThisDirection =
    DEPARTAMENTOS[directionKey as keyof typeof DEPARTAMENTOS] ||
    DEPARTAMENTOS[directionKey] ||
    DEPARTAMENTOS["DICOSAFA"] ||
    [];

  const directionDepartmentBudgets = useMemo(() => {
    return departmentsForThisDirection.map((dept) => {
      const deptActs = filteredActivities.filter(
        (a) =>
          a.departamento === dept ||
          (dept === "Gabinete do Diretor-Geral" && !a.departamento),
      );
      const nonSalaryActs = deptActs.filter((a) => !isSalaryActivity(a));
      const budget = nonSalaryActs.reduce(
        (acc, act) => acc + getActivityTotal(act),
        0,
      );
      return {
        name: dept,
        count: nonSalaryActs.length,
        budget,
      };
    });
  }, [departmentsForThisDirection, filteredActivities]);

  const totalDirectionBudget = useMemo(() => {
    return directionDepartmentBudgets.reduce((acc, d) => acc + d.budget, 0);
  }, [directionDepartmentBudgets]);

  const directionSalaryBudget = useMemo(() => {
    const hasHRDept = departmentsForThisDirection.some(
      (d) => String(d || "").toUpperCase().includes("RH") || String(d || "").toUpperCase().includes("RECURSOS HUMANOS")
    );
    if (!hasHRDept) return 0;

    const dirActs = filteredActivities.filter((a) => {
      const deptName = String(a.departamento || "").toUpperCase();
      return deptName.includes("RH") || deptName.includes("RECURSOS HUMANOS");
    });
    const salaryActs = dirActs.filter((a) => isSalaryActivity(a));
    return salaryActs.reduce((acc, act) => acc + getActivityTotal(act) * 12, 0);
  }, [filteredActivities, departmentsForThisDirection]);

  const institutionalDirectionsBreakdown = useMemo(() => {
    const allDirections = [
      "Gabinete do Diretor-Geral",
      "Divisão de Engenharia",
      "DICOSAFA",
      "DICOSSER",
      "Centro de Incubação de Empresas",
    ];

    const yearActs = filteredActivities.filter((a) => {
      if (!a) return false;
      if (!a.ano) return true;
      return Number(a.ano) === Number(selectedYear);
    });

    return allDirections.map((dirName) => {
      const depts = DEPARTAMENTOS[dirName as keyof typeof DEPARTAMENTOS] || [];
      const deptBreakdown = depts.map((deptName) => {
        const deptActs = yearActs.filter(
          (a) =>
            String(a.departamento || "").toLowerCase() === deptName.toLowerCase() ||
            String(a.departamento || "")
              .toUpperCase()
              .includes(deptName.toUpperCase()) ||
            deptName
              .toUpperCase()
              .includes(String(a.departamento || "").toUpperCase()) ||
            (String(a.direcao || "").toLowerCase().includes(dirName.toLowerCase()) &&
              (!a.departamento || a.departamento === deptName)),
        );
        const nonSalaryActs = deptActs.filter((a) => !isSalaryActivity(a));
        const deptBudget = nonSalaryActs.reduce(
          (acc, act) => acc + getActivityTotal(act),
          0,
        );
        return {
          name: deptName,
          budget: deptBudget,
          count: nonSalaryActs.length,
        };
      });

      const dirDirectActs = yearActs.filter((a) => {
        const aDir = (a.direcao || "").toUpperCase();
        const matchDir =
          aDir.includes(dirName.toUpperCase()) ||
          dirName.toUpperCase().includes(aDir);
        const isAlreadyInDept = depts.some(
          (d) =>
            String(a.departamento || "").toUpperCase().includes(String(d || "").toUpperCase()) ||
            String(d || "").toUpperCase().includes(String(a.departamento || "").toUpperCase()),
        );
        return matchDir && !isAlreadyInDept;
      });

      const nonSalaryDirDirectActs = dirDirectActs.filter(
        (a) => !isSalaryActivity(a),
      );
      const directBudget = nonSalaryDirDirectActs.reduce(
        (acc, act) => acc + getActivityTotal(act),
        0,
      );
      const sumDeptsBudget =
        deptBreakdown.reduce((acc, d) => acc + d.budget, 0) + directBudget;

      return {
        name: dirName,
        depts: deptBreakdown,
        directionBudget: sumDeptsBudget,
        totalActivities:
          deptBreakdown.reduce((acc, d) => acc + d.count, 0) +
          nonSalaryDirDirectActs.length,
      };
    });
  }, [rawActivities, selectedYear, getActivityTotal]);

  const totalInstitutionalBudget = useMemo(() => {
    return institutionalDirectionsBreakdown.reduce(
      (acc, dir) => acc + dir.directionBudget,
      0,
    );
  }, [institutionalDirectionsBreakdown]);

  const roles = useMemo(() => getRoles(user?.title || user?.cargo || user?.cargoChefia || ""), [user]);
  const canSeeSalaries = useMemo(() => {
    return isSuperBossUser(user) || 
           roles.isDG || 
           (user?.title || user?.cargo || user?.cargoChefia || "").toUpperCase().includes("DAF") ||
           ((user?.title || user?.cargo || user?.cargoChefia || "").toUpperCase().includes("DICOSAFA") && roles.isBoss);
  }, [user, roles]);

  const salarioStats = useMemo(() => {
    let valPessoalEfetivo = 0; // Salários pagos pelo Estado
    let valPessoalNaoEfetivo = 0; // Salários pagos via Receitas Próprias (RH)

    (rawActivities || []).forEach((act) => {
      const actTotal = getActivityTotal(act);
      const text =
        `${act.titulo || ""} ${act.necessidade || ""} ${act.rubrica || ""} ${safeJSONStringify(act.rubricas || "")}`.toUpperCase();

      if (
        text.includes("DOCENTE") &&
        (text.includes("EFETIVO") || text.includes("QUADRO"))
      ) {
        valPessoalEfetivo += actTotal * 12;
      } else if (
        text.includes("DOCENTE") &&
        (text.includes("CONTRATADO") ||
          text.includes("NAO EFETIVO") ||
          text.includes("NÃO EFETIVO"))
      ) {
        valPessoalNaoEfetivo += actTotal * 12;
      } else if (
        text.includes("CTA") &&
        (text.includes("EFETIVO") || text.includes("QUADRO"))
      ) {
        valPessoalEfetivo += actTotal * 12;
      } else if (
        text.includes("CTA") &&
        (text.includes("CONTRATADO") ||
          text.includes("NAO EFETIVO") ||
          text.includes("NÃO EFETIVO"))
      ) {
        valPessoalNaoEfetivo += actTotal * 12;
      } else if (
        text.includes("SALARIO") ||
        text.includes("SALÁRIO") ||
        text.includes("REMUNERAÇÃO") ||
        text.includes("REMUNERACAO") ||
        text.includes("112")
      ) {
        valPessoalEfetivo += actTotal * 12 * 0.8;
        valPessoalNaoEfetivo += actTotal * 12 * 0.2;
      }
    });

    const fallbackTotal = 131976760.68;
    const totalDetected = valPessoalEfetivo + valPessoalNaoEfetivo;
    if (totalDetected < 1000) {
      valPessoalEfetivo = fallbackTotal * 0.75;
      valPessoalNaoEfetivo = fallbackTotal * 0.25;
    }

    const fmt = (n: number) =>
      n.toLocaleString("pt-MZ", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + " MZN";

    return {
      salarioEstado: fmt(valPessoalEfetivo),
      salarioReceitasProprias: fmt(valPessoalNaoEfetivo),
      rawEstado: valPessoalEfetivo,
      rawReceitasProprias: valPessoalNaoEfetivo,
      totalGeral: fmt(valPessoalNaoEfetivo),
      totalRaw: valPessoalNaoEfetivo, // Apenas receitas próprias entra no orçamento geral consolidado; o Estado é separado
    };
  }, [rawActivities, getActivityTotal]);

  const [planSchedules, setPlanSchedules] = useState<any[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    title: "",
    year: selectedYear,
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    statusToUpdate: "setor", // Qual nível deve atualizar
  });

  useEffect(() => {
    const unsub = firestoreService.plan_schedules.subscribe(setPlanSchedules);
    return unsub;
  }, []);

  const activeSchedule = useMemo(() => {
    const now = new Date();
    return planSchedules.find((s) => {
      const start = new Date(s.startDate);
      const end = new Date(s.endDate);
      return now >= start && now <= end && Number(s.year) === selectedYear;
    });
  }, [planSchedules, selectedYear]);

  // Auto-submit expired schedules
  useEffect(() => {
    if (!isPlanificacao || planSchedules.length === 0) return;

    const checkExpirations = async () => {
      const now = new Date();
      for (const schedule of planSchedules) {
        if (!schedule.autoSubmitted && new Date(schedule.endDate) < now) {
          // Map each schedule.statusToUpdate to its corresponding NEXT workflow status
          const AUTO_SUBMIT_TRANSITIONS: Record<string, string> = {
            setor: "reparticao",
            reparticao: "departamento",
            departamento: "direcao",
            direcao: "planificacao",
          };

          // Logic to auto-submit all pending activities for this schedule
          const toSubmit = rawActivities.filter((a) => {
            const actStatus = (a.status || "setor").replace("setorial", "setor");
            return (
              Number(a.ano) === Number(schedule.year) &&
              actStatus === schedule.statusToUpdate &&
              !a.submetido
            );
          });

          if (toSubmit.length > 0) {
            console.log(
              `Auto-submitting ${toSubmit.length} activities for schedule ${schedule.id}`,
            );
            try {
              const nextStatus = AUTO_SUBMIT_TRANSITIONS[schedule.statusToUpdate] || "reparticao";
              await Promise.all(
                toSubmit.map((act) =>
                  firestoreService.matrixActivities.update(act.id, {
                    status: nextStatus,
                    submetido: true,
                  }),
                ),
              );
              // Mark schedule as processed
              await firestoreService.plan_schedules.update(schedule.id, {
                autoSubmitted: true,
              });
              onShowAlert(
                `O prazo de atualização para o plano ${schedule.year} expirou. ${toSubmit.length} atividades foram submetidas automaticamente para o nível seguinte.`,
              );
            } catch (err) {
              console.error("Error in auto-submit:", err);
            }
          } else {
            // Even if nothing to submit, mark it so we don't check again
            await firestoreService.plan_schedules.update(schedule.id, {
              autoSubmitted: true,
            });
          }
        }
      }
    };

    checkExpirations();
  }, [planSchedules, rawActivities, isPlanificacao, selectedYear]);

  const canEdit = (activity: MatrixActivity) => {
    if (!activity) return false;
    if (!user) return false;

    // Se estiver aprovada, fica bloqueada para alterações
    if (
      activity.statusAprovacao === "aprovada" ||
      (activity.status as any) === "institucional"
    )
      return false;

    // Super Boss/Admin can always edit
    if (isSuperBossUser(user)) return true;

    // Se o documento foi tramitado para um gabinete específico, apenas membros desse gabinete podem editar
    if (activity.currentGabinete) {
      const uArea = (user.setor || user.reparticao || user.departamento || user.direcao || "").toLowerCase();
      const aGabinete = activity.currentGabinete.toLowerCase();
      if (!aGabinete.includes(uArea) && !uArea.includes(aGabinete)) return false;
    }

    // Se estiver em período de atualização agendado, permite editar mesmo se submetido
    if (
      activeSchedule &&
      Number(activity.ano) === Number(activeSchedule.year)
    ) {
      const userRole = selectedRoleMode
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      const targetRole = (activeSchedule.statusToUpdate || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      if (userRole === targetRole) return true;
    }

    // "todos os colaboradores e chefes devem ter acesso a seu planos no ato de planificacao, issso garannte a visita e atualizacao do mesmo"
    // So during planning (all statuses except 'institucional'), if the user has access to see/own it, they can edit/update it.
    const uEmail = (user.email || "").toLowerCase();
    const uName = (user.nome || user.name || "").toLowerCase();
    const creator = (activity.createdBy || "").toLowerCase();
    const creatorName = (activity.createdByName || "").toLowerCase();
    const isOwner =
      creator === uEmail ||
      creatorName === uName ||
      (uEmail && creator.includes(uEmail)) ||
      activity.responsavelEmail?.toLowerCase() === uEmail;

    if (isOwner) return true;

    // Check if user is chief and has access to the department/direction/sector
    const roles = getRoles(user.title || user.cargo || user.cargoChefia || "");
    if (roles.isBoss) {
      const hasAreaAccess = canAccessArea(
        user,
        activity.direcao || "",
        activity.departamento || "",
        activity.setor || activity.reparticao || "",
      );
      if (hasAreaAccess) return true;
    }

    if (isCD) {
      return (
        (activity.status as any) === "departamento" &&
        activity.departamento === user?.departamento
      );
    }
    if (isDC) {
      return (
        (activity.status as any) === "direcao" &&
        activity.direcao === user?.direcao
      );
    }

    return !activity.submetido;
  };

  const [activeSubTab, setActiveSubTab] = useState<
    | "plano_reparticao"
    | "plano_departamento"
    | "plano_institucional"
    | "matriz_direcoes"
    | "plano_direcoes"
    | "pesoe"
    | "plano_setorial"
    | "plano_orcamento"
    | "necessidades_quantidades"
  >("plano_orcamento");

  const groupedNecessidadesPlanificadas = useMemo(() => {
    const planActivities = filteredActivities.filter(
      (a) =>
        (a.status as any) === "planificacao" &&
        !a.isPESOE &&
        (isSuperBossUser(user) || a.direcao === user?.direcao)
    );

    const productMap: {
      [key: string]: {
        nomeProduto: string;
        necessidadeCategory: string;
        rubricaCode: string;
        quantidadeTotal: number;
        valorTotal: number;
        precoUnitarioMedio: number;
        especificacoes: Set<string>;
        atividadesCount: number;
        atividadesList: string[];
      };
    } = {};

    planActivities.forEach((act) => {
      const actName =
        act.designacaoAtividade ||
        act.nomeAtividade ||
        act.title ||
        act.designacao ||
        "Atividade Planificada";

      if (Array.isArray(act.rubricas) && act.rubricas.length > 0) {
        act.rubricas.forEach((r: any) => {
          const prodName = String(
            r.nomeProduto ||
              r.especificacao ||
              r.produto ||
              r.item ||
              r.necessidade ||
              r.descricao ||
              "Item sem nome"
          ).trim();
          const necCat = String(r.necessidade || r.categoria || "").trim();
          const rubCode = String(r.rubrica || r.nomeRubrica || r.code || "").trim();
          const qty = Number(r.quantidade || r.qtd || 1);
          const val = Number(r.valorTotal || r.total || r.valor || r.precoTotal || 0);

          const key = `${necCat.toLowerCase()}|||${prodName.toLowerCase()}`;

          if (!productMap[key]) {
            productMap[key] = {
              nomeProduto: prodName,
              necessidadeCategory: necCat,
              rubricaCode: rubCode,
              quantidadeTotal: 0,
              valorTotal: 0,
              precoUnitarioMedio: 0,
              especificacoes: new Set<string>(),
              atividadesCount: 0,
              atividadesList: [],
            };
          }

          productMap[key].quantidadeTotal += qty;
          productMap[key].valorTotal += val;
          productMap[key].atividadesCount += 1;
          if (!productMap[key].atividadesList.includes(actName)) {
            productMap[key].atividadesList.push(actName);
          }
          if (r.especificacao) productMap[key].especificacoes.add(r.especificacao);
        });
      } else {
        const val = getActivityTotal(act);
        if (val > 0) {
          const prodName = String(
            act.designacao || act.nomeAtividade || act.title || "Atividade Planificada"
          ).trim();
          const necCat = String(act.necessidade || "").trim();
          const rubCode = String(act.rubrica || "Despesas de Funcionamento").trim();
          const qty = Number(act.quantidade || 1);
          const key = `${necCat.toLowerCase()}|||${prodName.toLowerCase()}`;

          if (!productMap[key]) {
            productMap[key] = {
              nomeProduto: prodName,
              necessidadeCategory: necCat,
              rubricaCode: rubCode,
              quantidadeTotal: 0,
              valorTotal: 0,
              precoUnitarioMedio: 0,
              especificacoes: new Set<string>(),
              atividadesCount: 0,
              atividadesList: [],
            };
          }

          productMap[key].quantidadeTotal += qty;
          productMap[key].valorTotal += val;
          productMap[key].atividadesCount += 1;
          if (!productMap[key].atividadesList.includes(actName)) {
            productMap[key].atividadesList.push(actName);
          }
        }
      }
    });

    return Object.values(productMap)
      .map((item) => ({
        ...item,
        precoUnitarioMedio:
          item.quantidadeTotal > 0 ? item.valorTotal / item.quantidadeTotal : 0,
        especificacoesStr: Array.from(item.especificacoes).join("; "),
      }))
      .sort((a, b) => b.quantidadeTotal - a.quantidadeTotal);
  }, [filteredActivities, user]);
  const [colaboradores, setColaboradores] = useState<any[]>(
    externalColaboradores,
  );
  const [stagedActivities, setStagedActivities] = useState<any[]>([]);
  const [selectedPlanificacaoDirection, setSelectedPlanificacaoDirection] =
    useState<string>("");

  // Análise automática do plano importado
  const stagedAnalysis = useMemo(() => {
    if (stagedActivities.length === 0) return null;
    
    const totalValue = stagedActivities.reduce((acc, act) => acc + (Number(act.valor) || 0), 0);
    const withTransport = stagedActivities.filter(act => String(act.necessitaTransporte || "").toLowerCase() === "sim").length;
    const missingValues = stagedActivities.filter(act => !act.valor || Number(act.valor) === 0).length;
    
    return {
      totalValue,
      withTransport,
      missingValues,
      count: stagedActivities.length
    };
  }, [stagedActivities]);

  useEffect(() => {
    if (externalColaboradores && externalColaboradores.length > 0) {
      setColaboradores(externalColaboradores);
    }
  }, [externalColaboradores]);
  const [pesoeConfig, setPesoeConfig] = useState<{
    id: string;
    published: boolean;
    publishedBy?: string;
    publishedAt?: string;
  } | null>(null);

  const [isAllocating, setIsAllocating] = useState(false);

  const handleReplicatePreviousPlan = async () => {
    // 1. Identificar o setor do utilizador
    const userUnit =
      user?.reparticao ||
      user?.setor ||
      user?.departamento ||
      user?.direcao ||
      "";

    if (!userUnit || userUnit === "Nenhum") {
      onShowAlert(
        "Não foi possível identificar a sua unidade orgânica para replicação.",
      );
      return;
    }

    if (
      !window.confirm(
        `Deseja buscar e replicar as atividades da unidade "${userUnit}" para o ciclo de ${selectedYear}?`,
      )
    ) {
      return;
    }

    try {
      setIsLoading(true);
      let activitiesToReplicate: any[] = [];
      const previousYear = selectedYear - 1;

      // 1. Tentar buscar atividades do ano anterior (N-1) no banco de dados ativo
      const previousYearActivities = rawActivities.filter(
        (a) => a.ano === previousYear,
      );

      if (previousYearActivities.length > 0) {
        activitiesToReplicate = previousYearActivities;
        console.log(
          `Replicação: ${activitiesToReplicate.length} atividades encontradas no ano ${previousYear}.`,
        );
      } else {
        // 2. Se não houver no banco ativo, buscar no arquivo morto
        const archiveDocs =
          (await firestoreService.archive_documents.get()) || [];
        const specificPlan = archiveDocs.find(
          (doc) =>
            doc.type === "Planos de Atividades e Orçamentos" &&
            (doc.origin === userUnit || doc.title?.includes(userUnit)) &&
            (doc.year === previousYear ||
              doc.title?.includes(previousYear.toString())) &&
            doc.atividades &&
            doc.atividades.length > 0,
        );

        if (specificPlan) {
          activitiesToReplicate = specificPlan.atividades;
          console.log(
            "Replicação: Plano específico encontrado no arquivo morto.",
          );
        } else {
          // Fallback: Buscar no Plano Institucional no Arquivo
          const instPlan = archiveDocs.find(
            (doc) =>
              (doc.type === "Planos de Atividades e Orçamentos" ||
                doc.type === "Plano Institucional") &&
              (doc.title?.toUpperCase().includes("INSTITUCIONAL") ||
                doc.title?.toUpperCase().includes("PESOE")) &&
              doc.atividades &&
              doc.atividades.length > 0,
          );

          if (instPlan) {
            // Filtrar apenas atividades que mencionam o setor do utilizador
            activitiesToReplicate = instPlan.atividades.filter((act: any) => {
              const rep = (act.reparticao || "").toUpperCase();
              const det = String(act.departamento || "").toUpperCase();
              const set = (act.setor || "").toUpperCase();
              const u = userUnit.toUpperCase();
              return rep.includes(u) || det.includes(u) || set.includes(u);
            });
            console.log(
              "Replicação: Extraído do Plano Institucional no arquivo.",
            );
          }
        }
      }

      // 3. Fallback final: atividades do estado atual (anteriores) se ainda não encontrou nada
      if (activitiesToReplicate.length === 0) {
        activitiesToReplicate = filteredActivities.filter(
          (a) =>
            !a.status ||
            (a.status as any) === "draft" ||
            (a.status as any) === "setorial",
        );
        console.log("Replicação: Usando atividades locais filtradas.");
      }

      if (activitiesToReplicate.length === 0) {
        onShowAlert(
          "Nenhuma atividade encontrada para replicar no arquivo ou no plano institucional para a sua unidade.",
        );
        return;
      }

      let count = 0;
      // Ordenar por número para garantir organização (como solicitado)
      const sorted = [...activitiesToReplicate].sort((a, b) => {
        const numA = parseFloat(
          (a.no || a.ordem || "0").toString().replace(",", "."),
        );
        const numB = parseFloat(
          (b.no || b.ordem || "0").toString().replace(",", "."),
        );
        return numA - numB;
      });

      for (const activity of sorted) {
        // Limpar IDs e metadados para nova criação
        const { id, submetido, createdAt, updatedAt, ...rest } = activity;

        // Mapeamento de campos caso venha de formatos diferentes
        const newActivity = {
          ...rest,
          no: activity.no || activity.ordem || activity.n || "",
          title:
            activity.title || activity.atividade || activity.activity || "",
          ano: selectedYear,
          status: "draft",
          submetido: false,
          createdAt: new Date().toISOString(),
          // Garantir que a unidade orgânica está correta
          reparticao: user?.reparticao || activity.reparticao || "",
          departamento: user?.departamento || activity.departamento || "",
          direcao: user?.direcao || activity.direcao || "",
        };

        await firestoreService.matrixActivities.add(newActivity);
        count++;
      }
      onShowAlert(
        `${count} atividades replicadas com sucesso para ${userUnit}. Foram organizadas sequencialmente.`,
      );
    } catch (error: any) {
      console.error("Error replicating activities:", error);
      onShowAlert("Erro ao replicar atividades: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAllActivities = async () => {
    if (!isPlanificacao && !isAdminOrProgrammer && user?.role !== "admin" && user?.role !== "administrador") {
      onShowAlert("Apenas o Setor de Planificação ou Administradores têm permissão para limpar os planos.");
      return;
    }

    const confirmClear = window.confirm(
      "ATENÇÃO: Esta ação irá remover TODAS as atividades ativas do sistema (matrixActivities e actividades). " +
        "Certifique-se de que os planos já foram arquivados no 'Arquivo Morto' antes de prosseguir. " +
        "Deseja continuar com a limpeza total?",
    );

    if (!confirmClear) return;

    const secondConfirm = window.confirm(
      "CONFIRMAÇÃO FINAL: Deseja realmente APAGAR permanentemente todos os registros de atividades atuais para deixar o sistema limpo?",
    );

    if (!secondConfirm) return;

    try {
      setIsLoading(true);
      
      // 1. Executa a purga completa de todos os dados de teste (Ação Radical solicitada)
      const cleanupResult = await firestoreService.wipeAllTestData();
      console.log("Full Wipe Result:", cleanupResult);

      // 2. Limpeza adicional de caches locais e estados de sessão
      const keysToClear = [
        "sigep_plano_actividades",
        "sigep_quota_exceeded",
        "sigep_matrix_activities",
        "sigep_actividades",
        "sigep_last_sync"
      ];
      keysToClear.forEach(key => localStorage.removeItem(key));

      // 3. Reset total da interface
      setPreviewActivities([]);
      setStagedActivities([]);
      setShowImportPreview(false);
      setImportFileName("");
      
      onShowAlert(`PURGA COMPLETA CONCLUÍDA: ${cleanupResult.count || 0} documentos de teste foram eliminados. O sistema está limpo.`);
    } catch (error: any) {
      console.error("Erro ao realizar limpeza geral:", error);
      onShowAlert("Erro ao limpar o sistema: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsub = firestoreService.config.subscribe("pesoe_config", (data) => {
      setPesoeConfig(data);
    });
    return unsub;
  }, []);

  const handleConfirmSubmission = async () => {
    if (stagedActivities.length === 0) return;

    setIsLoading(true);
    try {
      await Promise.all(
        stagedActivities.map((act) =>
          firestoreService.matrixActivities.add({
            ...act,
            status: "planificacao",
          }),
        ),
      );

      setStagedActivities([]);
      setActiveSubTab("pesoe");
      onShowAlert(
        `${stagedActivities.length} atividades do plano foram submetidas e guardadas com sucesso no Plano de Atividades.`,
      );
    } catch (e) {
      console.error("Erro ao submeter plano:", e);
      onShowAlert("Erro ao submeter o plano para a base de dados.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublishPesoe = async (publishState: boolean) => {
    try {
      await firestoreService.config.set("pesoe_config", {
        published: publishState,
        publishedBy: user?.name || user?.email || title || "Chefe do DPEP",
        publishedAt: new Date().toISOString(),
      });

      // Transfer activities to Monitoria sector if published
      if (publishState) {
        const months = [
          "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
          "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
        ];
        const nextMonthIndex = (new Date().getMonth() + 1) % 12;
        const nextMonthName = months[nextMonthIndex];

        const nextMonthActivities = rawActivities.filter(
          (act) => act.mesRealizacao === nextMonthName
        );

        for (const act of nextMonthActivities) {
          await firestoreService.matrixActivities.update(act.id, {
            setor: "Setor de Monitoria",
            status: "pendente_monitoria",
          });
        }
        
        // Limpeza Global de Rascunhos: Eliminar todas as atividades que não foram homologadas nem submetidas ao PESOE final
        const globalDrafts = rawActivities.filter(
          (a) => a.status !== "institucional" && a.status !== "pendente_monitoria" && a.status !== "em_andamento" && a.status !== "concluido"
        );
        if (globalDrafts.length > 0) {
          await Promise.all(
            globalDrafts.map((act) => firestoreService.matrixActivities.delete(act.id))
          );
        }

        onShowAlert(
          `DE publicado com sucesso! Atividades para ${nextMonthName} transferidas para Monitoria.`
        );
      } else {
        onShowAlert("Publicação do DE anulada com sucesso!");
      }
    } catch (err) {
      console.error(err);
      alert("Ocorreu um erro ao atualizar o estado de publicação do DE.");
    }
  };

  const getDirectorDirection = (dirTitle: string) => {
    const t = dirTitle.toUpperCase();
    if (
      t.includes("DICOSAFA") ||
      t.includes("COSSAFA") ||
      t.includes("ADMINISTRAÇÃO, FINANÇAS") ||
      t.includes("ADMINISTRACAO, FINANCAS")
    )
      return "Direção de Coordenação de Serviços de Administração, Finanças e de Apoio (DICOSAFA)";
    if (
      t.includes("DICOSSER") ||
      t.includes("COSSER") ||
      t.includes("SERVIÇOS SOCIAIS") ||
      t.includes("SERVICOS SOCIAIS")
    )
      return "Direção de Coordenação de Serviços Académicos, Sociais, Extensão e Relações Públicas (DICOSSER)";
    if (t.includes("DICOCOSSER"))
      return "Direção de Coordenação de Serviços Académicos, Sociais, Extensão e Relações Públicas (DICOSSER)";
    if (t.includes("GERAL") || t.includes("DG")) return "ALL";
    return "";
  };

  const getDepartmentKeyMatched = (
    titleStr: string = "",
    userDept: string = "",
  ) => {
    const t = (titleStr || "").toUpperCase();
    const ud = (userDept || "").toUpperCase();

    if (userDept && userDept.toUpperCase().includes("DEPARTAMENTO")) {
      return userDept;
    }

    const allDeptKeys = Object.keys(REPARTICOES);

    if (titleStr && titleStr.toUpperCase().includes("DEPARTAMENTO")) {
      const found = allDeptKeys.find(
        (k) => t.includes(k.toUpperCase()) || k.toUpperCase().includes(t),
      );
      if (found) return found;
    }

    if (ud) {
      const foundUd = allDeptKeys.find(
        (k) => ud.includes(k.toUpperCase()) || k.toUpperCase().includes(ud),
      );
      if (foundUd) return foundUd;
    }

    return "Departamento de Recursos Humanos";
  };

  const getReparticoesAndSectors = (deptKey: string) => {
    const list: { name: string; type: "Repartição" | "Setor" | "Geral"; parentReparticao?: string }[] = [];
    
    // Encontrar chave correspondente em REPARTICOES
    const allDeptKeys = Object.keys(REPARTICOES);
    const matchedKey = allDeptKeys.find(
      (k) =>
        k.toLowerCase() === deptKey.toLowerCase() ||
        k.toLowerCase().includes(deptKey.toLowerCase()) ||
        deptKey.toLowerCase().includes(k.toLowerCase()),
    ) || deptKey;

    const deptsReparticoes = REPARTICOES[matchedKey] || [];

    deptsReparticoes.forEach((rep) => {
      list.push({ name: rep, type: "Repartição" });
      const sectorsOfRep = SECTORES[rep] || [];
      sectorsOfRep.forEach((sec) => {
        list.push({ name: sec, type: "Setor", parentReparticao: rep });
      });
    });

    // Analisar atividades e planos para recolher outros setores/repartições subordinados
    const activitiesToScan = [...(filteredActivities || []), ...(rawActivities || [])];
    activitiesToScan.forEach((a) => {
      const matchDept =
        !a.departamento ||
        String(a.departamento).toLowerCase() === deptKey.toLowerCase() ||
        String(a.departamento).toLowerCase() === matchedKey.toLowerCase() ||
        String(a.departamento).toLowerCase().includes(deptKey.toLowerCase()) ||
        deptKey.toLowerCase().includes(String(a.departamento).toLowerCase());

      if (matchDept) {
        const sectorCandidate = a.setor || a.areaDeAfetacao;
        const repCandidate = a.reparticao;

        if (
          repCandidate &&
          !list.some((item) => String(item.name).toLowerCase() === String(repCandidate).toLowerCase())
        ) {
          const type =
            String(repCandidate).toUpperCase().includes("SETOR") ||
            String(repCandidate).toUpperCase().includes("SECTOR")
              ? "Setor"
              : "Repartição";
          list.push({ name: repCandidate, type: type as any });
        }

        if (
          sectorCandidate &&
          !list.some((item) => item.name.toLowerCase() === sectorCandidate.toLowerCase())
        ) {
          const type =
            sectorCandidate.toUpperCase().includes("REPARTIÇÃO") ||
            sectorCandidate.toUpperCase().includes("REPARTICAO")
              ? "Repartição"
              : "Setor";
          list.push({ name: sectorCandidate, type: type as any, parentReparticao: repCandidate });
        }
      }
    });

    // Garantir que temos "Sectores Gerais"

    return list;
  };

  const activeDeptKey = getDepartmentKeyMatched(title, user?.departamento);
  const reparticoesAndSectorsForThisDept =
    getReparticoesAndSectors(activeDeptKey);

  const directorDirection = getDirectorDirection(title);

  const isPublished = !!pesoeConfig?.published;

  // New Activity form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<MatrixActivity | null>(
    null,
  );
  const [formData, setFormData] = useState({
    no: "",
    title: "",
    direcao: "DICOSAFA",
    departamento: "Departamento de Património",
    reparticao: title || "Repartição de Transporte",
    orcamento: "Orçamento do Estado",
    valor: "",
  });

  // Calculate lists of activities based on local role mode or database status
  // Status workflow tracker:
  // - 'draft' or 'setorial' -> Sector level (Plano Setorial)
  // - 'departamento' -> Department level (Plano do Departamento)
  // - 'direcao' -> Direction level (Plano da Direção)
  // - 'institucional' -> Combined Institutional level (Plano Institucional)

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.no) {
      alert("Por favor preencha o número de ordem e a atividade.");
      return;
    }

    const activity: any = {
      id: Math.random().toString(36).substr(2, 9),
      no: formData.no,
      title: formData.title,
      direcao: formData.direcao,
      departamento: formData.departamento,
      reparticao: formData.reparticao,
      orcamento: formData.orcamento,
      valor: Number(formData.valor) || 0,
      status:
        activeSubTab === "plano_institucional"
          ? "institucional"
          : activeSubTab === "plano_direcoes"
            ? "direcoes"
            : activeSubTab === "plano_departamento"
              ? "departamento"
              : activeSubTab === "plano_reparticao"
              ? "reparticao"
              : selectedRoleMode === "Repartição"
                ? "reparticao"
                : "setorial", // Initial plan stage
      frequencia: "Mensal",
      unidadeOrganica: "Songo",
      dataMes: new Date().toLocaleString("pt", { month: "long" }),
      createdAt: new Date().toISOString(),
      ano: selectedYear,
      createdBy: user?.email, // Adicionado
    };

    try {
      await firestoreService.matrixActivities.add(activity);
      onShowAlert(
        `Atividade planificada adicionada ao Plano ${
          activeSubTab === "plano_institucional"
            ? "Institucional"
            : activeSubTab === "plano_direcoes"
              ? "da Direção"
              : activeSubTab === "plano_departamento"
                ? "do Departamento"
                : "da Repartição"
        } com sucesso!`,
      );
      setFormData((prev) => ({ ...prev, no: "", title: "", valor: "" }));
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
      alert("Falha ao registar a atividade.");
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirmId(id);
  };

  const performDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const act = rawActivities.find((a) => a.id === deleteConfirmId);
      await firestoreService.matrixActivities.delete(deleteConfirmId);
      setRawActivities((prev) => prev.filter((a) => a.id !== deleteConfirmId));
      onShowAlert("Dados excluídos com sucesso");
      if (act) {
        await firestoreService.resequenceActivitiesAfterDelete(
          "matrix_activities",
          act,
          rawActivities,
        );
      }
    } catch (error: any) {
      onShowAlert("Erro ao excluir: " + error.message);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleCleanSlate2027 = async () => {
    if (!user || user.email !== "slaitertripas@gmail.com") {
      onShowAlert("Apenas o administrador pode realizar esta ação.");
      return;
    }

    if (
      !window.confirm(
        "ATENÇÃO MODO PROGRAMADOR: Esta ação irá EXCLUIR PERMANENTEMENTE TODAS as atividades do ciclo 2027 na base de dados. Esta operação não pode ser desfeita. Deseja continuar?",
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const activitiesToDelete = rawActivities.filter(
        (a) => Number(a.ano) === 2027,
      );
      if (activitiesToDelete.length === 0) {
        onShowAlert("Nenhuma atividade de 2027 encontrada para excluir.");
      } else {
        let deleted = 0;
        for (const act of activitiesToDelete) {
          await firestoreService.matrixActivities.delete(act.id);
          deleted++;
        }
        onShowAlert("dados excluido com sucesso");
      }
    } catch (error: any) {
      console.error("Erro ao limpar base de dados:", error);
      onShowAlert("Erro ao excluir atividades: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearPreviousCycles = async () => {
    if (!user || user.email !== "slaitertripas@gmail.com") {
      onShowAlert("Apenas o administrador pode realizar esta ação.");
      return;
    }

    if (
      !window.confirm(
        "⚠️ ATENÇÃO: Esta ação irá apagar TODOS os planos de atividades de anos anteriores (2025 e anteriores) carregados via modo programador. Deseja continuar?",
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const activitiesToDelete = rawActivities.filter(
        (a) =>
          (a.ano && Number(a.ano) <= 2025) ||
          (a.exercicioEconomico && Number(a.exercicioEconomico) <= 2025),
      );

      if (activitiesToDelete.length === 0) {
        onShowAlert(
          "Nenhuma atividade de anos anteriores (<=2025) encontrada.",
        );
      } else {
        let deleted = 0;
        for (const act of activitiesToDelete) {
          if (act.id) {
            await firestoreService.matrixActivities.delete(act.id);
            deleted++;
          }
        }
        onShowAlert("dados excluido com sucesso");
      }
    } catch (error: any) {
      console.error("Erro ao eliminar planos anteriores:", error);
      onShowAlert("Erro: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUnassignedActivities = async () => {
    const isAdmin =
      user?.email === "slaitertripas@gmail.com" ||
      user?.role === "admin" ||
      user?.role === "administrador" ||
      selectedRoleMode === "Planificação";

    if (!isAdmin) {
      onShowAlert("Apenas o administrador ou o setor de planificação pode realizar esta ação.");
      return;
    }

    const unassigned = rawActivities.filter(
      (a) => !a.departamento || a.departamento.trim() === ""
    );

    if (unassigned.length === 0) {
      onShowAlert("Nenhuma atividade com departamento vazio encontrada no sistema.");
      return;
    }

    if (
      !window.confirm(
        `⚠️ ATENÇÃO: Deseja realmente excluir permanentemente ${unassigned.length} atividade(s) sem departamento de todo o sistema? Esta operação não pode ser desfeita e garante a limpeza completa dos dados.`
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      let deletedCount = 0;
      for (const act of unassigned) {
        if (act.id) {
          await firestoreService.matrixActivities.delete(act.id);
          deletedCount++;
        }
      }
      setRawActivities((prev) =>
        prev.filter((a) => !(!a.departamento || a.departamento.trim() === ""))
      );
      onShowAlert(`Limpeza concluída! ${deletedCount} atividade(s) sem departamento foram excluídas do sistema.`);
    } catch (error: any) {
      console.error("Erro ao limpar atividades sem departamento:", error);
      onShowAlert("Erro ao excluir atividades: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDuplicateActivities = async () => {
    const isAdmin =
      user?.email === "slaitertripas@gmail.com" ||
      user?.role === "admin" ||
      user?.role === "administrador" ||
      selectedRoleMode === "Planificação";

    if (!isAdmin) {
      onShowAlert("Apenas o administrador ou o setor de planificação pode realizar esta ação.");
      return;
    }

    const duplicates: any[] = [];
    const seenKeys = new Set<string>();

    for (const act of rawActivities) {
      if (!act) continue;
      const name = (act.descricao || act.designacaoAtividade || act.nomeAtividade || act.title || act.atividade || "").toString().trim().toLowerCase();
      const code = (act.codigoAtividade || act.referencia || act.nAtividade || act.numeroAtividade || act.no || act.codigo || "").toString().trim().toLowerCase();
      const key = `${name}|||${code}`;
      if (!key || key === "|||") continue;

      if (seenKeys.has(key)) {
        duplicates.push(act);
      } else {
        seenKeys.add(key);
      }
    }

    if (duplicates.length === 0) {
      onShowAlert("Nenhuma atividade duplicada/repetida foi encontrada no sistema.");
      return;
    }

    if (
      !window.confirm(
        `⚠️ ATENÇÃO: Foram encontradas ${duplicates.length} atividade(s) duplicadas (mesmo nome e código). Deseja eliminar todas as cópias repetidas da base de dados?`
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      let deletedCount = 0;
      for (const act of duplicates) {
        if (act.id) {
          await firestoreService.matrixActivities.delete(act.id);
          deletedCount++;
        }
      }
      const duplicateIds = new Set(duplicates.map((d) => d.id));
      setRawActivities((prev) => prev.filter((a) => !duplicateIds.has(a.id)));
      onShowAlert(`Eliminação concluída! ${deletedCount} atividade(s) duplicada(s) foram removidas da base de dados.`);
    } catch (error: any) {
      console.error("Erro ao eliminar atividades duplicadas:", error);
      onShowAlert("Erro ao excluir duplicados: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkflowTransition = (
    fromStatus: string,
    toStatus: string,
    originLabel: string,
    destinationLabel: string,
    targetActivities?: any[],
  ) => {
    setWorkflowToProcess({
      fromStatus,
      toStatus,
      originLabel,
      destinationLabel,
      targetActivities,
    });
    setShowTramitacaoModal(true);
  };

  const confirmWorkflowTransition = async () => {
    if (!workflowToProcess || !selectedDestinatario) {
      alert("Por favor, selecione o gabinete destinatário.");
      return;
    }

    const { fromStatus, toStatus, originLabel, destinationLabel, targetActivities } =
      workflowToProcess;

    const toUpdate = targetActivities || filteredActivities.filter(
      (a) => (a.status as any) === fromStatus && !a.submetido,
    );

    if (toUpdate.length === 0) {
      alert(
        `Nenhuma atividade no Plano de ${originLabel} aguardando expedição.`,
      );
      return;
    }

    try {
      setIsLoading(true);

      const signature = {
        userId: user?.id || user?.uid,
        userName: user?.nome || user?.email,
        userRole: user?.cargo || user?.cargoChefia || "Responsável",
        date: new Date().toISOString(),
        action: "Assinado e Tramitado",
        destination: selectedDestinatario,
      };

      if (toStatus === "institucional") {
        await reorderAndRenumber(toUpdate);
      }

      await Promise.all([
        ...toUpdate.map((act) => {
          const existingHistory = Array.isArray(act.workflowHistory)
            ? act.workflowHistory
            : [];
          return firestoreService.matrixActivities.update(act.id, {
            status: toStatus,
            submetido: true,
            currentGabinete: selectedDestinatario,
            workflowHistory: [...existingHistory, signature],
          });
        }),
        firestoreService.archive_documents.add({
          title: `Cópia: Plano de ${originLabel} (${user?.setor || user?.reparticao || user?.departamento || ""}) - ${new Date().toLocaleDateString("pt-PT")}`,
          year: selectedYear,
          type: "Planos de Atividades e Orçamentos",
          date: new Date().toISOString().split("T")[0],
          atividades: toUpdate,
          author: user?.nome || user?.email,
          origin: originLabel,
          destinatario: selectedDestinatario,
        }),
      ]);

      onShowAlert(
        `Sucesso! ${toUpdate.length} atividades foram assinadas e enviadas para ${selectedDestinatario}.`,
      );

      // Limpar rascunhos restantes
      const draftsToDelete = filteredActivities.filter(
        (a) => (a.status as any) === fromStatus && !a.submetido && !toUpdate.some((u) => u.id === a.id)
      );
      if (draftsToDelete.length > 0) {
        await Promise.all(
          draftsToDelete.map((act) => firestoreService.matrixActivities.delete(act.id))
        );
      }

      setShowTramitacaoModal(false);
      setSelectedDestinatario("");
      setWorkflowToProcess(null);
    } catch (err) {
      console.error(err);
      alert("Ocorreu um erro ao processar a expedição.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendSetorToReparticao = () =>
    handleWorkflowTransition("setorial", "reparticao", "Setor", "Repartição");
  const handleSendReparticaoToDepartamento = () =>
    handleWorkflowTransition(
      "reparticao",
      "departamento",
      "Repartição",
      "Departamento",
    );
  const handleSendDepartamentoToDirecao = () =>
    handleWorkflowTransition(
      "departamento",
      "direcao",
      "Departamento",
      "Direção",
    );

  const handleUnifyDepartmentPlan = async () => {
    const subordinateActs = filteredActivities.filter(
      (a) =>
        (a.status as any) === "reparticao" || (a.status as any) === "setorial",
    );

    if (subordinateActs.length === 0) {
      alert(
        "Nenhuma atividade de repartição ou setor pendente para unificar no plano do departamento.",
      );
      return;
    }

    try {
      setIsLoading(true);
      await Promise.all(
        subordinateActs.map((act) =>
          firestoreService.matrixActivities.update(act.id, {
            status: "departamento",
            departamento: user?.departamento || "Departamento",
          }),
        ),
      );
      onShowAlert(
        `Sucesso! ${subordinateActs.length} atividades das repartições/setores foram unificadas no plano do departamento.`,
      );
      setShowReceivedPlans(false);
    } catch (err) {
      console.error(err);
      alert("Ocorreu um erro ao unificar o plano do departamento.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnifyDirectionPlan = async () => {
    const userDir = user?.direcao || "";
    const canonicalUserDir = getCanonicalDirection(userDir);

    const subordinateActs = rawActivities.filter((a) => {
      if (Number(a.ano || 2026) !== Number(selectedYear)) return false;
      const canonicalActDir = getCanonicalDirection(a.direcao);
      if (canonicalActDir !== canonicalUserDir) return false;
      return (a.status as any) === "departamento";
    });

    if (subordinateActs.length === 0) {
      alert(
        "Nenhuma atividade de departamento pendente para unificar no plano da direção.",
      );
      return;
    }

    try {
      setIsLoading(true);
      await Promise.all(
        subordinateActs.map((act) =>
          firestoreService.matrixActivities.update(act.id, {
            status: "direcao",
            direcao: user?.direcao || "Direção",
          }),
        ),
      );
      onShowAlert(
        `Sucesso! ${subordinateActs.length} atividades dos departamentos foram unificadas no plano da direção.`,
      );
      setShowReceivedPlans(false);
    } catch (err) {
      console.error(err);
      alert("Ocorreu um erro ao unificar o plano da direção.");
    } finally {
      setIsLoading(false);
    }
  };

  const getCanonicalDirection = (dirStr: string): string => {
    const d = (dirStr || "").toLowerCase();
    if (d.includes("geral") || d.includes("gabinete") || d === "gdg" || d === "dg") return "Gabinete do Diretor-Geral";
    if (d.includes("engenharia") || d === "engenharia") return "Divisão de Engenharia";
    if (d.includes("dicosafa") || d.includes("administração") || d.includes("coor_adm")) return "DICOSAFA";
    if (d.includes("dicosser") || d.includes("académicos") || d.includes("coor_acad")) return "DICOSSER";
    if (d.includes("incubação") || d.includes("cie") || d === "cie") return "Centro de Incubação de Empresas";
    return dirStr;
  };

  const handleSendPlanoGeralToDepartamentos = async () => {
    const toSend = filteredActivities.filter(
      (a) => (a.status as any) === "direcao" && !a.submetido,
    );

    if (toSend.length === 0) {
      alert("Nenhuma atividade do Plano Geral na Direção aguardando envio para os departamentos.");
      return;
    }

    try {
      setIsLoading(true);
      await Promise.all(
        toSend.map((act) =>
          firestoreService.matrixActivities.update(act.id, {
            status: "departamento",
            submetido: false,
          }),
        ),
      );
      onShowAlert(
        `Sucesso! ${toSend.length} atividades do Plano Geral foram enviadas para os Departamentos correspondentes para planificação.`,
      );
    } catch (err) {
      console.error(err);
      alert("Ocorreu um erro ao enviar o Plano Geral para os departamentos.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendDirecaoToPlanificacao = async () => {
    const userDir = user?.direcao || "";
    const canonicalUserDir = getCanonicalDirection(userDir);

    const subordinatePending = rawActivities.filter((a) => {
      if (Number(a.ano || 2026) !== Number(selectedYear)) return false;
      const canonicalActDir = getCanonicalDirection(a.direcao);
      if (canonicalActDir !== canonicalUserDir) return false;

      return ["setorial", "reparticao", "departamento"].includes(a.status);
    });

    if (subordinatePending.length > 0) {
      const pendingDepts = Array.from(new Set(subordinatePending.map(a => a.departamento || "")));
      alert(
        `⚠️ Não é possível enviar à Planificação.\n` +
        `A Direção só pode enviar após receber as atividades de todos os seus departamentos.\n\n` +
        `Departamentos com planos pendentes:\n• ` + pendingDepts.join("\n• ")
      );
      return;
    }

    await handleWorkflowTransition(
      "direcao",
      "planificacao",
      "Direção",
      "Setor de Planificação",
    );
  };

  const handleSendPlanificacaoToChefeDPEP = () =>
    handleWorkflowTransition(
      "planificacao",
      "dpep_chefe",
      "Setor de Planificação",
      "Chefe do DPEP",
    );

  const handleSendChefeDPEPToOrgaoColegial = () =>
    handleWorkflowTransition(
      "dpep_chefe",
      "orgao_colegial",
      "Chefe do DPEP",
      "Órgão Colegial",
    );

  const handleOrgaoColegialAprovar = async () => {
    try {
      setIsLoading(true);
      const actsToApprove = filteredActivities.filter(
        (a) => (a.status as any) === "orgao_colegial" || (a.status as any) === "dpep_chefe" || (a.status as any) === "planificacao" || (a.status as any) === "institucional"
      );
      
      await Promise.all(
        actsToApprove.map((act) =>
          firestoreService.matrixActivities.update(act.id, {
            status: "institucional",
            homologado: true,
            dataHomologacao: new Date().toISOString(),
          }),
        ),
      );

      await handlePublishPesoe(true);
      onShowAlert("Plano Institucional e Proposta do PESOE foram aprovados e homologados pelo Órgão Colegial com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Ocorreu um erro ao aprovar a proposta no Órgão Colegial.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendPlanificacaoToInstitucional = async () => {
    const FIVE_DIRECTIONS = [
      "Gabinete do Diretor-Geral",
      "Divisão de Engenharia",
      "DICOSAFA",
      "DICOSSER",
      "Centro de Incubação de Empresas"
    ];

    const pendingActivities = rawActivities.filter((a) => {
      if (Number(a.ano || 2026) !== Number(selectedYear)) return false;
      const canonicalDir = getCanonicalDirection(a.direcao);
      if (!FIVE_DIRECTIONS.includes(canonicalDir)) return false;

      return ["setorial", "reparticao", "departamento", "direcao"].includes(a.status);
    });

    const submittedDirs = new Set(
      rawActivities
        .filter((a) => Number(a.ano || 2026) === Number(selectedYear) && ["planificacao", "institucional", "dpep_chefe", "orgao_colegial"].includes(a.status))
        .map((a) => getCanonicalDirection(a.direcao))
    );

    const missingDirs = FIVE_DIRECTIONS.filter(d => !submittedDirs.has(d));

    if (pendingActivities.length > 0 || missingDirs.length > 0) {
      let errorMsg = `⚠️ Não é possível compilar o Plano Institucional.\n` +
        `O Setor de Planificação só pode completar após receber todos os planos das 5 Direções existentes no sistema.\n\n`;

      if (pendingActivities.length > 0) {
        const pendingDirs = Array.from(new Set(pendingActivities.map(a => getCanonicalDirection(a.direcao))));
        errorMsg += `Direções com atividades pendentes de submissão:\n• ` + pendingDirs.join("\n• ") + `\n\n`;
      }

      if (missingDirs.length > 0) {
        errorMsg += `Direções que ainda não enviaram nenhum plano:\n• ` + missingDirs.join("\n• ") + `\n`;
      }

      alert(errorMsg);
      return;
    }

    await handleWorkflowTransition(
      "planificacao",
      "dpep_chefe",
      "Setor de Planificação",
      "Chefe do DPEP",
    );
  };

  // Filters
  const currentSectorsWithPlan = Array.from(
    new Set(
      filteredActivities.map((a) => a.reparticao || "Setor Não Identificado"),
    ),
  );
  const currentDeptsWithPlan = Array.from(
    new Set(
      filteredActivities.map((a) => a.departamento || ""),
    ),
  );

  const handleExportPDF = async (activitiesToExport: any[]) => {
    try {
      if (!activitiesToExport || activitiesToExport.length === 0) {
        onShowAlert("Nenhuma atividade encontrada para exportar.");
        return;
      }

      const html2pdf = (await import("html2pdf.js")).default;

      const element = document.createElement("div");
      element.className = "p-8 font-serif bg-white text-black";

      let tableRowsHtml = "";
      activitiesToExport.forEach((act, idx) => {
        tableRowsHtml += `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px; text-align: center;">${act.no || idx + 1}</td>
            <td style="padding: 8px;">${act.referencia || ""}</td>
            <td style="padding: 8px;">${act.direcao || ""}</td>
            <td style="padding: 8px;">${act.departamento || ""}</td>
            <td style="padding: 8px;">${act.reparticao || act.setor || ""}</td>
            <td style="padding: 8px; font-weight: bold;">${act.title || act.designacao || ""}</td>
            <td style="padding: 8px;">${act.objetivo || ""}</td>
            <td style="padding: 8px; text-align: right;">${(act.valor || 0).toLocaleString()} MZN</td>
          </tr>
        `;
      });

      element.innerHTML = `
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 4px; text-transform: ;">Instituto Superior Politécnico de Songo</h2>
          <h3 style="font-size: 14px; color: #4a5568; margin-bottom: 12px;">Relatório de Atividades do Plano</h3>
          <p style="font-size: 11px; font-style: italic; color: #718096;">Gerado em ${new Date().toLocaleDateString("pt-PT")}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background-color: #f7fafc; border-bottom: 2px solid #cbd5e0;">
              <th style="padding: 8px; text-align: center; width: 40px;">Nº</th>
              <th style="padding: 8px; text-align: left; width: 80px;">Ref</th>
              <th style="padding: 8px; text-align: left;">Direção</th>
              <th style="padding: 8px; text-align: left;">Depto</th>
              <th style="padding: 8px; text-align: left;">Setor</th>
              <th style="padding: 8px; text-align: left;">Atividade</th>
              <th style="padding: 8px; text-align: left;">Objetivo</th>
              <th style="padding: 8px; text-align: right; width: 100px;">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
      `;

      const opt = {
        margin: 10,
        filename: `Atividades_Plano_${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: {
          unit: "mm" as const,
          format: "a4" as const,
          orientation: "landscape" as const,
        },
      };

      html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      onShowAlert("Ocorreu um erro ao gerar o PDF.");
    }
  };

  const reorderAndRenumber = async (activitiesToProcess: any[]) => {
    if (!activitiesToProcess.length) return;

    // Sort activities according to standard 5-tier order: Direção -> N/O -> Código -> Mês -> Valor Total
    const sorted = [...activitiesToProcess].sort((a, b) =>
      compareActivitiesStandardOrder(a, b, getActMonthIndex),
    );

    // Group by department so numbering starts from 001 per department
    const deptGroups: Record<string, any[]> = {};
    sorted.forEach((act) => {
      const deptKey = (act.departamento || act.unidadeOrganica || "").trim();
      if (!deptGroups[deptKey]) deptGroups[deptKey] = [];
      deptGroups[deptKey].push(act);
    });

    // Direction counters for numeroDirecao
    const directionCounters: Record<string, number> = {};
    const updates: Promise<any>[] = [];

    Object.values(deptGroups).forEach((deptActs) => {
      deptActs.forEach((act, idx) => {
        const newNo = String(idx + 1).padStart(3, "0");

        // Calculate numeroDirecao (chronological within direction)
        const dirKey = (act.direcao || "SEM DIREÇÃO").toUpperCase();
        if (!directionCounters[dirKey]) directionCounters[dirKey] = 0;
        directionCounters[dirKey]++;
        const newNumeroDirecao = String(directionCounters[dirKey]).padStart(
          3,
          "0",
        );

        // Re-generate code for consistency
        const dirInitials = getDirectionAbbreviation(
          act.direcao || act.unidadeOrganica || "Songo",
        ).toUpperCase();
        const deptInitials = getDepartmentAbbreviation(
          act.departamento,
        ).toUpperCase();
        const actInitials = getActivityInitials(
          act.nomeAtividade || act.title || act.designacao || "",
        );

        const newCode = [
          dirInitials !== "-" ? dirInitials : "Songo",
          deptInitials !== "-" ? deptInitials : "",
          newNo,
          actInitials,
        ]
          .filter(Boolean)
          .join("/");

        const updateData = {
          no: newNo,
          numeroAtividade: newNo,
          nAtividade: newNo,
          codigoAtividade: newCode,
          referencia: newCode,
          numeroDirecao: newNumeroDirecao,
        };

        updates.push(firestoreService.matrixActivities.update(act.id, updateData));
      });
    });

    await Promise.all(updates);
  };

  const handleFixNumbering = async () => {
    if (!filteredActivities.length) return;

    setIsProcessing(true);
    onShowAlert(
      "A reordenar atividades por cronograma e a corrigir a numeração sequencial por departamento...",
    );

    // Função auxiliar para obter o índice do primeiro mês de realização (1-12)
    const getFirstMonthIndex = getActMonthIndex;

    try {
      // 1. Sort activities according to standard 5-tier order
      const sorted = [...filteredActivities].sort((a, b) =>
        compareActivitiesStandardOrder(a, b, getActMonthIndex),
      );

      // Group by department
      const deptGroups: Record<string, any[]> = {};
      sorted.forEach((act) => {
        const deptKey = (act.departamento || act.unidadeOrganica || "").trim();
        if (!deptGroups[deptKey]) deptGroups[deptKey] = [];
        deptGroups[deptKey].push(act);
      });

      // Direction counters for numeroDirecao
      const directionCounters: Record<string, number> = {};
      const updates: Promise<any>[] = [];

      Object.values(deptGroups).forEach((deptActs) => {
        deptActs.forEach((act, idx) => {
          const newNo = String(idx + 1).padStart(3, "0");

          // Calculate numeroDirecao
          const dirKey = (act.direcao || "SEM DIREÇÃO").toUpperCase();
          if (!directionCounters[dirKey]) directionCounters[dirKey] = 0;
          directionCounters[dirKey]++;
          const newNumeroDirecao = String(directionCounters[dirKey]).padStart(
            3,
            "0",
          );

          // Re-generate code for consistency
          const dirInitials = getDirectionAbbreviation(
            act.direcao || act.unidadeOrganica || "Songo",
          ).toUpperCase();
          const deptInitials = getDepartmentAbbreviation(
            act.departamento,
          ).toUpperCase();
          const actInitials = getActivityInitials(
            act.nomeAtividade || act.title || act.designacao || "",
          );

          const newCode = [
            dirInitials !== "-" ? dirInitials : "Songo",
            deptInitials !== "-" ? deptInitials : "",
            newNo,
            actInitials,
          ]
            .filter(Boolean)
            .join("/");

          const updateData = {
            no: newNo,
            numeroAtividade: newNo,
            nAtividade: newNo,
            codigoAtividade: newCode,
            referencia: newCode,
            numeroDirecao: newNumeroDirecao,
          };

          updates.push(firestoreService.matrixActivities.update(act.id, updateData));
        });
      });

      await Promise.all(updates);
      onShowAlert(
        "Numeração corrigida com sucesso! As atividades foram numeradas sequencialmente por departamento (a começar em 001).",
      );
    } catch (err) {
      console.error(err);
      onShowAlert("Ocorreu um erro ao tentar corrigir a numeração.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    if (filteredActivities && filteredActivities.length > 0) {
      const activeArea = [
        user?.setor,
        user?.reparticao,
        user?.departamento,
        user?.direcao,
        user?.unidadeOrganica,
      ].filter(Boolean)[0] || "INSTITUCIONAL";

      const dynamicTitle = `PLANO DE ATIVIDADE DE ${String(activeArea).toUpperCase()} - ${selectedYear}`;

      printActivitiesPlanDocument({
        activities: filteredActivities,
        user,
        year: selectedYear,
        title: dynamicTitle,
        subtitle: `Documento Oficial do Plano Económico e Social e Orçamento da Entidade (PESOE) - ${selectedYear}`,
        isDPEP: isDPEP,
      });
      return;
    }

    const printArea = document.getElementById("pesoe-print-area");
    if (printArea) {
      printElementById(
        "pesoe-print-area",
        `Plano de Atividades ${selectedYear} - Songo`,
        "landscape",
        "A3",
      );
    } else {
      printElementById("print-area");
    }
  };

  const handleExportExcel = (
    activitiesToExport: any[],
    customTitle: string,
  ) => {
    try {
      if (!activitiesToExport || activitiesToExport.length === 0) {
        onShowAlert("Nenhuma atividade encontrada para exportar.");
        return;
      }

      // Ordenar as atividades conforme a ordenação do sistema
      const sortedActivities = [...activitiesToExport].sort((a, b) =>
        (a.referencia || "").localeCompare(b.referencia || "", undefined, {
          numeric: true,
          sensitivity: "base",
        }),
      );

      // Definir os dados das duas linhas de cabeçalho
      const headerRow1 = [
        "N/O",
        "Nº Direção",
        "I. IDENTIFICAÇÃO",
        "",
        "",
        "II. ATIVIDADE",
        "",
        "",
        "V. TEMPO E DURAÇÃO",
        "",
        "VI. TRANS",
        "VII. RUBRICAS E NECESSIDADES",
        "",
        "",
        "",
        ""
      ];

      const headerRow2 = [
        "",
        "",
        "ÓRGÃO",
        "DIREÇÃO",
        "DEPARTAMENTO",
        "Cód./Atividade",
        "Nome da atividade",
        "Objetivo da atividade",
        "Trimestre / Período",
        "Met/Real.",
        "M/T",
        "Rúbrica",
        "Necessidade",
        "QUANT",
        "Unitário (MT)",
        "VALOR TOTAL GERAL (MZM)"
      ];

      // Agrupar atividades para permitir mesclagens (mesma atividade com múltiplas rubricas)
      const groupedData: any[][] = [];
      const merges: any[] = [
        { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }, // N/O
        { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } }, // Nº Direção
        { s: { r: 0, c: 2 }, e: { r: 0, c: 4 } }, // I. IDENTIFICAÇÃO
        { s: { r: 0, c: 5 }, e: { r: 0, c: 7 } }, // II. ATIVIDADE
        { s: { r: 0, c: 8 }, e: { r: 0, c: 9 } }, // V. TEMPO E DURAÇÃO
        { s: { r: 0, c: 10 }, e: { r: 1, c: 10 } }, // VI. TRANS
        { s: { r: 0, c: 11 }, e: { r: 0, c: 15 } } // VII. RUBRICAS E NECESSIDADES
      ];

      let currentRow = 2; // Começa após as duas linhas de cabeçalho

      // Agrupar por código/título para identificar rubricas da mesma atividade
      const groups: { [key: string]: any[] } = {};
      sortedActivities.forEach(act => {
        const key = `${act.no || ""}-${act.codigoAtividade || act.referencia || ""}-${act.title || act.designacao || ""}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(act);
      });

      Object.values(groups).forEach(group => {
        const rowCount = group.length;
        
        group.forEach((act, idx) => {
          const row = [
            idx === 0 ? (act.no || "") : "", // N/O
            idx === 0 ? "1" : "", // Nº Direção
            idx === 0 ? (act.unidadeOrganica || act.unidadeSelecionada || "Songo") : "", // ÓRGÃO
            idx === 0 ? (act.direcao || "") : "", // DIREÇÃO
            idx === 0 ? (act.departamento || "") : "", // DEPARTAMENTO
            idx === 0 ? (act.codigoAtividade || act.referencia || "") : "", // Cód./Atividade
            idx === 0 ? (act.title || act.designacao || "") : "", // Nome da atividade
            idx === 0 ? (act.objetivo || "") : "", // Objetivo da atividade
            idx === 0 ? (act.trimestre || "") : "", // Trimestre / Período
            idx === 0 ? (act.mesRealizacao || act.mes_realizacao || act.mes || "") : "", // Met/Real.
            idx === 0 ? (act.necessidadeTransporte || act.necessidade_transporte || "Não") : "", // M/T
            act.rubrica || "", // Rúbrica
            act.necessidade || "", // Necessidade
            act.numPessoasEnvolvidas || act.quant || 1, // QUANT
            act.unitario || 0, // Unitário (MT)
            act.valorTotal || act.valor_total || act.total || 0 // VALOR TOTAL GERAL (MZM)
          ];
          groupedData.push(row);
        });

        if (rowCount > 1) {
          // Adicionar mesclagens para as colunas A até K (0 a 10)
          for (let col = 0; col <= 10; col++) {
            merges.push({
              s: { r: currentRow, c: col },
              e: { r: currentRow + rowCount - 1, c: col }
            });
          }
        }
        currentRow += rowCount;
      });

      const ws = XLSX.utils.aoa_to_sheet([headerRow1, headerRow2, ...groupedData]);
      ws["!merges"] = merges;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, ws, "Plano de Atividades");

      // Definir larguras de coluna
      const colWidths = [
        { wch: 6 },  // N/O
        { wch: 12 }, // Nº Direção
        { wch: 25 }, // ÓRGÃO
        { wch: 25 }, // DIREÇÃO
        { wch: 25 }, // DEPARTAMENTO
        { wch: 20 }, // Cód./Atividade
        { wch: 35 }, // Nome da atividade
        { wch: 35 }, // Objetivo da atividade
        { wch: 18 }, // Trimestre / Período
        { wch: 15 }, // Met/Real.
        { wch: 8 },  // M/T
        { wch: 20 }, // Rúbrica
        { wch: 25 }, // Necessidade
        { wch: 8 },  // QUANT
        { wch: 15 }, // Unitário (MT)
        { wch: 20 }  // VALOR TOTAL GERAL (MZM)
      ];
      ws["!cols"] = colWidths;

      const fileName = `${customTitle.replace(/[^a-zA-Z0-9]/g, "_")}_${selectedYear}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      onShowAlert(`Download do ficheiro Excel "${fileName}" iniciado.`);
    } catch (err: any) {
      console.error(err);
      onShowAlert(
        "Erro ao exportar o plano de atividades para Excel: " + err.message,
      );
    }
  };

  const handleBulkUpdateActivityCodes = async () => {
    if (!isAdminOrProgrammer) return;

    if (
      !window.confirm(
        "Deseja recalcular e atualizar os códigos de todas as atividades planificadas para o novo formato (UNIDADE/DEP/REP/001)? Esta ação atualizará permanentemente os registros no banco de dados.",
      )
    ) {
      return;
    }

    try {
      setIsLoading(true);
      const allActivities = initialActivities;
      let updatedCount = 0;

      for (const activity of allActivities) {
        // Recalcular o código usando a nova lógica
        const dirInitials = getDirectionAbbreviation(
          activity.unidadeOrganica ||
            activity.unidadeSelecionada ||
            activity.direcao ||
            "Songo",
        ).toUpperCase();
        const deptInitials = getDepartmentAbbreviation(
          activity.departamento || "",
        ).toUpperCase();
        const repInitials = getReparticaoAbbreviation(
          activity.reparticao || activity.setor || "",
        ).toUpperCase();

        // Determinar o número sequencial (extrair do código antigo ou usar o campo no)
        let num = "001";
        const code = (
          activity.codigoAtividade ||
          activity.referencia ||
          activity.nAtividade ||
          ""
        ).toString();
        const match = code.match(/(\d+)$/);
        if (match) {
          num = String(parseInt(match[1], 10)).padStart(3, "0");
        } else if (activity.no) {
          const parsedNo = parseInt(
            String(activity.no).replace(/[^\d]/g, ""),
            10,
          );
          if (!isNaN(parsedNo)) num = String(parsedNo).padStart(3, "0");
        }

        const parts = [
          dirInitials !== "-" ? dirInitials : "",
          deptInitials !== "-" ? deptInitials : "",
          repInitials !== "-" ? repInitials : "",
          num,
        ].filter(Boolean);
        const newCode = parts.join("/");

        // Só atualiza se o código mudou
        if (newCode !== activity.codigoAtividade) {
          await firestoreService.matrixActivities.update(activity.id, {
            codigoAtividade: newCode,
            referencia: newCode, // Manter referência sincronizada
            updatedAt: new Date().toISOString(),
          });
          updatedCount++;
        }
      }

      onShowAlert(
        `Sucesso: ${updatedCount} códigos de atividades foram atualizados para o novo formato.`,
      );
    } catch (err: any) {
      console.error("Erro ao atualizar códigos:", err);
      onShowAlert("Erro ao atualizar códigos: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ActivitySelectionContext.Provider
      value={{
        rawActivities,
        selectedActivityIds,
        onToggleSelect: handleToggleSelectActivity,
        onEditActivity: setEditingActivity,
      }}
    >
      <div className="flex-1 w-full flex flex-col bg-[#fefefe] print:bg-white text-slate-800">
        <input
          type="file"
          accept=".xlsx, .xls"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileConversion}
        />

        {stagedActivities.length > 0 && stagedAnalysis && (
          <div className="bg-indigo-600 border-b border-indigo-700 px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-6 sticky top-0 z-50 shadow-2xl animate-in slide-in-from-top duration-500">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-md text-white p-3 rounded-xl border border-white/20">
                <BarChart3 size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-white font-black text-xs  tracking-widest flex items-center gap-2">
                  Análise do Plano Importado <span className="bg-white text-indigo-600 px-2 py-0.5 rounded-full text-[9px] font-black">{stagedAnalysis.count} Atividades</span>
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-indigo-100 text-[10px] font-bold ">Orçamento Total:</span>
                    <span className="text-white text-sm font-black tracking-tight">{stagedAnalysis.totalValue.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}</span>
                  </div>
                  <div className="w-px h-3 bg-indigo-400 hidden md:block"></div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-indigo-100 text-[10px] font-bold ">Logística:</span>
                    <span className="text-white text-[11px] font-bold">{stagedAnalysis.withTransport} c/ Transporte</span>
                  </div>
                  {stagedAnalysis.missingValues > 0 && (
                    <>
                      <div className="w-px h-3 bg-indigo-400 hidden md:block"></div>
                      <div className="flex items-center gap-1.5">
                        <AlertCircle size={12} className="text-amber-300" />
                        <span className="text-amber-200 text-[10px] font-bold italic">{stagedAnalysis.missingValues} s/ valor</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={() => setStagedActivities([])}
                className="flex-1 md:flex-none px-5 py-2.5 bg-indigo-800/50 text-indigo-100 rounded-xl text-[10px] font-black  border border-indigo-500/30 hover:bg-indigo-800 transition-all"
              >
                Descartar
              </button>
              <button 
                onClick={handleConfirmSubmission}
                className="flex-1 md:flex-none px-8 py-2.5 bg-white text-indigo-600 rounded-xl text-[10px] font-black  shadow-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 group"
              >
                Submeter Plano Analisado <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}
        {/* Top bar from image */}
        <div className="bg-white border-b border-slate-100 px-8 py-4 print:hidden">
          <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Georgia, serif' }}>
            Conselho de Representantes - Plano
          </h2>
        </div>

        {/* Simulation/Role Mode Header for interactive demo */}
        <div className="bg-amber-50 border-b border-amber-100 px-8 py-3 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
              <AlertCircle size={16} />
              <span>SIMULADOR DE FLUXO DE PLANIFICAÇÃO (Songo):</span>
            </div>
            <span
              className={`text-[10px] md:text-xs px-3 py-1 rounded-full  font-black transition-all inline-block ${
                pesoeConfig?.published
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : "bg-rose-100 text-rose-800 border border-rose-200"
              }`}
            >
              DE:{" "}
              {pesoeConfig?.published
                ? "🟢 PUBLICADO PARA DIRETORES"
                : "🔴 INDISPONÍVEL PARA DIRETORES"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(isSuperBossUser(realUser)
              ? [
                  "Setor",
                  "Repartição",
                  "Departamento",
                  "Direção",
                  "Planificação",
                  "Chefe DPEP",
                  "Órgão Colegial",
                ]
              : []
            ).map((role) => (
              <button
                key={role}
                onClick={() => {
                  setSelectedRoleMode(role);
                  onShowAlert(`A visualizar como: ${role}`);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedRoleMode === role
                    ? "bg-[#e67e22] text-white shadow-sm"
                    : "bg-white hover:bg-amber-100 text-amber-700 border border-amber-200"
                }`}
              >
                {role === "Setor"
                  ? "Plano do Setor"
                  : role === "Repartição"
                    ? "Plano da Repartição"
                    : role === "Departamento"
                      ? "Plano do Departamento"
                      : role === "Direção"
                        ? "Plano de Direção"
                        : role === "Planificação"
                          ? "Setor de Planificação"
                          : role === "Chefe DPEP"
                            ? "Chefe do DPEP"
                            : "Órgão Colegial"}
              </button>
            ))}
          </div>
        </div>

        {/* Novo Ecrã de Boas Vindas/Seleção de Fluxo */}
        {workflowMode === "landing" && (
          <DPEPDashboard 
            activities={rawActivities.filter(a => Number(a.ano) === selectedYear)} 
            onSelectWorkflow={(mode) => {
              if (mode === 'planning') {
                setSelectedYear(2027);
                setShowAddForm(true);
              }
              setWorkflowMode(mode);
            }}
            onImport={() => fileInputRef.current?.click()}
            selectedYear={selectedYear === 2026 ? 2027 : selectedYear}
          />
        )}

        {workflowMode !== "landing" && (
          <div className="flex-grow">
            {/* Main Title Banner (Visual Style matching the image) */}
            {!isFocusMode && (
              <div className="bg-[#0f172a] text-white p-6 md:px-10 border-b border-slate-800 print:hidden">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <div>
                    <h1 className="text-2xl font-black text-white tracking-tight mb-1">
                      Plano Geral de Atividades
                    </h1>
                    <p className="text-slate-400 text-[10px] font-medium  tracking-widest">
                      Gestão Institucional de Atividades Songo
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center justify-center relative">
                    <div className="relative">
                      <button
                        onClick={() => setShowYearMenu(!showYearMenu)}
                        className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10px]  tracking-widest px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 border border-slate-700"
                      >
                        <Calendar size={14} />{" "}
                        <span style={{ fontFamily: '"Bookman Old Style", serif' }}>
                          {selectedYear === 2026
                            ? "Plano Atual (2026)"
                            : `Arquivo ${selectedYear}`}
                        </span>
                      </button>
                      {showYearMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-[100] overflow-hidden">
                          <div className="p-2 text-[10px] font-black  text-slate-400 border-b border-slate-700 px-4 py-2">
                            Selecionar Ano
                          </div>
                          {[2027, 2026, 2025, 2024, 2023, 2022, 2021, 2020].map(
                            (y) => (
                              <button
                                key={y}
                                onClick={() => {
                                  setSelectedYear(y);
                                  setShowYearMenu(false);
                                  onShowAlert(`Visualizando Exercício de ${y}`);
                                  // Abrir formulário se for 2027 e estiver no modo setor
                                  if (
                                    y === 2027 &&
                                    selectedRoleMode === "Setor"
                                  ) {
                                    setShowAddForm(true);
                                  }
                                }}
                                className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${
                                  selectedYear === y
                                    ? "bg-amber-600 text-white"
                                    : "text-slate-200 hover:bg-slate-700"
                                }`}
                              >
                                Exercício {y}{" "}
                                {y === 2026
                                  ? "(Plano Atual)"
                                  : y === 2027
                                    ? "(Nova Planificação)"
                                    : "(Arquivo)"}
                              </button>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setIsFocusMode(!isFocusMode)}
                      className={`${isFocusMode ? "bg-amber-600" : "bg-indigo-600"} hover:opacity-90 text-white font-bold text-[10px]  tracking-widest px-4 py-2.5 rounded-lg transition-all flex items-center gap-2`}
                    >
                      {isFocusMode ? (
                        <Minimize2 size={14} />
                      ) : (
                        <Maximize2 size={14} />
                      )}{" "}
                      Foco
                    </button>
                    {!isReadOnly && isAdminOrProgrammer && (
                      <>
                        <button
                          onClick={handleReplicatePreviousPlan}
                          className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-[10px]  tracking-widest px-4 py-2.5 rounded-lg transition-all flex items-center gap-2"
                        >
                          <Copy size={14} /> Replicar
                        </button>
                        <button
                          onClick={startSyncProcess}
                          disabled={isLoading}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px]  tracking-widest px-4 py-2.5 rounded-lg transition-all flex items-center gap-2"
                        >
                          {isLoading ? (
                            <RefreshCw size={14} strokeWidth={1.5} className="animate-spin" />
                          ) : (
                            <FileUp size={14} />
                          )}{" "}
                          Converter
                        </button>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-slate-700 hover:bg-slate-600 text-white font-bold text-[10px]  tracking-widest px-4 py-2.5 rounded-lg transition-all flex items-center gap-2"
                        >
                          <Upload size={14} /> Importar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedActivityIds.length > 0 && (
              <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md text-white px-8 py-3.5 shadow-2xl flex flex-wrap items-center justify-between gap-4 border-b border-slate-700 animate-slide-down print:hidden">
                <div className="flex items-center gap-3">
                  <span className="bg-amber-500 text-slate-950 font-black px-3 py-1 rounded-xl text-xs">
                    {selectedActivityIds.length} atividade(s) selecionada(s)
                  </span>
                  <span className="text-xs font-medium text-slate-300">
                    Ações em lote para aprovação e recondução:
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => handleBulkUpdateApproval("aprovada")}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <span>✓ Aprovar Selecionadas</span>
                  </button>
                  <button
                    onClick={handleBulkRolloverYear}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <span>🔄 Reconduzir para Ano+1</span>
                  </button>
                  <button
                    onClick={() => setSelectedActivityIds([])}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition-all cursor-pointer"
                  >
                    ✕ Limpar Seleção
                  </button>
                </div>
              </div>
            )}

            {isFocusMode && (
              <div className="fixed top-6 right-6 z-[100] print:hidden flex items-center gap-3">
                <div className="bg-slate-900 text-amber-500 px-6 py-4 rounded-2xl shadow-2xl font-black text-xs  tracking-widest border-2 border-amber-500/50" style={{ fontFamily: '"Bookman Old Style", serif' }}>
                  <Calendar size={18} className="inline mr-2" /> {selectedYear}
                </div>
                <button
                  onClick={() => setIsFocusMode(false)}
                  className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-black text-xs  tracking-widest hover:scale-105 active:scale-95 transition-all border border-slate-700"
                  title="Clique para voltar ao cabeçalho principal"
                >
                  <Minimize2 size={18} className="text-blue-400" /> Sair do Modo
                  Foco
                </button>
              </div>
            )}

            {/* Dashboard Workflow Progress Bar - Removido conforme solicitação */}
            {!isFocusMode && (
              <>
                {isSuperBossUser(user) &&
                  title &&
                  title !== "Plano Setorial" &&
                  title !== "Sistema" &&
                  title !== "Geral" && (
                    <div className="mx-8 mt-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm print:hidden animate-fade-in">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 text-white rounded-lg">
                          <Eye size={20} />
                        </div>
                        <div>
                          <h3 className="text-blue-900 font-black text-xs  tracking-tight">
                            Vigilância do Administrador: Modo Supervisor Ativo
                          </h3>
                          <p className="text-blue-700 text-[10px] font-medium">
                            Está a explorar a informação de{" "}
                            <strong className="text-blue-900">{title}</strong>{" "}
                            exatamente como o utilizador final deste setor.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSimulateSector(!simulateSector)}
                        className={`px-4 py-2 text-[10px] font-bold rounded-lg transition-all  tracking-widest ${
                          simulateSector
                            ? "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        {simulateSector
                          ? "Ver Todos os Setores"
                          : "Simular Setor Atual"}
                      </button>
                    </div>
                  )}

                {selectedYear !== 2026 && (
                  <div
                    className={`mx-8 mt-6 p-3 md:p-4 border rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm ${selectedYear === 2027 ? "bg-[#f4f7fc] border-blue-100" : "bg-amber-50 border-amber-200"}`}
                  >
                    {/* Left side: File Dropdown */}
                    <div className="relative inline-block text-left shrink-0 w-full md:w-auto flex justify-start">
                      <button
                        onClick={() => setShowFileMenu(!showFileMenu)}
                        className="px-5 py-2.5 bg-[#0f172a] hover:bg-slate-800 text-white font-black text-[11px]  tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-lg h-[40px] cursor-pointer"
                      >
                        <Folder size={14} className="text-amber-400" />
                        <span>FILE</span>
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-200 ${showFileMenu ? "rotate-180" : ""}`}
                        />
                      </button>
                      {showFileMenu && (
                        <>
                          <div
                            className="fixed inset-0 z-[90]"
                            onClick={() => setShowFileMenu(false)}
                          />
                          <div className="absolute left-0 mt-12 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                            <div className="p-2 space-y-1">
                              <button
                                onClick={() => {
                                  setShowFileMenu(false);
                                  setShowAddForm(true);
                                  setEditingActivity(null);
                                }}
                                className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors flex items-center gap-3 cursor-pointer"
                              >
                                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                                  <Plus size={15} strokeWidth={2.5} />
                                </div>
                                <span>Nova Atividade</span>
                              </button>

                              <button
                                onClick={() => {
                                  setShowFileMenu(false);
                                  handlePrint();
                                }}
                                className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-3 cursor-pointer"
                              >
                                <div className="p-1.5 rounded-lg bg-slate-200 text-slate-700">
                                  <Printer size={15} strokeWidth={2.5} />
                                </div>
                                <span>Imprimir</span>
                              </button>

                              <button
                                onClick={() => {
                                  setShowFileMenu(false);
                                  onShowAlert(
                                    "Atividades guardadas na base de dados com sucesso!",
                                  );
                                }}
                                className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors flex items-center gap-3 cursor-pointer"
                              >
                                <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                                  <Save size={15} strokeWidth={2.5} />
                                </div>
                                <span>Guardar</span>
                              </button>

                               <button
                                onClick={() => {
                                  setShowFileMenu(false);
                                  if (isReadOnly) {
                                    onShowAlert(
                                      "Modo de consulta. Não é possível submeter atividades.",
                                    );
                                    return;
                                  }
                                  if (selectedRoleMode === "Setor")
                                    handleSendSetorToReparticao();
                                  else if (selectedRoleMode === "Repartição")
                                    handleSendReparticaoToDepartamento();
                                  else if (selectedRoleMode === "Departamento")
                                    handleSendDepartamentoToDirecao();
                                  else if (selectedRoleMode === "Direção")
                                    handleSendDirecaoToPlanificacao();
                                  else if (selectedRoleMode === "Planificação")
                                    handleSendPlanificacaoToChefeDPEP();
                                  else if (selectedRoleMode === "Chefe DPEP")
                                    handleSendChefeDPEPToOrgaoColegial();
                                  else if (selectedRoleMode === "Órgão Colegial")
                                    handleOrgaoColegialAprovar();
                                  else
                                    onShowAlert(
                                      "Ação não configurada para este nível.",
                                    );
                                }}
                                className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:text-violet-700 hover:bg-violet-50 rounded-xl transition-colors flex items-center gap-3 cursor-pointer"
                              >
                                <div className="p-1.5 rounded-lg bg-violet-100 text-violet-700">
                                  <Send size={15} strokeWidth={2.5} />
                                </div>
                                <span>Enviar</span>
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Center: Title and Subtitle */}
                    <div className="flex-1 text-center">
                      <h3
                        className={`font-black text-[13px]  tracking-wide mb-0.5 ${selectedYear === 2027 ? "text-[#1e3a8a]" : "text-amber-900"}`}
                        style={{ fontFamily: '"Bookman Old Style", serif' }}
                      >
                        {selectedYear === 2027
                          ? `NOVO CICLO DE PLANIFICAÇÃO: ${selectedYear}`
                          : `MODO DE CONSULTA HISTÓRICA: ${selectedYear}`}
                      </h3>
                      <p
                        className={`text-[10px] font-medium ${selectedYear === 2027 ? "text-blue-600" : "text-amber-700"}`}
                      >
                        {selectedYear === 2027
                          ? `Você está a elaborar o novo plano para o exercício económico de ${selectedYear}.`
                          : `Você está visualizando o arquivo de atividades do ano ${selectedYear}. Dados protegidos contra alterações acidentais.`}
                      </p>
                    </div>

                    {/* Right side: Action Button */}
                    <div className="shrink-0 w-full md:w-auto flex flex-wrap gap-2 justify-end">
                      {!isReadOnly &&
                      [
                        "Setor",
                        "Repartição",
                        "Departamento",
                        "Direção",
                        "Planificação",
                        "Chefe DPEP",
                        "Órgão Colegial",
                      ].includes(selectedRoleMode) ? (
                        <>
                          {selectedRoleMode === "Direção" && (
                            <button
                              onClick={handleSendPlanoGeralToDepartamentos}
                              className="bg-amber-600 hover:bg-amber-700 text-white font-black tracking-widest text-[9px]  px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shadow-lg shadow-amber-100 h-[40px]"
                              title="Enviar atividades criadas na Direção para planificação nos Departamentos correspondentes"
                            >
                              <Send size={14} strokeWidth={3} /> Enviar Plano Geral para Departamentos
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (selectedRoleMode === "Setor")
                                handleSendSetorToReparticao();
                              else if (selectedRoleMode === "Repartição")
                                handleSendReparticaoToDepartamento();
                              else if (selectedRoleMode === "Departamento")
                                handleSendDepartamentoToDirecao();
                              else if (selectedRoleMode === "Direção")
                                handleSendDirecaoToPlanificacao();
                              else if (selectedRoleMode === "Planificação")
                                handleSendPlanificacaoToChefeDPEP();
                              else if (selectedRoleMode === "Chefe DPEP")
                                handleSendChefeDPEPToOrgaoColegial();
                              else if (selectedRoleMode === "Órgão Colegial")
                                handleOrgaoColegialAprovar();
                            }}
                            className={`${selectedRoleMode === "Órgão Colegial" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100" : "bg-[#2563eb] hover:bg-[#1d4ed8] shadow-blue-100"} text-white font-black tracking-widest text-[9px]  px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shadow-lg h-[40px]`}
                          >
                            <Send size={14} strokeWidth={3} /> {
                              selectedRoleMode === "Setor"
                                ? "SUBMETER PLANO DO SETOR"
                                : selectedRoleMode === "Repartição"
                                  ? "SUBMETER PLANO DA REPARTIÇÃO"
                                  : selectedRoleMode === "Departamento"
                                    ? "SUBMETER PLANO DO DEPARTAMENTO"
                                    : selectedRoleMode === "Direção"
                                      ? "SUBMETER PLANO DA DIREÇÃO"
                                      : selectedRoleMode === "Planificação"
                                        ? "ENVIAR AO CHEFE DO DPEP"
                                        : selectedRoleMode === "Chefe DPEP"
                                          ? "ENVIAR PROPOSTA AO ÓRGÃO COLEGIAL"
                                          : "APROVAR & HOMOLOGAR PESOE"
                            }
                          </button>
                        </>
                      ) : (
                        <div className="h-[40px] px-5 w-[200px] hidden md:block"></div>
                      )}
                    </div>
                  </div>
                )}
                {(user?.email === "slaitertripas@gmail.com" || user?.role === "admin" || user?.role === "administrador" || selectedRoleMode === "Planificação") && (
                  <div className="flex flex-wrap gap-2">
                    {selectedYear <= 2025 && (
                      <button
                        onClick={handleClearPreviousCycles}
                        disabled={isLoading}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-[10px] font-black rounded-lg transition-colors  tracking-widest flex items-center gap-2 shadow-lg"
                        title="Eliminar planos de 2025 e anteriores"
                      >
                        <Trash2 size={14} /> Excluir Planos Anteriores
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {/* --- LEVEL 1: PLANO SETORIAL --- */}
            {selectedRoleMode === "Setor" && (
              <div className="p-3 sm:p-4 md:p-6 space-y-3 flex-1 w-full bg-white">
                <InstitutionalHeader
                  unidadeName={user.unidadeOrganica}
                  direcaoName={user.direcao}
                  departamentoName={user.departamento}
                  reparticaoName={user.reparticao}
                  sectorName={user.setor}
                  year={selectedYear}
                  isOwner={isSuperBossUser(user)}
                />

                <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b-2 border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight ">
                      Resumo do Setor
                    </h3>
                    <p className="text-sm font-bold text-slate-500 mt-1">
                      Total de {filteredActivities.length} Atividades
                      Planificadas
                    </p>
                  </div>
                </div>

                {/* List of Setorial Activities with grouping like Planificação */}
                <div className="space-y-3">
                  {Object.entries(filteredActivitiesGrouped.byDirecao).map(
                    ([direcao, activities]) => {
                      const groupedByDept =
                        filteredActivitiesGrouped.byDirecaoAndDept[direcao];

                      return (
                        <div
                          key={direcao}
                          className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full"
                        >
                          <div className="flex items-center gap-4 group px-4">
                            <div className="h-10 w-2 bg-blue-600 rounded-full group-hover:h-12 transition-all"></div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight ">
                              {direcao}
                              <span className="ml-3 text-sm font-medium text-slate-400 normal-case tracking-normal">
                                ({(activities as any[]).length}{" "}
                                {(activities as any[]).length === 1
                                  ? "Atividade"
                                  : "Atividades"}
                                )
                              </span>
                            </h3>
                          </div>

                          <div className="flex flex-col">
                            {Object.entries(groupedByDept).map(
                              ([dept, deptActivities]) => (
                                <div
                                  key={dept}
                                  className="bg-slate-50/50 rounded-2xl p-3 sm:p-4 border border-slate-100 w-full m-[2px]"
                                >
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="h-2 w-2 rounded-full bg-blue-400"></div>
                                    <h4 className="text-sm font-bold text-slate-700  tracking-wider">
                                      {dept}
                                    </h4>
                                  </div>

                                  <div className="overflow-x-auto print:overflow-visible border border-slate-200 rounded-2xl shadow-sm mb-3 w-full" data-print-type="plano">
                                    <table className="w-full border-collapse print:min-w-full print-table-compact">
                                      <ActivityTableHeader isDPEP={isDPEP} />
                                      <tbody className="divide-y divide-slate-200">
                                        {(deptActivities as any[]).map(
                                          (activity, idx) => (
                                            <ActivityTableRow
                                              key={activity.id || idx}
                                              activity={activity}
                                              onViewHistory={setActivityForHistory}
                                              getActivityTotal={
                                                getActivityTotal
                                              }
                                              index={idx}
                                              isDPEP={isDPEP}
                                              user={user}
                                              isBossOrAdmin={isBossOrAdmin}
                                              onUpdateExecution={
                                                onUpdateExecution
                                              }
                                              onUpdateRelatorio={
                                                onUpdateRelatorio
                                              }
                                              rawActivities={rawActivities}
                                              selectedActivityIds={
                                                selectedActivityIds
                                              }
                                              onToggleSelect={
                                                handleToggleSelectActivity
                                              }
                                              actions={
                                                <div className="flex items-center justify-center gap-2">
                                                  {canEdit(activity) ? (
                                                    <>
                                                      <button
                                                        onClick={() => {
                                                          setEditingActivity(
                                                            activity,
                                                          );
                                                          setShowAddForm(true);
                                                        }}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Editar"
                                                      >
                                                        <Edit2 size={14} />
                                                      </button>
                                                      <button
                                                        onClick={() =>
                                                          handleDelete(
                                                            activity.id,
                                                          )
                                                        }
                                                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                        title="Eliminar"
                                                      >
                                                        <Trash2 size={14} />
                                                      </button>
                                                    </>
                                                  ) : (
                                                    <button
                                                      onClick={() => {
                                                        setEditingActivity(
                                                          activity,
                                                        );
                                                        setShowAddForm(true);
                                                      }}
                                                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                      title="Visualizar"
                                                    >
                                                      <Eye size={14} />
                                                    </button>
                                                  )}
                                                  <button
                                                    onClick={() => {
                                                      const currentStatus = activity.status || "draft";
                                                      const nextStatus = (currentStatus === "draft" || currentStatus === "setorial") ? "reparticao" :
                                                                       currentStatus === "reparticao" ? "departamento" :
                                                                       currentStatus === "departamento" ? "direcao" :
                                                                       currentStatus === "direcao" ? "planificacao" :
                                                                       currentStatus === "planificacao" ? "dpep_chefe" : "institucional";
                                                      const originLabel = currentStatus === "reparticao" ? "Repartição" :
                                                                          currentStatus === "departamento" ? "Departamento" :
                                                                          currentStatus === "direcao" ? "Direção" :
                                                                          currentStatus === "planificacao" ? "Setor de Planificação" : "Chefe do DPEP";
                                                      const destLabel = nextStatus === "departamento" ? "Departamento" :
                                                                        nextStatus === "direcao" ? "Direção" :
                                                                        nextStatus === "planificacao" ? "Setor de Planificação" :
                                                                        nextStatus === "dpep_chefe" ? "Chefe do DPEP" : "Plano Institucional";
                                                      handleWorkflowTransition(currentStatus, nextStatus, originLabel, destLabel, [activity]);
                                                    }}
                                                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                    title="Tramitar / Assinar Documento"
                                                  >
                                                    <Send size={14} />
                                                  </button>
                                                  <button
                                                    onClick={() =>
                                                      handleExportPDF([
                                                        activity,
                                                      ])
                                                    }
                                                    className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                                                    title="Exportar PDF"
                                                  >
                                                    <FileText size={14} />
                                                  </button>
                                                </div>
                                              }
                                            />
                                          ),
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      );
                    },
                  )}

                  {filteredActivities.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 animate-in fade-in duration-1000 mx-8">
                      <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-6">
                        <Plus className="text-slate-300 w-10 h-10" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">
                        Plano de Atividades Vazio
                      </h3>
                      <p className="text-slate-500 text-sm max-w-xs text-center leading-relaxed">
                        Ainda não existem atividades planificadas por si para o
                        exercício de {selectedYear}.
                      </p>
                      {!isReadOnly && (
                        <button
                          onClick={() => setShowAddForm(true)}
                          className="mt-8 bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                        >
                          Criar Primeira Atividade
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- LEVEL 1.5: PLANO DA REPARTIÇÃO --- */}
            {selectedRoleMode === "Repartição" && (
              <div className="p-3 sm:p-4 md:p-6 space-y-3 flex-1 w-full bg-white">
                <InstitutionalHeader
                  unidadeName={user.unidadeOrganica}
                  direcaoName={user.direcao}
                  departamentoName={user.departamento}
                  reparticaoName={user.reparticao}
                  sectorName={user.setor}
                  year={selectedYear}
                  isOwner={isSuperBossUser(user)}
                />

                <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b-2 border-slate-100 pb-3">
                  {/* Botões removidos conforme solicitação */}
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm w-full">
                  <div className="px-6 py-4 bg-[#f8fafc] border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-black text-blue-600  tracking-widest">
                      Atividades na Repartição
                    </span>
                    <div className="flex gap-4">
                      <span className="text-[10px] font-bold text-[#f59e0b]  tracking-wider">
                        {
                          filteredActivities.filter(
                            (a) =>
                              (a.status as any) === "reparticao" &&
                              !a.submetido,
                          ).length
                        }{" "}
                        Pendentes de Envio
                      </span>
                      <span className="text-[10px] font-bold text-blue-500  tracking-wider">
                        {
                          filteredActivities.filter(
                            (a) =>
                              (a.status as any) === "reparticao" && a.submetido,
                          ).length
                        }{" "}
                        Enviados (Cópia)
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto print:overflow-visible border border-slate-200 rounded-2xl shadow-sm mb-3 w-full" data-print-type="plano">
                    <table className="w-full text-left border-collapse print:min-w-full font-sans text-xs print-table-compact">
                      <ActivityTableHeader isDPEP={isDPEP} />
                      <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                        {filteredActivities.filter(Boolean).filter(Boolean).map((activity, idx) => (
                          <ActivityTableRow
                            key={activity.id}
                            activity={activity}
                            onViewHistory={setActivityForHistory}
                            index={idx}
                            isDPEP={isDPEP}
                            user={user}
                            isBossOrAdmin={isBossOrAdmin}
                            getActivityTotal={getActivityTotal}
                            onUpdateExecution={onUpdateExecution}
                            onUpdateRelatorio={onUpdateRelatorio}
                            onUpdateApproval={onUpdateApproval}
                            onRolloverYear={onRolloverYear}
                            rawActivities={rawActivities}
                            selectedActivityIds={selectedActivityIds}
                            onToggleSelect={handleToggleSelectActivity}
                            actions={
                              !canEdit(activity) ? (
                                <div className="flex justify-center items-center gap-2">
                                  <Lock size={12} className="text-slate-400" />
                                  <button
                                    onClick={() => {
                                      setEditingActivity(activity);
                                      setShowAddForm(true);
                                    }}
                                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                                    title="Visualizar"
                                  >
                                    <Eye size={13} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(activity.id)}
                                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded"
                                    title="Remover"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex justify-center gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingActivity(activity);
                                      setShowAddForm(true);
                                    }}
                                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                                    title="Editar"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(activity.id)}
                                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded"
                                    title="Remover"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              )
                            }
                          />
                        ))}
                        {filteredActivities.filter(
                          (a) => (a.status as any) === "reparticao",
                        ).length === 0 && (
                          <tr>
                            <td
                              colSpan={37}
                              className="p-12 text-center text-slate-400 italic font-medium"
                            >
                              Nenhuma atividade planificada na repartição.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* --- LEVEL 2: PLANO DE DEPARTAMENTO --- */}
            {selectedRoleMode === "Departamento" && (
              <div className="p-3 sm:p-4 md:p-6 space-y-3 flex-1 w-full bg-white">
                <InstitutionalHeader
                  unidadeName={user.unidadeOrganica}
                  direcaoName={user.direcao}
                  departamentoName={user.departamento}
                  reparticaoName={user.reparticao}
                  sectorName={user.setor}
                  year={selectedYear}
                  isOwner={isSuperBossUser(user)}
                />

                <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b-2 border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowReceivedPlans(false)}
                      className={`px-5 py-3 rounded-xl font-black text-xs  tracking-wider transition-all ${!showReceivedPlans ? "bg-slate-900 text-white shadow-lg" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                    >
                      Meu Plano de Departamento
                    </button>
                    <button
                      onClick={() => setShowReceivedPlans(true)}
                      className={`px-5 py-3 rounded-xl font-black text-xs  tracking-wider transition-all flex items-center gap-2 ${showReceivedPlans ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                    >
                      <Users size={15} /> Ver Planos Recebidos (
                      {
                        filteredActivities.filter(
                          (a) =>
                            (a.status as any) === "reparticao" ||
                            (a.status as any) === "setorial",
                        ).length
                      }
                      )
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    {!showReceivedPlans && !isReadOnly && (
                      <>
                        <button
                          onClick={handleUnifyDepartmentPlan}
                          className="bg-purple-600 text-white font-black tracking-widest text-[9px]  px-6 py-4 rounded-xl shadow-lg shadow-purple-100 hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
                          title="Unificar todas as atividades das repartições e setores no plano do departamento"
                        >
                          <Layers size={14} strokeWidth={3} /> Unificar
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Card do Orçamento do Departamento */}
                <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black  tracking-widest text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30">
                        Orçamento do Departamento
                      </span>
                    </div>
                    <h3 className="text-xl font-black mt-2 text-slate-100  tracking-tight">
                      {user?.departamento || "Departamento Logado"}{" "}
                      {showReceivedPlans
                        ? "- (Planos Recebidos dos Subordinados)"
                        : "- (Meu Plano)"}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {showReceivedPlans
                        ? "Visualizando os planos enviados pelas repartições e setores subordinados."
                        : "O valor total de todas as atividades planificadas para o departamento."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <div className="bg-slate-800/90 border border-slate-700/80 p-4 rounded-xl text-right min-w-[200px]">
                      <span className="text-[10px] font-bold text-slate-400  tracking-wider block">
                        Atividades (Sem Salários)
                      </span>
                      <span className="text-xl font-black text-emerald-400 font-mono">
                        {deptBudgetTotal.toLocaleString("pt-MZ", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        MZN
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        {
                          filteredActivities.filter((a) => !isSalaryActivity(a))
                            .length
                        }{" "}
                        Atividades
                      </span>
                    </div>
                    {deptSalaryTotal > 0 && (
                      <div className="bg-amber-950/40 border border-amber-900/50 p-4 rounded-xl text-right min-w-[200px]">
                        <span className="text-[10px] font-bold text-amber-300  tracking-wider block">
                          Salários (Anualizado x12)
                        </span>
                        <span className="text-xl font-black text-amber-400 font-mono">
                          {deptSalaryTotal.toLocaleString("pt-MZ", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          MZN
                        </span>
                        <span className="text-[10px] text-amber-300 block mt-1">
                          {
                            filteredActivities.filter((a) =>
                              isSalaryActivity(a),
                            ).length
                          }{" "}
                          Atividades de Salário
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {!showReceivedPlans ? (
                  /* Meu Plano de Departamento (Apenas atividades do departamento) */
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm w-full">
                    <div className="px-6 py-4 bg-[#f8fafc] border-b border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-black text-blue-600  tracking-widest">
                        Plano do Departamento ({user?.departamento || ""})
                      </span>
                      <span className="text-[10px] font-bold text-slate-500  tracking-wider">
                        {
                          filteredActivities.filter(
                            (a) =>
                              isDPEP ||
                              isSuperBossUser(user) ||
                              isDepartmentMatch(a.departamento, user?.departamento) ||
                              isDepartmentMatch(a.departamento, title) ||
                              isDepartmentMatch(a.unidadeOrganica, title),
                          ).length
                        }{" "}
                        Atividades
                      </span>
                    </div>
                    <div className="overflow-x-auto print:overflow-visible border border-slate-200 rounded-2xl shadow-sm mb-3 w-full" data-print-type="plano">
                      <table className="w-full text-left border-collapse print:min-w-full font-sans text-xs print-table-compact">
                        <ActivityTableHeader isDPEP={isDPEP} />
                        <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                          {filteredActivities
                            .filter(
                              (a) =>
                                isDPEP ||
                                isSuperBossUser(user) ||
                                isDepartmentMatch(a.departamento, user?.departamento) ||
                                isDepartmentMatch(a.departamento, title) ||
                                isDepartmentMatch(a.unidadeOrganica, title),
                            )
                            .filter(Boolean).filter(Boolean).map((activity, idx) => (
                              <ActivityTableRow
                                key={activity.id}
                                activity={activity}
                                onViewHistory={setActivityForHistory}
                                index={idx}
                                isDPEP={isDPEP}
                                user={user}
                                isBossOrAdmin={isBossOrAdmin}
                                getActivityTotal={getActivityTotal}
                                onUpdateExecution={onUpdateExecution}
                                onUpdateRelatorio={onUpdateRelatorio}
                                onUpdateApproval={onUpdateApproval}
                                onRolloverYear={onRolloverYear}
                                rawActivities={rawActivities}
                                selectedActivityIds={selectedActivityIds}
                                onToggleSelect={handleToggleSelectActivity}
                                actions={
                                  !canEdit(activity) ? (
                                    <div className="flex justify-center items-center gap-2">
                                      <Lock
                                        size={12}
                                        className="text-slate-400"
                                      />
                                      <button
                                        onClick={() => {
                                          setEditingActivity(activity);
                                          setShowAddForm(true);
                                        }}
                                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                                        title="Visualizar"
                                      >
                                        <Eye size={13} />
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDelete(activity.id)
                                        }
                                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded"
                                        title="Remover"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex justify-center gap-1">
                                      <button
                                        onClick={() => {
                                          setEditingActivity(activity);
                                          setShowAddForm(true);
                                        }}
                                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                                        title="Editar"
                                      >
                                        <Edit2 size={13} />
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDelete(activity.id)
                                        }
                                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded"
                                        title="Remover"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  )
                                }
                              />
                            ))}
                          {filteredActivities.filter(
                            (a) =>
                              isDPEP ||
                              isSuperBossUser(user) ||
                              isDepartmentMatch(a.departamento, user?.departamento) ||
                              isDepartmentMatch(a.departamento, title) ||
                              isDepartmentMatch(a.unidadeOrganica, title),
                          ).length === 0 && (
                            <tr>
                              <td
                                colSpan={37}
                                className="p-12 text-center text-slate-400 italic font-medium"
                              >
                                Nenhuma atividade no plano próprio do
                                departamento. Pode criar atividades ou unificar
                                planos recebidos.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  /* Planos Recebidos (Grouped by Sectors/Repartitions) */
                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-black text-blue-900 ">
                          Planos dos Subordinados (Repartições / Setores)
                        </h4>
                        <p className="text-xs text-blue-700 mt-0.5">
                          Estes são os planos enviados pelas repartições e
                          setores subordinados. Clique em "Unificar" para
                          agregá-los ao plano oficial do departamento.
                        </p>
                      </div>
                      <button
                        onClick={handleUnifyDepartmentPlan}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-xs font-black  tracking-wider transition-all flex items-center gap-2 shrink-0 shadow-md shadow-blue-200"
                      >
                        <Layers size={14} /> Unificar Planos Recebidos
                      </button>
                    </div>

                    {reparticoesAndSectorsForThisDept.map((item) => {
                      const sector = item.name;
                      const sectorActs = filteredActivities.filter((a) => {
                        if (sector === "Sectores Gerais") {
                          return (
                            (!a.reparticao && !a.setor) ||
                            a.reparticao === "Sectores Gerais" ||
                            a.setor === "Sectores Gerais"
                          );
                        }
                        return (
                          a.reparticao === sector ||
                          a.setor === sector ||
                          a.areaDeAfetacao === sector ||
                          (a.reparticao && String(a.reparticao).toLowerCase() === String(sector).toLowerCase()) ||
                          (a.setor && String(a.setor).toLowerCase() === String(sector).toLowerCase()) ||
                          (a.areaDeAfetacao && a.areaDeAfetacao.toLowerCase() === sector.toLowerCase())
                        );
                      });

                      return (
                        <div
                          key={sector}
                          className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm"
                        >
                          <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-black  px-2 py-0.5 rounded-full ${item.type === "Repartição" ? "bg-blue-100 text-blue-800" : item.type === "Setor" ? "bg-amber-100 text-amber-800" : "bg-slate-200 text-slate-700"}`}
                              >
                                {item.type}
                              </span>
                              <span className="text-sm font-black text-slate-800  tracking-wide">
                                {sector}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                              {sectorActs.length}{" "}
                              {sectorActs.length === 1
                                ? "Atividade"
                                : "Atividades"}
                            </span>
                          </div>

                          <div className="overflow-x-auto print:overflow-visible border border-slate-200 rounded-2xl shadow-sm mb-3 w-full" data-print-type="plano">
                            <table className="w-full text-left border-collapse print:min-w-full font-sans text-xs print-table-compact">
                              <ActivityTableHeader isDPEP={isDPEP} />
                              <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                                {sectorActs.map((act, idx) => (
                                  <ActivityTableRow
                                    key={act.id}
                                    activity={act}
                                    onViewHistory={setActivityForHistory}
                                    index={idx}
                                    isDPEP={isDPEP}
                                    user={user}
                                    isBossOrAdmin={isBossOrAdmin}
                                    getActivityTotal={getActivityTotal}
                                    onUpdateExecution={onUpdateExecution}
                                    onUpdateRelatorio={onUpdateRelatorio}
                                    actions={
                                      <div className="flex justify-center items-center gap-2">
                                        <button
                                          onClick={() => {
                                            setEditingActivity(act);
                                            setShowAddForm(true);
                                          }}
                                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                                          title="Visualizar"
                                        >
                                          <Eye size={13} />
                                        </button>
                                      </div>
                                    }
                                  />
                                ))}
                                {sectorActs.length === 0 && (
                                  <tr>
                                    <td
                                      colSpan={37}
                                      className="p-6 text-center text-slate-400 text-xs italic font-medium"
                                    >
                                      Nenhuma atividade registada ou submetida
                                      para este(a) {item.type.toLowerCase()} até
                                      ao momento.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* --- LEVEL 3: PLANO DE DIREÇÃO --- */}
            {selectedRoleMode === "Direção" && (
              <div className="p-3 sm:p-4 md:p-6 space-y-3 flex-1 w-full bg-white">
                <InstitutionalHeader
                  unidadeName={user.unidadeOrganica}
                  direcaoName={user.direcao}
                  departamentoName={user.departamento}
                  reparticaoName={user.reparticao}
                  sectorName={user.setor}
                  year={selectedYear}
                  isOwner={isSuperBossUser(user)}
                />

                <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b-2 border-slate-100 pb-3">
                  <div className="flex bg-slate-100 p-1 rounded-2xl print:hidden">
                    <button
                      onClick={() => setShowReceivedPlans(false)}
                      className={`px-5 py-3 rounded-xl font-black text-xs  tracking-wider transition-all ${!showReceivedPlans ? "bg-slate-900 text-white shadow-lg" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                    >
                      Meu Plano de Direção
                    </button>
                    <button
                      onClick={() => setShowReceivedPlans(true)}
                      className={`px-5 py-3 rounded-xl font-black text-xs  tracking-wider transition-all flex items-center gap-2 ${showReceivedPlans ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                    >
                      <Inbox size={16} /> Planos Recebidos
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!showReceivedPlans && !isReadOnly && (
                      <button
                        onClick={handleSendDirecaoToPlanificacao}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl text-xs font-black  tracking-wider transition-all flex items-center gap-2 shadow-md shadow-emerald-200"
                      >
                        <Send size={14} /> Enviar à Planificação
                      </button>
                    )}
                    {showReceivedPlans && !isReadOnly && (
                      <button
                        onClick={handleUnifyDirectionPlan}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-xs font-black  tracking-wider transition-all flex items-center gap-2 shadow-md shadow-blue-200"
                      >
                        <Layers size={14} /> Unificar Planos
                      </button>
                    )}
                  </div>
                </div>

                {/* Bloco de Cabeçalho Oficial da Direção Conforme Imagem Solicitada */}
                <div className="border-l-[6px] border-blue-900 pl-4 py-2 my-6 bg-slate-50 border border-slate-200 rounded-r-2xl space-y-1">
                  <p className="text-xs font-black text-blue-900  tracking-widest">
                    {user?.direcao || "Direção"}
                  </p>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900  tracking-tight font-serif">
                    TOTAL DE ATIVIDADES DA DIREÇÃO ( {filteredActivities.length}{" "}
                    {filteredActivities.length === 1
                      ? "Atividade"
                      : "Atividades"}{" "}
                    )
                  </h2>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900  tracking-tight font-serif text-emerald-900">
                    ORÇAMENTO DAS ATIVIDADES ({" "}
                    {totalDirectionBudget.toLocaleString("pt-MZ", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    MZN )
                  </h2>
                  {directionSalaryBudget > 0 && (
                    <h2 className="text-xl md:text-2xl font-black text-slate-900  tracking-tight font-serif text-amber-700">
                      ORÇAMENTO DE SALÁRIOS ({" "}
                      {directionSalaryBudget.toLocaleString("pt-MZ", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      MZN )
                    </h2>
                  )}
                </div>

                {/* Card de Consolidação do Orçamento da Direção */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-indigo-900/50 space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/10 pb-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black  tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                          Orçamento da Direção
                        </span>
                      </div>
                      <h3 className="text-2xl font-black mt-2 text-white  tracking-tight">
                        {user?.direcao || "Direção Logada"}
                      </h3>
                      <p className="text-xs text-slate-300 mt-1 max-w-xl">
                        O orçamento da direção é a soma de todos os orçamentos
                        dos departamentos que lhe respondem (com os salários
                        separados).
                      </p>
                    </div>
                    <div className="bg-white/10 p-5 rounded-2xl border border-white/10 backdrop-blur-md text-right min-w-[280px] space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-300  tracking-wider block">
                          Orçamento das Atividades (Sem Salários)
                        </span>
                        <span className="text-2xl font-black text-amber-400 font-mono">
                          {totalDirectionBudget.toLocaleString("pt-MZ", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          MZN
                        </span>
                      </div>
                      {directionSalaryBudget > 0 && (
                        <div className="border-t border-white/10 pt-2">
                          <span className="text-[10px] font-bold text-amber-300  tracking-wider block">
                            Orçamento de Salários (Anualizado x12)
                          </span>
                          <span className="text-2xl font-black text-amber-400 font-mono">
                            {directionSalaryBudget.toLocaleString("pt-MZ", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            MZN
                          </span>
                        </div>
                      )}
                      <span className="text-[10px] text-slate-300 block mt-1 font-bold">
                        Soma de {directionDepartmentBudgets.length}{" "}
                        Departamentos Respondedores
                      </span>
                    </div>
                  </div>

                  {/* Department Breakdown */}
                  <div>
                    <h4 className="text-xs font-black  text-amber-400 tracking-wider mb-3">
                      Orçamento dos Departamentos Respondedores
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {directionDepartmentBudgets.map((d) => (
                        <div
                          key={d.name}
                          className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex justify-between items-center hover:bg-white/10 transition-all"
                        >
                          <div className="truncate pr-2">
                            <span className="text-xs font-bold text-slate-200 block truncate">
                              {d.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {d.count}{" "}
                              {d.count === 1 ? "atividade" : "atividades"}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-black text-emerald-400 shrink-0">
                            {d.budget.toLocaleString("pt-MZ", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            MZN
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Grouped by Department */}
                <div className="space-y-6">
                  {showReceivedPlans ? (
                    /* Planos Recebidos (Activities in status: departamento) */
                    <div className="space-y-6">
                      <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                          <h4 className="text-sm font-black text-blue-900 ">
                            Planos dos Departamentos Subordinados
                          </h4>
                          <p className="text-xs text-blue-700 mt-0.5">
                            Estes são os planos enviados pelos chefes de departamento. Clique em "Unificar" para agregá-los ao plano oficial da direção.
                          </p>
                        </div>
                        <button
                          onClick={handleUnifyDirectionPlan}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-xs font-black  tracking-wider transition-all flex items-center gap-2 shrink-0 shadow-md shadow-blue-200"
                        >
                          <Layers size={14} /> Unificar Planos Recebidos
                        </button>
                      </div>

                      {departmentsForThisDirection.map((dept) => {
                        const deptActs = rawActivities.filter((a) => {
                          if (Number(a.ano || 2026) !== Number(selectedYear)) return false;
                          const canonicalActDir = getCanonicalDirection(a.direcao);
                          const canonicalUserDir = getCanonicalDirection(user?.direcao || "");
                          if (canonicalActDir !== canonicalUserDir) return false;
                          
                          const isMatchDept = (a.departamento || "").toLowerCase() === dept.toLowerCase() ||
                                             String(a.departamento || "").toUpperCase().includes(dept.toUpperCase()) ||
                                             dept.toUpperCase().includes(String(a.departamento || "").toUpperCase());
                          
                          return isMatchDept && (a.status as any) === "departamento";
                        });

                        const subordinateSectors = getReparticoesAndSectors(dept);

                        return (
                          <div
                            key={dept}
                            className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm space-y-4"
                          >
                            <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                              <div>
                                <span className="inline-block bg-emerald-500/20 text-emerald-300 text-[10px] font-black  tracking-widest px-3 py-1 rounded-full mb-2">
                                  Orçamento do Departamento
                                </span>
                                <h4 className="text-xl font-black  tracking-tight text-white">
                                  {dept} - (Planos Recebidos)
                                </h4>
                                <p className="text-[10px] text-slate-400 mt-1">
                                  Setores e repartições subordinados a este departamento.
                                </p>
                              </div>
                              <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-right">
                                <div className="text-[9px] font-bold text-slate-400  tracking-wider">Total Recebido</div>
                                <div className="text-lg font-black text-emerald-400 font-mono">
                                  {deptActs.reduce((acc, a) => acc + getActivityTotal(a), 0).toLocaleString("pt-MZ", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}{" "}
                                  MZN
                                </div>
                                <div className="text-[9px] text-slate-400 mt-0.5">
                                  {deptActs.length} {deptActs.length === 1 ? "Atividade" : "Atividades"} em {subordinateSectors.length} setores
                                </div>
                              </div>
                            </div>

                            {/* Lista de todos os setores e repartições subordinados a este departamento */}
                            <div className="space-y-4 px-2 pb-2">
                              {subordinateSectors.map((item) => {
                                const sector = item.name;
                                const sectorActs = deptActs.filter((a) => {
                                  if (sector === "Sectores Gerais") {
                                    return (
                                      (!a.reparticao && !a.setor) ||
                                      a.reparticao === "Sectores Gerais" ||
                                      a.setor === "Sectores Gerais"
                                    );
                                  }
                                  return (
                                    a.reparticao === sector ||
                                    a.setor === sector ||
                                    a.areaDeAfetacao === sector ||
                                    (a.reparticao && String(a.reparticao).toLowerCase() === String(sector).toLowerCase()) ||
                                    (a.setor && String(a.setor).toLowerCase() === String(sector).toLowerCase()) ||
                                    (a.areaDeAfetacao && String(a.areaDeAfetacao).toLowerCase() === String(sector).toLowerCase())
                                  );
                                });

                                return (
                                  <div
                                    key={sector}
                                    className="bg-slate-50/70 border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs"
                                  >
                                    <div className="p-4 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`text-[10px] font-black  px-2 py-0.5 rounded-full ${item.type === "Repartição" ? "bg-blue-100 text-blue-800" : item.type === "Setor" ? "bg-amber-100 text-amber-800" : "bg-slate-200 text-slate-700"}`}
                                        >
                                          {item.type}
                                        </span>
                                        <span className="text-xs font-black text-slate-800  tracking-wide">
                                          {sector}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className="text-[11px] font-bold text-slate-600 font-mono">
                                          {sectorActs.reduce((acc, a) => acc + getActivityTotal(a), 0).toLocaleString("pt-MZ", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          })}{" "}
                                          MZN
                                        </span>
                                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                                          {sectorActs.length} {sectorActs.length === 1 ? "Atividade" : "Atividades"}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="overflow-x-auto print:overflow-visible w-full">
                                      <table className="w-full text-left border-collapse print:min-w-full font-sans text-xs print-table-compact">
                                        <ActivityTableHeader isDPEP={isDPEP} />
                                        <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                                          {sectorActs.map((activity, idx) => (
                                            <ActivityTableRow
                                              key={activity.id}
                                              activity={activity}
                                              onViewHistory={setActivityForHistory}
                                              index={idx}
                                              isDPEP={isDPEP}
                                              user={user}
                                              isBossOrAdmin={isBossOrAdmin}
                                              getActivityTotal={getActivityTotal}
                                              onUpdateExecution={onUpdateExecution}
                                              onUpdateRelatorio={onUpdateRelatorio}
                                              actions={
                                                <div className="flex justify-center items-center gap-2">
                                                  <button
                                                    onClick={() => {
                                                      setEditingActivity(activity);
                                                      setShowAddForm(true);
                                                    }}
                                                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                                                    title="Visualizar"
                                                  >
                                                    <Eye size={13} />
                                                  </button>
                                                </div>
                                              }
                                            />
                                          ))}
                                          {sectorActs.length === 0 && (
                                            <tr>
                                              <td
                                                colSpan={37}
                                                className="p-4 text-center text-slate-400 text-xs italic font-medium"
                                              >
                                                Nenhuma atividade registada ou submetida para este(a) {item.type.toLowerCase()} até ao momento.
                                              </td>
                                            </tr>
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Plano da Direção (Activities already in status: direcao or above) */
                    departmentsForThisDirection.map((dept) => {
                      const deptActs = filteredActivities.filter(
                        (a) =>
                          (a.departamento || "").toLowerCase() ===
                            dept.toLowerCase() ||
                          (a.departamento || "")
                            .toUpperCase()
                            .includes(dept.toUpperCase()) ||
                          dept
                            .toUpperCase()
                            .includes(String(a.departamento || "").toUpperCase()),
                      );
                      const deptBudget = deptActs.reduce(
                        (acc, a) => acc + getActivityTotal(a),
                        0,
                      );

                      return (
                        <div
                          key={dept}
                          className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm"
                        >
                          <div className="bg-slate-900 text-white p-6 rounded-t-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                            <div>
                                <span className="inline-block bg-emerald-500/20 text-emerald-300 text-[10px] font-black  tracking-widest px-3 py-1 rounded-full mb-2">
                                    Orçamento do Departamento
                                </span>
                                <h4 className="text-xl font-black  tracking-tight text-white">
                                    {dept} - (Meu Plano)
                                </h4>
                                <p className="text-[10px] text-slate-400 mt-1">O valor total de todas as atividades planejadas para o departamento.</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-right">
                                <div className="text-[9px] font-bold text-slate-400  tracking-wider">Atividades (Sem Salários)</div>
                                <div className="text-lg font-black text-emerald-400 font-mono">
                                    {deptBudget.toLocaleString("pt-MZ", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                    })}{" "}
                                    MZN
                                </div>
                                <div className="text-[9px] text-slate-400 mt-0.5">{deptActs.length} {deptActs.length === 1 ? "Atividade" : "Atividades"}</div>
                            </div>
                          </div>

                          <div className="overflow-x-auto print:overflow-visible border border-slate-200 rounded-2xl shadow-sm mb-3 w-full" data-print-type="plano">
                            <table className="w-full text-left border-collapse print:min-w-full font-sans text-xs print-table-compact">
                              <ActivityTableHeader isDPEP={isDPEP} />
                              <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                                {deptActs.filter(Boolean).map((activity, idx) => (
                                  <ActivityTableRow
                                    key={activity.id}
                                    activity={activity}
                                    onViewHistory={setActivityForHistory}
                                    index={idx}
                                    isDPEP={isDPEP}
                                    user={user}
                                    isBossOrAdmin={isBossOrAdmin}
                                    getActivityTotal={getActivityTotal}
                                    onUpdateExecution={onUpdateExecution}
                                    onUpdateRelatorio={onUpdateRelatorio}
                                    actions={
                                      !canEdit(activity) ? (
                                        <div className="flex justify-center items-center gap-2">
                                          <Lock
                                            size={12}
                                            className="text-slate-400"
                                          />
                                          <button
                                            onClick={() => {
                                              setEditingActivity(activity);
                                              setShowAddForm(true);
                                            }}
                                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                                            title="Visualizar"
                                          >
                                            <Eye size={13} />
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleDelete(activity.id)
                                            }
                                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded"
                                            title="Remover"
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex justify-center gap-1">
                                          <button
                                            onClick={() => {
                                              setEditingActivity(activity);
                                              setShowAddForm(true);
                                            }}
                                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                                            title="Editar"
                                          >
                                            <Edit2 size={13} />
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleDelete(activity.id)
                                            }
                                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded"
                                            title="Remover"
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        </div>
                                      )
                                    }
                                  />
                                ))}
                                {deptActs.length === 0 && (
                                  <tr>
                                    <td
                                      colSpan={37}
                                      className="p-6 text-center text-slate-400 text-xs italic font-medium"
                                    >
                                      Nenhum plano departamental recebido para
                                      este departamento.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* --- LEVEL 4: SETOR DE PLANIFICAÇÃO (PLANO INSTITUCIONAL / DE) --- */}
            {selectedRoleMode === "Planificação" && (
              <div className="flex-1 w-full flex flex-col bg-white">

                {/* Publication Banner for Chefe do DPEP */}
                {isChefeDPEP && (
                  <div
                    className={`mx-8 md:mx-12 mb-8 px-8 py-4 border-2 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all print:hidden ${
                      isPublished
                        ? "bg-emerald-50 border-emerald-100 shadow-xl shadow-emerald-500/5"
                        : "bg-rose-50 border-rose-100 shadow-xl shadow-rose-500/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`relative flex h-3 w-3 ${isPublished ? "text-emerald-500" : "text-rose-500"}`}
                      >
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-current"></span>
                      </span>
                      <div>
                        <h4 className="text-xs font-black  text-slate-950 tracking-wider">
                          Painel de Distribuição & Publicação DE
                        </h4>
                        <p className="text-slate-500 text-xs mt-0.5">
                          {isPublished
                            ? `Publicado por ${pesoeConfig?.publishedBy || "Chefe do DPEP"} em ${pesoeConfig?.publishedAt ? new Date(pesoeConfig.publishedAt).toLocaleString("pt") : ""}. Todos os Diretores agora têm acesso.`
                            : "O DE está em modo RASCUNHO. Apenas você (Chefe do DPEP) pode ver ou gerir este volume."}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handlePublishPesoe(!isPublished)}
                      className={`font-black tracking-wider text-[11px]  px-5 py-3 rounded-xl shadow-md transition-all flex items-center gap-2 ${
                        isPublished
                          ? "bg-rose-600 shadow-rose-500/10 hover:bg-rose-700 text-white"
                          : "bg-emerald-600 shadow-emerald-500/10 hover:bg-emerald-700 text-white"
                      }`}
                    >
                      {isPublished
                        ? "Anular Publicação / Ocultar DE"
                        : "Publicar DE Consolidado"}
                    </button>
                  </div>
                )}

                {/* Consultation Info Banner for Directors */}
                {!isChefeDPEP && isPublished && (
                  <div className="px-8 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3 print:hidden">
                    <CheckCircle2
                      className="text-emerald-600 shrink-0"
                      size={20}
                    />
                    <div>
                      <h4 className="text-xs font-black  text-slate-900 tracking-wider">
                        Área de Consulta do Diretor (DE PUBLICADO)
                      </h4>
                      <p className="text-slate-500 text-xs mt-0.5">
                        Você está a visualizar de forma restrita e segura as
                        atividades consolidadas para a sua direção:{" "}
                        <strong className="text-slate-900 font-black">
                          {directorDirection === "ALL"
                            ? "Todas as Áreas"
                            : directorDirection}
                        </strong>
                        .
                      </p>
                    </div>
                  </div>
                )}

                {/* Sub menu tabs inside Planificação */}
                <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between print:hidden overflow-x-auto no-scrollbar">
                  <div className="flex gap-4 min-w-max">
                    <button
                      onClick={() => setActiveSubTab("plano_orcamento")}
                      className={`px-6 py-3 rounded-xl font-black text-xs  tracking-wider transition-all border ${
                        activeSubTab === "plano_orcamento"
                          ? "bg-slate-900 text-white border-slate-950 shadow-md"
                          : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200"
                      }`}
                    >
                      Plano e Orçamento
                    </button>
                    <button
                      onClick={() => setActiveSubTab("necessidades_quantidades")}
                      className={`px-6 py-3 rounded-xl font-black text-xs  tracking-wider transition-all border ${
                        activeSubTab === "necessidades_quantidades"
                          ? "bg-slate-900 text-white border-slate-950 shadow-md"
                          : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200"
                      }`}
                    >
                      📦 Necessidades & Quantidades
                    </button>
                    <button
                      onClick={() => setActiveSubTab("plano_direcoes")}
                      className={`px-6 py-3 rounded-xl font-black text-xs  tracking-wider transition-all border ${
                        activeSubTab === "plano_direcoes"
                          ? "bg-slate-900 text-white border-slate-950 shadow-md"
                          : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200"
                      }`}
                    >
                      Plano da Direção
                    </button>
                    <button
                      onClick={() => setActiveSubTab("plano_institucional")}
                      className={`px-6 py-3 rounded-xl font-black text-xs  tracking-wider transition-all border ${
                        activeSubTab === "plano_institucional"
                          ? "bg-slate-900 text-white border-slate-950 shadow-md"
                          : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200"
                      }`}
                    >
                      Plano Institucional
                    </button>
                    <button
                      onClick={() => setActiveSubTab("pesoe")}
                      className={`px-6 py-3 rounded-xl font-black text-xs  tracking-wider transition-all border ${
                        activeSubTab === "pesoe"
                          ? "bg-slate-900 text-white border-slate-950 shadow-md"
                          : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200"
                      }`}
                    >
                      DE
                    </button>
                    {isPlanificacao && (
                      <button
                        onClick={() => setShowScheduleModal(true)}
                        className="px-6 py-3 rounded-xl font-black text-xs  tracking-wider bg-amber-50 text-amber-700 border-2 border-amber-200 hover:bg-amber-100 transition-all flex items-center gap-2"
                      >
                        <Calendar size={14} /> Agendar Atualização
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {/* Botões removidos conforme solicitação */}
                  </div>
                </div>

                <div className="p-8 md:p-12">
                  {/* SUB-TAB: PLANO DA REPARTIÇÃO */}
                  {activeSubTab === "plano_reparticao" && (
                    <div className="space-y-6">
                      <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-xl shadow-slate-100/50">
                        <div className="pb-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                          <div className="flex-1">
                            <h2 className="text-3xl font-black text-slate-900  tracking-tighter leading-none mb-2">
                              Atividades da Repartição / Setor
                            </h2>
                            <p className="text-slate-500 text-xs italic font-medium">
                              Gestão das atividades planificadas exclusivamente
                              para o seu setor/repartição.
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-3 w-full md:w-auto">
                            {/* Botão removido */}
                          </div>
                        </div>

                        <div className="mt-3 overflow-x-auto print:overflow-visible border border-slate-200 rounded-2xl shadow-sm mb-3 w-full">
                          <table className="w-full text-left border-collapse print:min-w-full font-sans text-xs print-table-compact">
                            <ActivityTableHeader isDPEP={isDPEP} />
                            <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                              {filteredActivities
                                .filter(
                                  (a) =>
                                    isDPEP ||
                                    isSuperBossUser(user) ||
                                    
                                    a.reparticao === user.reparticao ||
                                    a.setor === user.setor,
                                )
                                .filter(Boolean).map((activity, idx) => (
                                  <ActivityTableRow
                                    key={activity.id}
                                    activity={activity}
                                    index={idx}
                                    isDPEP={isDPEP}
                                    user={user}
                                    isBossOrAdmin={isBossOrAdmin}
                                    getActivityTotal={getActivityTotal}
                                    onUpdateExecution={onUpdateExecution}
                                    onUpdateRelatorio={onUpdateRelatorio}
                                    actions={
                                      <div className="flex justify-center gap-1">
                                        <button
                                          onClick={() => {
                                            setEditingActivity(activity);
                                            setShowAddForm(true);
                                          }}
                                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                                          title="Editar"
                                        >
                                          <Edit2 size={13} />
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleDelete(activity.id)
                                          }
                                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded"
                                          title="Remover"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    }
                                  />
                                ))}
                              {filteredActivities.filter(
                                (a) =>
                                  user?.reparticao &&
                                  (a.reparticao === user.reparticao ||
                                    a.setor === user.setor),
                              ).length === 0 && (
                                <tr>
                                  <td
                                    colSpan={40}
                                    className="p-20 text-center text-slate-400 font-bold italic  tracking-widest bg-slate-50/50"
                                  >
                                    Nenhuma atividade encontrada para a sua
                                    repartição.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB: PLANO DO DEPARTAMENTO */}
                  {activeSubTab === "plano_departamento" && (
                    <div className="space-y-6">
                      <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-xl shadow-slate-100/50">
                        <div className="pb-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                          <div className="flex-1">
                            <h2 className="text-3xl font-black text-slate-900  tracking-tighter leading-none mb-2">
                              Atividades do Departamento
                            </h2>
                            <p className="text-slate-500 text-xs italic font-medium">
                              Consolidação de atividades de todos os setores e
                              repartições que compõem o departamento.
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-3 w-full md:w-auto">
                            {/* Botão removido */}
                          </div>
                        </div>

                        <div className="mt-3 overflow-x-auto print:overflow-visible border border-slate-200 rounded-2xl shadow-sm mb-3 w-full">
                          <table className="w-full text-left border-collapse print:min-w-full font-sans text-xs print-table-compact">
                            <ActivityTableHeader isDPEP={isDPEP} />
                            <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                              {filteredActivities
                                .filter(
                                  (a) =>
                                    isDPEP ||
                                    isSuperBossUser(user) ||
                                    isDepartmentMatch(a.departamento, user?.departamento) ||
                                    isDepartmentMatch(a.departamento, title) ||
                                    isDepartmentMatch(a.unidadeOrganica, title),
                                )
                                .filter(Boolean).map((activity, idx) => (
                                  <ActivityTableRow
                                    key={activity.id}
                                    activity={activity}
                                    index={idx}
                                    isDPEP={isDPEP}
                                    user={user}
                                    isBossOrAdmin={isBossOrAdmin}
                                    getActivityTotal={getActivityTotal}
                                    onUpdateExecution={onUpdateExecution}
                                    onUpdateRelatorio={onUpdateRelatorio}
                                    actions={
                                      <div className="flex justify-center gap-1">
                                        <button
                                          onClick={() => {
                                            setEditingActivity(activity);
                                            setShowAddForm(true);
                                          }}
                                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                                          title="Editar"
                                        >
                                          <Edit2 size={13} />
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleDelete(activity.id)
                                          }
                                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded"
                                          title="Remover"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    }
                                  />
                                ))}
                              {filteredActivities.filter(
                                (a) =>
                                  isDPEP ||
                                  isSuperBossUser(user) ||
                                  isDepartmentMatch(a.departamento, user?.departamento) ||
                                  isDepartmentMatch(a.departamento, title) ||
                                  isDepartmentMatch(a.unidadeOrganica, title),
                              ).length === 0 && (
                                <tr>
                                  <td
                                    colSpan={40}
                                    className="p-20 text-center text-slate-400 font-bold italic  tracking-widest bg-slate-50/50"
                                  >
                                    Nenhuma atividade encontrada para o seu
                                    departamento.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB: PLANO SETORIAL */}
                  {activeSubTab === "plano_setorial" && (
                    <div className="space-y-2 print:block">
                      {/* Panel de Consolidação do Orçamento Institucional */}
                      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-blue-900/50 space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/10 pb-6">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black  tracking-widest text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
                                Plano Setorial - Organizado por Direção (Songo)
                              </span>
                            </div>
                            <h3 className="text-2xl font-black mt-2 text-white  tracking-tight">
                              Consolidação Institucional Songo
                            </h3>
                            <p className="text-xs text-slate-300 mt-1 max-w-xl">
                              Visualização de todos os planos como foram
                              planificados, organizados por direção e
                              departamento.
                            </p>
                          </div>
                          <div className="bg-white/10 p-5 rounded-2xl border border-white/10 backdrop-blur-md text-right min-w-[280px] space-y-3">
                            <div>
                              <span className="text-[10px] font-bold text-slate-300  tracking-wider block">
                                Orçamento das Atividades (Sem Salários)
                              </span>
                              <span className="text-2xl font-black text-emerald-400 font-mono">
                                {totalInstitutionalBudget.toLocaleString(
                                  "pt-MZ",
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  },
                                )}{" "}
                                MZN
                              </span>
                            </div>
                            <div className="border-t border-white/10 pt-2">
                              <span className="text-[10px] font-bold text-amber-300  tracking-wider block">
                                Orçamento Geral Consolidado (Com Salário via Receitas Próprias)
                              </span>
                              <span className="text-2xl font-black text-amber-400 font-mono">
                                {(
                                  totalInstitutionalBudget +
                                  (salarioStats.rawReceitasProprias || 0)
                                ).toLocaleString("pt-MZ", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}{" "}
                                MZN
                              </span>
                              <span className="text-[9px] text-slate-300 block mt-0.5">
                                Nota: Salários pagos pelo Estado são informados separadamente e não entram no orçamento de atividades.
                              </span>
                            </div>
                            <span className="text-[9px] text-slate-300 block mt-1 font-bold">
                              Consolidação de{" "}
                              {institutionalDirectionsBreakdown.length} Direções
                              + Quadro Geral
                            </span>
                          </div>
                        </div>

                        {/* Direções Breakdown */}
                        <div>
                          <h4 className="text-xs font-black  text-emerald-400 tracking-wider mb-3">
                            Orçamento por Direção
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {institutionalDirectionsBreakdown.map((dir) => (
                              <div
                                key={dir.name}
                                className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:bg-white/10 transition-all space-y-2"
                              >
                                <div className="flex justify-between items-start gap-2">
                                  <span className="text-xs font-black text-white  tracking-wide">
                                    {dir.name}
                                  </span>
                                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold shrink-0">
                                    {dir.totalActivities}{" "}
                                    {dir.totalActivities === 1
                                      ? "ativ."
                                      : "ativs."}
                                  </span>
                                </div>
                                <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    Orçamento da Direção:
                                  </span>
                                  <span className="text-sm font-mono font-black text-amber-400">
                                    {dir.directionBudget.toLocaleString(
                                      "pt-MZ",
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      },
                                    )}{" "}
                                    MZN
                                  </span>
                                </div>
                              </div>
                            ))}
                            {canSeeSalaries && (
                              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:bg-white/10 transition-all space-y-2">
                                <div className="flex justify-between items-start gap-2 border-b border-white/10 pb-2">
                                  <span className="text-xs font-black text-white  tracking-wide">
                                    SALÁRIOS E REMUNERAÇÕES (RH)
                                  </span>
                                  <span className="text-[9px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-bold shrink-0">
                                    RH / Separado
                                  </span>
                                </div>
                                <div className="space-y-2 pt-1 text-[11px] text-slate-300">
                                  <div className="flex justify-between items-center">
                                    <span>Salários Pagos pelo Estado (Efetivos)</span>
                                    <span className="font-mono font-bold text-emerald-400">
                                      {salarioStats.salarioEstado}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span>Salário via Receitas Próprias (Não Efetivos)</span>
                                    <span className="font-mono font-bold text-white">
                                      {salarioStats.salarioReceitasProprias}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center pt-2 border-t border-white/10 font-bold text-amber-400">
                                    <span>Total RH (Receitas Próprias)</span>
                                    <span className="font-mono">
                                      {salarioStats.totalGeral}
                                    </span>
                                  </div>
                                  <span className="text-[9px] text-slate-400 block italic pt-1">
                                    * Salários do Estado são pagos pelo Tesouro Nacional e excluídos do orçamento geral de atividades.
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-xl shadow-slate-100/50">
                        <div className="pb-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start gap-6">
                          <div className="flex-1">
                            <h2 className="text-3xl font-black text-slate-900  tracking-tighter leading-none mb-2">
                              Plano Setorial Consolidado
                            </h2>
                            <p className="text-slate-500 text-xs italic font-medium">
                              Todos os planos como foram planificados,
                              organizados por direção.
                            </p>
                          </div>
                          {isChefeDPEP && (
                            <button
                              onClick={handleSendPlanificacaoToInstitucional}
                              className="bg-slate-900 text-white font-black tracking-widest text-[10px]  px-8 py-4 rounded-2xl shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2"
                            >
                              <Send size={16} /> Compilar Plano Institucional
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-4">
                          <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                          <span className="text-xs font-black text-slate-500  tracking-widest">
                            Total Recebido:{" "}
                            {
                              filteredActivities.filter(
                                (a) =>
                                  (a.status as any) === "planificacao" &&
                                  !a.isPESOE &&
                                  (
                                    isSuperBossUser(user) ||
                                    a.direcao === user.direcao),
                              ).length
                            }{" "}
                            Atividades
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 overflow-x-auto print:overflow-visible border border-slate-200 rounded-2xl shadow-sm mb-3 w-full">
                        <table className="w-full text-left border-collapse print:min-w-full font-sans text-xs print-table-compact">
                          <ActivityTableHeader isDPEP={isDPEP} />
                          <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                            {(
                              Object.entries(
                                filteredActivities
                                  .filter(
                                    (a) =>
                                      (a.status as any) === "planificacao" &&
                                      !a.isPESOE &&
                                      (
                                        isSuperBossUser(user) ||
                                        a.direcao === user.direcao),
                                  )
                                  .sort((a, b) =>
                                    compareActivitiesStandardOrder(
                                      a,
                                      b,
                                      getActMonthIndex,
                                    ),
                                  )
                                  .reduce(
                                    (acc, act) => {
                                      const dir = act.direcao || "SEM DIREÇÃO";
                                      if (!acc[dir]) acc[dir] = [];
                                      acc[dir].push(act);
                                      return acc;
                                    },
                                    {} as Record<string, any[]>,
                                  ),
                              ) as [string, any[]][]
                            ).map(([direction, activities]) => {
                              const directionTotalBudget = activities.reduce(
                                (sum, act) => sum + getActivityTotal(act),
                                0,
                              );

                              return (
                                <React.Fragment key={direction}>
                                  <tr className="bg-slate-900 text-white border-y-2 border-slate-950 shadow-inner">
                                    <td
                                      colSpan={45}
                                      className="p-4 text-[12px] font-black  tracking-[0.3em] bg-gradient-to-r from-slate-900 to-indigo-900"
                                    >
                                      <div className="flex justify-between items-center">
                                        <span>🏢 DIREÇÃO: {direction}</span>
                                        <div className="flex gap-4 items-center">
                                          <span className="bg-white/10 px-3 py-1 rounded-lg border border-white/20">
                                            {activities.length} Atividades
                                          </span>
                                          <span className="bg-amber-500/20 text-amber-300 px-3 py-1 rounded-lg border border-amber-500/30 font-mono">
                                            Total Direção:{" "}
                                            {directionTotalBudget.toLocaleString(
                                              "pt-MZ",
                                              {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              },
                                            )}{" "}
                                            MZN
                                          </span>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                  {activities.filter(Boolean).map((activity, idx) => (
                                    <ActivityTableRow
                                      key={activity.id}
                                      activity={activity}
                                      index={idx}
                                      isDPEP={isDPEP}
                                      user={user}
                                      isBossOrAdmin={isBossOrAdmin}
                                      getActivityTotal={getActivityTotal}
                                      actions={
                                        <div className="flex justify-center gap-1">
                                          <button
                                            onClick={() => {
                                              setEditingActivity(activity);
                                              setShowAddForm(true);
                                            }}
                                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                                            title="Editar"
                                          >
                                            <Edit2 size={13} />
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleDelete(activity.id)
                                            }
                                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded"
                                            title="Remover"
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        </div>
                                      }
                                    />
                                  ))}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB: PLANO E ORÇAMENTO */}
                  {activeSubTab === "plano_orcamento" && (
                    <div className="space-y-2 print:block">
                      <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-xl shadow-slate-100/50">
                        <div className="pb-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start gap-6">
                          <div className="flex-1">
                            <h2 className="text-3xl font-black text-slate-900  tracking-tighter leading-none mb-2">
                              Plano e Orçamento
                            </h2>
                            <p className="text-slate-500 text-xs italic font-medium">
                              Plano resumido com N/O, Código da Atividade, Nome
                              da Atividade, Mês de Realização e Orçamento da
                              Atividade.
                            </p>
                          </div>
                          <div className="bg-slate-900 text-white p-5 rounded-2xl text-right min-w-[260px]">
                            <span className="text-[10px] font-bold text-slate-300  tracking-wider block">
                              Orçamento Total do Plano
                            </span>
                            <span className="text-2xl font-black text-emerald-400 font-mono">
                              {filteredActivities
                                .filter(
                                  (a) =>
                                    (a.status as any) === "planificacao" &&
                                    !a.isPESOE &&
                                    (
                                      isSuperBossUser(user) ||
                                      a.direcao === user.direcao),
                                )
                                .reduce(
                                  (sum, act) => sum + getActivityTotal(act),
                                  0,
                                )
                                .toLocaleString("pt-MZ", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}{" "}
                              MZN
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 overflow-x-auto print:overflow-visible border border-slate-200 rounded-3xl shadow-sm mb-3">
                          <table className="w-full text-left border-collapse font-sans text-xs">
                            <thead>
                              <tr className="bg-slate-900 text-white text-[10px] font-black  tracking-wider">
                                <th className="p-4 text-center w-16 border-r border-slate-800">
                                  N/O
                                </th>
                                <th className="p-4 w-48 border-r border-slate-800">
                                  CÓDIGO DA ATIVIDADE
                                </th>
                                <th className="p-4 border-r border-slate-800">
                                  NOME DA ATIVIDADE
                                </th>
                                <th className="p-4 w-40 border-r border-slate-800 text-center">
                                  MÊS DE REALIZAÇÃO
                                </th>
                                <th className="p-4 w-48 text-right">
                                  ORÇAMENTO DA ATIVIDADE
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                              {filteredActivities
                                .filter(
                                  (a) =>
                                    (a.status as any) === "planificacao" &&
                                    !a.isPESOE &&
                                    (
                                      isSuperBossUser(user) ||
                                      a.direcao === user.direcao),
                                )
                                .filter(Boolean).map((activity, idx) => {
                                  const totalVal = getActivityTotal(activity);
                                  const code =
                                    activity.codigoAtividade ||
                                    activity.referencia ||
                                    activity.codigo ||
                                    "---";
                                  const name =
                                    activity.nomeAtividade ||
                                    activity.title ||
                                    activity.designacao ||
                                    "---";
                                  const month = Array.isArray(
                                    activity.mesesRealizacao,
                                  )
                                    ? activity.mesesRealizacao.join(", ")
                                    : activity.mesRealizacao ||
                                      activity.mes ||
                                      "-";
                                  const no =
                                    getActivityDisplayNo(activity) || idx + 1;

                                  return (
                                    <tr
                                      key={activity.id || idx}
                                      className="hover:bg-slate-50 transition-colors"
                                    >
                                      <td className="p-4 text-center font-bold text-slate-900 border-r border-slate-200">
                                        {no}
                                      </td>
                                      <td className="p-4 font-mono font-bold text-indigo-700 border-r border-slate-200">
                                        {code}
                                      </td>
                                      <td className="p-4 font-bold text-slate-900 border-r border-slate-200">
                                        {name}
                                      </td>
                                      <td className="p-4 text-center font-semibold text-slate-600 border-r border-slate-200">
                                        {month}
                                      </td>
                                      <td className="p-4 text-right font-mono font-bold text-emerald-700">
                                        {totalVal.toLocaleString("pt-MZ", {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        })}{" "}
                                        MZN
                                      </td>
                                    </tr>
                                  );
                                })}
                              {filteredActivities.filter(
                                (a) =>
                                  (a.status as any) === "planificacao" &&
                                  !a.isPESOE &&
                                  (
                                    isSuperBossUser(user) ||
                                    a.direcao === user.direcao),
                              ).length === 0 && (
                                <tr>
                                  <td
                                    colSpan={5}
                                    className="p-12 text-center text-slate-400 italic font-medium"
                                  >
                                    Nenhuma atividade encontrada.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB: NECESSIDADES E QUANTIDADES PLANIFICADAS */}
                  {activeSubTab === "necessidades_quantidades" && (
                    <div className="space-y-2 print:block">
                      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-100/50 print:block">
                        <div className="pb-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-black  tracking-wider mb-2">
                              <span>📦 Consolidado de Bens, Materiais e Serviços</span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                              Necessidades e Quantidades Planificadas por Produto X
                            </h3>
                            <p className="text-slate-500 text-xs font-medium mt-1">
                              Agrupamento automático de todos os produtos, materiais e recursos planificados com quantitativos totais acumulados.
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                const el = document.getElementById("necessidades-quantidades-table");
                                if (el) {
                                  openPrintDocumentWindow({
                                    title: `Relatorio_Necessidades_Quantidades_${selectedYear}`,
                                    contentHtml: el.innerHTML,
                                    orientation: "landscape",
                                    pageSize: "A4",
                                  });
                                }
                              }}
                              className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                            >
                              <Printer className="w-4 h-4" />
                              Imprimir Quadro A4
                            </button>
                          </div>
                        </div>

                        {/* Tabela de Produtos / Necessidades e Quantidades */}
                        <div id="necessidades-quantidades-table" className="mt-6 overflow-x-auto border border-slate-200 rounded-2xl shadow-xs">
                          <table className="w-full text-left border-collapse font-sans text-xs">
                            <thead>
                              <tr className="bg-slate-900 text-white text-[10px] font-black  tracking-wider">
                                <th className="p-3.5 border-r border-slate-800 w-12 text-center">Nº</th>
                                <th className="p-3.5 border-r border-slate-800">Categoria de Necessidade</th>
                                <th className="p-3.5 border-r border-slate-800 font-bold">Produto / Item Solicitado</th>
                                <th className="p-3.5 border-r border-slate-800 text-center bg-blue-950 text-blue-200 font-extrabold">Quantidade Total Planificada</th>
                                <th className="p-3.5 border-r border-slate-800 text-right">Preço Médio (MZN)</th>
                                <th className="p-3.5 border-r border-slate-800 text-right">Valor Total (MZN)</th>
                                <th className="p-3.5 text-center w-28">Atividades</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                              {groupedNecessidadesPlanificadas.length > 0 ? (
                                groupedNecessidadesPlanificadas.map((item, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-3.5 text-center font-bold text-slate-500 border-r border-slate-200">
                                      {idx + 1}
                                    </td>
                                    <td className="p-3.5 font-bold text-slate-800 border-r border-slate-200">
                                      {item.necessidadeCategory}
                                    </td>
                                    <td className="p-3.5 font-black text-slate-900 border-r border-slate-200">
                                      <div className="flex flex-col gap-0.5">
                                        <span className="text-blue-900 text-sm">{item.nomeProduto}</span>
                                        {item.especificacoesStr && (
                                          <span className="text-[10px] text-slate-500 italic font-normal">
                                            Det: {item.especificacoesStr}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="p-3.5 text-center font-mono font-black text-blue-900 text-sm bg-blue-50/60 border-r border-slate-200">
                                      <span className="px-2.5 py-1 rounded-md bg-blue-100 text-blue-900 border border-blue-200 font-bold">
                                        {item.quantidadeTotal.toLocaleString("pt-MZ")}
                                      </span>
                                    </td>
                                    <td className="p-3.5 text-right font-mono font-semibold text-slate-600 border-r border-slate-200">
                                      {item.precoUnitarioMedio > 0
                                        ? item.precoUnitarioMedio.toLocaleString("pt-MZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                        : "---"}
                                    </td>
                                    <td className="p-3.5 text-right font-mono font-bold text-emerald-700 border-r border-slate-200">
                                      {item.valorTotal.toLocaleString("pt-MZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MZN
                                    </td>
                                    <td className="p-3.5 text-center font-bold text-slate-600">
                                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px]">
                                        {item.atividadesCount} {item.atividadesCount === 1 ? "Atividade" : "Atividades"}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={7} className="p-12 text-center text-slate-400 italic font-medium">
                                    Nenhuma necessidade com quantitativo mapeada no plano atual.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                            {groupedNecessidadesPlanificadas.length > 0 && (
                              <tfoot>
                                <tr className="bg-slate-900 text-white font-black text-xs">
                                  <td colSpan={3} className="p-3.5 text-right  tracking-wider border-r border-slate-800">
                                    Total de Itens / Unidades Planificadas:
                                  </td>
                                  <td className="p-3.5 text-center font-mono font-black text-amber-300 text-sm bg-slate-950 border-r border-slate-800">
                                    {groupedNecessidadesPlanificadas.reduce((sum, i) => sum + i.quantidadeTotal, 0).toLocaleString("pt-MZ")}
                                  </td>
                                  <td className="p-3.5 border-r border-slate-800"></td>
                                  <td className="p-3.5 text-right font-mono font-black text-emerald-400 text-sm border-r border-slate-800">
                                    {groupedNecessidadesPlanificadas.reduce((sum, i) => sum + i.valorTotal, 0).toLocaleString("pt-MZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MZN
                                  </td>
                                  <td></td>
                                </tr>
                              </tfoot>
                            )}
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB: PLANO DAS DIREÇÕES */}
                  {activeSubTab === "plano_direcoes" &&
                    (() => {
                      const planificacaoDirName =
                        selectedPlanificacaoDirection ||
                        user?.direcao ||
                        "Gabinete do Diretor-Geral";
                      const planificacaoDirActivities = filteredActivities
                        .filter(
                          (a) =>
                            (a.status as any) === "planificacao" &&
                            !a.isPESOE &&
                            (a.direcao || "")
                              .toLowerCase()
                              .includes(planificacaoDirName.toLowerCase()),
                        )
                        .sort((a, b) =>
                          compareActivitiesStandardOrder(
                            a,
                            b,
                            getActMonthIndex,
                          ),
                        );
                      const planificacaoDirBudget =
                        planificacaoDirActivities.reduce(
                          (sum, act) => sum + getActivityTotal(act),
                          0,
                        );

                      return (
                        <div className="space-y-2 print:block">
                          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-100/50">
                            <div className="pb-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black  tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-150">
                                    Plano das Direções (Filtro por Direção)
                                  </span>
                                </div>
                                <h2 className="text-2xl font-black text-slate-900  tracking-tight">
                                  DIREÇÃO: {planificacaoDirName}
                                </h2>
                                <p className="text-xs text-slate-500 font-medium">
                                  Visualização consolidada de todas as
                                  atividades e orçamento da direção selecionada.
                                </p>
                              </div>
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto shrink-0">
                                <div className="flex flex-col gap-1 min-w-[240px]">
                                  <label className="text-[10px]  font-black tracking-widest text-slate-400">
                                    Selecionar Direção
                                  </label>
                                  <select
                                    value={
                                      selectedPlanificacaoDirection ||
                                      user?.direcao ||
                                      "Gabinete do Diretor-Geral"
                                    }
                                    onChange={(e) =>
                                      setSelectedPlanificacaoDirection(
                                        e.target.value,
                                      )
                                    }
                                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                                  >
                                    <option value="Gabinete do Diretor-Geral">
                                      Gabinete do Diretor-Geral
                                    </option>
                                    <option value="Divisão de Engenharia">
                                      Divisão de Engenharia
                                    </option>
                                    <option value="DICOSAFA">DICOSAFA</option>
                                    <option value="DICOSSER">DICOSSER</option>
                                    <option value="Centro de Incubação de Empresas">
                                      Centro de Incubação de Empresas
                                    </option>
                                  </select>
                                </div>
                                {isChefeDPEP && (
                                  <div className="flex flex-col gap-1 shrink-0 pt-5">
                                    <button
                                      onClick={
                                        handleSendPlanificacaoToInstitucional
                                      }
                                      className="bg-indigo-600 text-white font-black tracking-wider text-[10px]  px-5 py-2.5 rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                                    >
                                      <Send size={12} /> Compilar Plano
                                      Institucional
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                              <div className="bg-indigo-900 p-5 rounded-2xl text-white shadow-md border border-indigo-800">
                                <p className="text-[10px]  font-black tracking-widest opacity-60">
                                  Orçamento da Direção
                                </p>
                                <h3 className="text-2xl font-black mt-1 font-mono">
                                  {planificacaoDirBudget.toLocaleString(
                                    "pt-MZ",
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    },
                                  )}
                                  <span className="text-xs ml-2 opacity-60 font-medium tracking-normal">
                                    MZN
                                  </span>
                                </h3>
                              </div>
                              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                <p className="text-[10px]  font-black tracking-widest text-slate-400">
                                  Total de Atividades da Direção
                                </p>
                                <h3 className="text-2xl font-black text-slate-900 mt-1 font-mono">
                                  {planificacaoDirActivities.length}
                                  <span className="text-xs ml-2 text-slate-400 font-medium tracking-normal">
                                    Atividades
                                  </span>
                                </h3>
                              </div>
                              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center">
                                {(isBossOrAdmin || isPlanificacao) && (
                                  <button
                                    onClick={handleFixNumbering}
                                    disabled={isProcessing}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-xs hover:bg-indigo-100 transition-colors disabled:opacity-50 shadow-sm"
                                  >
                                    <LayoutGrid size={14} strokeWidth={3} />{" "}
                                    Reordenar e Renumerar Tudo
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-8 mt-6">
                            {(() => {
                              const directionKeyForPlan = getDirectionKeysMatched(planificacaoDirName);
                              const departmentsForThisDirPlan =
                                DEPARTAMENTOS[directionKeyForPlan as keyof typeof DEPARTAMENTOS] ||
                                DEPARTAMENTOS[directionKeyForPlan] ||
                                DEPARTAMENTOS["DICOSAFA"] ||
                                [];

                              const matchedIds = new Set<string>();
                              const groupedDepts = departmentsForThisDirPlan.map((dept) => {
                                const deptActs = planificacaoDirActivities.filter((a) => {
                                  const actDept = (a.departamento || "").trim();
                                  const isMainDeptOrBlank =
                                    !actDept &&
                                    (dept === "Chefe do GDG" ||
                                      dept === "Diretor da DICOSAFA" ||
                                      dept === "Diretor da DICOSSER" ||
                                      dept === "Diretor da Divisão de Engenharia" ||
                                      dept === "Diretor do CIE" ||
                                      dept === "Gabinete do Diretor-Geral");
                                  const match =
                                    isMainDeptOrBlank ||
                                    actDept.toLowerCase() === dept.toLowerCase() ||
                                    actDept.toUpperCase().includes(dept.toUpperCase()) ||
                                    dept.toUpperCase().includes(actDept.toUpperCase());
                                  if (match) {
                                    matchedIds.add(a.id);
                                  }
                                  return match;
                                });
                                const deptBudget = deptActs.reduce((acc, a) => acc + getActivityTotal(a), 0);
                                return { dept, deptActs, deptBudget };
                              });

                              const unassignedActs = planificacaoDirActivities.filter((a) => !matchedIds.has(a.id));

                              return (
                                <>
                                  {/* PAINEL DE DEPARTAMENTOS PERTENCENTES À DIREÇÃO SELECIONADA */}
                                  <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                                      <div>
                                        <span className="text-[10px] font-mono font-black text-amber-400  tracking-widest block">
                                          Estrutura Orgânica da Direção: {planificacaoDirName}
                                        </span>
                                        <h3 className="text-base font-black  text-white tracking-tight flex items-center gap-2 mt-0.5">
                                          <Building2 size={18} className="text-indigo-400" />
                                          Departamentos Pertencentes ({departmentsForThisDirPlan.length})
                                        </h3>
                                      </div>
                                      <span className="text-xs font-bold text-slate-300 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10 shrink-0">
                                        Total: {departmentsForThisDirPlan.length} Departamentos
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                      {groupedDepts.map(({ dept, deptActs, deptBudget }) => (
                                        <a
                                          key={dept}
                                          href={`#poe-dept-${dept.replace(/[^a-zA-Z0-9]/g, "-")}`}
                                          className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-400/50 rounded-2xl p-3.5 transition-all group flex flex-col justify-between"
                                        >
                                          <div>
                                            <div className="flex items-center justify-between gap-2 mb-1.5">
                                              <span className="text-[10px] font-black  px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                                                {deptActs.length} {deptActs.length === 1 ? "Atividade" : "Atividades"}
                                              </span>
                                              <Building2 size={14} className="text-slate-400 group-hover:text-amber-400 transition-colors" />
                                            </div>
                                            <h4 className="text-xs font-black text-slate-100 group-hover:text-amber-300 transition-colors line-clamp-2">
                                              {dept}
                                            </h4>
                                          </div>

                                          <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono font-bold text-emerald-400">
                                            <span>
                                              {deptBudget.toLocaleString("pt-MZ", {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              })}{" "}
                                              MZN
                                            </span>
                                            <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                                          </div>
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                  {groupedDepts.map(({ dept, deptActs, deptBudget }) => (
                                    <div
                                      key={dept}
                                      id={`poe-dept-${dept.replace(/[^a-zA-Z0-9]/g, "-")}`}
                                      className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm space-y-4 scroll-mt-6"
                                    >
                                      <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex flex-wrap items-center gap-3">
                                          <span className="text-sm font-black  tracking-wide">
                                            {dept}
                                          </span>
                                          <span className="text-[10px] font-mono font-black text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-500/30">
                                            Orçamento:{" "}
                                            {deptBudget.toLocaleString("pt-MZ", {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            })}{" "}
                                            MZN
                                          </span>
                                        </div>
                                        <span className="text-xs font-bold text-amber-400 bg-white/10 px-3 py-1 rounded-full self-start sm:self-auto">
                                          {deptActs.length}{" "}
                                          {deptActs.length === 1 ? "Atividade" : "Atividades"}
                                        </span>
                                      </div>

                                      <div className="overflow-x-auto print:overflow-visible border border-slate-200 rounded-2xl shadow-sm w-full">
                                        <table className="w-full text-left border-collapse print:min-w-full font-sans text-xs print-table-compact">
                                          <ActivityTableHeader isDPEP={isDPEP} />
                                          <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                                            {deptActs.filter(Boolean).filter(Boolean).map((activity, idx) => (
                                              <ActivityTableRow
                                                key={activity.id}
                                                activity={activity}
                                                index={idx}
                                                isDPEP={isDPEP}
                                                user={user}
                                                isBossOrAdmin={isBossOrAdmin}
                                                getActivityTotal={getActivityTotal}
                                                actions={
                                                  !canEdit(activity) ? (
                                                    <div className="flex justify-center items-center gap-2">
                                                      <Lock
                                                        size={12}
                                                        className="text-slate-400"
                                                      />
                                                      <button
                                                        onClick={() => {
                                                          setEditingActivity(activity);
                                                          setShowAddForm(true);
                                                        }}
                                                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                                                        title="Visualizar"
                                                      >
                                                        <Eye size={13} />
                                                      </button>
                                                      <button
                                                        onClick={() =>
                                                          handleDelete(activity.id)
                                                        }
                                                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded"
                                                        title="Remover"
                                                      >
                                                        <Trash2 size={13} />
                                                      </button>
                                                    </div>
                                                  ) : (
                                                    <div className="flex justify-center gap-1">
                                                      <button
                                                        onClick={() => {
                                                          setEditingActivity(activity);
                                                          setShowAddForm(true);
                                                        }}
                                                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                                                        title="Editar / Validar"
                                                      >
                                                        <Edit2 size={13} />
                                                      </button>
                                                      <button
                                                        onClick={() =>
                                                          handleDelete(activity.id)
                                                        }
                                                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded"
                                                        title="Remover"
                                                      >
                                                        <Trash2 size={13} />
                                                      </button>
                                                    </div>
                                                  )
                                                }
                                              />
                                            ))}
                                            {deptActs.length === 0 && (
                                              <tr>
                                                <td
                                                  colSpan={45}
                                                  className="p-12 text-center text-slate-400 italic font-medium"
                                                >
                                                  Nenhuma atividade recebida deste departamento até o momento.
                                                </td>
                                              </tr>
                                            )}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  ))}

                                  {unassignedActs.length > 0 && (
                                    <div className="bg-white border border-slate-150 rounded-3xl overflow-hidden shadow-sm space-y-4">
                                      <div className="p-5 bg-gradient-to-r from-slate-700 to-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                                        <div className="flex flex-wrap items-center gap-3">
                                          <span className="text-sm font-black  tracking-wide">
                                            Atividades Sem Departamento/Repartição Correspondente
                                          </span>
                                          <span className="text-[10px] font-mono font-black text-amber-300 bg-slate-950/80 px-2.5 py-1 rounded-md border border-amber-500/30">
                                            Orçamento:{" "}
                                            {unassignedActs.reduce((acc, a) => acc + getActivityTotal(a), 0).toLocaleString("pt-MZ", {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            })}{" "}
                                            MZN
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-3 self-end sm:self-auto print:hidden">
                                          <button
                                            onClick={async () => {
                                              if (
                                                !window.confirm(
                                                  `⚠️ ATENÇÃO: Deseja realmente excluir permanentemente estas ${unassignedActs.length} atividade(s) sem correspondência de departamento? Esta operação não pode ser desfeita.`
                                                )
                                              ) {
                                                return;
                                              }
                                              setIsLoading(true);
                                              try {
                                                let deleted = 0;
                                                for (const act of unassignedActs) {
                                                  if (act.id) {
                                                    await firestoreService.matrixActivities.delete(act.id);
                                                    deleted++;
                                                  }
                                                }
                                                setRawActivities((prev) =>
                                                  prev.filter((a) => !unassignedActs.some((ua) => ua.id === a.id))
                                                );
                                                onShowAlert(`Sucesso: ${deleted} atividade(s) sem correspondência foram excluídas do sistema.`);
                                              } catch (err: any) {
                                                onShowAlert("Erro ao excluir: " + err.message);
                                              } finally {
                                                setIsLoading(false);
                                              }
                                            }}
                                            disabled={isLoading}
                                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-800 text-white text-[10px] font-black rounded-lg transition-colors  tracking-widest flex items-center gap-1.5 shadow-md"
                                            title="Excluir de vez todas as atividades mostradas nesta seção"
                                          >
                                            <Trash2 size={12} /> Excluir Todas
                                          </button>
                                          <span className="text-xs font-bold text-amber-400 bg-white/10 px-3 py-1 rounded-full whitespace-nowrap">
                                            {unassignedActs.length}{" "}
                                            {unassignedActs.length === 1 ? "Atividade" : "Atividades"}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="overflow-x-auto print:overflow-visible border border-slate-200 rounded-2xl shadow-sm w-full">
                                        <table className="w-full text-left border-collapse print:min-w-full font-sans text-xs print-table-compact">
                                          <ActivityTableHeader isDPEP={isDPEP} />
                                          <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                                            {unassignedActs.filter(Boolean).map((activity, idx) => (
                                              <ActivityTableRow
                                                key={activity.id}
                                                activity={activity}
                                                index={idx}
                                                isDPEP={isDPEP}
                                                user={user}
                                                isBossOrAdmin={isBossOrAdmin}
                                                getActivityTotal={getActivityTotal}
                                                actions={
                                                  !canEdit(activity) ? (
                                                    <div className="flex justify-center items-center gap-2">
                                                      <Lock
                                                        size={12}
                                                        className="text-slate-400"
                                                      />
                                                      <button
                                                        onClick={() => {
                                                          setEditingActivity(activity);
                                                          setShowAddForm(true);
                                                        }}
                                                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                                                        title="Visualizar"
                                                      >
                                                        <Eye size={13} />
                                                      </button>
                                                      <button
                                                        onClick={() =>
                                                          handleDelete(activity.id)
                                                        }
                                                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded"
                                                        title="Remover"
                                                      >
                                                        <Trash2 size={13} />
                                                      </button>
                                                    </div>
                                                  ) : (
                                                    <div className="flex justify-center gap-1">
                                                      <button
                                                        onClick={() => {
                                                          setEditingActivity(activity);
                                                          setShowAddForm(true);
                                                        }}
                                                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                                                        title="Editar / Validar"
                                                      >
                                                        <Edit2 size={13} />
                                                      </button>
                                                      <button
                                                        onClick={() =>
                                                          handleDelete(activity.id)
                                                        }
                                                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded"
                                                        title="Remover"
                                                      >
                                                        <Trash2 size={13} />
                                                      </button>
                                                    </div>
                                                  )
                                                }
                                              />
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      );
                    })()}

                  {/* SUB-TAB 1: PLANO INSTITUCIONAL */}
                  {activeSubTab === "plano_institucional" && (
                    <div className="space-y-2 print:block">
                      <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-xl shadow-slate-100/50">
                        <div className="pb-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start gap-6">
                          <div className="flex-1">
                            <h2 className="text-3xl font-black text-slate-900  tracking-tighter leading-none mb-2">
                              Compilação do Plano Institucional
                            </h2>
                            <p className="text-slate-500 text-xs italic font-medium">
                              Painel central para compilação e gestão do plano
                              geral de atividades de Songo Songo.
                            </p>
                          </div>
                          <div className="flex gap-4">
                            {isAdminOrProgrammer && (
                              <button
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-indigo-600 text-white px-5 py-3 rounded-xl text-xs font-black  tracking-wider hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200"
                              >
                                <FileUp size={16} /> Importar Plano (Excel)
                              </button>
                            )}
                            {isChefeDPEP && (
                              <button
                                onClick={handleClearAllActivities}
                                className="bg-rose-600 text-white px-5 py-3 rounded-xl text-xs font-black  tracking-wider hover:bg-rose-700 transition-all flex items-center gap-2 shadow-lg shadow-rose-200"
                              >
                                <Trash2 size={16} /> Limpeza Total do Sistema
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                          <span className="text-xs font-black text-slate-500  tracking-widest">
                            Total:{" "}
                            {
                              filteredActivities
                                .filter(
                                  (a) => (a.status as any) === "institucional",
                                )
                                .filter((a) => {
                                  if (isChefeDPEP) return true;
                                  if (directorDirection === "ALL") return true;
                                  if (!directorDirection) return true;
                                  return (a.direcao || "")
                                    .toUpperCase()
                                    .includes(directorDirection.toUpperCase());
                                }).length
                            }{" "}
                            Atividades
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 overflow-x-auto print:overflow-visible border border-slate-200 rounded-2xl shadow-sm mb-3 w-full">
                        <table className="w-full text-left border-collapse print:min-w-full font-sans text-xs print-table-compact">
                          <ActivityTableHeader isDPEP={isDPEP} />
                          <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                            {(
                              Object.entries(
                                filteredActivities
                                  .filter(
                                    (a) =>
                                      (a.status as any) === "institucional",
                                  )
                                  .filter((a) => {
                                    if (isChefeDPEP) return true;
                                    if (directorDirection === "ALL")
                                      return true;
                                    if (!directorDirection) return true;
                                    return (a.direcao || "")
                                      .toUpperCase()
                                      .includes(
                                        directorDirection.toUpperCase(),
                                      );
                                  })
                                  .sort((a, b) =>
                                    compareActivitiesStandardOrder(
                                      a,
                                      b,
                                      getActMonthIndex,
                                    ),
                                  )
                                  .reduce(
                                    (acc, act) => {
                                      const dir = act.direcao || "SEM DIREÇÃO";
                                      if (!acc[dir]) acc[dir] = [];
                                      acc[dir].push(act);
                                      return acc;
                                    },
                                    {} as Record<string, any[]>,
                                  ),
                              ) as [string, any[]][]
                            ).map(([direction, activities]) => (
                              <React.Fragment key={direction}>
                                <tr className="bg-slate-900 text-white border-2 border-slate-950">
                                  <td
                                    colSpan={45}
                                    className="p-3 text-[11px] font-black  tracking-[0.2em]"
                                  >
                                    DIREÇÃO: {direction} — {activities.length}{" "}
                                    Atividades Planificadas
                                  </td>
                                </tr>
                                {activities.filter(Boolean).map((activity, idx) => (
                                  <ActivityTableRow
                                    key={activity.id}
                                    activity={activity}
                                    index={idx}
                                    isDPEP={isDPEP}
                                    user={user}
                                    isBossOrAdmin={isBossOrAdmin}
                                    getActivityTotal={getActivityTotal}
                                    actions={
                                      <div className="flex justify-center gap-1">
                                        <button
                                          onClick={() => {
                                            setEditingActivity(activity);
                                            setShowAddForm(true);
                                          }}
                                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                                          title="Visualizar/Editar"
                                        >
                                          <Edit2 size={13} />
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleDelete(activity.id)
                                          }
                                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded"
                                          title="Remover"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    }
                                  />
                                ))}
                              </React.Fragment>
                            ))}
                            {/* Linhas Vazias de Preenchimento para Estética foram removidas */}
                            {filteredActivities.filter(
                              (a) => (a.status as any) === "institucional",
                            ).length === 0 && (
                              <tr>
                                <td
                                  colSpan={37}
                                  className="p-12 text-center text-slate-400 italic font-medium"
                                >
                                  Nenhuma atividade consolidada para esta área
                                  no plano institucional.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 2: PESOE (N/O, DIREÇÃO, ATIVIDADE, ORÇAMENTO) */}
                  {activeSubTab === "pesoe" && !isChefeDPEP && !isPublished ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white min-h-[500px] rounded-3xl border border-slate-100 shadow-sm">
                      <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-6 border border-rose-100 shadow-sm animate-pulse">
                        <span className="text-4xl">🔴</span>
                      </div>
                      <h3 className="text-2xl font-black text-rose-600  tracking-wide">
                        DE: INDISPONÍVEL PARA TODOS
                      </h3>
                      <p className="text-slate-600 font-bold text-sm max-w-lg mt-3 leading-relaxed">
                        AGUARDAR A PUBLICAÇÃO, FEITA PELO DPEP (CHEFE DO DPEP)
                      </p>

                      {isDC ? (
                        <div className="mt-8 bg-amber-50 border border-amber-200 p-6 rounded-2xl max-w-md shadow-sm">
                          <h4 className="font-bold text-amber-800 text-sm flex items-center justify-center gap-2 mb-2">
                            <span className="inline-block w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping"></span>
                            Aviso para Diretores
                          </h4>
                          <p className="text-xs text-amber-700 font-medium leading-relaxed">
                            Sendo{" "}
                            <strong className="text-slate-900">
                              {title || "Diretor"}
                            </strong>
                            , obterá autorização para visualizar e consultar o
                            DE consolidado diretamente em sua área (
                            <strong className="text-slate-900">
                              {directorDirection === "ALL"
                                ? "Todas as Áreas"
                                : directorDirection}
                            </strong>
                            ) assim que o Chefe do DPEP efetuar a **Publicação
                            Oficial**.
                          </p>
                        </div>
                      ) : (
                        <div className="mt-8 bg-slate-50 border border-slate-100 p-6 rounded-2xl max-w-md">
                          <p className="text-xs text-slate-500 font-bold leading-relaxed">
                            Apenas os Diretores e responsáveis autorizados terão
                            visibilidade e direitos de consulta das suas
                            respetivas áreas após a publicação oficial do DPEP.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div id="pesoe-print-area" data-print-type="plano" className="space-y-2 print:p-0 bg-white">
                      <div className="bg-white print:border-none border border-slate-150 rounded-3xl p-8 shadow-sm print:p-0 print:shadow-none">
                        {/* Cabeçalho Institucional Oficial Padronizado */}
                        <InstitutionalHeader
                          unidadeName={user.unidadeOrganica}
                          direcaoName={user.direcao}
                          departamentoName={user.departamento}
                          reparticaoName={user.reparticao}
                          sectorName={user.setor}
                          year={selectedYear}
                          isPlanificacaoHeader={isPlanificacao}
                        />

                        {/* Subcabeçalho Padronizado do Plano */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4 border border-slate-200/80 p-4 rounded-2xl bg-white shadow-sm print:hidden mt-2">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-600 p-2.5 rounded-xl shadow-md text-white">
                              <ShieldCheck size={22} />
                            </div>
                            <div>
                              <h3 className="text-sm md:text-base font-black text-slate-900 tracking-tight  leading-none">
                                Plano Institucional Consolidado
                              </h3>
                              <p className="text-[9px] font-bold text-slate-400  tracking-widest mt-1">
                                Visualização Oficial do DPEP
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative w-full md:w-64">
                              <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                size={14}
                              />
                              <input
                                type="text"
                                placeholder="Procurar atividade..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full text-xs font-bold pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all"
                              />
                            </div>
                            <span className="text-xs font-black  border border-slate-300 py-1.5 px-3.5 text-slate-800 bg-white rounded-lg whitespace-nowrap shadow-sm">
                              PESOE: {selectedYear}
                            </span>
                          </div>
                        </div>

                        {/* PESOE Main Table */}
                        <div className="mt-3 overflow-x-auto print:overflow-visible border border-slate-200 rounded-2xl shadow-sm w-full" data-print-type="balanco">
                          <table className="w-full text-left border-collapse print:min-w-full font-sans text-xs print-table-compact">
                            <ActivityTableHeader isDPEP={isDPEP} />
                            <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                              {(
                                Object.entries(
                                  filteredActivities
                                    .sort((a, b) =>
                                      compareActivitiesStandardOrder(
                                        a,
                                        b,
                                        getActMonthIndex,
                                      ),
                                    )
                                    .filter((a) => {
                                      if (isChefeDPEP) return true;
                                      if (directorDirection === "ALL")
                                        return true;
                                      if (!directorDirection) return true;
                                      return (a.direcao || "")
                                        .toUpperCase()
                                        .includes(
                                          directorDirection.toUpperCase(),
                                        );
                                    })
                                    .filter((a) =>
                                      (a.title || a.designacao || "")
                                        .toLowerCase()
                                        .includes(searchTerm.toLowerCase()),
                                    )
                                    .reduce(
                                      (acc, act) => {
                                        const dir =
                                          act.direcao || "SEM DIREÇÃO";
                                        if (!acc[dir]) acc[dir] = [];
                                        acc[dir].push(act);
                                        return acc;
                                      },
                                      {} as Record<string, any[]>,
                                    ),
                                ) as [string, any[]][]
                              ).map(([direction, activities]) => {
                                const directionTotalBudget = activities.reduce(
                                  (sum, act) => sum + getActivityTotal(act),
                                  0,
                                );

                                return (
                                  <React.Fragment key={direction}>
                                    <tr className="bg-slate-900 text-white border-y-2 border-slate-950">
                                      <td
                                        colSpan={45}
                                        className="p-4 text-[12px] font-black  tracking-[0.3em] bg-gradient-to-r from-slate-900 to-indigo-900"
                                      >
                                        <div className="flex justify-between items-center">
                                          <span>🏢 DIREÇÃO: {direction}</span>
                                          <div className="flex gap-4 items-center">
                                            <span className="bg-white/10 px-3 py-1 rounded-lg border border-white/20">
                                              {activities.length} Atividades
                                            </span>
                                            <span className="bg-amber-500/20 text-amber-300 px-3 py-1 rounded-lg border border-amber-500/30 font-mono">
                                              Total Direção:{" "}
                                              {directionTotalBudget.toLocaleString(
                                                "pt-MZ",
                                                {
                                                  minimumFractionDigits: 2,
                                                  maximumFractionDigits: 2,
                                                },
                                              )}{" "}
                                              MZN
                                            </span>
                                            {(isBossOrAdmin ||
                                              isPlanificacao) && (
                                              <button
                                                onClick={() => {
                                                  if (
                                                    confirm(
                                                      `Renumerar todas as ${activities.length} atividades da direção ${direction}?`,
                                                    )
                                                  ) {
                                                    reorderAndRenumber(
                                                      activities,
                                                    );
                                                  }
                                                }}
                                                className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-lg border border-white/20 shadow-sm transition-all"
                                                title="Renumerar esta Direção"
                                              >
                                                <LayoutGrid size={12} />
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                    {activities.map((act, idx) => (
                                      <ActivityTableRow
                                        key={act.id}
                                        activity={act}
                                        index={idx}
                                        isDPEP={isDPEP}
                                        user={user}
                                        isBossOrAdmin={isBossOrAdmin}
                                        getActivityTotal={getActivityTotal}
                                        actions={
                                          <button
                                            onClick={() => {
                                              setEditingActivity(act);
                                              setShowAddForm(true);
                                            }}
                                            className="text-blue-600 hover:text-blue-800 font-black  text-[9px] tracking-tighter"
                                          >
                                            Editar
                                          </button>
                                        }
                                      />
                                    ))}
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        <div className="hidden print:grid grid-cols-2 gap-12 mt-20 text-center text-xs font-bold leading-relaxed">
                          <div>
                            <p className="border-b border-black w-48 mx-auto mb-2"></p>
                            <p className="">O RESPONSÁVEL DO PLANO</p>
                            <p className="text-[10px] text-slate-500">
                              Repartição de Planificação
                            </p>
                          </div>
                          <div>
                            <p className="border-b border-black w-48 mx-auto mb-2"></p>
                            <p className="">O DIRETOR CENTRAL</p>
                            <p className="text-[10px] text-slate-500">
                              Instituto Superior Politécnico de Songo
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- LEVEL 5: CHEFE DO DPEP (Validação e Envio ao Órgão Colegial) --- */}
            {selectedRoleMode === "Chefe DPEP" && (
              <div className="p-8 md:p-12 space-y-8 flex-1 bg-white">
                <InstitutionalHeader
                  unidadeName="Instituto Superior Politécnico de Songo"
                  direcaoName="Direção de Planificação, Estudos e Projetos"
                  departamentoName="Gabinete do Chefe do DPEP"
                  year={selectedYear}
                  isOwner={true}
                />

                <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-indigo-700/50 space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/10 pb-6">
                    <div>
                      <span className="text-[10px] font-black  tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                        Apreciação do Chefe do DPEP
                      </span>
                      <h3 className="text-2xl font-black mt-2 text-white  tracking-tight font-serif">
                        Proposta do Plano Institucional (PESOE {selectedYear})
                      </h3>
                      <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                        O Setor de Planificação consolidou todas as atividades das 5 Direções. Como Chefe do DPEP, valide a proposta e envie-a para apreciação e homologação do Órgão Colegial.
                      </p>
                    </div>
                    <button
                      onClick={handleSendChefeDPEPToOrgaoColegial}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-6 py-3.5 rounded-2xl text-xs  tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 whitespace-nowrap"
                    >
                      <Send size={16} strokeWidth={2.5} /> Enviar Proposta ao Órgão Colegial
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                      <span className="text-[10px] font-bold text-slate-400  tracking-wider block">Total de Atividades</span>
                      <span className="text-2xl font-black text-white font-mono">{filteredActivities.length}</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                      <span className="text-[10px] font-bold text-slate-400  tracking-wider block">Orçamento Atividades</span>
                      <span className="text-2xl font-black text-amber-400 font-mono">
                        {filteredActivities.reduce((acc, a) => acc + getActivityTotal(a), 0).toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN
                      </span>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                      <span className="text-[10px] font-bold text-slate-400  tracking-wider block">Direções Integradas</span>
                      <span className="text-2xl font-black text-emerald-400 font-mono">5 / 5</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                      <span className="text-[10px] font-bold text-slate-400  tracking-wider block">Destino da Proposta</span>
                      <span className="text-sm font-black text-slate-200  mt-1 block">Órgão Colegial</span>
                    </div>
                  </div>
                </div>

                {/* Tabela do Plano Institucional para Validação do Chefe do DPEP */}
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                  <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
                    <div>
                      <h4 className="text-base font-black  tracking-wide">
                        Matriz Geral de Atividades Consolidadas
                      </h4>
                      <p className="text-[10px] text-slate-400">Atividades prontas para encaminhamento ao Órgão Colegial</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {filteredActivities.length} Atividades Registadas
                    </span>
                  </div>
                  <div className="overflow-x-auto print:overflow-visible w-full">
                    <table className="w-full text-left border-collapse font-sans text-xs print-table-compact">
                      <ActivityTableHeader isDPEP={true} />
                      <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                        {filteredActivities.map((act, idx) => (
                          <ActivityTableRow
                            key={act.id}
                            activity={act}
                            onViewHistory={setActivityForHistory}
                            index={idx}
                            isDPEP={true}
                            user={user}
                            isBossOrAdmin={true}
                            getActivityTotal={getActivityTotal}
                            onUpdateExecution={onUpdateExecution}
                            onUpdateRelatorio={onUpdateRelatorio}
                            actions={
                              <div className="flex justify-center items-center gap-2">
                                <button
                                  onClick={() => {
                                    setEditingActivity(act);
                                    setShowAddForm(true);
                                  }}
                                  className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                                  title="Visualizar"
                                >
                                  <Eye size={13} />
                                </button>
                              </div>
                            }
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* --- LEVEL 6: ÓRGÃO COLEGIAL (Deliberação e Homologação Final) --- */}
            {selectedRoleMode === "Órgão Colegial" && (
              <div className="p-3 sm:p-4 md:p-6 space-y-4 flex-1 w-full bg-white">
                <InstitutionalHeader
                  unidadeName="Instituto Superior Politécnico de Songo"
                  direcaoName="Conselho de Direção"
                  departamentoName="Órgão Colegial de Deliberação"
                  year={selectedYear}
                  isOwner={true}
                />

                <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-emerald-800/50 space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/10 pb-6">
                    <div>
                      <span className="text-[10px] font-black  tracking-widest text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
                        Deliberação Colegial
                      </span>
                      <h3 className="text-2xl font-black mt-2 text-white  tracking-tight font-serif">
                        Apreciação e Aprovação Final do PESOE {selectedYear}
                      </h3>
                      <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                        Proposta submetida pelo Chefe do DPEP para apreciação em sede do Conselho de Direção / Órgão Colegial. Clique para aprovar e homologar o plano institucional.
                      </p>
                    </div>
                    <button
                      onClick={handleOrgaoColegialAprovar}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-6 py-3.5 rounded-2xl text-xs  tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 whitespace-nowrap"
                    >
                      <CheckCircle2 size={16} strokeWidth={2.5} /> Aprovar & Homologar PESOE {selectedYear}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                      <span className="text-[10px] font-bold text-slate-400  tracking-wider block">Atividades Institucionais</span>
                      <span className="text-2xl font-black text-white font-mono">{filteredActivities.length}</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                      <span className="text-[10px] font-bold text-slate-400  tracking-wider block">Orçamento Geral Aprovado</span>
                      <span className="text-2xl font-black text-emerald-400 font-mono">
                        {filteredActivities.reduce((acc, a) => acc + getActivityTotal(a), 0).toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN
                      </span>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                      <span className="text-[10px] font-bold text-slate-400  tracking-wider block">Estado da Homologação</span>
                      <span className="text-sm font-black text-emerald-300  mt-1 block">Pronto para Homologação</span>
                    </div>
                  </div>
                </div>

                {/* Tabela do Plano para o Órgão Colegial */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm w-full">
                  <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
                    <div>
                      <h4 className="text-base font-black  tracking-wide">
                        Plano Económico, Social e Orçamento da Entidade (PESOE)
                      </h4>
                      <p className="text-[10px] text-slate-400">Todas as atividades apreciadas pelo Conselho de Direção</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {filteredActivities.length} Atividades
                    </span>
                  </div>
                  <div className="overflow-x-auto print:overflow-visible w-full">
                    <table className="w-full text-left border-collapse font-sans text-xs print-table-compact">
                      <ActivityTableHeader isDPEP={true} />
                      <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                        {filteredActivities.map((act, idx) => (
                          <ActivityTableRow
                            key={act.id}
                            activity={act}
                            onViewHistory={setActivityForHistory}
                            index={idx}
                            isDPEP={true}
                            user={user}
                            isBossOrAdmin={true}
                            getActivityTotal={getActivityTotal}
                            onUpdateExecution={onUpdateExecution}
                            onUpdateRelatorio={onUpdateRelatorio}
                            actions={
                              <div className="flex justify-center items-center gap-2">
                                <button
                                  onClick={() => {
                                    setEditingActivity(act);
                                    setShowAddForm(true);
                                  }}
                                  className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                                  title="Visualizar"
                                >
                                  <Eye size={13} />
                                </button>
                              </div>
                            }
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Form Modal */}
            <AnimatePresence>
              {showAddForm && (
                <div className="fixed inset-0 z-[150] bg-white flex flex-col">
                  <ActivityForm
                    planType="Plano de Atividades"
                    sectorName={title}
                    plannedActivitiesCount={authorizedActivities.length}
                    plannedActivitiesProp={initialActivities}
                    onClose={() => {
                      setShowAddForm(false);
                      setEditingActivity(null);
                    }}
                    colaboradores={colaboradores}
                    initialData={editingActivity || { ano: selectedYear }}
                    user={user}
                    readOnly={
                      editingActivity ? !canEdit(editingActivity) : false
                    }
                    onSubmit={async (data) => {
                      const totalValue =
                        data.rubricas?.reduce(
                          (acc: number, r: any) =>
                            acc + (r.valorTotal || r.total || 0),
                          0,
                        ) || 0;
                      const mainRubric = data.rubricas?.[0]?.rubrica || "";

                      const activity: any = {
                        ...data,
                        id:
                          (data._forceNewRecord ? undefined : editingActivity?.id) ||
                          Math.random().toString(36).substr(2, 9),
                        status:
                          (data._forceNewRecord ? undefined : editingActivity?.status) ||
                          (selectedRoleMode === "Planificação"
                            ? "planificacao"
                            : selectedRoleMode === "Direção"
                              ? "direcao"
                              : selectedRoleMode === "Departamento"
                                ? "departamento"
                                : selectedRoleMode === "Repartição"
                                  ? "reparticao"
                                  : "setorial"),
                        submetido: data._forceNewRecord ? false : (editingActivity?.submetido || false),
                        createdAt:
                          (data._forceNewRecord ? undefined : editingActivity?.createdAt) ||
                          new Date().toISOString(),
                        createdBy:
                          (data._forceNewRecord ? undefined : editingActivity?.createdBy) || user?.email || "",
                        createdByName:
                          (data._forceNewRecord ? undefined : editingActivity?.createdByName) ||
                          user?.nome ||
                          user?.name ||
                          user?.displayName ||
                          "",
                        nuit: (data._forceNewRecord ? undefined : editingActivity?.nuit) || user?.nuit || "",
                        no: (() => {
                          if (data.nAtividade || data.no) return String(data.nAtividade || data.no).padStart(3, "0");
                          if (!data._forceNewRecord && editingActivity?.no) return editingActivity.no;

                          const specificArea = 
                            data.setor || 
                            data.reparticao || 
                            data.departamento || 
                            data.direcao || 
                            data.selectedCategory || 
                            title ||
                            "Songo";

                          const areaActivities = rawActivities.filter(
                            (a: any) => {
                              const actArea = `${a.direcao} ${a.departamento} ${a.reparticao} ${a.setor}`.toLowerCase();
                              return actArea.includes(specificArea.toLowerCase()) && 
                                (a.ano || new Date().getFullYear()) === selectedYear;
                            }
                          );

                          const maxNumber = areaActivities.reduce(
                            (max: number, a: any) => {
                              const numStr = a.numeroAtividade || a.nAtividade || a.no;
                              const parsedNum = numStr ? parseInt(String(numStr).replace(/\D/g, ""), 10) : NaN;
                              if (!isNaN(parsedNum)) return parsedNum > max ? parsedNum : max;

                              const ref = String(a.referencia || a.codigoAtividade || "");
                              const match = ref.match(/\/(\d{3})\//) || ref.match(/\/(\d+)\//);
                              const num = match ? parseInt(match[1], 10) : 0;
                              return num > max ? num : max;
                            },
                            0,
                          );

                          return String(maxNumber + 1).padStart(3, "0");
                        })(),
                        referencia: (() => {
                          if (data.codigoAtividade && !data.codigoAtividade.includes("/000/"))
                            return data.codigoAtividade.toUpperCase();
                          if (!data._forceNewRecord && editingActivity?.referencia)
                            return editingActivity.referencia;
                          
                          const specificArea = 
                            data.setor || 
                            data.reparticao || 
                            data.departamento || 
                            data.direcao || 
                            data.selectedCategory || 
                            title ||
                            "Songo";

                          const areaActivities = rawActivities.filter(
                            (a: any) => {
                              const actArea = `${a.direcao} ${a.departamento} ${a.reparticao} ${a.setor}`.toLowerCase();
                              return actArea.includes(specificArea.toLowerCase()) && 
                                (a.ano || new Date().getFullYear()) === selectedYear;
                            }
                          );

                          const maxNumber = areaActivities.reduce(
                            (max: number, a: any) => {
                              const numStr = a.numeroAtividade || a.nAtividade || a.no;
                              const parsedNum = numStr ? parseInt(String(numStr).replace(/\D/g, ""), 10) : NaN;
                              if (!isNaN(parsedNum)) return parsedNum > max ? parsedNum : max;

                              const ref = String(a.referencia || a.codigoAtividade || "");
                              const match = ref.match(/\/(\d{3})\//) || ref.match(/\/(\d+)\//);
                              const num = match ? parseInt(match[1], 10) : 0;
                              return num > max ? num : max;
                            },
                            0,
                          );

                          const nextNumber = String(maxNumber + 1).padStart(3, "0");

                          const dirInitials = (data.unidadeSelecionada || data.direcao || "Songo").substring(0, 3).toUpperCase();
                          const deptInitials = specificArea.substring(0, 4).toUpperCase();
                          const actTitle = data.nomeAtividade || data.title || "ACT";
                          const actInitials = actTitle.replace(/[^a-zA-Z]/g, "").substring(0, 3).toUpperCase() || "ACT";

                          return `${dirInitials}/${deptInitials}/${nextNumber}/${actInitials}`;
                        })(),
                        title:
                          data.nomeAtividade || data.title || "Nova Atividade",
                        direcao:
                          data.unidadeSelecionada ||
                          data.direcao ||
                          editingActivity?.direcao ||
                          user?.direcao ||
                          user?.servicoCentral ||
                          "Direção Geral",
                        departamento:
                          data.departamento ||
                          editingActivity?.departamento ||
                          user?.departamento ||
                          "",
                        reparticao:
                          data.reparticao ||
                          data.setor ||
                          editingActivity?.reparticao ||
                          user?.reparticao ||
                          user?.setor ||
                          title ||
                          "",
                        orcamento:
                          data.fonteReceita ||
                          mainRubric ||
                          editingActivity?.orcamento ||
                          "Orçamento do Estado",
                        valor:
                          Number(totalValue) || editingActivity?.valor || 0,
                        frequencia: data.frequencia || "Mensal",
                        mesExecucao: data.mesExecucao || "",
                        unidadeOrganica:
                          data.selectedCategory ||
                          data.unidadeOrganica ||
                          editingActivity?.unidadeOrganica ||
                          "Songo",
                        localRealizacao:
                          data.trabalhoProvincia && data.trabalhoDistrito
                            ? `${data.trabalhoProvincia} - ${data.trabalhoDistrito}`
                            : data.realizacaoProvincia &&
                                data.realizacaoDistrito
                              ? `${data.realizacaoProvincia} - ${data.realizacaoDistrito}`
                              : "",
                        dataMes:
                          data.mesRealizacao ||
                          data.dataInicio ||
                          new Date().toLocaleString("pt", { month: "long" }),
                        data:
                          data.dataInicio && data.dataFim
                            ? `${data.dataInicio} a ${data.dataFim}`
                            : data.dataInicio || data.dataFim || "",
                        responsavel: data.responsavel || "",
                        responsavelEmail: (() => {
                          if (data.responsavelEmail)
                            return data.responsavelEmail;
                          // Tentar encontrar o email do responsável na lista de colaboradores
                          if (data.responsavel && colaboradores) {
                            const colab = colaboradores.find(
                              (c) =>
                                c.nome === data.responsavel ||
                                c.name === data.responsavel,
                            );
                            if (colab && colab.email) return colab.email;
                          }
                          return "";
                        })(),
                        prazo:
                          data.dataFim ||
                          data.mesRealizacao ||
                          data.dataInicio ||
                          "",
                        objetivoAtividade: data.objetivoAtividade || "",
                        trabalhoProvincia: data.trabalhoProvincia || "",
                        trabalhoDistrito: data.trabalhoDistrito || "",
                        realizacaoProvincia: data.realizacaoProvincia || "",
                        realizacaoDistrito: data.realizacaoDistrito || "",
                        outrosColaboradores: data.outrosColaboradores || "",
                        necessitaTransporte: data.necessitaTransporte || "Não",
                        viatura: data.viatura || "",
                        motorista: data.motorista || "",
                        observacoes: data.observacoes || "",
                        rubricas: data.rubricas || [],
                        necessitaAquisicao: data.necessitaAquisicao || "Não",
                        necessitaContratacao:
                          data.necessitaContratacao || "Não",
                        tipoPlano: data.tipoPlano || "Setorial",
                        trimestre: data.trimestre || "",
                        mesRealizacao: data.mesRealizacao || "",
                        dataInicio: data.dataInicio || "",
                        dataFim: data.dataFim || "",
                        totalDias: Number(data.totalDias) || 0,
                        distanciaKm: Number(
                          (data.distanciaKm || data.distanciaDestino || 0) * 2,
                        ),
                        distanciaDestino: Number(
                          data.distanciaDestino || 0,
                        ),
                        litrosGasoleo: Number(data.litrosGasoleo || 0),
                        precoLitro: Number(data.precoLitro || 0),
                        valorTotalGasoleo: Number(data.valorTotalGasoleo || 0),
                        prioridadeProposta: data.prioridadeProposta || "",
                        codigoAtividade: data.codigoAtividade || "",
                        setor:
                          data.setor ||
                          data.reparticao ||
                          editingActivity?.setor ||
                          user?.setor ||
                          user?.sector ||
                          user?.seccao ||
                          user?.reparticao ||
                          title ||
                          "Setor Geral",
                        curso: data.curso || "",
                        requiresUpdate: false,
                        ano: (editingActivity && editingActivity.id && !data._forceNewRecord)
                          ? Number(editingActivity.ano || 2026)
                          : Number(data.ano || selectedYear),
                        publicadoPorNome:
                          user?.nome || user?.name || user?.displayName || "",
                        publicadoPorDepartamento:
                          user?.departamento || user?.direcao || "",
                      };

                      try {
                        console.log(
                          "PlanoWorkflowView: Processando atividade:",
                          activity.title,
                        );
                        if (editingActivity && editingActivity.id && !data._forceNewRecord) {
                          console.log(
                            "PlanoWorkflowView: Atualizando atividade existente ID:",
                            editingActivity.id,
                          );
                          await firestoreService.matrixActivities.replace(
                            editingActivity.id,
                            activity,
                          );
                          console.log(
                            "PlanoWorkflowView: Atividade atualizada no Firestore.",
                          );

                          // Sincronizar atualizações com outras cópias da mesma atividade nas diferentes etapas do fluxo
                          try {
                            console.log(
                              "PlanoWorkflowView: Iniciando sincronização de cópias...",
                            );
                            const {
                              id,
                              status,
                              submetido,
                              createdAt,
                              ...fieldsToUpdate
                            } = activity;
                            const relatedCopies = rawActivities.filter((a) => {
                              if (a.id === editingActivity.id) return false;
                              if ((a.ano || 2026) !== (activity.ano || 2026))
                                return false;

                              const sameRef =
                                activity.referencia &&
                                a.referencia &&
                                activity.referencia === a.referencia;
                              const sameCode =
                                activity.codigoAtividade &&
                                a.codigoAtividade &&
                                activity.codigoAtividade === a.codigoAtividade;
                              const sameNumAndSector =
                                activity.no === a.no &&
                                (activity.setor ||
                                  activity.reparticao ||
                                  "") === (a.setor || a.reparticao || "") &&
                                (activity.departamento || "") ===
                                  (a.departamento || "");
                              const sameTitleAndSector =
                                activity.title &&
                                a.title &&
                                activity.title === a.title &&
                                (activity.setor ||
                                  activity.reparticao ||
                                  "") === (a.setor || a.reparticao || "") &&
                                (activity.departamento || "") ===
                                  (a.departamento || "");

                              return (
                                sameRef ||
                                sameCode ||
                                sameNumAndSector ||
                                sameTitleAndSector
                              );
                            });

                            if (relatedCopies.length > 0) {
                              console.log(
                                `PlanoWorkflowView: Sincronizando ${relatedCopies.length} cópias em background.`,
                              );
                              // Sincronização em background para não bloquear a UI
                              Promise.all(
                                relatedCopies.map((copy) =>
                                  firestoreService.matrixActivities.update(
                                    copy.id,
                                    fieldsToUpdate,
                                  ),
                                ),
                              )
                                .then(() => {
                                  console.log(
                                    `Sincronizadas ${relatedCopies.length} cópias da atividade.`,
                                  );
                                })
                                .catch((syncErr) => {
                                  console.error(
                                    "Erro ao sincronizar cópias em background:",
                                    syncErr,
                                  );
                                });

                              // Atualizar imediatamente o estado local para as cópias
                              setRawActivities((prev) =>
                                prev.map((a) => {
                                  const isCopy = relatedCopies.some(
                                    (c) => c.id === a.id,
                                  );
                                  if (isCopy)
                                    return { ...a, ...fieldsToUpdate };
                                  return a;
                                }),
                              );
                            }
                          } catch (syncErr) {
                            console.error(
                              "Erro ao sincronizar cópias:",
                              syncErr,
                            );
                          }

                          // Atualizar estado local da atividade principal APÓS sincronização
                          setRawActivities((prev) =>
                            prev.map((a) =>
                              a.id === editingActivity.id ? activity : a,
                            ),
                          );

                          console.log(
                            "PlanoWorkflowView: Fechando formulário.",
                          );
                          setShowAddForm(false);
                          setEditingActivity(null);

                          onShowAlert(
                            "Atividade planificada atualizada com sucesso!",
                          );
                        } else {
                          console.log(
                            "PlanoWorkflowView: Adicionando nova atividade.",
                          );
                          const newId =
                            await firestoreService.matrixActivities.add(
                              activity,
                            );
                          console.log(
                            "PlanoWorkflowView: Nova atividade adicionada com ID:",
                            newId,
                          );
                          const savedActivity = {
                            ...activity,
                            id: newId || activity.id,
                          };
                          setRawActivities((prev) => { if (prev.some(a => a.id === savedActivity.id)) { return prev.map(a => a.id === savedActivity.id ? savedActivity : a); } return [savedActivity, ...prev]; });

                          console.log(
                            "PlanoWorkflowView: Fechando formulário.",
                          );
                          setShowAddForm(false);
                          setEditingActivity(null);

                          onShowAlert(
                            `Atividade planificada adicionada ao Plano ${
                              activeSubTab === "plano_institucional"
                                ? "Institucional"
                                : activeSubTab === "plano_direcoes"
                                  ? "da Direção"
                                  : activeSubTab === "plano_departamento"
                                    ? "do Departamento"
                                    : "da Repartição"
                            } com sucesso!`,
                          );
                        }
                      } catch (err: any) {
                        console.error("Erro ao salvar atividade:", err);
                        throw new Error(
                          err?.message ||
                            "Falha ao registar a atividade no servidor.",
                        );
                      }
                    }}
                  />
                </div>
              )}
            </AnimatePresence>

            {/* Modal de Agendamento de Atualização */}
            <AnimatePresence>
              {showScheduleModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100"
                  >
                    <div className="p-6 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white rounded-2xl shadow-sm text-amber-600">
                          <Calendar size={20} />
                        </div>
                        <div>
                          <h2 className="text-slate-900 font-black text-sm  tracking-tight">
                            Agendar Atualização
                          </h2>
                          <p className="text-amber-700/70 text-[10px] font-bold  tracking-wider">
                            Edição extraordinária
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500  tracking-widest ml-1">
                          Título do Agendamento
                        </label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-amber-500 transition-all"
                          placeholder="Ex: Atualização do 1º Semestre"
                          value={newSchedule.title}
                          onChange={(e) =>
                            setNewSchedule({
                              ...newSchedule,
                              title: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500  tracking-widest ml-1">
                            Início
                          </label>
                          <input
                            type="date"
                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-amber-500 transition-all"
                            value={newSchedule.startDate}
                            onChange={(e) =>
                              setNewSchedule({
                                ...newSchedule,
                                startDate: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500  tracking-widest ml-1">
                            Fim (Prazo)
                          </label>
                          <input
                            type="date"
                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-amber-500 transition-all"
                            value={newSchedule.endDate}
                            onChange={(e) =>
                              setNewSchedule({
                                ...newSchedule,
                                endDate: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500  tracking-widest ml-1">
                          Nível de Acesso
                        </label>
                        <select
                          className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-amber-500 transition-all"
                          value={newSchedule.statusToUpdate}
                          onChange={(e) =>
                            setNewSchedule({
                              ...newSchedule,
                              statusToUpdate: e.target.value,
                            })
                          }
                        >
                          <option value="setor">
                            Setores (Plano Setorial)
                          </option>
                          <option value="reparticao">Repartições</option>
                          <option value="departamento">Departamentos</option>
                          <option value="direcao">Direções</option>
                        </select>
                      </div>

                      <p className="text-[9px] text-slate-400 font-bold  italic leading-relaxed text-center px-4">
                        * Os documentos deste nível tornar-se-ão editáveis até o
                        prazo final, após o qual serão submetidos
                        automaticamente.
                      </p>
                    </div>

                    <div className="p-6 bg-slate-50 flex gap-3">
                      <button
                        onClick={() => setShowScheduleModal(false)}
                        className="flex-1 px-6 py-3.5 bg-white text-slate-600 font-black text-[10px]  tracking-widest rounded-2xl border border-slate-200 hover:bg-slate-100 transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={async () => {
                          if (!newSchedule.endDate || !newSchedule.title) {
                            alert("Preencha todos os campos.");
                            return;
                          }
                          try {
                            await firestoreService.plan_schedules.add({
                              ...newSchedule,
                              autoSubmitted: false,
                              createdBy: user?.nome || user?.email,
                            });
                            setShowScheduleModal(false);
                            onShowAlert(
                              "Período de atualização agendado com sucesso.",
                            );
                          } catch (err) {
                            console.error(err);
                            alert("Erro ao agendar.");
                          }
                        }}
                        className="flex-1 px-6 py-3.5 bg-amber-600 text-white font-black text-[10px]  tracking-widest rounded-2xl shadow-lg shadow-amber-100 hover:bg-amber-700 transition-all"
                      >
                        Confirmar
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Modal de Sincronização do Arquivo Morto */}
            {isSyncModalOpen && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 flex flex-col animate-scale-up">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div>
                      <span className="text-[10px] font-black text-emerald-600  tracking-widest block mb-0.5">
                        Sincronização Institucional
                      </span>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">
                        Converter Plano Digital
                      </h3>
                    </div>
                    <button
                      onClick={() => setIsSyncModalOpen(false)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="p-6 space-y-5">
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      Selecione o ano e o ficheiro do Arquivo Morto para
                      sincronizar as atividades com o seu plano setorial atual.
                    </p>

                    <div className="space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-black text-slate-500  tracking-wider">
                          Ano do Plano
                        </label>
                        <select
                          value={syncYear}
                          onChange={(e) => {
                            const yr = Number(e.target.value);
                            setSyncYear(yr);
                            // O ideal seria disparar o reload aqui, mas como estamos no componente, podemos usar um useEffect
                          }}
                          className="px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-emerald-500 focus:ring-0 outline-none text-sm font-semibold transition-all bg-white"
                        >
                          {[2026, 2025, 2024, 2023].map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-black text-slate-500  tracking-wider">
                          Ficheiro a Sincronizar
                        </label>
                        <select
                          value={selectedPlanId}
                          onChange={(e) => setSelectedPlanId(e.target.value)}
                          className="px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-emerald-500 focus:ring-0 outline-none text-sm font-semibold transition-all bg-white"
                        >
                          {availablePlans.length > 0 ? (
                            availablePlans.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.title || p.nome || `Plano ${syncYear}`}
                              </option>
                            ))
                          ) : (
                            <option value="">
                              Nenhum ficheiro encontrado (Usar Padrão)
                            </option>
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="pt-4 flex flex-col gap-3">
                      <button
                        onClick={handleSyncPlano}
                        disabled={isLoading}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs  tracking-widest rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-[0.98]"
                      >
                        {isLoading ? (
                          <RefreshCw size={16} strokeWidth={1.5} className="animate-spin" />
                        ) : (
                          <FileUp size={16} />
                        )}
                        Iniciar Conversão
                      </button>
                      <input
                        type="file"
                        ref={modalFileInputRef}
                        onChange={handleFileConversion}
                        className="hidden"
                        accept=".xlsx, .pdf"
                      />
                      <button
                        onClick={() => modalFileInputRef.current?.click()}
                        disabled={isProcessing}
                        className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs  tracking-widest rounded-2xl transition-all"
                      >
                        {isProcessing ? "Processando..." : "Converter Ficheiro"}
                      </button>
                      <button
                        onClick={() => setIsSyncModalOpen(false)}
                        className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs  tracking-widest rounded-2xl transition-all"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {deleteConfirmId && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 flex flex-col animate-scale-up">
                  <div className="p-6 border-b border-slate-100 bg-slate-50">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      Confirmar Exclusão
                    </h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <p className="text-xs text-slate-500 font-medium">
                      Tem a certeza de que deseja remover permanentemente esta
                      atividade?
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="flex-1 px-4 py-2 bg-white text-slate-600 font-black text-[10px]  tracking-widest rounded-xl border border-slate-200 hover:bg-slate-100 transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={performDelete}
                        className="flex-1 px-4 py-2 bg-rose-600 text-white font-black text-[10px]  tracking-widest rounded-xl hover:bg-rose-700 transition-all"
                      >
                        Confirmar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL DE TRAMITAÇÃO E ASSINATURA */}
            <AnimatePresence>
              {showTramitacaoModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4"
                >
                  <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] border border-slate-100 flex flex-col"
                  >
                    <div className="p-8 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200">
                          <Send size={20} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">
                          Submeter o Plano de Atividade
                        </h3>
                      </div>
                      <p className="text-sm font-bold text-slate-500">
                        O plano será submetido automaticamente para o seu superior hierárquico conforme o enquadramento.
                      </p>
                    </div>

                    <div className="p-8 space-y-6">
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                        <div className="p-1.5 bg-amber-500 text-white rounded-lg shrink-0 mt-0.5">
                          <Info size={14} />
                        </div>
                        <p className="text-[11px] text-amber-900 font-bold leading-relaxed">
                          Ao confirmar, o sistema registrará sua assinatura digital
                          (<strong>{user?.nome || user?.email}</strong>) e enviará o 
                          plano para o gabinete selecionado.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-500  tracking-widest ml-1">
                          Destinatário Oficial
                        </label>
                        <select
                          value={selectedDestinatario}
                          onChange={(e) => setSelectedDestinatario(e.target.value)}
                          className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:ring-0 outline-none text-sm font-bold transition-all bg-slate-50 hover:bg-white"
                        >
                          <option value="">Selecione o Gabinete / Setor</option>
                          {(() => {
                            if (!workflowToProcess) return GABINETES_DESTINATARIOS;
                            const { toStatus } = workflowToProcess;
                            
                            let options: string[] = [];
                            if (toStatus === "reparticao") options = [user?.reparticao || "Chefe da Repartição"];
                            else if (toStatus === "departamento") options = [user?.departamento || "Chefe do Departamento"];
                            else if (toStatus === "direcao") options = [user?.direcao || "Diretor da Direção"];
                            else if (toStatus === "planificacao") options = ["Setor de Planificação (DPEP)"];
                            else if (toStatus === "dpep_chefe") options = ["Gabinete do Chefe do DPEP", "Chefe do DPEP"];
                            else if (toStatus === "orgao_colegial") options = ["Conselho de Direção / Órgão Colegial"];
                            else if (toStatus === "institucional") options = ["Conselho de Direção", "Gabinete do Diretor Geral", "Arquivo Geral"];
                            
                            const validOptions = options.filter(o => o && o.trim() !== "");
                            return validOptions.length > 0 ? validOptions.map(g => (
                              <option key={g} value={g}>{g}</option>
                            )) : GABINETES_DESTINATARIOS.map(g => (
                              <option key={g} value={g}>{g}</option>
                            ));
                          })()}
                        </select>
                      </div>

                      <div className="flex gap-4 pt-4">
                        <button
                          onClick={() => {
                            setShowTramitacaoModal(false);
                            setSelectedDestinatario("");
                            setWorkflowToProcess(null);
                          }}
                          className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 font-black text-xs  tracking-widest rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={confirmWorkflowTransition}
                          disabled={isLoading || !selectedDestinatario}
                          className="flex-1 px-6 py-4 bg-blue-600 text-white font-black text-xs  tracking-widest rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 active:scale-95"
                        >
                          {isLoading ? (
                            <RefreshCw size={16} strokeWidth={1.5} className="animate-spin" />
                          ) : (
                            <>
                              <Save size={16} /> Submeter
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* MODAL DE HISTÓRICO DE TRAMITAÇÃO / ASSINATURAS */}
            <AnimatePresence>
              {activityForHistory && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-4"
                >
                  <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    className="bg-white rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[80vh]"
                  >
                    <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg">
                          <Clock size={20} />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-slate-900 tracking-tight">
                            Histórico de Tramitação
                          </h3>
                          <p className="text-xs font-bold text-slate-500  tracking-widest mt-0.5">
                            Livro de Assinaturas Digitais
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setActivityForHistory(null)}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                      >
                        <X size={20} className="text-slate-400" />
                      </button>
                    </div>

                    <div className="p-8 overflow-y-auto space-y-6">
                      <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl">
                        <h4 className="text-[10px] font-black text-indigo-900  tracking-widest mb-1.5">Documento</h4>
                        <p className="text-sm font-bold text-slate-900 leading-tight">
                          {activityForHistory.title || activityForHistory.designacao}
                        </p>
                        <p className="text-[10px] text-indigo-700 mt-1 font-medium">
                          Código: {activityForHistory.codigoAtividade || activityForHistory.referencia}
                        </p>
                      </div>

                      <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                        {Array.isArray(activityForHistory.workflowHistory) && activityForHistory.workflowHistory.length > 0 ? (
                          activityForHistory.workflowHistory.map((entry: any, idx: number) => (
                            <div key={idx} className="relative">
                              <div className="absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-600 z-10 shadow-sm" />
                              <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <h5 className="text-sm font-black text-slate-900">{entry.userName}</h5>
                                    <p className="text-[10px] font-bold text-indigo-600  tracking-wider">{entry.userRole}</p>
                                  </div>
                                  <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-lg">
                                    {new Date(entry.date).toLocaleString('pt-PT')}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-50">
                                  <span className="p-1 bg-emerald-50 text-emerald-600 rounded">
                                    <Save size={10} />
                                  </span>
                                  <p className="text-[11px] font-bold text-slate-600">
                                    {entry.action} para <span className="text-indigo-900">{entry.destination}</span>
                                  </p>
                                </div>
                                <div className="mt-4 flex items-center gap-2">
                                  <div className="h-0.5 flex-1 bg-slate-50"></div>
                                  <span className="text-[8px] font-black text-slate-300 italic ">Assinatura Digital Verificada</span>
                                  <div className="h-0.5 flex-1 bg-slate-50"></div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-12 text-center">
                            <p className="text-sm font-bold text-slate-400 italic">Nenhum registro de tramitação oficial encontrado.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => setActivityForHistory(null)}
                        className="px-8 py-3 bg-slate-900 text-white font-black text-[10px]  tracking-widest rounded-xl shadow-lg active:scale-95 transition-all"
                      >
                        Fechar Registro
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {showImportPreview && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
                >
                  <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    className="bg-white rounded-[2rem] w-[95vw] max-w-[1400px] h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200"
                  >
                    <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl shadow-lg">
                          <Upload size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                            Conferência de Dados do Ficheiro Físico
                          </h3>
                          <p className="text-[10px] font-bold text-slate-500  tracking-widest mt-1 flex items-center gap-2">
                            <FileText size={14} className="text-amber-600" /> {importFileName} — {previewActivities.length} atividades detectadas
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setShowImportPreview(false);
                            setPreviewActivities([]);
                          }}
                          className="px-6 py-3 bg-slate-100 text-slate-600 font-black text-[10px]  tracking-widest rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleConfirmImport}
                          disabled={isProcessing}
                          className="px-8 py-3 bg-emerald-600 text-white font-black text-[10px]  tracking-widest rounded-xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                        >
                          {isProcessing ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                          Confirmar e Gravar na Base de Dados
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-auto p-4 bg-slate-100/50">
                      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-[10px] font-sans">
                            <thead className="bg-[#0f172a] text-white sticky top-0 z-10">
                              <tr>
                                <th className="px-4 py-4 border-r border-slate-700  tracking-widest font-black text-center bg-slate-900 w-12">Nº</th>
                                <th className="px-4 py-4 border-r border-slate-700  tracking-widest font-black bg-slate-900 w-32">Código</th>
                                <th className="px-4 py-4 border-r border-slate-700  tracking-widest font-black bg-slate-900 w-64">Atividade / Designação</th>
                                <th className="px-4 py-4 border-r border-slate-700  tracking-widest font-black bg-slate-900 min-w-[250px]">Objetivo & Metas</th>
                                <th className="px-4 py-4 border-r border-slate-700  tracking-widest font-black bg-slate-900 w-40 text-center">Trim/Mês</th>
                                <th className="px-4 py-4 border-r border-slate-700  tracking-widest font-black bg-slate-900 w-48">Responsável</th>
                                <th className="px-4 py-4 border-r border-slate-700  tracking-widest font-black bg-slate-900 w-40">Localização</th>
                                <th className="px-4 py-4 border-r border-slate-700  tracking-widest font-black bg-slate-900 w-32">Rubrica</th>
                                <th className="px-4 py-4 border-r border-slate-700  tracking-widest font-black bg-slate-900 w-56">Necessidade (Produto)</th>
                                <th className="px-4 py-4 border-r border-slate-700  tracking-widest font-black bg-slate-900 w-16 text-center">Qtd</th>
                                <th className="px-4 py-4 border-r border-slate-700  tracking-widest font-black bg-slate-900 w-28 text-right">Unitário</th>
                                <th className="px-4 py-4  tracking-widest font-black bg-slate-900 w-32 text-right">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {previewActivities.map((act, idx) => {
                                const rubricas = Array.isArray(act.rubricas) && act.rubricas.length > 0
                                  ? act.rubricas
                                  : [{
                                      rubrica: act.rubrica,
                                      necessidade: act.necessidade,
                                      quantidade: act.numeroPessoas || act.quantidade || 0,
                                      precoUnitario: act.unitario || 0,
                                      valorTotal: act.total || 0
                                    }];

                                return rubricas.map((rub, rIdx) => (
                                  <tr key={`${idx}-${rIdx}`} className="hover:bg-amber-50/50 transition-colors group">
                                    {rIdx === 0 && (
                                      <>
                                        <td className="px-4 py-3 border-r border-slate-50 text-slate-400 font-black text-center bg-slate-50/30" rowSpan={rubricas.length}>
                                          {act.no || idx + 1}
                                        </td>
                                        <td className="px-4 py-3 border-r border-slate-50 text-slate-500 font-mono text-[9px]" rowSpan={rubricas.length}>
                                          {act.codigoAtividade || "-"}
                                        </td>
                                        <td className="px-4 py-3 border-r border-slate-50 text-slate-900 font-black" rowSpan={rubricas.length}>
                                          {act.title || "-"}
                                        </td>
                                        <td className="px-4 py-3 border-r border-slate-50 text-slate-500 font-medium leading-relaxed" rowSpan={rubricas.length}>
                                          <div className="max-h-20 overflow-y-auto pr-2 custom-scrollbar">
                                            {act.objetivoAtividade || act.especificacoes || "-"}
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 border-r border-slate-50 text-slate-700 font-bold text-center" rowSpan={rubricas.length}>
                                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] block mb-1">T{act.trimestre || "?"}</span>
                                          <span className="text-[9px] text-slate-400 ">{act.mesRealizacao || "-"}</span>
                                        </td>
                                        <td className="px-4 py-3 border-r border-slate-50 text-slate-600 font-bold" rowSpan={rubricas.length}>
                                          {act.responsavel || "-"}
                                        </td>
                                        <td className="px-4 py-3 border-r border-slate-50 text-slate-500 text-[9px]  font-bold" rowSpan={rubricas.length}>
                                          {act.trabalhoProvincia} / {act.trabalhoDistrito}
                                        </td>
                                      </>
                                    )}
                                    <td className="px-4 py-3 border-r border-slate-50 text-indigo-700 font-black">
                                      {rub.rubrica || "-"}
                                    </td>
                                    <td className="px-4 py-3 border-r border-slate-50 text-slate-600 font-bold">
                                      {rub.necessidade || rub.especificacoes || "-"}
                                    </td>
                                    <td className="px-4 py-3 border-r border-slate-50 text-slate-900 font-black text-center bg-slate-50/20">
                                      {rub.quantidade || 0}
                                    </td>
                                    <td className="px-4 py-3 border-r border-slate-50 text-slate-600 font-bold text-right tabular-nums">
                                      {Number(rub.precoUnitario || 0).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-3 text-slate-950 font-black text-right bg-amber-50/50 tabular-nums">
                                      {Number(rub.valorTotal || 0).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                ));
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
                       <div className="flex items-center gap-3 text-amber-700">
                          <div className="p-1.5 bg-amber-100 rounded-lg">
                            <AlertCircle size={16} strokeWidth={2.5} />
                          </div>
                          <p className="text-[9px] font-black  tracking-[0.1em]">
                            Atenção: A gravação irá atualizar o seu ciclo de planificação com os dados acima.
                          </p>
                       </div>
                       <p className="text-[9px] font-black text-slate-400  tracking-widest">
                         Visualização de Conformidade SIGEP v5.0
                       </p>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[300] flex items-center justify-center p-6"
                >
                  <div className="w-full max-w-md space-y-8 text-center">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.05, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="inline-block p-5 bg-amber-500 text-slate-950 rounded-[2rem] shadow-2xl shadow-amber-500/20 mb-4"
                    >
                      <RefreshCw size={48} className="animate-spin" />
                    </motion.div>

                    <div className="space-y-2">
                      <h3 className="text-3xl font-black text-white tracking-tighter">
                        Processando Digitalização
                      </h3>
                      <p className="text-amber-500 font-black text-[11px]  tracking-[0.3em]">
                        {processingStatus}
                      </p>
                    </div>

                    <div className="relative pt-1">
                      <div className="flex mb-4 items-center justify-between">
                        <div>
                          <span className="text-xs font-black inline-block py-1 px-3  rounded-full text-amber-600 bg-amber-200">
                            Progresso do Sistema
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black inline-block text-white italic">
                            {importProgress}%
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-slate-800 border border-slate-700 p-0.5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${importProgress}%` }}
                          transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-amber-500 to-amber-300 rounded-full"
                        ></motion.div>
                      </div>
                      <p className="text-slate-400 text-[10px] font-bold  tracking-widest">
                        Aguarde a conclusão. Não feche a janela.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </ActivitySelectionContext.Provider>
  );
}

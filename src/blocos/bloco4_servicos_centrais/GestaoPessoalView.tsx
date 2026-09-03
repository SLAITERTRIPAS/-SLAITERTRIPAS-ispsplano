import React, { useState, useRef, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";

const normalizeHeaderString = (str: string): string => {
  if (!str) return "";
  return str
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
};

const getExcelRowValue = (
  row: any,
  keys: string[],
  fallback: any = "",
): any => {
  if (!row) return fallback;
  const normalizedKeys = keys.map((k) => normalizeHeaderString(k));
  for (const rowKey of Object.keys(row)) {
    const normRowKey = normalizeHeaderString(rowKey);
    if (normalizedKeys.includes(normRowKey)) {
      return row[rowKey] !== undefined && row[rowKey] !== null
        ? row[rowKey]
        : fallback;
    }
  }
  return fallback;
};
import {
  ArrowLeft,
  Users,
  UserCheck,
  UserX,
  GraduationCap,
  Briefcase,
  Search,
  Edit,
  MapPin,
  Archive,
  ShieldCheck,
  Upload,
  Plus,
  Download,
  ImagePlus,
  Building,
  FileText,
  FileSpreadsheet,
  Trash2,
  Check,
  X,
  User,
  Camera,
  ClipboardList,
  FolderSearch,
  TrendingUp,
  TrendingDown,
  Wallet,
  Globe,
  Landmark,
  Power,
  Calendar,
  ArrowUp,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Mail,
  BarChart3,
  CheckCircle2,
  Pen,
  FolderOpen,
  MessageSquare,
  FileEdit,
  Save,
  Lock,
  BookOpen,
  AlertTriangle,
  Eye,
  UserPlus,
  Banknote,
  Calculator,
  PieChart,
  CheckSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import LoadingSpinner from "../bloco1_apresentacao/LoadingSpinner";
import { ProcessingCircle } from "../../components/ui/ProcessingCircle";
import IndividualProcessForm from "../bloco8_gerais/IndividualProcessForm";
import ProcessManagementView from "../bloco4_servicos_centrais/ProcessManagementView";
import AfetacaoView from "../bloco4_servicos_centrais/AfetacaoView";
import RegistarFuncionarioForm from "../bloco8_gerais/RegistarFuncionarioForm";
import ReportsView from "../bloco7_relatorios/ReportsView";
import DocumentosView from "../bloco6_documentos/DocumentosView";
import GestaoDocumentosView from "../bloco4_servicos_centrais/GestaoDocumentosView";
import CalendarView from "../bloco5_sistema/CalendarView";
import AssinaturaDigitalView from "../bloco5_sistema/AssinaturaDigitalView";
import VisaoGeralLayout from "../bloco8_gerais/VisaoGeralLayout";
import VisaoGeralCards from "../../components/VisaoGeralCards";
import RemuneracoesRHView from "./RemuneracoesRHView";
import MatrixView from "../bloco5_sistema/MatrixView";
import PlanoWorkflowView from "../bloco5_sistema/PlanoWorkflowView";
import CaixaMensagensView from "../bloco5_sistema/CaixaMensagensView";
import RHStatView from "../bloco7_relatorios/RHStatisticsWorkflowView";
import AcaoOrcamentalView from "../../components/AcaoOrcamentalView";
import { firestoreService } from "../../lib/firestoreService";
import {
  generateCollaboratorId,
  checkIsQuadro,
  classifyTipo,
  mergeColaboradores,
  toTitleCase,
  checkIsSystemAdmin,
  formatEuropeanDate,
  extractProcessSequence,
  sortProcessesNumerically,
  formatProcessNumber,
  getNextProcessSequence,
  hasChefiaPosition,
} from "../../lib/utils";
import { isSuperBossUser, getRoles } from "../../lib/auth";
import * as Types from "../../types";
import { EFETIVO_GERAL_DATA } from "../../constants/colaboradoresList";
import {
  PROVINCIAS_DISTRITOS,
  LISTA_FUNCOES,
  LISTA_CARGOS_CHEFIA,
  UNIDADES_ORGANICAS_SISTEMA,
  DEPARTAMENTOS,
  REPARTICOES,
  SECTORES,
  CURSOS,
  NIVEIS_ACADEMICOS,
  ESTADOS_CIVIS,
  CATEGORIAS_FUNCIONARIOS,
  CATEGORIAS_DOCENTES,
  CATEGORIAS_CTAA,
  FUNCOES_CTA,
  FUNCOES_DOCENTES,
  VINCULOS_CONTRATUAIS,
  getSetoresByDepartamento,
} from "../../constants/formOptions";

const UNIDADES_ORGANICAS = UNIDADES_ORGANICAS_SISTEMA.map((u) => u.nome);

export default function GestaoPessoalView({
  onBack,
  title,
  user,
  onLogout,
  initialColaboradores = [],
  initialProcessos = [],
  hideSidebar = false,
  initialFilter,
}: {
  onBack: () => void;
  title?: string;
  user?: any;
  onLogout?: () => void;
  initialColaboradores?: Types.Colaborador[];
  initialProcessos?: any[];
  hideSidebar?: boolean;
  initialFilter?: {
    processoId?: string;
    dept?: string;
    role?: string;
    shared_by?: string;
  };
}) {
  const [view, setView] = useState<
    | "menu"
    | "lista"
    | "detalhes"
    | "actualizar"
    | "alocar"
    | "processo_form"
    | "processo_edit"
    | "gestao_processo"
    | "afetacao"
    | "duplicados"
    | "conformidade"
    | "visao_geral"
    | "relatorios"
    | "calendario"
    | "documentos_normativos"
    | "gestao_expediente"
    | "assinatura_digital"
    | "plano"
    | "plano_setorial"
    | "plano_atividade"
    | "plano_individual"
    | "caixa_mensagens"
    | "estatistica_reparticao"
    | "remuneracoes"
    | "acao_orcamental"
    | "balanco"
  >("visao_geral");

  const [remuneracoesCategory, setRemuneracoesCategory] = useState<string>("todos");

  useEffect(() => {
    if (
      title &&
      (title.toLowerCase().includes("afetação") ||
        title.toLowerCase().includes("afetacao"))
    ) {
      setView("afetacao");
    }
  }, [title]);
  const [history, setHistory] = useState<any[]>(["menu"]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedProcesso, setSelectedProcesso] = useState<any | null>(null);
  const [filtro, setFiltro] = useState<{
    tipo?: "Docente" | "CTA";
    efetivo?: boolean;
    chefia?: boolean;
    chefiaDocente?: boolean;
    chefiaCTA?: boolean;
    foraInstituicao?: boolean;
    estadoForaInstituicao?: string;
    direcao?: string | null;
    departamento?: string | null;
  } | null>(null);
  const [selectedColaborador, setSelectedColaborador] =
    useState<Types.Colaborador | null>(null);
  const [originalId, setOriginalId] = useState<string | null>(null);
  const [colaboradorToDelete, setColaboradorToDelete] =
    useState<Types.Colaborador | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSortedAZ, setIsSortedAZ] = useState(true);
  const [initialAfetacaoState, setInitialAfetacaoState] = useState<
    | {
        level: "root" | "direction" | "department" | "sector";
        directionName?: string;
      }
    | undefined
  >(undefined);
  const [colaboradores, setColaboradores] = useState<Types.Colaborador[]>(
    () => {
      return initialColaboradores && initialColaboradores.length > 0
        ? initialColaboradores
        : mergeColaboradores([]);
    },
  );

  // Sync state when props change (real-time subscription updates)
  useEffect(() => {
    if (initialColaboradores && initialColaboradores.length > 0) {
      setColaboradores(initialColaboradores);
    }
  }, [initialColaboradores]);

  // Handle initial filters from URL
  useEffect(() => {
    if (initialFilter && colaboradores.length > 0) {
      const { processoId, dept, role } = initialFilter;

      if (processoId) {
        const found = colaboradores.find(
          (c) =>
            c.numeroProcesso === processoId ||
            (c.id && c.id.toLowerCase() === processoId.toLowerCase()),
        );
        if (found) {
          setSelectedColaborador(found);
          setView("detalhes");
          return;
        }
      }

      if (dept || role) {
        setSearchTerm(dept || role || "");
        setView("lista");
      }
    }
  }, [initialFilter, colaboradores.length]);
  const isBossGlobally =
    user?.cargoChefia &&
    user?.cargoChefia !== "Nenhum" &&
    user?.estadoMandato !== "Cessado";
  const isHRBossGlobally =
    isBossGlobally &&
    ((user?.reparticao || "").toLowerCase().includes("pessoal") ||
      (user?.reparticao || "").toLowerCase().includes("recursos humanos") ||
      (user?.departamento || "").toLowerCase().includes("recursos humanos") ||
      (user?.direcao || "").toLowerCase().includes("recursos humanos") ||
      (user?.cargoChefia || "").toLowerCase().includes("rh") ||
      (user?.title || "").toLowerCase().includes("rh") ||
      (user?.title || "").toLowerCase().includes("repartição de pessoal") ||
      (user?.reparticao || "")
        .toLowerCase()
        .includes("repartição de pessoal") ||
      (user?.cargoChefia || "")
        .toLowerCase()
        .includes("chefe de repartição de pessoal"));

  const roles = getRoles(user?.title || user?.cargo || user?.cargoChefia || "");
  const canSeeSalaries = 
    isSuperBossUser(user) || 
    roles.isDG || 
    (user?.title || user?.cargo || user?.cargoChefia || "").toUpperCase().includes("DAF") ||
    ((user?.title || user?.cargo || user?.cargoChefia || "").toUpperCase().includes("DICOSAFA") && roles.isBoss);

  const hasGeneralEfetivoAccess =
    isSuperBossUser(user) || roles.isDG || isHRBossGlobally;
  const hasAllAccess = hasGeneralEfetivoAccess;
  const canRegister =
    isSuperBossUser(user) ||
    isHRBossGlobally ||
    hasGeneralEfetivoAccess ||
    roles.isBoss ||
    !!user;

  const [assiduidade, setAssiduidade] = useState<any[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive?: boolean;
    confirmText?: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    isDestructive = false,
    confirmText = "Confirmar",
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        onConfirm();
      },
      isDestructive,
      confirmText,
    });
  };
  const [formKey, setFormKey] = useState(0);
  const [feedback, setFeedback] = useState<"success" | "error" | null>(null);
  const [isImportingChefia, setIsImportingChefia] = useState(false);
  const [selectedForChefia, setSelectedForChefia] = useState<string[]>([]);

  useEffect(() => {
    const unsub = firestoreService.assiduidade.subscribe(setAssiduidade);
    return () => unsub();
  }, []);

  const [matrixActivities, setMatrixActivities] = useState<any[]>([]);

  useEffect(() => {
    const unsub =
      firestoreService.matrixActivities.subscribe(setMatrixActivities);
    return () => unsub();
  }, []);

  const withLastUpdate = (colab: any) => {
    const timestamp = new Date().toISOString();
    const userName = user?.nome || user?.email || user?.name || "Sistema";
    // O utilizador solicitou que dados de chefia (Pessoal, RH, Admin) sejam persistidos e não sobrescritos
    const isBossUpdating = !!isHRBossGlobally || isSuperBossUser(user);

    return {
      ...colab,
      lastUpdate: {
        date: timestamp,
        user: userName,
        isHRBoss: !!isHRBossGlobally,
        isSuperBoss: isSuperBossUser(user),
      },
      updatedAt: timestamp,
      updatedBy: userName,
      updatedByBoss: isBossUpdating, // Sinalizador explícito para mergeColaboradores
      validadoPorRH: colab.validadoPorRH || !!isHRBossGlobally,
      confiavel: colab.confiavel || !!isHRBossGlobally,
    };
  };

  const hasAdminAccess = canRegister;

  const baseSideItems: any[] = [
    { id: "visao_geral", title: "Visão Geral", icon: LayoutGrid },
    {
      id: "plano",
      title: "Plano",
      icon: ClipboardList,
    },
    { id: "acao_orcamental", title: "Ação Orçamental", icon: Calculator },
    { id: "calendario", title: "Calendário", icon: Calendar },
    { id: "caixa_mensagens", title: "Caixa de Mensagens", icon: MessageSquare },
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
    { id: "balanco", title: "Balanço", icon: PieChart },
    { id: "atribuir_actividade", title: "Atribuir Actividade", icon: CheckSquare },
    ...(canSeeSalaries ? [{
      id: "remuneracoes",
      title: "Remunerações",
      icon: Banknote,
      subItems: [
        {
          id: "rem_header_quadro",
          isHeader: true,
          title: "Salário de pessoal quadro:",
        },
        {
          id: "rem_quadro_docente",
          title: "Salário de Corpo docente",
        },
        {
          id: "rem_quadro_cta",
          title: "Salário de CTA",
        },
        {
          id: "rem_header_nao_quadro",
          isHeader: true,
          title: "Salário de pessoal não quadro:",
        },
        {
          id: "rem_nao_quadro_docente",
          title: "Salário de Corpo docente",
        },
        {
          id: "rem_nao_quadro_cta",
          title: "Salário de CTA",
        },
      ],
    }] : []),
    {
      id: "gestao_pessoal",
      title: "Gestão de Pessoal",
      icon: Users,
      subItems: [
        { id: "efetivo_geral", title: "Efetivo Geral", filter: null },
        { id: "processo_form", title: "Novo Processo" },
        ...(canSeeSalaries ? [{ id: "remuneracoes", title: "Remunerações" }] : []),
        {
          id: "docente_todos",
          title: "Docentes (Todos)",
          filter: { tipo: "Docente" },
        },
        {
          id: "docente_quadro",
          title: "Docentes (Efetivo)",
          filter: { tipo: "Docente", efetivo: true },
        },
        {
          id: "docente_fora",
          title: "Docentes (Não Efetivo)",
          filter: { tipo: "Docente", efetivo: false },
        },
        { id: "cta_todos", title: "CTA (Todos)", filter: { tipo: "CTA" } },
        {
          id: "cta_quadro",
          title: "CTA (Efetivo)",
          filter: { tipo: "CTA", efetivo: true },
        },
        {
          id: "cta_fora",
          title: "CTA (Não Efetivo)",
          filter: { tipo: "CTA", efetivo: false },
        },
        {
          id: "gestao_processo_individual",
          title: "Gestão de Processos Individuais",
        },
        { id: "afetacao", title: "Gestão de Afetação" },
        {
          id: "chefia",
          title: "Colaboradores com cargo de chefia",
          filter: { chefia: true },
        },
      ],
    },
  ];

  const sideItems = baseSideItems;

  const [expandedMenus, setExpandedMenus] = useState<string[]>([
    "gestao_pessoal",
    "remuneracoes",
  ]);

  const toggleMenu = (id: string) => {
    setExpandedMenus((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

  const pushView = (nextView: typeof view) => {
    setHistory((prev) => [...prev, nextView]);
    setView(nextView);
  };

  const popView = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      setView(newHistory[newHistory.length - 1]);
    } else {
      onBack();
    }
  };

  const navigateTo = (itemId: string) => {
    // Find item if it's a subitem
    let foundSub: any = null;
    sideItems.forEach((item) => {
      if (item.subItems) {
        const sub = item.subItems.find((s: any) => s.id === itemId);
        if (sub) foundSub = sub;
      }
    });

    if (foundSub && "filter" in foundSub) {
      setSearchTerm("");
      setFiltro(foundSub.filter);
      pushView("lista");
      return;
    }

    // Reset filter for other views if needed, or specifically for 'lista'
    if (itemId === "nao_afetados") {
      setInitialAfetacaoState({
        level: "direction",
        directionName: "Não Afetados",
      });
      pushView("afetacao");
      return;
    }

    if (itemId === "afetacao") {
      setInitialAfetacaoState(undefined);
      pushView("afetacao");
      return;
    }

    if (
      itemId === "remuneracoes" ||
      itemId === "rem_quadro_docente" ||
      itemId === "rem_quadro_cta" ||
      itemId === "rem_nao_quadro_docente" ||
      itemId === "rem_nao_quadro_cta"
    ) {
      setSearchTerm("");
      setFiltro(null);
      setRemuneracoesCategory(itemId === "remuneracoes" ? "todos" : itemId);
      pushView("remuneracoes");
      return;
    }

    if (itemId === "gestao_processo_individual") {
      setSearchTerm("");
      setFiltro(null);
      pushView("gestao_processo");
      return;
    }

    if (
      itemId === "lista" ||
      itemId === "efetivo_geral" ||
      itemId === "docente_todos" ||
      itemId === "docente_quadro" ||
      itemId === "docente_fora" ||
      itemId === "cta_todos" ||
      itemId === "cta_quadro" ||
      itemId === "cta_fora"
    ) {
      // These are handled by foundSub above if they have filters.
      // If 'lista' is clicked directly (if it were in the menu) it would come here.
      setSearchTerm("");
      setFiltro(null);
      pushView("lista");
    } else if (itemId === "acao_orcamental") {
      setSearchTerm("");
      setFiltro(null);
      pushView("acao_orcamental");
    } else if (itemId === "balanco") {
      setSearchTerm("");
      setFiltro(null);
      pushView("balanco");
    } else if (itemId === "atribuir_actividade") {
      setSearchTerm("");
      setFiltro(null);
      pushView("plano");
    } else if (
      itemId === "estatistica_reparticao" ||
      itemId === "estatistica_menu_item"
    ) {
      setSearchTerm("");
      setFiltro(null);
      pushView("estatistica_reparticao");
    } else if (itemId === "gestao_pessoal" || itemId === "visao_geral") {
      setSearchTerm("");
      setFiltro(null);
      pushView("menu");
    } else if (itemId === "conformidade") {
      setSearchTerm("");
      setFiltro(null);
      pushView("conformidade");
    } else {
      setSearchTerm("");
      setFiltro(null);
      pushView(itemId as any);
    }
  };

  useEffect(() => {
    if (colaboradores.length > 0) {
      if (canRegister) {
        // Removida a eliminação automática em segundo plano para garantir que NENHUM dado inserido pelo utilizador seja apagado automaticamente pelo sistema.
        // As ações de remoção/mesclagem devem ser executadas exclusivamente de forma manual pelo utilizador/administrador.
      }
    }
  }, [colaboradores, canRegister]);

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 200;

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    let sourceData = [];
    if (initialColaboradores && initialColaboradores.length > 0) {
      sourceData = initialColaboradores.map((c) => ({
        ...c,
        unidade: c.unidade,
      }));
    } else {
      sourceData = mergeColaboradores([]);
    }

    if (hasAllAccess || !user) {
      setColaboradores(sourceData);
    } else {
      const userDir = (user.direcao || "").trim().toLowerCase();
      const userDept = (user.departamento || "").trim().toLowerCase();
      const userSect = (user.reparticao || user.setor || user.sector || "")
        .trim()
        .toLowerCase();

      const filtered = sourceData.filter((c) => {
        const cDir = (c.direcao || "").trim().toLowerCase();
        const cDept = (c.departamento || "").trim().toLowerCase();
        const cSect = (c.reparticao || c.setor || c.sector || "")
          .trim()
          .toLowerCase();

        // Se for Diretor Central (DC): vê todos os colaboradores da sua Direção
        if (roles.isDC) {
          return (
            cDir === userDir || cDir.includes(userDir) || userDir.includes(cDir)
          );
        }
        // Se for Chefe de Departamento (CD): vê todos os colaboradores do seu Departamento
        if (roles.isCD) {
          return (
            cDept === userDept ||
            cDept.includes(userDept) ||
            userDept.includes(cDept)
          );
        }
        // Se for Chefe de Repartição / Departamento (CR): vê todos os colaboradores da sua Repartição/Departamento
        if (roles.isCR) {
          return (
            cSect === userSect ||
            cSect.includes(userSect) ||
            userSect.includes(cSect)
          );
        }

        // Utilizador comum ou outro chefe: vê apenas o seu próprio setor/repartição/direção como fallback
        if (userSect) {
          return (
            cSect === userSect ||
            cSect.includes(userSect) ||
            userSect.includes(cSect)
          );
        }
        if (userDept) {
          return (
            cDept === userDept ||
            cDept.includes(userDept) ||
            userDept.includes(cDept)
          );
        }
        if (userDir) {
          return (
            cDir === userDir || cDir.includes(userDir) || userDir.includes(cDir)
          );
        }
        return false;
      });
      setColaboradores(filtered);
    }
  }, [
    initialColaboradores,
    hasAllAccess,
    user,
    roles.isDC,
    roles.isCD,
    roles.isCR,
  ]);

  const [processos, setProcessos] = useState<any[]>(initialProcessos || []);

  // Sync processos when props change (real-time updates)
  useEffect(() => {
    if (initialProcessos && initialProcessos.length > 0) {
      setProcessos(initialProcessos);
    }
  }, [initialProcessos]);

  useEffect(() => {
    const runDeduplication = async () => {
      if (!initialProcessos || initialProcessos.length === 0) {
        if (processos.length === 0) setProcessos([]);
        return;
      }

      const uniqueIds = new Set();
      const duplicatesToDelete: any[] = [];
      const seenNames = new Set<string>();
      const seenNuits = new Set<string>();
      const seenBis = new Set<string>();

      // Sort by date so older is kept
      const sorted = [...initialProcessos].sort((a, b) => {
        const dateA = a.dataSubmissao ? new Date(a.dataSubmissao).getTime() : 0;
        const dateB = b.dataSubmissao ? new Date(b.dataSubmissao).getTime() : 0;
        return dateA - dateB;
      });

      for (const p of sorted) {
        const nameKey = p.nome?.trim().toLowerCase();
        const nuitKey = p.nuit ? String(p.nuit).trim() : null;
        const biKey =
          p.biNo || p.numeroBI
            ? String(p.biNo || p.numeroBI)
                .trim()
                .toLowerCase()
            : null;

        const isDuplicateName = nameKey && seenNames.has(nameKey);
        // Exclude generic NUITs like '---' or '0'
        const isDuplicateNuit =
          nuitKey &&
          nuitKey !== "---" &&
          nuitKey !== "0" &&
          seenNuits.has(nuitKey);
        const isDuplicateBi =
          biKey && biKey !== "---" && biKey !== "0" && seenBis.has(biKey);

        if (isDuplicateName || isDuplicateNuit || isDuplicateBi) {
          duplicatesToDelete.push(p.id);
        } else {
          uniqueIds.add(p.id);
          if (nameKey) seenNames.add(nameKey);
          if (nuitKey) seenNuits.add(nuitKey);
          if (biKey) seenBis.add(biKey);
        }
      }

      if (duplicatesToDelete.length > 0) {
        console.log("Removendo processos duplicados...", duplicatesToDelete);
        for (const id of duplicatesToDelete) {
          try {
            if (id) await firestoreService.processos.delete(id);
          } catch (e) {
            console.error("Erro ao remover duplicado: ", e);
          }
        }
        // Initial set to unique only
        setProcessos(sorted.filter((p) => !duplicatesToDelete.includes(p.id)));
      } else {
        setProcessos(initialProcessos);
      }
    };

    runDeduplication();
  }, [initialProcessos]);

  // Sync selected colaborador with live data
  useEffect(() => {
    if (selectedColaborador) {
      const live = colaboradores.find((c) => c.id === selectedColaborador.id);
      if (live) setSelectedColaborador(live);
    }
  }, [colaboradores, selectedColaborador?.id]);

  useEffect(() => {
    if (
      !originalId &&
      view === "actualizar" &&
      (selectedColaborador?.nome || selectedColaborador?.nuit)
    ) {
      const generatedId = generateCollaboratorId(
        selectedColaborador?.nome || "",
        selectedColaborador?.nuit || ""
      );
      if (generatedId && generatedId !== selectedColaborador?.numeroProcesso) {
        setSelectedColaborador((prev) =>
          prev ? { ...prev, numeroProcesso: generatedId, id: generatedId } : prev
        );
      }
    }
  }, [selectedColaborador?.nome, selectedColaborador?.nuit, view, originalId]);

  const isColaboradorInactive = (estado?: string) => {
    if (!estado) return false;
    const e = estado.trim().toLowerCase();
    return [
      "falecido",
      "transferido",
      "reformado",
      "inativo",
      "aposentado",
      "licença",
      "licenca",
      "eliminado",
    ].includes(e);
  };

  const statsMetrics = {
    docenteTodos: colaboradores.filter((c) => {
      const isSystemAdmin = checkIsSystemAdmin(c);
      if (isSystemAdmin) return false; // Excluir admin do efetivo
      return (
        (c.tipo || "").toLowerCase() !== "cta" &&
        !isColaboradorInactive(c.estado)
      );
    }).length,
    docenteQuadro: colaboradores.filter((c) => {
      const isSystemAdmin = checkIsSystemAdmin(c);
      if (isSystemAdmin) return false;
      return (
        (c.tipo || "").toLowerCase() !== "cta" &&
        checkIsQuadro(c) === true &&
        !isColaboradorInactive(c.estado)
      );
    }).length,
    docenteNaoQuadro: colaboradores.filter((c) => {
      const isSystemAdmin = checkIsSystemAdmin(c);
      if (isSystemAdmin) return false;
      return (
        (c.tipo || "").toLowerCase() !== "cta" &&
        checkIsQuadro(c) === false &&
        !isColaboradorInactive(c.estado)
      );
    }).length,
    ctaTodos: colaboradores.filter((c) => {
      const isSystemAdmin = checkIsSystemAdmin(c);
      if (isSystemAdmin) return false;
      return (
        (c.tipo || "").toLowerCase() === "cta" &&
        !isColaboradorInactive(c.estado)
      );
    }).length,
    ctaQuadro: colaboradores.filter((c) => {
      const isSystemAdmin = checkIsSystemAdmin(c);
      if (isSystemAdmin) return false;
      return (
        (c.tipo || "").toLowerCase() === "cta" &&
        checkIsQuadro(c) === true &&
        !isColaboradorInactive(c.estado)
      );
    }).length,
    ctaNaoQuadro: colaboradores.filter((c) => {
      const isSystemAdmin = checkIsSystemAdmin(c);
      if (isSystemAdmin) return false;
      return (
        (c.tipo || "").toLowerCase() === "cta" &&
        checkIsQuadro(c) === false &&
        !isColaboradorInactive(c.estado)
      );
    }).length,
    foraInstituicao: colaboradores.filter((c) => isColaboradorInactive(c.estado))
      .length,
    transferidos: colaboradores.filter((c) => c.estado === "Transferido")
      .length,
    falecidos: colaboradores.filter((c) => c.estado === "Falecido").length,
    reformados: colaboradores.filter((c) => c.estado === "Reformado").length,
    chefia: colaboradores.filter(
      (c) => hasChefiaPosition(c) && !isColaboradorInactive(c.estado)
    ).length,
    adminConta: colaboradores.filter(
      (c) =>
        c.cargoChefia === "Proprietário do sistema" ||
        c.cargoChefia === "Administrador de sistema" ||
        c.categoria?.toLowerCase().includes("proprietario"),
    ).length,
    emFormacao: colaboradores.filter((c) => (c.estado as string) === "Em Formação").length,
  };

  const getGenderMetrics = (list: any[]) => {
    let H = 0;
    let M = 0;
    list.forEach((c) => {
      const g = (c.genero || "M").toString().toUpperCase().trim();
      if (g.startsWith("F")) {
        M++;
      } else {
        H++;
      }
    });
    return { H, M, total: list.length };
  };

  const docenteQuadroList = useMemo(
    () =>
      colaboradores.filter(
        (c) =>
          !checkIsSystemAdmin(c) &&
          (c.tipo || "").toLowerCase() !== "cta" &&
          checkIsQuadro(c) === true &&
          !isColaboradorInactive(c.estado),
      ),
    [colaboradores],
  );
  const docenteNaoQuadroList = useMemo(
    () =>
      colaboradores.filter(
        (c) =>
          !checkIsSystemAdmin(c) &&
          (c.tipo || "").toLowerCase() !== "cta" &&
          checkIsQuadro(c) === false &&
          !isColaboradorInactive(c.estado),
      ),
    [colaboradores],
  );
  const ctaQuadroList = useMemo(
    () =>
      colaboradores.filter(
        (c) =>
          !checkIsSystemAdmin(c) &&
          (c.tipo || "").toLowerCase() === "cta" &&
          checkIsQuadro(c) === true &&
          !isColaboradorInactive(c.estado),
      ),
    [colaboradores],
  );
  const ctaNaoQuadroList = useMemo(
    () =>
      colaboradores.filter(
        (c) =>
          !checkIsSystemAdmin(c) &&
          (c.tipo || "").toLowerCase() === "cta" &&
          checkIsQuadro(c) === false &&
          !isColaboradorInactive(c.estado),
      ),
    [colaboradores],
  );
  const foraInstituicaoList = useMemo(
    () => colaboradores.filter((c) => isColaboradorInactive(c.estado)),
    [colaboradores],
  );

  const chefiaDocentesList = useMemo(
    () =>
      colaboradores.filter(
        (c) =>
          hasChefiaPosition(c) &&
          (c.tipo || "").toLowerCase() !== "cta" &&
          !isColaboradorInactive(c.estado),
      ),
    [colaboradores],
  );
  const chefiaCTAList = useMemo(
    () =>
      colaboradores.filter(
        (c) =>
          hasChefiaPosition(c) &&
          (c.tipo || "").toLowerCase() === "cta" &&
          !isColaboradorInactive(c.estado),
      ),
    [colaboradores],
  );

  const docenteQuadroStats = useMemo(
    () => getGenderMetrics(docenteQuadroList),
    [docenteQuadroList],
  );
  const docenteNaoQuadroStats = useMemo(
    () => getGenderMetrics(docenteNaoQuadroList),
    [docenteNaoQuadroList],
  );
  const ctaQuadroStats = useMemo(
    () => getGenderMetrics(ctaQuadroList),
    [ctaQuadroList],
  );
  const ctaNaoQuadroStats = useMemo(
    () => getGenderMetrics(ctaNaoQuadroList),
    [ctaNaoQuadroList],
  );
  const foraInstituicaoStats = useMemo(
    () => getGenderMetrics(foraInstituicaoList),
    [foraInstituicaoList],
  );

  const chefiaDocenteStats = useMemo(
    () => getGenderMetrics(chefiaDocentesList),
    [chefiaDocentesList],
  );
  const chefiaCTAStats = useMemo(
    () => getGenderMetrics(chefiaCTAList),
    [chefiaCTAList],
  );

  const duplicates = useMemo(() => {
    const nuitCounts: Record<string, number> = {};
    const biCounts: Record<string, number> = {};
    const emailCounts: Record<string, number> = {};

    colaboradores.forEach((c) => {
      const isSystemAdmin = checkIsSystemAdmin(c);

      if (!isSystemAdmin) {
        if (c.nuit && c.nuit.trim() !== "" && c.nuit !== "---")
          nuitCounts[c.nuit] = (nuitCounts[c.nuit] || 0) + 1;
        if (c.numeroBI && c.numeroBI.trim() !== "" && c.numeroBI !== "---")
          biCounts[c.numeroBI] = (biCounts[c.numeroBI] || 0) + 1;
        if (c.email && c.email.trim() !== "" && c.email !== "---")
          emailCounts[c.email] = (emailCounts[c.email] || 0) + 1;
      }
    });

    const duplicatedIds = new Set<string>();

    colaboradores.forEach((c) => {
      const isSystemAdmin = checkIsSystemAdmin(c);

      if (!isSystemAdmin) {
        let isDuplicated = false;
        if (c.nuit && nuitCounts[c.nuit] > 1) isDuplicated = true;
        if (c.numeroBI && biCounts[c.numeroBI] > 1) isDuplicated = true;
        if (c.email && emailCounts[c.email] > 1) isDuplicated = true;

        if (isDuplicated) {
          duplicatedIds.add(c.id);
        }
      }
    });

    return { ids: duplicatedIds, count: duplicatedIds.size };
  }, [colaboradores]);

  const [showMissingDataOnly, setShowMissingDataOnly] = useState(false);
  const missingDataColaboradores = colaboradores.filter(
    (c) => !c.nuit || !c.numeroBI,
  );

  const isFiltroChefiaActive = !!(filtro?.chefia || filtro?.chefiaDocente || filtro?.chefiaCTA);

  const filteredList = colaboradores
    .filter((c) => {
      if (showMissingDataOnly && c.nuit && c.numeroBI && c.nome) return false;
      const matchesSearch =
        (c.nome || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.nuit || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.cargoChefia || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (c.cargo || "").toLowerCase().includes(searchTerm.toLowerCase());
      if (!filtro) return matchesSearch && !isColaboradorInactive(c.estado);

      if (filtro.chefia) {
        return (
          matchesSearch &&
          hasChefiaPosition(c) &&
          !isColaboradorInactive(c.estado)
        );
      }

      if (filtro.chefiaDocente) {
        return (
          matchesSearch &&
          hasChefiaPosition(c) &&
          (c.tipo || "").toLowerCase() !== "cta" &&
          !isColaboradorInactive(c.estado)
        );
      }

      if (filtro.chefiaCTA) {
        return (
          matchesSearch &&
          hasChefiaPosition(c) &&
          (c.tipo || "").toLowerCase() === "cta" &&
          !isColaboradorInactive(c.estado)
        );
      }

      const isCta = (c.tipo || "").toLowerCase() === "cta";
      const matchesTipo = filtro.tipo
        ? filtro.tipo === "CTA"
          ? isCta
          : !isCta
        : true;
      const matchesEfetivo =
        filtro.efetivo !== undefined
          ? checkIsQuadro(c) === filtro.efetivo
          : true;
      const matchesForaInstituicao = filtro.foraInstituicao
        ? isColaboradorInactive(c.estado)
        : !isColaboradorInactive(c.estado);
      const matchesEstadoForaInstituicao = filtro.estadoForaInstituicao
        ? c.estado === filtro.estadoForaInstituicao
        : true;

      const matchesDir = filtro.direcao
        ? (c.direcao || "").toLowerCase().includes(filtro.direcao.toLowerCase()) ||
          (c.unidade || "").toLowerCase().includes(filtro.direcao.toLowerCase())
        : true;
      const matchesDept = filtro.departamento
        ? (c.departamento || "").toLowerCase().includes(filtro.departamento.toLowerCase())
        : true;

      return (
        matchesSearch &&
        matchesTipo &&
        matchesEfetivo &&
        matchesForaInstituicao &&
        matchesEstadoForaInstituicao &&
        matchesDir &&
        matchesDept
      );
    })
    .sort((a, b) => {
      if (isSortedAZ) {
        return (a.nome || "").localeCompare(b.nome || "", "pt", {
          sensitivity: "base",
        });
      }
      const seqA = extractProcessSequence(
        a.processoNo || a.numeroProcesso || a.id,
      );
      const seqB = extractProcessSequence(
        b.processoNo || b.numeroProcesso || b.id,
      );
      if (seqA !== seqB) {
        return seqA - seqB;
      }
      if ((a.ord || 0) !== (b.ord || 0)) {
        return (a.ord || 0) - (b.ord || 0);
      }
      return (a.nome || "").localeCompare(b.nome || "", "pt", {
        sensitivity: "base",
      });
    });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedColaborador) {
      setIsProcessing(true);

      const c: any = selectedColaborador;
      if (c.nome) c.nome = toTitleCase(c.nome);
      if (c.naturalidade?.pais)
        c.naturalidade.pais = toTitleCase(c.naturalidade.pais);
      if (c.naturalidade?.provincia)
        c.naturalidade.provincia = toTitleCase(c.naturalidade.provincia);
      if (c.naturalidade?.distrito)
        c.naturalidade.distrito = toTitleCase(c.naturalidade.distrito);
      if (c.nivelAcademico) c.nivelAcademico = toTitleCase(c.nivelAcademico);
      if (c.areaFormacao) c.areaFormacao = toTitleCase(c.areaFormacao);
      if (c.categoria) c.categoria = toTitleCase(c.categoria);
      if (c.vinculoContractual)
        c.vinculoContractual = toTitleCase(c.vinculoContractual);
      if (c.funcao) c.funcao = toTitleCase(c.funcao);
      if (c.cargoChefia) c.cargoChefia = toTitleCase(c.cargoChefia);
      if (c.unidade) c.unidade = toTitleCase(c.unidade);
      if (c.direcao) c.direcao = toTitleCase(c.direcao);
      if (c.departamento) c.departamento = toTitleCase(c.departamento);
      if (c.reparticao) c.reparticao = toTitleCase(c.reparticao);
      if (c.sector) c.sector = toTitleCase(c.sector);
      if (c.curso) c.curso = toTitleCase(c.curso);
      if (c.estado) c.estado = toTitleCase(c.estado);
      if (c.estadoMandato) c.estadoMandato = toTitleCase(c.estadoMandato);

      const cleanChefiaVal = (c.cargoChefia || c.cargo || "").trim();
      const isNoneChefiaVal =
        !cleanChefiaVal ||
        cleanChefiaVal === "Nenhum" ||
        cleanChefiaVal === "nenhum" ||
        cleanChefiaVal.toLowerCase().includes("nenhum") ||
        cleanChefiaVal === "-" ||
        cleanChefiaVal === "Sem Cargo";
      if (
        isNoneChefiaVal ||
        (c.estadoMandato &&
          (c.estadoMandato.toLowerCase() === "cessado" ||
            c.estadoMandato.toLowerCase() === "despromovido"))
      ) {
        selectedColaborador.cargoChefia = "Nenhum";
        selectedColaborador.estadoMandato = "Cessado";
        selectedColaborador.isChefia = false;
      } else {
        selectedColaborador.cargoChefia = cleanChefiaVal;
        selectedColaborador.estadoMandato = "Em Atividade";
        selectedColaborador.isChefia = true;
      }

      const resolvedTipo = classifyTipo(selectedColaborador);
      selectedColaborador.tipo = resolvedTipo as any;
      selectedColaborador.carreira = resolvedTipo;

      const { id, ...updateData } = selectedColaborador;

      let safeId = selectedColaborador.numeroProcesso || id;
      const isNew =
        !originalId || !colaboradores.some((c) => c.id === originalId);

      if (isNew && !selectedColaborador.numeroProcesso) {
        safeId = generateCollaboratorId(
          selectedColaborador.nome || "",
          selectedColaborador.nuit || "",
        );
      }

      // Ensure numeroProcesso is set
      selectedColaborador.numeroProcesso = safeId;
      selectedColaborador.id = safeId;

      try {
        const fullUpdate = withLastUpdate(updateData);
        if (isNew) {
          // If it's a new record, use set with the generated ID
          await firestoreService.colaboradores.update(safeId, fullUpdate);
        } else {
          // If ID changed, delete old one and migrate associated process
          if (originalId && safeId !== originalId) {
            const oldProcess = processos.find((p) => p.id === originalId);
            const migrationPromises: Promise<any>[] = [
              firestoreService.colaboradores.delete(originalId as string),
              firestoreService.colaboradores.update(safeId, fullUpdate),
            ];

            if (oldProcess) {
              const updatedIndividualData = {
                ...(oldProcess.individualData || {}),
                nome: selectedColaborador.nome || "",
                nuit: selectedColaborador.nuit || "",
                seccao: selectedColaborador.seccao || "",
                email: selectedColaborador.email || "",
                unidade: selectedColaborador.unidade || "",
                direcao: selectedColaborador.direcao || "",
                departamento: selectedColaborador.departamento || "",
                reparticao: selectedColaborador.reparticao || "",
                curso: selectedColaborador.curso || "",
                categoria: selectedColaborador.categoria || "",
                cargo: selectedColaborador.cargo || "",
                nivelAcademico: selectedColaborador.nivelAcademico || "",
                areaFormacao: selectedColaborador.areaFormacao || "",
                telefone: selectedColaborador.telefone || "",
                morada: selectedColaborador.morada || "",
                filiacaoMae: selectedColaborador.filiacaoMae || "",
                totalFilhos: selectedColaborador.numFilhos || 0,
                habilitacoesLiterarias:
                  selectedColaborador.nivelAcademico || "",
                habilitacoesProfissionais:
                  selectedColaborador.areaFormacao || "",
                tipoRelacaoContractual:
                  selectedColaborador.tipoContrato ||
                  selectedColaborador.tipoRelacaoContractual ||
                  "",
                updatedByBoss: fullUpdate.updatedByBoss,
              };

              const updatedProcess = {
                ...oldProcess,
                id: safeId,
                numeroProcesso: safeId,
                processoNo: safeId,
                nome: selectedColaborador.nome,
                nuit: selectedColaborador.nuit || "---",
                seccao: selectedColaborador.seccao || "",
                individualData: updatedIndividualData,
                updatedByBoss: fullUpdate.updatedByBoss,
              };

              migrationPromises.push(
                firestoreService.processos.delete(originalId as string),
              );
              migrationPromises.push(
                firestoreService.processos.update(safeId, updatedProcess),
              );

              setProcessos((prev) =>
                prev.map((p) => (p.id === originalId ? updatedProcess : p)),
              );
            }

            await Promise.all(migrationPromises);
          } else {
            await firestoreService.colaboradores.update(safeId, fullUpdate);
            const oldProcess = processos.find((p) => p.id === safeId);
            if (oldProcess) {
              const updatedIndividualData = {
                ...(oldProcess.individualData || {}),
                nome: selectedColaborador.nome || "",
                nuit: selectedColaborador.nuit || "",
                seccao: selectedColaborador.seccao || "",
                email: selectedColaborador.email || "",
                unidade: selectedColaborador.unidade || "",
                direcao: selectedColaborador.direcao || "",
                departamento: selectedColaborador.departamento || "",
                reparticao: selectedColaborador.reparticao || "",
                curso: selectedColaborador.curso || "",
                categoria: selectedColaborador.categoria || "",
                cargo: selectedColaborador.cargo || "",
                nivelAcademico: selectedColaborador.nivelAcademico || "",
                areaFormacao: selectedColaborador.areaFormacao || "",
                telefone: selectedColaborador.telefone || "",
                morada: selectedColaborador.morada || "",
                filiacaoMae: selectedColaborador.filiacaoMae || "",
                totalFilhos: selectedColaborador.numFilhos || 0,
                habilitacoesLiterarias:
                  selectedColaborador.nivelAcademico || "",
                habilitacoesProfissionais:
                  selectedColaborador.areaFormacao || "",
                tipoRelacaoContractual:
                  selectedColaborador.tipoContrato ||
                  selectedColaborador.tipoRelacaoContractual ||
                  "",
                updatedByBoss: fullUpdate.updatedByBoss,
              };

              const updatedProcess = {
                ...oldProcess,
                nome: selectedColaborador.nome,
                nuit: selectedColaborador.nuit || "---",
                seccao: selectedColaborador.seccao || "",
                individualData: updatedIndividualData,
                updatedByBoss: fullUpdate.updatedByBoss,
              };

              await firestoreService.processos.update(safeId, updatedProcess);
              setProcessos((prev) =>
                prev.map((p) => (p.id === safeId ? updatedProcess : p)),
              );
            }
          }
        }
        setFeedback("success");
        const finalColaborador = {
          ...selectedColaborador,
          ...fullUpdate,
          id: safeId,
        };

        if (hasChefiaPosition(finalColaborador)) {
          try {
            await firestoreService.colaboradoresChefia.set(safeId, {
              ...finalColaborador,
              collabId: safeId,
              updatedAt: new Date().toISOString(),
              fonte: "Direct Update Sync",
            });
          } catch (chefiaErr) {
            console.error("Erro ao sincronizar chefia:", chefiaErr);
          }
        } else {
          try {
            await firestoreService.colaboradoresChefia.delete(safeId);
            if (originalId && originalId !== safeId) {
              await firestoreService.colaboradoresChefia.delete(
                originalId as string,
              );
            }
          } catch (delErr) {
            // Ignore if not present
          }
        }

        setSelectedColaborador(finalColaborador);
        setColaboradores((prev) => {
          let list = prev;
          if (originalId && originalId !== safeId) {
            list = list.filter((col) => col.id !== originalId);
          }
          const exists = list.some((col) => col.id === safeId);
          if (exists) {
            return list.map((col) =>
              col.id === safeId ? { ...col, ...fullUpdate, id: safeId } : col,
            );
          } else {
            return [finalColaborador, ...list];
          }
        });

        setTimeout(() => {
          setFeedback(null);
          popView();
          setIsProcessing(false);
        }, 1000);
      } catch (err) {
        console.error(err);
        setFeedback("error");
        setTimeout(() => setFeedback(null), 2000);
        setIsProcessing(false);
      }
    }
  };

  const handleAlocar = async (unidade: string) => {
    if (selectedColaborador) {
      setIsProcessing(true);
      const safeId = selectedColaborador.id || `novo-${Date.now()}`;
      try {
        // Se a unidade mudou, limpamos os campos da sub-hierarquia para manter consistência
        const hasUnitChanged = selectedColaborador.unidade !== unidade;
        const baseObject = {
          ...selectedColaborador,
          id: safeId,
          unidade,
        };

        if (hasUnitChanged) {
          Object.assign(baseObject, {
            direcao: "",
            departamento: "",
            reparticao: "",
            sector: "",
            curso: "",
          });
        }

        const fullObject = withLastUpdate(baseObject);
        await firestoreService.colaboradores.update(safeId, fullObject);
        // Importante: Actualizar o estado local para garantir que a UI reflete a mudança imediatamente
        setColaboradores((prev) =>
          prev.map((col) => (col.id === safeId ? fullObject : col)),
        );
        setSelectedColaborador(fullObject);
        pushView("actualizar");
      } catch (err) {
        console.error(err);
        alert("Erro ao alocar colaborador.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleGuardarColaborador = async (c: Types.Colaborador) => {
    if (!canRegister) {
      alert(
        "Apenas o Administrador e o Chefe da Repartição de Pessoal podem realizar afetações.",
      );
      return;
    }

    const isDuplicate = colaboradores.some((existingCol) => {
      if (
        existingCol.id === c.id ||
        (originalId && existingCol.id === originalId) ||
        (c.numeroProcesso && existingCol.numeroProcesso === c.numeroProcesso)
      )
        return false;
      const isSystemAdmin =
        existingCol.cargoChefia === "Proprietário do sistema" ||
        existingCol.cargoChefia === "Administrador de sistema" ||
        existingCol.categoria?.toLowerCase().includes("proprietario") ||
        existingCol.id === "FTV108164611";
      if (isSystemAdmin) return false;

      const cleanCNuit = (c.nuit || "").trim();
      const cleanExNuit = (existingCol.nuit || "").trim();
      const sameNuit =
        cleanCNuit !== "" &&
        cleanCNuit !== "---" &&
        cleanExNuit !== "" &&
        cleanExNuit !== "---" &&
        cleanCNuit === cleanExNuit;

      const cleanCBI = (c.numeroBI || "").trim();
      const cleanExBI = (existingCol.numeroBI || "").trim();
      const sameBI =
        cleanCBI !== "" &&
        cleanCBI !== "---" &&
        cleanExBI !== "" &&
        cleanExBI !== "---" &&
        cleanCBI === cleanExBI;

      const cleanCEmail = (c.email || "").trim().toLowerCase();
      const cleanExEmail = (existingCol.email || "").trim().toLowerCase();
      const sameEmail =
        cleanCEmail !== "" &&
        cleanCEmail !== "---" &&
        cleanCEmail !== "sem.email@songo.ac.mz" &&
        cleanExEmail !== "" &&
        cleanExEmail !== "---" &&
        cleanExEmail !== "sem.email@songo.ac.mz" &&
        cleanCEmail === cleanExEmail;

      return sameNuit || sameBI || sameEmail;
    });

    if (isDuplicate) {
      alert(
        "Erro: Não é possível guardar. Foi detetado outro registo com o mesmo NUIT, Nº de B.I. ou E-mail.",
      );
      return;
    }

    if (c.carreira) {
      c.tipo = c.carreira as any;
    } else if (c.tipo) {
      c.carreira = c.tipo;
    }
    const fullUpdate = withLastUpdate(c) as Types.Colaborador;
    const oldColaborador = colaboradores.find((col) => col.id === c.id);
    // If collaborator is moving from CTA to Docente, reset assignment only if they are not already assigned
    if (
      oldColaborador &&
      oldColaborador.tipo === "CTA" &&
      c.tipo === "Docente" &&
      !c.direcao
    ) {
      fullUpdate.direcao = "";
      fullUpdate.departamento = "";
      fullUpdate.reparticao = "";
      fullUpdate.sector = "";
      fullUpdate.curso = "";
    }

    // Automating cargo de chefia
    const cleanChefia = (c.cargoChefia || "").trim();
    const isNoneChefia =
      !cleanChefia ||
      cleanChefia === "Nenhum" ||
      cleanChefia === "nenhum" ||
      cleanChefia.toLowerCase().includes("nenhum") ||
      cleanChefia === "-" ||
      cleanChefia === "Sem Cargo";

    if (
      isNoneChefia ||
      (c.estadoMandato &&
        (c.estadoMandato.toLowerCase() === "cessado" ||
          c.estadoMandato.toLowerCase() === "despromovido"))
    ) {
      fullUpdate.cargoChefia = "Nenhum";
      fullUpdate.estadoMandato = "Cessado";
      fullUpdate.isChefia = false;
    } else {
      fullUpdate.cargoChefia = cleanChefia;
      fullUpdate.estadoMandato = "Em Atividade";
      fullUpdate.isChefia = true;
    }

    // Auto-assignment details for chefia
    if (
      fullUpdate.cargoChefia &&
      fullUpdate.cargoChefia !== "Nenhum" &&
      fullUpdate.isChefia !== false &&
      (fullUpdate.estadoMandato || "").toLowerCase() === "em atividade"
    ) {
      const getAreaDeAfetacao = (cc: any): string => {
        if (
          cc.reparticao &&
          cc.reparticao !== "Nenhum" &&
          cc.reparticao !== "-"
        )
          return cc.reparticao;
        if (
          cc.departamento &&
          cc.departamento !== "Nenhum" &&
          cc.departamento !== "-"
        )
          return cc.departamento;
        if (cc.direcao && cc.direcao !== "Nenhum" && cc.direcao !== "-")
          return cc.direcao;
        return cc.unidade || "";
      };

      const area = getAreaDeAfetacao(fullUpdate);
      fullUpdate.status = "Afetado";
      (fullUpdate as any).areaDeAfetacao = area;
    }

    // Optimistic Update
    setColaboradores((prev) => {
      console.log(
        "Updating local state for collaborator:",
        c.id,
        "with data:",
        fullUpdate,
      );
      const exists = prev.some((col) => col.id === c.id);
      if (exists) {
        return prev.map((col) => (col.id === c.id ? fullUpdate : col));
      } else {
        return [fullUpdate, ...prev];
      }
    });
    setEditingId(null);
    setIsProcessing(true);

    try {
      console.log(`Updating collaborator ${c.id}:`, fullUpdate);
      await firestoreService.colaboradores.update(c.id, fullUpdate);

      // Update chefia collection or remove if no longer chefia
      if (
        fullUpdate.cargoChefia &&
        fullUpdate.cargoChefia !== "Nenhum" &&
        fullUpdate.isChefia !== false &&
        (fullUpdate.estadoMandato || "").toLowerCase() === "em atividade"
      ) {
        try {
          await firestoreService.colaboradoresChefia.set(c.id, {
            ...fullUpdate,
            collabId: c.id,
            updatedAt: new Date().toISOString(),
            fonte: "Direct Update Sync",
          });
        } catch (chefiaErr) {
          console.error("Erro ao sincronizar tabela de chefia:", chefiaErr);
        }
      } else {
        try {
          await firestoreService.colaboradoresChefia.delete(c.id);
        } catch (delErr) {
          // Ignore if not present
        }
      }

      // Auto-sync user account for every active colaborador (technicians, CTA, docentes, chefias)
      const statusRaw = String(
        fullUpdate.status ||
        (fullUpdate as any).situacao ||
        (fullUpdate as any).estado ||
        ""
      )
        .toLowerCase()
        .trim();
      const isCessado =
        statusRaw === "cessado" ||
        statusRaw === "inativo" ||
        (fullUpdate as any).cessado === true;

      if (!isCessado) {
        try {
          const dbUsers = (await firestoreService.users.get()) || [];
          const existingUser = dbUsers.find(
            (u: any) =>
              (u.collabId && u.collabId === c.id) ||
              (u.nuit &&
                fullUpdate.nuit &&
                String(u.nuit).trim() === String(fullUpdate.nuit).trim()) ||
              (u.email &&
                fullUpdate.email &&
                String(u.email).toLowerCase().trim() ===
                  String(fullUpdate.email).toLowerCase().trim()),
          );

          const area = (fullUpdate as any).areaDeAfetacao || "";
          const email = (
            fullUpdate.email ||
            `${String(fullUpdate.nome || "")
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/[^a-z0-9\s]/g, "")
              .trim()
              .split(/\s+/)
              .join(".")}@songo.ac.mz`
          )
            .toLowerCase()
            .trim();

          const userData: any = {
            collabId: c.id,
            name: fullUpdate.nome,
            email: email,
            nuit: fullUpdate.nuit,
            role: fullUpdate.tipo === "Docente" ? "Docente" : "CTA",
            unidade: fullUpdate.unidade || "",
            direcao: fullUpdate.direcao || "",
            departamento: fullUpdate.departamento || "",
            reparticao: fullUpdate.reparticao || "",
            setor: (fullUpdate as any).setor || "",
            setoresAtribuidos: fullUpdate.setoresAtribuidos || [],
            cargo: fullUpdate.cargo || "",
            cargoChefia: fullUpdate.cargoChefia || "",
            status: fullUpdate.status || "Ativo",
            areaDeAfetacao: area,
          };

          if (existingUser) {
            delete userData.password;
            await firestoreService.users.update(existingUser.id, userData);
          } else {
            userData.id = c.id;
            await firestoreService.users.set(c.id, {
              ...userData,
              password: "1234",
              mustChangePassword: true,
              nuit: fullUpdate.nuit,
            });
          }
        } catch (userErr) {
          console.error("Erro ao sincronizar conta de utilizador:", userErr);
        }
      }

      console.log(`Successfully updated collaborator ${c.id}`);
      setFeedback("success");
      setTimeout(() => setFeedback(null), 1000);
    } catch (err) {
      console.error(`Error updating collaborator ${c.id}:`, err);
      // Revert optimistic update
      setColaboradores((prev) =>
        prev.map((col) => (col.id === c.id ? oldColaborador || col : col)),
      );
      setFeedback("error");
      setTimeout(() => setFeedback(null), 2000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSyncChefiaAccounts = async () => {
    setIsProcessing(true);
    try {
      const result = await firestoreService.syncChefiaAccounts(colaboradores);

      // Re-trigger/refresh local state
      setColaboradores((prev) =>
        prev.map((col) => {
          const isChefia =
            col.cargoChefia &&
            col.cargoChefia !== "Nenhum" &&
            col.cargoChefia !== "-" &&
            (col.estadoMandato || "").toLowerCase() !== "cessado" &&
            (col.estadoMandato || "").toLowerCase() !== "despromovido";
          if (isChefia) {
            const getAreaDeAfetacao = (cc: any): string => {
              if (
                cc.reparticao &&
                cc.reparticao !== "Nenhum" &&
                cc.reparticao !== "-"
              )
                return cc.reparticao;
              if (
                cc.departamento &&
                cc.departamento !== "Nenhum" &&
                cc.departamento !== "-"
              )
                return cc.departamento;
              if (cc.direcao && cc.direcao !== "Nenhum" && cc.direcao !== "-")
                return cc.direcao;
              return cc.unidade || "";
            };
            const area = getAreaDeAfetacao(col);
            return { ...col, status: "Afetado", areaDeAfetacao: area };
          }
          return col;
        }),
      );

      alert(
        `Sincronização concluída com sucesso!\n\n- Contas criadas: ${result.created}\n- Contas atualizadas: ${result.updated}\n\nTodos os chefes ativos foram sincronizados e afetados às suas áreas de jurisdição em ambos os links.`,
      );
    } catch (err) {
      console.error("Erro na sincronização:", err);
      alert("Ocorreu um erro ao sincronizar os dados.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!hasAdminAccess) {
      alert(
        "Apenas administradores ou chefes de recursos humanos têm permissão para eliminar colaboradores.",
      );
      return;
    }

    const col = colaboradores.find((c) => c.id === id);
    if (
      col &&
      col.cargoChefia &&
      col.cargoChefia !== "Nenhum" &&
      col.cargoChefia !== "-"
    ) {
      alert(
        `⚠️ OPERAÇÃO BLOQUEADA: O colaborador "${col.nome}" possui o cargo de chefia "${col.cargoChefia}". Colaboradores com cargos de chefia atuais, recentes ou futuros estão permanentemente protegidos contra eliminação para manter a integridade dos dados, acessos e organograma do sistema.`,
      );
      return;
    }

    showConfirm(
      "Confirmar Eliminação",
      `⚠️ TEM A CERTEZA? Deseja eliminar permanentemente o colaborador "${col?.nome || "este registo"}"? Esta ação é IRREVERSÍVEL e o dado será removido definitivamente da base de dados sem possibilidade de recuperação.`,
      async () => {
        try {
          // Optimistic update of local state
          setColaboradores((prev) => prev.filter((c) => c.id !== id));
          setSelectedIds((prev) =>
            prev.filter((selectedId) => selectedId !== id),
          );

          await firestoreService.colaboradores.delete(id);
          alert("dados excluido com sucesso");
        } catch (err) {
          console.error("Erro ao remover colaborador:", err);
          alert("Erro ao excluir: " + err.message);
        }
      },
      true,
      "Sim, Eliminar",
    );
  };

  const handleDeleteSelected = async () => {
    if (!hasAdminAccess) {
      alert(
        "Apenas administradores ou chefes de recursos humanos têm permissão para eliminar colaboradores.",
      );
      return;
    }
    if (selectedIds.length === 0) return;

    // Filter out any selected employees that have leadership (chefia) roles
    const chefesSelected = colaboradores.filter(
      (c) =>
        selectedIds.includes(c.id) &&
        c.cargoChefia &&
        c.cargoChefia !== "Nenhum" &&
        c.cargoChefia !== "-",
    );
    if (chefesSelected.length > 0) {
      const chefesNomes = chefesSelected
        .map((c) => `• ${c.nome} (${c.cargoChefia})`)
        .join("\n");
      alert(
        `⚠️ OPERAÇÃO BLOQUEADA / DETECTADO CARGO DE CHEFIA:\nOs seguintes colaboradores não podem ser eliminados porque possuem cargos de chefia protegidos pelo sistema:\n\n${chefesNomes}\n\nPor favor, desmarque-os antes de proceder com a eliminação.`,
      );
      return;
    }

    showConfirm(
      "Confirmar Eliminação Múltipla",
      `Tem a certeza que deseja eliminar ${selectedIds.length} colaborador(es)? Esta ação é irreversível.`,
      async () => {
        try {
          const idsToRemove = [...selectedIds];
          // Optimistic update
          setColaboradores((prev) =>
            prev.filter((c) => !idsToRemove.includes(c.id)),
          );
          setSelectedIds([]);

          // Mark as deleted in Firestore
          await Promise.all(
            idsToRemove.map((id) => firestoreService.colaboradores.delete(id)),
          );
          alert("dados excluido com sucesso");
        } catch (err) {
          console.error("Erro na eliminação múltipla:", err);
        }
      },
      true,
      "Eliminar Selecionados",
    );
  };

  const handleGenerateAllProcessos = async () => {
    showConfirm(
      "Gerar Processos",
      "ATENÇÃO: Esta ação irá tentar gerar processos individuais automáticamente para todos os colaboradores, ordenados alfabeticamente a partir de 001. Deseja continuar?",
      async () => {
        setIsProcessing(true);
        try {
          const sortedColaboradores = [...colaboradores].sort((a, b) =>
            (a.nome || "").localeCompare(b.nome || "", "pt", {
              sensitivity: "base",
            }),
          );
          let generados = 0;
          for (let i = 0; i < sortedColaboradores.length; i++) {
            const col = sortedColaboradores[i];
            // Check if process already exists
            const existe = processos.some(
              (p) => p.nuit === col.nuit || p.nome === col.nome,
            );
            if (!existe) {
              const seq = i + 1;
              const year =
                (col as any).anoIngresso ||
                col.dataAdmissao?.match(/\d{4}/)?.[0] ||
                "2026";
              // Map collaborator to IndividualProcessData
              const newProcess: any = {
                nome: col.nome,
                nuit: col.nuit,
                unidade: col.unidade,
                direcao: col.direcao,
                departamento: col.departamento,
                reparticao: col.reparticao,
                genero: col.genero || "M",
                dataNascimento: col.dataNascimento,
                biNo: col.numeroBI,
                biEmitidoLocal: col.biEm,
                biEmitidoData: col.biEmitidoA,
                dataAdmissao: col.dataAdmissao,
                email: col.email,
                telefone: col.telefone,
                // Add process number info
                processoNo: formatProcessNumber(seq, year),
                processoIndividualNo: `${(col.nome || "S N")
                  .split(" ")
                  .filter((n) => n.length > 0)
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}${(col.nuit || "").replace(/\s/g, "")}`,
              };
              await firestoreService.processos.add(newProcess);
              generados++;
            }
          }
          alert(
            `${generados} processo(s) gerado(s) com sucesso a partir de 001.`,
          );
        } catch (error) {
          console.error("Erro ao gerar processos:", error);
          alert("Erro ao gerar processos.");
        } finally {
          setIsProcessing(false);
        }
      },
    );
  };

  const handleDeleteAllProcessos = async () => {
    setIsProcessing(true);
    try {
      for (const p of processos) {
        await firestoreService.processos.delete(p.id);
      }
      setProcessos([]);
      alert("Todos os processos foram eliminados com sucesso.");
    } catch (error) {
      console.error("Erro ao eliminar processos:", error);
      alert("Erro ao eliminar processos.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAllData = async () => {
    showConfirm(
      "Eliminar Todos os Dados",
      "ATENÇÃO: Esta ação irá eliminar TODOS os dados dos colaboradores na base de dados (Firestore). Deseja continuar?",
      async () => {
        setIsProcessing(true);
        try {
          const docsToDelete = [...colaboradores];
          for (const col of docsToDelete) {
            await firestoreService.colaboradores.delete(col.id);
          }
          setColaboradores([]);
          alert(
            "Todos os dados foram eliminados da base de dados com sucesso.",
          );
        } catch (error) {
          console.error("Erro ao eliminar todos os dados:", error);
          alert("Erro ao limpar base de dados.");
        } finally {
          setIsProcessing(false);
        }
      },
      true,
      "Sim, Eliminar Tudo",
    );
  };

  const handleImportChefia = async () => {
    if (selectedForChefia.length === 0) return;

    setIsProcessing(true);
    try {
      for (const id of selectedForChefia) {
        const colab = colaboradores.find((c) => c.id === id);
        if (colab) {
          const updatedColab = withLastUpdate({
            ...colab,
            cargoChefia: "A Designar",
            estadoMandato: "Em Atividade",
          });
          const result = await firestoreService.colaboradores.update(
            id,
            updatedColab,
          );
          console.log(`Update result for ${id}:`, result);
          setColaboradores((prev) =>
            prev.map((c) => (c.id === id ? updatedColab : c)),
          );
        }
      }
      setIsImportingChefia(false);
      setSelectedForChefia([]);
      alert(
        `${selectedForChefia.length} colaboradores adicionados aos cargos de chefia.`,
      );
    } catch (error) {
      console.error("Erro ao importar chefia:", error);
      alert("Erro ao processar importação.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportProcessosParaEfetivoGeral = async () => {
    showConfirm(
      "Importar Processos",
      "ATENÇÃO: Esta ação irá tentar converter processos individuais existentes em Efetivo Geral. Deseja continuar?",
      async () => {
        setIsProcessing(true);
        try {
          let convertidos = 0;
          console.log("DEBUG: Processos to import:", processos.length);
          for (const p of processos) {
            const existe = colaboradores.some(
              (c) => c.nuit === p.nuit || (c.nome === p.nome && c.nome !== ""),
            );
            if (!existe) {
              const newColaborador: Types.Colaborador = {
                id: p.id || `colab-${Date.now()}-${convertidos}`,
                ord: colaboradores.length + convertidos + 1,
                nome: p.nome || "Sem Nome",
                nuit: p.nuit || "",
                numeroBI: p.biNo || p.numeroBI || "",
                tipo: "CTA",
                efetivo: false,
                unidade: p.unidade || "Não Afetado",
                email: p.email || "",
                genero: p.genero || "M",
                dataNascimento: p.dataNascimento || "",
                localNascimento: {
                  pais: "Moçambique",
                  provincia: "",
                  distrito: "",
                },
                nivelAcademico: "Secundário",
                areaFormacao: "Administração",
                tipoContrato: "A Prazo Certo",
                cargo: p.cargo || "Técnico",
                estado: "Ativo",
              } as any;

              await firestoreService.colaboradores.update(p.id, newColaborador);
              setColaboradores((prev) => [...prev, newColaborador]);
              convertidos++;
            }
          }
          alert(`${convertidos} processo(s) convertido(s) para Efetivo Geral.`);
        } catch (error) {
          console.error("Erro ao converter processos:", error);
          alert("Erro ao converter processos.");
        } finally {
          setIsProcessing(false);
        }
      },
    );
  };

  const handleGlobalAutoCorrect = async () => {
    showConfirm(
      "Correção Ortográfica",
      "ATENÇÃO: Deseja aplicar a correção ortográfica automática a todos os colaboradores no sistema? Esta operação pode levar alguns momentos.",
      async () => {
        setIsProcessing(true);
        try {
          let limit = colaboradores.length;
          let count = 0;
          const updates = [];

          for (const c of colaboradores) {
            const originalName = c.nome;
            const correctedName = c.nome ? toTitleCase(c.nome) : "";

            let isDirty = false;
            const updateObj: any = {};

            if (originalName !== correctedName) {
              updateObj.nome = correctedName;
              isDirty = true;
            }

            const checkAndFix = (field: string, val: string | undefined) => {
              const corrected = val ? toTitleCase(val) : val;
              if (val !== corrected) {
                updateObj[field] = corrected;
                isDirty = true;
              }
            };

            checkAndFix("nivelAcademico", c.nivelAcademico);
            checkAndFix("areaFormacao", c.areaFormacao);
            checkAndFix("categoria", c.categoria);
            checkAndFix("vinculoContractual", c.vinculoContractual);
            checkAndFix("funcao", c.funcao);
            checkAndFix("cargoChefia", c.cargoChefia);
            checkAndFix("unidade", c.unidade);
            checkAndFix("direcao", c.direcao);
            checkAndFix("departamento", c.departamento);
            checkAndFix("reparticao", c.reparticao);
            checkAndFix("sector", c.sector);
            checkAndFix("curso", c.curso);
            checkAndFix("estado", c.estado);
            checkAndFix("estadoMandato", c.estadoMandato);

            if (c.naturalidade && typeof c.naturalidade === "object") {
              const nat = { ...(c.naturalidade as Record<string, any>) };
              let natDirty = false;
              const checkNat = (
                field: keyof typeof nat,
                val: string | undefined,
              ) => {
                const corrected = val ? toTitleCase(val) : val;
                if (val !== corrected) {
                  nat[field] = corrected as any;
                  natDirty = true;
                }
              };
              checkNat("pais", nat.pais as any);
              checkNat("provincia", nat.provincia as any);
              checkNat("distrito", nat.distrito as any);

              if (natDirty) {
                updateObj.naturalidade = nat;
                isDirty = true;
              }
            }

            if (isDirty) {
              updates.push(
                firestoreService.colaboradores
                  .update(c.id, updateObj)
                  .then(() => {
                    count++;
                  }),
              );
              if (updates.length >= 20) {
                await Promise.all(updates);
                updates.length = 0;
              }
            }
          }
          if (updates.length > 0) {
            await Promise.all(updates);
          }

          alert(
            `Concluído! ${count} processos corrigidos ortograficamente em todo o sistema.`,
          );
        } catch (error) {
          console.error("Erro na correção geral:", error);
          alert("Ocorreu um erro a processar as correções gerais.");
        } finally {
          setIsProcessing(false);
        }
      },
    );
  };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Types.Colaborador | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [isDigitalizing, setIsDigitalizing] = useState(false);
  const [digitalizeProgress, setDigitalizeProgress] = useState(0);
  const [digitalizeStep, setDigitalizeStep] = useState("");
  const [duplicateGroups, setDuplicateGroups] = useState<
    {
      field: string;
      value: string;
      items: Types.Colaborador[];
    }[]
  >([]);

  const getCompletenessScore = (c: Types.Colaborador): number => {
    let score = 0;
    const fields: (keyof Types.Colaborador)[] = [
      "nome",
      "nuit",
      "numeroBI",
      "email",
      "dataNascimento",
      "genero",
      "nivelAcademico",
      "areaFormacao",
      "categoria",
      "tipo",
      "carreira",
      "vinculoContractual",
      "tipoContrato",
      "dataAdmissao",
      "cargo",
      "unidade",
      "direcao",
      "departamento",
      "reparticao",
      "sector",
      "curso",
      "estado",
      "estadoMandato",
      "numeroProcesso",
    ];
    fields.forEach((f) => {
      const val = c[f];
      if (val !== undefined && val !== null) {
        const str = String(val).trim();
        if (
          str !== "" &&
          str !== "---" &&
          str !== "0" &&
          str.toLowerCase() !== "nenhum"
        ) {
          score += 1;
        }
      }
    });
    if (c.localNascimento) {
      if (c.localNascimento.pais) score += 1;
      if (c.localNascimento.provincia) score += 1;
      if (c.localNascimento.distrito) score += 1;
    }
    if (c.disciplinas && c.disciplinas.length > 0) {
      score += c.disciplinas.filter((d) => d && d.trim() !== "").length * 0.5;
    }
    return score;
  };

  const mergeRecords = (
    keep: Types.Colaborador,
    discard: Types.Colaborador,
  ): Types.Colaborador => {
    const merged = { ...keep };
    Object.keys(discard).forEach((key) => {
      const k = key as keyof Types.Colaborador;
      const valKeep = merged[k];
      const valDiscard = discard[k];

      const isKeepEmpty =
        valKeep === undefined ||
        valKeep === null ||
        (typeof valKeep === "string" &&
          (valKeep.trim() === "" ||
            valKeep.trim() === "---" ||
            valKeep.trim() === "0" ||
            valKeep.toLowerCase() === "nenhum"));

      const isDiscardNotEmpty =
        valDiscard !== undefined &&
        valDiscard !== null &&
        (typeof valDiscard !== "string" ||
          (valDiscard.trim() !== "" &&
            valDiscard.trim() !== "---" &&
            valDiscard.trim() !== "0" &&
            valDiscard.toLowerCase() !== "nenhum"));

      if (isKeepEmpty && isDiscardNotEmpty) {
        (merged as any)[k] = valDiscard;
      }
    });
    return merged;
  };

  const handleAutoDeduplicate = async () => {
    showConfirm(
      "Eliminar e Consolidar Duplicados",
      "ATENÇÃO: Esta operação irá analisar todo o Efetivo Geral. Para cada grupo de colaboradores duplicados, manterá apenas o registo mais completo (preenchendo os campos em falta com os dados dos outros registos) e eliminará os duplicados da base de dados e Firebase de forma permanente. Deseja prosseguir?",
      async () => {
        setIsProcessing(true);
        try {
          const list = [...colaboradores];
          const visited = new Set<string>();
          const groups: Types.Colaborador[][] = [];

          const areDuplicateCols = (
            a: Types.Colaborador,
            b: Types.Colaborador,
          ): boolean => {
            if (a.id === b.id) return false;

            const isSystemAdminA =
              a.cargoChefia === "Proprietário do sistema" ||
              a.cargoChefia === "Administrador de sistema" ||
              a.categoria?.toLowerCase().includes("proprietario") ||
              a.id === "FTV108164611";
            const isSystemAdminB =
              b.cargoChefia === "Proprietário do sistema" ||
              b.cargoChefia === "Administrador de sistema" ||
              b.categoria?.toLowerCase().includes("proprietario") ||
              b.id === "FTV108164611";
            if (isSystemAdminA || isSystemAdminB) return false;

            const nuitA = (a.nuit || "").trim().toLowerCase();
            const nuitB = (b.nuit || "").trim().toLowerCase();
            if (
              nuitA &&
              nuitB &&
              nuitA !== "---" &&
              nuitA !== "0" &&
              nuitA !== "nenhum" &&
              nuitA === nuitB
            )
              return true;

            const biA = (a.numeroBI || "").trim().toLowerCase();
            const biB = (b.numeroBI || "").trim().toLowerCase();
            if (
              biA &&
              biB &&
              biA !== "---" &&
              biA !== "0" &&
              biA !== "nenhum" &&
              biA === biB
            )
              return true;

            const emailA = (a.email || "").trim().toLowerCase();
            const emailB = (b.email || "").trim().toLowerCase();
            if (
              emailA &&
              emailB &&
              emailA.includes("@") &&
              emailB.includes("@") &&
              emailA === emailB
            )
              return true;

            const nomeA = (a.nome || "").trim().toLowerCase();
            const nomeB = (b.nome || "").trim().toLowerCase();
            if (nomeA && nomeB && nomeA.length > 5 && nomeA === nomeB)
              return true;

            return false;
          };

          for (let i = 0; i < list.length; i++) {
            const c1 = list[i];
            if (visited.has(c1.id)) continue;

            const currentGroup: Types.Colaborador[] = [c1];
            visited.add(c1.id);

            const queue = [c1];
            while (queue.length > 0) {
              const curr = queue.shift()!;
              for (let j = 0; j < list.length; j++) {
                const c2 = list[j];
                if (visited.has(c2.id)) continue;

                if (areDuplicateCols(curr, c2)) {
                  visited.add(c2.id);
                  currentGroup.push(c2);
                  queue.push(c2);
                }
              }
            }

            if (currentGroup.length > 1) {
              groups.push(currentGroup);
            }
          }

          if (groups.length === 0) {
            alert("Nenhum registo duplicado foi encontrado no Efetivo Geral!");
            setIsProcessing(false);
            return;
          }

          let deletedCount = 0;
          let consolidatedCount = 0;

          for (const group of groups) {
            const sortedGroup = [...group].sort(
              (a, b) => getCompletenessScore(b) - getCompletenessScore(a),
            );

            let winner = sortedGroup[0];
            const losers = sortedGroup.slice(1);

            for (const loser of losers) {
              winner = mergeRecords(winner, loser);
            }

            const fullWinnerUpdate = withLastUpdate(
              winner,
            ) as Types.Colaborador;
            await firestoreService.colaboradores.update(
              winner.id,
              fullWinnerUpdate,
            );

            const winnerProcess = processos.find((p) => p.id === winner.id);
            if (winnerProcess) {
              const updatedProcess = {
                ...winnerProcess,
                nome: winner.nome || winnerProcess.nome || "",
                nuit: winner.nuit || winnerProcess.nuit || "",
                numeroBI: winner.numeroBI || winnerProcess.numeroBI || "",
                individualData: {
                  ...(winnerProcess.individualData || {}),
                  ...winner,
                },
              };
              await firestoreService.processos.update(
                winner.id,
                updatedProcess,
              );
            }

            for (const loser of losers) {
              await firestoreService.colaboradores.delete(loser.id);

              const loserProcess = processos.find((p) => p.id === loser.id);
              if (loserProcess) {
                await firestoreService.processos.delete(loser.id);
              }
              deletedCount++;
            }

            consolidatedCount++;
          }

          alert(
            `Deduplicação concluída com sucesso!\n\n- ${consolidatedCount} grupos de registos foram consolidados.\n- ${deletedCount} registos duplicados e incompletos foram removidos definitivamente do Efetivo Geral e do Firebase.`,
          );
          setDuplicateGroups([]);
          setView("menu");
        } catch (error) {
          console.error("Erro na deduplicação automática:", error);
          alert(
            "Ocorreu um erro ao processar a deduplicação de colaboradores.",
          );
        } finally {
          setIsProcessing(false);
        }
      },
      true,
      "Deduplicar",
    );
  };

  const detectDuplicates = () => {
    const groups: { [key: string]: Types.Colaborador[] } = {};

    colaboradores.forEach((c) => {
      const nome = (c.nome || "").trim().toLowerCase();
      const nuit = (c.nuit || "").trim().toLowerCase();
      const bi = (c.numeroBI || "").trim().toLowerCase();

      if (nome) {
        const key = `nome:${nome}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(c);
      }
      if (nuit && nuit !== "nenhum" && nuit !== "-") {
        const key = `nuit:${nuit}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(c);
      }
      if (bi && bi !== "nenhum" && bi !== "-") {
        const key = `bi:${bi}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(c);
      }
    });

    const result = Object.entries(groups)
      .filter(([_, items]) => items.length > 1)
      .map(([key, items]) => {
        const [field, value] = key.split(":");
        return {
          field: field === "nome" ? "Nome" : field === "nuit" ? "NUIT" : "BI",
          value:
            items[0][
              field === "nome" ? "nome" : field === "nuit" ? "nuit" : "numeroBI"
            ] || value,
          items,
        };
      });

    setDuplicateGroups(result);
    setView("duplicados");
  };

  const getReportTitle = () => {
    if (view === "actualizar") {
      const isNew = !colaboradores.some(
        (c) => c.id === selectedColaborador?.id,
      );
      return isNew ? "Adicionar Novo Registo" : "Atualizar Dados";
    }
    if (view === "alocar") return "ALOCAR, EDITAR";
    if (!filtro) return "EFETIVO GERAL (TODOS COLABORADORES)";
    if (filtro.tipo === "Docente" && !("efetivo" in filtro))
      return "DOCENTES (QUADRO E NÃO QUADRO)";
    if (filtro.tipo === "Docente" && filtro.efetivo) return "DOCENTES (QUADRO)";
    if (filtro.tipo === "Docente" && !filtro.efetivo)
      return "DOCENTES (NÃO QUADRO)";
    if (filtro.tipo === "CTA" && !("efetivo" in filtro))
      return "CTA (QUADRO E NÃO QUADRO)";
    if (filtro.tipo === "CTA" && filtro.efetivo) return "CTA (QUADRO)";
    if (filtro.tipo === "CTA" && !filtro.efetivo) return "CTA (NÃO QUADRO)";
    if (filtro.chefia) return "Colaboradores Com Cargo De Chefia";
    if (filtro.chefiaDocente) return "Docentes Com Cargo De Chefia";
    if (filtro.chefiaCTA) return "CTA Com Cargo De Chefia";
    if (filtro.foraInstituicao) return "COLABORADORES FORA DO SONGO";
    return "Efetivo De Funcionários";
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoUrl(url);
    }
  };

  const handleDownload = (format: "pdf" | "excel") => {
    setShowDownloadMenu(false);
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      alert(
        `Download do relatório em formato ${format.toUpperCase()} iniciado com sucesso!`,
      );
    }, 1500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Se for PDF, simular "Digitalização"
      if (file.type === "application/pdf") {
        setIsDigitalizing(true);
        setDigitalizeProgress(0);

        const scanSteps = [
          { label: "Lendo cabeçalho do PDF...", progress: 20 },
          { label: "Executando OCR nas imagens...", progress: 50 },
          { label: "Extraindo dados estruturados...", progress: 80 },
          { label: "Validando registros extraídos...", progress: 100 },
        ];

        let currentStep = 0;
        const interval = setInterval(() => {
          if (currentStep < scanSteps.length) {
            setDigitalizeStep(scanSteps[currentStep].label);
            setDigitalizeProgress(scanSteps[currentStep].progress);
            currentStep++;
          } else {
            clearInterval(interval);
            setTimeout(() => {
              finishImport(file.name);
              setIsDigitalizing(false);
            }, 500);
          }
        }, 1000);
      } else {
        setIsProcessing(true);
        const reader = new FileReader();
        reader.onload = async (evt) => {
          try {
            const dataBuffer = evt.target?.result;
            const wb = XLSX.read(dataBuffer, { type: "array" });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);

            console.log("Efetivo Excel Data:", data);

            const defaultLocalNascimento = {
              pais: "Moçambique",
              provincia: "Niassa",
              distrito: "Songo",
            };

            const newColaboradores: any[] = data.map(
              (row: any, idx: number) => {
                const nomeVal = getExcelRowValue(
                  row,
                  [
                    "nome",
                    "nome completo",
                    "colaborador",
                    "funcionario",
                    "name",
                  ],
                  "Colaborador Importado",
                );
                const emailVal = getExcelRowValue(
                  row,
                  ["email", "correio", "e-mail", "mail"],
                  `${normalizeHeaderString(nomeVal).substring(0, 15)}@songo.ac.mz`,
                );
                const nuitVal = getExcelRowValue(
                  row,
                  ["nuit", "n.u.i.t", "contribuinte", "nif"],
                  Math.floor(100000000 + Math.random() * 900000000).toString(),
                );
                const biVal = getExcelRowValue(
                  row,
                  [
                    "bi",
                    "numero bi",
                    "documento",
                    "identidade",
                    "cartao de cidadao",
                  ],
                  "BI" + Math.floor(10000000 + Math.random() * 90000000),
                );
                const generoVal = getExcelRowValue(
                  row,
                  ["genero", "sexo", "m/f"],
                  "M",
                )
                  .toString()
                  .toUpperCase()
                  .startsWith("F")
                  ? "F"
                  : "M";
                const dataNascVal = getExcelRowValue(
                  row,
                  [
                    "data nascimento",
                    "nascimento",
                    "data de nascimento",
                    "data_nasc",
                  ],
                  "1990-01-01",
                );
                const nivelAcadVal = getExcelRowValue(
                  row,
                  [
                    "nivel academico",
                    "nivel",
                    "habilitacoes",
                    "habilitacao",
                    "escolaridade",
                  ],
                  "Licenciatura",
                );
                const areaFormVal = getExcelRowValue(
                  row,
                  [
                    "area formacao",
                    "area",
                    "curso",
                    "formacao",
                    "area de formacao",
                  ],
                  "Administração",
                );
                const tipoValRaw = getExcelRowValue(
                  row,
                  ["tipo", "categoria", "carreira", "docente/cta"],
                  "CTA",
                )
                  .toString()
                  .toUpperCase();
                const tipoVal = tipoValRaw.includes("DOCENTE")
                  ? "Docente"
                  : "CTA";
                const tipoRelValRaw = getExcelRowValue(
                  row,
                  ["tipo relacao contractual", "relacao", "vinculo", "regime"],
                  "Quadro",
                )
                  .toString()
                  .toUpperCase();
                const tipoRelVal =
                  tipoRelValRaw.includes("FORA") ||
                  tipoRelValRaw.includes("CONTRATADO")
                    ? "Fora do Quadro"
                    : "Quadro";
                const tipoContratoVal = getExcelRowValue(
                  row,
                  ["tipo contrato", "contrato", "tipo de contrato"],
                  tipoRelVal === "Quadro"
                    ? "Por Tempo Indeterminado"
                    : "A Prazo Certo",
                );
                const unidadeVal = getExcelRowValue(
                  row,
                  ["unidade", "unidade organica", "setor", "departamento"],
                  tipoVal === "Docente"
                    ? "Unidade orgânica"
                    : "Unidade Orgânica",
                );
                const cargoVal = getExcelRowValue(
                  row,
                  ["cargo", "funcao", "posto"],
                  tipoVal === "Docente" ? "Docente" : "Técnico",
                );

                return {
                  id: (Date.now() + idx).toString(),
                  ord: idx + 1,
                  nome: nomeVal,
                  email: emailVal,
                  nuit: nuitVal,
                  numeroBI: biVal,
                  genero: generoVal,
                  dataNascimento: dataNascVal,
                  localNascimento: defaultLocalNascimento,
                  nivelAcademico: nivelAcadVal,
                  areaFormacao: areaFormVal,
                  tipo: tipoVal,
                  tipoRelacaoContractual: tipoRelVal,
                  tipoContrato: tipoContratoVal,
                  efetivo: tipoRelVal === "Quadro",
                  unidade: unidadeVal,
                  cargo: cargoVal,
                };
              },
            );

            if (newColaboradores.length > 0) {
              const adminNuit = "108164611";
              const colaboradoresParaAdicionar = newColaboradores.filter(
                (c) => c.nuit !== adminNuit,
              );

              for (const c of colaboradoresParaAdicionar) {
                try {
                  await firestoreService.users.set(c.id, {
                    id: c.id,
                    name: c.nome,
                    email: c.email,
                    nuit: c.nuit,
                    password: "1234",
                    role: c.tipo,
                    mustChangePassword: true,
                  });
                  await firestoreService.colaboradores.update(c.id, c);
                } catch (err) {
                  console.error("Erro ao adicionar", c.nome, err);
                }
              }

              setColaboradores((prev) => [
                ...prev,
                ...colaboradoresParaAdicionar,
              ]);
              alert(
                `Ficheiro de Efetivo processado com sucesso. ${colaboradoresParaAdicionar.length} colaboradores importados e contas criadas!`,
              );
            } else {
              alert("Nenhum colaborador encontrado no ficheiro Excel.");
            }
          } catch (err) {
            console.error(err);
            alert("Erro ao importar o ficheiro Excel.");
          } finally {
            setIsProcessing(false);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }
        };
        reader.readAsArrayBuffer(file);
      }
    }
  };

  const finishImport = async (fileName: string) => {
    const defaultLocalNascimento = {
      pais: "Moçambique",
      provincia: "Niassa",
      distrito: "Songo",
    };

    const isDocenteQuadro: Types.Colaborador = {
      id: Date.now().toString() + "1",
      ord: 1,
      nome: "Docente Quadro Importado",
      email: "docentequadro@songo.ac.mz",
      nuit: "100000001",
      numeroBI: "100000001",
      genero: "M",
      dataNascimento: "1980-01-01",
      localNascimento: defaultLocalNascimento,
      nivelAcademico: "Licenciatura",
      areaFormacao: "Engenharia",
      tipo: "Docente",
      tipoRelacaoContractual: "Quadro",
      tipoContrato: "Por Tempo Indeterminado",
      efetivo: true,
      unidade: "Unidade orgânica",
      cargo: "Docente",
    };
    const isDocenteNaoQuadro: Types.Colaborador = {
      id: Date.now().toString() + "2",
      ord: 2,
      nome: "Docente Fora do Quadro Importado",
      email: "docentecontratado@songo.ac.mz",
      nuit: "100000002",
      numeroBI: "100000002",
      genero: "M",
      dataNascimento: "1980-01-01",
      localNascimento: defaultLocalNascimento,
      nivelAcademico: "Licenciatura",
      areaFormacao: "Engenharia",
      tipo: "Docente",
      tipoRelacaoContractual: "Fora do Quadro",
      tipoContrato: "A Prazo Certo",
      efetivo: false,
      unidade: "Unidade orgânica",
      cargo: "Docente",
    };
    const isCtaQuadro: Types.Colaborador = {
      id: Date.now().toString() + "3",
      ord: 3,
      nome: "CTA Quadro Importado",
      email: "ctaquadro@songo.ac.mz",
      nuit: "100000003",
      numeroBI: "100000003",
      genero: "F",
      dataNascimento: "1980-01-01",
      localNascimento: defaultLocalNascimento,
      nivelAcademico: "Licenciatura",
      areaFormacao: "Administração",
      tipo: "CTA",
      tipoRelacaoContractual: "Quadro",
      tipoContrato: "Por Tempo Indeterminado",
      efetivo: true,
      unidade: "Unidade Orgânica",
      cargo: "Técnico",
    };
    const isCtaNaoQuadro: Types.Colaborador = {
      id: Date.now().toString() + "4",
      ord: 4,
      nome: "CTA Fora do Quadro Importado",
      email: "ctacontratado@songo.ac.mz",
      nuit: "100000004",
      numeroBI: "100000004",
      genero: "F",
      dataNascimento: "1980-01-01",
      localNascimento: defaultLocalNascimento,
      nivelAcademico: "Licenciatura",
      areaFormacao: "Administração",
      tipo: "CTA",
      tipoRelacaoContractual: "Fora do Quadro",
      tipoContrato: "A Prazo Certo",
      efetivo: false,
      unidade: "Unidade Orgânica",
      cargo: "Técnico",
    };

    const novosColaboradores: Types.Colaborador[] = [
      isDocenteQuadro,
      isDocenteNaoQuadro,
      isCtaQuadro,
      isCtaNaoQuadro,
    ];

    // Admin preservation check: NUIT 108164611
    const adminNuit = "108164611";

    // Filter out if import somehow includes the admin
    const colaboradoresParaAdicionar = novosColaboradores.filter(
      (c) => c.nuit !== adminNuit,
    );

    for (const c of colaboradoresParaAdicionar) {
      try {
        await firestoreService.users.set(c.id, {
          id: c.id,
          name: c.nome,
          email: c.email,
          nuit: c.nuit,
          password: "1234",
          role: c.tipo,
          mustChangePassword: true,
        });
        await firestoreService.colaboradores.update(c.id, c);
      } catch (err) {
        console.error("Erro ao adicionar", c.nome, err);
      }
    }

    setColaboradores((prev) => [...prev, ...colaboradoresParaAdicionar]);
    setIsProcessing(false);
    alert(
      `Ficheiro "${fileName}" processado com sucesso. Dados extraídos, incorporados no Efetivo Geral e contas criadas!`,
    );
    setFiltro(null);
    setView("lista");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const renderContent = () => {
    if (view === "visao_geral") {
      return (
        <VisaoGeralLayout
          title={title}
          colaboradores={colaboradores}
          onExploreColaboradores={(filter) => {
            if (filter) {
              setFiltro(filter);
            } else {
              setFiltro(null);
            }
            pushView("lista");
          }}
        />
      );
    }

    if ((view as string) === "acao_orcamental") {
      return (
        <AcaoOrcamentalView
          user={user}
          title={title || "Repartição de Pessoal"}
          activities={matrixActivities}
          onShowAlert={(msg) => alert(msg)}
          onBack={popView}
        />
      );
    }

    if (view === "relatorios") {
      return (
        <ReportsView
          user={user}
          onShowAlert={() => alert("Função em desenvolvimento")}
          initialDirection={title}
          onBack={popView}
        />
      );
    }

    if (view === "calendario") {
      return (
        <CalendarView
          events={[]}
          onAddEvent={async () => {}}
          onUpdateEvent={async () => {}}
          onDeleteEvent={async () => {}}
          onAgendar={() => {}}
          onNota={() => {}}
          title={title}
          notes={[]}
        />
      );
    }

    if (view === "documentos_normativos") {
      return <DocumentosView title={title} user={user} />;
    }

    if (view === "gestao_expediente") {
      return (
        <div className="w-full h-full">
          <GestaoDocumentosView
            onBack={popView}
            expedientes={[]}
            onUpdateExpediente={() => {}}
            onTrackingClick={() => {}}
            title={title}
            hideHeader={true}
          />
        </div>
      );
    }

    if (view === "assinatura_digital") {
      return <AssinaturaDigitalView onBack={popView} user={user} />;
    }

    if (
      view === "plano" ||
      view === "plano_setorial" ||
      view === "plano_atividade" ||
      view === "plano_individual"
    ) {
      return (
        <PlanoWorkflowView
          user={user}
          title={title || "Repartição de Pessoal"}
          matrixActivities={matrixActivities}
          onAddMatrixActivity={(data: any) =>
            firestoreService.matrixActivities.add(data)
          }
          onUpdateMatrixActivity={(id: string, data: any) =>
            firestoreService.matrixActivities.update(id, data)
          }
          onShowAlert={(msg) => alert(msg)}
          onBack={popView}
        />
      );
    }

    if (view === "caixa_mensagens") {
      return (
        <CaixaMensagensView
          departmentTitle={title || "Repartição de Pessoal"}
          user={user}
          colaboradores={colaboradores}
        />
      );
    }

    if (view === "estatistica_reparticao") {
      return <RHStatView title={title || "Repartição de Pessoal"} />;
    }

    if (view === "remuneracoes") {
      return (
        <RemuneracoesRHView
          title={title || "Repartição de Pessoal"}
          user={user}
          colaboradores={colaboradores}
          initialCategory={remuneracoesCategory}
          onCategoryChange={(cat) => setRemuneracoesCategory(cat)}
          onBack={popView}
        />
      );
    }

    if (view === "menu") {
      return (
        <div className="h-full bg-gray-50 flex flex-col overflow-x-hidden">
          <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={popView}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
              >
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Repartição de Pessoal - Visão Geral
              </h1>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-colors"
                title="Sair"
              >
                <Power size={20} />
              </button>
            )}
          </div>

          <div className="flex-1 w-full max-w-7xl mx-auto py-8 relative px-4">
            {isProcessing && <LoadingSpinner />}
            <VisaoGeralCards
              user={user}
              title={title || "Repartição de Pessoal"}
              onNavigate={(target) => {
                if (target === "Gestão de Pessoal" || target === "Gestão Pessoal" || target === "Balanço") {
                  setFiltro(null);
                  pushView("lista");
                } else if (target === "Plano") {
                  pushView("plano");
                } else if (target === "Relatórios") {
                  pushView("estatistica_reparticao");
                } else if (target === "Remunerações") {
                  pushView("remuneracoes");
                } else {
                  navigateTo(target);
                }
              }}
            />
          </div>
        </div>
      );
    }

    if (view === "duplicados") {
      return (
        <div className="h-full bg-gray-50 flex flex-col">
          <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={popView}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
              >
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Colaboradores com Dados Duplicados
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {duplicateGroups.length > 0 && canRegister && (
                <button
                  onClick={handleAutoDeduplicate}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 size={18} />
                  Limpar e Consolidar Todos
                </button>
              )}
              <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl">
                <Users size={18} />
                <span className="font-bold">
                  {duplicateGroups.length} Grupos Encontrados
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 p-4 md:p-8 overflow-y-auto">
            {duplicateGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-20">
                <Check className="w-16 h-16 mb-4 text-green-500" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Nenhum duplicado encontrado!
                </h2>
                <p>Os dados de NUIT, BI e Nome parecem estar consistentes.</p>
              </div>
            ) : (
              <div className="space-y-8 max-w-5xl mx-auto">
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-4 items-start">
                  <Archive className="text-amber-600 shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-amber-900">
                      Atenção Sugerida
                    </h3>
                    <p className="text-sm text-amber-700">
                      Estes registos partilham o mesmo Nome, NUIT ou BI.
                      Verifique se se tratam da mesma pessoa ou se há erros de
                      digitação. Pode editar cada registo individualmente para
                      corrigir a informação.
                    </p>
                  </div>
                </div>

                {duplicateGroups.map((group, gIdx) => (
                  <div
                    key={gIdx}
                    className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100"
                  >
                    <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-[10px] font-black tracking-wider">
                          {group.field} repetido
                        </span>
                        <h3 className="font-black text-gray-900">
                          {group.value}
                        </h3>
                      </div>
                      <span className="text-xs font-bold text-gray-400">
                        {group.items.length} Ocorrências
                      </span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {group.items.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold">
                              {item.nome?.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">
                                {item.nome}
                              </div>
                              <div className="text-xs text-gray-500 flex gap-4">
                                <span>
                                  <strong>BI:</strong> {item.numeroBI}
                                </span>
                                <span>
                                  <strong>NUIT:</strong> {item.nuit}
                                </span>
                                <span>
                                  <strong>Tipo:</strong> {item.tipo}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedColaborador(item);
                                setOriginalId(item.id);
                                setView("actualizar");
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar Dados"
                            >
                              <Edit size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedList = filteredList.slice(
      startIndex,
      startIndex + itemsPerPage,
    );
    const totalPages = Math.ceil(filteredList.length / itemsPerPage);

    if (view === "conformidade") {
      const headers = [
        "N/O",
        "NUIT",
        "Nome Completo",
        "Data",
        "Dia De Semana",
        "Mês",
        "Ano",
        "Hora Entrada",
        "Hora Saída",
        "HORA REC.",
        "Horas Feitas",
        "Diferença",
        "Total Horas Extras",
        "Total Faltas",
      ];

      const records = assiduidade.map((item) => {
        const toDecimal = (time: string) => {
          if (!time) return 0;
          const [h, m] = time.split(":").map(Number);
          return h + m / 60;
        };

        const entrada = toDecimal(item.horaEntrada);
        const saida = toDecimal(item.horaSaida);

        const inicioExpediente = 7.5; // 7:30
        const fimExpediente = 15.5; // 15:30
        const tolerancia = 15 / 60;

        let faltas = 0;
        let totalHorasTrabalho = 0;

        // Se não tem entrada no horário normal (+15 min tolerância), falta de entrada
        if (item.horaEntrada && entrada > inicioExpediente + tolerancia) {
          // Marcar atraso ou considerar como falta de entrada baseada na regra
          // Aqui vamos simplificar para uma lógica inicial
        }

        if (!item.horaEntrada) {
          faltas = 1; // Falta diária se não registou entrada
        } else if (!item.horaSaida) {
          faltas = 1; // Considera falta diária se não registou saída
        } else {
          totalHorasTrabalho = Math.max(0, saida - entrada);
        }

        const horasRec = 8;
        const extras =
          totalHorasTrabalho > horasRec ? totalHorasTrabalho - horasRec : 0;
        const diferenca = totalHorasTrabalho - horasRec;

        return {
          ...item,
          horasFeitas: totalHorasTrabalho.toFixed(2),
          extras: extras.toFixed(2),
          diferenca: diferenca.toFixed(2),
          faltas: faltas,
        };
      });

      return (
        <div className="h-full bg-slate-50/50 flex flex-col p-6 overflow-hidden">
          <h1 className="text-2xl font-black text-slate-800 tracking-tighter mb-6">
            Lista de Assiduidade
          </h1>
          <div className="flex-1 overflow-auto bg-gray-50 rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-slate-600 font-black text-[10px] sticky top-0">
                <tr>
                  {headers.map((h, i) => (
                    <th key={i} className="p-3 border-b">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white text-slate-800 font-medium text-xs">
                {records.length > 0 ? (
                  records.map((r, i) => (
                    <tr key={r.id} className="border-b hover:bg-slate-50">
                      <td className="p-3">{i + 1}</td>
                      <td className="p-3">{r.nuit}</td>
                      <td className="p-3">{r.nomeCompleto}</td>
                      <td className="p-3">{r.data}</td>
                      <td className="p-3">{r.diaSemana}</td>
                      <td className="p-3">{r.mes}</td>
                      <td className="p-3">{r.ano}</td>
                      <td className="p-3">{r.horaEntrada}</td>
                      <td className="p-3">{r.horaSaida}</td>
                      <td className="p-3">8.00</td>
                      <td className="p-3">{r.horasFeitas}</td>
                      <td className="p-3">{r.diferenca}</td>
                      <td className="p-3">{r.extras}</td>
                      <td className="p-3">{r.faltas || 0}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={headers.length}
                      className="p-4 text-center text-slate-400 italic"
                    >
                      Nenhum dado de assiduidade carregado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (view === "lista") {
      return (
        <div className="h-full bg-gray-50 flex flex-col">
          {/* Modal de Digitalização */}
          <AnimatePresence>
            {isDigitalizing && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center"
                >
                  <div className="relative w-32 h-32 mx-auto mb-8 flex items-center justify-center">
                    <ProcessingCircle size={128} strokeWidth={2} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FileText
                        className="text-blue-600 animate-pulse"
                        size={40}
                      />
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tighter">
                    Transformando em Digital
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold tracking-[0.2em] mb-8">
                    {digitalizeStep}
                  </p>

                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-2">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${digitalizeProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[9px] font-black text-slate-400 tracking-widest">
                      OCR Analisys
                    </span>
                    <span className="text-[10px] font-black text-blue-600 tabular-nums">
                      {digitalizeProgress}%
                    </span>
                  </div>
                </motion.div>
              </div>
            )}
            {isImportingChefia && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-3xl p-8 max-w-4xl w-full h-[80vh] shadow-2xl flex flex-col"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tighter">
                        Importar para Chefia
                      </h3>
                      <p className="text-xs text-slate-400 font-bold tracking-widest">
                        Selecione os colaboradores do Efetivo Geral para cargos
                        de liderança
                      </p>
                    </div>
                    <button
                      onClick={() => setIsImportingChefia(false)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto mb-6 border border-gray-100 rounded-2xl">
                    <table className="w-full border-collapse">
                      <thead className="bg-gray-50 sticky top-0 font-bold text-[10px] text-gray-500">
                        <tr>
                          <th className="p-4 text-left w-10">
                            <input
                              type="checkbox"
                              checked={
                                selectedForChefia.length > 0 &&
                                selectedForChefia.length ===
                                  colaboradores.length
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedForChefia(
                                    colaboradores.map((c) => c.id),
                                  );
                                } else {
                                  setSelectedForChefia([]);
                                }
                              }}
                            />
                          </th>
                          <th className="p-4 text-left">Nome Completo</th>
                          <th className="p-4 text-left">Carreira</th>
                          <th className="p-4 text-left">Unidade</th>
                          <th className="p-4 text-left font-bold text-red-600">
                            Estado de Mandato
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-xs">
                        {colaboradores.map((c) => (
                          <tr
                            key={c.id}
                            className="hover:bg-blue-50 transition-colors"
                          >
                            <td className="p-4">
                              <input
                                type="checkbox"
                                checked={selectedForChefia.includes(c.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedForChefia((prev) => [
                                      ...prev,
                                      c.id,
                                    ]);
                                  } else {
                                    setSelectedForChefia((prev) =>
                                      prev.filter((id) => id !== c.id),
                                    );
                                  }
                                }}
                              />
                            </td>
                            <td className="p-4 font-extrabold text-gray-900">
                              {c.nome}
                            </td>
                            <td className="p-4 text-gray-600 font-bold">
                              {c.tipo}
                            </td>
                            <td className="p-4 text-gray-600">
                              {c.unidade && String(c.unidade).toLowerCase() !== "isps"
                                ? c.unidade
                                : "-"}
                            </td>
                            <td className="p-4 text-gray-600">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.estadoMandato === "Cessado" ? "bg-red-100 text-red-700" : c.estadoMandato === "Despromovido" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-700"}`}
                              >
                                {c.estadoMandato || "Nenhum"}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {colaboradores.length === 0 && (
                          <tr>
                            <td
                              colSpan={5}
                              className="p-8 text-center text-gray-400 font-medium"
                            >
                              Nenhum colaborador disponível para importação.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between items-center">
                    <button
                      onClick={handleSyncChefiaAccounts}
                      className="flex items-center gap-2 px-4 py-2 text-emerald-600 font-bold hover:bg-emerald-50 rounded-xl transition-all border border-emerald-100"
                    >
                      <UserCheck size={16} />
                      Sincronizar Contas e Credenciais (Técnicos e Chefias)
                    </button>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setIsImportingChefia(false)}
                        className="px-6 py-2.5 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleImportChefia}
                        disabled={selectedForChefia.length === 0}
                        className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                      >
                        Importar Selecionados ({selectedForChefia.length})
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
            {colaboradorToDelete && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center border border-red-50"
                >
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 animate-bounce">
                    <AlertCircle size={32} />
                  </div>

                  <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">
                    Eliminar Colaborador
                  </h3>
                  <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                    Tem a certeza de que quer eliminar o colaborador{" "}
                    <strong className="text-slate-900">
                      {colaboradorToDelete.nome}
                    </strong>
                    ?<br />
                    Esta ação irá excluí-lo permanentemente da base de dados e é
                    irreversível.
                  </p>

                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => setColaboradorToDelete(null)}
                      className="flex-1 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-sm"
                    >
                      Não
                    </button>
                    <button
                      onClick={async () => {
                        const id = colaboradorToDelete.id;
                        setColaboradorToDelete(null);
                        await handleRemove(id);
                      }}
                      className="flex-1 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-md text-sm"
                    >
                      Sim
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
          <div className="p-4 bg-white border-b border-gray-100 flex items-center gap-4">
            <button
              onClick={() => {
                if (filtro) {
                  if (filtro.estadoForaInstituicao) {
                    setFiltro({ foraInstituicao: true } as any);
                  } else {
                    setFiltro(null);
                  }
                } else {
                  popView();
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              {isFiltroChefiaActive
                ? filtro?.chefiaDocente
                  ? "Docentes com cargo de chefia"
                  : filtro?.chefiaCTA
                  ? "CTA com cargo de chefia"
                  : "Colaboradores com cargo de chefia"
                : getReportTitle()}
            </h1>
          </div>

          <div className="flex-1 w-full max-w-none p-4 md:p-8">
            {!isFiltroChefiaActive && missingDataColaboradores.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-4 mb-6 rounded-2xl flex flex-col sm:flex-row justify-between items-center shadow-lg gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                    <AlertCircle className="text-yellow-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-yellow-900 tracking-tight">
                      Atualizar os dados
                    </h3>
                    <p className="text-xs font-medium text-yellow-700/80 tracking-widest mt-1">
                      Existem {missingDataColaboradores.length} colaboradores
                      com NUIT ou B.I. em falta ou duplicados.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowMissingDataOnly(!showMissingDataOnly);
                    setCurrentPage(1);
                  }}
                  className={`font-bold py-3 px-6 rounded-xl transition-all shadow-md active:scale-95 text-xs tracking-widest ${showMissingDataOnly ? "bg-yellow-200 hover:bg-yellow-300 text-yellow-800" : "bg-yellow-500 hover:bg-yellow-600 text-white"}`}
                >
                  {showMissingDataOnly ? "Ver Todos" : "Mostrar Colaboradores"}
                </button>
              </div>
            )}
            {/* FILTROS E DISTRIBUIÇÃO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6 justify-items-center">
              <MenuCard
                title="DOCENTE (QUADRO)"
                icon={UserCheck}
                onClick={() => setFiltro({ tipo: "Docente", efetivo: true })}
                description=""
                count={statsMetrics.docenteQuadro}
                details={
                  <div className="text-[10px] font-extrabold text-blue-700 bg-blue-50/80 py-1 px-2 rounded-xl border border-blue-100 flex justify-between items-center w-full">
                    <span>H: {docenteQuadroStats.H}</span>
                    <span>M: {docenteQuadroStats.M}</span>
                    <span className="font-black text-blue-900">
                      Total: {docenteQuadroStats.total}
                    </span>
                  </div>
                }
                color={
                  filtro?.tipo === "Docente" && filtro?.efetivo === true
                    ? "bg-blue-600 text-white"
                    : "bg-blue-50 text-blue-600"
                }
              />
              <MenuCard
                title="DOCENTE (FORA DO QUADRO)"
                icon={UserX}
                onClick={() => setFiltro({ tipo: "Docente", efetivo: false })}
                description=""
                count={statsMetrics.docenteNaoQuadro}
                details={
                  <div className="text-[10px] font-extrabold text-orange-700 bg-orange-50/80 py-1 px-2 rounded-xl border border-orange-100 flex justify-between items-center w-full">
                    <span>H: {docenteNaoQuadroStats.H}</span>
                    <span>M: {docenteNaoQuadroStats.M}</span>
                    <span className="font-black text-orange-900">
                      Total: {docenteNaoQuadroStats.total}
                    </span>
                  </div>
                }
                color={
                  filtro?.tipo === "Docente" && filtro?.efetivo === false
                    ? "bg-orange-600 text-white"
                    : "bg-orange-50 text-orange-600"
                }
              />
              <MenuCard
                title="CTA (QUADRO)"
                icon={Briefcase}
                onClick={() => setFiltro({ tipo: "CTA", efetivo: true })}
                description=""
                count={statsMetrics.ctaQuadro}
                details={
                  <div className="text-[10px] font-extrabold text-green-700 bg-green-50/80 py-1 px-2 rounded-xl border border-green-100 flex justify-between items-center w-full">
                    <span>H: {ctaQuadroStats.H}</span>
                    <span>M: {ctaQuadroStats.M}</span>
                    <span className="font-black text-green-900">
                      Total: {ctaQuadroStats.total}
                    </span>
                  </div>
                }
                color={
                  filtro?.tipo === "CTA" && filtro?.efetivo === true
                    ? "bg-green-600 text-white"
                    : "bg-green-50 text-green-600"
                }
              />
              <MenuCard
                title="CTA (FORA DO QUADRO)"
                icon={Archive}
                onClick={() => setFiltro({ tipo: "CTA", efetivo: false })}
                description=""
                count={statsMetrics.ctaNaoQuadro}
                details={
                  <div className="text-[10px] font-extrabold text-amber-700 bg-amber-50/80 py-1 px-2 rounded-xl border border-amber-100 flex justify-between items-center w-full">
                    <span>H: {ctaNaoQuadroStats.H}</span>
                    <span>M: {ctaNaoQuadroStats.M}</span>
                    <span className="font-black text-amber-900">
                      Total: {ctaNaoQuadroStats.total}
                    </span>
                  </div>
                }
                color={
                  filtro?.tipo === "CTA" && filtro?.efetivo === false
                    ? "bg-amber-600 text-white"
                    : "bg-amber-50 text-amber-600"
                }
              />
              <MenuCard
                title="COLABORADORES FORA DO SONGO"
                icon={Briefcase}
                onClick={() => setFiltro({ foraInstituicao: true } as any)}
                description=""
                count={statsMetrics.foraInstituicao}
                details={
                  <div className="text-[10px] font-extrabold text-red-700 bg-red-50/80 py-1 px-2 rounded-xl border border-red-100 flex justify-between items-center w-full">
                    <span>H: {foraInstituicaoStats.H}</span>
                    <span>M: {foraInstituicaoStats.M}</span>
                    <span className="font-black text-red-900">
                      Total: {foraInstituicaoStats.total}
                    </span>
                  </div>
                }
                color={
                  (filtro as any)?.foraInstituicao === true
                    ? "bg-red-600 text-white"
                    : "bg-red-50 text-red-600"
                }
              />
              <MenuCard
                title="COLABORADORES COM CARGO DE CHEFIA"
                icon={ShieldCheck}
                onClick={() => setFiltro({ chefia: true })}
                description=""
                count={statsMetrics.chefia}
                details={
                  <div className="w-full flex flex-col gap-1 text-[9px] font-bold mt-1 bg-purple-50/90 p-2 rounded-xl border border-purple-200 text-purple-950">
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        setFiltro({ chefiaDocente: true });
                      }}
                      className={`flex justify-between items-center border-b border-purple-200/80 pb-1 cursor-pointer hover:bg-purple-100 p-1 rounded transition-all ${
                        filtro?.chefiaDocente ? "bg-purple-200 text-purple-950 ring-1 ring-purple-300" : ""
                      }`}
                    >
                      <span className="font-black text-purple-800">
                        DOCENTE:
                      </span>
                      <span>
                        H: {chefiaDocenteStats.H} | M: {chefiaDocenteStats.M} |
                        Total: {chefiaDocenteStats.total}
                      </span>
                    </div>
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        setFiltro({ chefiaCTA: true });
                      }}
                      className={`flex justify-between items-center pt-0.5 cursor-pointer hover:bg-purple-100 p-1 rounded transition-all ${
                        filtro?.chefiaCTA ? "bg-purple-200 text-purple-950 ring-1 ring-purple-300" : ""
                      }`}
                    >
                      <span className="font-black text-purple-800">CTA:</span>
                      <span>
                        H: {chefiaCTAStats.H} | M: {chefiaCTAStats.M} | Total:{" "}
                        {chefiaCTAStats.total}
                      </span>
                    </div>
                  </div>
                }
                color={
                  isFiltroChefiaActive
                    ? "bg-purple-600 text-white"
                    : "bg-purple-50 text-purple-600"
                }
              />

              {/* PAINEL DE DETALHES EXCLUSIVO DE CHEFIA QUANDO O FILTRO DE CHEFIA ESTÁ ATIVO */}
              {isFiltroChefiaActive ? (
                <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-6 bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white p-6 rounded-[2rem] shadow-xl flex flex-col xl:flex-row items-center justify-between gap-6 border border-purple-400/30">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-purple-500/20 rounded-2xl border border-purple-400/30 text-purple-300">
                      <ShieldCheck size={36} />
                    </div>
                    <div>
                      <h4 className="text-xl font-black tracking-tight text-purple-100">
                        Detalhes de Colaboradores com Cargo de Chefia
                      </h4>
                      <p className="text-xs font-medium text-purple-200/80 mt-0.5">
                        Clique nos blocos ao lado para alternar filtros. Desdobramento por categoria e género:
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto justify-center">
                    {/* DOCENTE CHEFIA */}
                    <div 
                      onClick={() => setFiltro({ chefiaDocente: true })}
                      className={`cursor-pointer hover:bg-white/15 transition-all p-4 rounded-2xl flex flex-col items-center min-w-[200px] border ${
                        filtro?.chefiaDocente 
                          ? "bg-purple-600/40 border-purple-400 shadow-lg ring-2 ring-purple-400/35 scale-102" 
                          : "bg-white/10 border-white/20"
                      }`}
                    >
                      <div className="text-xs font-black tracking-wider  text-purple-200 mb-2">
                        DOCENTE
                      </div>
                      <div className="flex items-center gap-3 text-xs font-black">
                        <span className="bg-slate-900/60 px-2.5 py-1 rounded-lg text-blue-300 border border-blue-400/30">
                          H:{" "}
                          <strong className="text-white text-sm">
                            {chefiaDocenteStats.H}
                          </strong>
                        </span>
                        <span className="bg-slate-900/60 px-2.5 py-1 rounded-lg text-pink-300 border border-pink-400/30">
                          M:{" "}
                          <strong className="text-white text-sm">
                            {chefiaDocenteStats.M}
                          </strong>
                        </span>
                        <span className="bg-purple-600/80 px-2.5 py-1 rounded-lg text-white border border-purple-400/40">
                          TOTAL:{" "}
                          <strong className="text-white text-sm">
                            {chefiaDocenteStats.total}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* CTA CHEFIA */}
                    <div 
                      onClick={() => setFiltro({ chefiaCTA: true })}
                      className={`cursor-pointer hover:bg-white/15 transition-all p-4 rounded-2xl flex flex-col items-center min-w-[200px] border ${
                        filtro?.chefiaCTA 
                          ? "bg-purple-600/40 border-purple-400 shadow-lg ring-2 ring-purple-400/35 scale-102" 
                          : "bg-white/10 border-white/20"
                      }`}
                    >
                      <div className="text-xs font-black tracking-wider  text-purple-200 mb-2">
                        CTA
                      </div>
                      <div className="flex items-center gap-3 text-xs font-black">
                        <span className="bg-slate-900/60 px-2.5 py-1 rounded-lg text-blue-300 border border-blue-400/30">
                          H:{" "}
                          <strong className="text-white text-sm">
                            {chefiaCTAStats.H}
                          </strong>
                        </span>
                        <span className="bg-slate-900/60 px-2.5 py-1 rounded-lg text-pink-300 border border-pink-400/30">
                          M:{" "}
                          <strong className="text-white text-sm">
                            {chefiaCTAStats.M}
                          </strong>
                        </span>
                        <span className="bg-purple-600/80 px-2.5 py-1 rounded-lg text-white border border-purple-400/40">
                          TOTAL:{" "}
                          <strong className="text-white text-sm">
                            {chefiaCTAStats.total}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* TOTAL CHEFIA */}
                    <div 
                      onClick={() => setFiltro({ chefia: true })}
                      className={`cursor-pointer hover:brightness-110 transition-all p-4 rounded-2xl flex flex-col items-center min-w-[130px] shadow-lg border ${
                        filtro?.chefia 
                          ? "bg-purple-500 border-purple-300 ring-2 ring-purple-300/35 scale-102" 
                          : "bg-purple-600 border-purple-400/50"
                      }`}
                    >
                      <span className="text-[10px] font-black tracking-widest  opacity-90 text-white">
                        TOTAL CHEFIA
                      </span>
                      <span className="text-3xl font-black mt-0.5 text-white">
                        {chefiaDocenteStats.total + chefiaCTAStats.total}
                      </span>
                    </div>
                  </div>
                </div>
              ) : !filtro ? (
                <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-6 bg-slate-50/50 p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex flex-col">
                    <h4 className="text-xl font-black text-slate-800 tracking-tighter">
                      Resumo Detalhado (Efetivo Geral)
                    </h4>
                    <p className="text-xs font-bold text-slate-400 tracking-widest mt-1">
                      Classificação Automática de Quadros e Género
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-2xl min-w-[120px]">
                      <div className="text-2xl font-black text-blue-600">
                        {statsMetrics.docenteQuadro + statsMetrics.ctaQuadro}
                      </div>
                      <div className="text-[10px] font-bold text-blue-400">
                        Quadros
                      </div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-2xl min-w-[120px]">
                      <div className="text-2xl font-black text-orange-600">
                        {statsMetrics.docenteNaoQuadro +
                          statsMetrics.ctaNaoQuadro}
                      </div>
                      <div className="text-[10px] font-bold text-orange-400">
                        Não Quadros
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="relative w-64">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Pesquisar nome..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={searchTerm || ""}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setIsSortedAZ(!isSortedAZ)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${isSortedAZ ? "bg-blue-600 text-white shadow-md" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                    title={
                      isSortedAZ
                        ? "Ordenado por Nome (A-Z)"
                        : "Clique para ordenar por Nome (A-Z)"
                    }
                  >
                    <TrendingUp size={16} />
                    A-Z
                  </button>
                  <button
                    onClick={() => setFiltro(null)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${!filtro ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    Todos
                  </button>
                </div>
              </div>

              {hasAdminAccess && (
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".csv, .pdf, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    onChange={handleFileUpload}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-md"
                  >
                    <Upload size={18} />
                    Digitalizar/Upload Ficheiro
                  </button>
                  {!isFiltroChefiaActive && (
                    <button
                      onClick={detectDuplicates}
                      className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md"
                    >
                      <FolderSearch size={18} />
                      Deteção de Duplicados
                    </button>
                  )}
                  {isFiltroChefiaActive && (
                    <>
                      <button
                        onClick={() => setIsImportingChefia(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md animate-fade-in"
                      >
                        <Plus size={18} />
                        Importar colaboradores com cargo de chefia
                      </button>
                      <button
                        onClick={handleSyncChefiaAccounts}
                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-md animate-fade-in"
                      >
                        <UserCheck size={18} />
                        Sincronizar Contas e Credenciais (Técnicos e Chefias)
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      const novoColaborador: Types.Colaborador = {
                        id: Math.random().toString(36).substr(2, 9),
                        ord: colaboradores.length + 1,
                        nome: "",
                        genero: "M",
                        dataNascimento: "",
                        localNascimento: {
                          pais: "Moçambique",
                          provincia: "",
                          distrito: "",
                        },
                        nuit: "",
                        numeroBI: "",
                        nivelAcademico: "",
                        areaFormacao: "",
                        tipoContrato: "",
                        tipoRelacaoContractual: "",
                        email: "",
                        tipo: (filtro?.tipo as "Docente" | "CTA") || "Docente",
                        efetivo: filtro?.efetivo ?? true,
                        unidade: "",
                        cargo: "",
                      };
                      setSelectedColaborador(novoColaborador);
                      setOriginalId(null);
                      setView("actualizar");
                    }}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md"
                  >
                    <Plus size={18} />
                    Novo Registo
                  </button>
                  {!isFiltroChefiaActive && (
                    <button
                      onClick={handleDeleteAllData}
                      className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-md"
                    >
                      <Trash2 size={18} />
                      Eliminar Tudo
                    </button>
                  )}
                </div>
              )}
            </div>

            {hasAdminAccess && duplicates.count > 0 && (
              <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-6 mb-8 flex items-start gap-4 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-bl-full -mr-10 -mt-10 pointer-events-none" />
                <div className="bg-red-500 text-white p-3 rounded-xl shadow-md shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-red-800 font-black text-lg mb-1 tracking-tight">
                    Atenção: Dados Repetidos Detetados no Sistema
                  </h3>
                  <p className="text-red-600/80 text-sm font-medium leading-relaxed">
                    Foram detetados <strong>{duplicates.count}</strong>{" "}
                    registo(s) com informações de identificação duplicadas
                    (NUIT, B.I. ou E-mail). Para garantir a integridade da base
                    de dados e evitar acessos conflituosos, por favor,
                    regularize os registos destacados a vermelho na lista
                    abaixo.
                  </p>
                </div>
              </div>
            )}

            <div className="bg-slate-50/50 p-10 rounded-3xl shadow-xl border border-gray-100 mb-8 relative overflow-hidden">
              {/* Background Accent */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500" />

              {/* Download Button Top Right */}
              <div className="absolute top-10 right-10 z-10">
                <div className="relative">
                  <button
                    onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-bold text-sm shadow-sm"
                  >
                    <Download size={16} /> Download
                  </button>
                  {showDownloadMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-2xl z-50 overflow-hidden">
                      <button
                        onClick={() => handleDownload("pdf")}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 text-gray-700 transition-colors"
                      >
                        <FileText size={18} className="text-red-500" /> Formato
                        PDF
                      </button>
                      <button
                        onClick={() => handleDownload("excel")}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-green-50 text-gray-700 transition-colors"
                      >
                        <FileSpreadsheet size={18} className="text-green-600" />{" "}
                        Formato Excel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div
                className={`flex flex-col md:flex-row items-center gap-10 border-b pb-10 border-gray-100 ${filtro ? "hidden" : ""}`}
              >
                {/* Logo Section */}
                <div
                  className="w-32 h-32 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-gray-50 overflow-hidden relative group shrink-0 shadow-inner bg-gray-50/50"
                  onClick={() => logoInputRef.current?.click()}
                >
                  {logoUrl ? (
                    <>
                      <img
                        src={logoUrl}
                        alt="Logótipo Institucional"
                        className="w-full h-full object-contain p-2"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-black transition-opacity">
                        Alterar Logótipo
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-gray-400 p-4">
                      <ImagePlus size={36} strokeWidth={1.5} className="mb-2" />
                      <span className="text-[9px] font-black text-center leading-tight tracking-[0.2em]">
                        Upload
                        <br />
                        Logótipo
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center md:text-left space-y-4">
                  <div className="space-y-1">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tighter leading-none">
                      Instituto Superior Politécnico de Songo
                    </h1>
                  </div>

                  {!filtro?.chefia && (
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[10px] font-bold text-gray-400 tracking-widest">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                        <Calendar size={12} className="text-blue-500" />
                        <span>
                          Data: {new Date().toLocaleDateString("pt-PT")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                        <FileText size={12} className="text-emerald-500" />
                        <span>
                          Doc: #RH-{(colaboradores.length + 1000).toString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                        <Users size={12} className="text-purple-500" />
                        <span>Total: {filteredList.length} Funcionários</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-10 text-center">
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter">
                  {getReportTitle()}
                </h2>
                <div className="mt-4 w-24 h-1.5 bg-blue-600 mx-auto rounded-full shadow-sm shadow-blue-200" />
              </div>

              <input
                type="file"
                ref={logoInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleLogoUpload}
              />
            </div>

            <div className="bg-slate-50/50 shadow-xl border border-gray-100 rounded-2xl overflow-auto max-h-[700px] mb-8">
              <table className="w-full text-left border-collapse min-w-max">
                <thead className="text-sm sticky top-0 z-20 font-[Times_New_Roman,Times,serif]">
                  <tr className="bg-[#00b0f0]">
                    <th
                      colSpan={7}
                      className="p-2 border border-black text-black font-bold text-center text-lg"
                    >
                      Dados Pessoais
                    </th>
                    <th
                      colSpan={3}
                      className="p-2 border border-black text-black font-bold text-center text-lg"
                    >
                      Local de Nascimento
                    </th>
                    {!isFiltroChefiaActive && (
                      <th
                        colSpan={6}
                        className="p-2 border border-black text-black font-bold text-center text-lg"
                      >
                        Enquadramento Institucional
                      </th>
                    )}
                    <th
                      colSpan={5}
                      className="p-2 border border-black text-black font-bold text-center text-lg"
                    >
                      Afetação Institucional
                    </th>
                    <th
                      rowSpan={2}
                      className="p-2 border border-black text-black font-bold text-center align-middle text-base"
                    >
                      Ações
                    </th>
                  </tr>
                  <tr className="bg-[#00b0f0] text-black">
                    <th className="p-2 border border-black font-bold text-center align-middle whitespace-nowrap">
                      Ord.
                    </th>
                    <th className="p-2 border border-black font-bold text-center align-middle whitespace-nowrap">
                      Nome Completo
                    </th>
                    <th className="p-2 border border-black font-bold text-center align-middle whitespace-nowrap">
                      Género
                    </th>
                    <th className="p-2 border border-black font-bold text-center align-middle whitespace-nowrap">
                      NUIT
                    </th>
                    <th className="p-2 border border-black font-bold text-center align-middle whitespace-nowrap">
                      Nº B.I.
                    </th>
                    <th className="p-2 border border-black font-bold text-center align-middle">
                      Data de
                      <br />
                      Nascimento
                    </th>
                    <th className="p-2 border border-black font-bold text-center align-middle whitespace-nowrap">
                      Estado
                    </th>
                    <th className="p-2 border border-black font-bold text-center align-middle whitespace-nowrap">
                      País
                    </th>
                    <th className="p-2 border border-black font-bold text-center align-middle whitespace-nowrap">
                      Província
                    </th>
                    <th className="p-2 border border-black font-bold text-center align-middle whitespace-nowrap">
                      Distrito
                    </th>
                    {!isFiltroChefiaActive && (
                      <>
                        <th className="p-2 border border-black font-bold text-center align-middle whitespace-nowrap">
                          Nível Académico
                        </th>
                        <th className="p-2 border border-black font-bold text-center align-middle whitespace-nowrap">
                          Área de Formação
                        </th>
                        <th className="p-2 border border-black font-bold text-center align-middle whitespace-nowrap">
                          Categoria
                        </th>
                        <th className="p-2 border border-black font-bold text-center align-middle whitespace-nowrap">
                          Tipo de Contrato
                        </th>
                        <th className="p-2 border border-black font-bold text-center align-middle whitespace-nowrap">
                          Vínculo Contractual
                        </th>
                        <th className="p-2 border border-black font-bold text-center align-middle whitespace-nowrap">
                          Carreira
                        </th>
                      </>
                    )}
                    <th className="p-2 border border-black font-bold text-center align-middle whitespace-nowrap">
                      Órgão
                    </th>
                    <th className="p-2 border border-black font-bold text-center align-middle whitespace-nowrap">
                      Direção
                    </th>
                    <th className="p-2 border border-black font-bold text-center align-middle whitespace-nowrap">
                      Departamento
                    </th>
                    <th className="p-2 border border-black font-bold text-center align-middle whitespace-nowrap">
                      Repartição / Curso
                    </th>
                    <th className="p-2 border border-black font-bold text-center align-middle whitespace-nowrap">
                      Setor
                    </th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {paginatedList.map((c, index) =>
                    editingId === c.id ? (
                      <tr key={c.id} className="bg-blue-50/50">
                        <td className="p-2 border border-gray-200 text-center font-bold text-gray-900">
                          {startIndex + index + 1}
                        </td>
                        <td className="p-2 border border-gray-200">
                          <input
                            type="text"
                            value={editFormData?.nome || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditFormData((prev) =>
                                prev ? { ...prev, nome: val } : null,
                              );
                            }}
                            className="w-full p-1 border border-gray-300 rounded"
                            autoFocus
                          />
                        </td>
                        <td className="p-2 border border-gray-200">
                          <select
                            value={editFormData?.genero || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              const novoPais =
                                val === "M"
                                  ? "Moçambicano"
                                  : val === "F"
                                    ? "Moçambicana"
                                    : editFormData?.localNascimento?.pais || "";
                              setEditFormData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      genero: val as "M" | "F",
                                      localNascimento: {
                                        ...(prev.localNascimento || {
                                          pais: "",
                                          provincia: "",
                                          distrito: "",
                                        }),
                                        pais: novoPais,
                                      },
                                    }
                                  : null,
                              );
                            }}
                            className="w-full p-1 border border-gray-300 rounded"
                          >
                            <option value=""></option>
                            <option value="M">M</option>
                            <option value="F">F</option>
                          </select>
                        </td>
                        <td className="p-2 border border-gray-200">
                          <input
                            type="text"
                            value={editFormData?.nuit || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditFormData((prev) =>
                                prev ? { ...prev, nuit: val } : null,
                              );
                            }}
                            className="w-full p-1 border border-gray-300 rounded"
                          />
                        </td>
                        <td className="p-2 border border-gray-200">
                          <input
                            type="text"
                            value={editFormData?.numeroBI || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditFormData((prev) =>
                                prev ? { ...prev, numeroBI: val } : null,
                              );
                            }}
                            className="w-full p-1 border border-gray-300 rounded"
                          />
                        </td>
                        <td className="p-2 border border-gray-200">
                          <input
                            type="date"
                            value={editFormData?.dataNascimento || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditFormData((prev) =>
                                prev ? { ...prev, dataNascimento: val } : null,
                              );
                            }}
                            className="w-full p-1 border border-gray-300 rounded"
                          />
                        </td>
                        <td className="p-2 border border-gray-200">
                          <select
                            value={editFormData?.estado || "Ativo"}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditFormData((prev) =>
                                prev ? { ...prev, estado: val as any } : null,
                              );
                            }}
                            className={`w-full p-1 border border-gray-300 rounded font-black ${["Falecido", "Reformado", "Transferido"].includes(editFormData?.estado || "Ativo") ? "text-red-600" : editFormData?.estado === "Ativo" || !editFormData?.estado ? "text-green-600" : "text-blue-600"}`}
                          >
                            <option
                              value="Ativo"
                              className="text-green-600 font-bold"
                            >
                              Ativo
                            </option>
                            <option value="Inativo" className="text-black">
                              Inativo
                            </option>
                            <option value="Aposentado" className="text-black">
                              Aposentado
                            </option>
                            <option value="Licença" className="text-black">
                              Licença
                            </option>
                            <option
                              value="Reformado"
                              className="text-red-600 font-bold"
                            >
                              Reformado
                            </option>
                            <option
                              value="Transferido"
                              className="text-red-600 font-bold"
                            >
                              Transferido
                            </option>
                            <option
                              value="Falecido"
                              className="text-red-600 font-bold"
                            >
                              Falecido
                            </option>
                          </select>
                        </td>
                        <td className="p-2 border border-gray-200">
                          <input
                            type="text"
                            value={editFormData?.localNascimento?.pais || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditFormData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      localNascimento: {
                                        ...(prev.localNascimento || {
                                          pais: "",
                                          provincia: "",
                                          distrito: "",
                                        }),
                                        pais: val,
                                      },
                                    }
                                  : null,
                              );
                            }}
                            className="w-full p-1 border border-gray-300 rounded"
                          />
                        </td>
                        <td className="p-2 border border-gray-200">
                          <select
                            value={
                              editFormData?.localNascimento?.provincia || ""
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditFormData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      localNascimento: {
                                        ...(prev.localNascimento || {
                                          pais: "",
                                          provincia: "",
                                          distrito: "",
                                        }),
                                        provincia: val,
                                        distrito: "",
                                      },
                                    }
                                  : null,
                              );
                            }}
                            className="w-full p-1 border border-gray-300 rounded"
                          >
                            <option value=""></option>
                            {Object.keys(PROVINCIAS_DISTRITOS).map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2 border border-gray-200">
                          <select
                            value={
                              editFormData?.localNascimento?.distrito || ""
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditFormData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      localNascimento: {
                                        ...(prev.localNascimento || {
                                          pais: "",
                                          provincia: "",
                                          distrito: "",
                                        }),
                                        distrito: val,
                                      },
                                    }
                                  : null,
                              );
                            }}
                            className="w-full p-1 border border-gray-300 rounded"
                          >
                            <option value=""></option>
                            {(
                              PROVINCIAS_DISTRITOS[
                                editFormData?.localNascimento
                                  ?.provincia as keyof typeof PROVINCIAS_DISTRITOS
                              ] || []
                            )?.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </td>
                        {!isFiltroChefiaActive && (
                          <>
                            <td className="p-2 border border-gray-200">
                              <select
                                value={editFormData?.nivelAcademico || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setEditFormData((prev) =>
                                    prev
                                      ? { ...prev, nivelAcademico: val }
                                      : null,
                                  );
                                }}
                                className="w-full p-1 border border-gray-300 rounded"
                              >
                                <option value=""></option>
                                {NIVEIS_ACADEMICOS.map((n) => (
                                  <option key={n} value={n}>
                                    {n}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2 border border-gray-200">
                              <input
                                type="text"
                                value={editFormData?.areaFormacao || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setEditFormData((prev) =>
                                    prev
                                      ? { ...prev, areaFormacao: val }
                                      : null,
                                  );
                                }}
                                className="w-full p-1 border border-gray-300 rounded"
                              />
                            </td>
                            <td className="p-2 border border-gray-200">
                              <input
                                type="text"
                                value={editFormData?.categoria || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const resolvedTipo = classifyTipo({
                                    categoria: val,
                                  });
                                  setEditFormData((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          categoria: val,
                                          tipo: resolvedTipo as any,
                                          carreira: resolvedTipo,
                                        }
                                      : null,
                                  );
                                }}
                                className="w-full p-1 border border-gray-300 rounded"
                              />
                            </td>
                            <td className="p-2 border border-gray-200">
                              <select
                                value={editFormData?.tipoContrato || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setEditFormData((prev) =>
                                    prev
                                      ? { ...prev, tipoContrato: val }
                                      : null,
                                  );
                                }}
                                className="w-full p-1 border border-gray-300 rounded"
                              >
                                <option value=""></option>
                                <option value="Tempo inteiro">
                                  Tempo inteiro
                                </option>
                                <option value="Tempo Parcial">
                                  Tempo Parcial
                                </option>
                              </select>
                            </td>
                            <td className="p-2 border border-gray-200">
                              <select
                                value={editFormData?.vinculoContractual || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setEditFormData((prev) =>
                                    prev
                                      ? { ...prev, vinculoContractual: val }
                                      : null,
                                  );
                                }}
                                className="w-full p-1 border border-gray-300 rounded"
                              >
                                <option value=""></option>
                                {VINCULOS_CONTRATUAIS.map((v) => (
                                  <option key={v} value={v}>
                                    {v}
                                  </option>
                                ))}
                                {editFormData?.vinculoContractual &&
                                  !VINCULOS_CONTRATUAIS.includes(
                                    editFormData.vinculoContractual,
                                  ) && (
                                    <option
                                      value={editFormData.vinculoContractual}
                                    >
                                      {editFormData.vinculoContractual}
                                    </option>
                                  )}
                              </select>
                            </td>
                            <td className="p-2 border border-gray-200">
                              <select
                                value={editFormData?.tipo || ""}
                                onChange={(e) => {
                                  const val = e.target.value as
                                    "CTA" | "Docente" | "Investigador";
                                  setEditFormData((prev) =>
                                    prev
                                      ? { ...prev, tipo: val, carreira: val }
                                      : null,
                                  );
                                }}
                                className="w-full p-1 border border-gray-300 rounded font-black text-[10px]"
                              >
                                <option value="Docente">Docente</option>
                                <option value="CTA">CTA</option>
                                <option value="Investigador">
                                  Investigador
                                </option>
                              </select>
                            </td>
                          </>
                        )}
                        <td className="p-2 border border-gray-200">
                          <select
                            value={editFormData?.unidade || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditFormData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      unidade: val,
                                      direcao: "",
                                      departamento: "",
                                      reparticao: "",
                                    }
                                  : null,
                              );
                            }}
                            className="w-full p-1 border border-gray-300 rounded"
                          >
                            <option value=""></option>
                            {UNIDADES_ORGANICAS_SISTEMA.map((u) => (
                              <option key={u.nome} value={u.nome}>
                                {u.nome}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2 border border-gray-200">
                          <select
                            value={editFormData?.direcao || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              const parentUnit =
                                UNIDADES_ORGANICAS_SISTEMA.find((u) =>
                                  u.direcoes?.includes(val),
                                );
                              setEditFormData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      direcao: val,
                                      unidade: parentUnit
                                        ? parentUnit.nome
                                        : prev.unidade || "",
                                      departamento: "",
                                      reparticao: "",
                                      sector: "",
                                      curso: "",
                                    }
                                  : null,
                              );
                            }}
                            className="w-full p-1 border border-gray-300 rounded"
                          >
                            <option value=""></option>
                            {Array.from(
                              new Set(
                                (editFormData?.unidade &&
                                  UNIDADES_ORGANICAS_SISTEMA.find(
                                    (u) => u.nome === editFormData.unidade,
                                  )?.direcoes) ||
                                  UNIDADES_ORGANICAS_SISTEMA.flatMap(
                                    (u) => u.direcoes,
                                  ),
                              ),
                            ).map((d, idx) => (
                              <option key={`${d}-${idx}`} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2 border border-gray-200">
                          <select
                            value={editFormData?.departamento || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              let inferredDir = editFormData?.direcao || "";
                              let inferredUni = editFormData?.unidade || "";
                              if (val) {
                                for (const [dKey, deptList] of Object.entries({
                                  ...DEPARTAMENTOS,
                                  ...DEPARTAMENTOS,
                                })) {
                                  if (deptList?.includes(val)) {
                                    inferredDir = dKey;
                                    const pUnit =
                                      UNIDADES_ORGANICAS_SISTEMA.find((u) =>
                                        u.direcoes?.includes(dKey),
                                      );
                                    if (pUnit) {
                                      inferredUni = pUnit.nome;
                                    }
                                    break;
                                  }
                                }
                              }
                              setEditFormData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      departamento: val,
                                      direcao:
                                        inferredDir || prev.direcao || "",
                                      unidade:
                                        inferredUni || prev.unidade || "",
                                      reparticao: "",
                                      sector: "",
                                      curso: "",
                                    }
                                  : null,
                              );
                            }}
                            className="w-full p-1 border border-gray-300 rounded"
                          >
                            <option value=""></option>
                            {Array.from(
                              new Set(
                                (editFormData?.direcao &&
                                  (DEPARTAMENTOS[
                                    editFormData.direcao as keyof typeof DEPARTAMENTOS
                                  ] ||
                                    DEPARTAMENTOS[
                                      editFormData.direcao as keyof typeof DEPARTAMENTOS
                                    ])) ||
                                  Object.values({
                                    ...DEPARTAMENTOS,
                                    ...DEPARTAMENTOS,
                                  }).flat(),
                              ),
                            ).map((d, idx) => (
                              <option key={`${d}-${idx}`} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2 border border-gray-200">
                          <select
                            value={
                              editFormData?.departamento &&
                              [
                                "Departamento de Engenharia Eletrotécnica",
                                "Departamento de Engenharia de Construção Civil",
                                "Departamento de Engenharia de Construção Mecânica",
                              ].includes(editFormData.departamento)
                                ? editFormData?.curso || ""
                                : editFormData?.reparticao || ""
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              const isAcademic =
                                editFormData?.departamento &&
                                [
                                  "Departamento de Engenharia Eletrotécnica",
                                  "Departamento de Engenharia de Construção Civil",
                                  "Departamento de Engenharia de Construção Mecânica",
                                ].includes(editFormData.departamento);
                              setEditFormData((prev) =>
                                prev
                                  ? isAcademic
                                    ? {
                                        ...prev,
                                        curso: val,
                                        reparticao: "",
                                        sector: "",
                                      }
                                    : {
                                        ...prev,
                                        reparticao: val,
                                        sector: "",
                                        curso: "",
                                      }
                                  : null,
                              );
                            }}
                            className="w-full p-1 border border-gray-300 rounded"
                          >
                            <option value=""></option>
                            {editFormData?.departamento &&
                              ([
                                "Departamento de Engenharia Eletrotécnica",
                                "Departamento de Engenharia de Construção Civil",
                                "Departamento de Engenharia de Construção Mecânica",
                              ].includes(editFormData.departamento)
                                ? Array.from(
                                    new Set(
                                      CURSOS[editFormData.departamento] || [],
                                    ),
                                  ).map((c, idx) => (
                                    <option key={`${c}-${idx}`} value={c}>
                                      {c}
                                    </option>
                                  ))
                                : Array.from(
                                    new Set(
                                      REPARTICOES[
                                        editFormData.departamento as keyof typeof REPARTICOES
                                      ] || Object.values(REPARTICOES).flat(),
                                    ),
                                  ).map((r, idx) => (
                                    <option key={`${r}-${idx}`} value={r}>
                                      {r}
                                    </option>
                                  )))}
                          </select>
                        </td>
                        <td className="p-2 border border-gray-200">
                          <select
                            value={editFormData?.sector || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditFormData((prev) =>
                                prev ? { ...prev, sector: val } : null,
                              );
                            }}
                            className="w-full p-1 border border-gray-300 rounded"
                            disabled={
                              !!(
                                editFormData?.departamento &&
                                [
                                  "Departamento de Engenharia Eletrotécnica",
                                  "Departamento de Engenharia de Construção Civil",
                                  "Departamento de Engenharia de Construção Mecânica",
                                ].includes(editFormData.departamento)
                              ) ||
                              !editFormData?.reparticao ||
                              !SECTORES[editFormData.reparticao]
                            }
                          >
                            <option value=""></option>
                            {editFormData?.reparticao &&
                              SECTORES[editFormData.reparticao]?.map((s) => (
                                <option key={s + "-" + Math.random()} value={s}>
                                  {s}
                                </option>
                              ))}
                          </select>
                        </td>
                        <td className="p-2 border border-gray-200 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                if (!editFormData) return;
                                const isQuadro =
                                  (editFormData.tipoRelacaoContractual || "")
                                    .toLowerCase()
                                    .includes("definitiva") ||
                                  (editFormData.tipoRelacaoContractual || "")
                                    .toLowerCase()
                                    .includes("difinitivo") ||
                                  (editFormData.tipoRelacaoContractual || "")
                                    .toLowerCase()
                                    .includes("comissão") ||
                                  ((
                                    editFormData.tipoRelacaoContractual || ""
                                  ).includes("Quadro") &&
                                    !(
                                      editFormData.tipoRelacaoContractual || ""
                                    ).includes("Fora")) ||
                                  editFormData.efetivo === true;

                                const updatedColaborador = {
                                  ...editFormData,
                                  efetivo: isQuadro,
                                };

                                handleGuardarColaborador(updatedColaborador);
                              }}
                              className="text-green-600 hover:text-green-800 p-1 rounded-lg hover:bg-green-50 transition-colors"
                              title="Guardar"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={() => {
                                if (!c.nome) {
                                  setColaboradores((prev) =>
                                    prev.filter((col) => col.id !== c.id),
                                  );
                                }
                                setEditingId(null);
                              }}
                              className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-50 transition-colors"
                              title="Cancelar"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr
                        key={c.id}
                        className={`transition-colors group cursor-pointer ${duplicates.ids.has(c.id) ? "bg-red-50 border-2 border-red-500 hover:bg-red-100/80 shadow-[inset_0_0_0_2px_#ef4444]" : "hover:bg-blue-100/50 odd:bg-white even:bg-blue-50/30"}`}
                        onClick={() => {
                          setSelectedColaborador(c);
                          setOriginalId(c.id);
                          pushView("actualizar");
                        }}
                      >
                        <td className="p-2 border border-gray-200 text-center font-bold text-gray-900">
                          {startIndex + index + 1}
                        </td>
                        <td className="p-2 border border-gray-200 font-bold text-gray-900 whitespace-nowrap relative">
                          <div
                            className="cursor-pointer text-blue-600 hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdown(
                                activeDropdown === c.id ? null : c.id,
                              );
                              setSelectedColaborador(c);
                              setOriginalId(c.id);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              {c.nome || (
                                <span className="text-gray-400 italic">
                                  (Sem Nome)
                                </span>
                              )}
                              {(c.validadoPorRH || c.confiavel) && (
                                <div
                                  className="bg-emerald-50 text-emerald-600 p-0.5 rounded-full border border-emerald-100"
                                  title="Dados validados e confiáveis (Repartição de Pessoal)"
                                >
                                  <CheckCircle2 size={12} />
                                </div>
                              )}
                              {duplicates.ids.has(c.id) && (
                                <div
                                  className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full border border-red-200 text-[10px]  font-black tracking-wider flex items-center gap-1"
                                  title="Atenção: Este registo tem NUIT ou E-mail ou BI duplicado"
                                >
                                  <AlertTriangle size={10} /> Duplicado
                                </div>
                              )}
                            </div>
                          </div>
                          {activeDropdown === c.id && (
                            <div
                              className="absolute left-2 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 py-1 overflow-hidden"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const proc = processos.find(
                                    (p) =>
                                      p.id === c.id ||
                                      (p.nuit && c.nuit && p.nuit === c.nuit) ||
                                      (p.nome &&
                                        c.nome &&
                                        p.nome.toLowerCase().trim() ===
                                          c.nome.toLowerCase().trim()),
                                  );
                                  if (proc) {
                                    setSelectedProcesso(proc);
                                    pushView("processo_edit");
                                  } else {
                                    setSelectedColaborador(c);
                                    setOriginalId(c.id);
                                    pushView("actualizar");
                                  }
                                  setActiveDropdown(null);
                                }}
                              >
                                <Eye size={14} className="text-blue-600" />
                                abrir
                              </button>
                              <button
                                className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedColaborador(c);
                                  setOriginalId(c.id);
                                  pushView("actualizar");
                                  setActiveDropdown(null);
                                }}
                              >
                                <Edit size={14} className="text-amber-600" />
                                Atualizar
                              </button>
                              <button
                                className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedColaborador(c);
                                  setOriginalId(c.id);
                                  pushView("alocar");
                                  setActiveDropdown(null);
                                }}
                              >
                                <UserPlus
                                  size={14}
                                  className="text-emerald-600"
                                />
                                Alocar
                              </button>
                              {(user.cargoChefia ===
                                "Chefe da Repartição de Pessoal" ||
                                isSuperBossUser(user)) && (
                                <button
                                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer border-t border-gray-100 mt-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemove(c.id);
                                    setActiveDropdown(null);
                                  }}
                                >
                                  <Trash2 size={14} />
                                  Excluir Registo
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-2 border border-gray-200 text-center text-gray-600">
                          {c.genero}
                        </td>
                        <td className="p-2 border border-gray-200 text-center text-gray-600">
                          {c.nuit}
                        </td>
                        <td className="p-2 border border-gray-200 text-center text-gray-600">
                          {c.numeroBI}
                        </td>
                        <td className="p-2 border border-gray-200 text-center text-gray-600 whitespace-nowrap">
                          {formatEuropeanDate(c.dataNascimento)}
                        </td>
                        <td className="p-2 border border-gray-200 text-center font-bold">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-[900] tracking-wide shadow-sm inline-block ${["Falecido", "Reformado", "Transferido"].includes(c.estado || "Ativo") ? "bg-red-100 text-red-700 border border-red-200" : c.estado === "Ativo" || !c.estado ? "bg-green-100 text-green-700 border border-green-200" : "bg-blue-100 text-blue-700 border border-blue-200"}`}
                          >
                            {c.estado || "Ativo"}
                          </span>
                        </td>
                        <td className="p-2 border border-gray-200 text-center text-gray-600">
                          {c.localNascimento?.pais || "-"}
                        </td>
                        <td className="p-2 border border-gray-200 text-center text-gray-600">
                          {c.localNascimento?.provincia || "-"}
                        </td>
                        <td className="p-2 border border-gray-200 text-center text-gray-600">
                          {c.localNascimento?.distrito || "-"}
                        </td>
                        {!isFiltroChefiaActive && (
                          <>
                            <td className="p-2 border border-gray-200 text-center text-gray-600">
                              {c.nivelAcademico}
                            </td>
                            <td className="p-2 border border-gray-200 text-center text-gray-600">
                              {c.areaFormacao}
                            </td>
                            <td className="p-2 border border-gray-200 text-center text-gray-600">
                              {c.categoria || "-"}
                            </td>
                            <td className="p-2 border border-gray-200 text-center text-gray-600">
                              {c.tipoContrato || "-"}
                            </td>
                            <td className="p-2 border border-gray-200 text-center text-gray-600">
                              {c.vinculoContractual || "-"}
                            </td>
                            <td className="p-2 border border-gray-200 text-center text-gray-600 font-bold">
                              {c.carreira || c.tipo}
                            </td>
                          </>
                        )}
                        <td className="p-2 border border-gray-200 text-center text-gray-600">
                          {c.unidade || "-"}
                        </td>
                        <td className="p-2 border border-gray-200 text-center text-gray-600">
                          {c.direcao || "-"}
                        </td>
                        <td className="p-2 border border-gray-200 text-center text-gray-600">
                          {c.departamento || "-"}
                        </td>
                        <td className="p-2 border border-gray-200 text-center text-gray-600">
                          {`${c.reparticao || "-"} ${c.curso ? `(${c.curso})` : ""}`}
                        </td>
                        <td className="p-2 border border-gray-200 text-center text-gray-600">
                          {c.sector || "-"}
                        </td>
                        <td className="p-2 border border-gray-200 text-center">
                          <div className="flex justify-center gap-2">
                            {hasAdminAccess && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedColaborador(c);
                                  setOriginalId(c.id);
                                  pushView("actualizar");
                                }}
                                className="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                                title="Editar Dados"
                              >
                                <Edit size={16} />
                              </button>
                            )}
                            {hasAdminAccess && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setColaboradorToDelete(c);
                                }}
                                className="text-red-600 hover:text-red-800 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                  <tr
                    className="bg-blue-50/30 hover:bg-blue-50 transition-colors cursor-pointer group"
                    onClick={() => {
                      const novoColaborador: Types.Colaborador = {
                        id: Math.random().toString(36).substr(2, 9),
                        ord: colaboradores.length + 1,
                        nome: "",
                        genero: "M",
                        dataNascimento: "",
                        localNascimento: {
                          pais: "",
                          provincia: "",
                          distrito: "",
                        },
                        nuit: "",
                        numeroBI: "",
                        nivelAcademico: "",
                        areaFormacao: "",
                        funcao: "",
                        tipoContrato: "",
                        tipoRelacaoContractual: "",
                        email: "",
                        tipo: (filtro?.tipo as "Docente" | "CTA") || "Docente",
                        efetivo: filtro?.efetivo ?? true,
                        unidade: "",
                        cargo: "",
                        estado: "Ativo",
                      };
                      setSelectedColaborador(novoColaborador);
                      setOriginalId(null);
                      setView("actualizar");
                    }}
                  >
                    <td
                      colSpan={15}
                      className="p-4 border border-gray-200 text-center"
                    >
                      <div className="flex items-center justify-center gap-2 text-blue-600 font-bold group-hover:text-blue-800">
                        <Plus size={18} /> Adicionar Novo Registo
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8 mb-12">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
                  title="Página Anterior"
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNumber = i + 1;
                    // Show current page, first, last, and pages around current
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 1 &&
                        pageNumber <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`w-10 h-10 rounded-xl font-bold transition-all ${
                            currentPage === pageNumber
                              ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                              : "bg-white border border-gray-100 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    } else if (
                      pageNumber === currentPage - 2 ||
                      pageNumber === currentPage + 2
                    ) {
                      return (
                        <span
                          key={pageNumber}
                          className="w-10 flex items-center justify-center text-gray-300"
                        >
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
                  title="Próxima Página"
                >
                  <ChevronRight size={20} />
                </button>

                <span className="ml-4 text-xs font-bold text-gray-400 tracking-widest">
                  Página {currentPage} de {totalPages}
                </span>
              </div>
            )}
          </div>

          {showScrollTop && (
            <button
              onClick={scrollToTop}
              className={`fixed p-4 bg-blue-600 text-white rounded-full shadow-2xl hover:bg-blue-700 transition-all transform hover:scale-110 active:scale-95 z-[90] ${
                editingId
                  ? "bottom-24 md:bottom-24 right-8"
                  : "bottom-8 right-8"
              }`}
              title="Voltar ao Topo"
            >
              <ArrowUp size={24} />
            </button>
          )}

          {/* Persistent Floating Bar for Inline Editing to ensure database saving is always accessible */}
          {editingId && editFormData && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-blue-200 shadow-[0_-8px_30px_rgba(0,0,0,0.15)] p-4 flex flex-col md:flex-row items-center justify-between gap-4 z-[100] animate-fade-in-up">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 animate-pulse shrink-0">
                  <FileEdit size={20} />
                </div>
                <div className="text-left">
                  <h4 className="text-[10px] font-black text-blue-900 tracking-widest  mb-0.5">
                    Edição em Progresso
                  </h4>
                  <p className="text-xs text-slate-600 font-bold leading-none">
                    Trabalhando nos dados de:{" "}
                    <span className="text-blue-600 underline font-black">
                      {editFormData.nome || "Novo Registo"}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const originalColab = colaboradores.find(
                      (c) => c.id === editingId,
                    );
                    if (originalColab && !originalColab.nome) {
                      setColaboradores((prev) =>
                        prev.filter((col) => col.id !== editingId),
                      );
                    }
                    setEditingId(null);
                  }}
                  className="flex-1 md:flex-initial px-5 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-black hover:bg-gray-50 transition-all  tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!editFormData) return;
                    setIsProcessing(true);
                    try {
                      const isQuadro =
                        (editFormData.tipoRelacaoContractual || "")
                          .toLowerCase()
                          .includes("definitiva") ||
                        (editFormData.tipoRelacaoContractual || "")
                          .toLowerCase()
                          .includes("difinitivo") ||
                        (editFormData.tipoRelacaoContractual || "")
                          .toLowerCase()
                          .includes("comissão") ||
                        ((editFormData.tipoRelacaoContractual || "").includes(
                          "Quadro",
                        ) &&
                          !(editFormData.tipoRelacaoContractual || "").includes(
                            "Fora",
                          )) ||
                        editFormData.efetivo === true;

                      const updatedColaborador = {
                        ...editFormData,
                        efetivo: isQuadro,
                      } as Types.Colaborador;

                      await handleGuardarColaborador(updatedColaborador);
                    } catch (err) {
                      console.error(
                        "Erro ao guardar dados do colaborador:",
                        err,
                      );
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                  className="flex-1 md:flex-initial px-6 py-2 rounded-xl bg-green-600 text-white text-xs font-black hover:bg-green-700 shadow-md shadow-green-100 transition-all  tracking-wider flex items-center justify-center gap-2"
                >
                  <Save size={16} /> Aplicar & Guardar na Base de Dados
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (view === "actualizar" && selectedColaborador) {
      const isNew = !colaboradores.some(
        (c) => c.id === selectedColaborador?.id,
      );

      return (
        <div className="h-full bg-gray-50 flex flex-col">
          <div className="p-4 bg-white border-b border-gray-100 flex items-center gap-4">
            <button
              onClick={() => {
                popView();
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              {isNew
                ? "Adicionar Novo Registo"
                : "Processo Individual do Colaborador"}
            </h1>
          </div>
          <div className="flex-1 w-full max-w-5xl mx-auto py-8">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-12 relative overflow-hidden">
              {feedback && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/90">
                  {feedback === "success" ? (
                    <Check
                      size={80}
                      className="text-green-500 animate-bounce"
                    />
                  ) : (
                    <X size={80} className="text-red-500 animate-pulse" />
                  )}
                </div>
              )}
              <div className="absolute top-0 left-0 w-full h-2 bg-blue-600" />

              {/* Header com Foto do Colaborador */}
              <div className="flex flex-col items-center mb-12 border-b border-gray-100 pb-8">
                <div
                  className="w-32 h-32 border-4 border-white shadow-xl rounded-2xl flex items-center justify-center cursor-pointer hover:bg-gray-50 overflow-hidden relative group shrink-0 mb-4 bg-gray-100"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = (e: any) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setSelectedColaborador({
                            ...selectedColaborador,
                            fotoUrl: reader.result as string,
                          });
                        };
                        reader.readAsDataURL(file);
                      }
                    };
                    input.click();
                  }}
                >
                  {selectedColaborador.fotoUrl ? (
                    <img
                      src={selectedColaborador.fotoUrl}
                      alt="Foto"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-gray-400">
                      <User size={40} strokeWidth={1.5} />
                      <span className="text-[10px] font-black mt-1  tracking-tighter">
                        Adicionar Foto
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-black transition-opacity  tracking-widest">
                    Alterar Foto
                  </div>
                </div>
                <h2 className="text-xl font-black text-gray-900 text-center leading-tight  tracking-tight">
                  {selectedColaborador.nome || "Novo Registo"}
                </h2>
                <div className="mt-4 flex items-center gap-4">
                  <div className="h-px w-12 bg-gray-200"></div>
                  <span className="text-[9px] font-black text-blue-900/40 tracking-[0.3em] ">
                    {isNew
                      ? "Formulário de Ingressão"
                      : "Atualização de Processo Individual"}
                  </span>
                  <div className="h-px w-12 bg-gray-200"></div>
                </div>
              </div>

              {isProcessing && <LoadingSpinner />}

              {selectedColaborador.lastUpdate && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-8 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                      <AlertCircle size={20} />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-amber-900 tracking-widest leading-none mb-1">
                        Última Atualização
                      </h4>
                      <p className="text-xs font-bold text-amber-700">
                        {new Date(
                          selectedColaborador.lastUpdate.date,
                        ).toLocaleString("pt-PT")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h4 className="text-[10px] font-black text-amber-900 tracking-widest leading-none mb-1">
                      Realizada Por
                    </h4>
                    <p className="text-xs font-bold text-amber-700">
                      {selectedColaborador.lastUpdate.user}
                    </p>
                  </div>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdate(e);
                }}
                className="space-y-8"
              >
                <fieldset className="space-y-8">
                  {/* Secção 1: DADOS PESSOAIS */}
                  <div className="border border-black rounded-[2rem] p-6 md:p-8 space-y-6 relative bg-white">
                    <div className="absolute -top-3.5 left-6 bg-white px-3 flex items-center gap-2">
                      <div className="w-1 h-3.5 bg-blue-600 rounded-full inline-block"></div>
                      <h3 className="text-[11px] font-black text-blue-900 tracking-[0.18em]">
                        Dados Pessoais
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div className="col-span-1">
                        <label className="block text-[10px] font-bold text-red-600 mb-1 tracking-tight">
                          Nº Processo / ID Único
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 rounded-xl border border-red-200 bg-red-50/70 text-red-700 font-black outline-none h-11 cursor-not-allowed shadow-xs text-sm tracking-wide"
                          value={selectedColaborador.numeroProcesso || ""}
                          readOnly
                          disabled
                        />
                      </div>
                      <div className="col-span-1 md:col-span-3">
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Nome Completo
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium h-11 text-base text-gray-900"
                          value={selectedColaborador.nome || ""}
                          onChange={(e) =>
                            setSelectedColaborador({
                              ...selectedColaborador,
                              nome: e.target.value,
                            })
                          }
                          placeholder="Digite o nome completo"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Género
                        </label>
                        <select
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none bg-white font-medium h-11 text-sm"
                          value={selectedColaborador.genero || "M"}
                          onChange={(e) =>
                            setSelectedColaborador({
                              ...selectedColaborador,
                              genero: e.target.value as "M" | "F",
                            })
                          }
                        >
                          <option value="M">Masculino</option>
                          <option value="F">Feminino</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          NUIT
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium h-11 text-sm"
                          value={selectedColaborador.nuit || ""}
                          onChange={(e) =>
                            setSelectedColaborador({
                              ...selectedColaborador,
                              nuit: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Email{" "}
                          <span className="font-serif italic font-normal text-gray-700">
                            Pessoal
                          </span>
                        </label>
                        <input
                          type="email"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium h-11 text-sm"
                          value={selectedColaborador.email || ""}
                          onChange={(e) =>
                            setSelectedColaborador({
                              ...selectedColaborador,
                              email: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Telefone
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium h-11 text-sm"
                          value={selectedColaborador.telefone || ""}
                          onChange={(e) =>
                            setSelectedColaborador({
                              ...selectedColaborador,
                              telefone: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Estado Civil
                        </label>
                        <select
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none bg-white font-medium h-11 text-sm"
                          value={selectedColaborador.estadoCivil || ""}
                          onChange={(e) =>
                            setSelectedColaborador({
                              ...selectedColaborador,
                              estadoCivil: e.target.value,
                            })
                          }
                        >
                          <option value="">Selecione...</option>
                          {ESTADOS_CIVIS.map((ec) => (
                            <option key={ec} value={ec}>
                              {ec}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Nome do Pai
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium h-11 text-sm"
                          value={selectedColaborador.filiacaoPai || ""}
                          onChange={(e) =>
                            setSelectedColaborador({
                              ...selectedColaborador,
                              filiacaoPai: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Nome da Mãe
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium h-11 text-sm"
                          value={selectedColaborador.filiacaoMae || ""}
                          onChange={(e) =>
                            setSelectedColaborador({
                              ...selectedColaborador,
                              filiacaoMae: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          BI /
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium h-11 text-sm"
                          value={selectedColaborador.numeroBI || ""}
                          onChange={(e) =>
                            setSelectedColaborador({
                              ...selectedColaborador,
                              numeroBI: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Emitido em:
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium h-11 text-sm"
                          value={selectedColaborador.biEm || ""}
                          onChange={(e) =>
                            setSelectedColaborador({
                              ...selectedColaborador,
                              biEm: e.target.value,
                            })
                          }
                          placeholder="Ex: Maputo"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Data de Emissão (BI)
                        </label>
                        <input
                          type="date"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium h-11 text-sm"
                          value={selectedColaborador.biEmitidoA || ""}
                          onChange={(e) =>
                            setSelectedColaborador({
                              ...selectedColaborador,
                              biEmitidoA: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Secção 2: LOCAL DE NASCIMENTO */}
                  <div className="border border-black rounded-[2rem] p-6 md:p-8 space-y-6 relative bg-white">
                    <div className="absolute -top-3.5 left-6 bg-white px-3 flex items-center gap-2">
                      <div className="w-1 h-3.5 bg-blue-600 rounded-full inline-block"></div>
                      <h3 className="text-[11px] font-black text-blue-900 tracking-[0.18em]">
                        Local de Nascimento
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Nacionalidade
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium h-11 text-sm"
                          value={
                            selectedColaborador.nacionalidade || "Moçambique"
                          }
                          onChange={(e) =>
                            setSelectedColaborador({
                              ...selectedColaborador,
                              nacionalidade: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Província de Nascimento
                        </label>
                        <select
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none bg-white font-medium h-11 text-sm"
                          value={
                            selectedColaborador.localNascimento?.provincia || ""
                          }
                          onChange={(e) =>
                            setSelectedColaborador({
                              ...selectedColaborador,
                              localNascimento: {
                                pais:
                                  selectedColaborador.localNascimento?.pais ||
                                  "Moçambique",
                                distrito: "",
                                provincia: e.target.value,
                              },
                            })
                          }
                        >
                          <option value="">Selecione...</option>
                          {Object.keys(PROVINCIAS_DISTRITOS).map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Distrito
                        </label>
                        <select
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none bg-white font-medium h-11 text-sm"
                          value={
                            selectedColaborador.localNascimento?.distrito || ""
                          }
                          onChange={(e) =>
                            setSelectedColaborador({
                              ...selectedColaborador,
                              localNascimento: {
                                ...selectedColaborador.localNascimento,
                                distrito: e.target.value,
                              },
                            })
                          }
                          disabled={
                            !selectedColaborador.localNascimento?.provincia
                          }
                        >
                          <option value="">Selecione...</option>
                          {(
                            PROVINCIAS_DISTRITOS[
                              selectedColaborador.localNascimento
                                ?.provincia as keyof typeof PROVINCIAS_DISTRITOS
                            ] || []
                          )?.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Data de Nascimento
                        </label>
                        <input
                          type="date"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium h-11 text-sm"
                          value={selectedColaborador.dataNascimento || ""}
                          onChange={(e) =>
                            setSelectedColaborador({
                              ...selectedColaborador,
                              dataNascimento: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Morada (Província, Distrito, Bairro)
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium h-11 text-sm"
                          value={selectedColaborador.morada || ""}
                          onChange={(e) =>
                            setSelectedColaborador({
                              ...selectedColaborador,
                              morada: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Bairro
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium h-11 text-sm"
                          value={selectedColaborador.bairro || ""}
                          onChange={(e) =>
                            setSelectedColaborador({
                              ...selectedColaborador,
                              bairro: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Distrito (Residência)
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium h-11 text-sm"
                          value={selectedColaborador.distrito || ""}
                          onChange={(e) =>
                            setSelectedColaborador({
                              ...selectedColaborador,
                              distrito: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Célula
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium h-11 text-sm"
                          value={selectedColaborador.celula || ""}
                          onChange={(e) =>
                            setSelectedColaborador({
                              ...selectedColaborador,
                              celula: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Quarteirão No
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium h-11 text-sm"
                          value={
                            selectedColaborador.quarteirao ||
                            selectedColaborador.quarteiraoNo ||
                            ""
                          }
                          onChange={(e) =>
                            setSelectedColaborador({
                              ...selectedColaborador,
                              quarteirao: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Casa No
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium h-11 text-sm"
                          value={selectedColaborador.casaNo || ""}
                          onChange={(e) =>
                            setSelectedColaborador({
                              ...selectedColaborador,
                              casaNo: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Nº de Filhos
                        </label>
                        <input
                          type="number"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium h-11 text-sm"
                          value={selectedColaborador.numFilhos || 0}
                          onChange={(e) =>
                            setSelectedColaborador({
                              ...selectedColaborador,
                              numFilhos: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Secção 3: DADOS PROFISSIONAIS & FORMAÇÃO ACADÉMICA */}
                  <div className="border border-black rounded-[2rem] p-6 md:p-8 space-y-6 relative bg-white">
                    <div className="absolute -top-3.5 left-6 bg-white px-3 flex items-center gap-2">
                      <div className="w-1 h-3.5 bg-blue-600 rounded-full inline-block"></div>
                      <h3 className="text-[11px] font-black text-blue-900 tracking-[0.18em]">
                        Dados Profissionais & Formação Académica
                      </h3>
                    </div>

                    {/* Linha 1: Carreira | Categoria | Função */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Carreira
                        </label>
                        <select
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none bg-white font-medium h-11 text-sm"
                          value={selectedColaborador.carreira || ""}
                          onChange={(e) =>
                            setSelectedColaborador({
                              ...selectedColaborador,
                              carreira: e.target.value,
                              tipo: (e.target.value === "CTA" ? "CTA" : e.target.value === "Docente" ? "Docente" : selectedColaborador.tipo) as any,
                            })
                          }
                        >
                          <option value="">Selecione...</option>
                          <option value="Docente">Docente</option>
                          <option value="CTA">CTA</option>
                          <option value="Investigador">Investigador</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Categoria
                        </label>
                        <select
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none bg-white font-medium h-11 text-sm"
                          value={selectedColaborador.categoria || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            let newCarreira = selectedColaborador.carreira;
                            if (CATEGORIAS_DOCENTES.includes(val) && val !== "Assistente") {
                              newCarreira = "Docente";
                            } else if (["Técnico Superior", "Técnico Profissional", "Técnico"].includes(val)) {
                              newCarreira = "CTA";
                            } else if (val === "Assistente" && !newCarreira) {
                              newCarreira = "Docente";
                            } else {
                              const resolvedTipo = classifyTipo({
                                categoria: val,
                                carreira: selectedColaborador.carreira,
                              });
                              newCarreira = resolvedTipo;
                            }
                            setSelectedColaborador({
                              ...selectedColaborador,
                              categoria: val,
                              tipo: newCarreira as any,
                              carreira: newCarreira,
                            });
                          }}
                        >
                          <option value="">Selecione...</option>
                          {selectedColaborador.carreira === "Docente" ? (
                            <optgroup label="Docentes">
                              {CATEGORIAS_DOCENTES.map((c) => (
                                <option key={`doc-${c}`} value={c}>
                                  {c}
                                </option>
                              ))}
                            </optgroup>
                          ) : selectedColaborador.carreira === "CTA" ? (
                            <optgroup label="CTAA">
                              {CATEGORIAS_CTAA.map((c) => (
                                <option key={`cta-${c}`} value={c}>
                                  {c}
                                </option>
                              ))}
                            </optgroup>
                          ) : (
                            <>
                              <optgroup label="Docentes">
                                {CATEGORIAS_DOCENTES.map((c) => (
                                  <option key={`all-doc-${c}`} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </optgroup>
                              <optgroup label="CTAA">
                                {CATEGORIAS_CTAA.map((c) => (
                                  <option key={`all-cta-${c}`} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </optgroup>
                              <optgroup label="Outras">
                                <option value="Proprietário e Programador do Sistema">
                                  Proprietário e Programador do Sistema
                                </option>
                              </optgroup>
                            </>
                          )}
                          {selectedColaborador.categoria &&
                            !CATEGORIAS_DOCENTES.includes(selectedColaborador.categoria) &&
                            !CATEGORIAS_CTAA.includes(selectedColaborador.categoria) &&
                            selectedColaborador.categoria !== "Proprietário e Programador do Sistema" && (
                              <option value={selectedColaborador.categoria}>
                                {selectedColaborador.categoria}
                              </option>
                            )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Função
                        </label>
                        <select
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none bg-white font-medium h-11 text-sm"
                          value={selectedColaborador.funcao || ""}
                          onChange={(e) =>
                            setSelectedColaborador({
                              ...selectedColaborador,
                              funcao: e.target.value,
                            })
                          }
                        >
                          <option value="">Selecione...</option>
                          {selectedColaborador.carreira === "CTA" ? (
                            <optgroup label="Funções CTA / CTAA">
                              {FUNCOES_CTA.map((f) => (
                                <option key={`cta-f-${f}`} value={f}>
                                  {f}
                                </option>
                              ))}
                            </optgroup>
                          ) : selectedColaborador.carreira === "Docente" ? (
                            <optgroup label="Funções Docente">
                              {FUNCOES_DOCENTES.map((f) => (
                                <option key={`doc-f-${f}`} value={f}>
                                  {f}
                                </option>
                              ))}
                            </optgroup>
                          ) : (
                            <>
                              <optgroup label="Funções CTA / CTAA">
                                {FUNCOES_CTA.map((f) => (
                                  <option key={`all-cta-f-${f}`} value={f}>
                                    {f}
                                  </option>
                                ))}
                              </optgroup>
                              <optgroup label="Funções Docente">
                                {FUNCOES_DOCENTES.map((f) => (
                                  <option key={`all-doc-f-${f}`} value={f}>
                                    {f}
                                  </option>
                                ))}
                              </optgroup>
                            </>
                          )}
                          {selectedColaborador.funcao &&
                            !FUNCOES_CTA.includes(selectedColaborador.funcao) &&
                            !FUNCOES_DOCENTES.includes(selectedColaborador.funcao) && (
                              <option value={selectedColaborador.funcao}>
                                {selectedColaborador.funcao}
                              </option>
                            )}
                        </select>
                      </div>
                    </div>

                    {/* Linha 2: Efetivo | Tipo de Contrato | Vínculo Contratual | Data de Admissão */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Efetivo
                        </label>
                        <select
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none bg-white font-medium h-11 text-sm"
                          value={selectedColaborador.efetivo ? "Sim" : "Não"}
                          onChange={(e) =>
                            setSelectedColaborador({
                              ...selectedColaborador,
                              efetivo: e.target.value === "Sim",
                            })
                          }
                        >
                          <option value="Sim">Sim</option>
                          <option value="Não">Não</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Tipo de Contrato
                        </label>
                        <select
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none bg-white font-medium h-11 text-sm"
                          value={selectedColaborador.tipoContrato || ""}
                          onChange={(e) =>
                            setSelectedColaborador({
                              ...selectedColaborador,
                              tipoContrato: e.target.value,
                            })
                          }
                        >
                          <option value="">Selecione...</option>
                          <option value="Tempo inteiro">Tempo inteiro</option>
                          <option value="Tempo Parcial">Tempo Parcial</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Vínculo Contratual
                        </label>
                        <select
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none bg-white font-medium h-11 text-sm"
                          value={selectedColaborador.vinculoContractual || ""}
                          onChange={(e) =>
                            setSelectedColaborador({
                              ...selectedColaborador,
                              vinculoContractual: e.target.value,
                            })
                          }
                        >
                          <option value="">Selecione...</option>
                          {VINCULOS_CONTRATUAIS.map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                          {selectedColaborador.vinculoContractual &&
                            !VINCULOS_CONTRATUAIS.includes(
                              selectedColaborador.vinculoContractual,
                            ) && (
                              <option
                                value={selectedColaborador.vinculoContractual}
                              >
                                {selectedColaborador.vinculoContractual}
                              </option>
                            )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Data de Admissão
                        </label>
                        <input
                          type="date"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium h-11 text-sm"
                          value={selectedColaborador.dataAdmissao || ""}
                          onChange={(e) =>
                            setSelectedColaborador({
                              ...selectedColaborador,
                              dataAdmissao: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Nível Académico
                        </label>
                        <select
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none bg-white font-medium h-11 text-sm"
                          value={selectedColaborador.nivelAcademico || ""}
                          onChange={(e) =>
                            setSelectedColaborador({
                              ...selectedColaborador,
                              nivelAcademico: e.target.value,
                            })
                          }
                        >
                          <option value="">Selecione...</option>
                          {NIVEIS_ACADEMICOS.map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                          {selectedColaborador.nivelAcademico &&
                            !NIVEIS_ACADEMICOS.includes(
                              selectedColaborador.nivelAcademico,
                            ) && (
                              <option value={selectedColaborador.nivelAcademico}>
                                {selectedColaborador.nivelAcademico}
                              </option>
                            )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Área de Formação
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium h-11 text-sm"
                          value={selectedColaborador.areaFormacao || ""}
                          onChange={(e) =>
                            setSelectedColaborador({
                              ...selectedColaborador,
                              areaFormacao: e.target.value,
                            })
                          }
                          placeholder="Digite a área de formação"
                        />
                      </div>
                    </div>

                    {/* Subseção de Disciplinas Leccionadas - apenas para Docentes */}
                    {(selectedColaborador.carreira === "Docente" ||
                      (!selectedColaborador.carreira && selectedColaborador.tipo === "Docente")) && (
                      <div className="pt-4 border-t border-gray-100 space-y-4">
                        <label className="block text-[11px] font-black text-blue-900 tracking-wider ">
                          DISCIPLINAS LECCIONADAS (ATÉ 4)
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                          {[0, 1].map((idx) => {
                            const discList =
                              selectedColaborador.disciplinas || [
                                "",
                                "",
                                "",
                                "",
                              ];
                            return (
                              <div key={idx}>
                                <label className="block text-[9px] font-bold text-gray-500 mb-1  tracking-tight">
                                  DISCIPLINA {idx + 1}
                                </label>
                                <input
                                  type="text"
                                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium h-11 text-sm"
                                  placeholder={`Disciplina ${idx + 1}`}
                                  value={discList[idx] || ""}
                                  onChange={(e) => {
                                    const newList = [...discList];
                                    newList[idx] = e.target.value;
                                    setSelectedColaborador({
                                      ...selectedColaborador,
                                      disciplinas: newList,
                                    });
                                  }}
                                />
                              </div>
                            );
                          })}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                          {[2, 3].map((idx) => {
                            const discList =
                              selectedColaborador.disciplinas || [
                                "",
                                "",
                                "",
                                "",
                              ];
                            return (
                              <div key={idx}>
                                <label className="block text-[9px] font-bold text-gray-500 mb-1  tracking-tight">
                                  DISCIPLINA {idx + 1}
                                </label>
                                <input
                                  type="text"
                                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium h-11 text-sm"
                                  placeholder={`Disciplina ${idx + 1}`}
                                  value={discList[idx] || ""}
                                  onChange={(e) => {
                                    const newList = [...discList];
                                    newList[idx] = e.target.value;
                                    setSelectedColaborador({
                                      ...selectedColaborador,
                                      disciplinas: newList,
                                    });
                                  }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Secção 4: ALOCAÇÃO INSTITUCIONAL & CARGO DE CHEFIA E CONFIANÇAS (Card Unificado) */}
                  <div className="border border-black rounded-[2rem] p-6 md:p-8 space-y-6 relative bg-white">
                    <div className="absolute -top-3.5 left-6 bg-white px-3 flex items-center gap-3">
                      <div className="w-1 h-3.5 bg-blue-600 rounded-full inline-block"></div>
                      <h3 className="text-[11px] font-black text-blue-900 tracking-[0.18em]">
                        Alocação Institucional
                      </h3>
                      <h3 className="text-[11px] font-black text-blue-900 tracking-[0.18em] ml-2">
                        Cargo de Chefia e Confianças
                      </h3>
                      <div className="w-1 h-3.5 bg-blue-600 rounded-full inline-block"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Órgão
                        </label>
                        <select
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none bg-white font-medium h-11 text-sm"
                          value={selectedColaborador.unidade || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedColaborador({
                              ...selectedColaborador,
                              unidade: val,
                              direcao: "",
                              departamento: "",
                              reparticao: "",
                              seccao: "",
                              curso: "",
                              cursos: ["", "", "", ""],
                            });
                          }}
                        >
                          <option value="">Selecione...</option>
                          {UNIDADES_ORGANICAS_SISTEMA.map((u) => (
                            <option key={u.nome} value={u.nome}>
                              {u.nome}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Direção
                        </label>
                        <select
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none bg-white font-medium h-11 text-sm"
                          value={selectedColaborador.direcao || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const parentUnit = UNIDADES_ORGANICAS_SISTEMA.find(
                              (u) => u.direcoes?.includes(val),
                            );
                            setSelectedColaborador({
                              ...selectedColaborador,
                              direcao: val,
                              unidade: parentUnit
                                ? parentUnit.nome
                                : selectedColaborador.unidade || "",
                              departamento: "",
                              reparticao: "",
                              seccao: "",
                              curso: "",
                              cursos: ["", "", "", ""],
                            });
                          }}
                        >
                          <option value="">Selecione...</option>
                          {Array.from(
                            new Set(
                              selectedColaborador.unidade &&
                                UNIDADES_ORGANICAS_SISTEMA.find(
                                  (u) => u.nome === selectedColaborador.unidade,
                                )?.direcoes
                                ? UNIDADES_ORGANICAS_SISTEMA.find(
                                    (u) =>
                                      u.nome === selectedColaborador.unidade,
                                  )!.direcoes
                                : UNIDADES_ORGANICAS_SISTEMA.flatMap(
                                    (u) => u.direcoes,
                                  ),
                            ),
                          ).map((d, idx) => (
                            <option key={`${d}-${idx}`} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Departamento
                        </label>
                        <select
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none bg-white font-medium h-11 text-sm"
                          value={selectedColaborador.departamento || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            let inferredDir = selectedColaborador.direcao || "";
                            let inferredUni = selectedColaborador.unidade || "";
                            if (val) {
                              for (const [dKey, deptList] of Object.entries({
                                ...DEPARTAMENTOS,
                              })) {
                                if (deptList?.includes(val)) {
                                  inferredDir = dKey;
                                  const pUnit = UNIDADES_ORGANICAS_SISTEMA.find(
                                    (u) => u.direcoes?.includes(dKey),
                                  );
                                  if (pUnit) {
                                    inferredUni = pUnit.nome;
                                  }
                                  break;
                                }
                              }
                            }
                            setSelectedColaborador({
                              ...selectedColaborador,
                              departamento: val,
                              direcao:
                                inferredDir ||
                                selectedColaborador.direcao ||
                                "",
                              unidade:
                                inferredUni ||
                                selectedColaborador.unidade ||
                                "",
                              reparticao: "",
                              seccao: "",
                              curso: "",
                              cursos: ["", "", "", ""],
                            });
                          }}
                        >
                          <option value="">Selecione...</option>
                          {Array.from(
                            new Set(
                              selectedColaborador.direcao &&
                                DEPARTAMENTOS[
                                  selectedColaborador.direcao as keyof typeof DEPARTAMENTOS
                                ]
                                ? DEPARTAMENTOS[
                                    selectedColaborador.direcao as keyof typeof DEPARTAMENTOS
                                  ]
                                : Object.values(DEPARTAMENTOS).flat(),
                            ),
                          ).map((d, idx) => (
                            <option key={`${d}-${idx}`} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Repartição / Secção
                        </label>
                        <select
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none bg-white font-medium h-11 text-sm"
                          value={selectedColaborador.reparticao || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedColaborador({
                              ...selectedColaborador,
                              reparticao: val,
                              seccao: "",
                            });
                          }}
                        >
                          <option value="">Selecione...</option>
                          {Array.from(
                            new Set(
                              selectedColaborador.departamento &&
                                REPARTICOES[
                                  selectedColaborador.departamento as keyof typeof REPARTICOES
                                ]
                                ? REPARTICOES[
                                    selectedColaborador.departamento as keyof typeof REPARTICOES
                                  ]
                                : Object.values(REPARTICOES).flat(),
                            ),
                          ).map((r, idx) => (
                            <option key={`${r}-${idx}`} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Secção
                        </label>
                        <select
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none bg-white font-medium h-11 text-sm"
                          value={selectedColaborador.seccao || ""}
                          onChange={(e) =>
                            setSelectedColaborador({
                              ...selectedColaborador,
                              seccao: e.target.value,
                            })
                          }
                        >
                          <option value="">Selecione...</option>
                          {(
                            SECTORES[
                              selectedColaborador.reparticao as keyof typeof SECTORES
                            ] || []
                          )?.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                          {!SECTORES[
                            selectedColaborador.reparticao as keyof typeof SECTORES
                          ] && (
                            <>
                              <option value="Serviços Gerais">
                                Serviços Gerais
                              </option>
                              <option value="Administrativo">
                                Administrativo
                              </option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Cargo
                        </label>
                        <select
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none bg-white font-medium h-11 text-sm"
                          value={selectedColaborador.cargo || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updates: any = { cargo: val };
                            if (
                              val !== "" &&
                              val !== "Nenhum" &&
                              ((selectedColaborador.estadoMandato as string) === "Nenhum" ||
                                !selectedColaborador.estadoMandato)
                            ) {
                              updates.estadoMandato = "Em Atividade";
                            }
                            setSelectedColaborador({
                              ...selectedColaborador,
                              ...updates,
                            });
                          }}
                        >
                          <option value="">Selecione...</option>
                          {LISTA_CARGOS_CHEFIA.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Data da Nomeação
                        </label>
                        <input
                          type="date"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium h-11 text-sm"
                          value={selectedColaborador.dataMandato || ""}
                          onChange={(e) =>
                            setSelectedColaborador({
                              ...selectedColaborador,
                              dataMandato: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Data da Despromoção
                        </label>
                        <input
                          type="date"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium h-11 text-sm"
                          value={selectedColaborador.dataDespromocao || ""}
                          onChange={(e) =>
                            setSelectedColaborador({
                              ...selectedColaborador,
                              dataDespromocao: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Estado do Mandato
                        </label>
                        <select
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none bg-white font-bold h-11 text-sm text-red-600"
                          value={
                            selectedColaborador.estadoMandato === "em atividade"
                              ? "Em Atividade"
                              : selectedColaborador.estadoMandato ||
                                "Em Atividade"
                          }
                          onChange={(e) =>
                            setSelectedColaborador({
                              ...selectedColaborador,
                              estadoMandato: e.target.value as any,
                            })
                          }
                        >
                          <option value="Em Atividade">Em Atividade</option>
                          <option value="Cessado">Cessado</option>
                          <option value="Despromovido">Despromovido</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                          Estado do Colaborador
                        </label>
                        <select
                          className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none bg-white font-bold h-11 text-sm ${["Falecido", "Reformado", "Transferido", "Inativo"].includes(selectedColaborador.estado || "Ativo") ? "text-red-600" : selectedColaborador.estado === "Ativo" || !selectedColaborador.estado ? "text-green-600" : "text-blue-600"}`}
                          value={selectedColaborador.estado || "Ativo"}
                          onChange={(e) =>
                            setSelectedColaborador({
                              ...selectedColaborador,
                              estado: e.target.value as any,
                            })
                          }
                        >
                          <option value="Ativo">Ativo</option>
                          <option value="Inativo">Inativo</option>
                          <option value="Aposentado">Aposentado</option>
                          <option value="Licença">Licença</option>
                          <option value="Reformado">Reformado</option>
                          <option value="Transferido">Transferido</option>
                          <option value="Falecido">Falecido</option>
                          <option value="Nenhum">Nenhum</option>
                        </select>
                      </div>
                    </div>

                    {/* 4 CAMPOS DE SETORES DE TRABALHO PARA TÉCNICO DO SETOR */}
                    {(selectedColaborador.cargo === "Técnico do Setor" ||
                      selectedColaborador.cargoChefia === "Técnico do Setor" ||
                      (selectedColaborador.cargo || "").toLowerCase().includes("tecnico do setor") ||
                      (selectedColaborador.cargo || "").toLowerCase().includes("técnico do setor") ||
                      (selectedColaborador.cargo || "").toLowerCase().includes("tecnico do sector") ||
                      (selectedColaborador.cargo || "").toLowerCase().includes("técnico do sector")) && (
                      <div className="mt-4 p-4 bg-blue-50/60 rounded-2xl border border-blue-200/80 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200/60 pb-2">
                          <div>
                            <span className="text-xs font-black text-blue-900  tracking-wide flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                              Setores de Trabalho do Técnico (Até 4)
                            </span>
                            <p className="text-[10px] text-blue-700 font-medium">
                              Setores alocados ao departamento afetado: <strong className="text-blue-950">{selectedColaborador.departamento || "Não selecionado"}</strong>
                            </p>
                          </div>
                        </div>

                        {(() => {
                          const deptSectors = getSetoresByDepartamento(selectedColaborador.departamento);
                          const currentSectors = selectedColaborador.setoresAtribuidos || [
                            selectedColaborador.sector || "",
                            "",
                            "",
                            "",
                          ];

                          const handleSectorChange = (idx: number, val: string) => {
                            const updated = [...currentSectors];
                            while (updated.length < 4) updated.push("");
                            updated[idx] = val;
                            setSelectedColaborador({
                              ...selectedColaborador,
                              setoresAtribuidos: updated,
                              sector: updated[0] || selectedColaborador.sector || "",
                            });
                          };

                          return (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                              {[0, 1, 2, 3].map((idx) => (
                                <div key={idx} className="space-y-1">
                                  <label className="block text-[10px] font-bold text-gray-700  tracking-tight">
                                    Setor {idx + 1}
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="text"
                                      list={`gp-dept-sectors-${idx}`}
                                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium h-10 text-sm bg-white"
                                      placeholder={
                                        deptSectors.length > 0
                                          ? `Selecione ou digite o setor ${idx + 1}...`
                                          : `Setor ${idx + 1}...`
                                      }
                                      value={currentSectors[idx] || ""}
                                      onChange={(e) => handleSectorChange(idx, e.target.value)}
                                    />
                                    <datalist id={`gp-dept-sectors-${idx}`}>
                                      {deptSectors.map((s, sIdx) => (
                                        <option key={`${s}-${sIdx}`} value={s}>
                                          {s}
                                        </option>
                                      ))}
                                    </datalist>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </fieldset>

                <div className="flex justify-end gap-4 mt-8">
                  <button
                    type="button"
                    onClick={popView}
                    className="px-8 py-3 rounded-2xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all text-sm shadow-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 rounded-2xl bg-[#1d63ff] hover:bg-blue-700 text-white font-bold transition-all text-sm shadow-lg shadow-blue-500/25"
                  >
                    Guardar Alterações
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      );
    }

    if (view === "alocar" && selectedColaborador) {
      return (
        <div className="h-full bg-gray-50 flex flex-col overflow-y-auto">
          <div className="p-4 bg-white border-b border-gray-100 flex items-center gap-4 sticky top-0 z-50 shadow-sm">
            <button
              onClick={popView}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Afetação do Colaborador: {selectedColaborador.nome}
            </h1>
          </div>
          <div className="flex-1 w-full max-w-5xl mx-auto py-8 px-4">
            {isProcessing && <LoadingSpinner />}
            <RegistarFuncionarioForm
              user={user}
              initialData={selectedColaborador}
              onCancel={popView}
              onSubmit={async (data) => {
                setIsProcessing(true);
                try {
                  await handleGuardarColaborador(data);
                  popView();
                } catch (err) {
                  console.error(err);
                } finally {
                  setIsProcessing(false);
                }
              }}
            />
          </div>
        </div>
      );
    }

    if (view === "processo_form" || view === "processo_edit") {
      return (
        <div key={formKey} className="h-full">
          <IndividualProcessForm
            colaboradores={colaboradores}
            history={processos}
            activities={matrixActivities}
            initialData={
              view === "processo_edit"
                ? {
                    ...(selectedProcesso?.individualData || selectedProcesso),
                    id: selectedProcesso.id,
                  }
                : undefined
            }
            onClose={popView}
            onDelete={
              view === "processo_edit"
                ? async () => {
                    console.log("Delete triggered for:", selectedProcesso);
                    if (!selectedProcesso || !selectedProcesso.id) {
                      alert("Erro: Processo ou ID não encontrado.");
                      return;
                    }

                    setIsProcessing(true);
                    try {
                      await Promise.all([
                        firestoreService.colaboradores.delete(
                          selectedProcesso.id,
                        ),
                        firestoreService.processos.delete(selectedProcesso.id),
                      ]);
                      setColaboradores((prev) =>
                        prev.filter((c) => c.id !== selectedProcesso.id),
                      );
                      setProcessos((prev) =>
                        prev.filter((p) => p.id !== selectedProcesso.id),
                      );
                      popView();
                    } catch (err) {
                      alert("Erro ao excluir: " + err);
                    } finally {
                      setIsProcessing(false);
                    }
                  }
                : undefined
            }
            onSubmit={async (data) => {
              if ((view as string) === "processo_form" || (view as string) === "novo") {
                const matchedProcess = processos.find((p) => {
                  const nameMatches =
                    p.nome &&
                    data.nome &&
                    p.nome.toLowerCase().trim() ===
                      String(data.nome).toLowerCase().trim();
                  const nuitMatches =
                    p.nuit &&
                    data.nuit &&
                    p.nuit !== "---" &&
                    p.nuit !== "0" &&
                    String(p.nuit).trim() === String(data.nuit).trim();
                  const biToMatchSrc =
                    p.biNo || p.numeroBI || (p as any).individualData?.biNo;
                  const biToMatchData = data.biNo || (data as any).numeroBI;
                  const biMatches =
                    biToMatchSrc &&
                    biToMatchData &&
                    biToMatchSrc !== "---" &&
                    biToMatchSrc !== "0" &&
                    String(biToMatchSrc).toLowerCase().trim() ===
                      String(biToMatchData).toLowerCase().trim();

                  return nameMatches || nuitMatches || biMatches;
                });

                const matchedColab = colaboradores.find((c) => {
                  const nameMatches =
                    c.nome &&
                    data.nome &&
                    c.nome.toLowerCase().trim() ===
                      String(data.nome).toLowerCase().trim();
                  const nuitMatches =
                    c.nuit &&
                    data.nuit &&
                    c.nuit !== "---" &&
                    c.nuit !== "0" &&
                    String(c.nuit).trim() === String(data.nuit).trim();
                  const biToMatchSrc = c.numeroBI;
                  const biToMatchData = data.biNo || (data as any).numeroBI;
                  const biMatches =
                    biToMatchSrc &&
                    biToMatchData &&
                    biToMatchSrc !== "---" &&
                    biToMatchSrc !== "0" &&
                    String(biToMatchSrc).toLowerCase().trim() ===
                      String(biToMatchData).toLowerCase().trim();
                  const emailMatches =
                    c.email &&
                    data.email &&
                    c.email.trim() !== "" &&
                    c.email.trim() === data.email.trim();

                  return nuitMatches || biMatches || emailMatches;
                });

                if (matchedProcess || matchedColab) {
                  alert(
                    `Erro: O sistema detetou que os dados que quer submeter para "${data.nome}" já têm registo no sistema (NUIT, B.I. ou E-mail duplicado). A criação de dados repetidos foi bloqueada.`,
                  );
                  setFormKey((prev) => prev + 1);
                  setIsProcessing(false);
                  return;
                }
              }
              setIsProcessing(true);
              const generateId = (nome: string, nuit: string) => {
                const initials =
                  (nome || "S N")
                    .split(" ")
                    .map((w) => (w && w[0] ? w[0].toUpperCase() : ""))
                    .join("")
                    .replace(/[^A-Z]/g, "") || "";
                return `${initials}${(nuit || "").replace(/\s/g, "") || Math.floor(Math.random() * 100000).toString()}`;
              };
              const id =
                view === "processo_edit"
                  ? selectedProcesso.id
                  : data.processoIndividualNo ||
                    generateId(data.nome, data.nuit);

              // 1. Atualizar/Criar Registo no Efetivo Geral (Colaboradores)
              const finalProcessoNo =
                data.processoNo ||
                (selectedColaborador as any)?.processoNo ||
                (selectedProcesso as any)?.processoNo ||
                id;
              const finalAnoIngresso =
                data.anoIngresso ||
                (selectedColaborador as any)?.anoIngresso ||
                "";
              const processSeq = extractProcessSequence(finalProcessoNo);

              const novoColaborador: Types.Colaborador = {
                ...data,
                id: id,
                numeroProcesso: data.processoIndividualNo || id,
                processoNo: finalProcessoNo,
                anoIngresso: finalAnoIngresso,
                ord:
                  processSeq !== 999999
                    ? processSeq
                    : selectedColaborador?.ord || colaboradores.length + 1,
                nome: data.nome,
                genero: data.genero as "M" | "F",
                dataNascimento: data.dataNascimento,
                localNascimento: {
                  pais: "Moçambique",
                  provincia: data.naturalidade || "",
                  distrito: "",
                },
                nuit: data.nuit || "---",
                numeroBI: data.biNo,
                biEm: data.biEmitidoLocal,
                biEmitidoA: data.biEmitidoData,
                filiacaoPai: data.filiacaoPai,
                filiacaoMae: data.filiacaoMae,
                morada: data.morada,
                celula: data.celula,
                quarteirao: data.quarteiraoNo,
                casaNo: data.casaNo,
                telefone: data.telefone,
                numFilhos: parseInt(data.totalFilhos) || 0,
                nivelAcademico: data.habilitacoesLiterarias,
                areaFormacao: data.habilitacoesProfissionais,
                funcao: data.categoria,
                tipoContrato: data.tipoContrato,
                tipoRelacaoContractual: data.tipoRelacaoContractual,
                vinculoContractual: data.vinculoContractual,
                email:
                  data.email ||
                  `${String(data.nome || "S N")
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .split(" ")
                    .filter(Boolean)
                    .join(".")}@songo.ac.mz`,
                tipo: (data.carreira || data.tipoColaborador || "Docente") as
                  "Docente" | "CTA" | "Investigador",
                carreira: data.carreira || data.tipoColaborador || "Docente",
                efetivo:
                  typeof data.tipoRelacaoContractual === "string" &&
                  data.tipoRelacaoContractual.includes("Quadro") &&
                  !data.tipoRelacaoContractual.includes("Não"),
                unidade: data.unidade,
                direcao: data.direcao,
                departamento: data.departamento,
                reparticao: data.reparticao,
                curso: data.curso,
                cursos: data.cursos || [],
                areaDeAfetacao: (() => {
                  if (
                    data.reparticao &&
                    data.reparticao !== "Nenhum" &&
                    data.reparticao !== "-"
                  )
                    return data.reparticao;
                  if (
                    data.departamento &&
                    data.departamento !== "Nenhum" &&
                    data.departamento !== "-"
                  )
                    return data.departamento;
                  if (
                    data.direcao &&
                    data.direcao !== "Nenhum" &&
                    data.direcao !== "-"
                  )
                    return data.direcao;
                  return data.unidade || "";
                })(),
                disciplinas: data.disciplinas || [],
                cargo: data.cargo || "",
                cargoChefia:
                  !data.cargoChefia ||
                  data.cargoChefia === "Nenhum" ||
                  data.cargoChefia.toLowerCase().includes("nenhum") ||
                  data.cargoChefia === "-" ||
                  data.cargoChefia === "Sem Cargo"
                    ? "Nenhum"
                    : data.cargoChefia,
                estadoMandato:
                  !data.cargoChefia ||
                  data.cargoChefia === "Nenhum" ||
                  data.cargoChefia.toLowerCase().includes("nenhum") ||
                  data.cargoChefia === "-" ||
                  data.cargoChefia === "Sem Cargo"
                    ? "Cessado"
                    : ((data.estadoMandato || "Em Atividade") as any),
                isChefia: !(
                  !data.cargoChefia ||
                  data.cargoChefia === "Nenhum" ||
                  data.cargoChefia.toLowerCase().includes("nenhum") ||
                  data.cargoChefia === "-" ||
                  data.cargoChefia === "Sem Cargo"
                ),
              };

              // 2. Criar/Atualizar Registo na Gestão de Processos
              const novoProcesso = {
                id: id,
                numeroProcesso: data.processoIndividualNo || id,
                nome: data.nome,
                nuit: data.nuit || "---",
                seccao: data.seccao,
                dataSubmissao:
                  view === "processo_edit"
                    ? selectedProcesso.dataSubmissao
                    : new Date().toISOString(),
                processoNo: finalProcessoNo,
                anoIngresso: finalAnoIngresso,
                status:
                  view === "processo_edit"
                    ? selectedProcesso.status
                    : "Pendente",
                ficheiros: (data.ficheiros || []).map((f) => ({
                  name: f.name,
                  size: f.size,
                  type: f.type,
                  lastModified: f.lastModified,
                })),
                individualData: data,
              };

              try {
                const finalColaborador = withLastUpdate(
                  novoColaborador,
                ) as Types.Colaborador;
                if (view === "processo_edit") {
                  await Promise.all([
                    firestoreService.colaboradores.update(id, finalColaborador),
                    firestoreService.processos.update(id, novoProcesso),
                  ]);
                  setProcessos((prev) =>
                    prev.map((p) => (p.id === id ? novoProcesso : p)),
                  );
                  setColaboradores((prev) =>
                    prev.map((c) => (c.id === id ? finalColaborador : c)),
                  );
                } else {
                  await Promise.all([
                    firestoreService.colaboradores.update(id, finalColaborador),
                    firestoreService.processos.update(id, novoProcesso),
                  ]);
                  setProcessos((prev) => [novoProcesso, ...prev]);
                  setColaboradores((prev) => [finalColaborador, ...prev]);
                }

                if (hasChefiaPosition(finalColaborador)) {
                  await firestoreService.colaboradoresChefia.set(id, {
                    ...finalColaborador,
                    collabId: id,
                    updatedAt: new Date().toISOString(),
                    fonte: "Process Form Sync",
                  });
                } else {
                  try {
                    await firestoreService.colaboradoresChefia.delete(id);
                  } catch (delErr) {
                    // Ignore
                  }
                }

                pushView("gestao_processo");
                alert(
                  view === "processo_edit"
                    ? "Processo Individual atualizado com sucesso!"
                    : "Processo Individual finalizado com sucesso! Os dados foram integrados no Efetivo Geral e uma cópia digital foi arquivada na Gestão de Processos.",
                );
              } catch (e) {
                console.error("Firebase error", e);
                alert("Ocorreu um erro a salvar na base de dados (Firebase).");
              } finally {
                setIsProcessing(false);
              }
            }}
          />
        </div>
      );
    }

    if (view === "afetacao") {
      return (
        <AfetacaoView
          onClose={popView}
          colaboradores={colaboradores}
          user={user}
          onLogout={onLogout}
          onUpdateColaborador={handleGuardarColaborador}
          initialViewState={initialAfetacaoState}
          canUpdate={canRegister}
        />
      );
    }

    if (view === "gestao_processo") {
      return (
        <ProcessManagementView
          user={user}
          onBack={popView}
          processos={processos}
          onEdit={(p) => {
            setSelectedProcesso(p);
            pushView("processo_edit");
          }}
          onDelete={async (processoId: string) => {
            setIsProcessing(true);
            try {
              await firestoreService.processos.delete(processoId);
              setProcessos((prev) => prev.filter((p) => p.id !== processoId));
            } catch (err) {
              console.error(err);
              alert("Erro ao eliminar processo.");
            }
            setIsProcessing(false);
          }}
          onDeleteAll={handleDeleteAllProcessos}
          onGenerateAll={handleGenerateAllProcessos}
          onAddAnexos={async (processoId, files) => {
            setIsProcessing(true);
            const metaFiles = files.map((f) => ({
              name: f.name,
              size: f.size,
              type: f.type,
              lastModified: f.lastModified,
            }));

            const proc = processos.find((p) => p.id === processoId);
            if (proc) {
              const updatedFicheiros = [
                ...(proc.ficheiros || []),
                ...metaFiles,
              ];
              try {
                await firestoreService.processos.update(processoId, {
                  ficheiros: updatedFicheiros,
                });
                setProcessos((prev) =>
                  prev.map((p) =>
                    p.id === processoId
                      ? { ...p, ficheiros: updatedFicheiros }
                      : p,
                  ),
                );
              } catch (err) {
                console.error(err);
                alert("Erro ao adicionar anexos.");
              }
            }
            setIsProcessing(false);
            setSelectedProcesso(null);
          }}
        />
      );
    }

    return null;
  };

  return (
    <div className="h-full w-full bg-slate-50/30 flex flex-col font-sans overflow-hidden">
      <div className="flex-grow flex flex-col md:flex-row overflow-hidden p-2 md:p-4 gap-2 md:gap-4 h-full">
        {!hideSidebar && (
          <aside
            className={`bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-[0_10px_40px_rgb(0,0,0,0.04)] border border-slate-100 flex-none flex flex-col overflow-y-auto p-2 md:p-4 gap-1 md:gap-2 relative z-20 h-full scrollbar-none transition-all duration-300 ${
              isSidebarCollapsed ? "w-16 md:w-20 px-1 md:px-2" : "w-36 md:w-72"
            }`}
          >
            {/* Botão de minimização/maximização centrado no limite do submenu lateral */}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title={isSidebarCollapsed ? "Maximizar Menu Lateral" : "Minimizar Menu Lateral"}
              className="hidden md:flex absolute top-1/2 -translate-y-1/2 -right-3.5 z-40 w-7 h-7 bg-white text-slate-800 hover:bg-blue-600 hover:text-white rounded-full border-2 border-slate-200 hover:border-blue-600 shadow-xl items-center justify-center transition-all duration-300 transform hover:scale-110 focus:outline-none cursor-pointer"
            >
              {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            {!isSidebarCollapsed && (
              <div className="mb-6 px-4 py-2 border-b border-slate-100 hidden md:block">
                <h2 className="text-[10px] font-black text-slate-400 tracking-[0.2em]">
                  Repartição de Pessoal
                </h2>
              </div>
            )}
            <div className="flex flex-col gap-1">
              {sideItems.map((item) => {
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const isExpanded = expandedMenus.includes(item.id);
                const isActive =
                  view === item.id ||
                  (hasSubItems &&
                    item.subItems?.some((s: any) => s.id === view));

                return (
                  <div key={item.id} className="flex flex-col gap-1">
                    <button
                      onClick={() => {
                        if (hasSubItems) {
                          toggleMenu(item.id);
                          navigateTo(item.id);
                        } else {
                          navigateTo(item.id);
                        }
                      }}
                      className={`flex items-center gap-1 md:gap-4 p-2 md:p-3 rounded-xl text-[9px] md:text-[10px] font-black tracking-widest transition-all duration-300 group ${
                        isActive
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                      }`}
                    >
                      <div
                        className={`p-1.5 rounded-lg flex-none transition-colors ${isActive ? "bg-white/20" : "bg-slate-50 group-hover:bg-slate-100"} hidden md:block`}
                      >
                        <item.icon size={18} strokeWidth={2.5} />
                      </div>
                      {!isSidebarCollapsed && (
                        <span className="flex-grow text-left truncate">
                          {item.title}
                        </span>
                      )}
                      {hasSubItems && !isSidebarCollapsed && (
                        <ChevronRight
                          size={14}
                          className={`transition-transform duration-300 ${isExpanded ? "rotate-90" : ""}`}
                        />
                      )}
                    </button>

                    {hasSubItems && isExpanded && (
                      <div className="ml-3 md:ml-6 flex flex-col gap-1 border-l-2 border-slate-50 pl-2 md:pl-4 mt-1">
                        {item.subItems?.map((sub: any) => {
                          if (sub.isHeader) {
                            return (
                              <div
                                key={sub.id}
                                className="text-[9px] font-black  text-slate-500 mt-2 mb-0.5 tracking-wider px-1"
                              >
                                {sub.title}
                              </div>
                            );
                          }
                          const isSubSelected =
                            (view === "remuneracoes" && remuneracoesCategory === sub.id) ||
                            view === sub.id ||
                            (sub.id === "lista" && view === "lista");
                          return (
                            <button
                              key={sub.id}
                              onClick={() => navigateTo(sub.id)}
                              className={`p-2 rounded-lg text-left text-[9px] font-bold tracking-wider transition-all pl-2.5 ${
                                isSubSelected
                                  ? "text-blue-600 bg-blue-50 font-black"
                                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              {sub.title}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        )}
        <main
          className={`flex-grow h-full overflow-hidden bg-white ${!hideSidebar ? "rounded-[2rem] shadow-[0_10px_40px_rgb(0,0,0,0.04)] border border-slate-100" : ""} relative`}
        >
          <div className="h-full overflow-y-auto">{renderContent()}</div>
        </main>

        {/* Confirmation Modal overlay to fix iframe blocking */}
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-gray-100 relative overflow-hidden"
            >
              <div
                className={`absolute top-0 right-0 w-32 h-32 opacity-10 rounded-bl-full pointer-events-none ${confirmDialog.isDestructive ? "bg-red-500" : "bg-blue-500"}`}
              />

              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-2xl ${confirmDialog.isDestructive ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}
                >
                  <AlertTriangle size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">
                    {confirmDialog.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6 font-medium">
                    {confirmDialog.message}
                  </p>

                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() =>
                        setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
                      }
                      className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={confirmDialog.onConfirm}
                      className={`px-5 py-2.5 rounded-xl font-bold text-white transition-all shadow-md hover:shadow-lg ${confirmDialog.isDestructive ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" : "bg-[#0a0a5a] hover:bg-[#0a0a5a]/90 shadow-[#0a0a5a]/20"}`}
                    >
                      {confirmDialog.confirmText || "Confirmar"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

function MenuCard({
  title,
  icon: Icon,
  onClick,
  description,
  color,
  count,
  details,
}: {
  title: string;
  icon: any;
  onClick: () => void;
  description: string;
  color?: string;
  count?: number;
  details?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white p-3 rounded-xl border-2 border-gray-100 shadow-sm hover:border-blue-500 hover:shadow-md transition-all flex flex-col items-center text-center gap-1.5 group relative cursor-pointer w-full"
    >
      {count !== undefined && (
        <div className="absolute top-2 right-2 bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded-full text-[10px] shadow-2xs">
          {count}
        </div>
      )}
      <div
        className={`p-2 rounded-lg transition-colors ${color || "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white"}`}
      >
        <Icon size={16} />
      </div>
      <div className="w-full flex flex-col items-center">
        <h4 className="text-[10px] font-black text-gray-900 mb-0.5 tracking-tight ">
          {title}
        </h4>
        {description && (
          <p className="text-[8px] font-medium text-gray-500 line-clamp-2">{description}</p>
        )}
        {details && <div className="mt-1 w-full scale-95">{details}</div>}
      </div>
    </button>
  );
}

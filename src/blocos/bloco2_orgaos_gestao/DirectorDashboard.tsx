import React, { useState } from "react";
import {
  ArrowLeft,
  Maximize2,
  LogOut,
  User,
  LayoutGrid,
  FileText,
  Calendar,
  CheckSquare,
  BarChart3,
  Archive,
  FolderOpen,
  Users,
  Plus,
  GraduationCap,
  Briefcase,
  Microscope,
  DollarSign,
  Building2,
  TrendingUp,
  BarChart2,
  Pen,
  MessageSquare,
  Car,
  ClipboardList,
  ShoppingCart,
  Box,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

import BoardOverview from "../bloco2_orgaos_gestao/BoardOverview";
import CalendarView from "../bloco5_sistema/CalendarView";
import AssignActivityView from "../bloco5_sistema/AssignActivityView";
import MatrixView from "../bloco5_sistema/MatrixView";
import { MatrixActivity } from "../../types";
import MyMatrixView from "../bloco5_sistema/MyMatrixView";
import ReportsView from "../bloco7_relatorios/ReportsView";
import ActivityForm from "../bloco5_sistema/ActivityForm";
import IndividualPlanForm from "../bloco8_gerais/IndividualPlanForm";
import GestaoDocumentosView from "../bloco4_servicos_centrais/GestaoDocumentosView";
import GestaoExpedienteHistoricoView from "../bloco4_servicos_centrais/GestaoExpedienteHistoricoView";
import EstatisticaView from "../bloco7_relatorios/EstatisticaView";
import DocumentosView from "../bloco6_documentos/DocumentosView";
import LibraryManagementView from "../bloco3_unidades_organicas/LibraryManagementView";
import GestaoPessoalView from "../bloco4_servicos_centrais/GestaoPessoalView";
import GestaoSocialView from "../bloco4_servicos_centrais/GestaoSocialView";
import {
  Event,
  Expediente,
  LibraryRegistration,
  BookRegistration,
  Nota,
  FinancialData,
  Supplier,
} from "../../types";
import RecursosFinanceirosForm from "../bloco8_gerais/RecursosFinanceirosForm";
import DRADashboard from "../bloco4_servicos_centrais/DRADashboard";
import CentralOverview from "./CentralOverview";
import GestaoFormacaoView from "../bloco4_servicos_centrais/GestaoFormacaoView";
import ArchiveView from "../bloco5_sistema/ArchiveView";
import GestaoAcademicaView from "../bloco3_unidades_organicas/GestaoAcademicaView";
import GestaoAcademicaMainView from "../bloco3_unidades_organicas/GestaoAcademicaMainView";
import { BookOpen } from "lucide-react";
import {
  getRoles,
  isSuperBossUser,
  isPatrimonioBossOrAdmin,
  canAccessArea,
  getAuthorizedActivities,
} from "../../lib/auth";
import { confirmWorkspaceExit } from "../../lib/utils";
import UGEA_PlanView from "../bloco4_servicos_centrais/UGEA_PlanView";
import UGEA_SupplierManagementView from "../bloco4_servicos_centrais/UGEA_SupplierManagementView";
import UGEA_SupplierRegistrationForm from "../bloco4_servicos_centrais/UGEA_SupplierRegistrationForm";
import GestaoProdutosPrecosView from "../bloco9_produtos_precos/GestaoProdutosPrecosView";
import AssinaturaDigitalView from "../bloco5_sistema/AssinaturaDigitalView";
import CaixaMensagensView from "../bloco5_sistema/CaixaMensagensView";
import BalancoMensalView from "../bloco4_servicos_centrais/BalancoMensalView";
import BalancoCombustivelView from "../bloco4_servicos_centrais/BalancoCombustivelView";
import BalancoInventarioView from "../bloco4_servicos_centrais/BalancoInventarioView";
import BalancoAtividadesView from "../bloco4_servicos_centrais/BalancoAtividadesView";
import GestaoTransporteView from "../bloco4_servicos_centrais/GestaoTransporteView";
import PlanoWorkflowView from "../bloco5_sistema/PlanoWorkflowView";
import AcaoOrcamentalView from "../../components/AcaoOrcamentalView";
import { firestoreService } from "../../lib/firestoreService";
import MainHeader from "../bloco1_apresentacao/MainHeader";
import VisaoGeralCards from "../../components/VisaoGeralCards";
import DICOSSEROverview from "./DICOSSEROverview";
import RHStatView from "../bloco7_relatorios/RHStatisticsWorkflowView";
import BolsasEstudosView from "../bloco4_servicos_centrais/BolsasEstudosView";
import GestaoEstudantilView from "../bloco3_unidades_organicas/GestaoEstudantilView";

export default function DirectorDashboard({
  title = "Painel de Gestão",
  onBack,
  onShowAlert = () => {},
  events = [],
  onDeleteEvent,
  onUpdateEvent,
  expedientes = [],
  onDeleteExpediente,
  onUpdateExpediente,
  libraryRegistrations = [],
  bookRegistrations = [],
  onDeleteBook,
  onUpdateBook,
  financialData = [],
  setFinancialData,
  notes = [],
  onDeleteNote,
  onUpdateNote,
  onLogout = () => {},
  onAgendar = () => {},
  onNota = () => {},
  onGestaoDocumentos,
  activities = [],
  onDeleteActivity,
  matrixActivities = [],
  onDeleteMatrixActivity,
  onUpdateMatrixActivity,
  suppliers = [],
  colaboradores = [],
  processos = [],
  user = null,
  onPathChange = () => {},
  setDashboardTitle = () => {},
  initialActiveItem,
}: {
  title: string;
  onBack: () => void;
  onShowAlert: (msg: string) => void;
  events: Event[];
  onDeleteEvent?: (id: string) => Promise<any>;
  onUpdateEvent?: (id: string, data: any) => Promise<any>;
  expedientes: Expediente[];
  onDeleteExpediente?: (id: string) => Promise<any>;
  onUpdateExpediente?: (id: string, data: any) => Promise<any>;
  libraryRegistrations?: LibraryRegistration[];
  bookRegistrations?: BookRegistration[];
  onDeleteBook?: (id: string) => Promise<any>;
  onUpdateBook?: (id: string, data: any) => Promise<any>;
  financialData?: FinancialData[];
  setFinancialData?: React.Dispatch<React.SetStateAction<FinancialData[]>>;
  notes: Nota[];
  onDeleteNote?: (id: string) => Promise<any>;
  onUpdateNote?: (id: string, data: any) => Promise<any>;
  onLogout: () => void;
  onAgendar: () => void;
  onNota: () => void;
  onGestaoDocumentos?: () => void;
  activities?: MatrixActivity[];
  onDeleteActivity?: (id: string) => Promise<any>;
  matrixActivities?: MatrixActivity[];
  onDeleteMatrixActivity?: (id: string) => Promise<any>;
  onUpdateMatrixActivity?: (id: string, data: any) => Promise<any>;
  suppliers?: Supplier[];
  colaboradores?: any[];
  processos?: any[];
  user?: any;
  onPathChange?: (path: string[]) => void;
  setDashboardTitle: (title: string) => void;
  initialActiveItem?: string;
}) {
  const safeTitle = typeof title === "string" ? title : String(title || "Painel de Gestão");
  const upperTitle = safeTitle.toUpperCase();

  const isReparticaoPessoal = upperTitle === "REPARTIÇÃO DE PESSOAL";
  const isEstatisticaMain = upperTitle === "REPARTIÇÃO DE ESTATÍSTICA";
  const isUGEA =
    safeTitle === "Unidade Gestora e Executora de Aquisições" ||
    upperTitle.includes("UGEA") ||
    upperTitle.includes("AQUISIÇÕES") ||
    upperTitle.includes("AQUISICOES");

  const isPatrimonioDept =
    upperTitle.includes("PATRIM") ||
    upperTitle.includes("TRANSPOR") ||
    upperTitle.includes("INFRAESTRUTURA") ||
    upperTitle.includes("DP") ||
    upperTitle.includes("ECONOMATO") ||
    upperTitle.includes("BALANÇO") ||
    upperTitle.includes("BALANCO") ||
    isPatrimonioBossOrAdmin(user, colaboradores, processos);

  const [activeItem, setActiveItem] = useState(
    initialActiveItem ||
      (safeTitle === "Balanço"
        ? "Balanço"
        : safeTitle === "Gestão de Frota"
          ? "Gestão de Frota"
          : safeTitle === "Gestão de Viatura"
            ? "Gestão de Viatura"
            : upperTitle.includes("ARQUIVO")
              ? "Repartição de Arquivo"
              : upperTitle.includes("BOLSA")
                ? "Bolsa de Estudos"
                : isEstatisticaMain
                  ? "Corpo discente"
                  : "Visão Geral"),
  );

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["Gestão de Expediente"]);

  const toggleMenu = (menuTitle: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuTitle)
        ? prev.filter((t) => t !== menuTitle)
        : [...prev, menuTitle]
    );
  };

  React.useEffect(() => {
    if (initialActiveItem) {
      setActiveItem(initialActiveItem);
    }
  }, [initialActiveItem]);
  const [viewHistory, setViewHistory] = useState<any[]>([]);
  const [selectedPlanType, setSelectedPlanType] = useState<string | null>(null);
  const [balancoType, setBalancoType] = useState<string | null>(null);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [movements, setMovements] = useState<any[]>([]);

  const navigateTo = (newItem: string, resetSelectedPlan = true) => {
    setViewHistory((prev) => [
      ...prev,
      { activeItem, selectedPlanType, showActivityForm },
    ]);
    setActiveItem(newItem);
    if (resetSelectedPlan) {
      setSelectedPlanType(null);
      setShowActivityForm(false);
    }
  };

  const handleExitWorkspace = (callback: () => void) => {
    callback();
  };

  const selectPlan = (type: string) => {
    setViewHistory((prev) => [
      ...prev,
      { activeItem, selectedPlanType, showActivityForm },
    ]);
    if (type === "Nova matriz") {
      setShowActivityForm(true);
    } else if (type === "Plano de Atividades") {
      setSelectedPlanType("NOVA_ATIVIDADE");
    } else {
      setSelectedPlanType(type);
    }
  };

  const handleBack = () => {
    if (viewHistory.length > 0) {
      const lastState = viewHistory[viewHistory.length - 1];
      setViewHistory((prev) => prev.slice(0, -1));
      setActiveItem(lastState.activeItem);
      setDashboardTitle(lastState.activeItem);
      setSelectedPlanType(lastState.selectedPlanType);
      setShowActivityForm(lastState.showActivityForm);
    } else {
      handleExitWorkspace(onBack);
    }
  };

  const isDepartment =
    upperTitle.includes("DEPARTAMENTO") ||
    upperTitle.includes("DIVISÃO") ||
    upperTitle.includes("DIVISAO") ||
    upperTitle.includes("UNIDADE") ||
    upperTitle.includes("SECRETARIA") ||
    upperTitle.includes("CENTRO") ||
    upperTitle.includes("REPARTIÇÃO") ||
    upperTitle.includes("REPARTICAO") ||
    upperTitle.includes("SETOR") ||
    upperTitle.includes("GDG");

  const nextYear = new Date().getFullYear() + 1;
  const planLabel = isDepartment ? "Plano de Atividades" : "Matriz";

  const hasExpediente = ["SECRETARIA EXECUTIVA", "SECRETARIA GERAL"].includes(
    upperTitle,
  );

  const estatisticaSectors = [
    "PESSOAL",
    "BOLSA DE ESTUDO",
    "FORMAÇÃO",
    "FORMACAO",
    "DRA",
    "REGISTO ACADÉMICO",
    "REGISTO ACADEMICO",
    "BIBLIOTECA",
    "ARQUIVO",
    "ALOJAMENTO",
  ];
  const hasEstatistica = estatisticaSectors.some((s) =>
    upperTitle.includes(s),
  );

  const isExcludedFromNewMenu =
    upperTitle.includes("ESTATÍSTICA") ||
    upperTitle.includes("ESTATISTICA") ||
    upperTitle.includes("RELATÓRIO") ||
    upperTitle.includes("RELATORIO") ||
    upperTitle.includes("PLANO DE ATIVIDADE");

  const {
    isDG,
    isDC,
    isDCC,
    isCD,
    isCR,
    isConsRep,
    isConsAdm,
    isConsTec,
    isDICOSAFA_Dept,
    isGDG,
  } = getRoles(safeTitle);
  const isGestDoc =
    upperTitle === "GESTÃO DE DOCUMENTOS" ||
    upperTitle === "GESTÃO DE DOCUMENTOS" ||
    (["SECRETARIA EXECUTIVA"].includes(upperTitle) &&
      !isDICOSAFA_Dept);
  const isSetor =
    !isDG &&
    !isDC &&
    !isDCC &&
    !isCD &&
    !isCR &&
    !isConsRep &&
    !isConsAdm &&
    !isConsTec &&
    !isGestDoc &&
    !isEstatisticaMain &&
    !isGDG;

  const canAssignActivity =
    isDG ||
    isDC ||
    isCD ||
    (isDICOSAFA_Dept && upperTitle.includes("DEPARTAMENTO")) ||
    upperTitle === "CHEFE DO DPEP";

  const isDPEP =
    upperTitle.includes("DPEP") ||
    upperTitle.includes("PLANIFICAÇÃO") ||
    upperTitle.includes("PLANIFICACAO") ||
    upperTitle.includes("PLANEAMENTO") ||
    (user?.departamento || "").toUpperCase().includes("DPEP") ||
    (user?.departamento || "").toUpperCase().includes("PLANIFICAÇÃO") ||
    (user?.departamento || "").toUpperCase().includes("PLANEAMENTO") ||
    (user?.setor || "").toUpperCase().includes("PLANIFICAÇÃO") ||
    (user?.setor || "").toUpperCase().includes("PLANEAMENTO") ||
    (user?.reparticao || "").toUpperCase().includes("PLANIFICAÇÃO") ||
    (user?.reparticao || "").toUpperCase().includes("PLANEAMENTO");

  const isDAF =
    upperTitle.includes("DAF") ||
    upperTitle === "CHEFE DO DAF" ||
    upperTitle.includes("APOIO FINANCEIRO") ||
    upperTitle.includes("FINANÇAS") ||
    upperTitle.includes("FINANCAS") ||
    (user?.departamento || "").toUpperCase().includes("DAF") ||
    (user?.departamento || "").toUpperCase().includes("APOIO FINANCEIRO") ||
    (user?.departamento || "").toUpperCase().includes("FINANÇAS");

  const getMenuItems = () => {
    // Standard baseline for all sectors according to requirement
    const baseItems = [
      { title: "Visão Geral", icon: LayoutGrid },
      { title: isDPEP ? "Gestão de Planos" : "Plano", icon: FileText },
      { title: "Ação Orçamental", icon: DollarSign },
      { title: "Calendário", icon: Calendar },
      { title: "Caixa de Mensagens", icon: MessageSquare },
      { title: "Assinatura Digital", icon: Pen },
      {
        title: "Gestão de Expediente",
        icon: FolderOpen,
        subItems: [
          { title: "Histórico de Documentos", icon: FolderOpen },
          { title: "Documentos Normativos", icon: FileText },
          { title: "Relatórios", icon: BarChart3 },
          { title: "Balanço", icon: TrendingUp },
          { title: "Assinatura Digital", icon: Pen },
        ],
      },
      { title: "Atribuir Atividade", icon: CheckSquare },
    ];

    if (isReparticaoPessoal) {
      return [
        ...baseItems,
        { title: "Gestão de Pessoal", icon: Users },
      ];
    }

    if (isEstatisticaMain) {
      return [
        ...baseItems,
        { title: "Corpo discente", icon: GraduationCap },
        { title: "Estatística da Repartição de Pessoal", icon: Users },
        { title: "Recursos financeiro", icon: DollarSign },
        { title: "Infraestruturas", icon: Building2 },
        { title: "Previsão n+1", icon: TrendingUp },
      ];
    }

    if (isUGEA) {
      return [
        { title: "Plano", icon: FileText },
        { title: "Ação Orçamental", icon: DollarSign },
        { title: "Calendário", icon: Calendar },
        { title: "Caixa de Mensagens", icon: MessageSquare },
        { title: "Assinatura Digital", icon: Pen },
        {
          title: "Gestão de Expediente",
          icon: FolderOpen,
          subItems: [
            { title: "Histórico de Documentos", icon: FolderOpen },
            { title: "Documentos Normativos", icon: FileText },
            { title: "Relatórios", icon: BarChart3 },
            { title: "Balanço", icon: TrendingUp },
            { title: "Assinatura Digital", icon: Pen },
          ],
        },
        { title: "Atribuir Atividade", icon: CheckSquare },
        { title: "Gestão de Produtos e Preços", icon: Box },
        { title: "Gestão de Fornecedores", icon: Users },
        { title: "Plano de Aquisição", icon: FileText },
        { title: "Plano de Contratação", icon: FileText },
      ];
    }

    let items = [...baseItems];

    const isAdmin = isSuperBossUser(user);

    // Role-specific additions (Only keeping non-department specific ones if absolutely necessary, but prompt says NO DIFFERENCES for departments)
    // To strictly follow "nenhum departamento deve ser diferente desse", we will just use baseItems for typical departments.
    
    // However, some specific operational views might still need their specific tabs if they are not standard departments.
    const upperTitle = title.toUpperCase();
    const upperUserRole = (
      (user?.cargo || "") + " " +
      (user?.cargoChefia || "") + " " +
      (user?.title || "") + " " +
      (user?.role || "") + " " +
      (user?.funcao || "") + " " +
      (user?.departamento || "") + " " +
      (user?.areaDeAfetacao || "")
    ).toUpperCase();

    // Gestão de Frota e Gestão de Viatura (EXCLUSIVO PARA CHEFE DE TRANSPORTES / Repartição de Transporte)
    const isChefeTransportes =
      upperTitle.includes("TRANSPOR") ||
      upperTitle.includes("FROTA") ||
      upperTitle.includes("VIATURA") ||
      upperUserRole.includes("TRANSPOR") ||
      upperUserRole.includes("CHEFE DE TRANSPOR") ||
      upperUserRole.includes("CHEFE DO SECTOR DE TRANSPOR") ||
      upperUserRole.includes("CHEFE DA REPARTIÇÃO DE TRANSPOR") ||
      upperUserRole.includes("CHEFE DA REPARTICAO DE TRANSPOR") ||
      upperUserRole.includes("GESTOR DE FROTA") ||
      upperUserRole.includes("GESTOR DE VIATURA");

    if (isChefeTransportes) {
      if (!items.some((i) => i.title === "Gestão de Frota")) {
        items.push({ title: "Gestão de Frota", icon: Car });
      }
      if (!items.some((i) => i.title === "Gestão de Viatura")) {
        items.push({ title: "Gestão de Viatura", icon: ClipboardList });
      }
    }

    if (upperTitle.includes("BOLSA")) {
      items.unshift({ title: "Bolsa de Estudos", icon: GraduationCap });
    }

    if (upperTitle.includes("ARQUIVO")) {
      items.splice(1, 0, { title: "Repartição de Arquivo", icon: Archive });
    }

    // Verificação abrangente para Diretores de Curso e Chefe de Departamento de Disciplinas Gerais (Exclusivo, nunca no RH)
    const isRHUser =
      upperTitle.includes("RECURSOS HUMANOS") ||
      upperTitle.includes("RH") ||
      upperTitle.includes("PESSOAL") ||
      upperUserRole.includes("RECURSOS HUMANOS") ||
      upperUserRole.includes("RH") ||
      upperUserRole.includes("PESSOAL");

    const isUserCourseDirector =
      upperUserRole.includes("DIRETOR DO CURSO") ||
      upperUserRole.includes("DIRETOR DE CURSO") ||
      upperUserRole.includes("DIRECTOR DO CURSO") ||
      upperUserRole.includes("DIRECTOR DE CURSO") ||
      upperUserRole.includes("DIRETOR DOS CURSOS") ||
      upperUserRole.includes("DIRECTOR DOS CURSOS") ||
      upperUserRole.includes("DIRETOR DE CURSOS") ||
      upperUserRole.includes("DIRECTOR DE CURSOS");

    const isCourseOrAcademicTitle =
      upperTitle.includes("CURSO") ||
      upperTitle.includes("ENGENHARIA") ||
      upperTitle.includes("DEPARTAMENTO DE ENGENHARIA") ||
      upperTitle.includes("DEPARTAMENTO DE PESQUISA") ||
      upperTitle.includes("DIVISÃO DE ENGENHARIA") ||
      upperTitle.includes("DIVISAO DE ENGENHARIA") ||
      upperTitle.includes("DEE") ||
      upperTitle.includes("DECC") ||
      upperTitle.includes("DECM") ||
      upperTitle.includes("DPE") ||
      upperTitle.includes("ELETROTÉCNICA") ||
      upperTitle.includes("ELETROTECNICA") ||
      upperTitle.includes("ELETRÓNICA") ||
      upperTitle.includes("ELETRONICA") ||
      upperTitle.includes("TELECOMUNICAÇÕES") ||
      upperTitle.includes("TELECOMUNICACOES") ||
      upperTitle.includes("CONSTRUÇÃO CIVIL") ||
      upperTitle.includes("CONSTRUCO CIVIL") ||
      upperTitle.includes("CONSTRUÇÃO MECÂNICA") ||
      upperTitle.includes("CONSTRUCAO MECANICA") ||
      upperTitle.includes("HIDRÁULICA") ||
      upperTitle.includes("HIDRAULICA") ||
      upperTitle.includes("TERMOTÉCNICA") ||
      upperTitle.includes("TERMOTECNICA") ||
      upperTitle.includes("ENERGIAS RENOVÁVEIS") ||
      upperTitle.includes("ENERGIAS RENOVAVEIS") ||
      upperTitle.includes("DIRETOR DO CURSO") ||
      upperTitle.includes("DIRETOR DE CURSO") ||
      upperTitle.includes("DIRECTOR DO CURSO") ||
      upperTitle.includes("DIRECTOR DE CURSO") ||
      upperTitle.includes("LICENCIATURA");

    const isHeadGeneralDisciplines =
      upperTitle.includes("DISCIPLINAS GERAIS") ||
      upperTitle.includes("DDG") ||
      upperUserRole.includes("DISCIPLINAS GERAIS") ||
      upperUserRole.includes("DDG");

    const isAuthorizedAcademic = 
      !isRHUser && (isUserCourseDirector || isCourseOrAcademicTitle || isHeadGeneralDisciplines);

    if (isAuthorizedAcademic) {
      if (!items.some((i) => i.title === "Gestão Académica")) {
        items.push({ title: "Gestão Académica", icon: Users });
      }
    }

    // Add Gestão Estudantil exclusively for DRA / Registo Académico
    const isDRA =
      upperTitle.includes("DRA") ||
      upperTitle.includes("REGISTO ACADÉMICO") ||
      upperTitle.includes("REGISTO ACADEMICO") ||
      upperUserRole.includes("REGISTO ACADÉMICO") ||
      upperUserRole.includes("REGISTO ACADEMICO") ||
      upperUserRole.includes("DRA");

    if (isDRA) {
      if (!items.some((i) => i.title === "Gestão Estudantil")) {
        items.push({ title: "Gestão Estudantil", icon: GraduationCap });
      }
    }

    return items;
  };

  const menuItems = getMenuItems();
  const allMenuItems = menuItems; // Maybe this is what was intended?
  console.log("allMenuItems:", allMenuItems);

  const boards = [
    "Conselho De Representantes",
    "Conselho Administrativo E De Gestão",
    "Conselho Técnico E De Qualidade",
  ];

  React.useEffect(() => {
    const isPatrimonioDept =
      upperTitle.includes("PATRIM") ||
      upperTitle.includes("TRANSPOR") ||
      upperTitle.includes("INFRAESTRUTURA") ||
      upperTitle.includes("DP") ||
      upperTitle.includes("ECONOMATO") ||
      upperTitle.includes("BALANÇO") ||
      upperTitle.includes("BALANCO") ||
      isPatrimonioBossOrAdmin(user, colaboradores, processos);

    if (isPatrimonioDept) {
      const unsub =
        firestoreService.movimentos_economato.subscribe(setMovements);
      return () => {
        unsub();
      };
    }
  }, [title, user, colaboradores, processos]);

  React.useEffect(() => {
    const path = [activeItem];
    if (selectedPlanType && selectedPlanType !== "NOVA_ATIVIDADE")
      path.push(selectedPlanType);
    if (showActivityForm)
      path.push(
        activeItem === "Matriz" || activeItem === "Plano"
          ? "Registo de Atividade"
          : "Formulário",
      );
    onPathChange?.(path);
  }, [activeItem, selectedPlanType, showActivityForm, onPathChange]);

  React.useEffect(() => {
    if (!user) return;
    const isAdmin = isSuperBossUser(user);
    if (
      activeItem === "Repartição de Pessoal" ||
      activeItem === "Gestão de Pessoal"
    ) {
      if (!isAdmin && !canAccessArea(user, user.direcao, user.departamento, "Pessoal")) {
        onShowAlert("Acesso não autorizado a esta área.");
        setActiveItem("Visão Geral");
      }
    }
    if (
      activeItem === "Repartição de Arquivo" ||
      activeItem === "Arquivo Morto"
    ) {
      if (!isAdmin && !canAccessArea(user, user.direcao, user.departamento, "Arquivo")) {
        onShowAlert("Acesso não autorizado a esta área.");
        setActiveItem("Visão Geral");
      }
    }
  }, [activeItem, user, onShowAlert]);

  const [individualActivities, setIndividualActivities] = useState<
    MatrixActivity[]
  >([]);
  const [sectorActivities, setSectorActivities] = useState<MatrixActivity[]>(
    [],
  );
  const [reparticaoActivities, setReparticaoActivities] = useState<
    MatrixActivity[]
  >([]);
  const [departmentActivities, setDepartmentActivities] = useState<
    MatrixActivity[]
  >([]);
  const [directionActivities, setDirectionActivities] = useState<
    MatrixActivity[]
  >([]);
  const [institutionalActivities, setInstitutionalActivities] = useState<
    MatrixActivity[]
  >([]);

  React.useEffect(() => {
    if (!matrixActivities) return;

    const isChefeDPEPUser =
      title.toUpperCase().includes("DPEP") ||
      title.toUpperCase() === "CHEFE DO DPEP" ||
      (user?.departamento || "").toUpperCase().includes("DPEP");

    // Individual plans
    const ind = matrixActivities.filter(
      (a) =>
        a.orcamento === "Plano Individual" &&
        canAccessArea(
          user,
          a.direcao || "",
          a.departamento || "",
          a.setor || "",
        ),
    );
    setIndividualActivities(ind);

    // Sectorial Plan (draft / setorial / setor) - visible only by the sector that planned it (or DPEP)
    const sec = matrixActivities.filter((a) => {
      const isSecStatus =
        !a.status ||
        (a.status as any) === "draft" ||
        (a.status as any) === "setorial" ||
        (a.status as any) === "setor";
      if (!isSecStatus) return false;
      return canAccessArea(
        user,
        a.direcao || "",
        a.departamento || "",
        a.setor || "",
      );
    });
    setSectorActivities(sec);

    const normDept = (str: string) =>
      String(str || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/^departamento\s+(de\s+|da\s+|dos\s+|do\s+)?/i, "")
        .trim();

    const isDeptMatch = (d1?: string, d2?: string) => {
      if (!d1 || !d2) return false;
      const n1 = normDept(d1);
      const n2 = normDept(d2);
      if (!n1 || !n2) return false;
      return n1 === n2;
    };

    // Repartição Plan (reparticao)
    const rep = matrixActivities.filter((a) => {
      if (isChefeDPEPUser || isSuperBossUser(user)) return true;
      const isRepStatus = (a.status as any) === "reparticao";
      return (
        isRepStatus ||
        a.reparticao === title ||
        isDeptMatch(a.departamento, user?.departamento) ||
        isDeptMatch(a.departamento, title)
      );
    });
    setReparticaoActivities(rep);

    // Department Plan (departamento)
    const deptVal = matrixActivities.filter((a) => {
      if (isChefeDPEPUser || isSuperBossUser(user)) return true;
      return (
        isDeptMatch(a.departamento, user?.departamento) ||
        isDeptMatch(a.departamento, title) ||
        isDeptMatch(a.unidadeOrganica, title) ||
        canAccessArea(user, a.direcao || "", a.departamento || "", a.setor || "")
      );
    });
    setDepartmentActivities(deptVal);

    // Direction Plan (direcao)
    const dirVal = matrixActivities.filter(
      (a) => (a.status as any) === "direcao",
    );
    setDirectionActivities(dirVal);

    // Institutional Plan (institucional/consolidated)
    const inst = matrixActivities.filter(
      (a) =>
        (a.status as any) === "institucional" ||
        (a.status as any) === "consolidated",
    );
    setInstitutionalActivities(inst);
  }, [matrixActivities, title, user]);
  const [publishedMatrices, setPublishedMatrices] = useState<any[]>([
    {
      id: "MAT-2027-001",
      year: 2027,
      publishedAt: "2026-04-02 11:15",
      activityCount: 8,
      status: "published",
    },
    {
      id: "MAT-2026-005",
      year: 2026,
      activityCount: 12,
      status: "shared",
    },
  ]);

  const renderContent = () => {
    if (activeItem === "Gestão de Produtos e Preços") {
      return <GestaoProdutosPrecosView />;
    }

    if (isUGEA) {
      if (activeItem === "Gestão de Fornecedores") {
        return (
          <UGEA_SupplierManagementView
            onBack={handleBack}
            onAddSupplier={() => navigateTo("UGEA_SupplierForm")}
            suppliers={suppliers || []}
          />
        );
      }
      if (activeItem === "UGEA_SupplierForm") {
        return (
          <UGEA_SupplierRegistrationForm
            onBack={handleBack}
            onSubmit={async (data) => {
              try {
                await firestoreService.suppliers.add(data);
                onShowAlert("Fornecedor registado com sucesso!");
                handleBack();
              } catch (error) {
                console.error("Error adding supplier:", error);
                onShowAlert("Erro ao registar fornecedor. Tente novamente.");
              }
            }}
          />
        );
      }
      if (activeItem === "Plano de Aquisição") {
        return (
          <UGEA_PlanView
            type="Aquisicão"
            activities={matrixActivities || []}
            user={user}
            onBack={handleBack}
          />
        );
      }
      if (activeItem === "Plano de Contratação") {
        return (
          <UGEA_PlanView
            type="Contratação"
            activities={matrixActivities || []}
            user={user}
            onBack={handleBack}
          />
        );
      }
    }

    if (isEstatisticaMain) {
      if (activeItem === "Estatística da Repartição de Pessoal") {
        return <RHStatView title={title} />;
      }
      return (
        <div className="relative w-full z-[100] flex flex-col overflow-y-auto">
          <EstatisticaView
            onBack={() => onBack()}
            isReadOnly={false}
            title={title}
            hideSidebar={false}
            initialActiveItem={activeItem}
          />
        </div>
      );
    }

    if (
      activeItem === "Repartição de Pessoal" ||
      activeItem === "Gestão de Pessoal"
    ) {
      if (!isSuperBossUser(user) && !canAccessArea(user, user.direcao, user.departamento, "Pessoal")) {
        return null;
      }
      return (
        <GestaoPessoalView
          onBack={() => handleExitWorkspace(() => setActiveItem("Visão Geral"))}
          title={title}
          user={user}
          onLogout={onLogout}
          initialColaboradores={colaboradores}
          initialProcessos={processos}
          hideSidebar={true}
        />
      );
    }

    if (
      activeItem === "Repartição de Arquivo" ||
      activeItem === "Arquivo Morto"
    ) {
      if (!isSuperBossUser(user) && !canAccessArea(user, user.direcao, user.departamento, "Arquivo")) {
        return null;
      }
      return (
        <ArchiveView
          user={user}
          onBack={() => handleExitWorkspace(() => setActiveItem("Visão Geral"))}
          onShowAlert={onShowAlert}
        />
      );
    }

    if (activeItem === "Gestão de Formação") {
      return (
        <GestaoFormacaoView
          onBack={() => handleExitWorkspace(() => setActiveItem("Visão Geral"))}
        />
      );
    }

    if (activeItem === "Gestão de Social") {
      return (
        <GestaoSocialView
          onBack={() => handleExitWorkspace(() => setActiveItem("Visão Geral"))}
        />
      );
    }

    if (
      activeItem === "Gestão de Documentos" ||
      activeItem === "Gestão de Expediente" ||
      activeItem === "Histórico de Documentos" ||
      activeItem === "Histórico de Documentos Internos" ||
      activeItem === "Documentos Normativos" ||
      activeItem === "Relatórios" ||
      activeItem === "Balanço" ||
      (activeItem === "Gestão de Expedientes" && hasExpediente)
    ) {
      return (
        <div className="fixed inset-0 z-50 bg-[#050a1a] w-full h-full flex flex-col">
          <GestaoExpedienteHistoricoView
            onBack={() => handleExitWorkspace(() => setActiveItem("Visão Geral"))}
            expedientes={expedientes}
            onUpdateExpediente={(updated: any) =>
              onUpdateExpediente?.(updated.id, updated)
            }
            user={user}
            title={title}
            initialTab={
              activeItem === "Documentos Normativos" ||
              activeItem === "Relatórios" ||
              activeItem === "Balanço" ||
              (activeItem as string) === "Assinatura Digital" ||
              activeItem === "Histórico de Documentos"
                ? activeItem
                : "Histórico de Documentos"
            }
            activities={matrixActivities || []}
            onNavigate={(item) => {
              setActiveItem(item);
            }}
          />
        </div>
      );
    }

    if (
      activeItem === "Calendário" ||
      activeItem === "Calendario" ||
      activeItem === "Calendar" ||
      activeItem === "Agenda" ||
      activeItem === "Calendário de Atividades" ||
      activeItem === "Calendario de Atividades"
    ) {
      return (
        <CalendarView
          events={events}
          onAddEvent={(evt) => firestoreService.events.add(evt)}
          onUpdateEvent={onUpdateEvent}
          onDeleteEvent={onDeleteEvent}
          onAgendar={onAgendar}
          onNota={onNota}
          title={title}
          notes={notes}
          user={user}
        />
      );
    }

    if (activeItem === "Assinatura Digital") {
      return <AssinaturaDigitalView onBack={handleBack} user={user} />;
    }

    if (activeItem === "Ação Orçamental") {
      return (
        <AcaoOrcamentalView
          user={user}
          title={title}
          activities={matrixActivities || []}
          onShowAlert={onShowAlert}
        />
      );
    }

    if (activeItem === "Caixa de Mensagens") {
      return (
        <CaixaMensagensView
          departmentTitle={title}
          user={user}
          colaboradores={colaboradores}
        />
      );
    }

    if (activeItem === "Atribuir Atividade") {
      return (
        <AssignActivityView
          directorTitle={title}
          colaboradores={colaboradores}
        />
      );
    }

    if (
      activeItem === "Gestão de Planos" ||
      activeItem === "Matriz" ||
      activeItem === "Plano" ||
      activeItem === "Plano de Atividades" ||
      activeItem === "Planos de Atividades" ||
      activeItem === "Plano de Atividades" ||
      activeItem === "Plano de Atividade" ||
      activeItem === "Plano de Atividade" ||
      activeItem === "Plano da Direção" ||
      activeItem === "Meu Plano Individual" ||
      activeItem === "Plano do Gabinete" ||
      activeItem === "Plano Setorial" ||
      activeItem === "Planos" ||
      activeItem === "Planificação" ||
      activeItem === "Planificação de Atividades" ||
      activeItem === "Matriz de Atividades"
    ) {
      return (
        <PlanoWorkflowView
          user={user}
          title={title}
          matrixActivities={matrixActivities || []}
          onAddMatrixActivity={(data: any) =>
            firestoreService.matrixActivities.add(data)
          }
          onUpdateMatrixActivity={(id: string, data: any) =>
            firestoreService.matrixActivities.update(id, data)
          }
          onShowAlert={onShowAlert}
          onBack={handleBack}
        />
      );
    }

    if (activeItem === "Minha Matriz") {
      return <MyMatrixView onShowAlert={onShowAlert} />;
    }

    if (activeItem === "Meu Plano Individual") {
      return (
        <MatrixView
          title="Meu Plano Individual"
          isDepartment={isDepartment}
          externalActivities={individualActivities}
          setExternalActivities={setIndividualActivities}
          onActivityAdded={(a) => firestoreService.matrixActivities.add(a)}
          onUpdateActivity={onUpdateMatrixActivity}
          onDeleteActivity={onDeleteMatrixActivity}
        />
      );
    }

    if (activeItem === "Gestão Académica") {
      return (
        <GestaoAcademicaMainView
          title={title}
          user={user}
          onBack={() => setActiveItem("Visão Geral")}
          onShowAlert={onShowAlert}
        />
      );
    }

    if (activeItem === "Gestão Estudantil") {
      return (
        <GestaoEstudantilView
          user={user}
          onBack={() => setActiveItem("Visão Geral")}
          title="Gestão Estudantil"
        />
      );
    }

    if (
      activeItem === "Gestão de Frota" ||
      activeItem === "Gestão de Viatura"
    ) {
      return (
        <div className="absolute inset-0 bg-white z-50 flex flex-col pt-4">
          <GestaoTransporteView
            user={user}
            onBack={() => setActiveItem("Visão Geral")}
            initialTab={
              activeItem === "Gestão de Frota"
                ? "gestao_frota"
                : "gestao_viatura"
            }
          />
        </div>
      );
    }

    if (activeItem === "Relatórios") {
      return (
        <ReportsView
          user={user}
          onShowAlert={onShowAlert}
          initialDirection={title}
          onBack={() => setActiveItem("Visão Geral")}
        />
      );
    }

    if (activeItem === "Balanço") {
      return (
        <BalancoAtividadesView
          activities={activities || []}
          user={user}
          onBack={() => setActiveItem("Visão Geral")}
          sectorTitle={title}
        />
      );
    }

    if (activeItem === "Documentos Normativos") {
      return <DocumentosView title={title} user={user} />;
    }

    if (
      activeItem === "Bolsa de Estudos" ||
      (upperTitle.includes("BOLSA") &&
        (activeItem === "Visão Geral" || activeItem === "Bolsa de Estudos"))
    ) {
      return (
        <BolsasEstudosView
          title={safeTitle}
          user={user}
          viewMode={activeItem === "Visão Geral" ? "summary" : "form"}
          onEstatistica={() => navigateTo("Estatística")}
        />
      );
    }

    if (activeItem === "Estatística") {
      const titleUpper = upperTitle;

      // If it's the Finance Head, show the specific form
      if (titleUpper.includes("FINANÇAS")) {
        return (
          <div className="absolute inset-0 bg-white z-50 flex flex-col pt-4">
            <RecursosFinanceirosForm
              onClose={() => setActiveItem("Visão Geral")}
              onSubmit={async (data) => {
                try {
                  await firestoreService.financialData.add(data);
                  if (setFinancialData) {
                    setFinancialData((prev) => [...prev, data]);
                  }
                  onShowAlert(
                    "Dados financeiros enviados com sucesso para a Repartição de Estatística!",
                  );
                  setActiveItem("Visão Geral");
                } catch (error) {
                  console.error("Error adding financial data:", error);
                  onShowAlert(
                    "Erro ao enviar dados financeiros. Tente novamente.",
                  );
                }
              }}
            />
          </div>
        );
      }

      let allowedCategories: string[] | null = null;
      if (titleUpper.includes("PESSOAL"))
        allowedCategories = [
          "Corpo Docente",
          "Corpo Técnico Administrativo",
          "Investigadores",
        ];
      if (titleUpper.includes("BOLSA"))
        allowedCategories = ["Estudantes Bolseiros"];
      if (
        titleUpper.includes("REGISTO ACADÉMICO") ||
        titleUpper.includes("REGISTO ACADEMICO") ||
        titleUpper.includes("DRA")
      )
        allowedCategories = ["Corpo discente (matrícula até graduação)"];
      if (titleUpper.includes("ALOJAMENTO"))
        allowedCategories = [
          "Estudantes internados (por idade, província e gênero)",
        ];
      if (titleUpper.includes("BIBLIOTECA")) allowedCategories = ["Biblioteca"];
      if (titleUpper.includes("ARQUIVO")) allowedCategories = ["Arquivo"];
      if (titleUpper.includes("FORMAÇÃO") || titleUpper.includes("FORMACAO"))
        allowedCategories = ["Formação"];
      if (titleUpper.includes("REPARTIÇÃO DE ESTATÍSTICA")) {
        allowedCategories = [
          "Corpo Discente",
          "Corpo Docente",
          "CTA",
          "Investigadores",
          "Finanças",
          "Previsão N+1",
          "Infraestrutura",
          "Biblioteca",
          "Tic",
        ];
      }

      return (
        <div className="w-full h-full flex flex-col">
          <EstatisticaView
            onBack={() => setActiveItem("Visão Geral")}
            isReadOnly={false}
            allowedCategories={allowedCategories}
            title={title}
            financialData={financialData}
            initialActiveItem={
              title.toUpperCase().includes("BOLSA") ? "Bolsa" : undefined
            }
            hideHeader={true}
            hideFooter={true}
          />
        </div>
      );
    }

    if (
      activeItem === "Gestão de Fornecedores" ||
      activeItem === "Fornecedores"
    ) {
      return (
        <div className="absolute inset-0 bg-white z-50 flex flex-col">
          <UGEA_SupplierManagementView
            onBack={handleBack}
            suppliers={suppliers || []}
            onAddSupplier={() => navigateTo("SupplierRegistration")}
            onShowAlert={onShowAlert}
          />
        </div>
      );
    }

    if (
      activeItem === "Registo de Fornecedores" ||
      activeItem === "Registo de Fornecedor" ||
      activeItem === "Formulário de Registo de Fornecedores" ||
      activeItem === "Formulário de Registo de Fornecedor" ||
      activeItem === "SupplierRegistration" ||
      activeItem === "UGEA_SupplierForm"
    ) {
      return (
        <div className="absolute inset-0 bg-white z-50 flex flex-col">
          <UGEA_SupplierRegistrationForm
            onBack={handleBack}
            onSubmit={async (supplierData) => {
              await firestoreService.suppliers.add(supplierData);
              onShowAlert("Fornecedor registado com sucesso!");
              handleBack();
            }}
          />
        </div>
      );
    }

    if (activeItem === "Caixa de Mensagens") {
      return (
        <CaixaMensagensView
          departmentTitle={title}
          user={user}
          colaboradores={colaboradores}
        />
      );
    }

    if (upperTitle === "GESTÃO DE BIBLIOTECA" || upperTitle === "GESTÃO DE BIBLIOTECA") {
      return (
        <LibraryManagementView
          registrations={libraryRegistrations || []}
          bookRegistrations={bookRegistrations || []}
        />
      );
    }

    if (activeItem === "Visão Geral") {
      return (
        <VisaoGeralCards onNavigate={navigateTo} user={user} title={title} />
      );
    }

    return (
      <div className="w-full max-w-4xl border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center text-gray-500">
        <LayoutGrid size={48} className="mx-auto mb-4 opacity-50" />
        <p>
          Bem-vindo ao Gabinete do {title}. Selecione uma opção no menu lateral.
        </p>
      </div>
    );
  };

  return (
    <div className="flex h-full bg-gray-50 flex-col md:flex-row overflow-hidden font-sans relative">
      <div
        className={`bg-slate-900 text-white flex flex-row md:flex-col shadow-xl shrink-0 gap-2 md:gap-0 z-20 transition-all duration-300 relative ${
          isSidebarCollapsed
            ? "w-full md:w-16 p-2 md:p-2 overflow-x-auto md:overflow-y-auto no-scrollbar"
            : "w-full md:w-64 p-2 md:p-4 overflow-x-auto md:overflow-y-auto no-scrollbar"
        }`}
      >
        {/* Botão de minimização/maximização centrado no limite entre o submenu lateral e a área de trabalho */}
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          title={isSidebarCollapsed ? "Maximizar Menu Lateral" : "Minimizar Menu Lateral"}
          className="hidden md:flex absolute top-1/2 -translate-y-1/2 -right-3.5 z-40 w-7 h-7 bg-white text-slate-900 hover:bg-blue-600 hover:text-white rounded-full border-2 border-slate-300 hover:border-blue-600 shadow-xl items-center justify-center transition-all duration-300 transform hover:scale-110 focus:outline-none cursor-pointer"
        >
          {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className="flex-1 flex flex-row md:flex-col space-y-0 md:space-y-2 gap-2 md:gap-0 min-w-max md:min-w-0">
          {isDPEP && !isSidebarCollapsed && (
            <div className="hidden md:block mb-4 px-3">
              <h3 className="text-amber-500 font-black text-[11px] tracking-[0.2em]  border-b border-slate-700/50 pb-2">
                Gestão de Plano
              </h3>
            </div>
          )}
          {menuItems.map((item: any) => {
            const hasChildren = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedMenus.includes(item.title);
            const isParentActive =
              activeItem === item.title ||
              (hasChildren && item.subItems.some((s: any) => s.title === activeItem));

            return (
              <div key={item.title} className="w-full flex flex-col">
                <div className="w-full flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (hasChildren && !isSidebarCollapsed) {
                        toggleMenu(item.title);
                      }
                      navigateTo(item.title);
                    }}
                    title={item.title}
                    className={`w-auto md:w-full flex flex-none items-center justify-between gap-3 p-2 md:p-3 rounded-xl transition-all text-left ${
                      isSidebarCollapsed ? "md:justify-center md:p-2.5" : ""
                    } ${
                      isParentActive
                        ? "bg-slate-800 text-white font-bold"
                        : "bg-transparent hover:bg-slate-800 text-slate-300 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={20} className="shrink-0" />
                      {!isSidebarCollapsed && (
                        <span className="text-xs md:text-sm whitespace-nowrap md:whitespace-normal">
                          {item.title}
                        </span>
                      )}
                    </div>

                    {!isSidebarCollapsed && hasChildren && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMenu(item.title);
                        }}
                        className="p-1 hover:bg-slate-700 rounded-md transition-colors"
                      >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </span>
                    )}
                  </button>
                </div>

                {/* SUBMENU ITEMS */}
                {!isSidebarCollapsed && hasChildren && isExpanded && (
                  <div className="ml-4 pl-3 my-1 border-l-2 border-slate-700/60 flex flex-col space-y-1">
                    {item.subItems.map((sub: any) => {
                      const isSubActive = activeItem === sub.title;
                      const SubIcon = sub.icon;
                      return (
                        <button
                          key={sub.title}
                          type="button"
                          onClick={() => navigateTo(sub.title)}
                          title={sub.title}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left ${
                            isSubActive
                              ? "bg-blue-600 text-white shadow-sm font-bold"
                              : "bg-transparent text-slate-400 hover:text-white hover:bg-slate-800/70"
                          }`}
                        >
                          <SubIcon size={14} className={isSubActive ? "text-white" : "text-slate-400"} />
                          <span className="truncate">{sub.title}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto flex flex-col relative w-full h-full ${
        activeItem === "Caixa de Mensagens" ||
        activeItem === "Estatística" ||
        activeItem === "Bolsa de Estudos"
          ? "p-0"
          : "p-4 md:p-8"
      }`}>
        {(activeItem === "Plano de Atividades" ||
          activeItem === "Plano da Direção") &&
          selectedPlanType &&
          selectedPlanType !== "Plano Individual" && (
            <button
              onClick={handleBack}
              className="mb-6 text-blue-600 font-black text-xs tracking-widest hover:underline flex items-center gap-2 self-start"
            >
              ← Voltar à seleção de plano
            </button>
          )}

        {activeItem !== "Caixa de Mensagens" && activeItem !== "Estatística" && activeItem !== "Bolsa de Estudos" && (
          <h2 className="text-2xl font-bold text-slate-800 mb-6 font-serif tracking-tight">
            {title} - {activeItem}
          </h2>
        )}

        <div className="flex-1 min-h-0 w-full flex flex-col">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

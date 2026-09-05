import React, { useState } from "react";
import {
  ArrowLeft,
  Maximize2,
  LogOut,
  Power,
  User,
  FileText,
  DollarSign,
  ChevronRight,
  BookOpen,
  LayoutGrid,
} from "lucide-react";
import LibraryVisitForm from "../bloco3_unidades_organicas/LibraryVisitForm";
import BookRegistrationForm from "../bloco3_unidades_organicas/BookRegistrationForm";
import ArchiveView from "../bloco5_sistema/ArchiveView";

import { LibraryRegistration, BookRegistration } from "../../types";
import { isSuperBossUser, isPatrimonioBossOrAdmin } from "../../lib/auth";
import MainHeader from "../bloco1_apresentacao/MainHeader";
import { UNIDADES_ORGANICAS_SISTEMA, DEPARTAMENTOS } from "../../constants/formOptions";

const getActivityValue = (act: any) => {
  let actVal = 0;
  let hasRub = false;
  if (Array.isArray(act.rubricas) && act.rubricas.length > 0) {
    const rSum = act.rubricas.reduce(
      (acc: number, r: any) =>
        acc + Number(r.valorTotal || r.total || r.valor || r.precoTotal || 0),
      0
    );
    if (rSum > 0) {
      actVal += rSum;
      hasRub = true;
    }
  }
  if (!hasRub) {
    actVal += Number(
      act.valor ||
        act.orcamentoTotal ||
        act.valorTotal ||
        act.orcamento ||
        act.custoTotal ||
        0
    );
  }
  return actVal;
};

const calculateScopeBudget = (currentTitle: string, activities: any[]) => {
  const titleUpper = (currentTitle || "").trim().toUpperCase();

  if (
    !currentTitle ||
    titleUpper.includes("SELECIONE A ÁREA") ||
    titleUpper.includes("CURSOS") ||
    titleUpper === "MENU PRINCIPAL" ||
    titleUpper === "INSTITUCIONAL"
  ) {
    return activities.reduce((sum, act) => sum + getActivityValue(act), 0);
  }

  const matchedOrgan = UNIDADES_ORGANICAS_SISTEMA.find(
    (u) => u.nome.toUpperCase() === titleUpper || u.id.toUpperCase() === titleUpper
  );

  if (matchedOrgan) {
    return activities.reduce((sum, act) => {
      const actDir = String(act.direcao || act.direccao || act.unidadeOrganica || "").trim().toUpperCase();
      const actDept = String(act.departamento || act.unidade || act.solicitante || "").trim().toUpperCase();
      const actOrg = String(act.orgao || "").trim().toUpperCase();

      const belongsToOrgan = matchedOrgan.direcoes.some((dir) => {
        const dirUp = dir.toUpperCase();
        if (actDir === dirUp || actOrg === dirUp) return true;
        const subDepts = DEPARTAMENTOS[dir] || [];
        if (subDepts.some(sd => sd.toUpperCase() === actDept)) return true;
        return false;
      });

      return belongsToOrgan ? sum + getActivityValue(act) : sum;
    }, 0);
  }

  const matchedDeptKey = Object.keys(DEPARTAMENTOS).find(
    (k) => k.toUpperCase() === titleUpper
  );

  if (matchedDeptKey) {
    const subDepts = DEPARTAMENTOS[matchedDeptKey] || [matchedDeptKey];
    return activities.reduce((sum, act) => {
      const actDir = String(act.direcao || act.direccao || act.unidadeOrganica || "").trim().toUpperCase();
      const actDept = String(act.departamento || act.unidade || act.solicitante || act.orgao || "").trim().toUpperCase();

      const matches =
        actDir === titleUpper ||
        actDept === titleUpper ||
        actDir === matchedDeptKey.toUpperCase() ||
        subDepts.some((sd) => sd.toUpperCase() === actDept || sd.toUpperCase() === actDir);

      return matches ? sum + getActivityValue(act) : sum;
    }, 0);
  }

  // Strict exact matching for specific sector/department/reparticao without loose substring matches
  return activities.reduce((sum, act) => {
    const actDir = String(act.direcao || act.direccao || act.unidadeOrganica || "").trim().toUpperCase();
    const actDept = String(act.departamento || act.unidade || act.solicitante || act.orgao || act.setor || act.reparticao || "").trim().toUpperCase();

    const matches =
      actDir === titleUpper ||
      actDept === titleUpper ||
      String(act.solicitante || "").trim().toUpperCase() === titleUpper ||
      String(act.setor || "").trim().toUpperCase() === titleUpper ||
      String(act.reparticao || "").trim().toUpperCase() === titleUpper;

    return matches ? sum + getActivityValue(act) : sum;
  }, 0);
};

export default function SubMenu({
  title,
  items,
  onBack,
  onNavigate,
  onShowAlert,
  onLibrarySubmit,
  onBookSubmit,
  onLogout,
  bookRegistrations = [],
  events = [],
  onAddEvent = async () => {},
  onUpdateEvent = async () => {},
  onDeleteEvent = async () => {},
  onAgendar = () => {},
  onNota = () => {},
  onPlanoSetorial,
  onRelatorioAnual,
  onTetoOrcamental,
  notes = [],
  matrixActivities = [],
  user,
}: {
  title: string;
  items: {
    title: string;
    subItems?: { title: string; accessible?: boolean }[];
    accessible?: boolean;
  }[];
  onBack: () => void;
  onNavigate?: (
    title: string,
    items: { title: string; accessible?: boolean }[],
  ) => void;
  onShowAlert: (msg: string) => void;
  onLibrarySubmit?: (reg: LibraryRegistration) => void;
  onBookSubmit?: (book: BookRegistration) => void;
  onLogout: () => void;
  bookRegistrations?: BookRegistration[];
  events?: any[];
  onAddEvent?: (e: any) => Promise<any>;
  onUpdateEvent?: (id: string, data: any) => Promise<any>;
  onDeleteEvent?: (id: string) => Promise<any>;
  onAgendar?: () => void;
  onNota?: () => void;
  onPlanoSetorial?: () => void;
  onRelatorioAnual?: () => void;
  onTetoOrcamental?: () => void;
  notes?: any[];
  matrixActivities?: any[];
  user?: any;
}) {
  const [showLibraryVisitForm, setShowLibraryVisitForm] = useState(false);
  const [showBookRegistrationForm, setShowBookRegistrationForm] =
    useState(false);
  const [showArchiveView, setShowArchiveView] = useState(false);

  const totalActivitiesCount = matrixActivities.length;
  const totalBudgetAmount = calculateScopeBudget(title, matrixActivities);
  const formattedBudget =
    totalBudgetAmount.toLocaleString("pt-MZ", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " MZN";

  if (showLibraryVisitForm) {
    const initialType =
      user?.role === "Estudante"
        ? "Estudante"
        : user?.role === "Docente"
          ? "Docente"
          : user?.role === "CTA"
            ? "CTA"
            : "Externo";

    return (
      <LibraryVisitForm
        onBack={() => setShowLibraryVisitForm(false)}
        onSubmit={onLibrarySubmit}
        bookRegistrations={bookRegistrations}
        initialTipoVisitante={initialType}
        user={user}
      />
    );
  }

  if (showBookRegistrationForm) {
    return (
      <BookRegistrationForm
        onBack={() => setShowBookRegistrationForm(false)}
        onSubmit={onBookSubmit}
      />
    );
  }

  if (showArchiveView) {
    return (
      <ArchiveView
        user={user}
        onBack={() => setShowArchiveView(false)}
        onShowAlert={onShowAlert}
      />
    );
  }

  const titleUpper = title.toUpperCase();
  const isServicosCentrais = titleUpper.includes("UNIDADE ORGÂNICA") || titleUpper.includes("UNIDADE ORGANICA");
  const isGabineteDG =
    titleUpper.includes("GABINETE DO DIRETOR") ||
    titleUpper.includes("GABINETE DO DIRECTOR") ||
    titleUpper.includes("DIRETOR-GERAL") ||
    titleUpper.includes("DIRECTOR-GERAL");
  const isDICOSAFA =
    titleUpper.includes("DICOSAFA") || titleUpper.includes("DICOSSAFA");
  const isDICOSSER = titleUpper.includes("DICOSSER");
  const isRH =
    titleUpper.includes("RECURSOS HUMANOS") ||
    titleUpper === "Departamento De Recursos Humanos";
  const isFinancas =
    titleUpper.includes("FINANÇAS") ||
    titleUpper.includes("FINANCAS") ||
    titleUpper === "Departamento De Finanças";
  const isPatrimonio =
    titleUpper.includes("PATRIMÓNIO") ||
    titleUpper.includes("PATRIMONIO") ||
    titleUpper === "Departamento De Património";
  const isSecretariaGeral =
    titleUpper.includes("SECRETARIA GERAL") ||
    titleUpper === "Secretaria Geral";
  const isTIC =
    titleUpper.includes("TIC") || titleUpper === "Departamento Tic";
  const isLarEstudantes =
    titleUpper.includes("LAR DE ESTUDANTES") ||
    titleUpper === "Departamento Lar De Estudantes";
  const isProducaoAlimentar =
    titleUpper.includes("PRODUÇÃO ALIMENTAR") ||
    titleUpper.includes("PRODUCAO ALIMENTAR") ||
    titleUpper === "Departamento De Produção Alimentar";
  const isBiblioteca =
    titleUpper.includes("BIBLIOTECA") ||
    titleUpper === "Departamento De Biblioteca" ||
    titleUpper === "Atendimento Da Biblioteca" ||
    titleUpper === "Gestão De Biblioteca";
  const isRegistoAcademico =
    titleUpper.includes("REGISTO ACADÉMICO") ||
    titleUpper.includes("REGISTO ACADEMICO") ||
    titleUpper === "Departamento De Registo Académico" ||
    titleUpper === "Atendimento Estudantil" ||
    titleUpper === "Gestão Estudantil";
  const isAssuntosEstudantis =
    titleUpper.includes("ASSUNTOS ESTUDANTIS") ||
    titleUpper === "Departamento De Assuntos Estudantis";
  const isEngenharia =
    titleUpper.includes("DIVISÃO DE ENGENHARIA") ||
    titleUpper.includes("DIVISAO DE ENGENHARIA") ||
    titleUpper.includes("ENGENHARIA") ||
    titleUpper === "Divisão De Engenharia";
  const isCursos =
    titleUpper.includes("ELETROTÉCNICA") ||
    titleUpper.includes("ELETROTECNICA") ||
    titleUpper.includes("CONSTRUÇÃO CIVIL") ||
    titleUpper.includes("CONSTRUCAO CIVIL") ||
    titleUpper.includes("MECÂNICA") ||
    titleUpper.includes("MECANICA") ||
    titleUpper === "Departamento De Engenharia Eletrotécnica" ||
    titleUpper === "Departamento De Engenharia De Construção Civil" ||
    titleUpper === "Departamento De Engenharia De Construção Mecânica";
  const isUnidadesOrganicas =
    titleUpper.includes("UNIDADE ORGÂNICA") ||
    titleUpper.includes("UNIDADE ORGANICA") ||
    titleUpper.includes("Unidade orgânica");
  const isCIE =
    titleUpper.includes("INCUBAÇÃO DE EMPRESAS") ||
    titleUpper.includes("INCUBACAO DE EMPRESAS") ||
    titleUpper.includes("CENTRO DE INCUBAÇÃO") ||
    titleUpper.includes("CENTRO DE INCUBACAO") ||
    titleUpper === "Centro De Incubação De Empresas";

  const isDepartmentalLayout =
    isGabineteDG ||
    isDICOSAFA ||
    isDICOSSER ||
    isRH ||
    isFinancas ||
    isPatrimonio ||
    isSecretariaGeral ||
    isTIC ||
    isLarEstudantes ||
    isProducaoAlimentar ||
    isBiblioteca ||
    isRegistoAcademico ||
    isAssuntosEstudantis ||
    isEngenharia ||
    isCursos ||
    isCIE ||
    isUnidadesOrganicas;

  const isOrangeTheme =
    isDICOSAFA ||
    isDICOSSER ||
    isRH ||
    isFinancas ||
    isPatrimonio ||
    isSecretariaGeral ||
    isTIC ||
    isLarEstudantes ||
    isProducaoAlimentar ||
    isBiblioteca ||
    isRegistoAcademico ||
    isAssuntosEstudantis;
  const isGreenTheme = isUnidadesOrganicas || isEngenharia || isCursos || isCIE;
  const hasTopRightButton =
    isRH ||
    isFinancas ||
    isPatrimonio ||
    isSecretariaGeral ||
    isTIC ||
    isLarEstudantes ||
    isProducaoAlimentar ||
    isBiblioteca ||
    isRegistoAcademico ||
    isAssuntosEstudantis;
  const hasTopCenterButtons =
    isDICOSAFA || isDICOSSER || isEngenharia || isCIE || isBiblioteca;

  const displayItems = items.filter(
    (item) => item && item.title && String(item.title).trim() !== "",
  );

  const getGridClassesAndMaxWidth = () => {
    const len = displayItems.length;
    if (len === 5) {
      return {
        grid: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
        maxWidth: "max-w-6xl"
      };
    }
    if (len === 6) {
      return {
        grid: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        maxWidth: "max-w-4xl"
      };
    }
    if (len === 8) {
      return {
        grid: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        maxWidth: "max-w-5xl"
      };
    }
    if (len === 3) {
      return {
        grid: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        maxWidth: "max-w-4xl"
      };
    }
    if (len === 2) {
      return {
        grid: "grid-cols-1 sm:grid-cols-2",
        maxWidth: "max-w-2xl"
      };
    }
    if (len === 1) {
      return {
        grid: "grid-cols-1",
        maxWidth: "max-w-sm"
      };
    }
    return {
      grid: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
      maxWidth: "max-w-5xl"
    };
  };

  const { grid: gridClass, maxWidth: maxWidthClass } = getGridClassesAndMaxWidth();

  const defaultColors = [
    "bg-[#5842ff]",
    "bg-[#5865ff]",
    "bg-[#7e8aff]",
    "bg-[#7e65ff]",
    "bg-[#8a8aff]",
  ];

  const orangeColors = [
    "bg-[#d35400]", // Darker Orange
    "bg-[#e67e22]", // Orange
    "bg-[#f39c12]", // Light Orange
    "bg-[#f1c40f]", // Yellow
    "bg-[#e08e36]", // Muted Orange
    "bg-[#f5b041]", // Soft Orange
  ];

  const greenColors = [
    "bg-[#059669]", // Emerald 600
    "bg-[#10b981]", // Emerald 500
    "bg-[#059669]", // Emerald 600
  ];

  const colors = isOrangeTheme
    ? orangeColors
    : isGreenTheme
      ? greenColors
      : defaultColors;

  const isAllowed = (_item: any) => {
    return true;
  };

  return (
    <div className="flex-1 min-h-0 w-full bg-[#f8f9fa] flex flex-col p-1 sm:p-2 overflow-y-auto">
      <main className="w-full max-w-6xl mx-auto flex flex-col items-center py-2">
        {/* Top Header / Back Button */}
        <div className="w-full mb-3 sm:mb-5 flex flex-col items-center">
          <div className="flex flex-col items-center justify-center w-full gap-4 text-center">
            <div className="text-center">
              <h2 className="text-xl sm:text-3xl font-black text-amber-600 hover:text-amber-500 transition-colors cursor-pointer mb-1 sm:mb-2 tracking-tight font-serif inline-block bg-transparent focus:bg-transparent active:bg-transparent hover:bg-transparent border-0 outline-none select-none">
                {isCursos ? "Cursos Disponíveis" : "Selecione a Área"}
              </h2>
              <p className="text-xs sm:text-base text-slate-600 font-medium font-serif italic">
                {isCursos
                  ? "Selecione um curso para ver mais detalhes."
                  : "Navegue pelas repartições e setores disponíveis."}
              </p>
            </div>
          </div>

          {/* Action Buttons matching the requested layout */}
          <div className="flex flex-col items-center gap-3 mt-4 w-full max-w-xl mx-auto px-4">
            {/* Teto Orçamental Button */}
            <button
              onClick={() =>
                onTetoOrcamental
                  ? onTetoOrcamental()
                  : onShowAlert("Teto Orçamental")
              }
              className="w-full flex items-center justify-center gap-2.5 bg-[#b91c1c] text-white px-6 py-3.5 rounded-2xl font-black text-xs sm:text-sm tracking-wider hover:bg-red-800 active:scale-95 touch-manipulation transition-all shadow-lg cursor-pointer"
            >
              <DollarSign size={20} />
              <span>Teto Orçamental: {formattedBudget}</span>
            </button>

            {/* Bottom Row: Relatório Anual & Plano Setorial */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={() =>
                  onRelatorioAnual
                    ? onRelatorioAnual()
                    : onShowAlert("Relatório Anual")
                }
                className="flex-1 flex items-center justify-center gap-2 bg-[#1e3a8a] text-white px-4 py-3 rounded-2xl font-black text-xs tracking-wider hover:bg-blue-900 active:scale-95 touch-manipulation transition-all shadow-md cursor-pointer"
              >
                <FileText size={18} />
                <span>Relatório Anual</span>
              </button>

              <button
                onClick={() =>
                  onPlanoSetorial
                    ? onPlanoSetorial()
                    : onShowAlert("Plano Setorial")
                }
                className="flex-1 flex items-center justify-center gap-2 bg-purple-700 text-white px-4 py-3 rounded-2xl font-black text-xs tracking-wider hover:bg-purple-800 active:scale-95 touch-manipulation transition-all shadow-md cursor-pointer"
              >
                <LayoutGrid size={18} />
                <span>Plano Setorial ({totalActivitiesCount} Actividades)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Menu Grid Items - Adaptable layout centering items properly based on count */}
        <div className={`grid gap-4 sm:gap-6 w-full mx-auto ${gridClass} ${maxWidthClass}`}>
          {displayItems.map((item, index) => {
            const itemBudget = calculateScopeBudget(item.title, matrixActivities);
            const formattedItemBudget = itemBudget.toLocaleString("pt-MZ", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) + " MZN";
            return (
              <button
                key={index}
                onClick={async () => {
                  if (!isAllowed(item)) {
                    onShowAlert("Área não acessível ao seu perfil.");
                    try {
                      const { firestoreService } =
                        await import("../../lib/firestoreService");
                      await firestoreService.accessAlerts.add({
                        userName: user?.name || user?.email || "Desconhecido",
                        userEmail: user?.email || "",
                        userRole: user?.role || "",
                        userNuit: user?.nuit || "",
                        targetSector: item.title,
                        timestamp: new Date().toISOString(),
                      });
                    } catch (e) {}
                    return;
                  }
                  if (item.title === "Registos de Visitantes") {
                    setShowLibraryVisitForm(true);
                  } else if (item.title === "Registo de Obras e Livros") {
                    setShowBookRegistrationForm(true);
                  } else if (item.title === "Repartição de Arquivo") {
                    setShowArchiveView(true);
                  } else if (item.subItems && item.subItems.length > 0) {
                    onNavigate?.(item.title, item.subItems);
                  } else {
                    onNavigate?.(item.title, []);
                  }
                }}
                className={`group ${isServicosCentrais ? 'bg-[#5842ff] min-h-[220px] p-8 rounded-3xl flex flex-col items-center justify-between text-center shadow-xl hover:scale-[1.02] transition-all cursor-pointer text-white' : `${colors[index % colors.length]} w-full text-white p-3 sm:p-4 lg:p-5 rounded-xl sm:rounded-[1.5rem] flex sm:flex-col items-center justify-between sm:justify-center gap-2 sm:gap-3 lg:gap-4 min-h-[3rem] sm:min-h-[6rem] lg:min-h-[8rem] shadow-lg hover:shadow-xl active:scale-[0.98] touch-manipulation transition-all duration-200 cursor-pointer text-left sm:text-center ${!isAllowed(item) ? "opacity-50 grayscale cursor-not-allowed" : ""}`}`}
              >
                <span
                  className={`font-black font-serif tracking-tight leading-snug  group-hover:text-amber-300 transition-colors ${isServicosCentrais ? 'text-white text-sm sm:text-base' : 'flex-1 text-xs sm:text-sm lg:text-base'}`}
                >
                  {item.title}
                </span>
                
                {itemBudget > 0 && (
                  <div className="bg-black/20 backdrop-blur-xs text-amber-300 font-extrabold text-[10px] sm:text-xs px-2.5 py-1 rounded-md my-1">
                    Orçamento: {formattedItemBudget}
                  </div>
                )}

                <div className="flex items-center justify-center opacity-90 shrink-0 mt-2">
                  {isServicosCentrais ? (
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-black">
                      <ChevronRight size={22} />
                    </div>
                  ) : item.subItems && item.subItems.length > 0 ? (
                    <ChevronRight
                      size={18}
                      className="sm:w-5 sm:h-5 lg:w-6 lg:h-6"
                    />
                  ) : (
                    <span
                      className="font-bold bg-white/20 px-2 py-0.5 rounded-md text-[8px] sm:text-[9px]"
                    >
                      Aceder
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}

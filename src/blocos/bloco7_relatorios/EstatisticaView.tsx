import React from "react";
import {
  Users,
  Briefcase,
  Microscope,
  DollarSign,
  Building2,
  Library,
  BookOpen,
  Cpu,
  TrendingUp,
} from "lucide-react";
import StatisticsWorkflowView, {
  Category,
} from "../bloco7_relatorios/StatisticsWorkflowView";

export default function EstatisticaView({
  onBack,
  isReadOnly = true,
  allowedCategories = null,
  title = "Estatística",
  hideSidebar = false,
  hideHeader = false,
  hideFooter = false,
  initialActiveItem = null,
  financialData = [],
  user,
  onLogout,
  colaboradores = [],
}: {
  onBack?: () => void;
  isReadOnly?: boolean;
  allowedCategories?: string[] | null;
  title?: string;
  hideSidebar?: boolean;
  hideHeader?: boolean;
  hideFooter?: boolean;
  initialActiveItem?: string | null;
  financialData?: any[];
  user?: any;
  onLogout?: () => void;
  colaboradores?: any[];
}) {
  const isEstatisticaMain = title.toUpperCase() === "REPARTIÇÃO DE ESTATÍSTICA";

  const categoriesMap: Record<string, Category[]> = {
    "Corpo docente": [{ title: "Corpo docente", icon: Users }],
    "Chefe de RH": [{ title: "RH", icon: Users }],
    Finanças: [{ title: "Finanças", icon: DollarSign }],
    "Registo Acadêmico": [{ title: "Registo", icon: BookOpen }],
    Bolsa: [{ title: "CORPO DISCENTE", icon: Users }],
    Biblioteca: [{ title: "Biblioteca", icon: Library }],
    Infraestrutura: [{ title: "Infraestrutura", icon: Building2 }],
    TIC: [{ title: "TIC", icon: Cpu }],
    MainEstatistica: [
      { title: "Corpo Discente", icon: Users },
      { title: "Corpo Docente", icon: Users },
      { title: "CTA", icon: Users },
      { title: "Investigadores", icon: Microscope },
      { title: "Finanças", icon: DollarSign },
      { title: "Previsão N+1", icon: TrendingUp },
      { title: "Infraestrutura", icon: Building2 },
      { title: "Biblioteca", icon: Library },
      { title: "Tic", icon: Cpu },
    ],
  };

  const isBolsa = title.toUpperCase().includes("BOLSA");

  let defaultKey = "Corpo docente";
  if (isBolsa) defaultKey = "Bolsa";
  if (isEstatisticaMain) defaultKey = "MainEstatistica";

  const categories = categoriesMap[initialActiveItem || defaultKey] || [
    { title: initialActiveItem || "Estatística", icon: Briefcase },
  ];

  // If allowedCategories is provided, filter or map the categories
  let finalCategories = categories;
  if (allowedCategories && allowedCategories.length > 0) {
    // If we have allowedCategories, we might want to map them to icons if they are just strings
    finalCategories = allowedCategories.map((catTitle) => {
      // Try to find an icon from categoriesMap or define defaults
      const allPossibleCategories = Object.values(categoriesMap).flat();
      const found = allPossibleCategories.find(
        (c) => c.title.toLowerCase() === catTitle.toLowerCase(),
      );
      return found || { title: catTitle, icon: Briefcase };
    });
  }

  const displaySubtitle =
    finalCategories.length === 1
      ? finalCategories[0].title
      : initialActiveItem || "Visão Geral";

  return (
    <StatisticsWorkflowView
      title={`${title} - ${displaySubtitle}`}
      categories={finalCategories}
    />
  );
}

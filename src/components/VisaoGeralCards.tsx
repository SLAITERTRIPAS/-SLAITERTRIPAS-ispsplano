import React from "react";
import { Users, FileText, BarChart3, DollarSign, GraduationCap, FolderOpen, FileCheck, Box, Folder } from "lucide-react";

interface CardItem {
  title: string;
  sub: string;
  icon: any;
  color: string;
  badgeColor: string;
  target: string;
}

export default function VisaoGeralCards({
  onNavigate,
  user,
  title,
}: {
  onNavigate: (item: string) => void;
  user: any;
  title: string;
}) {
  const isUGEA =
    title === "Unidade Gestora e Executora de Aquisições" ||
    title.toUpperCase().includes("UGEA") ||
    title.toUpperCase().includes("AQUISIÇÕES") ||
    title.toUpperCase().includes("AQUISICOES");

  const getCardDetails = (cardTitle: string): CardItem => {
    const upper = cardTitle.toUpperCase();
    
    let target = cardTitle;
    if (upper === "EFETIVO GERAL") target = "Gestão de Pessoal";
    if (upper === "PLANOS DE ATIVIDADES" || upper === "PLANO DE ATIVIDADES") target = "Plano";
    if (upper === "RELATÓRIOS") target = "Relatórios";
    if (upper === "RECURSOS FINANCEIROS") target = "Balanço";
    if (upper === "CORPO DISCENTE") target = "Gestão Académica";
    if (upper === "GESTÃO DE EXPEDIENTE") target = "Gestão de Expediente";
    if (upper === "GESTÃO DE PRODUTOS E PREÇOS") target = "Gestão de Produtos e Preços";
    if (upper === "GESTÃO DE FORNECEDORES") target = "Gestão de Fornecedores";
    if (upper === "PLANO DE AQUISIÇÃO") target = "Plano de Aquisição";
    if (upper === "PLANO DE CONTRATAÇÃO") target = "Plano de Contratação";

    if (upper.includes("PRODUTOS") || upper.includes("PREÇOS")) {
      return {
        title: cardTitle,
        sub: "Catálogo de Produtos, Preços e Materiais da UGEA",
        icon: Box,
        color: "border-slate-900 bg-slate-50/50 shadow-[4px_4px_0px_0px_#1e3a8a] hover:border-blue-800",
        badgeColor: "bg-blue-100 text-blue-900 border border-blue-200/60",
        target,
      };
    }
    if (upper.includes("FORNECEDORES")) {
      return {
        title: cardTitle,
        sub: "Registo e Gestão Oficial de Fornecedores",
        icon: Users,
        color: "border-slate-900 bg-slate-50/50 shadow-[4px_4px_0px_0px_#0f172a] hover:border-slate-800",
        badgeColor: "bg-slate-200 text-slate-900 border border-slate-300/60",
        target,
      };
    }
    if (upper.includes("AQUISIÇÃO") || upper.includes("AQUISICAO")) {
      return {
        title: cardTitle,
        sub: "Planificação e Controlo de Aquisições",
        icon: FileText,
        color: "border-slate-900 bg-slate-50/50 shadow-[4px_4px_0px_0px_#064e3b] hover:border-emerald-800",
        badgeColor: "bg-emerald-100 text-emerald-900 border border-emerald-200/60",
        target,
      };
    }
    if (upper.includes("CONTRATAÇÃO") || upper.includes("CONTRATACAO")) {
      return {
        title: cardTitle,
        sub: "Planificação e Contratação de Serviços",
        icon: FileText,
        color: "border-slate-900 bg-slate-50/50 shadow-[4px_4px_0px_0px_#581c87] hover:border-purple-800",
        badgeColor: "bg-purple-100 text-purple-900 border border-purple-200/60",
        target,
      };
    }
    if (upper.includes("EFETIVO")) {
      return {
        title: cardTitle,
        sub: "Consulta e Gestão de Pessoal e Efetivo",
        icon: Users,
        color: "border-slate-900 bg-slate-50/50 shadow-[4px_4px_0px_0px_#0f172a] hover:border-blue-900",
        badgeColor: "bg-blue-100 text-blue-950 border border-blue-200/60",
        target,
      };
    }
    if (upper.includes("PLANO")) {
      return {
        title: cardTitle,
        sub: "Planificação e Acompanhamento de Actividades",
        icon: FileText,
        color: "border-slate-900 bg-slate-50/50 shadow-[4px_4px_0px_0px_#134e4a] hover:border-teal-800",
        badgeColor: "bg-teal-100 text-teal-900 border border-teal-200/60",
        target,
      };
    }
    if (upper.includes("RELATÓRIO") || upper.includes("RELATORIO")) {
      return {
        title: cardTitle,
        sub: "Relatórios de Desempenho e Indicadores",
        icon: BarChart3,
        color: "border-slate-900 bg-slate-50/50 shadow-[4px_4px_0px_0px_#78350f] hover:border-amber-800",
        badgeColor: "bg-amber-100 text-amber-900 border border-amber-200/60",
        target,
      };
    }
    if (upper.includes("RECURSOS") || upper.includes("BALANÇO") || upper.includes("BALANCO")) {
      return {
        title: cardTitle,
        sub: "Orçamento, Balanço e Gestão Financeira",
        icon: DollarSign,
        color: "border-slate-900 bg-slate-50/50 shadow-[4px_4px_0px_0px_#581c87] hover:border-purple-800",
        badgeColor: "bg-purple-100 text-purple-900 border border-purple-200/60",
        target,
      };
    }
    if (upper.includes("DISCENTE") || upper.includes("ESTUDANTE")) {
      return {
        title: cardTitle,
        sub: "Estudantes, Cursos e Matrículas",
        icon: GraduationCap,
        color: "border-slate-900 bg-slate-50/50 shadow-[4px_4px_0px_0px_#1e1b4b] hover:border-indigo-800",
        badgeColor: "bg-indigo-100 text-indigo-900 border border-indigo-200/60",
        target,
      };
    }
    if (upper.includes("EXPEDIENTE")) {
      return {
        title: cardTitle,
        sub: "Correspondência, Documentos e Expedientes",
        icon: Folder,
        color: "border-slate-900 bg-slate-50/50 shadow-[4px_4px_0px_0px_#881337] hover:border-rose-800",
        badgeColor: "bg-rose-100 text-rose-900 border border-rose-200/60",
        target,
      };
    }
    if (upper.includes("ASSINATURA")) {
      return {
        title: cardTitle,
        sub: "Validação e Assinatura de Documentos",
        icon: FileCheck,
        color: "border-slate-900 bg-slate-50/50 shadow-[4px_4px_0px_0px_#134e4a] hover:border-teal-800",
        badgeColor: "bg-teal-100 text-teal-900 border border-teal-200/60",
        target,
      };
    }
    return {
      title: cardTitle,
      sub: "Gestão e Acompanhamento",
      icon: FileText,
      color: "border-slate-900 bg-slate-50/50 shadow-[4px_4px_0px_0px_#334155] hover:border-slate-800",
      badgeColor: "bg-slate-100 text-slate-900 border border-slate-200",
      target,
    };
  };

  const rawCards = isUGEA
    ? [
        "Gestão de Produtos e Preços",
        "Gestão de Fornecedores",
        "Plano de Aquisição",
        "Plano de Contratação",
        "Planos de Actividades",
        "Gestão de Expediente",
      ]
    : [
        "Efetivo Geral",
        "Planos de Actividades",
        "Relatórios",
        "Recursos Financeiros",
        "Corpo Discente",
        "Gestão de Expediente",
      ];

  const cards = rawCards.map(getCardDetails);

  return (
    <div className="flex flex-col items-start w-full mx-auto space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 w-full">
        {cards.map((card) => {
          const IconComp = card.icon;
          return (
            <button
              key={card.title}
              onClick={() => onNavigate(card.target)}
              className={`w-full min-h-[160px] flex flex-col justify-between border-2 rounded-2xl p-4 text-left transition-all active:shadow-none active:translate-x-[2px] active:translate-y-[2px] cursor-pointer group ${card.color}`}
            >
              <div className="flex items-center justify-between">
                <IconComp className="w-6 h-6 shrink-0 text-slate-900 group-hover:scale-110 transition-transform" />
                <span
                  className={`text-[9px] font-black px-2 py-0.5 rounded tracking-wider shadow-sm ${card.badgeColor}`}
                >
                  Aceder
                </span>
              </div>
              <div className="mt-3">
                <h3 className="font-sans font-black text-slate-900 text-xs tracking-tight leading-snug">
                  {card.title}
                </h3>
                <p className="text-[11px] text-slate-600 font-medium mt-1 leading-snug">
                  {card.sub}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

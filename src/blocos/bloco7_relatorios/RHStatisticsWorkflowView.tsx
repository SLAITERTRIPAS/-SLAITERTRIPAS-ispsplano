import React from "react";
import { Users, Briefcase, Microscope } from "lucide-react";
import StatisticsWorkflowView from "../bloco7_relatorios/StatisticsWorkflowView";

export default function RHStatisticsWorkflowView({ title }: { title: string }) {
  const categories = [
    { title: "Corpo docente", icon: Users },
    { title: "Corpo técnico administrativo", icon: Briefcase },
    { title: "Investigadores", icon: Microscope },
  ];

  return (
    <StatisticsWorkflowView
      title={title}
      categories={categories}
      isReparticao={title.includes("Repartição de Pessoal")}
      isChefeRH={title.includes("Chefe do RH") || title.includes("RH")}
    />
  );
}

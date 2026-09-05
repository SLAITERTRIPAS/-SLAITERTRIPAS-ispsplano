import React from 'react';
import { toTitleCase as tc } from '../lib/utils';

export function resolveOrgaoName(unidadeName?: any, direcaoName?: any): string {
  if (unidadeName && String(unidadeName).trim() && unidadeName !== "Unidade Orgânica") {
    const uUpper = String(unidadeName).toUpperCase().trim();
    if (uUpper.includes("SERVIÇO") || uUpper.includes("SERVICO") || uUpper === "SC") {
      return "Serviços Centrais";
    }
    if (uUpper.includes("DIREÇÃO E GESTÃO") || uUpper.includes("DIRECAO E GESTAO") || uUpper === "ODG") {
      return "Órgão de Direção e Gestão";
    }
    if (uUpper.includes("ORGÂNICA") || uUpper.includes("ORGANICA") || uUpper === "UO") {
      return "Unidade Orgânica";
    }
    return tc(String(unidadeName));
  }

  if (direcaoName) {
    const dUpper = String(direcaoName).toUpperCase().trim();
    if (
      dUpper.includes("DICOSAFA") ||
      dUpper.includes("DICOSSER") ||
      dUpper.includes("SERVIÇO") ||
      dUpper.includes("SERVICO")
    ) {
      return "Serviços Centrais";
    }
    if (
      dUpper.includes("GABINETE") ||
      dUpper.includes("DIRETOR-GERAL") ||
      dUpper.includes("DIREÇÃO E GESTÃO") ||
      dUpper.includes("DIRECAO E GESTAO") ||
      dUpper.includes("CONSELHO") ||
      dUpper.includes("GDG")
    ) {
      return "Órgão de Direção e Gestão";
    }
    if (
      dUpper.includes("ENGENHARIA") ||
      dUpper.includes("DIVISÃO") ||
      dUpper.includes("DIVISAO") ||
      dUpper.includes("INCUBACAO") ||
      dUpper.includes("CIE") ||
      dUpper.includes("CENTRO")
    ) {
      return "Unidade Orgânica";
    }
  }

  return tc(String(unidadeName || "Unidade Orgânica"));
}

export const InstitutionalHeader = ({
  direcaoName,
  departamentoName,
  reparticaoName,
  sectorName,
  year,
  isOwner,
  isPlanificacaoHeader,
  unidadeName,
  title = "Plano de Actividade",
}: {
  direcaoName?: string;
  departamentoName?: string;
  reparticaoName?: string;
  sectorName?: string;
  year: number;
  isOwner?: boolean;
  isPlanificacaoHeader?: boolean;
  unidadeName?: string;
  title?: string;
}) => {
  // Garantir que os nomes estão formatados corretamente e resolver o Órgão correto
  const displayUnidade = resolveOrgaoName(unidadeName, direcaoName);
  const displayDirecao = tc(String(direcaoName || "").trim());
  const displayDepartamento = tc(String(departamentoName || "").trim());
  const displayReparticao = tc(String(reparticaoName || "").trim());
  const displaySector = tc(String(sectorName || "").trim());

  // Nível ativo mais específico para compor o título dinâmico em tempo real
  let lowestLevelName = "";
  if (displaySector) {
    lowestLevelName = displaySector.toLowerCase().startsWith("setor") ? displaySector : `Setor de ${displaySector}`;
  } else if (displayReparticao) {
    lowestLevelName = displayReparticao.toLowerCase().startsWith("repartição") || displayReparticao.toLowerCase().startsWith("reparticao")
      ? displayReparticao
      : `Repartição de ${displayReparticao}`;
  } else if (displayDepartamento) {
    lowestLevelName = displayDepartamento;
  } else if (displayDirecao) {
    lowestLevelName = displayDirecao;
  } else {
    lowestLevelName = displayUnidade;
  }

  // Título dinâmico em tempo real
  let displayTitle = tc(String(title || "Plano de Actividade").trim());
  if (displayTitle.toLowerCase() === "plano de actividade" || displayTitle.toLowerCase() === "plano de actividades") {
    if (lowestLevelName) {
      displayTitle = `Plano de Actividade de ${lowestLevelName}`;
    }
  } else if (
    displayTitle.toLowerCase().startsWith("plano de actividade de ") ||
    displayTitle.toLowerCase().startsWith("plano de actividades de ")
  ) {
    if (lowestLevelName && !displayTitle.includes(lowestLevelName)) {
      displayTitle = `Plano de Actividade de ${lowestLevelName}`;
    }
  }

  return (
    <div className="text-center mb-6 flex flex-col items-center justify-center w-full bg-slate-50/50 p-8 rounded-t-[2.5rem] print:p-4 print:mb-4 print:w-full print:items-center print:text-center">
      {/* 1. Logotipo Oficial Centrado */}
      <div className="mb-6 flex justify-center items-center w-full text-center print:mb-4 print:flex print:justify-center print:items-center">
        <img
          src="https://lh3.googleusercontent.com/d/11zvvpOpZARM1yk_irEDpjJ-qBKlTlhad"
          alt="Logotipo"
          className="w-36 h-auto object-contain mx-auto print:mx-auto print:block"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* 2. Nome do Instituto */}
      <h2 className="text-[2.2rem] font-black text-slate-900 tracking-tight mb-1.5 leading-none">
        Instituto Superior Politécnico de Songo
      </h2>

      {/* 3. Província / Distrito */}
      <div className="flex flex-col items-center gap-0.5 mb-6">
        <h3 className="text-base font-bold text-slate-700 tracking-[0.1em]">
          Província de Tete
        </h3>
        <h3 className="text-base font-bold text-slate-700 tracking-[0.1em]">
          Distrito de Cahora-Bassa
        </h3>
      </div>
      
      {/* 4. Hierarquia Organizacional */}
      <div className="flex flex-col items-center gap-1.5 mb-6">
        {/* Órgão */}
        <h4 className="text-xl font-bold text-slate-900 tracking-tight">
          {displayUnidade}
        </h4>

        {/* Direção */}
        {displayDirecao && (
          <h4 className="text-xl font-bold text-slate-900 tracking-tight">
            {displayDirecao}
          </h4>
        )}

        {/* Departamento */}
        {displayDepartamento && (
          <h4 className="text-xl font-bold text-slate-900 tracking-tight">
            {displayDepartamento}
          </h4>
        )}

        {/* Repartição / Setor */}
        {(displayReparticao || displaySector) && (
          <h4 className="text-xl font-bold text-slate-900 tracking-tight">
            {displayReparticao} {displayReparticao && displaySector ? "-" : ""} {displaySector}
          </h4>
        )}
      </div>

      {/* 5. Título do Plano (EM VERMELHO) */}
      <h5 className="text-[1.4rem] font-black text-red-600 mt-2 tracking-tight">
        {displayTitle}
      </h5>

      {/* 6. Linha Divisória */}
      <div className="w-full max-w-5xl h-[3px] bg-slate-900 mt-6 mb-6"></div>

      {/* 7. Exercício Económico */}
      <div className="mt-2">
        <span className="text-[1.3rem] font-black text-slate-900 tracking-tight bg-[#f1f5f9] px-10 py-3 rounded-[1.2rem] border border-slate-200 shadow-sm">
          Exercício Económico: {year || 2027}
        </span>
      </div>
    </div>
  );
};

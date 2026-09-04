import React from "react";
import {
  getDirectionAbbreviation,
  getDepartmentAbbreviation,
  getActivityInitials,
  cn,
} from "../../../lib/utils";
import { getRoles, isSuperBossUser } from "../../../lib/auth";

export const getDirectionPriority = (dir: string): number => {
  const d = String(dir || "").toUpperCase();
  if (
    d.includes("GABINETE DO DIRETOR-GERAL") ||
    d.includes("GABINETE DO DIRETOR GERAL") ||
    d.includes("GABINETE") ||
    d.includes("DIRETOR-GERAL") ||
    d.includes("DIRETOR GERAL")
  )
    return 1;
  if (
    d.includes("ENGENHARIA") ||
    d.includes("DIVISÃO DE ENGENHARIA") ||
    d.includes("DIVISAO DE ENGENHARIA")
  )
    return 2;
  if (
    d.includes("INCUBAÇÃO") ||
    d.includes("INCUBACAO") ||
    d.includes("CENTRO DE INCUBAÇÃO") ||
    d.includes("CENTRO DE INCUBACAO") ||
    d.includes("CIE")
  )
    return 3;
  if (
    d.includes("DICOSAFA") ||
    d.includes("ADMINISTRAÇÃO") ||
    d.includes("ADMINISTRACAO")
  )
    return 4;
  if (
    d.includes("DICOSSER") ||
    d.includes("ACADÉMICOS") ||
    d.includes("ACADEMICOS")
  )
    return 5;
  return 100;
};

export const compareDirections = (a: string, b: string): number => {
  const prioA = getDirectionPriority(a);
  const prioB = getDirectionPriority(b);
  if (prioA !== prioB) return prioA - prioB;
  return String(a || "").localeCompare(String(b || ""));
};

/**
 * Ordenação estritamente numérica para planos de setor e listas de atividades.
 * Ordena por: N/O -> Código Numérico -> Data de Criação -> Título
 */
export const compareActivitiesNumericOrder = (a: any, b: any): number => {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  const getNumericSeq = (x: any): number => {
    // 1. Tentar campos diretos de número sequencial (no, numeroAtividade, nAtividade, ordem)
    const directVals = [x.no, x.numeroAtividade, x.nAtividade, x.ordem, x.numeroDirecao];
    for (const v of directVals) {
      if (v !== undefined && v !== null && String(v).trim() !== "") {
        const parsed = parseInt(String(v).replace(/[^\d]/g, ""), 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    }

    // 2. Tentar extrair do código da atividade ou referência (ex: DPEP/PLAN/001/..., SDG/UGEA/1/...)
    const ref = String(x.codigoAtividade || x.referencia || "");
    const matchSlash = ref.match(/\/(\d+)(\/|$)/);
    if (matchSlash) {
      const parsed = parseInt(matchSlash[1], 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    const matchN = ref.match(/N(\d+)/i);
    if (matchN) {
      const parsed = parseInt(matchN[1], 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    const matchEnd = ref.match(/(\d+)$/);
    if (matchEnd) {
      const parsed = parseInt(matchEnd[1], 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }

    return 999999;
  };

  const numA = getNumericSeq(a);
  const numB = getNumericSeq(b);

  if (numA !== numB) {
    return numA - numB;
  }

  // Desempate por texto de N/O (ex: 1A vs 1B)
  const strNoA = String(a.no ?? a.numeroAtividade ?? a.nAtividade ?? a.numeroDirecao ?? "");
  const strNoB = String(b.no ?? b.numeroAtividade ?? b.nAtividade ?? b.numeroDirecao ?? "");
  if (strNoA && strNoB && strNoA !== strNoB) {
    const compNo = strNoA.localeCompare(strNoB, undefined, { numeric: true });
    if (compNo !== 0) return compNo;
  }

  // Desempate por data de criação / envio
  const dateA = new Date(a.createdAt || a.dataEnvio || 0).getTime();
  const dateB = new Date(b.createdAt || b.dataEnvio || 0).getTime();
  if (dateA !== dateB) return dateA - dateB;

  return String(a.designacao || a.title || a.nomeAtividade || "").localeCompare(
    String(b.designacao || b.title || b.nomeAtividade || ""),
  );
};

export const compareActivitiesStandardOrder = (
  a: any,
  b: any,
  getActMonthIdxFunc?: (x: any) => number,
): number => {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  // 1. Por Direção
  const dirA = (a.direcao || a.unidadeOrganica || "").toString();
  const dirB = (b.direcao || b.unidadeOrganica || "").toString();
  const compDir = compareDirections(dirA, dirB);
  if (compDir !== 0) return compDir;

  // 2. Por Departamento
  const deptA = String(a.departamento || a.unidadeOrganica || "").trim();
  const deptB = String(b.departamento || b.unidadeOrganica || "").trim();
  if (deptA !== deptB) {
    const compDept = deptA.localeCompare(deptB);
    if (compDept !== 0) return compDept;
  }

  // 3. Por Setor / Repartição (cada setor tem a sua própria contagem sequencial isolada)
  const sectorA = String(a.setor || a.sector || a.reparticao || "").trim();
  const sectorB = String(b.setor || b.sector || b.reparticao || "").trim();
  if (sectorA !== sectorB) {
    const compSector = sectorA.localeCompare(sectorB);
    if (compSector !== 0) return compSector;
  }

  // 4. Ordem Numérica / N/O (Número de Ordem - N.º Sequencial da Atividade: 001, 002, 003...)
  const getNoNum = (x: any) => {
    const val = x.no ?? x.numeroAtividade ?? x.nAtividade ?? x.numeroDirecao;
    if (val !== undefined && val !== null && val !== "") {
      const parsed = parseInt(String(val).replace(/[^\d]/g, ""), 10);
      if (!isNaN(parsed)) return parsed;
    }
    return 999999;
  };
  const noA = getNoNum(a);
  const noB = getNoNum(b);
  if (noA !== noB) return noA - noB;

  const strNoA = String(a.no ?? a.numeroAtividade ?? a.nAtividade ?? a.numeroDirecao ?? "");
  const strNoB = String(b.no ?? b.numeroAtividade ?? b.nAtividade ?? b.numeroDirecao ?? "");
  const compNo = strNoA.localeCompare(strNoB, undefined, { numeric: true });
  if (compNo !== 0) return compNo;

  // 3. Mês de Realização (Organização por Mês de Realização - Janeiro a Dezembro)
  const getM =
    getActMonthIdxFunc ||
    ((act: any) => {
      const monthOrder: Record<string, number> = {
        Janeiro: 1,
        Fevereiro: 2,
        Março: 3,
        Abril: 4,
        Maio: 5,
        Junho: 6,
        Julho: 7,
        Agosto: 8,
        Setembro: 9,
        Outubro: 10,
        Novembro: 11,
        Dezembro: 12,
      };
      const months = Array.isArray(act.mesesRealizacao)
        ? act.mesesRealizacao
        : [act.mesRealizacao || act.mes].filter(Boolean);
      if (months.length > 0) {
        const indices = months
          .map((m: string) => monthOrder[m] || 13)
          .sort((x: number, y: number) => x - y);
        if (indices[0] <= 12) return indices[0];
      }
      const trimestres = Array.isArray(act.trimestres)
        ? act.trimestres
        : [act.trimestre].filter(Boolean);
      if (trimestres.includes("I") || trimestres.includes("1º Trimestre"))
        return 1;
      if (trimestres.includes("II") || trimestres.includes("2º Trimestre"))
        return 4;
      if (trimestres.includes("III") || trimestres.includes("3º Trimestre"))
        return 7;
      if (trimestres.includes("IV") || trimestres.includes("4º Trimestre"))
        return 10;
      return 13;
    });

  const monthA = getM(a);
  const monthB = getM(b);
  if (monthA !== monthB) return monthA - monthB;

  // 4. Código da Atividade
  const codA = String(a.codigoAtividade || a.referencia || a.codigo || "");
  const codB = String(b.codigoAtividade || b.referencia || b.codigo || "");
  const compCod = codA.localeCompare(codB, undefined, {
    numeric: true,
    sensitivity: "base",
  });
  if (compCod !== 0) return compCod;

  // 5. Valor Total da Atividade
  const getTot = (act: any): number => {
    if (!act) return 0;
    const rubricVal =
      act.rubricas && Array.isArray(act.rubricas) && act.rubricas.length > 0
        ? act.rubricas.reduce(
            (acc: number, r: any) =>
              acc + Number(r?.valorTotal || r?.total || 0),
            0,
          )
        : Number(act.valor || act.total || 0);
    const fuelVal =
      act.necessitaTransporte === "Sim"
        ? Number(act.litrosGasoleo || 0) * Number(act.precoLitro || 0)
        : 0;
    const total =
      (isNaN(rubricVal) ? 0 : rubricVal) + (isNaN(fuelVal) ? 0 : fuelVal);
    if (total > 0) return total;
    return Number(act.valorTotal || act.valor || 0);
  };

  const totalA = getTot(a);
  const totalB = getTot(b);
  if (totalA !== totalB) return totalA - totalB;

  return 0;
};

export function renderActivityRubricas(activity: any) {
  const hasMultiple =
    Array.isArray(activity.rubricas) && activity.rubricas.length > 0;

  if (!hasMultiple) {
    return (
      <div className="space-y-1 text-left min-w-[220px]">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1">
          <span className="text-[9px] font-black text-slate-400  tracking-wider">
            Fonte:
          </span>
          <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-black">
            {activity.orcamento || "OE"}
          </span>
        </div>
        {activity.rubrica || activity.necessidade ? (
          <div className="text-[11px] leading-relaxed">
            {activity.rubrica && (
              <div
                className="font-extrabold text-slate-700 break-words"
                title={activity.rubrica}
              >
                {activity.rubrica}
              </div>
            )}
            {activity.necessidade && (
              <div
                className="text-slate-500 italic text-[10px] break-words"
                title={activity.necessidade}
              >
                • {activity.necessidade}
              </div>
            )}
            <div className="font-black text-emerald-600 mt-1 text-right text-xs">
              {(activity.valor || 0).toLocaleString()} MZN
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-slate-400 italic">
            Nenhuma rubrica registada
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 text-left min-w-[240px]">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1">
        <span className="text-[9px] font-black text-slate-400  tracking-wider">
          Fonte:
        </span>
        <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-black">
          {activity.orcamento || "OE"}
        </span>
      </div>
      <div className="space-y-2 max-h-[160px] print:max-h-none overflow-y-auto divide-y divide-slate-100 pr-1">
        {activity.rubricas.map((r: any, idx: number) => {
          const detailStr =
            r.quantidade && r.precoUnitario
              ? `${r.quantidade} x ${r.precoUnitario.toLocaleString()} MZN`
              : "";
          const subtotalValue = r.valorTotal || r.total || 0;
          return (
            <div
              key={r.id || idx}
              className="pt-2 first:pt-0 text-[11px] leading-normal space-y-0.5"
            >
              {r.rubrica && (
                <div
                  className="font-extrabold text-slate-700 break-words"
                  title={r.rubrica}
                >
                  {r.rubrica}
                </div>
              )}
              {r.necessidade && (
                <div
                  className="text-slate-500 italic text-[10px] break-words"
                  title={r.necessidade}
                >
                  • {r.necessidade}
                </div>
              )}
              <div className="flex justify-between items-center text-[10px] mt-0.5 gap-2">
                <span className="text-slate-400 font-medium">{detailStr}</span>
                <span className="font-bold text-slate-800 shrink-0">
                  {subtotalValue.toLocaleString()} MZN
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-slate-200 pt-1.5 flex justify-between items-center">
        <span className="text-[9px] font-black text-slate-400 ">
          Total Geral:
        </span>
        <span className="font-black text-emerald-600 text-xs">
          {(activity.valor || 0).toLocaleString()} MZN
        </span>
      </div>
    </div>
  );
}

export const normalizeHeaderString = (str: string): string => {
  if (!str) return "";
  return str
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
};

export const getExcelRowValue = (
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

export const getLatestWorkflowActivities = (activities: any[]) => {
  if (!activities) return [];
  const STATUS_ORDER = [
    "draft",
    "setorial",
    "reparticao",
    "departamento",
    "direcao",
    "planificacao",
    "institucional",
  ];

  const getStatusWeight = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "draft") return 0;
    if (s === "setorial") return 1;
    if (s === "reparticao") return 2;
    if (s === "departamento") return 3;
    if (s === "direcao") return 4;
    if (s === "planificacao") return 5;
    if (s === "institucional") return 6;
    return 0;
  };

  const groups: { [key: string]: any } = {};

  activities.forEach((act) => {
    if (!act) return;
    const actId = String(act.id || "").trim();
    const codigo = String(act.codigoAtividade || act.codigo || "").trim().toLowerCase();
    const referencia = String(act.referencia || "").trim().toLowerCase();
    const titulo = String(act.title || act.descricao || "").trim().toLowerCase();
    const dept = String(act.departamento || act.direcao || "").trim().toLowerCase();
    const ano = String(act.ano || "2026");

    const key = actId ? `id_${actId}` : `${ano}_${dept}_${codigo || referencia || titulo}`;

    if (!groups[key]) {
      groups[key] = act;
    } else {
      const currentWeight = getStatusWeight(groups[key].status);
      const newWeight = getStatusWeight(act.status);
      if (newWeight > currentWeight) {
        groups[key] = act;
      } else if (newWeight === currentWeight) {
        if (act.updatedAt && groups[key].updatedAt) {
          if (new Date(act.updatedAt).getTime() > new Date(groups[key].updatedAt).getTime()) {
            groups[key] = act;
          }
        } else if (act.createdAt && groups[key].createdAt) {
          if (
            new Date(act.createdAt).getTime() >
            new Date(groups[key].createdAt).getTime()
          ) {
            groups[key] = act;
          }
        }
      }
    }
  });

  return Object.values(groups);
};

export const getActivityDisplayNo = (activity: any): string | null => {
  if (!activity) return null;

  // 1. Procurar por campos numéricos diretos (no, numeroAtividade, nAtividade)
  const directVals = [activity.no, activity.numeroAtividade, activity.nAtividade];
  for (const v of directVals) {
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      const parsed = parseInt(String(v).replace(/[^\d]/g, ""), 10);
      if (!isNaN(parsed) && parsed > 0) {
        return String(parsed).padStart(3, "0");
      }
    }
  }

  const code = String(
    activity.codigoAtividade ||
      activity.referencia ||
      "",
  );

  // 2. Procurar por padrões como /N(\d+)/ (ex: SDG/UGEA//N1/IPC)
  const matchN = code.match(/N(\d+)/i);
  if (matchN) {
    const parsed = parseInt(matchN[1], 10);
    if (!isNaN(parsed) && parsed > 0) {
      return String(parsed).padStart(3, "0");
    }
  }

  // 3. Procurar por padrões como /UGEA/1/ ou números rodeados por barras (ex: SDG/UGEA/1/U1/IPC)
  const matchSlash = code.match(/\/(\d+)(\/|$)/);
  if (matchSlash) {
    const parsed = parseInt(matchSlash[1], 10);
    if (!isNaN(parsed) && parsed > 0) {
      return String(parsed).padStart(3, "0");
    }
  }

  // 4. Procurar por dígitos no fim
  const matchEnd = code.match(/(\d+)$/);
  if (matchEnd) {
    const parsed = parseInt(matchEnd[1], 10);
    if (!isNaN(parsed) && parsed > 0) {
      return String(parsed).padStart(3, "0");
    }
  }

  // 5. Fallback para activity.no
  if (activity.no && String(activity.no).trim() !== "") {
    const parsedNo = parseInt(String(activity.no).replace(/[^\d]/g, ""), 10);
    if (!isNaN(parsedNo) && parsedNo > 0) return String(parsedNo).padStart(3, "0");
    return String(activity.no).trim();
  }

  return null;
};

export const getActivityGroup = (activity: any, list: any[]) => {
  if (!activity) return [];

  const actNo = getActivityDisplayNo(activity);
  const actTitle = activity.title
    ? String(activity.title).trim().toLowerCase()
    : "";

  return list.filter((a) => {
    if (a.id === activity.id) return true;

    // Devem pertencer ao mesmo ano
    if ((a.ano || 2026) !== (activity.ano || 2026)) return false;

    // Se partilharem a mesma referência ou código
    const sameRef =
      activity.referencia &&
      a.referencia &&
      String(activity.referencia).trim() === String(a.referencia).trim();
    const sameCode =
      activity.codigoAtividade &&
      a.codigoAtividade &&
      String(activity.codigoAtividade).trim() ===
        String(a.codigoAtividade).trim();
    if (sameRef || sameCode) return true;

    // Se pertencerem ao mesmo departamento/repartição
    const sameDept = (a.departamento || "") === (activity.departamento || "");
    const sameSector =
      (a.setor || a.reparticao || "") ===
      (activity.setor || activity.reparticao || "");

    // Se tiverem o mesmo número de atividade calculado no mesmo departamento/setor
    const aNo = getActivityDisplayNo(a);
    if (
      actNo !== null &&
      aNo !== null &&
      actNo === aNo &&
      sameDept &&
      sameSector
    )
      return true;

    // Se tiverem o mesmo título de atividade no mesmo departamento/setor
    const aTitle = a.title ? String(a.title).trim().toLowerCase() : "";
    if (actTitle && aTitle && actTitle === aTitle && sameDept && sameSector)
      return true;

    return false;
  });
};

export const ActivitySelectionContext = React.createContext<{
  rawActivities: any[];
  selectedActivityIds: string[];
  onToggleSelect: (id: string) => void;
  onEditActivity?: (act: any) => void;
}>({ rawActivities: [], selectedActivityIds: [], onToggleSelect: () => {}, onEditActivity: () => {} });

export function isValidActivity(a: any): boolean {
  if (!a) return false;
  const name = String(
    a.nomeAtividade ||
      a.designacao ||
      a.designacaoAtividade ||
      a.title ||
      a.descricao ||
      a.atividade ||
      "",
  ).trim();

  // If no name or title is just placeholder / dummy indicator
  if (
    !name ||
    name === "-" ||
    name === "--" ||
    name === "---" ||
    name.toLowerCase() === "sem nome" ||
    name.toLowerCase() === "sem título" ||
    name.toLowerCase() === "sem designação" ||
    name.toLowerCase() === "null" ||
    name.toLowerCase() === "undefined"
  ) {
    const obj = String(a.objetivo || a.objetivoAtividade || "").trim();
    const hasValidObj = obj && obj !== "-" && obj !== "--" && obj !== "---";
    const hasRubricas =
      Array.isArray(a.rubricas) &&
      a.rubricas.some((r: any) => {
        const rName = String(r.rubrica || "").trim().toLowerCase();
        const rNec = String(r.necessidade || "").trim().toLowerCase();
        const rVal = Number(r.valorTotal || r.precoUnitario || 0);
        return (
          rName &&
          rName !== "sem rubrica" &&
          rName !== "sem rubricas" &&
          rName !== "-" &&
          (rNec !== "sem necessidade" || rVal > 0)
        );
      });

    // If it has no valid name, no valid objective and no valid rubricas, it is an invalid sample/placeholder
    if (!hasValidObj && !hasRubricas) {
      return false;
    }
  }

  // Se departamento ou direcao for "Departamento Geral" ou "Geral" mas não tiver nome real nem rubricas
  const dept = String(a.departamento || a.setor || "").trim().toLowerCase();
  const dir = String(a.direcao || "").trim().toLowerCase();
  if (
    (dept === "departamento geral" || dept === "geral" || dir === "departamento geral" || !dept) &&
    (!name || name === "-" || name === "Nova Atividade" || name === "ACT")
  ) {
    const hasValidRubricas =
      Array.isArray(a.rubricas) &&
      a.rubricas.some(
        (r: any) =>
          Number(r.valorTotal || r.precoUnitario || 0) > 0 &&
          r.rubrica &&
          r.rubrica !== "Sem rubrica" &&
          r.rubrica !== "Sem rubricas",
      );
    if (!hasValidRubricas) {
      return false;
    }
  }

  return true;
}

export function isDuplicateActivity(act: any, allActs: any[]): boolean {
  if (!act || !allActs || allActs.length <= 1) return false;

  const getNormName = (a: any) =>
    (a.descricao || a.designacaoAtividade || a.nomeAtividade || a.title || a.atividade || "")
      .toString()
      .trim()
      .toLowerCase();

  const getNormCode = (a: any) =>
    (a.codigoAtividade || a.referencia || a.nAtividade || a.numeroAtividade || a.no || a.codigo || "")
      .toString()
      .trim()
      .toLowerCase();

  const actName = getNormName(act);
  const actCode = getNormCode(act);

  if (!actName && !actCode) return false;

  const matches = allActs.filter((item) => {
    if (!item || item.id === act.id) return false;
    const itemName = getNormName(item);
    const itemCode = getNormCode(item);

    if (actName && actCode && itemName && itemCode) {
      return itemName === actName && itemCode === actCode;
    }
    if (actName && itemName && !actCode) {
      return itemName === actName;
    }
    if (actCode && itemCode && !actName) {
      return itemCode === actCode;
    }
    return false;
  });

  return matches.length > 0;
}

export function getActMonthIndex(act: any): number {
  const monthOrder: Record<string, number> = {
    Janeiro: 1,
    Fevereiro: 2,
    Março: 3,
    Abril: 4,
    Maio: 5,
    Junho: 6,
    Julho: 7,
    Agosto: 8,
    Setembro: 9,
    Outubro: 10,
    Novembro: 11,
    Dezembro: 12,
  };
  const months = Array.isArray(act.mesesRealizacao)
    ? act.mesesRealizacao
    : [act.mesRealizacao || act.mes].filter(Boolean);
  if (months.length > 0) {
    const indices = months
      .map((m: string) => monthOrder[m] || 13)
      .sort((a: number, b: number) => a - b);
    if (indices[0] <= 12) return indices[0];
  }
  const trimestres = Array.isArray(act.trimestres)
    ? act.trimestres
    : [act.trimestre].filter(Boolean);
  if (trimestres.includes("I") || trimestres.includes("1º Trimestre"))
    return 1;
  if (trimestres.includes("II") || trimestres.includes("2º Trimestre"))
    return 4;
  if (trimestres.includes("III") || trimestres.includes("3º Trimestre"))
    return 7;
  if (trimestres.includes("IV") || trimestres.includes("4º Trimestre"))
    return 10;
  return 13;
}

export function formatSafeDate(dateVal: any): string {
  if (!dateVal) return "-";
  const dateStr = String(dateVal).trim();
  if (/^\d{2}[/\-]\d{2}[/\-]\d{4}$/.test(dateStr)) {
    return dateStr;
  }
  const yyyymmddMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (yyyymmddMatch) {
    return `${yyyymmddMatch[3]}/${yyyymmddMatch[2]}/${yyyymmddMatch[1]}`;
  }
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("pt-PT");
    }
  } catch (e) {
    console.error("Erro ao formatar data:", e);
  }
  return dateStr;
}

export function getParentRubrica(rubricaRaw?: string): string {
  const clean = (rubricaRaw || "").trim().toLowerCase();
  const codeMatch = clean.match(/^(\d{2,6})/);
  const code = codeMatch ? codeMatch[1] : "";

  if (code.startsWith("11") || clean.includes("ajuda") || clean.includes("diari") || clean.includes("pessoal")) {
    return "Ajudas de Custo (Capítulo 11)";
  }
  if (code.startsWith("121") || (code.startsWith("12") && !code.startsWith("122")) || clean.includes("material") || clean.includes("bens") || clean.includes("consumo") || clean.includes("duradouro") || clean.includes("combustivel") || clean.includes("generos") || clean.includes("medicament") || clean.includes("escritorio") || clean.includes("fardamento")) {
    return "Bens e Materiais (Capítulo 12.1)";
  }
  if (code.startsWith("122") || clean.includes("servico") || clean.includes("comunicacao") || clean.includes("agua") || clean.includes("energia") || clean.includes("manutencao") || clean.includes("reparacao") || clean.includes("renda") || clean.includes("seguro") || clean.includes("limpeza")) {
    return "Serviços (Capítulo 12.2)";
  }
  if (code.startsWith("143") || clean.includes("bolsa") || clean.includes("transferencia") || clean.includes("comunidade") || clean.includes("familia")) {
    return "Transferências e Subsídios (Capítulo 14)";
  }
  if (clean.includes("salario") || clean.includes("vencimento") || clean.includes("remuneracao")) {
    return "Remunerações do Pessoal";
  }
  return "Outras Despesas de Funcionamento";
}

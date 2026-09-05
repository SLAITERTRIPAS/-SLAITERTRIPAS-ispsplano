import React, { useState, useEffect, useMemo } from "react";
import { getUserWorkspace } from "../../lib/auth";
import {
  ChevronRight,
  ChevronLeft,
  Save,
  Plus,
  Trash2,
  Upload,
  Download,
  Info,
  X,
  Clock,
  AlertTriangle,
  DollarSign,
  Printer,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { openPrintDocumentWindow } from "../../lib/printUtils";
import { getUserAllocatedDetails as getSharedUserAllocatedDetails } from "../../lib/allocationUtils";
import { firestoreService } from "../../lib/firestoreService";
import { DraftModal } from "../../components/ui/DraftMemoryUI";
import {
  UNIDADES_ORGANICAS_SISTEMA,
  UNIDADES_CENTRAIS,
  UNIDADES_ORGANICAS,
  UNIDADES_ORGANICAS_SERVICOS,
  DEPARTAMENTOS,
  REPARTICOES,
  SECTORES,
  CURSOS,
  PROVINCIAS,
  DISTANCIAS_SONGO,
  RUBRICAS,
  NECESSIDADES,
  getNecessidadesOptions,
  formatNecessidadeWithCode,
  PRODUTOS_POR_NECESSIDADE,
  FONTES_RECEITA,
  PRIORIDADES,
  TRIMESTRES,
  MESES,
  VIATURAS,
  FUNCIONARIOS,
} from "../../constants/formOptions";
import { EFETIVO_GERAL_DATA } from "../../constants/colaboradoresList";
import {
  getUnifiedProducts,
  saveUnifiedProduct,
  getDepartmentStoredActivities,
  saveDepartmentActivity,
  collectProductFromRubric,
} from "../../lib/unifiedManager";
import {
  getDirectionAbbreviation,
  getDepartmentAbbreviation,
  getReparticaoAbbreviation,
  getActivityInitials,
  getInitials,
  convertToYYYYMMDD,
  getDistanciaSongo,
  getCircularReplacer,
  safeJSONStringify,
} from "../../lib/utils";

import * as XLSX from "xlsx";
import SearchableSelect from "../../components/ui/SearchableSelect";
import ModalEnvioSetorResponsavel from "../../components/ModalEnvioSetorResponsavel";
import { DestinatarioInfo, resolverDestinatarioSetorEResponsavel } from "../../lib/responsaveisService";
import { subscribePeriodoPlanificacao, isPlanificacaoAberta } from "../../lib/planningPeriodService";
import { PeriodoPlanificacao } from "../../types";

interface ActivityFormProps {
  key?: string | number | null;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void> | void;
  planType: string;
  sectorName?: string;
  plannedActivitiesCount?: number;
  plannedActivitiesProp?: any[];
  colaboradores?: any[];
  dbVehiclesProp?: any[];
  title?: string;
  initialData?: any;
  user?: any;
  readOnly?: boolean;
}

const getCleanNecessidadeKey = (nec: string): string => {
  if (!nec) return "";
  // Tenta extrair o código (ex: 121006)
  const codeMatch = nec.match(/^(\d+)/);
  if (codeMatch) return codeMatch[1];
  // Se não tiver código, retorna o nome limpo e minúsculo
  return nec.replace(/^\d+\s*-\s*/, "").trim().toLowerCase();
};

const getFilteredProductsForRubrica = (
  productsList: any[],
  rubricaName?: string,
  necessidadeName?: string
) => {
  if (!productsList || productsList.length === 0) return [];

  const normRub = (rubricaName || "").toLowerCase().trim();
  const normNec = (necessidadeName || "").toLowerCase().trim();

  // Extrair código numérico de Rubrica (ex: 121, 122, 112, 1434)
  const rubCode = normRub.match(/\d+/)?.[0];
  
  // Extrair nome limpo da Necessidade sem códigos numéricos iniciais
  const cleanNec = normNec.replace(/^\d+\s*[-_.]?\s*/, "").trim();
  const necCode = normNec.match(/^(\d+)/)?.[1];

  // Agrupar produtos por nível de correspondência
  const exactNecMatches: any[] = [];
  const categoryMatches: any[] = [];
  const otherMatches: any[] = [];

  productsList.forEach((p: any) => {
    const pRub = (p.rubrica || "").toLowerCase();
    const pNec = (p.necessidade || "").toLowerCase();
    const pCat = (p.categoria || "").toLowerCase();
    const cleanPNec = pNec.replace(/^\d+\s*[-_.]?\s*/, "").trim();
    const pNecCode = pNec.match(/^(\d+)/)?.[1];
    const pRubCode = pRub.match(/\d+/)?.[0] || pCat.match(/\d+/)?.[0];

    // 1. Verificação de correspondência na Necessidade
    const isNecMatch =
      (cleanNec && cleanPNec && (cleanPNec === cleanNec || cleanPNec.includes(cleanNec) || cleanNec.includes(cleanPNec))) ||
      (necCode && pNecCode && necCode === pNecCode);

    if (isNecMatch) {
      exactNecMatches.push(p);
      return;
    }

    // 2. Verificação de correspondência na Categoria / Rubrica
    const isCatMatch =
      (rubCode && (pRubCode === rubCode || pCat.includes(rubCode) || pRub.includes(rubCode))) ||
      (normRub.includes("bens") && (pRub.includes("bens") || pCat.includes("121") || pRub.includes("121"))) ||
      (normRub.includes("serviços") && (pRub.includes("serviços") || pCat.includes("122") || pRub.includes("122"))) ||
      (normRub.includes("pessoal") && (pRub.includes("pessoal") || pCat.includes("112") || pRub.includes("112"))) ||
      (normRub.includes("transferência") && (pRub.includes("transferência") || pCat.includes("1434") || pRub.includes("1434")));

    if (isCatMatch) {
      categoryMatches.push(p);
      return;
    }

    otherMatches.push(p);
  });

  // Se houver necessidade indicada e existirem produtos correspondentes a esse grupo
  if (cleanNec && exactNecMatches.length > 0) {
    return exactNecMatches;
  }

  // Se houver produtos da categoria/rubrica
  if (categoryMatches.length > 0) {
    return categoryMatches;
  }

  // Fallback seguro: retorne a lista inteira de produtos da base de dados
  return productsList;
};

const normalizeStr = (str: any): string => {
  if (!str) return "";
  return String(str)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
};

function calculateNextNum(acts: any[], targetSector?: string, currentUserArea?: string): number {
  let maxNum = 0;
  
  const isGeneric = (s: string) => {
    const norm = normalizeStr(s);
    return (
      !norm ||
      norm === "plano de atividades" ||
      norm === "plano setorial" ||
      norm === "plano institucional" ||
      norm === "geral" ||
      norm === "sistema" ||
      norm === "diretor geral" ||
      norm === "admin" ||
      norm === "administrador" ||
      norm === "songo"
    );
  };

  const cleanTarget = !isGeneric(targetSector || "")
    ? (targetSector || "")
    : !isGeneric(currentUserArea || "")
      ? (currentUserArea || "")
      : "";

  const sectorFilter = normalizeStr(cleanTarget);

  if (acts && Array.isArray(acts)) {
    acts.forEach((act: any) => {
      if (!act) return;

      if (sectorFilter) {
        const actSetor = normalizeStr(act.setor || act.sector || "");
        const actRep = normalizeStr(act.reparticao || "");
        const actDept = normalizeStr(act.departamento || act.unidadeOrganica || "");

        const matchesSector =
          (actSetor && (actSetor === sectorFilter || actSetor.includes(sectorFilter) || sectorFilter.includes(actSetor))) ||
          (actRep && (actRep === sectorFilter || actRep.includes(sectorFilter) || sectorFilter.includes(actRep))) ||
          (!actSetor && !actRep && actDept && (actDept === sectorFilter || actDept.includes(sectorFilter) || sectorFilter.includes(actDept)));

        if (!matchesSector) {
          return;
        }
      }

      const directVals = [act.numeroAtividade, act.nAtividade, act.no, act.ordem];
      let foundNum = 0;
      for (const val of directVals) {
        if (val !== undefined && val !== null && String(val).trim() !== "") {
          const parsed = parseInt(String(val).replace(/\D/g, ""), 10);
          if (!isNaN(parsed) && parsed > foundNum) {
            foundNum = parsed;
          }
        }
      }

      if (foundNum > 0) {
        if (foundNum > maxNum) maxNum = foundNum;
      } else {
        const ref = String(act.codigoAtividade || act.referencia || "");
        const match = ref.match(/\/(\d+)(\/|$)/);
        if (match) {
          const parsed = parseInt(match[1], 10);
          if (!isNaN(parsed) && parsed > maxNum) {
            maxNum = parsed;
          }
        }
      }
    });
  }
  return maxNum + 1;
}

const extractMonthsFromActivity = (act: any): string[] => {
  const months = new Set<string>();
  if (act?.mesesRealizacao && Array.isArray(act.mesesRealizacao)) {
    act.mesesRealizacao.forEach((m: any) => {
      if (m) months.add(normalizeStr(m));
    });
  } else if (act?.mesesRealizacao && typeof act.mesesRealizacao === "string") {
    act.mesesRealizacao.split(/[,;\/]/).forEach((m: string) => {
      if (m.trim()) months.add(normalizeStr(m.trim()));
    });
  }
  if (act?.mesRealizacao) months.add(normalizeStr(act.mesRealizacao));
  if (act?.mes) months.add(normalizeStr(act.mes));
  if (act?.trimestres && Array.isArray(act.trimestres)) {
    act.trimestres.forEach((t: any) => {
      if (t) months.add(normalizeStr(t));
    });
  }
  return Array.from(months);
};

const checkActivityDuplicates = (
  candidate: any,
  existingList: any[],
  currentEditingId?: string
) => {
  const candName = normalizeStr(
    candidate.nomeAtividade || candidate.title || candidate.designacao
  );
  const candCode = normalizeStr(
    candidate.codigoAtividade ||
      candidate.numeroAtividade ||
      candidate.nAtividade ||
      candidate.no ||
      candidate.referencia
  );
  const candDept = normalizeStr(candidate.departamento || candidate.unidadeOrganica || "");
  const candMonths = extractMonthsFromActivity(candidate);

  if (!candName && !candCode) return { isDuplicate: false };

  for (const act of existingList || []) {
    if (!act) continue;
    const actId = act.id || act._id || act.docId;
    if (currentEditingId && actId && String(actId) === String(currentEditingId)) {
      continue; // Ignorar o próprio registo durante a edição
    }

    const actName = normalizeStr(
      act.nomeAtividade || act.title || act.designacao
    );
    const actCode = normalizeStr(
      act.codigoAtividade ||
        act.numeroAtividade ||
        act.nAtividade ||
        act.no ||
        act.referencia
    );
    const actDept = normalizeStr(act.departamento || act.unidadeOrganica || "");

    const isSameName = candName !== "" && candName === actName;
    const isSameCode = candCode !== "" && candCode === actCode;
    const isSameDept = candDept === actDept;

    if ((isSameName || isSameCode) && isSameDept) {
      const actMonths = extractMonthsFromActivity(act);

      // Verificação de sobreposição de mês
      let hasOverlapMonth = false;
      if (candMonths.length > 0 && actMonths.length > 0) {
        hasOverlapMonth = candMonths.some((cm) =>
          actMonths.some((am) => cm.includes(am) || am.includes(cm))
        );
      } else {
        // Se meses não foram especificados no candidato ou existente, assume sobreposição de período
        hasOverlapMonth = true;
      }

      if (hasOverlapMonth) {
        return {
          isDuplicate: true,
          type: "ABORT_DUPLICATE",
          existingActivity: act,
          candName: candidate.nomeAtividade || candidate.title,
          actName: act.nomeAtividade || act.title,
          candCode: candidate.numeroAtividade || candidate.codigoAtividade || candidate.no,
          months: candMonths.length > 0 ? candMonths : actMonths,
        };
      } else {
        return {
          isDuplicate: false,
          isDifferentMonth: true,
          existingActivity: act,
          candName: candidate.nomeAtividade || candidate.title,
          candCode: candidate.numeroAtividade || candidate.codigoAtividade || candidate.no,
          candMonths,
          actMonths,
        };
      }
    }
  }

  return { isDuplicate: false };
};

export default function ActivityForm({
  onClose,
  onSubmit,
  planType,
  sectorName,
  plannedActivitiesCount = 0,
  plannedActivitiesProp = [],
  colaboradores = [],
  dbVehiclesProp = [],
  title,
  initialData,
  user,
  readOnly = false,
}: ActivityFormProps) {
  const activeUser = useMemo(() => {
    if (user && (user.nome || user.name || user.fullName || user.direcao || user.departamento)) return user;
    try {
      const stored = localStorage.getItem("sigep_logged_in_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.nome || parsed.name || parsed.fullName || parsed.direcao || parsed.departamento || parsed.id)) {
          return parsed;
        }
      }
      const storedUser = localStorage.getItem("sigep_user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed && (parsed.nome || parsed.name || parsed.fullName || parsed.direcao || parsed.departamento || parsed.id)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Erro ao obter utilizador logado em ActivityForm:", e);
    }
    return user || null;
  }, [user]);
  const [plannedActivities, setPlannedActivities] = useState<any[]>([]);

  useEffect(() => {
    if (plannedActivitiesProp && plannedActivitiesProp.length > 0) {
      // Privacidade de Atividades: Cada setor vê apenas as suas próprias atividades
      // O filtro prioriza o setor que está sendo planejado (sectorName) para garantir isolamento
      const isSuperUser = 
        user?.role === "admin" || 
        user?.isOwner === true || 
        (user?.title || "").toLowerCase().includes("diretor geral") ||
        (user?.cargoChefia || "").toLowerCase().includes("diretor geral");

      const userArea = (user?.setor || user?.reparticao || user?.departamento || "").toLowerCase().trim();
      const currentPlanningSector = (sectorName || "").toLowerCase().trim();

      const filtered = plannedActivitiesProp.filter((a: any) => {
        if (!a) return false;
        const actSector = (
          a.setor || 
          a.unidadeSelecionada || 
          a.reparticao || 
          a.departamento || 
          a.unidadeOrganica || 
          ""
        ).toLowerCase().trim();

        // Se houver um setor específico sendo visualizado/planejado, o isolamento deve ser total
        if (currentPlanningSector && currentPlanningSector !== "plano setorial" && currentPlanningSector !== "plano do departamento") {
          return actSector === currentPlanningSector || actSector.includes(currentPlanningSector) || currentPlanningSector.includes(actSector);
        }

        // Caso contrário, aplica a lógica de permissão baseada no perfil e área do usuário
        if (isSuperUser) return true;
        
        return userArea !== "" && (actSector === userArea || actSector.includes(userArea) || userArea.includes(actSector));
      });

      setPlannedActivities(filtered);
    } else {
      setPlannedActivities([]);
    }
  }, [plannedActivitiesProp, user]);

  const [step, setStep] = useState(1);
  const [autoFilled, setAutoFilled] = useState(false);
  const [autoFilledFromDynamic, setAutoFilledFromDynamic] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(
    initialData?.selectedCategory ||
      initialData?.unidadeOrganica ||
      initialData?.direcao ||
      "",
  );
  const [allocationSource, setAllocationSource] = useState<string | null>(null);
  const [weekendWarning, setWeekendWarning] = useState<string | null>(null);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [showModalEnvio, setShowModalEnvio] = useState(false);
  const [duplicateAlert, setDuplicateAlert] = useState<{
    isOpen: boolean;
    type: "abort" | "different_months";
    title: string;
    message: string;
    existingActivity?: any;
    months?: string[];
  } | null>(null);

  const [periodoPlanificacao, setPeriodoPlanificacao] = useState<PeriodoPlanificacao | null>(null);

  useEffect(() => {
    const unsub = subscribePeriodoPlanificacao((p) => {
      setPeriodoPlanificacao(p);
    });
    return () => unsub();
  }, []);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    async function load() {
      const p = await getUnifiedProducts();
      setProducts(p);
      setLoadingProducts(false);
    }
    load();
  }, []);

  const totalSteps = 9;
  const nextYear = initialData?.ano
    ? Number(initialData.ano)
    : new Date().getFullYear() + 1;

  const isDPEP = useMemo(() => {
    if (!user) return false;
    const titleUpper = (
      user.title ||
      user.cargo ||
      user.cargoChefia ||
      ""
    ).toUpperCase();
    const deptUpper = (user.departamento || "").toUpperCase();
    const roleUpper = (user.role || "").toUpperCase();
    return (
      titleUpper.includes("DPEP") ||
      deptUpper.includes("DPEP") ||
      roleUpper.includes("DPEP") ||
      titleUpper.includes("PLANIFICAÇÃO") ||
      deptUpper.includes("PLANIFICAÇÃO") ||
      user.role === "admin" ||
      user.role === "proprietario"
    );
  }, [user]);

  const getMonthNumber = (monthName: string): string => {
    const map: { [key: string]: string } = {
      Janeiro: "01",
      Fevereiro: "02",
      Março: "03",
      Abril: "04",
      Maio: "05",
      Junho: "06",
      Julho: "07",
      Agosto: "08",
      Setembro: "09",
      Outubro: "10",
      Novembro: "11",
      Dezembro: "12",
    };
    return map[monthName] || "01";
  };

  const isWeekend = (
    dateStr: string,
  ): { isWeekend: boolean; dayName: string } => {
    if (!dateStr) return { isWeekend: false, dayName: "" };
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const localDate = new Date(year, month, day);
      const dayOfWeek = localDate.getDay(); // 0 is Sunday, 6 is Saturday
      if (dayOfWeek === 0) {
        return { isWeekend: true, dayName: "Domingo" };
      } else if (dayOfWeek === 6) {
        return { isWeekend: true, dayName: "Sábado" };
      }
    }
    return { isWeekend: false, dayName: "" };
  };

  const getMonthDateLimits = (monthName: string, year: number) => {
    const monthMap: { [key: string]: { start: string; end: string } } = {
      Janeiro: { start: "01-01", end: "01-31" },
      Fevereiro: { start: "02-01", end: "02-29" },
      Março: { start: "03-01", end: "03-31" },
      Abril: { start: "04-01", end: "04-30" },
      Maio: { start: "05-01", end: "05-31" },
      Junho: { start: "06-01", end: "06-30" },
      Julho: { start: "07-01", end: "07-31" },
      Agosto: { start: "08-01", end: "08-31" },
      Setembro: { start: "09-01", end: "09-30" },
      Outubro: { start: "10-01", end: "10-31" },
      Novembro: { start: "11-01", end: "11-30" },
      Dezembro: { start: "12-01", end: "12-31" },
    };
    const suffix = monthMap[monthName] || { start: "01-01", end: "12-31" };
    return {
      min: `${year}-${suffix.start}`,
      max: `${year}-${suffix.end}`,
    };
  };

  const [formData, setFormData] = useState<any>(() => {
    const targetArea =
      initialData?.setor ||
      initialData?.reparticao ||
      user?.setor ||
      user?.reparticao ||
      sectorName ||
      initialData?.departamento ||
      (user ? getUserWorkspace(user) : "");
    const nextNum = calculateNextNum(plannedActivitiesProp, targetArea, user ? getUserWorkspace(user) : "");
    if (initialData) {
      return {
        unidadeCentral: initialData.unidadeCentral || "",
        unidadeOrganica:
          initialData.unidadeOrganica || initialData.selectedCategory || "",
        servicoCentral: initialData.servicoCentral || "",
        unidadeSelecionada:
          initialData.unidadeSelecionada || initialData.direcao || "Songo",
        departamento: initialData.departamento || "",
        reparticao: initialData.reparticao || "",
        setor: initialData.setor || "",
        curso: initialData.curso || "",
        fonteReceita:
          initialData.fonteReceita ||
          initialData.orcamento ||
          "Receitas Próprias",
        prioridade: initialData.prioridade || initialData.nivel || "Média",
        prioridadeProposta:
          initialData.prioridadeProposta ||
          initialData.prioridade ||
          initialData.nivel ||
          "Média",
        numeroAtividade:
          initialData.numeroAtividade ||
          initialData.nAtividade ||
          initialData.no ||
          String(nextNum).padStart(3, "0"),
        codigoAtividade:
          initialData.codigoAtividade || initialData.referencia || "",
        tipoPlano: initialData.tipoPlano || "Setorial",

        necessitaAquisicao: initialData.necessitaAquisicao || "Não",
        necessitaContratacao: initialData.necessitaContratacao || "Não",
        nomeAtividade: initialData.nomeAtividade || initialData.title || "",
        objetivoAtividade:
          initialData.objetivoAtividade || initialData.objetivoActividade || "",

        realizacaoProvincia:
          initialData.realizacaoProvincia ||
          initialData.trabalhoProvincia ||
          "",
        realizacaoDistrito:
          initialData.realizacaoDistrito || initialData.trabalhoDistrito || "",
        trabalhoProvincia:
          initialData.trabalhoProvincia ||
          initialData.realizacaoProvincia ||
          "",
        trabalhoDistrito:
          initialData.trabalhoDistrito || initialData.realizacaoDistrito || "",

        responsavel: initialData.responsavel || "",
        responsavelEmail: initialData.responsavelEmail || "",
        outrosColaboradores: initialData.outrosColaboradores || "",
        nVezesAno: initialData.nVezesAno || "1",
        trimestre: initialData.trimestre || "",
        trimestres:
          initialData.trimestres ||
          (initialData.trimestre ? [initialData.trimestre] : []),
        mesRealizacao: initialData.mesRealizacao || initialData.dataMes || "",
        mesesRealizacao:
          initialData.mesesRealizacao ||
          (initialData.mesRealizacao
            ? [initialData.mesRealizacao]
            : initialData.dataMes
              ? [initialData.dataMes]
              : []),
        mesExecucao: initialData.mesExecucao || "",
        dataInicio: convertToYYYYMMDD(initialData.dataInicio),
        dataFim: convertToYYYYMMDD(initialData.dataFim),
        totalDias: initialData.totalDias || 0,
        frequencia: initialData.frequencia || "Mensal",
        mesesDetalhes: initialData.mesesDetalhes || {},

        necessitaTransporte: initialData.necessitaTransporte || "Não",
        viatura: initialData.viatura || "",
        motorista: initialData.motorista || "",
        distanciaDestino: initialData.distanciaDestino || "",
        distanciaKm: initialData.distanciaKm || "",
        litrosGasoleo: initialData.litrosGasoleo || "",
        precoLitro: initialData.precoLitro || "",
        tipoCombustivel: initialData.tipoCombustivel || "Gasóleo",
        valorTotalGasoleo: initialData.valorTotalGasoleo || "",

        rubricas:
          initialData.rubricas && initialData.rubricas.length > 0
            ? initialData.rubricas.map((r: any, rIdx: number) => ({
                ...r,
                id: r.id || Date.now() + rIdx,
              }))
            : [
                {
                  id: 1,
                  rubrica: initialData.orcamento || "",
                  necessidade: "",
                  especificacao: "",
                  detalhes: "",
                  pessoas: 1,
                  quantidade: 0,
                  dias: 0,
                  precoUnitario: initialData.valor || 0,
                  valorTotal: initialData.valor || 0,
                  pessoa: "",
                  valorDiario: 6000,
                  temMeioDia: false,
                  meioDia30: 0,
                },
              ],
        observacoes: initialData.observacoes || "",
        situacaoAtividade: initialData.situacaoAtividade || "Planificada",
        comissaoServico: initialData.comissaoServico || "",
        categoria: initialData.categoria || "",
        carreira: initialData.carreira || "",
      };
    }
    return {
      // Step 1: Identificação
      unidadeCentral: "",
      unidadeOrganica: "",
      servicoCentral: "",
      unidadeSelecionada: "Songo",
      departamento: "",
      reparticao: "",
      setor: "",
      curso: "",
      fonteReceita: "Receitas Próprias",
      prioridade: "Média",
      prioridadeProposta: "Média",
      numeroAtividade: String(nextNum).padStart(3, "0"),
      codigoAtividade: "",
      tipoPlano: "Setorial",

      // Step 2: Atividade
      necessitaAquisicao: "Não",
      necessitaContratacao: "Não",
      nomeAtividade: "",
      objetivoAtividade: "",

      // Step 3: Localização
      realizacaoProvincia: "Tete",
      realizacaoDistrito: "Cahora Bassa",
      postoAdministrativo: "",
      localidade: "",
      trabalhoProvincia: "Tete",
      trabalhoDistrito: "Cahora Bassa",

      // Step 4: RH e Tempo
      responsavel: "",
      responsavelEmail: "",
      outrosColaboradores:
        "Diretor-Geral; Editor Geral; UGEA; DICOSAFA; DAF; DP",
      nVezesAno: "1",
      trimestres: [],
      mesesRealizacao: [],
      mesExecucao: "",
      dataInicio: "",
      dataFim: "",
      totalDias: 0,
      frequencia: "Mensal",
      mesesDetalhes: {},

      // Step 5: Transporte
      necessitaTransporte: "Não",
      viatura: "",
      motorista: "",
      distanciaDestino: "",
      distanciaKm: "",
      litrosGasoleo: "",
      precoLitro: "",
      tipoCombustivel: "Gasóleo",
      valorTotalGasoleo: "",

      // Step 6: Rubricas
      rubricas: [],
      observacoes: "",
      situacaoAtividade: "Planificada",
      comissaoServico: "",
      categoria: "",
      carreira: "",
    };
  });

  const currentSector =
    formData.setor || sectorName || user?.sector || user?.setor || "";
  const sectorActivities = useMemo(() => {
    if (!currentSector) return [];
    return plannedActivities.filter(
      (a: any) =>
        a.setor &&
        String(a.setor).toLowerCase() === String(currentSector).toLowerCase() &&
        a.title,
    );
  }, [plannedActivities, currentSector]);

  // O preenchimento automático agora é gerido de forma unificada e precisa pelo useEffect principal de alocação de utilizador.

  const isCAG =
    String(user?.departamento || "").toLowerCase() === "cag" ||
    String(user?.unidade || "").toLowerCase() === "cag" ||
    String(user?.cargo || "").toUpperCase().includes("CAG") ||
    String(user?.funcao || "").toUpperCase().includes("CAG") ||
    String(user?.titulo || "").toUpperCase().includes("CAG") ||
    String(title || "").toUpperCase().includes("CAG");

  // Use Firestore colaboradores if available, fallback to FUNCIONARIOS
  const formatLabel = (c: any) => {
    if (!c) return "Responsável";
    return `${c.nome || "Colaborador"}`;
  };

  const getUniqueOptions = (list: any[]) => {
    const seen = new Set();
    return list
      .filter((item) => {
        if (seen.has(item.nome)) return false;
        seen.add(item.nome);
        return true;
      })
      .map((c) => ({ value: c.nome, label: formatLabel(c) }));
  };

  const responsavelOptions = useMemo(() => {
    const baseList = colaboradores.length > 0 ? colaboradores : EFETIVO_GERAL_DATA;

    // Filtragem por área selecionada no formulário
    let filteredByArea = baseList.filter((c) => {
      if (!c) return false;
      const cAny = c as any;

      // REGRA: Deve ser Cargo de Chefia (não Nenhum) OU Efetivo Geral (efetivo: true)
      const isChefia = cAny.cargoChefia && cAny.cargoChefia !== "Nenhum";
      const isEfetivoGeral = cAny.efetivo === true;
      
      if (!isChefia && !isEfetivoGeral) return false;

      // Filtragem hierárquica: Prioridade para o nível mais baixo selecionado no formulário
      if (formData.setor) {
        return (cAny.setor || cAny.sector) === formData.setor;
      }
      if (formData.reparticao) {
        return cAny.reparticao === formData.reparticao;
      }
      if (formData.departamento) {
        return cAny.departamento === formData.departamento;
      }
      if (formData.unidadeSelecionada) {
        return cAny.direcao === formData.unidadeSelecionada;
      }

      // Fallback para a direção do utilizador logado se nada estiver selecionado no formulário
      return user?.direcao ? cAny.direcao === user.direcao : true;
    });

    // Se a área selecionada estiver vazia (ex: setor novo sem colaboradores mapeados),
    // permitimos ver os colaboradores da Direção/Unidade Orgânica para não bloquear o formulário
    if (filteredByArea.length === 0) {
      filteredByArea = baseList.filter((c) => {
        if (!c) return false;
        const cAny = c as any;
        const isChefia = cAny.cargoChefia && cAny.cargoChefia !== "Nenhum";
        const isEfetivoGeral = cAny.efetivo === true;
        
        if (!isChefia && !isEfetivoGeral) return false;

        if (formData.unidadeSelecionada)
          return cAny.direcao === formData.unidadeSelecionada;
        return user?.direcao ? cAny.direcao === user.direcao : true;
      });
    }

    return getUniqueOptions(filteredByArea);
  }, [
    colaboradores,
    user,
    formData.unidadeSelecionada,
    formData.departamento,
    formData.reparticao,
    formData.setor,
  ]);

  const outrosColaboradoresOptions = useMemo(() => {
    const baseList = colaboradores.length > 0 ? colaboradores : EFETIVO_GERAL_DATA;

    // 1. Filtrar pela área selecionada
    const areaList = baseList.filter((c) => {
      if (!c) return false;
      const cAny = c as any;

      // REGRA: Puxar todos da Repartição de Pessoal que são Chefia ou Efetivo Geral
      const isChefia = cAny.cargoChefia && cAny.cargoChefia !== "Nenhum";
      const isEfetivoGeral = cAny.efetivo === true;
      
      if (!isChefia && !isEfetivoGeral) return false;

      if (formData.setor) return (cAny.setor || cAny.sector) === formData.setor;
      if (formData.reparticao) return cAny.reparticao === formData.reparticao;
      if (formData.departamento)
        return cAny.departamento === formData.departamento;
      if (formData.unidadeSelecionada)
        return cAny.direcao === formData.unidadeSelecionada;
      return user?.direcao ? cAny.direcao === user.direcao : true;
    });

    // 2. Identificar se existem Chefias/Diretores na área selecionada
    const headsInArea = areaList.filter((c) => {
      const cAny = c as any;
      const cargoLower = (
        cAny.cargoChefia ||
        cAny.cargo ||
        cAny.funcao ||
        cAny.categoria ||
        ""
      ).toLowerCase();
      const isChef =
        (cAny.cargoChefia && cAny.cargoChefia !== "Nenhum") ||
        cargoLower.includes("chefe") ||
        cargoLower.includes("diretor") ||
        cargoLower.includes("responsável") ||
        cargoLower.includes("coordenador");

      // REGRA: Apenas chefes com mandato ATIVO (ou sem status definido, para retrocompatibilidade)
      const isActiveMandate =
        !cAny.mandatoStatus || cAny.mandatoStatus === "Ativo";

      return isChef && isActiveMandate;
    });

    // 3. REGRA: Mostrar sempre todos os colaboradores da área (Chefes e Técnicos)
    let finalSelection = areaList;

    // 4. Fallback final se a área estiver totalmente deserta
    if (finalSelection.length === 0) {
      finalSelection = baseList.filter((c) => {
        const cAny = c as any;
        const sameDir = user?.direcao ? cAny.direcao === user.direcao : true;
        const isDG = (cAny.cargo || "").toLowerCase().includes("diretor geral");
        return sameDir || isDG;
      });
    }

    // 5. Adicionar os colaboradores com cargos específicos obrigatórios (FORADOS DA LISTA DOS COLABORADORES DA DIRECAO)
    const extraCargos = [
      "DIRETOR GERAL",
      "DIRETOR DA DICOSAFA",
      "DIRETOR DA DICOSSER",
      "DIRETOR DO CIE",
      "CHEFE DO DP",
      "CHEFE DA DAF",
      "CHEFE DA UGEA",
      "CHEFE DE DPEP",
      "CHEFE DE RH",
    ];

    const extraColaboradores = baseList.filter((c) => {
      if (!c) return false;
      const cargoUpper = (
        (c as any).cargo ||
        (c as any).funcao ||
        (c as any).categoria ||
        ""
      )
        .toUpperCase()
        .trim();
      return (
        extraCargos.some(
          (ec) =>
            cargoUpper === ec ||
            cargoUpper.includes(ec) ||
            ec.includes(cargoUpper),
        ) && cargoUpper.length > 2
      );
    });

    // Combinar as duas seleções removendo duplicados por nome do colaborador
    const combinedSelection = [...finalSelection, ...extraColaboradores];
    const seenNames = new Set();
    const uniqueCombined: any[] = [];
    for (const c of combinedSelection) {
      if (!c) continue;
      const name = (c as any).nome || (c as any).name;
      if (name && !seenNames.has(name)) {
        seenNames.add(name);
        uniqueCombined.push(c);
      }
    }

    const options = uniqueCombined.map((c) => ({
      value: (c as any).nome || (c as any).name || "Colaborador",
      label: `${(c as any).nome || (c as any).name} (${(c as any).cargo || (c as any).funcao || "Colaborador"})`,
    }));

    return options;
  }, [
    colaboradores,
    user,
    formData.unidadeSelecionada,
    formData.departamento,
    formData.reparticao,
    formData.setor,
  ]);

  const [error, setError] = useState<string | null>(null);
  const [allocationWarning, setAllocationWarning] = useState<string | null>(
    null,
  );

  const [dbVehicles, setDbVehicles] = useState<string[]>(dbVehiclesProp || []);

  const hasServiceRubrica = useMemo(() => {
    return (formData.rubricas || []).some((r) => r.rubrica === "Serviços");
  }, [formData.rubricas]);

  useEffect(() => {
    if (dbVehiclesProp && dbVehiclesProp.length > 0) {
      setDbVehicles(dbVehiclesProp);
    }
  }, [dbVehiclesProp]);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [isSyncingPrice, setIsSyncingPrice] = useState(false);
  const [priceSynced, setPriceSynced] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Deterministic form ID: 'new' or 'edit_[id]'
  const FORM_ID = initialData?.id
    ? `activity_edit_${initialData.id}`
    : "activity_new";

  // Draft key unique to user and activity context
  const DRAFT_KEY = `activity_draft_${user?.id || "anonymous"}_${FORM_ID}`;

  useEffect(() => {
    // Check for existing draft on mount
    const checkDraft = async () => {
      if (!user?.id) {
        setIsDraftLoaded(true);
        return;
      }

      try {
        console.log(`[Draft] Verificando rascunhos para ${FORM_ID}...`);
        // 1. Check Cloud Draft (Priority)
        const cloudDraft = await firestoreService.drafts.getByUserAndForm(
          user.id,
          FORM_ID,
        );

        // 2. Check Local Draft (Fallback)
        const localSaved = localStorage.getItem(DRAFT_KEY);

        if (cloudDraft || localSaved) {
          console.log(`[Draft] Rascunho encontrado para ${FORM_ID}`);
          setShowDraftModal(true);
        } else {
          setIsDraftLoaded(true);
        }
      } catch (err) {
        console.error("Erro ao verificar rascunhos:", err);
        setIsDraftLoaded(true);
      }
    };

    checkDraft();
  }, [user?.id, initialData?.id]);

  useEffect(() => {
    // Auto-save to Firestore and localStorage on every change
    // Only save if draft was loaded (to prevent overwriting with initial state)
    if (isDraftLoaded && user?.id) {
      const draftData = {
        step,
        formData,
        lastSync: new Date().toISOString(),
      };

      // Immediate Local Backup
      localStorage.setItem(DRAFT_KEY, safeJSONStringify(draftData));

      // Debounced Cloud Sync
      const timeoutId = setTimeout(() => {
        setIsSyncing(true);
        firestoreService.drafts
          .save(user.id, FORM_ID, draftData)
          .finally(() => setIsSyncing(false));
      }, 15000); // 15 second debounce for cloud sync to conserve quota

      return () => clearTimeout(timeoutId);
    }
  }, [formData, step, isDraftLoaded, user?.id, FORM_ID]);

  const recoverDraft = async () => {
    setShowDraftModal(false);
    if (!user?.id) return;

    try {
      // Priority to Cloud Draft
      let draftToRecover = await firestoreService.drafts.getByUserAndForm(
        user.id,
        FORM_ID,
      );

      // Fallback to Local if Cloud is empty
      if (!draftToRecover) {
        const localData = localStorage.getItem(DRAFT_KEY);
        if (localData) draftToRecover = JSON.parse(localData);
      }

      if (draftToRecover) {
        const parsed: any = draftToRecover;
        if (parsed && parsed.formData) {
          setFormData(parsed.formData);
          if (parsed.step) {
            setStep(parsed.step);
          }
          if (parsed.formData.unidadeCentral) {
            setSelectedCategory(parsed.formData.unidadeCentral);
          }
        } else {
          setFormData(parsed);
          if (parsed.unidadeCentral) {
            setSelectedCategory(parsed.unidadeCentral);
          }
        }
      }
    } catch (e) {
      console.error("Erro ao recuperar rascunho", e);
    }

    setIsDraftLoaded(true);
    setShowDraftModal(false);
  };

  const discardDraft = async () => {
    if (user?.id) {
      await firestoreService.drafts.deleteByUserAndForm(user.id, FORM_ID);
    }
    localStorage.removeItem(DRAFT_KEY);
    setIsDraftLoaded(true);
    setShowDraftModal(false);
  };

  const handleMonthDateChange = (
    month: string,
    field: "dataInicio" | "dataFim",
    value: string,
    currentMesesRealizacao?: string[],
  ) => {
    let val = value;
    if (val) {
      const parts = val.split("-");
      if (parts.length === 3) {
        val = `${nextYear}-${parts[1]}-${parts[2]}`;
      }

      const weekendCheck = isWeekend(val);
      if (weekendCheck.isWeekend) {
        const warningMsg = `A data de ${field === "dataInicio" ? "início" : "fim"} do mês de ${month} (${val.split("-").reverse().join("/")}) calhará no ${weekendCheck.dayName}. Por favor, escolha outra data!`;
        setWeekendWarning(warningMsg);
        try {
          alert(
            `Esta data calhará no ${weekendCheck.dayName}. Escolha outra data.`,
          );
        } catch (e) {
          console.warn("Iframe blocked standard alert:", e);
        }
        val = ""; // Limpar a data de final de semana
      } else {
        setWeekendWarning(null); // Limpar aviso caso data seja válida
      }
    }

    const updatedMesesDetalhes = {
      ...(formData.mesesDetalhes || {}),
      [month]: {
        ...(formData.mesesDetalhes?.[month] || {}),
        [field]: val,
      },
    };

    const targetMeses =
      currentMesesRealizacao || formData.mesesRealizacao || [];

    // Sincronizar para as datas gerais da atividade
    let minDateStr = "";
    let maxDateStr = "";
    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    targetMeses.forEach((m) => {
      const det =
        m === month ? updatedMesesDetalhes[m] : formData.mesesDetalhes?.[m];
      if (det) {
        if (det.dataInicio) {
          const d = new Date(det.dataInicio);
          if (!isNaN(d.getTime())) {
            if (!minDate || d < minDate) {
              minDate = d;
              minDateStr = det.dataInicio;
            }
          }
        }
        if (det.dataFim) {
          const d = new Date(det.dataFim);
          if (!isNaN(d.getTime())) {
            if (!maxDate || d > maxDate) {
              maxDate = d;
              maxDateStr = det.dataFim;
            }
          }
        }
      }
    });

    let days = 0;
    if (minDateStr && maxDateStr) {
      const d1 = new Date(minDateStr);
      const d2 = new Date(maxDateStr);
      if (d1 <= d2) {
        days = Math.max(
          0,
          Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1,
        );
      }
    }

    setFormData((prev) => ({
      ...prev,
      mesesDetalhes: updatedMesesDetalhes,
      dataInicio: minDateStr,
      dataFim: maxDateStr,
      totalDias: days,
    }));
  };

  const syncPriceWithARENE = () => {
    setIsSyncingPrice(true);
    setTimeout(() => {
      setIsSyncingPrice(false);
      setPriceSynced(true);
      setFormData((prev) => {
        const tipo = prev.tipoCombustivel || "Gasóleo";
        let precoOficial = 125;
        if (tipo === "Gasolina") precoOficial = 100;
        if (tipo === "Petróleo") precoOficial = 95;
        return {
          ...prev,
          precoLitro: precoOficial,
          valorTotalGasoleo: parseFloat(
            (prev.litrosGasoleo * precoOficial).toFixed(2),
          ),
        };
      });
    }, 1200);
  };

  // Load planned activities only if not provided by props
  useEffect(() => {
    if (!plannedActivitiesProp || plannedActivitiesProp.length === 0) {
      const unsub = firestoreService.matrixActivities.subscribe(
        (data) => {
          setPlannedActivities(data || []);
        },
        undefined,
        "createdAt",
        100,
      );
      return () => unsub();
    }
  }, [plannedActivitiesProp]);

  // Load real vehicles only if not provided by props
  useEffect(() => {
    if (!dbVehiclesProp || dbVehiclesProp.length === 0) {
      const unsub = firestoreService.materiais_bens.subscribe(
        (data) => {
          if (data && Array.isArray(data)) {
            const vehicleList = data
              .filter((b) => b.categoria === "Veículo" || b.tipo === "Veículo")
              .map((v) =>
                `${v.marca || ""} ${v.modelo || ""} (${v.matricula || v.nome || ""})`.trim(),
              )
              .filter(Boolean);
            setDbVehicles(vehicleList);
          }
        },
        undefined,
        "createdAt",
        50,
      );
      return () => unsub();
    }
  }, [dbVehiclesProp]);

  // Countdown effect to auto-close form
  useEffect(() => {
    if (formData.frequencia === "Anual") {
      if (formData.totalDias !== 12) {
        setFormData((prev) => ({ ...prev, totalDias: 12 }));
      }
      return;
    }

    if (!formData.mesesRealizacao || formData.mesesRealizacao.length === 0)
      return;

    const firstMonth = formData.mesesRealizacao[0];
    const detalhe = formData.mesesDetalhes?.[firstMonth];
    let total = 0;
    if (detalhe?.dataInicio && detalhe?.dataFim) {
      const d1 = new Date(detalhe.dataInicio);
      const d2 = new Date(detalhe.dataFim);
      if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
        const diffTime = Math.abs(d2.getTime() - d1.getTime());
        total = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir o próprio dia
      }
    }

    if (total > 0 && total !== formData.totalDias) {
      setFormData((prev) => ({ ...prev, totalDias: total }));
    }
  }, [formData.mesesRealizacao, formData.mesesDetalhes, formData.frequencia, formData.totalDias]);

  // Efeito para sincronizar automaticamente todos os campos de mês (mesRealizacao, mesExecucao, dataMes, mes) ao indicar o mês de execução ou as datas
  useEffect(() => {
    let targetMonth = "";

    if (formData.mesesRealizacao && formData.mesesRealizacao.length > 0) {
      targetMonth = formData.mesesRealizacao[0];
    } else if (formData.dataInicio) {
      const cleanDate = formData.dataInicio.trim();
      const match = cleanDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (match) {
        const monthNum = parseInt(match[2], 10);
        if (monthNum >= 1 && monthNum <= 12) {
          targetMonth = MESES[monthNum - 1];
        }
      } else {
        const d = new Date(cleanDate);
        if (!isNaN(d.getTime())) {
          targetMonth = MESES[d.getMonth()];
        }
      }
    }

    if (targetMonth) {
      const hasChanges =
        formData.mesRealizacao !== targetMonth ||
        formData.mesExecucao !== targetMonth ||
        formData.dataMes !== targetMonth ||
        formData.mes !== targetMonth ||
        !formData.mesesRealizacao ||
        formData.mesesRealizacao.length === 0;

      if (hasChanges) {
        setFormData((prev) => {
          const updatedMesesRealizacao =
            prev.mesesRealizacao && prev.mesesRealizacao.length > 0
              ? prev.mesesRealizacao
              : [targetMonth];

          return {
            ...prev,
            mesesRealizacao: updatedMesesRealizacao,
            mesRealizacao: targetMonth,
            mesExecucao: targetMonth,
            dataMes: targetMonth,
            mes: targetMonth,
          };
        });
      }
    }
  }, [formData.mesesRealizacao, formData.dataInicio, formData.frequencia]);

  // Auto-preencher campos de data com o primeiro dia do mês de execução selecionado
  useEffect(() => {
    if (!formData.mesesRealizacao || formData.mesesRealizacao.length === 0)
      return;

    let changed = false;
    const updatedMesesDetalhes = { ...(formData.mesesDetalhes || {}) };

    formData.mesesRealizacao.forEach((m: string) => {
      const currentDet = updatedMesesDetalhes[m] || {};
      if (!currentDet.dataInicio || !currentDet.dataFim) {
        const monthNum = getMonthNumber(m);
        // Formato padrão HTML5 date: YYYY-MM-DD (ex: 2027-01-01)
        const defaultDate = `${nextYear}-${monthNum}-01`;

        updatedMesesDetalhes[m] = {
          ...currentDet,
          dataInicio: currentDet.dataInicio || defaultDate,
          dataFim: currentDet.dataFim || defaultDate,
        };
        changed = true;
      }
    });

    if (changed) {
      // Sincronizar também as datas gerais de início/fim
      let minDateStr = formData.dataInicio || "";
      let maxDateStr = formData.dataFim || "";

      formData.mesesRealizacao.forEach((m) => {
        const det = updatedMesesDetalhes[m];
        if (det) {
          if (det.dataInicio && (!minDateStr || det.dataInicio < minDateStr)) {
            minDateStr = det.dataInicio;
          }
          if (det.dataFim && (!maxDateStr || det.dataFim > maxDateStr)) {
            maxDateStr = det.dataFim;
          }
        }
      });

      setFormData((prev) => ({
        ...prev,
        mesesDetalhes: updatedMesesDetalhes,
        dataInicio: minDateStr,
        dataFim: maxDateStr,
      }));
    }
  }, [formData.mesesRealizacao, nextYear]);

  // Preencher automaticamente o tipo de plano baseado em necessidades e nome de atividade
  useEffect(() => {
    if (!formData) return;

    // Check both the name of the activity and the necessity fields in all rubrics
    const actNameLower = (formData.nomeAtividade || "").toLowerCase();
    const rubricasTexts = (formData.rubricas || []).map((r) =>
      (r.necessidade || "").toLowerCase(),
    );

    const hasAquisicao =
      actNameLower.includes("aquisição de") ||
      actNameLower.includes("aquisicao de") ||
      rubricasTexts.some(
        (t) => t.includes("aquisição de") || t.includes("aquisicao de"),
      );

    const hasContratacao =
      actNameLower.includes("serviço-") ||
      actNameLower.includes("servico-") ||
      actNameLower.includes("serviço") ||
      actNameLower.includes("servico") ||
      rubricasTexts.some(
        (t) =>
          t.includes("serviço-") ||
          t.includes("servico-") ||
          t.includes("serviço") ||
          t.includes("servico"),
      );

    let targetType = formData.tipoPlano;
    if (hasAquisicao) {
      targetType = "plano de aquisição";
    } else if (hasContratacao) {
      targetType = "plano de contratação";
    }

    if (targetType && targetType !== formData.tipoPlano) {
      setFormData((prev) => ({ ...prev, tipoPlano: targetType }));
    }

    // Se não houver rubrica de Serviços, os campos de aquisição/contratação devem ser 'Não'
    const hasService = (formData.rubricas || []).some(
      (r) => r.rubrica === "Serviços",
    );
    if (
      !hasService &&
      (formData.necessitaAquisicao !== "Não" ||
        formData.necessitaContratacao !== "Não")
    ) {
      setFormData((prev) => ({
        ...prev,
        necessitaAquisicao: "Não",
        necessitaContratacao: "Não",
      }));
    }
  }, [
    formData.nomeAtividade,
    formData.rubricas,
    formData.necessitaAquisicao,
    formData.necessitaContratacao,
  ]);

  const downloadExcelTemplate = () => {
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

    // Dados de exemplo baseados na imagem (1 atividade com 3 rubricas)
    const sampleRows = [
      [
        "4", "4", "ODG", "GDG", "UGEA", "G/UGEA/004/P", "Plano de procuriment", 
        "garantir o localizacao dar lojas fisicas; especulacao de precos", 
        "1º, 2º, 3º, 4º (Mensal)", "Janeiro, Agosto", "Sim",
        "Bens - 121", "121001- Combustíveis e lubrificantes", "198", "125", "24750"
      ],
      [
        "", "", "", "", "", "", "", "", "", "", "",
        "Demais despesas com o pessoal - 112", "112101- Ajuda de custo dentro do país para pessoal civil (TECNICOS)", "4", "6000", "127200"
      ],
      [
        "", "", "", "", "", "", "", "", "", "", "",
        "Demais despesas com o pessoal - 112", "112101- Ajuda de custo dentro do país para pessoal civil (IDA E VOLTA)", "4", "1800", "7200"
      ]
    ];

    // Criar a planilha
    const ws = XLSX.utils.aoa_to_sheet([headerRow1, headerRow2, ...sampleRows]);

    // Definir as mesclagens (s=start, e=end, r=row, c=col)
    ws["!merges"] = [
      // Cabeçalho
      { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }, // N/O
      { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } }, // Nº Direção
      { s: { r: 0, c: 2 }, e: { r: 0, c: 4 } }, // I. IDENTIFICAÇÃO
      { s: { r: 0, c: 5 }, e: { r: 0, c: 7 } }, // II. ATIVIDADE
      { s: { r: 0, c: 8 }, e: { r: 0, c: 9 } }, // V. TEMPO E DURAÇÃO
      { s: { r: 0, c: 10 }, e: { r: 1, c: 10 } }, // VI. TRANS
      { s: { r: 0, c: 11 }, e: { r: 0, c: 15 } }, // VII. RUBRICAS E NECESSIDADES

      // Corpo (Mesclagem vertical para a mesma atividade - Linhas 3 a 5 da planilha)
      { s: { r: 2, c: 0 }, e: { r: 4, c: 0 } }, // N/O
      { s: { r: 2, c: 1 }, e: { r: 4, c: 1 } }, // Nº Direção
      { s: { r: 2, c: 2 }, e: { r: 4, c: 2 } }, // ÓRGÃO
      { s: { r: 2, c: 3 }, e: { r: 4, c: 3 } }, // DIREÇÃO
      { s: { r: 2, c: 4 }, e: { r: 4, c: 4 } }, // DEPARTAMENTO
      { s: { r: 2, c: 5 }, e: { r: 4, c: 5 } }, // Cód./Atividade
      { s: { r: 2, c: 6 }, e: { r: 4, c: 6 } }, // Nome
      { s: { r: 2, c: 7 }, e: { r: 4, c: 7 } }, // Objetivo
      { s: { r: 2, c: 8 }, e: { r: 4, c: 8 } }, // Trimestre
      { s: { r: 2, c: 9 }, e: { r: 4, c: 9 } }, // Met/Real
      { s: { r: 2, c: 10 }, e: { r: 4, c: 10 } } // M/T
    ];

    // Definir larguras de coluna
    ws["!cols"] = [
      { wch: 6 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, 
      { wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 20 }, { wch: 15 }, 
      { wch: 8 }, { wch: 25 }, { wch: 40 }, { wch: 8 }, { wch: 12 }, { wch: 15 }
    ];

    // Criar o workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo Plano Atividade");

    // Gerar o arquivo e descarregar
    XLSX.writeFile(wb, "Modelo_Preenchimento_Plano_Atividades.xlsx");
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Converter para matriz de arrays (aoa) para facilitar o acesso por índice
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (rows.length < 2) {
          alert("Ficheiro vazio ou com formato incompleto.");
          return;
        }

        // Detectar se é o novo cabeçalho de 2 linhas ou antigo de 1 linha
        let dataRowIndex = 1;
        const header1 = String(rows[0][2] || "").toUpperCase();
        const header2 = String(rows[1][2] || "").toUpperCase();
        const isMultiRowHeader = header1.includes("I. IDENTIFICAÇÃO") || header2.includes("ÓRGÃO");
        
        if (isMultiRowHeader) {
          dataRowIndex = 2;
        }

        if (rows.length <= dataRowIndex) {
          alert("Nenhuma linha de dados encontrada no ficheiro.");
          return;
        }

        const dataRow = rows[dataRowIndex];
        const getVal = (idx: number) => String(dataRow[idx] || "").trim();

        let org = "Cursos do Ensino Superior Privado";
        let dir = "Direção Científico-Pedagógica";
        let dep = "";
        let rep = "";
        let setVal = "";
        let cur = "";
        let rec = "Receitas Próprias";
        let prio = "Média";
        let nome = "Nova Atividade Importada";
        let obj = "";
        let prov = "Tete";
        let dist = "Songo";
        let resp = "";
        let outr = "";
        let trim = "I Trimestre";
        let mesVal = "Janeiro";
        let dtIni = "";
        let dtFim = "";
        let transp = "Não";
        let aq = "Não";
        let cont = "Não";
        let rub = "";
        let nec = "";
        let esp = "";
        let unitPrice = 0;
        let quantity = 0;

        if (isMultiRowHeader) {
          // Novo mapeamento baseado na imagem:
          // 0: N/O
          // 1: Nº Direção
          // 2: ÓRGÃO
          // 3: DIREÇÃO
          // 4: DEPARTAMENTO
          // 5: Cód./Atividade
          // 6: Nome da atividade
          // 7: Objetivo da atividade
          // 8: Trimestre / Período
          // 9: Met/Real.
          // 10: M/T
          // 11: Rúbrica
          // 12: Necessidade
          // 13: QUANT
          // 14: Unitário (MT)
          // 15: VALOR TOTAL GERAL (MZM)
          org = getVal(2) || org;
          dir = getVal(3) || dir;
          dep = getVal(4);
          rep = getVal(4);
          setVal = user?.setor || "";
          nome = getVal(6) || nome;
          obj = getVal(7);
          trim = getVal(8);
          mesVal = getVal(9);
          transp = getVal(10) || "Não";
          rub = getVal(11);
          nec = getVal(12);
          quantity = parseFloat(getVal(13)) || 0;
          unitPrice = parseFloat(getVal(14)) || 0;
        } else {
          // Old layout mapping:
          org = getVal(0) || org;
          dir = getVal(1) || dir;
          dep = getVal(2);
          rep = getVal(3);
          setVal = getVal(4);
          cur = getVal(5);
          rec = getVal(6) || rec;
          prio = getVal(7) || prio;
          nome = getVal(8) || nome;
          obj = getVal(9);
          prov = getVal(10);
          dist = getVal(11);
          resp = getVal(12);
          outr = getVal(13);
          trim = getVal(14);
          mesVal = getVal(15);
          dtIni = getVal(16);
          dtFim = getVal(17);
          transp = getVal(18) || "Não";
          aq = getVal(19) || "Não";
          cont = getVal(20) || "Não";
          rub = getVal(21);
          nec = getVal(22);
          esp = getVal(23);
          unitPrice = parseFloat(getVal(24)) || 0;
          quantity = parseFloat(getVal(25)) || 0;
        }

        const total = unitPrice * quantity;

        setSelectedCategory(org);
        setFormData((prev) => ({
          ...prev,
          unidadeCentral: "",
          unidadeOrganica: "Songo",
          servicoCentral: "",
          unidadeSelecionada: dir,
          departamento: dep || prev.departamento || user?.departamento || "",
          reparticao: rep || prev.reparticao || user?.reparticao || "",
          setor: setVal || prev.setor || user?.setor || "",
          curso: cur,
          fonteReceita: rec,
          prioridade: prio,
          nomeAtividade: nome,
          objetivoAtividade: obj,
          realizacaoProvincia: prov,
          realizacaoDistrito: dist,
          responsavel: resp || user?.nome || "",
          outrosColaboradores: outr,
          trimestre: trim,
          mesRealizacao: mesVal,
          dataInicio: dtIni,
          dataFim: dtFim,
          necessitaTransporte: transp,
          necessitaAquisicao: aq,
          necessitaContratacao: cont,
          rubricas: [
            {
              id: 1,
              rubrica: rub || prev.rubricas[0]?.rubrica || "",
              necessidade: nec || prev.rubricas[0]?.necessidade || "",
              especificacao: esp || "",
              detalhes: "",
              pessoas: 1,
              quantidade: quantity,
              dias: 1,
              precoUnitario: unitPrice,
              valorTotal: total,
              pessoa: "",
              valorDiario: 6000,
              temMeioDia: false,
              meioDia30: 0,
            },
          ],
        }));

        setAutoFilled(true);
        
        // Se houver mais de uma linha de dados, salvar todas e fechar o formulário (Plano Completo)
        const allDataRows = rows.slice(dataRowIndex);
        if (allDataRows.length > 1) {
           const confirmSave = confirm(`Foram detectadas ${allDataRows.length} atividades no ficheiro. Deseja importar todas e fechar o formulário?`);
           if (confirmSave) {
              const activitiesToSave = allDataRows.map((row, idx) => {
                 const getRowVal = (col: number) => String(row[col] || "").trim();
                 const quant = parseFloat(getRowVal(13)) || 1;
                 const unit = parseFloat(getRowVal(14)) || 0;
                 const total = parseFloat(getRowVal(15)) || (quant * unit);
                 
                 return {
                    id: Math.random().toString(36).substr(2, 9),
                    no: getRowVal(0) || (idx + 1).toString(),
                    referencia: getRowVal(5) || `ACT-${nextYear}-${Math.floor(Math.random() * 10000)}`,
                    title: getRowVal(6) || "Atividade Importada",
                    unidadeOrganica: getRowVal(2) || "Songo",
                    direcao: getRowVal(3) || user?.direcao || "",
                    departamento: getRowVal(4) || user?.departamento || "",
                    responsavel: user?.nome || "",
                    trimestre: getRowVal(8),
                    mesRealizacao: getRowVal(9),
                    necessitaTransporte: getRowVal(10) || "Não",
                    rubrica: getRowVal(11),
                    necessidade: getRowVal(12),
                    numeroPessoas: quant.toString(),
                    unitario: unit,
                    valor: total,
                    status: "planificacao",
                    published: false,
                    createdAt: new Date().toISOString(),
                    ano: nextYear,
                    createdBy: user?.email,
                    tipoPlano: "Setorial"
                 };
              });

              // Guardar em lote
              await Promise.all(activitiesToSave.map(act => firestoreService.matrixActivities.add(act)));
              alert(`${activitiesToSave.length} atividades importadas com sucesso!`);
              onClose(); // Fechar o formulário
              return;
           }
        }

        alert("Modelo preenchido importado com sucesso!");
      } catch (err) {
        console.error(err);
        alert("Erro ao processar o ficheiro Excel do modelo.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  useEffect(() => {
    const dirInitials = getDirectionAbbreviation(
      formData.unidadeSelecionada || selectedCategory,
    ).toUpperCase();
    const deptInitials = getDepartmentAbbreviation(
      formData.departamento,
    ).toUpperCase();

    const targetArea =
      formData.setor ||
      formData.reparticao ||
      user?.setor ||
      user?.reparticao ||
      sectorName ||
      formData.departamento ||
      (user ? getUserWorkspace(user) : "");
    const rawNum =
      formData.numeroAtividade || String(calculateNextNum(plannedActivitiesProp, targetArea, user ? getUserWorkspace(user) : ""));
    const parsedNum = parseInt(rawNum, 10);
    const num = isNaN(parsedNum) ? rawNum : String(parsedNum).padStart(3, "0");

    const actInitials = getActivityInitials(formData.nomeAtividade || "");

    // Formato solicitado: INICIAIS DIREÇÃO / INICIAIS DEPARTAMENTO / NÚMERO / 3 INICIAIS DA ATIVIDADE
    // EX: GDG/DPEP/001/IRA
    const parts = [
      dirInitials !== "-" ? dirInitials : "Songo",
      deptInitials !== "-" ? deptInitials : "",
      num,
      actInitials,
    ].filter(Boolean);
    const codigoAtividade = parts.join("/");

    setFormData((prev) => {
      // Evitar re-renderização infinita comparando valores primitivos
      if (
        prev.codigoAtividade === codigoAtividade &&
        prev.numeroAtividade === num
      )
        return prev;
      return { ...prev, codigoAtividade, numeroAtividade: num };
    });
  }, [
    formData.unidadeSelecionada,
    selectedCategory,
    formData.departamento,
    formData.curso,
    formData.reparticao,
    formData.nomeAtividade,
    formData.numeroAtividade,
    plannedActivitiesProp,
  ]);

  // Loose match helper for user session pre-population
  const looseMatch = (o1?: string, o2?: string) => {
    if (!o1 || !o2) return false;
    const n1 = o1
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
    const n2 = o2
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
    return n1 === n2 || n1.includes(n2) || n2.includes(n1);
  };

  const findGroupForDepartment = (deptName: string) => {
    let matchedDir = "";
    let matchedCat = "";
    if (!deptName) return { matchedDir, matchedCat };

    // Try finding in DEPARTAMENTOS first
    for (const [dir, deps] of Object.entries(DEPARTAMENTOS)) {
      if (
        deps.some(
          (d) =>
            d.toLowerCase() === deptName.toLowerCase() ||
            looseMatch(d, deptName),
        )
      ) {
        matchedDir = dir;
        break;
      }
    }

    // Try fallback to DEPARTAMENTOS
    if (!matchedDir) {
      for (const [dir, deps] of Object.entries(DEPARTAMENTOS)) {
        if (
          deps.some(
            (d) =>
              d.toLowerCase() === deptName.toLowerCase() ||
              looseMatch(d, deptName),
          )
        ) {
          matchedDir = dir;
          break;
        }
      }
    }

    if (matchedDir) {
      for (const cat of UNIDADES_ORGANICAS_SISTEMA) {
        if (
          cat.direcoes.some(
            (d) =>
              d.toLowerCase() === matchedDir.toLowerCase() ||
              looseMatch(d, matchedDir),
          )
        ) {
          matchedCat = cat.nome;
          break;
        }
      }
    }

    return { matchedDir, matchedCat };
  };

  const findGroupForReparticao = (repName: string) => {
    let matchedRep = "";
    let matchedDep = "";
    let matchedDir = "";
    let matchedCat = "";

    if (!repName) return { matchedRep, matchedDep, matchedDir, matchedCat };

    for (const [dep, reps] of Object.entries(REPARTICOES)) {
      const foundRep = reps.find(
        (r) =>
          r.toLowerCase() === repName.toLowerCase() || looseMatch(r, repName),
      );
      if (foundRep) {
        matchedRep = foundRep;
        matchedDep = dep;

        const group = findGroupForDepartment(dep);
        matchedDir = group.matchedDir;
        matchedCat = group.matchedCat;
        break;
      }
    }

    return { matchedRep, matchedDep, matchedDir, matchedCat };
  };

  const getUserAllocatedDetails = () => {
    return getSharedUserAllocatedDetails(activeUser, colaboradores);
  };

  const _legacyGetUserAllocatedDetails = () => {
    const usr = activeUser || {};
    let matchedColab: any = null;
    const uEmail = (usr.email || "").trim().toLowerCase();
    const uNuit = (usr.nuit || "").trim();
    const uName = (usr.name || usr.nome || usr.fullName || "").trim().toLowerCase();

    // 1. Procurar na lista dinâmica de colaboradores (Firestore)
    if (colaboradores && colaboradores.length > 0) {
      matchedColab = colaboradores.find((c) => {
        const cEmail = (c.email || c.emailInstitucional || "")
          .trim()
          .toLowerCase();
        const cNuit = (c.nuit || "").trim();
        const cNome = (c.nome || c.name || "").trim().toLowerCase();

        return (
          (uEmail && cEmail && uEmail === cEmail) ||
          (uNuit && cNuit && uNuit === cNuit) ||
          (uName && cNome && uName === cNome)
        );
      });
    }

    // 2. Se não encontrar, procurar no Efetivo Geral estático (EFETIVO_GERAL_DATA)
    if (!matchedColab && EFETIVO_GERAL_DATA && EFETIVO_GERAL_DATA.length > 0) {
      matchedColab = EFETIVO_GERAL_DATA.find((c) => {
        const cEmail = (c.email || "").trim().toLowerCase();
        const cNuit = (c.nuit || "").trim();
        const cNome = (c.nome || "").trim().toLowerCase();

        return (
          (uEmail && cEmail && uEmail === cEmail) ||
          (uNuit && cNuit && uNuit === cNuit) ||
          (uName && cNome && uName === cNome)
        );
      });
    }

    // Se encontramos as informações de afetação/alocação do usuário no Efetivo Geral ou Chefias:
    if (matchedColab) {
      // Normalização de Órgão e Direção
      let cat = matchedColab.unidade || matchedColab.unidadeOrganica || "";
      let dir = matchedColab.direcao || "";
      let dep = matchedColab.departamento || "";
      let rep = matchedColab.reparticao || "";
      let setor =
        matchedColab.sector || matchedColab.setor || matchedColab.seccao || "";

      const dirLower = dir.toLowerCase();
      const catLower = cat.toLowerCase();

      let catNormalized = "Unidade Orgânica";

      if (catLower.includes("orgânica") || catLower.includes("organica")) {
        catNormalized = "Unidade Orgânica";
      } else if (
        catLower.includes("direção") ||
        catLower.includes("direcao") ||
        catLower.includes("gestão") ||
        catLower.includes("gestao") ||
        catLower.includes("gabinete") ||
        dirLower.includes("gabinete")
      ) {
        catNormalized = "Órgão de Direção e Gestão";
      } else if (
        catLower.includes("serviço") ||
        catLower.includes("servico") ||
        catLower.includes("central") ||
        catLower.includes("isps") ||
        dirLower.includes("dicosafa") ||
        dirLower.includes("dicosser")
      ) {
        catNormalized = "Serviços Centrais";
      } else {
        if (
          dirLower.includes("engenharia") ||
          dirLower.includes("incubação") ||
          dirLower.includes("incubacao") ||
          dirLower.includes("cie") ||
          dirLower.includes("centro")
        ) {
          catNormalized = "Unidade Orgânica";
        } else if (
          dirLower.includes("gabinete") ||
          dirLower.includes("diretor") ||
          dirLower.includes("conselho")
        ) {
          catNormalized = "Órgão de Direção e Gestão";
        } else {
          catNormalized = "Unidade Orgânica";
        }
      }

      let dirNormalized = dir;
      if (catNormalized === "Unidade Orgânica") {
        if (dirLower.includes("engenharia")) {
          dirNormalized = "Divisão de Engenharia";
        } else if (
          dirLower.includes("incubação") ||
          dirLower.includes("incubacao") ||
          dirLower.includes("cie")
        ) {
          dirNormalized = "Centro de Incubação de Empresas";
        } else {
          dirNormalized = "Centros";
        }
      } else if (catNormalized === "Órgão de Direção e Gestão") {
        if (
          dirLower.includes("gabinete") ||
          dirLower.includes("diretor") ||
          dirLower.includes("dg")
        ) {
          dirNormalized = "Gabinete do Diretor-Geral";
        } else if (dirLower.includes("representantes")) {
          dirNormalized = "Conselho de Representantes";
        } else if (
          dirLower.includes("administrativo") ||
          dirLower.includes("gestão") ||
          dirLower.includes("gestao")
        ) {
          dirNormalized = "Conselho Administrativo e de Gestão";
        } else {
          dirNormalized = "Conselho Técnico e de Qualidade";
        }
      } else if (catNormalized === "Serviços Centrais") {
        if (
          dirLower.includes("dicosser") ||
          dirLower.includes("sociais") ||
          dirLower.includes("estudantis") ||
          dirLower.includes("registo")
        ) {
          dirNormalized = "DICOSSER";
        } else {
          dirNormalized = "DICOSAFA";
        }
      }

      // Normalizar departamento
      let depNormalized = dep;
      if (depNormalized) {
        const allDepsSet = new Set<string>();
        Object.values(DEPARTAMENTOS).forEach((arr) =>
          arr.forEach((d) => allDepsSet.add(d)),
        );
        Object.values(DEPARTAMENTOS).forEach((arr) =>
          arr.forEach((d) => allDepsSet.add(d)),
        );
        const allDeps = Array.from(allDepsSet);

        const matchedDepObj = allDeps.find(
          (d) =>
            d.toLowerCase().trim() === depNormalized.toLowerCase().trim() ||
            d
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "")
              .includes(
                depNormalized.toLowerCase().replace(/[^a-z0-9]/g, ""),
              ) ||
            depNormalized
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "")
              .includes(d.toLowerCase().replace(/[^a-z0-9]/g, "")),
        );
        if (matchedDepObj) {
          depNormalized = matchedDepObj;
        }
      }

      // Normalizar reparticao
      let repNormalized = rep;
      if (repNormalized && depNormalized && REPARTICOES[depNormalized]) {
        const reps = REPARTICOES[depNormalized];
        const matchedRepObj = reps.find(
          (r) =>
            r.toLowerCase().trim() === repNormalized.toLowerCase().trim() ||
            r
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "")
              .includes(
                repNormalized.toLowerCase().replace(/[^a-z0-9]/g, ""),
              ) ||
            repNormalized
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "")
              .includes(r.toLowerCase().replace(/[^a-z0-9]/g, "")),
        );
        if (matchedRepObj) {
          repNormalized = matchedRepObj;
        }
      }

      // Normalizar setor
      let setorNormalized = setor;
      if (setorNormalized && repNormalized && SECTORES[repNormalized]) {
        const secs = SECTORES[repNormalized];
        const matchedSecObj = secs.find(
          (s) =>
            s.toLowerCase().trim() === setorNormalized.toLowerCase().trim() ||
            s
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "")
              .includes(
                setorNormalized.toLowerCase().replace(/[^a-z0-9]/g, ""),
              ) ||
            setorNormalized
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "")
              .includes(s.toLowerCase().replace(/[^a-z0-9]/g, "")),
        );
        if (matchedSecObj) {
          setorNormalized = matchedSecObj;
        }
      }

      const isChefia =
        (matchedColab.cargoChefia &&
          matchedColab.cargoChefia !== "Nenhum" &&
          matchedColab.cargoChefia !== "-") ||
        (matchedColab.cargo &&
          (matchedColab.cargo.toLowerCase().includes("chefe") ||
            matchedColab.cargo.toLowerCase().includes("diretor") ||
            matchedColab.cargo.toLowerCase().includes("coordenador") ||
            matchedColab.cargo.toLowerCase().includes("reitor")));
      const source = isChefia
        ? "Repartição de Pessoal (Cargos de Chefia)"
        : "Repartição de Pessoal (Efetivo Geral)";

      return {
        cat: catNormalized,
        dir: dirNormalized,
        dep: depNormalized,
        rep: repNormalized,
        setor: setorNormalized,
        source: source,
        responsavel: matchedColab.nome || matchedColab.name || "",
        responsavelEmail:
          matchedColab.email || matchedColab.emailInstitucional || "",
      };
    }

    // Se o usuário tem alocação explícita salva no banco, use-a diretamente!
    if (
      user.unidade ||
      user.unidadeOrganica ||
      user.direcao ||
      user.departamento ||
      user.reparticao
    ) {
      return {
        cat: user.unidade || user.unidadeOrganica || "Unidade Orgânica",
        dir: user.direcao || "",
        dep: user.departamento || "",
        rep: user.reparticao || "",
        setor: user.sector || user.setor || user.seccao || "",
        source: "Perfil de Utilizador",
        responsavel: user.nome || user.name || "",
        responsavelEmail: user.email || "",
      };
    }

    let matchedCat = "";
    let matchedDir = "";
    let matchedDep = "";
    let matchedRep = "";
    let matchedSetor = "";

    const isUserChefia =
      user.cargoChefia &&
      user.cargoChefia !== "Nenhum" &&
      user.cargoChefia !== "";
    let uUnidade = user.unidade || user.unidadeOrganica || "";
    let uDirecao = user.direcao || user.servicoCentral || "";
    let uDepartamento = user.departamento || "";
    let uReparticao = user.reparticao || "";
    let uSetor = user.sector || user.seccao || "";

    // Regras Semânticas Inteligentes de correspondência para o Gabinete do Diretor-Geral e suas repartições/setores
    const userSearchText =
      `${user.cargo || ""} ${user.cargoChefia || ""} ${user.departamento || ""} ${user.direcao || ""} ${user.unidade || ""} ${user.unidadeOrganica || ""} ${user.reparticao || ""} ${user.setor || ""} ${user.sector || ""}`.toLowerCase();

    if (
      userSearchText.includes("práticas de geração") ||
      userSearchText.includes("praticas de geracao") ||
      userSearchText.includes("dpgnde") ||
      userSearchText.includes("rpgn") ||
      userSearchText.includes("rdec")
    ) {
      matchedCat = "Unidade orgânica";
      matchedDir = "Centro de Incubação de Empresas";
      matchedDep =
        "Departamento de Práticas de Geração de Negócio e Desenvolvimento Empresarial (DPGNDE)";
      matchedRep = "";
    } else if (
      userSearchText.includes("consultoria") ||
      userSearchText.includes("angariação") ||
      userSearchText.includes("angariacao") ||
      userSearchText.includes("dcpaf") ||
      userSearchText.includes("rcep") ||
      userSearchText.includes("raf")
    ) {
      matchedCat = "Unidade orgânica";
      matchedDir = "Centro de Incubação de Empresas";
      matchedDep =
        "Departamento de Consultoria, Estudos, Projetos e Angariação de Fundos (DCPAF)";
      matchedRep = "";
    } else if (
      userSearchText.includes("prospecção") ||
      userSearchText.includes("prospeccao") ||
      userSearchText.includes("oportunidade de negócio") ||
      userSearchText.includes("oportunidade de negocio") ||
      userSearchText.includes("dpone") ||
      userSearchText.includes("rpon") ||
      userSearchText.includes("rpoe")
    ) {
      matchedCat = "Unidade orgânica";
      matchedDir = "Centro de Incubação de Empresas";
      matchedDep =
        "Departamento de Prospecção de Oportunidade de Negócio (DPONE)";
      matchedRep = "";
    } else if (
      userSearchText.includes("diretor do cie") ||
      userSearchText.includes("diretor de cie") ||
      userSearchText.includes("cie") ||
      userSearchText.includes("incubação") ||
      userSearchText.includes("incubacao")
    ) {
      matchedCat = "Unidade orgânica";
      matchedDir = "Centro de Incubação de Empresas";
      matchedDep = "Diretor do CIE";
      matchedRep = "Diretor do CIE";
    } else if (
      userSearchText.includes("eletrotécnica") ||
      userSearchText.includes("eletrotecnica") ||
      userSearchText.includes("dee") ||
      userSearchText.includes("elétrica") ||
      userSearchText.includes("eletrica") ||
      userSearchText.includes("eletrónica") ||
      userSearchText.includes("eletronica") ||
      userSearchText.includes("telecomunicações") ||
      userSearchText.includes("telecomunicacoes") ||
      userSearchText.includes("energias renováveis") ||
      userSearchText.includes("energias renovaveis")
    ) {
      matchedCat = "Unidade orgânica";
      matchedDir = "Divisão de Engenharia";
      matchedDep = "Departamento de Engenharia Eletrotécnica";
      if (
        userSearchText.includes("chefe") ||
        userSearchText.includes("chefe do dee")
      ) {
        matchedRep = "Chefe do DEE";
      } else if (
        userSearchText.includes("elétrica") ||
        userSearchText.includes("eletrica")
      ) {
        matchedRep = "Diretor do Curso de Engenharia Elétrica";
      } else if (
        userSearchText.includes("eletrónica") ||
        userSearchText.includes("eletronica") ||
        userSearchText.includes("telecomun")
      ) {
        matchedRep =
          "Diretor do Curso de Engenharia Eletrónica e de Telecomunicações";
      } else if (
        userSearchText.includes("renováveis") ||
        userSearchText.includes("renovaveis")
      ) {
        matchedRep = "Diretor do Curso de Engenharia de Energias Renováveis";
      } else {
        matchedRep = "Chefe do DEE";
      }
    } else if (
      userSearchText.includes("construção civil") ||
      userSearchText.includes("construcao civil") ||
      userSearchText.includes("decc") ||
      userSearchText.includes("hidráulica") ||
      userSearchText.includes("hidraulica")
    ) {
      matchedCat = "Unidade orgânica";
      matchedDir = "Divisão de Engenharia";
      matchedDep = "Departamento de Engenharia de Construção Civil";
      if (
        userSearchText.includes("chefe") ||
        userSearchText.includes("chefe do decc")
      ) {
        matchedRep = "Chefe do DECC";
      } else if (
        userSearchText.includes("hidráulica") ||
        userSearchText.includes("hidraulica")
      ) {
        matchedRep = "Diretor do Curso de Engenharia Hidráulica";
      } else {
        matchedRep = "Diretor do Curso de Engenharia de Construção Civil";
      }
    } else if (
      userSearchText.includes("construção mecânica") ||
      userSearchText.includes("construcao mecanica") ||
      userSearchText.includes("decm") ||
      userSearchText.includes("termotécnica") ||
      userSearchText.includes("termotecnica")
    ) {
      matchedCat = "Unidade orgânica";
      matchedDir = "Divisão de Engenharia";
      matchedDep = "Departamento de Engenharia de Construção Mecânica";
      if (
        userSearchText.includes("chefe") ||
        userSearchText.includes("chefe do decm")
      ) {
        matchedRep = "Chefe do DECM";
      } else if (
        userSearchText.includes("termotécnica") ||
        userSearchText.includes("termotecnica")
      ) {
        matchedRep = "Diretor do Curso de Engenharia Termotécnica";
      } else {
        matchedRep = "Diretor do Curso de Engenharia de Construção Mecânica";
      }
    } else if (
      userSearchText.includes("planificação") ||
      userSearchText.includes("planificacao") ||
      userSearchText.includes("DPEP") ||
      userSearchText.includes("estudos e projetos")
    ) {
      matchedCat = "Órgão de Direção e Gestão";
      matchedDir = "Gabinete do Diretor-Geral";
      matchedDep = "Departamento de Planificação Estudos e Projetos";
      if (
        userSearchText.includes("chefe") ||
        userSearchText.includes("diretor") ||
        userSearchText.includes("responsável")
      ) {
        matchedRep = "Chefe do Departamento de Planificação Estudos e Projetos";
      } else if (
        userSearchText.includes("estatística") ||
        userSearchText.includes("estatistica")
      ) {
        matchedRep = "Repartição de Estatística";
      } else if (
        userSearchText.includes("relatório") ||
        userSearchText.includes("relatorio")
      ) {
        matchedRep = "Setor de Relatório";
      } else if (
        userSearchText.includes("monitoria") ||
        userSearchText.includes("monitorizacao")
      ) {
        matchedRep = "Setor de Monitoria";
      } else {
        matchedRep = "Repartição de Planificação";
      }
    } else if (
      userSearchText.includes("ugea") ||
      userSearchText.includes("aquisições") ||
      userSearchText.includes("aquisicoes") ||
      userSearchText.includes("gestora e executora")
    ) {
      matchedCat = "Órgão de Direção e Gestão";
      matchedDir = "Gabinete do Diretor-Geral";
      matchedDep = "Unidade Gestora e Executora de Aquisições";
      if (
        userSearchText.includes("chefe da ugea") ||
        userSearchText.includes("chefe de ugea")
      ) {
        matchedRep = "Chefe da UGEA";
      } else if (userSearchText.includes("painel")) {
        matchedRep = "Painel da UGEA";
      } else if (userSearchText.includes("fornecedores")) {
        matchedRep = "Gestão de Fornecedores";
      } else if (
        userSearchText.includes("plano de aquisição") ||
        userSearchText.includes("plano de aquisicao")
      ) {
        matchedRep = "Plano de Aquisição";
      } else if (
        userSearchText.includes("plano de contratação") ||
        userSearchText.includes("plano de contratacao")
      ) {
        matchedRep = "Plano de Contratação";
      } else {
        matchedRep = "Plano de Aquisição";
      }
    } else if (
      userSearchText.includes("cooperação") ||
      userSearchText.includes("cooperacao") ||
      userSearchText.includes("relações exteriores") ||
      userSearchText.includes("relacoes exteriores") ||
      userSearchText.includes("dcre")
    ) {
      matchedCat = "Órgão de Direção e Gestão";
      matchedDir = "Gabinete do Diretor-Geral";
      matchedDep = "Departamento de Cooperação e Relações Exteriores";
      if (
        userSearchText.includes("imagem") ||
        userSearchText.includes("institucional")
      ) {
        matchedRep = "Setor de imagem institucional";
      } else {
        matchedRep = "Chefe da DCRE";
      }
    } else if (
      userSearchText.includes("controlo técnico") ||
      userSearchText.includes("controlo tecnico") ||
      userSearchText.includes("qualidade") ||
      userSearchText.includes("dctq")
    ) {
      matchedCat = "Órgão de Direção e Gestão";
      matchedDir = "Gabinete do Diretor-Geral";
      matchedDep = "Departamento de Controlo Técnico e de Qualidade";
      if (
        userSearchText.includes("setor 1") ||
        userSearchText.includes("sector 1")
      ) {
        matchedRep = "SETOR 1";
      } else if (
        userSearchText.includes("setor 2") ||
        userSearchText.includes("sector 2")
      ) {
        matchedRep = "SETOR 2";
      } else {
        matchedRep = "Chefe da DCTQ";
      }
    } else if (
      userSearchText.includes("jurídico") ||
      userSearchText.includes("juridico") ||
      userSearchText.includes("dj") ||
      userSearchText.includes("advogado")
    ) {
      matchedCat = "Órgão de Direção e Gestão";
      matchedDir = "Gabinete do Diretor-Geral";
      matchedDep = "Departamento Jurídico";
      if (
        userSearchText.includes("setor 1") ||
        userSearchText.includes("sector 1")
      ) {
        matchedRep = "SETOR 1";
      } else if (
        userSearchText.includes("setor 2") ||
        userSearchText.includes("sector 2")
      ) {
        matchedRep = "SETOR 2";
      } else {
        matchedRep = "Chefe da DJ";
      }
    } else if (
      userSearchText.includes("chefe do GDG") ||
      userSearchText.includes("chefe de GDG") ||
      userSearchText.includes("GDG")
    ) {
      matchedCat = "Órgão de Direção e Gestão";
      matchedDir = "Gabinete do Diretor-Geral";
      matchedDep = "Chefe do GDG";
    } else if (userSearchText.includes("secretaria executiva")) {
      matchedCat = "Órgão de Direção e Gestão";
      matchedDir = "Gabinete do Diretor-Geral";
      matchedDep = "Secretaria Executiva";
    } else if (
      userSearchText.includes("diretor geral") ||
      userSearchText.includes("diretor-geral") ||
      userSearchText.includes("Gabinete do Diretor-Geral")
    ) {
      matchedCat = "Órgão de Direção e Gestão";
      matchedDir = "Gabinete do Diretor-Geral";
      matchedDep = "Gabinete do Diretor-Geral";
    }

    if (!matchedDep) {
      // Se for chefe, podemos deduzir e garantir a repartição ou departamento a partir do cargo de chefia para maior consistência
      if (isUserChefia && user.cargoChefia) {
        const chefiaText = user.cargoChefia.toLowerCase();

        // 1. Verificar se o cargo de chefia menciona alguma repartição conhecida
        if (!uReparticao) {
          for (const reps of Object.values(REPARTICOES)) {
            const foundRep = reps.find(
              (r) =>
                chefiaText.includes(r.toLowerCase()) ||
                looseMatch(r, user.cargoChefia),
            );
            if (foundRep) {
              uReparticao = foundRep;
              break;
            }
          }
        }

        // 2. Verificar se o cargo de chefia menciona algum departamento conhecido
        if (!uDepartamento) {
          const allDeps = [
            ...Object.values(DEPARTAMENTOS).flat(),
            ...Object.values(DEPARTAMENTOS).flat(),
          ];
          const foundDep = allDeps.find(
            (d) =>
              chefiaText.includes(d.toLowerCase()) ||
              looseMatch(d, user.cargoChefia),
          );
          if (foundDep) {
            uDepartamento = foundDep;
          }
        }
      }
    }

    // Priority 1: Trace from department
    if (uDepartamento) {
      const group = findGroupForDepartment(uDepartamento);
      if (group.matchedDir) {
        matchedDep = uDepartamento;
        matchedDir = group.matchedDir;
        matchedCat = group.matchedCat;
      }
    }

    // Priority 2: Trace from repartição
    if (!matchedDep && uReparticao) {
      const repGroup = findGroupForReparticao(uReparticao);
      if (repGroup.matchedRep) {
        matchedRep = repGroup.matchedRep;
        matchedDep = repGroup.matchedDep;
        matchedDir = repGroup.matchedDir;
        matchedCat = repGroup.matchedCat;
      }
    }

    // Priority 3: Fallback to user direction
    if (!matchedDir && uDirecao) {
      for (const cat of UNIDADES_ORGANICAS_SISTEMA) {
        const foundDir = cat.direcoes.find((d) => looseMatch(d, uDirecao));
        if (foundDir) {
          matchedDir = foundDir;
          matchedCat = cat.nome;
          break;
        }
      }
    }

    // Priority 4: Fallback to user unit
    if (!matchedCat && uUnidade) {
      const foundCat = UNIDADES_ORGANICAS_SISTEMA.find((c) =>
        looseMatch(c.nome, uUnidade),
      );
      if (foundCat) {
        matchedCat = foundCat.nome;
      }
    }

    // Trace sector
    if (uSetor) {
      for (const [rep, sectors] of Object.entries(SECTORES)) {
        const foundSector = sectors.find((s) => looseMatch(s, uSetor));
        if (foundSector) {
          matchedSetor = foundSector;
          if (!matchedRep) {
            matchedRep = rep;
          }
          break;
        }
      }
    }

    // Fallback categories & directions
    if (uUnidade && !matchedCat) {
      if (
        looseMatch(uUnidade, "direção") ||
        looseMatch(uUnidade, "gestão") ||
        looseMatch(uUnidade, "órgãos")
      ) {
        matchedCat = "Órgão de Direção e Gestão";
      } else if (
        looseMatch(uUnidade, "unidade") ||
        looseMatch(uUnidade, "orgânica")
      ) {
        matchedCat = "Unidade orgânica";
      } else {
        matchedCat = "Unidade Orgânica";
      }
    }

    if (uDirecao && !matchedDir) {
      if (matchedCat) {
        const possibleDirs =
          UNIDADES_ORGANICAS_SISTEMA.find((c) => c.nome === matchedCat)
            ?.direcoes || [];
        if (possibleDirs.length > 0) {
          matchedDir = possibleDirs[0];
        }
      }
    }

    if (uDepartamento && !matchedDep) {
      const allDeps = Object.values(DEPARTAMENTOS).flat();
      const found = allDeps.find((d) => looseMatch(d, uDepartamento));
      if (found) {
        matchedDep = found;
      }
    }

    return {
      cat: matchedCat || "Unidade Orgânica",
      dir: matchedDir,
      dep: matchedDep,
      rep: matchedRep,
      setor: matchedSetor,
      source: "Análise Semântica de Cargo",
      responsavel: user.nome || user.name || "",
      responsavelEmail: user.email || "",
    };
  };

  // Prefill from user session / navigation context
  useEffect(() => {
    // Só preencher se for uma nova atividade (sem id)
    if (initialData?.id) return;

    // Se já preenchemos a partir do Firestore dinâmico, não alteramos nada
    if (autoFilled && (colaboradores.length === 0 || autoFilledFromDynamic)) {
      return;
    }

    // 1. Prioridade absoluta: preencher a partir da alocação do utilizador logado (user) se disponível
    if (user) {
      // Sempre tentar preencher com base no utilizador logado (email, nuit ou nome) na base de dados de colaboradores
      const isProfileLoaded =
        user.id ||
        user.email ||
        user.name ||
        user.nome ||
        user.unidade ||
        user.direcao;
      if (isProfileLoaded) {
        const allocated = getUserAllocatedDetails();
        if (
          allocated &&
          (allocated.cat || allocated.dir || allocated.dep || allocated.rep)
        ) {
          if (allocated.cat) setSelectedCategory(allocated.cat);
          if (allocated.source) setAllocationSource(allocated.source);
          setFormData((prev) => ({
            ...prev,
            unidadeCentral:
              prev.unidadeCentral ||
              (allocated.cat === "Unidade Orgânica"
                ? "Unidade Orgânica"
                : ""),
            unidadeOrganica: allocated.cat || prev.unidadeOrganica,
            unidadeSelecionada: allocated.dir || prev.unidadeSelecionada,
            departamento: allocated.dep || prev.departamento,
            reparticao: allocated.rep || prev.reparticao,
            setor: allocated.setor || prev.setor,
            responsavel:
              allocated.responsavel ||
              prev.responsavel ||
              user.nome ||
              user.name ||
              "",
            responsavelEmail:
              allocated.responsavelEmail ||
              prev.responsavelEmail ||
              user.email ||
              "",
          }));

          // Se a origem for da lista dinâmica (Firestore) e a lista estiver carregada, marcamos como definitivo (dynamic)
          if (
            allocated.source &&
            allocated.source.includes("Efetivo Geral") &&
            colaboradores.length > 0
          ) {
            setAutoFilled(true);
            setAutoFilledFromDynamic(true);
          } else {
            setAutoFilled(true);
          }
          return; // Pré-preenchimento concluído com sucesso a partir do perfil do utilizador!
        }
      }
    }

    // Check if user is Admin/Administrador or system management role
    const isAdmin =
      user &&
      (user.role === "Admin" ||
        user.role === "Administrador" ||
        user.isOwner === true ||
        user.categoria?.toLowerCase()?.includes("proprietário") ||
        (user.name || "").toLowerCase().includes("administrador") ||
        user.email === "admin@songo.ac.mz" ||
        user.email === "slaitertripas@gmail.com" ||
        user.email === "fttripas@gmail.com");

    // 2. Fallback: preencher com base no contexto de navegação (sectorName) se for Admin ou não houver utilizador logado
    if (sectorName && (isAdmin || !user)) {
      let matchedCat = "";
      let matchedDir = "";
      let matchedDep = "";
      let matchedRep = "";

      const searchName = sectorName.toLowerCase().trim();

      // 1. See if navigating inside a Repartição
      const repGroup = findGroupForReparticao(searchName);
      if (repGroup.matchedRep) {
        matchedRep = repGroup.matchedRep;
        matchedDep = repGroup.matchedDep;
        matchedDir = repGroup.matchedDir;
        matchedCat = repGroup.matchedCat;
      }

      // 2. See if navigating inside a Department
      if (!matchedDep) {
        const group = findGroupForDepartment(searchName);
        if (group.matchedDir) {
          // Find actual matched department name
          let realDept = "";
          for (const depts of Object.values(DEPARTAMENTOS)) {
            const found = depts.find(
              (d) =>
                d.toLowerCase() === searchName || looseMatch(d, searchName),
            );
            if (found) {
              realDept = found;
              break;
            }
          }
          if (!realDept) {
            for (const depts of Object.values(DEPARTAMENTOS)) {
              const found = depts.find(
                (d) =>
                  d.toLowerCase() === searchName || looseMatch(d, searchName),
              );
              if (found) {
                realDept = found;
                break;
              }
            }
          }
          matchedDep = realDept || searchName;
          matchedDir = group.matchedDir;
          matchedCat = group.matchedCat;
        }
      }

      // 3. See if navigating inside a Directorate (Direção)
      if (!matchedDir) {
        const allDirs = UNIDADES_ORGANICAS_SISTEMA.flatMap((u) => u.direcoes);
        const foundDir = allDirs.find(
          (d) => d.toLowerCase() === searchName || looseMatch(d, searchName),
        );
        if (foundDir) {
          matchedDir = foundDir;
          for (const cat of UNIDADES_ORGANICAS_SISTEMA) {
            if (cat.direcoes.includes(matchedDir)) {
              matchedCat = cat.nome;
              break;
            }
          }
        }
      }

      // 4. Special case for "Gabinete do Diretor-Geral" or "Gabinete do Diretor-Geral"
      if (
        !matchedDir &&
        (searchName.includes("diretor geral") ||
          searchName.includes("gabinete"))
      ) {
        matchedDir = "Gabinete do Diretor-Geral";
        matchedCat = "Órgão de Direção e Gestão";
      }

      if (matchedCat || matchedDir || matchedDep || matchedRep) {
        if (matchedCat) setSelectedCategory(matchedCat);
        setFormData((prev) => ({
          ...prev,
          unidadeCentral:
            prev.unidadeCentral ||
            (matchedCat === "Unidade Orgânica" ? "Unidade Orgânica" : ""),
          unidadeOrganica: matchedCat || prev.unidadeOrganica,
          unidadeSelecionada: matchedDir || prev.unidadeSelecionada,
          departamento: matchedDep || prev.departamento,
          reparticao: matchedRep || prev.reparticao,
        }));
        setAutoFilled(true);
        return; // Prefill completed from active navigation!
      }
    }
  }, [
    user,
    sectorName,
    initialData,
    autoFilled,
    autoFilledFromDynamic,
    colaboradores,
    setSelectedCategory,
  ]);

  // Live validation of user allocation in step 1 - disabled by request to remove all allocation restrictions
  useEffect(() => {
    // Allocation restrictions removed
    return;
  }, [
    selectedCategory,
    formData.unidadeSelecionada,
    formData.departamento,
    formData.reparticao,
    user,
    initialData,
  ]);

  const validateStep = (currentStep: number) => {
    setError(null);
    switch (currentStep) {
      case 1:
        if (!selectedCategory) {
          setError("Selecione a Categoria");
          return false;
        }
        if (!formData.unidadeSelecionada) {
          setError("Selecione a Direção");
          return false;
        }
        if (!formData.departamento) {
          setError("Selecione o Departamento");
          return false;
        }

        // Repartição validation: check if the selected department has repartitions
        // Repartição is now optional per user request

        // Verificação inteligente de alocação de utilizador
        const isUserAdmin =
          user &&
          (user.role === "Admin" ||
            user.role === "Administrador" ||
            user.isOwner === true ||
            user.categoria?.toLowerCase()?.includes("proprietário") ||
            (user.name || "").toLowerCase().includes("administrador") ||
            user.email === "admin@songo.ac.mz" ||
            user.email === "slaitertripas@gmail.com" ||
            user.email === "fttripas@gmail.com");

        // Validação de alocação desativada por solicitação de remoção de restrições de alocação
        if (false && !isUserAdmin && user) {
          // Desativado
        }

        if (!formData.numeroAtividade) {
          const targetArea =
            formData.setor ||
            formData.reparticao ||
            user?.setor ||
            user?.reparticao ||
            sectorName ||
            formData.departamento ||
            (user ? getUserWorkspace(user) : "");
          const nextNum = calculateNextNum(plannedActivitiesProp, targetArea, user ? getUserWorkspace(user) : "");
          const numStr = String(nextNum).padStart(3, "0");
          setFormData((prev) => ({
            ...prev,
            numeroAtividade: numStr,
          }));
        }
        return true;
      case 2:
        // Fonte de receita é opcional
        if (!formData.prioridade) {
          setError("Selecione a prioridade");
          return false;
        }
        if (!formData.nomeAtividade) {
          setError("Insira o nome da atividade");
          return false;
        }
        if (!formData.objetivoAtividade) {
          setError("Insira o objetivo da atividade");
          return false;
        }

        // Validação de atividade planificada (DPEP) desativada por solicitação de remoção de restrições de planificar
        if (false) {
          // Desativado
        }

        return true;
      case 3:
        if (!formData.realizacaoProvincia) {
          setError("Selecione a província de realização");
          return false;
        }
        if (!formData.realizacaoDistrito) {
          setError("Selecione o distrito de realização");
          return false;
        }
        return true;
      case 4:
        if (!formData.responsavel) {
          setError("Selecione o responsável");
          return false;
        }
        return true;
      case 5:
        if (!formData.frequencia) {
          setError("Selecione a frequência");
          return false;
        }
        const freq = formData.frequencia;

        if (freq === "Trimestral") {
          if (!formData.trimestres || formData.trimestres.length === 0) {
            setError("Selecione o trimestre de execução");
            return false;
          }
          if (
            !formData.mesesRealizacao ||
            formData.mesesRealizacao.length === 0
          ) {
            setError("Selecione o mês de execução");
            return false;
          }
        } else if (freq === "Mensal") {
          if (
            !formData.mesesRealizacao ||
            formData.mesesRealizacao.length === 0
          ) {
            setError("Selecione pelo menos um mês de realização");
            return false;
          }
        } else if (freq === "Semestral") {
          if (!formData.semestre) {
            setError("Selecione o semestre de execução");
            return false;
          }
        }

        if (!formData.dataInicio) {
          setError("Selecione a data de início");
          return false;
        }
        if (!formData.dataFim) {
          setError("Selecione a data de fim");
          return false;
        }

        const start = new Date(formData.dataInicio);
        if (isNaN(start.getTime())) {
          setError("Data de início inválida");
          return false;
        }

        const end = new Date(formData.dataFim);
        if (isNaN(end.getTime())) {
          setError("Data de fim inválida");
          return false;
        }
        if (start > end) {
          setError("Data de fim deve ser posterior à data de início");
          return false;
        }

        // Validação de duplicidade desativada por solicitação do usuário
        const dupCheckStep5 = { isDuplicate: false };

        return true;
      case 6:
        if (formData.necessitaTransporte === "Sim") {
          if (!formData.distanciaDestino) {
            setError("Insira a distância até ao destino");
            return false;
          }
          if (!formData.precoLitro) {
            setError("Insira o preço do combustível");
            return false;
          }
        }
        return true;
      case 7:
        if (formData.rubricas.length === 0) {
          setError("Adicione pelo menos uma rubrica");
          return false;
        }
        for (const r of formData.rubricas) {
          if (!r.rubrica) {
            setError("Selecione a rubrica para todos os itens");
            return false;
          }
          if (!r.necessidade) {
            setError("Selecione a necessidade para todos os itens");
            return false;
          }
          if (r.quantidade <= 0) {
            setError("A quantidade deve ser maior que zero");
            return false;
          }
          if (r.precoUnitario <= 0) {
            setError("O preço unitário deve ser maior que zero");
            return false;
          }
        }
        return true;
      case 8:
        if (!formData.necessitaAquisicao) {
          setError("Selecione a opção de aquisição");
          return false;
        }
        if (!formData.necessitaContratacao) {
          setError("Selecione a opção de contratação");
          return false;
        }
        return true;
      case 9:
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      if (step === 7 && !hasServiceRubrica) {
        // Se não tem rubrica de serviço, pula o passo 8 de aquisição/contratação
        setStep(9);
      } else {
        setStep((s) => Math.min(s + 1, totalSteps));
      }
    }
  };
  const prevStep = () => {
    setError(null);
    if (step === 9 && !hasServiceRubrica) {
      // Se não tem rubrica de serviço, volta direto para o 7
      setStep(7);
    } else {
      setStep((s) => Math.max(s - 1, 1));
    }
  };

  // Recalculate dependent rubricas when source values change
  useEffect(() => {
    setFormData((prev) => {
      let hasChanges = false;
      let currentRubricas = [...prev.rubricas];

      // Auto-inject Fuel Rubrica removido para garantir que o combustível só apareça se for explicitamente planificado pelo utilizador
      const needsTransport = prev.necessitaTransporte === "Sim";

      if (!needsTransport) {
        // Se transporte é "Não", remove rubrica de combustível apenas se foi auto-injetada anteriormente
        const index = currentRubricas.findIndex(
          (r) =>
            (r.necessidade === "Combustíveis e lubrificantes" ||
              r.necessidade === "121001 - Combustíveis e lubrificantes" ||
              (Boolean(r.necessidade) &&
                r.necessidade.toLowerCase().includes("combustív")) ||
              (Boolean(r.necessidade) && r.necessidade.includes("121001"))) &&
            (r as any).autoInjected === true,
        );
        if (index >= 0) {
          currentRubricas.splice(index, 1);
          if (currentRubricas.length === 0) {
            currentRubricas.push({
              id: Date.now(),
              rubrica: "",
              necessidade: "",
              especificacao: "",
              quantidade: 0,
              precoUnitario: 0,
              valorTotal: 0,
            });
          }
          hasChanges = true;
        }
      }

      const newRubricas = currentRubricas.map((rubrica) => {
        const rubStr = (rubrica.rubrica || "").toLowerCase();
        const necStr = (rubrica.necessidade || "").toLowerCase();

        const isRubricaPessoal =
          rubStr.includes("pessoal") ||
          (rubrica.rubrica || "").includes("112");
        const isDiretor =
          necStr.includes("diretor") ||
          necStr.includes("direto ger") ||
          (rubrica.necessidade || "").includes("(DG)") ||
          necStr.includes("(dg)");
        const isCivil =
          necStr.includes("civil") ||
          necStr.includes("técnico");
        const isDentro = necStr.includes("dentro");
        const isFora = necStr.includes("fora");

        const isAjudaCustoDiretorDentro =
          isRubricaPessoal &&
          isDentro &&
          isDiretor &&
          !necStr.includes("motorista") &&
          !necStr.includes("ida e volta");
        const isAjudaCustoDiretorFora = isRubricaPessoal && isFora && isDiretor;
        const isAjudaCustoCivilDentro =
          isRubricaPessoal &&
          isDentro &&
          isCivil &&
          !necStr.includes("motorista") &&
          !isDiretor &&
          !necStr.includes("ida e volta");
        const isAjudaCustoCivilFora =
          isRubricaPessoal &&
          isFora &&
          isCivil &&
          !necStr.includes("motorista");

        const isIdaVoltaGeral =
          necStr.includes("ida e volta") &&
          !necStr.includes("motorista");
        const isAjudaCustoMotoristaIdaVolta =
          (necStr.includes("motorista") &&
            necStr.includes("ida e volta")) ||
          rubrica.necessidade ===
            "Ajudas de custo para Motorista (ida e volta)";
        const isAjudaCustoMotorista =
          isRubricaPessoal &&
          necStr.includes("motorista") &&
          !isAjudaCustoMotoristaIdaVolta &&
          !isIdaVoltaGeral;
        const isCombustivel =
          rubrica.necessidade === "Combustíveis e lubrificantes" ||
          rubrica.necessidade === "121001 - Combustíveis e lubrificantes" ||
          (Boolean(rubrica.necessidade) &&
            necStr.includes("combustív")) ||
          (Boolean(rubrica.necessidade) &&
            (rubrica.necessidade || "").includes("121001"));

        if (isAjudaCustoDiretorDentro) {
          const precoUnitario = 9000;
          const qtd = rubrica.quantidade || 0;
          const dias = prev.totalDias || 0;
          const valorTotal =
            qtd * dias * precoUnitario + 0.3 * precoUnitario * qtd;
          if (
            rubrica.precoUnitario !== precoUnitario ||
            rubrica.valorTotal !== valorTotal
          ) {
            hasChanges = true;
            return { ...rubrica, precoUnitario, valorTotal };
          }
        }

        if (isAjudaCustoDiretorFora || isAjudaCustoCivilFora) {
          const precoUnitario = rubrica.precoUnitario || 0;
          const qtd = rubrica.quantidade || 0;
          const dias = prev.totalDias || 0;
          const valorTotal =
            qtd * dias * precoUnitario + 0.3 * precoUnitario * qtd;
          if (rubrica.valorTotal !== valorTotal) {
            hasChanges = true;
            return { ...rubrica, valorTotal };
          }
        }

        if (isAjudaCustoCivilDentro) {
          const precoUnitario = 6000;
          const qtd = rubrica.quantidade || 0;
          const dias = prev.totalDias || 0;
          const valorTotal =
            qtd * dias * precoUnitario + 0.3 * precoUnitario * qtd;
          if (
            rubrica.precoUnitario !== precoUnitario ||
            rubrica.valorTotal !== valorTotal
          ) {
            hasChanges = true;
            return { ...rubrica, precoUnitario, valorTotal };
          }
        }

        if (isIdaVoltaGeral) {
          const precoUnitario = 1800;
          const qtd = rubrica.quantidade || 1;
          const dias = 1;
          const valorTotal = qtd * dias * precoUnitario;
          if (
            rubrica.precoUnitario !== precoUnitario ||
            rubrica.quantidade !== qtd ||
            rubrica.valorTotal !== valorTotal
          ) {
            hasChanges = true;
            return { ...rubrica, precoUnitario, quantidade: qtd, valorTotal };
          }
        }

        if (isAjudaCustoMotoristaIdaVolta) {
          const precoUnitario = 1800;
          const qtd = 1;
          const dias = 2;
          const valorTotal = qtd * dias * precoUnitario;
          if (
            rubrica.precoUnitario !== precoUnitario ||
            rubrica.quantidade !== qtd ||
            rubrica.valorTotal !== valorTotal
          ) {
            hasChanges = true;
            return { ...rubrica, precoUnitario, quantidade: qtd, valorTotal };
          }
        }

        if (isAjudaCustoMotorista) {
          const precoUnitario = 1800;
          const qtd = 1;
          const dias = prev.totalDias || 1;

          const valorTotal =
            qtd * dias * precoUnitario + 0.3 * precoUnitario * qtd;
          if (
            rubrica.precoUnitario !== precoUnitario ||
            rubrica.quantidade !== qtd ||
            rubrica.valorTotal !== valorTotal
          ) {
            hasChanges = true;
            return { ...rubrica, precoUnitario, quantidade: qtd, valorTotal };
          }
        }
        if (isCombustivel && (rubrica as any).autoInjected === true) {
          const quantidade = prev.litrosGasoleo || "";
          const precoUnitario = prev.precoLitro || "";
          const valorTotal =
            prev.valorTotalGasoleo || (quantidade !== "" && precoUnitario !== "" ? Number(quantidade) * Number(precoUnitario) : "");
          const especificacao = `Combustível do tipo ${prev.tipoCombustivel || "Gasóleo"} (${quantidade} Litros x ${precoUnitario} MT) + 15% Margem (Oscilação/Desgaste)`;
          if (
            rubrica.quantidade !== quantidade ||
            rubrica.precoUnitario !== precoUnitario ||
            rubrica.valorTotal !== valorTotal ||
            rubrica.especificacao !== especificacao ||
            !rubrica.rubrica ||
            !rubrica.necessidade
          ) {
            hasChanges = true;
            return {
              ...rubrica,
              rubrica: rubrica.rubrica || "Bens - 121",
              necessidade:
                rubrica.necessidade || "121001 - Combustíveis e lubrificantes",
              quantidade,
              precoUnitario,
              valorTotal,
              especificacao,
              autoInjected: true,
            };
          }
        }

        return rubrica;
      });

      if (hasChanges) {
        return { ...prev, rubricas: newRubricas };
      }
      return prev;
    });
  }, [
    formData.totalDias,
    formData.litrosGasoleo,
    formData.precoLitro,
    formData.valorTotalGasoleo,
    formData.tipoCombustivel,
    formData.necessitaTransporte,
    formData.viatura,
  ]);

  const handleActivityNameChange = (val: string) => {
    setFormData((prev) => ({ ...prev, nomeAtividade: val }));

    if (!val || val.length < 3) return;

    // Search if this activity exists in past planned activities belonging to the current sector first
    let pastActivity = null;
    if (currentSector) {
      pastActivity = plannedActivities.find(
        (a) =>
          a.title &&
          String(a.title).toLowerCase() === String(val).toLowerCase() &&
          a.setor &&
          String(a.setor).toLowerCase() === String(currentSector).toLowerCase(),
      );
    }

    // Fallback to general search if not found inside current sector
    if (!pastActivity) {
      pastActivity = plannedActivities.find(
        (a) => a.title && String(a.title).toLowerCase() === String(val).toLowerCase(),
      );
    }

    if (pastActivity) {
      setFormData((prev) => ({
        ...prev,
        objetivoAtividade:
          pastActivity.objetivoActividade ||
          pastActivity.objetivo ||
          prev.objetivoAtividade,
        realizacaoProvincia:
          pastActivity.localRealizacao?.split(" - ")[0] ||
          pastActivity.trabalhoProvincia ||
          pastActivity.realizacaoProvincia ||
          prev.realizacaoProvincia,
        realizacaoDistrito:
          pastActivity.localRealizacao?.split(" - ")[1] ||
          pastActivity.trabalhoDistrito ||
          pastActivity.realizacaoDistrito ||
          prev.realizacaoDistrito,
        trabalhoProvincia:
          pastActivity.localRealizacao?.split(" - ")[0] ||
          pastActivity.trabalhoProvincia ||
          pastActivity.realizacaoProvincia ||
          prev.trabalhoProvincia,
        trabalhoDistrito:
          pastActivity.localRealizacao?.split(" - ")[1] ||
          pastActivity.trabalhoDistrito ||
          pastActivity.realizacaoDistrito ||
          prev.trabalhoDistrito,
        ano: nextYear, // Force current target year
        necessitaAquisicao:
          pastActivity.necessitaAquisicao || prev.necessitaAquisicao,
        necessitaContratacao:
          pastActivity.necessitaContratacao || prev.necessitaContratacao,
        necessitaTransporte:
          pastActivity.necessitaTransporte || prev.necessitaTransporte,
        frequencia: pastActivity.frequencia || prev.frequencia,
        tipoPlano: pastActivity.tipoPlano || prev.tipoPlano,
        prioridade: pastActivity.nivel || prev.prioridade,
        fonteReceita: pastActivity.orcamento || prev.fonteReceita,
        rubricas:
          pastActivity.rubricas && pastActivity.rubricas.length > 0
            ? pastActivity.rubricas.map((r: any) => ({
                ...r,
                id: Date.now() + Math.random(),
              }))
            : prev.rubricas,
        viatura: pastActivity.viatura || prev.viatura,
        motorista: pastActivity.motorista || prev.motorista,
        outrosColaboradores:
          pastActivity.outrosColaboradores || prev.outrosColaboradores,
      }));

      setAutoFilledFromDynamic(true);
      setTimeout(() => setAutoFilledFromDynamic(false), 5000);
    }
  };

  const handleAddRubrica = () => {
    setFormData({
      ...formData,
      rubricas: [
        ...formData.rubricas,
        {
          id: Date.now(),
          rubrica: "",
          necessidade: "",
          especificacao: "",
          detalhes: "",
          pessoas: 1,
          quantidade: 0,
          precoUnitario: 0,
          valorTotal: 0,
          pessoa: "",
          dias: 0,
          valorDiario: 6000,
          temMeioDia: false,
          meioDia30: 0,
        },
      ],
    });
  };

  const updateRubricaNecessidade = (index: number, necessidade: string) => {
    const newRubricas = [...formData.rubricas];
    // Reset product and related fields when necessity changes
    const rubrica = { 
      ...newRubricas[index], 
      nomeProduto: "", 
      precoUnitario: 0, 
      valorTotal: 0, 
      detalhes: "", 
      especificacao: "" 
    };

    const rubStr = (rubrica.rubrica || "").toLowerCase();
    const necStr = (necessidade || "").toLowerCase();

    // Verificação robusta para Ajuda de Custo
    const isAjudaCusto =
      (rubStr.includes("pessoal") ||
        (rubrica.rubrica || "").includes("112")) &&
      necStr.includes("ajuda") &&
      necStr.includes("custo");

    const isDiretor =
      necStr.includes("diretor") ||
      necStr.includes("direto ger") ||
      (necessidade || "").includes("(DG)") ||
      necStr.includes("(dg)");
    const isFora = necStr.includes("fora");
    const valorDiario = isFora ? 0 : isDiretor ? 9000 : 6000;

    if (isAjudaCusto) {
      const isIdaVoltaGeral =
        necessidade ===
        "Ajuda de custo dentro do país para pessoal civil (IDA E VOLTA GERAL)";
      const isMotoristaIdaVoltaManual =
        necessidade === "Ajudas de custo para Motorista (ida e volta)" ||
        necessidade ===
          "Ajuda de custo dentro do país para pessoal civil (MOTORISTA)";
      const isMotorista =
        necStr.includes("motorista") &&
        !isMotoristaIdaVoltaManual &&
        !isIdaVoltaGeral;

      if (isIdaVoltaGeral) {
        const qtd = rubrica.quantidade || 1;
        newRubricas[index] = {
          ...rubrica,
          necessidade,
          valorDiario: 1800,
          precoUnitario: 1800,
          quantidade: qtd,
          valorTotal: qtd * 1800,
        };
      } else if (isMotoristaIdaVoltaManual) {
        newRubricas[index] = {
          ...rubrica,
          necessidade,
          valorDiario: 1800,
          precoUnitario: 1800,
          quantidade: 1,
          valorTotal: 3600,
        };
      } else {
        const realValorDiario = isMotorista
          ? 1800
          : isFora
            ? rubrica.precoUnitario || 0
            : valorDiario;
        const pessoas = isMotorista ? 1 : rubrica.quantidade || 1;
        const dias = formData.totalDias || 1;

        let valorTotal = 0;
        if (isMotorista) {
          valorTotal =
            pessoas * dias * realValorDiario + 0.3 * realValorDiario * pessoas;
        } else if (isFora) {
          valorTotal =
            pessoas * dias * realValorDiario + 0.3 * realValorDiario * pessoas;
        } else {
          valorTotal =
            pessoas * dias * realValorDiario + 0.3 * realValorDiario * pessoas;
        }

        newRubricas[index] = {
          ...rubrica,
          necessidade,
          valorDiario: realValorDiario,
          precoUnitario: realValorDiario,
          quantidade: pessoas,
          valorTotal,
        };
      }
    } else if (
      necessidade === "Combustíveis e lubrificantes" ||
      necessidade === "121001 - Combustíveis e lubrificantes" ||
      necessidade.toLowerCase().includes("combustí") ||
      necessidade.includes("121001")
    ) {
      const quantidade = formData.litrosGasoleo || 0;
      const precoUnitario = formData.precoLitro || 125;
      const valorTotal =
        formData.valorTotalGasoleo || quantidade * precoUnitario;
      const especificacao = `Combustível do tipo ${formData.tipoCombustivel || "Gasóleo"} (${quantidade} Litros x ${precoUnitario} MT) + 15% Margem (Oscilação/Desgaste)`;
      newRubricas[index] = {
        ...rubrica,
        rubrica: "Bens - 121",
        necessidade,
        especificacao,
        quantidade,
        precoUnitario,
        valorTotal,
        valorDiario: 0,
      };
    } else {
      const filteredFromState = getFilteredProductsForRubrica(
        products,
        rubrica.rubrica,
        necessidade
      );
      
      newRubricas[index] = {
        ...rubrica,
        necessidade,
      };

      if (filteredFromState.length > 0) {
        const firstProd = filteredFromState[0];
        const prc = Number(firstProd.preco) || 0;
        const qtd = rubrica.quantidade || 1;
        const valorTotal = qtd * prc;

        newRubricas[index] = {
          ...newRubricas[index],
          nomeProduto: firstProd.nome,
          precoUnitario: prc as any,
          detalhes: firstProd.unidade || "Unidade",
          especificacao: firstProd.especificacao || "",
          quantidade: qtd,
          valorTotal,
          valorDiario: 0,
        };
      } else {
        newRubricas[index] = {
          ...rubrica,
          necessidade,
          valorDiario: 0,
          precoUnitario: rubrica.precoUnitario || ("" as any),
          valorTotal: rubrica.valorTotal || 0,
        };
      }
    }
    setFormData({ ...formData, rubricas: newRubricas });
  };

  const handleRemoveRubrica = (id: number) => {
    setFormData({
      ...formData,
      rubricas: formData.rubricas.filter((r) => r.id !== id),
    });
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        // Alterado para permitir que o utilizador selecione livremente e não bloquear a identificação
        const isMandatoLocked = false;

        return (
          <div className="space-y-6">
            <h4 className="text-lg font-bold text-blue-900 border-b pb-2 tracking-tighter">
              I. IDENTIFICAÇÃO
            </h4>

            {activeUser && (
              <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-blue-950">
                    Colaborador Logado: {activeUser.nome || activeUser.name || activeUser.fullName || activeUser.email || "Utilizador"}
                  </p>
                  <p className="text-[11px] text-blue-700">
                    {activeUser.direcao ? `Direção: ${activeUser.direcao}` : "Alocação institucional detetada automaticamente"}
                    {activeUser.departamento ? ` • Departamento: ${activeUser.departamento}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const allocated = getUserAllocatedDetails();
                    if (allocated) {
                      if (allocated.cat) setSelectedCategory(allocated.cat);
                      if (allocated.source) setAllocationSource(allocated.source);
                      setFormData((prev) => ({
                        ...prev,
                        unidadeOrganica: allocated.cat || prev.unidadeOrganica,
                        unidadeSelecionada: allocated.dir || prev.unidadeSelecionada,
                        departamento: allocated.dep || prev.departamento,
                        reparticao: allocated.rep || prev.reparticao,
                        setor: allocated.setor || prev.setor,
                        responsavel: allocated.responsavel || activeUser.nome || activeUser.name || activeUser.fullName || "",
                        responsavelEmail: allocated.responsavelEmail || activeUser.email || "",
                      }));
                      setAutoFilled(true);
                    } else if (activeUser.unidade || activeUser.direcao || activeUser.departamento) {
                      const directCat = activeUser.unidade || activeUser.unidadeOrganica || "Unidade Orgânica";
                      if (directCat) setSelectedCategory(directCat);
                      setFormData((prev) => ({
                        ...prev,
                        unidadeOrganica: directCat || prev.unidadeOrganica,
                        unidadeSelecionada: activeUser.direcao || prev.unidadeSelecionada,
                        departamento: activeUser.departamento || prev.departamento,
                        reparticao: activeUser.reparticao || prev.reparticao,
                        setor: activeUser.setor || prev.setor,
                        responsavel: prev.responsavel || activeUser.nome || activeUser.name || activeUser.fullName || "",
                        responsavelEmail: prev.responsavelEmail || activeUser.email || "",
                      }));
                      setAutoFilled(true);
                    }
                  }}
                  className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                >
                  Auto-Preencher Órgão, Direção e Departamento
                </button>
              </div>
            )}

            {allocationWarning && (
              <div
                id="allocation-warning-banner"
                className="bg-amber-50 border border-amber-300 text-amber-950 p-4 rounded-2xl flex items-start gap-3 shadow-sm animate-pulse"
              >
                <Info className="text-amber-600 shrink-0 mt-0.5" size={18} />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-amber-900">
                    Alocação de Unidade
                  </p>
                  <p>{allocationWarning}</p>
                </div>
              </div>
            )}

            {/* Offline Excel Template Helper Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-800">
                  Preenchimento Fora do Sistema (Excel)
                </p>
                <p className="text-[11px] text-slate-500">
                  Pode descarregar o modelo Excel (CSV), preencher offline e
                  importar novamente aqui para automatizar o preenchimento.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <button
                  type="button"
                  onClick={downloadExcelTemplate}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-[#107c41] hover:from-emerald-700 hover:to-[#0f733c] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
                >
                  <Download size={14} /> Descarregar Modelo Excel
                </button>
                <label className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm active:scale-95">
                  <Upload size={14} className="text-slate-500" /> Importar
                  Modelo Preenchido
                  <input
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    className="hidden"
                    onChange={handleCSVUpload}
                  />
                </label>
              </div>
            </div>

            {autoFilled && (
              <div
                id="allocation-autofill-banner"
                className="bg-blue-50 border border-blue-200 text-blue-950 p-4 rounded-2xl flex items-start gap-3 shadow-sm"
              >
                <Info className="text-blue-600 shrink-0 mt-0.5" size={18} />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-blue-900">
                    Alocação Preenchida Automaticamente (Localização Exata)
                  </p>
                  <p>
                    O sistema localizou com sucesso a sua afetação e alocação
                    consultando a{" "}
                    <strong>
                      {allocationSource || "Repartição de Pessoal"}
                    </strong>
                    :
                  </p>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-blue-200 font-medium">
                    <div>
                      <span className="font-bold text-blue-900">Órgão:</span>{" "}
                      {selectedCategory || "---"}
                    </div>
                    <div>
                      <span className="font-bold text-blue-900">Direção:</span>{" "}
                      {formData.unidadeSelecionada || "---"}
                    </div>
                    <div>
                      <span className="font-bold text-blue-900">
                        Departamento:
                      </span>{" "}
                      {formData.departamento || "---"}
                    </div>
                    <div>
                      <span className="font-bold text-blue-900">
                        Repartição:
                      </span>{" "}
                      {formData.reparticao || "---"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-[10px] font-black text-blue-900 mb-1">
                  Órgão
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    if (isMandatoLocked) return;
                    setSelectedCategory(e.target.value);
                    setFormData({
                      ...formData,
                      unidadeSelecionada: "",
                      departamento: "",
                      reparticao: "",
                      setor: "",
                    });
                  }}
                  disabled={isMandatoLocked}
                  className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="">Selecione...</option>
                  {UNIDADES_ORGANICAS_SISTEMA.map((u) => {
                    return (
                      <option key={u.id} value={u.nome}>
                        {u.nome}
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedCategory && (
                <div>
                  <label className="block text-[10px] font-black text-blue-900 mb-1">
                    Direção
                  </label>
                  <select
                    value={formData.unidadeSelecionada}
                    onChange={(e) => {
                      if (isMandatoLocked) return;
                      setFormData({
                        ...formData,
                        unidadeSelecionada: e.target.value,
                        departamento: "",
                        reparticao: "",
                        setor: "",
                      });
                    }}
                    disabled={isMandatoLocked}
                    className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    <option value="">Selecione...</option>
                    {UNIDADES_ORGANICAS_SISTEMA.find(
                      (u) => u.nome === selectedCategory,
                    )?.direcoes?.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-blue-900 mb-1">
                  Departamento
                </label>
                <select
                  value={formData.departamento}
                  onChange={(e) => {
                    if (isMandatoLocked) return;
                    const selectedDept = e.target.value;
                    const group = findGroupForDepartment(selectedDept);

                    if (group.matchedCat) setSelectedCategory(group.matchedCat);
                    setFormData((prev) => ({
                      ...prev,
                      departamento: selectedDept,
                      unidadeCentral:
                        prev.unidadeCentral ||
                        (group.matchedCat === "Unidade Orgânica"
                          ? "Unidade Orgânica"
                          : ""),
                      unidadeOrganica: group.matchedCat || prev.unidadeOrganica,
                      unidadeSelecionada:
                        group.matchedDir || prev.unidadeSelecionada,
                      reparticao: "",
                      setor: "",
                      curso: "",
                    }));
                  }}
                  disabled={isMandatoLocked}
                  className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="">Selecione...</option>
                  {(() => {
                    const direction = formData.unidadeSelecionada;
                    if (direction) {
                      const correctKey = Object.keys(DEPARTAMENTOS).find(
                        (k) => k.toLowerCase() === direction.toLowerCase(),
                      );
                      const list = correctKey
                        ? DEPARTAMENTOS[correctKey]
                        : null;

                      const depKey = Object.keys(DEPARTAMENTOS).find(
                        (k) => k.toLowerCase() === direction.toLowerCase(),
                      );
                      const backupList = depKey ? DEPARTAMENTOS[depKey] : [];

                      const finalDeps = list || backupList || [];
                      if (finalDeps.length === 0) {
                        return (
                          <option disabled>
                            Sem departamentos cadastrados
                          </option>
                        );
                      }
                      return Array.from(new Set(finalDeps)).map((d, idx) => (
                        <option key={`${d}-${idx}`} value={d}>
                          {d}
                        </option>
                      ));
                    } else {
                      // If no direction is selected yet, let them choose from any department and trigger auto-fill!
                      const allDepsSet = new Set<string>();
                      Object.values(DEPARTAMENTOS).forEach((arr) =>
                        arr.forEach((d) => allDepsSet.add(d)),
                      );
                      Object.values(DEPARTAMENTOS).forEach((arr) =>
                        arr.forEach((d) => allDepsSet.add(d)),
                      );
                      const allDeps = Array.from(allDepsSet).sort();
                      return allDeps.map((d, idx) => (
                        <option key={`${d}-${idx}`} value={d}>
                          {d}
                        </option>
                      ));
                    }
                  })()}
                </select>
              </div>

              {formData.departamento &&
              [
                "Departamento de Engenharia Eletrotécnica",
                "Departamento de Engenharia de Construção Civil",
                "Departamento de Engenharia de Construção Mecânica",
              ].includes(formData.departamento) ? (
                <div>
                  <label className="block text-[10px] font-black text-blue-900 mb-1">
                    Curso
                  </label>
                  <select
                    value={formData.curso}
                    onChange={(e) =>
                      setFormData({ ...formData, curso: e.target.value })
                    }
                    disabled={false}
                    className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    <option value="">Selecione o curso...</option>
                    {CURSOS[formData.departamento]?.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-[10px] font-black text-blue-900 mb-1">
                      Repartição
                    </label>
                    <select
                      value={formData.reparticao}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          reparticao: e.target.value,
                          setor: "",
                        })
                      }
                      disabled={!formData.departamento}
                      className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="">Selecione...</option>
                      {(() => {
                        const dept = formData.departamento;
                        if (!dept)
                          return (
                            <option disabled>
                              Selecione um departamento primeiro
                            </option>
                          );

                        const correctKey = Object.keys(REPARTICOES).find(
                          (k) => k.toLowerCase() === dept.toLowerCase(),
                        );
                        const finalReps = correctKey
                          ? REPARTICOES[correctKey]
                          : [];
                        if (finalReps.length === 0) {
                          return (
                            <option disabled>
                              Sem repartições cadastradas
                            </option>
                          );
                        }
                        return Array.from(new Set(finalReps)).map((r, idx) => (
                          <option key={`${r}-${idx}`} value={r}>
                            {r}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-blue-900 mb-1">
                      Sector
                    </label>
                    <select
                      value={formData.setor || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, setor: e.target.value })
                      }
                      disabled={!formData.reparticao}
                      className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="">Selecione...</option>
                      {(() => {
                        const rep = formData.reparticao;
                        if (!rep)
                          return (
                            <option disabled>
                              Selecione uma repartição primeiro
                            </option>
                          );

                        const correctKey = Object.keys(SECTORES).find(
                          (k) => k.toLowerCase() === rep.toLowerCase(),
                        );
                        const finalSectors = correctKey
                          ? SECTORES[correctKey]
                          : [];
                        if (finalSectors.length === 0) {
                          return (
                            <option disabled>Sem setores cadastrados</option>
                          );
                        }
                        return finalSectors.map((s, idx) => (
                          <option key={`${s}-${idx}`} value={s}>
                            {s}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      case 2:
        const deptForStored = formData.departamento || formData.unidadeOrganica || currentSector || selectedCategory || "";
        const deptStoredActs = getDepartmentStoredActivities(deptForStored);

        return (
          <div className="space-y-6">
            <h4 className="text-lg font-bold text-blue-900 border-b pb-2 tracking-tighter">
              II. ATIVIDADE
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[10px] font-black text-blue-900 mb-1">
                  Cód./Atividade
                </label>
                <input
                  type="text"
                  value={String(
                    formData.codigoAtividade ||
                      formData.numeroAtividade ||
                      ""
                  ).toUpperCase()}
                  readOnly
                  className="w-full p-2.5 border rounded-xl text-sm outline-none bg-gray-50 text-gray-500 font-mono font-bold transition-all"
                />
              </div>

              {isDPEP && (
                <>
                  <div>
                    <label className="block text-[10px] font-black text-blue-900 mb-1">
                      Fonte de Receita
                    </label>
                    <select
                      value={formData.fonteReceita || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fonteReceita: e.target.value,
                        })
                      }
                      className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all bg-white"
                    >
                      <option value="">Selecione...</option>
                      {FONTES_RECEITA.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-blue-900 mb-1">
                      Prioridade
                    </label>
                    <select
                      value={formData.prioridade || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, prioridade: e.target.value })
                      }
                      className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all bg-white"
                    >
                      <option value="">Selecione...</option>
                      {PRIORIDADES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-6">
              {autoFilledFromDynamic && (
                <div
                  id="dynamic-autofill-banner"
                  className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-4 rounded-2xl flex items-start gap-3 shadow-sm mb-4"
                >
                  <Info
                    className="text-emerald-600 shrink-0 mt-0.5"
                    size={18}
                  />
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-emerald-900">
                      Atividade Carregada do Histórico
                    </p>
                    <p>
                      O sistema preencheu automaticamente os dados desta
                      atividade com base no histórico de planeamentos
                      anteriores. Por favor, verifique e ajuste se necessário.
                    </p>
                  </div>
                </div>
              )}

              {/* Dropdown de Actividades Anteriores do Departamento para Nova Planificação */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-5 rounded-2xl shadow-sm mb-6">
                <label className="block text-xs font-black text-blue-950  tracking-widest mb-2 flex items-center gap-2">
                  <span>📦 Reutilizar Actividade Anterior do Departamento (Preenchimento Automático)</span>
                </label>
                <select
                  className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl text-sm font-bold text-blue-950 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    if (!selectedId) return;
                    const chosen = deptStoredActs.find((a: any) => String(a?.id || a?.nomeAtividade) === String(selectedId));
                    if (chosen) {
                      setFormData((prev) => ({
                        ...prev,
                        nomeAtividade: chosen.nomeAtividade || chosen.title || prev.nomeAtividade,
                        objetivoAtividade: chosen.objetivoAtividade || chosen.objetivoActividade || chosen.objetivo || prev.objetivoAtividade,
                        fonteReceita: chosen.fonteReceita || chosen.orcamento || prev.fonteReceita,
                        prioridade: chosen.prioridade || prev.prioridade,
                        responsavel: chosen.responsavel || prev.responsavel,
                        rubricas: chosen.rubricas && Array.isArray(chosen.rubricas) && chosen.rubricas.length > 0 ? chosen.rubricas : prev.rubricas,
                        realizacaoProvincia: chosen.realizacaoProvincia || prev.realizacaoProvincia,
                        realizacaoDistrito: chosen.realizacaoDistrito || prev.realizacaoDistrito,
                      }));
                    }
                  }}
                  defaultValue=""
                >
                  <option value="">Selecione uma actividade armazenada do departamento para reutilizar...</option>
                  {deptStoredActs.map((act: any, i: number) => {
                    if (!act) return null;
                    const actName = String(act.nomeAtividade || act.title || `Atividade ${i + 1}`);
                    const actMes = act.mesRealizacao ? `(${act.mesRealizacao})` : "";
                    const actDept = String(act.departamento || currentSector || "");
                    const actVal = act.id || act.nomeAtividade || `act-${i}`;
                    return (
                      <option key={String(act.id || `${actName}-${i}`)} value={String(actVal)}>
                        {actName} {actMes} - {actDept}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[11px] text-blue-700/80 mt-1.5 italic">
                  💡 Ao selecionar, o sistema aplica todos os dados e rubricas da actividade anterior, bastando ao utilizador atualizar o necessário para a nova planificação.
                </p>
              </div>

              {sectorActivities.length > 0 && (
                <div className="bg-blue-50/50 border border-blue-900/10 p-4 rounded-2xl space-y-2">
                  <label className="block text-[10px] font-black text-blue-900  tracking-wider">
                    Coleção de Atividades do Setor ({currentSector})
                  </label>
                  <select
                    onChange={(e) => {
                      const selectedActTitle = e.target.value;
                      if (!selectedActTitle) return;
                      handleActivityNameChange(selectedActTitle);
                      const actObj = sectorActivities.find(
                        (a) => String(a?.title) === String(selectedActTitle),
                      );
                      if (actObj) {
                        const objectiveVal =
                          actObj.objetivoActividade ||
                          actObj.objetivo ||
                          actObj.objetivoAtividade ||
                          "";
                        setFormData((prev) => ({
                          ...prev,
                          nomeAtividade: selectedActTitle,
                          objetivoAtividade: String(objectiveVal),
                        }));
                      }
                    }}
                    value={formData.nomeAtividade || ""}
                    className="w-full p-2.5 border border-blue-900/20 rounded-xl text-xs bg-white text-gray-800 outline-none focus:ring-2 focus:ring-blue-500/20 font-bold transition-all"
                  >
                    <option value="">
                      -- Selecione uma atividade planificada do setor --
                    </option>
                    {Array.from(
                      new Set(sectorActivities.map((a) => String(a?.title || "")).filter(Boolean)),
                    ).map((title) => {
                      const act = sectorActivities.find(
                        (a) => String(a?.title) === String(title),
                      );
                      const objText = act
                        ? act.objetivoActividade ||
                          act.objetivo ||
                          act.objetivoAtividade ||
                          ""
                        : "";
                      const preview = objText
                        ? ` - ${String(objText).substring(0, 60)}...`
                        : "";
                      return (
                        <option key={title} value={title}>
                          {title}
                          {preview}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-[10px] font-black text-blue-900 mb-1">
                  Nome da atividade
                </label>
                <input
                  type="text"
                  list="past-activities"
                  value={formData.nomeAtividade || ""}
                  onChange={(e) => handleActivityNameChange(e.target.value)}
                  placeholder="Escreva o nome da atividade..."
                  className="w-full p-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
                <datalist id="past-activities">
                  {(() => {
                    const actsToUse =
                      sectorActivities.length > 0
                        ? sectorActivities
                        : plannedActivities;
                    return Array.from(
                      new Set((actsToUse || []).map((a) => String(a?.title || "")).filter(Boolean)),
                    ).map((title) => <option key={title} value={title} />);
                  })()}
                </datalist>
              </div>
              <div>
                <label className="block text-[10px] font-black text-blue-900 mb-1">
                  Objetivo da atividade
                </label>
                <textarea
                  rows={4}
                  value={String(formData.objetivoAtividade || "")}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      objetivoAtividade: e.target.value,
                    })
                  }
                  placeholder="Escreva o objetivo..."
                  className="w-full p-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-8">
            <h4 className="text-lg font-bold text-blue-900 border-b pb-2 tracking-tighter">
              III. LOCALIZAÇÃO E PROVÍNCIA DE REALIZAÇÃO
            </h4>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 border-b border-gray-100">
                <div>
                  <label className="block text-[10px] font-black text-blue-900 mb-1">
                    Local de Partida (Distrito)
                  </label>
                  <input
                    type="text"
                    value="Cahora Bassa"
                    readOnly
                    className="w-full p-2.5 border rounded-xl text-sm bg-gray-50 text-gray-500 cursor-not-allowed outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <p className="text-xs font-black text-blue-900 tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-700 rounded-full"></span>
                  Local de Realização (Destino)
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      realizacaoProvincia: "Tete",
                      realizacaoDistrito: "Cahora Bassa",
                      trabalhoProvincia: "Tete",
                      trabalhoDistrito: "Cahora Bassa",
                      distanciaDestino: 0,
                      distanciaKm: 0,
                      litrosGasoleo: 0,
                      valorTotalGasoleo: 0,
                    });
                  }}
                  className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-[10px] font-bold transition-colors"
                >
                  Usar Localização da Instituição
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-blue-900 mb-1">
                    Província
                  </label>
                  <select
                    value={
                      formData.realizacaoProvincia || formData.trabalhoProvincia
                    }
                    onChange={(e) => {
                      const prov = e.target.value;
                      setFormData({
                        ...formData,
                        realizacaoProvincia: prov,
                        trabalhoProvincia: prov,
                        realizacaoDistrito: "",
                        trabalhoDistrito: "",
                      });
                    }}
                    className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="">Selecione a província...</option>
                    {Object.keys(PROVINCIAS).map((p) => (
                      <option key={p} value={p}>
                        {p.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-blue-900 mb-1">
                    Distrito
                  </label>
                  <select
                    value={
                      formData.realizacaoDistrito || formData.trabalhoDistrito
                    }
                    onChange={(e) => {
                      const distrit = e.target.value;
                      setFormData({
                        ...formData,
                        realizacaoDistrito: distrit,
                        trabalhoDistrito: distrit,
                        localidade: "",
                        postoAdministrativo: "",
                      });
                    }}
                    disabled={
                      !formData.realizacaoProvincia &&
                      !formData.trabalhoProvincia
                    }
                    className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="">Selecione o distrito...</option>
                    {(formData.realizacaoProvincia ||
                      formData.trabalhoProvincia) &&
                      PROVINCIAS[
                        formData.realizacaoProvincia ||
                          formData.trabalhoProvincia
                      ]?.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                  </select>
                </div>
                {formData.realizacaoProvincia === "Tete" &&
                  formData.realizacaoDistrito === "Cidade de Tete" && (
                    <div>
                      <label className="block text-[10px] font-black text-blue-900 mb-1">
                        Localidade/Bairro (Cidade de Tete)
                      </label>
                      <input
                        type="text"
                        list="localidade-list-tete"
                        value={formData.localidade || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            localidade: e.target.value,
                          })
                        }
                        placeholder="Indique o bairro ou localidade..."
                        className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                      <datalist id="localidade-list-tete">
                        {Array.from(
                          new Set(
                            plannedActivities
                              .map((a) => a.localidade)
                              .filter(Boolean),
                          ),
                        ).map((loc) => (
                          <option key={loc} value={loc} />
                        ))}
                      </datalist>
                    </div>
                  )}
                {formData.realizacaoDistrito === "Cahora Bassa" && (
                  <>
                    <div>
                      <label className="block text-[10px] font-black text-blue-900 mb-1">
                        Posto Administrativo (Cahora Bassa)
                      </label>
                      <select
                        value={formData.postoAdministrativo || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            postoAdministrativo: e.target.value,
                          })
                        }
                        className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      >
                        <option value="">Selecione o posto...</option>
                        <option value="Songo">Songo (Sede)</option>
                        <option value="Chitima">Chitima</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-blue-900 mb-1">
                        Localidade (Cahora Bassa)
                      </label>
                      <input
                        type="text"
                        list="localidade-list-cahora"
                        value={formData.localidade || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            localidade: e.target.value,
                          })
                        }
                        placeholder="Indique a localidade..."
                        className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                      <datalist id="localidade-list-cahora">
                        {Array.from(
                          new Set(
                            plannedActivities
                              .map((a) => a.localidade)
                              .filter(Boolean),
                          ),
                        ).map((loc) => (
                          <option key={loc} value={loc} />
                        ))}
                      </datalist>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-8">
            <h4 className="text-lg font-bold text-blue-900 border-b pb-2 tracking-tighter">
              IV. RECURSOS HUMANOS
            </h4>

            {/* Recursos Humanos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-blue-900 mb-1">
                  Responsável
                </label>
                <SearchableSelect
                  value={formData.responsavel}
                  onChange={(val) => {
                    const colab = (colaboradores || []).find(
                      (c) => c.nome === val || c.name === val,
                    );
                    setFormData({
                      ...formData,
                      responsavel: val,
                      responsavelEmail: colab?.email || "",
                    });
                  }}
                  options={responsavelOptions}
                  placeholder="Selecione o Responsável..."
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-blue-900 mb-1">
                  Outros Colaboradores
                </label>
                <SearchableSelect
                  value={formData.outrosColaboradores}
                  onChange={(val) =>
                    setFormData({ ...formData, outrosColaboradores: val })
                  }
                  options={outrosColaboradoresOptions}
                  placeholder="Selecione Colaboradores..."
                  className="w-full"
                />
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-8 animate-in fade-in duration-300">
            <h4 className="text-lg font-bold text-blue-900 border-b pb-2 tracking-tighter">
              V. TEMPO E DURAÇÃO
            </h4>

            {weekendWarning && (
              <div className="bg-rose-50 border border-rose-200 text-rose-950 p-4 rounded-xl flex items-start gap-3 shadow-sm animate-pulse">
                <AlertTriangle
                  className="text-rose-600 shrink-0 mt-0.5"
                  size={18}
                />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-rose-900">Alerta de Data</p>
                  <p>{weekendWarning}</p>
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-[10px] font-black text-blue-900 mb-2  tracking-widest">
                Frequência da Atividade
              </label>
              <select
                value={formData.frequencia}
                onChange={(e) => {
                  const val = e.target.value;
                  const nextYear = new Date().getFullYear() + 1;
                  setFormData((prev) => {
                    let update: any = {
                      frequencia: val,
                      semestre: "",
                      trimestres: [],
                      mesesRealizacao: [],
                      mesesDetalhes: {},
                      dataInicio: "",
                      dataFim: "",
                      totalDias: 0,
                    };

                    if (val === "Anual") {
                      update.trimestres = [
                        "1º Trimestre",
                        "2º Trimestre",
                        "3º Trimestre",
                        "4º Trimestre",
                      ];
                      update.dataInicio = `${nextYear}-01-01`;
                      update.dataFim = `${nextYear}-12-31`;
                      update.mesesRealizacao = [
                        "Janeiro",
                        "Fevereiro",
                        "Março",
                        "Abril",
                        "Maio",
                        "Junho",
                        "Julho",
                        "Agosto",
                        "Setembro",
                        "Outubro",
                        "Novembro",
                        "Dezembro",
                      ];
                      // Calcular dias do ano - 12x1 = 12 dias (1 dia por mês)
                      update.totalDias = 12;
                    }
                    
                    return { ...prev, ...update };
                  });
                }}
                className="w-full p-3 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 font-bold text-blue-900 bg-white"
              >
                <option value="Anual">Anual</option>
                <option value="Semestral">Semestral</option>
                <option value="Trimestral">Trimestral</option>
                <option value="Mensal">Mensal</option>
                <option value="Semanal">Semanal</option>
                <option value="Diário">Diário</option>
              </select>
            </div>

            {formData.frequencia === "Anual" && (
              <div className="mb-6 p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl animate-in fade-in duration-300">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs mb-1">
                  <span className="px-2.5 py-0.5 bg-emerald-600 text-white text-[10px] rounded-full  font-black tracking-wider">
                    12×1 = 12 Dias
                  </span>
                  <span>Periodicidade Anual (1 dia por mês)</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Para atividades com frequência Anual, o sistema calcula automaticamente <strong>12 dias</strong> (12 meses × 1 dia por mês = 12 dias no ano).
                </p>
              </div>
            )}

            {formData.frequencia === "Semestral" && (
              <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl animate-in fade-in duration-300">
                <label className="block text-[10px] font-black text-blue-900 mb-2  tracking-widest">
                  Semestre de Execução
                </label>
                <select
                  value={formData.semestre || ""}
                  onChange={(e) => {
                    const sem = e.target.value;
                    const semTrims = sem === "1º Semestre" 
                      ? ["1º Trimestre", "2º Trimestre"]
                      : sem === "2º Semestre"
                        ? ["3º Trimestre", "4º Trimestre"]
                        : [];
                    setFormData({
                      ...formData,
                      semestre: sem,
                      trimestres: semTrims,
                      dataInicio: "",
                      dataFim: "",
                      totalDias: 0,
                    });
                  }}
                  className="w-full p-3 border rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 font-bold text-blue-900"
                >
                  <option value="">Selecione o Semestre...</option>
                  <option value="1º Semestre">1º Semestre</option>
                  <option value="2º Semestre">2º Semestre</option>
                </select>
              </div>
            )}

            {formData.frequencia === "Trimestral" && (
              <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl animate-in fade-in duration-300 space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-blue-900 mb-2  tracking-widest">
                    Trimestre de Execução
                  </label>
                  <select
                    value={formData.trimestres?.[0] || ""}
                    onChange={(e) => {
                      const t = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        trimestres: t ? [t] : [],
                        mesesRealizacao: [],
                        mesesDetalhes: {},
                        dataInicio: "",
                        dataFim: "",
                        totalDias: 0,
                      }));
                    }}
                    className="w-full p-3 border rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 font-bold text-blue-900"
                  >
                    <option value="">Selecione o Trimestre...</option>
                    <option value="1º Trimestre">1º Trimestre</option>
                    <option value="2º Trimestre">2º Trimestre</option>
                    <option value="3º Trimestre">3º Trimestre</option>
                    <option value="4º Trimestre">4º Trimestre</option>
                  </select>
                </div>

                {formData.trimestres?.[0] && (
                  <div className="animate-in fade-in duration-300">
                    <label className="block text-[10px] font-black text-blue-900 mb-2  tracking-widest">
                      Mês de Execução
                    </label>
                    <select
                      value={formData.mesesRealizacao?.[0] || ""}
                      onChange={(e) => {
                        const m = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          mesesRealizacao: m ? [m] : [],
                          mesesDetalhes: {},
                          dataInicio: "",
                          dataFim: "",
                          totalDias: 0,
                        }));
                      }}
                      className="w-full p-3 border rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 font-bold text-blue-900"
                    >
                      <option value="">Selecione o Mês...</option>
                      {formData.trimestres[0] === "1º Trimestre" && (
                        <>
                          <option value="Janeiro">Janeiro</option>
                          <option value="Fevereiro">Fevereiro</option>
                          <option value="Março">Março</option>
                        </>
                      )}
                      {formData.trimestres[0] === "2º Trimestre" && (
                        <>
                          <option value="Abril">Abril</option>
                          <option value="Maio">Maio</option>
                          <option value="Junho">Junho</option>
                        </>
                      )}
                      {formData.trimestres[0] === "3º Trimestre" && (
                        <>
                          <option value="Julho">Julho</option>
                          <option value="Agosto">Agosto</option>
                          <option value="Setembro">Setembro</option>
                        </>
                      )}
                      {formData.trimestres[0] === "4º Trimestre" && (
                        <>
                          <option value="Outubro">Outubro</option>
                          <option value="Novembro">Novembro</option>
                          <option value="Dezembro">Dezembro</option>
                        </>
                      )}
                    </select>
                  </div>
                )}
              </div>
            )}

            {formData.frequencia === "Mensal" && (
              <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl animate-in fade-in duration-300 space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-blue-900 mb-2  tracking-widest">
                    Trimestre de Execução (Opcional)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {TRIMESTRES.map((t) => {
                      const isSelected = formData.trimestres?.includes(t);
                      return (
                        <label
                          key={t}
                          className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all ${isSelected ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-200 hover:border-blue-300"}`}
                        >
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={isSelected}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              let newTrims = [...(formData.trimestres || [])];
                              if (checked) {
                                newTrims.push(t);
                              } else {
                                newTrims = newTrims.filter(
                                  (item) => item !== t,
                                );
                              }
                              setFormData({
                                ...formData,
                                trimestres: newTrims,
                              });
                            }}
                          />
                          <span className="text-[10px] font-black ">
                            {t}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-blue-900 mb-2  tracking-widest">
                    Meses de Execução
                  </label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {MESES.map((m) => {
                      const trimForMonth = [
                        "Janeiro",
                        "Fevereiro",
                        "Março",
                      ].includes(m)
                        ? "1º Trimestre"
                        : ["Abril", "Maio", "Junho"].includes(m)
                          ? "2º Trimestre"
                          : ["Julho", "Agosto", "Setembro"].includes(m)
                            ? "3º Trimestre"
                            : "4º Trimestre";

                      const isSelectable =
                        !formData.trimestres ||
                        formData.trimestres.length === 0 ||
                        formData.trimestres.includes(trimForMonth);
                      const isSelected = formData.mesesRealizacao?.includes(m);

                      return (
                        <label
                          key={m}
                          className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-all ${!isSelectable ? "opacity-30 grayscale cursor-not-allowed" : isSelected ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-slate-200 hover:border-emerald-300"}`}
                        >
                          <input
                            type="checkbox"
                            className="hidden"
                            disabled={!isSelectable}
                            checked={isSelected}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              let newMeses = [
                                ...(formData.mesesRealizacao || []),
                              ];
                              if (checked) {
                                newMeses.push(m);
                              } else {
                                newMeses = newMeses.filter(
                                  (item) => item !== m,
                                );
                              }
                              setFormData({
                                ...formData,
                                mesesRealizacao: newMeses,
                              });
                            }}
                          />
                          <span className="text-[10px] font-black ">
                            {m.substring(0, 3)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {(formData.frequencia === "Mensal" ||
              formData.frequencia === "Trimestral") &&
              formData.mesesRealizacao &&
              formData.mesesRealizacao.length > 0 && (
                <div className="mt-6 space-y-4 animate-in fade-in duration-500">
                  <label className="block text-[10px] font-black text-blue-900  tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                    Datas precisas para cada mês de execução
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formData.mesesRealizacao.map((m: string) => {
                      const limits = getMonthDateLimits(m, nextYear);
                      return (
                        <div
                          key={m}
                          className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative group hover:border-blue-300 transition-all"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-slate-800  tracking-tighter">
                              {m}
                            </span>
                            <div className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-bold text-slate-500 ">
                              Período Mensal
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 mb-1">
                                Início
                              </label>
                              <input
                                type="date"
                                min={limits.min}
                                max={limits.max}
                                value={
                                  formData.mesesDetalhes?.[m]?.dataInicio || ""
                                }
                                onChange={(e) =>
                                  handleMonthDateChange(
                                    m,
                                    "dataInicio",
                                    e.target.value,
                                  )
                                }
                                className="w-full p-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 mb-1">
                                Fim
                              </label>
                              <input
                                type="date"
                                min={limits.min}
                                max={limits.max}
                                value={
                                  formData.mesesDetalhes?.[m]?.dataFim || ""
                                }
                                onChange={(e) =>
                                  handleMonthDateChange(
                                    m,
                                    "dataFim",
                                    e.target.value,
                                  )
                                }
                                className="w-full p-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* Datas de Início e Fim Gerais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-[10px] font-black text-blue-900 mb-1">
                  Data Início Geral da Atividade
                </label>
                <input
                  type="date"
                  min={
                    formData.frequencia === "Semestral" &&
                    formData.semestre === "1º Semestre"
                      ? `${nextYear}-01-01`
                      : formData.frequencia === "Semestral" &&
                          formData.semestre === "2º Semestre"
                        ? `${nextYear}-07-01`
                        : `${nextYear}-01-01`
                  }
                  max={
                    formData.frequencia === "Semestral" &&
                    formData.semestre === "1º Semestre"
                      ? `${nextYear}-06-30`
                      : formData.frequencia === "Semestral" &&
                          formData.semestre === "2º Semestre"
                        ? `${nextYear}-12-31`
                        : formData.dataFim || `${nextYear}-12-31`
                  }
                  value={formData.dataInicio || ""}
                  readOnly={
                    formData.frequencia === "Mensal" ||
                    formData.frequencia === "Trimestral"
                  }
                  onChange={(e) => {
                    let start = e.target.value;
                    if (start) {
                      const parts = start.split("-");
                      if (parts.length === 3) {
                        start = `${nextYear}-${parts[1]}-${parts[2]}`;
                      }

                      const weekendCheck = isWeekend(start);
                      if (weekendCheck.isWeekend) {
                        const warningMsg = `A data de início geral da atividade (${start.split("-").reverse().join("/")}) calhará no ${weekendCheck.dayName}. Por favor, escolha outra data!`;
                        setWeekendWarning(warningMsg);
                        try {
                          alert(
                            `Esta data calhará no ${weekendCheck.dayName}. Escolha outra data.`,
                          );
                        } catch (e) {
                          console.warn("Iframe blocked standard alert:", e);
                        }
                        start = ""; // Limpar data inválida
                      } else {
                        setWeekendWarning(null);
                      }
                    }
                    const end = formData.dataFim;
                    let days = 0;
                    if (formData.frequencia === "Anual") {
                      days = 12;
                    } else if (start && end) {
                      const d1 = new Date(start);
                      const d2 = new Date(end);
                      if (d1 > d2) {
                        setError(
                          "Data de fim deve ser posterior à data de início",
                        );
                        return;
                      }
                      if (d1 <= d2) {
                        days = Math.max(
                          0,
                          Math.ceil(
                            (d2.getTime() - d1.getTime()) /
                              (1000 * 60 * 60 * 24),
                          ) + 1,
                        );
                      }
                    }
                    setFormData((prev) => ({
                      ...prev,
                      dataInicio: start,
                      totalDias: days,
                    }));
                    setError("");
                  }}
                  className={`w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-mono ${formData.frequencia === "Mensal" || formData.frequencia === "Trimestral" ? "bg-gray-100 text-slate-500 cursor-not-allowed" : "bg-white"}`}
                  title={
                    formData.frequencia === "Mensal" ||
                    formData.frequencia === "Trimestral"
                      ? "Calculado automaticamente das datas precisas do mês de execução"
                      : `O ano está restrito para ${nextYear}`
                  }
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-blue-900 mb-1">
                  Data Fim Geral da Atividade
                </label>
                <input
                  type="date"
                  min={
                    formData.frequencia === "Semestral" &&
                    formData.semestre === "1º Semestre"
                      ? `${nextYear}-01-01`
                      : formData.frequencia === "Semestral" &&
                          formData.semestre === "2º Semestre"
                        ? `${nextYear}-07-01`
                        : formData.dataInicio || `${nextYear}-01-01`
                  }
                  max={
                    formData.frequencia === "Semestral" &&
                    formData.semestre === "1º Semestre"
                      ? `${nextYear}-06-30`
                      : formData.frequencia === "Semestral" &&
                          formData.semestre === "2º Semestre"
                        ? `${nextYear}-12-31`
                        : `${nextYear}-12-31`
                  }
                  value={formData.dataFim || ""}
                  readOnly={
                    formData.frequencia === "Mensal" ||
                    formData.frequencia === "Trimestral"
                  }
                  onChange={(e) => {
                    let end = e.target.value;
                    if (end) {
                      const parts = end.split("-");
                      if (parts.length === 3) {
                        end = `${nextYear}-${parts[1]}-${parts[2]}`;
                      }

                      const weekendCheck = isWeekend(end);
                      if (weekendCheck.isWeekend) {
                        const warningMsg = `A data de fim geral da atividade (${end.split("-").reverse().join("/")}) calhará no ${weekendCheck.dayName}. Por favor, escolha outra data!`;
                        setWeekendWarning(warningMsg);
                        try {
                          alert(
                            `Esta data calhará no ${weekendCheck.dayName}. Escolha outra data.`,
                          );
                        } catch (e) {
                          console.warn("Iframe blocked standard alert:", e);
                        }
                        end = ""; // Limpar data inválida
                      } else {
                        setWeekendWarning(null);
                      }
                    }
                    const start = formData.dataInicio;
                    let days = 0;
                    if (formData.frequencia === "Anual") {
                      days = 12;
                    } else if (start && end) {
                      const d1 = new Date(start);
                      const d2 = new Date(end);
                      if (d1 > d2) {
                        setError(
                          "Data de fim deve ser posterior à data de início",
                        );
                        return;
                      }
                      if (d1 <= d2) {
                        days = Math.max(
                          0,
                          Math.ceil(
                            (d2.getTime() - d1.getTime()) /
                              (1000 * 60 * 60 * 24),
                          ) + 1,
                        );
                      }
                    }
                    setFormData((prev) => ({
                      ...prev,
                      dataFim: end,
                      totalDias: days,
                    }));
                    setError("");
                  }}
                  className={`w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-mono ${formData.frequencia === "Mensal" || formData.frequencia === "Trimestral" ? "bg-gray-100 text-slate-500 cursor-not-allowed" : "bg-white"}`}
                  title={
                    formData.frequencia === "Mensal" ||
                    formData.frequencia === "Trimestral"
                      ? "Calculado automaticamente das datas precisas do mês de execução"
                      : `O ano está restrito para ${nextYear}`
                  }
                />
              </div>
              <div className="md:col-span-2 flex justify-between items-center gap-4 pt-2">
                <span className="text-[10px] font-black text-blue-900  tracking-widest flex items-center gap-2">
                  Total de dias calculados
                  {formData.frequencia === "Anual" && (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-extrabold text-[10px] tracking-normal">
                      12×1 = 12 dias (1 dia por mês)
                    </span>
                  )}
                </span>
                <input
                  type="text"
                  readOnly
                  value={formData.frequencia === "Anual" ? 12 : formData.totalDias}
                  className="w-32 p-2.5 border bg-slate-50 border-slate-200 rounded-xl text-center text-sm font-black text-blue-950 outline-none"
                />
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-6">
            <h4 className="text-lg font-bold text-blue-900 border-b pb-2 tracking-tighter">
              VI. TRANSPORTE
            </h4>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-blue-900 mb-1">
                    Necessidade de Transporte
                  </label>
                  <select
                    value={formData.necessitaTransporte || "Não"}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "Não") {
                        setFormData({
                          ...formData,
                          necessitaTransporte: "Não",
                          litrosGasoleo: 0,
                          valorTotalGasoleo: 0,
                          viatura: "Nenhuma",
                          kmsEstimados: 0,
                          distanciaKm: 0,
                          distanciaDestino: 0,
                        });
                      } else {
                        setFormData({
                          ...formData,
                          necessitaTransporte: val,
                        });
                      }
                    }}
                    className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="Não">Não necessita</option>
                    <option value="Sim">
                      Sim, necessita transporte institucional
                    </option>
                  </select>
                  <p className="text-[9px] text-gray-400 mt-1 italic">
                    * Se não, bloqueia ajudas de custo e combustível
                  </p>
                </div>

                {formData.necessitaTransporte === "Sim" && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4"
                  >
                    <div className="md:col-span-2 bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 text-amber-800 shadow-sm">
                      <Info className="flex-shrink-0 mt-0.5" size={20} />
                      <div className="text-sm">
                        <p className="font-bold">Alocação de Transporte</p>
                        <p>
                          A viatura e o motorista serão validados e alocados
                          pela Secção de Transporte. Pode sugerir uma viatura em
                          baixo.
                        </p>
                      </div>
                    </div>

                    <div className="md:col-span-2 bg-emerald-50 border border-emerald-200 p-5 rounded-xl shadow-sm text-emerald-800">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex gap-3">
                          <DollarSign
                            className="text-emerald-600 flex-shrink-0 mt-0.5 animate-pulse"
                            size={20}
                          />
                          <div className="text-sm">
                            <p className="font-bold text-emerald-900 flex items-center gap-2 text-base">
                              Preçário Oficial ARENE Sincronizado
                              {priceSynced && (
                                <span className="bg-emerald-200 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                                  TARIFAS ATIVAS
                                </span>
                              )}
                            </p>
                            <p className="text-emerald-700 text-xs">
                              Os preços oficiais dos combustíveis e
                              lubrificantes estão regulados de acordo com a
                              Autoridade Reguladora de Energia de Moçambique
                              (ARENE).
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={syncPriceWithARENE}
                          disabled={isSyncingPrice}
                          className="w-full md:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-all shadow-sm flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                        >
                          {isSyncingPrice ? (
                            <>
                              <Clock className="animate-spin" size={14} />A
                              atualizar...
                            </>
                          ) : (
                            "Sincronizar ARENE"
                          )}
                        </button>
                      </div>

                      {/* Tabela do Preçário Oficial */}
                      <div className="mt-4 bg-white/75 border border-emerald-100 rounded-lg p-3 grid grid-cols-3 gap-3 text-center">
                        <div className="p-2 bg-emerald-50/40 rounded-md border border-emerald-100">
                          <p className="text-[10px] font-black  tracking-wider text-emerald-900">
                            Gasóleo
                          </p>
                          <p className="font-mono font-extrabold text-sm text-emerald-700 mt-0.5">
                            125,00 MZN/L
                          </p>
                        </div>
                        <div className="p-2 bg-emerald-50/40 rounded-md border border-emerald-100">
                          <p className="text-[10px] font-black  tracking-wider text-emerald-900">
                            Gasolina
                          </p>
                          <p className="font-mono font-extrabold text-sm text-emerald-700 mt-0.5">
                            100,00 MZN/L
                          </p>
                        </div>
                        <div className="p-2 bg-emerald-50/40 rounded-md border border-emerald-100">
                          <p className="text-[10px] font-black  tracking-wider text-emerald-900">
                            Petróleo
                          </p>
                          <p className="font-mono font-extrabold text-sm text-emerald-700 mt-0.5">
                            95,00 MZN/L
                          </p>
                        </div>
                      </div>

                      {priceSynced && (
                        <p className="text-[10px] text-emerald-600 font-semibold mt-3 flex items-center gap-1 bg-emerald-100/50 p-1.5 rounded">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                          Tarifas oficiais sincronizadas em tempo real com o
                          preçário nacional de Moçambique.
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2 bg-blue-50/30 border border-blue-100 p-4 rounded-xl">
                      <label className="block text-[11px] font-extrabold text-blue-900 mb-2  tracking-wide">
                        Selecionar Combustível / Lubrificante
                      </label>
                      <div className="grid grid-cols-3 gap-2.5">
                        {[
                          {
                            tipo: "Gasóleo",
                            preco: 125,
                            desc: "Diesel 50 ppm",
                          },
                          {
                            tipo: "Gasolina",
                            preco: 100,
                            desc: "Super Sem Chumbo",
                          },
                          {
                            tipo: "Petróleo",
                            preco: 95,
                            desc: "Kerosene/Iluminante",
                          },
                        ].map(({ tipo, preco, desc }) => {
                          const isSelected =
                            (formData.tipoCombustivel || "Gasóleo") === tipo;
                          return (
                            <button
                              key={tipo}
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  tipoCombustivel: tipo,
                                  precoLitro: preco,
                                  valorTotalGasoleo: parseFloat(
                                    (formData.litrosGasoleo * preco).toFixed(2),
                                  ),
                                });
                              }}
                              className={`p-3 border rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center gap-1 ${
                                isSelected
                                  ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20"
                                  : "bg-white border-gray-200 text-blue-950 hover:bg-blue-50/50 hover:border-blue-200"
                              }`}
                            >
                              <span className="text-[13px] font-black">
                                {tipo}
                              </span>
                              <span
                                className={`text-[10px] font-bold ${isSelected ? "text-blue-100" : "text-gray-400"}`}
                              >
                                {desc}
                              </span>
                              <span
                                className={`font-mono font-extrabold text-[11px] mt-0.5 ${isSelected ? "text-white" : "text-emerald-600"}`}
                              >
                                {preco.toFixed(2)} MT
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-blue-900 mb-1">
                        Sugestão de Viatura
                      </label>
                      <select
                        value={formData.viatura}
                        onChange={(e) => {
                          const v = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            viatura: v,
                            necessitaTransporte:
                              v && v.trim() !== "" && v !== "Nenhuma"
                                ? "Sim"
                                : prev.necessitaTransporte,
                          }));
                        }}
                        className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold text-blue-950"
                      >
                        <option value="">
                          Selecione uma viatura (opcional)...
                        </option>
                        {dbVehicles.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-blue-900 mb-1">
                        Distância até ao destino (KM)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.distanciaDestino || ""}
                          onChange={(e) => {
                            const dist = e.target.value === "" ? "" : Number(e.target.value);
                            setFormData({
                              ...formData,
                              distanciaDestino: dist,
                            });
                          }}
                          className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold text-blue-950"
                        />
                        <span className="absolute right-3 top-2.5 text-xs font-bold text-gray-400">
                          KM
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-blue-900 mb-1">
                        Distância em km (
                        {formData.realizacaoDistrito ===
                        "Aeroporto de Chingodzi"
                          ? "2x Ida e Volta"
                          : "Ida e Volta"}
                        )
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.distanciaKm || ""}
                          onChange={(e) => {
                            const val = e.target.value === "" ? "" : Number(e.target.value);
                            setFormData({
                              ...formData,
                              distanciaKm: val,
                            });
                          }}
                          className="w-full p-2.5 border rounded-xl text-sm font-bold text-blue-900 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                        <span className="absolute right-3 top-2.5 text-xs font-bold text-gray-400">
                          KM
                        </span>
                      </div>
                    </div>
                    {formData.realizacaoDistrito ===
                      "Aeroporto de Chingodzi" && (
                      <div className="md:col-span-2 bg-blue-50 border border-blue-200 p-3.5 rounded-xl text-xs text-blue-800 space-y-1">
                        <p className="font-bold flex items-center gap-1 text-blue-900">
                          <Info size={14} /> Rota Especial: Aeroporto de
                          Chingodzi
                        </p>
                        <p>
                          Como o motorista faz duas viagens de ida e volta (uma
                          para levar/deixar o colaborador no aeroporto e outra
                          para trazê-lo de volta/buscar), a distância total é
                          multiplicada por 4 (totalizando 600 KM).
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4 md:col-span-2">
                      <div>
                        <label className="block text-[10px] font-black text-blue-900 mb-1">
                          Litros de {formData.tipoCombustivel || "Combustível"}{" "}
                          (+15% Margem Oscilação/Desgaste)
                        </label>
                        <input
                          type="number"
                          value={formData.litrosGasoleo || ""}
                          onChange={(e) => {
                            const val = e.target.value === "" ? "" : Number(e.target.value);
                            setFormData({
                              ...formData,
                              litrosGasoleo: val,
                              valorTotalGasoleo: val !== "" && formData.precoLitro !== "" ? Number(val) * Number(formData.precoLitro) : formData.valorTotalGasoleo
                            });
                          }}
                          readOnly={true}
                          className="w-full p-2.5 border rounded-xl text-sm font-bold text-blue-900 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-blue-900 mb-1 flex items-center justify-between">
                          <span>Preço/Litro (MZN)</span>
                          {((formData.tipoCombustivel === "Gasóleo" &&
                            formData.precoLitro === 125) ||
                            (formData.tipoCombustivel === "Gasolina" &&
                              formData.precoLitro === 100) ||
                            (formData.tipoCombustivel === "Petróleo" &&
                              formData.precoLitro === 95)) && (
                            <span className="text-emerald-600 font-extrabold text-[9px] tracking-wide animate-pulse ">
                              ● ARENE Oficial
                            </span>
                          )}
                        </label>
                        <input
                          type="number"
                          value={formData.precoLitro || ""}
                          onChange={(e) => {
                            const preco = e.target.value === "" ? "" : Number(e.target.value);
                            setFormData({
                              ...formData,
                              precoLitro: preco,
                              valorTotalGasoleo: preco !== "" && formData.litrosGasoleo !== "" ? Number(formData.litrosGasoleo) * Number(preco) : formData.valorTotalGasoleo
                            });
                          }}
                          readOnly={true}
                          className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold text-blue-950 bg-gray-50"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-black text-blue-900 mb-1">
                          Valor Total de{" "}
                          {formData.tipoCombustivel || "Combustível"} (MZN)
                        </label>
                        <input
                          type="number"
                          value={formData.valorTotalGasoleo || ""}
                          onChange={(e) => {
                            const val = e.target.value === "" ? "" : Number(e.target.value);
                            setFormData({
                              ...formData,
                              valorTotalGasoleo: val,
                            });
                          }}
                          readOnly={true}
                          className="w-full p-2.5 border rounded-xl text-sm font-extrabold text-blue-900 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all bg-gray-50"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-6">
            <h4 className="text-lg font-bold text-blue-900 border-b pb-2 tracking-tighter">
              VII. RUBRICAS E NECESSIDADES
            </h4>

            <div className="space-y-4">
              {formData.rubricas.map((rubrica, index) => {
                const rubStr = (rubrica.rubrica || "").toLowerCase();
                const necStr = (rubrica.necessidade || "").toLowerCase();

                const isAjudaCusto =
                  (rubStr.includes("pessoal") ||
                    (rubrica.rubrica || "").includes("112")) &&
                  necStr.includes("ajuda") &&
                  necStr.includes("custo");
                const isIdaVoltaGeral =
                  necStr.includes("ida e volta") &&
                  !necStr.includes("motorista");
                const isMotoristaIdaVoltaManual =
                  (necStr.includes("motorista") &&
                    necStr.includes("ida e volta")) ||
                  rubrica.necessidade ===
                    "Ajudas de custo para Motorista (ida e volta)";
                const isAjudaCustoMotoristaReal =
                  (rubStr.includes("pessoal") ||
                    (rubrica.rubrica || "").includes("112")) &&
                  necStr.includes("motorista") &&
                  !isMotoristaIdaVoltaManual &&
                  !isIdaVoltaGeral;

                const isRubricaPessoal =
                  (rubrica.rubrica || "").includes("112") ||
                  rubStr.includes("pessoal");
                const isCombustivel =
                  rubrica.necessidade === "Combustíveis e lubrificantes" ||
                  rubrica.necessidade ===
                    "121001 - Combustíveis e lubrificantes" ||
                  (Boolean(rubrica.necessidade) &&
                    necStr.includes("combustív")) ||
                  (Boolean(rubrica.necessidade) &&
                    (rubrica.necessidade || "").includes("121001"));
                const isBolsaEstudos =
                  (rubStr.includes("famílias") ||
                    rubStr.includes("transferências")) &&
                  necStr.includes("bolsa");

                const isBensServicos =
                  ((rubrica.rubrica || "").includes("121") ||
                    (rubrica.rubrica || "").includes("122") ||
                    rubStr.includes("bens") ||
                    rubStr.includes("serviço")) &&
                  !isCombustivel &&
                  !isBolsaEstudos;

                const isDiretor =
                  necStr.includes("diretor") ||
                  necStr.includes("direto ger") ||
                  (rubrica.necessidade || "").includes("(DG)") ||
                  necStr.includes("(dg)");
                const isFora = necStr.includes("fora");
                const valorDiario = isFora ? 0 : isDiretor ? 9000 : 6000;

                const isCombustivelReadOnly = false;

                // If transport is NOT needed, some fields might be blocked
                const isBlocked =
                  formData.necessitaTransporte === "Não" &&
                  (isAjudaCusto ||
                    (isCombustivel && false));

                return (
                  <div
                    key={rubrica.id || `rubrica-${index}`}
                    className={`p-6 border-2 rounded-2xl space-y-6 relative ${isBlocked ? "bg-gray-100 opacity-60 grayscale border-gray-200" : "bg-white shadow-md border-blue-900/10"}`}
                  >
                    {isBlocked && (
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-black tracking-widest border border-red-200 shadow-sm ">
                          Bloqueado (Sem Transporte)
                        </span>
                      </div>
                    )}

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-[12px] font-serif font-black text-blue-900  tracking-wide ml-2">
                            Rúbrica
                          </label>
                          <select
                            value={rubrica.rubrica}
                            disabled={isBlocked || isCombustivelReadOnly}
                            onChange={(e) => {
                              const newRubricas = [...formData.rubricas];
                              const selectedRubrica = e.target.value;
                              newRubricas[index] = {
                                ...rubrica,
                                rubrica: selectedRubrica,
                                necessidade: "",
                                precoUnitario:
                                  selectedRubrica === "Bens"
                                    ? ("" as any)
                                    : rubrica.precoUnitario,
                                valorTotal:
                                  selectedRubrica === "Bens"
                                    ? 0
                                    : rubrica.valorTotal,
                              };
                              setFormData({
                                ...formData,
                                rubricas: newRubricas,
                              });
                            }}
                            className="w-full px-5 py-3 border border-blue-900/40 rounded-2xl text-[14px] font-bold text-gray-800 outline-none focus:border-blue-900 transition-all bg-white h-[52px] shadow-sm appearance-none"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%231e3a8a' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                              backgroundPosition: "right 1.2rem center",
                              backgroundRepeat: "no-repeat",
                              backgroundSize: "1.2em 1.2em",
                            }}
                          >
                            <option value="">Selecione...</option>
                            {RUBRICAS.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[12px] font-serif font-black text-blue-900  tracking-wide ml-2">
                            Necessidade
                          </label>
                          <select
                            value={rubrica.necessidade}
                            disabled={
                              isBlocked ||
                              isCombustivelReadOnly ||
                              !rubrica.rubrica
                            }
                            onChange={(e) => {
                              updateRubricaNecessidade(index, e.target.value);
                            }}
                            className="w-full px-5 py-3 border border-blue-900/40 rounded-2xl text-[14px] font-bold text-gray-800 outline-none focus:border-blue-900 transition-all bg-white h-[52px] shadow-sm appearance-none"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%231e3a8a' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                              backgroundPosition: "right 1.2rem center",
                              backgroundRepeat: "no-repeat",
                              backgroundSize: "1.2em 1.2em",
                            }}
                          >
                            <option value="">Selecione...</option>
                            {rubrica.rubrica &&
                              getNecessidadesOptions(rubrica.rubrica).map(
                                (n) => (
                                  <option key={n} value={n}>
                                    {n}
                                  </option>
                                ),
                              )}
                          </select>
                        </div>
                      </div>

                      {isAjudaCusto ? (
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-blue-800 tracking-tight leading-tight">
                              Total de dias de Trabalho
                            </label>
                            <div className="w-full p-2.5 bg-gray-50 border-2 border-gray-300 rounded-xl text-[14px] font-bold text-blue-900 flex items-center justify-center h-11">
                              {isIdaVoltaGeral
                                ? "1D de ida e volta"
                                : isMotoristaIdaVoltaManual
                                  ? 2
                                  : formData.totalDias || 1}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-blue-800 tracking-tight leading-tight">
                              Total de Pessoas Envolvidas
                            </label>
                            <input
                              type="number"
                              value={
                                isAjudaCustoMotoristaReal ||
                                isMotoristaIdaVoltaManual
                                  ? 1
                                  : rubrica.quantidade || ""
                              }
                              disabled={
                                isBlocked ||
                                isAjudaCustoMotoristaReal ||
                                isMotoristaIdaVoltaManual
                              }
                              onChange={(e) => {
                                const newRubricas = [...formData.rubricas];
                                const qtd = Number(e.target.value);
                                const dias = isIdaVoltaGeral
                                  ? 1
                                  : formData.totalDias || 1;
                                const realValorDiario =
                                  isAjudaCustoMotoristaReal
                                    ? 1800
                                    : isMotoristaIdaVoltaManual
                                      ? rubrica.precoUnitario || 1800
                                      : isFora
                                        ? rubrica.precoUnitario || 0
                                        : isIdaVoltaGeral
                                          ? 1800
                                          : valorDiario;

                                const valorTotal = isIdaVoltaGeral
                                  ? qtd * 1800
                                  : qtd * dias * realValorDiario +
                                    0.3 * realValorDiario * qtd;

                                newRubricas[index] = {
                                  ...rubrica,
                                  quantidade: qtd,
                                  precoUnitario: realValorDiario,
                                  valorTotal: valorTotal,
                                };
                                setFormData({
                                  ...formData,
                                  rubricas: newRubricas,
                                });
                              }}
                              className={`w-full p-2.5 border-2 border-gray-300 rounded-xl text-[14px] font-bold outline-none focus:border-blue-900 transition-all text-center h-11 ${isAjudaCustoMotoristaReal || isMotoristaIdaVoltaManual ? "bg-gray-50 text-gray-400" : ""}`}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-blue-800 tracking-tight leading-tight">
                              Preço diário de ajudas de custos
                            </label>
                            {isFora &&
                            !isMotoristaIdaVoltaManual &&
                            !isIdaVoltaGeral ? (
                              <input
                                type="number"
                                value={rubrica.precoUnitario || ""}
                                onChange={(e) => {
                                  const newRubricas = [...formData.rubricas];
                                  const preco = Number(e.target.value);
                                  const qtd = rubrica.quantidade || 0;
                                  const dias = formData.totalDias || 1;
                                  const valorTotal =
                                    qtd * dias * preco + 0.3 * preco * qtd;
                                  newRubricas[index] = {
                                    ...rubrica,
                                    precoUnitario: preco,
                                    valorTotal: valorTotal,
                                  };
                                  setFormData({
                                    ...formData,
                                    rubricas: newRubricas,
                                  });
                                }}
                                placeholder="Inserir valor..."
                                className="w-full p-2.5 border-2 border-blue-900/30 rounded-xl text-[14px] font-bold text-blue-900 outline-none focus:border-blue-900 h-11 text-center"
                              />
                            ) : (
                              <div className="w-full p-2.5 bg-gray-50 border-2 border-gray-300 rounded-xl text-[14px] font-bold text-blue-900 flex items-center justify-center h-11">
                                {isAjudaCustoMotoristaReal ||
                                isMotoristaIdaVoltaManual ||
                                isIdaVoltaGeral
                                  ? "1.800"
                                  : valorDiario.toLocaleString("pt-MZ")}{" "}
                                MZN
                              </div>
                            )}
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-blue-800 tracking-tight leading-tight">
                              {"30% de Ajudas de Custos"}
                            </label>
                            <div
                              className={`w-full p-2.5 border-2 rounded-xl text-[12px] font-extrabold flex items-center justify-center h-11 select-none ${isMotoristaIdaVoltaManual || isIdaVoltaGeral ? "bg-red-50 text-red-500 border-red-200" : "bg-gray-100 text-gray-400 border-gray-300"}`}
                            >
                              {(() => {
                                if (
                                  isMotoristaIdaVoltaManual ||
                                  isIdaVoltaGeral
                                ) {
                                  return "NAO APLICADO";
                                }
                                const realValorDiario =
                                  isAjudaCustoMotoristaReal
                                    ? 1800
                                    : isFora
                                      ? rubrica.precoUnitario || 0
                                      : valorDiario;
                                return (
                                  (
                                    0.3 *
                                    realValorDiario *
                                    (rubrica.quantidade || 0)
                                  ).toLocaleString("pt-MZ") + " MZN"
                                );
                              })()}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-blue-800 tracking-tight leading-tight">
                              Valor total em MZN
                            </label>
                            <div className="w-full p-2.5 bg-white border-2 border-blue-900/30 rounded-xl text-[14px] font-bold text-blue-900 flex items-center justify-start px-4 h-11">
                              {rubrica.valorTotal?.toLocaleString("pt-MZ", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }) || "0,00"}{" "}
                              MZN
                            </div>
                          </div>
                        </div>
                      ) : isBolsaEstudos ? (
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end bg-blue-50/20 p-4 rounded-2xl border border-blue-900/5">
                          {/* Números de Beneficiario */}
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-blue-800 tracking-tight leading-tight ml-2">
                              Números de Beneficiario
                            </label>
                            <input
                              type="number"
                              value={rubrica.quantidade || ""}
                              disabled={isBlocked}
                              onChange={(e) => {
                                const newRubricas = [...formData.rubricas];
                                const qtd = Number(e.target.value);
                                const valorTotal =
                                  qtd * (rubrica.precoUnitario || 0);
                                newRubricas[index] = {
                                  ...rubrica,
                                  quantidade: qtd,
                                  valorTotal,
                                };
                                setFormData({
                                  ...formData,
                                  rubricas: newRubricas,
                                });
                              }}
                              className="w-full px-4 py-2.5 border border-blue-900/20 rounded-full text-[13px] font-bold text-gray-800 outline-none focus:border-blue-900 transition-all shadow-sm bg-white"
                            />
                          </div>

                          {/* Nome da Instituicao */}
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-blue-800 tracking-tight leading-tight ml-2">
                              Nome da Instituicao
                            </label>
                            <select
                              value={rubrica.nomeInstituicao || ""}
                              disabled={isBlocked}
                              onChange={(e) => {
                                const newRubricas = [...formData.rubricas];
                                newRubricas[index] = {
                                  ...rubrica,
                                  nomeInstituicao: e.target.value,
                                };
                                setFormData({
                                  ...formData,
                                  rubricas: newRubricas,
                                });
                              }}
                              className="w-full px-4 py-2.5 border border-blue-900/20 rounded-full text-[13px] font-bold text-gray-700 outline-none focus:border-blue-900 transition-all shadow-sm bg-white appearance-none"
                              style={{
                                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%231e3a8a' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                backgroundPosition: "right 1rem center",
                                backgroundRepeat: "no-repeat",
                                backgroundSize: "1em 1em",
                              }}
                            >
                              <option value="">Selecione...</option>
                              {[
                                "Universidade Eduardo Mondlane (UEM)",
                                "Universidade Pedagógica (UP)",
                                "Universidade Zambeze (UniZambeze)",
                                "Universidade Lúrio (UniLúrio)",
                                "Universidade Católica de Moçambique (UCM)",
                                "Instituto Superior de Ciências e Tecnologia de Moçambique (ISCTEM)",
                                "Instituto Superior de Transportes e Comunicações (ISUTC)",
                                "A Politécnica",
                                "Instituto Superior de Relações Internacionais (ISRI)",
                                "Instituto Superior de Artes e Cultura (ISArC)",
                                "Outra Instituição",
                              ].map((opcao) => (
                                <option key={opcao} value={opcao}>
                                  {opcao}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Tempo de formação */}
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-blue-800 tracking-tight leading-tight ml-2">
                              Tempo de formação
                            </label>
                            <select
                              value={rubrica.tempoFormacao || ""}
                              disabled={isBlocked}
                              onChange={(e) => {
                                const newRubricas = [...formData.rubricas];
                                newRubricas[index] = {
                                  ...rubrica,
                                  tempoFormacao: e.target.value,
                                };
                                setFormData({
                                  ...formData,
                                  rubricas: newRubricas,
                                });
                              }}
                              className="w-full px-4 py-2.5 border border-blue-900/20 rounded-full text-[13px] font-bold text-gray-700 outline-none focus:border-blue-900 transition-all shadow-sm bg-white appearance-none"
                              style={{
                                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%231e3a8a' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                backgroundPosition: "right 1rem center",
                                backgroundRepeat: "no-repeat",
                                backgroundSize: "1em 1em",
                              }}
                            >
                              <option value="">Selecione...</option>
                              {[
                                "1 Ano",
                                "2 Anos",
                                "3 Anos",
                                "4 Anos",
                                "5 Anos",
                                "6 Meses",
                                "12 Meses",
                                "18 Meses",
                                "24 Meses",
                              ].map((opcao) => (
                                <option key={opcao} value={opcao}>
                                  {opcao}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Preço Unitário */}
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-blue-800 tracking-tight leading-tight ml-2">
                              Preço unitário (MZN)
                            </label>
                            <input
                              type="number"
                              value={rubrica.precoUnitario || ""}
                              disabled={isBlocked}
                              onChange={(e) => {
                                const newRubricas = [...formData.rubricas];
                                const preco = Number(e.target.value);
                                const valorTotal =
                                  (rubrica.quantidade || 0) * preco;
                                newRubricas[index] = {
                                  ...rubrica,
                                  precoUnitario: preco,
                                  valorTotal,
                                };
                                setFormData({
                                  ...formData,
                                  rubricas: newRubricas,
                                });
                              }}
                              className="w-full px-4 py-2.5 border border-blue-900/20 rounded-full text-[13px] font-bold text-gray-800 outline-none focus:border-blue-900 transition-all shadow-sm bg-white"
                            />
                          </div>

                          {/* Total em MZN */}
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-blue-800 tracking-tight leading-tight ml-2">
                              Total em MZN
                            </label>
                            <div className="w-full px-4 py-2.5 bg-[#f4f7fc] border border-blue-900/20 rounded-full text-[13px] font-black text-blue-900 flex items-center justify-center shadow-sm">
                              {(
                                (rubrica.quantidade || 0) *
                                (rubrica.precoUnitario || 0)
                              ).toLocaleString("pt-MZ", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{" "}
                              MZN
                            </div>
                          </div>
                        </div>
                      ) : isBensServicos ? (
                        <div className="space-y-6">
                          {/* BLOCO AZUL DE SELEÇÃO DE PRODUTO - LAYOUT HORIZONTAL DA IMAGEM */}
                          <div className="bg-[#f8fafc]/90 p-6 rounded-[28px] border border-slate-200/60 shadow-sm backdrop-blur-sm">
                            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                              {/* Coluna 1: SELEÇÃO DE PRODUTO (3 colunas) */}
                              <div className="xl:col-span-3 space-y-2.5">
                                <label className="block text-[10px] font-black text-[#1e3a8a]  tracking-widest flex items-center gap-1.5 mb-1.5">
                                  <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                                  $ SELEÇÃO DE PRODUTO/SERVIÇO (GESTÃO DE PREÇOS)
                                </label>
                                <div className="space-y-2.5">
                                  <select
                                    value={
                                      products.some(p => p.nome === rubrica.nomeProduto)
                                        ? rubrica.nomeProduto
                                        : (rubrica.nomeProduto ? "__custom__" : "")
                                    }
                                    disabled={isBlocked}
                                    onChange={(e) => {
                                      const selectedProdName = e.target.value;
                                      if (selectedProdName === "__custom__") return;
                                      
                                      const found = products.find((p: any) => p.nome === selectedProdName);
                                      
                                      const newRubricas = [...formData.rubricas];
                                      if (found) {
                                        const prc = Number(found.preco) || 0;
                                        const qtd = rubrica.quantidade || 1;
                                        const valorTotal = qtd * prc;
                                        
                                        newRubricas[index] = {
                                          ...rubrica,
                                          nomeProduto: found.nome,
                                          precoUnitario: prc,
                                          detalhes: found.unidade || rubrica.detalhes || "Unidade",
                                          especificacao: found.especificacao || rubrica.especificacao || "",
                                          quantidade: qtd,
                                          valorTotal,
                                        };
                                      } else {
                                        newRubricas[index] = { ...rubrica, nomeProduto: "" };
                                      }
                                      setFormData({ ...formData, rubricas: newRubricas });
                                    }}
                                    className="w-full px-4 py-3 bg-white border border-blue-900/15 rounded-2xl text-[13px] font-bold text-slate-800 outline-none focus:border-blue-900 transition-all shadow-sm appearance-none"
                                    style={{
                                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%231e3a8a' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                      backgroundPosition: "right 1rem center",
                                      backgroundRepeat: "no-repeat",
                                      backgroundSize: "1em 1em",
                                    }}
                                  >
                                    <option value="">Selecione o produto...</option>
                                    {getFilteredProductsForRubrica(products, rubrica.rubrica, rubrica.necessidade).map((prod: any) => (
                                      <option key={prod.nome} value={prod.nome}>{prod.nome}</option>
                                    ))}
                                    <option value="__custom__">Outro produto personalizado (Digitar abaixo)</option>
                                  </select>
                                  <input
                                    type="text"
                                    value={rubrica.nomeProduto || ""}
                                    disabled={isBlocked}
                                    placeholder="Ou digite o nome do produto..."
                                    onChange={(e) => {
                                      const newRubricas = [...formData.rubricas];
                                      newRubricas[index] = { ...rubrica, nomeProduto: e.target.value };
                                      setFormData({ ...formData, rubricas: newRubricas });
                                    }}
                                    className="w-full px-4 py-3 bg-white border border-blue-900/15 rounded-2xl text-[13px] font-bold text-slate-800 outline-none focus:border-blue-900 transition-all shadow-sm"
                                  />
                                </div>
                                <p className="text-[9px] text-blue-800/60 italic leading-tight mt-1.5 flex items-center gap-1">
                                  💡 Apenas produtos registados na Gestão de Produtos são listados aqui.
                                </p>
                              </div>

                              {/* Coluna 2: UNIDADE (1 coluna) */}
                              <div className="xl:col-span-1 space-y-2.5">
                                <label className="block text-[10px] font-black text-[#1e3a8a]  tracking-widest mb-1.5">
                                  DETALHES / UNIDADE
                                </label>
                                <select
                                  value={rubrica.detalhes || "Unidade"}
                                  disabled={isBlocked}
                                  onChange={(e) => {
                                    const newRubricas = [...formData.rubricas];
                                    newRubricas[index] = { ...rubrica, detalhes: e.target.value };
                                    setFormData({ ...formData, rubricas: newRubricas });
                                  }}
                                  className="w-full px-3 py-3 bg-white border border-blue-900/15 rounded-2xl text-[13px] font-bold text-slate-700 outline-none focus:border-blue-900 transition-all shadow-sm appearance-none"
                                  style={{
                                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%231e3a8a' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                    backgroundPosition: "right 0.8rem center",
                                    backgroundRepeat: "no-repeat",
                                    backgroundSize: "0.9em 0.9em",
                                  }}
                                >
                                  {["Unidade", "Lote", "Global", "Kit", "Mês", "Trimestre", "Ano", "Kg", "Litro", "Metro", "Resma", "Caixa", "Pacote"].map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Coluna 3: DESCRIÇÃO / ESPECIFICAÇÃO (4 colunas) */}
                              <div className="xl:col-span-4 space-y-2.5">
                                <label className="block text-[10px] font-black text-[#1e3a8a]  tracking-widest mb-1.5">
                                  DESCRIÇÃO / ESPECIFICAÇÃO
                                </label>
                                <textarea
                                  value={rubrica.especificacao || ""}
                                  disabled={isBlocked}
                                  placeholder="Descrição detalhada..."
                                  onChange={(e) => {
                                    const newRubricas = [...formData.rubricas];
                                    newRubricas[index] = { ...rubrica, especificacao: e.target.value };
                                    setFormData({ ...formData, rubricas: newRubricas });
                                  }}
                                  className="w-full p-4 bg-white border border-blue-900/10 rounded-2xl min-h-[110px] text-[12px] font-bold text-slate-700 leading-relaxed shadow-sm outline-none focus:border-blue-900 transition-all"
                                />
                              </div>

                              {/* Coluna 4: NOME E QUANTIDADE (2 colunas) */}
                              <div className="xl:col-span-2 space-y-4">
                                <div className="space-y-1.5">
                                  <label className="block text-[10px] font-black text-[#1e3a8a]  tracking-widest mb-1">
                                    NOME DO PRODUTO
                                  </label>
                                  <input
                                    type="text"
                                    value={rubrica.nomeProduto || ""}
                                    disabled={isBlocked}
                                    onChange={(e) => {
                                      const newRubricas = [...formData.rubricas];
                                      newRubricas[index] = { ...rubrica, nomeProduto: e.target.value };
                                      setFormData({ ...formData, rubricas: newRubricas });
                                    }}
                                    className="w-full px-4 py-3 bg-white border border-blue-900/15 rounded-2xl text-[13px] font-bold text-slate-800 outline-none focus:border-blue-900 shadow-sm"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="block text-[10px] font-black text-[#1e3a8a]  tracking-widest mb-1">
                                    QUANTIDADE
                                  </label>
                                  <input
                                    type="number"
                                    value={rubrica.quantidade || ""}
                                    disabled={isBlocked}
                                    onChange={(e) => {
                                      const newRubricas = [...formData.rubricas];
                                      const qtd = Number(e.target.value);
                                      newRubricas[index] = {
                                        ...rubrica,
                                        quantidade: qtd,
                                        valorTotal: qtd * (rubrica.precoUnitario || 0)
                                      };
                                      setFormData({ ...formData, rubricas: newRubricas });
                                    }}
                                    className="w-full px-4 py-3 bg-white border border-blue-900/15 rounded-2xl text-[13px] font-bold text-slate-800 outline-none focus:border-blue-900 shadow-sm"
                                  />
                                </div>
                              </div>

                              {/* Coluna 5: PREÇO E TOTAL (2 colunas) */}
                              <div className="xl:col-span-2 grid grid-cols-1 gap-4 bg-white/60 p-5 rounded-[24px] border border-blue-900/10 items-end shadow-sm">
                                <div className="space-y-1.5">
                                  <label className="block text-[10px] font-black text-[#1e3a8a]  tracking-widest mb-1">
                                    PREÇO UNITARIO (MZN)
                                  </label>
                                  <input
                                    type="number"
                                    value={rubrica.precoUnitario || ""}
                                    disabled={isBlocked}
                                    onChange={(e) => {
                                      const newRubricas = [...formData.rubricas];
                                      const prc = Number(e.target.value);
                                      newRubricas[index] = {
                                        ...rubrica,
                                        precoUnitario: prc,
                                        valorTotal: (rubrica.quantidade || 0) * prc
                                      };
                                      setFormData({ ...formData, rubricas: newRubricas });
                                    }}
                                    className="w-full px-4 py-3 bg-white border border-blue-900/15 rounded-2xl text-[13px] font-bold text-slate-800 outline-none focus:border-blue-900 shadow-sm"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="block text-[10px] font-black text-[#1e3a8a]  tracking-widest mb-1 text-center">
                                    TOTAL EM MZN
                                  </label>
                                  <div className="w-full py-4 px-4 bg-[#eff6ff] border-2 border-blue-200/50 rounded-[20px] text-[15px] font-black text-blue-900 flex items-center justify-center shadow-inner">
                                    {((rubrica.quantidade || 0) * (rubrica.precoUnitario || 0)).toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-6 flex justify-start">
                            <button
                              type="button"
                              disabled={isBlocked}
                              onClick={() => {
                                const newRubricas = [...formData.rubricas];
                                newRubricas.splice(index + 1, 0, {
                                  id: Date.now() + Math.random(),
                                  rubrica: rubrica.rubrica,
                                  necessidade: rubrica.necessidade,
                                  quantidade: 1,
                                  precoUnitario: 0,
                                  valorTotal: 0
                                });
                                setFormData({ ...formData, rubricas: newRubricas });
                              }}
                              className="px-8 py-3.5 bg-[#1e3a8a] text-white rounded-2xl text-[13px] font-black hover:bg-blue-900 transition-all shadow-xl hover:shadow-blue-900/20 flex items-center gap-2.5 active:scale-[0.98]"
                            >
                              <Plus className="w-4.5 h-4.5" />
                              {rubrica.rubrica === "Serviços" ? "Adicionar serviço" : "Adicionar produto"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-blue-800 tracking-tight leading-tight ml-1">
                              {isCombustivel
                                ? "Total em Litros"
                                : "Quantidade de Produtos"}
                            </label>
                            <input
                              type="number"
                              value={rubrica.quantidade || ""}
                              disabled={isBlocked}
                              readOnly={isCombustivelReadOnly}
                              onChange={(e) => {
                                if (isCombustivelReadOnly) return;
                                const newRubricas = [...formData.rubricas];
                                const qtd = Number(e.target.value);
                                const valorTotal =
                                  qtd * (rubrica.precoUnitario || 0);

                                // Generate manual specification for custom fuel amount
                                let spec = rubrica.especificacao;
                                if (isCombustivel) {
                                  spec = `Combustível do tipo Gasóleo (${qtd} Litros x ${rubrica.precoUnitario || 125} MT) + 15% Margem (Oscilação/Desgaste)`;
                                }

                                newRubricas[index] = {
                                  ...rubrica,
                                  quantidade: qtd,
                                  valorTotal: valorTotal,
                                  especificacao: spec,
                                };
                                setFormData({
                                  ...formData,
                                  rubricas: newRubricas,
                                });
                              }}
                              className={`w-full p-2.5 border-2 border-gray-300 rounded-xl text-[14px] font-bold outline-none focus:border-blue-900 transition-all h-11 ${isCombustivelReadOnly ? "bg-gray-50 text-blue-900" : "bg-white"}`}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-blue-800 tracking-tight leading-tight ml-1">
                              {isCombustivel
                                ? "Preço/Litro (MZN)"
                                : "Preço unitário (MZN)"}
                            </label>
                            <input
                              type="number"
                              value={rubrica.precoUnitario || ""}
                              readOnly={isCombustivelReadOnly}
                              disabled={isBlocked}
                              onChange={(e) => {
                                if (isCombustivelReadOnly) return;
                                const newRubricas = [...formData.rubricas];
                                const preco = Number(e.target.value);
                                const valorTotal =
                                  (rubrica.quantidade || 0) * preco;

                                // Generate manual specification for custom fuel price
                                let spec = rubrica.especificacao;
                                if (isCombustivel) {
                                  spec = `Combustível do tipo Gasóleo (${rubrica.quantidade || 0} Litros x ${preco} MT) + 15% Margem (Oscilação/Desgaste)`;
                                }

                                newRubricas[index] = {
                                  ...rubrica,
                                  precoUnitario: preco,
                                  valorTotal: valorTotal,
                                  especificacao: spec,
                                };
                                setFormData({
                                  ...formData,
                                  rubricas: newRubricas,
                                });
                              }}
                              className={`w-full p-2.5 border-2 border-gray-300 rounded-xl text-[14px] font-bold outline-none focus:border-blue-900 transition-all h-11 ${isCombustivelReadOnly ? "bg-gray-50 text-blue-900" : "bg-white"}`}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-blue-800 tracking-tight leading-tight ml-1">
                              {isCombustivel ? "Total (MZN)" : "Total em MZN"}
                            </label>
                            <div className="w-full p-2.5 bg-white border-2 border-blue-900/30 rounded-xl text-[14px] font-bold text-blue-900 flex items-center justify-start px-4 h-11">
                              {rubrica.valorTotal?.toLocaleString("pt-MZ", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }) || "0,00"}{" "}
                              MZN
                            </div>
                          </div>
                        </div>
                      )}

                      {isAjudaCusto && (
                        <div className="flex justify-center">
                          <div className="px-4 py-1.5 bg-[#e0f2fe] text-blue-900 rounded-full text-[10px] font-extrabold  tracking-wider border border-blue-200 flex items-center justify-center">
                            {isMotoristaIdaVoltaManual
                              ? `FÓRMULA: (1P × 2D × 1.800 MT)`
                              : isAjudaCustoMotoristaReal
                                ? `FÓRMULA: (${rubrica.quantidade || 1}P × ${formData.totalDias || 1}D × 1.800 MT) + (30% DE 1.800 MT × ${rubrica.quantidade || 1}P)`
                                : `FÓRMULA: (${rubrica.quantidade || 1}P × ${formData.totalDias || 1}D × ${(isFora ? rubrica.precoUnitario || 0 : valorDiario).toLocaleString("pt-MZ")}MT) + (30% DE ${(isFora ? rubrica.precoUnitario || 0 : valorDiario).toLocaleString("pt-MZ")}MT × ${rubrica.quantidade || 1}P)`}
                          </div>
                        </div>
                      )}

                      {isCombustivel && (
                        <div className="flex justify-center">
                          <div className="px-4 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-[9.5px] font-extrabold  tracking-widest border border-emerald-200 flex items-center gap-1.5 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Aplicado Automaticamente:{" "}
                            {formData.tipoCombustivel || "Combustível"} (
                            {formData.litrosGasoleo || 0} Litros ×{" "}
                            {formData.precoLitro || 0} MT/Litro) ={" "}
                            {formData.valorTotalGasoleo?.toLocaleString(
                              "pt-MZ",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )}{" "}
                            MT
                          </div>
                        </div>
                      )}
                      
                      {/* Removido campos redundantes conforme solicitado pelo usuário */}
                    </div>
                    {formData.rubricas.length > 1 && !isCombustivel && (
                      <button
                        onClick={() => handleRemoveRubrica(rubrica.id)}
                        className="absolute -top-3 -right-3 bg-red-100 text-red-600 p-2 rounded-full hover:bg-red-200 transition-all shadow-sm"
                      >
                        <Plus size={14} className="rotate-45" />
                      </button>
                    )}
                  </div>
                );
              })}
              <button
                onClick={handleAddRubrica}
                className="flex items-center gap-2 bg-blue-900 text-white px-6 py-3 rounded-2xl text-xs font-black hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20"
              >
                <Plus size={18} /> Adicionar Nova Rúbrica
              </button>

              <div className="mt-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 text-blue-900">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <DollarSign size={24} className="text-blue-900" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black  tracking-widest text-blue-800/60">
                      Custo Total Previsto
                    </h5>
                    <p className="text-xs text-blue-700 font-medium">
                      Soma de todas as rúbricas e necessidades
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-blue-900 tracking-tighter">
                    {formData.rubricas
                      .reduce((sum, r) => sum + (r.valorTotal || 0), 0)
                      .toLocaleString("pt-MZ", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                    MZN
                  </div>
                  <div className="text-[10px] font-bold text-blue-800/40  tracking-widest mt-1">
                    Total da Atividade
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 8:
        return (
          <div className="space-y-6">
            <h4 className="text-lg font-bold text-blue-900 border-b pb-2 tracking-tighter">
              VIII. PLANO DE AQUISIÇÃO E CONTRATAÇÃO
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div>
                <label className="block text-[10px] font-black text-blue-900 mb-1">
                  Plano de Aquisição de Bens
                </label>
                <select
                  value={formData.necessitaAquisicao}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      necessitaAquisicao: e.target.value,
                    })
                  }
                  className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  <option value="Não">Não necessita</option>
                  <option value="Sim">Necessita bens/materiais</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-blue-900 mb-1">
                  Plano de Contratação de Serviços
                </label>
                <select
                  value={formData.necessitaContratacao}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      necessitaContratacao: e.target.value,
                    })
                  }
                  className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  <option value="Não">Não necessita</option>
                  <option value="Sim">Necessita contratação de serviço</option>
                </select>
              </div>
              <div className="col-span-full">
                <p className="text-[10px] text-gray-500 italic">
                  * Se selecionar 'Sim', a atividade constará no respetivo plano
                  da UGEA.
                </p>
              </div>

              <div className="col-span-full border-t border-gray-200/60 pt-4 mt-2">
                <label className="block text-[11px] font-black text-blue-900 mb-1  tracking-wider">
                  VIII. TIPO DE PLANO
                </label>
                <select
                  value={formData.tipoPlano || "Setorial"}
                  onChange={(e) =>
                    setFormData({ ...formData, tipoPlano: e.target.value })
                  }
                  className="w-full p-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-semibold text-blue-900 bg-white"
                >
                  <option value="Setorial">Setorial</option>
                  <option value="plano de aquisição">plano de aquisição</option>
                  <option value="plano de contratação">
                    plano de contratação
                  </option>
                </select>
                <p className="text-[10px] text-gray-400 mt-1 italic">
                  * Preenchido automaticamente de acordo com as necessidades ou
                  título da atividade.
                </p>
              </div>
            </div>
          </div>
        );
      case 9:
        const totalGeral =
          formData.rubricas.reduce((sum, r) => sum + (r.valorTotal || 0), 0) +
          (formData.valorTotalGasoleo || 0);
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <h4 className="text-xl font-black text-blue-900 tracking-tighter ">
                IX. RESUMO E REVISÃO FINAL
              </h4>
              <div className="px-4 py-2 bg-blue-900 text-white rounded-xl text-lg font-black tracking-tighter">
                TOTAL:{" "}
                {totalGeral.toLocaleString("pt-MZ", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} MZN
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Detalhes da Atividade */}
              <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h5 className="text-[10px] font-black text-slate-400  tracking-widest">
                  Informação Geral
                </h5>
                <div className="space-y-3">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 ">
                      Título da Atividade
                    </span>
                    <p className="text-sm font-bold text-slate-900 ">
                      {formData.nomeAtividade || "NÃO DEFINIDO"}
                    </p>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 ">
                      Localização
                    </span>
                    <p className="text-sm font-bold text-slate-900">
                      {formData.realizacaoProvincia ||
                        formData.trabalhoProvincia ||
                        "NÃO DEFINIDO"}
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 ">
                        Duração
                      </span>
                      <p className="text-sm font-bold text-slate-900">
                        {formData.totalDias || 0} Dias
                      </p>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 ">
                        Início
                      </span>
                      <p className="text-sm font-bold text-slate-900">
                        {formData.dataInicio || "---"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumo Financeiro */}
              <div className="space-y-4 bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                <h5 className="text-[10px] font-black text-blue-400  tracking-widest">
                  Detalhamento de Custos
                </h5>
                <div className="space-y-2">
                  {formData.rubricas.map((r, i) => {
                    const isDGAllowance =
                      r.necessidade?.includes("Diretor-Geral") &&
                      r.rubrica?.includes("112");
                    const isFuel = r.necessidade?.includes("Combustível");

                    return (
                      <div
                        key={i}
                        className="flex flex-col py-2 border-b border-blue-900/5 last:border-0"
                      >
                        <div className="flex justify-between items-center">
                          <div className="max-w-[70%]">
                            <p className="text-[11px] font-bold text-blue-900 leading-tight  line-clamp-1">
                              {r.necessidade || r.rubrica || "Sem Descrição"}
                            </p>
                            <p className="text-[9px] text-blue-600 font-medium  tracking-tighter">
                              {r.quantidade || 0}{" "}
                              {isFuel ? "Litros" : "Unid/Pess"}
                            </p>
                          </div>
                          <span className="text-sm font-black text-blue-900">
                            {r.valorTotal?.toLocaleString("pt-MZ", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            MZN
                          </span>
                        </div>

                        {(isDGAllowance || isFuel) && (
                          <div className="mt-1 bg-white/50 p-2 rounded-lg border border-blue-100/50">
                            <p className="text-[8px] font-bold text-blue-500  tracking-widest">
                              {isDGAllowance
                                ? `Cálculo DG: (Qty × Dias × 9.000) + 30% Diária`
                                : `Cálculo Combustível: ${formData.litrosGasoleo}L × ${formData.precoLitro}MT`}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <label className="block text-[10px] font-black text-blue-900 mb-1  tracking-widest">
                Observações Adicionais
              </label>
              <textarea
                rows={4}
                value={formData.observacoes}
                onChange={(e) =>
                  setFormData({ ...formData, observacoes: e.target.value })
                }
                placeholder="Caso necessário, adicione observações finais aqui..."
                className="w-full p-4 border-2 border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-900 transition-all resize-none bg-white"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const handlePrintActivitySheet = () => {
    const totalCalculadoFinal =
      (formData.rubricas || []).reduce(
        (sum: number, r: any) => sum + (r.valorTotal || 0),
        0,
      ) + (formData.valorTotalGasoleo || 0) ||
      formData.orcamentoTotal ||
      0;
    const totalGeral = Number(totalCalculadoFinal || 0);
    const code = formData.codigoAtividade || `ACT-${formData.numeroAtividade}`;
    const name = formData.nomeAtividade || "Atividade Sem Nome";
    const sector =
      formData.setor ||
      formData.reparticao ||
      formData.departamento ||
      formData.unidadeSelecionada ||
      "Songo";

    const monthList = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];
    const activeMonths =
      formData.mesesRealizacao ||
      (formData.mesRealizacao ? [formData.mesRealizacao] : []);

    const monthHeaders = monthList
      .map((m) => {
        const isSelected = activeMonths.some(
          (am: string) => am && am.toLowerCase().includes(m.toLowerCase()),
        );
        return `<th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; background-color: ${isSelected ? "#1e3a8a" : "#f8fafc"}; color: ${isSelected ? "#ffffff" : "#64748b"}; font-weight: bold;">${m}</th>`;
      })
      .join("");

    const contentHtml = `
      <div style="font-family: serif; color: #0f172a; line-height: 1.5;">
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-size: 11px; font-weight: bold; text-transform: ; color: #64748b;">Código da Atividade:</span>
            <span style="font-size: 14px; font-weight: bold; color: #1e3a8a; margin-left: 6px; font-family: monospace;">${code}</span>
          </div>
          <div>
            <span style="font-size: 11px; font-weight: bold; text-transform: ; color: #64748b;">Unidade / Sector:</span>
            <span style="font-size: 12px; font-weight: bold; color: #0f172a; margin-left: 6px;">${sector}</span>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
          <tbody>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; width: 25%; background-color: #f1f5f9;">Nome da Atividade</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; color: #121c60; font-size: 13px;">${name}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; background-color: #f1f5f9;">Objetivo / Descrição</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px;">${formData.objetivoAtividade || "Não especificado."}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; background-color: #f1f5f9;">Responsável</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px;">${formData.responsavel || "Não definido"} ${formData.responsavelEmail ? `(${formData.responsavelEmail})` : ""}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; background-color: #f1f5f9;">Outros Colaboradores</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px;">${formData.outrosColaboradores || "Nenhum"}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; background-color: #f1f5f9;">Local de Realização</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px;">${formData.realizacaoProvincia || "Songo"}, ${formData.realizacaoDistrito || "Cahora Bassa"}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; background-color: #f1f5f9;">Período / Datas</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px;">${formData.dataInicio ? `${formData.dataInicio} até ${formData.dataFim || formData.dataInicio}` : "Não especificado"}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; background-color: #f1f5f9;">Fonte de Financiamento</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; color: #1e3a8a;">${formData.fonteReceita || "Receitas Próprias"}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; background-color: #f1f5f9;">Valor Orçaminhado</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; color: #047857; font-size: 14px; font-family: monospace;">${totalGeral.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MT</td>
            </tr>
          </tbody>
        </table>

        <h3 style="font-size: 12px; font-weight: bold; text-transform: ; color: #0f172a; margin-bottom: 8px;">Calendário Mensal de Execução</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 11px;">
          <thead>
            <tr>${monthHeaders}</tr>
          </thead>
        </table>

        <div style="margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; font-size: 11px;">
          <div>
            <div style="border-bottom: 1px solid #000; margin-bottom: 8px; padding-bottom: 40px;"></div>
            <p style="font-weight: bold;">O Proponente / Responsável</p>
            <p style="color: #64748b; font-size: 10px;">${formData.responsavel || "Assinatura"}</p>
          </div>
          <div>
            <div style="border-bottom: 1px solid #000; margin-bottom: 8px; padding-bottom: 40px;"></div>
            <p style="font-weight: bold;">Aprovação da Chefia / Direção</p>
            <p style="color: #64748b; font-size: 10px;">Visto & Carimbo</p>
          </div>
        </div>
      </div>
    `;

    const allocated = getUserAllocatedDetails();
    const activeOrgao = formData.unidadeOrganica || allocated?.cat || activeUser?.unidadeOrganica || activeUser?.unidade || "UNIDADE ORGÂNICA";
    const activeDirecao = formData.unidadeSelecionada || allocated?.dir || activeUser?.direcao || "DICOSAFA";
    const activeDepartamento = formData.departamento || allocated?.dep || activeUser?.departamento || "";
    const activeReparticao = formData.reparticao || allocated?.rep || activeUser?.reparticao || "";
    const activeSetor = formData.setor || allocated?.setor || activeUser?.setor || activeUser?.sector || "";

    openPrintDocumentWindow({
      title: `FICHA DA ATIVIDADE - ${code}`,
      subtitle: `${name} - ${sector}`,
      orgao: activeOrgao,
      direcao: activeDirecao,
      departamento: activeDepartamento,
      reparticao: activeReparticao,
      setor: activeSetor,
      contentHtml,
      orientation: "portrait",
    });
  };

  return (
    <div className="w-full h-full bg-white flex flex-col overflow-hidden relative">
      <DraftModal
        show={showDraftModal}
        onRecover={recoverDraft}
        onDiscard={discardDraft}
        title="Recuperar Plano?"
        message="Encontramos um rascunho salvo do seu último acesso. Deseja continuar de onde parou ou prefere começar um novo plano?"
      />

      <AnimatePresence></AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full h-full flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-blue-900 px-8 py-4 flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Plus className="text-white" size={20} />
            </div>
            <h3 className="text-white font-bold tracking-tight text-sm">
              {title || `NOVA ATIVIDADE - ${nextYear}`}
              {initialData?.submetido && (
                <span className="ml-3 px-2 py-0.5 bg-white/20 rounded text-[9px]  font-black tracking-widest">
                  Apenas Consulta
                </span>
              )}
            </h3>
          </div>
          {initialData?.requiresUpdate && (
            <div className="bg-amber-400 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-inner border border-amber-500/20">
              <AlertTriangle size={14} className="text-amber-900" />
              <span className="text-[10px] font-black text-amber-900 ">
                Atualização Obrigatória
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintActivitySheet}
              type="button"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow transition-all hover:scale-105"
              title="Imprimir Ficha da Atividade"
            >
              <Printer size={15} />
              <span className="hidden sm:inline">Imprimir Ficha</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-8 pt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-blue-900">
              Passo {step} de {totalSteps}
            </span>
          </div>
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-600 via-green-500 via-red-500 to-yellow-400"
              initial={{ width: 0 }}
              animate={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-8 mt-4 p-4 border rounded-2xl flex items-start gap-3 text-xs font-bold shadow-sm bg-red-50 border-red-200 text-red-600"
            >
              <AlertTriangle size={18} className="shrink-0" />
              <div className="flex-1">{error}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="flex-grow overflow-auto p-4 sm:p-8">
          {submissionError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 animate-shake">
              <div className="p-2 bg-red-100 rounded-xl text-red-600">
                <AlertTriangle size={20} />
              </div>
              <div className="flex-grow">
                <h4 className="text-red-900 font-black text-sm  tracking-tight">
                  Erro na Submissão
                </h4>
                <p className="text-red-700 text-xs font-medium mt-1">
                  {submissionError}
                </p>
              </div>
              <button
                onClick={() => setSubmissionError(null)}
                className="p-1 hover:bg-red-100 rounded-lg text-red-400 transition-all"
              >
                <X size={16} />
              </button>
            </div>
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 bg-gray-50 border-t flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
          <button
            onClick={prevStep}
            disabled={step === 1}
            className={`w-full sm:w-auto px-6 py-2 rounded-lg font-bold text-sm transition-all ${step === 1 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
          >
            Anterior
          </button>

          {step < totalSteps ? (
            <button
              onClick={nextStep}
              className="w-full sm:w-auto justify-center bg-[#1a5f7a] text-white px-8 py-2 rounded-lg font-bold text-sm hover:bg-[#154d63] transition-all flex items-center gap-2"
            >
              Seguinte <ChevronRight size={18} />
            </button>
          ) : !initialData?.submetido && !readOnly ? (
            <button
              onClick={async () => {
                try {
                  // Check permissions before submitting
                  const userWorkspace = user ? getUserWorkspace(user) : "";
                  const { mapUserToRole } = await import("../../lib/permissions");
                  const { getPermissions } = await import("../../lib/permissions");
                  const role = mapUserToRole(userWorkspace);
                  const permissions = getPermissions(role);
                  
                  // Se o utilizador tiver perfil de consulta estrito e não for admin/proprietário
                  const isUserAdmin =
                    user &&
                    (user.role === "Admin" ||
                      user.role === "Administrador" ||
                      user.isOwner === true ||
                      user.categoria?.toLowerCase()?.includes("proprietário") ||
                      (user.name || "").toLowerCase().includes("administrador") ||
                      user.email === "admin@songo.ac.mz" ||
                      user.email === "slaitertripas@gmail.com" ||
                      user.email === "fttripas@gmail.com");

                  if (!permissions.canEdit && !isUserAdmin && user?.role === "Consulta") {
                    setSubmissionError("Você não tem permissão para submeter atividades.");
                    return;
                  }

                  const statusPeriodo = isPlanificacaoAberta(periodoPlanificacao);
                  if (!statusPeriodo.aberta) {
                    setSubmissionError(
                      statusPeriodo.motivo ||
                        "O perido de planificacao enxerado, agurde a a atualizacao do calendario, assim como o relatorio semestral."
                    );
                    return;
                  }
                  
                  const isValid = validateStep(step);
                  if (!isValid) {
                    setSubmissionError(error || "Por favor, verifique todos os campos obrigatórios da atividade antes de submeter.");
                    return;
                  }

                  // Verificar duplicidade antes de abrir o modal de expedição
                  const months = formData.mesesRealizacao && formData.mesesRealizacao.length > 0
                    ? formData.mesesRealizacao
                    : [formData.mesRealizacao || formData.mes || ""].filter(Boolean);

                  const previewSubData: any = {
                    ...formData,
                    title: formData.nomeAtividade,
                    nAtividade: formData.numeroAtividade,
                    selectedCategory,
                    ano: nextYear,
                    mesesRealizacao: months,
                  };

                  const dupCheck = { isDuplicate: false };

                  // Guardar a atividade no plano setorial para submissão posterior (não enviar agora)
                  setSubmissionError(null);
                  setIsSubmitting(true);

                  // Limpar rascunho em background
                  if (user?.id) {
                    firestoreService.drafts
                      .deleteByUserAndForm(user.id, FORM_ID)
                      .catch(console.warn);
                  }
                  localStorage.removeItem(DRAFT_KEY);

                  const calculateTotalActivityData = (monthsArr: string[], originalFormData: any) => {
                    let totalDays = 0;
                    if (monthsArr.length === 0) {
                      totalDays = originalFormData.totalDias || 1;
                    } else {
                      monthsArr.forEach((m: string) => {
                        const mDet = originalFormData.mesesDetalhes?.[m] || {};
                        let mDays = 0;
                        const dIni = mDet.dataInicio || "";
                        const dFim = mDet.dataFim || "";
                        if (dIni && dFim) {
                          const d1 = new Date(dIni);
                          const d2 = new Date(dFim);
                          if (!isNaN(d1.getTime()) && !isNaN(d2.getTime()) && d1 <= d2) {
                            mDays = Math.ceil(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                          }
                        }
                        if (originalFormData.frequencia === "Anual") {
                          mDays = 1;
                        }
                        totalDays += mDays;
                      });
                    }
                    if (totalDays === 0) {
                      totalDays = originalFormData.totalDias || 1;
                    }

                    const totalRubricas = (originalFormData.rubricas || []).map((rubrica: any) => {
                      const rubStr = (rubrica.rubrica || "").toLowerCase();
                      const necStr = (rubrica.necessidade || "").toLowerCase();

                      const isRubricaPessoal =
                        rubrica.rubrica === "Ajudas de Custo" ||
                        rubrica.rubrica === "Despesas de Deslocação" ||
                        rubrica.rubrica === "Ajudas de Custo por Transferência" ||
                        rubStr.includes("pessoal") ||
                        rubStr.includes("112");

                      const isAjudaCustoDiretorDentro =
                        isRubricaPessoal &&
                        (necStr.includes("diretor") ||
                          necStr.includes("coordenador")) &&
                        necStr.includes("dentro");
                      const isAjudaCustoDiretorFora =
                        isRubricaPessoal &&
                        (necStr.includes("diretor") ||
                          necStr.includes("coordenador")) &&
                        necStr.includes("fora");
                      const isAjudaCustoCivilDentro =
                        isRubricaPessoal &&
                        necStr.includes("civil") &&
                        necStr.includes("dentro");
                      const isAjudaCustoCivilFora =
                        isRubricaPessoal &&
                        necStr.includes("civil") &&
                        necStr.includes("fora");
                      const isIdaVoltaGeral =
                        isRubricaPessoal &&
                        necStr.includes("ida e volta");
                      const isAjudaCustoMotoristaIdaVolta =
                        isRubricaPessoal &&
                        necStr.includes("motorista") &&
                        necStr.includes("ida e volta");
                      const isAjudaCustoMotorista =
                        isRubricaPessoal &&
                        necStr.includes("motorista") &&
                        !isAjudaCustoMotoristaIdaVolta &&
                        !isIdaVoltaGeral;

                      if (isAjudaCustoDiretorDentro) {
                        const precoUnitario = 9000;
                        const qtd = rubrica.quantidade || 0;
                        const valorTotal = qtd * totalDays * precoUnitario + 0.3 * precoUnitario * qtd;
                        return { ...rubrica, precoUnitario, valorTotal };
                      }
                      if (isAjudaCustoDiretorFora || isAjudaCustoCivilFora) {
                        const precoUnitario = rubrica.precoUnitario || 0;
                        const qtd = rubrica.quantidade || 0;
                        const valorTotal = qtd * totalDays * precoUnitario + 0.3 * precoUnitario * qtd;
                        return { ...rubrica, valorTotal };
                      }
                      if (isAjudaCustoCivilDentro) {
                        const precoUnitario = 6000;
                        const qtd = rubrica.quantidade || 0;
                        const valorTotal = qtd * totalDays * precoUnitario + 0.3 * precoUnitario * qtd;
                        return { ...rubrica, precoUnitario, valorTotal };
                      }
                      if (isIdaVoltaGeral) {
                        const precoUnitario = 1800;
                        const qtd = rubrica.quantidade || 1;
                        const d = 1;
                        const valorTotal = qtd * d * precoUnitario;
                        return { ...rubrica, precoUnitario, quantidade: qtd, valorTotal };
                      }
                      if (isAjudaCustoMotoristaIdaVolta) {
                        const precoUnitario = 1800;
                        const qtd = 1;
                        const d = 2;
                        const valorTotal = qtd * d * precoUnitario;
                        return { ...rubrica, precoUnitario, quantidade: qtd, valorTotal };
                      }
                      if (isAjudaCustoMotorista) {
                        const precoUnitario = 1800;
                        const qtd = 1;
                        const valorTotal = qtd * totalDays * precoUnitario + 0.3 * precoUnitario * qtd;
                        return { ...rubrica, precoUnitario, quantidade: qtd, valorTotal };
                      }
                      if (isRubricaPessoal) {
                        const precoUnitario = rubrica.precoUnitario || 0;
                        const qtd = rubrica.quantidade || 1;
                        const valorTotal = qtd * totalDays * precoUnitario + 0.3 * precoUnitario * qtd;
                        return { ...rubrica, valorTotal };
                      }
                      return rubrica;
                    });

                    const totalOrcamento = totalRubricas.reduce(
                      (acc: number, r: any) => acc + (r.valorTotal || 0),
                      0,
                    );

                    return {
                      totalDias: totalDays,
                      rubricas: totalRubricas,
                      orcamento: totalOrcamento,
                      valor: totalOrcamento,
                    };
                  };

                  const persistDepartmentAndProducts = (data: any) => {
                    const dept = data.departamento || data.unidadeOrganica || currentSector || selectedCategory;
                    if (dept) {
                      saveDepartmentActivity(dept, data);
                    }
                    if (data.rubricas && Array.isArray(data.rubricas)) {
                      data.rubricas.forEach((r: any) => collectProductFromRubric(r));
                    }
                  };

                  const userSetor = user?.setor || user?.sector || user?.seccao || "";
                  const userRep = user?.reparticao || "";
                  const userDept = user?.departamento || "";
                  const userDir = user?.direcao || user?.servicoCentral || "";
                  const userUnidade = user?.unidadeOrganica || user?.unidade || "";

                  const finalSetor = formData.setor || formData.reparticao || userSetor || userRep || sectorName || currentSector || "Setor Geral";
                  const finalReparticao = formData.reparticao || formData.setor || userRep || userSetor || sectorName || currentSector || "Repartição Geral";
                  const isUgeaArea = 
                    String(userDept || "").toLowerCase().includes("ugea") ||
                    String(userDept || "").toLowerCase().includes("aquisi") ||
                    String(formData.departamento || "").toLowerCase().includes("ugea") ||
                    String(formData.departamento || "").toLowerCase().includes("aquisi") ||
                    String(selectedCategory || "").toLowerCase().includes("ugea") ||
                    String(sectorName || "").toLowerCase().includes("ugea");
                  const finalDepartamento = formData.departamento || userDept || (isUgeaArea ? "Unidade Gestora e Executora de Aquisições" : "Departamento Geral");
                  const finalDirecao = formData.direcao || formData.unidadeSelecionada || userDir || "Direção Geral";
                  const finalUnidade = formData.unidadeOrganica || formData.unidadeCentral || userUnidade || selectedCategory || "Songo";

                  const submissionData: any = {
                    ...formData,
                    ...calculateTotalActivityData(months, formData),
                    title: formData.nomeAtividade,
                    nAtividade: formData.numeroAtividade,
                    selectedCategory,
                    ano: nextYear,
                    mesesRealizacao: months,
                    mesRealizacao: months[0] || formData.mesRealizacao || (formData as any).mes || "",
                    setor: finalSetor,
                    reparticao: finalReparticao,
                    departamento: finalDepartamento,
                    direcao: finalDirecao,
                    unidadeOrganica: finalUnidade,
                    unidadeSelecionada: finalDirecao,
                    // Não enviar imediatamente: guardar no plano setorial para submissão posterior
                    submetido: false,
                    status: initialData?.status || formData.status || "setorial",
                    guardadoParaSubmissaoPosterior: true,
                    dataCriacao: initialData?.dataCriacao || new Date().toISOString(),
                    dataAtualizacao: new Date().toISOString(),
                    criadoPor: user?.nome || user?.name || user?.email || "Colaborador",
                    criadoPorCargo: user?.cargo || user?.cargoChefia || "Responsável",
                  };

                  persistDepartmentAndProducts(submissionData);
                  const submissionPromise = onSubmit(submissionData);

                  await Promise.race([
                    submissionPromise,
                    new Promise((_, reject) =>
                      setTimeout(
                        () =>
                          reject(
                            new Error(
                              "A gravação está a demorar mais do que o esperado. Verifique a sua ligação à internet.",
                            ),
                          ),
                        25000,
                      ),
                    ),
                  ]);

                  onClose();
                } catch (generalErr: any) {
                  console.error("Erro ao guardar atividade para submissão posterior:", generalErr);
                  setSubmissionError(generalErr?.message || "Não foi possível guardar a atividade. Verifique os dados inseridos.");
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
              className={`w-full sm:w-auto justify-center ${isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-[#00a86b] hover:bg-[#008f5b]"} text-white px-8 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 shadow-sm`}
              title="Guardar a atividade no plano setorial para submissão posterior"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  A guardar atividade...
                </>
              ) : (
                <>
                  <Save size={18} /> SUBMETER a ATIVIDADE
                </>
              )}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full sm:w-auto justify-center bg-slate-600 text-white px-10 py-2 rounded-lg font-bold text-sm hover:bg-slate-700 transition-all flex items-center gap-2"
            >
              Fechar Visualização
            </button>
          )}
        </div>

        {/* Modal de Alerta de Atividade Duplicada e Ação Abortada */}
        {duplicateAlert?.isOpen && (
          <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-red-200 animate-in fade-in zoom-in duration-200">
              <div className="bg-red-600 text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-black text-xl">
                    ⚠️
                  </div>
                  <div>
                    <h3 className="font-black text-lg leading-tight">
                      {duplicateAlert.title}
                    </h3>
                    <p className="text-xs text-red-100 font-medium">
                      Regra de Validação de Duplicidade
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDuplicateAlert(null)}
                  className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4 text-slate-800">
                <p className="text-sm leading-relaxed font-semibold whitespace-pre-line text-red-950">
                  {duplicateAlert.message}
                </p>

                {duplicateAlert.existingActivity && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs space-y-2">
                    <span className="font-bold text-red-900 block  tracking-wider text-[10px]">
                      Registo Existente no Sistema:
                    </span>
                    <div className="text-red-950 font-bold text-sm">
                      • {duplicateAlert.existingActivity.nomeAtividade || duplicateAlert.existingActivity.title || duplicateAlert.existingActivity.designacao}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-600 font-medium text-[11px] pt-1">
                      <span>Código: <strong className="text-slate-800">{duplicateAlert.existingActivity.codigoAtividade || duplicateAlert.existingActivity.numeroAtividade || duplicateAlert.existingActivity.no || 'Sem código'}</strong></span>
                      <span>Mês: <strong className="text-slate-800">{extractMonthsFromActivity(duplicateAlert.existingActivity).join(", ") || 'Mesmo Mês'}</strong></span>
                      <span>Departamento: <strong className="text-slate-800">{duplicateAlert.existingActivity.departamento || duplicateAlert.existingActivity.unidadeOrganica || 'Geral'}</strong></span>
                    </div>
                  </div>
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 font-medium leading-relaxed">
                  💡 <strong>Instrução:</strong> Se esta atividade for realizada num mês diferente, altere o mês de realização no Passo 5 para registá-la como ocorrência em meses diferentes. Se for idêntica no mesmo mês, o registo é permanentemente bloqueado.
                </div>
              </div>

              <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setDuplicateAlert(null)}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  Entendi e Abortar Ação
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

import { doc, setDoc, getDocs, collection, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { isSuperBossUser } from "./auth";
import { PeriodoPlanificacao } from "../types";

const currentYear = new Date().getFullYear();

export const DEFAULT_PLANNING_PERIOD: PeriodoPlanificacao = {
  id: "periodo_planificacao_atual",
  ano: currentYear,
  // Período de planificação dos setores por defeito: 1 de Abril a 30 de Abril (1 mês)
  dataInicioPlanificacao: `${currentYear}-04-01`,
  dataFimPlanificacao: `${currentYear}-04-30`,
  // Período de relatório por defeito: 1 de Janeiro a 31 de Março (3 meses)
  dataInicioRelatorioSemestral: `${currentYear}-01-01`,
  dataFimRelatorioSemestral: `${currentYear}-03-31`,
  status: "aberto",
  statusRelatorio: "aberto",
  definidoPor: "Chefe do DPEP / Técnico de Planificação",
  cargoDefinidor: "DPEP / Repartição de Planificação",
  setorDefinidor: "Repartição de Planificação",
  observacoes: "Período regulamentar de planificação e relatórios.",
  extensaoFase1Usada: false,
  extensaoFase2Usada: false,
  diasExtensaoTotal: 0,
  autoSubmetido: false,
};

const LOCAL_STORAGE_KEY = "sigep_periodo_planificacao";

export function canManagePeriodoPlanificacao(user: any): boolean {
  if (!user) return false;
  if (isSuperBossUser(user)) return true;

  const role = String(user.role || "").toUpperCase();
  const cargo = String(user.cargo || "").toUpperCase();
  const cargoChefia = String(user.cargoChefia || "").toUpperCase();
  const dept = String(user.departamento || "").toUpperCase();
  const rep = String(user.reparticao || "").toUpperCase();
  const setor = String(user.setor || "").toUpperCase();
  const title = String(user.title || "").toUpperCase();

  // Chefe do DPEP ou Técnico de Planificação / Repartição de Planificação
  const isChefeDPEP =
    cargoChefia.includes("DPEP") ||
    cargo.includes("DPEP") ||
    title.includes("DPEP") ||
    cargoChefia.includes("PLANIFICAÇÃO, ESTUDOS E PROJETOS") ||
    cargoChefia.includes("PLANIFICACAO, ESTUDOS E PROJECTOS") ||
    cargo.includes("CHEFE DO DPEP") ||
    cargo.includes("CHEFE DO DEPARTAMENTO DE PLANIFICAÇÃO") ||
    cargo.includes("CHEFE DO DEPARTAMENTO DE PLANIFICACAO") ||
    (dept.includes("PLANIFICAÇÃO") && (cargoChefia.includes("CHEFE") || cargo.includes("CHEFE") || user.isChefia));

  const isTecnicoPlanificacao =
    cargo.includes("TÉCNICO DE PLANIFICAÇÃO") ||
    cargo.includes("TECNICO DE PLANIFICACAO") ||
    cargo.includes("TÉCNICO DE PLANIFICAÇÃO E ESTATÍSTICA") ||
    cargo.includes("TECNICO DE PLANIFICACAO E ESTATISTICA") ||
    title.includes("PLANIFICAÇÃO") ||
    title.includes("PLANIFICACAO") ||
    role.includes("PLANIFICAÇÃO") ||
    role.includes("PLANIFICACAO") ||
    rep.includes("PLANIFICAÇÃO") ||
    rep.includes("PLANIFICACAO") ||
    setor.includes("PLANIFICAÇÃO") ||
    setor.includes("PLANIFICACAO") ||
    dept.includes("PLANIFICAÇÃO") ||
    dept.includes("PLANIFICACAO");

  return isChefeDPEP || isTecnicoPlanificacao;
}

export function isPlanificacaoAberta(periodo: PeriodoPlanificacao | null): { aberta: boolean; motivo?: string } {
  if (!periodo) {
    return { aberta: true };
  }

  if (periodo.status === "fechado") {
    return {
      aberta: false,
      motivo: "O período de planificação encerrado, aguarde a atualização do calendário, assim como o relatório semestral.",
    };
  }

  if (periodo.dataInicioPlanificacao && periodo.dataFimPlanificacao) {
    const today = new Date().toISOString().split("T")[0];
    if (today < periodo.dataInicioPlanificacao) {
      return {
        aberta: false,
        motivo: `O período de planificação encerrado, aguarde a atualização do calendário, assim como o relatório semestral.`,
      };
    }
    if (today > periodo.dataFimPlanificacao) {
      return {
        aberta: false,
        motivo: "O período de planificação encerrado, aguarde a atualização do calendário, assim como o relatório semestral.",
      };
    }
  }

  return { aberta: true };
}

export function isRelatorioSemestralAberto(periodo: PeriodoPlanificacao | null): { aberto: boolean; motivo?: string } {
  if (!periodo) {
    return { aberto: true };
  }

  if (periodo.statusRelatorio === "fechado") {
    return {
      aberto: false,
      motivo: "O período de relatório semestral encontra-se encerrado. Aguarde a atualização do calendário.",
    };
  }

  if (periodo.dataInicioRelatorioSemestral && periodo.dataFimRelatorioSemestral) {
    const today = new Date().toISOString().split("T")[0];
    if (today < periodo.dataInicioRelatorioSemestral) {
      return {
        aberto: false,
        motivo: `O período de relatório semestral ainda não iniciou (Inicia em ${periodo.dataInicioRelatorioSemestral}).`,
      };
    }
    if (today > periodo.dataFimRelatorioSemestral) {
      return {
        aberto: false,
        motivo: "O período de relatório semestral encontra-se encerrado. Aguarde a atualização do calendário.",
      };
    }
  }

  return { aberto: true };
}

export function subscribePeriodoPlanificacao(callback: (periodo: PeriodoPlanificacao) => void): () => void {
  const docRef = doc(db, "configuracoes", "periodo_planificacao");

  // Initial local storage read
  try {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) {
      callback({ ...DEFAULT_PLANNING_PERIOD, ...JSON.parse(local) });
    } else {
      callback(DEFAULT_PLANNING_PERIOD);
    }
  } catch (e) {
    callback(DEFAULT_PLANNING_PERIOD);
  }

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as PeriodoPlanificacao;
        const merged = { ...DEFAULT_PLANNING_PERIOD, ...data, id: snapshot.id };
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
        } catch (_) {}
        callback(merged);
      } else {
        callback(DEFAULT_PLANNING_PERIOD);
      }
    },
    (error) => {
      console.warn("Aviso ao subscrever período de planificação:", error);
      try {
        const local = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (local) {
          callback({ ...DEFAULT_PLANNING_PERIOD, ...JSON.parse(local) });
        } else {
          callback(DEFAULT_PLANNING_PERIOD);
        }
      } catch (_) {
        callback(DEFAULT_PLANNING_PERIOD);
      }
    }
  );
}

export async function savePeriodoPlanificacao(
  periodo: Partial<PeriodoPlanificacao>,
  user?: any
): Promise<void> {
  const docRef = doc(db, "configuracoes", "periodo_planificacao");
  const payload: Partial<PeriodoPlanificacao> = {
    ...periodo,
    ano: periodo.ano || new Date().getFullYear(),
    definidoPor: user?.nome || user?.name || user?.email || periodo.definidoPor || "Chefe do DPEP / Técnico de Planificação",
    cargoDefinidor: user?.cargo || user?.cargoChefia || periodo.cargoDefinidor || "DPEP / Repartição de Planificação",
    setorDefinidor: user?.departamento || user?.reparticao || user?.setor || periodo.setorDefinidor || "Repartição de Planificação",
    updatedAt: serverTimestamp(),
  };

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ ...DEFAULT_PLANNING_PERIOD, ...payload }));
  } catch (_) {}

  await setDoc(docRef, payload, { merge: true });

  try {
    const eventDocRef = doc(db, "calendar_events", "evento_periodo_planificacao");
    await setDoc(
      eventDocRef,
      {
        title: `Período Oficial de Planificação Setorial - ${payload.ano || new Date().getFullYear()}`,
        type: "Início e Fechamento de Atividade",
        agenda: `Período Oficial de Abertura e Fechamento do Ciclo de Planificação Setorial. Status: ${payload.status === "aberto" ? "Aberto (30 Dias)" : "Encerrado"}. Datas: ${payload.dataInicioPlanificacao} até ${payload.dataFimPlanificacao}`,
        date: payload.dataInicioPlanificacao || `${new Date().getFullYear()}-04-01`,
        startTime: "07:30",
        endTime: "15:30",
        location: "DPEP / Todas Unidades Orgânicas",
        participants: "Todos os Setores, Repartições, Departamentos e Direções",
        isPlanningPeriodEvent: true,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Aviso ao sincronizar evento no calendário:", err);
  }
}

// Ativa a contagem de 30 dias a partir do dia do clique para a planificação
export async function ativarContagem30DiasPlanificacao(user?: any): Promise<void> {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + 30);

  const startStr = startDate.toISOString().split("T")[0];
  const endStr = endDate.toISOString().split("T")[0];

  await savePeriodoPlanificacao(
    {
      dataInicioPlanificacao: startStr,
      dataFimPlanificacao: endStr,
      status: "aberto",
      observacoes: `Período de planificação ativado em ${startStr} com duração de 30 dias (término em ${endStr}).`,
    },
    user
  );
}

// Ativa a contagem de 3 meses para o relatório (1 de Janeiro a 31 de Março ou 90 dias a partir de hoje)
export async function ativarPeriodoRelatorio(user?: any): Promise<void> {
  const currentYr = new Date().getFullYear();
  // Por regra: 1 de Janeiro a 31 de Março do ano atual (3 meses)
  const startStr = `${currentYr}-01-01`;
  const endStr = `${currentYr}-03-31`;

  await savePeriodoPlanificacao(
    {
      dataInicioRelatorioSemestral: startStr,
      dataFimRelatorioSemestral: endStr,
      statusRelatorio: "aberto",
      observacoes: `Período de relatórios semestrais ativado para o intervalo de 1 de Janeiro a 31 de Março de ${currentYr}.`,
    },
    user
  );
}

export interface EstagioCiclo {
  mesNumero: 1 | 2 | 3;
  mesNome: string;
  mesCod: string; // e.g., '01', '04'
  fase: string;
  descricao: string;
  responsavel: string;
  acaoEsperada: string;
}

export function getCicloRelatorioEstrutura(ano: number = currentYear): EstagioCiclo[] {
  return [
    {
      mesNumero: 1,
      mesNome: "Janeiro",
      mesCod: `${ano}-01`,
      fase: "Produção e Envio Setorial",
      descricao: "Produção de relatórios por cada setor e envio à Repartição / Setor de Relatórios.",
      responsavel: "Todos os Setores, Repartições e Departamentos",
      acaoEsperada: "Elaboração e envio dos relatórios de desempenho setoriais.",
    },
    {
      mesNumero: 2,
      mesNome: "Fevereiro",
      mesCod: `${ano}-02`,
      fase: "Compilação Institucional",
      descricao: "O setor de relatórios compila todas as contribuições e transforma no Relatório Institucional.",
      responsavel: "Setor / Repartição de Relatórios & DPEP",
      acaoEsperada: "Consolidação e harmonização dos relatórios no documento institucional único.",
    },
    {
      mesNumero: 3,
      mesNome: "Março",
      mesCod: `${ano}-03`,
      fase: "Submissão, Aprovação e Impressão",
      descricao: "Submissão para aprovação superior e impressão final do Relatório Institucional.",
      responsavel: "Direção Geral & DPEP",
      acaoEsperada: "Aprovação final, chancela institucional e impressão.",
    },
  ];
}

export function getCicloPlanoEstrutura(ano: number = currentYear): EstagioCiclo[] {
  return [
    {
      mesNumero: 1,
      mesNome: "Abril",
      mesCod: `${ano}-04`,
      fase: "Planificação Setorial e Envio",
      descricao: "Planificação setorial pelas unidades e envio ao setor de planificação (DPEP).",
      responsavel: "Todos os Setores, Repartições e Departamentos",
      acaoEsperada: "Inserção das atividades, metas e orçamentos setoriais (30 dias).",
    },
    {
      mesNumero: 2,
      mesNome: "Maio",
      mesCod: `${ano}-05`,
      fase: "Compilação e Plano Institucional",
      descricao: "O setor de planificação compila as propostas e transforma no Plano Institucional.",
      responsavel: "Repartição de Planificação & DPEP",
      acaoEsperada: "Análise técnica, alocação de programas e elaboração da Matriz Institucional.",
    },
    {
      mesNumero: 3,
      mesNome: "Junho",
      mesCod: `${ano}-06`,
      fase: "Submissão, Aprovação e Publicação",
      descricao: "Submissão formal, aprovação pelas instâncias superiores e publicação oficial do Plano.",
      responsavel: "Direção Geral & DPEP",
      acaoEsperada: "Aprovação do Plano de Atividades e publicação para execução.",
    },
  ];
}

/**
 * Retorna o estágio atual do ciclo de relatórios ou planificação com base na data do sistema.
 */
export function getEstagioAtualRelatorio(date: Date = new Date()): EstagioCiclo | null {
  const month = date.getMonth() + 1; // 1-12
  const ano = date.getFullYear();
  const estrutura = getCicloRelatorioEstrutura(ano);

  if (month === 1) return estrutura[0];
  if (month === 2) return estrutura[1];
  if (month === 3) return estrutura[2];
  return null;
}

export function getEstagioAtualPlano(date: Date = new Date()): EstagioCiclo | null {
  const month = date.getMonth() + 1; // 1-12
  const ano = date.getFullYear();
  const estrutura = getCicloPlanoEstrutura(ano);

  if (month === 4) return estrutura[0];
  if (month === 5) return estrutura[1];
  if (month === 6) return estrutura[2];
  return null;
}


export async function alternarStatusRelatorio(statusAtual: "aberto" | "fechado", user?: any): Promise<void> {
  const novoStatus = statusAtual === "aberto" ? "fechado" : "aberto";
  await savePeriodoPlanificacao({ statusRelatorio: novoStatus }, user);
}

/**
 * Extensão do prazo de planificação em duas fases:
 * - 1ª Fase: +7 Dias
 * - 2ª Fase: +5 Dias
 * Após a utilização das duas fases, o prazo não pode mais ser estendido.
 */
export async function estenderPrazoPlanificacao(
  fase: 1 | 2,
  periodoAtual: PeriodoPlanificacao,
  user?: any
): Promise<{ success: boolean; message: string }> {
  if (fase === 1) {
    if (periodoAtual.extensaoFase1Usada) {
      return { success: false, message: "A extensão da 1ª Fase (7 dias) já foi utilizada anteriormente." };
    }

    const currentEndDateStr = periodoAtual.dataFimPlanificacao || new Date().toISOString().split("T")[0];
    const currentEndDate = new Date(currentEndDateStr);
    currentEndDate.setDate(currentEndDate.getDate() + 7);
    const newEndStr = currentEndDate.toISOString().split("T")[0];

    const totalExt = (periodoAtual.diasExtensaoTotal || 0) + 7;

    await savePeriodoPlanificacao(
      {
        dataFimPlanificacao: newEndStr,
        status: "aberto",
        extensaoFase1Usada: true,
        diasExtensaoTotal: totalExt,
        observacoes: `Prazo estendido (1ª Fase - +7 Dias). Novo término: ${newEndStr}.`,
      },
      user
    );

    return {
      success: true,
      message: `Sucesso! O prazo de planificação foi estendido em 7 dias até ${newEndStr} (1ª Fase).`,
    };
  }

  if (fase === 2) {
    if (!periodoAtual.extensaoFase1Usada) {
      return {
        success: false,
        message: "Deve utilizar primeiro a extensão da 1ª Fase (7 dias) antes de aplicar a 2ª Fase.",
      };
    }
    if (periodoAtual.extensaoFase2Usada) {
      return {
        success: false,
        message: "A extensão da 2ª Fase (5 dias) já foi utilizada. Todas as fases de extensão foram esgotadas.",
      };
    }

    const currentEndDateStr = periodoAtual.dataFimPlanificacao || new Date().toISOString().split("T")[0];
    const currentEndDate = new Date(currentEndDateStr);
    currentEndDate.setDate(currentEndDate.getDate() + 5);
    const newEndStr = currentEndDate.toISOString().split("T")[0];

    const totalExt = (periodoAtual.diasExtensaoTotal || 0) + 5;

    await savePeriodoPlanificacao(
      {
        dataFimPlanificacao: newEndStr,
        status: "aberto",
        extensaoFase2Usada: true,
        diasExtensaoTotal: totalExt,
        observacoes: `Prazo estendido (2ª Fase Final - +5 Dias). Novo término definitivo: ${newEndStr}.`,
      },
      user
    );

    return {
      success: true,
      message: `Sucesso! O prazo de planificação foi estendido em 5 dias adicionais até ${newEndStr} (2ª e Última Fase).`,
    };
  }

  return { success: false, message: "Fase de extensão inválida." };
}

/**
 * Submissão automática após vencimento do prazo.
 * Quando o prazo expira, todas as atividades em rascunho / pendentes são submetidas automaticamente
 * seguindo a trajetória traçada no workflow.
 */
export async function executarSubmissaoAutomaticaSePrazoExpirado(
  periodoAtual: PeriodoPlanificacao | null
): Promise<{ submetidas: number }> {
  if (!periodoAtual) return { submetidas: 0 };

  const check = isPlanificacaoAberta(periodoAtual);
  // Se ainda estiver aberta, não efetua submissão automática
  if (check.aberta) {
    return { submetidas: 0 };
  }

  try {
    const snap = await getDocs(collection(db, "matrix_activities"));
    const updates: Promise<any>[] = [];
    let count = 0;

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const isUnsubmitted = !data.submetido || data.submetido === false;
      const currentStatus = (data.status || "setorial").toLowerCase();

      // Atividades não submetidas ou em rascunho/fase inicial
      if (isUnsubmitted || currentStatus === "setorial" || currentStatus === "rascunho") {
        let nextStatus = "reparticao";
        if (currentStatus === "reparticao") nextStatus = "departamento";
        if (currentStatus === "departamento") nextStatus = "direcao";

        updates.push(
          setDoc(
            docSnap.ref,
            {
              status: nextStatus,
              submetido: true,
              submetidoAutomaticamente: true,
              dataSubmissaoAutomatica: new Date().toISOString(),
              motivoSubmissaoAutomatica: "Submissão automática do sistema por expiração do prazo oficial de planificação.",
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          )
        );
        count++;
      }
    });

    if (count > 0) {
      await Promise.all(updates);
      // Registar no período que a submissão automática foi executada para este término
      await savePeriodoPlanificacao({
        autoSubmetido: true,
        dataAutoSubmissao: new Date().toISOString(),
      });
      console.log(`✅ Submissão automática de ${count} atividades executada após o encerramento do prazo.`);
    }

    return { submetidas: count };
  } catch (err) {
    console.warn("Aviso na submissão automática por expiração de prazo:", err);
    return { submetidas: 0 };
  }
}


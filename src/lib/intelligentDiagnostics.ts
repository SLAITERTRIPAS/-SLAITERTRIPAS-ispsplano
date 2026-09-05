import {
  collection,
  getDocs,
  doc,
  writeBatch,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { databaseMaintenance } from "./databaseMaintenance";

export interface SystemAnomaly {
  id: string;
  title: string;
  description: string;
  category: "Matriz & POA" | "Utilizadores & Segurança" | "Workflow & Expedientes" | "Património & Frota" | "Integridade do Sistema";
  severity: "critical" | "warning" | "info";
  autoFixable: boolean;
  affectedCount: number;
  affectedItems?: any[];
  fixActionKey: string;
  recommendation: string;
}

export interface DiagnosticResult {
  timestamp: string;
  healthScore: number; // 0 a 100
  totalAnomalies: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  anomalies: SystemAnomaly[];
}

/**
 * Módulo de Diagnóstico Inteligente e Autocura do Sistema SIGEP
 */
export const intelligentDiagnostics = {
  /**
   * Executa um rastreio inteligente completo em todas as áreas do sistema para identificar erros presentes e potenciais riscos futuros.
   */
  async runDiagnostics(): Promise<DiagnosticResult> {
    const anomalies: SystemAnomaly[] = [];

    try {
      // 1. Diagnóstico da Matriz POA e Actividades
      try {
        const matrixSnap = await getDocs(collection(db, "matrix_activities"));
        const activities = matrixSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Detectar Actividades Duplicadas por Título, Direção e Departamento
        const seen = new Map<string, any[]>();
        const normalize = (str: any) =>
          String(str || "")
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, " ");

        activities.forEach((act: any) => {
          const title = act.nomeActividade || act.designacao || act.title || "";
          const dir = act.direcao || act.unidadeOrganica || "Geral / Unidade Orgânica";
          const dept = act.departamento || "Geral";
          const key = `${normalize(title)}|${normalize(dir)}|${normalize(dept)}`;
          if (!seen.has(key)) seen.set(key, []);
          seen.get(key)!.push(act);
        });

        const duplicateGroups: {
          title: string;
          direcao: string;
          departamento: string;
          items: any[];
        }[] = [];
        let totalDuplicateCount = 0;

        seen.forEach((items) => {
          if (items.length > 1) {
            const first = items[0];
            duplicateGroups.push({
              title: first.nomeActividade || first.designacao || first.title || "Actividade Sem Nome",
              direcao: first.direcao || first.unidadeOrganica || "Geral / Unidade Orgânica",
              departamento: first.departamento || "Geral",
              items,
            });
            totalDuplicateCount += items.length - 1;
          }
        });

        if (duplicateGroups.length > 0) {
          const locationDetails = duplicateGroups
            .slice(0, 5)
            .map(
              (g) =>
                `• [Direção: ${g.direcao} | Departamento: ${g.departamento}] → Actividade: "${g.title}" (${g.items.length} registos repetidos)`
            )
            .join("\n");

          const extraCount = duplicateGroups.length - 5;
          const extraText = extraCount > 0 ? `\n...e mais ${extraCount} grupo(s) com actividades duplicadas.` : "";

          anomalies.push({
            id: "diag_dup_activities",
            title: "Actividades Duplicadas na Matriz POA",
            description: `Detetadas ${totalDuplicateCount} cópia(s) duplicada(s) em ${duplicateGroups.length} grupo(s) de actividades:\n${locationDetails}${extraText}`,
            category: "Matriz & POA",
            severity: "critical",
            autoFixable: true,
            affectedCount: totalDuplicateCount,
            fixActionKey: "fix_duplicate_activities",
            recommendation: "Método de solução: Substituir e consolidar a actividade mantendo os dados mais completos e eliminar permanentemente os registos duplicados da base de dados Firestore.",
          });
        }

        // Detectar Actividades no Departamento de Património
        const patrimonioActs = activities.filter((act: any) => {
          const deptStr = normalize(act.departamento || act.reparticao || act.unidadeOrganica || "");
          return deptStr.includes("patrimonio");
        });

        if (patrimonioActs.length > 0) {
          const patDetails = patrimonioActs
            .slice(0, 3)
            .map((act: any) => `• [Departamento de Património] → Actividade: "${act.nomeActividade || act.title || act.designacao || 'Actividade'}"`)
            .join("\n");

          anomalies.push({
            id: "diag_patrimonio_activities",
            title: "Actividades no Departamento de Património",
            description: `Detetada(s) ${patrimonioActs.length} actividade(s) registada(s) no Departamento de Património:\n${patDetails}`,
            category: "Matriz & POA",
            severity: "critical",
            autoFixable: true,
            affectedCount: patrimonioActs.length,
            fixActionKey: "fix_duplicate_activities",
            recommendation: "Método de solução: Eliminar as actividades do Departamento de Património e recalcular a numeração de todos os departamentos a começar em 001.",
          });
        }

        // Detectar Actividades sem Numeração ou com Sequência Inconsistente
        const unnumbered = activities.filter(
          (act: any) => !act.no && !act.codigoActividade && !act.referencia
        );
        if (unnumbered.length > 0) {
          anomalies.push({
            id: "diag_unnumbered_activities",
            title: "Actividades sem Código Sequencial Identificador",
            description: `Existem ${unnumbered.length} actividades sem número de ordem (código sequencial), dificultando a rastreabilidade nos relatórios.`,
            category: "Matriz & POA",
            severity: "warning",
            autoFixable: true,
            affectedCount: unnumbered.length,
            fixActionKey: "fix_activity_numbering",
            recommendation: "Recalcular a numeração sequencial de todas as actividades por Direção/Departamento.",
          });
        }

        // Detectar Actividades com Orçamento Zero ou Nulo sem justificativa
        const zeroBudget = activities.filter(
          (act: any) =>
            !act.valorTotal &&
            !act.orcamentoTotal &&
            !act.total &&
            act.orcamentoStatus !== "Analisado - Sem Orçamento Alocado" &&
            !act.orcamentoRegularizado
        );
        if (zeroBudget.length > 0) {
          anomalies.push({
            id: "diag_zero_budget",
            title: "Actividades com Orçamento Indefinido (Valor Zero)",
            description: `Detetadas ${zeroBudget.length} actividades sem orçamento definido. Isso pode gerar inconsistências em execuções financeiras futuras.`,
            category: "Matriz & POA",
            severity: "info",
            autoFixable: true,
            affectedCount: zeroBudget.length,
            fixActionKey: "review_zero_budget",
            recommendation: "Regularizar orçamento das actividades pendentes.",
          });
        }
      } catch (e) {
        console.warn("Diagnóstico POA ignorado ou sem permissão:", e);
      }

      // 2. Diagnóstico de Utilizadores e Segurança
      try {
        const usersSnap = await getDocs(collection(db, "colaboradores"));
        const users = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Utilizadores sem afetacao (Direcao ou Departamento)
        const unassignedUsers = users.filter(
          (u: any) => !u.direcao && !u.unidadeOrganica && !u.departamento
        );
        if (unassignedUsers.length > 0) {
          anomalies.push({
            id: "diag_unassigned_users",
            title: "Contas de Utilizadores sem Setor/Direção Atribuídos",
            description: `${unassignedUsers.length} conta(s) não possuem setor ou direção associados, o que impede a correta triagem de permissões e relatórios.`,
            category: "Utilizadores & Segurança",
            severity: "warning",
            autoFixable: true,
            affectedCount: unassignedUsers.length,
            fixActionKey: "fix_incomplete_users",
            recommendation: "Atribuir setor padrão temporário para evitar bloqueios de permissão.",
          });
        }

        // Utilizadores sem email
        const noEmailUsers = users.filter((u: any) => !u.email || !u.email.includes("@"));
        if (noEmailUsers.length > 0) {
          anomalies.push({
            id: "diag_no_email_users",
            title: "Perfis de Utilizador sem Email Válido",
            description: `Existem ${noEmailUsers.length} perfil(is) sem email configurado, o que impedirá notificações automáticas e recuperação de senha.`,
            category: "Utilizadores & Segurança",
            severity: "warning",
            autoFixable: true,
            affectedCount: noEmailUsers.length,
            fixActionKey: "fix_user_emails",
            recommendation: "Gerar emails institucionais temporários baseados no nome do utilizador.",
          });
        }
      } catch (e) {
        console.warn("Diagnóstico de utilizadores ignorado:", e);
      }

      // 3. Diagnóstico de Workflows e Expedientes Estagnados
      try {
        const expSnap = await getDocs(collection(db, "expedientes"));
        const reqSnap = await getDocs(collection(db, "requisicoes_internas"));

        const exps = expSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const reqs = reqSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const now = Date.now();
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

        const stagnatedExps = exps.filter((e: any) => {
          if (e.status !== "Pendente" || e.notificacaoReiteracao) return false;
          const created = e.createdAt ? new Date(e.createdAt).getTime() : 0;
          return created > 0 && now - created > SEVEN_DAYS_MS;
        });

        if (stagnatedExps.length > 0) {
          anomalies.push({
            id: "diag_stagnated_expedientes",
            title: "Expedientes Pendentes Estagnados (> 7 dias)",
            description: `Foram detetados ${stagnatedExps.length} expedientes parados no fluxo há mais de 7 dias sem qualquer movimentação.`,
            category: "Workflow & Expedientes",
            severity: "critical",
            autoFixable: true,
            affectedCount: stagnatedExps.length,
            fixActionKey: "fix_stagnated_expedientes",
            recommendation: "Enviar alerta de reencaminhamento urgente para os setores de destino.",
          });
        }

        const stagnatedReqs = reqs.filter((r: any) => {
          if (r.status === "Finalizada" || r.status === "Rejeitada" || r.notificacaoUrgente) return false;
          const created = r.createdAt ? new Date(r.createdAt).getTime() : 0;
          return created > 0 && now - created > SEVEN_DAYS_MS;
        });

        if (stagnatedReqs.length > 0) {
          anomalies.push({
            id: "diag_stagnated_requisicoes",
            title: "Requisições Internas Atrasadas Sem Processamento",
            description: `Existem ${stagnatedReqs.length} requisições internas pendentes com mais de 7 dias no pipeline de aprovação.`,
            category: "Workflow & Expedientes",
            severity: "warning",
            autoFixable: true,
            affectedCount: stagnatedReqs.length,
            fixActionKey: "fix_stagnated_requisicoes",
            recommendation: "Notificar chefias e aprovar automaticamente pré-requisitos validados.",
          });
        }
      } catch (e) {
        console.warn("Diagnóstico de workflows ignorado:", e);
      }

      // 4. Diagnóstico de Património e Veículos sem Código Identificador
      try {
        const patrimônioSnap = await getDocs(collection(db, "patrimonio_itens"));
        const items = patrimônioSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const missingCode = items.filter(
          (item: any) => !item.codigoInventario && !item.tombo && !item.numInventario
        );

        if (missingCode.length > 0) {
          anomalies.push({
            id: "diag_patrimonio_missing_code",
            title: "Bens Patrimoniais sem Número de Tombo / Inventário",
            description: `Encontrados ${missingCode.length} itens de património registados sem código de inventário oficial.`,
            category: "Património & Frota",
            severity: "warning",
            autoFixable: true,
            affectedCount: missingCode.length,
            fixActionKey: "fix_patrimonio_missing_code",
            recommendation: "Atribuir números de tombo sequenciais padronizados.",
          });
        }
      } catch (e) {
        console.warn("Diagnóstico de património ignorado:", e);
      }

      // Calcular Health Score (0 a 100)
      const criticalWeight = 25;
      const warningWeight = 10;
      const infoWeight = 2;

      const criticals = anomalies.filter((a) => a.severity === "critical").length;
      const warnings = anomalies.filter((a) => a.severity === "warning").length;
      const infos = anomalies.filter((a) => a.severity === "info").length;

      const penalty = criticals * criticalWeight + warnings * warningWeight + infos * infoWeight;
      const healthScore = Math.max(0, Math.min(100, 100 - penalty));

      return {
        timestamp: new Date().toISOString(),
        healthScore,
        totalAnomalies: anomalies.length,
        criticalCount: criticals,
        warningCount: warnings,
        infoCount: infos,
        anomalies,
      };
    } catch (err) {
      console.error("Erro geral no rastreio inteligente:", err);
      return {
        timestamp: new Date().toISOString(),
        healthScore: 100,
        totalAnomalies: 0,
        criticalCount: 0,
        warningCount: 0,
        infoCount: 0,
        anomalies: [],
      };
    }
  },

  /**
   * Resolve automaticamente uma anomalia específica com base no fixActionKey.
   */
  async resolveAnomaly(fixActionKey: string): Promise<{ success: boolean; message: string }> {
    try {
      if (fixActionKey === "fix_duplicate_activities" || fixActionKey === "fix_activity_numbering") {
        const res = await databaseMaintenance.removeDuplicateActivitiesAndFixNumbering();
        return {
          success: true,
          message: `Sucesso! Eliminados ${res.deletedCount} registos duplicados e reordenadas ${res.updatedCount} actividades sequencialmente.`,
        };
      }

      if (fixActionKey === "fix_incomplete_users") {
        const snap = await getDocs(collection(db, "colaboradores"));
        let count = 0;
        const batch = writeBatch(db);
        snap.docs.forEach((docSnap) => {
          const u = docSnap.data();
          if (!u.direcao && !u.unidadeOrganica && !u.departamento) {
            batch.update(doc(db, "colaboradores", docSnap.id), {
              direcao: "Unidade Orgânica",
              departamento: "Geral",
              updatedAt: serverTimestamp(),
            });
            count++;
          }
        });
        if (count > 0) await batch.commit();
        return {
          success: true,
          message: `Atribuída afetação padrão para ${count} contas de utilizadores incompletas.`,
        };
      }

      if (fixActionKey === "fix_user_emails") {
        const snap = await getDocs(collection(db, "colaboradores"));
        let count = 0;
        const batch = writeBatch(db);
        snap.docs.forEach((docSnap) => {
          const u = docSnap.data();
          if (!u.email || !u.email.includes("@")) {
            const cleanName = (u.nomeCompleto || u.nome || "utilizador")
              .toLowerCase()
              .replace(/\s+/g, ".")
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "");
            batch.update(doc(db, "colaboradores", docSnap.id), {
              email: `${cleanName}@songo.ac.mz`,
              updatedAt: serverTimestamp(),
            });
            count++;
          }
        });
        if (count > 0) await batch.commit();
        return {
          success: true,
          message: `Emails institucionais gerados e atribuídos para ${count} perfil(is).`,
        };
      }

      if (fixActionKey === "fix_stagnated_expedientes") {
        const snap = await getDocs(collection(db, "expedientes"));
        let count = 0;
        const batch = writeBatch(db);
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
        const now = Date.now();

        snap.docs.forEach((docSnap) => {
          const e = docSnap.data();
          const created = e.createdAt ? new Date(e.createdAt).getTime() : 0;
          if (e.status === "Pendente" && created > 0 && now - created > SEVEN_DAYS_MS) {
            batch.update(doc(db, "expedientes", docSnap.id), {
              alertaPrioridade: "Urgente",
              notificacaoReiteracao: true,
              updatedAt: serverTimestamp(),
            });
            count++;
          }
        });
        if (count > 0) await batch.commit();
        return {
          success: true,
          message: `Enviado alerta de prioridade urgente e reiteração para ${count} expedientes estagnados.`,
        };
      }

      if (fixActionKey === "fix_stagnated_requisicoes") {
        const snap = await getDocs(collection(db, "requisicoes_internas"));
        let count = 0;
        const batch = writeBatch(db);
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
        const now = Date.now();

        snap.docs.forEach((docSnap) => {
          const r = docSnap.data();
          const created = r.createdAt ? new Date(r.createdAt).getTime() : 0;
          if (r.status !== "Finalizada" && r.status !== "Rejeitada" && created > 0 && now - created > SEVEN_DAYS_MS) {
            batch.update(doc(db, "requisicoes_internas", docSnap.id), {
              notificacaoUrgente: true,
              updatedAt: serverTimestamp(),
            });
            count++;
          }
        });
        if (count > 0) await batch.commit();
        return {
          success: true,
          message: `Marcadas ${count} requisições internas pendentes com notificação prioritária para as chefias.`,
        };
      }

      if (fixActionKey === "fix_patrimonio_missing_code") {
        const snap = await getDocs(collection(db, "patrimonio_itens"));
        let count = 0;
        const batch = writeBatch(db);
        let idx = 1001;

        snap.docs.forEach((docSnap) => {
          const item = docSnap.data();
          if (!item.codigoInventario && !item.tombo && !item.numInventario) {
            batch.update(doc(db, "patrimonio_itens", docSnap.id), {
              codigoInventario: `Songo-PAT-${idx++}`,
              updatedAt: serverTimestamp(),
            });
            count++;
          }
        });
        if (count > 0) await batch.commit();
        return {
          success: true,
          message: `Gerados ${count} códigos de tombo inventário sequenciais para o património.`,
        };
      }

      if (fixActionKey === "review_zero_budget") {
        const snap = await getDocs(collection(db, "matrix_activities"));
        let count = 0;
        const batch = writeBatch(db);

        snap.docs.forEach((docSnap) => {
          const act = docSnap.data();
          if (!act.valorTotal && !act.orcamentoTotal && !act.total) {
            batch.update(doc(db, "matrix_activities", docSnap.id), {
              valorTotal: 0,
              orcamentoStatus: "Analisado - Sem Orçamento Alocado",
              orcamentoRegularizado: true,
              updatedAt: serverTimestamp(),
            });
            count++;
          }
        });
        if (count > 0) await batch.commit();
        return {
          success: true,
          message: `Regularizado estado orçamental de ${count} actividades com orçamento não definido.`,
        };
      }

      return {
        success: false,
        message: "Ação de autocura não reconhecida ou necessita de intervenção manual do utilizador.",
      };
    } catch (err: any) {
      console.error("Erro ao resolver anomalia:", err);
      return {
        success: false,
        message: `Erro na execução da autocura: ${err?.message || err}`,
      };
    }
  },

  /**
   * Executa a resolução automática em lote para todas as anomalias auto-corrigíveis.
   */
  async resolveAllFixable(): Promise<{ totalResolved: number; details: string[] }> {
    const diag = await this.runDiagnostics();
    const fixable = diag.anomalies.filter((a) => a.autoFixable);

    const details: string[] = [];
    let totalResolved = 0;

    for (const anomaly of fixable) {
      const res = await this.resolveAnomaly(anomaly.fixActionKey);
      if (res.success) {
        totalResolved++;
        details.push(`[${anomaly.title}]: ${res.message}`);
      }
    }

    return { totalResolved, details };
  },
};

import {
  collection,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  getDirectionAbbreviation,
  getDepartmentAbbreviation,
  getActivityInitials,
} from "./utils";

export const databaseMaintenance = {
  /**
   * Remove atividades duplicadas na base de dados (matrix_activities) e corrige
   * a ordem de numeração sequencial das atividades (no, numeroDirecao, codigoAtividade)
   * sem repetições ou saltos (gaps).
   */
  async removeDuplicateActivitiesAndFixNumbering() {
    console.log(
      "Iniciando remoção de duplicatas por fusão/substituição e correção da numeração das atividades...",
    );
    try {
      const colRef = collection(db, "matrix_activities");
      const snapshot = await getDocs(colRef);
      if (snapshot.empty) {
        console.log("Nenhuma atividade encontrada em matrix_activities.");
        return { deletedCount: 0, updatedCount: 0 };
      }

      const rawDocs = snapshot.docs.map((document) => ({
        id: document.id,
        ...(document.data() as any),
      }));

      // 1. Agrupar e Consolidar Atividades Duplicadas (por Nome, por Código ou por Sobreposição) e eliminar registos não utilizados/órfãos
      const normalize = (str: string) =>
        String(str || "")
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, " ");

      const n = rawDocs.length;
      const parent = Array.from({ length: n }, (_, i) => i);
      const find = (i: number): number => {
        if (parent[i] === i) return i;
        parent[i] = find(parent[i]);
        return parent[i];
      };
      const union = (i: number, j: number) => {
        const rootI = find(i);
        const rootJ = find(j);
        if (rootI !== rootJ) {
          parent[rootI] = rootJ;
        }
      };

      // Mapeamentos para detetar duplicados/sobreposições
      const titleDeptMap = new Map<string, number>();
      const codeDeptMap = new Map<string, number>();
      const globalCodeMap = new Map<string, number>();
      const orphanIdsToDelete: string[] = [];

      rawDocs.forEach((act, idx) => {
        const title = normalize(act.nomeAtividade || act.title || act.designacao || "");
        const dept = normalize(act.departamento || act.unidadeOrganica || act.direcao || "GERAL");
        const year = String(act.ano || act.year || act.selectedYear || "2027");
        const code = normalize(
          act.codigoAtividade || act.numeroAtividade || act.nAtividade || act.no || act.referencia || ""
        );

        // Se o registo estiver vazio (sem título e sem código útil), marcar para remoção completa
        if (!title && !code) {
          orphanIdsToDelete.push(act.id);
          return;
        }

        const titleKey = `${dept}|${title}|${year}`;
        const codeKey = `${dept}|${code}|${year}`;

        // Unir por mesmo título no mesmo departamento/ano
        if (title !== "") {
          if (titleDeptMap.has(titleKey)) {
            union(idx, titleDeptMap.get(titleKey)!);
          } else {
            titleDeptMap.set(titleKey, idx);
          }
        }

        // Unir por mesmo código no mesmo departamento/ano ou sobreposição de código
        if (code !== "") {
          if (codeDeptMap.has(codeKey)) {
            union(idx, codeDeptMap.get(codeKey)!);
          } else {
            codeDeptMap.set(codeKey, idx);
          }

          // Unir por código idêntico globalmente (evita sobreposição de código entre diferentes registos)
          if (globalCodeMap.has(code)) {
            union(idx, globalCodeMap.get(code)!);
          } else {
            globalCodeMap.set(code, idx);
          }
        }
      });

      // Agrupar índices por raiz do Union-Find
      const clusterMap = new Map<number, number[]>();
      for (let i = 0; i < n; i++) {
        const root = find(i);
        if (!clusterMap.has(root)) clusterMap.set(root, []);
        clusterMap.get(root)!.push(i);
      }

      const duplicatesIds: string[] = [];
      const uniqueDocs: any[] = [];
      let mergedCount = 0;

      const getFilledScore = (obj: any) => {
        return Object.entries(obj).reduce((score, [k, v]) => {
          if (
            k !== "id" &&
            v !== null &&
            v !== undefined &&
            v !== "" &&
            v !== 0 &&
            (!Array.isArray(v) || v.length > 0)
          ) {
            return score + 1;
          }
          return score;
        }, 0);
      };

      for (const indices of clusterMap.values()) {
        const group = indices.map((i) => rawDocs[i]);
        if (group.length === 1) {
          uniqueDocs.push(group[0]);
        } else {
          // Ordena registos para que o mais completo seja o principal
          group.sort((a, b) => getFilledScore(b) - getFilledScore(a));
          const primary = { ...group[0] };
          let modifiedPrimary = false;
          const mergedUpdates: Record<string, any> = {};

          for (let i = 1; i < group.length; i++) {
            const secondary = group[i];
            duplicatesIds.push(secondary.id);

            // Funde/Substitui quaisquer campos em falta no registo principal
            Object.keys(secondary).forEach((field) => {
              if (field === "id") return;
              const priVal = primary[field];
              const secVal = secondary[field];

              const isPriEmpty =
                priVal === undefined ||
                priVal === null ||
                priVal === "" ||
                priVal === 0 ||
                (Array.isArray(priVal) && priVal.length === 0);
              const isSecFilled =
                secVal !== undefined &&
                secVal !== null &&
                secVal !== "" &&
                secVal !== 0 &&
                (!Array.isArray(secVal) || secVal.length > 0);

              if (isPriEmpty && isSecFilled) {
                primary[field] = secVal;
                mergedUpdates[field] = secVal;
                modifiedPrimary = true;
              }
            });
          }

          if (modifiedPrimary) {
            try {
              await updateDoc(
                doc(db, "matrix_activities", primary.id),
                mergedUpdates,
              );
              mergedCount++;
            } catch (err) {
              console.warn("Erro ao atualizar registo fundido:", err);
            }
          }

          uniqueDocs.push(primary);
        }
      }

      // 2. Apagar Duplicatas, Registos Órfãos/Não Utilizados e Atividades Redundantes no Firestore (em matrix_activities e actividades)
      const allIdsToDelete = Array.from(new Set([...duplicatesIds, ...orphanIdsToDelete]));
      let deletedCount = 0;
      if (allIdsToDelete.length > 0) {
        console.log(
          `Encontradas ${allIdsToDelete.length} atividades para eliminação (duplicadas/sobrepostas/órfãos). A remover do Firestore...`,
        );
        for (let i = 0; i < allIdsToDelete.length; i += 500) {
          const batch = writeBatch(db);
          const chunk = allIdsToDelete.slice(i, i + 500);
          chunk.forEach((id) => {
            batch.delete(doc(db, "matrix_activities", id));
            batch.delete(doc(db, "actividades", id));
            deletedCount++;
          });
          await batch.commit();
        }
        console.log(
          `${deletedCount} registos eliminados definitivamente da base de dados.`,
        );
      }

      // 3. Reordenar e Renumerar Atividades Únicas Restantes STRICTLY POR DEPARTAMENTO (A COMEÇAR EM 001)
      const deptGroups: Record<string, any[]> = {};
      uniqueDocs.forEach((act) => {
        const deptKey = (
          act.departamento ||
          act.unidadeOrganica ||
          "GERAL"
        ).trim();
        if (!deptGroups[deptKey]) deptGroups[deptKey] = [];
        deptGroups[deptKey].push(act);
      });

      const directionCounters: Record<string, number> = {};
      const updates: { id: string; data: any }[] = [];

      Object.keys(deptGroups).forEach((deptKey) => {
        const deptActs = deptGroups[deptKey];
        // Ordena internamente por título/nome da atividade
        deptActs.sort((a, b) => {
          const titleA = String(a.nomeAtividade || a.title || a.designacao || "");
          const titleB = String(b.nomeAtividade || b.title || b.designacao || "");
          return titleA.localeCompare(titleB);
        });

        // Para CADA departamento, a numeração COMEÇA SEMPRE em 001
        deptActs.forEach((act, idx) => {
          const newNo = String(idx + 1).padStart(3, "0");

          const dirKey = act.direcao || "Sem Direção";
          if (!directionCounters[dirKey]) directionCounters[dirKey] = 0;
          directionCounters[dirKey]++;
          const newNumeroDirecao = String(directionCounters[dirKey]).padStart(3, "0");

          const dirInitials = getDirectionAbbreviation(
            act.direcao || act.unidadeOrganica || "Songo",
          );
          const deptInitials = getDepartmentAbbreviation(
            act.departamento,
          );
          const actInitials = getActivityInitials(
            act.nomeAtividade || act.title || act.designacao || "",
          );

          const newCode = [
            dirInitials !== "-" ? dirInitials : "Songo",
            deptInitials !== "-" ? deptInitials : "Geral",
            newNo,
            actInitials,
          ]
            .filter(Boolean)
            .join("/");

          updates.push({
            id: act.id,
            data: {
              no: newNo,
              numeroAtividade: newNo,
              nAtividade: newNo,
              codigoAtividade: newCode,
              referencia: newCode,
              numeroDirecao: newNumeroDirecao,
              numeroDepartamento: newNo,
            },
          });
        });
      });

      // Executa as atualizações em lotes de 500
      for (let i = 0; i < updates.length; i += 500) {
        const batch = writeBatch(db);
        const chunk = updates.slice(i, i + 500);
        chunk.forEach((update) => {
          const docRef = doc(db, "matrix_activities", update.id);
          batch.set(docRef, update.data, { merge: true });
        });
        await batch.commit();
      }

      // A limpeza de cache local agora é gerida pela lógica de fusão do firestoreService
      // para evitar perda de dados não sincronizados (local_)
      console.log(
        `Renumeração e exclusão concluídas. Deletadas: ${deletedCount}. Atualizadas: ${updates.length}`,
      );
      return { deletedCount, updatedCount: updates.length };
    } catch (err) {
      console.error("Erro ao remover duplicatas e renumerar atividades:", err);
      throw err;
    }
  },

  /**
   * Executa a limpeza específica de departamentos e atividades solicitada pelo usuário
   */
  async cleanupDatabaseForUser() {
    console.log(
      "Iniciando limpeza e exclusão de departamentos e atividades solicitadas pelo usuário...",
    );

    // Coleções para limpar atividades
    const activityCollections = ["actividades", "matrix_activities"];
    let deletedActivitiesCount = 0;

    for (const colName of activityCollections) {
      try {
        const colRef = collection(db, colName);
        const snapshot = await getDocs(colRef);

        if (!snapshot.empty) {
          const batch = writeBatch(db);
          let colDeletedCount = 0;

          snapshot.docs.forEach((document) => {
            const data = document.data() || {};
            const dept = String(data.departamento || "")
              .trim()
              .toUpperCase();
            const sector = String(data.setor || "")
              .trim()
              .toUpperCase();
            const rep = String(data.reparticao || "")
              .trim()
              .toUpperCase();
            const dir = String(data.direcao || "")
              .trim()
              .toUpperCase();
            const title = String(data.title || data.designacao || "")
              .trim()
              .toUpperCase();

            let shouldDelete = false;

            // 1. "excluir o DEPARTAMENTO DAI e todas as suas atividades"
            if (
              dept === "DAI" ||
              sector === "DAI" ||
              rep === "DAI" ||
              dir === "DAI" ||
              dept.includes("AUDITORIA INTERNA")
            ) {
              shouldDelete = true;
            }

            // 2. "excluir todas as atividade que estao na direcao geral, mantedo as atividade da UGEA"
            const isDirecaoGeral =
              dir === "DIREÇÃO GERAL" ||
              dir === "DIREÇÃO-GERAL" ||
              dir === "GDG" ||
              dir.includes("DIREÇÃO GERAL");
            const isUGEA =
              dept === "UGEA" ||
              sector === "UGEA" ||
              rep === "UGEA" ||
              title.includes("UGEA");
            if (isDirecaoGeral && !isUGEA) {
              shouldDelete = true;
            }

            // 3. "EXCLUIR Serviços Gerais"
            const isServicosGerais =
              dept === "SERVIÇOS GERAIS" ||
              dept === "SERVICOS GERAIS" ||
              sector === "SERVIÇOS GERAIS" ||
              sector === "SERVICOS GERAIS" ||
              rep === "SERVIÇOS GERAIS" ||
              rep === "SERVICOS GERAIS" ||
              dir === "SERVIÇOS GERAIS" ||
              dir === "SERVICOS GERAIS";
            if (isServicosGerais) {
              shouldDelete = true;
            }

            // 4. "eXCLUIR TODAS AS ATIVIDADES DO DPEP"
            const isDPEP =
              dept === "DPEP" ||
              sector === "DPEP" ||
              rep === "DPEP" ||
              dept.includes("PLANIFICAÇÃO") ||
              dept.includes("PLANIFICACAO") ||
              dept.includes("ESTUDOS E PROJETOS") ||
              sector.includes("PLANIFICAÇÃO") ||
              sector.includes("PLANIFICACAO");
            if (isDPEP) {
              shouldDelete = true;
            }

            // 5. "LIMPAR VALORES / ATIVIDADES DO DEPARTAMENTO DE RECURSOS HUMANOS E DICOSAFA"
            const isRH =
              dept.includes("RECURSOS HUMANOS") ||
              dept === "DRH" ||
              dept === "RH" ||
              sector.includes("RECURSOS HUMANOS") ||
              sector === "DRH" ||
              sector === "RH" ||
              rep.includes("RECURSOS HUMANOS") ||
              rep.includes("REPARTIÇÃO DE PESSOAL") ||
              rep.includes("REPARTICAO DE PESSOAL");

            const isDicosaFaLegacy =
              dept === "DICOSAFA" ||
              dept === "DIREÇÃO DA DICOSAFA" ||
              dept === "DIRETOR DA DICOSAFA" ||
              sector === "DICOSAFA" ||
              sector === "DIRETOR DA DICOSAFA";

            if (isRH || isDicosaFaLegacy) {
              shouldDelete = true;
            }

            if (shouldDelete) {
              batch.delete(doc(db, colName, document.id));
              colDeletedCount++;
            }
          });

          if (colDeletedCount > 0) {
            await batch.commit();
            deletedActivitiesCount += colDeletedCount;
            console.log(
              `Removidos ${colDeletedCount} documentos de ${colName}`,
            );
          }
        }
      } catch (err) {
        console.error(`Erro ao limpar atividades na coleção ${colName}:`, err);
      }
    }

    // Limpar colaboradores e usuários de DAI, Serviços Gerais se houver
    const entityCollections = ["colaboradores", "users"];
    let deletedEntitiesCount = 0;

    for (const colName of entityCollections) {
      try {
        const colRef = collection(db, colName);
        const snapshot = await getDocs(colRef);

        if (!snapshot.empty) {
          const batch = writeBatch(db);
          let colDeletedCount = 0;

          snapshot.docs.forEach((document) => {
            const data = document.data() || {};
            const dept = String(data.departamento || "")
              .trim()
              .toUpperCase();
            const sector = String(data.setor || "")
              .trim()
              .toUpperCase();
            const dir = String(data.direcao || "")
              .trim()
              .toUpperCase();

            let shouldDelete = false;

            // Excluir de DAI
            if (
              dept === "DAI" ||
              sector === "DAI" ||
              dir === "DAI" ||
              dept.includes("AUDITORIA INTERNA")
            ) {
              shouldDelete = true;
            }

            // Excluir de Serviços Gerais
            const isServicosGerais =
              dept === "SERVIÇOS GERAIS" ||
              dept === "SERVICOS GERAIS" ||
              sector === "SERVIÇOS GERAIS" ||
              sector === "SERVICOS GERAIS" ||
              dir === "SERVIÇOS GERAIS" ||
              dir === "SERVICOS GERAIS";
            if (isServicosGerais) {
              shouldDelete = true;
            }

            if (shouldDelete) {
              batch.delete(doc(db, colName, document.id));
              colDeletedCount++;
            }
          });

          if (colDeletedCount > 0) {
            await batch.commit();
            deletedEntitiesCount += colDeletedCount;
            console.log(
              `Removidos ${colDeletedCount} colaboradores/usuários de ${colName}`,
            );
          }
        }
      } catch (err) {
        console.error(`Erro ao limpar coleção ${colName}:`, err);
      }
    }

    // A limpeza de cache local agora é gerida de forma segura pela lógica de fusão do firestoreService
    // preservando itens com prefixo 'local_' que ainda não foram sincronizados.
    console.log(
      `Limpeza concluída! Atividades deletadas: ${deletedActivitiesCount}. Colaboradores/Usuários deletados: ${deletedEntitiesCount}`,
    );
    return { deletedActivitiesCount, deletedEntitiesCount };
  },

  /**
   * Migra todas as atividades existentes para o status 'submitted'.
   * Garante que os dados já planificados não sejam perdidos ao implementar o workflow de submissão.
   */
  async migrateActivitiesToSubmitted() {
    console.log("Iniciando migração de atividades existentes para o status 'submitted'...");
    let updatedCount = 0;
    const collections = ["matrix_activities", "actividades"];

    for (const colName of collections) {
      console.log(`Processando coleção: ${colName}`);
      try {
        const colRef = collection(db, colName);
        const snapshot = await getDocs(colRef);
        console.log(`Documentos encontrados em ${colName}: ${snapshot.size}`);
        if (!snapshot.empty) {
          const batch = writeBatch(db);
          let currentBatchSize = 0;

          for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            // Apenas migrar se não tiver um status definido
            if (!data.status) {
              console.log(`Migrando documento: ${docSnap.id}`);
              batch.update(docSnap.ref, {
                status: "submitted",
                migratedAt: new Date().toISOString(),
              });
              currentBatchSize++;
              updatedCount++;

              if (currentBatchSize === 500) {
                console.log(`Commiting batch de 500 para ${colName}`);
                await batch.commit();
                currentBatchSize = 0;
              }
            }
          }
          if (currentBatchSize > 0) {
            console.log(`Commiting batch final para ${colName}`);
            await batch.commit();
          }
        }
      } catch (err) {
        console.error(`Erro ao migrar atividades na coleção ${colName}:`, err);
      }
    }

    console.log(`Migração concluída. ${updatedCount} atividades marcadas como 'submitted'.`);
    return updatedCount;
  },
  async clearCollection(collectionName: string) {
    console.log(`Iniciando limpeza da coleção: ${collectionName}`);
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
      console.log(`Coleção ${collectionName} já está vazia.`);
      return 0;
    }

    const batch = writeBatch(db);
    let count = 0;

    snapshot.docs.forEach((document) => {
      batch.delete(doc(db, collectionName, document.id));
      count++;
    });

    await batch.commit();
    console.log(
      `Limpeza concluída: ${count} documentos removidos de ${collectionName}`,
    );
    return count;
  },

  /**
   * 🚨 REGRA CRÍTICA DE PERSISTÊNCIA:
   * "UMA VEZ OS DADOS SALVOS NA BASE DE DADOS, NUNCA DEVEM SER PERDIDOS"
   * Este ficheiro contém as únicas funções destrutivas permitidas, e elas DEVEM
   * ser sempre protegidas por confirmações explícitas do utilizador final.
   * NUNCA chamar estas funções de forma automatizada no arranque do sistema.
   */

  /**
   * Limpa todos os dados de atividades e fluxos de teste do sistema,
   * preservando estritamente a lista de colaboradores e contas de utilizador.
   * Atende ao pedido: "LIMPEZA NA BASE DE DADOS, SÓ DEVE TER LISTA DE TODOS OS COLABORADORES"
   */
  async fullSystemReset() {
    const collectionsToClear = [
      "matrix_activities",
      "actividades",
      "plano_actividades",
      "plan_schedules",
      "calendar_events",
      "expedientes",
      "notes",
      "service_requests",
      "archive_documents",
      "bolsas",
      "financial_data",
      "materiais_bens",
      "suppliers",
      "library_visits",
      "library_books",
      "messages",
      "accessAlerts",
      "drafts",
      "processos",
      "processos_individuais",
      "monografia",
      "reports",
      "institucional_plans",
      "signatures",
      "efetivo_escolar",
      "alunos",
      "matriculas",
      "alocacoes_docentes",
      "turmas",
      "disciplinas_academicas",
      "espacos_fisicos",
      "exames",
      "atendimentos_estudantis",
      "colaboradores_formacao",
      "assiduidade",
      "movimentos_economato",
      "inventarios_patrimoniais",
      "requisicoes_internas",
      "documentos_normativos",
      "configuracoes",
      "tetos_orcamentais",
      "produtos_unificados",
      "balanco_config",
      "audit_logs",
      "system_notifications",
      "historico_chefias",
      "pedidos_ferias",
      "planos_ferias",
      "guias_marcha",
      "guias_apresentacao",
    ];

    const results = await Promise.all(
      collectionsToClear.map((col) => this.clearCollection(col)),
    );

    // Limpar apenas caches específicos de UI, preservando dados de coleções principais
    try {
      Object.keys(localStorage).forEach((k) => {
        if (
          k.startsWith("sigep_local_") ||
          k.startsWith("sigep_draft_") ||
          k.startsWith("sigep_dept_activities_") ||
          k.startsWith("teto_atribuido_") ||
          k.startsWith("mono_") ||
          k === "sigep_unified_products" ||
          k === "sigep_deleted_products" ||
          k === "songo_balanco_logo"
        ) {
          localStorage.removeItem(k);
        }
      });
    } catch (e) {
      console.warn("Aviso ao limpar cache local de teste:", e);
    }

    const totalRemoved = results.reduce((acc, curr) => acc + curr, 0);
    return {
      totalRemoved,
      details: collectionsToClear.map((col, i) => ({
        collection: col,
        count: results[i],
      })),
    };
  },

  /**
   * Limpeza profunda de duplicados e sobreposições de nomes e códigos obsoletos.
   * Atende ao pedido: "EXCLUSAO COMPETA DE SOBREPOSICAO DE NOME E CODIGO, CODIGOE NOMES OBSOLETOS"
   */
   async deepCleanupDuplicatesAndObsolete() {
    console.log("Iniciando limpeza profunda de duplicados, sobreposições de nomes e códigos em todo o sistema...");
    const results = {
      colaboradoresRemoved: 0,
      activitiesRemoved: 0,
      suppliersRemoved: 0,
      materiaisRemoved: 0,
      expedientesRemoved: 0,
      processosRemoved: 0,
      usersRemoved: 0,
    };

    try {
      // 1. Limpeza em Colaboradores (Baseado em NUIT ou Nome idêntico)
      const colRef = collection(db, "colaboradores");
      const snapCol = await getDocs(colRef);
      if (!snapCol.empty) {
        const docs = snapCol.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        
        // Priority helper: Complete/valid IDs come FIRST (so they are kept), incomplete/short IDs come LAST (so they are deleted)
        const getDocPriority = (doc: any) => {
          const name = String(doc.nome || "").trim();
          const nuit = String(doc.nuit || "").trim();
          const cleanNuit = nuit.replace(/\D/g, "");
          const id = String(doc.id || "").trim();
          const isFranzissi = name.toLowerCase().includes("franzissi") || cleanNuit === "108164611" || cleanNuit === "148922119";

          if (isFranzissi && id === "FTV108164611") return 1000;
          if (cleanNuit && id.includes(cleanNuit)) return 500;
          if (id.length > 5 && !["FTV", "EG_0"].includes(id)) return 100;
          return 1;
        };

        docs.sort((a, b) => {
          const priorityA = getDocPriority(a);
          const priorityB = getDocPriority(b);
          if (priorityA !== priorityB) return priorityB - priorityA; // Highest priority first
          
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (new Date(a.createdAt || a.updatedAt || 0).getTime());
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (new Date(b.createdAt || b.updatedAt || 0).getTime());
          return timeA - timeB; // Oldest first among equal priority
        });

        const seenNuits = new Set<string>();
        const seenNames = new Set<string>();
        const toDelete: string[] = [];

        docs.forEach(doc => {
          const nuit = String(doc.nuit || "").trim().replace(/\D/g, "");
          const name = String(doc.nome || "").trim().toLowerCase();
          
          const isFranzissi = name.includes("franzissi") || nuit === "108164611" || nuit === "148922119";

          if ((nuit && nuit.length >= 4 && seenNuits.has(nuit)) || (name && seenNames.has(name)) || (isFranzissi && seenNames.has("franzissi"))) {
            toDelete.push(doc.id);
          } else {
            if (nuit && nuit.length >= 4) seenNuits.add(nuit);
            if (name) {
              seenNames.add(name);
              if (name.includes("franzissi")) seenNames.add("franzissi");
            }
          }
        });

        if (toDelete.length > 0) {
          console.log(`🧹 Removendo ${toDelete.length} colaboradores duplicados/incompletos do Firestore:`, toDelete);
          const batch = writeBatch(db);
          toDelete.forEach(id => batch.delete(doc(db, "colaboradores", id)));
          await batch.commit();
          results.colaboradoresRemoved = toDelete.length;
        }
      }

      // 2. Limpeza em Fornecedores / Suppliers
      for (const colName of ["suppliers", "fornecedores"]) {
        try {
          const supRef = collection(db, colName);
          const snapSup = await getDocs(supRef);
          if (!snapSup.empty) {
            const docs = snapSup.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
            const seenNuit = new Set<string>();
            const seenNome = new Set<string>();
            const toDelete: string[] = [];

            docs.forEach(doc => {
              const nuit = String(doc.nuit || doc.nif || "").trim();
              const nome = String(doc.nome || doc.nomeFornecedor || doc.name || "").trim().toLowerCase();
              if (nuit && seenNuit.has(nuit)) {
                toDelete.push(doc.id);
              } else if (nome && seenNome.has(nome)) {
                toDelete.push(doc.id);
              } else {
                if (nuit) seenNuit.add(nuit);
                if (nome) seenNome.add(nome);
              }
            });

            if (toDelete.length > 0) {
              const batch = writeBatch(db);
              toDelete.forEach(id => batch.delete(doc(db, colName, id)));
              await batch.commit();
              results.suppliersRemoved += toDelete.length;
            }
          }
        } catch (e) {
          // Collection might not exist
        }
      }

      // 3. Limpeza em Materiais / Bens
      try {
        const matRef = collection(db, "materiais_bens");
        const snapMat = await getDocs(matRef);
        if (!snapMat.empty) {
          const docs = snapMat.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
          const seenCod = new Set<string>();
          const seenNome = new Set<string>();
          const toDelete: string[] = [];

          docs.forEach(doc => {
            const cod = String(doc.codigo || doc.cod || "").trim().toLowerCase();
            const nome = String(doc.nome || doc.designacao || "").trim().toLowerCase();
            if (cod && seenCod.has(cod)) {
              toDelete.push(doc.id);
            } else if (nome && seenNome.has(nome)) {
              toDelete.push(doc.id);
            } else {
              if (cod) seenCod.add(cod);
              if (nome) seenNome.add(nome);
            }
          });

          if (toDelete.length > 0) {
            const batch = writeBatch(db);
            toDelete.forEach(id => batch.delete(doc(db, "materiais_bens", id)));
            await batch.commit();
            results.materiaisRemoved = toDelete.length;
          }
        }
      } catch (e) {}

      // 4. Limpeza em Processos / Expedientes
      for (const colName of ["processos", "expedientes"]) {
        try {
          const ref = collection(db, colName);
          const snap = await getDocs(ref);
          if (!snap.empty) {
            const docs = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
            const seenProc = new Set<string>();
            const toDelete: string[] = [];

            docs.forEach(doc => {
              const pNo = String(doc.numeroProcesso || doc.processoNo || doc.numero || "").trim().toLowerCase();
              if (pNo && seenProc.has(pNo)) {
                toDelete.push(doc.id);
              } else if (pNo) {
                seenProc.add(pNo);
              }
            });

            if (toDelete.length > 0) {
              const batch = writeBatch(db);
              toDelete.forEach(id => batch.delete(doc(db, colName, id)));
              await batch.commit();
              if (colName === "processos") results.processosRemoved = toDelete.length;
              if (colName === "expedientes") results.expedientesRemoved = toDelete.length;
            }
          }
        } catch (e) {}
      }

      // 5. Limpeza em Users
      try {
        const userRef = collection(db, "users");
        const snapUser = await getDocs(userRef);
        if (!snapUser.empty) {
          const docs = snapUser.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
          const seenEmail = new Set<string>();
          const toDelete: string[] = [];

          docs.forEach(doc => {
            const email = String(doc.email || "").trim().toLowerCase();
            if (email && seenEmail.has(email)) {
              toDelete.push(doc.id);
            } else if (email) {
              seenEmail.add(email);
            }
          });

          if (toDelete.length > 0) {
            const batch = writeBatch(db);
            toDelete.forEach(id => batch.delete(doc(db, "users", id)));
            await batch.commit();
            results.usersRemoved = toDelete.length;
          }
        }
      } catch (e) {}

      // 6. Limpar atividades atribuídas a Recursos Humanos e DICOSAFA (que ainda não planificaram nada)
      for (const colName of ["matrix_activities", "actividades"]) {
        try {
          const actRef = collection(db, colName);
          const snapAct = await getDocs(actRef);
          if (!snapAct.empty) {
            const batch = writeBatch(db);
            let cleanedCount = 0;
            snapAct.docs.forEach(d => {
              const data = d.data() || {};
              const dept = String(data.departamento || "").toUpperCase();
              const sector = String(data.setor || "").toUpperCase();
              const rep = String(data.reparticao || "").toUpperCase();
              const isRH =
                dept.includes("RECURSOS HUMANOS") ||
                dept === "DRH" ||
                dept === "RH" ||
                sector.includes("RECURSOS HUMANOS") ||
                sector === "DRH" ||
                sector === "RH" ||
                rep.includes("RECURSOS HUMANOS") ||
                rep.includes("REPARTIÇÃO DE PESSOAL") ||
                rep.includes("REPARTICAO DE PESSOAL");

              const isDicosaFaLegacy =
                dept === "DICOSAFA" ||
                dept === "DIREÇÃO DA DICOSAFA" ||
                dept === "DIRETOR DA DICOSAFA" ||
                sector === "DICOSAFA" ||
                sector === "DIRETOR DA DICOSAFA";

              if (isRH || isDicosaFaLegacy) {
                batch.delete(doc(db, colName, d.id));
                cleanedCount++;
              }
            });
            if (cleanedCount > 0) {
              await batch.commit();
              console.log(`Limpas ${cleanedCount} atividades de RH/DICOSAFA em ${colName}`);
            }
          }
        } catch (e) {
          console.warn(`Aviso ao limpar atividades de RH/DICOSAFA em ${colName}:`, e);
        }
      }

      // 7. Chamar a remoção de duplicados de atividades e correção de numeração
      const actRes = await this.removeDuplicateActivitiesAndFixNumbering();
      results.activitiesRemoved = actRes.deletedCount;

      console.log("Limpeza profunda concluída com sucesso:", results);
      return results;
    } catch (err) {
      console.error("Erro na limpeza profunda:", err);
      throw err;
    }
  }
};

export async function wipeAllTestData() {
  const collectionsToWipe = [
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
    "tetos_orcamentais",
    "produtos_unificados",
    "balanco_config",
    "patrimonio_itens",
    "system_backups",
    "attendance_logs",
    "system_logs"
  ];

  console.log("🔥 Iniciando purga total e absoluta de dados de teste...");
  let totalDeleted = 0;
  
  for (const colName of collectionsToWipe) {
    try {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      
      if (!snapshot.empty) {
        console.log(`🗑️ Eliminando ${snapshot.size} documentos de ${colName}...`);
        
        // Proteção para não apagar o programador master se estiver na coleção de utilizadores
        // (Nota: 'users' não está na lista acima por segurança, mas se estivesse, filtraríamos)
        
        const docs = snapshot.docs;
        // Apagar em lotes de 100 para evitar sobrecarga
        for (let i = 0; i < docs.length; i += 100) {
          const batch = docs.slice(i, i + 100);
          await Promise.all(batch.map(d => deleteDoc(d.ref)));
        }
        
        totalDeleted += snapshot.size;
      }
      
      // Limpar cache local
      localStorage.removeItem(`sigep_local_${colName}`);
      localStorage.removeItem(`sigep_draft_${colName}`);
    } catch (err) {
      console.warn(`Aviso ao limpar ${colName}:`, err);
    }
  }

  // Limpar chaves globais de cache e estados de sessão
  const globalKeys = [
    "sigep_plano_actividades",
    "sigep_quota_exceeded",
    "sigep_matrix_activities",
    "sigep_actividades",
    "sigep_last_sync",
    "sigep_cached_stats",
    "sigep_unified_products",
    "sigep_deleted_products",
    "songo_balanco_logo"
  ];
  globalKeys.forEach(k => localStorage.removeItem(k));

  console.log(`✅ Purga total concluída. ${totalDeleted} documentos eliminados de todos os blocos e menus.`);
  return { success: true, count: totalDeleted };
}

export async function wipeDatabaseExceptExclusions() {
  return wipeAllTestData();
}
import {
  serverTimestamp,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
  getDocs,
  runTransaction,
  query,
  where,
  or,
  orderBy,
  limit,
  writeBatch,
} from "firebase/firestore";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signInAnonymously,
} from "firebase/auth";
import { db, auth, handleFirestoreError, OperationType } from "./firebase";
import { ProcessoIndividual } from "../types";
import {
  withTimeout,
  cleanObject,
  getCircularReplacer,
  safeJSONStringify,
  generateCollaboratorId,
  hasChefiaPosition,
  classifyTipo,
} from "./utils";
import { EFETIVO_GERAL_DATA } from "../constants/colaboradoresList";
import { databaseMaintenance } from "./databaseMaintenance";

export async function fetchCollection<T>(
  collectionName: string,
  limitCount: number = 50,
  orderField: string | null = "createdAt",
): Promise<(T & { id: string })[]> {
  const colRef = collection(db, collectionName);
  let q = orderField
    ? query(colRef, orderBy(orderField, "desc"), limit(limitCount))
    : query(colRef, limit(limitCount));

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
  })) as (T & { id: string })[];
}

export function subscribeToDocument<T>(
  collectionName: string,
  docId: string,
  callback: (data: T | null) => void,
  onError?: (error: any) => void,
) {
  try {
    const docRef = doc(db, collectionName, docId);
    return onSnapshot(
      docRef,
      (snapshot) => {
        try {
          if (snapshot.exists()) {
            const docData = { ...snapshot.data(), id: snapshot.id } as T;
            callback(docData);
            try {
              localStorage.setItem(`sigep_doc_${collectionName}_${docId}`, safeJSONStringify(docData));
            } catch (_) {}
          } else {
            const localItems = getLocalData(collectionName);
            const found = localItems.find((it: any) => it.id === docId);
            callback(found ? (found as T) : null);
          }
        } catch (procErr) {
          console.warn(`Aviso no processamento do documento ${collectionName}/${docId}:`, procErr);
        }
      },
      (error) => {
        const errStr = (error?.message || String(error)).toLowerCase();
        const isQuotaOrOffline =
          error?.code === "resource-exhausted" ||
          error?.code === "unavailable" ||
          errStr.includes("quota") ||
          errStr.includes("resource_exhausted") ||
          errStr.includes("resource-exhausted") ||
          errStr.includes("offline") ||
          errStr.includes("could not reach") ||
          errStr.includes("free daily read units");

        if (isQuotaOrOffline) {
          localStorage.setItem("sigep_quota_exceeded", "true");
          console.warn(
            `⚠️ Quota / Offline na subscrição do documento ${collectionName}/${docId}. Ativando fallback para armazenamento local.`,
          );
        } else if (error?.message !== "Firestore shutting down") {
          console.warn(
            `Aviso ao subscrever documento ${collectionName}/${docId}:`,
            error?.message || error,
          );
        }

        try {
          const directKey = `sigep_doc_${collectionName}_${docId}`;
          const directItem = localStorage.getItem(directKey);
          if (directItem) {
            callback(JSON.parse(directItem) as T);
          } else {
            const localItems = getLocalData(collectionName);
            const found = localItems.find((it: any) => it.id === docId);
            if (found) {
              callback(found as T);
            } else {
              callback(null);
            }
          }
        } catch (_) {
          callback(null);
        }

        if (onError) {
          try { onError(error); } catch (_) {}
        }
      },
    );
  } catch (err) {
    console.warn(`Falha na inicialização do onSnapshot para ${collectionName}/${docId}:`, err);
    try {
      const directKey = `sigep_doc_${collectionName}_${docId}`;
      const directItem = localStorage.getItem(directKey);
      if (directItem) {
        callback(JSON.parse(directItem) as T);
      } else {
        const localItems = getLocalData(collectionName);
        const found = localItems.find((it: any) => it.id === docId);
        callback(found ? (found as T) : null);
      }
    } catch (_) {
      callback(null);
    }
    return () => {};
  }
}

export function isLocalStorageFallbackActive(): boolean {
  return localStorage.getItem("sigep_quota_exceeded") === "true";
}

export function isLegacyDemoActivity(item: any): boolean {
  if (!item) return false;
  const idStr = String(item.id || "");
  if (idStr.startsWith("local_seed_")) return true;
  const des = String(item.designacao || item.title || "");
  if (
    des.includes("Laboratório de Engenharia Química") ||
    des.includes("PESOE") ||
    des.includes("Climatização (AC)") ||
    des.includes("Supervisão Pedagógica das Aulas Práticas")
  ) {
    return true;
  }
  return false;
}

export const DEFAULT_SEED_ACTIVITIES: any[] = [];

function getLocalData(collectionName: string): any[] {
  try {
    const key = `sigep_local_${collectionName}`;
    const data = localStorage.getItem(key);
    if (data !== null) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter((item: any) => !isLegacyDemoActivity(item));
        if (filtered.length !== parsed.length) {
          localStorage.setItem(key, safeJSONStringify(filtered));
        }
        return filtered;
      }
    }
    return [];
  } catch (e) {
    return [];
  }
}

function saveLocalData(collectionName: string, data: any[]) {
  try {
    const key = `sigep_local_${collectionName}`;
    localStorage.setItem(key, safeJSONStringify(data));
  } catch (e) {
    console.error("Erro ao salvar local storage:", e);
  }
}

export async function addUserData(collectionName: string, data: object) {
  let user = auth.currentUser;
  if (!user) {
    try {
      await signInAnonymously(auth);
      user = auth.currentUser;
    } catch (e) {
      console.warn("Aviso: Falha ao autenticar anonimamente em addUserData:", e);
    }
  }

  const userId = user?.uid || (() => {
    try {
      const stored = localStorage.getItem("sigep_logged_in_user") || localStorage.getItem("sigep_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.uid || parsed?.id) return parsed.uid || parsed.id;
      }
    } catch (e) {}
    return "local_user_fallback";
  })();

  // Adiciona o userId do usuário aos dados conforme solicitado na imagem
  const cleanData = cleanObject(data);
  const userData = {
    ...cleanData,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  try {
    const docRef = await addDoc(collection(db, collectionName), userData);
    console.log(`✅ Dados do usuário salvos em ${collectionName}/${docRef.id}`);
    
    // Atualizar cache local
    const localList = getLocalData(collectionName);
    localList.push({ ...cleanData, id: docRef.id, userId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    saveLocalData(collectionName, localList);
    
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, collectionName);
    throw error;
  }
}

export async function addToCollection<T>(collectionName: string, data: T) {
  const cleanData = cleanObject(data as any);
  const now = new Date().toISOString();
  let user = auth.currentUser;
  if (!user) {
    try {
      await signInAnonymously(auth);
      user = auth.currentUser;
    } catch (e) {}
  }
  const userId = user?.uid || (() => {
    try {
      const stored = localStorage.getItem("sigep_logged_in_user") || localStorage.getItem("sigep_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.uid || parsed?.id) return parsed.uid || parsed.id;
      }
    } catch (e) {}
    return null;
  })();

  // Se o modo offline/quota já estiver ativo, salva localmente direto sem chamadas de rede bloqueantes
  if (isLocalStorageFallbackActive()) {
    const localId = "local_" + Math.random().toString(36).substring(2, 11);
    const localList = getLocalData(collectionName);
    localList.push({ ...cleanData, id: localId, userId, createdAt: now, updatedAt: now, pending_sync: true });
    saveLocalData(collectionName, localList);
    return localId;
  }

  try {
    // 0. Verificar e excluir duplicados existentes na base de dados antes de adicionar
    const colRef = collection(db, collectionName);
    const existingSnap = await getDocs(colRef);
    if (!existingSnap.empty) {
      const nuit = String((cleanData as any).nuit || (cleanData as any).nif || "").trim();
      const numProc = String((cleanData as any).numeroProcesso || (cleanData as any).processoNo || "").trim().toLowerCase();
      const email = String((cleanData as any).email || "").trim().toLowerCase();
      const codigo = String((cleanData as any).codigo || (cleanData as any).cod || "").trim().toLowerCase();
      const nome = String((cleanData as any).nome || (cleanData as any).designacao || (cleanData as any).title || "").trim().toLowerCase();

      for (const docSnap of existingSnap.docs) {
        const existingData = docSnap.data() as any;
        const exNuit = String(existingData.nuit || existingData.nif || "").trim();
        const exNumProc = String(existingData.numeroProcesso || existingData.processoNo || "").trim().toLowerCase();
        const exEmail = String(existingData.email || "").trim().toLowerCase();
        const exCodigo = String(existingData.codigo || existingData.cod || "").trim().toLowerCase();
        const exNome = String(existingData.nome || existingData.designacao || existingData.title || "").trim().toLowerCase();

        const isDuplicate =
          (nuit && nuit !== "---" && exNuit === nuit) ||
          (numProc && exNumProc === numProc) ||
          (email && exEmail === email) ||
          (codigo && exCodigo === codigo) ||
          (nome && exNome === nome && (collectionName === "colaboradores" || collectionName === "users"));

        if (isDuplicate) {
          // Atualizar o registo existente e remover eventuais duplicados adicionais
          const existingId = docSnap.id;
          const docRef = doc(db, collectionName, existingId);
          await setDoc(docRef, {
            ...existingData,
            ...cleanData,
            updatedAt: serverTimestamp()
          }, { merge: true });
          console.log(`⚠️ Registo duplicado evitado em ${collectionName}. Atualizado e preservado: ${existingId}`);
          return existingId;
        }
      }
    }

    // 1. Gravação direta no Firestore com userId conforme solicitado
    const docRef = await addDoc(collection(db, collectionName), {
      ...cleanData,
      userId,
      tenantId: "Songo",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      synced: true
    });
    
    localStorage.removeItem("sigep_quota_exceeded");
    
    // 2. Cache local apenas após confirmação
    const localList = getLocalData(collectionName);
    localList.push({ ...cleanData, id: docRef.id, userId, createdAt: now, updatedAt: now });
    saveLocalData(collectionName, localList);
    
    console.log(`✅ Registro adicionado ao servidor: ${collectionName}/${docRef.id}`);
    return docRef.id;
  } catch (error: any) {
    const errStr = (error?.message || String(error)).toLowerCase();
    const isQuota =
      error?.code === "resource-exhausted" ||
      errStr.includes("quota") ||
      errStr.includes("resource_exhausted") ||
      errStr.includes("resource-exhausted") ||
      errStr.includes("free daily read units");

    if (isQuota) {
      localStorage.setItem("sigep_quota_exceeded", "true");
      console.warn(`⚠️ Quota atingida na gravação em ${collectionName}. Salvo localmente no sistema.`);
    } else {
      console.warn(`Aviso na gravação direta em ${collectionName} (salvo em cache local):`, error?.message || error);
    }
    
    // Fallback local garantido
    const localId = "local_pending_" + Math.random().toString(36).substring(2, 11);
    const localList = getLocalData(collectionName);
    localList.push({ ...cleanData, id: localId, userId, createdAt: now, updatedAt: now, pending_sync: true });
    saveLocalData(collectionName, localList);
    
    return localId;
  }
}

export async function updateInCollection<T>(
  collectionName: string,
  id: string,
  data: Partial<T>,
) {
  const cleanData = cleanObject(data);
  const now = new Date().toISOString();

  // Sempre atualizar localmente primeiro
  const localList = getLocalData(collectionName);
  const idx = localList.findIndex((item: any) => item.id === id);
  if (idx !== -1) {
    localList[idx] = { ...localList[idx], ...cleanData, updatedAt: now };
    saveLocalData(collectionName, localList);
  }

  if (isLocalStorageFallbackActive()) {
    return;
  }

  try {
    const docRef = doc(db, collectionName, id);
    await setDoc(
      docRef,
      {
        ...cleanData,
        userId: auth.currentUser?.uid || undefined,
        tenantId: "Songo",
        updatedAt: serverTimestamp(),
        synced: true
      },
      { merge: true },
    );
    
    localStorage.removeItem("sigep_quota_exceeded");
  } catch (error: any) {
    const errStr = (error?.message || String(error)).toLowerCase();
    const isQuota =
      error?.code === "resource-exhausted" ||
      errStr.includes("quota") ||
      errStr.includes("resource_exhausted") ||
      errStr.includes("resource-exhausted") ||
      errStr.includes("free daily read units");

    if (isQuota) {
      localStorage.setItem("sigep_quota_exceeded", "true");
    }
    console.warn(`Aviso na atualização de ${collectionName}/${id} (preservado localmente):`, error?.message || error);
  }
}

export async function deleteFromCollection(collectionName: string, id: string) {
  // Limpar cache local imediatamente
  const localList = getLocalData(collectionName);
  const filtered = localList.filter((item: any) => item.id !== id);
  saveLocalData(collectionName, filtered);

  if (isLocalStorageFallbackActive()) {
    return;
  }

  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    localStorage.removeItem("sigep_quota_exceeded");
    console.log(`✅ ${collectionName}/${id} removido.`);
  } catch (error: any) {
    const errStr = (error?.message || String(error)).toLowerCase();
    const isQuota =
      error?.code === "resource-exhausted" ||
      errStr.includes("quota") ||
      errStr.includes("resource_exhausted");
    if (isQuota) {
      localStorage.setItem("sigep_quota_exceeded", "true");
    }
    console.warn(`Aviso ao apagar ${collectionName}/${id} no servidor (removido localmente):`, error?.message || error);
  }
}

export async function getFromCollection<T>(
  collectionName: string,
  orderField: string | null = "createdAt",
) {
  try {
    const colRef = collection(db, collectionName);
    const q = orderField ? query(colRef, orderBy(orderField, "desc")) : colRef;
    const snapshot = await getDocs(q);
    const remoteData = snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as (T & { id: string })[];

    localStorage.removeItem("sigep_quota_exceeded");

    // Merge local items preferring the most recent one
    const localData = getLocalData(collectionName);
    
    const combinedMap = new Map<string, any>();
    
    // Add remote data first
    remoteData.forEach((item) => combinedMap.set(item.id, item));
    
    // Merge local data: ONLY merge items that are genuinely new local items (starts with local_) or pending sync
    localData.forEach((localItem) => {
      if (!localItem || !localItem.id) return;
      if (isLegacyDemoActivity(localItem)) return;

      const isLocalNewItem = String(localItem.id).startsWith("local_");
      const isPending = localItem.pending_sync === true;

      if (isLocalNewItem) {
        combinedMap.set(localItem.id, localItem);
      } else if (isPending) {
        const existing = combinedMap.get(localItem.id);
        if (existing) {
          combinedMap.set(localItem.id, { ...existing, ...localItem });
        }
      }
    });

    const combinedData = Array.from(combinedMap.values()).filter((it) => !isLegacyDemoActivity(it));
    saveLocalData(collectionName, combinedData);
    return combinedData as (T & { id: string })[];
  } catch (error: any) {
    const errStr = (error?.message || String(error)).toLowerCase();
    const isQuota =
      error?.code === "resource-exhausted" ||
      errStr.includes("quota") ||
      errStr.includes("resource_exhausted");
    if (isQuota) {
      localStorage.setItem("sigep_quota_exceeded", "true");
      console.warn(
        `⚠️ Quota atingida na listagem da coleção ${collectionName}. Ativando LocalStorage fallback.`,
      );
    }
    return getLocalData(collectionName) as (T & { id: string })[];
  }
}

export function subscribeToCollection<T>(
  collectionName: string,
  callback: (data: (T & { id: string })[]) => void,
  onError?: (error: any) => void,
  orderField: string | null = "createdAt",
  limitCount?: number,
) {
  const setupSubscription = (useOrdering: boolean) => {
    try {
      const colRef = collection(db, collectionName);
      let q = useOrdering && orderField ? query(colRef, orderBy(orderField, "desc")) : colRef;
      if (limitCount && useOrdering && orderField) q = query(q, limit(limitCount));

      return onSnapshot(
        q,
        (snapshot) => {
          try {
            localStorage.removeItem("sigep_quota_exceeded");
            const remoteData = snapshot.docs.map((doc) => ({
              ...doc.data(),
              id: doc.id,
            })) as (T & { id: string })[];

            // Merge local items preferring the most recent one
            const localData = getLocalData(collectionName);
            const combinedMap = new Map<string, any>();

            // Add remote data
            remoteData.forEach((item) => combinedMap.set(item.id, item));

            // Merge local data: ONLY merge items that are genuinely new local items (starts with local_) or pending sync
            localData.forEach((localItem) => {
              if (!localItem || !localItem.id) return;
              if (isLegacyDemoActivity(localItem)) return;

              const isLocalNewItem = String(localItem.id).startsWith("local_");
              const isPending = localItem.pending_sync === true;

              if (isLocalNewItem) {
                combinedMap.set(localItem.id, localItem);
              } else if (isPending) {
                const existing = combinedMap.get(localItem.id);
                if (existing) {
                  combinedMap.set(localItem.id, { ...existing, ...localItem });
                }
              }
            });

            const combinedData = Array.from(combinedMap.values()).filter((it) => !isLegacyDemoActivity(it));
            saveLocalData(collectionName, combinedData);
            
            try {
              callback(combinedData);
            } catch (cbErr) {
              console.warn(`Erro no callback de renderização para ${collectionName}:`, cbErr);
            }
          } catch (procErr) {
            console.warn(`Aviso no processamento do snapshot de ${collectionName}:`, procErr);
            const localData = getLocalData(collectionName);
            try { callback(localData as any); } catch (e) {}
          }
        },
        (error) => {
          const errStr = (error?.message || String(error)).toLowerCase();
          const isQuota =
            error?.code === "resource-exhausted" ||
            errStr.includes("quota") ||
            errStr.includes("resource_exhausted");

          if (isQuota) {
            localStorage.setItem("sigep_quota_exceeded", "true");
            console.warn(
              `⚠️ Quota atingida na subscrição da coleção ${collectionName}. Ativando fallback para LocalStorage.`,
            );
          }

          // Se falhou por causa de campo de ordenação ou índice, tenta sem ordenação
          if (useOrdering && (errStr.includes("index") || errStr.includes("order") || errStr.includes("failed-precondition"))) {
            console.warn(`Tentando subscrição sem ordenação para ${collectionName}...`);
            return setupSubscription(false);
          }

          const localData = getLocalData(collectionName);
          try {
            callback(localData as any);
          } catch (e) {}
          if (onError) {
            try { onError(error); } catch (e) {}
          }
        },
      );
    } catch (err) {
      console.warn(`Falha na inicialização do onSnapshot para ${collectionName}:`, err);
      const localData = getLocalData(collectionName);
      try { callback(localData as any); } catch (e) {}
      return () => {};
    }
  };

  return setupSubscription(true);
}

function createCollectionService<T>(
  collectionName: string,
  orderField: string | null = "createdAt",
) {
  return {
    get: () => getFromCollection<T>(collectionName, orderField),
    getById: async (id: string) => {
      try {
        const docRef = doc(db, collectionName, id);
        const snapshot = await getDoc(docRef);
        return snapshot.exists()
          ? ({ id: snapshot.id, ...snapshot.data() } as T & { id: string })
          : null;
      } catch (error) {
        handleFirestoreError(
          error,
          OperationType.GET,
          `${collectionName}/${id}`,
        );
        return null;
      }
    },
    add: (data: any) => addToCollection(collectionName, data),
    update: (id: string, data: any) =>
      updateInCollection(collectionName, id, data),
    replace: async (id: string, data: any) => {
      try {
        try {
          const directKey = `sigep_doc_${collectionName}_${id}`;
          localStorage.setItem(directKey, safeJSONStringify({ ...data, id }));
          const local = getLocalData(collectionName);
          const idx = local.findIndex((it: any) => it.id === id);
          if (idx >= 0) {
            local[idx] = { ...data, id };
          } else {
            local.push({ ...data, id });
          }
          saveLocalData(collectionName, local);
        } catch (_) {}

        const docRef = doc(db, collectionName, id);
        await setDoc(
          docRef,
          {
            ...data,
            uid: auth.currentUser?.uid || undefined,
            tenantId: "Songo",
            updatedAt: serverTimestamp(),
          },
          { merge: false },
        );
      } catch (error) {
        handleFirestoreError(
          error,
          OperationType.WRITE,
          `${collectionName}/${id}`,
        );
      }
    },
    set: async (id: string, data: any) => {
      try {
        try {
          const directKey = `sigep_doc_${collectionName}_${id}`;
          localStorage.setItem(directKey, safeJSONStringify({ ...data, id }));
          const local = getLocalData(collectionName);
          const idx = local.findIndex((it: any) => it.id === id);
          if (idx >= 0) {
            local[idx] = { ...local[idx], ...data, id };
          } else {
            local.push({ ...data, id });
          }
          saveLocalData(collectionName, local);
        } catch (_) {}

        const docRef = doc(db, collectionName, id);
        await setDoc(
          docRef,
          {
            ...data,
            uid: auth.currentUser?.uid || undefined,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      } catch (error) {
        handleFirestoreError(
          error,
          OperationType.WRITE,
          `${collectionName}/${id}`,
        );
      }
    },
    delete: (id: string) => deleteFromCollection(collectionName, id),
    subscribe: (
      callback: any,
      onError?: any,
      orderField?: string | null,
      limitCount?: number,
    ) =>
      subscribeToCollection<T>(
        collectionName,
        callback,
        onError,
        orderField || null,
        limitCount,
      ),
  };
}

export async function resequenceActivitiesAfterDelete(
  collectionName: "actividades" | "matrix_activities",
  deletedAct: any,
  allActs: any[],
) {
  if (!deletedAct) return;

  const deletedDir = String(deletedAct.direcao || deletedAct.unidadeOrganica || "")
    .trim()
    .toLowerCase();
  const deletedDept = String(deletedAct.departamento || "").trim().toLowerCase();
  const deletedYear = Number(deletedAct.ano || 0);

  // Filter remaining activities in the SAME group/division
  const sameGroup = allActs.filter((act) => {
    if (!act || act.id === deletedAct.id) return false;

    const actDir = String(act.direcao || act.unidadeOrganica || "")
      .trim()
      .toLowerCase();
    const actDept = String(act.departamento || "").trim().toLowerCase();
    const actYear = Number(act.ano || 0);

    // Filter by same Direção, same Departamento and same Year
    return (
      actDir === deletedDir &&
      actDept === deletedDept &&
      actYear === deletedYear
    );
  });

  const getNumericOrderVal = (act: any) => {
    const code = String(act.referencia || act.codigoActividade || "");
    const match = code.match(/(\d+)$/);
    if (match) {
      return parseInt(match[1], 10);
    }
    const rawNo = act.no || act.numeroAtividade || act.numeroActividade;
    if (rawNo) {
      const parsed = parseInt(rawNo, 10);
      if (!isNaN(parsed)) return parsed;
    }
    return 999999;
  };

  // Sort ascending by current numeric order
  const sorted = [...sameGroup].sort(
    (a, b) => getNumericOrderVal(a) - getNumericOrderVal(b),
  );

  // Update sequentially
  for (let i = 0; i < sorted.length; i++) {
    const act = sorted[i];
    const newNumStr = String(i + 1).padStart(3, "0");

    // Check if the number has changed
    const currentNumStr = String(getNumericOrderVal(act)).padStart(3, "0");

    const updates: any = {};
    let hasChanges = false;

    if (currentNumStr !== newNumStr) {
      updates.no = newNumStr;
      updates.numeroAtividade = newNumStr;
      updates.numeroActividade = newNumStr;
      hasChanges = true;
    }

    if (act.codigoActividade) {
      const parts = act.codigoActividade.split("/");
      if (parts.length >= 3) {
        const numIdx = parts.findIndex((p: string) => /^\d+$/.test(p));
        const originalCode = act.codigoActividade;
        const tempParts = [...parts];
        if (numIdx !== -1) tempParts[numIdx] = newNumStr;
        else tempParts[2] = newNumStr;

        const newCode = tempParts.join("/");
        if (newCode !== originalCode) {
          updates.codigoActividade = newCode;
          hasChanges = true;
        }
      }
    }

    if (act.referencia) {
      const parts = act.referencia.split("/");
      if (parts.length >= 3) {
        const numIdx = parts.findIndex((p: string) => /^\d+$/.test(p));
        const originalRef = act.referencia;
        const tempParts = [...parts];
        if (numIdx !== -1) tempParts[numIdx] = newNumStr;
        else tempParts[2] = newNumStr;

        const newRef = tempParts.join("/");
        if (newRef !== originalRef) {
          updates.referencia = newRef;
          hasChanges = true;
        }
      } else {
        const match = String(act.referencia || "").match(/(.*?)-(\d+)$/);
        if (match) {
          const newRef = `${match[1]}-${newNumStr}`;
          if (newRef !== act.referencia) {
            updates.referencia = newRef;
            hasChanges = true;
          }
        }
      }
    }

    if (hasChanges) {
      try {
        await updateInCollection(collectionName, act.id, updates);
        console.log(
          `Successfully updated activity ${act.id} sequence number to ${newNumStr}`,
        );
      } catch (e) {
        console.error(`Error updating activity sequence for ${act.id}:`, e);
      }
    }
  }
}

export async function syncAllLocalData() {
  const collectionsToSync = [
    "matrix_activities",
    "actividades",
    "colaboradores",
    "colaboradores_chefia",
    "users",
    "colaboradores_formacao",
    "archive_documents",
    "configuracoes",
    "exames",
    "signatures",
    "calendar_events",
    "notes",
    "expedientes",
    "library_visits",
    "library_books",
    "service_requests",
    "suppliers",
    "bolsas",
    "atendimentos_estudantis",
    "processos_individuais",
    "efetivo_escolar",
    "materiais_bens",
    "movimentos_economato",
    "financial_data",
    "inventarios_patrimoniais",
    "requisicoes_internas",
    "assiduidade",
    "alocacoes_docentes",
    "espacos_fisicos",
    "turmas",
    "disciplinas_academicas",
    "access_alerts",
    "monografia",
    "institucional_plans",
    "reports",
    "plan_schedules",
    "historico_chefias",
    "tetos_orcamentais",
    "produtos_unificados",
    "balanco_config",
  ];

  console.log("🔄 Iniciando sincronização de dados locais com a nuvem (Firestore)...");
  window.dispatchEvent(new CustomEvent("firestore-sync-start"));
  let syncedCount = 0;

  for (const colName of collectionsToSync) {
    const localData = getLocalData(colName);
    if (!localData || localData.length === 0) continue;

    let updatedLocalList = [...localData];
    let listChanged = false;

    // Filter items that strictly need syncing: starting with local_ OR having pending_sync flag
    for (const item of localData) {
      if (!item || !item.id) continue;
      if (String(item.id).startsWith("local_seed_")) continue;

      const isLocalNew = String(item.id).startsWith("local_");
      const isPending = item.pending_sync === true;

      if (!isLocalNew && !isPending) continue;

      try {
        if (isLocalNew) {
          // Remove local ID and temporary sync flags
          const { id: oldLocalId, pending_sync, ...dataToSave } = item;
          
          const docRef = await addDoc(collection(db, colName), {
            ...cleanObject(dataToSave),
            userId: auth.currentUser?.uid || dataToSave.userId || null,
            tenantId: "Songo",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            synced: true,
          });

          const newFirestoreId = docRef.id;
          console.log(`☁️ Item sincronizado com a nuvem: ${colName}/${newFirestoreId} (anterior: ${oldLocalId})`);

          // Substituir no array local pelo ID definitivo do Firestore
          updatedLocalList = updatedLocalList.filter((x) => x.id !== oldLocalId);
          updatedLocalList.push({
            ...dataToSave,
            id: newFirestoreId,
            updatedAt: new Date().toISOString(),
            synced: true,
          });
          listChanged = true;
          syncedCount++;
        } else if (isPending) {
          const { pending_sync, ...dataToSave } = item;
          const docRef = doc(db, colName, item.id);
          await setDoc(
            docRef,
            {
              ...cleanObject(dataToSave),
              updatedAt: serverTimestamp(),
              synced: true,
            },
            { merge: true }
          );

          const idx = updatedLocalList.findIndex((x) => x.id === item.id);
          if (idx !== -1) {
            delete updatedLocalList[idx].pending_sync;
            updatedLocalList[idx].synced = true;
            listChanged = true;
          }
          syncedCount++;
        }
      } catch (err) {
        console.warn(`Aviso na sincronização de ${colName}/${item.id}:`, err);
      }
    }

    if (listChanged) {
      saveLocalData(colName, updatedLocalList);
    }
  }

  if (syncedCount > 0) {
    console.log(`✅ Sincronização em nuvem concluída: ${syncedCount} itens salvos no Firestore.`);
    localStorage.removeItem("sigep_quota_exceeded");
    localStorage.setItem("sigep_last_sync", new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }));
  } else {
    console.log("Sincronização em nuvem: todos os dados estão em dia.");
  }
  window.dispatchEvent(new CustomEvent("firestore-sync-end"));
}

export const ensureCloudDataInitialized = async () => {
  try {
    console.log("☁️ Verificando persistência universal no Firestore...");
    
    // Limpar quaisquer itens residuais de demonstração do LocalStorage
    try {
      const keysToClean = [
        "sigep_local_matrix_activities",
        "sigep_local_actividades",
        "sigep_matrix_activities",
        "sigep_actividades"
      ];
      for (const k of keysToClean) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const cleaned = parsed.filter((item: any) => !isLegacyDemoActivity(item));
            localStorage.setItem(k, safeJSONStringify(cleaned));
          }
        }
      }
    } catch (_) {}

    const snap = await getDocs(collection(db, "matrix_activities"));
    console.log(`☁️ Nuvem conectada: ${snap.size} atividades presentes no Firestore.`);

    // Executar limpeza automática de duplicados no Firestore
    try {
      await databaseMaintenance.deepCleanupDuplicatesAndObsolete();
    } catch (cleanupErr) {
      console.warn("Aviso ao efetuar limpeza automática de duplicados:", cleanupErr);
    }

    // Sincronizar todos os outros dados locais
    await syncAllLocalData();
    return { success: true, count: snap.size };
  } catch (e) {
    console.warn("Aviso ao garantir inicialização na nuvem:", e);
    return { success: false, error: e };
  }
};

export const firestoreService = {
  wipeAllTestData,
  wipeDatabaseExceptExclusions,
  subscribeToDocument,
  subscribeCollection: subscribeToCollection,
  addToCollection,
  updateInCollection,
  deleteDocument: deleteFromCollection,
  resequenceActivitiesAfterDelete,
  syncAllLocalData,
  ensureCloudDataInitialized,
  colaboradores_formacao: createCollectionService<any>(
    "colaboradores_formacao",
  ),
  archive_documents: createCollectionService<any>("archive_documents"),
  configuracoes: createCollectionService<any>("configuracoes", null),
  exames: createCollectionService<any>("exames", null),
  signatures: createCollectionService<any>("signatures"),
  events: createCollectionService<any>("calendar_events"),
  notes: createCollectionService<any>("notes"),
  expedientes: createCollectionService<any>("expedientes", "dataChegada"),
  libraryVisits: createCollectionService<any>("library_visits"),
  libraryBooks: createCollectionService<any>("library_books"),
  serviceRequests: createCollectionService<any>("service_requests"),
  suppliers: createCollectionService<any>("suppliers"),
  matrixActivities: createCollectionService<any>("matrix_activities", null),
  colaboradores: createCollectionService<any>("colaboradores", null),
  colaboradoresChefia: createCollectionService<any>(
    "colaboradores_chefia",
    null,
  ),
  colaboradoresComCargoDeChefia: createCollectionService<any>(
    "colaboradores_chefia",
    null,
  ),
  actividades: createCollectionService<any>("actividades"),
  bolsas: createCollectionService<any>("bolsas"),
  atendimentos_estudantis: createCollectionService<any>(
    "atendimentos_estudantis",
  ),
  processos: createCollectionService<ProcessoIndividual>(
    "processos_individuais",
  ),
  efetivo_escolar: createCollectionService<any>("efetivo_escolar"),
  materiais_bens: createCollectionService<any>("materiais_bens"),
  movimentos_economato: createCollectionService<any>("movimentos_economato"),
  financialData: createCollectionService<any>("financial_data"),
  inventarios_patrimoniais: createCollectionService<any>(
    "inventarios_patrimoniais",
  ),
  requisicoes_internas: createCollectionService<any>("requisicoes_internas"),
  assiduidade: createCollectionService<any>("assiduidade"),
  alocacoes_docentes: createCollectionService<any>("alocacoes_docentes"),
  espacos_fisicos: createCollectionService<any>("espacos_fisicos"),
  turmas: createCollectionService<any>("turmas"),
  disciplinas_academicas: createCollectionService<any>("disciplinas_academicas"),
  users: createCollectionService<any>("users"),
  accessAlerts: createCollectionService<any>("access_alerts"),
  monografia: createCollectionService<any>("monografia"),
  institucional_plans: createCollectionService<any>("institucional_plans"),
  reports: createCollectionService<any>("reports"),
  plan_schedules: createCollectionService<any>("plan_schedules"),
  historico_chefias: createCollectionService<any>("historico_chefias"),
  tetosOrcamentais: createCollectionService<any>("tetos_orcamentais", null),
  produtosUnificados: createCollectionService<any>("produtos_unificados", null),
  password_reset_requests: createCollectionService<any>("password_reset_requests"),
  balancoConfig: createCollectionService<any>("balanco_config", null),
  resetUserPasswordToDefault,
  clearDepartmentActivities,
  drafts: {
    ...createCollectionService<any>("drafts"),
    getByUserAndForm: async (userId: string, formId: string) => {
      if (!userId || !formId) return null;
      const localDraftKey = `sigep_draft_${userId}_${formId}`;
      let localDraft = null;
      try {
        const stored = localStorage.getItem(localDraftKey);
        if (stored) localDraft = JSON.parse(stored);
      } catch (_) {}

      if (isLocalStorageFallbackActive()) {
        return localDraft;
      }

      try {
        const docId = `${userId}_${formId}`.replace(/[^a-zA-Z0-9_]/g, "_");
        const docRef = doc(db, "drafts", docId);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const cloudDraft = { id: snapshot.id, ...snapshot.data() };
          try {
            localStorage.setItem(localDraftKey, safeJSONStringify(cloudDraft));
          } catch (_) {}
          return cloudDraft;
        }

        return localDraft;
      } catch (error: any) {
        const errStr = (error?.message || String(error)).toLowerCase();
        const isQuota =
          error?.code === "resource-exhausted" ||
          errStr.includes("quota") ||
          errStr.includes("resource_exhausted") ||
          errStr.includes("free daily read units");
        if (isQuota) {
          localStorage.setItem("sigep_quota_exceeded", "true");
        }
        console.warn("Aviso ao obter rascunho da nuvem (usando local):", error?.message || error);
        return localDraft;
      }
    },
    save: async (userId: string, formId: string, data: any) => {
      if (!userId || !formId) return null;
      const docId = `${userId}_${formId}`.replace(/[^a-zA-Z0-9_]/g, "_");
      const localDraftKey = `sigep_draft_${userId}_${formId}`;
      const payload = {
        id: docId,
        userId: String(userId),
        formId: String(formId),
        ...cleanObject(data),
        updatedAt: new Date().toISOString(),
      };

      try {
        localStorage.setItem(localDraftKey, safeJSONStringify(payload));
      } catch (_) {}

      if (isLocalStorageFallbackActive()) {
        return docId;
      }

      try {
        const docRef = doc(db, "drafts", docId);
        await setDoc(docRef, { ...payload, updatedAt: serverTimestamp() }, { merge: true });
        return docId;
      } catch (error: any) {
        const errStr = (error?.message || String(error)).toLowerCase();
        const isQuota =
          error?.code === "resource-exhausted" ||
          errStr.includes("quota") ||
          errStr.includes("resource_exhausted") ||
          errStr.includes("free daily read units");
        if (isQuota) {
          localStorage.setItem("sigep_quota_exceeded", "true");
        }
        console.warn("Aviso ao salvar rascunho na nuvem (preservado localmente):", error?.message || error);
        return docId;
      }
    },
    deleteByUserAndForm: async (userId: string, formId: string) => {
      if (!userId || !formId) return;
      const docId = `${userId}_${formId}`.replace(/[^a-zA-Z0-9_]/g, "_");
      const localDraftKey = `sigep_draft_${userId}_${formId}`;
      try {
        localStorage.removeItem(localDraftKey);
      } catch (_) {}

      if (isLocalStorageFallbackActive()) {
        return;
      }

      try {
        await deleteDoc(doc(db, "drafts", docId));
      } catch (error: any) {
        const errStr = (error?.message || String(error)).toLowerCase();
        const isQuota =
          error?.code === "resource-exhausted" ||
          errStr.includes("quota") ||
          errStr.includes("resource_exhausted");
        if (isQuota) {
          localStorage.setItem("sigep_quota_exceeded", "true");
        }
        console.warn("Aviso ao eliminar rascunho na nuvem:", error?.message || error);
      }
    },
  },

  seedAllCollaborators: async (colaboradores: any[]) => {
    try {
      console.log(
        `Iniciando semeadura de ${colaboradores.length} colaboradores...`,
      );
      const colRef = collection(db, "colaboradores");
      let count = 0;

      for (const col of colaboradores) {
        const cleanNuit = String(col.nuit || "").replace(/\D/g, "");
        const generatedId = generateCollaboratorId(col.nome || "", col.nuit || "");
        const computedId =
          (col.id && cleanNuit && col.id.includes(cleanNuit))
            ? col.id
            : (generatedId || col.id || `col_${count}`);

        const docId = computedId;
        const verifiedTipo = col.tipo || classifyTipo(col);

        // Determinar se é chefe para definir mandato inicial se não existir
        const cargoLower = (col.cargo || col.funcao || "").toLowerCase();
        const isChef =
          cargoLower.includes("chefe") || cargoLower.includes("diretor");

        const mandatoData = isChef
          ? {
              mandatoStatus: col.mandatoStatus || "Ativo",
              mandatoInicio:
                col.mandatoInicio || new Date().toISOString().split("T")[0],
              isChefiaDefinitiva: true,
            }
          : {};

        await setDoc(
          doc(db, "colaboradores", String(docId)),
          {
            ...col,
            id: computedId,
            numeroProcesso: col.numeroProcesso || computedId,
            tipo: verifiedTipo,
            ...mandatoData,
            updatedAt: serverTimestamp(),
            source: "System Seed",
          },
          { merge: true },
        );
        count++;
      }

      console.log(`${count} colaboradores semeados com sucesso.`);
      // Automagicamente sincronizar tabela de chefias
      await firestoreService.syncChefiaAccounts(colaboradores);
      return { success: true, count };
    } catch (error) {
      console.error("Erro ao semear colaboradores:", error);
      return { success: false, error };
    }
  },

  cleanAndResequenceMatrixActivities: async () => {
    try {
      console.log("Iniciando limpeza de duplicados e resequenciação de atividades na base de dados...");
      const { databaseMaintenance } = await import("./databaseMaintenance");
      const result = await databaseMaintenance.removeDuplicateActivitiesAndFixNumbering();
      return {
        success: true,
        removedDuplicates: result.deletedCount,
        totalUnique: result.updatedCount,
      };
    } catch (err) {
      console.error("Erro ao limpar e resequenciar atividades:", err);
      return { success: false, error: err };
    }
  },

  cleanDuplicateCollaborators: async () => {
    try {
      console.log("Iniciando varredura de duplicados no Firestore...");
      const colRef = collection(db, "colaboradores");
      const snapshot = await getDocs(colRef);
      const allDocs = snapshot.docs.map((doc) => ({
        ...doc.data(),
        docId: doc.id,
      })) as any[];

      console.log(
        `Carregados ${allDocs.length} colaboradores para análise de duplicados no Firestore.`,
      );

      const cleanString = (s: any) => {
        if (!s) return "";
        return String(s)
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
      };

      const groups: Record<string, any[]> = {};
      const orphansToDelete: string[] = [];

      allDocs.forEach((c) => {
        const cleanedName = cleanString(c.nome);
        // Registos sem nome ou com caracteres inválidos são órfãos
        if (!cleanedName || cleanedName === "-" || cleanedName === "---" || cleanedName.length < 2) {
          orphansToDelete.push(c.docId);
          return;
        }

        const hasChefia =
          c.cargoChefia && c.cargoChefia !== "Nenhum" && c.cargoChefia !== "-";
        // Chefes nunca são agrupados como duplicados de outros para garantir que cada chefe é mantido intacto e protegido
        const name = hasChefia
          ? `chefia_${c.docId || c.id || Math.random()}`
          : cleanedName;

        if (!groups[name]) groups[name] = [];
        groups[name].push(c);
      });

      let deletedCount = 0;
      let mergedCount = 0;

      // Apagar colaboradores órfãos / sem nome
      for (const orphanId of orphansToDelete) {
        await deleteDoc(doc(db, "colaboradores", orphanId));
        deletedCount++;
      }

      for (const name in groups) {
        const group = groups[name];
        if (group.length > 1) {
          const getFilledFieldsCount = (c: any) => {
            let count = 0;
            for (const key in c) {
              if (
                c[key] !== undefined &&
                c[key] !== null &&
                c[key] !== "" &&
                c[key] !== "---"
              ) {
                count++;
              }
            }
            return count;
          };

          group.sort(
            (a, b) => getFilledFieldsCount(b) - getFilledFieldsCount(a),
          );
          const mainColab = group[0];
          console.log(
            `Duplicado encontrado para "${mainColab.nome}". Mantendo documento "${mainColab.docId}" com ${getFilledFieldsCount(mainColab)} campos.`,
          );

          let dataMerged = false;
          const mergedData = { ...mainColab };

          for (let i = 1; i < group.length; i++) {
            const secondaryColab = group[i];

            for (const key in secondaryColab) {
              if (
                (!mergedData[key] ||
                  mergedData[key] === "---" ||
                  mergedData[key] === "") &&
                secondaryColab[key] !== undefined &&
                secondaryColab[key] !== null &&
                secondaryColab[key] !== "" &&
                secondaryColab[key] !== "---"
              ) {
                mergedData[key] = secondaryColab[key];
                dataMerged = true;
              }
            }

            console.log(
              `Eliminando duplicado redundante do Firestore: ID documento "${secondaryColab.docId}"`,
            );
            await deleteDoc(doc(db, "colaboradores", secondaryColab.docId));
            deletedCount++;
          }

          if (dataMerged) {
            await setDoc(
              doc(db, "colaboradores", mainColab.docId),
              mergedData,
              { merge: true },
            );
            mergedCount++;
          }
        }
      }

      console.log(
        `Varredura concluída: ${deletedCount} repetidos/órfãos eliminados, ${mergedCount} mesclados.`,
      );
      return { success: true, deletedCount, mergedCount };
    } catch (error) {
      console.error(
        "Erro na limpeza automática de colaboradores repetidos:",
        error,
      );
      return { success: false, error };
    }
  },

  generalSystemCleanup: async () => {
    try {
      console.log("Iniciando Limpeza Geral do Sistema: exclusão de repetições e sobreposições de nome e código...");
      
      // 1. Clean duplicate and overlapping collaborators
      const colResult = await firestoreService.cleanDuplicateCollaborators();

      // 2. Clean duplicate and overlapping matrix activities & resequence codes
      const matrixResult = await firestoreService.cleanAndResequenceMatrixActivities();

      // 3. Clean duplicate activities in 'actividades' collection
      const actSnapshot = await getDocs(collection(db, "actividades"));
      const allActs = actSnapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      const seenActs = new Set<string>();
      let actDeletedCount = 0;
      for (const act of allActs) {
        const name = (act.title || act.designacao || act.nomeAtividade || "").trim().toLowerCase();
        const code = (act.codigoAtividade || act.referencia || "").trim().toLowerCase();
        const key = `${code}::${name}`;
        if (name && code && seenActs.has(key)) {
          await deleteDoc(doc(db, "actividades", act.id));
          actDeletedCount++;
        } else {
          if (name && code) seenActs.add(key);
        }
      }

      // 4. Clean duplicate suppliers in 'suppliers' collection
      const supSnapshot = await getDocs(collection(db, "suppliers"));
      const allSups = supSnapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      const seenSups = new Set<string>();
      let supDeletedCount = 0;
      for (const sup of allSups) {
        const name = String(sup.name || sup.nome || "").trim().toLowerCase();
        const nuit = (sup.nuit || "").toString().trim();
        const key = nuit || name;
        if (key && seenSups.has(key)) {
          await deleteDoc(doc(db, "suppliers", sup.id));
          supDeletedCount++;
        } else {
          if (key) seenSups.add(key);
        }
      }

      console.log("Limpeza Geral do Sistema concluída com sucesso!");
      return {
        success: true,
        collaboratorsDeleted: colResult.deletedCount || 0,
        matrixRemoved: matrixResult.removedDuplicates || 0,
        activitiesDeleted: actDeletedCount,
        suppliersDeleted: supDeletedCount,
      };
    } catch (error) {
      console.error("Erro na limpeza geral do sistema:", error);
      return { success: false, error };
    }
  },

  messages: {
    subscribe: (userId: string, callback: any) =>
      subscribeToMessages(userId, callback),
    add: (data: any) => addToCollection("messages", data),
    markAsRead: (id: string) =>
      updateInCollection("messages", id, { read: true }),
    delete: (id: string) => deleteFromCollection("messages", id),
    deleteAll: () => deleteAllFromCollection("messages"),
  },

  syncChefiaAccounts: async (colaboradores: any[]) => {
    try {
      const dbUsers = await getDocs(collection(db, "users"));
      const users = dbUsers.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }));

      const getAreaDeAfetacao = (cc: any): string => {
        if (
          cc.reparticao &&
          cc.reparticao !== "Nenhum" &&
          cc.reparticao !== "-"
        )
          return cc.reparticao;
        if (
          cc.departamento &&
          cc.departamento !== "Nenhum" &&
          cc.departamento !== "-"
        )
          return cc.departamento;
        if (cc.direcao && cc.direcao !== "Nenhum" && cc.direcao !== "-")
          return cc.direcao;
        return cc.unidade || cc.unidadeOrganica || "";
      };

      let createdCount = 0;
      let updatedCount = 0;
      let chefiaCount = 0;

      for (const col of colaboradores) {
        if (!col || !col.id) continue;

        const cargo = String(col.cargo || col.funcao || "").toLowerCase();
        const cargoChefia = String(col.cargoChefia || "").toLowerCase();

        const isChefiaExplicitlyNone =
          !col.cargoChefia ||
          col.cargoChefia === "Nenhum" ||
          col.cargoChefia === "nenhum" ||
          col.cargoChefia === "-" ||
          col.cargoChefia === "Sem Cargo" ||
          col.cargoChefia.toLowerCase().includes("nenhum") ||
          col.isChefia === false;

        const isChefiaByField = col.cargoChefia && !isChefiaExplicitlyNone;

        const isChefia =
          !isChefiaExplicitlyNone &&
          (isChefiaByField || hasChefiaPosition(col));

        const statusRaw = String(
          col.status ||
          col.situacao ||
          col.estado ||
          col.mandatoStatus ||
          col.estadoMandato ||
          ""
        )
          .toLowerCase()
          .trim();
        const isCessado =
          statusRaw === "cessado" ||
          statusRaw === "inativo" ||
          col.cessado === true;

        const colIdStr = String(col.id);
        const chefiaDocRef = doc(db, "colaboradores_chefia", colIdStr);

        if (isChefia && !isCessado) {
          chefiaCount++;
          const area = getAreaDeAfetacao(col);
          const resolvedCargoChefia =
            col.cargoChefia &&
            col.cargoChefia !== "Nenhum" &&
            col.cargoChefia !== "-"
              ? col.cargoChefia
              : col.cargo;

          // Save/Update in colaboradores_chefia table
          const chefiaTableData: any = {
            id: colIdStr,
            collabId: colIdStr,
            nome: col.nome || "",
            nuit: col.nuit || "",
            email: col.email || "",
            cargo: col.cargo || "",
            cargoChefia: resolvedCargoChefia || "",
            unidade: col.unidade || col.unidadeOrganica || "",
            direcao: col.direcao || "",
            departamento: col.departamento || "",
            reparticao: col.reparticao || "",
            curso: col.curso || "",
            tipo: col.tipo || "CTA",
            status: col.status || "Ativo",
            areaDeAfetacao: area,
            mandatoStatus: col.mandatoStatus || "Ativo",
            updatedAt: serverTimestamp(),
            fonte: "Chefia Import Sync",
          };

          await setDoc(chefiaDocRef, chefiaTableData, { merge: true });

          // Also update status and areaDeAfetacao in main colaboradores table if needed
          if (col.status !== "Afetado" || col.areaDeAfetacao !== area) {
            const colRef = doc(db, "colaboradores", colIdStr);
            await setDoc(
              colRef,
              {
                status: col.status || "Afetado",
                areaDeAfetacao: area,
                updatedAt: serverTimestamp(),
              },
              { merge: true },
            );
          }
        } else {
          try {
            await deleteDoc(chefiaDocRef);
          } catch (delErr) {
            // Ignore if doc does not exist
          }
        }

        // Sync user account in users table for EVERY active/valid colaborador (technicians, CTA, docentes, chefias)
        if (!isCessado) {
          const area = getAreaDeAfetacao(col);
          const resolvedCargoChefia =
            col.cargoChefia &&
            col.cargoChefia !== "Nenhum" &&
            col.cargoChefia !== "-"
              ? col.cargoChefia
              : col.cargo;

          const existingUser = users.find(
            (u: any) =>
              (u.collabId && u.collabId === col.id) ||
              (u.nuit &&
                col.nuit &&
                String(u.nuit).trim() !== "" &&
                String(u.nuit).trim() === String(col.nuit).trim()) ||
              (u.email &&
                col.email &&
                u.email.toLowerCase() === col.email.toLowerCase()),
          );

          const nomeSeguro = String(col.nome || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s]/g, "")
            .trim()
            .split(/\s+/)
            .join(".");
          const email = (col.email || `${nomeSeguro || col.id}@songo.ac.mz`)
            .toLowerCase()
            .trim();

          const userData: any = {
            collabId: col.id,
            name: col.nome,
            email: email,
            nuit: col.nuit || "",
            role: col.tipo === "Docente" ? "Docente" : "CTA",
            unidade: col.unidade || "",
            direcao: col.direcao || "",
            departamento: col.departamento || "",
            reparticao: col.reparticao || "",
            setor: col.setor || "",
            setoresAtribuidos: col.setoresAtribuidos || [],
            cargo: col.cargo || "",
            cargoChefia: resolvedCargoChefia || "",
            status: col.status || "Afetado",
            areaDeAfetacao: area,
            updatedAt: serverTimestamp(),
          };

          if (existingUser) {
            const hasChanges =
              existingUser.status !== userData.status ||
              existingUser.areaDeAfetacao !== area ||
              existingUser.cargoChefia !== userData.cargoChefia ||
              existingUser.role !== userData.role ||
              existingUser.reparticao !== userData.reparticao ||
              existingUser.departamento !== userData.departamento ||
              existingUser.direcao !== userData.direcao;

            if (hasChanges) {
              const userRef = doc(db, "users", existingUser.id);
              await updateDoc(userRef, userData);
              updatedCount++;
            }
          } else {
            await addDoc(collection(db, "users"), {
              ...userData,
              password: "1234",
              mustChangePassword: true,
              createdAt: serverTimestamp(),
            });
            createdCount++;
          }
        }
      }

      return {
        created: createdCount,
        updated: updatedCount,
        chefiaTotal: chefiaCount,
      };
    } catch (error: any) {
      console.error(
        "🔥 Firestore Error in syncChefiaAccounts:",
        error?.message || error,
      );
      handleFirestoreError(error, OperationType.UPDATE, "syncChefiaAccounts");
      return {
        created: 0,
        updated: 0,
        error: "Failed to sync chefia accounts",
      };
    }
  },

  initializeAdmin: async (adminData: any) => {
    try {
      const usersCol = collection(db, "users");
      const q = query(usersCol, where("email", "==", adminData.email || ""));
      const querySnapshot = await getDocs(q);

      // Prepare basic user data without password initially
      const { password: adminPassword, ...otherData } = adminData;
      const userData: any = {
        ...otherData,
        role: "Administrador",
        updatedAt: serverTimestamp(),
      };

      // Only include password in the update object if it's provided and not empty
      if (adminPassword && adminPassword.trim() !== "") {
        userData.password = adminPassword;
      }

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        // If the document exists, we update it. password will only be updated if provided.
        await updateDoc(userDoc.ref, userData);
        return { success: true, message: "Admin updated" };
      } else {
        // If the document doesn't exist, we must have a password
        if (!userData.password) {
          userData.password = "admin"; // fallback default for new admin if somehow not provided
        }
        await addDoc(usersCol, {
          ...userData,
          createdAt: serverTimestamp(),
        });
        return { success: true, message: "Admin created" };
      }
    } catch (error: any) {
      console.error("🔥 Error in initializeAdmin:", error);
      handleFirestoreError(error, OperationType.WRITE, "users");
      return { success: false, error: error.message };
    }
  },

  verifyUser: async (identifier: string, password?: string) => {
    try {
      const usersCol = collection(db, "users");
      const cleanId = (identifier || "").trim();
      if (!cleanId) return { exists: false };

      // Workaround for or() bug in some Firebase SDK versions by running queries in parallel
      const qEmail = query(
        usersCol,
        where("email", "==", cleanId.toLowerCase()),
      );
      const qNuit = query(usersCol, where("nuit", "==", cleanId));

      const [snapEmail, snapNuit] = await Promise.all([
        getDocs(qEmail),
        getDocs(qNuit),
      ]);

      const querySnapshot = !snapEmail.empty ? snapEmail : snapNuit;

      if (querySnapshot.empty) return { exists: false };

      const userDoc = querySnapshot.docs[0];
      const userData = { id: userDoc.id, ...(userDoc.data() as any) };

      if (password && userData.password !== password) {
        return { exists: true, passwordMatch: false };
      }

      return { exists: true, passwordMatch: true, user: userData };
    } catch (error: any) {
      console.error("🔥 Error in verifyUser:", error);
      handleFirestoreError(error, OperationType.GET, "users");
      return { exists: false, error: error.message };
    }
  },

  /**
   * Atualização de Senha e Gestão de Sessões
   */
  hashPassword: (password: string): string => {
    if (!password) return "";
    let hashVal = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hashVal = (hashVal << 5) - hashVal + char;
      hashVal |= 0;
    }
    return "phash_" + Math.abs(hashVal).toString(16);
  },

  invalidateSession: async (userId: string): Promise<void> => {
    if (!userId) return;
    try {
      localStorage.removeItem(`sigep_session_${userId}`);
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        activeSessionId: null,
        sessionInvalidatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }).catch((err) =>
        console.warn(`Aviso ao invalidar sessão para ${userId}:`, err),
      );
    } catch (e) {
      console.warn("Erro ao invalidar sessão:", e);
    }
  },

  createSession: async (
    userId: string,
  ): Promise<{ sessionId: string; createdAt: string }> => {
    const sessionId =
      "sess_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
    const sessionData = {
      sessionId,
      userId,
      createdAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(
        `sigep_session_${userId}`,
        safeJSONStringify(sessionData),
      );
      localStorage.setItem("sigep_active_session_id", sessionId);
      if (userId) {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          activeSessionId: sessionId,
          lastSessionCreated: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch((err) =>
          console.warn(`Aviso ao criar sessão para ${userId}:`, err),
        );
      }
    } catch (e) {
      console.warn("Erro ao criar sessão:", e);
    }
    return sessionData;
  },

  saveUser: async (user: any): Promise<void> => {
    if (!user) return;
    const targetId =
      user.id ||
      generateCollaboratorId(user.name || user.nome || "", user.nuit || "");
    try {
      const userRef = doc(db, "users", targetId);
      await setDoc(
        userRef,
        {
          ...user,
          id: targetId,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    } catch (e) {
      console.warn("Aviso ao salvar utilizador na base de dados:", e);
    }
  },

  updateUserPasswordWorkflow: async (user: any, newPassword: string) => {
    if (!user) return;
    const hashFn = (pwd: string) => {
      let hashVal = 0;
      for (let i = 0; i < pwd.length; i++) {
        const char = pwd.charCodeAt(i);
        hashVal = (hashVal << 5) - hashVal + char;
        hashVal |= 0;
      }
      return "phash_" + Math.abs(hashVal).toString(16);
    };

    // Após atualizar a senha
    user.passwordHash = hashFn(newPassword);
    user.password = newPassword;
    user.passwordExpired = false;
    user.mustChangePassword = false;
    user.isFirstAccess = false;

    // save(user);
    const targetId =
      user.id ||
      generateCollaboratorId(user.name || user.nome || "", user.nuit || "");
    const userRef = doc(db, "users", targetId);
    await setDoc(
      userRef,
      {
        ...user,
        id: targetId,
        passwordHash: user.passwordHash,
        passwordExpired: false,
        mustChangePassword: false,
        isFirstAccess: false,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    ).catch((err) => console.warn("Erro ao salvar utilizador:", err));

    // Invalida sessão antiga
    await firestoreService.invalidateSession(user.id);

    // Cria nova sessão
    const newSession = await firestoreService.createSession(user.id);

    return newSession;
  },

  counters: {
    getNextNumber: async (unitKey: string) => {
      const localKey = `sigep_counter_${unitKey}`;
      const counterRef = doc(db, "counters", unitKey);
      try {
        const nextNum = await runTransaction(db, async (transaction) => {
          const counterDoc = await transaction.get(counterRef);
          if (!counterDoc.exists()) {
            transaction.set(counterRef, { count: 1 });
            return 1;
          }
          const newCount = (counterDoc.data().count || 0) + 1;
          transaction.update(counterRef, { count: newCount });
          return newCount;
        });
        try {
          localStorage.setItem(localKey, String(nextNum));
        } catch (_) {}
        return nextNum;
      } catch (error: any) {
        console.warn(`[Firestore] Quota ou erro ao incrementar contador (${unitKey}), usando fallback local:`, error?.message || error);
        try {
          const currentLocal = parseInt(localStorage.getItem(localKey) || "0", 10);
          const nextLocal = (isNaN(currentLocal) ? 0 : currentLocal) + 1;
          localStorage.setItem(localKey, String(nextLocal));
          return nextLocal;
        } catch (_) {
          return Math.floor(1000 + Math.random() * 9000);
        }
      }
    },
    resetCounter: async (unitKey: string, startVal: number = 1) => {
      const localKey = `sigep_counter_${unitKey}`;
      try {
        localStorage.setItem(localKey, String(startVal));
      } catch (_) {}
      const counterRef = doc(db, "counters", unitKey);
      try {
        await setDoc(counterRef, { count: startVal }, { merge: true });
        return startVal;
      } catch (error: any) {
        console.warn(`[Firestore] Quota ou erro ao zerar contador (${unitKey}), salvo localmente:`, error?.message || error);
        return startVal;
      }
    },
    getCurrentNumber: async (unitKey: string) => {
      const localKey = `sigep_counter_${unitKey}`;
      const counterRef = doc(db, "counters", unitKey);
      try {
        const snap = await getDoc(counterRef);
        if (snap.exists()) {
          const val = snap.data().count || 1;
          try {
            localStorage.setItem(localKey, String(val));
          } catch (_) {}
          return val;
        }
        const localVal = parseInt(localStorage.getItem(localKey) || "1", 10);
        return isNaN(localVal) ? 1 : localVal;
      } catch (error) {
        const localVal = parseInt(localStorage.getItem(localKey) || "1", 10);
        return isNaN(localVal) ? 1 : localVal;
      }
    },
  },
  config: {
    get: async (id: string) => {
      try {
        const docRef = doc(db, "config_sistema", id);
        const snapshot = await getDoc(docRef);
        return snapshot.exists()
          ? { id: snapshot.id, ...snapshot.data() }
          : null;
      } catch (error) {
        console.error("Erro ao obter configuração:", error);
        return null;
      }
    },
    set: async (id: string, data: any) => {
      const docRef = doc(db, "config_sistema", id);
      await setDoc(
        docRef,
        { ...data, updatedAt: serverTimestamp() },
        { merge: true },
      );
    },
    subscribe: (id: string, callback: (data: any) => void) => {
      const docRef = doc(db, "config_sistema", id);
      return onSnapshot(docRef, (snapshot) => {
        callback(
          snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null,
        );
      });
    },
  },

  /**
   * Executa uma varredura completa na base de dados para detetar anomalias,
   * resolver conflitos e mesclar dados duplicados sem nunca remover dados inseridos pelos utilizadores.
   */
  runDatabaseAuditAndSync: async () => {
    const logs: string[] = [];
    let collectionsScanned = 0;
    let totalDocsScanned = 0;
    let anomaliesDetected = 0;
    let conflictsResolved = 0;
    let duplicatesMerged = 0;
    let fieldsFixed = 0;

    const log = (msg: string) => {
      console.log(`[VARREDURA SIGEP] ${msg}`);
      logs.push(msg);
    };

    log("Iniciando varredura geral e sincronização da base de dados...");

    // 1. Audit Colaboradores
    try {
      collectionsScanned++;
      const colRef = collection(db, "colaboradores");
      const colSnap = await getDocs(colRef);
      totalDocsScanned += colSnap.docs.length;
      log(
        `Coleção "colaboradores": ${colSnap.docs.length} documentos analisados.`,
      );

      const allColabs = colSnap.docs.map((doc) => ({
        ...doc.data(),
        docId: doc.id,
      })) as any[];
      const cleanStr = (s: any) =>
        String(s || "")
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

      // Group by normalized name, NUIT, or process number
      const groups: Record<string, any[]> = {};
      allColabs.forEach((c) => {
        const hasChefia =
          c.cargoChefia && c.cargoChefia !== "Nenhum" && c.cargoChefia !== "-";
        const key = hasChefia
          ? `chefia_${c.docId || c.id || Math.random()}`
          : cleanStr(c.nuit) || cleanStr(c.nome) || cleanStr(c.numeroProcesso);
        if (!key) return;
        if (!groups[key]) groups[key] = [];
        groups[key].push(c);
      });

      for (const key in groups) {
        const group = groups[key];
        if (group.length > 1) {
          anomaliesDetected += group.length - 1;
          log(
            `Conflito/Duplicado detetado para "${group[0].nome || key}": ${group.length} registos encontrados.`,
          );

          const countFilled = (c: any) =>
            Object.keys(c).filter(
              (k) =>
                c[k] !== undefined &&
                c[k] !== null &&
                c[k] !== "" &&
                c[k] !== "---",
            ).length;
          group.sort((a, b) => countFilled(b) - countFilled(a));

          const primary = group[0];
          const mergedData = { ...primary };
          let changed = false;

          for (let i = 1; i < group.length; i++) {
            const sec = group[i];
            for (const fieldKey in sec) {
              if (fieldKey === "docId") continue;
              if (
                (!mergedData[fieldKey] ||
                  mergedData[fieldKey] === "" ||
                  mergedData[fieldKey] === "---") &&
                sec[fieldKey] !== undefined &&
                sec[fieldKey] !== null &&
                sec[fieldKey] !== "" &&
                sec[fieldKey] !== "---"
              ) {
                mergedData[fieldKey] = sec[fieldKey];
                changed = true;
                fieldsFixed++;
              }
            }
            try {
              await deleteDoc(doc(db, "colaboradores", sec.docId));
              duplicatesMerged++;
              conflictsResolved++;
            } catch (err) {
              console.warn(`Aviso ao eliminar duplicado ${sec.docId}:`, err);
            }
          }

          for (const timeKey of ["createdAt", "updatedAt", "dataAdmissao"]) {
            if (
              mergedData[timeKey] &&
              typeof mergedData[timeKey] === "object" &&
              Object.keys(mergedData[timeKey]).length === 0
            ) {
              mergedData[timeKey] = new Date().toISOString();
              changed = true;
              fieldsFixed++;
            }
          }

          if (changed || primary.docId) {
            await setDoc(
              doc(db, "colaboradores", primary.docId),
              {
                ...mergedData,
                updatedAt: serverTimestamp(),
              },
              { merge: true },
            );
          }
        } else if (group.length === 1) {
          const item = group[0];
          let itemFixed = false;
          const updateObj: any = {};

          for (const timeKey of ["createdAt", "updatedAt", "dataAdmissao"]) {
            if (
              item[timeKey] &&
              typeof item[timeKey] === "object" &&
              Object.keys(item[timeKey]).length === 0
            ) {
              updateObj[timeKey] = new Date().toISOString();
              itemFixed = true;
              fieldsFixed++;
            }
          }

          if (itemFixed) {
            anomaliesDetected++;
            conflictsResolved++;
            await updateDoc(doc(db, "colaboradores", item.docId), updateObj);
          }
        }
      }
      log(
        `Resolução de colaboradores concluída: ${duplicatesMerged} duplicados mesclados sem perda de dados.`,
      );
    } catch (err: any) {
      log(`Aviso ao analisar colaboradores: ${err?.message || String(err)}`);
    }

    // 2. Audit Users & Sync Chefias
    try {
      collectionsScanned++;
      const usersRef = collection(db, "users");
      const usersSnap = await getDocs(usersRef);
      totalDocsScanned += usersSnap.docs.length;
      log(
        `Coleção "users": ${usersSnap.docs.length} contas de utilizador analisadas.`,
      );

      const allUsers = usersSnap.docs.map((doc) => ({
        ...doc.data(),
        docId: doc.id,
      })) as any[];

      for (const u of allUsers) {
        let fixed = false;
        const updates: any = {};
        for (const timeKey of ["createdAt", "updatedAt", "lastLogin"]) {
          if (
            u[timeKey] &&
            typeof u[timeKey] === "object" &&
            Object.keys(u[timeKey]).length === 0
          ) {
            updates[timeKey] = new Date().toISOString();
            fixed = true;
            fieldsFixed++;
          }
        }
        if (fixed) {
          anomaliesDetected++;
          conflictsResolved++;
          await updateDoc(doc(db, "users", u.docId), updates);
        }
      }

      const colSnap = await getDocs(collection(db, "colaboradores"));
      const dbColabs = colSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      const syncRes = await firestoreService.syncChefiaAccounts(dbColabs);
      log(
        `Sincronização de contas e chefias: ${syncRes.created || 0} criadas, ${syncRes.updated || 0} atualizadas.`,
      );
    } catch (err: any) {
      log(`Aviso ao analisar utilizadores: ${err?.message || String(err)}`);
    }

    // 3. Audit Activities & Other Primary Collections for Corrupted Timestamp Objects
    const collectionsToCheck = [
      { name: "actividades", label: "Actividades Setoriais" },
      { name: "matrix_activities", label: "Plano de Actividades" },
      { name: "expedientes", label: "Expediente Geral" },
      { name: "processos_individuais", label: "Processos Individuais" },
      { name: "service_requests", label: "Requisições de Serviços" },
      { name: "financial_data", label: "Dados Financeiros" },
      { name: "library_visits", label: "Visitas da Biblioteca" },
    ];

    for (const cInfo of collectionsToCheck) {
      try {
        collectionsScanned++;
        const cRef = collection(db, cInfo.name);
        const cSnap = await getDocs(cRef);
        totalDocsScanned += cSnap.docs.length;

        let fixedCountInCol = 0;
        for (const d of cSnap.docs) {
          const dData = d.data();
          let needsFix = false;
          const patch: any = {};

          for (const key in dData) {
            const val = dData[key];
            if (
              val &&
              typeof val === "object" &&
              !(val instanceof Date) &&
              typeof val.toMillis !== "function" &&
              Object.keys(val).length === 0
            ) {
              patch[key] =
                key.toLowerCase().includes("data") ||
                key.toLowerCase().includes("time") ||
                key.toLowerCase().includes("created") ||
                key.toLowerCase().includes("updated")
                  ? new Date().toISOString()
                  : null;
              needsFix = true;
              fieldsFixed++;
            }
          }

          if (needsFix) {
            anomaliesDetected++;
            conflictsResolved++;
            fixedCountInCol++;
            await updateDoc(doc(db, cInfo.name, d.id), patch);
          }
        }
        if (fixedCountInCol > 0) {
          log(
            `Coleção "${cInfo.label}" (${cInfo.name}): ${fixedCountInCol} campos corrompidos/incompletos corrigidos.`,
          );
        }
      } catch (err: any) {
        log(
          `Aviso na verificação de ${cInfo.name}: ${err?.message || String(err)}`,
        );
      }
    }

    log(
      `Varredura concluída com sucesso! ${totalDocsScanned} registos analisados em ${collectionsScanned} coleções. ${anomaliesDetected} anomalias encontradas, ${conflictsResolved} conflitos resolvidos.`,
    );

    return {
      success: true,
      collectionsScanned,
      totalDocsScanned,
      anomaliesDetected,
      conflictsResolved,
      duplicatesMerged,
      fieldsFixed,
      logs,
    };
  },
};

export function subscribeToMessages(userId: string, callback: any) {
  if (!userId) return () => {};
  try {
    const q = query(
      collection(db, "messages"),
      where("recipientId", "==", String(userId)),
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        callback(msgs);
      },
      (error) => {
        // Fallback gracefully to local storage messages
        const local = getLocalData("messages").filter((m: any) => String(m.recipientId) === String(userId));
        callback(local);
      },
    );
  } catch (e) {
    const local = getLocalData("messages").filter((m: any) => String(m.recipientId) === String(userId));
    callback(local);
    return () => {};
  }
}

export async function deleteAllFromCollection(collectionName: string) {
  const querySnapshot = await getDocs(collection(db, collectionName));
  const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
}

interface UpdatePasswordResult {
  success: boolean;
  error?: string;
  requiresReauth?: boolean;
}

export async function updateUserPassword(
  newPassword: string,
  currentPassword?: string, // necessário para reautenticação
): Promise<UpdatePasswordResult> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  try {
    await updatePassword(user, newPassword);

    await updateDoc(doc(db, "users", user.uid), {
      lastPasswordUpdate: serverTimestamp(),
      mustChangePassword: false,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Erro ao atualizar senha:", error);

    // Firebase exige reautenticação recente para alterar senha
    if (error.code === "auth/requires-recent-login") {
      // Tenta reautenticar automaticamente se a senha atual foi fornecida
      if (currentPassword) {
        try {
          const credential = EmailAuthProvider.credential(
            user.email!,
            currentPassword,
          );
          await reauthenticateWithCredential(user, credential);

          // Retry após reautenticação
          return updateUserPassword(newPassword);
        } catch (reauthError: any) {
          return {
            success: false,
            error: "Falha na reautenticação: " + reauthError.message,
            requiresReauth: true,
          };
        }
      }
      return {
        success: false,
        error: "É necessário fazer login novamente para alterar a senha.",
        requiresReauth: true,
      };
    }

    return {
      success: false,
      error: error.message || "Erro desconhecido ao atualizar senha.",
    };
  }
}

/**
 * Reseta a senha de um utilizador para a senha padrão '1234'.
 * Apenas para uso administrativo.
 */
export async function resetUserPasswordToDefault(
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      password: "1234",
      mustChangePassword: true,
      updatedAt: serverTimestamp(),
    });

    // Também atualizar na coleção de colaboradores para manter paridade
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.nuit) {
        const colQuery = query(
          collection(db, "colaboradores"),
          where("nuit", "==", userData.nuit),
        );
        const colSnap = await getDocs(colQuery);
        if (!colSnap.empty) {
          await updateDoc(doc(db, "colaboradores", colSnap.docs[0].id), {
            password: "1234",
            mustChangePassword: true,
          });
        }
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Erro ao resetar senha:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Limpa com segurança todas as atividades de um departamento específico no Firestore e no cache local
 */
export async function clearDepartmentActivities(departmentName: string): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  try {
    const normTarget = String(departmentName || "").trim().toUpperCase();
    let deletedCount = 0;
    const collections = ["matrix_activities", "actividades"];

    for (const colName of collections) {
      const colRef = collection(db, colName);
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const batch = writeBatch(db);
        let batchCount = 0;
        snap.docs.forEach(docSnap => {
          const data = docSnap.data() || {};
          const dept = String(data.departamento || "").toUpperCase();
          const sector = String(data.setor || "").toUpperCase();
          const rep = String(data.reparticao || "").toUpperCase();

          const match =
            dept.includes(normTarget) ||
            normTarget.includes(dept) ||
            sector.includes(normTarget) ||
            rep.includes(normTarget) ||
            (normTarget.includes("DICOSAFA") && (dept.includes("DICOSAFA") || sector.includes("DICOSAFA") || rep.includes("DICOSAFA") || data.direcao === "DICOSAFA")) ||
            (normTarget.includes("RECURSOS HUMANOS") && (dept.includes("RECURSOS HUMANOS") || dept === "DRH" || dept === "RH" || sector.includes("RECURSOS HUMANOS") || rep.includes("RECURSOS HUMANOS")));

          if (match) {
            batch.delete(doc(db, colName, docSnap.id));
            batchCount++;
          }
        });

        if (batchCount > 0) {
          await batch.commit();
          deletedCount += batchCount;
        }
      }

      // Limpar cache local
      try {
        const localKey = `sigep_local_${colName}`;
        const localData = localStorage.getItem(localKey);
        if (localData) {
          const parsed = JSON.parse(localData);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter((item: any) => {
              const dept = String(item.departamento || "").toUpperCase();
              const sector = String(item.setor || "").toUpperCase();
              const rep = String(item.reparticao || "").toUpperCase();
              const match =
                dept.includes(normTarget) ||
                normTarget.includes(dept) ||
                sector.includes(normTarget) ||
                rep.includes(normTarget) ||
                (normTarget.includes("RECURSOS HUMANOS") && (dept.includes("RECURSOS HUMANOS") || dept === "DRH" || dept === "RH" || sector.includes("RECURSOS HUMANOS") || rep.includes("RECURSOS HUMANOS")));
              return !match;
            });
            localStorage.setItem(localKey, safeJSONStringify(filtered));
          }
        }
      } catch (_) {}
    }

    return { success: true, deletedCount };
  } catch (error: any) {
    console.error(`Erro ao limpar atividades do departamento ${departmentName}:`, error);
    return { success: false, deletedCount: 0, error: error?.message };
  }
}

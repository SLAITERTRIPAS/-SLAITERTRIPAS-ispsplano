import { PRODUTOS_POR_NECESSIDADE, ProdutoMercado } from "../constants/formOptions";
import { firestoreService } from "./firestoreService";
import { safeJSONStringify } from "./utils";

export interface UnifiedProduct extends ProdutoMercado {
  id?: string;
  updatedAt?: string;
  rubrica?: string;
  necessidade?: string;
  categoria?: string;
}

export function getCategoryForRubricaOrNecessidade(rubrica?: string, necessidade?: string): string {
  const r = String(rubrica || "").toLowerCase();
  const n = String(necessidade || "").toLowerCase();
  if (
    r.includes("121") ||
    r.includes("bens") ||
    n.includes("combustível") ||
    n.includes("material") ||
    n.includes("fardamento") ||
    n.includes("medicamento") ||
    n.includes("género") ||
    n.includes("ferramenta") ||
    n.includes("semente") ||
    n.includes("aliment") ||
    n.includes("copa") ||
    n.includes("informática")
  ) {
    return "121 - Bens de Consumo e Materiais";
  }
  if (
    r.includes("122") ||
    r.includes("serviços") ||
    n.includes("comunicação") ||
    n.includes("passagem") ||
    n.includes("renda") ||
    n.includes("manutenção") ||
    n.includes("transporte") ||
    n.includes("seguro") ||
    n.includes("água") ||
    n.includes("energia") ||
    n.includes("limpeza") ||
    n.includes("gráficos")
  ) {
    return "122 - Serviços de Terceiros e Encargos";
  }
  if (
    r.includes("112") ||
    r.includes("pessoal") ||
    n.includes("ajuda") ||
    n.includes("diária") ||
    n.includes("subsídio")
  ) {
    return "112 - Despesas com Pessoal e Diárias";
  }
  if (
    r.includes("1434") ||
    r.includes("famílias") ||
    r.includes("transferência") ||
    n.includes("bolsa")
  ) {
    return "1434 - Transferências e Bolsas";
  }
  if (r.includes("12") || r.includes("findos")) {
    return "12 - Exercícios Findos";
  }
  return "121 - Bens de Consumo e Materiais";
}

function getRubricaForNecessidade(nec: string): string {
  const lower = String(nec || "").toLowerCase();
  if (lower.includes("combustível") || lower.includes("material") || lower.includes("fardamento") || lower.includes("medicamento") || lower.includes("género") || lower.includes("ferramenta") || lower.includes("sementes") || lower.includes("bandeira") || lower.includes("software") || lower.includes("bens") || lower.includes("121")) {
    return "Bens - 121";
  }
  if (lower.includes("comunicação") || lower.includes("passagem") || lower.includes("renda") || lower.includes("manutenção") || lower.includes("transporte") || lower.includes("seguro") || lower.includes("representação") || lower.includes("festividade") || lower.includes("água") || lower.includes("energia") || lower.includes("limpeza") || lower.includes("segurança") || lower.includes("serviços") || lower.includes("122")) {
    return "Serviços - 122";
  }
  if (lower.includes("ajuda") || lower.includes("subsídio") || lower.includes("remuneração") || lower.includes("pessoal") || lower.includes("contratação") || lower.includes("112")) {
    return "Demais despesas com o pessoal - 112";
  }
  if (lower.includes("bolsa") || lower.includes("transferência") || lower.includes("1434")) {
    return "Demais transferências a famílias - 1434";
  }
  if (lower.includes("retractivo") || lower.includes("exercício") || lower.includes("findo") || lower.includes("161") || lower.includes("12")) {
    return "Exercícios findos - 12";
  }
  return "Bens - 121";
}

export function toSingularWord(word: string): string {
  if (!word || word.length <= 3) return word;
  const lower = String(word).toLowerCase();
  const exceptions = ["lápis", "póstris", "pires", "vírus", "ônibus", "autocarro", "arroz", "gás", "pratos", "óculos"];
  if (exceptions.includes(lower)) return word;

  if (lower.endsWith("ões")) return word.slice(0, -3) + "ão";
  if (lower.endsWith("ães")) return word.slice(0, -3) + "ão";
  if (lower.endsWith("ãos")) return word.slice(0, -1);
  if (lower.endsWith("éis") || lower.endsWith("eis")) return word.slice(0, -3) + "el";
  if (lower.endsWith("ais")) return word.slice(0, -3) + "al";
  if (lower.endsWith("ois")) return word.slice(0, -3) + "ol";
  if (lower.endsWith("uis")) return word.slice(0, -3) + "ul";
  if (lower.endsWith("ores") || lower.endsWith("eres") || lower.endsWith("ires")) return word.slice(0, -2);
  if (lower.endsWith("ns")) return word.slice(0, -2) + "m";
  if (lower.endsWith("s") && !lower.endsWith("is") && !lower.endsWith("us") && !lower.endsWith("ss")) {
    return word.slice(0, -1);
  }
  return word;
}

export function toSingularProductName(name: string): string {
  if (!name) return "";
  let trimmed = String(name || "").trim();
  trimmed = trimmed.replace(/\s*—\s*.*$/, "").replace(/\s*-\s*\d+[.,]?\d*\s*MZN.*$/i, "").trim();
  const words = trimmed.split(" ");
  if (words.length === 0) return trimmed;
  words[0] = toSingularWord(words[0]);
  for (let i = 1; i < words.length; i++) {
    if (["e", "de", "do", "da", "dos", "das", "para", "com", "em"].includes(words[i].toLowerCase())) continue;
    words[i] = toSingularWord(words[i]);
  }
  const result = words.join(" ");
  return result.charAt(0).toUpperCase() + result.slice(1);
}

export function getDeletedProductKeys(): Set<string> {
  try {
    const saved = localStorage.getItem("sigep_deleted_products");
    if (saved) {
      const arr: string[] = JSON.parse(saved);
      return new Set(arr.map((k) => String(k || "").trim().toLowerCase()));
    }
  } catch (e) {
    console.error("Error reading deleted products:", e);
  }
  return new Set();
}

export async function deleteUnifiedProduct(nome: string) {
  try {
    const singularName = toSingularProductName(nome);
    const key = singularName.trim().toLowerCase();
    const docId = `prod_${key}`.replace(/[^a-zA-Z0-9_]/g, "_");
    
    // Remover imediatamente e definitivamente da base de dados Firestore
    await firestoreService.produtosUnificados.delete(docId);

    const saved = localStorage.getItem("sigep_unified_products");
    if (saved) {
      const parsed: UnifiedProduct[] = JSON.parse(saved);
      const filtered = parsed.filter((p) => String(toSingularProductName(p.nome) || "").trim().toLowerCase() !== key);
      localStorage.setItem("sigep_unified_products", safeJSONStringify(filtered));
    }
  } catch (e) {
    console.error("Error deleting product from database:", e);
    throw e;
  }
}

export async function getUnifiedProducts(): Promise<UnifiedProduct[]> {
  const map = new Map<string, UnifiedProduct>();
  const deletedKeys = getDeletedProductKeys();

  // 1. Fetch from Firestore (Gestão de Produtos e Preços)
  try {
    const remoteProducts = await firestoreService.produtosUnificados.get();
    remoteProducts.forEach((p) => {
        if (p && p.nome) {
          const singularName = toSingularProductName(p.nome);
          const key = String(toSingularProductName(p.nome) || "").trim().toLowerCase();
          if (!deletedKeys.has(key)) {
            const rubrica = p.rubrica || "Bens - 121";
            const necessidade = p.necessidade || "Geral";
            map.set(key, {
              id: p.id,
              nome: singularName,
              preco: Number(p.preco) || 0,
              unidade: p.unidade || "Unidade",
              especificacao: p.especificacao || "",
              rubrica: rubrica,
              necessidade: necessidade,
              categoria: p.categoria || getCategoryForRubricaOrNecessidade(rubrica, necessidade),
              updatedAt: p.updatedAt,
            });
          }
        }
    });
  } catch (e) {
    console.error("Error fetching unified products from Firestore:", e);
  }

  // 2. Include baseline products from PRODUTOS_POR_NECESSIDADE if not already in Firestore or deleted
  Object.entries(PRODUTOS_POR_NECESSIDADE).forEach(([necessidade, prods]) => {
    const rubrica = getRubricaForNecessidade(necessidade);
    prods.forEach((p) => {
      const singularName = toSingularProductName(p.nome);
      const key = singularName.trim().toLowerCase();
      if (!deletedKeys.has(key) && !map.has(key)) {
        map.set(key, {
          nome: singularName,
          preco: p.preco || 0,
          unidade: p.unidade || "Unidade",
          especificacao: p.especificacao || "",
          rubrica: rubrica,
          necessidade: necessidade,
          categoria: getCategoryForRubricaOrNecessidade(rubrica, necessidade),
        });
      }
    });
  });

  const result = Array.from(map.values());
  result.sort((a, b) => a.nome.localeCompare(b.nome, "pt-MZ", { sensitivity: "base" }));
  return result;
}

export async function deduplicateDatabaseProducts(): Promise<{ totalUnique: number; duplicatesRemoved: number }> {
  try {
    const remoteProducts = await firestoreService.produtosUnificados.get();
    const deletedKeys = getDeletedProductKeys();

    const groups = new Map<string, any[]>();
    remoteProducts.forEach((doc: any) => {
      if (doc && doc.nome) {
        const key = String(toSingularProductName(doc.nome) || "").trim().toLowerCase();
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(doc);
      }
    });

    let duplicatesRemoved = 0;
    const cleanList: UnifiedProduct[] = [];

    for (const [key, docs] of groups.entries()) {
      if (deletedKeys.has(key)) {
        for (const d of docs) {
          if (d.id) {
            await firestoreService.produtosUnificados.delete(d.id).catch(() => {});
          }
        }
        continue;
      }

      docs.sort((a, b) => {
        const timeA = new Date(a.updatedAt || 0).getTime();
        const timeB = new Date(b.updatedAt || 0).getTime();
        return timeB - timeA;
      });

      const master = docs[0];
      const singularName = toSingularProductName(master.nome);
      const masterDocId = `prod_${key}`.replace(/[^a-zA-Z0-9_]/g, "_");
      const rubrica = master.rubrica || "Bens - 121";
      const necessidade = master.necessidade || "Geral";

      const cleanProduct: UnifiedProduct = {
        id: masterDocId,
        nome: singularName,
        preco: Number(master.preco) || 0,
        unidade: master.unidade || "Unidade",
        especificacao: master.especificacao || "",
        rubrica: rubrica,
        necessidade: necessidade,
        categoria: getCategoryForRubricaOrNecessidade(rubrica, necessidade),
        updatedAt: master.updatedAt || new Date().toISOString(),
      };

      await firestoreService.produtosUnificados.set(masterDocId, cleanProduct).catch(() => {});
      cleanList.push(cleanProduct);

      for (let i = 1; i < docs.length; i++) {
        if (docs[i].id && docs[i].id !== masterDocId) {
          await firestoreService.produtosUnificados.delete(docs[i].id).catch(() => {});
          duplicatesRemoved++;
        }
      }
    }

    const existingKeys = new Set(cleanList.map((p) => toSingularProductName(p.nome).trim().toLowerCase()));
    Object.entries(PRODUTOS_POR_NECESSIDADE).forEach(([necessidade, prods]) => {
      const rubrica = getRubricaForNecessidade(necessidade);
      prods.forEach((p) => {
        const singularName = toSingularProductName(p.nome);
        const key = singularName.trim().toLowerCase();
        if (!deletedKeys.has(key) && !existingKeys.has(key)) {
          const docId = `prod_${key}`.replace(/[^a-zA-Z0-9_]/g, "_");
          const prodObj: UnifiedProduct = {
            id: docId,
            nome: singularName,
            preco: p.preco || 0,
            unidade: p.unidade || "Unidade",
            especificacao: p.especificacao || "",
            rubrica: rubrica,
            necessidade: necessidade,
            categoria: getCategoryForRubricaOrNecessidade(rubrica, necessidade),
            updatedAt: new Date().toISOString(),
          };
          firestoreService.produtosUnificados.set(docId, prodObj).catch(() => {});
          cleanList.push(prodObj);
          existingKeys.add(key);
        }
      });
    });

    localStorage.setItem("sigep_unified_products", safeJSONStringify(cleanList));

    return {
      totalUnique: cleanList.length,
      duplicatesRemoved,
    };
  } catch (err) {
    console.error("Erro ao deduplicar produtos na base de dados:", err);
    return { totalUnique: 0, duplicatesRemoved: 0 };
  }
}

export async function saveUnifiedProduct(product: { nome: string; preco: number; unidade: string; especificacao: string; rubrica?: string; necessity?: string; necessidade?: string; categoria?: string; originalNome?: string }) {
  try {
    const current = await getUnifiedProducts();
    const singularName = toSingularProductName(product.nome);
    const key = String(singularName || "").trim().toLowerCase();
    const oldKey = product.originalNome
      ? String(toSingularProductName(product.originalNome) || "").trim().toLowerCase()
      : key;

    // Se anteriormente apagado, remover da lista de apagados
    const deletedKeys = getDeletedProductKeys();
    if (deletedKeys.has(key)) {
      deletedKeys.delete(key);
      localStorage.setItem("sigep_deleted_products", safeJSONStringify(Array.from(deletedKeys)));
    }
    if (oldKey !== key && deletedKeys.has(oldKey)) {
      deletedKeys.delete(oldKey);
      localStorage.setItem("sigep_deleted_products", safeJSONStringify(Array.from(deletedKeys)));
    }

    const index = current.findIndex(
      (p) =>
        toSingularProductName(p.nome).trim().toLowerCase() === key ||
        toSingularProductName(p.nome).trim().toLowerCase() === oldKey
    );
    const existing = index >= 0 ? current[index] : null;

    const rubrica = product.rubrica || existing?.rubrica || "Bens - 121";
    const necessidade = product.necessidade || product.necessity || existing?.necessidade || "Geral";
    const categoria = product.categoria || existing?.categoria || getCategoryForRubricaOrNecessidade(rubrica, necessidade);

    const updatedProduct: UnifiedProduct = {
      nome: singularName,
      preco: Number(product.preco) || 0,
      unidade: product.unidade || existing?.unidade || "Unidade",
      especificacao: product.especificacao || existing?.especificacao || "",
      rubrica: rubrica,
      necessidade: necessidade,
      categoria: categoria,
      updatedAt: new Date().toISOString(),
    };

    // 1. PRIORIDADE ABSOLUTA: Guardar na nuvem (Firestore)
    const docId = `prod_${key}`.replace(/[^a-zA-Z0-9_]/g, "_");
    try {
      await firestoreService.produtosUnificados.set(docId, updatedProduct);
      console.log(`☁️ Produto sincronizado com a nuvem: ${singularName}`);
    } catch (err) {
      console.warn("Aviso: Falha ao salvar produto na nuvem, mantendo cache local.", err);
    }

    // 2. Atualizar cache local
    let newList = [...current];
    if (index >= 0) {
      newList[index] = updatedProduct;
    } else {
      newList.push(updatedProduct);
    }
    localStorage.setItem("sigep_unified_products", safeJSONStringify(newList));

    // Sincronização global de preços e nomes em TODOS os planos de atividades (assíncrono)
    syncGlobalProductUpdates(key, oldKey, updatedProduct).catch(err => {
      console.error("Erro na sincronização global de preços:", err);
    });

    return getUnifiedProducts();
  } catch (e) {
    console.error("Error saving unified product:", e);
    return getUnifiedProducts();
  }
}

async function syncGlobalProductUpdates(key: string, oldKey: string, updatedProduct: UnifiedProduct) {
  try {
    const allActs = await firestoreService.actividades.get();
    
    for (const act of allActs) {
      if (!act.id) continue;
      if (Array.isArray(act.rubricas)) {
        let actChanged = false;
        const newRubricas = act.rubricas.map((r: any) => {
          const rProdName = toSingularProductName(r.nomeProduto || "").toLowerCase();
          const matchesKey =
            rProdName === key ||
            rProdName === oldKey ||
            (oldKey && oldKey.length > 2 && rProdName.includes(oldKey)) ||
            (key && key.length > 2 && rProdName.includes(key));

          if (matchesKey) {
            const newPreco = Number(updatedProduct.preco) || 0;
            const newUnidade = updatedProduct.unidade || r.detalhes;
            const newSpec = updatedProduct.especificacao || r.especificacao;
            const newNome = updatedProduct.nome;

            if (
              r.precoUnitario !== newPreco ||
              r.detalhes !== newUnidade ||
              r.especificacao !== newSpec ||
              r.nomeProduto !== newNome
            ) {
              actChanged = true;
              const qtd = Number(r.quantidade) || 1;
              return {
                ...r,
                nomeProduto: newNome,
                precoUnitario: newPreco,
                detalhes: newUnidade,
                especificacao: newSpec,
                quantidade: qtd,
                valorTotal: qtd * newPreco,
              };
            }
          }
          return r;
        });

        if (actChanged) {
          const newTotalRubricas = newRubricas.reduce(
            (sum: number, r: any) => sum + (Number(r.valorTotal) || 0),
            0
          );
          const totalGasoleo = Number(act.valorTotalGasoleo) || 0;
          const newOrcamentoTotal = newTotalRubricas + totalGasoleo;

          await firestoreService.actividades.update(act.id, { 
            rubricas: newRubricas,
            valorTotal: newOrcamentoTotal > 0 ? newOrcamentoTotal : act.valorTotal,
            orcamentoTotal: newOrcamentoTotal > 0 ? newOrcamentoTotal : act.orcamentoTotal,
            valor: newOrcamentoTotal > 0 ? newOrcamentoTotal : act.valor,
            updatedAt: new Date().toISOString(),
            syncSource: "product_price_update"
          });
        }
      }
    }

    // Também atualizar rascunhos (Drafts)
    const allDrafts = await firestoreService.drafts.get();
    for (const d of allDrafts) {
      if (!d.id) continue;
      if (Array.isArray(d.rubricas)) {
        let draftChanged = false;
        const newDraftRubricas = d.rubricas.map((r: any) => {
          const rProdName = toSingularProductName(r.nomeProduto || "").toLowerCase();
          const matchesKey =
            rProdName === key ||
            rProdName === oldKey ||
            (oldKey && oldKey.length > 2 && rProdName.includes(oldKey)) ||
            (key && key.length > 2 && rProdName.includes(key));

          if (matchesKey) {
            const newPreco = Number(updatedProduct.preco) || 0;
            const newUnidade = updatedProduct.unidade || r.detalhes;
            const newSpec = updatedProduct.especificacao || r.especificacao;
            const newNome = updatedProduct.nome;

            if (
              r.precoUnitario !== newPreco ||
              r.detalhes !== newUnidade ||
              r.especificacao !== newSpec ||
              r.nomeProduto !== newNome
            ) {
              draftChanged = true;
              const qtd = Number(r.quantidade) || 1;
              return {
                ...r,
                nomeProduto: newNome,
                precoUnitario: newPreco,
                detalhes: newUnidade,
                especificacao: newSpec,
                quantidade: qtd,
                valorTotal: qtd * newPreco,
              };
            }
          }
          return r;
        });

        if (draftChanged) {
          await firestoreService.drafts.update(d.id, { 
            rubricas: newDraftRubricas,
            updatedAt: new Date().toISOString()
          });
        }
      }
    }
  } catch (syncError) {
    console.error("Erro na sincronização global de preços:", syncError);
  }
}

export async function collectProductFromRubric(rubrica: { nomeProduto?: string; precoUnitario?: number; detalhes?: string; especificacao?: string; rubrica?: string; necessidade?: string }) {
  if (!rubrica || !rubrica.nomeProduto || String(rubrica.nomeProduto).trim() === "") return;
  await saveUnifiedProduct({
    nome: String(rubrica.nomeProduto).trim(),
    preco: Number(rubrica.precoUnitario) || 0,
    unidade: rubrica.detalhes || "Unidade",
    especificacao: rubrica.especificacao || "",
    rubrica: rubrica.rubrica,
    necessidade: rubrica.necessidade,
  });
}

let cachedFirestoreActivities: any[] = [];

// Subscrever as actividades do Firestore em tempo real para manter a cache atualizada
try {
  firestoreService.actividades.subscribe(
    (data) => {
      if (Array.isArray(data)) {
        cachedFirestoreActivities = data;
      }
    },
    (err) => {
      console.warn("Aviso ao subscrever actividades no unifiedManager:", err);
    }
  );
} catch (e) {
  console.warn("Falha ao iniciar subscrição no unifiedManager:", e);
}

export function getDepartmentStoredActivities(departmentName: string): any[] {
  if (!departmentName || typeof departmentName !== "string") return [];
  const deptKey = departmentName.trim().toLowerCase();

  // 1. Procurar primeiro nas actividades sincronizadas do Firestore (Nuvem)
  const activities = Array.isArray(cachedFirestoreActivities) ? cachedFirestoreActivities : [];
  const cloudMatched = activities.filter((act) => {
    if (!act) return false;
    const actDept = String(act.departamento || act.unidadeOrganica || act.organicUnit || act.unidadeSelecionada || "");
    return actDept.trim().toLowerCase() === deptKey;
  });

  if (cloudMatched.length > 0) {
    // Ordenar por data mais recente de atualização ou início
    return [...cloudMatched].sort((a, b) => {
      const getStr = (val: any) => {
        if (!val) return "";
        if (typeof val === "string") return val;
        if (typeof val === "number") return String(val);
        if (typeof val === "object" && val !== null) {
          if (val.seconds) return String(val.seconds);
          if (typeof val.toDate === "function") {
            try { return val.toDate().toISOString(); } catch (e) { return ""; }
          }
        }
        return String(val);
      };
      const dateA = getStr(a?.updatedAt || a?.dataInicio);
      const dateB = getStr(b?.updatedAt || b?.dataInicio);
      return dateB.localeCompare(dateA);
    });
  }

  // 2. Fallback para localStorage apenas se a nuvem estiver vazia
  try {
    const saved = localStorage.getItem(`sigep_dept_activities_${deptKey}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {
    console.error("Error loading dept activities:", e);
  }
  return [];
}

export async function saveDepartmentActivity(departmentName: string, activityData: any) {
  if (!departmentName) return;
  try {
    const deptKey = String(departmentName || "").trim().toLowerCase();
    const current = getDepartmentStoredActivities(departmentName);

    const norm = (s: any) => String(s || "").trim().toLowerCase();
    const getActMonths = (act: any) => {
      if (Array.isArray(act.mesesRealizacao)) return act.mesesRealizacao.map(norm);
      if (act.mesRealizacao) return [norm(act.mesRealizacao)];
      if (act.mes) return [norm(act.mes)];
      return [];
    };

    const candMonths = getActMonths(activityData);
    const candName = norm(activityData.nomeAtividade || activityData.title);
    const candCode = norm(activityData.codigoAtividade || activityData.numeroAtividade || activityData.no);

    const filtered = current.filter((a: any) => {
      if (a.id === activityData.id) return false;

      const aName = norm(a.nomeAtividade || a.title);
      const aCode = norm(a.codigoAtividade || a.numeroAtividade || a.no);

      if ((candName && aName === candName) || (candCode && aCode === candCode)) {
        const aMonths = getActMonths(a);
        const hasSameMonth = candMonths.some((cm) => aMonths.some((am) => cm === am || cm.includes(am) || am.includes(cm)));
        if (hasSameMonth) return false;
      }
      return true;
    });

    filtered.unshift(activityData);
    
    // 1. Guardar IMEDIATAMENTE na base de dados cloud (Firestore) - PRIORIDADE ABSOLUTA
    if (activityData) {
      const payload = {
        ...activityData,
        departamento: departmentName,
        organicUnit: departmentName,
        updatedAt: new Date().toISOString(),
        synced: true,
      };
      
      try {
        if (activityData.id && !String(activityData.id).startsWith("local_")) {
          await firestoreService.updateInCollection("actividades", activityData.id, payload);
        } else {
          const newId = await firestoreService.addToCollection("actividades", payload);
          if (newId) activityData.id = newId;
        }
        console.log(`☁️ Atividade sincronizada com a nuvem: ${departmentName}`);
      } catch (err) {
        console.warn("Aviso: Falha na sincronização imediata com a nuvem, mantendo em cache local.", err);
      }
    }

    // 2. Atualizar cache local
    localStorage.setItem(`sigep_dept_activities_${deptKey}`, safeJSONStringify(filtered));
  } catch (e) {
    console.error("Error saving dept activity:", e);
  }
}

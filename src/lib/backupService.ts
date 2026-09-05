import { db } from "./firebase";
import { firestoreService } from "./firestoreService";
import { getCircularReplacer, safeJSONStringify } from "./utils";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { REPARTICOES, SETORES, DEPARTAMENTOS } from "../constants/formOptions";

interface BackupDocument {
  id: string;
  [key: string]: unknown;
}

export interface BackupData {
  [collectionName: string]: BackupDocument[] | any;
}

export interface BackupResult {
  success: boolean;
  error?: string;
  filename?: string;
  collectionStats?: Record<string, number>;
  organStats?: Record<string, number>;
  backupRecord?: SystemBackupRecord;
}

export interface SystemOrganInfo {
  id: string;
  name: string;
  shortName: string;
  description: string;
  iconName: string;
  badgeColor: string;
  collections: string[];
}

export interface SystemBackupRecord {
  id: string;
  timestamp: string;
  formattedDate: string;
  type: "auto" | "manual";
  totalRecords: number;
  totalSizeKB: number;
  organStats: Record<string, number>;
  collectionStats: Record<string, number>;
  backupData?: BackupData;
  status: "completed" | "in_progress" | "failed";
}

export const SYSTEM_ORGAOS: SystemOrganInfo[] = [
  {
    id: "direcao_gestao",
    name: "Órgão de Direção e Gestão",
    shortName: "Direção & Gestão",
    description: "Conselho de Direção, planos estratégicos institucionais, chefias, pareceres, relatórios, assinaturas e atos normativos da direção",
    iconName: "Building2",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
    collections: [
      "historico_chefias",
      "colaboradores_chefia",
      "institucional_plans",
      "reports",
      "monografia",
      "signatures",
      "accessAlerts",
    ],
  },
  {
    id: "unidades_organicas",
    name: "Unidades Orgânicas",
    shortName: "Unidade Orgânica",
    description: "Departamentos académicos, cursos, alunos, matrículas, turmas, alocações de docentes, horários, exames, bolsas e espaços físicos",
    iconName: "GraduationCap",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
    collections: [
      "efetivo_escolar",
      "alunos",
      "matriculas",
      "alocacoes_docentes",
      "turmas",
      "disciplinas_academicas",
      "espacos_fisicos",
      "exames",
      "bolsas",
      "atendimentos_estudantis",
      "library_books",
      "library_visits",
      "colaboradores_formacao",
    ],
  },
  {
    id: "servicos_centrais",
    name: "Serviços Centrais",
    shortName: "Serviços Centrais",
    description: "Recursos humanos, processos individuais, assiduidade, dados financeiros, orçamentos, fornecedores, economato, património e arquivo",
    iconName: "Briefcase",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    collections: [
      "colaboradores",
      "processos_individuais",
      "assiduidade",
      "financial_data",
      "suppliers",
      "materiais_bens",
      "movimentos_economato",
      "inventarios_patrimoniais",
      "requisicoes_internas",
      "expedientes",
      "archive_documents",
      "service_requests",
    ],
  },
  {
    id: "sistema",
    name: "Sistema",
    shortName: "Sistema & TI",
    description: "Contas de utilizadores, matriz do plano de actividades, cronogramas, normas, eventos, notas, mensagens e configurações gerais",
    iconName: "Server",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    collections: [
      "users",
      "actividades",
      "matrix_activities",
      "plano_actividades",
      "plan_schedules",
      "documentos_normativos",
      "calendar_events",
      "notes",
      "messages",
      "configuracoes",
      "config_sistema",
      "drafts",
      "produtosUnificados",
      "pedidos",
    ],
  },
];

// Compatibilidade retroativa
export const SYSTEM_DATA_AREAS = SYSTEM_ORGAOS.map((o) => ({
  id: o.id,
  title: o.name,
  description: o.description,
  iconName: o.iconName,
  collections: o.collections,
}));

export const ALL_SYSTEM_COLLECTIONS = Array.from(
  new Set(SYSTEM_ORGAOS.flatMap((a) => a.collections)),
);

export const COLLECTION_ALIASES: Record<string, string> = {
  // Colaboradores e RH
  "Colaboradores": "colaboradores",
  "colaboradores": "colaboradores",
  "tb_colaboradores": "colaboradores",
  "tb_colaborador": "colaboradores",
  "funcionarios": "colaboradores",
  "tb_funcionarios": "colaboradores",
  "efetivo_geral": "colaboradores",
  "docentes": "colaboradores",
  "Colaboradores_Chefia": "colaboradores_chefia",
  "colaboradores_chefia": "colaboradores_chefia",
  "tb_colaboradores_chefia": "colaboradores_chefia",
  "Historico_Chefias": "historico_chefias",
  "historico_chefias": "historico_chefias",
  "tb_historico_chefias": "historico_chefias",
  "chefias": "historico_chefias",
  "Processos_Recursos_Humanos": "processos_individuais",
  "processos_individuais": "processos_individuais",
  "tb_processos_individuais": "processos_individuais",
  "tb_processos": "processos_individuais",
  "processos": "processos_individuais",
  "Assiduidade": "assiduidade",
  "assiduidade": "assiduidade",
  "tb_assiduidade": "assiduidade",
  "colaboradores_formacao": "colaboradores_formacao",
  "tb_colaboradores_formacao": "colaboradores_formacao",

  // Utilizadores e Sistema
  "Utilizadores": "users",
  "utilizadores": "users",
  "usuarios": "users",
  "users": "users",
  "tb_utilizadores": "users",
  "tb_usuarios": "users",
  "tb_users": "users",
  "configuracoes": "configuracoes",
  "tb_configuracoes": "configuracoes",
  "config_sistema": "config_sistema",
  "tb_config_sistema": "config_sistema",
  "drafts": "drafts",
  "tb_drafts": "drafts",
  "system_backups": "system_backups",
  "tb_system_backups": "system_backups",

  // Actividades e Planos
  "Plano_Actividades": "matrix_activities",
  "matrix_activities": "matrix_activities",
  "matrixActivities": "matrix_activities",
  "tb_matrix_activities": "matrix_activities",
  "Actividades": "actividades",
  "actividades": "actividades",
  "tb_actividades": "actividades",
  "activities": "actividades",
  "Plano_Actividades_Det": "plano_actividades",
  "plano_actividades": "plano_actividades",
  "tb_plano_actividades": "plano_actividades",
  "plan_schedules": "plan_schedules",
  "tb_plan_schedules": "plan_schedules",
  "institucional_plans": "institucional_plans",
  "tb_institucional_plans": "institucional_plans",
  "reports": "reports",
  "tb_reports": "reports",
  "relatorios": "reports",
  "monografia": "monografia",
  "tb_monografia": "monografia",
  "signatures": "signatures",
  "tb_signatures": "signatures",
  "accessAlerts": "accessAlerts",
  "tb_accessAlerts": "accessAlerts",

  // Eventos, Notas, Mensagens, Expedientes e Normativos
  "Eventos": "calendar_events",
  "calendar_events": "calendar_events",
  "eventos": "calendar_events",
  "tb_eventos": "calendar_events",
  "tb_calendar_events": "calendar_events",
  "Notas": "notes",
  "notes": "notes",
  "notas": "notes",
  "tb_notas": "notes",
  "tb_notes": "notes",
  "Mensagens_Sistema": "messages",
  "messages": "messages",
  "mensagens": "messages",
  "tb_mensagens": "messages",
  "tb_messages": "messages",
  "Expediente": "expedientes",
  "expedientes": "expedientes",
  "tb_expedientes": "expedientes",
  "tb_expediente": "expedientes",
  "Documentos_Normativos": "documentos_normativos",
  "documentos_normativos": "documentos_normativos",
  "tb_documentos_normativos": "documentos_normativos",
  "normativos": "documentos_normativos",
  "Archive_Documents": "archive_documents",
  "archive_documents": "archive_documents",
  "tb_archive_documents": "archive_documents",
  "arquivo": "archive_documents",
  "service_requests": "service_requests",
  "pedidos_servico": "service_requests",
  "tb_service_requests": "service_requests",
  "tb_pedidos_servico": "service_requests",

  // Académico e Estudantes
  "Efetivo_Escolar": "efetivo_escolar",
  "efetivo_escolar": "efetivo_escolar",
  "tb_efetivo_escolar": "efetivo_escolar",
  "Alunos": "alunos",
  "alunos": "alunos",
  "estudantes": "alunos",
  "tb_alunos": "alunos",
  "tb_estudantes": "alunos",
  "Matriculas": "matriculas",
  "matriculas": "matriculas",
  "tb_matriculas": "matriculas",
  "Turmas": "turmas",
  "turmas": "turmas",
  "tb_turmas": "turmas",
  "Alocacoes_Docentes": "alocacoes_docentes",
  "alocacoes_docentes": "alocacoes_docentes",
  "tb_alocacoes_docentes": "alocacoes_docentes",
  "Disciplinas_Academicas": "disciplinas_academicas",
  "disciplinas_academicas": "disciplinas_academicas",
  "disciplinas": "disciplinas_academicas",
  "tb_disciplinas_academicas": "disciplinas_academicas",
  "tb_disciplinas": "disciplinas_academicas",
  "Espacos_Fisicos": "espacos_fisicos",
  "espacos_fisicos": "espacos_fisicos",
  "espacos": "espacos_fisicos",
  "salas": "espacos_fisicos",
  "tb_espacos_fisicos": "espacos_fisicos",
  "Exames": "exames",
  "exames": "exames",
  "tb_exames": "exames",
  "Bolsas_Estudo": "bolsas",
  "bolsas": "bolsas",
  "tb_bolsas": "bolsas",
  "Atendimentos_Estudantis": "atendimentos_estudantis",
  "atendimentos_estudantis": "atendimentos_estudantis",
  "tb_atendimentos_estudantis": "atendimentos_estudantis",
  "Biblioteca_Livros": "library_books",
  "library_books": "library_books",
  "livros": "library_books",
  "tb_library_books": "library_books",
  "Biblioteca_Visitas": "library_visits",
  "library_visits": "library_visits",
  "visitas_biblioteca": "library_visits",
  "tb_library_visits": "library_visits",

  // Finanças, Património, Economato e Produtos
  "Orcamento_Financas": "financial_data",
  "financial_data": "financial_data",
  "financas": "financial_data",
  "orcamentos": "financial_data",
  "tb_financial_data": "financial_data",
  "tb_orcamento_financas": "financial_data",
  "Fornecedores": "suppliers",
  "suppliers": "suppliers",
  "tb_suppliers": "suppliers",
  "tb_fornecedores": "suppliers",
  "Inventario_Bens": "materiais_bens",
  "materiais_bens": "materiais_bens",
  "tb_materiais_bens": "materiais_bens",
  "tb_inventario_bens": "materiais_bens",
  "bens": "materiais_bens",
  "Movimentos_Economato": "movimentos_economato",
  "movimentos_economato": "movimentos_economato",
  "tb_movimentos_economato": "movimentos_economato",
  "economato": "movimentos_economato",
  "Inventarios_Patrimoniais": "inventarios_patrimoniais",
  "inventarios_patrimoniais": "inventarios_patrimoniais",
  "tb_inventarios_patrimoniais": "inventarios_patrimoniais",
  "patrimonio": "inventarios_patrimoniais",
  "Requisicoes_Internas": "requisicoes_internas",
  "requisicoes_internas": "requisicoes_internas",
  "tb_requisicoes_internas": "requisicoes_internas",
  "requisicoes": "requisicoes_internas",
  "produtos_unificados": "produtosUnificados",
  "produtosUnificados": "produtosUnificados",
  "tb_produtos_unificados": "produtosUnificados",
  "tb_produtos": "produtosUnificados",
  "produtos": "produtosUnificados",
  "sigep_unified_products": "produtosUnificados",
  "pedidos": "pedidos",
  "tb_pedidos": "pedidos",
};

/**
 * Função utilitária para normalizar e garantir integridade das actividades planificadas por setor
 */
function normalizePlannedActivity(actData: any): any {
  if (!actData || typeof actData !== "object") return actData;
  const clean = { ...actData };

  // Garantir ano
  if (!clean.ano) {
    clean.ano = 2026;
  }

  // Garantir setor / repartição / departamento
  const setorVal = clean.setor || clean.sector || clean.areaDeAfetacao || clean.reparticao || "";
  const repVal = clean.reparticao || clean.setor || clean.areaDeAfetacao || "";
  const deptVal = clean.departamento || clean.unidadeOrganica || "";
  const dirVal = clean.direcao || clean.direccao || "";

  if (!clean.setor && setorVal) clean.setor = setorVal;
  if (!clean.reparticao && repVal) clean.reparticao = repVal;
  if (!clean.areaDeAfetacao && (setorVal || repVal)) clean.areaDeAfetacao = setorVal || repVal;

  // Se departamento estiver vazio, tentar inferir através das repartições conhecidas
  if (!clean.departamento) {
    for (const [dept, reps] of Object.entries(REPARTICOES)) {
      if (
        reps.some(
          (r) =>
            r.toLowerCase() === repVal.toLowerCase() ||
            r.toLowerCase() === setorVal.toLowerCase() ||
            repVal.toLowerCase().includes(r.toLowerCase()),
        )
      ) {
        clean.departamento = dept;
        break;
      }
    }
  }

  // Se direção estiver vazia, tentar inferir através do departamento
  if (!clean.direcao && clean.departamento) {
    for (const [dir, depts] of Object.entries(DEPARTAMENTOS)) {
      if (
        depts.some(
          (d) =>
            d.toLowerCase() === clean.departamento.toLowerCase() ||
            clean.departamento.toLowerCase().includes(d.toLowerCase()),
        )
      ) {
        clean.direcao = dir;
        break;
      }
    }
  }

  if (!clean.status) {
    clean.status = clean.tipoPlano === "Setorial" ? "setorial" : "planificacao";
  }

  return clean;
}

/**
 * Notifica a aplicação via evento sobre o estado do backup
 */
export function dispatchBackupAlert(detail: {
  status: "in_progress" | "completed" | "error";
  message: string;
  organName?: string;
  progressPercent?: number;
  record?: SystemBackupRecord;
  isManual?: boolean;
}) {
  try {
    // Only fire UI toast alert if explicitly manual or on completion/error, to prevent background tasks from disrupting navigation
    window.dispatchEvent(new CustomEvent("sigep_backup_alert", { detail }));
  } catch (e) {
    console.warn("Erro ao emitir evento de alerta de backup:", e);
  }
}

/**
 * Coleta os dados de todos os 4 Órgãos do Sistema
 */
export async function collectAllBackupData(
  onProgress?: (msg: string, percent?: number) => void,
): Promise<{
  backupData: BackupData;
  stats: Record<string, number>;
  organStats: Record<string, number>;
  totalRecords: number;
  errors: string[];
}> {
  const backupData: BackupData = {};
  const errors: string[] = [];
  const stats: Record<string, number> = {};
  const organStats: Record<string, number> = {};
  let totalRecords = 0;

  // Excluir coleções de configuração técnica do sistema para garantir que o backup é estritamente para dados
  const EXCLUDED_SYSTEM_COLLS = ["configuracoes", "config_sistema", "drafts"];

  let organIndex = 0;
  const totalOrgans = SYSTEM_ORGAOS.length;

  for (const organ of SYSTEM_ORGAOS) {
    organIndex++;
    organStats[organ.id] = 0;

    const pct = Math.round((organIndex / totalOrgans) * 90);
    const organProgressMsg = `[Órgão ${organIndex}/${totalOrgans}] ${organ.name}: A recolher dados... (${totalRecords} registos até agora)`;
    if (onProgress) onProgress(organProgressMsg, pct);
    dispatchBackupAlert({
      status: "in_progress",
      message: organProgressMsg,
      organName: organ.name,
      progressPercent: pct,
    });

    for (const collName of organ.collections) {
      if (EXCLUDED_SYSTEM_COLLS.includes(collName)) continue;
      try {
        let docs: BackupDocument[] = [];
        if (db) {
          try {
            const snapshot = await getDocs(collection(db, collName));
            docs = snapshot.docs.map((docItem) => ({
              id: docItem.id,
              ...docItem.data(),
            }));
          } catch (dbErr) {
            console.warn(`Aviso ao ler ${collName} no Firestore, a recorrer ao LocalStorage:`, dbErr);
          }
        }

        // Mesclar dados do LocalStorage se necessário
        try {
          const localKey = `sigep_local_${collName}`;
          const localVal = localStorage.getItem(localKey);
          if (localVal) {
            const parsedLocal: any[] = JSON.parse(localVal);
            if (Array.isArray(parsedLocal)) {
              const map = new Map<string, BackupDocument>();
              docs.forEach((d) => { if (d.id) map.set(d.id, d); });
              parsedLocal.forEach((item) => {
                const itemId = item.id || "local_" + Math.random().toString(36).substring(2, 9);
                if (!map.has(itemId)) {
                  map.set(itemId, { id: itemId, ...item });
                }
              });
              docs = Array.from(map.values());
            }
          }
        } catch (e) {
          console.error(`Erro ao mesclar local storage para ${collName}:`, e);
        }

        if (docs.length > 0) {
          backupData[collName] = docs;
          stats[collName] = docs.length;
          organStats[organ.id] += docs.length;
          totalRecords += docs.length;

          const collProgressMsg = `[Órgão ${organIndex}/${totalOrgans}] ${organ.name} › ${collName}: ${docs.length} registos recolhidos (Total acumulado: ${totalRecords} registos)`;
          if (onProgress) onProgress(collProgressMsg);
        }
      } catch (err: any) {
        console.error(`Erro ao exportar coleção ${collName} do órgão ${organ.name}:`, err);
        errors.push(`Falha no ${organ.name} (${collName}): ${err?.message || err}`);
      }
    }
  }

  // Guardar apenas chaves de dados do LocalStorage (excluindo configurações do sistema)
  try {
    const productsVal = localStorage.getItem("sigep_unified_products");
    if (productsVal) backupData["_localStorage_sigep_unified_products"] = JSON.parse(productsVal);
    const deletedProdsVal = localStorage.getItem("sigep_deleted_products");
    if (deletedProdsVal) backupData["_localStorage_sigep_deleted_products"] = JSON.parse(deletedProdsVal);
  } catch (e) {
    console.error("Erro ao exportar chaves de dados do LocalStorage:", e);
  }

  // Estrutura hierárquica complementar por Unidades
  try {
    const colaboradores = backupData["colaboradores"] || [];
    const actividades = backupData["actividades"] || backupData["matrix_activities"] || [];

    const unidadesMap: Record<string, any> = {};

    colaboradores.forEach((col: any) => {
      const dir = col.direccao || col.direcao || "Direção do Instituto Superior Politécnico de Songo";
      const dept = col.departamento || "Sem Departamento";
      const rep = col.reparticao || "Sem Repartição";
      const set = col.setor || col.sector || "Geral";

      const key = `${dir} | ${dept} | ${rep} | ${set}`;
      if (!unidadesMap[key]) {
        unidadesMap[key] = {
          direcao: dir,
          departamento: dept,
          reparticao: rep,
          setor: set,
          colaboradoresCount: 0,
          actividadesCount: 0,
        };
      }
      unidadesMap[key].colaboradoresCount++;
    });

    actividades.forEach((act: any) => {
      const dir = act.direcao || act.direccao || "Direção do Instituto Superior Politécnico de Songo";
      const dept = act.departamento || act.organicUnit || "Geral";
      const rep = act.reparticao || "Geral";
      const set = act.setor || act.sector || "Geral";

      const key = `${dir} | ${dept} | ${rep} | ${set}`;
      if (!unidadesMap[key]) {
        unidadesMap[key] = {
          direcao: dir,
          departamento: dept,
          reparticao: rep,
          setor: set,
          colaboradoresCount: 0,
          actividadesCount: 0,
        };
      }
      unidadesMap[key].actividadesCount++;
    });

    backupData["_metadata_unidades_organicas"] = {
      exportTimestamp: new Date().toISOString(),
      sistema: "SIGEP Songo",
      totalColecoes: Object.keys(backupData).length,
      resumoEstrutura: Object.values(unidadesMap),
    };
  } catch (metaErr) {
    console.warn("Aviso ao gerar metadados de unidades orgânicas:", metaErr);
  }

  return { backupData, stats, organStats, totalRecords, errors };
}

/**
 * Executa o backup completo dos 4 Órgãos e descarrega como ficheiro JSON
 */
export async function generateFullBackup(
  onProgress?: (msg: string) => void,
): Promise<BackupResult> {
  try {
    const { backupData, stats, organStats, totalRecords, errors } = await collectAllBackupData(onProgress);

    if (onProgress) onProgress("A preparar ficheiro JSON do backup dos 4 órgãos...");

    const jsonString = safeJSONStringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const meses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const diasSemana = [
      "Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"
    ];

    const mes = meses[now.getMonth()];
    const diaSemana = diasSemana[now.getDay()];
    const ano = now.getFullYear();
    const mesNum = String(now.getMonth() + 1).padStart(2, "0");
    const diaNum = String(now.getDate()).padStart(2, "0");
    const horas = String(now.getHours()).padStart(2, "0");
    const minutos = String(now.getMinutes()).padStart(2, "0");
    const segundos = String(now.getSeconds()).padStart(2, "0");

    const filename = `SIGEP_BACKUP_4ORGAOS_${mes}_${diaSemana}_${ano}-${mesNum}-${diaNum}_${horas}h${minutos}m${segundos}s.json`;

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(url), 1000);

    dispatchBackupAlert({
      status: "completed",
      message: `Backup manual concluído com sucesso! ${totalRecords} registos exportados dos 4 Órgãos.`,
      progressPercent: 100,
    });

    return {
      success: true,
      filename,
      collectionStats: stats,
      organStats,
      error: errors.length > 0 ? errors.join("; ") : undefined,
    };
  } catch (err: any) {
    console.error("Erro ao gerar arquivo de backup:", err);
    dispatchBackupAlert({
      status: "error",
      message: `Erro ao gerar backup: ${err?.message || err}`,
    });
    return { success: false, error: err?.message || String(err) };
  }
}

export async function exportFullBackup(
  onProgress?: (msg: string) => void,
): Promise<BackupResult> {
  return generateFullBackup(onProgress);
}

/**
 * Limpa e sanitiza recursivamente qualquer documento antes de gravar no Firestore,
 * removendo campos 'undefined', funções ou tipos incompatíveis com o Firestore SDK.
 */
export function cleanDocForFirestore(item: any): any {
  if (item === null || item === undefined) return null;
  if (typeof item !== "object") return item;
  if (item instanceof Date) return item.toISOString();
  if (Array.isArray(item)) {
    return item
      .filter((el) => el !== undefined)
      .map((el) => cleanDocForFirestore(el));
  }

  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(item)) {
    if (val === undefined) continue;
    if (typeof val === "function") continue;
    if (typeof val === "symbol") continue;
    cleaned[key] = cleanDocForFirestore(val);
  }
  return cleaned;
}

// Helper to normalize any input backup payload regardless of wrapping structure
export function normalizeBackupPayload(rawInputData: any): BackupData {
  if (!rawInputData) return {};
  let parsed = rawInputData;
  if (typeof parsed === "string") {
    try {
      let cleanStr = parsed.trim();
      // Remover BOM se presente
      if (cleanStr.charCodeAt(0) === 0xfeff) {
        cleanStr = cleanStr.substring(1);
      }
      // Remover markdown codeblocks se presentes (ex: ```json ... ```)
      if (cleanStr.startsWith("```")) {
        cleanStr = cleanStr.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "").trim();
      }
      parsed = JSON.parse(cleanStr);
    } catch (e) {
      console.error("Erro ao decodificar string JSON de backup:", e);
      return {};
    }
  }

  if (Array.isArray(parsed)) {
    // Caso 1: Array de tabelas no formato [{ name/table/collection: "colaboradores", data/rows/docs: [...] }]
    if (parsed.length > 0 && typeof parsed[0] === "object" && (parsed[0].table || parsed[0].tableName || parsed[0].collection || parsed[0].collectionName)) {
      const result: BackupData = {};
      parsed.forEach((entry: any) => {
        const cName = entry.collection || entry.collectionName || entry.table || entry.tableName;
        const rows = entry.docs || entry.data || entry.rows || entry.items;
        if (cName && Array.isArray(rows)) {
          result[cName] = rows;
        }
      });
      if (Object.keys(result).length > 0) return result;
    }

    // Caso 2: Array simples de documentos de uma única coleção
    const sample = parsed[0] || {};
    let targetColl = "matrix_activities";
    if (sample.nuit || sample.categoriaProfissional || sample.apelido || sample.nomeCompleto) {
      targetColl = "colaboradores";
    } else if (sample.email || sample.passwordHash) {
      targetColl = "users";
    } else if (sample.fornecedor || sample.precoUnitario || sample.produto) {
      targetColl = "produtosUnificados";
    } else if (sample.titulo || sample.descricaoActividade) {
      targetColl = "actividades";
    } else if (sample.numeroRastreio || sample.remetente) {
      targetColl = "expedientes";
    }
    return { [targetColl]: parsed };
  }

  if (typeof parsed === "object") {
    if (parsed.backupData && typeof parsed.backupData === "object" && !Array.isArray(parsed.backupData)) {
      return parsed.backupData;
    }
    if (parsed.data && typeof parsed.data === "object" && !Array.isArray(parsed.data)) {
      return parsed.data;
    }
    if (parsed.collections && typeof parsed.collections === "object" && !Array.isArray(parsed.collections)) {
      return parsed.collections;
    }
    if (parsed.content && typeof parsed.content === "object" && !Array.isArray(parsed.content)) {
      return parsed.content;
    }
    if (parsed.tables && typeof parsed.tables === "object" && !Array.isArray(parsed.tables)) {
      return parsed.tables;
    }
    if (parsed.databases && typeof parsed.databases === "object" && !Array.isArray(parsed.databases)) {
      return parsed.databases;
    }
    if (parsed.orgaos && typeof parsed.orgaos === "object" && !Array.isArray(parsed.orgaos)) {
      const flattened: BackupData = {};
      Object.values(parsed.orgaos).forEach((organObj: any) => {
        if (organObj && typeof organObj === "object") {
          const colls = organObj.collections || organObj.data || organObj;
          if (typeof colls === "object" && !Array.isArray(colls)) {
            Object.assign(flattened, colls);
          }
        }
      });
      if (Object.keys(flattened).length > 0) return flattened;
    }
    return parsed;
  }
  return {};
}

// Extract documents for a given collection from normalized backup data
export function extractDocsForCollection(data: BackupData, targetColl: string): BackupDocument[] {
  const matchingDocs: BackupDocument[] = [];
  const addedIds = new Set<string>();

  const targetLower = targetColl.toLowerCase();
  const synonyms: string[] = [targetColl, targetLower];

  // Map synonyms
  if (targetColl === "matrix_activities" || targetColl === "actividades" || targetColl === "plano_actividades") {
    synonyms.push("matrix_activities", "actividades", "plano_actividades", "matrixActivities", "plano_actividades_det", "plano_actividades", "activities", "tb_matrix_activities", "tb_actividades", "tb_plano_actividades");
  } else if (targetColl === "produtosUnificados" || targetColl === "produtos_unificados") {
    synonyms.push("produtosUnificados", "produtos_unificados", "produtos", "sigep_unified_products", "tb_produtos", "tb_produtos_unificados");
  } else if (targetColl === "colaboradores") {
    synonyms.push("colaboradores", "efetivo_geral", "funcionarios", "docentes", "tb_colaboradores", "tb_funcionarios");
  } else if (targetColl === "users") {
    synonyms.push("users", "utilizadores", "usuarios", "tb_utilizadores", "tb_usuarios", "tb_users");
  } else if (targetColl === "financial_data") {
    synonyms.push("financial_data", "orcamento_financas", "financas", "orcamentos", "tb_financial_data", "tb_orcamento_financas");
  } else if (targetColl === "expedientes") {
    synonyms.push("expedientes", "expediente", "tb_expedientes", "tb_expediente");
  } else if (targetColl === "disciplinas_academicas") {
    synonyms.push("disciplinas_academicas", "disciplinas", "tb_disciplinas_academicas", "tb_disciplinas");
  } else if (targetColl === "espacos_fisicos") {
    synonyms.push("espacos_fisicos", "espacos", "salas", "tb_espacos_fisicos");
  } else if (targetColl === "processos_individuais") {
    synonyms.push("processos_individuais", "processos", "processos_recursos_humanos", "tb_processos_individuais");
  } else if (targetColl === "materiais_bens") {
    synonyms.push("materiais_bens", "inventario_bens", "bens", "tb_materiais_bens", "tb_inventario_bens");
  } else if (targetColl === "service_requests") {
    synonyms.push("service_requests", "pedidos_servico", "tb_service_requests", "tb_pedidos_servico");
  }

  // Check aliases
  for (const [alias, real] of Object.entries(COLLECTION_ALIASES)) {
    if (real.toLowerCase() === targetLower || real === targetColl) {
      synonyms.push(alias, alias.toLowerCase());
    }
  }

  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith("_localStorage_") || key.startsWith("_metadata_")) continue;
    const keyLower = key.toLowerCase();
    const isMatch = synonyms.some((s) => s.toLowerCase() === keyLower);

    if (isMatch && Array.isArray(value)) {
      value.forEach((item) => {
        if (!item || typeof item !== "object") return;
        const rawId = (item as any).id || (item as any)._id || (item as any).nuit || (item as any).email || (item as any).numeroRastreio;
        const itemId = rawId ? String(rawId).trim() : "doc_" + Math.random().toString(36).substring(2, 9);
        if (!addedIds.has(itemId)) {
          addedIds.add(itemId);
          matchingDocs.push({ ...item, id: itemId });
        }
      });
    } else if (isMatch && value && typeof value === "object") {
      // Caso o valor seja um objeto com documentos mapeados por ID
      Object.entries(value).forEach(([docKey, docVal]) => {
        if (docVal && typeof docVal === "object" && !Array.isArray(docVal)) {
          const rawId = (docVal as any).id || docKey;
          const itemId = String(rawId).trim();
          if (!addedIds.has(itemId)) {
            addedIds.add(itemId);
            matchingDocs.push({ ...(docVal as any), id: itemId });
          }
        }
      });
    }
  }

  return matchingDocs;
}

// Single robust routine to restore a collection to Firestore and LocalStorage
export async function applyRestoredCollection(
  collName: string,
  docs: BackupDocument[],
): Promise<number> {
  if (!docs || docs.length === 0) return 0;

  const isActivityCollection = [
    "matrix_activities",
    "actividades",
    "plano_actividades",
    "drafts",
    "institucional_plans",
  ].includes(collName);

  const restoredItemsForLocal: any[] = [];
  let count = 0;

  // Process in safe batches of 200 (Firestore maximum batch size is 500)
  const BATCH_SIZE = 200;
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const chunk = docs.slice(i, i + BATCH_SIZE);

    if (db) {
      try {
        const batch = writeBatch(db);
        let batchCount = 0;

        chunk.forEach((docData) => {
          if (!docData || typeof docData !== "object") return;
          let cleanItem = isActivityCollection
            ? normalizePlannedActivity(docData)
            : docData;
          
          const rawId = (cleanItem as any).id || (cleanItem as any)._id || (cleanItem as any).nuit || (cleanItem as any).email;
          const targetId = rawId ? String(rawId).replace(/\//g, "_").trim() : "restored_" + Math.random().toString(36).substring(2, 9);
          const sanitizedPayload = cleanDocForFirestore({ ...cleanItem, id: targetId });

          const docRef = doc(db, collName, targetId);
          batch.set(docRef, sanitizedPayload, { merge: true });
          batchCount++;
          restoredItemsForLocal.push(sanitizedPayload);

          // Cross-save activities in both matrix_activities and actividades for complete compatibility
          if (collName === "matrix_activities") {
            const actRef = doc(db, "actividades", targetId);
            batch.set(actRef, sanitizedPayload, { merge: true });
          } else if (collName === "actividades") {
            const matRef = doc(db, "matrix_activities", targetId);
            batch.set(matRef, sanitizedPayload, { merge: true });
          }
        });

        await batch.commit();
        count += batchCount;
      } catch (batchErr) {
        console.warn(`Aviso ao salvar batch no Firestore para ${collName}, a recorrer ao salvamento individual resiliente:`, batchErr);
        
        // Salvamento sequencial individual no Firestore para garantir que nenhum documento é perdido
        for (const docData of chunk) {
          if (docData && typeof docData === "object") {
            let cleanItem = isActivityCollection
              ? normalizePlannedActivity(docData)
              : docData;
            const rawId = (cleanItem as any).id || (cleanItem as any)._id || (cleanItem as any).nuit || (cleanItem as any).email;
            const targetId = rawId ? String(rawId).replace(/\//g, "_").trim() : "restored_" + Math.random().toString(36).substring(2, 9);
            const sanitizedPayload = cleanDocForFirestore({ ...cleanItem, id: targetId });
            
            try {
              const docRef = doc(db, collName, targetId);
              await setDoc(docRef, sanitizedPayload, { merge: true });
              if (collName === "matrix_activities") {
                await setDoc(doc(db, "actividades", targetId), sanitizedPayload, { merge: true });
              } else if (collName === "actividades") {
                await setDoc(doc(db, "matrix_activities", targetId), sanitizedPayload, { merge: true });
              }
              count++;
            } catch (indErr) {
              console.error(`Erro ao salvar documento individual ${targetId} na coleção ${collName}:`, indErr);
            }
            restoredItemsForLocal.push(sanitizedPayload);
          }
        }
      }
    } else {
      chunk.forEach((docData) => {
        if (docData && typeof docData === "object") {
          let cleanItem = isActivityCollection
            ? normalizePlannedActivity(docData)
            : docData;
          const targetId = (cleanItem as any).id || "local_" + Math.random().toString(36).substring(2, 9);
          const sanitizedPayload = cleanDocForFirestore({ ...cleanItem, id: targetId });
          restoredItemsForLocal.push(sanitizedPayload);
          count++;
        }
      });
    }
  }

  // Update LocalStorage cache for immediate UI consumption
  if (restoredItemsForLocal.length > 0) {
    try {
      const localKey = `sigep_local_${collName}`;
      const existingLocal = localStorage.getItem(localKey);
      let mergedList: any[] = restoredItemsForLocal;
      if (existingLocal) {
        try {
          const parsed = JSON.parse(existingLocal);
          if (Array.isArray(parsed)) {
            const map = new Map<string, any>();
            parsed.forEach((item) => { if (item && item.id) map.set(item.id, item); });
            restoredItemsForLocal.forEach((item) => { if (item && item.id) map.set(item.id, item); });
            mergedList = Array.from(map.values());
          }
        } catch (_) {}
      }
      localStorage.setItem(localKey, safeJSONStringify(mergedList));

      // Sincronizações especiais
      if (collName === "matrix_activities" || collName === "actividades") {
        localStorage.setItem("sigep_matrix_activities", safeJSONStringify(mergedList));
        localStorage.setItem("sigep_actividades", safeJSONStringify(mergedList));
        localStorage.setItem("sigep_local_matrix_activities", safeJSONStringify(mergedList));
        localStorage.setItem("sigep_local_actividades", safeJSONStringify(mergedList));
      } else if (collName === "produtosUnificados" || collName === "produtos_unificados") {
        localStorage.setItem("sigep_unified_products", safeJSONStringify(mergedList));
        localStorage.setItem("sigep_local_produtosUnificados", safeJSONStringify(mergedList));
      } else if (collName === "colaboradores") {
        localStorage.setItem("sigep_local_colaboradores", safeJSONStringify(mergedList));
        const chefias = mergedList.filter((c) => {
          if (!c) return false;
          const cargo = String(c.cargoChefia || c.posicaoChefia || c.cargo || c.funcao || "").toLowerCase();
          return c.ehChefia === true || cargo.includes("chefe") || cargo.includes("diretor") || cargo.includes("coordenador") || cargo.includes("responsavel");
        });
        if (chefias.length > 0) {
          localStorage.setItem("sigep_local_colaboradores_chefia", safeJSONStringify(chefias));
        }
      }
    } catch (e) {
      console.error(`Erro ao atualizar LocalStorage para ${collName}:`, e);
    }
  }

  return count;
}

/**
 * Restaura exclusivamente os DADOS de utilizador para o Firestore e LocalStorage por Órgão.
 */
export async function restoreFullBackup(
  rawInputData: BackupData | any[] | string,
  onProgress?: (msg: string, percent?: number) => void,
): Promise<{ totalRestored: number; restoredStats: Record<string, number>; organStats: Record<string, number> }> {
  let totalRestored = 0;
  const restoredStats: Record<string, number> = {};
  const organStats: Record<string, number> = {};

  if (onProgress) onProgress("A validar e preparar dados de backup...", 5);

  const data = normalizeBackupPayload(rawInputData);
  localStorage.removeItem("sigep_quota_exceeded");

  // Proteger chaves de sessão do utilizador
  const SESSION_KEYS_TO_PROTECT = [
    "sigep_session_token",
    "sigep_logged_in_user",
    "sigep_current_view",
    "sigep_active_session_id",
  ];
  const protectedSessionState: Record<string, string | null> = {};
  SESSION_KEYS_TO_PROTECT.forEach((k) => {
    protectedSessionState[k] = localStorage.getItem(k);
  });

  // Restaurar chaves auxiliares
  if (data["_localStorage_all_keys"] && typeof data["_localStorage_all_keys"] === "object") {
    try {
      Object.entries(data["_localStorage_all_keys"]).forEach(([k, v]) => {
        if (SESSION_KEYS_TO_PROTECT.includes(k)) return;
        if (v !== undefined && v !== null) {
          const stringVal = typeof v === "string" ? v : safeJSONStringify(v);
          localStorage.setItem(k, stringVal);
        }
      });
    } catch (e) {
      console.error("Erro ao restaurar chaves auxiliares no LocalStorage:", e);
    }
  }

  SESSION_KEYS_TO_PROTECT.forEach((k) => {
    if (protectedSessionState[k] !== null) {
      localStorage.setItem(k, protectedSessionState[k]!);
    }
  });

  if (data["_localStorage_sigep_unified_products"]) {
    localStorage.setItem("sigep_unified_products", safeJSONStringify(data["_localStorage_sigep_unified_products"]));
  }
  if (data["_localStorage_sigep_deleted_products"]) {
    localStorage.setItem("sigep_deleted_products", safeJSONStringify(data["_localStorage_sigep_deleted_products"]));
  }

  // Contabilizar total de coleções para cálculo percentual detalhado
  const allTargetCollections: { organId: string; organName: string; collName: string }[] = [];
  SYSTEM_ORGAOS.forEach((organ) => {
    organ.collections.forEach((collName) => {
      allTargetCollections.push({ organId: organ.id, organName: organ.name, collName });
    });
  });

  const totalSteps = allTargetCollections.length;
  let currentStep = 0;

  // Restauração passo a passo pelos 4 Órgãos
  for (const organ of SYSTEM_ORGAOS) {
    organStats[organ.id] = 0;

    for (const collName of organ.collections) {
      currentStep++;
      const currentPercent = Math.min(95, Math.round(5 + (currentStep / totalSteps) * 85));

      const docs = extractDocsForCollection(data, collName);
      if (docs.length === 0) {
        if (onProgress) onProgress(`[${organ.shortName}] A verificar ${collName}...`, currentPercent);
        continue;
      }

      const msg = `[${organ.shortName}] A restaurar ${collName} (${docs.length} registos)...`;
      if (onProgress) onProgress(msg, currentPercent);
      dispatchBackupAlert({
        status: "in_progress",
        message: msg,
        organName: organ.name,
        progressPercent: currentPercent,
      });

      const collCount = await applyRestoredCollection(collName, docs);
      totalRestored += collCount;
      restoredStats[collName] = (restoredStats[collName] || 0) + collCount;
      organStats[organ.id] += collCount;

      const restoreLiveMsg = `[${organ.shortName}] › ${collName}: ${collCount} registos restaurados (Total: ${totalRestored})`;
      if (onProgress) onProgress(restoreLiveMsg, currentPercent);
    }
  }

  // Restaurar quaisquer coleções adicionais no payload que não estejam mapeadas explicitamente nos 4 órgãos
  const extraKeys = Object.entries(data).filter(([key, value]) => {
    if (key.startsWith("_localStorage_") || key.startsWith("_metadata_")) return false;
    const normalized = COLLECTION_ALIASES[key] || key;
    return restoredStats[normalized] === undefined && Array.isArray(value) && value.length > 0;
  });

  for (let idx = 0; idx < extraKeys.length; idx++) {
    const [key, value] = extraKeys[idx];
    const normalized = COLLECTION_ALIASES[key] || key;
    const extraDocs: BackupDocument[] = value;
    const pct = Math.min(98, Math.round(90 + ((idx + 1) / (extraKeys.length || 1)) * 8));

    if (onProgress) onProgress(`A restaurar coleção adicional ${normalized}...`, pct);
    const collCount = await applyRestoredCollection(normalized, extraDocs);
    totalRestored += collCount;
    restoredStats[normalized] = collCount;
  }

  dispatchBackupAlert({
    status: "completed",
    message: `Restauração concluída com sucesso! ${totalRestored} registos salvos em todos os 4 Órgãos.`,
    progressPercent: 100,
  });

  try {
    localStorage.setItem("sigep_last_restore", Date.now().toString());
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sigep_data_restored", { detail: { totalRestored, restoredStats, organStats } }));
      window.dispatchEvent(new Event("storage"));
    }
  } catch (_) {}

  if (onProgress) onProgress("Restauração de todos os dados e órgãos concluída com sucesso!", 100);
  return { totalRestored, restoredStats, organStats };
}

/**
 * Executa um Backup Automático do sistema, salva no Firestore e LocalStorage e avisa o Administrador
 */
export async function runAutomaticBackup(
  isManualTrigger = false,
  onProgress?: (msg: string, percent?: number) => void,
): Promise<SystemBackupRecord> {
  const now = new Date();
  const backupId = `auto_backup_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, "0")}_${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;

  const formattedDate = now.toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  dispatchBackupAlert({
    status: "in_progress",
    message: `Backup Automático em curso pelo Sistema [${isManualTrigger ? "Manual" : "Agendado"}]...`,
    progressPercent: 10,
  });

  const { backupData, stats, organStats, totalRecords } = await collectAllBackupData(onProgress);

  const jsonString = safeJSONStringify(backupData);
  const sizeKB = Math.round(jsonString.length / 1024);

  const record: SystemBackupRecord = {
    id: backupId,
    timestamp: now.toISOString(),
    formattedDate,
    type: isManualTrigger ? "manual" : "auto",
    totalRecords,
    totalSizeKB: sizeKB,
    organStats,
    collectionStats: stats,
    backupData,
    status: "completed",
  };

  // Salvar no Firestore na coleção system_backups de forma segura sem estourar o limite de 1MB por documento
  try {
    if (db) {
      const docRef = doc(db, "system_backups", backupId);
      const isSizeSafeForSingleDoc = jsonString.length < 650000;

      const firestorePayload: any = {
        id: backupId,
        timestamp: record.timestamp,
        formattedDate: record.formattedDate,
        type: record.type,
        totalRecords: record.totalRecords,
        totalSizeKB: record.totalSizeKB,
        organStats: record.organStats,
        collectionStats: record.collectionStats,
        status: record.status,
      };

      if (isSizeSafeForSingleDoc) {
        firestorePayload.backupData = backupData;
      }

      await setDoc(docRef, firestorePayload, { merge: true });

      // Salvar coleções com particionamento seguro (chunks de 100 documentos) nas subcoleções
      for (const [collName, docs] of Object.entries(backupData)) {
        if (Array.isArray(docs) && docs.length > 0) {
          const CHUNK_SIZE = 100;
          for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
            const chunk = docs.slice(i, i + CHUNK_SIZE);
            const partIndex = Math.floor(i / CHUNK_SIZE);
            const chunkDocId = partIndex === 0 && docs.length <= CHUNK_SIZE ? collName : `${collName}_part_${partIndex}`;
            try {
              const subDocRef = doc(db, "system_backups", backupId, "collections", chunkDocId);
              await setDoc(subDocRef, {
                docs: chunk,
                collectionName: collName,
                partIndex,
                totalParts: Math.ceil(docs.length / CHUNK_SIZE),
              }, { merge: true });
            } catch (subErr) {
              console.warn(`Aviso ao salvar chunk ${chunkDocId} no backup ${backupId}:`, subErr);
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn("Aviso ao salvar backup no Firestore:", e);
  }

  // Atualizar cache seguro no LocalStorage
  try {
    localStorage.setItem(`sigep_backup_${backupId}`, jsonString);
    localStorage.setItem("sigep_backup_latest", jsonString);
    localStorage.setItem("sigep_last_auto_backup_time", String(now.getTime()));
  } catch (e) {
    console.warn("Aviso ao salvar cópia de segurança em cache local:", e);
  }

  dispatchBackupAlert({
    status: "completed",
    message: `Backup Automático concluído com sucesso às ${now.toLocaleTimeString("pt-PT")}! ${totalRecords} registos salvos nos 4 Órgãos.`,
    progressPercent: 100,
    record,
  });

  return record;
}

/**
 * Executa o backup automático se tiverem passado mais de 12 horas
 */
export async function runAutomaticBackupIfNeeded(): Promise<SystemBackupRecord | null> {
  try {
    const lastTimeStr = localStorage.getItem("sigep_last_auto_backup_time");
    const lastTime = lastTimeStr ? parseInt(lastTimeStr, 10) : 0;
    const now = Date.now();

    if (now - lastTime > 43200000 || !lastTimeStr) {
      console.log("A iniciar Backup Automático de rotina dos 4 Órgãos...");
      return await runAutomaticBackup(false);
    }
  } catch (e) {
    console.error("Erro ao verificar/executar backup automático de rotina:", e);
  }
  return null;
}

export async function autoRestoreOnStartup(onProgress?: (msg: string) => void): Promise<boolean> {
  try {
    // Check if Firestore database already contains users or matrix activities
    const existingUsers = await firestoreService.users.get().catch(() => []);
    const existingActivities = await firestoreService.matrixActivities.get().catch(() => []);
    if ((existingUsers && existingUsers.length > 0) || (existingActivities && existingActivities.length > 0)) {
      console.log("Base de dados com dados já armazenados. Preservando estado atual do Firestore sem sobravancar.");
      return true;
    }

    console.log("Base de dados vazia detetada. A verificar e carregar o último backup para restaurar informações...");
    
    // 1. Tentar encontrar o backup mais recente a partir da lista de backups (Firestore + LocalStorage)
    const backupsList = await getStoredBackupsList();
    if (backupsList && backupsList.length > 0) {
      const latestRecord = backupsList[0];
      console.log(`Último backup encontrado: ${latestRecord.id} (${latestRecord.formattedDate}). A restaurar dados...`);
      
      const fullData = await getStoredBackupData(latestRecord);
      if (fullData && Object.keys(fullData).length > 0) {
        await restoreFullBackup(fullData, onProgress);
        console.log("Último backup restaurado com sucesso no arranque do sistema!");
        return true;
      }
    }

    // 2. Tentar pelo cache de último backup no localStorage se a lista do Firestore não retornou dados
    const latestBackupStr = localStorage.getItem("sigep_backup_latest");
    if (latestBackupStr) {
      console.log("A restaurar a partir do cache local do último backup...");
      const parsed = JSON.parse(latestBackupStr);
      await restoreFullBackup(parsed, onProgress);
      return true;
    }
  } catch (e) {
    console.warn("Aviso ao executar restauração automática no arranque:", e);
  }
  return false;
}

/**
 * Obtém os dados completos de um backup salvo, reconstruindo de forma multi-camada
 */
export async function getStoredBackupData(record: SystemBackupRecord): Promise<BackupData> {
  if (record.backupData && typeof record.backupData === "object" && Object.keys(record.backupData).length > 0) {
    return record.backupData;
  }

  const rawAny = record as any;
  if (rawAny.data && typeof rawAny.data === "object" && Object.keys(rawAny.data).length > 0) {
    return rawAny.data;
  }
  if (rawAny.collections && typeof rawAny.collections === "object" && Object.keys(rawAny.collections).length > 0) {
    return rawAny.collections;
  }

  const restoredData: BackupData = {};

  if (db && record.id) {
    try {
      // 1. Ler o documento completo no Firestore
      const docSnapshot = await getDoc(doc(db, "system_backups", record.id));
      if (docSnapshot.exists()) {
        const fullData = docSnapshot.data();
        if (fullData) {
          if (fullData.backupData && typeof fullData.backupData === "object" && Object.keys(fullData.backupData).length > 0) {
            return fullData.backupData;
          }
          if (fullData.data && typeof fullData.data === "object" && Object.keys(fullData.data).length > 0) {
            return fullData.data;
          }
          if (fullData.collections && typeof fullData.collections === "object" && Object.keys(fullData.collections).length > 0) {
            return fullData.collections;
          }
        }
      }

      // 2. Ler as subcoleções (inclusive particionadas em chunks)
      const subCollsSnapshot = await getDocs(collection(db, "system_backups", record.id, "collections"));
      subCollsSnapshot.docs.forEach((d) => {
        const dData = d.data();
        if (dData) {
          const collName = dData.collectionName || d.id.replace(/_part_\d+$/, "");
          const items = Array.isArray(dData.docs)
            ? dData.docs
            : Array.isArray(dData.data)
            ? dData.data
            : Array.isArray(dData.items)
            ? dData.items
            : null;

          if (items && items.length > 0) {
            if (!restoredData[collName]) {
              restoredData[collName] = [];
            }
            restoredData[collName] = restoredData[collName].concat(items);
          }
        }
      });
    } catch (e) {
      console.warn(`Erro ao recuperar subcoleções para backup ${record.id}:`, e);
    }
  }

  if (Object.keys(restoredData).length > 0) {
    return restoredData;
  }

  // 3. Tentar recuperar de caches no LocalStorage
  try {
    const cachedBackupStr =
      localStorage.getItem(`sigep_backup_${record.id}`) ||
      localStorage.getItem(`sigep_auto_backup_${record.id}`);
    if (cachedBackupStr) {
      const parsed = JSON.parse(cachedBackupStr);
      const normalized = normalizeBackupPayload(parsed);
      if (Object.keys(normalized).length > 0) {
        return normalized;
      }
    }
  } catch (_) {}

  return restoredData;
}

/**
 * Obtém a lista de backups salvos no sistema
 */
export async function getStoredBackupsList(): Promise<SystemBackupRecord[]> {
  const map = new Map<string, SystemBackupRecord>();

  if (db) {
    try {
      const snapshot = await getDocs(collection(db, "system_backups"));
      snapshot.docs.forEach((docItem) => {
        const data = docItem.data() as SystemBackupRecord;
        if (data && (data.id || docItem.id)) {
          const docId = data.id || docItem.id;
          if (map.has(docId)) {
            const existing = map.get(docId)!;
            map.set(docId, { ...existing, ...data, id: docId, backupData: data.backupData || existing.backupData });
          } else {
            map.set(docId, { ...data, id: docId });
          }
        }
      });
    } catch (e) {
      console.warn("Aviso ao ler backups do Firestore:", e);
    }
  }

  // Verificar se há backups salvos em cache local
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sigep_backup_") && key !== "sigep_backup_latest") {
        const backupId = key.replace("sigep_backup_", "");
        if (!map.has(backupId)) {
          try {
            const val = localStorage.getItem(key);
            if (val) {
              const parsed = JSON.parse(val);
              const norm = normalizeBackupPayload(parsed);
              const total = Object.values(norm).reduce((acc: number, arr: any) => acc + (Array.isArray(arr) ? arr.length : 0), 0);
              map.set(backupId, {
                id: backupId,
                timestamp: new Date().toISOString(),
                formattedDate: "Backup Local (" + backupId + ")",
                type: "manual",
                totalRecords: total,
                totalSizeKB: Math.round(val.length / 1024),
                organStats: {},
                collectionStats: {},
                backupData: norm,
                status: "completed",
              });
            }
          } catch (_) {}
        }
      }
    }
  } catch (_) {}

  const result = Array.from(map.values());
  result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return result;
}

/**
 * Exclui permanentemente um backup guardado no sistema
 */
export async function deleteStoredBackup(backupId: string): Promise<boolean> {
  let success = false;
  if (db) {
    try {
      // Excluir subcoleções se existirem
      try {
        const subSnapshot = await getDocs(collection(db, "system_backups", backupId, "collections"));
        for (const d of subSnapshot.docs) {
          await deleteDoc(d.ref);
        }
      } catch (subErr) {
        console.warn("Aviso ao excluir subcoleções de backup:", subErr);
      }

      await deleteDoc(doc(db, "system_backups", backupId));
      success = true;
    } catch (error) {
      console.warn("Aviso ao excluir backup do Firestore:", error);
    }
  }

  try {
    localStorage.removeItem(`sigep_backup_${backupId}`);
    localStorage.removeItem(`sigep_auto_backup_${backupId}`);

    const latestStr = localStorage.getItem("sigep_backup_latest");
    if (latestStr) {
      try {
        const parsed = JSON.parse(latestStr);
        if (parsed.id === backupId) {
          localStorage.removeItem("sigep_backup_latest");
        }
      } catch (_) {}
    }
    success = true;
  } catch (_) {}

  return success;
}

/**
 * Faz o download do ficheiro JSON de um backup armazenado no sistema
 */
export async function downloadStoredBackupFile(record: SystemBackupRecord) {
  let fullBackupData = await getStoredBackupData(record);
  if (!fullBackupData || Object.keys(fullBackupData).length === 0) {
    const wantFresh = window.confirm(
      `O registo de backup de ${record.formattedDate} é um sumário de sistema. Deseja gerar e descarregar agora o ficheiro JSON consolidado com todos os dados atuais dos 4 Órgãos?`,
    );
    if (wantFresh) {
      await generateFullBackup();
    }
    return;
  }

  const jsonString = safeJSONStringify(fullBackupData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `SIGEP_BACKUP_4ORGAOS_${record.id}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getLoggedInUser(): any {
  try {
    const userStr = localStorage.getItem("sigep_logged_in_user") || localStorage.getItem("sigep_user");
    if (userStr) return JSON.parse(userStr);
  } catch (e) {}
  return null;
}

function isUserAdmin(user: any): boolean {
  if (!user) return true;
  const email = String(user.email || "").toLowerCase().trim();
  if (email === "slaitertripas@gmail.com") return true;
  const role = String(user.role || "").toLowerCase();
  if (role.includes("admin") || role.includes("diretor-geral") || role.includes("diretor geral")) return true;
  return false;
}

/**
 * Funções Independentes para Backup e Restauração de DADOS e SISTEMA
 */
export async function generateTargetedBackup(
  allowedCollections: string[],
  prefixName: string,
  backupLabel: string,
  onProgress?: (msg: string) => void,
): Promise<BackupResult> {
  try {
    const backupData: BackupData = {};
    const stats: Record<string, number> = {};
    const organStats: Record<string, number> = {};
    let totalRecords = 0;
    const errors: string[] = [];

    const loggedInUser = getLoggedInUser();
    const isAdmin = isUserAdmin(loggedInUser);
    const sectorFilter = (!isAdmin && loggedInUser) ? String(loggedInUser.setor || loggedInUser.sector || loggedInUser.reparticao || loggedInUser.departamento || "").toLowerCase().trim() : "";

    let collIndex = 0;
    const totalColls = allowedCollections.length;

    for (const collName of allowedCollections) {
      collIndex++;
      const progressMsg = `[${backupLabel}] A recolher coleção ${collName} (${collIndex}/${totalColls})... Total acumulado: ${totalRecords} registos`;
      if (onProgress) onProgress(progressMsg);
      dispatchBackupAlert({
        status: "in_progress",
        message: progressMsg,
        progressPercent: Math.round((collIndex / totalColls) * 90),
      });

      try {
        let docs: BackupDocument[] = [];
        if (db) {
          try {
            const snapshot = await getDocs(collection(db, collName));
            docs = snapshot.docs.map((docItem) => ({
              id: docItem.id,
              ...docItem.data(),
            }));
          } catch (dbErr) {
            console.warn(`Aviso ao ler ${collName} no Firestore:`, dbErr);
          }
        }

        try {
          const localKey = `sigep_local_${collName}`;
          const localVal = localStorage.getItem(localKey);
          if (localVal) {
            const parsedLocal: any[] = JSON.parse(localVal);
            if (Array.isArray(parsedLocal)) {
              const map = new Map<string, BackupDocument>();
              docs.forEach((d) => { if (d.id) map.set(d.id, d); });
              parsedLocal.forEach((item) => {
                const itemId = item.id || "local_" + Math.random().toString(36).substring(2, 9);
                if (!map.has(itemId)) {
                  map.set(itemId, { id: itemId, ...item });
                }
              });
              docs = Array.from(map.values());
            }
          }
        } catch (e) {
          console.error(`Erro local storage para ${collName}:`, e);
        }

        // Se for utilizador setorial (não administrador), filtrar estritamente para o seu setor
        if (sectorFilter && prefixName === "SIGEP_BACKUP_DADOS") {
          docs = docs.filter((docItem: any) => {
            const itemSector = String(docItem.setor || docItem.sector || docItem.reparticao || docItem.departamento || "").toLowerCase().trim();
            const itemOwner = String(docItem.email || docItem.criadoPor || "").toLowerCase().trim();
            const userEmail = String(loggedInUser?.email || "").toLowerCase().trim();
            if (itemOwner && userEmail && itemOwner === userEmail) return true;
            if (!itemSector) return false;
            return itemSector.includes(sectorFilter) || sectorFilter.includes(itemSector);
          });
        }

        if (docs.length > 0) {
          backupData[collName] = docs;
          stats[collName] = docs.length;
          totalRecords += docs.length;

          const activeOrgan = SYSTEM_ORGAOS.find((o) => o.collections.includes(collName));
          if (activeOrgan) {
            organStats[activeOrgan.id] = (organStats[activeOrgan.id] || 0) + docs.length;
          }

          if (onProgress) onProgress(`[${backupLabel}] ${collName}: ${docs.length} registos recolhidos (Total: ${totalRecords})`);
        }
      } catch (err: any) {
        errors.push(`Falha em ${collName}: ${err?.message || err}`);
      }
    }

    if (onProgress) onProgress(`A preparar ficheiro JSON para ${backupLabel}...`);

    const jsonString = safeJSONStringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const ano = now.getFullYear();
    const mesNum = String(now.getMonth() + 1).padStart(2, "0");
    const diaNum = String(now.getDate()).padStart(2, "0");
    const horas = String(now.getHours()).padStart(2, "0");
    const minutos = String(now.getMinutes()).padStart(2, "0");
    const segundos = String(now.getSeconds()).padStart(2, "0");

    const filename = `${prefixName}_${ano}-${mesNum}-${diaNum}_${horas}h${minutos}m${segundos}s.json`;

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(url), 1000);

    dispatchBackupAlert({
      status: "completed",
      message: `${backupLabel} concluído com sucesso! ${totalRecords} registos exportados.`,
      progressPercent: 100,
    });

    return {
      success: true,
      filename,
      collectionStats: stats,
      organStats,
      error: errors.length > 0 ? errors.join("; ") : undefined,
    };
  } catch (err: any) {
    console.error(`Erro em ${backupLabel}:`, err);
    dispatchBackupAlert({
      status: "error",
      message: `Erro em ${backupLabel}: ${err?.message || err}`,
    });
    return { success: false, error: err?.message || String(err) };
  }
}

export async function exportDataBackup(onProgress?: (msg: string, percent?: number) => void): Promise<BackupResult> {
  return generateFullBackup(onProgress);
}

export async function exportSystemBackup(onProgress?: (msg: string, percent?: number) => void): Promise<BackupResult> {
  const systemColls = [
    "users", "documentos_normativos", "calendar_events", "notes", "messages", "configuracoes", "config_sistema", "drafts", "system_backups"
  ];
  return generateTargetedBackup(systemColls, "SIGEP_BACKUP_SISTEMA", "Backup do Sistema", onProgress);
}

export async function restoreTargetedBackup(
  rawInputData: BackupData | any[] | string,
  allowedCollections: string[],
  backupLabel: string,
  onProgress?: (msg: string, percent?: number) => void,
): Promise<{ totalRestored: number; restoredStats: Record<string, number>; organStats: Record<string, number> }> {
  let totalRestored = 0;
  const restoredStats: Record<string, number> = {};
  const organStats: Record<string, number> = {};

  if (onProgress) onProgress(`A iniciar ${backupLabel}...`, 5);

  const data = normalizeBackupPayload(rawInputData);
  localStorage.removeItem("sigep_quota_exceeded");

  let collIndex = 0;
  const totalColls = allowedCollections.length;

  for (const collName of allowedCollections) {
    collIndex++;
    const currentPercent = Math.min(95, Math.round(5 + (collIndex / totalColls) * 85));

    const docs = extractDocsForCollection(data, collName);
    if (docs.length === 0) {
      if (onProgress) onProgress(`[${backupLabel}] A verificar ${collName}...`, currentPercent);
      continue;
    }

    const progressMsg = `[${backupLabel}] A restaurar ${collName} (${docs.length} registos)... (${collIndex}/${totalColls})`;
    if (onProgress) onProgress(progressMsg, currentPercent);
    dispatchBackupAlert({
      status: "in_progress",
      message: progressMsg,
      progressPercent: currentPercent,
    });

    const collCount = await applyRestoredCollection(collName, docs);
    totalRestored += collCount;
    restoredStats[collName] = collCount;

    const activeOrgan = SYSTEM_ORGAOS.find((o) => o.collections.includes(collName));
    if (activeOrgan) {
      organStats[activeOrgan.id] = (organStats[activeOrgan.id] || 0) + collCount;
    }

    if (onProgress) onProgress(`[${backupLabel}] ${collName}: ${collCount} registos restaurados com sucesso`, currentPercent);
  }

  dispatchBackupAlert({
    status: "completed",
    message: `${backupLabel} concluído! ${totalRestored} registos restaurados com sucesso.`,
    progressPercent: 100,
  });

  try {
    localStorage.setItem("sigep_last_restore", Date.now().toString());
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sigep_data_restored", { detail: { totalRestored, restoredStats, organStats } }));
      window.dispatchEvent(new Event("storage"));
    }
  } catch (_) {}

  if (onProgress) onProgress(`${backupLabel} concluído com sucesso!`, 100);
  return { totalRestored, restoredStats, organStats };
}

export async function restoreDataBackup(rawInputData: BackupData | any[] | string, onProgress?: (msg: string, percent?: number) => void) {
  return restoreFullBackup(rawInputData, onProgress);
}

export async function restoreSystemBackup(rawInputData: BackupData | any[] | string, onProgress?: (msg: string, percent?: number) => void) {
  const systemColls = [
    "users", "documentos_normativos", "calendar_events", "notes", "messages", "configuracoes", "config_sistema", "drafts", "system_backups"
  ];
  return restoreTargetedBackup(rawInputData, systemColls, "Restauração do Sistema", onProgress);
}

export async function exportOrganBackup(organId: string, onProgress?: (msg: string, percent?: number) => void): Promise<BackupResult> {
  const organ = SYSTEM_ORGAOS.find((o) => o.id === organId);
  if (!organ) throw new Error("Órgão não encontrado");
  const prefix = `SIGEP_ORGAO_${organ.id.toUpperCase()}`;
  return generateTargetedBackup(organ.collections, prefix, `Backup do Órgão: ${organ.name}`, onProgress);
}

export async function restoreOrganBackup(organId: string, rawInputData: BackupData | any[] | string, onProgress?: (msg: string, percent?: number) => void) {
  const organ = SYSTEM_ORGAOS.find((o) => o.id === organId);
  if (!organ) throw new Error("Órgão não encontrado");
  return restoreTargetedBackup(rawInputData, organ.collections, `Restauração do Órgão: ${organ.name}`, onProgress);
}


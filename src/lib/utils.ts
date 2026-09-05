import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { onAuthStateChanged } from "firebase/auth"; // Not used here but keep if any other import was there, actually let's just import EFETIVO_GERAL_DATA
import { EFETIVO_GERAL_DATA } from "../constants/colaboradoresList";

/**
 * Utility for running a promise with a timeout.
 * @param promise The promise to run
 * @param ms Timeout in milliseconds
 * @param errorMsg Custom error message for timeout
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  errorMsg?: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              errorMsg ||
                `Tempo de ligação esgotado (${ms}ms). Por favor, verifique a sua internet e tente novamente.`,
            ),
          ),
        ms,
      ),
    ),
  ]);
}

export function normalizeString(str: any): string {
  if (!str) return "";
  return String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function toSentenceCase(text: any): string {
  if (!text) return "";
  const s = String(text);
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function isPlainObject(val: any): boolean {
  if (val === null || typeof val !== "object") return false;
  if (Array.isArray(val)) return false;
  if (val instanceof Date) return false;
  
  try {
    const proto = Object.getPrototypeOf(val);
    if (proto === null) return true;
    if (proto !== Object.prototype) return false;
    
    const ctor = val.constructor;
    if (ctor === undefined) return true;
    if (typeof ctor !== "function") return false;
    
    return ctor === Object;
  } catch (e) {
    return false;
  }
}

export function sanitizeForJSON(obj: any, seen = new WeakSet()): any {
  if (obj === null || obj === undefined) return obj;
  const type = typeof obj;
  if (type === "number" || type === "boolean" || type === "string") return obj;
  if (type === "bigint") return obj.toString();
  if (type === "function" || type === "symbol") return undefined;

  if (type === "object") {
    if (seen.has(obj)) {
      return undefined;
    }
    seen.add(obj);

    try {
      if (obj instanceof Date) {
        return isNaN(obj.getTime()) ? null : obj.toISOString();
      }

      if (typeof obj.toDate === "function") {
        try { return obj.toDate().toISOString(); } catch (e) { return null; }
      }

      // Check constructor name for Firebase/internal internal classes like Y2, Ka, etc.
      const ctorName = obj.constructor && typeof obj.constructor.name === "string" ? obj.constructor.name : "";
      if (
        ctorName.length <= 3 && /^[A-Z][a-zA-Z0-9]*$/.test(ctorName) && ctorName !== "Map" && ctorName !== "Set" && ctorName !== "Error"
      ) {
        return undefined;
      }

      // Extra check for React / DOM / Event objects / internal SDK instances / circular structures
      if (
        (typeof Node !== "undefined" && obj instanceof Node) ||
        (typeof Window !== "undefined" && obj instanceof Window) ||
        (typeof Event !== "undefined" && obj instanceof Event) ||
        obj.nodeType ||
        obj.$$typeof ||
        obj.nativeEvent ||
        obj.src ||
        obj.i ||
        obj._delegate
      ) {
        if (typeof obj.path === "string" || typeof obj.path === "number") return String(obj.path);
        if (typeof obj.id === "string" || typeof obj.id === "number") return String(obj.id);
        if (typeof obj.message === "string") return obj.message;
        return undefined;
      }

      if (Array.isArray(obj)) {
        return obj
          .map((item) => sanitizeForJSON(item, seen))
          .filter((item) => item !== undefined);
      }

      if (!isPlainObject(obj)) {
        if (typeof obj.path === "string" || typeof obj.path === "number") return String(obj.path);
        if (typeof obj.id === "string" || typeof obj.id === "number") return String(obj.id);
        if (typeof obj.uid === "string" || typeof obj.uid === "number") return { uid: String(obj.uid), email: String(obj.email || "") };
        return undefined;
      }

      const cleanObj: Record<string, any> = {};
      for (const key of Object.keys(obj)) {
        if (key.startsWith("_") && key !== "_id") continue;
        try {
          const val = obj[key];
          const sanitized = sanitizeForJSON(val, seen);
          if (sanitized !== undefined) {
            cleanObj[key] = sanitized;
          }
        } catch (e) {
          // Ignore inaccessible properties/getters
        }
      }
      return cleanObj;
    } catch (err) {
      return undefined;
    }
  }

  return String(obj);
}

export const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key: string, value: any) => {
    if (value === null || value === undefined) return value;
    if (typeof value === "bigint") {
      return value.toString();
    }
    if (typeof value === "function" || typeof value === "symbol") {
      return undefined;
    }
    if (typeof value === "object") {
      if (seen.has(value)) {
        return undefined;
      }
      seen.add(value);

      try {
        if (value instanceof Date) {
          return isNaN(value.getTime()) ? null : value.toISOString();
        }
        if (typeof value.toDate === "function") {
          try { return value.toDate().toISOString(); } catch (e) { return null; }
        }

        if (Array.isArray(value)) {
          return value;
        }

        const ctorName = value.constructor && typeof value.constructor.name === "string" ? value.constructor.name : "";
        if (
          (ctorName.length <= 3 && /^[A-Z][a-zA-Z0-9]*$/.test(ctorName) && ctorName !== "Map" && ctorName !== "Set" && ctorName !== "Error") ||
          value.src ||
          value.i ||
          value._delegate
        ) {
          return undefined;
        }

        if (!isPlainObject(value)) {
          if (typeof value.path === "string" || typeof value.path === "number") return String(value.path);
          if (typeof value.id === "string" || typeof value.id === "number") return String(value.id);
          if (typeof value.message === "string") return value.message;
          return undefined;
        }

        if (
          (typeof Node !== "undefined" && value instanceof Node) ||
          (typeof Window !== "undefined" && value instanceof Window) ||
          (typeof Event !== "undefined" && value instanceof Event) ||
          value.nodeType ||
          value.$$typeof ||
          value.nativeEvent ||
          value.src ||
          value.i ||
          value._delegate
        ) {
          return undefined;
        }
      } catch (err) {
        return undefined;
      }
    }
    return value;
  };
};

export function safeJSONStringify(
  obj: any,
  replacer?: any,
  space?: string | number,
): string {
  try {
    const cleanObj = sanitizeForJSON(obj);
    if (typeof replacer === "function") {
      return JSON.stringify(cleanObj, (key, value) => {
        try {
          return replacer(key, value);
        } catch (e) {
          return undefined;
        }
      }, space);
    }
    return JSON.stringify(cleanObj, getCircularReplacer(), space);
  } catch (err) {
    console.warn("safeJSONStringify fallback:", err);
    try {
      const fallbackClean = sanitizeForJSON(obj, new WeakSet());
      return JSON.stringify(fallbackClean, getCircularReplacer(), space);
    } catch (e) {
      return "{}";
    }
  }
}

/**
 * Prompts the user for confirmation before leaving the workspace.
 */
export const confirmWorkspaceExit = (callback: () => void) => {
  if (window.confirm("Pretende sair da sua área de trabalho?")) {
    callback();
  }
};

const EXCLUSIONS = new Set(["de", "da", "do", "das", "dos", "e", "a", "o"]);

const CORRECTIONS: Record<string, string> = {
  quimica: "Química",
  matematica: "Matemática",
  fisica: "Física",
  informatica: "Informática",
  ciencias: "Ciências",
  gestao: "Gestão",
  administracao: "Administração",
  biologia: "Biologia",
  portugues: "Português",
  ingles: "Inglês",
  geografia: "Geografia",
  historia: "História",
  educacao: "Educação",
  comunicacao: "Comunicação",
  tecnologia: "Tecnologia",
  engenharias: "Engenharias",
  engenharia: "Engenharia",
  civil: "Civil",
  mecanica: "Mecânica",
  eletrica: "Elétrica",
  eletronica: "Eletrónica",
  medicina: "Medicina",
  direito: "Direito",
  contabilidade: "Contabilidade",
  economia: "Economia",
  departamento: "Departamento",
  direcao: "Direção",
  direccao: "Direção",
  reparticao: "Repartição",
  seccao: "Secção",
  seccoes: "Secções",
  academica: "Académica",
  pedagogica: "Pedagógica",
  cientifica: "Científica",
  investigacao: "Investigação",
  extensao: "Extensão",
  estagios: "Estágios",
  inovacao: "Inovação",
  tecnologias: "Tecnologias",
  informacao: "Informação",
  publicas: "Públicas",
  relacoes: "Relações",
  internacionais: "Internacionais",
  recursos: "Recursos",
  humanos: "Humanos",
  patrimonio: "Património",
  financas: "Finanças",
  estudos: "Estudos",
  projetos: "Projetos",
  projectos: "Projetos",
  avaliacao: "Avaliação",
  qualidade: "Qualidade",
  auditoria: "Auditoria",
  juridico: "Jurídico",
  gabinete: "Gabinete",
  reitor: "Reitor",
  vice: "Vice",
  decano: "Decano",
  diretor: "Diretor",
  director: "Diretor",
  coordenador: "Coordenador",
  chefe: "Chefe",
  secretaria: "Secretaria",
  servicos: "Serviços",
  servico: "Serviço",
  ferias: "Férias",
  requisicao: "Requisição",
  apresentacao: "Apresentação",
  transferencia: "Transferência",
  locacao: "Locação",
  inventario: "Inventário",
  declaracao: "Declaração",
  recapitulacao: "Recapitulação",
  exclusao: "Exclusão",
  alteracao: "Alteração",
  emissao: "Emissão",
  saida: "Saída",
  saidas: "Saídas",
  entrada: "Entrada",
  entradas: "Entradas",
  actividades: "Actividades",
  tecnico: "Técnico",
  tecnica: "Técnica",
  tecnicos: "Técnicos",
  tecnicas: "Técnicas",
  provincia: "Província",
  provincias: "Províncias",
  veiculo: "Veículo",
  veiculos: "Veículos",
  movel: "Móvel",
  moveis: "Móveis",
  imovel: "Imóvel",
  imoveis: "Imóveis",
  equipamento: "Equipamento",
  equipamentos: "Equipamentos",
  instituto: "Instituto",
  superior: "Superior",
  politecnico: "Politécnico",
  songo: "Songo",
  geral: "Geral",
  coordenacao: "Coordenação",
  orgao: "Órgão",
  orgaos: "Órgãos",
  relatorio: "Relatório",
  relatorios: "Relatórios",
  balanco: "Balanço",
  balancos: "Balanços",
  anexo: "Anexo",
  anexos: "Anexos",
  documento: "Documento",
  documentos: "Documentos",
  periodo: "Período",
  periodos: "Períodos",
  funcao: "Função",
  funcoes: "Funções",
  opiniao: "Opinião",
  decisao: "Despacho",
  decisoes: "Despachos",
  historico: "Histórico",
  historica: "Histórica",
  usuario: "Utilizador",
  usuarios: "Utilizadores",
  utilizador: "Utilizador",
  utilizadores: "Utilizadores",
  beneficiario: "Beneficiário",
  beneficiarios: "Beneficiários",
  noticia: "Notícia",
  noticias: "Notícias",
  dia: "Dia",
  mes: "Mês",
  ano: "Ano",
};

/**
 * Autocorrects unaccented words to their accented versions based on administrative rules.
 */
export function autoCorrectAccents(text: any): string {
  if (!text) return "";
  const s = String(text);
  return s.replace(/\b([a-zA-Zà-úÀ-Ú\d]+)\b/g, (match) => {
    const lower = match.toLowerCase();
    if (CORRECTIONS[lower]) {
      const correction = CORRECTIONS[lower];
      if (match === match.toUpperCase()) {
        return correction.toUpperCase();
      }
      if (match.charAt(0) === match.charAt(0).toUpperCase()) {
        return correction.charAt(0).toUpperCase() + correction.slice(1);
      }
      return correction.toLowerCase();
    }
    return match;
  });
}

export function toTitleCase(text: any): string {
  if (!text) return "";
  return String(text)
    .split(" ")
    .map((word, index, array) => {
      if (word.length === 0) return "";

      // Se a palavra for uma SIGLA (Toda em maiúsculas e > 1 letra), mantém
      if (
        word.length > 1 &&
        word === word.toUpperCase() &&
        !/^[0-9]+$/.test(word)
      ) {
        return word;
      }

      const lowerWord = word.toLowerCase();

      // Auto-correction
      const normalizedWord = lowerWord
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      let correctedWord = lowerWord;

      if (CORRECTIONS[normalizedWord]) {
        correctedWord = CORRECTIONS[normalizedWord].toLowerCase();
      } else if (CORRECTIONS[lowerWord]) {
        correctedWord = CORRECTIONS[lowerWord].toLowerCase();
      }

      // Keep prepositions lowercase unless it's the first word
      if (
        index !== 0 &&
        index !== array.length - 1 &&
        EXCLUSIONS.has(correctedWord)
      ) {
        return correctedWord;
      }

      // Apply final title casing
      if (CORRECTIONS[normalizedWord] || CORRECTIONS[lowerWord]) {
        return CORRECTIONS[normalizedWord] || CORRECTIONS[lowerWord];
      }

      return correctedWord.charAt(0).toUpperCase() + correctedWord.slice(1);
    })
    .join(" ");
}

export function normalize(text: any): string {
  if (!text) return "";
  let n = String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ") // Replace punctuation with space
    .replace(/\s+/g, " ") // Normalize spaces
    .trim();

  // Remove common organizational prefixes for better matching
  n = n.replace(
    /^(departamento de |reparticao de |direcao de |divisao de |setor de |unidade de |gabinete de |reparticao |direcao |divisao |departamento )/g,
    "",
  );

  return n.trim();
}

export function isMatch(input: string, compareTo: string): boolean {
  if (!input || !compareTo) return false;
  const nInput = normalize(input);
  const nCompare = normalize(compareTo);

  if (!nInput || !nCompare) return false;

  if (nInput === nCompare) return true;

  if (
    (nCompare.includes(nInput) || nInput.includes(nCompare)) &&
    Math.min(nInput.length, nCompare.length) > 3
  )
    return true;

  // Custom check for Arquivo Morto / Repartição de Arquivo
  if (
    (nInput.includes("arquivo") && nCompare.includes("arquivo")) ||
    (nInput.includes("morto") && nCompare.includes("arquivo"))
  )
    return true;

  // Specific acronym and abbreviation mappings base on user tables
  const acronyms: Record<string, string> = {
    DICOSAFA: "servicos de administracao e financas",
    DICOSSER: "servicos academicos e registo",
    GDG: "direcao e gestao",
    DPEP: "planificação estudos e projetos",
    UGEA: "unidade gestora e executora de aquisicoes",
    DCRE: "cooperacao e relacoes exteriores",
    DCTQ: "controlo tecnico e de qualidade",
    DJ: "departamento juridico",
    RH: "recursos humanos",
    DRA: "registo academico",
    DAE: "assuntos estudantis",
    DBA: "biblioteca",
    TIC: "departamento tic",
    "ENG C CIVIL": "construcao civil",
    "ENG C MECANICA": "construcao mecanica",
    "ENG ENERGIAS RENOVAVEIS": "energias renovaveis",
    "ENG ELETRONICA": "telecomunicaoes",
    "ENG ELETROTECNICA": "eletrotecnica",
  };

  // Check for acronym matches strictly
  for (const [abbr, full] of Object.entries(acronyms)) {
    const nAbbr = normalize(abbr);
    const nFull = normalize(full);

    // Exact match of acronym or full name
    if (nInput === nAbbr && nCompare === nFull) return true;
    if (nInput === nFull && nCompare === nAbbr) return true;
  }

  return false;
}

export function cleanObject(obj: any, keyName?: string, seen = new WeakSet()): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "function" || typeof obj === "symbol") return undefined;
  if (typeof obj === "bigint") return obj.toString();

  if (typeof obj === "object") {
    if (
      (typeof Node !== "undefined" && obj instanceof Node) ||
      (typeof Window !== "undefined" && obj instanceof Window) ||
      (typeof Event !== "undefined" && obj instanceof Event) ||
      obj.nodeType ||
      obj.$$typeof ||
      obj.nativeEvent
    ) {
      return undefined;
    }

    if (seen.has(obj)) return undefined;
    seen.add(obj);

    if (Array.isArray(obj)) {
      return obj
        .map((item) => cleanObject(item, keyName, seen))
        .filter((item) => item !== undefined);
    }

    // Preserve Date instances
    if (obj instanceof Date) {
      return obj;
    }
    // Preserve Firestore FieldValues (serverTimestamp, deleteField, etc), Timestamps
    if (
      typeof obj.toMillis === "function" ||
      typeof obj.isEqual === "function" ||
      obj._delegate ||
      obj._methodName
    ) {
      return obj;
    }

    const cleaned: any = {};
    Object.keys(obj).forEach((key) => {
      if (key.startsWith("_react") || key.startsWith("__react") || key === "ownerDocument") {
        return;
      }
      const val = obj[key];
      if (val !== undefined && val !== null && typeof val !== "function") {
        const cleanedVal = cleanObject(val, key, seen);
        if (cleanedVal !== undefined) {
          cleaned[key] = cleanedVal;
        }
      }
    });
    return cleaned;
  }

  if (typeof obj === "string") {
    const k = (keyName || "").toLowerCase();
    const isSensitive =
      k.includes("id") ||
      k.includes("email") ||
      k.includes("password") ||
      k.includes("url") ||
      k.includes("codigo") ||
      k.includes("matricula") ||
      k.includes("assinatura") ||
      k.includes("signature") ||
      k.includes("anexo") ||
      k.includes("data") ||
      k.includes("timestamp") ||
      k.includes("photo") ||
      k.includes("image") ||
      k.includes("file") ||
      k.includes("pfp") ||
      obj.startsWith("http") ||
      obj.startsWith("data:image") ||
      obj.includes("@");

    if (!isSensitive) {
      return autoCorrectAccents(obj);
    }
  }
  return obj;
}

export function checkIsQuadro(c: any): boolean {
  if (!c) return false;
  const relacao = String(c.tipoRelacaoContractual || c.vinculoContractual || "")
    .toLowerCase()
    .trim();

  if (
    relacao.includes("fora") ||
    relacao.includes("não") ||
    relacao.includes("nao") ||
    relacao.includes("contratad") ||
    relacao.includes("prazo") ||
    relacao.includes("substituto")
  ) {
    return false;
  }

  if (
    relacao.includes("quadro") ||
    relacao.includes("definitiv") ||
    relacao.includes("difinitiv") ||
    relacao.includes("comissão") ||
    relacao.includes("comissao")
  ) {
    return true;
  }

  return c.efetivo === true;
}

export function classifyTipo(c: any): "Docente" | "CTA" {
  if (!c) return "CTA";

  const nome = String(c.nome || "").trim().toLowerCase();
  if (nome.includes("elias limpo") || nome.includes("elias limpo elias joão")) {
    return "Docente";
  }

  // 1. Check explicit tipo or carreira properties
  const explicitTipo = c.tipo || c.carreira;
  if (explicitTipo && typeof explicitTipo === "string") {
    const et = explicitTipo.trim().toLowerCase();
    if (et === "docente" || et.includes("docente")) return "Docente";
    if (et === "cta") return "CTA";
  }

  // 2. Check content of the categoria string
  const categoria = String(c.categoria || "").trim().toLowerCase();

  const docenteKeywords = [
    "docente",
    "universitário",
    "universitario",
    "professor",
    "leitor",
    "assistente universitário",
    "assistente universitario",
  ];

  const isDocente = docenteKeywords.some((keyword) => {
    if (
      keyword === "docente" &&
      (categoria === "docente" || categoria.includes("docente"))
    )
      return true;
    if (
      keyword === "professor" &&
      (categoria === "professor" || categoria.includes("professor"))
    )
      return true;
    if (
      keyword === "leitor" &&
      (categoria === "leitor" || categoria.includes("leitor"))
    )
      return true;
    if (keyword === "universitário" || keyword === "universitario") {
      if (
        categoria.includes("universit") &&
        !categoria.includes("técnico") &&
        !categoria.includes("tecnico")
      )
        return true;
    }
    return false;
  });

  if (isDocente) {
    return "Docente";
  }

  return "CTA";
}

export function classifyColaboradorByVínculo(
  colaborador: any,
):
  | "CTA (QUADRO)"
  | "CTA (FORA DO QUADRO)"
  | "DOCENTE (QUADRO)"
  | "DOCENTE (FORA DO QUADRO)" {
  const isQuadro = checkIsQuadro(colaborador);
  const tipo = classifyTipo(colaborador);
  if (tipo === "CTA") {
    return isQuadro ? "CTA (QUADRO)" : "CTA (FORA DO QUADRO)";
  } else {
    return isQuadro ? "DOCENTE (QUADRO)" : "DOCENTE (FORA DO QUADRO)";
  }
}

export function generateCollaboratorId(nome: string, nuit: string): string {
  const cleanNuit = String(nuit || "").replace(/\D/g, "");
  if (!nome && !cleanNuit) return "";

  // Extract initials from the name
  // Filter out lowercase short connectors
  const ignoreWords = ["de", "do", "da", "dos", "das", "e", "o", "a"];
  const nameParts = String(nome || "")
    .trim()
    .split(/\s+/)
    .filter((part) => {
      return part.length > 0 && !ignoreWords.includes(String(part).toLowerCase());
    });

  const finalParts =
    nameParts.length > 0
      ? nameParts
      : String(nome || "")
          .trim()
          .split(/\s+/)
          .filter((p) => p.length > 0);
  const initials = finalParts
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  if (cleanNuit) {
    return `${initials}${cleanNuit}`;
  }

  return initials;
}

// Helper to format birth dates to European format (DD/MM/YYYY)
export function formatEuropeanDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "-";
  const str = String(dateStr).trim();
  if (
    !str ||
    str.toLowerCase() === "moçambique" ||
    str.toLowerCase() === "mocambique"
  )
    return "-";

  // If already in DD/MM/YYYY or DD-MM-YYYY format
  if (/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/.test(str)) {
    return str.replace(/\-/g, "/");
  }

  // If in YYYY-MM-DD or YYYY/MM/DD format
  const match = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (match) {
    const [, year, month, day] = match;
    const paddedDay = day.padStart(2, "0");
    const paddedMonth = month.padStart(2, "0");
    return `${paddedDay}/${paddedMonth}/${year}`;
  }

  // Handles edge cases like "28//08/1989" or "05//06/1985"
  const cleanEdge = str.replace(/\/+/g, "/");
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleanEdge)) {
    const parts = cleanEdge.split("/");
    return `${parts[0].padStart(2, "0")}/${parts[1].padStart(2, "0")}/${parts[2]}`;
  }

  return str;
}

export function getInitials(name: string): string {
  if (!name) return "";
  const ignoredWords = [
    "de",
    "da",
    "do",
    "das",
    "dos",
    "e",
    "em",
    "no",
    "na",
    "nos",
    "nas",
    "ou",
    "para",
    "com",
    "por",
    "a",
    "o",
    "as",
    "os",
  ];
  return String(name || "")
    .split(" ")
    .filter((w) => !ignoredWords.includes(String(w).toLowerCase()))
    .map((w) => String(w)[0]?.toLowerCase())
    .join("");
}

export function convertToYYYYMMDD(dateStr: any): string {
  if (!dateStr) return "";
  const trimmed = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const dmyMatch = trimmed.match(/^(\d{2})[/\-](\d{2})[/\-](\d{4})$/);
  if (dmyMatch) {
    return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
  }
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    try {
      return d.toISOString().split("T")[0];
    } catch (e) {
      console.error(e);
    }
  }
  return "";
}

export const getDistanciaSongo = (
  provincia: string,
  distrito: string,
): number => {
  if (!provincia) return 0;

  const provClean = provincia.trim();
  const distClean = distrito ? distrito.trim() : "";

  const distanciasDetalhadas: Record<string, Record<string, number>> = {
    Tete: {
      "Cahora Bassa": 40,
      Songo: 0,
      "Cidade de Tete": 150,
      "Aeroporto de Chingodzi": 150,
      Moatize: 170,
      Changara: 220,
      Chiuta: 250,
      Angónia: 380,
      Tsangano: 360,
      Mutarara: 450,
      Zumbo: 330,
      Mágoè: 200,
      Marávia: 280,
      Chifunde: 350,
      Macanga: 320,
      Dôa: 290,
      Marara: 180,
    },
    Manica: {
      Chimoio: 400,
      Manica: 430,
      Gondola: 390,
      Bárue: 350,
      Sussundenga: 440,
      Guro: 280,
      Tambara: 250,
      Macate: 410,
      Machaze: 580,
      Macossa: 340,
      Mossurize: 550,
      Vanduzi: 380,
    },
    Sofala: {
      Beira: 650,
      Dondo: 620,
      Nhamatanda: 550,
      Gorongosa: 480,
      Caia: 450,
      Búzi: 670,
      Chemba: 430,
      Cheringoma: 530,
      Chibabava: 620,
      Marínguè: 410,
      Marromeu: 590,
      Muanza: 580,
    },
    Zambézia: {
      Quelimane: 820,
      Mocuba: 680,
      Gurué: 720,
      Milange: 780,
      "Alto Molócuè": 850,
      Chinde: 950,
      Derre: 710,
      Gilé: 900,
      Ile: 820,
      Inhassunge: 830,
      Lugela: 740,
      "Maganja da Costa": 860,
      Mopeia: 720,
      Morrumbala: 690,
      Namacurra: 830,
      Namarroi: 800,
      Pebane: 980,
    },
    Niassa: {
      Lichinga: 1200,
      Cuamba: 950,
      Lago: 1250,
      Mandimba: 1000,
      Marrupa: 1300,
      Maúa: 1150,
      Mavago: 1350,
      Mecanhelas: 980,
      Mecula: 1450,
      Metarica: 1050,
      Muembe: 1250,
      Sanga: 1260,
    },
    Nampula: {
      Nampula: 1300,
      "Nacala-Porto": 1450,
      "Ilha de Moçambique": 1420,
      Angoche: 1450,
      Eráti: 1400,
      Lalaua: 1250,
      Malema: 1050,
      Meconta: 1330,
      Mecubúri: 1320,
      Memba: 1420,
      Mogincual: 1430,
      Mogovolas: 1360,
      Moma: 1420,
      Monapo: 1370,
      Mossuril: 1410,
      Muecate: 1330,
      Murrupula: 1260,
      "Nacala-à-Velha": 1430,
      Nacarôa: 1390,
      Rapale: 1290,
      Ribáuè: 1150,
    },
    "Cabo Delgado": {
      Pemba: 1700,
      Montepuez: 1600,
      Mueda: 1800,
      Ancuabe: 1650,
      Balama: 1500,
      Chiúre: 1620,
      Ibo: 1720,
      Macomia: 1780,
      Mecúfi: 1710,
      Meluco: 1740,
      Metuge: 1680,
      "Mocímboa da Praia": 1900,
      Namuno: 1540,
      Nangade: 1950,
      Palma: 2000,
      Quissanga: 1750,
    },
    Inhambane: {
      Inhambane: 1250,
      Maxixe: 1200,
      Vilankulo: 1050,
      Funhalouro: 1150,
      Govuro: 950,
      Homoíne: 1220,
      Inharrime: 1280,
      Inhassoro: 1020,
      Jangamo: 1240,
      Mabote: 980,
      Massinga: 1180,
      Morrumbene: 1210,
      Panda: 1220,
    },
    Gaza: {
      "Xai-Xai": 1400,
      Bilene: 1430,
      Chókwè: 1350,
      Chibuto: 1370,
      Chigubo: 1250,
      Chonguene: 1390,
      Guijá: 1340,
      Limpopo: 1410,
      Mabalane: 1280,
      Mandlakazi: 1390,
      Massangena: 1100,
      Massingir: 1400,
    },
    "Maputo Província": {
      Matola: 1600,
      Boane: 1630,
      Namaacha: 1670,
      Magude: 1520,
      Manhiça: 1550,
      Marracuene: 1580,
      Matutuíne: 1680,
      Moamba: 1580,
    },
    "Maputo Cidade": {
      Central: 1610,
      KaMavota: 1620,
      KaMaxaquene: 1610,
      KaMpfumo: 1610,
      Nlhamankulu: 1610,
      KaMubukwana: 1620,
      Katembe: 1630,
    },
  };

  if (
    distanciasDetalhadas[provClean] &&
    distanciasDetalhadas[provClean][distClean]
  ) {
    return distanciasDetalhadas[provClean][distClean];
  }

  const fallbackProvincial: Record<string, number> = {
    Tete: 150,
    Manica: 400,
    Sofala: 600,
    Zambézia: 800,
    Niassa: 1200,
    Nampula: 1300,
    "Cabo Delgado": 1700,
    Inhambane: 1100,
    Gaza: 1400,
    "Maputo Província": 1600,
    "Maputo Cidade": 1600,
  };

  return fallbackProvincial[provClean] || 0;
};

export function getStatusFromDates(activities: any[]): any[] {
  const now = new Date();

  return activities.map((act) => {
    // Basic date parsing (e.g., "01/01/2026 a 05/01/2026")
    const dateRange = String(act.data || "").split(" a ") || [];
    const startDate = dateRange[0]
      ? new Date(String(dateRange[0]).split("/").reverse().join("-"))
      : null;
    const endDate = dateRange[1]
      ? new Date(String(dateRange[1]).split("/").reverse().join("-"))
      : null;

    let newStatus = act.status;

    // Simplistic monthly/date logic
    if (startDate) {
      if (now < startDate) {
        newStatus = "pronta";
      } else if (now >= startDate && now <= (endDate || startDate)) {
        newStatus = "em_execucao";
      } else if (endDate && now > endDate) {
        newStatus = "executada";
      }
    }

    return { ...act, status: newStatus as any };
  });
}

// Extract numeric sequence from Songo/001/2026 or similar process number
export function extractProcessSequence(
  processNo: string | undefined | null,
): number {
  if (!processNo) return 999999;
  const str = String(processNo).trim();
  const ispsMatch = str.match(/Songo\/(\d+)/i) || str.match(/^(\d+)/);
  if (ispsMatch) {
    return parseInt(ispsMatch[1], 10);
  }
  const anyNumMatch = str.match(/(\d+)/);
  if (anyNumMatch) {
    return parseInt(anyNumMatch[1], 10);
  }
  return 999999;
}

// Format process number in Songo/XXX/ANO_DE_INGRESSO format
export function formatProcessNumber(
  sequenceIndex: number,
  yearOrDateStr?: string,
): string {
  let year = new Date().getFullYear().toString();
  if (yearOrDateStr) {
    const match = String(yearOrDateStr).match(/\d{4}/);
    if (match) {
      year = match[0];
    }
  }
  const seqPadded = String(sequenceIndex).padStart(3, "0");
  return `Songo/${seqPadded}/${year}`;
}

// Sort processes in numerical order (001, 002, 003...) and tie-break alphabetically by name
export function sortProcessesNumerically<
  T extends {
    processoNo?: string;
    numeroProcesso?: string;
    id?: string;
    nome?: string;
  },
>(items: T[]): T[] {
  return items.slice().sort((a, b) => {
    const noA = a.processoNo || a.numeroProcesso || a.id || "";
    const noB = b.processoNo || b.numeroProcesso || b.id || "";
    const seqA = extractProcessSequence(noA);
    const seqB = extractProcessSequence(noB);
    if (seqA !== seqB) {
      return seqA - seqB;
    }
    const nameA = (a as any).nome || (a as any).colaboradorNome || "";
    const nameB = (b as any).nome || (b as any).colaboradorNome || "";
    if (nameA || nameB) {
      return nameA.localeCompare(nameB, "pt", { sensitivity: "base" });
    }
    return noA.localeCompare(noB);
  });
}

// Generate direct URL for an Individual Process
export function generateIndividualProcessLink(
  processoId: string,
  processoNo?: string,
): string {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const param = encodeURIComponent(processoId);
  return `${baseUrl}?processoId=${param}`;
}

// Cache for the processed baseline to avoid re-mapping 4700+ items on every update
let cachedBaseline: any[] | null = null;

export function hasChefiaPosition(c: any): boolean {
  if (!c) return false;

  if (c.isChefia === false) return false;

  const statusMandato = String(c.estadoMandato || c.mandatoStatus || "")
    .toLowerCase()
    .trim();
  if (
    statusMandato === "cessado" ||
    statusMandato === "despromovido" ||
    statusMandato === "inativo" ||
    statusMandato === "nenhum"
  ) {
    return false;
  }

  // Pegamos o valor do campo cargo (com fallback para cargoChefia se necessário)
  const cargo = String(c.cargo || c.cargoChefia || "").trim();
  const lowerCargo = cargo.toLowerCase();

  if (
    !cargo ||
    cargo === "Nenhum" ||
    cargo === "nenhum" ||
    cargo === "-" ||
    cargo === "0" ||
    lowerCargo === "sem cargo" ||
    lowerCargo === "nenhum" ||
    lowerCargo.includes("nenhum cargo") ||
    lowerCargo.includes("nenhum")
  ) {
    return false;
  }

  // Lista de cargos de chefia existentes no sistema (LISTA_CARGOS_CHEFIA)
  const chefiaKeywords = [
    "diretor-geral",
    "diretor geral",
    "diretor-geral adjunto",
    "diretor central",
    "diretor de gabinete",
    "chefe do gabinete",
    "diretor da divisão",
    "diretor da divisao",
    "diretor adjunto pedagógico",
    "diretor adjunto pedagogico",
    "diretor de curso",
    "diretor do curso",
    "chefe de departamento",
    "chefe do departamento",
    "chefe de repartição",
    "chefe de reparticao",
    "chefe da repartição",
    "chefe da reparticao",
    "chefe de secção",
    "chefe de seccao",
    "técnico do setor",
    "tecnico do setor",
    "proprietário do sistema",
    "proprietario do sistema",
    "administrador de sistema",
    "administrador do sistema",
    "adjunto pedagógico",
    "adjunto pedagogico",
  ];

  const hasChefia = chefiaKeywords.some((k) => {
    return lowerCargo === k || lowerCargo.includes(k);
  });

  return hasChefia;
}

export function mergeColaboradores(firestoreData: any[]): any[] {
  // 1. Process baseline only once
  if (!cachedBaseline) {
    cachedBaseline = EFETIVO_GERAL_DATA.map((m, idx) => {
      const isQuadroVal = checkIsQuadro(m);
      const resolvedTipo = classifyTipo(m);
      const tipoEnquadramento =
        resolvedTipo === "CTA"
          ? isQuadroVal
            ? "CTA (QUADRO)"
            : "CTA (FORA DO QUADRO)"
          : isQuadroVal
            ? "DOCENTE (QUADRO)"
            : "DOCENTE (FORA DO QUADRO)";

      const cleanNuit = String(m.nuit || "").replace(/\D/g, "");
      const generatedId = generateCollaboratorId(m.nome || "", m.nuit || "");
      const computedId =
        (m.id && cleanNuit && m.id.includes(cleanNuit))
          ? m.id
          : (generatedId || m.id || `EG_${idx}`);
      return {
        ...m,
        id: computedId,
        numeroProcesso: m.numeroProcesso || m.id || computedId,
        tipo: resolvedTipo as any,
        carreira: resolvedTipo,
        efetivo: isQuadroVal,
        tipoEnquadramento,
        unidade: m.unidade || "",
      };
    });
  }

  // 2. Build multi-index maps for O(1) matching against baseline items
  const mergedMap = new Map<string, any>();
  const idToKeyMap = new Map<string, string>();
  const nuitToKeyMap = new Map<string, string>();
  const biToKeyMap = new Map<string, string>();
  const procToKeyMap = new Map<string, string>();
  const nameToKeyMap = new Map<string, string>();

  function indexCollaborator(col: any, key: string) {
    mergedMap.set(key, col);
    if (col.id) idToKeyMap.set(col.id, key);
    if (col.numeroProcesso) procToKeyMap.set(col.numeroProcesso, key);

    const cleanNuit = (col.nuit || "").replace(/\D/g, "");
    if (cleanNuit && cleanNuit.length >= 4) nuitToKeyMap.set(cleanNuit, key);

    const cleanBI = normalizeString(col.numeroBI);
    if (cleanBI && cleanBI.length >= 5) biToKeyMap.set(cleanBI, key);

    const normName = normalizeString(col.nome);
    if (normName && normName.length >= 4) nameToKeyMap.set(normName, key);
  }

  cachedBaseline.forEach((c) => {
    indexCollaborator({ ...c }, c.id);
  });

  // 3. Overwrite or insert data from Firestore
  (firestoreData || []).forEach((fireCol) => {
    if (!fireCol) return;

    // Find existing match by ID, Process No, NUIT, BI, or Name
    let matchedKey: string | undefined = undefined;

    if (fireCol.id && idToKeyMap.has(fireCol.id)) {
      matchedKey = idToKeyMap.get(fireCol.id);
    } else if (
      fireCol.numeroProcesso &&
      procToKeyMap.has(fireCol.numeroProcesso)
    ) {
      matchedKey = procToKeyMap.get(fireCol.numeroProcesso);
    } else if (fireCol.nuit) {
      const cleanNuit = String(fireCol.nuit).replace(/\D/g, "");
      if (cleanNuit && cleanNuit.length >= 4 && nuitToKeyMap.has(cleanNuit)) {
        matchedKey = nuitToKeyMap.get(cleanNuit);
      }
    }

    if (!matchedKey && fireCol.numeroBI) {
      const cleanBI = normalizeString(fireCol.numeroBI);
      if (cleanBI && cleanBI.length >= 5 && biToKeyMap.has(cleanBI)) {
        matchedKey = biToKeyMap.get(cleanBI);
      }
    }

    if (!matchedKey && fireCol.nome) {
      const normName = normalizeString(fireCol.nome);
      if (normName && normName.length >= 4 && nameToKeyMap.has(normName)) {
        matchedKey = nameToKeyMap.get(normName);
      }
    }

    const existing = matchedKey ? mergedMap.get(matchedKey) : undefined;

    const isQuadroVal = checkIsQuadro(fireCol);
    const resolvedTipo = classifyTipo(fireCol);
    const tipoEnquadramento =
      resolvedTipo === "CTA"
        ? isQuadroVal
          ? "CTA (QUADRO)"
          : "CTA (FORA DO QUADRO)"
        : isQuadroVal
          ? "DOCENTE (QUADRO)"
          : "DOCENTE (FORA DO QUADRO)";

    const cleanNuit = String(fireCol.nuit || existing?.nuit || "").replace(/\D/g, "");
    const generatedId = generateCollaboratorId(
      fireCol.nome || existing?.nome || "",
      cleanNuit || fireCol.nuit || existing?.nuit || ""
    );
    const finalId =
      (fireCol.id && cleanNuit && fireCol.id.includes(cleanNuit))
        ? fireCol.id
        : (generatedId || fireCol.id || existing?.id || `EG_0`);

    const sanitizedCol = {
      ...(existing || {}),
      ...fireCol,
      id: finalId,
      numeroProcesso:
        fireCol.numeroProcesso || existing?.numeroProcesso || finalId,
      tipo: resolvedTipo as any,
      carreira: resolvedTipo,
      efetivo: isQuadroVal,
      tipoEnquadramento,
      unidade:
        fireCol.unidade !== undefined
          ? fireCol.unidade
          : existing?.unidade || "",
      direcao:
        fireCol.direcao !== undefined
          ? fireCol.direcao
          : existing?.direcao || "",
      departamento:
        fireCol.departamento !== undefined
          ? fireCol.departamento
          : existing?.departamento || "",
      reparticao:
        fireCol.reparticao !== undefined
          ? fireCol.reparticao
          : existing?.reparticao || "",
      sector:
        fireCol.sector !== undefined
          ? fireCol.sector
          : fireCol.setor !== undefined
            ? fireCol.setor
            : existing?.sector || existing?.setor || "",
      setor:
        fireCol.setor !== undefined
          ? fireCol.setor
          : fireCol.sector !== undefined
            ? fireCol.sector
            : existing?.setor || existing?.sector || "",
      curso:
        fireCol.curso !== undefined ? fireCol.curso : existing?.curso || "",
      cursos:
        fireCol.cursos !== undefined ? fireCol.cursos : existing?.cursos || [],
      areaDeAfetacao:
        fireCol.areaDeAfetacao !== undefined
          ? fireCol.areaDeAfetacao
          : existing?.areaDeAfetacao || "",
      cargoChefia:
        fireCol.cargoChefia !== undefined
          ? fireCol.cargoChefia
          : existing?.cargoChefia || "Nenhum",
      estadoMandato:
        fireCol.estadoMandato !== undefined
          ? fireCol.estadoMandato
          : existing?.estadoMandato || "Cessado",
      isChefia:
        fireCol.isChefia !== undefined
          ? fireCol.isChefia
          : existing?.isChefia || false,
    };

    if (matchedKey) {
      // Clean up old key if key changed
      if (matchedKey !== finalId) {
        mergedMap.delete(matchedKey);
      }
      indexCollaborator(sanitizedCol, finalId);
    } else {
      indexCollaborator(sanitizedCol, finalId);
    }
  });

  // 4. Convert back to array and filter out deleted/eliminated items
  return Array.from(mergedMap.values()).filter((c) => {
    const hasChefia = hasChefiaPosition(c);
    if (hasChefia) {
      return true;
    }
    return c.estado !== "Eliminado" && !c.isDeleted;
  });
}

/**
 * Returns the abbreviation of a department name for the activity plans.
 */
export function getDepartmentAbbreviation(dept: any): string {
  if (!dept) return "-";
  const d = String(dept).trim().toLowerCase();

  // Specific mappings based on the Songo structure
  if (d.includes("recursos humanos")) return "DRH";
  if (d.includes("planificação") || d.includes("planificacao")) return "DPEP";
  if (d.includes("cooperação") || d.includes("cooperacao")) return "DCRE";
  if (
    d.includes("tic") ||
    d.includes("tecnologias de informação") ||
    d.includes("tecnologias de informacao")
  )
    return "DTIC";
  if (d.includes("património") || d.includes("patrimonio")) return "DPAT";
  if (d.includes("assuntos estudantis")) return "DAE";
  if (d.includes("registo académico") || d.includes("registo academico"))
    return "DRA";
  if (
    d.includes("controlo técnico") ||
    d.includes("controlo tecnico") ||
    d.includes("qualidade")
  )
    return "DCTQ";
  if (d.includes("produção alimentar") || d.includes("producao alimentar"))
    return "DPA";
  if (d.includes("pesquisa")) return "DPE";
  if (
    d.includes("administração e finanças") ||
    d.includes("administracao e financas") ||
    d.includes("finanças") ||
    d.includes("financas")
  )
    return "DAF";
  if (d.includes("gabinete")) return "GAB";
  if (d.includes("biblioteca")) return "DBA";
  if (d.includes("lar de estudantes") || d.includes("lar de entidades") || d === "dla" || d === "dle") return "DLE";
  if (
    d.includes("engenharia eletrotécnica") ||
    d.includes("engenharia eletrotecnica")
  )
    return "DEE";
  if (
    d.includes("engenharia de construção civil") ||
    d.includes("engenharia de construcao civil")
  )
    return "DECC";
  if (
    d.includes("engenharia de construção mecânica") ||
    d.includes("engenharia de construcao mecanica")
  )
    return "DECM";
  if (d.includes("disciplinas gerais")) return "DDG";
  if (d.includes("técnico e de apoio") || d.includes("tecnico e de apoio"))
    return "DTA";

  // Generic abbreviation: take first letter of each significant word
  const words = String(dept || "").split(/\s+/).filter((w) => {
    const lw = w.toLowerCase();
    return (
      lw !== "de" &&
      lw !== "do" &&
      lw !== "da" &&
      lw !== "e" &&
      lw !== "o" &&
      lw !== "a" &&
      lw !== "os" &&
      lw !== "as"
    );
  });

  if (words.length > 0) {
    const abbr = words.map((w) => w[0].toUpperCase()).join("");
    if (abbr.length > 1) return abbr;
  }
  return dept;
}

export function getReparticaoAbbreviation(reparticao: string): string {
  if (!reparticao || typeof reparticao !== "string") return "-";
  const r = reparticao.trim().toLowerCase();

  // Specific mappings
  if (r.includes("pessoal")) return "RP";
  if (r.includes("arquivo")) return "RA";
  if (r.includes("financeiro") || r.includes("finanças")) return "RF";
  if (r.includes("contabilidade")) return "RC";
  if (r.includes("aquisicoes") || r.includes("aquisições")) return "RAQ";
  if (
    r.includes("transporte") ||
    r.includes("veículos") ||
    r.includes("veiculos")
  )
    return "RVE";
  if (r.includes("infraestrutura") || r.includes("manutenção")) return "RIM";
  if (r.includes("alojamento")) return "RAL";
  if (r.includes("eventos")) return "REV";
  if (r.includes("produção animal") || r.includes("producao animal"))
    return "RPA";
  if (r.includes("produção vegetal") || r.includes("producao vegetal"))
    return "RPV";
  if (r.includes("certificação") || r.includes("certificacao")) return "RCERT";
  if (r.includes("matrículas") || r.includes("matriculas")) return "RMAT";
  if (r.includes("bolsa")) return "RBOL";
  if (r.includes("desporto")) return "RDESP";
  if (r.includes("documentos")) return "RDOC";

  const words = String(reparticao || "").split(/\s+/).filter((w) => {
    const lw = w.toLowerCase();
    return (
      lw !== "de" &&
      lw !== "do" &&
      lw !== "da" &&
      lw !== "e" &&
      lw !== "o" &&
      lw !== "a" &&
      lw !== "os" &&
      lw !== "as"
    );
  });

  if (words.length > 0) {
    const abbr = words.map((w) => w[0].toUpperCase()).join("");
    if (abbr.length > 1) return abbr;
  }
  return reparticao;
}

/**
 * Retorna o nome abreviado (sigla) de uma Direção (unidade orgânica)
 */
export function getDirectionAbbreviation(direcao: string): string {
  if (!direcao || typeof direcao !== "string") return "-";
  const d = direcao.trim().toLowerCase();

  if (
    d.includes("órgãos de direção e gestão") ||
    d.includes("orgaos de direcao e gestao")
  )
    return "ÓDG";
  if (d.includes("dicosafa") || d.includes("finanças e de apoio"))
    return "DICOSAFA";
  if (d.includes("dicosser") || d.includes("estudantis e registo"))
    return "DICOSSER";
  if (
    d.includes("divisão de engenharia") ||
    d.includes("divisao de engenharia")
  )
    return "DE";
  if (d.includes("diretor-geral") || d.includes("diretor geral")) return "GDG";
  if (
    d.includes("centro de incubação de empresas") ||
    d.includes("centro de incubacao de empresas")
  )
    return "CIE";
  if (d.includes("representantes")) return "CR";
  if (d.includes("administrativo")) return "CAG";
  if (
    d.includes("técnico e de qualidade") ||
    d.includes("tecnico e de qualidade")
  )
    return "CTQ";
  if (d.includes("centros")) return "Centros";
  if (d.includes("isps songo")) return "Songo Songo";
  if (d === "isps") return "Songo";

  const match = direcao.match(/\(([^)]+)\)/);
  if (match && match[1]) {
    return match[1];
  }

  const words = String(direcao || "").split(/\s+/).filter((w) => {
    const lw = w.toLowerCase();
    return (
      lw !== "de" &&
      lw !== "do" &&
      lw !== "da" &&
      lw !== "e" &&
      lw !== "o" &&
      lw !== "a" &&
      lw !== "os" &&
      lw !== "as"
    );
  });

  if (words.length > 0) {
    const abbr = words.map((w) => w[0].toUpperCase()).join("");
    if (abbr.length > 1) return abbr;
  }

  return direcao;
}

export const checkIsSystemAdmin = (c: any): boolean => {
  if (!c) return false;

  const cargoChefia = (c.cargoChefia || "").toLowerCase();
  const categoria = (c.categoria || "").toLowerCase();
  const cargo = (c.cargo || "").toLowerCase();
  const role = (c.role || "").toLowerCase();
  const title = (c.title || "").toLowerCase();

  return (
    cargoChefia === "proprietário do sistema" ||
    cargoChefia === "proprietario do sistema" ||
    cargoChefia === "administrador de sistema" ||
    cargoChefia === "administrador do sistema" ||
    cargo === "proprietario do sistema" ||
    cargo === "proprietário do sistema" ||
    cargo === "programador e proprietário do sistema" ||
    cargo === "proprietário e programador do sistema" ||
    categoria.includes("proprietário e programador") ||
    cargo.includes("programador do sistema") ||
    cargo === "administrador de sistema" ||
    cargo === "administrador do sistema"
  );
};

/**
 * Retorna as 3 iniciais da actividade com base no nome
 */
export function getActivityInitials(nome: string): string {
  if (!nome || typeof nome !== "string") return "ACT";
  const words = nome
    .trim()
    .split(/\s+/)
    .filter((w) => {
      const lw = w.toLowerCase();
      return (
        lw !== "de" &&
        lw !== "do" &&
        lw !== "da" &&
        lw !== "e" &&
        lw !== "o" &&
        lw !== "a" &&
        lw !== "os" &&
        lw !== "as" &&
        lw !== "em" &&
        lw !== "para" &&
        lw !== "com" &&
        lw !== "por" &&
        lw !== "um" &&
        lw !== "uma"
      );
    });
  if (words.length >= 3) {
    return words
      .slice(0, 3)
      .map((w) => w[0].toUpperCase())
      .join("");
  }
  if (words.length > 0) {
    const abbr = words.map((w) => w[0].toUpperCase()).join("");
    if (abbr.length >= 2) return abbr.padEnd(3, "X");
  }
  const clean = nome.replace(/[^a-zA-Z]/g, "").toUpperCase();
  return (clean.substring(0, 3) || "ACT").padEnd(3, "X");
}

/**
 * Retorna o próximo número de sequência de processo disponível (começando em 001)
 */
export function getNextProcessSequence(
  colaboradores: any[] = [],
  processos: any[] = [],
): number {
  const nums = new Set<number>();
  const collect = (list: any[]) => {
    for (const item of list) {
      const no = item.processoNo || item.numeroProcesso || item.id;
      const seq = extractProcessSequence(no);
      if (seq > 0 && seq < 999999) {
        nums.add(seq);
      }
    }
  };
  collect(colaboradores);
  collect(processos);

  let candidate = 1;
  while (nums.has(candidate)) {
    candidate++;
  }
  return candidate;
}

/**
 * Retorna o ano do ciclo ativo do sistema.
 * O ciclo N+1 "abre" (pode ser visualizado/preparado) a partir de 20 de Dezembro.
 */
export function getActiveCycleYear(): number {
  const now = new Date();
  const year = now.getFullYear();
  const dec20 = new Date(year, 11, 20); // 20 de Dezembro
  
  if (now >= dec20) {
    return year + 1;
  }
  return year;
}

/**
 * Retorna a data da primeira segunda-feira de um determinado ano.
 * O ciclo ativo começa oficialmente na primeira segunda-feira de Janeiro do ano N+1.
 */
export function getFirstMondayOfYear(year: number): Date {
  const firstJan = new Date(year, 0, 1);
  const day = firstJan.getDay(); // 0 = Domingo, 1 = Segunda...
  
  const diff = (day <= 1) ? (1 - day) : (8 - day);
  const firstMonday = new Date(year, 0, 1 + diff);
  return firstMonday;
}

/**
 * Verifica se o ciclo de trabalho atual já começou oficialmente.
 */
export function isCycleOfficiallyStarted(year: number): boolean {
  const now = new Date();
  const firstMonday = getFirstMondayOfYear(year);
  return now >= firstMonday;
}

/**
 * Helper to retry dynamic imports (lazy modules) in case of intermittent network/cache errors
 */
export function lazyRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retriesLeft = 2,
  interval = 500
): Promise<{ default: T }> {
  return new Promise((resolve, reject) => {
    componentImport()
      .then(resolve)
      .catch((error) => {
        const errorMsg = String(error?.message || error || "").toLowerCase();
        const isFetchOrChunkError =
          errorMsg.includes("dynamically imported module") ||
          errorMsg.includes("failed to fetch") ||
          errorMsg.includes("loading chunk") ||
          errorMsg.includes("error loading dynamically imported module");

        if (retriesLeft <= 0) {
          // If chunk failed after retries and hasn't reloaded page in this session, trigger a smooth reload
          if (isFetchOrChunkError && typeof window !== "undefined") {
            const hasReloaded = sessionStorage.getItem("sigep_chunk_reload_triggered");
            if (!hasReloaded) {
              sessionStorage.setItem("sigep_chunk_reload_triggered", "true");
              window.location.reload();
              return;
            }
          }
          reject(error);
          return;
        }

        setTimeout(() => {
          lazyRetry(componentImport, retriesLeft - 1, interval).then(resolve, reject);
        }, interval);
      });
  });
}

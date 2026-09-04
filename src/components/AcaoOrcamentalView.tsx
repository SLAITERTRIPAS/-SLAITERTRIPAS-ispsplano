import React, { useState, useMemo, useEffect } from "react";
import { firestoreService } from "../lib/firestoreService";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Send,
  AlertCircle,
  CheckCircle2,
  Coins,
  PieChart,
  HelpCircle,
  Printer,
  ArrowLeft,
  LayoutGrid,
  ChevronRight,
  FileText,
  X,
  Share2,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { InstitutionalHeader } from "./InstitutionalHeader";
import { printElementById } from "../lib/printUtils";
import { UNIDADES_ORGANICAS_SISTEMA, DEPARTAMENTOS, getSetoresByDepartamento } from "../constants/formOptions";
import { isSuperBossUser, canAccessArea, getAuthorizedActivities } from "../lib/auth";
import { isValidActivity } from "../blocos/bloco5_sistema/plano/PlanoHelpers";

const formatCurrency = (val) => new Intl.NumberFormat("pt-MZ", { style: "currency", currency: "MZN" }).format(val || 0);

interface AcaoOrcamentalViewProps {
  user: any;
  title: string;
  activities: any[];
  onShowAlert: (msg: string) => void;
  onBack?: () => void;
}

export const OFFICIAL_SISTAFE_RUBRICAS = [
  { code: "112101", name: "Ajuda de custo dentro do país para pessoal civil" },
  { code: "112102", name: "Ajuda de custo fora do país para pessoal civil" },
  { code: "121001", name: "Combustíveis e lubrificantes" },
  { code: "121002", name: "Material para manutenção e reparação de bens imóveis" },
  { code: "121003", name: "Material para manutenção e reparação de bens móveis" },
  { code: "121005", name: "Material de consumo para escritório" },
  { code: "121006", name: "Material duradouro de escritório" },
  { code: "121007", name: "Fardamentos e calçados" },
  { code: "121008", name: "Sobressalentes para equipamentos máquinas e motores" },
  { code: "121009", name: "Medicamentos e apósitos" },
  { code: "121010", name: "Géneros alimentícios" },
  { code: "121011", name: "Material de limpeza e higiene" },
  { code: "121014", name: "Ferramentas de uso duradouro" },
  { code: "121015", name: "Material de consumo para ensino e formação" },
  { code: "121016", name: "Material duradouro para ensino e formação" },
  { code: "121017", name: "Material de consumo para desporto" },
  { code: "121018", name: "Material duradouro para desporto" },
  { code: "121020", name: "Material de representação" },
  { code: "121021", name: "Material de festividades, homenagens e premiação" },
  { code: "121022", name: "Material de consumo para informática" },
  { code: "121023", name: "Material duradouro para informática" },
  { code: "121024", name: "Software de base" },
  { code: "121026", name: "Material de consumo para copa e cozinha" },
  { code: "121027", name: "Material duradouro para copa e cozinha" },
  { code: "121028", name: "Sementes, plantas e insumos" },
  { code: "121029", name: "Material para conservação de estradas e vias" },
  { code: "121030", name: "Bandeiras e flâmulas" },
  { code: "121031", name: "Material para conservação de rede de electrificação" },
  { code: "121032", name: "Material de aplicação restritiva" },
  { code: "121033", name: "Material para aplicação em projectos sociais e assistência social" },
  { code: "121034", name: "Material para conservação de rede de água e esgoto" },
  { code: "121098", name: "Outros bens de consumo" },
  { code: "121099", name: "Outros bens duradouros" },
  { code: "122001", name: "Comunicações em geral" },
  { code: "122002", name: "Passagens dentro do país" },
  { code: "122004", name: "Renda de instalações" },
  { code: "122005", name: "Manutenção e reparação de bens imóveis" },
  { code: "122006", name: "Manutenção e reparação de bens móveis" },
  { code: "122007", name: "Manutenção e reparação de veículos" },
  { code: "122009", name: "Seguros" },
  { code: "122012", name: "Água" },
  { code: "122013", name: "Energia eléctrica" },
  { code: "122021", name: "Limpeza e conservação" },
  { code: "122024", name: "Serviços gráficos" },
  { code: "122099", name: "Outros serviços" },
  { code: "143107", name: "Transferências a comunidade local" },
  { code: "143401", name: "Bolsa de estudos no país" },
  { code: "143499", name: "Outras transferências a famílias" },
];

export function getParentRubrica(rubricaRaw?: any): string {
  const clean = String(rubricaRaw || "").trim().toLowerCase();
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

export function getOfficialRubricaLabel(rubricaRaw?: any, necessidadeRaw?: any): string {
  const rubTrim = String(rubricaRaw || "").trim();
  const necTrim = String(necessidadeRaw || "").trim();
  const combined = `${rubTrim} ${necTrim}`.trim();
  if (!combined) return "121098 - Outros bens de consumo";

  const lowerCombined = combined.toLowerCase();
  const cleanCombined = lowerCombined.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 1. Procurar código de 6 dígitos oficial nas strings recebidas
  for (const item of OFFICIAL_SISTAFE_RUBRICAS) {
    if (lowerCombined.includes(item.code)) {
      return `${item.code} - ${item.name}`;
    }
  }

  // 2. Procurar correspondência exata ou parcial com o nome oficial da rúbrica
  for (const item of OFFICIAL_SISTAFE_RUBRICAS) {
    const cleanItemName = item.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (cleanCombined.includes(cleanItemName) || cleanItemName.includes(cleanCombined)) {
      return `${item.code} - ${item.name}`;
    }
  }

  // 3. Mapeamento por palavras-chave oficiais do SISTAFE Moçambique
  if (
    cleanCombined.includes("combust") ||
    cleanCombined.includes("lubrificant") ||
    cleanCombined.includes("gasoleo") ||
    cleanCombined.includes("gasolina") ||
    cleanCombined.includes("combustivel")
  ) {
    return "121001 - Combustíveis e lubrificantes";
  }
  if (cleanCombined.includes("ajuda de custo") && cleanCombined.includes("fora")) {
    return "112102 - Ajuda de custo fora do país para pessoal civil";
  }
  if (
    cleanCombined.includes("ajuda de custo") ||
    cleanCombined.includes("diaria") ||
    cleanCombined.includes("subsidio de viagem")
  ) {
    return "112101 - Ajuda de custo dentro do país para pessoal civil";
  }
  if (
    cleanCombined.includes("manutencao de bens imoveis") ||
    cleanCombined.includes("reparacao de bens imoveis") ||
    cleanCombined.includes("edificio") ||
    cleanCombined.includes("obra")
  ) {
    return "121002 - Material para manutenção e reparação de bens imóveis";
  }
  if (
    cleanCombined.includes("manutencao de bens moveis") ||
    cleanCombined.includes("reparacao de bens moveis")
  ) {
    return "121003 - Material para manutenção e reparação de bens móveis";
  }
  if (
    cleanCombined.includes("escritorio") ||
    cleanCombined.includes("resma") ||
    cleanCombined.includes("papel") ||
    cleanCombined.includes("caneta") ||
    cleanCombined.includes("pasta") ||
    cleanCombined.includes("esferografica")
  ) {
    return "121005 - Material de consumo para escritório";
  }
  if (
    cleanCombined.includes("duradouro de escritorio") ||
    cleanCombined.includes("mesa") ||
    cleanCombined.includes("cadeira") ||
    cleanCombined.includes("armario")
  ) {
    return "121006 - Material duradouro de escritório";
  }
  if (
    cleanCombined.includes("fardamento") ||
    cleanCombined.includes("calcado") ||
    cleanCombined.includes("vestuario") ||
    cleanCombined.includes("uniforme")
  ) {
    return "121007 - Fardamentos e calçados";
  }
  if (
    cleanCombined.includes("sobressalente") ||
    cleanCombined.includes("peca") ||
    cleanCombined.includes("motor")
  ) {
    return "121008 - Sobressalentes para equipamentos máquinas e motores";
  }
  if (
    cleanCombined.includes("medicamento") ||
    cleanCombined.includes("saude") ||
    cleanCombined.includes("aposito") ||
    cleanCombined.includes("farmacia")
  ) {
    return "121009 - Medicamentos e apósitos";
  }
  if (
    cleanCombined.includes("generos alimenticios") ||
    cleanCombined.includes("alimento") ||
    cleanCombined.includes("lanche") ||
    cleanCombined.includes("refeicao") ||
    cleanCombined.includes("agua mineral") ||
    cleanCombined.includes("catering")
  ) {
    return "121010 - Géneros alimentícios";
  }
  if (
    cleanCombined.includes("limpeza") ||
    cleanCombined.includes("higiene") ||
    cleanCombined.includes("detergente") ||
    cleanCombined.includes("sabao")
  ) {
    return "121011 - Material de limpeza e higiene";
  }
  if (cleanCombined.includes("ferramenta")) {
    return "121014 - Ferramentas de uso duradouro";
  }
  if (
    cleanCombined.includes("ensino") ||
    cleanCombined.includes("formacao") ||
    cleanCombined.includes("pedagogico") ||
    cleanCombined.includes("modulo")
  ) {
    return "121015 - Material de consumo para ensino e formação";
  }
  if (
    cleanCombined.includes("desporto") ||
    cleanCombined.includes("esporte") ||
    cleanCombined.includes("bola")
  ) {
    return "121018 - Material duradouro para desporto";
  }
  if (
    cleanCombined.includes("consumo para informatica") ||
    cleanCombined.includes("toner") ||
    cleanCombined.includes("tinteiro") ||
    cleanCombined.includes("cartucho")
  ) {
    return "121022 - Material de consumo para informática";
  }
  if (
    cleanCombined.includes("computador") ||
    cleanCombined.includes("laptop") ||
    cleanCombined.includes("impressora") ||
    cleanCombined.includes("servidor")
  ) {
    return "121023 - Material duradouro para informática";
  }
  if (cleanCombined.includes("software") || cleanCombined.includes("licenca")) {
    return "121024 - Software de base";
  }
  if (
    cleanCombined.includes("copa") ||
    cleanCombined.includes("cozinha") ||
    cleanCombined.includes("cha") ||
    cleanCombined.includes("cafe")
  ) {
    return "121026 - Material de consumo para copa e cozinha";
  }
  if (
    cleanCombined.includes("semente") ||
    cleanCombined.includes("planta") ||
    cleanCombined.includes("insumo") ||
    cleanCombined.includes("adubo")
  ) {
    return "121028 - Sementes, plantas e insumos";
  }
  if (
    cleanCombined.includes("comunicacao") ||
    cleanCombined.includes("telefone") ||
    cleanCombined.includes("internet") ||
    cleanCombined.includes("credito") ||
    cleanCombined.includes("recarga")
  ) {
    return "122001 - Comunicações em geral";
  }
  if (
    cleanCombined.includes("passagem") ||
    cleanCombined.includes("transporte") ||
    cleanCombined.includes("viagem") ||
    cleanCombined.includes("bilhete")
  ) {
    return "122002 - Passagens dentro do país";
  }
  if (
    cleanCombined.includes("renda") ||
    cleanCombined.includes("aluguel") ||
    cleanCombined.includes("locacao")
  ) {
    return "122004 - Renda de instalações";
  }
  if (
    cleanCombined.includes("reparacao de veiculo") ||
    cleanCombined.includes("manutencao de veiculo") ||
    cleanCombined.includes("oficina") ||
    cleanCombined.includes("pneu")
  ) {
    return "122007 - Manutenção e reparação de veículos";
  }
  if (cleanCombined.includes("seguro")) {
    return "122009 - Seguros";
  }
  if (cleanCombined.includes("agua")) {
    return "122012 - Água";
  }
  if (
    cleanCombined.includes("energia") ||
    cleanCombined.includes("eletrica") ||
    cleanCombined.includes("electrica") ||
    cleanCombined.includes("credelec")
  ) {
    return "122013 - Energia eléctrica";
  }
  if (
    cleanCombined.includes("servicos graficos") ||
    cleanCombined.includes("impressao") ||
    cleanCombined.includes("banner") ||
    cleanCombined.includes("encadernacao")
  ) {
    return "122024 - Serviços gráficos";
  }
  if (cleanCombined.includes("comunidade")) {
    return "143107 - Transferências a comunidade local";
  }
  if (cleanCombined.includes("bolsa")) {
    return "143401 - Bolsa de estudos no país";
  }
  if (cleanCombined.includes("familia")) {
    return "143499 - Outras transferências a famílias";
  }
  if (cleanCombined.includes("servico") || cleanCombined.includes("consultoria")) {
    return "122099 - Outros serviços";
  }
  if (
    cleanCombined.includes("bens") ||
    cleanCombined.includes("material") ||
    cleanCombined.includes("consumo")
  ) {
    return "121098 - Outros bens de consumo";
  }

  if (rubTrim) {
    return rubTrim;
  }

  return "121098 - Outros bens de consumo";
}

export function getCanonicalItemName(
  necStr?: any,
  prodStr?: any
): { canonicalKey: string; displayName: string; productName: string } {
  const cleanProd = String(prodStr || "").trim();
  const cleanNec = String(necStr || "").trim();

  // Item principal de referência
  const primary = cleanProd || cleanNec || "";

  // Normalização do texto (remove acentos e converte para minúsculas)
  let normalized = primary
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  // Remove prefixos de ação para agrupar produtos idênticos (ex: "Aquisição de ", "Compra de ")
  normalized = normalized
    .replace(/^(aquisicao|compra|fornecimento|contratacao|pagamento|aluguer|prestacao|servico|servicos)\s+de\s+/gi, "")
    .replace(/^(aquisicao|compra|fornecimento|contratacao|pagamento|aluguer|prestacao)\s+/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const canonicalKey = normalized || primary.toLowerCase().trim();
  const displayName = cleanNec || primary;
  const productName = cleanProd || primary;

  return { canonicalKey, displayName, productName };
}

export function getCanonicalGroupAndProduct(
  necStr?: string,
  prodStr?: string
): {
  groupKey: string;
  groupName: string;
  productKey: string;
  productName: string;
} {
  const cleanNec = (necStr || "").trim();
  const cleanProd = (prodStr || "").trim();

  // Grupo principal da necessidade
  const rawGroupName = cleanNec || cleanProd || "Necessidades Gerais";

  let normGroup = rawGroupName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  normGroup = normGroup
    .replace(/^(aquisicao|compra|fornecimento|contratacao|pagamento|aluguer|prestacao|servico|servicos)\s+de\s+/gi, "")
    .replace(/^(aquisicao|compra|fornecimento|contratacao|pagamento|aluguer|prestacao)\s+/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const groupKey = normGroup || "geral";
  const groupName = cleanNec || rawGroupName;

  // Produto específico dentro da necessidade
  const rawProdName = cleanProd || cleanNec || "Item / Serviço Planificado";
  let normProd = rawProdName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  normProd = normProd
    .replace(/^(aquisicao|compra|fornecimento|contratacao|pagamento|aluguer|prestacao|servico|servicos)\s+de\s+/gi, "")
    .replace(/^(aquisicao|compra|fornecimento|contratacao|pagamento|aluguer|prestacao)\s+/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const productKey = normProd || "item";
  const productName = cleanProd || rawProdName;

  return { groupKey, groupName, productKey, productName };
}

const normalizeStr = (str?: string): string => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(departamento|depto|dep|reparticao|rep|setor|direcao|direccao|de|do|da|dos|das)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const matchesUnitStr = (actVal?: string, targetVal?: string): boolean => {
  if (!targetVal || targetVal === "todos") return true;
  if (!actVal) return false;
  const rawA = actVal.toLowerCase().trim();
  const rawT = targetVal.toLowerCase().trim();
  if (rawA.includes(rawT) || rawT.includes(rawA)) return true;

  // RH / Recursos Humanos / Gestão de Pessoal aliases matching
  const isTargetRH =
    rawT.includes("pessoal") ||
    rawT.includes("recursos humanos") ||
    rawT === "rh" ||
    rawT === "drh" ||
    rawT.includes("gestao de pessoal");
  const isActRH =
    rawA.includes("pessoal") ||
    rawA.includes("recursos humanos") ||
    rawA === "rh" ||
    rawA === "drh" ||
    rawA.includes("gestao de pessoal");

  if (isTargetRH && isActRH) return true;

  const normA = normalizeStr(actVal);
  const normT = normalizeStr(targetVal);
  if (!normA || !normT) return false;

  const isUgeaA = normA === "ugea" || normA.includes("gestora executora") || normA.includes("aquisicoes");
  const isUgeaT = normT === "ugea" || normT.includes("gestora executora") || normT.includes("aquisicoes");
  if (isUgeaA && isUgeaT) return true;
  if (isUgeaA !== isUgeaT) return false;

  return normA.includes(normT) || normT.includes(normA);
};

const isUgeaActivity = (act: any): boolean => {
  if (!act) return false;
  const dept = normalizeStr(act.departamento || act.solicitante || act.unidade || act.orgao || act.origem || "");
  const set = normalizeStr(act.setor || act.sector || act.reparticao || "");
  const title = normalizeStr(act.nomeAtividade || act.designacao || act.title || act.atividade || "");
  const code = normalizeStr(act.codigo || act.codigoAtividade || act.numProcesso || "");

  return (
    dept.includes("ugea") ||
    dept.includes("gestora executora") ||
    dept.includes("aquisicoes") ||
    set.includes("ugea") ||
    set.includes("chefe da ugea") ||
    title.includes("ugea") ||
    code.includes("ugea")
  );
};

const isDgUnit = (unitStr: string): boolean => {
  if (!unitStr) return false;
  const norm = normalizeStr(unitStr);
  return (
    norm.includes("diretor geral") ||
    norm.includes("diretor-geral") ||
    norm.includes("director geral") ||
    norm.includes("director-geral") ||
    norm.includes("gabinete do diretor") ||
    norm === "gdg" ||
    norm.includes("chefe do gdg")
  );
};

const isDicosafaUnit = (unitStr: string): boolean => {
  if (!unitStr) return false;
  const norm = normalizeStr(unitStr);
  return norm.includes("dicosafa") || norm.includes("dicossafa");
};

const matchesDeptStr = (actVal?: string, targetVal?: string): boolean => {
  if (!targetVal || targetVal === "todos") return true;
  if (!actVal) return false;
  const normA = normalizeStr(actVal);
  const normT = normalizeStr(targetVal);
  if (!normA || !normT) return false;

  // Custom UGEA matching & strict isolation
  const isUgeaA = normA === "ugea" || normA.includes("gestora executora") || normA.includes("aquisicoes");
  const isUgeaT = normT === "ugea" || normT.includes("gestora executora") || normT.includes("aquisicoes");
  if (isUgeaA && isUgeaT) return true;
  if (isUgeaA !== isUgeaT) return false;

  if (normA === normT) return true;
  return normA.includes(normT) || normT.includes(normA);
};

export default function AcaoOrcamentalView({
  user,
  title,
  activities,
  onShowAlert,
  onBack,
}: AcaoOrcamentalViewProps) {
  const [activeTab, setActiveTab] = useState<
    "rubricas" | "overview" | "reforco"
  >("rubricas");

  const [selectedLevel, setSelectedLevel] = useState<
    "institucional" | "direcao" | "departamento" | "reparticao" | "setor"
  >("institucional");
  const [selectedUnit, setSelectedUnit] = useState<string>("todos");
  const [showActivitiesModal, setShowActivitiesModal] = useState(false);

  const [sharingActivityId, setSharingActivityId] = useState<string | null>(null);
  const [isSavingShare, setIsSavingShare] = useState<string | null>(null);

  const SHARABLE_AREAS = useMemo(() => [
    "Gabinete do Diretor-Geral",
    "Unidade Gestora e Executora de Aquisições (UGEA)",
    "Departamento de Recursos Humanos",
    "Departamento de Finanças",
    "Departamento de Património",
    "Departamento TIC",
    "Secretaria Geral",
    "DICOSAFA",
    "DICOSSER",
    "Divisão de Engenharia",
    "Departamento de Registo Académico",
    "Departamento de Assuntos Estudantis",
  ], []);

  const handleToggleShare = async (activity: any, area: string) => {
    if (!activity || !activity.id) return;
    setIsSavingShare(activity.id);
    
    const currentShares = Array.isArray(activity.sharedWith) ? [...activity.sharedWith] : [];
    const normalizedArea = area.toLowerCase().trim();
    
    let updatedShares: string[];
    if (currentShares.some(x => x.toLowerCase().trim() === normalizedArea)) {
      updatedShares = currentShares.filter(x => x.toLowerCase().trim() !== normalizedArea);
    } else {
      updatedShares = [...currentShares, area];
    }
    
    try {
      await firestoreService.matrixActivities.update(activity.id, {
        sharedWith: updatedShares
      });
      // Atualizar localmente
      activity.sharedWith = updatedShares;
      onShowAlert(`Permissões de partilha manual para "${activity.nome || activity.atividade || 'atividade'}" atualizadas com sucesso!`);
    } catch (err) {
      console.error("Erro ao atualizar partilha:", err);
      onShowAlert("Não foi possível atualizar as permissões de partilha.");
    } finally {
      setIsSavingShare(null);
    }
  };

  const isPlanificacaoOrDPEP = useMemo(() => {
    if (isSuperBossUser(user)) return true;
    const userEmail = String(user?.email || "").toLowerCase().trim();
    const userRoleStr = String(user?.role || "").toLowerCase().trim();
    if (
      userEmail === "slaitertripas@gmail.com" ||
      userRoleStr === "admin" ||
      userRoleStr === "administrador" ||
      userRoleStr === "administrador do sistema" ||
      userRoleStr === "proprietario" ||
      userRoleStr === "proprietário"
    ) {
      return true;
    }

    const userDept = String(
      user?.departamento || user?.setor || user?.reparticao || "",
    ).toUpperCase();
    const userRole = String(user?.cargo || user?.role || "").toUpperCase();
    const currentTitle = String(title || "").toUpperCase();

    // Setor de Monitoria não planifica nem altera níveis de planificação
    if (userDept.includes("MONITORIA") || userRole.includes("MONITORIA") || currentTitle.includes("MONITORIA")) {
      return false;
    }

    return (
      userDept.includes("PLANIFICAÇÃO") ||
      userDept.includes("PLANIFICACAO") ||
      userDept.includes("DPEP") ||
      userRole.includes("PLANIFICAÇÃO") ||
      userRole.includes("PLANIFICACAO") ||
      userRole.includes("DPEP") ||
      currentTitle.includes("PLANIFICAÇÃO") ||
      currentTitle.includes("PLANIFICACAO") ||
      currentTitle.includes("DPEP")
    );
  }, [user?.email, user?.role, user?.departamento, user?.setor, user?.reparticao, user?.cargo, user?.title, title]);

  // Source of Truth for Security: Filter activities once at the top
  const authorizedActivities = useMemo(() => {
    if (!activities) return [];
    const valid = activities.filter(isValidActivity);
    if (isSuperBossUser(user)) return valid;
    return getAuthorizedActivities(valid, user);
  }, [activities, user?.email, user?.role, user?.departamento, user?.setor, user?.reparticao, user?.cargo, user?.title, user?.uid, user?.id]);

  // Extrair unidades organizacionais por nível
  const levelUnits = useMemo(() => {
    const direcoes = new Set<string>();
    const departamentos = new Set<string>();
    const reparticoes = new Set<string>();
    const setores = new Set<string>();

    authorizedActivities.forEach((act) => {
      const d = act.direcao || act.direccao || act.unidadeOrganica;
      if (d && typeof d === "string" && d.trim()) direcoes.add(d.trim());

      const dep = act.departamento || act.unidadeOrganica || act.orgao || act.solicitante || act.unidade || act.origem;
      if (dep && typeof dep === "string" && dep.trim()) departamentos.add(dep.trim());

      const rep = act.reparticao;
      if (rep && typeof rep === "string" && rep.trim()) reparticoes.add(rep.trim());

      const set = act.setor;
      if (set && typeof set === "string" && set.trim()) setores.add(set.trim());
    });

    if (title && typeof title === "string" && title.trim()) {
      departamentos.add(title.trim());
      setores.add(title.trim());
    }
    if (user?.departamento) departamentos.add(user.departamento.trim());
    if (user?.direcao) direcoes.add(user.direcao.trim());
    if (user?.reparticao) reparticoes.add(user.reparticao.trim());
    if (user?.setor) setores.add(user.setor.trim());

    // Para o setor de planificação, garantir que todas as direções oficiais apareçam no dropbox
    if (isPlanificacaoOrDPEP) {
      UNIDADES_ORGANICAS_SISTEMA.forEach(u => {
        u.direcoes.forEach(d => direcoes.add(d));
      });
    }

    return {
      direcao: Array.from(direcoes).sort(),
      departamento: Array.from(departamentos).sort(),
      reparticao: Array.from(reparticoes).sort(),
      setor: Array.from(setores).sort(),
    };
  }, [activities, title, user?.departamento, user?.direcao, user?.reparticao, user?.setor, isPlanificacaoOrDPEP]);

  const userDirecao = useMemo(() => {
    if (user?.direcao) return user.direcao;
    const dept = user?.departamento || title || "";
    for (const u of UNIDADES_ORGANICAS_SISTEMA) {
      for (const d of u.direcoes) {
        if (d.toLowerCase() === dept.toLowerCase() || (DEPARTAMENTOS[d] && DEPARTAMENTOS[d].some(x => x.toLowerCase() === dept.toLowerCase()))) {
          return d;
        }
      }
    }
    return user?.direcao || "DICOSSER";
  }, [user?.direcao, user?.departamento, title]);

  const userDepartamento = useMemo(() => {
    return user?.departamento || title || "Departamento";
  }, [user?.departamento, title]);

  React.useEffect(() => {
    if (isPlanificacaoOrDPEP || isSuperBossUser(user)) {
      setSelectedLevel("institucional");
      setSelectedUnit("todos");
    } else {
      const roleStr = String(user?.cargo || user?.title || user?.role || user?.cargoChefia || "").toLowerCase();
      const isDirector = (roleStr.includes("diretor") || roleStr.includes("director")) && !roleStr.includes("gabinete") && !String(user?.departamento || "").toLowerCase().includes("gabinete");
      if (isDirector) {
        setSelectedLevel("direcao");
        setSelectedUnit(userDirecao);
      } else {
        setSelectedLevel("departamento");
        setSelectedUnit(userDepartamento);
      }
    }
  }, [title, isPlanificacaoOrDPEP, user?.cargo, user?.title, user?.role, user?.cargoChefia, user?.email, userDirecao, userDepartamento]);

  // Resetar a unidade selecionada quando muda o nível ou garantir unidade inicial válida
  const handleLevelChange = (
    lvl: "institucional" | "direcao" | "departamento" | "reparticao" | "setor"
  ) => {
    if (!isPlanificacaoOrDPEP) return; // Apenas o setor de planificação pode alterar o nível
    setSelectedLevel(lvl);
    if (lvl === "institucional") {
      setSelectedUnit("todos");
    } else {
      const units = levelUnits[lvl];
      setSelectedUnit(units && units.length > 0 ? units[0] : "");
    }
  };

  React.useEffect(() => {
    if (selectedLevel !== "institucional") {
      const units = levelUnits[selectedLevel];
      if (units && units.length > 0) {
        if (!selectedUnit || selectedUnit === "todos" || !units.includes(selectedUnit)) {
          setSelectedUnit(units[0]);
        }
      }
    }
  }, [selectedLevel, levelUnits]);

  // Filtrar atividades conforme o Nível Estrutural e a Unidade Selecionada
  const sectorActivities = useMemo(() => {
    // Usar atividades já filtradas por autorização básica e que obrigatoriamente possuem setor planificado (Nível Setorial)
    let baseActivities = authorizedActivities.filter((act) => {
      const sector = String(act.setor || act.reparticao || act.solicitante || act.unidade || act.orgao || "").trim();
      return sector !== "";
    });

    // Se o utilizador não for da Planificação / DPEP, restringe à sua área de alçada de forma estritamente isolada
    if (!isPlanificacaoOrDPEP) {
      baseActivities = baseActivities.filter((act) =>
        canAccessArea(user, act.direcao || "", act.departamento || "", act.setor || act.reparticao || "", act)
      );
    } else if (!isSuperBossUser(user)) {
      // Para o DPEP/Planificação, apenas visualizar atividades de outros setores que tenham sido EFETIVAMENTE ENVIADAS/SUBMETIDAS pelos setores produtores
      baseActivities = baseActivities.filter((act) => {
        const actDept = String(act.departamento || act.setor || act.reparticao || act.direcao || "").toUpperCase();
        const isOwnDPEP = actDept.includes("DPEP") || actDept.includes("PLANIFICAÇÃO") || actDept.includes("PLANIFICACAO");
        if (isOwnDPEP) return true;

        const isSent =
          act.submetido === true ||
          act.enviadoADPEP === true ||
          act.submetidoADPEP === true ||
          act.enviadoPeloSetor === true ||
          act.enviado === true ||
          (act.status && act.status !== "rascunho" && act.status !== "draft" && act.status !== "pendente");

        return isSent;
      });
    }

    if (selectedLevel === "institucional") {
      return baseActivities;
    }

    if (selectedUnit === "todos") {
      return baseActivities.filter((act) => {
        const strictMatch = false;
        if (selectedLevel === "direcao") {
          const has = !!(act.direcao || act.direccao || act.unidadeOrganica);
          return strictMatch ? has && !act.departamento && !act.reparticao && !act.setor : has;
        }
        if (selectedLevel === "departamento") {
          const has = !!act.departamento;
          return strictMatch ? has && !act.reparticao && !act.setor : has;
        }
        if (selectedLevel === "reparticao") {
          const has = !!act.reparticao;
          return strictMatch ? has && !act.setor : has;
        }
        if (selectedLevel === "setor") {
          return !!act.setor;
        }
        return true;
      });
    }

    return baseActivities.filter((act) => {
      const strictMatch = false;

      // Isolamento estrito: Ações orçamentais da UGEA não aparecem no Diretor-Geral nem na DICOSAFA
      const isUgea = isUgeaActivity(act);
      const isTargetUgea = selectedUnit.toLowerCase().includes("ugea") || selectedUnit.toLowerCase().includes("gestora");
      const isTargetDG = isDgUnit(selectedUnit);
      const isTargetDicosafa = isDicosafaUnit(selectedUnit);

      if (isUgea && (isTargetDG || isTargetDicosafa)) {
        return false;
      }
      if (!isUgea && isTargetUgea) {
        return false;
      }
      
      if (selectedLevel === "direcao") {
        const matches = matchesUnitStr(act.direcao || act.direccao || act.unidadeOrganica, selectedUnit);
        return strictMatch && matches ? !act.departamento && !act.reparticao && !act.setor : matches;
      }
      if (selectedLevel === "departamento") {
        let matches = false;
        if (act.departamento) {
          matches = matchesDeptStr(act.departamento, selectedUnit);
        } else {
          matches = (
            matchesDeptStr(act.solicitante, selectedUnit) ||
            matchesDeptStr(act.unidade, selectedUnit) ||
            matchesDeptStr(act.origem, selectedUnit) ||
            matchesDeptStr(act.orgao, selectedUnit)
          );
        }
        return strictMatch && matches ? !act.reparticao && !act.setor : matches;
      }
      if (selectedLevel === "reparticao") {
        const matches = matchesUnitStr(act.reparticao, selectedUnit);
        return strictMatch && matches ? !act.setor : matches;
      }
      if (selectedLevel === "setor") {
        return matchesUnitStr(act.setor, selectedUnit);
      }

      return matchesUnitStr(act.departamento, selectedUnit);
    });
  }, [authorizedActivities, selectedLevel, selectedUnit, isPlanificacaoOrDPEP, user?.email, user?.role, user?.cargo, user?.title, user?.cargoChefia, userDirecao, userDepartamento]);

  // Total Geral do valor de todas as atividades planificadas (Orçamento do Nível/Departamento)
  const totalOrcamentadoSetor = useMemo(() => {
    return sectorActivities.reduce((sum, act) => {
      let actVal = 0;
      let hasRub = false;

      if (Array.isArray(act.rubricas) && act.rubricas.length > 0) {
        const rSum = act.rubricas.reduce(
          (acc: number, r: any) =>
            acc + Number(r.valorTotal || r.total || r.valor || r.precoTotal || 0),
          0
        );
        if (rSum > 0) {
          actVal += rSum;
          hasRub = true;
        }
      }

      // Apenas considera o valor das rubricas explicitamente planificadas
      if (!hasRub) {
        actVal += Number(
          act.valor ||
            act.orcamentoTotal ||
            act.valorTotal ||
            act.orcamento ||
            act.custoTotal ||
            0
        );
      }
      return sum + actVal;
    }, 0);
  }, [sectorActivities]);

  // Coletânea completa e agrupamento detalhado por Rúbricas e Necessidades
  // Total Geral de Absolutamente Todas as Atividades do Sistema (para o Teto Institucional)
  const totalGeralAbsoluto = useMemo(() => {
    // Para garantir a privacidade, se o utilizador não for DPEP/SuperBoss,
    // o "Total Geral" deve ser apenas o total do seu departamento, e não o institucional.
    return authorizedActivities.reduce((sum, act) => {
      let actVal = 0;
      let hasRub = false;
      if (Array.isArray(act.rubricas) && act.rubricas.length > 0) {
        const rSum = act.rubricas.reduce(
          (acc: number, r: any) =>
            acc + Number(r.valorTotal || r.total || r.valor || r.precoTotal || 0),
          0
        );
        if (rSum > 0) {
          actVal += rSum;
          hasRub = true;
        }
      }
      if (!hasRub) {
        actVal += Number(act.valor || act.orcamentoTotal || act.valorTotal || act.orcamento || act.custoTotal || 0);
      }
      return sum + actVal;
    }, 0);
  }, [authorizedActivities]);

  const rubricasBreakdown = useMemo(() => {
    const rubricaMap: {
      [rubricaName: string]: {
        rubricaName: string;
        totalValorRubrica: number;
        necessidadesMap: {
          [necKey: string]: {
            necessidadeName: string;
            nomeProduto?: string;
            quantidadeTotal: number;
            valorTotalNecessidade: number;
            atividadesCount: number;
            precoUnitario?: number;
            especificacao?: string;
          };
        };
      };
    } = {};

    sectorActivities.forEach((act) => {
      let hasProcessedRubrica = false;

      // 1. Array de rúbricas cadastrado (Apenas produtos/itens expressamente planificados com valor monetário)
      if (Array.isArray(act.rubricas) && act.rubricas.length > 0) {
        act.rubricas.forEach((r: any) => {
          const val = Number(
            r.valorTotal || r.total || r.valor || r.precoTotal || r.custo || 0
          );
          const qty = Number(r.quantidade || r.qtd || 1);

          // Excluir necessidades e itens sem valor monetário
          if (val <= 0) return;

          hasProcessedRubrica = true;
          const rawRub = (
            r.rubrica ||
            r.nomeRubrica ||
            r.code ||
            r.categoria ||
            "Outras Despesas / Geral"
          ).trim();
          const necessidadeStr = (
            r.necessidade ||
            r.descricao ||
            r.nomeProduto ||
            r.item ||
            r.name ||
            act.designacao ||
            act.title ||
            "Necessidade Geral"
          ).trim();
          const rubricaStr = getOfficialRubricaLabel(rawRub, necessidadeStr);
          const prodName = String(r.nomeProduto || r.especificacao || r.produto || r.item || "").trim();
          
          // Normalização e Agrupamento Único de Rúbricas e Produtos/Necessidades
          const rubricaKey = rubricaStr.toUpperCase();
          const { canonicalKey, displayName, productName } = getCanonicalItemName(necessidadeStr, prodName);
          const pUnit = Number(r.precoUnitario || r.preco || (qty > 0 ? val / qty : 0));

          if (!rubricaMap[rubricaKey]) {
            rubricaMap[rubricaKey] = {
              rubricaName: rubricaStr,
              totalValorRubrica: 0,
              necessidadesMap: {},
            };
          }
          rubricaMap[rubricaKey].totalValorRubrica += val;

          if (!rubricaMap[rubricaKey].necessidadesMap[canonicalKey]) {
            rubricaMap[rubricaKey].necessidadesMap[canonicalKey] = {
              necessidadeName: displayName,
              nomeProduto: productName,
              quantidadeTotal: 0,
              valorTotalNecessidade: 0,
              atividadesCount: 0,
              precoUnitario: pUnit,
              especificacao: String(r.especificacao || ""),
            };
          }
          rubricaMap[rubricaKey].necessidadesMap[canonicalKey].quantidadeTotal += qty;
          rubricaMap[rubricaKey].necessidadesMap[canonicalKey].valorTotalNecessidade += val;
          rubricaMap[rubricaKey].necessidadesMap[canonicalKey].atividadesCount += 1;
        });
      }

      // 3. Fallback para atividades que têm orçamento planificado no plano de atividades mas sem array de rubricas detalhado
      if (!hasProcessedRubrica) {
        const val = Number(
          act.valor ||
            act.orcamentoTotal ||
            act.valorTotal ||
            act.orcamento ||
            act.custoTotal ||
            0
        );
        if (val > 0) {
          const rawRub = (
            act.rubrica ||
            act.categoria ||
            "Despesas Gerais de Funcionamento"
          ).trim();
          const necessidadeStr = (
            act.necessidade ||
            act.designacao ||
            act.title ||
            "Atividade Planificada"
          ).trim();
          const rubricaStr = getOfficialRubricaLabel(rawRub, necessidadeStr);
          const qty = Number(act.quantidade || act.qtd || 1);
          const rubricaKey = rubricaStr.toUpperCase();
          const { canonicalKey, displayName, productName } = getCanonicalItemName(necessidadeStr, "");

          if (!rubricaMap[rubricaKey]) {
            rubricaMap[rubricaKey] = {
              rubricaName: rubricaStr,
              totalValorRubrica: 0,
              necessidadesMap: {},
            };
          }
          rubricaMap[rubricaKey].totalValorRubrica += val;

          if (!rubricaMap[rubricaKey].necessidadesMap[canonicalKey]) {
            rubricaMap[rubricaKey].necessidadesMap[canonicalKey] = {
              necessidadeName: displayName,
              nomeProduto: productName,
              quantidadeTotal: 0,
              valorTotalNecessidade: 0,
              atividadesCount: 0,
            };
          }
          rubricaMap[rubricaKey].necessidadesMap[canonicalKey].quantidadeTotal += qty;
          rubricaMap[rubricaKey].necessidadesMap[canonicalKey].valorTotalNecessidade += val;
          rubricaMap[rubricaKey].necessidadesMap[canonicalKey].atividadesCount += 1;
        }
      }
    });

    return Object.values(rubricaMap)
      .filter((rub) => rub.totalValorRubrica > 0)
      .map((rub) => ({
        ...rub,
        necessidadesList: Object.values(rub.necessidadesMap)
          .filter((nec) => nec.valorTotalNecessidade > 0)
          .sort(
            (a, b) => b.valorTotalNecessidade - a.valorTotalNecessidade
          ),
      }))
      .filter((rub) => rub.necessidadesList.length > 0)
      .sort((a, b) => b.totalValorRubrica - a.totalValorRubrica);
  }, [sectorActivities]);

  const parentRubricasBreakdown = useMemo(() => {
    const parentMap: {
      [parentName: string]: {
        parentName: string;
        totalValor: number;
        itemsCount: number;
      };
    } = {};

    sectorActivities.forEach((act) => {
      let processed = false;
      if (Array.isArray(act.rubricas) && act.rubricas.length > 0) {
        act.rubricas.forEach((r: any) => {
          const rawRub = (r.rubrica || r.nomeRubrica || r.code || r.categoria || act.rubrica || "").trim();
          const parent = getParentRubrica(rawRub);
          const val = Number(r.valorTotal || r.total || r.valor || r.precoTotal || r.custo || 0);
          processed = true;

          if (!parentMap[parent]) {
            parentMap[parent] = { parentName: parent, totalValor: 0, itemsCount: 0 };
          }
          parentMap[parent].totalValor += val;
          parentMap[parent].itemsCount += 1;
        });
      }
      if (!processed) {
        const val = Number(act.valor || act.orcamentoTotal || act.valorTotal || act.orcamento || act.custoTotal || 0);
        if (val > 0) {
          const rawRub = (act.rubrica || act.categoria || "Outras Despesas").trim();
          const parent = getParentRubrica(rawRub);
          if (!parentMap[parent]) {
            parentMap[parent] = { parentName: parent, totalValor: 0, itemsCount: 0 };
          }
          parentMap[parent].totalValor += val;
          parentMap[parent].itemsCount += 1;
        }
      }
    });

    return Object.values(parentMap).sort((a, b) => b.totalValor - a.totalValor);
  }, [sectorActivities]);

  // Agrupar e consolidar o orçamento total distribuído por cada setor real do sistema
  const sectorBudgetsList = useMemo(() => {
    const map: {
      [key: string]: {
        sector: string;
        departamento: string;
        direcao: string;
        activitiesCount: number;
        total: number;
      };
    } = {};

    authorizedActivities.forEach((act) => {
      // Filtragem estrita: Ignorar atividades sem valor ou título (fantasma)
      const hasContent = (act.titulo || act.descricao || Number(act.valor) > 0);
      if (!hasContent) return;

      // Obter caminhos de setor, departamento, direção de forma padronizada
      const s = String(act.setor || act.reparticao || act.solicitante || act.unidade || act.orgao || "").trim();
      const d = String(act.departamento || act.unidadeOrganica || "Direção / Central").trim();
      const dir = String(act.direcao || act.direccao || "Institucional").trim();

      // Isolamento estrito de departamentos de RH: Só conta para o RH se o departamento for RH
      if (d.toUpperCase().includes("RH") && !["RECURSOS HUMANOS", "RH", "DEPARTAMENTO DE RH"].includes(d.toUpperCase())) return;

      const key = `${dir} - ${d} - ${s}`.toUpperCase();

      let val = 0;
      let hasRub = false;
      if (Array.isArray(act.rubricas) && act.rubricas.length > 0) {
        const rSum = act.rubricas.reduce(
          (acc: number, r: any) =>
            acc + Number(r.valorTotal || r.total || r.valor || r.precoTotal || 0),
          0
        );
        if (rSum > 0) {
          val += rSum;
          hasRub = true;
        }
      }
      if (!hasRub) {
        val += Number(act.valor || act.orcamentoTotal || act.valorTotal || act.orcamento || 0);
      }

      if (!map[key]) {
        map[key] = {
          sector: s,
          departamento: d,
          direcao: dir,
          activitiesCount: 0,
          total: 0,
        };
      }
      map[key].activitiesCount += 1;
      map[key].total += val;
    });

    return Object.values(map)
      .filter((item) => item.total > 0 || item.activitiesCount > 0)
      .sort((a, b) => b.total - a.total);
  }, [authorizedActivities]);

  // Extrair rubricas, necessidades e valores de forma agregada
  const aggregatedRubricasAndNeeds = useMemo(() => {
    const map: {
      [key: string]: { rubrica: string; necessidade: string; valor: number };
    } = {};

    sectorActivities.forEach((act) => {
      if (Array.isArray(act.rubricas) && act.rubricas.length > 0) {
        act.rubricas.forEach((r: any) => {
          const rawRub = (r.rubrica || r.code || "").trim();
          const necessidadeStr = (
            r.necessidade ||
            r.descricao ||
            r.name ||
            act.designacao ||
            act.title ||
            "Sem Descrição"
          ).trim();
          const prodName = String(r.nomeProduto || r.especificacao || r.produto || r.item || "").trim();
          const valorNum = Number(r.valorTotal || r.total || r.valor || 0);

          const officialRub = getOfficialRubricaLabel(rawRub, necessidadeStr);
          const { canonicalKey, displayName, productName } = getCanonicalItemName(necessidadeStr, prodName);

          const key = `${officialRub.toUpperCase()}_#_${canonicalKey}`;
          if (!map[key]) {
            map[key] = {
              rubrica: officialRub,
              necessidade: productName ? `${displayName} [${productName}]` : displayName,
              valor: 0,
            };
          }
          map[key].valor += valorNum;
        });
      } else {
        // Fallback caso não possua a estrutura de rubricas
        const rawRub = (act.rubrica || "").trim();
        const necessidadeStr = (
          act.designacao ||
          act.necessidade ||
          act.title ||
          "Necessidade Geral"
        ).trim();
        const valorNum = Number(act.valor || act.orcamentoTotal || 0);

        const officialRub = getOfficialRubricaLabel(rawRub, necessidadeStr);
        const { canonicalKey, displayName } = getCanonicalItemName(necessidadeStr, "");

        const key = `${officialRub.toUpperCase()}_#_${canonicalKey}`;
        if (!map[key]) {
          map[key] = {
            rubrica: officialRub,
            necessidade: displayName,
            valor: 0,
          };
        }
        map[key].valor += valorNum;
      }
    });

    return Object.values(map).sort((a, b) => b.valor - a.valor);
  }, [sectorActivities]);

  const totalValue = useMemo(() => {
    return aggregatedRubricasAndNeeds.reduce(
      (sum, item) => sum + item.valor,
      0,
    );
  }, [aggregatedRubricasAndNeeds]);

  // Pivot table calculations for rubricas and necessities
  const pivotTableData = useMemo(() => {
    const categories: {
      [key: string]: {
        label: string;
        items: { [key: string]: { label: string; qty: number; value: number } };
        blankQty: number;
        blankValue: number;
        totalQty: number;
        totalValue: number;
      };
    } = {
      SALARIO_REMUNERACOES: {
        label: "SALÁRIO E REMUNERAÇÕES",
        items: {
          "CORPO DOCENTE EFETIVO": {
            label: "CORPO DOCENTE EFETIVO",
            qty: 0,
            value: 0,
          },
          "CORPO DOCENTE CONTRATADO": {
            label: "CORPO DOCENTE CONTRATADO",
            qty: 0,
            value: 0,
          },
          "CTA EFETIVO": { label: "CTA EFETIVO", qty: 0, value: 0 },
          "CTA CONTRATADO": { label: "CTA CONTRATADO", qty: 0, value: 0 },
        },
        blankQty: 0,
        blankValue: 0,
        totalQty: 0,
        totalValue: 0,
      },
      BENS_121: {
        label: "BENS_121",
        items: {},
        blankQty: 0,
        blankValue: 0,
        totalQty: 0,
        totalValue: 0,
      },
      DEMAIS_DESPESAS_COM_O_PESSOAL_112: {
        label: "DEMAIS_DESPESAS_COM_O_PESSOAL_112",
        items: {},
        blankQty: 0,
        blankValue: 0,
        totalQty: 0,
        totalValue: 0,
      },
      DEMAIS_TRANFERÊNCIAS_A_FAMÍLIAS_1434: {
        label: "DEMAIS_TRANFERÊNCIAS_A_FAMÍLIAS_1434",
        items: {},
        blankQty: 0,
        blankValue: 0,
        totalQty: 0,
        totalValue: 0,
      },
      SERVIÇOS_122: {
        label: "SERVIÇOS_122",
        items: {},
        blankQty: 0,
        blankValue: 0,
        totalQty: 0,
        totalValue: 0,
      },
      OUTRAS_DESPESAS: {
        label: "OUTRAS DESPESAS / AJUDAS DE CUSTO",
        items: {},
        blankQty: 0,
        blankValue: 0,
        totalQty: 0,
        totalValue: 0,
      },
    };

    sectorActivities.forEach((act) => {
      if (Array.isArray(act.rubricas) && act.rubricas.length > 0) {
        act.rubricas.forEach((r: any) => {
          const rub = String(r.rubrica || r.code || "").trim();
          const nec = String(
            r.necessidade ||
              r.descricao ||
              r.name ||
              act.designacao ||
              act.title ||
              "",
          ).trim();
          const val = Number(r.valorTotal || r.total || r.valor || 0);
          const qty = Number(r.quantidade || r.qtd || 1);

          let catKey = "OUTRAS_DESPESAS";
          let overrideItemKey: string | null = null;
          const combinedText = `${rub} ${nec}`.toUpperCase();

          if (
            combinedText.includes("DOCENTE EFETIVO") ||
            combinedText.includes("PROFESSOR EFETIVO") ||
            (combinedText.includes("DOCENTE") &&
              combinedText.includes("EFETIVO"))
          ) {
            catKey = "SALARIO_REMUNERACOES";
            overrideItemKey = "CORPO DOCENTE EFETIVO";
          } else if (
            combinedText.includes("DOCENTE CONTRATADO") ||
            combinedText.includes("PROFESSOR CONTRATADO") ||
            (combinedText.includes("DOCENTE") &&
              combinedText.includes("CONTRATADO"))
          ) {
            catKey = "SALARIO_REMUNERACOES";
            overrideItemKey = "CORPO DOCENTE CONTRATADO";
          } else if (
            combinedText.includes("CTA EFETIVO") ||
            combinedText.includes("TÉCNICO EFETIVO") ||
            combinedText.includes("TECNICO EFETIVO") ||
            (combinedText.includes("CTA") && combinedText.includes("EFETIVO"))
          ) {
            catKey = "SALARIO_REMUNERACOES";
            overrideItemKey = "CTA EFETIVO";
          } else if (
            combinedText.includes("CTA CONTRATADO") ||
            combinedText.includes("TÉCNICO CONTRATADO") ||
            combinedText.includes("TECNICO CONTRATADO") ||
            (combinedText.includes("CTA") &&
              combinedText.includes("CONTRATADO"))
          ) {
            catKey = "SALARIO_REMUNERACOES";
            overrideItemKey = "CTA CONTRATADO";
          } else if (
            combinedText.includes("121") ||
            combinedText.includes("BENS")
          ) {
            catKey = "BENS_121";
          } else if (
            combinedText.includes("112") ||
            combinedText.includes("PESSOAL") ||
            combinedText.includes("SALARIO") ||
            combinedText.includes("SALÁRIO") ||
            combinedText.includes("REMUNERAÇÃO") ||
            combinedText.includes("REMUNERACAO")
          ) {
            catKey = "SALARIO_REMUNERACOES";
          } else if (
            combinedText.includes("143") ||
            combinedText.includes("131") ||
            combinedText.includes("FAMÍLIA") ||
            combinedText.includes("FAMILIA") ||
            combinedText.includes("TRANSFERÊNCIA") ||
            combinedText.includes("TRANSFERENCIA")
          ) {
            catKey = "DEMAIS_TRANFERÊNCIAS_A_FAMÍLIAS_1434";
          } else if (
            combinedText.includes("122") ||
            combinedText.includes("SERVIÇOS") ||
            combinedText.includes("SERVICOS") ||
            combinedText.includes("SERVIÇO") ||
            combinedText.includes("SERVICO")
          ) {
            catKey = "SERVIÇOS_122";
          }

          if (catKey) {
            const itemKey =
              overrideItemKey || nec || rub || "Outra Necessidade";
            if (!categories[catKey].items[itemKey]) {
              categories[catKey].items[itemKey] = {
                label: itemKey,
                qty: 0,
                value: 0,
              };
            }
            categories[catKey].items[itemKey].qty += qty;
            categories[catKey].items[itemKey].value += val;
            categories[catKey].totalQty += qty;
            categories[catKey].totalValue += val;
          }
        });
      } else {
        const rub = String(act.rubrica || "").trim();
        const nec = String(
          act.designacao || act.necessidade || act.title || "",
        ).trim();
        const val = Number(act.valor || act.orcamentoTotal || 0);
        const qty = Number(act.quantidade || act.qtd || 1);

        let catKey = "OUTRAS_DESPESAS";
        let overrideItemKey: string | null = null;
        const combinedText = `${rub} ${nec}`.toUpperCase();

        if (
          combinedText.includes("DOCENTE EFETIVO") ||
          combinedText.includes("PROFESSOR EFETIVO") ||
          (combinedText.includes("DOCENTE") && combinedText.includes("EFETIVO"))
        ) {
          catKey = "SALARIO_REMUNERACOES";
          overrideItemKey = "CORPO DOCENTE EFETIVO";
        } else if (
          combinedText.includes("DOCENTE CONTRATADO") ||
          combinedText.includes("PROFESSOR CONTRATADO") ||
          (combinedText.includes("DOCENTE") &&
            combinedText.includes("CONTRATADO"))
        ) {
          catKey = "SALARIO_REMUNERACOES";
          overrideItemKey = "CORPO DOCENTE CONTRATADO";
        } else if (
          combinedText.includes("CTA EFETIVO") ||
          combinedText.includes("TÉCNICO EFETIVO") ||
          combinedText.includes("TECNICO EFETIVO") ||
          (combinedText.includes("CTA") && combinedText.includes("EFETIVO"))
        ) {
          catKey = "SALARIO_REMUNERACOES";
          overrideItemKey = "CTA EFETIVO";
        } else if (
          combinedText.includes("CTA CONTRATADO") ||
          combinedText.includes("TÉCNICO CONTRATADO") ||
          combinedText.includes("TECNICO CONTRATADO") ||
          (combinedText.includes("CTA") && combinedText.includes("CONTRATADO"))
        ) {
          catKey = "SALARIO_REMUNERACOES";
          overrideItemKey = "CTA CONTRATADO";
        } else if (
          combinedText.includes("121") ||
          combinedText.includes("BENS")
        ) {
          catKey = "BENS_121";
        } else if (
          combinedText.includes("112") ||
          combinedText.includes("PESSOAL") ||
          combinedText.includes("SALARIO") ||
          combinedText.includes("SALÁRIO") ||
          combinedText.includes("REMUNERAÇÃO") ||
          combinedText.includes("REMUNERACAO")
        ) {
          catKey = "SALARIO_REMUNERACOES";
        } else if (
          combinedText.includes("143") ||
          combinedText.includes("131") ||
          combinedText.includes("FAMÍLIA") ||
          combinedText.includes("FAMILIA") ||
          combinedText.includes("TRANSFERÊNCIA") ||
          combinedText.includes("TRANSFERENCIA")
        ) {
          catKey = "DEMAIS_TRANFERÊNCIAS_A_FAMÍLIAS_1434";
        } else if (
          combinedText.includes("122") ||
          combinedText.includes("SERVIÇOS") ||
          combinedText.includes("SERVICOS") ||
          combinedText.includes("SERVIÇO") ||
          combinedText.includes("SERVICO")
        ) {
          catKey = "SERVIÇOS_122";
        }

        if (catKey) {
          const itemKey = overrideItemKey || nec || rub || "";
          if (!categories[catKey].items[itemKey]) {
            categories[catKey].items[itemKey] = {
              label: itemKey,
              qty: 0,
              value: 0,
            };
          }
          categories[catKey].items[itemKey].qty += qty;
          categories[catKey].items[itemKey].value += val;
          categories[catKey].totalQty += qty;
          categories[catKey].totalValue += val;
        }
      }
    });

    return categories;
  }, [sectorActivities]);

  const grandTotals = useMemo(() => {
    let totalQty = 0;
    let totalValue = 0;
    Object.values(pivotTableData).forEach((g: any) => {
      totalQty += g.totalQty;
      totalValue += g.totalValue;
    });
    return { totalQty, totalValue };
  }, [pivotTableData]);

  // Matriz Tabela Dinâmica Oficial SISTAFE com Códigos de Rúbricas
  const [expandedPivotRows, setExpandedPivotRows] = useState<Record<string, boolean>>({});
  const [showOnlyNonZeroPivot, setShowOnlyNonZeroPivot] = useState<boolean>(true);

  const sistafePivotData = useMemo(() => {
    const map: Record<
      string,
      {
        code: string;
        label: string;
        totalQuant: number;
        totalValor: number;
        necessidadesMap: Record<
          string,
          {
            groupKey: string;
            groupName: string;
            totalQuant: number;
            totalValor: number;
            productsMap: Record<
              string,
              {
                productKey: string;
                productName: string;
                quant: number;
                valor: number;
                precoUnitario?: number;
                especificacao?: string;
                count: number;
              }
            >;
            productsList: Array<{
              productKey: string;
              productName: string;
              quant: number;
              valor: number;
              precoUnitario?: number;
              especificacao?: string;
              count: number;
            }>;
          }
        >;
        necessidadesList: Array<{
          groupKey: string;
          groupName: string;
          totalQuant: number;
          totalValor: number;
          productsList: Array<{
            productKey: string;
            productName: string;
            quant: number;
            valor: number;
            precoUnitario?: number;
            especificacao?: string;
            count: number;
          }>;
        }>;
      }
    > = {};

    // Se o utilizador desativar o filtro "Apenas Utilizadas", mostra todas as 36 rúbricas oficiais como cabeçalho
    if (!showOnlyNonZeroPivot) {
      OFFICIAL_SISTAFE_RUBRICAS.forEach((item) => {
        const fullLabel = `${item.code} - ${item.name}`;
        map[fullLabel] = {
          code: item.code,
          label: fullLabel,
          totalQuant: 0,
          totalValor: 0,
          necessidadesMap: {},
          necessidadesList: [],
        };
      });
    }

    sectorActivities.forEach((act) => {
      let hasRubrica = false;

      // 1. Array de rúbricas cadastrado (Apenas itens expressamente planificados com valor monetário > 0)
      if (Array.isArray(act.rubricas) && act.rubricas.length > 0) {
        act.rubricas.forEach((r: any) => {
          const val = Number(r.valorTotal || r.total || r.valor || r.precoTotal || 0);
          const qty = Number(r.quantidade || r.qtd || 1);

          // REQUISITO ESTRITO: Apenas necessidades com valor monetário positivo
          if (val <= 0) return;

          hasRubrica = true;
          const rubStr = String(r.rubrica || r.nomeRubrica || r.code || "").trim();
          const necStr = String(
            r.necessidade || r.descricao || r.nomeProduto || r.item || act.designacao || act.title || ""
          ).trim();
          const prodName = String(r.nomeProduto || r.especificacao || r.produto || r.item || "").trim();
          const pUnit = Number(r.precoUnitario || r.preco || (qty > 0 ? val / qty : 0));

          const targetLabel = getOfficialRubricaLabel(rubStr, necStr);
          const rubKey = targetLabel.toUpperCase();
          const { groupKey, groupName, productKey, productName } = getCanonicalGroupAndProduct(necStr, prodName);

          if (!map[rubKey]) {
            map[rubKey] = {
              code: targetLabel.substring(0, 6),
              label: targetLabel,
              totalQuant: 0,
              totalValor: 0,
              necessidadesMap: {},
              necessidadesList: [],
            };
          }

          map[rubKey].totalQuant += qty;
          map[rubKey].totalValor += val;

          if (!map[rubKey].necessidadesMap[groupKey]) {
            map[rubKey].necessidadesMap[groupKey] = {
              groupKey,
              groupName,
              totalQuant: 0,
              totalValor: 0,
              productsMap: {},
              productsList: [],
            };
          }

          const group = map[rubKey].necessidadesMap[groupKey];
          group.totalQuant += qty;
          group.totalValor += val;

          if (!group.productsMap[productKey]) {
            group.productsMap[productKey] = {
              productKey,
              productName,
              quant: 0,
              valor: 0,
              precoUnitario: pUnit,
              especificacao: r.especificacao || "",
              count: 0,
            };
          }
          group.productsMap[productKey].quant += qty;
          group.productsMap[productKey].valor += val;
          group.productsMap[productKey].count += 1;
          if (pUnit > 0) group.productsMap[productKey].precoUnitario = pUnit;
        });
      }

      // 2. Fallback para atividades que têm orçamento geral sem array de rúbricas detalhado
      if (!hasRubrica) {
        const val = Number(
          act.valor || act.orcamentoTotal || act.valorTotal || act.orcamento || act.custoTotal || 0
        );
        const qty = Number(act.quantidade || act.qtd || 1);

        // REQUISITO ESTRITO: Apenas se tiver valor monetário positivo
        if (val > 0) {
          const rubStr = String(act.rubrica || act.categoria || "").trim();
          const necStr = String(act.necessidade || act.designacao || act.title || "").trim();
          const targetLabel = getOfficialRubricaLabel(rubStr, necStr);
          const rubKey = targetLabel.toUpperCase();
          const { groupKey, groupName, productKey, productName } = getCanonicalGroupAndProduct(necStr, "");

          if (!map[rubKey]) {
            map[rubKey] = {
              code: targetLabel.substring(0, 6),
              label: targetLabel,
              totalQuant: 0,
              totalValor: 0,
              necessidadesMap: {},
              necessidadesList: [],
            };
          }

          map[rubKey].totalQuant += qty;
          map[rubKey].totalValor += val;

          if (!map[rubKey].necessidadesMap[groupKey]) {
            map[rubKey].necessidadesMap[groupKey] = {
              groupKey,
              groupName: groupName || "Atividade Planificada",
              totalQuant: 0,
              totalValor: 0,
              productsMap: {},
              productsList: [],
            };
          }

          const group = map[rubKey].necessidadesMap[groupKey];
          group.totalQuant += qty;
          group.totalValor += val;

          if (!group.productsMap[productKey]) {
            group.productsMap[productKey] = {
              productKey,
              productName: productName || "Atividade Planificada",
              quant: 0,
              valor: 0,
              count: 0,
            };
          }
          group.productsMap[productKey].quant += qty;
          group.productsMap[productKey].valor += val;
          group.productsMap[productKey].count += 1;
        }
      }
    });

    return Object.values(map)
      .filter((row) => (!showOnlyNonZeroPivot ? true : row.totalValor > 0))
      .map((row) => {
        const necessidadesList = Object.values(row.necessidadesMap)
          .filter((group) => group.totalValor > 0)
          .map((group) => ({
            ...group,
            productsList: Object.values(group.productsMap)
              .filter((p) => p.valor > 0)
              .sort((a, b) => b.valor - a.valor),
          }))
          .filter((group) => group.productsList.length > 0)
          .sort((a, b) => b.totalValor - a.totalValor);

        return {
          ...row,
          necessidadesList,
        };
      })
      .filter((row) => (!showOnlyNonZeroPivot ? true : row.necessidadesList.length > 0 || row.totalValor > 0))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [sectorActivities, showOnlyNonZeroPivot]);

  const sistafeGrandTotals = useMemo(() => {
    return sistafePivotData.reduce(
      (acc, curr) => ({
        quant: acc.quant + curr.totalQuant,
        valor: acc.valor + curr.totalValor,
      }),
      { quant: 0, valor: 0 }
    );
  }, [sistafePivotData]);

  // Cálculo de Orçamento por Departamento (Total de Atividades)
  const departmentTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    
    // Lista todos os departamentos conhecidos
    Object.values(DEPARTAMENTOS).flat().forEach(dep => {
      totals[dep] = 0;
    });

    // Soma o valor de cada atividade ao seu departamento correspondente
    authorizedActivities.forEach(act => {
      // Se não tem atividade planificada a nível setorial, é igual a zero orçamento!
      const sector = String(act.setor || act.reparticao || act.solicitante || act.unidade || act.orgao || "").trim();
      if (sector === "") return;

      const dep = act.departamento || act.unidadeOrganica || "Sem Departamento";
      if (!totals[dep]) totals[dep] = 0;

      let actVal = 0;
      if (Array.isArray(act.rubricas) && act.rubricas.length > 0) {
        actVal = act.rubricas.reduce(
          (acc: number, r: any) => acc + Number(r.valorTotal || r.total || r.valor || r.precoTotal || 0),
          0
        );
      } else {
        actVal = Number(act.valor || act.orcamentoTotal || act.valorTotal || act.orcamento || act.custoTotal || 0);
      }
      
      totals[dep] += actVal;
    });

    return Object.entries(totals)
      .map(([name, total]) => ({ name, total }))
      .filter(item => item.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [authorizedActivities]);

  // Mapeamento de Direções por Departamento
  const direcaoByDepartamento = useMemo(() => {
    const map: Record<string, string> = {};
    Object.entries(DEPARTAMENTOS).forEach(([direcao, deps]) => {
      deps.forEach(dep => { map[dep] = direcao; });
    });
    return map;
  }, []);

  // Cálculo de Orçamento por Direção (Soma de Departamentos)
  const directionTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    departmentTotals.forEach(dt => {
      const dir = direcaoByDepartamento[dt.name] || "Gabinete / Outros";
      totals[dir] = (totals[dir] || 0) + dt.total;
    });
    return Object.entries(totals)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [departmentTotals, direcaoByDepartamento]);

  const toggleExpandPivotRow = (label: string) => {
    setExpandedPivotRows((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const expandAllPivotRows = () => {
    const all: Record<string, boolean> = {};
    sistafePivotData.forEach((row) => {
      all[row.label] = true;
    });
    setExpandedPivotRows(all);
  };

  const collapseAllPivotRows = () => {
    setExpandedPivotRows({});
  };

  // Reforço state
  const [reforcoForm, setReforcoForm] = useState({
    rubrica: "",
    valor: "",
    justificativa: "",
    fonte: "OE",
  });
  const [solicitacoes, setSolicitacoes] = useState<any[]>([
    {
      id: "REF-2027-001",
      rubrica: "Bens e Serviços (Material de Escritório)",
      valor: 45000,
      justificativa:
        "Necessidade de aquisição extra de consumíveis para exames do 1º Semestre.",
      fonte: "OE",
      status: "Pendente",
      data: "2027-07-10 09:30",
    },
  ]);

  const isDAF =
    user?.departamento?.toUpperCase().includes("DAF") ||
    title?.toUpperCase().includes("DAF");

  // Teto Orçamental a nível da Instituição (Global) - Dinâmico (Soma de todas as Direções)
  const tetoInstitucional = directionTotals.reduce((acc, curr) => acc + curr.total, 0);

  const canEditTeto = useMemo(() => {
    const userDept = String(
      user?.departamento || user?.setor || "",
    ).toUpperCase();
    const userRole = String(user?.cargo || user?.role || "").toUpperCase();
    const currentTitle = String(title || "").toUpperCase();
    return (
      userDept.includes("PLANIFICAÇÃO") ||
      userDept.includes("PLANIFICACAO") ||
      userDept.includes("DPEP") ||
      userRole.includes("PLANIFICAÇÃO") ||
      userRole.includes("PLANIFICACAO") ||
      userRole.includes("DPEP") ||
      userRole.includes("TÉCNICO") ||
      userRole.includes("TECNICO") ||
      userRole.includes("CHEFE") ||
      currentTitle.includes("PLANIFICAÇÃO") ||
      currentTitle.includes("PLANIFICACAO") ||
      currentTitle.includes("DPEP")
    );
  }, [user, title]);

  const docTetoId = `teto_${selectedLevel}_${selectedUnit}_${title}`.replace(/[^a-zA-Z0-9_]/g, "_");
  const storageKey = `teto_atribuido_${selectedLevel}_${selectedUnit}_${title}`;
  const [customTeto, setCustomTeto] = useState<number>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? Number(saved) : 0;
  });

  useEffect(() => {
    const unsub = firestoreService.subscribeToDocument<any>("tetos_orcamentais", docTetoId, (docData) => {
      if (docData && typeof docData.valor === "number") {
        setCustomTeto(docData.valor);
        localStorage.setItem(storageKey, String(docData.valor));
      }
    });
    return () => unsub();
  }, [docTetoId, storageKey]);

  const [isEditingTeto, setIsEditingTeto] = useState(false);
  const [tempTetoInput, setTempTetoInput] = useState<string>("");

  // Determinar o teto orçamental dinâmico padrão baseado nas atividades planificadas
  const defaultTeto = useMemo(() => {
    return totalOrcamentadoSetor;
  }, [totalOrcamentadoSetor]);

  const tetoMax = sectorActivities.length === 0 ? 0 : (customTeto > 0 ? customTeto : defaultTeto);

  const handleSaveTeto = async () => {
    const val = Number(tempTetoInput);
    if (isNaN(val) || val <= 0) {
      onShowAlert("Por favor, insira um valor válido para o teto atribuído.");
      return;
    }
    setCustomTeto(val);
    localStorage.setItem(storageKey, String(val));
    setIsEditingTeto(false);

    try {
      await firestoreService.tetosOrcamentais.set(docTetoId, {
        valor: val,
        level: selectedLevel,
        unit: selectedUnit,
        title,
        updatedAt: new Date().toISOString(),
      });
      onShowAlert(
        "Teto orçamental atribuído inserido/atualizado com sucesso na base de dados (Firestore) pelo Planificador!",
      );
    } catch (e) {
      console.error("Erro ao salvar teto no Firestore:", e);
      onShowAlert("Teto atualizado com sucesso no ecrã!");
    }
  };

  // Calcular despesa real planejada com base nas actividades do setor
  const totalDespesaPlanificada = useMemo(() => {
    return sectorActivities.reduce((sum, act) => {
      let actVal = 0;
      if (Array.isArray(act.rubricas) && act.rubricas.length > 0) {
        const rSum = act.rubricas.reduce(
          (s: number, r: any) =>
            s +
            Number(
              r.valorTotal ||
                r.total ||
                r.valor ||
                r.precoTotal ||
                r.custo ||
                Number(r.quantidade || r.qtd || 0) *
                  Number(r.precoUnitario || r.valorUnitario || r.preco || 0) ||
                0,
            ),
          0,
        );
        if (rSum > 0) {
          actVal = rSum;
        } else {
          actVal = Number(
            act.valor ||
              act.orcamentoTotal ||
              act.valorTotal ||
              act.orcamento ||
              act.custoTotal ||
              0,
          );
        }
      } else {
        actVal = Number(
          act.valor ||
            act.orcamentoTotal ||
            act.valorTotal ||
            act.orcamento ||
            act.custoTotal ||
            0,
        );
      }
      return sum + actVal;
    }, 0);
  }, [sectorActivities]);

  const saldoDisponivel = tetoMax - totalDespesaPlanificada;
  const percentagemExecucao =
    tetoMax > 0 ? (totalDespesaPlanificada / tetoMax) * 100 : 0;

  // Filtrar despesas por Fonte de Financiamento
  const despesaPorFonte = useMemo(() => {
    let oe = 0;
    let rp = 0;
    let outros = 0;

    sectorActivities.forEach((act) => {
      let valor = 0;
      if (Array.isArray(act.rubricas) && act.rubricas.length > 0) {
        const rSum = act.rubricas.reduce(
          (s: number, r: any) =>
            s +
            Number(
              r.valorTotal ||
                r.total ||
                r.valor ||
                r.precoTotal ||
                r.custo ||
                Number(r.quantidade || r.qtd || 0) *
                  Number(r.precoUnitario || r.valorUnitario || r.preco || 0) ||
                0,
            ),
          0,
        );
        if (rSum > 0) {
          valor = rSum;
        } else {
          valor = Number(
            act.valor ||
              act.orcamentoTotal ||
              act.valorTotal ||
              act.orcamento ||
              act.custoTotal ||
              0,
          );
        }
      } else {
        valor = Number(
          act.valor ||
            act.orcamentoTotal ||
            act.valorTotal ||
            act.orcamento ||
            act.custoTotal ||
            0,
        );
      }

      const fonte = (act.orcamento || act.fonteFinanciamento || "OE").toUpperCase();

      if (
        fonte.includes("OE") ||
        fonte.includes("ESTADO") ||
        fonte.includes("GERAL")
      ) {
        oe += valor;
      } else if (
        fonte.includes("RP") ||
        fonte.includes("RECEITA") ||
        fonte.includes("PRÓPRIA")
      ) {
        rp += valor;
      } else {
        outros += valor;
      }
    });

    return { oe, rp, outros };
  }, [sectorActivities]);

  // Mantemos compatibilidade com o histórico anterior se necessário
  const despesasPorRubrica = useMemo(() => {
    return aggregatedRubricasAndNeeds.map((item) => ({
      name: item.rubrica,
      valor: item.valor,
      count: 1,
      actividades: [item.necessidade],
    }));
  }, [aggregatedRubricasAndNeeds]);

  const handleSubmitReforco = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !reforcoForm.rubrica ||
      !reforcoForm.valor ||
      !reforcoForm.justificativa
    ) {
      onShowAlert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    const novoPedido = {
      id: `REF-2027-0${solicitacoes.length + 1}`,
      rubrica: reforcoForm.rubrica,
      valor: Number(reforcoForm.valor),
      justificativa: reforcoForm.justificativa,
      fonte: reforcoForm.fonte,
      status: "Pendente",
      data: new Date().toISOString().replace("T", " ").substring(0, 16),
    };

    setSolicitacoes([novoPedido, ...solicitacoes]);
    onShowAlert(
      "Pedido de reforço de crédito orçamental submetido com sucesso para validação!",
    );
    setReforcoForm({
      rubrica: "",
      valor: "",
      justificativa: "",
      fonte: "OE",
    });
  };

  return (
    <div id="acao-orcamental-print-area" className="w-full space-y-6 pb-12 animate-fade-in max-w-7xl mx-auto">
      <InstitutionalHeader
        direcaoName={user?.direcao || user?.unidadeOrganica || "Direção"}
        departamentoName={user?.departamento || ""}
        reparticaoName={user?.reparticao || ""}
        sectorName={user?.setor || user?.cargo || ""}
        year={2027}
        isOwner={user?.isOwner}
        unidadeName={user?.unidade || user?.unidadeOrganica || "Unidade Orgânica"}
        title="AÇÃO ORÇAMENTAL & DISTRIBUIÇÃO DE NECESSIDADES"
      />

      {/* Header controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-4 gap-4 px-4 print:hidden">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-sm"
              title="Voltar"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <button
            onClick={() => printElementById("acao-orcamental-print-area", "Ação Orçamental e Distribuição de Necessidades")}
            className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-sm gap-2 px-4 font-bold text-sm"
            title="Imprimir Documento"
          >
            <Printer size={18} />
            Imprimir
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Ação Orçamental
            </h2>
            <p className="text-xs font-bold text-slate-400 tracking-wider  mt-1">
              Gabinete do {title} &bull; Gestão de Limites e Dotações
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest transition-all ${
              activeTab === "overview"
                ? "bg-slate-900 text-white shadow-md shadow-slate-950/10"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab("rubricas")}
            className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest transition-all ${
              activeTab === "rubricas"
                ? "bg-slate-900 text-white shadow-md shadow-slate-950/10"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            Rúbricas & Despesas
          </button>
          <button
            onClick={() => setActiveTab("reforco")}
            className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest transition-all ${
              activeTab === "reforco"
                ? "bg-slate-900 text-white shadow-md shadow-slate-950/10"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
            disabled={isDAF}
          >
            Reforço de Crédito {isDAF ? "(Acesso Restrito)" : ""}
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Hierarquia Orçamental (Novo Requisito) */}
          {(isPlanificacaoOrDPEP || isSuperBossUser(user)) && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                    <PieChart size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900  tracking-wider">Monitoria & Organização Hierárquica dos Orçamentos</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Consolidação piramidal de orçamentos por jurisdição (Setor ➔ Repartição ➔ Departamento ➔ Direção ➔ Institucional)</p>
                  </div>
                </div>
              </div>

              {/* Informação sobre a Regra de Agregação Orçamental */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60">
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                  <div className="text-[10px] font-black text-amber-600  tracking-wider mb-1">1. Orçamento de Repartição</div>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                    Soma do total de valores das atividades planificadas em cada setor que responde à repartição.
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                  <div className="text-[10px] font-black text-blue-600  tracking-wider mb-1">2. Orçamento de Departamento</div>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                    Soma do total de valores das atividades em cada repartição que responde ao departamento.
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                  <div className="text-[10px] font-black text-emerald-600  tracking-wider mb-1">3. Orçamento de Direção</div>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                    Soma do total de valores das atividades em cada departamento que responde à direção.
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                  <div className="text-[10px] font-black text-purple-600  tracking-wider mb-1">4. Orçamento Institucional</div>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                    Soma do total de valores das atividades planificadas de todas as direções da instituição.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400  tracking-widest px-1">Nível de Visualização</label>
                  <select 
                    value={selectedLevel}
                    onChange={(e) => handleLevelChange(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                  >
                    <option value="institucional">Institucional (Geral)</option>
                    <option value="direcao">Por Direção</option>
                    <option value="departamento">Por Departamento</option>
                    <option value="reparticao">Por Repartição</option>
                    <option value="setor">Por Setor</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400  tracking-widest px-1">Unidade / Responsável</label>
                  <select 
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                  >
                    {selectedLevel === "institucional" && <option value="todos">Todos (Geral)</option>}
                    {selectedLevel === "direcao" && levelUnits.direcao.map(u => <option key={u} value={u}>{u}</option>)}
                    {selectedLevel === "departamento" && levelUnits.departamento.map(u => <option key={u} value={u}>{u}</option>)}
                    {selectedLevel === "reparticao" && levelUnits.reparticao.map(u => <option key={u} value={u}>{u}</option>)}
                    {selectedLevel === "setor" && levelUnits.setor.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Consultar Plano de Atividade Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-blue-900/5 border border-blue-200/80 p-5 rounded-3xl gap-4 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-sm shrink-0">
                <FileText size={22} />
              </div>
              <div>
                <h4 className="text-sm font-black text-blue-950  tracking-wider">Ação Orçamental & Atividades do Setor</h4>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  {sectorActivities.length > 0 
                    ? `Existem ${sectorActivities.length} atividade(s) planificada(s). Sem atividade, sem ação orçamental.` 
                    : "Sem atividade planificada, logo sem ação orçamental."}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowActivitiesModal(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs  tracking-widest rounded-2xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer shrink-0"
            >
              <FileText size={16} /> Consultar Plano de Atividade ({sectorActivities.length})
            </button>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-sky-50 text-sky-600 rounded-2xl group-hover:bg-sky-600 group-hover:text-white transition-colors">
                  <DollarSign size={20} />
                </div>
                <div className="text-[10px] font-black text-slate-400  tracking-widest bg-slate-50 px-2 py-0.5 rounded-lg">Orçamento</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-black text-slate-900 font-mono tracking-tighter">
                  {totalOrcamentadoSetor.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] font-bold text-slate-500  tracking-wider">Total Planeado (MZN)</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <LayoutGrid size={20} />
                </div>
                <div className="text-[10px] font-black text-slate-400  tracking-widest bg-slate-50 px-2 py-0.5 rounded-lg">Rúbricas</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-black text-slate-900 font-mono tracking-tighter">
                  {parentRubricasBreakdown.length}
                </div>
                <div className="text-[10px] font-bold text-slate-500  tracking-wider">Categorias Sistafé</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <TrendingUp size={20} />
                </div>
                <div className="text-[10px] font-black text-slate-400  tracking-widest bg-slate-50 px-2 py-0.5 rounded-lg">Atividades</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-black text-slate-900 font-mono tracking-tighter">
                  {sectorActivities.length}
                </div>
                <div className="text-[10px] font-bold text-slate-500  tracking-wider">Ações Mapeadas</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <CheckCircle2 size={20} />
                </div>
                <div className="text-[10px] font-black text-slate-400  tracking-widest bg-slate-50 px-2 py-0.5 rounded-lg">Produtos</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-black text-slate-900 font-mono tracking-tighter">
                  {parentRubricasBreakdown.reduce((acc, curr) => acc + curr.itemsCount, 0)}
                </div>
                <div className="text-[10px] font-bold text-slate-500  tracking-wider">Necessidades/Itens</div>
              </div>
            </div>
          </div>

          {/* Consolidado por Rúbrica */}
          {sectorActivities.length > 0 && (
            <div className="bg-sky-900/5 border border-sky-200/80 p-6 rounded-3xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black  tracking-widest text-sky-900 flex items-center gap-2">
                    💡 Resumo Consolidado por Rúbrica Mãe
                  </h4>
                  <p className="text-[10px] text-sky-700 font-medium mt-1">Agrupamento estratégico para gestão de dotações</p>
                </div>
                <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-3 py-1.5 rounded-full border border-sky-200">
                  {parentRubricasBreakdown.length} Rúbricas Mapeadas
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {parentRubricasBreakdown.map((rub, idx) => {
                  const isMaterial = rub.parentName.toLowerCase().includes("bens") || rub.parentName.toLowerCase().includes("material");
                  const isServicos = rub.parentName.toLowerCase().includes("serviços");
                  const isAjudas = rub.parentName.toLowerCase().includes("ajuda");
                  
                  const grandTotal = Math.max(totalOrcamentadoSetor, parentRubricasBreakdown.reduce((acc, curr) => acc + curr.totalValor, 0));
                  const pct = grandTotal > 0 ? (rub.totalValor / grandTotal) * 100 : 0;

                  return (
                    <div 
                      key={idx} 
                      className={`p-5 rounded-2xl border transition-all shadow-sm ${
                        isMaterial ? "bg-amber-500/10 border-amber-300 ring-1 ring-amber-400/20" :
                        isServicos ? "bg-blue-500/10 border-blue-300 ring-1 ring-blue-400/20" :
                        isAjudas ? "bg-emerald-500/10 border-emerald-300 ring-1 ring-emerald-400/20" :
                        "bg-white border-slate-200"
                      }`}
                    >
                      <div className="text-[11px] font-black  tracking-wider text-slate-700 truncate mb-1">
                        {isMaterial ? "📦 " : isServicos ? "⚙️ " : isAjudas ? "✈️ " : "🏷️ "}
                        {rub.parentName}
                      </div>
                      <div className="text-lg font-black font-mono text-slate-900">
                        {rub.totalValor.toLocaleString("pt-MZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] font-sans font-normal text-slate-500">MZN</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 mt-3 pt-3 border-t border-slate-100 font-medium">
                        <span>{rub.itemsCount} rúbricas e atividades</span>
                        <span className="font-bold text-sky-800">{pct.toFixed(1)}% do total</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tabela de Distribuição por Setores (Apenas para Admin/Planificação) */}
          {(isPlanificacaoOrDPEP || isSuperBossUser(user)) && sectorBudgetsList.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-sm font-black text-slate-900  tracking-wider flex items-center gap-2">
                    🏢 Distribuição Orçamental por Setores e Departamentos
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Visão unificada de todos os orçamentos distribuídos nos devidos setores, sem dados espalhados.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1.5 rounded-full border border-indigo-100">
                  {sectorBudgetsList.length} Setores Planificadores
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 font-black tracking-wider ">
                      <th className="p-3">Direção / Departamento</th>
                      <th className="p-3">Setor Responsável</th>
                      <th className="p-3 text-center">Nº Atividades</th>
                      <th className="p-3 text-right">Orçamento Total</th>
                      <th className="p-3 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {sectorBudgetsList.map((item, idx) => {
                      const totalGlobal = sectorBudgetsList.reduce((acc, curr) => acc + curr.total, 0);
                      const percentage = totalGlobal > 0 ? (item.total / totalGlobal) * 100 : 0;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3">
                            <span className="text-[10px] font-bold text-slate-400 block ">{item.direcao}</span>
                            <span className="text-xs font-black text-slate-800">{item.departamento}</span>
                          </td>
                          <td className="p-3">
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[11px] font-black border border-blue-100">
                              {item.sector}
                            </span>
                          </td>
                          <td className="p-3 text-center font-bold text-slate-600">
                            {item.activitiesCount}
                          </td>
                          <td className="p-3 text-right">
                            <span className="font-mono font-black text-slate-950 block">
                              {item.total.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN
                            </span>
                            <span className="text-[9px] text-indigo-600 font-bold block">
                              {percentage.toFixed(1)}% do total geral
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                // Mudar filtro para visualizar este setor especificamente
                                setSelectedLevel("setor");
                                setSelectedUnit(item.sector);
                                window.scrollTo({ top: 300, behavior: 'smooth' });
                              }}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 rounded-lg text-[10px] font-black transition-all cursor-pointer border border-slate-200"
                            >
                              Filtrar Matriz
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

  {activeTab === "rubricas" && (
        <div className="space-y-6">
          {/* Seção Principal de Resumo Tabela Dinâmica SISTAFE (Matriz Orçamental) */}
          {sectorActivities.length > 0 ? (
            <>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  📊 Matriz Tabela Dinâmica - Ação Orçamental (SISTAFE)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Resumo das rúbricas oficiais e necessidades agrupadas por código, quantitativos e valores acumulados.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowOnlyNonZeroPivot(!showOnlyNonZeroPivot)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    showOnlyNonZeroPivot
                      ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                      : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                  }`}
                >
                  {showOnlyNonZeroPivot ? "✓ Apenas com Valor" : "Mostrar Todas as Rúbricas"}
                </button>
                <button
                  type="button"
                  onClick={expandAllPivotRows}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 cursor-pointer transition-colors"
                >
                  + Expandir Todos
                </button>
                <button
                  type="button"
                  onClick={collapseAllPivotRows}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 cursor-pointer transition-colors"
                >
                  − Recolher Todos
                </button>
              </div>
            </div>

            {/* Tabela Dinâmica com Visualização Excel SISTAFE */}
            <div className="overflow-x-auto overflow-y-auto max-h-[600px] border border-slate-300 rounded-xl shadow-xs">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="bg-blue-900 text-white text-[10px] tracking-wider">
                    <th className="p-4 font-black border-r border-blue-800">
                      N/O
                    </th>
                    <th className="p-4 font-black border-r border-blue-800">
                      NOME DA RUBRICA
                    </th>
                    <th className="p-4 font-black border-r border-blue-800">
                      NOME DA NECESSIDADE
                    </th>
                    <th className="p-4 font-black border-r border-blue-800">
                      NOME DO PRODUTO/SERVICO
                    </th>
                    <th className="p-4 font-black border-r border-blue-800">
                      QUANTIDADE
                    </th>
                    <th className="p-4 font-black border-r border-blue-800">
                      VALOR TOTAL
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {(() => {
                    const filteredRows = sistafePivotData.filter((row) => {
                      if (!showOnlyNonZeroPivot) return true;
                      return row.totalQuant > 0 || row.totalValor > 0;
                    });

                    if (filteredRows.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                            Nenhum dado encontrado para o filtro selecionado.
                          </td>
                        </tr>
                      );
                    }

                    return filteredRows.map((row, idx) => {
                      const isExpanded = !!expandedPivotRows[row.label];
                      const hasGroups = row.necessidadesList.length > 0;

                      return (
                        <React.Fragment key={idx}>
                          {/* Linha da Rúbrica */}
                          <tr className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${row.totalValor > 0 ? "font-bold text-slate-900" : "text-slate-500"}`}>
                            <td className="p-3 border border-slate-200 font-mono text-xs">
                              {String(idx + 1).padStart(2, "0")}
                            </td>
                            <td className="p-3 border border-slate-200 font-bold">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => toggleExpandPivotRow(row.label)}
                                  className="w-4 h-4 rounded border border-slate-400 bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-700 hover:bg-slate-200 cursor-pointer shrink-0"
                                >
                                  {isExpanded ? "−" : "+"}
                                </button>
                                <span>{row.label}</span>
                              </div>
                            </td>
                            <td className="p-3 border border-slate-200 text-slate-500 font-medium text-xs">
                              {row.necessidadesList.length > 0 ? `${row.necessidadesList.length} grupo(s) de necessidade` : "—"}
                            </td>
                            <td className="p-3 border border-slate-200 text-slate-500 font-medium text-xs">
                              —
                            </td>
                            <td className="p-3 text-center border border-slate-200 font-mono font-bold text-blue-900">
                              {row.totalQuant > 0 ? row.totalQuant.toLocaleString("pt-MZ") : "—"}
                            </td>
                            <td className="p-3 text-right border border-slate-200 font-mono font-bold text-blue-950">
                              {row.totalValor > 0
                                ? row.totalValor.toLocaleString("pt-MZ", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }) + " MZN"
                                : "0,00 MZN"}
                            </td>
                          </tr>

                          {/* Grupos de Necessidades & Produtos Expandidos */}
                          {isExpanded && hasGroups &&
                            row.necessidadesList.map((group, gIdx) => (
                              <React.Fragment key={`group-${idx}-${gIdx}`}>
                                {/* Subcabeçalho de Grupo de Necessidade */}
                                <tr className="bg-sky-100/80 text-sky-950 font-bold border-b border-sky-200">
                                  <td className="p-2.5 border border-slate-300 font-mono text-[11px] text-sky-800">
                                    {String(idx + 1).padStart(2, "0")}.{gIdx + 1}
                                  </td>
                                  <td className="p-2.5 border border-slate-300 font-bold" colSpan={2}>
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-0.5 bg-sky-200/90 text-sky-900 rounded text-[10px] font-black  tracking-wider">
                                        Grupo
                                      </span>
                                      <span className="text-xs font-black">{group.groupName}</span>
                                    </div>
                                  </td>
                                  <td className="p-2.5 border border-slate-300 text-sky-800 text-[11px] italic font-normal">
                                    {group.productsList.length} {group.productsList.length === 1 ? "item/produto" : "itens/produtos"}
                                  </td>
                                  <td className="p-2.5 text-center border border-slate-300 font-mono font-bold text-sky-900 bg-sky-200/40">
                                    {group.totalQuant > 0 ? group.totalQuant.toLocaleString("pt-MZ") : "—"}
                                  </td>
                                  <td className="p-2.5 text-right border border-slate-300 font-mono font-black text-sky-950 bg-sky-200/50">
                                    {group.totalValor.toLocaleString("pt-MZ", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }) + " MZN"}
                                  </td>
                                </tr>

                                {/* Produtos/Itens do Grupo */}
                                {group.productsList.map((prod, pIdx) => (
                                  <tr key={`prod-${idx}-${gIdx}-${pIdx}`} className="border-b border-slate-100 bg-white hover:bg-slate-50 text-slate-700">
                                    <td className="p-2 pl-4 border border-slate-200 font-mono text-[10px] text-slate-400">
                                      {String(idx + 1).padStart(2, "0")}.{gIdx + 1}.{pIdx + 1}
                                    </td>
                                    <td className="p-2 pl-6 border border-slate-200 font-normal text-slate-500 text-xs">
                                      ↳ {row.label}
                                    </td>
                                    <td className="p-2 pl-6 border border-slate-200 font-medium text-slate-700 text-xs">
                                      📁 {group.groupName}
                                    </td>
                                    <td className="p-2 border border-slate-200 font-semibold text-slate-900 text-xs">
                                      {prod.productName}
                                      {prod.especificacao && <div className="text-[10px] text-slate-500 italic font-normal">{prod.especificacao}</div>}
                                    </td>
                                    <td className="p-2 text-center border border-slate-200 font-mono font-bold text-blue-900 bg-blue-50/20">
                                      {prod.quant > 0 ? prod.quant.toLocaleString("pt-MZ") : "—"}
                                    </td>
                                    <td className="p-2 text-right border border-slate-200 font-mono font-medium text-slate-800">
                                      {prod.valor.toLocaleString("pt-MZ", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }) + " MZN"}
                                    </td>
                                  </tr>
                                ))}
                              </React.Fragment>
                            ))}
                        </React.Fragment>
                      );
                    });
                  })()}

                  {/* Linha de Total Geral */}
                  <tr className="bg-slate-200 text-slate-900 border-t-2 border-b-2 border-slate-800 font-black">
                    <td className="p-3 border border-slate-400 text-left font-black ">
                      Total Geral
                    </td>
                    <td className="p-3 border border-slate-400"></td>
                    <td className="p-3 border border-slate-400"></td>
                    <td className="p-3 border border-slate-400"></td>
                    <td className="p-3 text-center border border-slate-400 font-mono font-black text-blue-950">
                      {sistafeGrandTotals.quant.toLocaleString("pt-MZ")}
                    </td>
                    <td className="p-3 text-right border border-slate-400 font-mono font-black text-sky-900">
                      {sistafeGrandTotals.valor.toLocaleString("pt-MZ", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      MZN
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>


          </>
          ) : (
            <div className="bg-white p-16 rounded-3xl border-2 border-dashed border-slate-200 text-center">
              <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <LayoutGrid className="text-slate-300" size={40} />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Sem Dados de Rúbricas</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto mt-2 leading-relaxed">
                As rúbricas e despesas só são geradas após a inserção de atividades e rúbricas na matriz orçamental.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Reforço de Crédito Tab */}
      {activeTab === "reforco" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm lg:col-span-1">
            <h3 className="text-sm font-black text-slate-900  tracking-widest mb-4 flex items-center gap-2">
              <Plus size={16} className="text-blue-600" /> Nova Solicitação
            </h3>

            <form onSubmit={handleSubmitReforco} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400  tracking-wider mb-1">
                  Rúbrica de Despesa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Bens e Serviços / Combustível"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                  value={reforcoForm.rubrica}
                  onChange={(e) =>
                    setReforcoForm({ ...reforcoForm, rubrica: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400  tracking-wider mb-1">
                    Valor (MZN) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Ex: 50000"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono font-bold"
                    value={reforcoForm.valor}
                    onChange={(e) =>
                      setReforcoForm({ ...reforcoForm, valor: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400  tracking-wider mb-1">
                    Fonte de Custeio
                  </label>
                  <select
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-bold"
                    value={reforcoForm.fonte}
                    onChange={(e) =>
                      setReforcoForm({ ...reforcoForm, fonte: e.target.value })
                    }
                  >
                    <option value="OE">OE (Geral)</option>
                    <option value="RP">RP (Próprias)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400  tracking-wider mb-1">
                  Justificativa Técnica *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Justifique detalhadamente a necessidade do reforço de crédito para as actividades do setor..."
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-semibold leading-relaxed"
                  value={reforcoForm.justificativa}
                  onChange={(e) =>
                    setReforcoForm({
                      ...reforcoForm,
                      justificativa: e.target.value,
                    })
                  }
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs  tracking-widest py-3 rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-2"
              >
                <Send size={14} /> Submeter para Avaliação
              </button>
            </form>
          </div>

          {/* Lista de Solicitações */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm lg:col-span-2">
            <h3 className="text-sm font-black text-slate-900  tracking-widest mb-4">
              Histórico de Pedidos de Reforço
            </h3>

            <div className="space-y-4">
              {solicitacoes.map((sol) => (
                <div
                  key={sol.id}
                  className="border border-slate-150 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-300 transition-all"
                >
                  <div className="flex justify-between items-start mb-2 gap-4">
                    <div>
                      <span className="text-[10px] font-black font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {sol.id}
                      </span>
                      <h4 className="font-extrabold text-slate-800 text-xs mt-1.5">
                        {sol.rubrica}
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black font-mono text-blue-600 block">
                        {sol.valor.toLocaleString()} MZN
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                        Fonte: {sol.fonte}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-500 text-[11px] leading-relaxed mb-4">
                    {sol.justificativa}
                  </p>

                  <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-[10px] font-bold text-slate-400">
                    <span>Submetido em: {sol.data}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full  tracking-wider text-[9px] font-black ${
                        sol.status === "Pendente"
                          ? "bg-amber-100 text-amber-700"
                          : sol.status === "Aprovado"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {sol.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Consulta de Plano de Atividade */}
      {showActivitiesModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600/30 text-blue-400 rounded-xl">
                  <FileText size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">Plano de Atividade Existente</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Atividades planificadas e vinculadas à ação orçamental do setor atual</p>
                </div>
              </div>
              <button
                onClick={() => setShowActivitiesModal(false)}
                className="p-2 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50">
              {sectorActivities.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
                  <AlertCircle size={40} className="mx-auto text-amber-500 mb-3" />
                  <h4 className="text-lg font-black text-slate-900">Sem Atividade, Sem Ação Orçamental</h4>
                  <p className="text-sm text-slate-500 mt-1">Este setor não possui atividades planificadas no momento, logo o orçamento associado é zero.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sectorActivities.map((act, idx) => (
                    <div key={act.id || idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-blue-300 transition-all">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="text-[10px] font-black font-mono bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-100">
                            {act.codigo || act.id || `ATV-${idx + 1}`}
                          </span>
                          <h4 className="text-sm font-black text-slate-900 mt-2">{act.nome || act.atividade || act.descricao}</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black font-mono text-emerald-700 block">
                            {Number(act.valor || act.orcamentoTotal || act.valorTotal || act.orcamento || 0).toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                            Fonte: {act.fonteReceita || act.orcamento || "OE"}
                          </span>
                        </div>
                      </div>
                      {act.objetivo || act.detalhes ? (
                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                          {act.objetivo || act.detalhes}
                        </p>
                      ) : null}

                      {/* Área de Partilha Manual */}
                      <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                        <div className="flex justify-between items-center text-[11px]">
                          <div className="flex items-center gap-1.5 text-slate-500 font-bold">
                            <span className={`w-2 h-2 rounded-full ${Array.isArray(act.sharedWith) && act.sharedWith.length > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                            <span>
                              {Array.isArray(act.sharedWith) && act.sharedWith.length > 0
                                ? `Partilhada com ${act.sharedWith.length} departamento(s)`
                                : "Atividade estritamente privada"}
                            </span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => setSharingActivityId(sharingActivityId === act.id ? null : act.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                              sharingActivityId === act.id
                                ? "bg-slate-900 text-white"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                            }`}
                          >
                            <Share2 size={13} />
                            <span>{sharingActivityId === act.id ? "Fechar Partilha" : "Partilhar Manualmente"}</span>
                          </button>
                        </div>

                        {sharingActivityId === act.id && (
                          <div className="mt-2 bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div>
                              <h5 className="text-[11px] font-black text-slate-800">Selecione as áreas que poderão visualizar esta atividade</h5>
                              <p className="text-[10px] text-slate-400 font-medium">Controle total manual de comunicação e partilha orçamental.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {SHARABLE_AREAS.map((area) => {
                                const isShared = Array.isArray(act.sharedWith) && act.sharedWith.some(
                                  (x: string) => x.toLowerCase().trim() === area.toLowerCase().trim()
                                );
                                return (
                                  <button
                                    key={area}
                                    type="button"
                                    onClick={() => handleToggleShare(act, area)}
                                    disabled={isSavingShare === act.id}
                                    className={`flex items-center justify-between p-2 px-3 rounded-lg border text-left text-xs font-bold transition-all cursor-pointer ${
                                      isShared
                                        ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs"
                                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                                    }`}
                                  >
                                    <span className="truncate max-w-[200px]">{area}</span>
                                    {isShared && (
                                      <Check size={14} className="text-emerald-600 shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowActivitiesModal(false)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs  tracking-widest rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

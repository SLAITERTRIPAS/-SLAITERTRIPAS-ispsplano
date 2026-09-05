import { PROVINCIAS_DISTRITOS } from "./locations";
export { PROVINCIAS_DISTRITOS };

export const UNIDADES_ORGANICAS_SISTEMA = [
  {
    id: "odg",
    nome: "Órgão de Direção e Gestão",
    descricao: "Órgão de Direção e Gestão",
    direcoes: [
      "Conselho de Representantes",
      "Gabinete do Diretor-Geral",
      "Conselho Administrativo e de Gestão",
      "Conselho Técnico e de Qualidade",
    ],
  },
  {
    id: "uo",
    nome: "Unidade Orgânica",
    descricao: "Unidade Orgânica",
    direcoes: [
      "Divisão de Engenharia",
      "Centro de Incubação de Empresas",
      "Centros",
    ],
  },
  {
    id: "sc",
    nome: "Serviços Centrais",
    descricao: "Serviços Centrais",
    direcoes: ["DICOSAFA", "DICOSSER"],
  },
];

export const UNIDADES_CENTRAIS =
  UNIDADES_ORGANICAS_SISTEMA.find((u) => u.id === "odg")?.direcoes || [];
export const UNIDADES_ORGANICAS =
  UNIDADES_ORGANICAS_SISTEMA.find((u) => u.id === "uo")?.direcoes || [];
export const UNIDADES_ORGANICAS_SERVICOS =
  UNIDADES_ORGANICAS_SISTEMA.find((u) => u.id === "sc")?.direcoes || [];

export const DEPARTAMENTOS: Record<string, string[]> = {
  "Gabinete do Diretor-Geral": [
    "Diretor-Geral",
    "Chefe do GDG",
    "Secretaria Executiva",
    "Departamento de Planificação Estudos e Projetos",
    "Unidade Gestora e Executora de Aquisições",
    "Departamento de Cooperação e Relações Exteriores",
    "Departamento de Controlo Técnico e de Qualidade",
    "Departamento Jurídico",
  ],
  "Unidade Gestora e Executora de Aquisições (UGEA)": [
    "Unidade Gestora e Executora de Aquisições",
    "UGEA",
    "Chefe da UGEA",
    "Painel da UGEA",
  ],
  "Divisão de Engenharia": [
    "Diretor da Divisão de Engenharia",
    "Diretor Adjunto Pedagógico",
    "Departamento de Pesquisa e Extensão",
    "Departamento de Engenharia Eletrotécnica",
    "Departamento de Engenharia de Construção Civil",
    "Departamento de Engenharia de Construção Mecânica",
    "Departamento de Disciplinas Gerais",
    "Departamento Técnico e de Apoio",
  ],
  "Direção de Coordenação de Serviços de Administração, Finanças e de Apoio (DICOSAFA)": [
    "Diretor da DICOSAFA",
    "Departamento de Recursos Humanos",
    "Departamento de Finanças",
    "Departamento de Património",
    "Secretaria Geral",
    "Departamento TIC",
    "Departamento Lar de Estudantes",
    "Departamento de Produção Alimentar",
  ],
  "Direção de Coordenação de Serviços Académicos, Sociais, Extensão e Relações Públicas (DICOSSER)": [
    "Diretor da DICOSSER",
    "Departamento de Registo Académico",
    "Departamento de Assuntos Estudantis",
    "Departamento de Biblioteca",
  ],
  "Centro de Incubação de Empresas": [
    "Diretor do CIE",
    "Departamento de práticas de geração de negócio e desenvolvimento empresarial (DPGNDE)",
    "Departamento de consultoria, estudos, projetos e angariação de fundos (DCPAF)",
    "Departamento de prospecção de oportunidade de negócio (DPONE)",
  ],
  "Departamento de Biblioteca": [
    "Departamento de Biblioteca",
    "Chefe de DBA",
    "Biblioteca",
    "Repartição de Documentos",
    "Repartição de Arquivo",
  ],
  "Conselho de Representantes": ["Conselho de Representantes"],
  "Conselho Administrativo e de Gestão": [
    "Conselho Administrativo e de Gestão",
  ],
  "Conselho Técnico e de Qualidade": ["Conselho Técnico e de Qualidade"],
  Centros: [],
};

// Aliases por Sigla para acesso direto em todo o sistema
DEPARTAMENTOS["DICOSAFA"] = DEPARTAMENTOS["Direção de Coordenação de Serviços de Administração, Finanças e de Apoio (DICOSAFA)"];
DEPARTAMENTOS["DICOSSER"] = DEPARTAMENTOS["Direção de Coordenação de Serviços Académicos, Sociais, Extensão e Relações Públicas (DICOSSER)"];
DEPARTAMENTOS["CIE"] = DEPARTAMENTOS["Centro de Incubação de Empresas"];
DEPARTAMENTOS["GDG"] = DEPARTAMENTOS["Gabinete do Diretor-Geral"];
DEPARTAMENTOS["UGEA"] = DEPARTAMENTOS["Unidade Gestora e Executora de Aquisições (UGEA)"];

export function getDepartamentosByDirecaoKey(direcaoKey: string): string[] {
  if (!direcaoKey) return [];
  if (DEPARTAMENTOS[direcaoKey]) return DEPARTAMENTOS[direcaoKey];
  const dkLower = direcaoKey.toLowerCase().trim();
  if (dkLower.includes("dicosafa") || dkLower.includes("administração") || dkLower.includes("finanças")) {
    return DEPARTAMENTOS["Direção de Coordenação de Serviços de Administração, Finanças e de Apoio (DICOSAFA)"] || [];
  }
  if (dkLower.includes("dicosser") || dkLower.includes("académicos") || dkLower.includes("sociais")) {
    return DEPARTAMENTOS["Direção de Coordenação de Serviços Académicos, Sociais, Extensão e Relações Públicas (DICOSSER)"] || [];
  }
  if (dkLower.includes("cie") || dkLower.includes("incubação") || dkLower.includes("centro de incubação")) {
    return DEPARTAMENTOS["Centro de Incubação de Empresas"] || [];
  }
  if (dkLower.includes("engenharia") || dkLower.includes("divisão de engenharia")) {
    return DEPARTAMENTOS["Divisão de Engenharia"] || [];
  }
  if (dkLower.includes("gabinete") || dkLower.includes("diretor-geral") || dkLower.includes("gdg")) {
    return DEPARTAMENTOS["Gabinete do Diretor-Geral"] || [];
  }
  for (const [k, v] of Object.entries(DEPARTAMENTOS)) {
    if (k.toLowerCase().includes(dkLower) || dkLower.includes(k.toLowerCase())) {
      return v;
    }
  }
  return [];
}

export const REPARTICOES: Record<string, string[]> = {
  "Departamento de Recursos Humanos": [
    "Chefe do RH",
    "Repartição de Pessoal",
    "Repartição de Formação",
    "Repartição de Apoio Social",
  ],
  "Departamento de Finanças": [
    "Chefe de Finanças",
    "Repartição de Plano e Orçamento",
    "Repartição de Tesouraria",
    "Setor de Estatística",
  ],
  "Departamento de Património": [
    "Chefe de DP",
    "Repartição de E-Património",
    "Repartição de Infraestrutura e Manutenção",
    "Repartição de Transporte",
  ],
  "Secretaria Geral": ["Chefe da SG", "Secretaria", "SIC"],
  "Departamento TIC": [
    "Chefe de DTIC",
    "Setor de Rede de Computadores",
    "Setor de Manutenção",
    "Reprografia",
    "Oficina de TIC",
  ],
  "Departamento Lar de Estudantes": [
    "Chefe de DLE",
    "Repartição de Alojamento",
    "Repartição de Eventos",
    "Economato",
  ],
  "Departamento de Produção Alimentar": [
    "Chefe de DPA",
    "Repartição de Produção Animal",
    "Repartição de Produção Vegetal",
    "Armazém de Thaka",
  ],
  "Departamento de Registo Académico": [
    "Chefe do DRA",
    "Atendimento Estudantil",
    "Repartição de Certificação",
    "Repartição de Exames de Admissão",
    "Repartição de Matrículas",
  ],
  "Departamento de Assuntos Estudantis": [
    "Chefe do DAE",
    "Repartição de Bolsa de Estudos",
    "Repartição de Desporto e Recreação",
  ],
  "Departamento de Biblioteca e Arquivos": [
    "Chefe de DBA",
    "Biblioteca",
    "Repartição de Documentos",
    "Repartição de Arquivo",
  ],
  "Diretor-Geral": ["Chefe do GDG", "Secretaria Executiva"],
  "Gabinete do Diretor-Geral": [
    "Chefe do GDG",
    "Secretaria Executiva",
    "Setor de Expediente e Despacho",
    "Secretaria de Assinaturas e Atendimento",
  ],
  "Departamento de Unidade Gestora e Executora de Aquisições": [
    "Chefe da UGEA",
  ],
  "Departamento de Planificação Estudos e Projetos": [
    "Chefe do Departamento de Planificação Estudos e Projetos",
    "Setor Planificação",
    "Setor Estatística",
    "Setor de Relatório",
    "Setor de Monitoria",
  ],
  "Departamento de Cooperação e Relações Exteriores": [
    "Chefe do DCRE",
    "Setor de Imagem Institucional",
  ],
  "Departamento de Controlo Técnico e de Qualidade": [
    "Chefe do DCTQ",
    "Setor de Controlo Técnico",
  ],
  "Departamento Jurídico": ["Chefe do DJ", "Setor de Pareceres"],
  "Departamento de Práticas de Geração de Negócio e Desenvolvimento Empresarial (DPGNDE)":
    [],
  "Departamento de Consultoria, Estudos, Projetos e Angariação de Fundos (DCPAF)":
    [],
  "Departamento de Prospecção de Oportunidade de Negócio (DPONE)": [],
  "Diretor do CIE": [],
  "Departamento de Pesquisa e Extensão": [
    "Repartição de Pesquisa",
    "Repartição de Extensão",
  ],
  "Departamento de Engenharia Eletrotécnica": [
    "Chefe do DEE",
    "Diretor do Curso de Engenharia Elétrica",
    "Diretor do Curso de Engenharia Eletrónica e de Telecomunicações",
    "Diretor do Curso de Engenharia de Energias Renováveis",
  ],
  "Departamento de Engenharia de Construção Civil": [
    "Chefe do DECC",
    "Diretor do Curso de Engenharia de Construção Civil",
    "Diretor do Curso de Engenharia Hidráulica",
  ],
  "Departamento de Engenharia de Construção Mecânica": [
    "Chefe do DECM",
    "Diretor do Curso de Engenharia de Construção Mecânica",
    "Diretor do Curso de Engenharia Termotécnica",
  ],
  "Departamento de Engenharia Informática": ["Repartição de Desenvolvimento"],
  "Departamento de Disciplinas Gerais": ["Repartição de Apoio Pedagógico"],
  "Departamento Técnico e de Apoio": ["Repartição de Laboratórios"],
  "Conselho de Representantes": ["Membros do Conselho de Representantes"],
  "Conselho Administrativo e de Gestão": [
    "Membros do Conselho Administrativo e de Gestão",
  ],
  "Conselho Técnico e de Qualidade": [
    "Membros do Conselho Técnico e de Qualidade",
  ],
};

export const SETORES: Record<string, string[]> = {
  "Repartição de Gestão de Carreiras e Remunerações": [
    "Setor de Processamento de Salários",
    "Setor de Carreiras",
  ],
  "Repartição de Formação e Desenvolvimento": [
    "Setor de Capacitação",
    "Setor de Estágios",
  ],
  "Repartição de Contabilidade": [
    "Setor de Controlo de Gastos",
    "Setor de Reconciliação",
  ],
  "Repartição de Tesouraria": ["Setor de Pagamentos", "Setor de Cobranças"],
  "Repartição de Inventário": [
    "Setor de Tombagem",
    "Setor de Auditoria de Bens",
  ],
  "Repartição de Admissão e Matrículas": [
    "Setor de Graduação",
    "Setor de Pós-Graduação",
  ],
  "Repartição de Infraestruturas e Redes": [
    "Setor de Hardware",
    "Setor de Redes",
  ],
  "Secretaria Geral": ["Setor de Protocolo", "Setor de Arquivo Geral"],
  "Repartição de Planificação": ["Setor de Relatório", "Setor de Monitoria"],
  "Repartição de Estatística": ["Setor de Estatística Geral"],
  "Chefe do DPEP": ["Único"],
  "Setor de Relatório": ["Relatório Periódico", "Relatório Anual"],
  "Setor de Monitoria": ["Monitoria de Atividades"],
  "Gestão de Fornecedores": ["Registo de Fornecedores"],
  "Plano de Aquisição": ["Plano de Aquisição"],
  "Plano de Contratação": ["Plano de Contratação"],
  "Chefe da UGEA": ["Único"],
  "Painel da UGEA": ["Único"],
  "Chefe da DCRE": ["Único"],
  "Setor de imagem institucional": ["Imagem e Comunicação"],
  "Chefe da DCTQ": ["Único"],
  "SETOR 1": ["Sub-setor A"],
  "SETOR 2": ["Sub-setor B"],
  "Chefe da DJ": ["Único"],
  "Chefe do DEE": ["Único"],
  "Diretor do Curso de Engenharia Elétrica": ["Único"],
  "Diretor do Curso de Engenharia Eletrónica e de Telecomunicações": ["Único"],
  "Diretor do Curso de Engenharia de Energias Renováveis": ["Único"],
  "Chefe do DECC": ["Único"],
  "Diretor do Curso de Engenharia de Construção Civil": ["Único"],
  "Diretor do Curso de Engenharia Hidráulica": ["Único"],
  "Chefe do DECM": ["Único"],
  "Diretor do Curso de Engenharia de Construção Mecânica": ["Único"],
  "Diretor do Curso de Engenharia Termotécnica": ["Único"],
  "Membros do Conselho de Representantes": ["Único"],
  "Membros do Conselho Administrativo e de Gestão": ["Único"],
  "Membros do Conselho Técnico e de Qualidade": ["Único"],
  "Diretor do CIE": ["Único"],
  "Diretor da DICOSAFA": ["Único"],
  "Chefe do RH": ["Único"],
  "Repartição de Pessoal": ["Único"],
  "Repartição de Formação": ["Único"],
  "Repartição de Apoio Social": ["Único"],
  "Chefe de Finanças": ["Único"],
  "Repartição de Plano e Orçamento": ["Único"],
  "Setor de Estatística": ["Único"],
  "Chefe de DP": ["Único"],
  "Repartição de E-Património": ["Único"],
  "Repartição de Infraestrutura e Manutenção": ["Único"],
  "Repartição de Transporte": ["Único"],
  "Chefe da SG": ["Único"],
  Secretaria: ["Único"],
  SIC: ["Único"],
  "Chefe de DTIC": ["Único"],
  "Setor de Rede de Computadores": ["Único"],
  "Setor de Manutenção": ["Único"],
  Reprografia: ["Único"],
  "Oficina de TIC": ["Único"],
  "Chefe de DLE": ["Único"],
  "Repartição de Alojamento": ["Único"],
  "Repartição de Eventos": ["Único"],
  Economato: ["Único"],
  "Chefe de DPA": ["Único"],
  "Repartição de Produção Animal": ["Único"],
  "Repartição de Produção Vegetal": ["Único"],
  "Armazém de Thaka": ["Único"],
  "Chefe do DRA": ["Único"],
  "Atendimento Estudantil": ["Único"],
  "Repartição de Certificação": ["Único"],
  "Repartição de Exames de Admissão": ["Único"],
  "Repartição de Matrículas": ["Único"],
  "Chefe do DAE": ["Único"],
  "Repartição de Bolsa de Estudos": ["Único"],
  "Repartição de Desporto e Recreação": ["Único"],
  "Chefe de DBA": ["Único"],
  Biblioteca: ["Único"],
  "Repartição de Documentos": ["Único"],
  "Repartição de Arquivo": ["Único"],
};

/**
 * Obtém todos os setores e repartições alocados a um determinado departamento.
 */
export function getSetoresByDepartamento(dept?: string | null): string[] {
  if (!dept) return [];
  const cleanDept = dept.trim();
  const lowerDept = cleanDept.toLowerCase();
  const results: string[] = [];

  // 1. Procurar correspondência exata ou aproximada em REPARTICOES
  Object.entries(REPARTICOES).forEach(([key, items]) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey === lowerDept || lowerKey.includes(lowerDept) || lowerDept.includes(lowerKey)) {
      items.forEach((item) => {
        results.push(item);
        if (SETORES[item]) {
          results.push(...SETORES[item]);
        }
      });
    }
  });

  // 2. Procurar em DEPARTAMENTOS
  Object.entries(DEPARTAMENTOS).forEach(([_, deptList]) => {
    if (deptList.some((d) => d.toLowerCase() === lowerDept || lowerDept.includes(d.toLowerCase()))) {
      const match = deptList.find((d) => d.toLowerCase() === lowerDept || lowerDept.includes(d.toLowerCase()));
      if (match && REPARTICOES[match]) {
        results.push(...REPARTICOES[match]);
        REPARTICOES[match].forEach((r) => {
          if (SETORES[r]) results.push(...SETORES[r]);
        });
      }
    }
  });

  // 3. Procurar em SETORES
  Object.entries(SETORES).forEach(([secKey, secItems]) => {
    const lowerSecKey = secKey.toLowerCase();
    if (lowerSecKey.includes(lowerDept) || lowerDept.includes(lowerSecKey)) {
      results.push(...secItems);
    }
  });

  // 4. Filtrar termos que não são setores de trabalho (como "Único", "Chefe de...", "Membros...")
  const filtered = results.filter((s) => {
    if (!s || typeof s !== "string") return false;
    const l = s.trim().toLowerCase();
    if (l === "único" || l === "unico") return false;
    if (l.startsWith("chefe do ") || l.startsWith("chefe de ") || l.startsWith("chefe da ") || l.startsWith("diretor ")) return false;
    if (l.startsWith("membros do ")) return false;
    return true;
  });

  return Array.from(new Set(filtered));
}

export const CURSOS: Record<string, string[]> = {
  "Departamento de Pesquisa e Extensão": [
    "Pesquisa Científica",
    "Extensão Universitária",
  ],
  "Departamento de Engenharia Eletrotécnica": [
    "Engenharia Elétrica",
    "Engenharia Eletrónica e de Telecomunicações",
    "Engenharia de Energias Renováveis",
  ],
  "Departamento de Engenharia de Construção Civil": [
    "Engenharia de Construção Civil",
    "Engenharia Hidráulica",
  ],
  "Departamento de Engenharia de Construção Mecânica": [
    "Engenharia de Construção Mecânica",
    "Engenharia Termotécnica",
  ],
  "Departamento de Disciplinas Gerais": ["Matemática", "Física", "Química"],
  "Departamento Técnico e de Apoio": ["Laboratórios", "Oficinas"],
  "Departamento de Recursos Humanos": ["Gestão de RH"],
  "Departamento de Finanças": ["Contabilidade", "Gestão Financeira"],
  "Departamento de Património": ["Gestão de Património"],
  "Departamento TIC": ["Informática", "Redes"],
  "Departamento Lar de Estudantes": ["Gestão de Alojamento"],
  "Departamento de Produção Alimentar": ["Gestão de Cantinas"],
  "Departamento de Registo Académico": ["Gestão Académica"],
  "Departamento de Assuntos Estudantis": ["Apoio ao Estudante"],
  "Departamento de Biblioteca": ["Gestão de Informação"],
};

export const DISTANCIAS_SONGO: Record<string, number> = {
  Tete: 150,
  Manica: 400,
  Sofala: 600,
  Zambézia: 800,
  Niassa: 1200,
  Nampula: 1600,
  "Cabo Delgado": 1800,
  Inhambane: 1100,
  Gaza: 1400,
  "Maputo Província": 1600,
  "Maputo Cidade": 1600,
};

export const PROVINCIAS = PROVINCIAS_DISTRITOS;

export const VINCULOS_CONTRATUAIS: string[] = [
  "Pertence ao quadro",
  "Não pertence ao quadro",
];

export const FUNCOES_CTA: string[] = [
  "Secretaria / Registo Académico",
  "Recursos Humanos",
  "Administração e Finanças",
  "Biblioteca",
  "Informática",
  "Laboratórios e Áreas Técnicas",
  "Motorista",
  "Guarda / Agente de Segurança",
  "Jardineiro",
  "Agente de Serviço",
  "Auxiliar de Manutenção",
  "Auxiliar Administrativo",
  "Assistente Técnico",
  "Técnico Profissional",
  "Técnico Superior",
  "Técnico",
];

export const FUNCOES_DOCENTES: string[] = [
  "Docente",
  "Docente Universitário",
  "Professor Catedrático",
  "Professor Associado",
  "Professor Auxiliar",
  "Assistente Universitário",
  "Assistente",
  "Investigador",
];

export const LISTA_FUNCOES: string[] = [
  "Secretaria / Registo Académico",
  "Recursos Humanos",
  "Administração e Finanças",
  "Biblioteca",
  "Informática",
  "Laboratórios e Áreas Técnicas",
  "Motorista",
  "Guarda / Agente de Segurança",
  "Jardineiro",
  "Agente de Serviço",
  "Auxiliar de Manutenção",
  "Docente",
  "Docente Universitário",
  "Professor Catedrático",
  "Professor Associado",
  "Professor Auxiliar",
  "Assistente Universitário",
  "Assistente",
  "Investigador",
  "Auxiliar Administrativo",
  "Assistente Técnico",
  "Técnico Profissional",
  "Técnico Superior",
  "Técnico",
  "Guarda",
  "Mecânico",
  "Eletricista",
  "Pedreiro",
  "Serralheiro",
  "Carpinteiro",
  "Operário Qualificado",
];

export const LISTA_CARGOS_CHEFIA: string[] = [
  "Diretor-Geral",
  "Diretor-Geral Adjunto",
  "Diretor Central",
  "Diretor de Gabinete",
  "Chefe do Gabinete do DG",
  "Diretor da Divisão",
  "Diretor Adjunto Pedagógico",
  "Diretor de Curso",
  "Chefe de Departamento",
  "Chefe de Repartição",
  "Chefe de Secção",
  "Técnico do Setor",
  "Nenhum",
];

export const RUBRICAS = [
  "Demais despesas com o pessoal - 112",
  "Bens - 121",
  "Serviços - 122",
  "Demais transferências a famílias - 1434",
  "Exercícios findos - 12",
];

const DEMAIS_DESPESAS_PESSOAL_LIST = [
  "112101 - Ajuda de custo dentro do país para pessoal civil (DG)",
  "112102 - Ajuda de custo fora do país para pessoal civil (DG)",
  "112101 - Ajuda de custo dentro do país para pessoal civil (TECNICOS)",
  "112102 - Ajuda de custo fora do país para pessoal civil (TECNICOS)",
  "112101 - Ajuda de custo dentro do país para pessoal civil (MOTORISTA)",
  "112101 - Ajuda de custo dentro do país para pessoal civil (IDA E VOLTA)",
  "112103 - Auxílio ao pessoal civil estrangeiro",
  "112104 - renda de casa para pessoal civil",
  "112105 - Representação para pessoal civil",
  "112106 - Subsídio de combustível e manutenção de viaturas",
  "112107 - Suplemento de salários e remunerações para pessoal civil",
  "112108 - Subsídio de funeral para pessoal civil",
  "112109 - Subsídio de telefone celular para pessoal civil",
  "112110 - Remunerações extraordinárias de pessoal civil",
  "112111 - Contratação por tempo determinado de pessoal civil",
  "112199 - Outras despesas com pessoal",
];

const BENS_LIST = [
  "121001 - Combustíveis e lubrificantes",
  "121002 - Material para manutenção e reparação de bens imóveis",
  "121003 - Material para manutenção e reparação de bens móveis",
  "121005 - Material de consumo para escritório",
  "121006 - Material duradouro de escritório",
  "121007 - Fardamentos e calçados",
  "121008 - Sobressalentes para equipamentos máquinas e motores",
  "121009 - Medicamentos e apósitos",
  "121010 - Géneros alimentícios",
  "121011 - Material de limpeza e higiene",
  "121014 - Ferramentas de uso duradouro",
  "121015 - Material de consumo para ensino e formação",
  "121016 - Material duradouro para ensino e formação",
  "121017 - Material de consumo para desporto",
  "121018 - Material duradouro para desporto",
  "121020 - Material de representação",
  "121021 - Material de festividades, homenagens e premiação",
  "121022 - Material de consumo para informática",
  "121023 - Material duradouro para informática",
  "121024 - Software de base",
  "121026 - Material de consumo para copa e cozinha",
  "121027 - Material duradouro para copa e cozinha",
  "121028 - Sementes, plantas e insumos",
  "121029 - Material para conservação de estradas e vias",
  "121030 - Bandeiras e flâmulas",
  "121031 - Material para conservação de rede de electrificação",
  "121032 - Material de aplicação restritiva",
  "121033 - Material para aplicação em projetos sociais e assistência social",
  "121034 - Material para conservação de rede de água e esgoto",
  "121098 - Outros bens de consumo",
  "121099 - Outros bens duradouros",
];

const SERVICOS_LIST = [
  "122001 - Comunicações em geral",
  "122002 - Passagens dentro do país",
  "122003 - Passagens fora do país",
  "122004 - Renda de instalações",
  "122005 - Manutenção e reparação de bens imóveis",
  "122006 - Manutenção e reparação de bens móveis",
  "122007 - Manutenção e reparação de veículos",
  "122008 - transporte e carga",
  "122009 - Seguros",
  "122010 - Representação",
  "122011 - Festividades homenagens e premiações",
  "122012 - Água",
  "122013 - Energia eléctrica",
  "122021 - Limpeza e conservação",
  "122022 - Serviços de segurança",
  "122023 - Transporte de funcionários",
  "122024 - Serviços gráficos",
  "122025 - Serviços para atender a projetos sociais e assistência social",
  "122026 - Manutenção e reparação de estradas e pontes",
  "122027 - Manutenção e reparação de rede de electrificação",
  "122028 - Manutenção e reparação de rede de água e esgoto",
  "122099 - Outros serviços",
];

const TRANSFERENCIAS_LIST = [
  "143401 - Bolsa de estudos no país",
  "143402 - Bolsa de estudos no exterior",
  "143405 - Subsídio de reintegração",
  "143406 - Subsídio de funeral",
  "143107 - Transferências a comunidade local",
  "143499 - Outras transferências a famílias",
];

const EXERCICIOS_FINDOS_LIST = [
  "161000 - Retractivos salariais",
  "161001 - Retractivos salariais de exercícios anteriores para pessoal civil",
  "161002 - Remunerações extraordinárias de exercícios anteriores para pessoal civil",
  "162003 - Pagamento de exercícios anteriores relativos a serviços",
];

export const NECESSIDADES: Record<string, string[]> = {
  "Demais despesas com o pessoal - 112": DEMAIS_DESPESAS_PESSOAL_LIST,
  "Bens - 121": BENS_LIST,
  "Serviços - 122": SERVICOS_LIST,
  "Demais transferências a famílias - 1434": TRANSFERENCIAS_LIST,
  "Exercícios findos - 12": EXERCICIOS_FINDOS_LIST,
};

export const getNecessidadesOptions = (rubricaName: string): string[] => {
  if (!rubricaName) return [];
  if (NECESSIDADES[rubricaName]) return NECESSIDADES[rubricaName];

  const lower = rubricaName.toLowerCase();
  if (lower.includes("pessoal") || lower.includes("112"))
    return DEMAIS_DESPESAS_PESSOAL_LIST;
  if (lower.includes("bens") || lower.includes("121")) return BENS_LIST;
  if (lower.includes("serviço") || lower.includes("122")) return SERVICOS_LIST;
  if (
    lower.includes("transferência") ||
    lower.includes("família") ||
    lower.includes("131") ||
    lower.includes("1434")
  )
    return TRANSFERENCIAS_LIST;
  if (
    lower.includes("exercício") ||
    lower.includes("findo") ||
    lower.includes("141") ||
    lower.includes("161") ||
    lower.includes("162")
  )
    return EXERCICIOS_FINDOS_LIST;

  return [];
};

export function formatNecessidadeWithCode(necName: string, rubricaName?: string): string {
  if (!necName) return "";
  const trimmed = necName.trim();
  if (/^\d{5,}/.test(trimmed)) {
    return trimmed;
  }
  const options = getNecessidadesOptions(rubricaName || "");
  const match = options.find((opt) => {
    const optLower = opt.toLowerCase();
    const trimLower = trimmed.toLowerCase();
    return optLower.includes(trimLower) || (opt.includes("-") && opt.split("-")[1].trim().toLowerCase() === trimLower);
  });
  if (match) return match;

  for (const r of RUBRICAS) {
    const opts = getNecessidadesOptions(r);
    const m = opts.find((opt) => {
      const optLower = opt.toLowerCase();
      const trimLower = trimmed.toLowerCase();
      return optLower.includes(trimLower) || (opt.includes("-") && opt.split("-")[1].trim().toLowerCase() === trimLower);
    });
    if (m) return m;
  }
  return trimmed;
}

export interface ProdutoMercado {
  nome: string;
  preco: number;
  unidade: string;
  especificacao: string;
}

export const PRODUTOS_POR_NECESSIDADE: Record<string, ProdutoMercado[]> = {
  "Combustíveis e lubrificantes": [
    {
      nome: "Gasóleo / Diesel",
      preco: 89.5,
      unidade: "Litro",
      especificacao: "Combustível",
    },
    {
      nome: "Gasolina",
      preco: 86.3,
      unidade: "Litro",
      especificacao: "Combustível",
    },
    {
      nome: "Óleo de motor 15W-40",
      preco: 450.0,
      unidade: "Litro",
      especificacao: "Lubrificante",
    },
    {
      nome: "Óleo de motor 10W-30",
      preco: 450.0,
      unidade: "Litro",
      especificacao: "Lubrificante",
    },
    {
      nome: "Óleo de caixa / transmissão",
      preco: 450.0,
      unidade: "Litro",
      especificacao: "Lubrificante",
    },
    {
      nome: "Óleo hidráulico",
      preco: 450.0,
      unidade: "Litro",
      especificacao: "Lubrificante",
    },
    {
      nome: "Óleo de travões",
      preco: 450.0,
      unidade: "Litro",
      especificacao: "Lubrificante",
    },
    {
      nome: "Graxa lubrificante",
      preco: 350.0,
      unidade: "Kg",
      especificacao: "Lubrificante",
    },
    {
      nome: "Fluido de arrefecimento",
      preco: 200.0,
      unidade: "Litro",
      especificacao: "Lubrificante",
    },
    {
      nome: "Aditivo para gasóleo",
      preco: 89.5,
      unidade: "Litro",
      especificacao: "Aditivo",
    },
    {
      nome: "Água destilada",
      preco: 200.0,
      unidade: "Litro",
      especificacao: "Auxiliar",
    },
    {
      nome: "Líquido de limpa-vidros",
      preco: 200.0,
      unidade: "Litro",
      especificacao: "Auxiliar",
    },
  ],
  "Acessório de viaturas": [
    { nome: "Pneu", preco: 6500.0, unidade: "Unidade", especificacao: "Acessório" },
    {
      nome: "Câmara de ar",
      preco: 1500.0,
      unidade: "Unidade",
      especificacao: "Acessório",
    },
    {
      nome: "Bateria",
      preco: 8500.0,
      unidade: "Unidade",
      especificacao: "Acessório",
    },
    {
      nome: "Correia de distribuição",
      preco: 1500.0,
      unidade: "Unidade",
      especificacao: "Peça mecânica",
    },
    {
      nome: "Pastilhas de travão",
      preco: 2500.0,
      unidade: "Unidade",
      especificacao: "Peça mecânica",
    },
    {
      nome: "Discos de travão",
      preco: 1500.0,
      unidade: "Unidade",
      especificacao: "Peça mecânica",
    },
    {
      nome: "Filtro de ar",
      preco: 850.0,
      unidade: "Unidade",
      especificacao: "Filtro",
    },
    {
      nome: "Filtro de combustível",
      preco: 850.0,
      unidade: "Unidade",
      especificacao: "Filtro",
    },
    {
      nome: "Filtro de habitáculo / AC",
      preco: 850.0,
      unidade: "Unidade",
      especificacao: "Filtro",
    },
    {
      nome: "Vela de ignição",
      preco: 1500.0,
      unidade: "Unidade",
      especificacao: "Peça mecânica",
    },
    {
      nome: "Lâmpada (farol / stop)",
      preco: 1500.0,
      unidade: "Unidade",
      especificacao: "Elétrico",
    },
    {
      nome: "Limpa-vidros (palheta)",
      preco: 1500.0,
      unidade: "Unidade",
      especificacao: "Acessório",
    },
    {
      nome: "Extintor de incêndio",
      preco: 1500.0,
      unidade: "Unidade",
      especificacao: "Segurança",
    },
    {
      nome: "Triângulo de sinalização",
      preco: 1500.0,
      unidade: "Unidade",
      especificacao: "Segurança",
    },
    {
      nome: "Colete refletor",
      preco: 1500.0,
      unidade: "Unidade",
      especificacao: "Segurança",
    },
    {
      nome: "Macaco",
      preco: 1500.0,
      unidade: "Unidade",
      especificacao: "Ferramenta",
    },
    {
      nome: "Chave de rodas",
      preco: 1500.0,
      unidade: "Unidade",
      especificacao: "Ferramenta",
    },
    {
      nome: "Calha de estepe",
      preco: 1500.0,
      unidade: "Unidade",
      especificacao: "Acessório",
    },
    {
      nome: "Para-choques",
      preco: 1500.0,
      unidade: "Unidade",
      especificacao: "Carroçaria",
    },
    {
      nome: "Espelho retrovisor",
      preco: 1500.0,
      unidade: "Unidade",
      especificacao: "Carroçaria",
    },
  ],
  "Material para manutenção e reparação de bens imóveis": [
    {
      nome: "Cimento",
      preco: 550.0,
      unidade: "Saco",
      especificacao: "Cimento Portland 42.5N para construção geral",
    },
    {
      nome: "Areia fina e grossa",
      preco: 1800.0,
      unidade: "m³",
      especificacao: "Areia lavada para obras de construção e acabamento",
    },
    {
      nome: "Brita / Pedra britada",
      preco: 2200.0,
      unidade: "m³",
      especificacao: "Pedra britada diversos tamanhos para concreto",
    },
    {
      nome: "Cal",
      preco: 450.0,
      unidade: "Saco",
      especificacao: "Cal hidratada para pintura e argamassa",
    },
    {
      nome: "Tijolos (cerâmicos, de concreto, blocos)",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Blocos de concreto ou tijolos cerâmicos para alvenaria",
    },
    {
      nome: "Telhas (cerâmicas, de zinco, de fibrocimento)",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Material para cobertura de edifícios",
    },
    {
      nome: "Madeira (ripas, tábuas, caibros, sarrafos)",
      preco: 300.0,
      unidade: "Viga",
      especificacao: "Madeira tratada para estruturas e carpintaria",
    },
    {
      nome: "Ferro (vergalhões, cantoneiras, chapas)",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Material metálico para reforço estrutural",
    },
    {
      nome: "Tela de estuque / Arame farpado",
      preco: 2500.0,
      unidade: "Rolo",
      especificacao: "Material para vedação e proteção",
    },
    {
      nome: "Canos e tubos (PVC, ferro, cobre)",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Material para instalações hidráulicas e gás",
    },
    {
      nome: "Conexões hidráulicas (joelhos, curvas, tês, reduções)",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Acessórios para tubagens",
    },
    {
      nome: "Torneiras e registros",
      preco: 1400.0,
      unidade: "Unidade",
      especificacao: "Equipamento de controlo de fluxo de água",
    },
    {
      nome: "Válvulas",
      preco: 1800.0,
      unidade: "Unidade",
      especificacao: "Válvulas de segurança e controlo industrial/doméstico",
    },
    {
      nome: "Sifões",
      preco: 450.0,
      unidade: "Unidade",
      especificacao: "Sifão para lavatórios e pias",
    },
    {
      nome: "Tanques de água",
      preco: 14500.0,
      unidade: "Unidade",
      especificacao: "Reservatório de água (PVC/Fibra) diversas capacidades",
    },
    {
      nome: "Lavatórios",
      preco: 3800.0,
      unidade: "Unidade",
      especificacao: "Louça sanitária para lavagem de mãos",
    },
    {
      nome: "Pias",
      preco: 5200.0,
      unidade: "Unidade",
      especificacao: "Pia de cozinha em inox ou cerâmica",
    },
    {
      nome: "Vasos sanitários",
      preco: 7500.0,
      unidade: "Unidade",
      especificacao: "Vaso sanitário completo com acessórios",
    },
    {
      nome: "Tampa para vaso",
      preco: 950.0,
      unidade: "Unidade",
      especificacao: "Assento e tampa para vaso sanitário",
    },
    {
      nome: "Bacias",
      preco: 650.0,
      unidade: "Unidade",
      especificacao: "Bacias plásticas ou cerâmicas diversas",
    },
    {
      nome: "Portas e portais",
      preco: 8500.0,
      unidade: "Unidade",
      especificacao: "Portas de madeira ou metal com respetivos batentes",
    },
    {
      nome: "Janelas e esquadrias",
      preco: 12000.0,
      unidade: "Unidade",
      especificacao: "Janelas completas em alumínio ou madeira",
    },
    {
      nome: "Fechaduras e dobradiças",
      preco: 1500.0,
      unidade: "Unidade",
      especificacao: "Ferragens para portas e janelas",
    },
    {
      nome: "Ladrilhos e cerâmicas",
      preco: 650.0,
      unidade: "m²",
      especificacao: "Piso cerâmico ou azulejo para revestimento",
    },
    {
      nome: "Tacos de madeira",
      preco: 1800.0,
      unidade: "m²",
      especificacao: "Piso de madeira para interiores",
    },
    {
      nome: "Papel de parede",
      preco: 1200.0,
      unidade: "Rolo",
      especificacao: "Material decorativo para paredes",
    },
    {
      nome: "Massa corrida",
      preco: 950.0,
      unidade: "Lata",
      especificacao: "Massa para nivelamento de superfícies",
    },
    {
      nome: "Tinta (látex, óleo, esmalte, spray)",
      preco: 300.0,
      unidade: "Balde",
      especificacao: "Tintas diversas para acabamento de superfícies",
    },
    {
      nome: "Verniz",
      preco: 1600.0,
      unidade: "Lata",
      especificacao: "Proteção e acabamento para madeiras",
    },
    {
      nome: "Lixas",
      preco: 75.0,
      unidade: "Unidade",
      especificacao: "Lixa de papel ou pano para desbaste",
    },
    {
      nome: "Brochas e trinchas",
      preco: 250.0,
      unidade: "Unidade",
      especificacao: "Pincéis para aplicação de tinta e verniz",
    },
    {
      nome: "Rolos de pintura",
      preco: 450.0,
      unidade: "Unidade",
      especificacao: "Rolo para pintura de grandes superfícies",
    },
    {
      nome: "Solventes e diluentes",
      preco: 650.0,
      unidade: "Litro",
      especificacao: "Produto para diluição de tintas e limpeza",
    },
    {
      nome: "Impermeabilizantes",
      preco: 3500.0,
      unidade: "Balde",
      especificacao: "Material para proteção contra infiltrações",
    },
    {
      nome: "Isolantes acústicos e térmicos",
      preco: 2400.0,
      unidade: "Rolo",
      especificacao: "Lã de vidro ou materiais isolantes",
    },
    {
      nome: "Gaxetas",
      preco: 150.0,
      unidade: "Unidade",
      especificacao: "Vedantes para torneiras e ligações",
    },
    {
      nome: "Parafusos, pregos, buchas",
      preco: 450.0,
      unidade: "Caixa",
      especificacao: "Material de fixação diverso",
    },
    {
      nome: "Vidro (planos, temperados)",
      preco: 300.0,
      unidade: "m²",
      especificacao: "Vidro para janelas e divisórias",
    },
    {
      nome: "Marcos de concreto",
      preco: 3500.0,
      unidade: "Unidade",
      especificacao: "Marcos de demarcação ou estruturais",
    },
    {
      nome: "Postes de iluminação",
      preco: 12500.0,
      unidade: "Unidade",
      especificacao: "Poste metálico ou de betão para iluminação exterior",
    },
    {
      nome: "Cabos metálicos",
      preco: 3200.0,
      unidade: "Rolo",
      especificacao: "Cabos de aço para sustentação ou tração",
    },
  ],
  "Material para manutenção e reparação de bens móveis": [
    {
      nome: "Peças de reposição para máquinas de escrever",
      preco: 300.0,
      unidade: "Unidade",
      especificacao:
        "Componentes mecânicos para manutenção de máquinas de escrever",
    },
    {
      nome: "Cilindros para máquinas copiadoras",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Cilindro fotorreceptor para fotocopiadoras",
    },
    {
      nome: "Esferas para máquinas datilográficas",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Esfera de tipos para máquina de escrever elétrica",
    },
    {
      nome: "Compressor para ar condicionado",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Compressor de reposição para unidades de AC",
    },
    {
      nome: "Mangueiras para fogão",
      preco: 300.0,
      unidade: "Unidade",
      especificacao:
        "Mangueira de gás reforçada para fogões industriais/domésticos",
    },
    {
      nome: "Cabos elétricos de reposição",
      preco: 300.0,
      unidade: "Metro",
      especificacao: "Cabo de alimentação ou fiação interna de reposição",
    },
    {
      nome: "Chaves de reposição",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Duplicação ou reposição de chaves de mobiliário/portas",
    },
    {
      nome: "Peças de reposição para aparelhos eletrodomésticos",
      preco: 300.0,
      unidade: "Conjunto",
      especificacao:
        "Peças diversas para manutenção de equipamentos domésticos",
    },
    {
      nome: "Peças de reposição para instrumentos musicais",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Cordas, palhetas ou componentes de instrumentos",
    },
    {
      nome: "Peças de reposição para equipamentos de escritório",
      preco: 300.0,
      unidade: "Unidade",
      especificacao:
        "Componentes diversos para manutenção de mobiliário e máquinas de escritório",
    },
    {
      nome: "Rodízios e rodas de reposição",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Rodas para cadeiras de escritório ou carrinhos",
    },
    {
      nome: "Dobradiças e trincos de reposição",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Ferragens para armários e gavetas",
    },
    {
      nome: "Fechaduras de reposição",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Mecanismo de fecho para móveis de escritório",
    },
    {
      nome: "Puxadores e maçanetas",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Acessórios de abertura para portas e gavetas",
    },
    {
      nome: "Prateleiras de reposição",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Prateleira de madeira ou metal para estantes",
    },
    {
      nome: "Gavetas de reposição",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Gaveta completa para secretárias ou arquivos",
    },
    {
      nome: "Componentes eletrónicos de reposição",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Condensadores, transístores e pequenos componentes",
    },
    {
      nome: "Placas de circuito de reposição",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Placa lógica ou de controlo de equipamentos",
    },
    {
      nome: "Resistências de reposição",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Resistência de aquecimento para cafeteiras ou estufas",
    },
    {
      nome: "Motor de reposição para equipamentos",
      preco: 300.0,
      unidade: "Unidade",
      especificacao:
        "Motor elétrico de pequena potência para máquinas diversas",
    },
  ],
  "Material de consumo para escritório": [
    {
      nome: "Agrafador",
      preco: 200.0,
      unidade: "Unidade",
      especificacao: "Agrafador",
    },
    { nome: "Agrafos", preco: 200.0, unidade: "Caixa", especificacao: "Agrafos" },
    {
      nome: "Apagador de giz",
      preco: 200.0,
      unidade: "Unidade",
      especificacao: "Apagador de giz",
    },
    {
      nome: "Apagador para quadro branco",
      preco: 200.0,
      unidade: "Unidade",
      especificacao: "Apagador para quadro branco",
    },
    { nome: "Argola", preco: 200.0, unidade: "Unidade", especificacao: "Argola" },
    {
      nome: "Argolas",
      preco: 200.0,
      unidade: "Conjunto",
      especificacao: "Argolas",
    },
    {
      nome: "Bloco de notas A5",
      preco: 200.0,
      unidade: "Unidade",
      especificacao: "Bloco de notas A5",
    },
    {
      nome: "Bolsas plásticas A4",
      preco: 200.0,
      unidade: "Pacote",
      especificacao: "Bolsas plásticas A4",
    },
    {
      nome: "Borracha",
      preco: 200.0,
      unidade: "Unidade",
      especificacao: "Borracha",
    },
    {
      nome: "Caderno A4",
      preco: 200.0,
      unidade: "Unidade",
      especificacao: "Caderno A4",
    },
    { nome: "Caneta", preco: 25.0, unidade: "Unidade", especificacao: "Caneta" },
    {
      nome: "Caneta especial",
      preco: 25.0,
      unidade: "Unidade",
      especificacao: "Caneta especial",
    },
    {
      nome: "Capa plástica",
      preco: 180.0,
      unidade: "Unidade",
      especificacao: "Capa plástica",
    },
    {
      nome: "Cartolina A4",
      preco: 200.0,
      unidade: "Folha",
      especificacao: "Cartolina A4",
    },
    { nome: "Clips", preco: 200.0, unidade: "Caixa", especificacao: "Clips" },
    { nome: "Cola", preco: 200.0, unidade: "Unidade", especificacao: "Cola" },
    {
      nome: "Corretor",
      preco: 200.0,
      unidade: "Unidade",
      especificacao: "Corretor",
    },
    {
      nome: "Envelope A3",
      preco: 200.0,
      unidade: "Unidade",
      especificacao: "Envelope A3",
    },
    {
      nome: "Envelope A4",
      preco: 200.0,
      unidade: "Unidade",
      especificacao: "Envelope A4",
    },
    {
      nome: "Envelope A5",
      preco: 200.0,
      unidade: "Unidade",
      especificacao: "Envelope A5",
    },
    {
      nome: "Ferragem de pasta de arquivo",
      preco: 180.0,
      unidade: "Unidade",
      especificacao: "Ferragem de pasta de arquivo",
    },
    {
      nome: "Livro de Entrada de Correspondência",
      preco: 200.0,
      unidade: "Unidade",
      especificacao: "Livro de Entrada de Correspondência",
    },
    {
      nome: "Livro de Turma",
      preco: 200.0,
      unidade: "Unidade",
      especificacao: "Livro de Turma",
    },
    {
      nome: "Livro de correspondências",
      preco: 200.0,
      unidade: "Unidade",
      especificacao: "Livro de correspondências",
    },
    {
      nome: "Livro de entrada de correspondência",
      preco: 200.0,
      unidade: "Unidade",
      especificacao: "Livro de entrada de correspondência",
    },
    {
      nome: "Livro de numeração de requisição externa",
      preco: 200.0,
      unidade: "Unidade",
      especificacao: "Livro de numeração de requisição externa",
    },
    {
      nome: "Livro de ponto",
      preco: 200.0,
      unidade: "Unidade",
      especificacao: "Livro de ponto",
    },
    {
      nome: "Livro de protocolo",
      preco: 200.0,
      unidade: "Unidade",
      especificacao: "Livro de protocolo",
    },
    {
      nome: "Livro de protocolo A5",
      preco: 200.0,
      unidade: "Unidade",
      especificacao: "Livro de protocolo A5",
    },
    {
      nome: "Livro de requisição externa",
      preco: 200.0,
      unidade: "Unidade",
      especificacao: "Livro de requisição externa",
    },
    {
      nome: "Livro de saída de correspondência",
      preco: 200.0,
      unidade: "Unidade",
      especificacao: "Livro de saída de correspondência",
    },
    {
      nome: "Livro de turma",
      preco: 200.0,
      unidade: "Unidade",
      especificacao: "Livro de turma",
    },
    { nome: "Lápis", preco: 15.0, unidade: "Unidade", especificacao: "Lápis" },
    {
      nome: "Marcador",
      preco: 200.0,
      unidade: "Unidade",
      especificacao: "Marcador",
    },
    {
      nome: "Papel químico",
      preco: 420.0,
      unidade: "Resma",
      especificacao: "Papel químico",
    },
    {
      nome: "Pasta de Arquivo",
      preco: 180.0,
      unidade: "Unidade",
      especificacao: "Pasta de Arquivo",
    },
    {
      nome: "Pasta de Despacho",
      preco: 180.0,
      unidade: "Unidade",
      especificacao: "Pasta de Despacho",
    },
    {
      nome: "Pasta de arquivo",
      preco: 180.0,
      unidade: "Unidade",
      especificacao: "Pasta de arquivo",
    },
    {
      nome: "Pasta de protocolo",
      preco: 180.0,
      unidade: "Unidade",
      especificacao: "Pasta de protocolo",
    },
    {
      nome: "Pastas plásticas",
      preco: 180.0,
      unidade: "Unidade",
      especificacao: "Pastas plásticas",
    },
    { nome: "Pionésio", preco: 200.0, unidade: "Caixa", especificacao: "Pionésio" },
    { nome: "Post-it", preco: 200.0, unidade: "Bloco", especificacao: "Post-it" },
    { nome: "Povim", preco: 200.0, unidade: "Unidade", especificacao: "Povim" },
    {
      nome: "Processo Individual",
      preco: 200.0,
      unidade: "Unidade",
      especificacao: "Processo Individual",
    },
    {
      nome: "Protocolo",
      preco: 200.0,
      unidade: "Unidade",
      especificacao: "Protocolo",
    },
    { nome: "Resma A3", preco: 200.0, unidade: "Resma", especificacao: "Resma A3" },
    { nome: "Resma A4", preco: 200.0, unidade: "Resma", especificacao: "Resma A4" },
    {
      nome: "Sublinhador",
      preco: 200.0,
      unidade: "Unidade",
      especificacao: "Sublinhador",
    },
    {
      nome: "Tinta de Carimbo",
      preco: 200.0,
      unidade: "Frasco",
      especificacao: "Tinta de Carimbo",
    },
    {
      nome: "Toner 05A",
      preco: 200.0,
      unidade: "Unidade",
      especificacao: "Toner 05A",
    },
    {
      nome: "Trasparente A4",
      preco: 200.0,
      unidade: "Pacote",
      especificacao: "Trasparente A4",
    },
  ],
  "Material duradouro de escritório": [
    {
      nome: "Afiador de mesa",
      preco: 200.0,
      unidade: "Unidade",
      especificacao: "Afiador de mesa",
    },
    {
      nome: "Agrafador",
      preco: 200.0,
      unidade: "Unidade",
      especificacao: "Agrafador",
    },
    {
      nome: "Carimbo da DICOSAFA",
      preco: 200.0,
      unidade: "Unidade",
      especificacao: "Carimbo da DICOSAFA",
    },
    {
      nome: "Carimbo da DICOSSER",
      preco: 200.0,
      unidade: "Unidade",
      especificacao: "Carimbo da DICOSSER",
    },
    {
      nome: "Carimbo da Registo Académico",
      preco: 200.0,
      unidade: "Unidade",
      especificacao: "Carimbo da Registo Académico",
    },
    { nome: "Cassifo", preco: 200.0, unidade: "Unidade", especificacao: "Cassifo" },
    { nome: "Furador", preco: 200.0, unidade: "Unidade", especificacao: "Furador" },
    {
      nome: "Numerador automático",
      preco: 200.0,
      unidade: "Unidade",
      especificacao: "Numerador automático",
    },
    {
      nome: "Porta-canetas",
      preco: 25.0,
      unidade: "Unidade",
      especificacao: "Porta-canetas",
    },
    {
      nome: "Porta-papel",
      preco: 420.0,
      unidade: "Unidade",
      especificacao: "Porta-papel",
    },
    {
      nome: "Saca agrafo",
      preco: 200.0,
      unidade: "Unidade",
      especificacao: "Saca agrafo",
    },
  ],
  "Fardamentos e calçados": [
    {
      nome: "Uniformes militares",
      preco: 300.0,
      unidade: "Conjunto",
      especificacao: "Fardamento completo para forças de defesa e segurança",
    },
    {
      nome: "Uniformes de uso civil (administrativo)",
      preco: 300.0,
      unidade: "Conjunto",
      especificacao: "Uniforme formal para pessoal administrativo",
    },
    {
      nome: "Uniformes de uso civil (operacional)",
      preco: 300.0,
      unidade: "Conjunto",
      especificacao: "Fardamento resistente para pessoal de campo e manutenção",
    },
    {
      nome: "Fardamentos completos",
      preco: 300.0,
      unidade: "Conjunto",
      especificacao: "Kit completo de fardamento com acessórios básicos",
    },
    {
      nome: "Agasalhos",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Casacos, blusões ou jaquetas para proteção contra o frio",
    },
    {
      nome: "Blusas",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Blusas diversas para uniforme feminino ou masculino",
    },
    {
      nome: "Camisas (manga curta, manga comprida)",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Camisas de fardamento em diversos cortes e tamanhos",
    },
    {
      nome: "Calças",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Calças de fardamento em tecido resistente",
    },
    {
      nome: "Macacões",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Macacão de trabalho (fato-macaco) para operacionais",
    },
    {
      nome: "Aventais",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Avental de proteção para cozinha ou laboratório",
    },
    {
      nome: "Capas de chuva",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Capa impermeável de longa duração",
    },
    {
      nome: "Guarda-pó",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Bata de proteção para serviços gerais ou saúde",
    },
    {
      nome: "Chapéus / Bonés",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Cobertura de cabeça para identificação e proteção",
    },
    {
      nome: "Cintos",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Cinto tático ou clássico para fardamento",
    },
    {
      nome: "Gravatas",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Gravata formal para uniforme administrativo",
    },
    {
      nome: "Meias",
      preco: 300.0,
      unidade: "Par",
      especificacao: "Meias de algodão ou táticas",
    },
    {
      nome: "Calçados profissionais (botas, sapatos, sandálias)",
      preco: 300.0,
      unidade: "Par",
      especificacao: "Calçado específico para ambiente de trabalho",
    },
    {
      nome: "Tênis de trabalho",
      preco: 300.0,
      unidade: "Par",
      especificacao: "Calçado desportivo reforçado para atividades laborais",
    },
    {
      nome: "Botas de segurança",
      preco: 300.0,
      unidade: "Par",
      especificacao: "Botas com biqueira e palmilha de aço (EPI)",
    },
    {
      nome: "Sapatos de couro",
      preco: 300.0,
      unidade: "Par",
      especificacao: "Sapato formal de couro para uso administrativo",
    },
    {
      nome: "Sandálias profissionais",
      preco: 300.0,
      unidade: "Par",
      especificacao: "Sandálias ergonómicas para uso profissional",
    },
    {
      nome: "Tecidos em geral (algodão, poliéster, brim)",
      preco: 300.0,
      unidade: "Metro",
      especificacao: "Rolo de tecido para confecção de fardamento",
    },
    {
      nome: "Artigos de costura",
      preco: 300.0,
      unidade: "Conjunto",
      especificacao: "Agulhas, tesouras e outros acessórios de alfaiataria",
    },
    {
      nome: "Botões",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Botões diversos para fardamento",
    },
    {
      nome: "Cadarços",
      preco: 300.0,
      unidade: "Par",
      especificacao: "Atacadores para botas e sapatos",
    },
    {
      nome: "Elásticos",
      preco: 300.0,
      unidade: "Metro",
      especificacao: "Elásticos para ajustes de vestuário",
    },
    {
      nome: "Linhas de costura",
      preco: 300.0,
      unidade: "Rolo",
      especificacao: "Linha de alta resistência para costura industrial",
    },
    {
      nome: "Zíperes",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Fechos de correr metálicos ou sintéticos",
    },
    {
      nome: "Aviamentos em geral",
      preco: 300.0,
      unidade: "Lote",
      especificacao: "Acessórios diversos para finalização de costura",
    },
  ],
  "Sobressalentes para equipamentos máquinas e motores": [
    {
      nome: "Materiais diversos para máquinas e motores",
      preco: 300.0,
      unidade: "Conjunto",
      especificacao:
        "Filtros, correias, óleos e peças de reposição para motores e geradores",
    },
  ],
  "Medicamentos e apósitos": [
    {
      nome: "Medicamentos diversos",
      preco: 200.0,
      unidade: "Lote",
      especificacao: "Kit de primeiros socorros e fármacos essenciais",
    },
    {
      nome: "Inseticidas",
      preco: 200.0,
      unidade: "Unidade",
      especificacao: "Spray insecticida de largo espectro 500ml",
    },
  ],
  "Géneros alimentícios": [
    {
      nome: "Arroz",
      preco: 450.0,
      unidade: "Saco 25kg",
      especificacao: "Arroz branco de grão longo",
    },
    {
      nome: "Feijão",
      preco: 550.0,
      unidade: "Kg",
      especificacao: "Feijão catarino ou manteiga",
    },
    {
      nome: "Milho / Fuba",
      preco: 250.0,
      unidade: "Saco 10kg",
      especificacao: "Farinha de milho branca fina",
    },
    {
      nome: "Trigo / Farinha de trigo",
      preco: 380.0,
      unidade: "Kg",
      especificacao: "Farinha de trigo tipo 1 para panificação",
    },
    {
      nome: "Massas (macarrão)",
      preco: 250.0,
      unidade: "Pacote 500g",
      especificacao: "Massa alimentar tipo cotovelo ou parafuso",
    },
    {
      nome: "Massas espaguete",
      preco: 250.0,
      unidade: "Pacote 500g",
      especificacao: "Massa alimentar tipo espaguete",
    },
    {
      nome: "Açúcar 1kg",
      preco: 420.0,
      unidade: "Kg",
      especificacao: "Açúcar branco refinado",
    },
    {
      nome: "Sal",
      preco: 250.0,
      unidade: "Kg",
      especificacao: "Sal de cozinha iodado",
    },
    {
      nome: "Óleo comestível 5l",
      preco: 650.0,
      unidade: "Garrafa",
      especificacao: "Óleo vegetal refinado",
    },
    {
      nome: "Manteiga / Margarina",
      preco: 250.0,
      unidade: "Unidade 500g",
      especificacao: "Margarina vegetal ou manteiga de mesa",
    },
    {
      nome: "Leite e derivados (queijo, iogurte, requeijão)",
      preco: 110.0,
      unidade: "Unidade",
      especificacao: "Lacticínios diversos",
    },
    {
      nome: "Ovos",
      preco: 250.0,
      unidade: "Dúzia",
      especificacao: "Ovos frescos de galinha",
    },
    {
      nome: "Carnes (bovina, suína, aves, caprina)",
      preco: 250.0,
      unidade: "Kg",
      especificacao: "Carnes frescas ou congeladas",
    },
    {
      nome: "Peixes e frutos do mar",
      preco: 250.0,
      unidade: "Kg",
      especificacao: "Peixe fresco ou congelado de diversas espécies",
    },
    {
      nome: "Embutidos (salsicha, linguiça, mortadela)",
      preco: 250.0,
      unidade: "Kg",
      especificacao: "Charcutaria diversa",
    },
    {
      nome: "Pães e bolos",
      preco: 250.0,
      unidade: "Unidade",
      especificacao: "Pão fresco e produtos de pastelaria",
    },
    {
      nome: "Biscoitos e bolachas",
      preco: 250.0,
      unidade: "Pacote",
      especificacao: "Bolachas secas ou recheadas",
    },
    {
      nome: "Cereais matinais",
      preco: 250.0,
      unidade: "Pacote",
      especificacao: "Flocos de milho ou aveia para pequeno-almoço",
    },
    {
      nome: "Frutas frescas",
      preco: 250.0,
      unidade: "Kg",
      especificacao: "Frutas da época",
    },
    {
      nome: "Frutas secas",
      preco: 250.0,
      unidade: "Pacote",
      especificacao: "Frutas desidratadas diversas",
    },
    {
      nome: "Legumes e verduras",
      preco: 250.0,
      unidade: "Kg",
      especificacao: "Produtos hortícolas frescos",
    },
    {
      nome: "Temperos e condimentos",
      preco: 250.0,
      unidade: "Conjunto",
      especificacao: "Especiarias e condimentos diversos",
    },
    {
      nome: "Chás",
      preco: 120.0,
      unidade: "Caixa",
      especificacao: "Saquetas de chá diversas",
    },
    {
      nome: "Café",
      preco: 350.0,
      unidade: "Frasco",
      especificacao: "Café solúvel ou moído",
    },
    {
      nome: "Achocolatado",
      preco: 250.0,
      unidade: "Lata",
      especificacao: "Pó achocolatado solúvel",
    },
    {
      nome: "Refrigerantes",
      preco: 250.0,
      unidade: "Unidade",
      especificacao: "Bebidas gaseificadas diversas",
    },
    {
      nome: "Sucos naturais e industrializados",
      preco: 250.0,
      unidade: "Litro",
      especificacao: "Sumos de fruta diversos",
    },
    {
      nome: "Água mineral (Garrafa de 500ml)",
      preco: 50.0,
      unidade: "Garrafa",
      especificacao: "Água mineral natural",
    },
    {
      nome: "Água mineral (Garrafa de 2l)",
      preco: 50.0,
      unidade: "Garrafa",
      especificacao: "Água mineral natural embalagem grande",
    },
    {
      nome: "Gelo",
      preco: 250.0,
      unidade: "Saco",
      especificacao: "Gelo em cubos",
    },
    {
      nome: "Doces e sobremesas",
      preco: 250.0,
      unidade: "Unidade",
      especificacao: "Sobremesas preparadas ou doces",
    },
    {
      nome: "Alimentos enlatados",
      preco: 250.0,
      unidade: "Unidade",
      especificacao: "Conservas diversas em lata",
    },
    {
      nome: "Conservas",
      preco: 250.0,
      unidade: "Frasco",
      especificacao: "Produtos em conserva diversos",
    },
    {
      nome: "Alimentos congelados",
      preco: 250.0,
      unidade: "Pacote",
      especificacao: "Refeições ou produtos congelados",
    },
    {
      nome: "Alimentos desidratados",
      preco: 250.0,
      unidade: "Pacote",
      especificacao: "Sopas ou outros alimentos secos",
    },
    {
      nome: "Alimentos para animais",
      preco: 250.0,
      unidade: "Saco",
      especificacao: "Comida para animais de estimação",
    },
    {
      nome: "Ração animal",
      preco: 250.0,
      unidade: "Saco",
      especificacao: "Ração para gado ou aves",
    },
    {
      nome: "Alimentos para campanhas específicas",
      preco: 250.0,
      unidade: "Lote",
      especificacao: "Cabazes ou lotes de alimentos para eventos sociais",
    },
  ],
  "Material de limpeza e higiene": [
    {
      nome: "Ambientador",
      preco: 150.0,
      unidade: "Unidade",
      especificacao: "Ambientador",
    },
    {
      nome: "Balde de 15 litros",
      preco: 150.0,
      unidade: "Unidade",
      especificacao: "Balde de 15 litros",
    },
    {
      nome: "Balde de limpeza plástico",
      preco: 150.0,
      unidade: "Unidade",
      especificacao: "Balde de limpeza plástico",
    },
    {
      nome: "Bloco sanitário",
      preco: 150.0,
      unidade: "Unidade",
      especificacao: "Bloco sanitário",
    },
    {
      nome: "Cabeça de Mope",
      preco: 150.0,
      unidade: "Unidade",
      especificacao: "Cabeça de Mope",
    },
    {
      nome: "Cabeça de vassoura",
      preco: 150.0,
      unidade: "Unidade",
      especificacao: "Cabeça de vassoura",
    },
    {
      nome: "Cabo de vassoura/Mope",
      preco: 150.0,
      unidade: "Unidade",
      especificacao: "Cabo de vassoura/Mope",
    },
    {
      nome: "Creolina",
      preco: 150.0,
      unidade: "Unidade",
      especificacao: "Creolina",
    },
    {
      nome: "Desifentante Azul",
      preco: 150.0,
      unidade: "Unidade",
      especificacao: "Desifentante Azul",
    },
    {
      nome: "Detergente boca de pato Duk",
      preco: 180.0,
      unidade: "Unidade",
      especificacao: "Detergente boca de pato Duk",
    },
    {
      nome: "Detergente em pó",
      preco: 180.0,
      unidade: "Unidade",
      especificacao: "Detergente em pó",
    },
    {
      nome: "Detergente líquido",
      preco: 180.0,
      unidade: "Unidade",
      especificacao: "Detergente líquido",
    },
    {
      nome: "Dispensador de sabão automático",
      preco: 150.0,
      unidade: "Unidade",
      especificacao: "Dispensador de sabão automático",
    },
    {
      nome: "Dispensador de álcool Gel",
      preco: 150.0,
      unidade: "Unidade",
      especificacao: "Dispensador de álcool Gel",
    },
    {
      nome: "Escova de Pia",
      preco: 150.0,
      unidade: "Unidade",
      especificacao: "Escova de Pia",
    },
    {
      nome: "Espanador G R",
      preco: 150.0,
      unidade: "Unidade",
      especificacao: "Espanador G R",
    },
    {
      nome: "Espanador de Pó",
      preco: 150.0,
      unidade: "Unidade",
      especificacao: "Espanador de Pó",
    },
    {
      nome: "Fato macacao",
      preco: 150.0,
      unidade: "Unidade",
      especificacao: "Fato macacao",
    },
    {
      nome: "Gel Pinho",
      preco: 150.0,
      unidade: "Unidade",
      especificacao: "Gel Pinho",
    },
    {
      nome: "Gel pinho",
      preco: 150.0,
      unidade: "Unidade",
      especificacao: "Gel pinho",
    },
    {
      nome: "Guardanapo",
      preco: 150.0,
      unidade: "Unidade",
      especificacao: "Guardanapo",
    },
    {
      nome: "Handy-andy",
      preco: 150.0,
      unidade: "Unidade",
      especificacao: "Handy-andy",
    },
    { nome: "Javel", preco: 150.0, unidade: "Unidade", especificacao: "Javel" },
    {
      nome: "Lava tudo",
      preco: 150.0,
      unidade: "Unidade",
      especificacao: "Lava tudo",
    },
    {
      nome: "Limpa vidro",
      preco: 150.0,
      unidade: "Unidade",
      especificacao: "Limpa vidro",
    },
    { nome: "Luvas", preco: 150.0, unidade: "Unidade", especificacao: "Luvas" },
    { nome: "Mope", preco: 150.0, unidade: "Unidade", especificacao: "Mope" },
    {
      nome: "Multi usos",
      preco: 150.0,
      unidade: "Unidade",
      especificacao: "Multi usos",
    },
    { nome: "Máscara", preco: 150.0, unidade: "Unidade", especificacao: "Máscara" },
    { nome: "Oculos", preco: 150.0, unidade: "Unidade", especificacao: "Oculos" },
    {
      nome: "Pano de Limpeza",
      preco: 150.0,
      unidade: "Unidade",
      especificacao: "Pano de Limpeza",
    },
    {
      nome: "Papel Higiênico",
      preco: 150.0,
      unidade: "Unidade",
      especificacao: "Papel Higiênico",
    },
    {
      nome: "Papel higiênico",
      preco: 150.0,
      unidade: "Unidade",
      especificacao: "Papel higiênico",
    },
    { nome: "Piaça", preco: 150.0, unidade: "Unidade", especificacao: "Piaça" },
    { nome: "Povim", preco: 150.0, unidade: "Unidade", especificacao: "Povim" },
    {
      nome: "Recarga de bloco sanitário",
      preco: 150.0,
      unidade: "Unidade",
      especificacao: "Recarga de bloco sanitário",
    },
    { nome: "Sabão", preco: 150.0, unidade: "Unidade", especificacao: "Sabão" },
    {
      nome: "Sabão Maeva",
      preco: 150.0,
      unidade: "Unidade",
      especificacao: "Sabão Maeva",
    },
    {
      nome: "Sabão líquido",
      preco: 150.0,
      unidade: "Unidade",
      especificacao: "Sabão líquido",
    },
    {
      nome: "Sais de espírito",
      preco: 150.0,
      unidade: "Unidade",
      especificacao: "Sais de espírito",
    },
    {
      nome: "Soda Caústica",
      preco: 150.0,
      unidade: "Unidade",
      especificacao: "Soda Caústica",
    },
    {
      nome: "Spray insecticida",
      preco: 150.0,
      unidade: "Unidade",
      especificacao: "Spray insecticida",
    },
    { nome: "Toca", preco: 150.0, unidade: "Unidade", especificacao: "Toca" },
    {
      nome: "Vassoura",
      preco: 150.0,
      unidade: "Unidade",
      especificacao: "Vassoura",
    },
    {
      nome: "Ácido de limpeza",
      preco: 150.0,
      unidade: "Unidade",
      especificacao: "Ácido de limpeza",
    },
    { nome: "Álcool", preco: 150.0, unidade: "Unidade", especificacao: "Álcool" },
  ],
  "Ferramentas de uso duradouro": [
    {
      nome: "Máquina lavadora de pisos",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Máquina semi-automática para lavagem de pavimentos",
    },
    {
      nome: "Máquina aspiradora",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Aspirador industrial pó e água 30L",
    },
    {
      nome: "Máquina varredeira",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Varredeira mecânica de pavimentos",
    },
    {
      nome: "Enxada",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Enxada agrícola com cabo de madeira",
    },
    {
      nome: "Catana",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Catana de corte com cabo emborrachado",
    },
    {
      nome: "Pá",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Pá de bico com cabo reforçado",
    },
    {
      nome: "Ancinho",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Ancinho metálico para jardinagem",
    },
    {
      nome: "Gadalha",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Foice / gadalha para capim",
    },
    {
      nome: "Kit de pneu",
      preco: 300.0,
      unidade: "Conjunto",
      especificacao: "Kit de reparação e câmara de ar",
    },
    {
      nome: "Lanterna",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Lanterna recarregável LED de alta potência",
    },
  ],
  "Material de consumo para ensino e formação": [
    {
      nome: "Livros de turma",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Livro de registo de turma e sumários",
    },
    {
      nome: "Marcadores",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Marcador para quadro branco recarregável",
    },
    {
      nome: "Apagadores",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Apagador magnético para quadro branco",
    },
    {
      nome: "Pastas de arquivos",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Pasta arquivo morto em cartão",
    },
    {
      nome: "Separadores",
      preco: 300.0,
      unidade: "Pacote",
      especificacao: "Separadores de índice numérico/alfabético",
    },
    {
      nome: "Cadernos escolares",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Caderno brochura 96 folhas A4",
    },
  ],
  "Material duradouro para ensino e formação": [
    {
      nome: "Quadro branco",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Mobiliário didático",
    },
    {
      nome: "Quadro negro",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Mobiliário didático",
    },
    {
      nome: "Quadro de cortiça / Mural",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Mobiliário didático",
    },
    {
      nome: "Ecrã / Tela de projeção",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Equipamento audiovisual",
    },
    {
      nome: "Projetor multimédia",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Equipamento audiovisual",
    },
    {
      nome: "Mesa de professor",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Mobiliário",
    },
    {
      nome: "Mesa de aluno",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Mobiliário",
    },
    {
      nome: "Cadeira de aluno",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Mobiliário",
    },
    {
      nome: "Carteira escolar (conjunto)",
      preco: 300.0,
      unidade: "Conjunto",
      especificacao: "Mobiliário",
    },
    {
      nome: "Armário de sala de aula",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Mobiliário",
    },
    {
      nome: "Estante para livros",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Mobiliário",
    },
    {
      nome: "Mapa mundi / Mapa de Angola",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Material didático",
    },
    {
      nome: "Globo terrestre",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Material didático",
    },
    {
      nome: "Relógio de parede",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Material didático",
    },
    {
      nome: "Vitrine / Expositor",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Mobiliário",
    },
    {
      nome: "Mesa de laboratório",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Mobiliário didático",
    },
    {
      nome: "Bancada de laboratório",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Mobiliário didático",
    },
    {
      nome: "Microscópio",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Equipamento científico",
    },
    {
      nome: "Kit de química / Laboratório",
      preco: 300.0,
      unidade: "Conjunto",
      especificacao: "Equipamento científico",
    },
    {
      nome: "Aparelho de som",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Equipamento audiovisual",
    },
    {
      nome: "Televisor / Monitor educativo",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Equipamento audiovisual",
    },
    {
      nome: "Computador para sala de aula",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Equipamento informático",
    },
    {
      nome: "Calculadora científica",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Material didático",
    },
    {
      nome: "Tábua de geometria (grande)",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Material didático",
    },
    {
      nome: "Esquadro / Transferidor (grande)",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Material didático",
    },
    {
      nome: "Compasso de quadro",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Material didático",
    },
  ],
  "Material de consumo para desporto": [
    {
      nome: "Taças",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Taça de premiação desportiva com base",
    },
    {
      nome: "Bolas",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Bola de futebol oficial costurada à máquina",
    },
    {
      nome: "Coletes",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Colete de treino desportivo respirável",
    },
    {
      nome: "Medalhas",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Medalha com fita para torneios",
    },
    {
      nome: "Tabuleiros de xadrez",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Tabuleiro de xadrez dobrável com peças",
    },
  ],
  "Material duradouro para desporto": [
    {
      nome: "Equipamentos desportivos diversos",
      preco: 300.0,
      unidade: "Conjunto",
      especificacao: "Redes de baliza, cronómetros e acessórios desportivos",
    },
  ],
  "Material de representação": [
    {
      nome: "Camisetes e bonés",
      preco: 300.0,
      unidade: "Conjunto",
      especificacao: "Kit promocional t-shirt + boné bordado",
    },
    {
      nome: "Panfletos",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Panfleto informativo A4 policromia",
    },
    {
      nome: "Banner vertical",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Roll-up banner institucional com estrutura 85x200cm",
    },
    {
      nome: "Impressora dedicada a publicidade",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Impressora plotter de grande formato para publicidade",
    },
  ],
  "Material de festividades, homenagens e premiação": [
    {
      nome: "Medalhas",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Medalha comemorativa personalizada banhada",
    },
    {
      nome: "Taças",
      preco: 300.0,
      unidade: "Unidade",
      especificacao: "Taça de honra de grande porte",
    },
    {
      nome: "Decoração para eventos",
      preco: 300.0,
      unidade: "Lote",
      especificacao: "Arranjos florais, panos e adereços para festividades",
    },
  ],
  "Material de consumo para informática": [
    {
      nome: "Antivirus",
      preco: 1000.0,
      unidade: "Licença",
      especificacao: "Antivirus",
    },
    {
      nome: "Cintas plásticas",
      preco: 1000.0,
      unidade: "Unidade",
      especificacao: "Cintas plásticas",
    },
    {
      nome: "Flash Drive USB 64GB",
      preco: 1000.0,
      unidade: "Unidade",
      especificacao: "Flash Drive USB 64GB",
    },
    {
      nome: "Pilhas Toshiba",
      preco: 1000.0,
      unidade: "Par",
      especificacao: "Pilhas Toshiba",
    },
    {
      nome: "Tinteiro 932XL",
      preco: 3500.0,
      unidade: "Unidade",
      especificacao: "Tinteiro 932XL",
    },
    {
      nome: "Tinteiro 933XL",
      preco: 3500.0,
      unidade: "Unidade",
      especificacao: "Tinteiro 933XL",
    },
    {
      nome: "Tinteiro Epson 103",
      preco: 3500.0,
      unidade: "Unidade",
      especificacao: "Tinteiro Epson 103",
    },
    {
      nome: "Toner 05A",
      preco: 3500.0,
      unidade: "Unidade",
      especificacao: "Toner 05A",
    },
    {
      nome: "Toner 107A",
      preco: 3500.0,
      unidade: "Unidade",
      especificacao: "Toner 107A",
    },
    {
      nome: "Toner 117A",
      preco: 3500.0,
      unidade: "Unidade",
      especificacao: "Toner 117A",
    },
    {
      nome: "Toner 150A",
      preco: 3500.0,
      unidade: "Unidade",
      especificacao: "Toner 150A",
    },
    {
      nome: "Toner 203A",
      preco: 3500.0,
      unidade: "Unidade",
      especificacao: "Toner 203A",
    },
    {
      nome: "Toner 207A",
      preco: 3500.0,
      unidade: "Unidade",
      especificacao: "Toner 207A",
    },
    {
      nome: "Toner 26A",
      preco: 3500.0,
      unidade: "Unidade",
      especificacao: "Toner 26A",
    },
    {
      nome: "Toner 56A",
      preco: 3500.0,
      unidade: "Unidade",
      especificacao: "Toner 56A",
    },
    {
      nome: "Toner 59A",
      preco: 3500.0,
      unidade: "Unidade",
      especificacao: "Toner 59A",
    },
    {
      nome: "Toner 901",
      preco: 3500.0,
      unidade: "Unidade",
      especificacao: "Toner 901",
    },
    {
      nome: "Toner BPFT200-Sharp",
      preco: 3500.0,
      unidade: "Unidade",
      especificacao: "Toner BPFT200-Sharp",
    },
    {
      nome: "Tubo de cola quente",
      preco: 1000.0,
      unidade: "Unidade",
      especificacao: "Tubo de cola quente",
    },
  ],
  "Material duradouro para informática": [
    {
      nome: "Bota RJ45",
      preco: 1000.0,
      unidade: "Unidade",
      especificacao: "Bota RJ45",
    },
    {
      nome: "Cartão de memória SD 128GB",
      preco: 1000.0,
      unidade: "Unidade",
      especificacao: "Cartão de memória SD 128GB",
    },
    {
      nome: "Memória Ram DDR4 8 GB",
      preco: 1000.0,
      unidade: "Unidade",
      especificacao: "Memória Ram DDR4 8 GB",
    },
    {
      nome: "Memória Ram DDR4 16 GB",
      preco: 1000.0,
      unidade: "Unidade",
      especificacao: "Memória Ram DDR4 16 GB",
    },
    {
      nome: "Memória Ram DDR3 8 GB",
      preco: 1000.0,
      unidade: "Unidade",
      especificacao: "Memória Ram DDR3 8 GB",
    },
    {
      nome: "Memória Ram DDR3L 8 GB",
      preco: 1000.0,
      unidade: "Unidade",
      especificacao: "Memória Ram DDR3L 8 GB",
    },
    {
      nome: "Disco duro SSD 1TB",
      preco: 1000.0,
      unidade: "Unidade",
      especificacao: "Disco duro SSD 1TB",
    },
    {
      nome: "Disco duro SSD 512TB",
      preco: 1000.0,
      unidade: "Unidade",
      especificacao: "Disco duro SSD 512TB",
    },
    {
      nome: "Disco duro SSD m2  1TB",
      preco: 1000.0,
      unidade: "Unidade",
      especificacao: "Disco duro SSD m2  1TB",
    },
    {
      nome: "Disco duro SSD m2  512TB",
      preco: 1000.0,
      unidade: "Unidade",
      especificacao: "Disco duro SSD m2  512TB",
    },
    {
      nome: "Disco duro SSD m2  1TB externo",
      preco: 1000.0,
      unidade: "Unidade",
      especificacao: "Disco duro SSD m2  1TB externo",
    },
    {
      nome: "Cabo de internet  CAT 8",
      preco: 1000.0,
      unidade: "Metro",
      especificacao: "Cabo de internet  CAT 8",
    },
    {
      nome: "Conector RJ45 Plástico",
      preco: 1000.0,
      unidade: "Unidade",
      especificacao: "Conector RJ45 Plástico",
    },
    {
      nome: "Ezviz H3 color Wi-fi Smart Home Camera",
      preco: 1000.0,
      unidade: "Unidade",
      especificacao: "Ezviz H3 color Wi-fi Smart Home Camera",
    },
    {
      nome: "Flash Drive USB 32GB",
      preco: 1000.0,
      unidade: "Unidade",
      especificacao: "Flash Drive USB 32GB",
    },
    {
      nome: "Impressora",
      preco: 18000.0,
      unidade: "Unidade",
      especificacao: "Impressora",
    },
    {
      nome: "Mala de ferramentas de 16 peças",
      preco: 1000.0,
      unidade: "Unidade",
      especificacao: "Mala de ferramentas de 16 peças",
    },
    { nome: "Mouse", preco: 650.0, unidade: "Unidade", especificacao: "Mouse" },
    {
      nome: "Teclados",
      preco: 950.0,
      unidade: "Unidade",
      especificacao: "Teclados",
    },
    {
      nome: "Mouse wireless",
      preco: 650.0,
      unidade: "Unidade",
      especificacao: "Mouse wireless",
    },
    {
      nome: "Teclados wireless",
      preco: 950.0,
      unidade: "Unidade",
      especificacao: "Teclados wireless",
    },
    {
      nome: "Rolo de cabo ZKTeco Cat6 UTP 305M CCA",
      preco: 1000.0,
      unidade: "Rolo",
      especificacao: "Rolo de cabo ZKTeco Cat6 UTP 305M CCA",
    },
    {
      nome: "Modem wireless 5 G",
      preco: 1000.0,
      unidade: "Unidade",
      especificacao: "Modem wireless 5 G",
    },
    {
      nome: "TP-LINK Mini Wireless N USB Adapter de 300 MBps",
      preco: 1000.0,
      unidade: "Unidade",
      especificacao: "TP-LINK Mini Wireless N USB Adapter de 300 MBps",
    },
    {
      nome: "Tomada informática de rede RJ45 Cat6 1M UTP 096561",
      preco: 1000.0,
      unidade: "Unidade",
      especificacao: "Tomada informática de rede RJ45 Cat6 1M UTP 096561",
    },
    {
      nome: "Wifi USB",
      preco: 1000.0,
      unidade: "Unidade",
      especificacao: "Wifi USB",
    },
  ],
  "Software de base": [
    {
      nome: "Autodesk AutoCAD Architecture 2023",
      preco: 115000.00,
      unidade: "Licença",
      especificacao: "Licença anual AutoCAD Architecture (Preço global de mercado)",
    },
    {
      nome: "CorelDRAW Graphics Suite 2022",
      preco: 38500.00,
      unidade: "Licença",
      especificacao: "Licença comercial CorelDRAW Suite (Preço global de mercado)",
    },
    {
      nome: "Simuladores eletrônicos",
      preco: 24000.00,
      unidade: "Licença",
      especificacao: "Software educacional de simulação de circuitos (Preço global)",
    },
    {
      nome: "Zoom corporativo",
      preco: 14500.00,
      unidade: "Ano",
      especificacao: "Licença Zoom Pro reuniões ilimitadas (Preço global)",
    },
    {
      nome: "MATLAB estudante",
      preco: 35000.00,
      unidade: "Licença",
      especificacao: "Licença MATLAB Campus/Estudante (Preço global)",
    },
    {
      nome: "adobe profissional",
      preco: 42000.00,
      unidade: "Licença",
      especificacao: "Adobe Creative Cloud All Apps subscrição anual (Preço global)",
    },
    {
      nome: "Archicad",
      preco: 165000.00,
      unidade: "Licença",
      especificacao: "Licença profissional Graphisoft Archicad (Preço global)",
    },
    {
      nome: "Autocad",
      preco: 115000.00,
      unidade: "Licença",
      especificacao: "Licença anual Autodesk AutoCAD (Preço global de mercado)",
    },
  ]};

export const PRIORIDADES = ["Baixa", "Média", "Alta", "Urgente"];

export const FONTES_RECEITA = [
  "Orçamento do Estado",
  "Receitas Próprias",
  "Doações / Cooperação",
  "Fundos Próprios / CIE",
  "Outras Fontes",
];

export const PERIODOS_EXECUCAO = [
  "Mensal",
  "Semestral",
  "Trimestral",
  "Anual",
];

export const TRIMESTRES = [
  "1º Trimestre",
  "2º Trimestre",
  "3º Trimestre",
  "4º Trimestre",
];

export const MESES = [
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

export const VIATURAS: string[] = [];

export const ESTADOS_CIVIS = [
  "Solteiro(a)",
  "Casado(a)",
  "Divorciado(a)",
  "Viúvo(a)",
  "União de Facto",
];

export const NIVEIS_ACADEMICOS = [
  "Doutoramento (PhD)",
  "Mestrado",
  "Licenciatura",
  "Bacharelato",
  "Curso Superior",
  "Técnico Profissional",
  "Técnico Médio",
  "Ensino Médio",
  "Técnico Básico",
  "Ensino Secundário Geral",
  "Ensino Primário",
  "Sem escolaridade formal",
];

export const CATEGORIAS_DOCENTES = [
  "Professor Catedrático",
  "Professor Associado",
  "Professor Auxiliar",
  "Assistente Universitário",
  "Assistente",
];

export const CATEGORIAS_CTAA = [
  "Técnico Superior",
  "Técnico Profissional",
  "Técnico",
  "Assistente",
];

export const CATEGORIAS_CTA = CATEGORIAS_CTAA;

export const CATEGORIAS_FUNCIONARIOS = [
  "Proprietário e Programador do Sistema",
  "Professor Catedrático",
  "Professor Associado",
  "Professor Auxiliar",
  "Assistente Universitário",
  "Técnico Superior",
  "Técnico Profissional",
  "Técnico",
  "Assistente",
];

export const PROVINCIAS_LIST = [
  "Cabo Delgado",
  "Gaza",
  "Inhambane",
  "Manica",
  "Maputo Cidade",
  "Maputo Província",
  "Nampula",
  "Niassa",
  "Sofala",
  "Tete",
  "Zambézia",
];

export const SECOES = [
  "Conselho de Representantes",
  "Gabinete do Diretor-Geral",
  "Conselho Administrativo e de Gestão",
  "Conselho Técnico e de Qualidade",
  "Chefe do GDG",
  "Secretaria Executiva",
  "Departamento de Planificação Estudos e Projetos (DPEP)",
  "Unidade Gestora e Executora de Aquisições (UGEA)",
  "Departamento de Cooperação e Relações Exteriores (DCRE)",
  "Departamento de Controlo Técnico e de Qualidade (DCTQ)",
  "Departamento Jurídico (DJ)",
  "Diretor da Divisão de Engenharia",
  "Diretor Adjunto Pedagógico",
  "Departamento de Pesquisa e Extensão",
  "Departamento de Engenharia Eletrotécnica",
  "Departamento de Engenharia de Construção Civil",
  "Departamento de Engenharia de Construção Mecânica",
  "Departamento de Disciplinas Gerais",
  "Departamento Técnico e de Apoio",
  "Centro de Incubação de Empresas",
  "Diretor do CIE",
  "Departamento de Práticas de Geração de Negócio e Desenvolvimento Empresarial (DPGNDE)",
  "Departamento de Consultoria, Estudos, Projetos e Angariação de Fundos (DCPAF)",
  "Departamento de Prospecção de Oportunidade de Negócio (DPONE)",
  "Direção de Coordenação de Serviços de Administração, Finanças e de Apoio (DICOSAFA)",
  "Direção de Coordenação de Serviços Académicos, Sociais, Extensão e Relações Públicas (DICOSSER)",
  "Diretor da DICOSAFA",
  "Departamento de Recursos Humanos",
  "Departamento de Finanças",
  "Departamento de Património",
  "Secretaria Geral",
  "Departamento TIC",
  "Departamento Lar de Estudantes",
  "Repartição de Produção Alimentar",
  "Diretor da DICOSSER",
  "Departamento de Registo Académico",
  "Departamento de Assuntos Estudantis",
  "Repartição de Biblioteca",
  // Novas repartições/setores do DICOSAFA
  "Chefe do RH",
  "Repartição de Pessoal",
  "Repartição de Formação",
  "Repartição de Apoio Social",
  "Chefe de Finanças",
  "Repartição de Plano e Orçamento",
  "Repartição de Tesouraria",
  "Setor de Estatística",
  "Chefe de DP",
  "Repartição de E-Património",
  "Repartição de Infraestrutura e Manutenção",
  "Repartição de Transporte",
  "Chefe da SG",
  "Secretaria",
  "SIC",
  "Chefe de DTIC",
  "Setor de Rede de Computadores",
  "Setor de Manutenção",
  "Reprografia",
  "Oficina de TIC",
  "Chefe de DLE",
  "Repartição de Alojamento",
  "Repartição de Eventos",
  "Economato",
  "Chefe de DPA",
  "Repartição de Produção Animal",
  "Repartição de Produção Vegetal",
  "Armazém de Thaka",
  // Novas repartições/setores do DICOSSER
  "Chefe do DRA",
  "Atendimento Estudantil",
  "Repartição de Certificação",
  "Repartição de Exames de Admissão",
  "Repartição de Matrículas",
  "Chefe do DAE",
  "Repartição de Bolsa de Estudos",
  "Repartição de Desporto e Recreação",
  "Chefe de DBA",
  "Biblioteca",
  "Repartição de Documentos",
  "Repartição de Arquivo",
];

export const HABILITACOES_PROFISSIONAIS_LIST = [
  "Formação Pedagógica",
  "Gestão de Projetos",
  "Informática Avançada",
  "Contabilidade Pública",
  "Administração Escolar",
  "Secretariado Executivo",
  "Manutenção Industrial",
  "Logística e Aprovisionamento",
];

export const SUB_REFERENCIAS_PRODUTOS: Record<string, string[]> = {
  "Computador": [
    "Computador Portátil Core i3 (8GB RAM, 256GB SSD)",
    "Computador Portátil Core i5 (16GB RAM, 512GB SSD)",
    "Computador Portátil Core i7 (16GB RAM, 512GB SSD)",
    "Computador Desktop Core i5 (8GB RAM, 512GB SSD)",
    "Computador Desktop Core i7 (16GB RAM, 1TB SSD)",
    "Computador All-in-One Educativo (8GB RAM, 256GB SSD)",
    "Computador para sala de aula"
  ],
  "Toner": [
    "Toner 05A (HP LaserJet)",
    "Toner 107A (HP Laser)",
    "Toner 117A (HP Color Laser)",
    "Toner 150A (HP LaserJet)",
    "Toner 203A (HP Color LaserJet)",
    "Toner 207A (HP Color LaserJet)",
    "Toner 26A (HP LaserJet)",
    "Toner 56A (HP LaserJet)",
    "Toner 59A (HP LaserJet)",
    "Toner 901",
    "Toner BPFT200-Sharp"
  ],
  "Agrafador": [
    "Agrafador de mesa pequeno (até 20 folhas)",
    "Agrafador de mesa médio (até 50 folhas)",
    "Agrafador de pinça / alicate",
    "Agrafador de braço longo / pesado"
  ],
  "Flash Drive": [
    "Flash Drive USB 16GB",
    "Flash Drive USB 32GB",
    "Flash Drive USB 64GB",
    "Flash Drive USB 128GB",
    "Flash Drive USB 256GB"
  ],
  "Tinteiro": [
    "Tinteiro 932XL (Preto)",
    "Tinteiro 933XL (Cores)",
    "Tinteiro Epson 103 (Preto)",
    "Tinteiro Epson 103 (Cores: C/M/Y)"
  ],
  "Memória RAM": [
    "Memória RAM DDR3 8GB",
    "Memória RAM DDR3L 8GB",
    "Memória RAM DDR4 8GB",
    "Memória RAM DDR4 16GB",
    "Memória RAM DDR5 16GB"
  ],
  "Disco SSD": [
    "Disco SSD 256GB SATA/NVMe",
    "Disco SSD 512GB SATA/NVMe",
    "Disco SSD 1TB NVMe M.2",
    "Disco SSD 2TB NVMe M.2"
  ],
  "Impressora": [
    "Impressora Laser Monocromática A4",
    "Impressora Multifuncional Laser Colorida",
    "Impressora Jacto de Tinta (Tank)",
    "Impressora Térmica de Recibos",
    "Impressora dedicada a publicidade (Plotter)"
  ]
};

export function getSubReferencias(productName: string): string[] {
  if (!productName) return [];
  const nameLower = productName.toLowerCase();
  for (const [key, refs] of Object.entries(SUB_REFERENCIAS_PRODUTOS)) {
    if (nameLower.includes(key.toLowerCase())) {
      return refs;
    }
  }
  return [];
}

import { EFETIVO_GERAL_DATA } from "./colaboradoresList";

export const FUNCIONARIOS = EFETIVO_GERAL_DATA.filter((f) => {
  const emailLower = (f.email || "").toLowerCase();
  const usuarioLower = (f.usuario || "").toLowerCase();
  const idLower = (f.id || "").toLowerCase();

  // Permitir conta de colaborador regular de SLAITER TRIPAS
  if (
    emailLower === "fttripas@gmail.com" ||
    usuarioLower === "fttripas@gmail.com" ||
    idLower.includes("colaborador_108164611") ||
    idLower.includes("108164611")
  ) {
    return true;
  }

  const cargoChefia = (f.cargoChefia || "").toLowerCase();
  const categoria = (f.categoria || "").toLowerCase();
  const cargo = (f.cargo || "").toLowerCase();

  const isSystemAdmin =
    cargoChefia === "proprietário do sistema" ||
    cargoChefia === "proprietario do sistema" ||
    cargoChefia === "administrador de sistema" ||
    cargoChefia === "administrador do sistema" ||
    categoria.includes("proprietario") ||
    categoria.includes("proprietário") ||
    cargo.includes("proprietario do sistema") ||
    cargo.includes("proprietário do sistema") ||
    cargo.includes("administrador de sistema") ||
    cargo.includes("administrador do sistema");

  return !isSystemAdmin;
}).map((f) => ({
  nome:
    f.nome + (f.tipoRelacaoContractual ? ` (${f.tipoRelacaoContractual})` : ""),
  cargo: f.cargo || f.funcao || "Colaborador",
  direcao: f.direcao,
  departamento: f.departamento,
  reparticao: f.reparticao,
  sector: f.sector,
}));

export { rubricas } from "./rubricasBloco";
export type { BemRubrica, NecessidadeRubrica, RubricaBlocoItem } from "./rubricasBloco";



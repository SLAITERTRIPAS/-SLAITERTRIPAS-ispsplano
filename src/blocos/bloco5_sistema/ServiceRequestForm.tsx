import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  Copy,
  Paperclip,
  Loader2,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { ServiceRequest } from "../../types";
import html2pdf from "html2pdf.js";
import { CURSOS } from "../../constants/formOptions";
import { EFETIVO_GERAL_DATA } from "../../constants/colaboradoresList";
import { firestoreService } from "../../lib/firestoreService";
import { mergeColaboradores, formatEuropeanDate, safeJSONStringify } from "../../lib/utils";
import { usePersistentDraft } from "../../hooks/usePersistentDraft";
import { DraftModal, SyncIndicator } from "../../components/ui/DraftMemoryUI";

export default function ServiceRequestForm({
  visitorType,
  service,
  onBack,
  onSubmit,
  user,
}: {
  visitorType: string;
  service: string;
  onBack: () => void;
  onSubmit: (request: ServiceRequest) => void;
  user?: any;
}) {
  const [success, setSuccess] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [aiVerification, setAiVerification] = useState<{
    valido: boolean;
    analise: string;
  } | null>(null);

  const normalizedService = (service || "").toLowerCase();
  const isReposicaoTeste =
    normalizedService.includes("reposição") ||
    normalizedService.includes("reposicao");
  const isCertificadoOuCadeirasFeitas =
    normalizedService.includes("certificado") ||
    normalizedService.includes("cadeiras feitas") ||
    normalizedService.includes("declaração") ||
    normalizedService.includes("declaracao");
  const isSemAnexos =
    normalizedService.includes("anulação") ||
    normalizedService.includes("anulacao") ||
    normalizedService.includes("espaço") ||
    normalizedService.includes("espaco") ||
    normalizedService.includes("esclarecimento") ||
    normalizedService.includes("estágio") ||
    normalizedService.includes("estagio") ||
    normalizedService.includes("reclamação") ||
    normalizedService.includes("reclamacao");

  const initialFormState = {
    nome: "",
    curso: "Engenharia Elétrica",
    nivel: "1º Nível",
    semestre: "1º Semestre",
    periodo: "Laboral",
    descricao: "",
    nacionalidade: "Moçambicana",
    dataNascimento: "",
    nomePai: "",
    nomeMae: "",
    numeroBI: "",
    localEmissaoBI: "",
    dataEmissaoBI: "",
    numeroEstudante: "",
    contactoTelefonico: "",
    numeroTeste: "1",
    nomeCadeira: "",
    nomeDocente: "",
  };

  const {
    data: formData,
    setData: setFormData,
    isDraftLoaded,
    showDraftModal,
    isSyncing,
    recoverDraft,
    discardDraft,
    clearDraft,
  } = usePersistentDraft(
    `service_request_${(service || "general").replace(/\s/g, "_")}`,
    initialFormState,
  );

  const [dbEstudantes, setDbEstudantes] = useState<any[]>([]);
  const [detectedStatus, setDetectedStatus] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const activeUser = React.useMemo(() => {
    if (user && (user.nome || user.name || user.fullName)) return user;
    try {
      const stored = localStorage.getItem("sigep_logged_in_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.nome || parsed.name || parsed.fullName || parsed.numeroEstudante || parsed.id)) {
          return parsed;
        }
      }
      const storedUser = localStorage.getItem("sigep_user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed && (parsed.nome || parsed.name || parsed.fullName || parsed.numeroEstudante || parsed.id)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Erro ao obter utilizador logado:", e);
    }
    return user || null;
  }, [user]);

  const fillFormWithUser = React.useCallback((u: any) => {
    if (!u) return;
    const name = u.nome || u.name || u.fullName || "";
    const cursoVal = u.curso || u.departamento || u.direcao || "";
    const numEst = u.numeroEstudante || u.codigo || u.nuic || u.nuit || "";
    const biVal = u.numeroBI || u.bi || "";
    const dataNasc = u.dataNascimento || "";
    const pai = u.nomePai || "";
    const mae = u.nomeMae || "";
    const localBI = u.localEmissaoBI || u.provincia || "";
    const dataBI = u.dataEmissaoBI || "";
    const contacto = u.contactoTelefonico || u.contacto || u.celular || u.telefone || "";
    const nac = u.nacionalidade || "Moçambicana";
    const per = u.periodo || "Laboral";
    const niv = u.nivel || u.level || "1º Nível";
    const sem = u.semestre || "1º Semestre";

    setFormData((prev) => ({
      ...prev,
      nome: name || prev.nome,
      curso: cursoVal || prev.curso,
      numeroEstudante: numEst || prev.numeroEstudante,
      numeroBI: biVal || prev.numeroBI,
      dataNascimento: dataNasc || prev.dataNascimento,
      nomePai: pai || prev.nomePai,
      nomeMae: mae || prev.nomeMae,
      localEmissaoBI: localBI || prev.localEmissaoBI,
      dataEmissaoBI: dataBI || prev.dataEmissaoBI,
      contactoTelefonico: contacto || prev.contactoTelefonico,
      nacionalidade: nac || prev.nacionalidade,
      periodo: per || prev.periodo,
      nivel: niv || prev.nivel,
      semestre: sem || prev.semestre,
    }));

    if (name) {
      setDetectedStatus(`Usuário Logado Detetado: ${name}${numEst ? ` (Nº ${numEst})` : ""}`);
    }
  }, [setFormData]);

  useEffect(() => {
    if (activeUser && isDraftLoaded && !showDraftModal) {
      fillFormWithUser(activeUser);
    }
  }, [activeUser, isDraftLoaded, showDraftModal, fillFormWithUser]);

  useEffect(() => {
    const unsubColab = firestoreService.colaboradores.subscribe(
      (data: any[]) => {
        setDbColaboradores(data || []);
      },
      undefined,
    );
    const unsubEst = firestoreService.efetivo_escolar.subscribe(
      (data: any[]) => {
        setDbEstudantes(data || []);
      },
      undefined,
    );
    const unsubAloc = firestoreService.alocacoes_docentes.subscribe(
      (data: any[]) => {
        setAllAllocations(data || []);
      },
    );
    return () => {
      unsubColab();
      unsubEst();
      unsubAloc();
    };
  }, []);

  const handleSearchIdentification = (term: string) => {
    setSearchTerm(term);
    if (!term || term.trim().length < 2) return;
    const norm = term.trim().toLowerCase();

    let matched = dbEstudantes.find(
      (s) =>
        (s.numeroEstudante && s.numeroEstudante.toLowerCase().includes(norm)) ||
        (s.numeroBI && s.numeroBI.toLowerCase().includes(norm)) ||
        (s.nuit && s.nuit.toLowerCase().includes(norm)) ||
        (s.email && s.email.toLowerCase().includes(norm)) ||
        (s.nome && s.nome.toLowerCase().includes(norm))
    );

    if (!matched) {
      matched = dbColaboradores.find(
        (c) =>
          (c.nuit && c.nuit.toLowerCase().includes(norm)) ||
          (c.id && c.id.toLowerCase().includes(norm)) ||
          (c.numeroBI && c.numeroBI.toLowerCase().includes(norm)) ||
          (c.nome && c.nome.toLowerCase().includes(norm))
      );
    }

    if (matched) {
      fillFormWithUser({
        ...matched,
        nome: matched.nome || matched.name,
        curso: matched.curso || matched.departamento || matched.direcao,
        numeroEstudante: matched.numeroEstudante || matched.nuit || matched.id,
        numeroBI: matched.numeroBI || matched.bi,
        contactoTelefonico: matched.contactoTelefonico || matched.contacto || matched.telefone,
      });
      setDetectedStatus(`Identificação Detetada na Base de Dados: ${matched.nome || matched.name}`);
    }
  };

  const getCustomPetitionBodyAndRequestType = (
    serviceName: string,
    data: typeof formData,
  ) => {
    const s = serviceName.toLowerCase();

    if (s.includes("reposição") || s.includes("reposicao")) {
      return `autorizar a realização do teste ${data.numeroTeste} de reposição, da Cadeira de ${data.nomeCadeira}, do docente ${data.nomeDocente}, por motivos de ${data.descricao}`;
    }
    if (s.includes("certificado")) {
      return `autorizar a emissão do seu Certificado de Habilitações Académicas do Curso de ${data.curso}, por necessitar deste documento oficial para efeitos de: ${data.descricao || "prosseguimento de estudos / integração no mercado de trabalho"}`;
    }
    if (s.includes("declaração") || s.includes("declaracao")) {
      return `autorizar a emissão da Declaração de Cadeiras Feitas do Curso de ${data.curso}, referente ao seu percurso académico até ao ${data.nivel}, ${data.semestre}, para efeitos de: ${data.descricao || "comprovação de aproveitamento académico"}`;
    }
    if (s.includes("estágio") || s.includes("estagio")) {
      return `autorizar a emissão de uma Carta de Recomendação e Credencial para realização de Estágio Curricular ou Profissional no âmbito do Curso de ${data.curso}, para fins de consolidação da sua formação prática na área de: ${data.descricao || "Engenharia"}`;
    }
    if (s.includes("anulação") || s.includes("anulacao")) {
      return `autorizar a Anulação da sua Matrícula no Curso de ${data.curso}, no corrente ano letivo, devido a motivos imprevistos de força maior, nomeadamente: ${data.descricao}`;
    }
    if (
      s.includes("espaço") ||
      s.includes("espaco") ||
      s.includes("acomodação") ||
      s.includes("acomodacao")
    ) {
      return `autorizar a concessão de Espaço para Acomodação/Residência Estudantil nas instalações do Instituto, com base no facto de residir fora do distrito de Songo e requerer apoio pelas razões de: ${data.descricao}`;
    }
    if (s.includes("esclarecimento")) {
      return `se digne prestar Esclarecimento formal relativamente ao assunto de: ${data.descricao}, no âmbito das actividades académicas do Curso de ${data.curso}`;
    }
    if (s.includes("reclamação") || s.includes("reclamacao")) {
      return `se digne receber a Reclamação que respeitosamente apresenta nas linhas seguintes, solicitando a sua devida atenção e encaminhamento: ${data.descricao}`;
    }

    return `se digne autorizar a sua solicitação referente ao serviço de "${serviceName}", justificado conforme se descreve: ${data.descricao}`;
  };

  const getFullPetitionText = (serviceName: string, data: typeof formData) => {
    const bodyText = getCustomPetitionBodyAndRequestType(serviceName, data);
    return `Exmo. Senhor Director do Curso de Engenharia ${data.curso} do Instituto Superior Politécnico de Songo\n=Songo=\n\n${data.nome}, de nacionalidade ${data.nacionalidade}, nascido aos ${data.dataNascimento}, filho de ${data.nomePai} e ${data.nomeMae}, Portador de B.I. nº ${data.numeroBI}, emitido pêlo Arquivo de Identificação Civil da ${data.localEmissaoBI}, aos ${data.dataEmissaoBI}, estudante do Curso de Licenciatura em ${data.curso}, Período ${data.periodo}, inscrito sob o número ${data.numeroEstudante}, ${data.nivel} Nível, ${data.semestre}, com o contacto telefónico número ${data.contactoTelefonico}, vem mui respeitosamente rogar a V. Excia se digne ${bodyText}, pelo que\nPede Deferimento`;
  };

  const [previewMode, setPreviewMode] = useState(false);

  const [dbColaboradores, setDbColaboradores] = useState<any[]>([]);
  const [allAllocations, setAllAllocations] = useState<any[]>([]);

  useEffect(() => {
    const unsubColab = firestoreService.colaboradores.subscribe(
      (data: any[]) => {
        setDbColaboradores(data || []);
      },
      undefined,
    );
    const unsubAloc = firestoreService.alocacoes_docentes.subscribe(
      (data: any[]) => {
        setAllAllocations(data || []);
      },
    );
    return () => {
      unsubColab();
      unsubAloc();
    };
  }, []);

  const [receitaFile, setReceitaFile] = useState<string | null>(null);
  const [talaoFile, setTalaoFile] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const allCourses = [
    "Engenharia Elétrica",
    "Engenharia Eletrónica e Telecomunicações",
    "Engenharia de Energias Renováveis",
    "Engenharia de Construção Civil",
    "Engenharia Hidráulica",
    "Engenharia de Construção Mecânica",
    "Engenharia Termotécnica",
  ];

  const CADEIRAS_MAPPING: Record<
    string,
    Record<string, Record<string, string[]>>
  > = {
    "Engenharia Elétrica": {
      "1º Nível": {
        "1º Semestre": [
          "Análise Matemática I",
          "Física Geral I",
          "Álgebra Linear e Geometria Analítica",
          "Introdução à Engenharia",
          "Química Geral",
          "Técnicas de Expressão Oral e Escrita",
        ],
        "2º Semestre": [
          "Análise Matemática II",
          "Física Geral II",
          "Sistemas e Tecnologias de Informação",
          "Desenho Técnico Dinâmico",
          "Desenho de Engenharia",
          "Programação de Computadores",
        ],
      },
      "2º Nível": {
        "1º Semestre": [
          "Análise Matemática III",
          "Eletromagnetismo",
          "Circuitos Elétricos I",
          "Química Aplicada",
          "Sistemas Digitais",
        ],
        "2º Semestre": [
          "Análise Numérica",
          "Circuitos Elétricos II",
          "Medição e Instrumentação Elétrica",
          "Eletrónica Analógica I",
          "Mecânica Aplicada",
        ],
      },
      "3º Nível": {
        "1º Semestre": [
          "Máquinas Elétricas I",
          "Sistemas de Controlo",
          "Eletrónica Industrial",
          "Sistemas de Energia Elétrica I",
          "Instalações Elétricas e de Telecomunicações",
        ],
        "2º Semestre": [
          "Máquinas Elétricas II",
          "Sistemas de Automação",
          "Acionamentos Elétricos",
          "Eletrônica Digital",
          "Proteção e Comando",
        ],
      },
      "4º Nível": {
        "1º Semestre": [
          "Geração de Energia Elétrica",
          "Subestações e Linhas de Distribuição",
          "Eficiência Energética",
          "Gestão de Projetos de Engenharia",
          "Metodologia de Investigação",
        ],
        "2º Semestre": [
          "Trabalho de Licenciatura / Monografia",
          "Estágio Curricular Profissional",
          "Ética e Deontologia Profissional",
        ],
      },
    },
    "Engenharia Eletrónica e Telecomunicações": {
      "1º Nível": {
        "1º Semestre": [
          "Análise Matemática I",
          "Física Geral I",
          "Álgebra Linear",
          "Introdução às Telecomunicações",
          "Programação I",
          "Inglês Técnico",
        ],
        "2º Semestre": [
          "Análise Matemática II",
          "Física Geral II",
          "Química Aplicada",
          "Programação II",
          "Desenho Assistido por Computador",
        ],
      },
      "2º Nível": {
        "1º Semestre": [
          "Análise Matemática III",
          "Circuitos Elétricos I",
          "Eletrônica Analógica I",
          "Sistemas Digitais I",
          "Sinais e Sistemas",
        ],
        "2º Semestre": [
          "Teoria de Telecomunicações",
          "Circuitos Elétricos II",
          "Eletrônica Analógica II",
          "Sistemas Digitais II",
          "Eletromagnetismo Aplicado",
        ],
      },
      "3º Nível": {
        "1º Semestre": [
          "Processamento Digital de Sinais",
          "Sistemas de Microprocessadores",
          "Redes de Computadores I",
          "Sistemas de Transmissão",
          "Fibras Ópticas",
        ],
        "2º Semestre": [
          "Redes de Computadores II",
          "Comunicação Móvel e Satélite",
          "Eletrónica de Alta Frequência",
          "Instrumentação Eletrônica",
        ],
      },
      "4º Nível": {
        "1º Semestre": [
          "Sistemas de Antenas",
          "Segurança de Redes",
          "Gestão de Redes e Serviços",
          "Empreendedorismo",
          "Metodologia Científica",
        ],
        "2º Semestre": [
          "Trabalho de Fim de Curso",
          "Estágio Curricular",
          "Legislação e Regulamentação de Telecomunicações",
        ],
      },
    },
    "Engenharia de Energias Renováveis": {
      "1º Nível": {
        "1º Semestre": [
          "Cálculo I",
          "Física Experimental I",
          "Álgebra Linear",
          "Introdução às Energias Renováveis",
          "Química Geral",
        ],
        "2º Semestre": [
          "Cálculo II",
          "Termodinâmica Técnica",
          "Física Geral II",
          "Desenho Técnico",
          "Algoritmos e Programação",
        ],
      },
      "2º Nível": {
        "1º Semestre": [
          "Mecânica de Fluidos I",
          "Circuitos Elétricos I",
          "Eletrônica Básica",
          "Recursos Energéticos e Ambiente",
          "Análise Estatística",
        ],
        "2º Semestre": [
          "Transferência de Calor",
          "Conversão de Energia Térmica",
          "Instrumentação e Medidas",
          "Instalações de Baixa Tensão",
        ],
      },
      "3º Nível": {
        "1º Semestre": [
          "Sistemas Solares Fotovoltaicos",
          "Energia Eólica",
          "Sistemas Solares Térmicos",
          "Máquinas Elétricas Aplicadas",
          "Eletrónica de Potência",
        ],
        "2º Semestre": [
          "Energia da Biomassa",
          "Pequenas Centrais Hidrelétricas",
          "Armazenamento de Energia",
          "Redes Elétricas Inteligentes (Smart Grids)",
        ],
      },
      "4º Nível": {
        "1º Semestre": [
          "Avaliação de Impacto Ambiental",
          "Micro-redes e Sistemas Híbridos",
          "Gestão de Projetos e Viabilidade Económica",
          "Auditoria Energética",
        ],
        "2º Semestre": [
          "Trabalho de Licenciatura",
          "Estágio Profissionalizado",
          "Economia de Energia",
        ],
      },
    },
    "Engenharia de Construção Civil": {
      "1º Nível": {
        "1º Semestre": [
          "Análise Matemática I",
          "Álgebra Linear",
          "Química das Construções",
          "Desenho Técnico I",
          "Geologia de Engenharia",
        ],
        "2º Semestre": [
          "Análise Matemática II",
          "Física Geral",
          "Mecânica Racional",
          "Desenho Técnico II",
          "Topografia Geral",
        ],
      },
      "2º Nível": {
        "1º Semestre": [
          "Resistência de Materiais I",
          "Mecânica de Fluidos I",
          "Materiais de Construção I",
          "Topografia Aplicada",
          "Estatística e Probabilidades",
        ],
        "2º Semestre": [
          "Resistência de Materiais II",
          "Mecânica de Solos I",
          "Materiais de Construção II",
          "Hidráulica Geral I",
          "Planeamento Territorial",
        ],
      },
      "3º Nível": {
        "1º Semestre": [
          "Teoria das Estruturas I",
          "Mecânica de Solos II",
          "Fundações",
          "Betão Armado I",
          "Hidráulica Geral II",
        ],
        "2º Semestre": [
          "Teoria das Estruturas II",
          "Estruturas Metálicas e de Madeira",
          "Betão Armado II",
          "Instalações Prediais",
          "Organização e Gestão de Obras",
        ],
      },
      "4º Nível": {
        "1º Semestre": [
          "Vias de Comunicação I",
          "Pontes",
          "Saneamento Básico",
          "Segurança e Higiene no Trabalho",
          "Planeamento e Orçamentação de Obras",
        ],
        "2º Semestre": [
          "Trabalho de Culminação",
          "Estágio de Obra",
          "Fiscalização de Obras",
        ],
      },
    },
    "Engenharia Hidráulica": {
      "1º Nível": {
        "1º Semestre": [
          "Análise Matemática I",
          "Física Geral I",
          "Álgebra Linear",
          "Desenho Técnico",
          "Introdução à Engenharia Hidráulica",
        ],
        "2º Semestre": [
          "Análise Matemática II",
          "Química da Água",
          "Mecânica Racional",
          "Topografia Geral",
          "Programação de Computadores",
        ],
      },
      "2º Nível": {
        "1º Semestre": [
          "Mecânica de Fluidos I",
          "Geologia e Geotecnia",
          "Estatística Aplicada",
          "Materiais de Construção",
          "Hidrologia Geral",
        ],
        "2º Semestre": [
          "Hidráulica Geral I",
          "Mecânica de Solos",
          "Métodos Numéricos",
          "Topografia Aplicada",
          "Qualidade da Água",
        ],
      },
      "3º Nível": {
        "1º Semestre": [
          "Hidráulica Geral II",
          "Hidrologia e Recursos Hídricos",
          "Fundações e Estruturas de Terra",
          "Instalações Hidráulicas Prediais",
          "Sistemas de Bombagem",
        ],
        "2º Semestre": [
          "Obras Hidráulicas I",
          "Canais e Escoamentos Livres",
          "Sistemas de Abastecimento de Água",
          "Hidráulica Fluvial",
          "Eletrotécnica Aplicada",
        ],
      },
      "4º Nível": {
        "1º Semestre": [
          "Obras Hidráulicas II (Barragens)",
          "Sistemas de Drenagem e Esgotos",
          "Tratamento de Água (ETA/ETE)",
          "Rega e Drenagem Agrícola",
          "Gestão de Recursos Hídricos",
        ],
        "2º Semestre": [
          "Trabalho de Licenciatura",
          "Estágio Técnico",
          "Impacto Ambiental de Projetos Hídricos",
        ],
      },
    },
    "Engenharia de Construção Mecânica": {
      "1º Nível": {
        "1º Semestre": [
          "Análise Matemática I",
          "Álgebra Linear",
          "Física I",
          "Química Geral",
          "Introdução à Engenharia Mecânica",
        ],
        "2º Semestre": [
          "Análise Matemática II",
          "Física II",
          "Desenho Técnico II",
          "Ciências dos Materiais I",
          "Programação Aplicada",
        ],
      },
      "2º Nível": {
        "1º Semestre": [
          "Cálculo Científico",
          "Mecânica Aplicada I (Estática)",
          "Ciências dos Materiais II",
          "Tecnologia Mecânica I",
          "Eletrotécnica Geral",
        ],
        "2º Semestre": [
          "Resistência de Materiais I",
          "Mecânica de Fluidos I",
          "Termodinâmica Aplicada",
          "Tecnologia Mecânica II",
          "Metrologia e Tolerâncias",
        ],
      },
      "3º Nível": {
        "1º Semestre": [
          "Resistência de Materiais II",
          "Mecânica dos Fluidos II",
          "Órgãos de Máquinas I",
          "Processos de Maquinação",
          "Transmissão de Calor",
        ],
        "2º Semestre": [
          "Dinâmica de Máquinas",
          "Órgãos de Máquinas II",
          "Ensaios de Materiais e Soldadura",
          "Instalações Térmicas e Hidráulicas",
          "Manutenção Mecânica",
        ],
      },
      "4º Nível": {
        "1º Semestre": [
          "Sistemas de CAD/CAM",
          "Automação Mecânica e Hidráulica",
          "Organização e Gestão de Fábricas",
          "Sistemas de Climatização e Refrigeração",
        ],
        "2º Semestre": [
          "Trabalho de Culminação de Curso",
          "Estágio de Field",
          "Higiene e Segurança Industrial",
        ],
      },
    },
    "Engenharia Termotécnica": {
      "1º Nível": {
        "1º Semestre": [
          "Análise Matemática I",
          "Álgebra Linear",
          "Física Geral I",
          "Química de Combustíveis",
          "Introdução à Termotécnica",
        ],
        "2º Semestre": [
          "Análise Matemática II",
          "Física Geral II",
          "Termodinâmica Aplicada I",
          "Desenho Assistido por Computador",
          "Programação de Sistemas",
        ],
      },
      "2º Nível": {
        "1º Semestre": [
          "Termodinâmica Aplicada II",
          "Mecânica de Fluidos I",
          "Ciência dos Materiais",
          "Instalações Elétricas Industriais",
          "Cálculo Técnico",
        ],
        "2º Semestre": [
          "Transmissão de Calor I",
          "Mecânica de Fluidos II",
          "Resistência de Materiais",
          "Combustão e Combustíveis",
          "Medidas Térmicas",
        ],
      },
      "3º Nível": {
        "1º Semestre": [
          "Transmissão de Calor II",
          "Turbomáquinas Térmicas",
          "Centrais Térmicas e de Vapor",
          "Motores de Combustão Interna",
          "Equipamentos de Aquecimento",
        ],
        "2º Semestre": [
          "Sistemas de Refrigeração",
          "Sistemas de Climatização e Ventilação (AVAC)",
          "Instrumentação e Controlo Térmico",
          "Energia Térmica Solar e Biomassa",
        ],
      },
      "4º Nível": {
        "1º Semestre": [
          "Auditorias Térmicas e Eficiência Energética",
          "Gestão de Redes de Calor, Ar e Vapor",
          "Projetos Térmicos Integrados",
          "Manutenção Industrial Avançada",
        ],
        "2º Semestre": [
          "Trabalho Científico de Licenciatura",
          "Estágio Tecnológico Industrial",
          "Ética na Actividade Termoenergética",
        ],
      },
    },
  };

  const getDocentesForCadeira = (cadeira: string): string[] => {
    if (!cadeira) return [];

    // 1. Merge and find all active docentes from Human Resources (EFETIVO_GERAL_DATA) and Firestore
    const allColaboradores = mergeColaboradores(dbColaboradores);
    const activeDocentes = allColaboradores.filter(
      (colab) => colab.tipo === "Docente" && colab.estado === "Ativo",
    );

    if (activeDocentes.length === 0) return ["Docente do Curso"];

    // 2. Check explicit alocacoes/disciplinas from the system
    const resultFromDatabase: string[] = [];

    // Check custom allocations from the database `alocacoes_docentes`
    const matchingAllocations = allAllocations.filter(
      (aloc) =>
        aloc.disciplina &&
        aloc.disciplina.toLowerCase().trim() === cadeira.toLowerCase().trim(),
    );

    matchingAllocations.forEach((aloc) => {
      const docObj = activeDocentes.find((d) => d.id === aloc.docenteId);
      if (docObj && docObj.nome && !resultFromDatabase.includes(docObj.nome)) {
        resultFromDatabase.push(docObj.nome);
      }
    });

    // Check if any collaborator has this cadeira listed under `disciplinas` or `alocacoes` field directly
    activeDocentes.forEach((d) => {
      const disciplinesArray = [
        ...(Array.isArray(d.disciplinas) ? d.disciplinas : []),
        ...(Array.isArray(d.alocacoes) ? d.alocacoes : []),
      ];

      const hasCadeiraMatch = disciplinesArray.some(
        (discName) =>
          typeof discName === "string" &&
          discName.toLowerCase().trim() === cadeira.toLowerCase().trim(),
      );

      if (hasCadeiraMatch && d.nome && !resultFromDatabase.includes(d.nome)) {
        resultFromDatabase.push(d.nome);
      }
    });

    // If we have explicit allocations found in HR/Division, return them!
    if (resultFromDatabase.length > 0) {
      return resultFromDatabase;
    }

    // 3. Fallback: Search the departments and generate deterministically in that course
    // Map selected course to corresponding department in Human Resources / Division of Engineering
    const cursoLower = (formData.curso || "").toLowerCase();

    // Filter activeDocentes to get only real teachers without "Director" or "Diretor" title for department fallback
    const teachersOnly = activeDocentes.filter((colab) => {
      const cargoLower = (colab.cargo || "").toLowerCase();
      const funcaoLower = (colab.funcao || "").toLowerCase();
      return !(
        cargoLower.includes("diretor") ||
        cargoLower.includes("director") ||
        funcaoLower.includes("diretor") ||
        funcaoLower.includes("director")
      );
    });

    let courseDepartmentDocentes = teachersOnly;

    if (
      cursoLower.includes("elétrica") ||
      cursoLower.includes("eletrotecnia")
    ) {
      courseDepartmentDocentes = teachersOnly.filter(
        (d) =>
          (d.departamento || "").toLowerCase().includes("eletro") ||
          (d.departamento || "").toLowerCase().includes("eléctr"),
      );
    } else if (
      cursoLower.includes("eletrónica") ||
      cursoLower.includes("telecom")
    ) {
      courseDepartmentDocentes = teachersOnly.filter(
        (d) =>
          (d.departamento || "").toLowerCase().includes("eletr") ||
          (d.departamento || "").toLowerCase().includes("telecom"),
      );
    } else if (cursoLower.includes("renov")) {
      courseDepartmentDocentes = teachersOnly.filter((d) =>
        (d.departamento || "").toLowerCase().includes("renov"),
      );
    } else if (cursoLower.includes("civil")) {
      courseDepartmentDocentes = teachersOnly.filter((d) =>
        (d.departamento || "").toLowerCase().includes("civil"),
      );
    } else if (cursoLower.includes("hidr")) {
      courseDepartmentDocentes = teachersOnly.filter(
        (d) =>
          (d.departamento || "").toLowerCase().includes("civil") ||
          (d.departamento || "").toLowerCase().includes("hidr"),
      );
    } else if (
      cursoLower.includes("mecânica") ||
      cursoLower.includes("termotécnica") ||
      cursoLower.includes("mecan")
    ) {
      courseDepartmentDocentes = teachersOnly.filter(
        (d) =>
          (d.departamento || "").toLowerCase().includes("mecan") ||
          (d.departamento || "").toLowerCase().includes("termo"),
      );
    }

    // Fallback to general Engineering Division "Divisão de Engenharia" docentes if no matches in specific departments
    if (courseDepartmentDocentes.length === 0) {
      courseDepartmentDocentes = teachersOnly.filter((d) =>
        (d.direcao || "").toLowerCase().includes("engenharia"),
      );
    }

    // Fallback to all active docentes (excluding directors)
    if (courseDepartmentDocentes.length === 0) {
      courseDepartmentDocentes = teachersOnly;
    }

    // Now select deterministic docentes for this specific chair/cadeira within the course department
    const courseDocNames = courseDepartmentDocentes.map((d) => d.nome);
    const result: string[] = [];
    const poolSize = courseDocNames.length;

    // We can present 3 docentes assigned to this chair deterministically
    const count = Math.min(3, poolSize);
    for (let i = 0; i < count; i++) {
      let charSum = 0;
      for (let charIdx = 0; charIdx < cadeira.length; charIdx++) {
        charSum += cadeira.charCodeAt(charIdx);
      }
      const idx = (charSum + i * 31 + (cadeira.charCodeAt(0) || 0)) % poolSize;
      const nameSelected = courseDocNames[idx];
      if (!result.includes(nameSelected)) {
        result.push(nameSelected);
      }
    }

    if (result.length === 0) {
      result.push(courseDocNames[0]);
    }

    return result;
  };

  // Whenever course, level or semester changes, auto select the first available level, chair, and its teacher
  useEffect(() => {
    if (
      service === "Pedido de realização de reposição de teste" &&
      visitorType === "Estudante"
    ) {
      const courseLevels = Object.keys(CADEIRAS_MAPPING[formData.curso] || {});
      let targetLevel = formData.nivel;
      if (!courseLevels.includes(targetLevel)) {
        targetLevel = courseLevels[0] || "1º Nível";
      }

      const chairs =
        CADEIRAS_MAPPING[formData.curso]?.[targetLevel]?.[formData.semestre] ||
        [];
      const defaultChair =
        formData.nomeCadeira && chairs.includes(formData.nomeCadeira)
          ? formData.nomeCadeira
          : chairs[0] || "";
      const teachers = getDocentesForCadeira(defaultChair);
      const defaultTeacher = teachers[0] || "";

      setFormData((prev) => {
        if (
          prev.nivel !== targetLevel ||
          prev.nomeCadeira !== defaultChair ||
          prev.nomeDocente !== defaultTeacher
        ) {
          return {
            ...prev,
            nivel: targetLevel,
            nomeCadeira: defaultChair,
            nomeDocente: defaultTeacher,
          };
        }
        return prev;
      });
    }
  }, [
    formData.curso,
    formData.nivel,
    formData.semestre,
    formData.nomeCadeira,
    dbColaboradores,
    allAllocations,
    service,
    visitorType,
  ]);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string | null>>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setter(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEstudante = visitorType === "Estudante";

    if (isEstudante) {
      if (isReposicaoTeste && (!receitaFile || !talaoFile)) {
        alert(
          "Por favor, anexe a Receita/Justificativo e o Talão de Depósito para prosseguir com o pedido.",
        );
        return;
      }
      if (isCertificadoOuCadeirasFeitas && !talaoFile) {
        alert(
          "Por favor, anexe o Talão de Depósito (comprovativo de pagamento) para prosseguir com o pedido.",
        );
        return;
      }

      const filesToVerify = [receitaFile, talaoFile].filter(
        Boolean,
      ) as string[];
      if (filesToVerify.length > 0) {
        setVerifying(true);
        try {
          const res = await fetch("/api/verify-documents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: safeJSONStringify({
              motivo: formData.descricao,
              isBase64Images: filesToVerify,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            setAiVerification(data);
          }
        } catch (err) {
          console.error("Verificação IA falhou", err);
        }
        setVerifying(false);
      } else {
        setAiVerification(null);
      }
      setPreviewMode(true);
    } else {
      handleSubmit(e);
    }
  };

  const generateTrackingCode = (
    nome: string,
    curso: string,
    nivel: string,
    assunto: string,
    isEstudante: boolean,
  ) => {
    const date = new Date();
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();

    const getInitials = (str: string) =>
      str
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 3);

    const assuntoFormatado = assunto
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase();

    if (isEstudante) {
      const nomeInitials = getInitials(nome) || "Est";
      const cursoInitials = getInitials(curso) || "Cur";
      const nivelFormatado = nivel
        ? nivel.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
        : "Nivel";
      return `${nomeInitials}-${cursoInitials}-${d}${m}${y}-${nivelFormatado}/${assuntoFormatado}`;
    } else {
      const depInitials = getInitials(curso) || "Dep";
      return `COLAB-${depInitials}-${d}${m}${y}-${assuntoFormatado}`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isEstudante = visitorType === "Estudante";

    if (isEstudante) {
      if (isReposicaoTeste && (!receitaFile || !talaoFile)) {
        alert(
          "Por favor, anexe a Receita/Justificativo e o Talão de Depósito para prosseguir com o pedido.",
        );
        return;
      }
      if (isCertificadoOuCadeirasFeitas && !talaoFile) {
        alert(
          "Por favor, anexe o Talão de Depósito (comprovativo de pagamento) para prosseguir com o pedido.",
        );
        return;
      }
    }

    const requerimentoText = isEstudante
      ? getFullPetitionText(service, formData)
      : formData.descricao;

    const code = generateTrackingCode(
      formData.nome,
      formData.curso,
      formData.nivel,
      service,
      isEstudante,
    );
    setTrackingCode(code);

    const newRequest: ServiceRequest = {
      id: Math.random().toString(36).substr(2, 9),
      trackingCode: code,
      visitorType,
      service,
      nome: formData.nome,
      curso: formData.curso,
      nivel: formData.nivel,
      descricao: requerimentoText,
      status: isEstudante ? "Na Secretaria Geral" : "Submetido",
      numeroTeste: isReposicaoTeste ? formData.numeroTeste : undefined,
      nomeCadeira: isReposicaoTeste ? formData.nomeCadeira : undefined,
      nomeDocente: isReposicaoTeste ? formData.nomeDocente : undefined,
      periodo: isEstudante ? formData.periodo : undefined,
      semestre: isEstudante ? formData.semestre : undefined,
      history: [
        {
          stage: "Submetido",
          date: new Date().toISOString(),
          parecer: isEstudante
            ? "Pedido submetido com sucesso e encaminhado à Secretaria Geral."
            : "Pedido submetido com sucesso.",
          author: formData.nome,
        },
      ],
      createdAt: new Date().toISOString(),
    };

    if (isEstudante && printRef.current) {
      setGeneratingPdf(true);
      try {
        const docTitle = service.replace(/\s+/g, "_");
        const opt = {
          margin: [20, 20, 20, 20] as [number, number, number, number],
          filename: `Pedido_${docTitle}_${formData.nome.replace(/\s+/g, "_")}.pdf`,
          image: { type: "jpeg" as const, quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
        };

        // Wait a slight tick for UI update if needed
        await new Promise((r) => setTimeout(r, 100));
        await html2pdf().set(opt).from(printRef.current).save();
      } catch (error) {
        console.error("Erro ao gerar PDF:", error);
      } finally {
        setGeneratingPdf(false);
      }
    }

    onSubmit(newRequest);
    setSuccess(true);
    clearDraft();
  };

  if (success) {
    return (
      <div
        className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4"
        id="success_request_screen"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center"
        >
          <CheckCircle2 className="text-green-500 w-20 h-20 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Pedido Submetido!
          </h2>
          <p className="text-gray-600 mb-6">
            O seu pedido foi encaminhado para a Secretaria Geral.
          </p>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
            <p className="text-sm text-gray-500 font-bold mb-2">
              Código de Rastreio
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-xl font-mono font-bold text-blue-900">
                {trackingCode}
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(trackingCode)}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                title="Copiar código"
              >
                <Copy size={20} />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Guarde este código para consultar o estado do seu pedido.
            </p>
          </div>

          {visitorType === "Estudante" && !isSemAnexos && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-left mb-6">
              <h4 className="font-bold text-amber-950 text-xs flex items-center gap-2 mb-1">
                <AlertTriangle className="text-amber-600 shrink-0" size={16} />
                Aviso de Documentação Obrigatória:
              </h4>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                Ao dirigir-se à Secretaria Geral ou à{" "}
                <strong>sala de realização do teste</strong>, o estudante{" "}
                <strong>
                  deve, obrigatoriamente, ser portador dos anexos/comprovativos
                  originais físicos
                </strong>{" "}
                anexados a esta solicitação (por ex.,{" "}
                {isReposicaoTeste
                  ? "receita médica original e talão de depósito original"
                  : "talão de depósito em formato físico"}
                ).
              </p>
            </div>
          )}

          <button
            onClick={onBack}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
          >
            Voltar ao Início
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-hidden relative">
      <DraftModal
        show={showDraftModal}
        onRecover={recoverDraft}
        onDiscard={discardDraft}
      />

      <SyncIndicator
        isSyncing={isSyncing}
        className="absolute top-20 right-4 z-50"
      />

      <header
        className="flex-none bg-[#e67e22] text-white p-4 md:p-6 flex items-center gap-4 shadow-md z-10"
        id="request_form_header"
      >
        <button
          onClick={onBack}
          className="p-2 hover:bg-white/20 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg md:text-xl font-bold tracking-wider truncate">
          Solicitação de Serviço
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
        <div className="max-w-2xl mx-auto pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
          >
            <div className="p-8 bg-orange-50 border-b border-orange-100">
              <h2 className="text-2xl font-bold text-orange-900">{service}</h2>
              <p className="text-orange-700 mt-1">
                Preencha os dados abaixo para submeter o seu pedido.
              </p>
            </div>

            <form
              onSubmit={previewMode ? handleSubmit : handlePreview}
              className="p-8 space-y-6"
            >
              {previewMode && visitorType === "Estudante" ? (
                <div className="space-y-6" id="student_preview_mode_fields">
                  {aiVerification && (
                    <div
                      className={`p-4 rounded-xl border ${aiVerification.valido ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}
                    >
                      <h4 className="font-bold mb-2 flex items-center gap-2">
                        {aiVerification.valido ? (
                          <CheckCircle size={18} />
                        ) : (
                          <AlertTriangle size={18} />
                        )}
                        Auditoria do Sistema (Autenticidade e Motivo)
                      </h4>
                      <p className="text-sm opacity-90 leading-relaxed">
                        {aiVerification.analise}
                      </p>
                      {!aiVerification.valido && (
                        <p className="text-sm font-semibold mt-4 text-red-900 border-t border-red-200 pt-2">
                          Nota: O seu pedido pode ser rejeitado caso submeta com
                          informações inconsistentes.
                        </p>
                      )}
                    </div>
                  )}
                  <div className="bg-gray-100 p-4 rounded-xl border border-gray-300 max-h-[60vh] overflow-y-auto">
                    <div
                      className="print-preview"
                      style={{
                        backgroundColor: "white",
                        color: "black",
                        padding: "40px",
                        fontFamily: "Times New Roman, serif",
                        fontSize: "12pt",
                        lineHeight: "1.6",
                        width: "100%",
                        maxWidth: "800px",
                        margin: "0 auto",
                      }}
                    >
                      <div
                        style={{
                          textAlign: "left",
                          marginBottom: "40px",
                          fontWeight: "bold",
                        }}
                      >
                        Exmo. Senhor Director do Curso de Engenharia{" "}
                        {formData.curso || "(nome do curso)"} do Instituto
                        Superior Politécnico de Songo
                        <br />
                        =Songo=
                      </div>
                      <div
                        style={{ textAlign: "justify", marginBottom: "60px" }}
                      >
                        <span style={{ fontWeight: "bold" }}>
                          {formData.nome || "(nome do estudante)"}
                        </span>
                        , de nacionalidade{" "}
                        {formData.nacionalidade || "Moçambicana"}, nascido aos{" "}
                        {formatEuropeanDate(formData.dataNascimento) ||
                          "___/___/___"}
                        , filho de {formData.nomePai || "(nome do pai)"} e{" "}
                        {formData.nomeMae || "(nome da mãe)"}, Portador de B.I.
                        nº {formData.numeroBI || "(número de BI)"}, emitido pêlo
                        Arquivo de Identificação Civil da{" "}
                        {formData.localEmissaoBI || "(província)"}, aos{" "}
                        {formatEuropeanDate(formData.dataEmissaoBI) ||
                          "___/___/___"}
                        , estudante do Curso de Licenciatura em{" "}
                        {formData.curso || "(nome do curso)"}, período{" "}
                        {formData.periodo || "Laboral"}, inscrito sob o número{" "}
                        {formData.numeroEstudante || "(número)"},{" "}
                        {formData.nivel || "(nível)"} Nível,{" "}
                        {formData.semestre || "(semestre)"}, com o contacto
                        telefónico número{" "}
                        {formData.contactoTelefonico || "(contacto)"}, vem mui
                        respeitosamente rogar a V. Excia se digne{" "}
                        {getCustomPetitionBodyAndRequestType(service, formData)}
                        , pelo que
                      </div>
                      <div
                        style={{
                          textAlign: "center",
                          marginBottom: "40px",
                          fontWeight: "bold",
                        }}
                      >
                        Pede Deferimento
                      </div>
                      <div
                        style={{ textAlign: "center", marginBottom: "80px" }}
                      >
                        Songo,{" "}
                        {new Date().toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                      <div style={{ textAlign: "center", marginTop: "60px" }}>
                        _________________________________________________
                        <br />({formData.nome || "(nome completo do Estudante)"}
                        )
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setPreviewMode(false)}
                      className="flex-1 py-4 bg-gray-200 text-gray-800 rounded-2xl font-bold hover:bg-gray-300 transition-colors"
                    >
                      Voltar para Editar
                    </button>
                    <button
                      type="submit"
                      disabled={generatingPdf}
                      className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-orange-700 transition-colors disabled:opacity-50"
                    >
                      {generatingPdf ? (
                        <>
                          <Loader2 size={24} className="animate-spin" /> Gerando
                          PDF...
                        </>
                      ) : (
                        <>
                          <Send size={24} /> Confirmar e Enviar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : visitorType === "Estudante" ? (
                <>
                  {/* Painel de Identificação do Utilizador Logado e Auto-Preenchimento */}
                  <div className="md:col-span-2 mb-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center font-black text-sm">
                          ID
                        </div>
                        <div>
                          <h4 className="text-xs font-black  text-blue-950 tracking-wider">
                            Identificação do Requerente (Utilizador Logado)
                          </h4>
                          <p className="text-xs text-slate-600 font-medium">
                            {activeUser
                              ? `${activeUser.nome || activeUser.name || activeUser.fullName || "Utilizador Logado"} ${activeUser.numeroEstudante ? `• Nº ${activeUser.numeroEstudante}` : ""}`
                              : "Detetando utilizador logado..."}
                          </p>
                        </div>
                      </div>
                      {activeUser && (
                        <button
                          type="button"
                          onClick={() => fillFormWithUser(activeUser)}
                          className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                        >
                          Auto-Preencher Meus Dados
                        </button>
                      )}
                    </div>

                    {detectedStatus && (
                      <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                        {detectedStatus}
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
                        Pesquisar Identificação:
                      </span>
                      <input
                        type="text"
                        placeholder="Insira Nº Estudante, B.I., NUIT ou Nome para preencher..."
                        className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => handleSearchIdentification(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-bold text-gray-700">
                        A Sua Excelência Senhor Director do Curso de:
                      </label>
                      <select
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        value={formData.curso}
                        onChange={(e) =>
                          setFormData({ ...formData, curso: e.target.value })
                        }
                      >
                        <option value="">Selecione o curso</option>
                        {allCourses.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">
                        Nome Completo do Estudante
                      </label>
                      <input
                        required
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        value={formData.nome}
                        onChange={(e) =>
                          setFormData({ ...formData, nome: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">
                        Nacionalidade
                      </label>
                      <input
                        required
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        value={formData.nacionalidade}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            nacionalidade: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">
                        Data de Nascimento
                      </label>
                      <input
                        required
                        type="date"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        value={formData.dataNascimento}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dataNascimento: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">
                        Filho de
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="Nome do pai"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        value={formData.nomePai}
                        onChange={(e) =>
                          setFormData({ ...formData, nomePai: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">
                        E de
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="Nome da mãe"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        value={formData.nomeMae}
                        onChange={(e) =>
                          setFormData({ ...formData, nomeMae: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">
                        Número de BI
                      </label>
                      <input
                        required
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        value={formData.numeroBI}
                        onChange={(e) =>
                          setFormData({ ...formData, numeroBI: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">
                        Local de Emissão (BI)
                      </label>
                      <input
                        required
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        value={formData.localEmissaoBI}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            localEmissaoBI: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">
                        Data de Emissão (BI)
                      </label>
                      <input
                        required
                        type="date"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        value={formData.dataEmissaoBI}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dataEmissaoBI: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">
                        Número de Inscrição/Estudante
                      </label>
                      <input
                        required
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        value={formData.numeroEstudante}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            numeroEstudante: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">
                        Período
                      </label>
                      <select
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        value={formData.periodo}
                        onChange={(e) =>
                          setFormData({ ...formData, periodo: e.target.value })
                        }
                      >
                        <option value="Laboral">Laboral</option>
                        <option value="Pós-Laboral">Pós-Laboral</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">
                        Nível Frequentado
                      </label>
                      <select
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        value={formData.nivel}
                        onChange={(e) =>
                          setFormData({ ...formData, nivel: e.target.value })
                        }
                      >
                        {Object.keys(
                          CADEIRAS_MAPPING[formData.curso] || {},
                        ).map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">
                        Semestre
                      </label>
                      <select
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        value={formData.semestre}
                        onChange={(e) =>
                          setFormData({ ...formData, semestre: e.target.value })
                        }
                      >
                        <option value="1º Semestre">1º Semestre</option>
                        <option value="2º Semestre">2º Semestre</option>
                      </select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-bold text-gray-700">
                        Contacto Telefónico
                      </label>
                      <input
                        required
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        value={formData.contactoTelefonico}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contactoTelefonico: e.target.value,
                          })
                        }
                      />
                    </div>

                    {service ===
                      "Pedido de realização de reposição de teste" && (
                      <>
                        <div className="space-y-2 md:col-span-2 pt-4 border-t border-gray-100">
                          <label className="block text-sm font-bold text-gray-700 mb-1">
                            Autorização da realização do Teste n°
                          </label>
                          <input
                            required
                            type="text"
                            placeholder="Número do teste (ex: 2)"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                            value={formData.numeroTeste}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                numeroTeste: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">
                            Cadeira
                          </label>
                          <select
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                            value={formData.nomeCadeira}
                            onChange={(e) => {
                              const val = e.target.value;
                              const teachers = getDocentesForCadeira(val);
                              setFormData({
                                ...formData,
                                nomeCadeira: val,
                                nomeDocente: teachers[0] || "",
                              });
                            }}
                          >
                            <option value="">Selecione a cadeira</option>
                            {(
                              CADEIRAS_MAPPING[formData.curso]?.[
                                formData.nivel
                              ]?.[formData.semestre] || []
                            ).map((chair) => (
                              <option key={chair} value={chair}>
                                {chair}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">
                            Docente
                          </label>
                          <select
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                            value={formData.nomeDocente}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                nomeDocente: e.target.value,
                              })
                            }
                          >
                            <option value="">Selecione o docente</option>
                            {getDocentesForCadeira(formData.nomeCadeira).map(
                              (doc) => (
                                <option key={doc} value={doc}>
                                  {doc}
                                </option>
                              ),
                            )}
                          </select>
                        </div>
                      </>
                    )}

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-bold text-gray-700">
                        Motivos do Pedido / Descrição
                      </label>
                      <textarea
                        required
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none"
                        value={formData.descricao}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            descricao: e.target.value,
                          })
                        }
                      />
                    </div>

                    {!isSemAnexos && (
                      <div
                        className="space-y-4 md:col-span-2 pt-4 border-t border-gray-100"
                        id="student_attachments_block"
                      >
                        <h3 className="font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                          <Paperclip size={18} className="text-orange-600" />
                          Anexos Requeridos{" "}
                          {isReposicaoTeste
                            ? "(Obrigatórios)"
                            : "(Talão de Depósito Obrigatório)"}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {isReposicaoTeste && (
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <Paperclip
                                  size={16}
                                  className="text-orange-600"
                                />
                                Receita / Justificativo Médico
                              </label>
                              <input
                                required
                                type="file"
                                accept="image/*"
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 transition-all cursor-pointer"
                                onChange={(e) =>
                                  handleFileChange(e, setReceitaFile)
                                }
                              />
                            </div>
                          )}

                          <div
                            className={`space-y-2 ${isReposicaoTeste ? "" : "md:col-span-2"}`}
                          >
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                              <Paperclip
                                size={16}
                                className="text-orange-600"
                              />
                              Talão de Depósito
                            </label>
                            <input
                              required
                              type="file"
                              accept="image/*"
                              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 transition-all cursor-pointer"
                              onChange={(e) =>
                                handleFileChange(e, setTalaoFile)
                              }
                            />
                          </div>
                        </div>

                        {/* Reminder alert block */}
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 items-start mt-4">
                          <AlertTriangle
                            className="text-amber-600 shrink-0 mt-0.5"
                            size={20}
                          />
                          <div>
                            <h4 className="font-bold text-amber-950 text-xs">
                              Aviso ao Estudante sobre Provas e Comprovativos
                            </h4>
                            <p className="text-[11px] text-amber-900 leading-relaxed mt-1">
                              Ao deslocar-se para a sala de realização do teste
                              ou à Secretaria do Songo, o estudante{" "}
                              <strong>
                                deve vir obrigatoriamente munido dos
                                comprovativos e anexos físicos originais
                              </strong>{" "}
                              submetidos neste requerimento eletrónico.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {isSemAnexos && (
                      <div className="md:col-span-2 bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex gap-3 items-center mt-4">
                        <HelpCircle
                          className="text-blue-500 shrink-0"
                          size={20}
                        />
                        <p className="text-xs text-blue-800 font-medium">
                          Este tipo de requerimento eletrónico{" "}
                          <strong>
                            não necessita de anexos ou comprovativos de depósito
                          </strong>
                          .
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">
                      Nome Completo
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                      value={formData.nome}
                      onChange={(e) =>
                        setFormData({ ...formData, nome: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">
                      Curso / Departamento
                    </label>
                    <select
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                      value={formData.curso}
                      onChange={(e) =>
                        setFormData({ ...formData, curso: e.target.value })
                      }
                    >
                      <option value="">Selecione o curso</option>
                      {allCourses.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {visitorType === "Estudante" && (
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">
                        Nível Frequentado (Ano)
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="Ex: 3º Ano"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        value={formData.nivel}
                        onChange={(e) =>
                          setFormData({ ...formData, nivel: e.target.value })
                        }
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">
                      Descrição / Detalhes do Pedido
                    </label>
                    <textarea
                      required
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none"
                      value={formData.descricao}
                      onChange={(e) =>
                        setFormData({ ...formData, descricao: e.target.value })
                      }
                    />
                  </div>
                </>
              )}

              {!previewMode && (
                <button
                  type="submit"
                  disabled={generatingPdf || verifying}
                  className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingPdf || verifying ? (
                    <>
                      <Loader2 size={24} className="animate-spin" />
                      {verifying
                        ? "A Auditar Documentos (IA)..."
                        : "Gerando PDF e Submetendo..."}
                    </>
                  ) : (
                    <>
                      <Send size={24} />
                      {service ===
                        "Pedido de realização de reposição de teste" &&
                      visitorType === "Estudante"
                        ? "Visualizar e Auditar Documento"
                        : "Submeter Pedido"}
                    </>
                  )}
                </button>
              )}
            </form>
          </motion.div>
        </div>
      </main>

      {/* Hidden element for PDF internal generation */}
      <div
        style={{
          position: "absolute",
          top: "-10000px",
          left: "-10000px",
          width: "800px",
          overflow: "hidden",
        }}
      >
        <div
          ref={printRef}
          className="print-container"
          style={{
            width: "800px",
            backgroundColor: "white",
            color: "black",
            padding: "40px",
            fontFamily: "Times New Roman, serif",
            fontSize: "14pt",
            lineHeight: "1.6",
          }}
        >
          <div
            style={{
              textAlign: "left",
              marginBottom: "40px",
              fontWeight: "bold",
            }}
          >
            Exmo. Senhor Director do Curso de Engenharia{" "}
            {formData.curso || "(nome do curso)"} do Instituto Superior
            Politécnico de Songo
            <br />
            =Songo=
          </div>

          <div style={{ textAlign: "justify", marginBottom: "60px" }}>
            <span style={{ fontWeight: "bold" }}>
              {formData.nome || "(nome do estudante)"}
            </span>
            , de nacionalidade {formData.nacionalidade || "Moçambicana"},
            nascido aos{" "}
            {formatEuropeanDate(formData.dataNascimento) || "___/___/___"},
            filho de {formData.nomePai || "(nome do pai)"} e{" "}
            {formData.nomeMae || "(nome da mãe)"}, Portador de B.I. nº{" "}
            {formData.numeroBI || "(número de BI)"}, emitido pêlo Arquivo de
            Identificação Civil da {formData.localEmissaoBI || "(província)"},
            aos {formatEuropeanDate(formData.dataEmissaoBI) || "___/___/___"},
            estudante do Curso de Licenciatura em{" "}
            {formData.curso || "(nome do curso)"}, período{" "}
            {formData.periodo || "Laboral"}, inscrito sob o número{" "}
            {formData.numeroEstudante || "(número)"},{" "}
            {formData.nivel || "(nível)"} Nível,{" "}
            {formData.semestre || "(semestre)"}, com o contacto telefónico
            número {formData.contactoTelefonico || "(contacto)"}, vem mui
            respeitosamente rogar a V. Excia se digne autorizar a realização do
            teste {formData.numeroTeste || "(número do teste)"} de reposição, da
            Cadeira de {formData.nomeCadeira || "(nome da cadeira)"}, do docente{" "}
            {formData.nomeDocente || "(nome do docente)"}, por motivos de{" "}
            {formData.descricao || "(motivos)"}, pelo que
          </div>

          <div
            style={{
              textAlign: "center",
              marginBottom: "40px",
              fontWeight: "bold",
            }}
          >
            Pede Deferimento
          </div>

          <div style={{ textAlign: "center", marginBottom: "80px" }}>
            Songo,{" "}
            {new Date().toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </div>

          <div style={{ textAlign: "center", marginTop: "60px" }}>
            _________________________________________________
            <br />({formData.nome || "(nome completo do Estudante)"})
          </div>

          {/* Anexos */}
          {receitaFile && (
            <div style={{ pageBreakBefore: "always", paddingTop: "40px" }}>
              <h2
                style={{
                  textAlign: "center",
                  marginBottom: "20px",
                  fontSize: "18pt",
                  fontWeight: "bold",
                }}
              >
                Anexo: Receita / Justificativo Médico
              </h2>
              <img
                src={receitaFile}
                style={{
                  maxWidth: "100%",
                  maxHeight: "900px",
                  display: "block",
                  margin: "0 auto",
                }}
                alt="Receita Medica"
              />
            </div>
          )}

          {talaoFile && (
            <div style={{ pageBreakBefore: "always", paddingTop: "40px" }}>
              <h2
                style={{
                  textAlign: "center",
                  marginBottom: "20px",
                  fontSize: "18pt",
                  fontWeight: "bold",
                }}
              >
                Anexo: Talão de Depósito
              </h2>
              <img
                src={talaoFile}
                style={{
                  maxWidth: "100%",
                  maxHeight: "900px",
                  display: "block",
                  margin: "0 auto",
                }}
                alt="Talao Deposito"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

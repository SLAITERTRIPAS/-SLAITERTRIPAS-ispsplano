import { printElementById } from "../../lib/printUtils";
import React, { useState, useEffect, useMemo } from "react";
import {
  Save,
  Printer,
  ArrowLeft,
  CheckCircle,
  CheckCircle2,
  PenTool,
  RotateCcw,
  Sparkles,
  FileText,
  Send,
  UserCheck,
  Building2,
  ArrowRight,
  Layers,
  Clock,
  Check,
  X,
  Search,
  Users,
  ChevronRight,
  AlertCircle,
  Filter,
  ShieldCheck,
  Calendar,
  Briefcase,
  HelpCircle
} from "lucide-react";
import { firestoreService } from "../../lib/firestoreService";
import AssinaturaDigitalPad from "../../components/AssinaturaDigitalPad";
import DocumentFooter from "../../components/shared/DocumentFooter";
import {
  buscarColaboradoresEfetivo,
  buscarChefeMaximoDepartamento,
  buscarChefePorAfetacao,
  buscarDiretorGeral,
} from "../../lib/responsaveisService";
import { Colaborador } from "../../types";
import { EFETIVO_GERAL_DATA } from "../../constants/colaboradoresList";

// Lista oficial completa de setores e departamentos da instituição
const SETORES_COMPETENCIAS_LISTA = [
  {
    id: "DRH",
    nome: "Departamento de Recursos Humanos (DRH)",
    sigla: "DRH",
    descricao: "Competência primária para efectividade, justificações de faltas, licenças, dispensas e aplicação do EGFAE.",
    recomendado: true,
    icone: "👥",
    responsavelPadrao: "Chefe do Departamento de Recursos Humanos",
  },
  {
    id: "GDG",
    nome: "Gabinete do Diretor-Geral (Direção Geral)",
    sigla: "GDG",
    descricao: "Despacho superior, homologação, decisões institucionais e direção máxima.",
    recomendado: false,
    icone: "🏛️",
    responsavelPadrao: "Prof. António Cristo Pinto Madeira (Diretor-Geral)",
  },
  {
    id: "SG",
    nome: "Secretaria Geral (Protocolo Central & Registo Geral)",
    sigla: "SG",
    descricao: "Entrada, registo, expedição e arquivo central de documentos institucionais.",
    recomendado: false,
    icone: "📬",
    responsavelPadrao: "Chefe da Secretaria Geral",
  },
  {
    id: "DPEP",
    nome: "Departamento de Planificação e Estudos Pedagógicos (DPEP)",
    sigla: "DPEP",
    descricao: "Planificação institucional, monitoria estatística e assuntos pedagógicos.",
    recomendado: false,
    icone: "📊",
    responsavelPadrao: "Chefe do DPEP",
  },
  {
    id: "DAF",
    nome: "Departamento de Administração e Finanças (DAF)",
    sigla: "DAF",
    descricao: "Gestão orçamental, financeira, tesouraria e prestação de contas.",
    recomendado: false,
    icone: "💰",
    responsavelPadrao: "Chefe do Apoio Financeiro (DAF)",
  },
  {
    id: "DICOSAFA",
    nome: "Divisão de Construção e Manutenção / DICOSAFA",
    sigla: "DICOSAFA",
    descricao: "Infraestruturas, manutenção de instalações, equipamentos e assuntos sociais.",
    recomendado: false,
    icone: "🏗️",
    responsavelPadrao: "Director da DICOSAFA",
  },
  {
    id: "ESTG",
    nome: "Divisão de Engenharia / Direção de Cursos (ESTG / UO)",
    sigla: "ESTG",
    descricao: "Coordenação pedagógica dos cursos de Engenharia, docentes e turmas.",
    recomendado: false,
    icone: "🎓",
    responsavelPadrao: "Director da Divisão de Engenharia",
  },
  {
    id: "PATRIMONIO",
    nome: "Repartição de Património",
    sigla: "PATRIMONIO",
    descricao: "Inventário de bens móveis e imóveis, controlo patrimonial e alocações.",
    recomendado: false,
    icone: "📦",
    responsavelPadrao: "Chefe da Repartição de Património",
  },
  {
    id: "TRANSPORTE",
    nome: "Repartição de Transporte",
    sigla: "TRANSPORTE",
    descricao: "Gestão da frota automóvel, requisições de viaturas e deslocações.",
    recomendado: false,
    icone: "🚗",
    responsavelPadrao: "Chefe da Repartição de Transporte",
  },
  {
    id: "DRA",
    nome: "Repartição de Registo Académico (DRA)",
    sigla: "DRA",
    descricao: "Registo académico de estudantes, pautas, certificados e matrículas.",
    recomendado: false,
    icone: "📋",
    responsavelPadrao: "Chefe do Registo Académico",
  },
  {
    id: "BIBLIOTECA",
    nome: "Biblioteca Central & Centro de Recursos",
    sigla: "BIBLIOTECA",
    descricao: "Gestão documental, bibliográfica, apoio à pesquisa e acervo técnico.",
    recomendado: false,
    icone: "📚",
    responsavelPadrao: "Responsável da Biblioteca",
  },
  {
    id: "ACAO_SOCIAL",
    nome: "Serviços de Ação Social e Saúde Escolar",
    sigla: "SASS",
    descricao: "Assistência social a estudantes e funcionários, enfermaria e residências.",
    recomendado: false,
    icone: "🏥",
    responsavelPadrao: "Responsável da Ação Social",
  },
  {
    id: "RP_COOPERACAO",
    nome: "Gabinete de Relações Públicas e Cooperação",
    sigla: "GRPC",
    descricao: "Comunicação institucional, imprensa, relações externas e convénios.",
    recomendado: false,
    icone: "🌐",
    responsavelPadrao: "Responsável de Relações Públicas",
  },
];

interface JustificacaoFaltaDispensaFormProps {
  user: any;
  onCancel: () => void;
  tipoInicial?: "dispensa" | "justificacao" | "ambos";
}

export default function JustificacaoFaltaDispensaForm({
  user,
  onCancel,
  tipoInicial = "dispensa",
}: JustificacaoFaltaDispensaFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);

  // Modais
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [currentSignatureTarget, setCurrentSignatureTarget] = useState<
    "funcionario" | "chefe" | "rh" | "despacho"
  >("funcionario");

  const [showSendToBossModal, setShowSendToBossModal] = useState(false);
  const [showSendToSectorModal, setShowSendToSectorModal] = useState(false);

  // Lista de Colaboradores e Chefes
  const [colaboradoresList, setColaboradoresList] = useState<Colaborador[]>(EFETIVO_GERAL_DATA);
  const [termoPesquisaChefe, setTermoPesquisaChefe] = useState("");
  const [chefeSelecionado, setChefeSelecionado] = useState<Colaborador | null>(null);
  const [observacaoEnvioChefe, setObservacaoEnvioChefe] = useState("");

  // Setores de competências
  const [termoPesquisaSetor, setTermoPesquisaSetor] = useState("");
  const [setorSelecionado, setSetorSelecionado] = useState<string>("DRH");
  const [responsavelSetorDestino, setResponsavelSetorDestino] = useState<string>(
    "Departamento de Recursos Humanos (DRH)"
  );
  const [despachoChefeEnvio, setDespachoChefeEnvio] = useState("Favorável. Encaminha-se ao setor competente para os devidos efeitos legais nos termos do EGFAE.");

  const hoje = new Date();
  const hojeFormatado = hoje.toISOString().split("T")[0];
  const anoAtual = hoje.getFullYear().toString();

  // Tipo de modalidade ativo: "justificacao" | "dispensa" | "ambos"
  const [tipoModalidade, setTipoModalidade] = useState<"dispensa" | "justificacao" | "ambos">(
    tipoInicial
  );

  // Sincronizar caso o tipoInicial mude
  useEffect(() => {
    if (tipoInicial) {
      setTipoModalidade(tipoInicial);
    }
  }, [tipoInicial]);

  // Carregar colaboradores para seleção de chefes e destinatários
  useEffect(() => {
    buscarColaboradoresEfetivo().then((data) => {
      if (data && data.length > 0) {
        setColaboradoresList(data);
      }
    });
  }, []);

  // Dados do formulário
  const [formData, setFormData] = useState({
    // Identificação do Funcionário
    nomeCompleto: user?.nome || user?.name || "",
    categoriaCarreira: user?.cargo || user?.carreira || "Técnico Profissional",
    departamento: user?.departamento || user?.unidadeOrganica || "DPEP",
    reparticaoSeccao: user?.reparticao || user?.setor || "Planificação e Estatística",

    // a) Pedido de Dispensa
    dispensaDataInicio: "",
    dispensaDataFim: "",
    dispensaTotalDias: "",

    // b) Justificação de Faltas
    faltaDataInicio: "",
    faltaDataFim: "",
    faltaTotalDias: "",

    // Motivo
    motivoAusencia: "",
    motivoDetalhado: "",

    // Data e Assinatura do Funcionário
    dataAssinaturaFuncionario: hojeFormatado,
    assinaturaFuncionario: user?.signature || "",
    assinaturaFuncionarioNome: user?.nome || user?.name || "",

    // Coluna 1: Parecer do Chefe Hierárquico
    parecerChefeTexto: "",
    parecerChefeDecisao: "favoravel" as "favoravel" | "desfavoravel" | "outro",
    parecerChefeData: "",
    parecerChefeAssinatura: "",
    parecerChefeNome: "",
    parecerChefeCargo: "",

    // Coluna 2: Informação do DRH
    rhAceitar: "" as "sim" | "nao" | "",
    rhArtigo99a: false, // Doença
    rhArtigo99e: false, // Casamento
    rhArtigo99f: false, // Luto
    rhArtigo100_1: false, // Acompanhamento por doença
    rhArtigo101_1: false, // Dispensa
    rhDescontarFerias: "" as "sim" | "nao" | "",
    rhOutraLegislacaoCheck: false,
    rhOutraLegislacaoTexto: "",
    rhData: "",
    rhAssinatura: "",
    rhNome: "",

    // Coluna 3: Despacho Direção Geral
    despachoTexto: "",
    despachoData: "",
    despachoAssinatura: "",
    despachoNome: "",
  });

  // Identificar automaticamente o Chefe provável do departamento do utilizador
  useEffect(() => {
    if (colaboradoresList.length > 0) {
      const deptoUser = formData.departamento || user?.departamento || "DPEP";
      const chefeProvavel = buscarChefeMaximoDepartamento(colaboradoresList, deptoUser, user);
      if (chefeProvavel && !chefeSelecionado) {
        setChefeSelecionado(chefeProvavel);
      }
    }
  }, [colaboradoresList, formData.departamento, user]);

  // Lista de chefes filtrada para seleção
  const listaChefesFiltrada = useMemo(() => {
    const termo = termoPesquisaChefe.toLowerCase().trim();
    return colaboradoresList.filter((c) => {
      const cargo = (c.cargo || "").toLowerCase();
      const cargoChefia = (c.cargoChefia || "").toLowerCase();
      const nome = (c.nome || "").toLowerCase();
      const depto = (c.departamento || c.direcao || "").toLowerCase();

      const isChefe =
        c.isChefia === true ||
        cargo.includes("chefe") ||
        cargo.includes("director") ||
        cargo.includes("diretor") ||
        cargo.includes("coordenador") ||
        cargo.includes("responsável") ||
        cargoChefia.length > 0;

      if (!isChefe) return false;

      if (!termo) return true;
      return (
        nome.includes(termo) ||
        cargo.includes(termo) ||
        cargoChefia.includes(termo) ||
        depto.includes(termo)
      );
    });
  }, [colaboradoresList, termoPesquisaChefe]);

  // Lista de setores filtrada
  const setoresFiltrados = useMemo(() => {
    const termo = termoPesquisaSetor.toLowerCase().trim();
    if (!termo) return SETORES_COMPETENCIAS_LISTA;
    return SETORES_COMPETENCIAS_LISTA.filter(
      (s) =>
        s.nome.toLowerCase().includes(termo) ||
        s.sigla.toLowerCase().includes(termo) ||
        s.descricao.toLowerCase().includes(termo)
    );
  }, [termoPesquisaSetor]);

  // Cálculo automático de dias
  const calcularDias = (inicio: string, fim: string) => {
    if (!inicio || !fim) return "";
    const d1 = new Date(inicio);
    const d2 = new Date(fim);
    const diffTime = d2.getTime() - d1.getTime();
    if (diffTime < 0) return "0";
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays.toString();
  };

  const handleDispensaInicioChange = (val: string) => {
    setFormData((prev) => {
      const fim = prev.dispensaDataFim || val;
      const total = calcularDias(val, fim);
      return {
        ...prev,
        dispensaDataInicio: val,
        dispensaDataFim: prev.dispensaDataFim ? prev.dispensaDataFim : val,
        dispensaTotalDias: total,
      };
    });
  };

  const handleDispensaFimChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      dispensaDataFim: val,
      dispensaTotalDias: calcularDias(prev.dispensaDataInicio, val),
    }));
  };

  const handleFaltaInicioChange = (val: string) => {
    setFormData((prev) => {
      const fim = prev.faltaDataFim || val;
      const total = calcularDias(val, fim);
      return {
        ...prev,
        faltaDataInicio: val,
        faltaDataFim: prev.faltaDataFim ? prev.faltaDataFim : val,
        faltaTotalDias: total,
      };
    });
  };

  const handleFaltaFimChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      faltaDataFim: val,
      faltaTotalDias: calcularDias(prev.faltaDataInicio, val),
    }));
  };

  const handlePrint = () => {
    printElementById("print-area");
  };

  const handleOpenSignature = (target: "funcionario" | "chefe" | "rh" | "despacho") => {
    setCurrentSignatureTarget(target);
    setShowSignatureModal(true);
  };

  const handleSignatureConfirmed = (signatureUrl: string) => {
    if (currentSignatureTarget === "funcionario") {
      setFormData((prev) => ({
        ...prev,
        assinaturaFuncionario: signatureUrl,
        dataAssinaturaFuncionario: prev.dataAssinaturaFuncionario || hojeFormatado,
        assinaturaFuncionarioNome: prev.nomeCompleto || user?.nome || "Funcionário(a)",
      }));
    } else if (currentSignatureTarget === "chefe") {
      setFormData((prev) => ({
        ...prev,
        parecerChefeAssinatura: signatureUrl,
        parecerChefeData: prev.parecerChefeData || hojeFormatado,
        parecerChefeNome: chefeSelecionado?.nome || user?.nome || "Chefe Hierárquico",
        parecerChefeCargo: chefeSelecionado?.cargo || user?.cargo || "Chefe de Departamento",
      }));
    } else if (currentSignatureTarget === "rh") {
      setFormData((prev) => ({
        ...prev,
        rhAssinatura: signatureUrl,
        rhData: prev.rhData || hojeFormatado,
        rhNome: user?.nome || "Responsável DRH",
      }));
    } else if (currentSignatureTarget === "despacho") {
      setFormData((prev) => ({
        ...prev,
        despachoAssinatura: signatureUrl,
        despachoData: prev.despachoData || hojeFormatado,
        despachoNome: user?.nome || "Direção Geral",
      }));
    }
    setShowSignatureModal(false);
  };

  // Validar preenchimento antes de submeter
  const validarFormulario = () => {
    if (!formData.nomeCompleto.trim()) {
      alert("Por favor, preencha o Nome Completo do funcionário.");
      return false;
    }

    if (tipoModalidade === "justificacao") {
      if (!formData.faltaDataInicio) {
        alert("Por favor, informe a data inicial da falta.");
        return false;
      }
    } else if (tipoModalidade === "dispensa") {
      if (!formData.dispensaDataInicio) {
        alert("Por favor, informe a data inicial da dispensa.");
        return false;
      }
    } else {
      if (!formData.dispensaDataInicio && !formData.faltaDataInicio) {
        alert("Por favor, preencha pelo menos as datas de dispensa ou justificação de faltas.");
        return false;
      }
    }

    if (!formData.motivoAusencia.trim()) {
      alert("Por favor, descreva o Motivo da Ausência.");
      return false;
    }

    return true;
  };

  // Submeter ao Chefe Hierárquico (Etapa 1)
  const handleConfirmSendToBoss = async () => {
    if (!chefeSelecionado) {
      alert("Por favor, selecione o Chefe Hierárquico destinatário.");
      return;
    }

    setIsSubmitting(true);
    try {
      const trackingCode = `${tipoModalidade === "dispensa" ? "DISP" : "FALTA"}-${anoAtual}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;

      const modalidadeNome =
        tipoModalidade === "dispensa"
          ? "Pedido de Dispensa"
          : tipoModalidade === "justificacao"
          ? "Justificação de Faltas"
          : "Pedido de Dispensa / Justificação de Faltas";

      const payload = {
        ...formData,
        tipoDocumento: modalidadeNome,
        numeroRastreio: trackingCode,
        tipoModalidade,
        criadoPorId: user?.id || "anon",
        criadoPorNome: user?.nome || formData.nomeCompleto,
        criadoEm: new Date().toISOString(),
        status: "Aguardando Parecer da Chefia",
        etapaAtual: 1,
        etapaDescricao: `Em apreciação pelo Chefe Hierárquico (${chefeSelecionado.nome})`,
        chefeDestinatario: {
          id: chefeSelecionado.id,
          nome: chefeSelecionado.nome,
          cargo: chefeSelecionado.cargo || chefeSelecionado.cargoChefia || "Chefe de Departamento",
          departamento: chefeSelecionado.departamento || chefeSelecionado.direcao || "",
          email: chefeSelecionado.email || "",
        },
        observacaoEnvioChefe,
        assunto: `${modalidadeNome} - ${formData.nomeCompleto} (${formData.departamento})`,
        historico: [
          {
            data: new Date().toISOString(),
            autor: user?.nome || formData.nomeCompleto,
            cargo: formData.categoriaCarreira,
            acao: `Submissão do ${modalidadeNome}`,
            detalhes: `Enviado para assinatura do Chefe Hierárquico: ${chefeSelecionado.nome}. Motivo: ${formData.motivoAusencia}`,
          },
        ],
      };

      // Guardar na coleção de expedientes
      await firestoreService.expedientes.add(payload);

      setSubmittedData({
        ...payload,
        destinatarioFinalNome: chefeSelecionado.nome,
        destinatarioFinalCargo: chefeSelecionado.cargo || "Chefe Hierárquico",
        fase: "chefe",
      });

      setShowSendToBossModal(false);
      setIsSubmitted(true);
    } catch (error) {
      console.error("Erro ao enviar documento ao chefe:", error);
      alert("Erro ao enviar o documento. Verifique a ligação e tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Encaminhar para o Setor de Competências (Etapa 2 - Pelo Chefe)
  const handleConfirmSendToSector = async () => {
    if (!setorSelecionado) {
      alert("Por favor, selecione o Setor de Competências de destino.");
      return;
    }

    setIsSubmitting(true);
    try {
      const trackingCode =
        submittedData?.numeroRastreio ||
        `${tipoModalidade === "dispensa" ? "DISP" : "FALTA"}-${anoAtual}-${Math.floor(
          1000 + Math.random() * 9000
        )}`;

      const setorObj = SETORES_COMPETENCIAS_LISTA.find((s) => s.id === setorSelecionado);
      const nomeSetor = setorObj?.nome || setorSelecionado;

      const modalidadeNome =
        tipoModalidade === "dispensa"
          ? "Pedido de Dispensa"
          : tipoModalidade === "justificacao"
          ? "Justificação de Faltas"
          : "Pedido de Dispensa / Justificação de Faltas";

      const payload = {
        ...formData,
        parecerChefeTexto: despachoChefeEnvio || formData.parecerChefeTexto,
        parecerChefeData: formData.parecerChefeData || hojeFormatado,
        parecerChefeNome: chefeSelecionado?.nome || user?.nome || "Chefe Hierárquico",
        parecerChefeCargo: chefeSelecionado?.cargo || user?.cargo || "Chefe de Setor",
        tipoDocumento: modalidadeNome,
        numeroRastreio: trackingCode,
        tipoModalidade,
        criadoPorId: user?.id || "anon",
        criadoPorNome: user?.nome || formData.nomeCompleto,
        atualizadoEm: new Date().toISOString(),
        status: `Encaminhado para ${setorObj?.sigla || nomeSetor}`,
        etapaAtual: 2,
        etapaDescricao: `Encaminhado pela Chefia para ${nomeSetor}`,
        destinoSetorId: setorSelecionado,
        destinoSetorNome: nomeSetor,
        responsavelSetorDestino: responsavelSetorDestino || setorObj?.responsavelPadrao,
        despachoChefeEncaminhamento: despachoChefeEnvio,
        assunto: `${modalidadeNome} - ${formData.nomeCompleto} -> ${setorObj?.sigla || nomeSetor}`,
        historico: [
          ...(submittedData?.historico || [
            {
              data: new Date().toISOString(),
              autor: user?.nome || formData.nomeCompleto,
              cargo: formData.categoriaCarreira,
              acao: `Submissão do ${modalidadeNome}`,
              detalhes: `Criado por ${formData.nomeCompleto}`,
            },
          ]),
          {
            data: new Date().toISOString(),
            autor: chefeSelecionado?.nome || user?.nome || "Chefe Hierárquico",
            cargo: chefeSelecionado?.cargo || user?.cargo || "Chefe Hierárquico",
            acao: `Parecer Emitido & Encaminhamento para ${nomeSetor}`,
            detalhes: `Despacho da Chefia: ${despachoChefeEnvio}. Destino: ${nomeSetor}`,
          },
        ],
      };

      // Guardar na coleção de expedientes
      await firestoreService.expedientes.add(payload);

      setSubmittedData({
        ...payload,
        destinatarioFinalNome: nomeSetor,
        destinatarioFinalCargo: responsavelSetorDestino || setorObj?.responsavelPadrao,
        fase: "setor",
      });

      setShowSendToSectorModal(false);
      setIsSubmitted(true);
    } catch (error) {
      console.error("Erro ao encaminhar expediente:", error);
      alert("Erro ao encaminhar expediente para o setor de competências. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Salvar rascunho
  const handleSaveDraft = async () => {
    if (!formData.nomeCompleto.trim()) {
      alert("Por favor, preencha pelo menos o Nome Completo.");
      return;
    }

    setIsSubmitting(true);
    try {
      const trackingCode = `RASC-${anoAtual}-${Math.floor(1000 + Math.random() * 9000)}`;
      const payload = {
        ...formData,
        tipoDocumento: "Rascunho de Justificação / Dispensa",
        numeroRastreio: trackingCode,
        tipoModalidade,
        criadoPorId: user?.id || "anon",
        criadoPorNome: user?.nome || formData.nomeCompleto,
        criadoEm: new Date().toISOString(),
        status: "Rascunho",
        assunto: `Rascunho: ${formData.nomeCompleto} - ${tipoModalidade}`,
      };

      await firestoreService.expedientes.add(payload);
      alert(`Rascunho guardado com sucesso! Código: ${trackingCode}`);
    } catch (error) {
      console.error("Erro ao guardar rascunho:", error);
      alert("Erro ao guardar rascunho.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const preencherExemplo = () => {
    if (tipoModalidade === "justificacao") {
      setFormData((prev) => ({
        ...prev,
        nomeCompleto: prev.nomeCompleto || "Carlos Alberto Nhantumbo",
        categoriaCarreira: "Docente / Assistente Universitário",
        departamento: "Divisão de Engenharia (ESTG)",
        reparticaoSeccao: "Departamento de Engenharia Elétrica",
        faltaDataInicio: hojeFormatado,
        faltaDataFim: hojeFormatado,
        faltaTotalDias: "1",
        motivoAusencia: "Consulta médica urgente e realização de exames complementares de diagnóstico.",
        dataAssinaturaFuncionario: hojeFormatado,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        nomeCompleto: prev.nomeCompleto || "Maria João Machava",
        categoriaCarreira: "Técnico Superior Universitário N1",
        departamento: "DPEP - Planificação e Estatística",
        reparticaoSeccao: "Secção de Monitoria e Estatística",
        dispensaDataInicio: hojeFormatado,
        dispensaDataFim: hojeFormatado,
        dispensaTotalDias: "1",
        motivoAusencia: "Tratar de assuntos inadiáveis de natureza acadêmica e documental nos termos do Art. 101 do EGFAE.",
        dataAssinaturaFuncionario: hojeFormatado,
      }));
    }
  };

  // =========================================================================
  // TELA DE SUCESSO / FLUXO DE TRAMITAÇÃO CONFIRMADO
  // =========================================================================
  if (isSubmitted && submittedData) {
    return (
      <div id="print-area" className="max-w-4xl mx-auto p-6 md:p-10 space-y-8 bg-slate-900 text-slate-900 rounded-2xl shadow-2xl border border-slate-800 animate-fade-in my-6">
        <div className="text-center space-y-3 pb-6 border-b border-slate-800">
          <div className="inline-flex items-center justify-center p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 mb-2">
            <CheckCircle2 size={44} className="animate-bounce" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Expediente Submetido ao Fluxo de Tramitação!
          </h2>
          <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            O documento foi registrado com sucesso no sistema SIGEP Songo e já se encontra em circulação oficial.
          </p>
          <div className="inline-block bg-slate-800/80 border border-slate-700 px-4 py-1.5 rounded-full text-xs font-mono text-amber-400 font-bold tracking-wider">
            Código de Rastreio: {submittedData.numeroRastreio}
          </div>
        </div>

        {/* FLUXOGRAMA DE TRAMITAÇÃO SEQUENCIAL */}
        <div className="bg-slate-950/60 p-6 rounded-xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-2">
              <Layers size={16} /> Fluxo Sequencial de Tramitação do Documento
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {submittedData.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
            {/* ETAPA 1: SOLICITANTE */}
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <Check size={14} /> 1. Funcionário
                </div>
                <p className="text-xs font-semibold text-white truncate">
                  {formData.nomeCompleto}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {formData.departamento}
                </p>
              </div>
              <span className="text-[10px] text-emerald-300 font-bold bg-emerald-500/20 px-2 py-0.5 rounded mt-3 inline-block w-fit">
                Preenchido & Assinado
              </span>
            </div>

            {/* ETAPA 2: CHEFIA HIERÁRQUICA */}
            <div
              className={`p-4 rounded-xl flex flex-col justify-between ${
                submittedData.fase === "setor"
                  ? "bg-emerald-950/40 border border-emerald-500/40"
                  : "bg-blue-950/40 border border-blue-500/40 animate-pulse"
              }`}
            >
              <div className="space-y-1">
                <div
                  className={`flex items-center gap-1.5 text-xs font-bold ${
                    submittedData.fase === "setor" ? "text-emerald-400" : "text-blue-400"
                  }`}
                >
                  {submittedData.fase === "setor" ? <Check size={14} /> : <Clock size={14} />} 2. Chefia Hierárquica
                </div>
                <p className="text-xs font-semibold text-white truncate">
                  {chefeSelecionado?.nome || "Chefe de Setor"}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {chefeSelecionado?.cargo || "Apreciação & Parecer"}
                </p>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded mt-3 inline-block w-fit ${
                  submittedData.fase === "setor"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-blue-500/20 text-blue-300"
                }`}
              >
                {submittedData.fase === "setor" ? "Parecer Emitido" : "Em Validação"}
              </span>
            </div>

            {/* ETAPA 3: SETOR DE COMPETÊNCIAS */}
            <div
              className={`p-4 rounded-xl flex flex-col justify-between ${
                submittedData.fase === "setor"
                  ? "bg-blue-950/40 border border-blue-500/40 animate-pulse"
                  : "bg-slate-900/60 border border-slate-800 opacity-60"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                  <Building2 size={14} /> 3. Setor de Competências
                </div>
                <p className="text-xs font-semibold text-white truncate">
                  {submittedData.destinoSetorNome || "DRH / Recursos Humanos"}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {submittedData.responsavelSetorDestino || "Enquadramento Legal & Efectividade"}
                </p>
              </div>
              <span className="text-[10px] text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded mt-3 inline-block w-fit">
                {submittedData.fase === "setor" ? "Aguardando Análise" : "Próximo Passo"}
              </span>
            </div>

            {/* ETAPA 4: DESPACHO SUPERIOR */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 opacity-60 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                  <ShieldCheck size={14} /> 4. Despacho Superior
                </div>
                <p className="text-xs font-semibold text-slate-300 truncate">
                  Direção Geral / GDG
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  Homologação Final
                </p>
              </div>
              <span className="text-[10px] text-slate-400 font-bold bg-slate-800 px-2 py-0.5 rounded mt-3 inline-block w-fit">
                Pendente
              </span>
            </div>
          </div>

          {/* DETALHES DO ENCAMINHAMENTO */}
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 text-xs space-y-2">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Tipo de Documento:</span>
              <span className="font-bold text-white">{submittedData.tipoDocumento}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Funcionário Requerente:</span>
              <span className="font-bold text-white">{formData.nomeCompleto} ({formData.categoriaCarreira})</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Período Solicitado:</span>
              <span className="font-bold text-amber-400">
                {tipoModalidade === "dispensa"
                  ? `${formData.dispensaDataInicio || "__"} a ${formData.dispensaDataFim || "__"} (${formData.dispensaTotalDias || 0} dias)`
                  : `${formData.faltaDataInicio || "__"} a ${formData.faltaDataFim || "__"} (${formData.faltaTotalDias || 0} dias)`}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Destinatário Atual / Setor:</span>
              <span className="font-bold text-emerald-400">{submittedData.destinatarioFinalNome}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-400">Motivo Registado:</span>
              <span className="font-semibold text-slate-200 text-right max-w-xs truncate">{formData.motivoAusencia}</span>
            </div>
          </div>
        </div>

        {/* BOTÕES DE AÇÃO PÓS-SUBMISSÃO */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all text-xs font-bold"
          >
            <ArrowLeft size={16} /> Voltar aos Documentos
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white hover:bg-slate-700 transition-all text-xs font-bold shadow-md"
            >
              <Printer size={16} /> Imprimir Documento Oficial
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSubmitted(false);
                setSubmittedData(null);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all text-xs font-bold shadow-lg"
            >
              <RotateCcw size={16} /> Novo Pedido / Editar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // FORMULÁRIO PRINCIPAL E DOCUMENTO OFICIAL
  // =========================================================================
  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* BARRA SUPERIOR DE FERRAMENTAS E MUDANÇA DE MODALIDADE */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={onCancel}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all flex items-center gap-1.5 text-xs font-bold"
            title="Voltar"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Voltar</span>
          </button>

          {/* SELETOR DE MODALIDADE (JUSTIFICATIVA VS DISPENSA) */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setTipoModalidade("justificacao")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                tipoModalidade === "justificacao"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileText size={14} />
              Justificação de Faltas
            </button>
            <button
              type="button"
              onClick={() => setTipoModalidade("dispensa")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                tipoModalidade === "dispensa"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Calendar size={14} />
              Pedido de Dispensa
            </button>
            <button
              type="button"
              onClick={() => setTipoModalidade("ambos")}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 hidden sm:flex ${
                tipoModalidade === "ambos"
                  ? "bg-amber-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers size={13} />
              Completo
            </button>
          </div>
        </div>

        {/* BOTÕES DE AÇÃO RÁPIDA */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={preencherExemplo}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/20 text-xs font-semibold transition-all"
            title="Preencher dados de exemplo"
          >
            <Sparkles size={14} />
            <span className="hidden sm:inline">Exemplo</span>
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all"
          >
            <Save size={14} />
            <span className="hidden sm:inline">Guardar Rascunho</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all"
          >
            <Printer size={14} />
            <span className="hidden sm:inline">Imprimir</span>
          </button>

          {/* BOTÃO PRINCIPAL DE SUBMISSÃO AO CHEFE */}
          <button
            type="button"
            onClick={() => {
              if (validarFormulario()) {
                setShowSendToBossModal(true);
              }
            }}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            <Send size={14} />
            <span>Enviar ao Chefe</span>
          </button>
        </div>
      </div>

      {/* PAINEL INFORMATIVO DO TIPO SELECIONADO */}
      <div
        className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-sans ${
          tipoModalidade === "justificacao"
            ? "bg-blue-950/40 border-blue-800 text-blue-200"
            : tipoModalidade === "dispensa"
            ? "bg-emerald-950/40 border-emerald-800 text-emerald-200"
            : "bg-slate-900 border-slate-800 text-slate-300"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-lg bg-black/30 font-bold text-base">
            {tipoModalidade === "justificacao" ? "📋" : tipoModalidade === "dispensa" ? "📅" : "📑"}
          </span>
          <div>
            <span className="font-bold uppercase tracking-wider text-[11px] block">
              {tipoModalidade === "justificacao"
                ? "Modelo Oficial: Justificação de Faltas ao Serviço"
                : tipoModalidade === "dispensa"
                ? "Modelo Oficial: Pedido de Dispensa Prévia"
                : "Modelo Oficial Unificado: Dispensa e Faltas"}
            </span>
            <span className="text-[11px] text-slate-400">
              {tipoModalidade === "justificacao"
                ? "Preencha as datas da falta ocorrida e o motivo fundamentado para envio ao chefe."
                : tipoModalidade === "dispensa"
                ? "Preencha as datas da dispensa solicitada (Art. 101 EGFAE) para envio ao chefe."
                : "Preencha os campos aplicáveis e envie ao chefe hierárquico."}
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1 font-bold text-emerald-400">
            <CheckCircle size={13} /> Cabeçalho e Rodapé Oficiais Ativos
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FOLHA OFICIAL DO DOCUMENTO NORMATIVO (A4 ESTILIZADO) */}
      {/* ========================================================================= */}
      <div className="bg-white text-black p-6 sm:p-10 md:p-12 shadow-2xl rounded-sm border border-slate-300 max-w-[850px] mx-auto print:m-0 print:p-4 print:shadow-none print:border-none print:max-w-full font-serif min-h-[900px] flex flex-col justify-between">
        <div className="space-y-4">
          {/* ================= CABEÇALHO OFICIAL DO ISPS ================= */}
          <div className="text-center space-y-1 pb-3 border-b-[2px] border-slate-900">
            <div className="flex justify-center mb-1">
              <img
                src="https://lh3.googleusercontent.com/d/1wgnb7dls5c0YcO2V_Fh_E6iA09m1v6mX"
                alt="Emblema da República de Moçambique"
                className="h-14 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="text-[10pt] sm:text-[11pt] font-black uppercase tracking-wider text-slate-900 font-serif leading-tight">
              REPÚBLICA DE MOÇAMBIQUE
            </h1>
            <h2 className="text-[9pt] sm:text-[10pt] font-bold uppercase tracking-tight text-slate-800 font-serif leading-tight">
              MINISTÉRIO DA CIÊNCIA, TECNOLOGIA E ENSINO SUPERIOR
            </h2>
            <h3 className="text-[10pt] sm:text-[11pt] font-black uppercase tracking-wider text-[#800000] font-serif leading-tight pt-0.5">
              INSTITUTO SUPERIOR POLITÉCNICO DE SONGO
            </h3>

            {/* TÍTULO PRINCIPAL DINÂMICO DO DOCUMENTO */}
            <div className="pt-3 pb-1">
              <div className="inline-block border-2 border-slate-900 px-6 py-1 bg-slate-50 shadow-sm">
                <h4 className="text-[12pt] sm:text-[13pt] font-black uppercase tracking-widest text-slate-950 font-serif">
                  {tipoModalidade === "dispensa"
                    ? "PEDIDO DE DISPENSA"
                    : tipoModalidade === "justificacao"
                    ? "JUSTIFICAÇÃO DE FALTAS"
                    : "PEDIDO DE DISPENSA OU JUSTIFICAÇÃO DE FALTAS"}
                </h4>
              </div>
            </div>
          </div>

          {/* ================= CORPO PRINCIPAL DO FORMULÁRIO ================= */}
          <div className="space-y-4 pt-1 font-serif text-[10.5pt] leading-relaxed">
            {/* Linha 1: Nome do Funcionário */}
            <div className="flex items-baseline gap-2">
              <span className="font-bold whitespace-nowrap text-slate-900 text-[10pt] sm:text-[10.5pt]">
                Nome do(a) Funcionário(a):
              </span>
              <input
                type="text"
                value={formData.nomeCompleto}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nomeCompleto: e.target.value }))
                }
                placeholder="Nome completo do funcionário requerente"
                className="flex-1 border-b border-dotted border-slate-700 focus:border-solid focus:border-blue-600 outline-none bg-transparent font-sans font-semibold text-slate-900 px-1 py-0 text-[10pt] sm:text-[10.5pt]"
              />
            </div>

            {/* Linha 2: Categoria / Carreira */}
            <div className="flex items-baseline gap-2">
              <span className="font-bold whitespace-nowrap text-slate-900 text-[10pt] sm:text-[10.5pt]">
                Categoria / Carreira:
              </span>
              <input
                type="text"
                value={formData.categoriaCarreira}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, categoriaCarreira: e.target.value }))
                }
                placeholder="Ex: Docente / Técnico Superior Universitário N1"
                className="flex-1 border-b border-dotted border-slate-700 focus:border-solid focus:border-blue-600 outline-none bg-transparent font-sans font-semibold text-slate-900 px-1 py-0 text-[10pt] sm:text-[10.5pt]"
              />
            </div>

            {/* Linha 3: Departamento / Direção */}
            <div className="flex items-baseline gap-2">
              <span className="font-bold whitespace-nowrap text-slate-900 text-[10pt] sm:text-[10.5pt]">
                Departamento / Direção:
              </span>
              <input
                type="text"
                value={formData.departamento}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, departamento: e.target.value }))
                }
                placeholder="Ex: DPEP / Divisão de Engenharia / DAF"
                className="flex-1 border-b border-dotted border-slate-700 focus:border-solid focus:border-blue-600 outline-none bg-transparent font-sans font-semibold text-slate-900 px-1 py-0 text-[10pt] sm:text-[10.5pt]"
              />
            </div>

            {/* Linha 4: Repartição / Secção */}
            <div className="flex items-baseline gap-2">
              <span className="font-bold whitespace-nowrap text-slate-900 text-[10pt] sm:text-[10.5pt]">
                Repartição / Secção:
              </span>
              <input
                type="text"
                value={formData.reparticaoSeccao}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, reparticaoSeccao: e.target.value }))
                }
                placeholder="Ex: Planificação e Estatística / Engenharia Elétrica"
                className="flex-1 border-b border-dotted border-slate-700 focus:border-solid focus:border-blue-600 outline-none bg-transparent font-sans font-semibold text-slate-900 px-1 py-0 text-[10pt] sm:text-[10.5pt]"
              />
            </div>

            {/* ================= SEÇÃO A: PEDIDO DE DISPENSA ================= */}
            <div
              className={`p-3 rounded-lg border transition-all ${
                tipoModalidade === "dispensa"
                  ? "bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-400"
                  : tipoModalidade === "ambos"
                  ? "bg-slate-50/60 border-slate-300"
                  : "opacity-40 border-dashed border-slate-300 bg-slate-50/30"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="font-black text-slate-900 uppercase text-[9.5pt] tracking-wider flex items-center gap-1.5">
                  <span>PEDIDO DE DISPENSA</span>
                  {tipoModalidade === "dispensa" && (
                    <span className="text-[7.5pt] bg-emerald-600 text-white px-2 py-0.2 rounded-full font-sans font-bold uppercase">
                      Activo
                    </span>
                  )}
                </div>
                <span className="text-[8pt] text-slate-500 font-sans italic">
                  (Artigo 101 do EGFAE)
                </span>
              </div>

              <div className="flex items-baseline flex-wrap gap-2 text-[10pt] sm:text-[10.5pt]">
                <span className="font-normal text-slate-900">
                  a) Tendo necessidade de faltar ao serviço de
                </span>
                <input
                  type="date"
                  value={formData.dispensaDataInicio}
                  onChange={(e) => handleDispensaInicioChange(e.target.value)}
                  className="border-b border-dotted border-slate-700 font-sans font-bold text-slate-900 bg-transparent px-1 py-0 outline-none text-[9.5pt]"
                />
                <span className="font-normal text-slate-900">a</span>
                <input
                  type="date"
                  value={formData.dispensaDataFim}
                  onChange={(e) => handleDispensaFimChange(e.target.value)}
                  className="border-b border-dotted border-slate-700 font-sans font-bold text-slate-900 bg-transparent px-1 py-0 outline-none text-[9.5pt]"
                />
              </div>

              <div className="flex items-baseline gap-2 mt-2 text-[10pt] sm:text-[10.5pt]">
                <span className="font-bold text-slate-900">Total:</span>
                <input
                  type="text"
                  value={formData.dispensaTotalDias}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, dispensaTotalDias: e.target.value }))
                  }
                  placeholder="___"
                  className="w-16 text-center border-b border-dotted border-slate-700 font-sans font-bold text-slate-900 bg-transparent px-1 py-0 outline-none text-[10pt]"
                />
                <span className="font-normal text-slate-900">dias úteis.</span>
              </div>
            </div>

            {/* ================= SEÇÃO B: JUSTIFICAÇÃO DE FALTAS ================= */}
            <div
              className={`p-3 rounded-lg border transition-all ${
                tipoModalidade === "justificacao"
                  ? "bg-blue-50/40 border-blue-300 ring-1 ring-blue-400"
                  : tipoModalidade === "ambos"
                  ? "bg-slate-50/60 border-slate-300"
                  : "opacity-40 border-dashed border-slate-300 bg-slate-50/30"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="font-black text-slate-900 uppercase text-[9.5pt] tracking-wider flex items-center gap-1.5">
                  <span>JUSTIFICAÇÃO DE FALTAS</span>
                  {tipoModalidade === "justificacao" && (
                    <span className="text-[7.5pt] bg-blue-600 text-white px-2 py-0.2 rounded-full font-sans font-bold uppercase">
                      Activo
                    </span>
                  )}
                </div>
                <span className="text-[8pt] text-slate-500 font-sans italic">
                  (Registo de Efectividade / Artigos 99 e 100 do EGFAE)
                </span>
              </div>

              <div className="flex items-baseline flex-wrap gap-2 text-[10pt] sm:text-[10.5pt]">
                <span className="font-normal text-slate-900">
                  b) Faltou ao serviço de
                </span>
                <input
                  type="date"
                  value={formData.faltaDataInicio}
                  onChange={(e) => handleFaltaInicioChange(e.target.value)}
                  className="border-b border-dotted border-slate-700 font-sans font-bold text-slate-900 bg-transparent px-1 py-0 outline-none text-[9.5pt]"
                />
                <span className="font-normal text-slate-900">a</span>
                <input
                  type="date"
                  value={formData.faltaDataFim}
                  onChange={(e) => handleFaltaFimChange(e.target.value)}
                  className="border-b border-dotted border-slate-700 font-sans font-bold text-slate-900 bg-transparent px-1 py-0 outline-none text-[9.5pt]"
                />
              </div>

              <div className="flex items-baseline gap-2 mt-2 text-[10pt] sm:text-[10.5pt]">
                <span className="font-bold text-slate-900">Total:</span>
                <input
                  type="text"
                  value={formData.faltaTotalDias}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, faltaTotalDias: e.target.value }))
                  }
                  placeholder="___"
                  className="w-16 text-center border-b border-dotted border-slate-700 font-sans font-bold text-slate-900 bg-transparent px-1 py-0 outline-none text-[10pt]"
                />
                <span className="font-normal text-slate-900">dias de ausência.</span>
              </div>
            </div>

            {/* ================= MOTIVO DE AUSÊNCIA ================= */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="font-bold whitespace-nowrap text-slate-900 text-[10pt] sm:text-[10.5pt]">
                  Motivo de Ausência:
                </span>
                <input
                  type="text"
                  value={formData.motivoAusencia}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, motivoAusencia: e.target.value }))
                  }
                  placeholder="Descreva fundamentadamente o motivo da ausência..."
                  className="flex-1 border-b border-dotted border-slate-700 focus:border-solid focus:border-blue-600 outline-none bg-transparent font-sans font-medium text-slate-900 px-1 py-0 text-[10pt]"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={formData.motivoDetalhado}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, motivoDetalhado: e.target.value }))
                  }
                  placeholder="Continuação ou observações complementares (ex: Anexo atestado médico nº...)"
                  className="w-full border-b border-dotted border-slate-700 outline-none bg-transparent font-sans text-slate-800 px-1 py-0 text-[9.5pt]"
                />
              </div>
            </div>

            {/* ================= DATA E ASSINATURA DO FUNCIONÁRIO ================= */}
            <div className="pt-3 flex flex-col items-end pr-2 space-y-1">
              <div className="flex items-baseline gap-1 font-sans text-[9.5pt]">
                <span className="font-serif">Songo, aos</span>
                <input
                  type="date"
                  value={formData.dataAssinaturaFuncionario}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      dataAssinaturaFuncionario: e.target.value,
                    }))
                  }
                  className="border-b border-dotted border-slate-700 font-bold bg-transparent px-1 py-0 outline-none text-right"
                />
              </div>

              <div className="text-center w-64 pt-2">
                <div className="font-black text-slate-900 text-[9pt] uppercase tracking-wide">
                  Assinatura do(a) Funcionário(a)
                </div>

                <div
                  onClick={() => handleOpenSignature("funcionario")}
                  className="min-h-[46px] flex items-center justify-center border-b-2 border-slate-900 mt-1 cursor-pointer hover:bg-amber-50/50 transition-all rounded p-1 group bg-slate-50/40"
                  title="Clique para assinar digitalmente"
                >
                  {formData.assinaturaFuncionario ? (
                    <img
                      src={formData.assinaturaFuncionario}
                      alt="Assinatura Funcionário"
                      className="max-h-12 object-contain"
                    />
                  ) : (
                    <span className="text-[8.5pt] text-slate-400 font-sans italic group-hover:text-amber-700 flex items-center gap-1">
                      <PenTool size={12} /> Clique para Assinar Digitalmente
                    </span>
                  )}
                </div>
                {formData.assinaturaFuncionarioNome && (
                  <p className="text-[8pt] text-slate-600 font-sans mt-0.5">
                    {formData.assinaturaFuncionarioNome}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TABELA INFERIOR COM AS 3 COLUNAS OFICIAIS (PARECER, RH, DESPACHO) */}
          {/* ========================================================================= */}
          <div className="border-2 border-slate-900 grid grid-cols-1 md:grid-cols-12 divide-y-2 md:divide-y-0 md:divide-x-2 divide-slate-900 text-slate-950 mt-4">
            {/* ----------------- COLUNA 1: PARECER DO CHEFE HIERÁRQUICO (28%) ----------------- */}
            <div className="md:col-span-3 p-2.5 flex flex-col justify-between min-h-[220px] bg-slate-50/30">
              <div>
                <h3 className="font-black text-center text-[9pt] leading-tight text-slate-900 uppercase tracking-tight pb-1.5 border-b border-slate-300 font-serif">
                  PARECER DO CHEFE HIERÁRQUICO
                </h3>
                <div className="pt-2">
                  <textarea
                    rows={4}
                    value={formData.parecerChefeTexto}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, parecerChefeTexto: e.target.value }))
                    }
                    placeholder="Parecer fundamentado do Chefe Hierárquico..."
                    className="w-full text-[9pt] font-sans text-slate-900 bg-transparent resize-none border-none outline-none p-1 placeholder:text-slate-400 placeholder:italic leading-normal"
                  />
                </div>
              </div>

              <div className="pt-3 text-center space-y-1">
                <div className="flex items-center justify-center gap-1 text-[8.5pt] font-sans">
                  <input
                    type="date"
                    value={formData.parecerChefeData}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, parecerChefeData: e.target.value }))
                    }
                    className="border-b border-dotted border-slate-700 bg-transparent text-center px-1 text-[8pt] outline-none"
                  />
                </div>
                <div
                  onClick={() => handleOpenSignature("chefe")}
                  className="border-t border-slate-800 pt-1 min-h-[32px] flex items-center justify-center cursor-pointer hover:bg-amber-50/50 transition-all group"
                  title="Clique para assinar como Chefe Hierárquico"
                >
                  {formData.parecerChefeAssinatura ? (
                    <img
                      src={formData.parecerChefeAssinatura}
                      alt="Assinatura Chefe"
                      className="max-h-8 object-contain"
                    />
                  ) : (
                    <span className="text-[8.5pt] font-bold font-serif text-slate-800 group-hover:text-amber-700">
                      Assinatura da Chefia
                    </span>
                  )}
                </div>
                {formData.parecerChefeNome && (
                  <p className="text-[7.5pt] text-slate-600 font-sans">{formData.parecerChefeNome}</p>
                )}
              </div>
            </div>

            {/* ----------------- COLUNA 2: INFORMAÇÃO DO DRH (48%) ----------------- */}
            <div className="md:col-span-6 p-2.5 flex flex-col justify-between min-h-[220px] bg-slate-50/30">
              <div className="space-y-2">
                <h3 className="font-black text-center text-[9pt] leading-tight text-slate-900 uppercase tracking-tight pb-1.5 border-b border-slate-300 font-serif">
                  INFORMAÇÃO DO DEPARTAMENTO DOS RECURSOS HUMANOS [DRH]
                </h3>

                {/* É de aceitar */}
                <div className="flex items-center gap-4 text-[9pt] font-bold text-slate-900">
                  <span>É de aceitar:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer font-sans">
                    <input
                      type="radio"
                      name="rhAceitar"
                      value="sim"
                      checked={formData.rhAceitar === "sim"}
                      onChange={() =>
                        setFormData((prev) => ({ ...prev, rhAceitar: "sim" }))
                      }
                      className="w-3.5 h-3.5 text-blue-900"
                    />
                    <span>[ ] Sim</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-sans">
                    <input
                      type="radio"
                      name="rhAceitar"
                      value="nao"
                      checked={formData.rhAceitar === "nao"}
                      onChange={() =>
                        setFormData((prev) => ({ ...prev, rhAceitar: "nao" }))
                      }
                      className="w-3.5 h-3.5 text-blue-900"
                    />
                    <span>[ ] Não</span>
                  </label>
                </div>

                {/* Enquadramento EGFAE */}
                <div className="space-y-1 text-[8.5pt] text-slate-900 leading-snug">
                  <p className="font-bold text-[8.5pt]">
                    • nos termos de EGFAE – Estatuto Geral dos Funcionários e Agentes do Estado
                  </p>

                  <div className="space-y-0.5 pl-2 font-sans">
                    <label className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 p-0.5 rounded">
                      <input
                        type="checkbox"
                        checked={formData.rhArtigo99a}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, rhArtigo99a: e.target.checked }))
                        }
                        className="w-3.5 h-3.5 text-blue-900"
                      />
                      <span>[ ] Alínea a) do Artigo 99 (Doença)</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 p-0.5 rounded">
                      <input
                        type="checkbox"
                        checked={formData.rhArtigo99e}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, rhArtigo99e: e.target.checked }))
                        }
                        className="w-3.5 h-3.5 text-blue-900"
                      />
                      <span>[ ] Alínea e) do Artigo 99 (Licença por Casamento)</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 p-0.5 rounded">
                      <input
                        type="checkbox"
                        checked={formData.rhArtigo99f}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, rhArtigo99f: e.target.checked }))
                        }
                        className="w-3.5 h-3.5 text-blue-900"
                      />
                      <span>[ ] Alínea f) do Artigo 99 (Licença por Luto)</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 p-0.5 rounded">
                      <input
                        type="checkbox"
                        checked={formData.rhArtigo100_1}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, rhArtigo100_1: e.target.checked }))
                        }
                        className="w-3.5 h-3.5 text-blue-900"
                      />
                      <span>[ ] Nº 1 do Artigo 100 (Acompanhamento por doença)</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 p-0.5 rounded">
                      <input
                        type="checkbox"
                        checked={formData.rhArtigo101_1}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, rhArtigo101_1: e.target.checked }))
                        }
                        className="w-3.5 h-3.5 text-blue-900"
                      />
                      <span className="font-bold">[ ] Nº 1 do Artigo 101 (Dispensa)</span>
                    </label>
                  </div>

                  <p className="font-bold text-[8pt] text-slate-950 pt-0.5 font-sans">
                    LEI Nº 4/2022 DE 11 DE FEVEREIRO.
                  </p>
                </div>

                {/* Descontado nas férias & Outra legislação */}
                <div className="pt-1 space-y-1 border-t border-slate-200">
                  <div className="flex items-center gap-3 text-[8.5pt] font-bold text-slate-900">
                    <span>A Ser descontado nas férias?</span>
                    <label className="flex items-center gap-1 cursor-pointer font-sans">
                      <input
                        type="radio"
                        name="rhDescontarFerias"
                        value="sim"
                        checked={formData.rhDescontarFerias === "sim"}
                        onChange={() =>
                          setFormData((prev) => ({ ...prev, rhDescontarFerias: "sim" }))
                        }
                        className="w-3.5 h-3.5"
                      />
                      <span>[ ] Sim</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer font-sans">
                      <input
                        type="radio"
                        name="rhDescontarFerias"
                        value="nao"
                        checked={formData.rhDescontarFerias === "nao"}
                        onChange={() =>
                          setFormData((prev) => ({ ...prev, rhDescontarFerias: "nao" }))
                        }
                        className="w-3.5 h-3.5"
                      />
                      <span>[ ] Não</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-1.5 text-[8.5pt]">
                    <label className="flex items-center gap-1 cursor-pointer font-bold whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={formData.rhOutraLegislacaoCheck}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            rhOutraLegislacaoCheck: e.target.checked,
                          }))
                        }
                        className="w-3.5 h-3.5"
                      />
                      <span>[ ] Outra Legislação:</span>
                    </label>
                    <input
                      type="text"
                      value={formData.rhOutraLegislacaoTexto}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          rhOutraLegislacaoTexto: e.target.value,
                        }))
                      }
                      placeholder="Artigo / Diploma legal..."
                      className="flex-1 border-b border-dotted border-slate-700 bg-transparent text-[8pt] font-sans px-1 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Data e Assinatura DRH */}
              <div className="pt-3 text-center space-y-1">
                <div className="flex items-center justify-center gap-1 text-[8.5pt] font-sans">
                  <input
                    type="date"
                    value={formData.rhData}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, rhData: e.target.value }))
                    }
                    className="border-b border-dotted border-slate-700 bg-transparent text-center px-1 text-[8pt] outline-none"
                  />
                </div>
                <div
                  onClick={() => handleOpenSignature("rh")}
                  className="border-t border-slate-800 pt-1 min-h-[32px] flex items-center justify-center cursor-pointer hover:bg-amber-50/50 transition-all group"
                  title="Clique para assinar como DRH"
                >
                  {formData.rhAssinatura ? (
                    <img
                      src={formData.rhAssinatura}
                      alt="Assinatura DRH"
                      className="max-h-8 object-contain"
                    />
                  ) : (
                    <span className="text-[8.5pt] font-bold font-serif text-slate-800 group-hover:text-amber-700">
                      Assinatura DRH
                    </span>
                  )}
                </div>
                {formData.rhNome && (
                  <p className="text-[7.5pt] text-slate-600 font-sans">{formData.rhNome}</p>
                )}
              </div>
            </div>

            {/* ----------------- COLUNA 3: DESPACHO (26%) ----------------- */}
            <div className="md:col-span-3 p-2.5 flex flex-col justify-between min-h-[220px] bg-slate-50/30">
              <div>
                <h3 className="font-black text-center text-[9pt] leading-tight text-slate-900 uppercase tracking-tight pb-1.5 border-b border-slate-300 font-serif">
                  DESPACHO
                </h3>
                <div className="pt-2">
                  <textarea
                    rows={4}
                    value={formData.despachoTexto}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, despachoTexto: e.target.value }))
                    }
                    placeholder="Despacho da Direção Geral (Autorizado / Homologado...)"
                    className="w-full text-[9pt] font-sans text-slate-900 bg-transparent resize-none border-none outline-none p-1 placeholder:text-slate-400 placeholder:italic leading-normal"
                  />
                </div>
              </div>

              <div className="pt-3 text-center space-y-1">
                <div className="flex items-center justify-center gap-1 text-[8.5pt] font-sans">
                  <input
                    type="date"
                    value={formData.despachoData}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, despachoData: e.target.value }))
                    }
                    className="border-b border-dotted border-slate-700 bg-transparent text-center px-1 text-[8pt] outline-none"
                  />
                </div>
                <div
                  onClick={() => handleOpenSignature("despacho")}
                  className="border-t border-slate-800 pt-1 min-h-[32px] flex items-center justify-center cursor-pointer hover:bg-amber-50/50 transition-all group"
                  title="Clique para assinar o Despacho"
                >
                  {formData.despachoAssinatura ? (
                    <img
                      src={formData.despachoAssinatura}
                      alt="Assinatura Despacho"
                      className="max-h-8 object-contain"
                    />
                  ) : (
                    <span className="text-[8.5pt] font-bold font-serif text-slate-800 group-hover:text-amber-700">
                      Assinatura Superior
                    </span>
                  )}
                </div>
                {formData.despachoNome && (
                  <p className="text-[7.5pt] text-slate-600 font-sans">{formData.despachoNome}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ================= RODAPÉ OFICIAL DO ISPS ================= */}
        <div className="mt-6 pt-2 border-t-[3px] border-[#800000] flex justify-between items-center text-[7.5pt] sm:text-[8pt] text-slate-900 font-serif leading-tight">
          <div className="text-left">
            <p>
              <span className="font-bold">ISPS</span> | Campus principal: Bairro Catondo, Vila de Songo, Distrito de Cahora-Bassa,
            </p>
            <p>
              Tel: +258 875 253 322, Fax: +258 252 82337/8, email:{" "}
              <a
                href="mailto:secretariado@ispsongo.ac.mz"
                className="text-blue-700 underline font-normal hover:text-blue-900"
              >
                secretariado@ispsongo.ac.mz
              </a>
              , Página oficial:{" "}
              <a
                href="https://www.ispsongo.ac.mz"
                target="_blank"
                rel="noreferrer"
                className="text-blue-700 underline font-normal hover:text-blue-900"
              >
                www.ispsongo.ac.mz
              </a>
            </p>
          </div>
          <div className="ml-3 flex-shrink-0">
            <div className="border border-[#800000] p-[2px] bg-white flex items-center justify-center">
              <img
                src="https://lh3.googleusercontent.com/d/11zvvpOpZARM1yk_irEDpjJ-qBKlTlhad"
                alt="Logo Songo"
                className="h-6 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAINEL DE TRAMITAÇÃO RÁPIDA: ETAPA 1 (ENVIAR AO CHEFE) E ETAPA 2 (ENVIAR AO SETOR) */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4 max-w-[850px] mx-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-amber-400" />
            <h3 className="text-sm font-black uppercase text-white tracking-wider">
              Painel de Tramitação e Despacho do Expediente
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            SIGEP Tramitação Oficial v2.5
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* CARTÃO 1: ENVIAR AO CHEFE (PARA O FUNCIONÁRIO) */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wide">
                <UserCheck size={16} />
                Passo 1: Para o Funcionário
              </div>
              <h4 className="text-sm font-bold text-white">
                Enviar ao Chefe Hierárquico
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Após preencher os dados da falta/dispensa e assinar digitalmente, selecione o seu chefe de departamento para emitir o parecer.
              </p>
              {chefeSelecionado && (
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-300 flex items-center justify-between mt-2">
                  <div className="truncate">
                    <span className="text-slate-400 text-[10px] block">Chefe Selecionado:</span>
                    <span className="font-bold text-white">{chefeSelecionado.nome}</span>
                    <span className="text-slate-400 text-[11px] block">{chefeSelecionado.cargo}</span>
                  </div>
                  <span className="text-xs bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded">
                    Chefe Activo
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                if (validarFormulario()) {
                  setShowSendToBossModal(true);
                }
              }}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
            >
              <Send size={15} />
              <span>Enviar ao Chefe para Assinatura</span>
            </button>
          </div>

          {/* CARTÃO 2: ENVIAR AO SETOR DE COMPETÊNCIAS (PARA O CHEFE) */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wide">
                <Building2 size={16} />
                Passo 2: Pela Chefia Hierárquica
              </div>
              <h4 className="text-sm font-bold text-white">
                Encaminhar ao Setor de Competências
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Após emitir o parecer da chefia, escolha o setor de competências (DRH, GDG, DPEP, etc.) para onde encaminhar este expediente.
              </p>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-300 flex items-center justify-between mt-2">
                <div className="truncate">
                  <span className="text-slate-400 text-[10px] block">Setor Recomendado:</span>
                  <span className="font-bold text-emerald-400">Departamento de Recursos Humanos (DRH)</span>
                  <span className="text-slate-400 text-[11px] block">Competência de Efectividade & EGFAE</span>
                </div>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded">
                  Recomendado
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (validarFormulario()) {
                  setShowSendToSectorModal(true);
                }
              }}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
            >
              <Building2 size={15} />
              <span>Encaminhar para o Setor de Competências</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: SELEÇÃO DE CHEFE HIERÁRQUICO */}
      {/* ========================================================================= */}
      {showSendToBossModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-800 space-y-5 text-slate-100 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                  <UserCheck size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Selecionar Chefe Hierárquico
                  </h3>
                  <p className="text-xs text-slate-400">
                    O documento será enviado para o painel de assinatura do seu chefe
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSendToBossModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* CAMPO DE PESQUISA DO CHEFE */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={termoPesquisaChefe}
                onChange={(e) => setTermoPesquisaChefe(e.target.value)}
                placeholder="Pesquisar por nome, cargo ou departamento..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* LISTA DE CHEFES */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {listaChefesFiltrada.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Nenhum chefe hierárquico encontrado com esse critério.
                </div>
              ) : (
                listaChefesFiltrada.map((chefe) => {
                  const isSelected = chefeSelecionado?.id === chefe.id;
                  return (
                    <div
                      key={chefe.id || chefe.nome}
                      onClick={() => setChefeSelecionado(chefe)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-blue-600/15 border-blue-500 text-white"
                          : "bg-slate-950 border-slate-800/80 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                            isSelected
                              ? "bg-blue-600 text-white"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {chefe.nome
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-white">{chefe.nome}</p>
                          <p className="text-[11px] text-slate-400">
                            {chefe.cargo || chefe.cargoChefia || "Chefe de Departamento"}
                          </p>
                          <span className="text-[10px] text-slate-500">
                            {chefe.departamento || chefe.direcao || "Songo"}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="text-blue-400 bg-blue-500/10 p-1.5 rounded-full">
                          <Check size={16} />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* OBSERVAÇÃO ADICIONAL AO CHEFE */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Observação / Mensagem ao Chefe (Opcional):
              </label>
              <textarea
                rows={2}
                value={observacaoEnvioChefe}
                onChange={(e) => setObservacaoEnvioChefe(e.target.value)}
                placeholder="Ex: Submeto para devida apreciação e parecer relativamente ao período de ausência..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            {/* BOTÕES DO MODAL */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowSendToBossModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmSendToBoss}
                disabled={isSubmitting || !chefeSelecionado}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
              >
                <Send size={14} />
                <span>Confirmar e Enviar ao Chefe</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: SELEÇÃO DO SETOR DE COMPETÊNCIAS (LISTA DE TODOS OS SETORES) */}
      {/* ========================================================================= */}
      {showSendToSectorModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-800 space-y-5 text-slate-100 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Encaminhar ao Setor de Competências
                  </h3>
                  <p className="text-xs text-slate-400">
                    Selecione o setor/departamento de destino para onde tramitar este expediente
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSendToSectorModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* CAMPO DE PESQUISA DO SETOR */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={termoPesquisaSetor}
                onChange={(e) => setTermoPesquisaSetor(e.target.value)}
                placeholder="Pesquisar setor por nome, sigla ou competência..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* LISTA COMPLETA DE TODOS OS SETORES DA INSTITUIÇÃO */}
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {setoresFiltrados.map((setor) => {
                const isSelected = setorSelecionado === setor.id;
                return (
                  <div
                    key={setor.id}
                    onClick={() => {
                      setSetorSelecionado(setor.id);
                      setResponsavelSetorDestino(setor.responsavelPadrao);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? "bg-emerald-600/15 border-emerald-500 text-white ring-1 ring-emerald-500/50"
                        : "bg-slate-950 border-slate-800/80 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                        {setor.icone}
                      </span>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-xs text-white">{setor.nome}</p>
                          {setor.recomendado && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.2 rounded-full font-bold">
                              Recomendado (Faltas/Dispensas)
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">
                          {setor.descricao}
                        </p>
                        <p className="text-[10px] text-slate-500 pt-0.5 font-mono">
                          Responsável Padrão: {setor.responsavelPadrao}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="text-emerald-400 bg-emerald-500/10 p-1.5 rounded-full flex-shrink-0">
                        <Check size={16} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* DESPACHO DA CHEFIA E NOTA DE ENCAMINHAMENTO */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Parecer / Despacho da Chefia Hierárquica:</span>
                <span className="text-[11px] text-amber-400 font-normal">
                  Será gravado na Coluna 1 do Documento
                </span>
              </label>
              <textarea
                rows={2}
                value={despachoChefeEnvio}
                onChange={(e) => setDespachoChefeEnvio(e.target.value)}
                placeholder="Despacho da Chefia (Favorável / Encaminha-se para os devidos efeitos...)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            {/* BOTÕES DO MODAL */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowSendToSectorModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmSendToSector}
                disabled={isSubmitting || !setorSelecionado}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Building2 size={14} />
                <span>Confirmar e Encaminhar ao Setor</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE ASSINATURA DIGITAL PAD */}
      {/* ========================================================================= */}
      {showSignatureModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-black uppercase text-slate-900 tracking-wide flex items-center gap-2">
                <PenTool size={18} className="text-amber-600" />
                Assinar Documento Oficial
              </h3>
              <button
                type="button"
                onClick={() => setShowSignatureModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕ Fechar
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Desenhe a sua assinatura no quadro abaixo ou utilize a caneta digital:
            </p>

            <AssinaturaDigitalPad
              onSaveAssinatura={(signatureData: any) => handleSignatureConfirmed(typeof signatureData === 'string' ? signatureData : (signatureData.assinaturaImg || JSON.stringify(signatureData)))}
              onCancel={() => setShowSignatureModal(false)}
              defaultNome={
                currentSignatureTarget === "funcionario"
                  ? formData.nomeCompleto || user?.nome
                  : currentSignatureTarget === "chefe"
                  ? chefeSelecionado?.nome || "Chefe Hierárquico"
                  : currentSignatureTarget === "rh"
                  ? "Responsável DRH"
                  : "Diretor-Geral"
              }
              defaultCargo={
                currentSignatureTarget === "funcionario"
                  ? formData.categoriaCarreira
                  : currentSignatureTarget === "chefe"
                  ? chefeSelecionado?.cargo || "Chefe de Setor / Departamento"
                  : currentSignatureTarget === "rh"
                  ? "Departamento de Recursos Humanos"
                  : "Despacho Superior"
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

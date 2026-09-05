import { printElementById } from "../../lib/printUtils";
import React, { useState, useEffect, useMemo } from "react";
import {
  LayoutGrid,
  FileText,
  DollarSign,
  Calendar,
  MessageSquare,
  Pen,
  BarChart3,
  TrendingUp,
  CheckSquare,
  Download,
  Send,
  Share2,
  Bell,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  ArrowLeft,
  CheckCircle2,
  FolderOpen,
  FileCheck,
  Building,
  User,
  Eye,
  X,
  FileSpreadsheet,
  ShieldCheck,
  Printer,
  ChevronDown,
  ChevronUp,
  History,
} from "lucide-react";
import { Expediente } from "../../types";
import FormularioExpediente from "../bloco6_documentos/FormularioExpediente";
import DocumentReaderModal from "../../components/DocumentReaderModal";
import DocumentosView from "../bloco6_documentos/DocumentosView";
import ReportsView from "../bloco7_relatorios/ReportsView";
import BalancoAtividadesView from "./BalancoAtividadesView";
import AssinaturaDigitalView from "../bloco5_sistema/AssinaturaDigitalView";
import MainHeader from "../bloco1_apresentacao/MainHeader";
import FluxogramaTramitacaoExpediente from "../../components/FluxogramaTramitacaoExpediente";
import { firestoreService } from "../../lib/firestoreService";

interface GestaoExpedienteHistoricoViewProps {
  onBack: () => void;
  expedientes?: Expediente[];
  onUpdateExpediente?: (expediente: Expediente) => Promise<any> | void;
  user?: any;
  title?: string;
  onNavigate?: (item: string) => void;
  initialTab?: string;
  activities?: any[];
  onLogout?: () => void;
}

interface DocumentItem {
  id: string;
  remetente: string;
  remetenteCargo?: string;
  beneficiario?: string;
  nomeArquivo: string;
  dataRecebimento: string;
  encaminhado: string;
  encaminhadoSetor?: string;
  dataEncaminhamento: string;
  tipoDocumento: string;
  assunto: string;
  status: string;
  numeroRastreio: string;
  arquivoUrl?: string;
  rawExpediente?: Expediente;
  dadosRelatorio?: {
    titulo: string;
    subtitulo: string;
    execucaoOrcamental: number;
    barras: { rotulo: string; valor: number }[];
    tabela: { item: string; orcamento: string; gasto: string; saldo: string }[];
    distribuicao: { nome: string; percentual: number; cor: string }[];
  };
}

const DEFAULT_DOCUMENTS: DocumentItem[] = [];

export default function GestaoExpedienteHistoricoView({
  onBack,
  expedientes = [],
  onUpdateExpediente,
  user,
  title = "Gestão de Expediente",
  onNavigate,
  initialTab = "Histórico de Documentos",
  activities = [],
  onLogout,
}: GestaoExpedienteHistoricoViewProps) {
  // Relógio em tempo real
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterTipo, setFilterTipo] = useState("todos");

  const userSector = useMemo(() => {
    return (
      user?.siglaUnidade ||
      user?.setor ||
      user?.departamento ||
      user?.direcao ||
      user?.reparticao ||
      user?.afetacao ||
      user?.unidade ||
      user?.sector ||
      user?.cargo ||
      "DPEP"
    );
  }, [user]);

  // A restrição de acesso ao setor do utilizador é aplicada a todos os utilizadores (sem acesso global)
  const [filterSetor, setFilterSetor] = useState<string>("meu_setor");

  const [selectedDocId, setSelectedDocId] = useState<string>("doc_1");
  const [showNovoModal, setShowNovoModal] = useState(false);
  const [showEncaminharModal, setShowEncaminharModal] = useState(false);
  const [showPartilharModal, setShowPartilharModal] = useState(false);
  const [showReaderModal, setShowReaderModal] = useState(false);
  const [destinatario, setDestinatario] = useState("");
  const [parecerTexto, setParecerTexto] = useState("");
  const [setorAtuante, setSetorAtuante] = useState(userSector || "Secretaria Geral");

  useEffect(() => {
    if (userSector) {
      setSetorAtuante(userSector);
    }
  }, [userSector]);
  const [decisaoSetor, setDecisaoSetor] = useState("classificar");
  const [guiaNumero, setGuiaNumero] = useState(`GV-${new Date().getFullYear()}/042`);
  const [guiaBeneficiario, setGuiaBeneficiario] = useState("");
  const [guiaDestino, setGuiaDestino] = useState("");
  const [guiaPeriodo, setGuiaPeriodo] = useState("");
  const [guiaMeios, setGuiaMeios] = useState("");
  const [activeMenuItem, setActiveMenuItem] = useState(initialTab || "Histórico de Documentos");
  const [actionSuccessMessage, setActionSuccessMessage] = useState("");

  useEffect(() => {
    if (initialTab) {
      setActiveMenuItem(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Formatação do relógio exatamente como na imagem
  const diaSemana = useMemo(() => {
    const dias = [
      "DOMINGO",
      "SEGUNDA-FEIRA",
      "TERÇA-FEIRA",
      "QUARTA-FEIRA",
      "QUINTA-FEIRA",
      "SEXTA-FEIRA",
      "SÁBADO",
    ];
    return dias[currentTime.getDay()];
  }, [currentTime]);

  const horaFormatada = useMemo(() => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(currentTime.getHours())}:${pad(currentTime.getMinutes())}:${pad(currentTime.getSeconds())}`;
  }, [currentTime]);

  const dataFormatada = useMemo(() => {
    const meses = [
      "janeiro",
      "fevereiro",
      "março",
      "abril",
      "maio",
      "junho",
      "julho",
      "agosto",
      "setembro",
      "outubro",
      "novembro",
      "dezembro",
    ];
    return `${currentTime.getDate()} de ${meses[currentTime.getMonth()]} de ${currentTime.getFullYear()}`;
  }, [currentTime]);

  // Transformar expedientes do Firestore em itens de documentos unificados com os de amostra
  const allDocuments = useMemo<DocumentItem[]>(() => {
    const realDocs: DocumentItem[] = expedientes.map((exp: any) => {
      const remetente = exp.origem || exp.remetente || "GABINETE INSTITUCIONAL";
      const nomeArquivo =
        exp.nomeArquivo ||
        (exp.assunto && exp.assunto.length > 5
          ? `${exp.assunto.replace(/[^\w\s-]/gi, "").substring(0, 24).trim()}.${exp.tipoArquivo || "pdf"}`
          : `Expediente_${exp.numero || "Geral"}.pdf`);

      const dataRecebimento = exp.data
        ? new Date(exp.data).toLocaleDateString("pt-PT", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "20 de agosto de 2026";

      const dataEncaminhamento = exp.dataDespacho || exp.data
        ? new Date(exp.dataDespacho || exp.data).toLocaleDateString("pt-PT", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "20 de agosto de 2026";

      const beneficiario =
        exp.beneficiario ||
        exp.nomeBeneficiario ||
        exp.solicitante ||
        exp.interessado ||
        exp.funcionario ||
        exp.nomeFuncionario ||
        exp.guiaViagem?.beneficiario ||
        "";

      return {
        id: exp.id || `exp_${Math.random()}`,
        remetente: remetente.toUpperCase(),
        remetenteCargo: exp.tipo || "Expediente Oficial",
        beneficiario: beneficiario ? String(beneficiario).trim() : undefined,
        nomeArquivo: nomeArquivo,
        dataRecebimento: dataRecebimento,
        encaminhado: (exp.destino || "DIREÇÃO GERAL").toUpperCase(),
        encaminhadoSetor: exp.status || "Em Tramitação",
        dataEncaminhamento: dataEncaminhamento,
        tipoDocumento: exp.tipo || "Ofício / Requerimento",
        assunto: exp.assunto || "Expediente Institucional",
        status: exp.status || "Entrado",
        numeroRastreio: exp.numero || "EXP-2026",
        arquivoUrl: exp.arquivoUrl,
        rawExpediente: exp,
        dadosRelatorio: {
          titulo: exp.assunto || "Documento Institucional",
          subtitulo: nomeArquivo,
          execucaoOrcamental: 85,
          barras: [
            { rotulo: "Entrada", valor: 100 },
            { rotulo: "Análise", valor: 85 },
            { rotulo: "Parecer", valor: 70 },
            { rotulo: "Despacho", valor: exp.status === "Concluído" ? 100 : 50 },
          ],
          tabela: [
            { item: "Referência", orcamento: exp.numero || "EXP-01", gasto: exp.status || "Ativo", saldo: "Válido" },
            { item: "Origem", orcamento: exp.origem || "Setor", gasto: exp.destino || "Destino", saldo: "OK" },
          ],
          distribuicao: [
            { nome: "Tramitado", percentual: 70, cor: "#2563eb" },
            { nome: "Pendente", percentual: 30, cor: "#60a5fa" },
          ],
        },
      };
    });

    // Combinar mantendo os exemplos de alta fidelidade como base para visualização impecável
    const map = new Map<string, DocumentItem>();
    realDocs.forEach((d) => map.set(d.id, d));
    DEFAULT_DOCUMENTS.forEach((d) => {
      if (!map.has(d.id)) {
        map.set(d.id, d);
      }
    });

    return Array.from(map.values());
  }, [expedientes]);

  // Estrutura Organizacional de Direções e Departamentos (Histórico Institucional)
  const direcoesConfig = useMemo(() => [
    {
      id: "GDG",
      sigla: "GDG",
      nome: "Gabinete do Diretor Geral",
      icon: "🏛️",
      colorClass: "border-amber-500/40 bg-amber-500/10 text-amber-400",
      departments: [
        { key: "Chefe do GDG", label: "Chefe do GDG", searchKeys: ["CHEFE DO GDG", "CHEFE GDG", "GDG", "GABINETE DO DIRETOR GERAL", "DIRETOR GERAL"] },
        { key: "Departamento de Planificação Estudos e Projetos", label: "Departamento de Planificação Estudos e Projetos", searchKeys: ["PLANIFICAÇÃO", "DPEP", "ESTUDOS E PROJETOS", "ESTUDOS", "PROJETOS", "PAO"] },
        { key: "Unidade Gestora e Executora de Aquisições", label: "Unidade Gestora e Executora de Aquisições", searchKeys: ["UNIDADE GESTORA E EXECUTORA DE AQUISIÇÕES", "UGEA", "AQUISIÇÕES", "UNIDADE GESTORA"] },
        { key: "Departamento de Cooperação e Relações Exteriores", label: "Departamento de Cooperação e Relações Exteriores", searchKeys: ["COOPERAÇÃO E RELAÇÕES EXTERIORES", "COOPERAÇÃO", "RELAÇÕES EXTERIORES"] },
        { key: "Departamento de Controlo Técnico e de Qualidade", label: "Departamento de Controlo Técnico e de Qualidade", searchKeys: ["CONTROLO TÉCNICO E DE QUALIDADE", "CONTROLO TÉCNICO", "QUALIDADE"] },
        { key: "Departamento Jurídico", label: "Departamento Jurídico", searchKeys: ["DEPARTAMENTO JURÍDICO", "JURÍDICO", "JURIDICO", "ASSESSORIA JURÍDICA"] },
      ],
    },
    {
      id: "SECEX",
      sigla: "SECEX",
      nome: "Secretaria Executiva",
      icon: "✉️",
      colorClass: "border-pink-500/40 bg-pink-500/10 text-pink-400",
      departments: [
        { key: "Secretaria Executiva", label: "Secretaria Executiva", searchKeys: ["SECRETARIA EXECUTIVA", "SECEX", "SEC. EXECUTIVA"] },
      ],
    },
    {
      id: "DIVENG",
      sigla: "DIVENG",
      nome: "Divisão de Engenharia",
      icon: "⚙️",
      colorClass: "border-blue-500/40 bg-blue-500/10 text-blue-400",
      departments: [
        { key: "Diretor da Divisão de Engenharia", label: "Diretor da Divisão de Engenharia", searchKeys: ["DIRETOR DA DIVISÃO DE ENGENHARIA", "DIVISÃO DE ENGENHARIA", "DIVENG"] },
        { key: "Diretor Adjunto Pedagógico", label: "Diretor Adjunto Pedagógico", searchKeys: ["DIRETOR ADJUNTO PEDAGÓGICO", "PEDAGÓGICO", "PEDAGOGICO"] },
        { key: "Departamento de Pesquisa e Extensão", label: "Departamento de Pesquisa e Extensão", searchKeys: ["DEPARTAMENTO DE PESQUISA E EXTENSÃO", "PESQUISA E EXTENSÃO", "EXTENSÃO", "PESQUISA"] },
        { key: "Departamento de Engenharia Eletrotécnica", label: "Departamento de Engenharia Eletrotécnica", searchKeys: ["DEPARTAMENTO DE ENGENHARIA ELETROTÉCNICA", "ENGENHARIA ELETROTÉCNICA", "ELETROTÉCNICA", "ELETROTECNICA"] },
        { key: "Departamento de Engenharia de Construção Civil", label: "Departamento de Engenharia de Construção Civil", searchKeys: ["DEPARTAMENTO DE ENGENHARIA DE CONSTRUÇÃO CIVIL", "CONSTRUÇÃO CIVIL", "CIVIL"] },
        { key: "Departamento de Engenharia de Construção Mecânica", label: "Departamento de Engenharia de Construção Mecânica", searchKeys: ["DEPARTAMENTO DE ENGENHARIA DE CONSTRUÇÃO MECÂNICA", "CONSTRUÇÃO MECÂNICA", "MECÂNICA"] },
        { key: "Departamento de Disciplinas Gerais", label: "Departamento de Disciplinas Gerais", searchKeys: ["DEPARTAMENTO DE DISCIPLINAS GERAIS", "DISCIPLINAS GERAIS"] },
        { key: "Departamento Técnico e de Apoio", label: "Departamento Técnico e de Apoio", searchKeys: ["DEPARTAMENTO TÉCNICO E DE APOIO", "TÉCNICO E DE APOIO", "SETOR TÉCNICO"] },
      ],
    },
    {
      id: "CIE",
      sigla: "CIE",
      nome: "Centro de Incubação e Empreendedorismo (CIE)",
      icon: "💡",
      colorClass: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
      departments: [
        { key: "Diretor do CIE", label: "Diretor do CIE", searchKeys: ["DIRETOR DO CIE", "DIRETOR CIE", "CIE", "CENTRO DE INCUBAÇÃO"] },
        { key: "DPGNDE", label: "Departamento de práticas de geração de negócio e desenvolvimento empresarial (DPGNDE)", searchKeys: ["DPGNDE", "GERAÇÃO DE NEGÓCIO", "DESENVOLVIMENTO EMPRESARIAL"] },
        { key: "DCPAF", label: "Departamento de consultoria, estudos, projetos e angariação de fundos (DCPAF)", searchKeys: ["DCPAF", "CONSULTORIA", "ANGARIAÇÃO DE FUNDOS"] },
        { key: "DPONE", label: "Departamento de prospecção de oportunidade de negócio (DPONE)", searchKeys: ["DPONE", "PROSPECÇÃO DE OPORTUNIDADE", "PROSPECÇÃO"] },
      ],
    },
    {
      id: "DICOSAFA",
      sigla: "DICOSAFA",
      nome: "DICOSAFA",
      icon: "🏥",
      colorClass: "border-purple-500/40 bg-purple-500/10 text-purple-400",
      departments: [
        { key: "Diretor da DICOSAFA", label: "Diretor da DICOSAFA", searchKeys: ["DIRETOR DA DICOSAFA", "DICOSAFA"] },
        { key: "Departamento de Recursos Humanos", label: "Departamento de Recursos Humanos", searchKeys: ["DEPARTAMENTO DE RECURSOS HUMANOS", "RECURSOS HUMANOS", "RH", "PESSOAL"] },
        { key: "Departamento de Finanças", label: "Departamento de Finanças", searchKeys: ["DEPARTAMENTO DE FINANÇAS", "FINANÇAS", "FINANCAS", "CONTABILIDADE", "TESOURARIA"] },
        { key: "Departamento de Património", label: "Departamento de Património", searchKeys: ["DEPARTAMENTO DE PATRIMÓNIO", "PATRIMÓNIO", "PATRIMONIO", "LOGÍSTICA"] },
        { key: "Secretaria Geral", label: "Secretaria Geral", searchKeys: ["SECRETARIA GERAL", "EXPEDIENTE"] },
        { key: "Departamento TIC", label: "Departamento TIC", searchKeys: ["DEPARTAMENTO TIC", "TIC", "INFORMÁTICA"] },
        { key: "Departamento Lar de Estudantes", label: "Departamento Lar de Estudantes", searchKeys: ["DEPARTAMENTO LAR DE ESTUDANTES", "LAR DE ESTUDANTES", "LAR"] },
        { key: "Departamento de Produção Alimentar", label: "Departamento de Produção Alimentar", searchKeys: ["DEPARTAMENTO DE PRODUÇÃO ALIMENTAR", "PRODUÇÃO ALIMENTAR", "REFEITÓRIO"] },
      ],
    },
    {
      id: "DICOSSER",
      sigla: "DICOSSER",
      nome: "DICOSSER",
      icon: "📚",
      colorClass: "border-cyan-500/40 bg-cyan-500/10 text-cyan-400",
      departments: [
        { key: "Diretor da DICOSSER", label: "Diretor da DICOSSER", searchKeys: ["DIRETOR DA DICOSSER", "DICOSSER"] },
        { key: "Aceder", label: "Aceder", searchKeys: ["ACEDER", "ATENDIMENTO DICOSSER", "SECRETARIA DICOSSER"] },
        { key: "Departamento de Registo Académico", label: "Departamento de Registo Académico", searchKeys: ["DEPARTAMENTO DE REGISTO ACADÉMICO", "REGISTO ACADÉMICO", "REGISTO ACADEMICO"] },
        { key: "Departamento de Assuntos Estudantis", label: "Departamento de Assuntos Estudantis", searchKeys: ["DEPARTAMENTO DE ASSUNTOS ESTUDANTIS", "ASSUNTOS ESTUDANTIS"] },
        { key: "Departamento de Biblioteca", label: "Departamento de Biblioteca", searchKeys: ["DEPARTAMENTO DE BIBLIOTECA", "BIBLIOTECA", "DOCUMENTAÇÃO"] },
      ],
    },
  ], []);

  // Estatísticas de Contagem de Entradas e Saídas Organizadas por Direções e Departamentos
  const secGeralMetrics = useMemo(() => {
    let totalEntradasGerais = 0;
    let totalSaidasGerais = 0;

    // Se o utilizador não tem acesso global, o repositório é filtrado exclusivamente para os documentos do seu setor
    // Como não há acesso global, baseDocs é sempre filtrado pelo setor do utilizador
    const baseDocs = allDocuments.filter((doc) => {
          const sectorQuery = (userSector || "").toLowerCase().trim();
          if (!sectorQuery) return true;

          const remet = (doc.remetente || "").toLowerCase();
          const encam = (doc.encaminhado || doc.encaminhadoSetor || "").toLowerCase();
          const orig = (doc.rawExpediente?.origem || doc.rawExpediente?.emitidoPor || "").toLowerCase();
          const dest = (doc.rawExpediente?.destino || doc.rawExpediente?.currentStep || doc.rawExpediente?.nextStepRecipient || "").toLowerCase();
          const historicoStr = JSON.stringify(doc.rawExpediente?.historico || []).toLowerCase();

          const keywords = sectorQuery.split(/[\/\s-]+/).filter((k) => k.length > 2);

          return (
            remet.includes(sectorQuery) ||
            encam.includes(sectorQuery) ||
            orig.includes(sectorQuery) ||
            dest.includes(sectorQuery) ||
            historicoStr.includes(sectorQuery) ||
            keywords.some(
              (kw) =>
                remet.includes(kw) ||
                encam.includes(kw) ||
                orig.includes(kw) ||
                dest.includes(kw) ||
                historicoStr.includes(kw)
            )
          );
        });

    const direcoes = direcoesConfig.map((dir) => {
      let dirEntradasCount = 0;
      let dirSaidasCount = 0;

      const departmentsWithDocs = dir.departments.map((dept) => {
        // Documentos de Entrada no departamento (destinado a ele)
        const entradas = baseDocs.filter((doc) => {
          const enc = (doc.encaminhado || doc.encaminhadoSetor || "").toUpperCase();
          const dest = (doc.rawExpediente?.destino || "").toUpperCase();
          const histStr = JSON.stringify(doc.rawExpediente?.historico || []).toUpperCase();

          return dept.searchKeys.some(
            (k) => enc.includes(k) || dest.includes(k) || histStr.includes(k)
          );
        });

        // Documentos de Saída do departamento (originados por ele)
        const saidas = baseDocs.filter((doc) => {
          const rem = (doc.remetente || "").toUpperCase();
          const orig = (doc.rawExpediente?.origem || "").toUpperCase();

          return dept.searchKeys.some((k) => rem.includes(k) || orig.includes(k));
        });

        dirEntradasCount += entradas.length;
        dirSaidasCount += saidas.length;

        return {
          ...dept,
          entradasDocs: entradas,
          saidasDocs: saidas,
          entradasCount: entradas.length,
          saidasCount: saidas.length,
        };
      });

      totalEntradasGerais += dirEntradasCount;
      totalSaidasGerais += dirSaidasCount;

      return {
        ...dir,
        totalEntradas: dirEntradasCount,
        totalSaidas: dirSaidasCount,
        departments: departmentsWithDocs,
      };
    });

    // Totais específicos do setor do utilizador
    let mySectorEntradas = 0;
    let mySectorSaidas = 0;
    if (userSector) {
      const sectorQuery = (userSector || "").toUpperCase();
      mySectorEntradas = baseDocs.filter((doc) => {
        const enc = (doc.encaminhado || doc.encaminhadoSetor || "").toUpperCase();
        const dest = (doc.rawExpediente?.destino || "").toUpperCase();
        const histStr = JSON.stringify(doc.rawExpediente?.historico || []).toUpperCase();
        return enc.includes(sectorQuery) || dest.includes(sectorQuery) || histStr.includes(sectorQuery);
      }).length;

      mySectorSaidas = baseDocs.filter((doc) => {
        const rem = (doc.remetente || "").toUpperCase();
        const orig = (doc.rawExpediente?.origem || "").toUpperCase();
        return rem.includes(sectorQuery) || orig.includes(sectorQuery);
      }).length;
    }

    // Filtrar estritamente para exibir APENAS o departamento do utilizador logado
    let visibleDirecoes: typeof direcoes = [];
    if (userSector) {
      const uSector = (userSector || "").toUpperCase().trim();
      direcoes.forEach((dir) => {
        const userDepts = dir.departments.filter((dept) => {
          const deptKeyUpper = dept.key.toUpperCase();
          const deptLabelUpper = dept.label.toUpperCase();
          return (
            deptKeyUpper === uSector ||
            deptLabelUpper === uSector ||
            deptKeyUpper.includes(uSector) ||
            uSector.includes(deptKeyUpper) ||
            dept.searchKeys.some((sk) => sk === uSector || uSector.includes(sk) || sk.includes(uSector))
          );
        });

        if (userDepts.length > 0) {
          visibleDirecoes.push({
            ...dir,
            totalEntradas: userDepts.reduce((acc, d) => acc + d.entradasCount, 0),
            totalSaidas: userDepts.reduce((acc, d) => acc + d.saidasCount, 0),
            departments: userDepts,
          });
        }
      });

      // Se não encontrou direção pré-configurada, criar bloco restrito ao departamento do utilizador
      if (visibleDirecoes.length === 0) {
        visibleDirecoes = [
          {
            id: userSector,
            nome: `Direção de Alocação (${userSector})`,
            sigla: userSector.slice(0, 4).toUpperCase(),
            icon: "🏛️",
            colorClass: "border-amber-500/30 text-amber-400 bg-amber-500/10",
            totalEntradas: mySectorEntradas,
            totalSaidas: mySectorSaidas,
            departments: [
              {
                key: userSector,
                label: userSector,
                searchKeys: [userSector.toUpperCase()],
                entradasDocs: baseDocs.filter((d) => {
                  const enc = (d.encaminhado || d.encaminhadoSetor || "").toUpperCase();
                  const dest = (d.rawExpediente?.destino || "").toUpperCase();
                  return enc.includes(uSector) || dest.includes(uSector);
                }),
                saidasDocs: baseDocs.filter((d) => {
                  const rem = (d.remetente || "").toUpperCase();
                  const orig = (d.rawExpediente?.origem || "").toUpperCase();
                  return rem.includes(uSector) || orig.includes(uSector);
                }),
                entradasCount: mySectorEntradas,
                saidasCount: mySectorSaidas,
              },
            ],
          },
        ];
      }
    } else {
      visibleDirecoes = direcoes;
    }

    return {
      direcoes: visibleDirecoes,
      allDirecoes: direcoes,
      totalEntradasGerais,
      totalSaidasGerais,
      mySectorEntradas,
      mySectorSaidas,
    };
  }, [allDocuments, direcoesConfig, userSector]);

  // State para alternar painel de contagem da Secretaria Geral
  const [showSecGeralPanel, setShowSecGeralPanel] = useState(true);
  // State para expandir/recolher Direção ativa no painel (inicializada com a direção do utilizador)
  const [expandedDirecaoId, setExpandedDirecaoId] = useState<string | null>(null);

  useEffect(() => {
    if (secGeralMetrics.direcoes.length > 0) {
      setExpandedDirecaoId(secGeralMetrics.direcoes[0].id);
    }
  }, [secGeralMetrics.direcoes]);
  // State para modal de documentos de Entrada/Saída do Departamento
  const [deptModalData, setDeptModalData] = useState<{
    deptLabel: string;
    direcaoNome: string;
    type: "entradas" | "saidas";
    documents: DocumentItem[];
  } | null>(null);
  const [deptSearchTerm, setDeptSearchTerm] = useState("");

  // Função para Impressão de Ficha Oficial de Expediente em Janela Própria
  const handlePrintDocumentItem = (doc: DocumentItem) => {
    const printWindow = window.open("", "_blank", "width=900,height=1100");
    if (!printWindow) {
      alert("Por favor, permita popups no seu navegador para visualizar a ficha de impressão.");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>SIGEP - Ficha de Expediente ${doc.numeroRastreio}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; padding: 25px; line-height: 1.5; background: #fff; }
            .header-table { width: 100%; border-bottom: 3px double #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
            .logo-title { font-size: 20px; font-weight: 900; color: #d97706; text-transform: ; letter-spacing: 1px; }
            .sub-title { font-size: 11px; font-weight: 700; color: #475569; text-transform: ; }
            .badge-num { font-size: 12px; font-weight: 800; background: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 14px; border-radius: 8px; font-family: monospace; }
            .doc-title { font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 15px; margin-bottom: 6px; }
            .doc-sub { font-size: 11px; color: #64748b; margin-bottom: 20px; font-style: italic; }
            .grid-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
            .grid-table td { padding: 10px 14px; border: 1px solid #e2e8f0; font-size: 11px; vertical-align: top; }
            .grid-table strong { display: block; font-size: 9px; text-transform: ; color: #64748b; margin-bottom: 2px; }
            .hist-header { font-size: 12px; font-weight: 800; text-transform: ; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; }
            .hist-box { background: #f8fafc; border-left: 4px solid #d97706; border-radius: 4px; padding: 10px 14px; margin-bottom: 10px; border-top: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
            .hist-title { font-size: 11px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
            .hist-text { font-size: 11px; color: #334155; margin-bottom: 4px; }
            .hist-meta { font-size: 9px; color: #64748b; }
            .signatures { margin-top: 50px; width: 100%; }
            .sig-cell { text-align: center; width: 50%; font-size: 10px; color: #475569; font-weight: 700; text-transform: ; }
            .sig-line { width: 180px; border-bottom: 1px solid #64748b; margin: 35px auto 6px; }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td>
                <div class="logo-title">SIGEP — SongoFI</div>
                <div class="sub-title">Instituto Superior Politécnico da Fonseca e Filhos | Repositório Geral</div>
              </td>
              <td style="text-align: right;">
                <span class="badge-num">${doc.numeroRastreio}</span>
              </td>
            </tr>
          </table>

          <div class="doc-title">${doc.assunto}</div>
          <div class="doc-sub">Ficheiro: ${doc.nomeArquivo} | Data de Recebimento: ${doc.dataRecebimento}</div>

          <table class="grid-table">
            <tr>
              <td width="50%">
                <strong>Remetente / Origem:</strong>
                <span style="font-weight:700; color:#0f172a;">${doc.remetente}</span>
              </td>
              <td width="50%">
                <strong>Destinatário / Destino:</strong>
                <span style="font-weight:700; color:#1d4ed8;">${doc.encaminhado}</span>
              </td>
            </tr>
            <tr>
              <td>
                <strong>Tipo de Expediente:</strong>
                ${doc.tipoDocumento}
              </td>
              <td>
                <strong>Estado de Tramitação:</strong>
                <span style="font-weight:700; color:#047857;">${doc.status}</span>
              </td>
            </tr>
          </table>

          <div class="hist-header">Histórico Completo de Pareceres e Despachos</div>
          ${
            doc.rawExpediente?.historico && doc.rawExpediente.historico.length > 0
              ? doc.rawExpediente.historico
                  .map(
                    (h: any) => `
                    <div class="hist-box">
                      <div class="hist-title">${h.setor || "Setor"} — ${h.acao || "Tramitação"}</div>
                      <div class="hist-text">"${h.parecer || "Processado sem observações"}"</div>
                      <div class="hist-meta">Responsável: ${h.responsavel || "Gestor"} (${h.cargo || "Oficial"}) | Data: ${
                      h.data ? new Date(h.data).toLocaleDateString("pt-MZ") : doc.dataRecebimento
                    }</div>
                    </div>
                  `
                  )
                  .join("")
              : `
                <div class="hist-box">
                  <div class="hist-title">Registo Inicial de Entrada</div>
                  <div class="hist-text">Documento registado no repositório de expedientes em conformidade.</div>
                </div>
              `
          }

          <table class="signatures">
            <tr>
              <td class="sig-cell">
                <div class="sig-line"></div>
                Secretaria Geral / Expediente
              </td>
              <td class="sig-cell">
                <div class="sig-line"></div>
                Visto da Direção Geral
              </td>
            </tr>
          </table>

          <script>
            window.onload = function() {
              printElementById("print-area");
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Função para Download do Documento
  const handleDownloadDocItem = (doc: DocumentItem) => {
    if (doc.arquivoUrl) {
      const a = document.createElement("a");
      a.href = doc.arquivoUrl;
      a.download = doc.nomeArquivo;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const content = `=======================================================
SIGEP - SongoFI | FICHA DE EXPEDIENTE INSTITUCIONAL
=======================================================
Número de Rastreio: ${doc.numeroRastreio}
Assunto: ${doc.assunto}
Remetente (Origem): ${doc.remetente}
Destinatário (Destino): ${doc.encaminhado}
Data de Recebimento: ${doc.dataRecebimento}
Status: ${doc.status}
Tipo de Documento: ${doc.tipoDocumento}
Ficheiro Associado: ${doc.nomeArquivo}

=======================================================
HISTÓRICO DE TRAMITAÇÃO
=======================================================
${
  doc.rawExpediente?.historico
    ? doc.rawExpediente.historico
        .map(
          (h: any) =>
            `• [${h.setor || "Setor"}] ${h.acao}: ${h.parecer || "N/A"} (${
              h.responsavel || "Resp"
            })`
        )
        .join("\n")
    : "Sem pareceres registados."
}
=======================================================
Data de Emissão: ${new Date().toLocaleString("pt-MZ")}
`;
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.nomeArquivo.endsWith(".pdf") || doc.nomeArquivo.endsWith(".txt") ? doc.nomeArquivo : `${doc.nomeArquivo}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    setActionSuccessMessage(`Download do documento "${doc.nomeArquivo}" concluído!`);
    setTimeout(() => setActionSuccessMessage(""), 3500);
  };

  // Helper de badges e ícones de status em tempo real (Conforme Ciclo do Repositório)
  const getStatusBadge = (statusStr: string) => {
    const st = (statusStr || "").toLowerCase();
    if (st.includes("pendente")) {
      return {
        label: "Pendente",
        icon: "⏳",
        colorClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      };
    }
    if (st.includes("devolvido")) {
      return {
        label: "Devolvido",
        icon: "❌",
        colorClass: "bg-red-500/10 text-red-400 border-red-500/30",
      };
    }
    if (st.includes("aprovado") || st.includes("autorizado") || st.includes("homologado") || st.includes("concluído") || st.includes("concluido")) {
      return {
        label: "Aprovado",
        icon: "✓",
        colorClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      };
    }
    if (st.includes("arquivado")) {
      return {
        label: "Arquivado",
        icon: "📁",
        colorClass: "bg-slate-500/10 text-slate-300 border-slate-500/30",
      };
    }
    return {
      label: "Em Análise",
      icon: "🔍",
      colorClass: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    };
  };

  // Filtrar documentos por busca e múltiplos critérios (Beneficiário, Assunto, Nº de Rastreio, Tipo, Setor, Status)
  const filteredDocuments = useMemo(() => {
    return allDocuments.filter((doc) => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const raw = doc.rawExpediente;
        const matchSearch =
          (doc.beneficiario || "").toLowerCase().includes(term) ||
          doc.assunto.toLowerCase().includes(term) ||
          doc.numeroRastreio.toLowerCase().includes(term) ||
          doc.remetente.toLowerCase().includes(term) ||
          doc.nomeArquivo.toLowerCase().includes(term) ||
          doc.encaminhado.toLowerCase().includes(term) ||
          (raw?.beneficiario || "").toLowerCase().includes(term) ||
          (raw?.nomeBeneficiario || "").toLowerCase().includes(term) ||
          (raw?.solicitante || "").toLowerCase().includes(term) ||
          (raw?.interessado || "").toLowerCase().includes(term) ||
          (raw?.funcionario || "").toLowerCase().includes(term) ||
          (raw?.guiaViagem?.beneficiario || "").toLowerCase().includes(term) ||
          (raw?.guiaViagem?.numeroGuia || "").toLowerCase().includes(term) ||
          (raw?.referenciaExterna || "").toLowerCase().includes(term) ||
          (raw?.numero || "").toLowerCase().includes(term);
        if (!matchSearch) return false;
      }

      if (filterStatus !== "todos") {
        const st = doc.status.toLowerCase();
        if (filterStatus === "pendente" && !st.includes("pendente")) return false;
        if (filterStatus === "analise" && !st.includes("análise") && !st.includes("tramitação") && !st.includes("ida") && !st.includes("volta") && !st.includes("aguardando")) return false;
        if (filterStatus === "aprovado" && !st.includes("aprovado") && !st.includes("autorizado") && !st.includes("homologado") && !st.includes("concluído") && !st.includes("concluido")) return false;
        if (filterStatus === "devolvido" && !st.includes("devolvido")) return false;
        if (filterStatus === "arquivado" && !st.includes("arquivado")) return false;
      }

      if (filterTipo !== "todos") {
        const tp = (doc.tipoDocumento || "").toLowerCase();
        const ass = (doc.assunto || "").toLowerCase();
        const isViag = (doc as any).isDocumentoViagem || doc.rawExpediente?.isDocumentoViagem || tp.includes("viagem") || ass.includes("viagem") || ass.includes("missão") || ass.includes("missao");
        if (filterTipo === "viagem" && !isViag) return false;
        if (filterTipo === "normal" && isViag) return false;
      }

      // Regra de Ocultação/Isolamento por Setor:
      // O acesso é restrito apenas ao setor do utilizador
      const sectorQuery = (userSector || "").toLowerCase().trim();

      if (sectorQuery) {
        const remet = (doc.remetente || "").toLowerCase();
        const encam = (doc.encaminhado || doc.encaminhadoSetor || "").toLowerCase();
        const orig = (doc.rawExpediente?.origem || doc.rawExpediente?.emitidoPor || "").toLowerCase();
        const dest = (doc.rawExpediente?.destino || doc.rawExpediente?.currentStep || (doc.rawExpediente as any)?.nextStepRecipient || "").toLowerCase();
        
        // Verificar histórico completo de tramitação (pareceres, despachos e vistos)
        const historicoStr = JSON.stringify(doc.rawExpediente?.historico || []).toLowerCase();

        const keywords = sectorQuery.split(/[\/\s-]+/).filter((k) => k.length > 2);

        const isTramitadoPeloSetor =
          remet.includes(sectorQuery) ||
          encam.includes(sectorQuery) ||
          orig.includes(sectorQuery) ||
          dest.includes(sectorQuery) ||
          historicoStr.includes(sectorQuery) ||
          keywords.some(
            (kw) =>
              remet.includes(kw) ||
              encam.includes(kw) ||
              orig.includes(kw) ||
              dest.includes(kw) ||
              historicoStr.includes(kw)
          );

        if (!isTramitadoPeloSetor) return false;
      }

      return true;
    });
  }, [allDocuments, searchTerm, filterStatus, filterTipo, filterSetor, userSector]);

  // Documento atualmente selecionado para pré-visualização
  const selectedDoc = useMemo(() => {
    return allDocuments.find((d) => d.id === selectedDocId) || allDocuments[0];
  }, [allDocuments, selectedDocId]);

  // Objeto Expediente formatado para o leitor e módulo de assinaturas
  const docExpedienteFormatado = useMemo<any>(() => {
    if (!selectedDoc) return null;
    if (selectedDoc.rawExpediente) return selectedDoc.rawExpediente;

    return {
      id: selectedDoc.id,
      numero: selectedDoc.numeroRastreio,
      data: selectedDoc.dataRecebimento,
      origem: selectedDoc.remetente,
      destino: selectedDoc.encaminhado,
      assunto: selectedDoc.assunto,
      tipo: (selectedDoc.tipoDocumento as any) || "Entrada",
      status: selectedDoc.status,
      arquivoUrl: selectedDoc.arquivoUrl,
      nomeArquivo: selectedDoc.nomeArquivo,
      tipoArquivo: selectedDoc.nomeArquivo.toLowerCase().endsWith(".xlsx") || selectedDoc.nomeArquivo.toLowerCase().endsWith(".xls")
        ? "xlsx"
        : selectedDoc.nomeArquivo.toLowerCase().endsWith(".docx") || selectedDoc.nomeArquivo.toLowerCase().endsWith(".doc")
        ? "docx"
        : "pdf",
      tamanhoArquivo: "245 KB",
      despacho: {
        texto: "Documento analisado e validado em conformidade com as diretrizes do Conselho de Direção.",
        data: new Date().toISOString(),
        responsavel: selectedDoc.encaminhado,
        cargo: "Direção Geral",
      },
      historico: [
        {
          data: new Date().toISOString(),
          setor: selectedDoc.remetente,
          acao: "Emissão e Registo Institucional",
          parecer: "Documento emitido para apreciação e validação do Conselho de Direção.",
          responsavel: selectedDoc.remetente,
          cargo: selectedDoc.remetenteCargo,
        },
      ],
    };
  }, [selectedDoc]);

  // Atualização em tempo real vinda do leitor de documentos
  const handleUpdateFromReader = async (updatedExp: Expediente) => {
    try {
      if (onUpdateExpediente) {
        await onUpdateExpediente(updatedExp);
      }
      setActionSuccessMessage(`Documento "${updatedExp.nomeArquivo || updatedExp.assunto}" assinado e atualizado com sucesso!`);
      setTimeout(() => setActionSuccessMessage(""), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  // Ações de download
  const handleBaixarDocumento = () => {
    if (!selectedDoc) return;
    const jsonContent = JSON.stringify(selectedDoc, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = selectedDoc.nomeArquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setActionSuccessMessage(`Documento "${selectedDoc.nomeArquivo}" descarregado com sucesso!`);
    setTimeout(() => setActionSuccessMessage(""), 3500);
  };

  // Ação de encaminhar / despachar por setor com funções específicas
  const handleEncaminhar = async () => {
    if (!selectedDoc) return;

    const isViagemDoc =
      (selectedDoc as any).isDocumentoViagem ||
      (selectedDoc.rawExpediente as any)?.isDocumentoViagem ||
      (selectedDoc.assunto || "").toLowerCase().includes("viagem") ||
      (selectedDoc.assunto || "").toLowerCase().includes("missao") ||
      (selectedDoc.assunto || "").toLowerCase().includes("missão") ||
      (selectedDoc.assunto || "").toLowerCase().includes("transporte") ||
      (selectedDoc.assunto || "").toLowerCase().includes("deslocacao") ||
      (selectedDoc.assunto || "").toLowerCase().includes("deslocação");

    if (!destinatario.trim() && decisaoSetor !== "devolver" && !setorAtuante.includes("RH") && !setorAtuante.includes("Recursos Humanos")) {
      alert("Por favor, selecione o setor ou órgão de destino.");
      return;
    }

    const now = new Date().toISOString();
    const responsavelNome = user?.nome || user?.name || user?.email || "Gestor do Setor";
    const responsavelCargo = user?.cargo || `Responsável da ${setorAtuante}`;

    let acaoTitulo = "";
    let parecerFinal = "";
    let novoStatus = "";
    let novaEtapa: "ida" | "rh" | "volta" | "concluido" = selectedDoc.rawExpediente?.fluxoViagemEtapa || "ida";
    let novaGuiaViagem = selectedDoc.rawExpediente?.guiaViagem;
    let proximoDestino = destinatario;

    if (setorAtuante === "Secretaria Geral" || setorAtuante.includes("Secretaria Geral (1)")) {
      if (decisaoSetor === "devolver") {
        acaoTitulo = "Devolvido ao Remetente (Secretaria Geral)";
        parecerFinal = parecerTexto || "Documento devolvido pela Secretaria Geral ao remetente por desconformidade.";
        novoStatus = "Devolvido ao Remetente";
        proximoDestino = selectedDoc.remetente || "Remetente";
      } else {
        proximoDestino = isViagemDoc ? "DPEP - Planificação, Estudos e Projetos" : destinatario || "Setor Técnico / Administrativo";
        acaoTitulo = `Protocolado & Encaminhado para ${proximoDestino}`;
        parecerFinal = parecerTexto || `Documento protocolado na Secretaria Geral e encaminhado para ${proximoDestino}.`;
        novoStatus = `Em Análise - ${proximoDestino}`;
      }
    } else if (setorAtuante.includes("Setor Técnico") || setorAtuante.includes("Técnico")) {
      proximoDestino = isViagemDoc ? "DPEP" : destinatario || "Secretaria Executiva";
      acaoTitulo = "Análise & Parecer do Setor Técnico/Administrativo";
      parecerFinal = parecerTexto ? `Parecer Técnico: ${parecerTexto}` : "Documento analisado e parecer técnico favorável registrado pelo Setor Técnico/Administrativo.";
      novoStatus = `Em Análise - ${proximoDestino}`;
    } else if (setorAtuante.includes("DPEP") && !setorAtuante.includes("Retorno")) {
      const conf = decisaoSetor === "planificada" ? "Atividade Planificada no PAO" : "Atividade Não Planificada";
      proximoDestino = isViagemDoc ? "Departamento de Administração e Finanças (DAF)" : destinatario || "DAF";
      acaoTitulo = `Parecer DPEP: Conformidade (${conf})`;
      parecerFinal = parecerTexto ? `Parecer de Conformidade DPEP [${conf}]: ${parecerTexto}` : `Parecer de Conformidade da Atividade DPEP: ${conf}.`;
      novoStatus = `Em Análise - ${proximoDestino}`;
    } else if (setorAtuante.includes("DAF") && !setorAtuante.includes("Retorno")) {
      const fin = decisaoSetor === "com_cabimento" ? "Com Disponibilidade Financeira / Cabimento" : "Sem Disponibilidade Financeira";
      proximoDestino = isViagemDoc ? "Repartição de Transporte" : destinatario || "Transporte";
      acaoTitulo = `Parecer DAF: Disponibilidade Financeira (${fin})`;
      parecerFinal = parecerTexto ? `Parecer DAF [${fin}]: ${parecerTexto}` : `Parecer DAF da Disponibilidade Financeira: ${fin}.`;
      novoStatus = `Em Análise - ${proximoDestino}`;
    } else if (setorAtuante.includes("Transporte") && !setorAtuante.includes("Retorno")) {
      const trsp = decisaoSetor === "com_transporte" ? "Com Disponibilidade de Transporte / Meios Alocados" : "Sem Disponibilidade de Transporte";
      proximoDestino = isViagemDoc ? "Direção da DICOSAFA" : destinatario || "DICOSAFA";
      acaoTitulo = `Parecer Repartição de Transporte (${trsp})`;
      parecerFinal = parecerTexto ? `Parecer Transporte [${trsp}]: ${parecerTexto}` : `Parecer da Repartição de Transporte: ${trsp}.`;
      novoStatus = `Em Análise - ${proximoDestino}`;
    } else if (setorAtuante.includes("DICOSAFA") && !setorAtuante.includes("Retorno")) {
      proximoDestino = isViagemDoc ? "Secretaria Executiva" : destinatario || "Gabinete do Diretor-Geral";
      acaoTitulo = "Parecer Técnico DICOSAFA";
      parecerFinal = parecerTexto ? `Parecer Técnico DICOSAFA: ${parecerTexto}` : "Parecer técnico e operacional favorável emitido pelo Diretor da DICOSAFA.";
      novoStatus = `Em Análise - ${proximoDestino}`;
    } else if (setorAtuante.includes("Secretaria Executiva") && !setorAtuante.includes("Retorno")) {
      proximoDestino = "Gabinete do Diretor-Geral";
      acaoTitulo = "Secretaria Executiva: Revisão & Preparo para Despacho";
      parecerFinal = parecerTexto || "Documento revisado pela Secretaria Executiva e preparado para despacho do Diretor-Geral.";
      novoStatus = `Em Análise - Gabinete do Diretor-Geral`;
    } else if (setorAtuante.includes("Diretor-Geral") || setorAtuante.includes("Gabinete")) {
      const desp = decisaoSetor === "homologado" ? "Homologado" : decisaoSetor === "devolver" || decisaoSetor === "indeferido" ? "Devolvido" : decisaoSetor === "arquivado" ? "Arquivado" : "Aprovado";
      acaoTitulo = `Despacho Oficial do Diretor-Geral: ${desp}`;
      parecerFinal = parecerTexto ? `Despacho Oficial [${desp}]: ${parecerTexto}` : `Despacho Oficial do Diretor Geral: Documento ${desp}.`;
      if (isViagemDoc && (desp === "Aprovado" || desp === "Homologado")) {
        proximoDestino = "Recursos Humanos (RH)";
        novoStatus = "Aguardando Guia - Recursos Humanos (RH)";
        novaEtapa = "rh";
      } else if (desp === "Arquivado") {
        proximoDestino = "Repositório Institucional";
        novoStatus = "Arquivado no Repositório";
        novaEtapa = "concluido";
      } else if (desp === "Devolvido") {
        proximoDestino = selectedDoc.remetente || "Remetente";
        novoStatus = "Devolvido ao Remetente";
        novaEtapa = "concluido";
      } else {
        proximoDestino = selectedDoc.remetente || "Remetente";
        novoStatus = "Aprovado - Devolvido ao Remetente";
        novaEtapa = "concluido";
      }
    } else if (setorAtuante.includes("RH") || setorAtuante.includes("Recursos Humanos")) {
      // RH Emite a Guia de Viagem / Apresentação
      const numG = guiaNumero || `GV-${new Date().getFullYear()}/042`;
      const benG = guiaBeneficiario || selectedDoc.remetente || "Beneficiário / Viajante";
      const destG = guiaDestino || selectedDoc.assunto || "Delegação Provincial";
      const perG = guiaPeriodo || "Datas aprovadas conforme pedido";
      const meiG = guiaMeios || "Viatura / Meios Institucionais Alocados";

      novaGuiaViagem = {
        numeroGuia: numG,
        beneficiario: benG,
        destinoViagem: destG,
        periodo: perG,
        meiosAlocados: meiG,
        emitidoPor: responsavelNome,
        dataEmissao: now,
      };

      acaoTitulo = `Guia de Viagem emitida pelo RH (${numG})`;
      parecerFinal = parecerTexto
        ? `Guia de Viagem nº ${numG} emitida para ${benG} (Destino: ${destG}, Período: ${perG}). Observações RH: ${parecerTexto}`
        : `Guia de Viagem nº ${numG} emitida com sucesso pelo Recursos Humanos para ${benG} (Destino: ${destG}, Período: ${perG}). Documento remetido para a rota de retorno.`;
      
      proximoDestino = "Secretaria Executiva (Retorno)";
      novoStatus = "Em Tramitação (Volta) - Secretaria Executiva";
      novaEtapa = "volta";
    } else if (setorAtuante.includes("Secretaria Executiva (Retorno)")) {
      proximoDestino = "Direção da DICOSAFA (Retorno)";
      acaoTitulo = "Retorno: Tramitado pela Secretaria Executiva";
      parecerFinal = parecerTexto || "Expediente com despacho e Guia de Viagem tramitado em devolução para a DICOSAFA.";
      novoStatus = "Em Tramitação (Volta) - Direção da DICOSAFA";
    } else if (setorAtuante.includes("DICOSAFA (Retorno)")) {
      proximoDestino = "Repartição de Transporte (Retorno)";
      acaoTitulo = "Retorno: Tramitado pela DICOSAFA";
      parecerFinal = parecerTexto || "Expediente com despacho e Guia de Viagem tramitado em devolução para a Repartição de Transporte.";
      novoStatus = "Em Tramitação (Volta) - Repartição de Transporte";
    } else if (setorAtuante.includes("Transporte (Retorno)")) {
      proximoDestino = "DAF (Retorno)";
      acaoTitulo = "Retorno: Tramitado pelo Transporte";
      parecerFinal = parecerTexto || "Expediente com despacho e Guia de Viagem tramitado em devolução para a DAF.";
      novoStatus = "Em Tramitação (Volta) - DAF";
    } else if (setorAtuante.includes("DAF (Retorno)")) {
      proximoDestino = "DPEP (Retorno)";
      acaoTitulo = "Retorno: Tramitado pela DAF";
      parecerFinal = parecerTexto || "Expediente com despacho e Guia de Viagem tramitado em devolução para a DPEP.";
      novoStatus = "Em Tramitação (Volta) - DPEP";
    } else if (setorAtuante.includes("DPEP (Retorno)")) {
      proximoDestino = "Secretaria Geral (Retorno)";
      acaoTitulo = "Retorno: Tramitado pela DPEP";
      parecerFinal = parecerTexto || "Expediente com despacho e Guia de Viagem tramitado em devolução para a Secretaria Geral.";
      novoStatus = "Em Tramitação (Volta) - Secretaria Geral";
    } else if (setorAtuante.includes("Secretaria Geral (Retorno)")) {
      proximoDestino = selectedDoc.remetente || "Remetente";
      acaoTitulo = "Retorno Concluído: Entregue ao Remetente";
      parecerFinal = parecerTexto || "Expediente finalizado com todos os pareceres, despacho do Diretor-Geral e Guia de Viagem do RH entregue ao Remetente.";
      novoStatus = "Concluído - Recebido pelo Remetente";
      novaEtapa = "concluido";
    } else {
      acaoTitulo = `Parecer e Encaminhado de ${setorAtuante} para ${proximoDestino}`;
      parecerFinal = parecerTexto || `Documento analisado pelo setor ${setorAtuante} e encaminhado.`;
      novoStatus = `Em Tramitação - ${proximoDestino}`;
    }

    const currentExp = selectedDoc.rawExpediente || {
      id: selectedDoc.id,
      numero: selectedDoc.numeroRastreio,
      data: selectedDoc.dataRecebimento,
      origem: selectedDoc.remetente,
      destino: proximoDestino || "Secretaria Geral",
      assunto: selectedDoc.assunto,
      tipo: (selectedDoc.tipoDocumento as any) || "Entrada",
      status: novoStatus,
      nomeArquivo: selectedDoc.nomeArquivo,
      arquivoUrl: selectedDoc.arquivoUrl,
    };

    const isDespachoFinal = setorAtuante.includes("Diretor-Geral") || setorAtuante.includes("Gabinete");

    const updatedExp: any = {
      ...currentExp,
      id: selectedDoc.id,
      origem: selectedDoc.remetente || "Remetente",
      destino: proximoDestino || currentExp.destino,
      status: novoStatus,
      isDocumentoViagem: isViagemDoc,
      fluxoViagemEtapa: novaEtapa,
      guiaViagem: novaGuiaViagem,
      dataDespacho: now,
      despacho: isDespachoFinal
        ? {
            texto: parecerFinal,
            data: now,
            responsavel: responsavelNome,
            cargo: responsavelCargo,
          }
        : (currentExp as any).despacho,
      historico: [
        ...((currentExp as any).historico || []),
        {
          data: now,
          setor: setorAtuante,
          acao: acaoTitulo,
          parecer: parecerFinal,
          responsavel: responsavelNome,
          cargo: responsavelCargo,
        },
      ],
    };

    try {
      if (onUpdateExpediente) {
        await onUpdateExpediente(updatedExp);
      } else {
        await firestoreService.expedientes.update(updatedExp.id, updatedExp);
      }

      setSelectedDocId(updatedExp.id);
      setShowEncaminharModal(false);
      setParecerTexto("");
      setActionSuccessMessage(`Tramitação do setor ${setorAtuante} registada com sucesso no repositório!`);
      setTimeout(() => setActionSuccessMessage(""), 4000);
    } catch (err) {
      console.error("Erro ao tramitar documento:", err);
      alert("Erro ao registar a tramitação do documento.");
    }
  };

  // Menu lateral com os submenus integrados dentro de Gestão de Expediente
  const sideMenuItems = [
    { title: "Histórico de Documentos", icon: FolderOpen },
    { title: "Fluxo de Tramitação", icon: Share2 },
    { title: "Documentos Normativos", icon: FileText },
    { title: "Relatórios", icon: BarChart3 },
    { title: "Balanço", icon: TrendingUp },
    { title: "Assinatura Digital", icon: Pen },
  ];

  const handleMenuClick = (itemTitle: string) => {
    setActiveMenuItem(itemTitle);
    if (onNavigate) {
      onNavigate(itemTitle);
    }
  };

  return (
      <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 font-sans overflow-hidden select-none">
      {/* CABEÇALHO PADRÃO DO SISTEMA */}
      <MainHeader
        user={user}
        onBack={onBack}
        showBack={true}
        title={
          activeMenuItem === "Histórico de Documentos"
            ? (title || "GESTÃO DE EXPEDIENTE")
            : `${title || "GESTÃO DE EXPEDIENTE"} - ${activeMenuItem.toUpperCase()}`
        }
        onLogout={onLogout}
      />


      {/* MENSAGEM DE ALERTA DE SUCESSO / NOTIFICAÇÃO */}
      {actionSuccessMessage && (
        <div className="w-full bg-emerald-600/90 text-white text-xs font-bold py-2 px-4 text-center transition-all animate-fade-in shadow-lg">
          ✓ {actionSuccessMessage}
        </div>
      )}

      {/* 3. CORPO PRINCIPAL: MENU LATERAL + TABELA DE HISTÓRICO + PRÉ-VISUALIZAÇÃO */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        {/* MENU LATERAL ESQUERDO REFINADO */}
        <aside
          className={`bg-slate-950 border-r border-slate-800/40 flex flex-col justify-between transition-all duration-500 relative z-20 shrink-0 ${
            isSidebarCollapsed ? "w-20 p-3" : "w-64 p-5"
          }`}
        >
          {/* Botão de minimizar/expandir lateral */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute top-1/2 -translate-y-1/2 -right-3 z-30 w-6 h-12 rounded-r-xl bg-slate-900 border border-slate-800 border-l-0 text-slate-500 hover:text-amber-500 hover:bg-slate-800 flex items-center justify-center shadow-2xl transition-all"
          >
            {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          <div className="flex flex-col">
            {/* Botão + Novo Registo no Topo da Sidebar */}
            <button
              onClick={() => setShowNovoModal(true)}
              className={`w-full flex items-center justify-center gap-2.5 px-4 py-3.5 bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white rounded-2xl text-[11px] font-black shadow-xl shadow-emerald-950/20 transition-all mb-8 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 ${
                isSidebarCollapsed ? "p-3 justify-center" : ""
              }`}
            >
              <Plus size={18} strokeWidth={3} />
              {!isSidebarCollapsed && <span className=" tracking-widest">Novo Registo</span>}
            </button>

            {/* Lista de Itens do Menu */}
            <nav className="space-y-1.5 overflow-y-auto no-scrollbar">
              {sideMenuItems.map((item) => {
                const isActive = activeMenuItem === item.title;
                const Icon = item.icon;
                return (
                  <button
                    key={item.title}
                    onClick={() => handleMenuClick(item.title)}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-left transition-all relative group ${
                      isActive
                        ? "bg-slate-900 text-amber-400 font-bold border border-slate-800 shadow-xl"
                        : "bg-transparent text-slate-500 hover:bg-slate-900/40 hover:text-slate-200"
                    } ${isSidebarCollapsed ? "justify-center px-2" : ""}`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-3 bottom-3 w-1 bg-amber-500 rounded-r-full shadow-[0_0_8px_#f59e0b]" />
                    )}
                    <Icon
                      size={18}
                      className={`shrink-0 transition-colors ${isActive ? "text-amber-400" : "text-slate-600 group-hover:text-slate-400"}`}
                    />
                    {!isSidebarCollapsed && (
                      <span className="text-[11px] font-black  tracking-wider truncate">
                        {item.title}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-6 border-t border-slate-900 flex flex-col items-center gap-1">
            <span className="text-[9px] text-slate-700 font-black tracking-widest ">
              SIGEP v2.6
            </span>
            {!isSidebarCollapsed && (
              <span className="text-[8px] text-slate-800 font-bold">
                Songo • INSTITUCIONAL
              </span>
            )}
          </div>
        </aside>

        {/* CONTEÚDO CONDICIONAL */}
        {activeMenuItem === "Histórico de Documentos" && (
          <>
            {/* PAINEL CENTRAL REFINADO */}
            <section className="flex-1 flex flex-col p-8 overflow-y-auto border-r border-slate-900 bg-slate-950 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/20 via-transparent to-transparent pointer-events-none" />
              
              {/* Cabeçalho da Seção */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-900 relative z-10">
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-black text-white tracking-tight leading-none">
                    Repositório Institucional
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Gestão centralizada de expedientes, rastreabilidade e histórico em tempo real
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Filtro Busca */}
                  <div className="relative group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500 transition-colors" size={14} />
                    <input
                      type="text"
                      placeholder="Pesquisar por beneficiário, assunto, nº rastreio..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64 pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-[11px] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all shadow-inner"
                    />
                  </div>

                  {/* Filtro Status */}
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-[11px] text-amber-400 font-bold focus:outline-none focus:border-amber-500/50 transition-all"
                  >
                    <option value="todos">Status: Todos</option>
                    <option value="pendente">⏳ Pendente</option>
                    <option value="analise">🔍 Em Análise</option>
                    <option value="aprovado">✓ Aprovado</option>
                    <option value="devolvido">❌ Devolvido</option>
                    <option value="arquivado">📁 Arquivado</option>
                  </select>

                  {/* Filtro Tipo */}
                  <select
                    value={filterTipo}
                    onChange={(e) => setFilterTipo(e.target.value)}
                    className="bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-[11px] text-slate-300 font-bold focus:outline-none focus:border-amber-500/50 transition-all"
                  >
                    <option value="todos">Tipo: Todos</option>
                    <option value="normal">📄 Documentos Normais</option>
                    <option value="viagem">✈ Expedientes de Viagem</option>
                  </select>

                  {/* Departamento Isolado do Utilizador Logado */}
                  <div className="bg-slate-900/80 border border-slate-800 text-amber-400 rounded-xl px-3 py-2 text-[11px] font-bold shadow-inner flex items-center gap-1.5 whitespace-nowrap">
                    <span>🔒 Setor:</span>
                    <span className="text-white font-extrabold">{userSector}</span>
                  </div>
                </div>
              </div>

              {/* BANNER INFORMATIVO DE PERMISSÕES E ISOLAMENTO DE HISTÓRICO DE DOCUMENTOS */}
              <div className="mb-6 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-300 text-xs shadow-lg relative z-10">
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 font-bold text-base shrink-0">🔒</span>
                    <div>
                      <span className="font-black text-white  tracking-wider block text-xs">
                        Acesso Restrito ao Historial do Setor: {userSector}
                      </span>
                      <span className="text-[11px] text-amber-200/80 font-normal">
                        Você tem acesso exclusivo às Entradas e Saídas do seu departamento. O histórico geral é reservado à Secretaria Geral, Secretaria Executiva e Direção Geral.
                      </span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-[10px] font-black  text-amber-300 whitespace-nowrap self-start sm:self-center">
                    Setor Ativo: {userSector}
                  </span>
                </div>

              {/* PAINEL HIERÁRQUICO DE DIREÇÕES E DEPARTAMENTOS */}
              <div className="mb-6 bg-slate-900/95 border border-slate-800 rounded-2xl p-4 relative z-10 shadow-2xl space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 text-amber-400 font-bold text-xl shadow-inner">🏛️</span>
                    <div>
                      <h3 className="text-xs font-black  text-white tracking-wider flex items-center gap-2">
                          <span>Historial de Entradas e Saídas do Departamento: {userSector}</span>
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {`Exibindo a contagem e documentos de Entrada e Saída específicos de ${userSector}. Clique nos botões para abrir a lista.`}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-emerald-500/30 text-emerald-400 text-[10px] font-black shadow-inner">
                          <span>📥 ENTRADAS ({userSector}):</span>
                          <span className="text-xs text-white">{secGeralMetrics.mySectorEntradas}</span>
                        </div>

                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-blue-500/30 text-blue-400 text-[10px] font-black shadow-inner">
                          <span>📤 SAÍDAS ({userSector}):</span>
                          <span className="text-xs text-white">{secGeralMetrics.mySectorSaidas}</span>
                        </div>

                    <button
                      type="button"
                      onClick={() => setShowSecGeralPanel(!showSecGeralPanel)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-[10px] font-black  tracking-wider transition-all flex items-center gap-1.5 border border-amber-500/20"
                    >
                      {showSecGeralPanel ? (
                        <><span>Recolher Painel</span> <ChevronUp className="w-3.5 h-3.5" /></>
                      ) : (
                        <><span>Expandir Direções</span> <ChevronDown className="w-3.5 h-3.5" /></>
                      )}
                    </button>
                  </div>
                </div>

                {showSecGeralPanel && (
                  <div className="space-y-3 pt-1">
                    {/* LISTA DE DIREÇÕES */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                      {secGeralMetrics.direcoes.map((dir) => {
                        const isExpanded = expandedDirecaoId === dir.id;
                        return (
                          <button
                            key={dir.id}
                            type="button"
                            onClick={() => setExpandedDirecaoId(isExpanded ? null : dir.id)}
                            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 relative overflow-hidden group ${
                              isExpanded
                                ? "bg-slate-800/90 border-amber-500/60 ring-2 ring-amber-500/30 shadow-lg"
                                : "bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80"
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-lg">{dir.icon}</span>
                              <span className={`text-[9px] font-black  px-2 py-0.5 rounded-full border ${dir.colorClass}`}>
                                {dir.sigla}
                              </span>
                            </div>

                            <div>
                              <div className="text-[11px] font-extrabold text-white truncate group-hover:text-amber-300 transition-colors">
                                {dir.nome}
                              </div>
                              <div className="text-[9px] text-slate-400 font-medium">
                                {dir.departments.length} Departamento(s)
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[10px] font-black pt-1 border-t border-slate-800/80">
                              <span className="text-emerald-400">📥 {dir.totalEntradas}</span>
                              <span className="text-blue-400">📤 {dir.totalSaidas}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* DEPARTAMENTOS DA DIREÇÃO EXPANDIDA */}
                    {expandedDirecaoId && (
                      <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl space-y-3 animate-fadeIn">
                        {(() => {
                          const activeDir = secGeralMetrics.direcoes.find((d) => d.id === expandedDirecaoId);
                          if (!activeDir) return null;

                          return (
                            <>
                              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xl">{activeDir.icon}</span>
                                  <div>
                                    <h4 className="text-xs font-black  tracking-wider text-amber-400">
                                      {activeDir.nome}
                                    </h4>
                                    <p className="text-[10px] text-slate-400 font-medium">
                                      Departamentos subordinados e contagem de expedições
                                    </p>
                                  </div>
                                </div>
                                <span className="text-[10px] text-slate-400 font-bold bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                                  {activeDir.departments.length} Departamentos
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {activeDir.departments.map((dept) => (
                                  <div
                                    key={dept.key}
                                    className="p-3.5 bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 rounded-xl flex flex-col justify-between gap-3 shadow-md transition-all"
                                  >
                                    <div>
                                      <div className="flex items-center justify-between gap-1 mb-1">
                                        <span className="text-[11px] font-bold text-white tracking-wide">
                                          {dept.label}
                                        </span>
                                      </div>
                                      <span className="text-[9px] text-slate-400 font-medium block">
                                        Código/Ref: {dept.key}
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                      {/* BOTÃO ENTRADAS DO DEPARTAMENTO */}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setDeptModalData({
                                            deptLabel: dept.label,
                                            direcaoNome: activeDir.nome,
                                            type: "entradas",
                                            documents: dept.entradasDocs,
                                          })
                                        }
                                        className="p-2.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-300 transition-all text-center group flex flex-col items-center justify-center gap-0.5"
                                      >
                                        <span className="text-[9px]  tracking-widest font-black text-emerald-400 group-hover:scale-105 transition-transform">
                                          📥 Entradas
                                        </span>
                                        <span className="text-sm font-black text-white">
                                          {dept.entradasCount} doc(s)
                                        </span>
                                        <span className="text-[8px] text-emerald-400/80 font-semibold underline underline-offset-2">
                                          Abrir Lista →
                                        </span>
                                      </button>

                                      {/* BOTÃO SAÍDAS DO DEPARTAMENTO */}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setDeptModalData({
                                            deptLabel: dept.label,
                                            direcaoNome: activeDir.nome,
                                            type: "saidas",
                                            documents: dept.saidasDocs,
                                          })
                                        }
                                        className="p-2.5 rounded-lg bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/30 hover:border-blue-500/60 text-blue-300 transition-all text-center group flex flex-col items-center justify-center gap-0.5"
                                      >
                                        <span className="text-[9px]  tracking-widest font-black text-blue-400 group-hover:scale-105 transition-transform">
                                          📤 Saídas
                                        </span>
                                        <span className="text-sm font-black text-white">
                                          {dept.saidasCount} doc(s)
                                        </span>
                                        <span className="text-[8px] text-blue-400/80 font-semibold underline underline-offset-2">
                                          Abrir Lista →
                                        </span>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* INDICADOR DE CENTRALIZAÇÃO E VISIBILIDADE COMPLETA */}
              <div className="mb-4 p-3 bg-slate-900/90 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs text-amber-300 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="text-sm">📁</span>
                  <span className="font-semibold text-[11px]">
                    <strong>Página Única Central de Gestão de Expediente:</strong> Exibindo o histórico registrado dos expedientes submetidos no sistema.
                    {filterSetor !== "todos" && (
                      <span className="text-amber-400 font-bold  ml-1">
                        (Filtro Ativo: {filterSetor === "meu_setor" ? userSector : filterSetor})
                      </span>
                    )}
                  </span>
                </div>
                {filterSetor !== "todos" && (
                  <button
                    type="button"
                    onClick={() => setFilterSetor("todos")}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-black text-[9px]  tracking-wider transition-all"
                  >
                    Exibir Todos os Documentos
                  </button>
                )}
              </div>

              {/* TABELA DE EXPEDIENTES ESTILO EXECUTIVO PREMIUM */}
              <div className="flex-1 overflow-x-auto rounded-2xl border border-slate-900 bg-slate-900/20 shadow-2xl relative z-10 no-scrollbar">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="border-b border-slate-900 bg-slate-900/40 text-slate-500 font-black text-[9px]  tracking-[0.2em]">
                      <th className="py-4 px-6 w-[32%]">Remetente / Identificação</th>
                      <th className="py-4 px-6 w-[18%]">Recebimento</th>
                      <th className="py-4 px-6 w-[22%]">Encaminhamento</th>
                      <th className="py-4 px-6 w-[18%] text-center">Status no Repositório</th>
                      <th className="py-4 px-6 w-[10%] text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/40">
                    {filteredDocuments.map((doc) => {
                      const isSelected = selectedDoc?.id === doc.id;
                      const badge = getStatusBadge(doc.status);
                      return (
                        <tr
                          key={doc.id}
                          onClick={() => setSelectedDocId(doc.id)}
                          onDoubleClick={() => {
                            setSelectedDocId(doc.id);
                            setShowReaderModal(true);
                          }}
                          className={`group cursor-pointer transition-all duration-300 ${
                            isSelected
                              ? "bg-amber-500/5 shadow-inner"
                              : "hover:bg-slate-900/30"
                          }`}
                        >
                          <td className="py-5 px-6 relative">
                            {isSelected && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                            )}
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-2">
                                <span className={`text-[11px] font-black tracking-tight transition-colors ${isSelected ? "text-amber-400" : "text-slate-200 group-hover:text-white"}`}>
                                  {doc.remetente}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[9px] font-mono font-bold text-amber-400 shrink-0">
                                  {doc.numeroRastreio}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium truncate flex items-center gap-1.5">
                                <FileText size={10} className="text-slate-600 shrink-0" />
                                <span className="text-slate-300 font-semibold truncate">{doc.assunto}</span>
                              </span>
                              {doc.beneficiario && (
                                <span className="text-[9px] text-blue-400 font-semibold truncate flex items-center gap-1">
                                  <span>👤</span> {doc.beneficiario}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-5 px-6">
                            <div className="flex flex-col">
                              <span className="text-[11px] text-slate-400 font-mono">
                                {doc.dataRecebimento}
                              </span>
                            </div>
                          </td>

                          <td className="py-5 px-6">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[11px] text-slate-300 font-bold  truncate">
                                {doc.encaminhado}
                              </span>
                              <span className="text-[9px] text-slate-600 font-black tracking-widest ">
                                {doc.encaminhadoSetor}
                              </span>
                            </div>
                          </td>

                          <td className="py-5 px-6 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black  border tracking-wider ${badge.colorClass}`}>
                              <span>{badge.icon}</span>
                              <span>{badge.label}</span>
                            </span>
                          </td>

                          <td className="py-5 px-6 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDocId(doc.id);
                                setShowReaderModal(true);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[9px] font-black  tracking-widest transition-all ${
                                isSelected
                                  ? "bg-amber-500 text-slate-950 shadow-xl shadow-amber-900/20"
                                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                              }`}
                            >
                              Abrir
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* PAINEL LATERAL DIREITO REFINADO */}
            <aside className="w-[480px] bg-slate-950 p-8 flex flex-col justify-between overflow-y-auto shrink-0 border-l border-slate-900 shadow-2xl relative">
              <div className="absolute inset-0 bg-gradient-to-bl from-slate-900/20 via-transparent to-transparent pointer-events-none" />
              
              {!selectedDoc ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 relative z-10">
                  <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-700 mb-6 shadow-2xl">
                    <FileText size={32} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-black text-slate-400 tracking-tight mb-2">
                    Nenhum Documento Selecionado
                  </h3>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-[240px]">
                    Selecione um expediente no repositório central para visualizar os detalhes, despachos e assinaturas.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-6 relative z-10 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <h3 className="text-lg font-black text-white tracking-tight">
                        Painel de Análise
                      </h3>
                      <p className="text-[10px] text-slate-500 font-bold  tracking-[0.15em] truncate max-w-[240px]">
                        {selectedDoc.nomeArquivo}
                      </p>
                    </div>

                    <button
                      onClick={() => setShowReaderModal(true)}
                      className="group px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black  tracking-widest flex items-center gap-2.5 shadow-2xl shadow-blue-900/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <Eye size={16} />
                      <span>Ler & Assinar</span>
                    </button>
                  </div>

                  {/* MOLDURA DO DOCUMENTO REFINADA */}
                  <div
                    onClick={() => setShowReaderModal(true)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-2xl group cursor-pointer hover:border-amber-500/50 transition-all duration-500"
                  >
                    <div className="relative rounded-xl overflow-hidden shadow-2xl transform group-hover:scale-[1.01] transition-transform">
                      {/* Overlay hover sutil */}
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 backdrop-blur-[2px]">
                        <div className="bg-white text-slate-950 px-5 py-2.5 rounded-2xl text-[11px] font-black  tracking-widest shadow-2xl border border-white flex items-center gap-2">
                          <FolderOpen size={16} /> Ver Documento
                        </div>
                      </div>

                      <div className="bg-white text-slate-950 aspect-[1/1.4] p-8 select-text shadow-inner flex flex-col">
                        {/* Cabeçalho da Folha */}
                        <div className="flex items-start justify-between border-b-2 border-slate-100 pb-5 mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-950 p-0.5 shadow-xl">
                              <div className="w-full h-full bg-amber-500 rounded-[9px] flex items-center justify-center text-slate-950 font-black text-[10px]">
                                Songo
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <h4 className="text-[11px] font-black text-slate-950 tracking-tighter  leading-none">
                                SIGEP-Songo
                              </h4>
                              <p className="text-[8px] text-slate-400 font-bold  tracking-widest mt-0.5">
                                Direção Central de Expediente
                              </p>
                            </div>
                          </div>
                          <div className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-full">
                            <span className="text-[9px] font-black text-slate-400  tracking-widest">
                              {selectedDoc.numeroRastreio}
                            </span>
                          </div>
                        </div>

                        {/* Título do Relatório na Folha */}
                        <h3 className="text-lg font-black text-slate-950 mb-1 font-serif leading-tight">
                          {selectedDoc.assunto}
                        </h3>
                        <p className="text-[9px] text-slate-500 mb-4 font-medium italic">
                          Memorando Institucional de {selectedDoc.dataRecebimento}
                        </p>

                        {/* DETALHES DE ENCAMINHAMENTO E REPOSITÓRIO */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 space-y-1.5 text-[10px]">
                          <div className="flex items-center justify-between border-b border-slate-200/80 pb-1">
                            <span className="font-bold text-slate-400  tracking-wider text-[8px]">REMETENTE (QUEM ENVIOU):</span>
                            <span className="font-black text-slate-900  tracking-tight">{selectedDoc.remetente}</span>
                          </div>
                          {selectedDoc.beneficiario && (
                            <div className="flex items-center justify-between border-b border-slate-200/80 pb-1">
                              <span className="font-bold text-slate-400  tracking-wider text-[8px]">BENEFICIÁRIO / SOLICITANTE:</span>
                              <span className="font-black text-amber-700  tracking-tight">{selectedDoc.beneficiario}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between border-b border-slate-200/80 pb-1">
                            <span className="font-bold text-slate-400  tracking-wider text-[8px]">DESTINATÁRIO (PARA QUEM):</span>
                            <span className="font-black text-blue-700  tracking-tight">{selectedDoc.encaminhado}</span>
                          </div>
                          <div className="flex items-center justify-between pt-0.5">
                            <span className="font-bold text-slate-400  tracking-wider text-[8px]">ESTADO DE TRAMITAÇÃO:</span>
                            <span className="font-black text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full border border-emerald-300 text-[8px]  tracking-wider">
                              {selectedDoc.status}
                            </span>
                          </div>
                        </div>

                        <div className="flex-1 flex flex-col my-2">
                          <span className="text-[8px] font-black text-slate-400  tracking-wider block mb-2">Pareceres & Tramitação Setorial:</span>
                          {selectedDoc.rawExpediente?.historico && selectedDoc.rawExpediente.historico.length > 0 ? (
                            <div className="space-y-2 overflow-y-auto max-h-[160px] pr-1">
                              {selectedDoc.rawExpediente.historico.map((h: any, idx: number) => (
                                <div key={idx} className="bg-slate-50 border border-slate-200/90 rounded-lg p-2 text-[9px] text-slate-800">
                                  <div className="flex items-center justify-between font-bold text-slate-900 mb-0.5">
                                    <span className="text-amber-700  tracking-tight">{h.setor || "Setor"}</span>
                                    <span className="text-[8px] text-slate-400 font-mono">{h.data ? new Date(h.data).toLocaleDateString("pt-MZ") : ""}</span>
                                  </div>
                                  <p className="font-semibold text-slate-900 text-[9.5px]">{h.acao}</p>
                                  {h.parecer && <p className="text-slate-600 italic mt-0.5 leading-snug">"{h.parecer}"</p>}
                                  {h.responsavel && <p className="text-[8px] text-slate-400 mt-0.5 text-right font-medium">— {h.responsavel} ({h.cargo || "Responsável"})</p>}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex-1 flex flex-col justify-center border border-dashed border-slate-300 rounded-xl bg-slate-50/70 p-3 text-center">
                              <span className="text-[9px] font-black text-slate-500  tracking-wider block mb-1">Sem Parecer Nem Despacho Inicial</span>
                              <p className="text-[9.5px] text-slate-500 font-medium italic">
                                Documento submetido pelo remetente sem pareceres. Os pareceres e despachos serão anexados à medida que o documento for apreciado nos setores competentes.
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Rodapé de Assinaturas na Folha */}
                        <div className="mt-auto pt-10 border-t-2 border-slate-50 grid grid-cols-2 gap-8">
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-20 border-b border-slate-200" />
                            <span className="text-[8px] font-black text-slate-300  tracking-widest">Responsável</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-20 border-b border-slate-200" />
                            <span className="text-[8px] font-black text-slate-300  tracking-widest">Validado</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3 BOTÕES PRINCIPAIS DE AÇÃO REFINADOS */}
              <div className={`mt-10 grid grid-cols-3 gap-4 relative z-10 transition-opacity duration-300 ${!selectedDoc ? "opacity-20 pointer-events-none" : "opacity-100"}`}>
                <button
                  onClick={handleBaixarDocumento}
                  className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-slate-500 group-hover:text-amber-500 transition-colors shadow-2xl">
                    <Download size={20} />
                  </div>
                  <span className="text-[10px] font-black  tracking-widest text-slate-400 group-hover:text-white transition-colors">Baixar</span>
                </button>

                <button
                  onClick={() => setShowEncaminharModal(true)}
                  className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-slate-500 group-hover:text-blue-500 transition-colors shadow-2xl">
                    <Send size={20} />
                  </div>
                  <span className="text-[10px] font-black  tracking-widest text-slate-400 group-hover:text-white transition-colors">Enviar</span>
                </button>

                <button
                  onClick={() => setShowPartilharModal(true)}
                  className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-slate-500 group-hover:text-indigo-500 transition-colors shadow-2xl">
                    <Share2 size={20} />
                  </div>
                  <span className="text-[10px] font-black  tracking-widest text-slate-400 group-hover:text-white transition-colors">Partilhar</span>
                </button>
              </div>
            </aside>
          </>
        )}

        {/* SUBVIEW: DOCUMENTOS NORMATIVOS */}
        {activeMenuItem === "Documentos Normativos" && (
          <section className="flex-1 overflow-y-auto bg-slate-900/95 p-4 md:p-6 text-slate-100">
            <DocumentosView title={title} user={user} />
          </section>
        )}

        {/* SUBVIEW: RELATÓRIOS */}
        {activeMenuItem === "Relatórios" && (
          <section className="flex-1 overflow-y-auto bg-slate-900/95 p-4 md:p-6 text-slate-100">
            <ReportsView
              user={user}
              onShowAlert={(msg) => {
                setActionSuccessMessage(msg);
                setTimeout(() => setActionSuccessMessage(""), 4000);
              }}
              initialDirection={title}
              onBack={() => setActiveMenuItem("Histórico de Documentos")}
            />
          </section>
        )}

        {/* SUBVIEW: BALANÇO */}
        {activeMenuItem === "Balanço" && (
          <section className="flex-1 overflow-y-auto bg-slate-900/95 p-4 md:p-6 text-slate-100">
            <BalancoAtividadesView
              activities={activities || []}
              user={user}
              onBack={() => setActiveMenuItem("Histórico de Documentos")}
              sectorTitle={title}
            />
          </section>
        )}

        {/* SUBVIEW: FLUXO DE TRAMITAÇÃO */}
        {activeMenuItem === "Fluxo de Tramitação" && (
          <section className="flex-1 overflow-y-auto bg-slate-900/95 p-4 md:p-6 text-slate-100 flex flex-col gap-6">
            <FluxogramaTramitacaoExpediente
              expediente={selectedDoc?.rawExpediente || (selectedDoc as any)}
              showSimulador={true}
            />
          </section>
        )}

        {/* SUBVIEW: ASSINATURA DIGITAL */}
        {activeMenuItem === "Assinatura Digital" && (
          <section className="flex-1 overflow-y-auto bg-slate-900/95 p-4 md:p-6 text-slate-100">
            <AssinaturaDigitalView
              onBack={() => setActiveMenuItem("Histórico de Documentos")}
              user={user}
            />
          </section>
        )}
      </div>

      {/* MODAL: NOVO REGISTO DE EXPEDIENTE / DOCUMENTO */}
      {showNovoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white text-slate-950 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] relative border border-white/10">
            <button
              onClick={() => setShowNovoModal(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-950 hover:bg-slate-100 transition-all"
            >
              <X size={20} />
            </button>
            <div className="flex flex-col gap-1 mb-8">
              <h3 className="text-2xl font-black text-slate-950 font-serif tracking-tight">
                Registar Novo Expediente
              </h3>
              <p className="text-xs text-slate-500 font-medium">Preencha os dados oficiais para registo no repositório central</p>
            </div>
            <FormularioExpediente
              user={user}
              onCancel={() => setShowNovoModal(false)}
              onSuccess={(newDocId) => {
                if (newDocId) {
                  setSelectedDocId(newDocId);
                }
                setShowNovoModal(false);
                setActionSuccessMessage("Novo expediente submetido e preenchido no repositório institucional!");
                setTimeout(() => setActionSuccessMessage(""), 4000);
              }}
              tipoInitial="Entrada"
            />
          </div>
        </div>
      )}

      {/* MODAL: ENVIAR / ENCAMINHAR DOCUMENTO */}
      {showEncaminharModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 text-white border border-slate-800 rounded-3xl max-w-lg w-full p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] relative">
            <div className="flex items-center justify-between mb-8 border-b border-slate-900 pb-6">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-amber-500">
                  <Send size={18} />
                  <span className="text-[10px] font-black  tracking-[0.2em]">Tramitação Oficial</span>
                </div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  Encaminhar Documento
                </h3>
              </div>
              <button
                onClick={() => setShowEncaminharModal(false)}
                className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-slate-900 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* CARTÃO VISUAL DO DOCUMENTO */}
            <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 mb-8 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center text-emerald-400 shadow-xl border border-slate-800">
                <FileSpreadsheet size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-[11px] font-black text-white truncate  tracking-wide">
                    {selectedDoc?.nomeArquivo}
                  </h4>
                  <span className="px-2 py-0.5 rounded-lg text-[8px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/20 font-mono">
                    {selectedDoc?.numeroRastreio}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium truncate">
                  Assunto: <span className="text-slate-300">{selectedDoc?.assunto}</span>
                </p>
              </div>
            </div>

            <div className="space-y-5 text-xs">
              {/* 1. SELEÇÃO DO SETOR ATUANTE */}
              <div>
                <label className="block text-slate-500 font-black mb-1.5  tracking-widest text-[9px]">
                  Setor Atuante (Emitindo Parecer / Ação)
                </label>
                <select
                  value={setorAtuante}
                  onChange={(e) => {
                    const s = e.target.value;
                    setSetorAtuante(s);
                    if (s.includes("Secretaria Geral")) setDecisaoSetor("classificar");
                    else if (s.includes("Setor Técnico") || s.includes("Técnico")) setDecisaoSetor("parecer_tecnico");
                    else if (s.includes("DPEP")) setDecisaoSetor("planificada");
                    else if (s.includes("DAF")) setDecisaoSetor("com_cabimento");
                    else if (s.includes("Transporte")) setDecisaoSetor("com_transporte");
                    else if (s.includes("DICOSAFA")) setDecisaoSetor("parecer_dicosafa");
                    else if (s.includes("Secretaria Executiva")) setDecisaoSetor("revisado_preparado");
                    else if (s.includes("Diretor-Geral")) setDecisaoSetor("autorizado");
                    else if (s.includes("RH") || s.includes("Recursos Humanos")) {
                      setDecisaoSetor("emitir_guia");
                      if (selectedDoc) {
                        setGuiaBeneficiario(selectedDoc.remetente || "Funcionário / Viajante");
                        setGuiaDestino(selectedDoc.assunto || "Delegação Provincial");
                        setGuiaPeriodo("28/08/2026 a 05/09/2026");
                        setGuiaMeios("Viatura Songo / LAM");
                      }
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-amber-400 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all"
                >
                  <optgroup label="--- CICLO DE DOCUMENTOS NORMAIS ---">
                    <option value="Secretaria Geral">1. Secretaria Geral (Protocola & Encaminha)</option>
                    <option value="Setor Técnico / Administrativo">2. Setor Técnico / Administrativo (Análise & Parecer)</option>
                    <option value="Secretaria Executiva">3. Secretaria Executiva (Revisão & Preparo)</option>
                    <option value="Gabinete do Diretor-Geral">4. Gabinete do Diretor-Geral (Despacho Oficial)</option>
                  </optgroup>
                  <optgroup label="--- FLUXO ESPECIAL DE VIAGENS ---">
                    <option value="DPEP - Departamento de Planificação Estudos e Projetos">DPEP (Parecer de Conformidade PAO)</option>
                    <option value="DAF - Direção de Administração e Finanças">DAF (Parecer de Disponibilidade Financeira)</option>
                    <option value="Repartição de Transporte">Repartição de Transporte (Parecer de Meios)</option>
                    <option value="Direção da DICOSAFA">Direção da DICOSAFA (Parecer Operacional)</option>
                    <option value="Recursos Humanos (RH)">Recursos Humanos - RH (Emitir Guia de Viagem)</option>
                  </optgroup>
                  <optgroup label="--- ROTA DE RETORNO / DEVOLUÇÃO ---">
                    <option value="Secretaria Executiva (Retorno)">Secretaria Executiva (Retorno)</option>
                    <option value="Direção da DICOSAFA (Retorno)">Direção da DICOSAFA (Retorno)</option>
                    <option value="Repartição de Transporte (Retorno)">Repartição de Transporte (Retorno)</option>
                    <option value="DAF (Retorno)">DAF (Retorno)</option>
                    <option value="DPEP (Retorno)">DPEP (Retorno)</option>
                    <option value="Secretaria Geral (Retorno)">Secretaria Geral (Retorno ao Remetente com Histórico)</option>
                  </optgroup>
                </select>
              </div>

              {/* 2. DECISÃO / FUNÇÃO ESPECÍFICA DO SETOR */}
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
                <label className="block text-amber-500 font-black  tracking-widest text-[9px]">
                  Função Setorial & Decisão
                </label>

                {setorAtuante.includes("Secretaria Geral") && !setorAtuante.includes("Retorno") && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-400 font-medium">Classificar o expediente para o fluxo institucional ou devolver ao remetente:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDecisaoSetor("classificar")}
                        className={`p-2.5 rounded-lg border text-left font-bold transition-all text-xs ${decisaoSetor === "classificar" ? "bg-blue-600/20 border-blue-500 text-blue-300" : "bg-slate-950 border-slate-800 text-slate-400"}`}
                      >
                        ✓ Classificar e Encaminhar
                      </button>
                      <button
                        type="button"
                        onClick={() => setDecisaoSetor("devolver")}
                        className={`p-2.5 rounded-lg border text-left font-bold transition-all text-xs ${decisaoSetor === "devolver" ? "bg-red-600/20 border-red-500 text-red-300" : "bg-slate-950 border-slate-800 text-slate-400"}`}
                      >
                        ↩ Devolver ao Remetente
                      </button>
                    </div>
                  </div>
                )}

                {setorAtuante.includes("DPEP") && !setorAtuante.includes("Retorno") && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-400 font-medium">Parecer de Conformidade da Atividade (PAO / Planificação):</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDecisaoSetor("planificada")}
                        className={`p-2.5 rounded-lg border text-left font-bold transition-all text-xs ${decisaoSetor === "planificada" ? "bg-emerald-600/20 border-emerald-500 text-emerald-300" : "bg-slate-950 border-slate-800 text-slate-400"}`}
                      >
                        ✓ Atividade Planificada
                      </button>
                      <button
                        type="button"
                        onClick={() => setDecisaoSetor("nao_planificada")}
                        className={`p-2.5 rounded-lg border text-left font-bold transition-all text-xs ${decisaoSetor === "nao_planificada" ? "bg-amber-600/20 border-amber-500 text-amber-300" : "bg-slate-950 border-slate-800 text-slate-400"}`}
                      >
                        ⚠ Atividade Não Planificada
                      </button>
                    </div>
                  </div>
                )}

                {setorAtuante.includes("DAF") && !setorAtuante.includes("Retorno") && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-400 font-medium">Parecer da Disponibilidade Financeira / Orçamental:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDecisaoSetor("com_cabimento")}
                        className={`p-2.5 rounded-lg border text-left font-bold transition-all text-xs ${decisaoSetor === "com_cabimento" ? "bg-emerald-600/20 border-emerald-500 text-emerald-300" : "bg-slate-950 border-slate-800 text-slate-400"}`}
                      >
                        ✓ Com Disponibilidade / Cabimento
                      </button>
                      <button
                        type="button"
                        onClick={() => setDecisaoSetor("sem_cabimento")}
                        className={`p-2.5 rounded-lg border text-left font-bold transition-all text-xs ${decisaoSetor === "sem_cabimento" ? "bg-red-600/20 border-red-500 text-red-300" : "bg-slate-950 border-slate-800 text-slate-400"}`}
                      >
                        ✗ Sem Disponibilidade Financeira
                      </button>
                    </div>
                  </div>
                )}

                {setorAtuante.includes("Transporte") && !setorAtuante.includes("Retorno") && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-400 font-medium">Parecer de Disponibilidade de Transporte / Meios:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDecisaoSetor("com_transporte")}
                        className={`p-2.5 rounded-lg border text-left font-bold transition-all text-xs ${decisaoSetor === "com_transporte" ? "bg-emerald-600/20 border-emerald-500 text-emerald-300" : "bg-slate-950 border-slate-800 text-slate-400"}`}
                      >
                        ✓ Transporte / Meios Disponíveis
                      </button>
                      <button
                        type="button"
                        onClick={() => setDecisaoSetor("sem_transporte")}
                        className={`p-2.5 rounded-lg border text-left font-bold transition-all text-xs ${decisaoSetor === "sem_transporte" ? "bg-red-600/20 border-red-500 text-red-300" : "bg-slate-950 border-slate-800 text-slate-400"}`}
                      >
                        ✗ Sem Disponibilidade de Transporte
                      </button>
                    </div>
                  </div>
                )}

                {setorAtuante.includes("DICOSAFA") && !setorAtuante.includes("Retorno") && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-400 font-medium">Parecer Técnico / Operacional do Diretor da DICOSAFA:</p>
                  </div>
                )}

                {setorAtuante.includes("Diretor-Geral") && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-400 font-medium">Despacho Final do Diretor Geral:</p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setDecisaoSetor("autorizado")}
                        className={`p-2 rounded-lg border text-center font-bold transition-all text-xs ${decisaoSetor === "autorizado" ? "bg-emerald-600/20 border-emerald-500 text-emerald-300" : "bg-slate-950 border-slate-800 text-slate-400"}`}
                      >
                        ✓ Autorizado
                      </button>
                      <button
                        type="button"
                        onClick={() => setDecisaoSetor("homologado")}
                        className={`p-2 rounded-lg border text-center font-bold transition-all text-xs ${decisaoSetor === "homologado" ? "bg-blue-600/20 border-blue-500 text-blue-300" : "bg-slate-950 border-slate-800 text-slate-400"}`}
                      >
                        ✓ Homologado
                      </button>
                      <button
                        type="button"
                        onClick={() => setDecisaoSetor("indeferido")}
                        className={`p-2 rounded-lg border text-center font-bold transition-all text-xs ${decisaoSetor === "indeferido" ? "bg-red-600/20 border-red-500 text-red-300" : "bg-slate-950 border-slate-800 text-slate-400"}`}
                      >
                        ✗ Indeferido
                      </button>
                    </div>
                  </div>
                )}

                {/* PAINEL ESPECIAL DO RH - EMISSÃO DE GUIA DE VIAGEM */}
                {(setorAtuante.includes("RH") || setorAtuante.includes("Recursos Humanos")) && (
                  <div className="space-y-3 bg-purple-950/40 p-3.5 rounded-xl border border-purple-800/60">
                    <div className="flex items-center gap-2 text-purple-300 font-black text-[10px]  tracking-wider">
                      <span>✈ Guia de Viagem / Apresentação Oficial (RH)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[9px] text-purple-300/80 font-bold block mb-1">Nº da Guia</label>
                        <input
                          type="text"
                          value={guiaNumero}
                          onChange={(e) => setGuiaNumero(e.target.value)}
                          className="w-full bg-slate-950 border border-purple-800/80 rounded-lg p-2 text-xs text-purple-200 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-purple-300/80 font-bold block mb-1">Beneficiário / Viajante</label>
                        <input
                          type="text"
                          value={guiaBeneficiario}
                          onChange={(e) => setGuiaBeneficiario(e.target.value)}
                          placeholder="Nome do servidor"
                          className="w-full bg-slate-950 border border-purple-800/80 rounded-lg p-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-purple-300/80 font-bold block mb-1">Destino da Missão</label>
                        <input
                          type="text"
                          value={guiaDestino}
                          onChange={(e) => setGuiaDestino(e.target.value)}
                          placeholder="Ex: Nampula / Maputo"
                          className="w-full bg-slate-950 border border-purple-800/80 rounded-lg p-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-purple-300/80 font-bold block mb-1">Período / Datas</label>
                        <input
                          type="text"
                          value={guiaPeriodo}
                          onChange={(e) => setGuiaPeriodo(e.target.value)}
                          placeholder="Ex: 28 de Ago a 05 de Set"
                          className="w-full bg-slate-950 border border-purple-800/80 rounded-lg p-2 text-xs text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] text-purple-300/80 font-bold block mb-1">Meios de Transporte Alocados</label>
                      <input
                        type="text"
                        value={guiaMeios}
                        onChange={(e) => setGuiaMeios(e.target.value)}
                        placeholder="Ex: Viatura Oficial Songo / Passagem Aérea"
                        className="w-full bg-slate-950 border border-purple-800/80 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                  </div>
                )}

                {setorAtuante.includes("Retorno") && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-amber-400 font-bold">↩ Rota de Devolução / Retorno do Expediente (Linha Laranja):</p>
                    <p className="text-[9.5px] text-slate-400">O expediente despachado e acompanhado da Guia de Viagem segue em retorno pelo mesmo caminho até à receção final do Remetente.</p>
                  </div>
                )}
              </div>

              {/* 3. DESTINO PRÓXIMO */}
              {decisaoSetor !== "devolver" && !setorAtuante.includes("RH") && !setorAtuante.includes("Recursos Humanos") && (
                <div>
                  <label className="block text-slate-500 font-black mb-1.5  tracking-widest text-[9px]">
                    Encaminhar Para (Próximo Órgão / Setor)
                  </label>
                  <select
                    value={destinatario}
                    onChange={(e) => setDestinatario(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all appearance-none"
                  >
                    <option value="">Selecione o destino institucional...</option>
                    <option value="DPEP - Planificação, Estudos e Projetos">DPEP - Planificação e Projetos</option>
                    <option value="Departamento de Administração e Finanças (DAF)">DAF - Administração e Finanças</option>
                    <option value="Repartição de Transporte">Repartição de Transporte</option>
                    <option value="Direção da DICOSAFA">Direção da DICOSAFA</option>
                    <option value="Secretaria Executiva">Secretaria Executiva</option>
                    <option value="Gabinete do Diretor-Geral">Gabinete do Diretor-Geral</option>
                    <option value="Recursos Humanos (RH)">Recursos Humanos (RH - Guia de Viagem)</option>
                    <option value="Secretaria Geral">Secretaria Geral</option>
                  </select>
                </div>
              )}

              {/* 4. TEXTO DO PARECER / DESPACHO */}
              <div>
                <label className="block text-slate-500 font-black mb-1.5  tracking-widest text-[9px]">
                  Texto do Parecer / Fundamentação do Despacho
                </label>
                <textarea
                  rows={3}
                  value={parecerTexto}
                  onChange={(e) => setParecerTexto(e.target.value)}
                  placeholder="Escreva aqui a fundamentação do parecer ou despacho do setor..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all placeholder-slate-600 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setShowEncaminharModal(false)}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 text-slate-400 font-black text-[10px]  tracking-widest hover:text-white transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleEncaminhar}
                  className="px-8 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px]  tracking-widest shadow-2xl shadow-amber-900/40 flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 transition-all"
                >
                  <Send size={14} strokeWidth={3} />
                  <span>Confirmar Envio</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PARTILHAR DOCUMENTO */}
      {showPartilharModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 text-white border border-slate-800 rounded-3xl max-w-lg w-full p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] relative">
            <div className="flex items-center justify-between mb-8 border-b border-slate-900 pb-6">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Share2 size={18} />
                  <span className="text-[10px] font-black  tracking-[0.2em]">Partilha Institucional</span>
                </div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  Partilhar Documento
                </h3>
              </div>
              <button
                onClick={() => setShowPartilharModal(false)}
                className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-slate-900 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* CARTÃO VISUAL DO DOCUMENTO */}
            <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 mb-8 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center text-blue-400 shadow-xl border border-slate-800">
                <FileSpreadsheet size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-[11px] font-black text-white truncate  tracking-wide">
                    {selectedDoc?.nomeArquivo}
                  </h4>
                  <span className="px-2 py-0.5 rounded-lg text-[8px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/20 font-mono">
                    {selectedDoc?.numeroRastreio}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium truncate">
                  {selectedDoc?.assunto}
                </p>
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 mb-8">
              <span className="text-slate-500 block mb-2 text-[9px] font-black  tracking-widest">Referência de Rastreio</span>
              <strong className="text-amber-500 text-lg font-mono tracking-widest">
                {selectedDoc?.numeroRastreio || "EXP-2026-001"}
              </strong>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `SIGEP-Songo | Documento: ${selectedDoc?.nomeArquivo} | Rastreio: ${selectedDoc?.numeroRastreio} | Assunto: ${selectedDoc?.assunto}`,
                  );
                  setActionSuccessMessage("Referência copiada para a área de transferência!");
                  setShowPartilharModal(false);
                  setTimeout(() => setActionSuccessMessage(""), 3500);
                }}
                className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-[11px]  tracking-widest shadow-2xl shadow-blue-900/40 transition-all flex items-center justify-center gap-3 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Share2 size={16} />
                <span>Copiar Referência e Rastreio</span>
              </button>

              <button
                onClick={() => {
                  handleBaixarDocumento();
                  setShowPartilharModal(false);
                }}
                className="w-full py-4 px-6 rounded-2xl bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 font-black text-[11px]  tracking-widest transition-all flex items-center justify-center gap-3"
              >
                <Download size={16} />
                <span>Exportar Ficheiro para Partilha</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE LISTA DE DOCUMENTOS POR DEPARTAMENTO (ENTRADA / SAÍDA) */}
      {deptModalData && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* CABEÇALHO DO MODAL */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className={`p-3 rounded-xl border text-xl ${
                  deptModalData.type === "entradas"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-blue-500/10 border-blue-500/30 text-blue-400"
                }`}>
                  {deptModalData.type === "entradas" ? "📥" : "📤"}
                </span>
                <div>
                  <h3 className="text-sm font-black text-white  tracking-wide flex items-center gap-2">
                    <span>Documentos de {deptModalData.type === "entradas" ? "ENTRADA (Recebidos)" : "SAÍDA (Expedidos)"}</span>
                  </h3>
                  <p className="text-xs text-amber-400 font-semibold">
                    {deptModalData.deptLabel} <span className="text-slate-400 font-normal">({deptModalData.direcaoNome})</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDeptModalData(null);
                  setDeptSearchTerm("");
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* BARRA DE PESQUISA DENTRO DO MODAL */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar por beneficiário, assunto, nº de rastreio..."
                  value={deptSearchTerm}
                  onChange={(e) => setDeptSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="text-xs text-slate-400 font-medium">
                Exibindo <strong className="text-white font-bold">{
                  deptModalData.documents.filter((d) => {
                    if (!deptSearchTerm.trim()) return true;
                    const term = deptSearchTerm.toLowerCase().trim();
                    const raw = d.rawExpediente;
                    return (
                      (d.beneficiario || "").toLowerCase().includes(term) ||
                      d.assunto.toLowerCase().includes(term) ||
                      d.numeroRastreio.toLowerCase().includes(term) ||
                      d.remetente.toLowerCase().includes(term) ||
                      d.encaminhado.toLowerCase().includes(term) ||
                      d.nomeArquivo.toLowerCase().includes(term) ||
                      (raw?.beneficiario || "").toLowerCase().includes(term) ||
                      (raw?.nomeBeneficiario || "").toLowerCase().includes(term) ||
                      (raw?.solicitante || "").toLowerCase().includes(term) ||
                      (raw?.interessado || "").toLowerCase().includes(term) ||
                      (raw?.funcionario || "").toLowerCase().includes(term) ||
                      (raw?.guiaViagem?.beneficiario || "").toLowerCase().includes(term) ||
                      (raw?.guiaViagem?.numeroGuia || "").toLowerCase().includes(term) ||
                      (raw?.referenciaExterna || "").toLowerCase().includes(term) ||
                      (raw?.numero || "").toLowerCase().includes(term)
                    );
                  }).length
                }</strong> de <strong className="text-amber-400 font-bold">{deptModalData.documents.length}</strong> documento(s)
              </div>
            </div>

            {/* TABELA / LISTA DE DOCUMENTOS */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {(() => {
                const filteredList = deptModalData.documents.filter((d) => {
                  if (!deptSearchTerm.trim()) return true;
                  const term = deptSearchTerm.toLowerCase().trim();
                  const raw = d.rawExpediente;
                  return (
                    ((d as any).beneficiario || "").toLowerCase().includes(term) ||
                    d.assunto.toLowerCase().includes(term) ||
                    d.numeroRastreio.toLowerCase().includes(term) ||
                    d.remetente.toLowerCase().includes(term) ||
                    d.encaminhado.toLowerCase().includes(term) ||
                    d.nomeArquivo.toLowerCase().includes(term) ||
                    (raw?.beneficiario || "").toLowerCase().includes(term) ||
                    (raw?.nomeBeneficiario || "").toLowerCase().includes(term) ||
                    (raw?.solicitante || "").toLowerCase().includes(term) ||
                    (raw?.interessado || "").toLowerCase().includes(term) ||
                    (raw?.funcionario || "").toLowerCase().includes(term) ||
                    (raw?.guiaViagem?.beneficiario || "").toLowerCase().includes(term) ||
                    (raw?.guiaViagem?.numeroGuia || "").toLowerCase().includes(term) ||
                    (raw?.referenciaExterna || "").toLowerCase().includes(term) ||
                    (raw?.numero || "").toLowerCase().includes(term)
                  );
                });

                if (filteredList.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-500 font-medium space-y-2">
                      <FolderOpen className="w-10 h-10 mx-auto text-slate-600 opacity-50" />
                      <p className="text-xs">Nenhum documento registado nesta categoria para este departamento.</p>
                    </div>
                  );
                }

                return filteredList.map((doc) => {
                  const badge = getStatusBadge(doc.status);
                  const benName = (doc as any).beneficiario || (doc.rawExpediente as any)?.guiaViagem?.beneficiario || (doc.rawExpediente as any)?.solicitante || (doc.rawExpediente as any)?.interessado;
                  return (
                    <div
                      key={doc.id}
                      className="p-4 bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[10px] font-bold">
                            {doc.numeroRastreio}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.colorClass}`}>
                            {badge.icon} {badge.label}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            📅 {doc.dataRecebimento}
                          </span>
                          {benName && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[10px] font-bold">
                              👤 Beneficiário: {benName}
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-white tracking-wide">
                          {doc.assunto}
                        </h4>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400">
                          <span><strong>Remetente:</strong> {doc.remetente}</span>
                          <span><strong>Destino:</strong> {doc.encaminhado}</span>
                          <span><strong>Ficheiro:</strong> {doc.nomeArquivo}</span>
                        </div>

                        {/* RASTREIO EM TEMPO REAL */}
                        {doc.rawExpediente?.historico && doc.rawExpediente.historico.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-slate-800/80">
                            <h5 className="text-[10px] font-black  text-amber-400 mb-2 flex items-center gap-1.5">
                              <History className="w-3.5 h-3.5" />
                              Rastreio em Tempo Real
                            </h5>
                            <div className="space-y-2 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-800">
                              {doc.rawExpediente.historico.map((h, i) => (
                                <div key={i} className="relative pl-6 flex items-start gap-2">
                                  <div className="absolute left-[6px] top-1.5 w-2 h-2 rounded-full bg-amber-500 border-2 border-slate-900 shadow-[0_0_0_2px_rgba(245,158,11,0.2)]"></div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold text-slate-200">{h.setor}</span>
                                      <span className="text-[9px] text-slate-500 font-mono">{new Date(h.data).toLocaleString("pt-PT")}</span>
                                    </div>
                                    <p className="text-[10px] text-emerald-400 font-semibold">{h.acao}</p>
                                    {h.parecer && (
                                      <p className="text-[9px] text-slate-400 mt-0.5 italic bg-slate-900/50 p-1.5 rounded-md border border-slate-800">
                                        "{h.parecer}"
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* BOTÕES DE AÇÃO: VISUALIZAR, DOWNLOAD, IMPRIMIR */}
                      <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800 self-start md:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDocId(doc.id);
                            setShowReaderModal(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1.5 transition-all"
                          title="Visualizar documento e tramitação"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Visualizar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadDocItem(doc)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1.5 transition-all"
                          title="Fazer download do documento/ficha"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePrintDocumentItem(doc)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold flex items-center gap-1.5 transition-all"
                          title="Imprimir Ficha Oficial de Expediente"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-400" />
                          <span>Imprimir</span>
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LEITOR DE DOCUMENTO COMPLETO COM DESPACHO E ASSINATURA DIGITAL */}
      {showReaderModal && docExpedienteFormatado && (
        <DocumentReaderModal
          expediente={docExpedienteFormatado}
          onClose={() => setShowReaderModal(false)}
          onUpdateExpediente={handleUpdateFromReader}
          user={user}
        />
      )}
    </div>
  );
}

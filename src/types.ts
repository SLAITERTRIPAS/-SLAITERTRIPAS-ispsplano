export interface Nota {
  id: string;
  title: string;
  content: string;
  date: string;
  prazo: string;
  remetente: string;
}

export interface Colaborador {
  id: string;
  numeroProcesso?: string;
  ord: number;
  nome: string;
  genero: "M" | "F";
  dataNascimento: string;
  localNascimento: {
    pais: string;
    provincia: string;
    distrito: string;
  };
  nuit: string;
  numeroBI: string;
  tipoDocumento?: "BI" | "Passaporte";
  nivelAcademico: string;
  areaFormacao: string;
  categoria?: string;
  funcao?: string;
  tipoContrato: string;
  tipoRelacaoContractual?: string;
  vinculoContractual?: string;
  processoNo?: string;
  anoIngresso?: string;
  carreira?: string;
  email: string;
  usuario?: string;
  tipo: "Docente" | "CTA" | "Investigador";
  efetivo: boolean;
  unidade: string;
  direcao?: string;
  departamento?: string;
  reparticao?: string;
  sector?: string;
  setoresAtribuidos?: string[];
  curso?: string;
  cursos?: string[];
  cargo: string;
  tipoEnquadramento?:
    | "CTA (QUADRO)"
    | "CTA (FORA DO QUADRO)"
    | "DOCENTE (QUADRO)"
    | "DOCENTE (FORA DO QUADRO)";
  cargoChefia?: string;
  estado?: "Falecido" | "Transferido" | "Reformado" | "Ativo" | "Eliminado";
  isDeleted?: boolean;
  deletedAt?: string;
  validadoPorRH?: boolean;
  confiavel?: boolean;
  biEmitidoA?: string;
  biEm?: string;
  dataAdmissao?: string;
  telefone?: string;
  fotoUrl?: string;
  filiacaoPai?: string;
  filiacaoMae?: string;
  morada?: string;
  distrito?: string;
  bairro?: string;
  celula?: string;
  quarteirao?: string;
  casaNo?: string;
  numFilhos?: number;
  estadoMandato?: "em atividade" | "Em Atividade" | "Cessado" | "Despromovido";
  isChefia?: boolean;
  alocacoes?: string[];
  userArea?: {
    unidade?: string;
    direcao?: string;
    departamento?: string;
    reparticao?: string;
    setor?: string;
  };
  mustChangePassword?: boolean;
  disciplinas?: string[];
  nivelSalarial?: string;
  lastUpdate?: {
    date: string;
    user: string;
  };
  status?: string;
  areaDeAfetacao?: string;
}

export interface EstudanteDados {
  id: string;
  nome?: string;
  nuit?: string;
  numeroEstudante?: string;
  numeroBI?: string;
  curso: string;
  departamento?: string;
  homens?: number;
  mulheres?: number;
  validado?: boolean;
}

export interface ProcessoIndividual {
  colaboradorId: string;
  dadosPessoais: Colaborador;
  documentosAnexos: {
    nomeDocumento: string;
    url: string;
  }[];
  formacaoComplementar: {
    curso: string;
    instituicao: string;
    ano: string;
  }[];
  historicoProfissional: {
    cargo: string;
    instituicao: string;
    periodo: string;
  }[];
  observacoes: string;
  completo: boolean;
}

export interface Event {
  id: string;
  title: string;
  date: string; // ISO string
  startTime: string;
  endTime: string;
  location: string;
  participants: string;
  type:
    | "meeting"
    | "activity"
    | "Data Comemorativa"
    | "Feriado Nacional"
    | "Feriado Institucional";
  agenda: string;
  preside?: string;
  remetente?: string;
  status?: "active" | "archived";
}

export interface Expediente {
  id: string;
  tipo: "Entrada" | "Saída" | "Sic";
  numero: string;
  data: string;
  assunto: string;
  origem: string;
  destino: string;
  status: "Pendente" | "Em andamento" | "Concluído" | "Em Tramitação" | "Entrado";
  criadoPor: string;
  userId?: string;
  referenciaExterna?: string;
  urgencia?: string;
  observacoes?: string;
  dataDespacho?: string;
  arquivoUrl?: string;
  nomeArquivo?: string;
  tipoArquivo?: string;
  tamanhoArquivo?: string;
  conteudoTexto?: string;
  vistoDigital?: {
    assinadoPor: string;
    data: string;
    cargo?: string;
    assinaturaImg?: string;
  };
  assinaturaDigital?: {
    assinanteNome: string;
    assinanteCargo?: string;
    dataAssinatura: string;
    assinaturaImg?: string;
    hashAutenticacao?: string;
    tipoAssinatura?: "imagem" | "desenhada" | "digital";
  };
  despacho?: {
    texto: string;
    data: string;
    responsavel: string;
    cargo?: string;
    assinaturaImg?: string;
  };
  isDocumentoViagem?: boolean;
  encaminhadoPara?: string;
  numeroRastreio?: string;
  numeroReferencia?: string;
  fluxoViagemEtapa?: "ida" | "rh" | "volta" | "concluido";
  guiaViagem?: {
    numeroGuia: string;
    beneficiario: string;
    destinoViagem: string;
    periodo: string;
    meiosAlocados?: string;
    emitidoPor?: string;
    dataEmissao: string;
  };
  historico?: {
    setor: string;
    data: string;
    acao: string;
    parecer?: string;
    responsavel?: string;
    cargo?: string;
    assinaturaImg?: string;
  }[];
}

export interface ServiceRequest {
  id: string;
  trackingCode: string;
  visitorType: string;
  service: string;
  nome: string;
  curso: string;
  nivel: string;
  descricao: string;
  status:
    | "Submetido"
    | "Na Secretaria Geral"
    | "No Atendimento Estudantil"
    | "No Chefe do Departamento"
    | "No Diretor da Direção"
    | "No Diretor-Geral"
    | "No Diretor do Curso"
    | "No Docente"
    | "Concluído";
  history: {
    stage: string;
    date: string;
    parecer: string;
    author: string;
  }[];
  createdAt: string;
  // Metadata for Reposicao de Teste
  numeroTeste?: string;
  nomeCadeira?: string;
  nomeDocente?: string;
  periodo?: string;
  semestre?: string;
}

export interface LibraryRegistration {
  id: string;
  nome: string;
  tipoVisitante: string;
  numeroIdentificacao: string;
  curso: string;
  objetivo: string;
  usaComputador: boolean;
  computadorId?: string;
  livrosConsulta: string;
  livrosEmprestimo: string;
  data: string;
  horaEntrada: string;
}

export interface BookRegistration {
  id: string;
  titulo: string;
  subtitulo: string;
  autor: string;
  coautores: string;
  editora: string;
  anoPublicacao: string;
  edicao: string;
  isbn: string;
  issn: string;
  cdd: string;
  cdu: string;
  area: string;
  curso: string;
  genero: string;
  idioma: string;
  numeroPaginas: string;
  exemplares: string;
  localizacao: string;
  prateleira: string;
  estante: string;
  estadoConservacao: string;
  resumo: string;
  palavrasChave: string;
  dataAquisicao: string;
  tipoAquisicao: string;
}

export interface FinancialData {
  id: string;
  ano: string;
  orcamentoAnual: number;
  receitasProprias: number;
  subvencaoEstado: number;
  despesasPessoal: number;
  despesasFuncionamento: number;
  despesasInvestimento: number;
  dataSubmissao: string;
  status: "Pendente" | "Validado";
  // Detailed breakdown of Receitas Próprias
  propinas?: number;
  admissoes?: number;
  inscricoes?: number;
  matriculas?: number;
  alimentacao?: number;
  alojamento?: number;
}

export interface Supplier {
  id: string;
  nome: string; // Razão Social / Nome
  tipoServico: string; // Categoria Principal / Serviço
  validadeContrato?: string;
  dataRegisto?: string;
  contacto: string;
  email: string;

  // 1. Identificação da Empresa
  razaoSocial?: string;
  nomeFantasia?: string;
  nif?: string;
  dataConstituicao?: string;
  tipoEmpresa?: "Individual" | "Sociedade" | "Outro" | string;

  // 2. Endereço e Contatos
  enderecoCompleto?: string;
  cidadeProvincia?: string;
  pais?: string;
  telefone?: string;
  website?: string;

  // 3. Representante Legal
  repNomeCompleto?: string;
  repCargo?: string;
  repTelefone?: string;
  repEmail?: string;

  // 4. Dados Bancários
  banco?: string;
  agencia?: string;
  numeroConta?: string;
  ibanSwift?: string;

  // 5. Áreas de Atuação
  produtosServicosOferecidos?: string;
  categoriaPrincipal?: string;
  certificacoesAutorizacoes?: string;

  // 6. Documentação Anexa (Checklist)
  docCertidaoRegistoComercial?: boolean;
  docNifFiscal?: boolean;
  docEstatutosEmpresa?: boolean;
  docCertificadoContaBancaria?: boolean;
  docLicencasEspecificas?: boolean;
  docOutros?: string;

  // 7. Declaração
  declaracaoAceite?: boolean;
  localDataDeclaracao?: string;
  assinaturaRepresentante?: string;
}

export interface Bem {
  id: string;
  nome: string;
  categoria:
    | "Imóveis"
    | "Móveis"
    | "Consumíveis"
    | "Inconsumíveis"
    | "Bens Duráveis"
    | "Bens Não Duráveis"
    | string;
  descricao: string;
  quantidadeTotal: number;
  quantidadeDisponivel: number;
  localizacaoAtual: string;
  unidade?: string;
  direcao?: string;
  departamento?: string;
  reparticao?: string;
  setor?: string;
  estado:
    | "Em Uso"
    | "Em Estoque"
    | "Em Reparação"
    | "Abatido"
    | "Novo"
    | "Usado"
    | "Cedido";
  dataAquisicao: string;
  valorUnidade: number;
  fornecedorId?: string;
  alocadoA?: string;
  dataAlocacao?: string;
  updatedBy?: string;
}

export interface Message {
  id?: string;
  subject?: string;
  text: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  timestamp: any;
  tenantId?: string;
  read: boolean;
}

export interface MovimentoEconomato {
  id: string;
  bemId: string;
  tipo: "Entrada" | "Saída";
  quantidade: number;
  data: string;
  responsavel: string;
  destinoOuOrigem: string;
  observacoes: string;
}

export interface MatrixActivity {
  id: string;
  unidadeOrganica: string;
  direcao: string;
  departamento: string;
  reparticao?: string;
  setor?: string;
  orcamento?: string;
  nivel?: string;
  no: string;
  title: string;
  localRealizacao?: string;
  dataMes: string;
  data?: string;
  frequencia: string;
  rubrica: string;
  necessidade: string;
  necessitaAquisicao?: string;
  necessitaContratacao?: string;
  tipoPlano?: string;
  valor: number;
  status:
    | "draft"
    | "submitted"
    | "pronta"
    | "em_execucao"
    | "executada"
    | "setorial"
    | "institucional"
    | "direcao"
    | "departamento";
  responsavel?: string;
  responsavelEmail?: string;
  prazo?: string;
  referencia?: string;
  executada?: boolean;
  relatorio?: string;
  motivoNaoExecucao?: string;
  objetivoActividade?: string;
  trabalhoProvincia?: string;
  trabalhoDistrito?: string;
  outrosColaboradores?: string;
  necessitaTransporte?: string;
  viatura?: string;
  motorista?: string;
  observacoes?: string;
  submetido?: boolean;
  ano?: number;
  [key: string]: any;
}

export interface PublishedMatrix {
  id: string;
  year: number;
  publishedAt: string;
  activityCount: number;
  status: "published" | "shared";
}

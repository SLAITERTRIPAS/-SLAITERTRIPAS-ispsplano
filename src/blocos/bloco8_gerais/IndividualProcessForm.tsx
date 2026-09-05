import React, { useState, useEffect } from "react";
import { Colaborador } from "../../types";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Upload,
  FileText,
  Search,
  User,
  Calendar,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  AlertCircle,
  CheckCircle2,
  Plus,
  Download,
  Trash2,
  Share2,
  Check,
  Link,
  Eye,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import SearchableSelect from "../../components/ui/SearchableSelect";
import { DraftModal, SyncIndicator } from "../../components/ui/DraftMemoryUI";
import {
  DocumentPreviewModal,
  DocumentFile,
} from "../../components/ui/DocumentPreviewModal";
import { firestoreService } from "../../lib/firestoreService";
import {
  ESTADOS_CIVIS,
  NIVEIS_ACADEMICOS,
  CATEGORIAS_FUNCIONARIOS,
  CATEGORIAS_DOCENTES,
  CATEGORIAS_CTAA,
  PROVINCIAS_LIST,
  SECOES,
  HABILITACOES_PROFISSIONAIS_LIST,
  FUNCIONARIOS,
  LISTA_CARGOS_CHEFIA,
  PROVINCIAS,
  UNIDADES_ORGANICAS_SISTEMA,
  DEPARTAMENTOS,
  REPARTICOES,
  CURSOS,
  SETORES,
  getSetoresByDepartamento,
} from "../../constants/formOptions";
import MainHeader from "../bloco1_apresentacao/MainHeader";
import {
  classifyTipo,
  checkIsSystemAdmin,
  generateIndividualProcessLink,
  formatProcessNumber,
  extractProcessSequence,
  getNextProcessSequence,
  generateCollaboratorId,
} from "../../lib/utils";

interface IndividualProcessData {
  // Page 1: Cover
  processoNo: string;
  unidade: string;
  direcao: string;
  departamento: string;
  reparticao: string;
  curso: string;
  cursos: string[];
  disciplinas: string[];
  seccao: string;
  nome: string;
  processoIndividualNo: string;
  nuit: string;

  // Page 2: Personal Data
  genero: "M" | "F";
  filiacaoPai: string;
  filiacaoMae: string;
  estadoCivil: string;
  naturalidade: string;
  naturalidadeDistrito: string;
  dataNascimento: string;
  tipoDocumento: "BI" | "Passaporte";
  biNo: string;
  biEmitidoLocal: string;
  biEmitidoData: string;
  habilitacoesLiterarias: string;
  habilitacoesProfissionais: string;
  carteiraProfissionalNo: string;
  socioSindicatoNo: string;
  trabalhoAnterior: { ano: string; empresa: string; observacoes: string }[];
  morada: string;
  celula: string;
  quarteiraoNo: string;
  casaNo: string;
  telefone: string;
  telefone2?: string;
  totalFilhos: string;
  filhosMenores: {
    dataNascimento: string;
    nome: string;
    numeroFilho: string;
  }[];
  tipoColaborador: string;
  tipoRelacaoContractual: string;
  tipoContrato: string;
  cargoChefia: string;
  vinculoContractual: string;
  cargo: string;
  estadoMandato: string;
  dataAdmissao: string;
  anoIngresso: string;
  categoria: string;
  carreira: string;
  evolucaoHabilitacoesProfissionais: { data: string; descricao: string }[];
  evolucaoHabilitacoesLiterarias: {
    data: string;
    descricao: string;
    instituicao: string;
  }[];

  // Page 3: Variations & Absences
  variacoesCategoriasVencimentos: {
    data: string;
    categoria: string;
    vencimento: string;
    data2: string;
    categoria2: string;
    vencimento2: string;
  }[];
  faltasAnuais: {
    data: string;
    categoria: string;
    vencimento: string;
    data2: string;
    categoria2: string;
    vencimento2: string;
  }[]; // Based on image 3 left side
  movimentoFerias: {
    periodo: string;
    dias: string;
    diasGozar: string;
    inicio: string;
    termino: string;
    rubrica: string;
  }[];
  observacoesPag3: string;

  // Page 4: Punishments & Rewards
  punicoes: { data: string; descricao: string }[];
  descontosAnuais: {
    data: string;
    descricao: string;
    ano: string;
    descricao2: string;
  }[];
  louvores: { data: string; descricao: string }[];
  gratificacoes: {
    data: string;
    normal: string;
    especial: string;
    data2: string;
    normal2: string;
    especial2: string;
  }[];

  // Page 5: Attached Documents
  documentosAnexos: { data: string; descricao: string }[];
  ficheiros: File[];
  sector?: string;
  setoresAtribuidos?: string[];
  email?: string;
  fotoUrl?: string;
}

const initialData: IndividualProcessData = {
  processoNo: "",
  unidade: "",
  direcao: "",
  departamento: "",
  reparticao: "",
  curso: "",
  cursos: ["", "", "", ""],
  disciplinas: ["", "", "", ""],
  seccao: "",
  nome: "",
  processoIndividualNo: "",
  nuit: "",
  genero: "M",
  filiacaoPai: "",
  filiacaoMae: "",
  estadoCivil: "",
  naturalidade: "",
  naturalidadeDistrito: "",
  dataNascimento: "",
  tipoDocumento: "BI",
  biNo: "",
  biEmitidoLocal: "",
  biEmitidoData: "",
  habilitacoesLiterarias: "",
  habilitacoesProfissionais: "",
  carteiraProfissionalNo: "",
  socioSindicatoNo: "",
  trabalhoAnterior: [],
  morada: "",
  celula: "",
  quarteiraoNo: "",
  casaNo: "",
  telefone: "",
  telefone2: "",
  totalFilhos: "",
  filhosMenores: [],
  tipoColaborador: "Docente",
  tipoRelacaoContractual: "Quadro",
  tipoContrato: "Efetivo",
  cargoChefia: "Nenhum",
  vinculoContractual: "",
  cargo: "",
  estadoMandato: "Em Actividade",
  dataAdmissao: "",
  anoIngresso: "",
  categoria: "",
  carreira: "",
  evolucaoHabilitacoesProfissionais: [],
  evolucaoHabilitacoesLiterarias: [],
  variacoesCategoriasVencimentos: [],
  faltasAnuais: [],
  movimentoFerias: [],
  observacoesPag3: "",
  punicoes: [],
  descontosAnuais: [],
  louvores: [],
  gratificacoes: [],
  documentosAnexos: [],
  ficheiros: [],
  fotoUrl: "",
};

const isRowEmpty = (row: any): boolean => {
  if (!row) return true;
  return Object.entries(row).every(([key, val]) => {
    return (
      val === undefined ||
      val === null ||
      String(val).trim() === "" ||
      String(val).trim() === "---"
    );
  });
};

const normalizeFormData = (data: any): IndividualProcessData => {
  const base = { ...initialData, ...data };
  if (data) {
    if (data.vinculoContractual !== undefined) {
      base.vinculoContractual = data.vinculoContractual;
    }
    if (data.cargo !== undefined) {
      base.cargo = data.cargo;
    }
    if (data.estadoMandato !== undefined) {
      base.estadoMandato = data.estadoMandato;
    }
  }

  const generatedId = generateCollaboratorId(base.nome || "", base.nuit || "");
  if (!base.processoIndividualNo && (base.id || generatedId)) {
    base.processoIndividualNo = base.id || generatedId;
  }

  const normalizeArray = (arr: any[], defaultItem: any) => {
    if (!arr) return [];
    // Filtramos os itens que estao vazios para evitar carregar linhas vazias redundantes
    const filtered = arr.filter((item) => {
      if (!item) return false;
      return Object.entries(item).some(([key, val]) => {
        return (
          val !== undefined &&
          val !== null &&
          String(val).trim() !== "" &&
          String(val).trim() !== "---"
        );
      });
    });
    return filtered.map((item) => ({ ...defaultItem, ...item }));
  };

  return {
    ...base,
    trabalhoAnterior: normalizeArray(base.trabalhoAnterior, {
      ano: "",
      empresa: "",
      observacoes: "",
    }),
    filhosMenores: normalizeArray(base.filhosMenores, {
      dataNascimento: "",
      nome: "",
      numeroFilho: "",
    }),
    evolucaoHabilitacoesProfissionais: normalizeArray(
      base.evolucaoHabilitacoesProfissionais,
      { data: "", descricao: "" },
    ),
    evolucaoHabilitacoesLiterarias: normalizeArray(
      base.evolucaoHabilitacoesLiterarias,
      { data: "", descricao: "", instituicao: "" },
    ),
    variacoesCategoriasVencimentos: normalizeArray(
      base.variacoesCategoriasVencimentos,
      {
        data: "",
        categoria: "",
        vencimento: "",
        data2: "",
        categoria2: "",
        vencimento2: "",
      },
    ),
    faltasAnuais: normalizeArray(base.faltasAnuais, {
      data: "",
      categoria: "",
      vencimento: "",
      data2: "",
      categoria2: "",
      vencimento2: "",
    }),
    movimentoFerias: normalizeArray(base.movimentoFerias, {
      periodo: "",
      dias: "",
      diasGozar: "",
      inicio: "",
      termino: "",
      rubrica: "",
    }),
    punicoes: normalizeArray(base.punicoes, { data: "", descricao: "" }),
    descontosAnuais: normalizeArray(base.descontosAnuais, {
      data: "",
      descricao: "",
      ano: "",
      descricao2: "",
    }),
    louvores: normalizeArray(base.louvores, { data: "", descricao: "" }),
    gratificacoes: normalizeArray(base.gratificacoes, {
      data: "",
      normal: "",
      especial: "",
      data2: "",
      normal2: "",
      especial2: "",
    }),
    documentosAnexos: normalizeArray(base.documentosAnexos, {
      data: "",
      descricao: "",
    }),
    cursos: base.cursos || ["", "", "", ""],
    disciplinas: base.disciplinas || ["", "", "", ""],
  };
};

export default function IndividualProcessForm({
  colaboradores,
  initialData: customInitialData,
  onClose,
  onSubmit,
  onDelete,
  history,
  activities,
}: {
  colaboradores: Colaborador[];
  initialData?: IndividualProcessData;
  onClose: () => void;
  onSubmit: (data: IndividualProcessData) => void;
  onDelete?: () => void;
  history: any[];
  activities?: any[];
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState<IndividualProcessData>(() => {
    if (customInitialData) {
      return normalizeFormData(customInitialData);
    }
    return initialData;
  });

  useEffect(() => {
    if (customInitialData) {
      setFormData((prev) =>
        normalizeFormData({ ...prev, ...customInitialData }),
      );
    }
  }, [customInitialData]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Colaborador[]>([]);

  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});
  const [showSuccessCheck, setShowSuccessCheck] = useState(false);

  // Lógica de Persistência (Memória do Sistema)
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const FORM_ID = "individual_process_form";
  let currentUser: any = {};
  try {
    currentUser = JSON.parse(
      localStorage.getItem("sigep_logged_in_user") || "{}",
    );
  } catch (e) {
    console.warn("Erro ao ler utilizador do localStorage:", e);
  }

  useEffect(() => {
    const checkDraft = async () => {
      if (!currentUser?.id || customInitialData) {
        setIsDraftLoaded(true);
        return;
      }
      try {
        const cloudDraft = await firestoreService.drafts.getByUserAndForm(
          currentUser.id,
          FORM_ID,
        );
        if (cloudDraft) {
          setShowDraftModal(true);
        } else {
          setIsDraftLoaded(true);
        }
      } catch (err) {
        setIsDraftLoaded(true);
      }
    };
    checkDraft();
  }, [currentUser?.id, customInitialData]);

  useEffect(() => {
    if (isDraftLoaded && !customInitialData && currentUser?.id) {
      setIsSyncing(true);
      const timer = setTimeout(() => {
        firestoreService.drafts
          .save(currentUser.id, FORM_ID, {
            formData,
            currentPage,
            lastSync: new Date().toISOString(),
          })
          .then(() => setIsSyncing(false));
      }, 15000); // Debounce de 15 segundos para conservar quota gratuita do Firestore
      return () => clearTimeout(timer);
    }
  }, [
    formData,
    currentPage,
    isDraftLoaded,
    customInitialData,
    currentUser?.id,
  ]);

  const recoverDraft = async () => {
    setShowDraftModal(false);
    try {
      const draft: any = await firestoreService.drafts.getByUserAndForm(
        currentUser.id,
        FORM_ID,
      );
      if (draft && draft.formData) {
        setFormData(normalizeFormData(draft.formData));
        if (draft.currentPage) setCurrentPage(draft.currentPage);
      }
    } catch (e) {
      console.error("Erro ao recuperar rascunho:", e);
    }
    setIsDraftLoaded(true);
  };

  const discardDraft = async () => {
    if (currentUser?.id) {
      await firestoreService.drafts.deleteByUserAndForm(
        currentUser.id,
        FORM_ID,
      );
    }
    setIsDraftLoaded(true);
    setShowDraftModal(false);
  };

  const [copiedFormLink, setCopiedFormLink] = useState(false);
  const [selectedPreviewFile, setSelectedPreviewFile] =
    useState<DocumentFile | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Automatic process number generator
  React.useEffect(() => {
    // Generate processoIndividualNo
    if (formData.nome || formData.nuit) {
      const generatedId = generateCollaboratorId(formData.nome, formData.nuit);
      if (generatedId && formData.processoIndividualNo !== generatedId) {
        handleInputChange("processoIndividualNo", generatedId);
      }
    }

    // Generate or maintain processoNo: Songo/XXX/ANO_DE_INGRESSO
    const targetYear =
      formData.anoIngresso ||
      (formData.dataAdmissao
        ? formData.dataAdmissao.match(/\d{4}/)?.[0] ||
          new Date().getFullYear().toString()
        : new Date().getFullYear().toString());

    if (!formData.processoNo) {
      const sorted = [...colaboradores].sort((a, b) =>
        (a.nome || "").localeCompare(b.nome || "", "pt", {
          sensitivity: "base",
        }),
      );
      const index = sorted.findIndex(
        (c) =>
          c.nuit === formData.nuit ||
          (c.nome &&
            formData.nome &&
            c.nome.toLowerCase() === formData.nome.toLowerCase()),
      );
      const seqIndex =
        index >= 0 ? index + 1 : getNextProcessSequence(colaboradores, []);
      const newProcessNo = formatProcessNumber(seqIndex, targetYear);
      handleInputChange("processoNo", newProcessNo);
    } else {
      const currentSeq = extractProcessSequence(formData.processoNo);
      if (currentSeq && currentSeq !== 999999) {
        const expectedProcessNo = formatProcessNumber(currentSeq, targetYear);
        if (
          expectedProcessNo !== formData.processoNo &&
          !formData.processoNo.endsWith(`/${targetYear}`)
        ) {
          handleInputChange("processoNo", expectedProcessNo);
        }
      }
    }
  }, [
    formData.nome,
    formData.nuit,
    formData.dataAdmissao,
    formData.anoIngresso,
    colaboradores.length,
  ]);

  React.useEffect(() => {
    if (!formData.nome && !formData.nuit && !formData.biNo) {
      setDuplicateError(null);
      return;
    }

    const timer = setTimeout(() => {
      setIsVerifying(true);
      setTimeout(() => {
        let conflict = null;
        for (const c of colaboradores) {
          // Compare with initial customData to avoid validating itself
          if (
            c.id &&
            (customInitialData as any)?.id &&
            c.id === (customInitialData as any)?.id
          ) {
            continue;
          }
          if (
            customInitialData &&
            ((customInitialData.nuit &&
              c.nuit === customInitialData.nuit &&
              customInitialData.nuit !== "") ||
              (customInitialData.biNo &&
                c.numeroBI === customInitialData.biNo &&
                customInitialData.biNo !== "") ||
              (customInitialData.processoNo &&
                c.processoNo === customInitialData.processoNo &&
                customInitialData.processoNo !== "") ||
              (customInitialData.processoIndividualNo &&
                c.numeroProcesso === customInitialData.processoIndividualNo &&
                customInitialData.processoIndividualNo !== ""))
          ) {
            continue;
          }
          if (
            customInitialData &&
            c.nuit === customInitialData.nuit &&
            c.nuit !== "" &&
            c.numeroBI === customInitialData.biNo &&
            c.numeroBI !== "" &&
            c.nome === customInitialData.nome &&
            c.nome !== ""
          ) {
            continue;
          }
          if (c.id === (customInitialData as any)?.id) {
            continue;
          }

          if (
            c.nome &&
            formData.nome &&
            c.nome.toLowerCase() === formData.nome.trim().toLowerCase()
          ) {
            conflict = "nome";
            break;
          }
          if (c.nuit && formData.nuit && c.nuit === formData.nuit.trim()) {
            conflict = "nuit";
            break;
          }
          if (
            c.numeroBI &&
            formData.biNo &&
            c.numeroBI === formData.biNo.trim()
          ) {
            conflict = "bi";
            break;
          }
        }

        if (conflict) {
          setDuplicateError(
            `Já existe um colaborador com este ${conflict === "nome" ? "Nome Completo" : conflict === "nuit" ? "NUIT" : "B.I."} registado no sistema.`,
          );
        } else {
          setDuplicateError(null);
        }
        setIsVerifying(false);
      }, 800);
    }, 500);

    return () => clearTimeout(timer);
  }, [
    formData.nome,
    formData.nuit,
    formData.biNo,
    colaboradores,
    customInitialData,
  ]);

  const handleSearch = (termToSearch?: string) => {
    const term = (termToSearch || searchTerm).trim().toLowerCase();
    if (!term) return;

    const results = colaboradores.filter(
      (c) =>
        (c.nuit || "").toLowerCase().includes(term) ||
        (c.nome || "").toLowerCase().includes(term),
    );

    setSearchResults(results);
    if (results.length === 0) {
      alert("Nenhum colaborador encontrado com este NUIT ou Nome.");
    }
  };

  const selectColaborador = (col: Colaborador) => {
    setFormData((prev) => ({
      ...prev,
      nome: col.nome || "",
      nuit: col.nuit || "",
      processoNo:
        (col as any).processoNo ||
        col.numeroProcesso ||
        (col as any).individualData?.processoNo ||
        prev.processoNo ||
        "",
      processoIndividualNo: col.numeroProcesso || col.id || "",
      unidade: col.unidade || "",
      direcao: col.direcao || "",
      departamento: col.departamento || "",
      reparticao: col.reparticao || "",
      curso: col.curso || col.reparticao || "",
      cursos:
        col.cursos || (col.curso ? [col.curso, "", "", ""] : ["", "", "", ""]),
      disciplinas: col.disciplinas || ["", "", "", ""],
      seccao: col.unidade || "",
      genero: (col.genero as any) || "M",
      dataNascimento: col.dataNascimento || "",
      tipoDocumento: col.tipoDocumento || "BI",
      biNo: col.numeroBI || "",
      biEmitidoLocal: col.biEm || "",
      biEmitidoData: col.biEmitidoA || "",
      filiacaoPai: col.filiacaoPai || "",
      filiacaoMae: col.filiacaoMae || "",
      habilitacoesLiterarias: col.nivelAcademico || "",
      habilitacoesProfissionais: col.areaFormacao || "",
      tipoColaborador: col.tipo === "CTA" ? "CTA" : "Docente",
      categoria: col.categoria || "",
      carreira: col.carreira || "",
      cargoChefia: col.cargoChefia || "Nenhum",
      vinculoContractual: col.vinculoContractual || "",
      cargo: col.cargo || "",
      estadoMandato: col.estadoMandato || "Em Actividade",
      tipoContrato: col.tipoContrato || "Efetivo",
      dataAdmissao: col.dataAdmissao || "",
      anoIngresso: (col as any).anoIngresso
        ? String((col as any).anoIngresso)
        : col.dataAdmissao
          ? col.dataAdmissao.match(/\d{4}/)?.[0] || ""
          : "",
      telefone: col.telefone || "",
      telefone2:
        (col as any).telefone2 || (col as any).telefoneAlternativo || "",
      email: col.email || "",
      fotoUrl: col.fotoUrl || prev.fotoUrl,
      morada:
        col.morada ||
        `${col.localNascimento?.provincia || ""}${col.localNascimento?.distrito ? `, ${col.localNascimento.distrito}` : ""}${col.bairro ? `, ${col.bairro}` : ""}`,
      naturalidade: col.localNascimento?.provincia || "",
      naturalidadeDistrito: col.localNascimento?.distrito || "",
      celula: col.celula || "",
      quarteiraoNo: col.quarteirao || "",
      casaNo: col.casaNo || "",
      totalFilhos: col.numFilhos?.toString() || "",
      tipoRelacaoContractual:
        col.efetivo ||
        (col.tipoRelacaoContractual || "")
          .toLowerCase()
          .includes("difinitivo") ||
        (col.tipoRelacaoContractual || "").toLowerCase().includes("definitivo")
          ? "Quadro"
          : "Fora do Quadro",
    }));
    setShowImportModal(false);
    setSearchTerm("");
    setSearchResults([]);
  };
  const handleInputChange = (
    field: keyof IndividualProcessData,
    value: any,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const unidadesNoPlano = Array.from(
    new Set(
      (activities || [])
        .map((act) => act.unidadeOrganica || act.direcao || act.unidade)
        .filter(Boolean),
    ),
  ).sort();

  React.useEffect(() => {
    // A alocação automática foi removida para permitir que o campo esteja em branco conforme solicitado pelo utilizador.
  }, [formData.cargoChefia, formData.unidade, formData.direcao]);

  const handleTableChange = (
    field: keyof IndividualProcessData,
    index: number,
    subField: string,
    value: any,
  ) => {
    const list = [...(formData[field] as any[])];
    list[index] = { ...list[index], [subField]: value };
    setFormData((prev) => ({ ...prev, [field]: list }));
  };

  const removeRow = (field: keyof IndividualProcessData, index: number) => {
    setFormData((prev) => {
      const list = [...(prev[field] as any[])];
      list.splice(index, 1);
      return { ...prev, [field]: list };
    });
  };

  const addRow = (field: keyof IndividualProcessData, template: any) => {
    const list = formData[field] as any[];
    if (list && list.length > 0) {
      const lastRow = list[list.length - 1];
      if (isRowEmpty(lastRow)) {
        setErrorMessage(
          "Por favor, preencha os dados da linha atual antes de criar uma nova.",
        );
        setTimeout(() => setErrorMessage(null), 5000);
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field] as any[]), template],
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFormData((prev) => ({
        ...prev,
        ficheiros: [...prev.ficheiros, ...newFiles],
      }));
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData((prev) => ({
            ...prev,
            fotoUrl: event.target?.result as string,
          }));
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setValidationErrors({});

    // Validations:
    const errors: { [key: string]: string } = {};
    let firstErrorPage = 0;
    let firstErrorMessage = "";

    if (!formData.processoNo) {
      errors.processoNo = "O Número de Processo é obrigatório.";
      if (!firstErrorPage) {
        firstErrorPage = 1;
        firstErrorMessage = errors.processoNo;
      }
    }
    if (!formData.anoIngresso) {
      errors.anoIngresso = "O Ano de Ingresso é obrigatório.";
      if (!firstErrorPage) {
        firstErrorPage = 1;
        firstErrorMessage = errors.anoIngresso;
      }
    }
    if (!formData.nome) {
      errors.nome = "O Nome do colaborador é obrigatório.";
      if (!firstErrorPage) {
        firstErrorPage = 2;
        firstErrorMessage = errors.nome;
      }
    }
    if (!formData.nuit) {
      errors.nuit = "O NUIT é obrigatório.";
      if (!firstErrorPage) {
        firstErrorPage = 2;
        firstErrorMessage = errors.nuit;
      }
    }
    if (!formData.biNo) {
      errors.biNo = `O número do ${formData.tipoDocumento === "Passaporte" ? "Passaporte" : "B.I."} é obrigatório.`;
      if (!firstErrorPage) {
        firstErrorPage = 2;
        firstErrorMessage = errors.biNo;
      }
    }
    if (!formData.vinculoContractual) {
      errors.vinculoContractual = "O Vínculo Contratual é obrigatório.";
      if (!firstErrorPage) {
        firstErrorPage = 2;
        firstErrorMessage = errors.vinculoContractual;
      }
    }
    if (!formData.cargo) {
      errors.cargo = "O Cargo é obrigatório.";
      if (!firstErrorPage) {
        firstErrorPage = 2;
        firstErrorMessage = errors.cargo;
      }
    }
    if (
      formData.cargoChefia &&
      formData.cargoChefia !== "Nenhum" &&
      !formData.estadoMandato
    ) {
      errors.estadoMandato = "O Estado do Mandato é obrigatório.";
      if (!firstErrorPage) {
        firstErrorPage = 2;
        firstErrorMessage = errors.estadoMandato;
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setErrorMessage(firstErrorMessage);
      setCurrentPage(firstErrorPage);
      setIsSubmitting(false);
      return;
    }

    try {
      // Filtrar todos os arrays para excluir itens vazios (campos sem dados)
      const cleanData = { ...formData };
      const fallbackGeneratedId = generateCollaboratorId(cleanData.nome, cleanData.nuit);
      if (!cleanData.processoIndividualNo) {
        cleanData.processoIndividualNo = fallbackGeneratedId || cleanData.processoNo || `PROCESSO-${Date.now()}`;
      }
      const arrayFields: (keyof IndividualProcessData)[] = [
        "trabalhoAnterior",
        "filhosMenores",
        "evolucaoHabilitacoesProfissionais",
        "evolucaoHabilitacoesLiterarias",
        "variacoesCategoriasVencimentos",
        "faltasAnuais",
        "movimentoFerias",
        "punicoes",
        "descontosAnuais",
        "louvores",
        "gratificacoes",
        "documentosAnexos",
      ];

      arrayFields.forEach((field) => {
        if (Array.isArray((cleanData as any)[field])) {
          (cleanData as any)[field] = ((cleanData as any)[field] as any[]).filter(
            (item) => !isRowEmpty(item),
          ) as any;
        }
      });

      await onSubmit(cleanData);
      // Limpar rascunho (Memória do Sistema)
      if (currentUser?.id) {
        await firestoreService.drafts.deleteByUserAndForm(
          currentUser.id,
          FORM_ID,
        );
      }

      // Mostrar tela de sucesso (certo verde)
      setShowSuccessCheck(true);

      // Fechar o formulário após 1.5 segundos
      setTimeout(() => {
        setShowSuccessCheck(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err?.message ||
          "Ocorreu um erro ao submeter o processo. Por favor, tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 1:
        return (
          <div className="space-y-12 py-10 flex flex-col items-center relative">
            <div className="absolute top-10 right-10">
              <div className="relative group">
                <label className="w-32 h-40 border border-black flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-gray-50 hover:bg-gray-100 transition-colors">
                  {formData.fotoUrl ? (
                    <img
                      src={formData.fotoUrl}
                      alt="Foto"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <Upload size={24} className="text-gray-400 mb-2" />
                      <span className="text-[10px] text-gray-400 text-center px-2 font-bold">
                        Carregar Foto
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                  />
                </label>
                {formData.fotoUrl && (
                  <button
                    onClick={() => handleInputChange("fotoUrl", "")}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <AlertCircle size={12} />
                  </button>
                )}
              </div>
            </div>
            <div className="flex justify-center w-full">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`border-2 p-4 w-60 text-center bg-white shadow-sm rounded-lg transition-all ${validationErrors.processoNo || validationErrors.anoIngresso ? "border-red-500 ring-2 ring-red-100" : "border-black"}`}
                >
                  <p className="text-xs font-bold text-gray-700  tracking-wider">
                    Processo Individual
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-gray-900">Nº</span>
                    <input
                      type="text"
                      className={`w-full border-b border-dotted outline-none text-center font-mono font-bold transition-all ${validationErrors.processoNo ? "border-red-500 text-red-600 bg-red-50/50" : "border-black text-blue-900"}`}
                      value={formData.processoNo || ""}
                      onChange={(e) => {
                        handleInputChange("processoNo", e.target.value);
                        if (validationErrors.processoNo)
                          setValidationErrors((prev) => ({
                            ...prev,
                            processoNo: "",
                          }));
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-gray-200">
                    <span className="text-xs font-bold text-gray-700 whitespace-nowrap">
                      Ano de Ingresso:
                    </span>
                    <input
                      type="number"
                      min="1950"
                      max="2099"
                      placeholder="Ex: 2026"
                      className={`w-full border-b border-dotted outline-none text-center font-mono font-bold text-xs transition-all ${validationErrors.anoIngresso ? "border-red-500 text-red-600 bg-red-50/50" : "border-black text-blue-900"}`}
                      value={formData.anoIngresso || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleInputChange("anoIngresso", val);
                        if (validationErrors.anoIngresso)
                          setValidationErrors((prev) => ({
                            ...prev,
                            anoIngresso: "",
                          }));
                        if (val && val.length === 4) {
                          const seqIndex = getNextProcessSequence(
                            colaboradores,
                            [],
                          );
                          handleInputChange(
                            "processoNo",
                            formatProcessNumber(seqIndex, val),
                          );
                        }
                      }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const targetId =
                      (customInitialData as any)?.id ||
                      formData.processoIndividualNo ||
                      formData.processoNo ||
                      "PROCESSO";
                    const link = generateIndividualProcessLink(
                      targetId,
                      formData.processoNo,
                    );
                    navigator.clipboard.writeText(link);
                    setCopiedFormLink(true);
                    setTimeout(() => setCopiedFormLink(false), 2500);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
                    copiedFormLink
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                  }`}
                  title="Gerar Link Direto do Processo Individual"
                >
                  {copiedFormLink ? (
                    <>
                      <Check size={14} /> Link Copiado!
                    </>
                  ) : (
                    <>
                      <Share2 size={14} /> Gerar Link do Processo Individual
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center gap-10 my-10 w-full">
              <div className="w-full max-w-lg space-y-8">
                <div className="flex items-center gap-4 justify-center">
                  <span className="text-xs font-bold rotate-180 [writing-mode:vertical-lr]">
                    Secção
                  </span>
                  <div className="w-full text-2xl font-serif text-center font-bold text-amber-500">
                    Instituto Superior Politécnico de Songo
                  </div>
                </div>
              </div>

              <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-gray-900">
                  Processo Individual
                </h1>
                <p className="text-xl font-serif italic text-gray-500">DE</p>
              </div>

              <div className="w-full max-w-2xl space-y-6">
                <div className="flex items-center gap-4 justify-center">
                  <span className="text-xs font-bold rotate-180 [writing-mode:vertical-lr]">
                    Nome
                  </span>
                  <div className="w-full space-y-4">
                    <SearchableSelect
                      options={colaboradores.map((c) => ({
                        value: c.nome,
                        label: c.nome,
                        detail: c.nuit ? `NUIT: ${c.nuit}` : undefined,
                      }))}
                      value={formData.nome || ""}
                      onChange={(val) => {
                        const col = colaboradores.find(
                          (c) => c.nome === val || (c.nuit && c.nuit === val),
                        );
                        if (col) {
                          selectColaborador(col);
                        } else {
                          handleInputChange("nome", val);
                        }
                      }}
                      className="w-full text-2xl font-bold"
                      placeholder="Pesquisar por Nome ou NUIT..."
                    />
                    <div className="border-b border-black w-full h-px"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center w-full mt-20">
              <div className="border-[6px] border-double border-red-600 p-6 w-full max-w-md h-32 flex flex-col items-center justify-center bg-red-50 rounded-3xl shadow-2xl transform rotate-1 ring-4 ring-red-500/10">
                <span className="text-sm font-black text-red-600 tracking-[0.2em] mb-2 ">
                  Nº PROCESSO / ID ÚNICO
                </span>
                <div className="w-full flex items-center justify-center gap-2">
                  <span className="text-red-700 font-black text-2xl">№</span>
                  <input
                    type="text"
                    className="w-full bg-transparent border-b-2 border-red-600 outline-none font-black text-center text-3xl text-red-700 cursor-not-allowed select-none"
                    value={formData.processoIndividualNo || ""}
                    readOnly
                    disabled
                  />
                </div>
                <span className="text-[10px] font-bold text-red-500  tracking-tighter mt-1">
                  Bloqueado para alteração
                </span>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 text-sm">
            {/* Cartão de Dados Pessoais - Estilo idêntico ao da imagem fornecida */}
            <div className="relative border border-gray-300 rounded-[2.5rem] p-8 pt-10 bg-slate-50/50 shadow-sm mt-4">
              {/* Rótulo de legenda que interrompe a borda superior */}
              <div className="absolute -top-3.5 left-10 bg-white px-4 flex items-center gap-2">
                <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                <span className="text-sm font-black text-blue-950  tracking-wider">
                  Dados Pessoais
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Nº Processo / ID Único */}
                <div className="flex flex-col md:col-span-3">
                  <label className="text-[11px] font-bold text-red-600 tracking-tight mb-1">
                    Nº Processo / ID Único
                  </label>
                  <div
                    className={`flex items-center bg-red-50/50 border border-red-200 rounded-2xl px-4 py-2.5 transition-all`}
                  >
                    <input
                      type="text"
                      className="w-full bg-transparent border-none outline-none text-center font-mono font-bold text-red-700 text-sm focus:ring-0"
                      value={formData.processoNo || ""}
                      onChange={(e) => {
                        handleInputChange("processoNo", e.target.value);
                        if (validationErrors.processoNo)
                          setValidationErrors((prev) => ({
                            ...prev,
                            processoNo: "",
                          }));
                      }}
                      placeholder="Nº Processo"
                    />
                  </div>
                </div>

                {/* Nome Completo */}
                <div className="flex flex-col md:col-span-9">
                  <label className="text-[11px] font-bold text-gray-700 tracking-tight mb-1">
                    Nome Completo
                  </label>
                  <div
                    className={`flex items-center bg-white border ${validationErrors.nome ? "border-red-500 ring-2 ring-red-100 bg-red-50/50" : "border-gray-300"} rounded-2xl px-4 py-1 transition-all`}
                  >
                    <SearchableSelect
                      options={colaboradores.map((c) => ({
                        value: c.nome,
                        label: c.nome,
                        detail: c.nuit ? `NUIT: ${c.nuit}` : undefined,
                      }))}
                      value={formData.nome || ""}
                      onChange={(val) => {
                        const col = colaboradores.find(
                          (c) => c.nome === val || (c.nuit && c.nuit === val),
                        );
                        if (col) {
                          selectColaborador(col);
                        } else {
                          handleInputChange("nome", val);
                        }
                        if (validationErrors.nome)
                          setValidationErrors((prev) => ({
                            ...prev,
                            nome: "",
                          }));
                      }}
                      className="flex-grow bg-transparent border-none outline-none text-gray-900 text-base font-medium focus:ring-0"
                      placeholder="Digite ou selecione o nome completo"
                    />
                  </div>
                </div>

                {/* Género */}
                <div className="flex flex-col md:col-span-3">
                  <label className="text-[11px] font-bold text-gray-700 tracking-tight mb-1">
                    Género
                  </label>
                  <div className="flex items-center bg-white border border-gray-300 rounded-2xl px-4 py-2.5">
                    <select
                      className="w-full bg-white border-none outline-none text-sm font-medium text-gray-900 cursor-pointer focus:ring-0"
                      value={formData.genero || "M"}
                      onChange={(e) =>
                        handleInputChange("genero", e.target.value)
                      }
                    >
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                    </select>
                  </div>
                </div>

                {/* Estado Civil */}
                <div className="flex flex-col md:col-span-3">
                  <label className="text-[11px] font-bold text-gray-700 tracking-tight mb-1">
                    Estado Civil
                  </label>
                  <div className="flex items-center bg-white border border-gray-300 rounded-2xl px-4 py-2.5">
                    <select
                      className="w-full bg-white border-none outline-none text-sm font-medium text-gray-900 cursor-pointer focus:ring-0"
                      value={formData.estadoCivil || ""}
                      onChange={(e) =>
                        handleInputChange("estadoCivil", e.target.value)
                      }
                    >
                      <option value="">Selecione...</option>
                      {ESTADOS_CIVIS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* BI / Passaporte */}
                <div className="flex flex-col md:col-span-3">
                  <div className="flex items-center gap-1 mb-1">
                    <select
                      className="text-[11px] font-bold text-gray-700 tracking-tight bg-transparent border-none p-0 outline-none cursor-pointer focus:ring-0"
                      value={formData.tipoDocumento || "BI"}
                      onChange={(e) => {
                        handleInputChange("tipoDocumento", e.target.value);
                        if (validationErrors.biNo)
                          setValidationErrors((prev) => ({
                            ...prev,
                            biNo: "",
                          }));
                      }}
                    >
                      <option value="BI">BI</option>
                      <option value="Passaporte">Passaporte</option>
                    </select>
                    <span className="text-[11px] font-bold text-gray-700">
                      / Nº
                    </span>
                  </div>
                  <div
                    className={`flex items-center bg-white border ${validationErrors.biNo ? "border-red-500 ring-2 ring-red-100 bg-red-50/50" : "border-gray-300"} rounded-2xl px-4 py-2.5 transition-all`}
                  >
                    <input
                      type="text"
                      className="w-full bg-transparent border-none outline-none text-sm font-medium text-gray-900 focus:ring-0"
                      value={formData.biNo || ""}
                      onChange={(e) => {
                        handleInputChange("biNo", e.target.value);
                        if (validationErrors.biNo)
                          setValidationErrors((prev) => ({
                            ...prev,
                            biNo: "",
                          }));
                      }}
                    />
                  </div>
                </div>

                {/* Emitido em */}
                <div className="flex flex-col md:col-span-3">
                  <label className="text-[11px] font-bold text-gray-700 tracking-tight mb-1">
                    Emitido em
                  </label>
                  <div className="flex items-center bg-white border border-gray-300 rounded-2xl px-4 py-2.5">
                    <input
                      type="text"
                      list="bi-emitido-list-v4"
                      className="w-full bg-transparent border-none outline-none text-sm font-medium text-gray-900 focus:ring-0"
                      placeholder="Ex: Maputo"
                      value={formData.biEmitidoLocal || ""}
                      onChange={(e) =>
                        handleInputChange("biEmitidoLocal", e.target.value)
                      }
                    />
                    <datalist id="bi-emitido-list-v4">
                      {PROVINCIAS_LIST.map((p) => (
                        <option key={p} value={p} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Data de Emissão */}
                <div className="flex flex-col md:col-span-3">
                  <label className="text-[11px] font-bold text-gray-700 tracking-tight mb-1">
                    {formData.tipoDocumento === "Passaporte"
                      ? "Data de Emissão (Passaporte)"
                      : "Data de Emissão (BI)"}
                  </label>
                  <div className="flex items-center bg-white border border-gray-300 rounded-2xl px-4 py-2.5">
                    <input
                      type="date"
                      className="w-full bg-transparent border-none outline-none text-sm font-medium text-gray-900 focus:ring-0"
                      value={formData.biEmitidoData || ""}
                      onChange={(e) =>
                        handleInputChange("biEmitidoData", e.target.value)
                      }
                    />
                  </div>
                </div>

                {/* NUIT */}
                <div className="flex flex-col md:col-span-3">
                  <label className="text-[11px] font-bold text-gray-700 tracking-tight mb-1">
                    NUIT
                  </label>
                  <div
                    className={`flex items-center bg-white border ${validationErrors.nuit ? "border-red-500 ring-2 ring-red-100 bg-red-50/50" : "border-gray-300"} rounded-2xl px-4 py-2.5 transition-all`}
                  >
                    <input
                      type="text"
                      className="w-full bg-transparent border-none outline-none text-sm font-medium text-gray-900 focus:ring-0"
                      value={formData.nuit || ""}
                      onChange={(e) => {
                        handleInputChange("nuit", e.target.value);
                        if (validationErrors.nuit)
                          setValidationErrors((prev) => ({
                            ...prev,
                            nuit: "",
                          }));
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const nuite = formData.nuit;
                        setSearchTerm(nuite);
                        setShowImportModal(true);
                        if (nuite) handleSearch(nuite);
                      }}
                      className="whitespace-nowrap text-[10px] font-bold bg-blue-600 text-white px-2 py-1 rounded-lg hover:bg-blue-700 flex items-center gap-1 shadow-sm transition-all ml-2 shrink-0"
                    >
                      <Search size={10} />
                      Importar
                    </button>
                  </div>
                </div>

                {/* Telefone 1 */}
                <div className="flex flex-col md:col-span-4">
                  <label className="text-[11px] font-bold text-gray-700 tracking-tight mb-1">
                    Telefone
                  </label>
                  <div className="flex items-center bg-white border border-gray-300 rounded-2xl px-4 py-2.5">
                    <input
                      type="text"
                      className="w-full bg-transparent border-none outline-none text-sm font-medium text-gray-900 focus:ring-0"
                      value={formData.telefone || ""}
                      onChange={(e) =>
                        handleInputChange("telefone", e.target.value)
                      }
                    />
                  </div>
                </div>

                {/* Telefone 2 */}
                <div className="flex flex-col md:col-span-4">
                  <label className="text-[11px] font-bold text-gray-700 tracking-tight mb-1">
                    Telefone (Alternativo)
                  </label>
                  <div className="flex items-center bg-white border border-gray-300 rounded-2xl px-4 py-2.5">
                    <input
                      type="text"
                      className="w-full bg-transparent border-none outline-none text-sm font-medium text-gray-900 focus:ring-0"
                      value={formData.telefone2 || ""}
                      onChange={(e) =>
                        handleInputChange("telefone2", e.target.value)
                      }
                    />
                  </div>
                </div>

                {/* Email Pessoal */}
                <div className="flex flex-col md:col-span-4">
                  <label className="text-[11px] font-bold text-gray-700 tracking-tight mb-1 italic">
                    Email Pessoal
                  </label>
                  <div className="flex items-center bg-white border border-gray-300 rounded-2xl px-4 py-2.5">
                    <input
                      type="email"
                      className="w-full bg-transparent border-none outline-none text-sm font-medium text-gray-900 focus:ring-0"
                      placeholder="exemplo@songo.ac.mz"
                      value={formData.email || ""}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                    />
                  </div>
                </div>

                {/* Nome do Pai */}
                <div className="flex flex-col md:col-span-6">
                  <label className="text-[11px] font-bold text-gray-700 tracking-tight mb-1">
                    Nome do Pai
                  </label>
                  <div className="flex items-center bg-white border border-gray-300 rounded-2xl px-4 py-2.5">
                    <input
                      type="text"
                      className="w-full bg-transparent border-none outline-none text-sm font-medium text-gray-900 focus:ring-0"
                      value={formData.filiacaoPai || ""}
                      onChange={(e) =>
                        handleInputChange("filiacaoPai", e.target.value)
                      }
                    />
                  </div>
                </div>

                {/* Nome da Mãe */}
                <div className="flex flex-col md:col-span-6">
                  <label className="text-[11px] font-bold text-gray-700 tracking-tight mb-1">
                    Nome da Mãe
                  </label>
                  <div className="flex items-center bg-white border border-gray-300 rounded-2xl px-4 py-2.5">
                    <input
                      type="text"
                      className="w-full bg-transparent border-none outline-none text-sm font-medium text-gray-900 focus:ring-0"
                      value={formData.filiacaoMae || ""}
                      onChange={(e) =>
                        handleInputChange("filiacaoMae", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Cartão de Origem, Nascimento e Habilitações */}
            <div className="relative border border-gray-300 rounded-[2.5rem] p-8 pt-10 bg-slate-50/50 shadow-sm mt-8">
              {/* Rótulo de legenda que interrompe a borda superior */}
              <div className="absolute -top-3.5 left-10 bg-white px-4 flex items-center gap-2">
                <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                <span className="text-sm font-black text-blue-950  tracking-wider">
                  Origem, Nascimento e Habilitações
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Data de Nascimento */}
                <div className="flex flex-col md:col-span-4">
                  <label className="text-[11px] font-bold text-gray-700 tracking-tight mb-1">
                    Data de Nascimento
                  </label>
                  <div className="flex items-center bg-white border border-gray-300 rounded-2xl px-4 py-2.5">
                    <input
                      type="date"
                      className="w-full bg-transparent border-none outline-none text-sm font-medium text-gray-900 focus:ring-0"
                      value={formData.dataNascimento || ""}
                      onChange={(e) =>
                        handleInputChange("dataNascimento", e.target.value)
                      }
                    />
                  </div>
                </div>

                {/* Naturalidade */}
                <div className="flex flex-col md:col-span-4">
                  <label className="text-[11px] font-bold text-gray-700 tracking-tight mb-1">
                    Naturalidade
                  </label>
                  <div className="flex items-center bg-white border border-gray-300 rounded-2xl px-4 py-1">
                    <SearchableSelect
                      className="flex-grow bg-transparent border-none outline-none text-gray-900 text-sm font-medium focus:ring-0"
                      options={Object.keys(PROVINCIAS)}
                      value={formData.naturalidade || ""}
                      onChange={(val) => {
                        handleInputChange("naturalidade", val);
                        handleInputChange("naturalidadeDistrito", "");
                      }}
                    />
                  </div>
                </div>

                {/* Distrito */}
                <div className="flex flex-col md:col-span-4">
                  <label className="text-[11px] font-bold text-gray-700 tracking-tight mb-1">
                    Distrito
                  </label>
                  <div className="flex items-center bg-white border border-gray-300 rounded-2xl px-4 py-2.5">
                    <select
                      className="w-full bg-white border-none outline-none text-sm font-medium text-gray-900 cursor-pointer focus:ring-0 disabled:opacity-50"
                      value={formData.naturalidadeDistrito || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "naturalidadeDistrito",
                          e.target.value,
                        )
                      }
                      disabled={!formData.naturalidade}
                    >
                      <option value="">Selecione...</option>
                      {formData.naturalidade &&
                        (PROVINCIAS as any)[formData.naturalidade]?.map(
                          (d: string) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ),
                        )}
                    </select>
                  </div>
                </div>

                {/* Habilitações Literárias */}
                <div className="flex flex-col md:col-span-6">
                  <label className="text-[11px] font-bold text-gray-700 tracking-tight mb-1">
                    Habilitações Literárias
                  </label>
                  <div className="flex items-center bg-white border border-gray-300 rounded-2xl px-4 py-1">
                    <SearchableSelect
                      className="flex-grow bg-transparent border-none outline-none text-gray-900 text-sm font-medium focus:ring-0"
                      options={NIVEIS_ACADEMICOS}
                      value={formData.habilitacoesLiterarias || ""}
                      onChange={(val) =>
                        handleInputChange("habilitacoesLiterarias", val)
                      }
                    />
                  </div>
                </div>

                {/* Habilitações Profissionais */}
                <div className="flex flex-col md:col-span-6">
                  <label className="text-[11px] font-bold text-gray-700 tracking-tight mb-1">
                    Habilitações Profissionais
                  </label>
                  <div className="flex items-center bg-white border border-gray-300 rounded-2xl px-4 py-1">
                    <SearchableSelect
                      className="flex-grow bg-transparent border-none outline-none text-gray-900 text-sm font-medium focus:ring-0"
                      options={HABILITACOES_PROFISSIONAIS_LIST}
                      value={formData.habilitacoesProfissionais || ""}
                      onChange={(val) =>
                        handleInputChange("habilitacoesProfissionais", val)
                      }
                    />
                  </div>
                </div>

                {/* Carteira Profissional Nº */}
                <div className="flex flex-col md:col-span-6">
                  <label className="text-[11px] font-bold text-gray-700 tracking-tight mb-1">
                    Carteira Profissional Nº
                  </label>
                  <div className="flex items-center bg-white border border-gray-300 rounded-2xl px-4 py-2.5">
                    <input
                      type="text"
                      className="w-full bg-transparent border-none outline-none text-sm font-medium text-gray-900 focus:ring-0"
                      value={formData.carteiraProfissionalNo || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "carteiraProfissionalNo",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                </div>

                {/* Sócio do Sindicato Nº */}
                <div className="flex flex-col md:col-span-6">
                  <label className="text-[11px] font-bold text-gray-700 tracking-tight mb-1">
                    Sócio do Sindicato Nº
                  </label>
                  <div className="flex items-center bg-white border border-gray-300 rounded-2xl px-4 py-2.5">
                    <input
                      type="text"
                      className="w-full bg-transparent border-none outline-none text-sm font-medium text-gray-900 focus:ring-0"
                      value={formData.socioSindicatoNo || ""}
                      onChange={(e) =>
                        handleInputChange("socioSindicatoNo", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 relative">
              <h3 className="text-center font-bold mb-2">
                Empresa Ou Serviços Trabalhou Anteriormente
              </h3>
              <table className="w-full border-collapse border border-black">
                <thead>
                  <tr>
                    <th className="border border-black p-1 w-20">Ano</th>
                    <th className="border border-black p-1">
                      Empresa ou Serviço
                    </th>
                    <th className="border border-black p-1">Observações</th>
                    {formData.trabalhoAnterior.length > 0 && (
                      <th className="border border-black p-1 w-12 text-center">
                        Excluir
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {formData.trabalhoAnterior.map((item, idx) => (
                    <tr key={idx}>
                      <td className="border border-black p-0">
                        <input
                          type="number"
                          min="1900"
                          max="2100"
                          className="w-full p-1 outline-none"
                          value={item.ano}
                          onChange={(e) =>
                            handleTableChange(
                              "trabalhoAnterior",
                              idx,
                              "ano",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="border border-black p-0">
                        <input
                          type="text"
                          list="empresa-list"
                          className="w-full p-1 outline-none"
                          value={item.empresa}
                          onChange={(e) =>
                            handleTableChange(
                              "trabalhoAnterior",
                              idx,
                              "empresa",
                              e.target.value,
                            )
                          }
                        />
                        <datalist id="empresa-list">
                          {Array.from(
                            new Set(
                              (colaboradores as any[])
                                .flatMap(
                                  (c) =>
                                    c.trabalhoAnterior?.map(
                                      (t: any) => t.empresa,
                                    ) || [],
                                )
                                .filter(Boolean),
                            ),
                          ).map((emp) => (
                            <option key={emp as string} value={emp as string} />
                          ))}
                        </datalist>
                      </td>
                      <td className="border border-black p-0">
                        <input
                          type="text"
                          className="w-full p-1 outline-none"
                          value={item.observacoes}
                          onChange={(e) =>
                            handleTableChange(
                              "trabalhoAnterior",
                              idx,
                              "observacoes",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="border border-black p-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeRow("trabalhoAnterior", idx)}
                          className="text-red-600 hover:text-red-800 transition-colors p-1"
                          title="Remover linha"
                        >
                          <Trash2 size={12} className="mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {formData.trabalhoAnterior.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="border border-black p-4 text-center text-gray-400 italic"
                      >
                        Nenhum registo inserido.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="flex justify-end mt-2">
                <button
                  onClick={() =>
                    addRow("trabalhoAnterior", {
                      ano: "",
                      empresa: "",
                      observacoes: "",
                    })
                  }
                  className="bg-blue-900 text-white px-4 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-blue-800 transition-colors"
                >
                  <Plus size={12} /> + coluna
                </button>
              </div>
            </div>

            <div className="space-y-4 mt-8">
              {/* Row 1: Morada, Célula, Quarteirão */}
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex gap-2 items-center flex-[3] w-full">
                  <span className="font-bold whitespace-nowrap">Morada:</span>
                  <input
                    type="text"
                    list="morada-list"
                    className="flex-grow border-b border-black outline-none"
                    value={formData.morada || ""}
                    onChange={(e) =>
                      handleInputChange("morada", e.target.value)
                    }
                    placeholder="(província, distrito e bairro)"
                  />
                  <datalist id="morada-list">
                    {Array.from(
                      new Set(
                        colaboradores.map((c) => c.morada).filter(Boolean),
                      ),
                    ).map((mor) => (
                      <option key={mor as string} value={mor as string} />
                    ))}
                  </datalist>
                </div>
                <div className="flex gap-2 items-center flex-1 w-full">
                  <span className="font-bold whitespace-nowrap">Célula:</span>
                  <input
                    type="text"
                    className="flex-grow border-b border-black outline-none"
                    value={formData.celula || ""}
                    onChange={(e) =>
                      handleInputChange("celula", e.target.value)
                    }
                  />
                </div>
                <div className="flex gap-2 items-center flex-1 w-full">
                  <span className="font-bold whitespace-nowrap">
                    Quarteirão:
                  </span>
                  <input
                    type="text"
                    className="flex-grow border-b border-black outline-none"
                    value={formData.quarteiraoNo || ""}
                    onChange={(e) =>
                      handleInputChange("quarteiraoNo", e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Row 2: Casa nº, Telefone, Nº Filhos */}
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex gap-2 items-center flex-1 w-full">
                  <span className="font-bold whitespace-nowrap">Casa nº:</span>
                  <input
                    type="text"
                    className="flex-grow border-b border-black outline-none"
                    value={formData.casaNo || ""}
                    onChange={(e) =>
                      handleInputChange("casaNo", e.target.value)
                    }
                  />
                </div>
                <div className="flex gap-2 items-center flex-[1.5] w-full">
                  <span className="font-bold whitespace-nowrap">Telefone:</span>
                  <input
                    type="text"
                    className="flex-grow border-b border-black outline-none"
                    value={formData.telefone || ""}
                    onChange={(e) =>
                      handleInputChange("telefone", e.target.value)
                    }
                  />
                </div>
                <div className="flex gap-2 items-center flex-1 w-full">
                  <span className="font-bold whitespace-nowrap text-xs">
                    Nº Filhos:
                  </span>
                  <input
                    type="number"
                    className="flex-grow border-b border-black outline-none"
                    value={formData.totalFilhos || ""}
                    onChange={(e) =>
                      handleInputChange("totalFilhos", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-bold mb-2">Filhos menores</h3>
              <table className="w-full border-collapse border border-black table-fixed text-[9px]">
                <thead>
                  <tr>
                    <th className="border border-black p-1 w-[4%]">Nº</th>
                    <th className="border border-black p-1 w-[14%]">
                      Data Nasc.
                    </th>
                    <th className="border border-black p-1 w-[22%]">Nome</th>
                    <th className="border border-black p-1 w-[10%]">
                      Filho Nº
                    </th>
                    <th className="border border-black p-1 w-[4%]">Nº</th>
                    <th className="border border-black p-1 w-[14%]">
                      Data Nasc.
                    </th>
                    <th className="border border-black p-1 w-[22%]">Nome</th>
                    <th className="border border-black p-1 w-[10%]">
                      Filho Nº
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const numRows = Math.ceil(
                      formData.filhosMenores.length / 2,
                    );
                    return Array.from({ length: numRows }).map(
                      (_, rowIndex) => {
                        const idx1 = rowIndex;
                        const idx2 = rowIndex + numRows;
                        return (
                          <tr key={rowIndex}>
                            <td className="border border-black p-1 text-center font-bold">
                              {idx1 + 1}
                            </td>
                            <td className="border border-black p-0">
                              <input
                                type="date"
                                className="w-full p-1 outline-none"
                                value={
                                  formData.filhosMenores[idx1]
                                    ?.dataNascimento || ""
                                }
                                onChange={(e) =>
                                  handleTableChange(
                                    "filhosMenores",
                                    idx1,
                                    "dataNascimento",
                                    e.target.value,
                                  )
                                }
                              />
                            </td>
                            <td className="border border-black p-0">
                              <input
                                type="text"
                                className="w-full p-1 outline-none"
                                value={formData.filhosMenores[idx1]?.nome || ""}
                                onChange={(e) =>
                                  handleTableChange(
                                    "filhosMenores",
                                    idx1,
                                    "nome",
                                    e.target.value,
                                  )
                                }
                              />
                            </td>
                            <td className="border border-black p-0">
                              <div className="flex items-center">
                                <input
                                  type="text"
                                  className="w-full p-1 outline-none min-w-0 flex-grow"
                                  value={
                                    formData.filhosMenores[idx1]?.numeroFilho ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    handleTableChange(
                                      "filhosMenores",
                                      idx1,
                                      "numeroFilho",
                                      e.target.value,
                                    )
                                  }
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeRow("filhosMenores", idx1)
                                  }
                                  className="text-red-500 hover:text-red-700 px-1"
                                  title="Remover"
                                >
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            </td>

                            {idx2 < formData.filhosMenores.length ? (
                              <>
                                <td className="border border-black p-1 text-center font-bold">
                                  {idx2 + 1}
                                </td>
                                <td className="border border-black p-0">
                                  <input
                                    type="date"
                                    className="w-full p-1 outline-none"
                                    value={
                                      formData.filhosMenores[idx2]
                                        ?.dataNascimento || ""
                                    }
                                    onChange={(e) =>
                                      handleTableChange(
                                        "filhosMenores",
                                        idx2,
                                        "dataNascimento",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </td>
                                <td className="border border-black p-0">
                                  <input
                                    type="text"
                                    className="w-full p-1 outline-none"
                                    value={
                                      formData.filhosMenores[idx2]?.nome || ""
                                    }
                                    onChange={(e) =>
                                      handleTableChange(
                                        "filhosMenores",
                                        idx2,
                                        "nome",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </td>
                                <td className="border border-black p-0">
                                  <div className="flex items-center">
                                    <input
                                      type="text"
                                      className="w-full p-1 outline-none min-w-0 flex-grow"
                                      value={
                                        formData.filhosMenores[idx2]
                                          ?.numeroFilho || ""
                                      }
                                      onChange={(e) =>
                                        handleTableChange(
                                          "filhosMenores",
                                          idx2,
                                          "numeroFilho",
                                          e.target.value,
                                        )
                                      }
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeRow("filhosMenores", idx2)
                                      }
                                      className="text-red-500 hover:text-red-700 px-1"
                                      title="Remover"
                                    >
                                      <Trash2 size={10} />
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="border border-black p-1"></td>
                                <td className="border border-black p-1"></td>
                                <td className="border border-black p-1"></td>
                                <td className="border border-black p-1"></td>
                              </>
                            )}
                          </tr>
                        );
                      },
                    );
                  })()}
                  {formData.filhosMenores.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="border border-black p-4 text-center text-gray-400 italic"
                      >
                        Nenhum filho menor registado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => {
                    addRow("filhosMenores", {
                      dataNascimento: "",
                      nome: "",
                      numeroFilho: "",
                    });
                  }}
                  className="bg-blue-900 text-white px-4 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-blue-800 transition-colors"
                >
                  <Plus size={12} /> + filho
                </button>
              </div>
            </div>

            {/* ALOCAÇÃO INSTITUCIONAL */}
            <div className="border border-black rounded-[2rem] p-8 space-y-6 relative mt-10">
              <div className="absolute -top-3 left-6 bg-white px-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                <h3 className="text-[10px] font-black text-blue-900 tracking-[0.2em]">
                  Alocação Institucional
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                    Órgão
                  </label>
                  <select
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none bg-white font-medium h-11 text-sm"
                    value={formData.unidade || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        unidade: val,
                        direcao: "",
                        departamento: "",
                        reparticao: "",
                        seccao: "",
                        curso: "",
                        cursos: ["", "", "", ""],
                      }));
                    }}
                  >
                    <option value="">Selecione...</option>
                    {(() => {
                      // Usar as unidades do sistema para garantir compatibilidade com as direções mapeadas
                      const systemUnits = UNIDADES_ORGANICAS_SISTEMA.map(
                        (u) => u.nome,
                      );
                      const planUnits = unidadesNoPlano.filter(
                        (u) => !systemUnits.includes(u),
                      );

                      return (
                        <>
                          {UNIDADES_ORGANICAS_SISTEMA.map((u) => (
                            <option key={u.nome} value={u.nome}>
                              {u.nome}
                            </option>
                          ))}
                          {planUnits.sort().map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </>
                      );
                    })()}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                    Direção
                  </label>
                  <select
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none bg-white font-medium h-11 text-sm"
                    value={formData.direcao || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        direcao: val,
                        departamento: "",
                        reparticao: "",
                        seccao: "",
                        curso: "",
                        cursos: ["", "", "", ""],
                      }));
                    }}
                    disabled={!formData.unidade}
                  >
                    <option value="">Selecione...</option>
                    {UNIDADES_ORGANICAS_SISTEMA.find(
                      (u) => u.nome === formData.unidade,
                    )?.direcoes.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                    Departamento
                  </label>
                  <select
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none bg-white font-medium h-11 text-sm"
                    value={formData.departamento || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        departamento: val,
                        reparticao: "",
                        seccao: "",
                        curso: "",
                        cursos: ["", "", "", ""],
                      }));
                    }}
                    disabled={!formData.direcao}
                  >
                    <option value="">Selecione...</option>
                    {(
                      DEPARTAMENTOS[
                        formData.direcao as keyof typeof DEPARTAMENTOS
                      ] ||
                      DEPARTAMENTOS[
                        formData.direcao as keyof typeof DEPARTAMENTOS
                      ] ||
                      []
                    )?.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.departamento &&
              [
                "Departamento de Engenharia Eletrotécnica",
                "Departamento de Engenharia de Construção Civil",
                "Departamento de Engenharia de Construção Mecânica",
              ].includes(formData.departamento) ? (
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-blue-900 tracking-widest ">
                    Afetação por Curso (Até 4)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {[0, 1, 2, 3].map((idx) => (
                      <div key={idx}>
                        <label className="block text-[9px] font-bold text-gray-500 mb-1  tracking-tight">
                          Curso {idx + 1}
                        </label>
                        <select
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none bg-white font-medium h-11 text-sm"
                          value={formData.cursos[idx] || ""}
                          onChange={(e) => {
                            const newCursos = [...formData.cursos];
                            newCursos[idx] = e.target.value;
                            handleInputChange("cursos", newCursos);
                            if (idx === 0)
                              handleInputChange("curso", e.target.value);
                          }}
                        >
                          <option value="">Selecione...</option>
                          {CURSOS[
                            formData.departamento as keyof typeof CURSOS
                          ]?.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                      Repartição / Secção
                    </label>
                    <select
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none bg-white font-medium h-11 text-sm"
                      value={formData.reparticao || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          reparticao: val,
                          seccao: "",
                        }));
                      }}
                      disabled={!formData.departamento}
                    >
                      <option value="">Selecione...</option>
                      {(
                        REPARTICOES[
                          formData.departamento as keyof typeof REPARTICOES
                        ] || []
                      )?.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1 tracking-tight">
                      Secção
                    </label>
                    <select
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none bg-white font-medium h-11 text-sm"
                      value={formData.seccao || ""}
                      onChange={(e) =>
                        handleInputChange("seccao", e.target.value)
                      }
                      disabled={!formData.reparticao}
                    >
                      <option value="">Selecione...</option>
                      {(
                        SETORES[
                          formData.reparticao as keyof typeof SETORES
                        ] || []
                      )?.map((s) => (
                        <option key={s + "-" + Math.random()} value={s}>
                          {s}
                        </option>
                      ))}
                      {!SETORES[
                        formData.reparticao as keyof typeof SETORES
                      ] && (
                        <>
                          <option value="Serviços Gerais">
                            Serviços Gerais
                          </option>
                          <option value="Administrativo">Administrativo</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {formData.tipoColaborador === "Docente" && (
              <div className="mt-6 bg-blue-50/30 p-4 rounded-xl border border-blue-100">
                <h3 className="font-bold text-xs text-blue-900 mb-3  tracking-wider">
                  Disciplinas Leccionadas (Até 4)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[0, 1, 2, 3].map((idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span className="text-[10px] font-bold text-gray-500 w-4">
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        list="disciplinas-sugestoes"
                        className="flex-grow border-b border-blue-200 outline-none bg-transparent py-1 text-xs"
                        placeholder={`Disciplina ${idx + 1}`}
                        value={formData.disciplinas[idx] || ""}
                        onChange={(e) => {
                          const newDisc = [...formData.disciplinas];
                          newDisc[idx] = e.target.value;
                          handleInputChange("disciplinas", newDisc);
                        }}
                      />
                      <datalist id="disciplinas-sugestoes">
                        <option value="Matemática" />
                        <option value="Física" />
                        <option value="Programação I" />
                        <option value="Programação II" />
                        <option value="Base de Dados" />
                        <option value="Engenharia de Software" />
                        <option value="Redes de Computadores" />
                        <option value="Sistemas Operativos" />
                        <option value="Análise de Sistemas" />
                        <option value="Gestão de Projetos" />
                      </datalist>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex gap-2">
                <span className="font-bold whitespace-nowrap">
                  Tipo Colaborador:
                </span>
                <select
                  className="flex-grow border-b border-black outline-none bg-transparent font-medium"
                  value={formData.tipoColaborador || "Docente"}
                  onChange={(e) =>
                    handleInputChange("tipoColaborador", e.target.value)
                  }
                >
                  <option value="Docente">Docente</option>
                  <option value="CTA">CTA</option>
                </select>
              </div>
              <div className="flex gap-2">
                <span className="font-bold whitespace-nowrap">
                  Tipo de Contrato:
                </span>
                <select
                  className="flex-grow border-b border-black outline-none bg-transparent font-medium"
                  value={formData.tipoContrato || "Efetivo"}
                  onChange={(e) =>
                    handleInputChange("tipoContrato", e.target.value)
                  }
                >
                  <option value="Efetivo">Efetivo</option>
                  <option value="Parcial">Parcial</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex gap-2">
                <span className="font-bold whitespace-nowrap">
                  Relação Contratual:
                </span>
                <select
                  className="flex-grow border-b border-black outline-none bg-transparent font-medium"
                  value={formData.tipoRelacaoContractual || "Quadro"}
                  onChange={(e) =>
                    handleInputChange("tipoRelacaoContractual", e.target.value)
                  }
                >
                  <option value="Quadro">Quadro</option>
                  <option value="Fora do Quadro">Fora do Quadro</option>
                </select>
              </div>
              <div className="flex gap-2">
                <span className="font-bold whitespace-nowrap">
                  Cargo de Chefia:
                </span>
                <SearchableSelect
                  className="flex-grow"
                  options={LISTA_CARGOS_CHEFIA}
                  value={formData.cargoChefia || "Nenhum"}
                  onChange={(val) => handleInputChange("cargoChefia", val)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div
                className={`flex gap-2 p-1 rounded-md transition-all ${validationErrors.vinculoContractual ? "border-2 border-red-500 ring-2 ring-red-100 bg-red-50/50" : "border border-transparent"}`}
              >
                <span className="font-bold whitespace-nowrap">
                  Vínculo Contratual:
                </span>
                <select
                  className="flex-grow border-b border-black outline-none bg-transparent font-medium"
                  value={formData.vinculoContractual || ""}
                  onChange={(e) => {
                    handleInputChange("vinculoContractual", e.target.value);
                    if (validationErrors.vinculoContractual)
                      setValidationErrors((prev) => ({
                        ...prev,
                        vinculoContractual: "",
                      }));
                  }}
                >
                  <option value="">Selecione...</option>
                  <option value="Pertence ao quadro">Pertence ao quadro</option>
                  <option value="Não pertence ao quadro">
                    Não pertence ao quadro
                  </option>
                  {formData.vinculoContractual &&
                    ![
                      "",
                      "Pertence ao quadro",
                      "Não pertence ao quadro",
                    ].includes(formData.vinculoContractual) && (
                      <option value={formData.vinculoContractual}>
                        {formData.vinculoContractual}
                      </option>
                    )}
                </select>
              </div>
              <div
                className={`flex gap-2 p-1 rounded-md transition-all ${validationErrors.cargo ? "border-2 border-red-500 ring-2 ring-red-100 bg-red-50/50" : "border border-transparent"}`}
              >
                <span className="font-bold whitespace-nowrap">Cargo:</span>
                <input
                  type="text"
                  className="flex-grow border-b border-black outline-none bg-transparent font-medium"
                  value={formData.cargo || ""}
                  onChange={(e) => {
                    handleInputChange("cargo", e.target.value);
                    if (validationErrors.cargo)
                      setValidationErrors((prev) => ({ ...prev, cargo: "" }));
                  }}
                  placeholder="Digite o cargo profissional"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div
                className={`flex gap-2 p-1 rounded-md transition-all ${validationErrors.estadoMandato ? "border-2 border-red-500 ring-2 ring-red-100 bg-red-50/50" : "border border-transparent"}`}
              >
                <span className="font-bold whitespace-nowrap">
                  Estado do Mandato:
                </span>
                <select
                  className="flex-grow border-b border-black outline-none bg-transparent font-medium"
                  value={formData.estadoMandato || "Em Actividade"}
                  onChange={(e) => {
                    handleInputChange("estadoMandato", e.target.value);
                    if (validationErrors.estadoMandato)
                      setValidationErrors((prev) => ({
                        ...prev,
                        estadoMandato: "",
                      }));
                  }}
                >
                  <option value="Em Actividade">Em Actividade</option>
                  <option value="Cessado">Cessado</option>
                  <option value="Despromovido">Despromovido</option>
                </select>
              </div>
            </div>

            {/* 4 CAMPOS DE SETORES DE TRABALHO PARA TÉCNICO DO SETOR */}
            {(formData.cargoChefia === "Técnico do Setor" ||
              formData.cargo === "Técnico do Setor" ||
              (formData.cargoChefia || "").toLowerCase().includes("tecnico do setor") ||
              (formData.cargoChefia || "").toLowerCase().includes("técnico do setor") ||
              (formData.cargo || "").toLowerCase().includes("tecnico do setor") ||
              (formData.cargo || "").toLowerCase().includes("técnico do setor") ||
              (formData.cargoChefia || "").toLowerCase().includes("tecnico do sector") ||
              (formData.cargoChefia || "").toLowerCase().includes("técnico do sector") ||
              (formData.cargo || "").toLowerCase().includes("tecnico do sector") ||
              (formData.cargo || "").toLowerCase().includes("técnico do sector")) && (
              <div className="mt-4 p-3 bg-slate-50 border border-slate-300 rounded-md">
                <div className="flex justify-between items-center mb-2 border-b border-slate-200 pb-1">
                  <span className="font-bold text-xs  text-blue-900">
                    Setores de Trabalho do Técnico (Até 4):
                  </span>
                  <span className="text-[10px] text-slate-600 font-medium">
                    Departamento: <strong>{formData.departamento || "Não selecionado"}</strong>
                  </span>
                </div>
                {(() => {
                  const deptSectors = getSetoresByDepartamento(formData.departamento);
                  const currentSectors = formData.setoresAtribuidos || [
                    formData.sector || "",
                    "",
                    "",
                    "",
                  ];

                  const handleSectorChange = (idx: number, val: string) => {
                    const updated = [...currentSectors];
                    while (updated.length < 4) updated.push("");
                    updated[idx] = val;
                    handleInputChange("setoresAtribuidos", updated);
                    if (idx === 0 || !formData.sector) {
                      handleInputChange("sector", updated[0] || "");
                    }
                  };

                  return (
                    <div className="grid grid-cols-2 gap-3">
                      {[0, 1, 2, 3].map((idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                            Setor {idx + 1}:
                          </span>
                          <input
                            type="text"
                            list={`ip-dept-sectors-${idx}`}
                            className="flex-grow border-b border-black outline-none bg-transparent text-xs py-0.5"
                            placeholder={
                              deptSectors.length > 0
                                ? `Selecione ou digite o setor ${idx + 1}...`
                                : `Setor ${idx + 1}...`
                            }
                            value={currentSectors[idx] || ""}
                            onChange={(e) => handleSectorChange(idx, e.target.value)}
                          />
                          <datalist id={`ip-dept-sectors-${idx}`}>
                            {deptSectors.map((s, sIdx) => (
                              <option key={`${s}-${sIdx}`} value={s}>
                                {s}
                              </option>
                            ))}
                          </datalist>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="flex gap-2 items-center">
                <span className="font-bold whitespace-nowrap">
                  Ano de Ingresso:
                </span>
                <input
                  type="number"
                  min="1950"
                  max="2099"
                  placeholder="Ex: 2026"
                  className="w-full border-b border-black outline-none font-bold text-blue-900 text-sm bg-transparent"
                  value={formData.anoIngresso || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleInputChange("anoIngresso", val);
                    if (val && val.length === 4) {
                      const seqIndex = getNextProcessSequence(
                        colaboradores,
                        [],
                      );
                      handleInputChange(
                        "processoNo",
                        formatProcessNumber(seqIndex, val),
                      );
                    }
                  }}
                />
              </div>
              <div className="flex gap-2 items-center">
                <span className="font-bold whitespace-nowrap">
                  Data de Admissão:
                </span>
                <input
                  type="date"
                  className="flex-grow border-b border-black outline-none"
                  value={formData.dataAdmissao || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleInputChange("dataAdmissao", val);
                    if (val) {
                      const year = val.substring(0, 4);
                      if (year) {
                        handleInputChange("anoIngresso", year);
                        const seqIndex = getNextProcessSequence(
                          colaboradores,
                          [],
                        );
                        handleInputChange(
                          "processoNo",
                          formatProcessNumber(seqIndex, year),
                        );
                      }
                    }
                  }}
                />
              </div>
              <div className="flex gap-2 items-center">
                <span className="font-bold whitespace-nowrap">Categoria:</span>
                <SearchableSelect
                  className="flex-grow"
                  options={
                    formData.carreira === "Docente"
                      ? CATEGORIAS_DOCENTES
                      : formData.carreira === "CTA"
                        ? CATEGORIAS_CTAA
                        : CATEGORIAS_FUNCIONARIOS
                  }
                  value={formData.categoria || ""}
                  onChange={(val) => {
                    handleInputChange("categoria", val);
                    let resolvedRes = formData.carreira;
                    if (CATEGORIAS_DOCENTES.includes(val) && val !== "Assistente") {
                      resolvedRes = "Docente";
                    } else if (["Técnico Superior", "Técnico Profissional", "Técnico"].includes(val)) {
                      resolvedRes = "CTA";
                    } else if (val === "Assistente" && !resolvedRes) {
                      resolvedRes = "Docente";
                    } else {
                      resolvedRes = classifyTipo({ categoria: val, carreira: formData.carreira });
                    }
                    handleInputChange("carreira", resolvedRes);
                    handleInputChange("tipoColaborador", resolvedRes);
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex gap-2">
                <span className="font-bold whitespace-nowrap">Carreira:</span>
                <select
                  className="flex-grow border-b border-black outline-none bg-transparent font-medium"
                  value={formData.carreira || ""}
                  onChange={(e) =>
                    handleInputChange("carreira", e.target.value)
                  }
                >
                  <option value="">Selecione...</option>
                  <option value="Docente">Docente</option>
                  <option value="CTA">CTA</option>
                  <option value="Investigador">Investigador</option>
                </select>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-center font-bold mb-2">
                EVOLUÇÃO DE HABILITAÇÕES PROFISSIONAIS
              </h3>
              <table className="w-full border-collapse border border-black">
                <thead>
                  <tr>
                    <th className="border border-black p-1 w-10">Nº</th>
                    <th className="border border-black p-1 w-32">Data</th>
                    <th className="border border-black p-1">Descrição</th>
                    {formData.evolucaoHabilitacoesProfissionais.length > 0 && (
                      <th className="border border-black p-1 w-12 text-center">
                        Excluir
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {formData.evolucaoHabilitacoesProfissionais.map(
                    (item, idx) => (
                      <tr key={idx}>
                        <td className="border border-black p-1 text-center font-bold">
                          {idx + 1}
                        </td>
                        <td className="border border-black p-0">
                          <input
                            type="date"
                            className="w-full p-1 outline-none"
                            value={item.data}
                            onChange={(e) =>
                              handleTableChange(
                                "evolucaoHabilitacoesProfissionais",
                                idx,
                                "data",
                                e.target.value,
                              )
                            }
                          />
                        </td>
                        <td className="border border-black p-0">
                          <SearchableSelect
                            options={HABILITACOES_PROFISSIONAIS_LIST}
                            value={item.descricao}
                            onChange={(val) =>
                              handleTableChange(
                                "evolucaoHabilitacoesProfissionais",
                                idx,
                                "descricao",
                                val,
                              )
                            }
                            className="w-full text-xs"
                            placeholder="Selecionar..."
                          />
                        </td>
                        <td className="border border-black p-1 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              removeRow(
                                "evolucaoHabilitacoesProfissionais",
                                idx,
                              )
                            }
                            className="text-red-600 hover:text-red-800 transition-colors p-1"
                            title="Remover linha"
                          >
                            <Trash2 size={12} className="mx-auto" />
                          </button>
                        </td>
                      </tr>
                    ),
                  )}
                  {formData.evolucaoHabilitacoesProfissionais.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="border border-black p-4 text-center text-gray-400 italic"
                      >
                        Nenhum registo de habilitação profissional.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() =>
                    addRow("evolucaoHabilitacoesProfissionais", {
                      data: "",
                      descricao: "",
                    })
                  }
                  className="bg-blue-900 text-white px-4 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-blue-800 transition-colors"
                >
                  <Plus size={12} /> + linha
                </button>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-center font-bold mb-2">
                EVOLUÇÃO DE HABILITAÇÕES LITERÁRIAS
              </h3>
              <table className="w-full border-collapse border border-black">
                <thead>
                  <tr>
                    <th className="border border-black p-1 w-10">Nº</th>
                    <th className="border border-black p-1 w-32">Data</th>
                    <th className="border border-black p-1">Descrição</th>
                    <th className="border border-black p-1">Instituição</th>
                    {formData.evolucaoHabilitacoesLiterarias.length > 0 && (
                      <th className="border border-black p-1 w-12 text-center">
                        Excluir
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {formData.evolucaoHabilitacoesLiterarias.map((item, idx) => (
                    <tr key={idx}>
                      <td className="border border-black p-1 text-center font-bold">
                        {idx + 1}
                      </td>
                      <td className="border border-black p-0">
                        <input
                          type="date"
                          className="w-full p-1 outline-none"
                          value={item.data}
                          onChange={(e) =>
                            handleTableChange(
                              "evolucaoHabilitacoesLiterarias",
                              idx,
                              "data",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="border border-black p-0">
                        <input
                          type="text"
                          className="w-full p-1 outline-none"
                          value={item.descricao}
                          onChange={(e) =>
                            handleTableChange(
                              "evolucaoHabilitacoesLiterarias",
                              idx,
                              "descricao",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="border border-black p-0">
                        <input
                          type="text"
                          className="w-full p-1 outline-none"
                          value={item.instituicao}
                          onChange={(e) =>
                            handleTableChange(
                              "evolucaoHabilitacoesLiterarias",
                              idx,
                              "instituicao",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="border border-black p-1 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            removeRow("evolucaoHabilitacoesLiterarias", idx)
                          }
                          className="text-red-600 hover:text-red-800 transition-colors p-1"
                          title="Remover linha"
                        >
                          <Trash2 size={12} className="mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {formData.evolucaoHabilitacoesLiterarias.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="border border-black p-4 text-center text-gray-400 italic"
                      >
                        Nenhum registo de habilitação literária.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() =>
                    addRow("evolucaoHabilitacoesLiterarias", {
                      data: "",
                      descricao: "",
                      instituicao: "",
                    })
                  }
                  className="bg-blue-900 text-white px-4 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-blue-800 transition-colors"
                >
                  <Plus size={12} /> + linha
                </button>
              </div>
            </div>
            {showImportModal && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white p-6 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col shadow-2xl border border-blue-100">
                  <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-blue-800">
                    <User size={20} />
                    Importar do Efetivo Geral
                  </h3>
                  <p className="text-xs text-gray-500 mb-4 font-medium tracking-wider">
                    Pesquise por NUIT ou Nome para preencher automaticamente
                  </p>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      placeholder="Pesquisar por NUIT ou Nome"
                      className="flex-1 p-2 border border-black rounded"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    />
                    <button
                      onClick={() => handleSearch()}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    >
                      <Search size={18} />
                    </button>
                  </div>

                  <div className="flex-grow overflow-y-auto space-y-2 mb-4">
                    {searchResults.length > 0
                      ? searchResults.map((col) => {
                          const isQuadro = col.efetivo;
                          const labelQuadro = isQuadro
                            ? "(Quadro)"
                            : "(Fora do Quadro)";
                          return (
                            <button
                              key={col.id || col.nuit}
                              onClick={() => selectColaborador(col)}
                              className="w-full text-left p-3 rounded border border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                            >
                              <div className="font-bold text-sm group-hover:text-blue-700">
                                {col.nome}
                              </div>
                              <div className="text-[10px] text-gray-500 flex justify-between">
                                <span>NUIT: {col.nuit}</span>
                                <span>
                                  {col.tipo} {labelQuadro} - {col.categoria}
                                </span>
                              </div>
                              <div className="text-[10px] text-gray-400 mt-1">
                                Relação: {col.tipoRelacaoContractual || "-"}
                              </div>
                            </button>
                          );
                        })
                      : searchTerm.trim() &&
                        !searchResults.length && (
                          <div className="text-center py-8 text-gray-400 text-sm italic">
                            Clique na lupa para pesquisar
                          </div>
                        )}
                  </div>

                  <div className="flex gap-2 mt-auto pt-4 border-t">
                    <button
                      onClick={() => {
                        setShowImportModal(false);
                        setSearchTerm("");
                        setSearchResults([]);
                      }}
                      className="flex-1 py-2 border rounded hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 3:
        return (
          <div className="space-y-8 text-[10px]">
            <div>
              <h3 className="text-center font-bold mb-2">
                Variações De Categorias E Vencimentos
              </h3>
              <table className="w-full border-collapse border border-black">
                <thead>
                  <tr>
                    <th className="border border-black p-1">Data</th>
                    <th className="border border-black p-1">Categoria</th>
                    <th className="border border-black p-1">Vencimento</th>
                    <th className="border border-black p-1">Data</th>
                    <th className="border border-black p-1">Categoria</th>
                    <th className="border border-black p-1">Vencimento</th>
                    {formData.variacoesCategoriasVencimentos.length > 0 && (
                      <th className="border border-black p-1 w-12 text-center">
                        Excluir
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {formData.variacoesCategoriasVencimentos.map((item, idx) => (
                    <tr key={idx}>
                      <td className="border border-black p-0">
                        <input
                          type="date"
                          className="w-full p-1 outline-none"
                          value={item.data}
                          onChange={(e) =>
                            handleTableChange(
                              "variacoesCategoriasVencimentos",
                              idx,
                              "data",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="border border-black p-0">
                        <input
                          type="text"
                          className="w-full p-1 outline-none"
                          value={item.categoria}
                          onChange={(e) =>
                            handleTableChange(
                              "variacoesCategoriasVencimentos",
                              idx,
                              "categoria",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="border border-black p-0">
                        <input
                          type="text"
                          className="w-full p-1 outline-none"
                          value={item.vencimento}
                          onChange={(e) =>
                            handleTableChange(
                              "variacoesCategoriasVencimentos",
                              idx,
                              "vencimento",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="border border-black p-0">
                        <input
                          type="date"
                          className="w-full p-1 outline-none"
                          value={item.data2}
                          onChange={(e) =>
                            handleTableChange(
                              "variacoesCategoriasVencimentos",
                              idx,
                              "data2",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="border border-black p-0">
                        <input
                          type="text"
                          className="w-full p-1 outline-none"
                          value={item.categoria2}
                          onChange={(e) =>
                            handleTableChange(
                              "variacoesCategoriasVencimentos",
                              idx,
                              "categoria2",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="border border-black p-0">
                        <input
                          type="text"
                          className="w-full p-1 outline-none"
                          value={item.vencimento2}
                          onChange={(e) =>
                            handleTableChange(
                              "variacoesCategoriasVencimentos",
                              idx,
                              "vencimento2",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="border border-black p-1 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            removeRow("variacoesCategoriasVencimentos", idx)
                          }
                          className="text-red-600 hover:text-red-800 transition-colors p-1"
                          title="Remover linha"
                        >
                          <Trash2 size={12} className="mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {formData.variacoesCategoriasVencimentos.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="border border-black p-4 text-center text-gray-400 italic"
                      >
                        Nenhum registo de variação de categoria e vencimento.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() =>
                    addRow("variacoesCategoriasVencimentos", {
                      data: "",
                      categoria: "",
                      vencimento: "",
                      data2: "",
                      categoria2: "",
                      vencimento2: "",
                    })
                  }
                  className="bg-blue-900 text-white px-4 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-blue-800 transition-colors"
                >
                  <Plus size={12} /> + linha
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-center font-bold mb-2">
                Movimento De Férias
              </h3>
              <table className="w-full border-collapse border border-black table-fixed text-[8px]">
                <thead>
                  <tr>
                    <th rowSpan={2} className="border border-black p-1 w-[15%]">
                      Período de
                    </th>
                    <th rowSpan={2} className="border border-black p-1 w-[8%]">
                      Dias
                    </th>
                    <th colSpan={2} className="border border-black p-1">
                      Faltas Ao Serviço
                    </th>
                    <th rowSpan={2} className="border border-black p-1 w-[8%]">
                      Dias a gozar
                    </th>
                    <th colSpan={2} className="border border-black p-1">
                      Gozo De Férias
                    </th>
                    <th rowSpan={2} className="border border-black p-1 w-[10%]">
                      Rubrica
                    </th>
                    {formData.movimentoFerias.length > 0 && (
                      <th
                        rowSpan={2}
                        className="border border-black p-1 w-[8%] text-center"
                      >
                        Excluir
                      </th>
                    )}
                  </tr>
                  <tr>
                    <th className="border border-black p-1">Just.</th>
                    <th className="border border-black p-1">Não Just.</th>
                    <th className="border border-black p-1">Início</th>
                    <th className="border border-black p-1">Término</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.movimentoFerias.map((item, idx) => (
                    <tr key={idx}>
                      <td className="border border-black p-0">
                        <input
                          type="text"
                          className="w-full p-1 outline-none"
                          value={item.periodo}
                          onChange={(e) =>
                            handleTableChange(
                              "movimentoFerias",
                              idx,
                              "periodo",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="border border-black p-0">
                        <input
                          type="text"
                          className="w-full p-1 outline-none"
                          value={item.dias}
                          onChange={(e) =>
                            handleTableChange(
                              "movimentoFerias",
                              idx,
                              "dias",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="border border-black p-0">
                        <input
                          type="text"
                          className="w-full p-1 outline-none text-gray-400"
                          disabled
                          placeholder="---"
                        />
                      </td>
                      <td className="border border-black p-0">
                        <input
                          type="text"
                          className="w-full p-1 outline-none text-gray-400"
                          disabled
                          placeholder="---"
                        />
                      </td>
                      <td className="border border-black p-0">
                        <input
                          type="text"
                          className="w-full p-1 outline-none"
                          value={item.diasGozar}
                          onChange={(e) =>
                            handleTableChange(
                              "movimentoFerias",
                              idx,
                              "diasGozar",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="border border-black p-0">
                        <input
                          type="date"
                          className="w-full p-1 outline-none"
                          value={item.inicio}
                          onChange={(e) =>
                            handleTableChange(
                              "movimentoFerias",
                              idx,
                              "inicio",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="border border-black p-0">
                        <input
                          type="date"
                          className="w-full p-1 outline-none"
                          value={item.termino}
                          onChange={(e) =>
                            handleTableChange(
                              "movimentoFerias",
                              idx,
                              "termino",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="border border-black p-0">
                        <input
                          type="text"
                          className="w-full p-1 outline-none"
                          value={item.rubrica}
                          onChange={(e) =>
                            handleTableChange(
                              "movimentoFerias",
                              idx,
                              "rubrica",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="border border-black p-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeRow("movimentoFerias", idx)}
                          className="text-red-600 hover:text-red-800 transition-colors p-1"
                          title="Remover linha"
                        >
                          <Trash2 size={12} className="mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {formData.movimentoFerias.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="border border-black p-4 text-center text-gray-400 italic"
                      >
                        Nenhum registo de férias.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() =>
                    addRow("movimentoFerias", {
                      periodo: "",
                      dias: "",
                      diasGozar: "",
                      inicio: "",
                      termino: "",
                      rubrica: "",
                    })
                  }
                  className="bg-blue-900 text-white px-4 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-blue-800 transition-colors"
                >
                  <Plus size={12} /> + linha
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-center font-bold mb-2">Faltas Anuais</h3>
              <table className="w-full border-collapse border border-black">
                <thead>
                  <tr>
                    <th className="border border-black p-1">Data</th>
                    <th className="border border-black p-1">Categoria</th>
                    <th className="border border-black p-1">Vencimento</th>
                    <th className="border border-black p-1">Data</th>
                    <th className="border border-black p-1">Categoria</th>
                    <th className="border border-black p-1">Vencimento</th>
                    {formData.faltasAnuais.length > 0 && (
                      <th className="border border-black p-1 w-12 text-center">
                        Excluir
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {formData.faltasAnuais.map((item, idx) => (
                    <tr key={idx}>
                      <td className="border border-black p-0">
                        <input
                          type="date"
                          className="w-full p-1 outline-none"
                          value={item.data}
                          onChange={(e) =>
                            handleTableChange(
                              "faltasAnuais",
                              idx,
                              "data",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="border border-black p-0">
                        <input
                          type="text"
                          className="w-full p-1 outline-none"
                          value={item.categoria}
                          onChange={(e) =>
                            handleTableChange(
                              "faltasAnuais",
                              idx,
                              "categoria",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="border border-black p-0">
                        <input
                          type="text"
                          className="w-full p-1 outline-none"
                          value={item.vencimento}
                          onChange={(e) =>
                            handleTableChange(
                              "faltasAnuais",
                              idx,
                              "vencimento",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="border border-black p-0">
                        <input
                          type="date"
                          className="w-full p-1 outline-none"
                          value={item.data2}
                          onChange={(e) =>
                            handleTableChange(
                              "faltasAnuais",
                              idx,
                              "data2",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="border border-black p-0">
                        <input
                          type="text"
                          className="w-full p-1 outline-none"
                          value={item.categoria2}
                          onChange={(e) =>
                            handleTableChange(
                              "faltasAnuais",
                              idx,
                              "categoria2",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="border border-black p-0">
                        <input
                          type="text"
                          className="w-full p-1 outline-none"
                          value={item.vencimento2}
                          onChange={(e) =>
                            handleTableChange(
                              "faltasAnuais",
                              idx,
                              "vencimento2",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="border border-black p-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeRow("faltasAnuais", idx)}
                          className="text-red-600 hover:text-red-800 transition-colors p-1"
                          title="Remover linha"
                        >
                          <Trash2 size={12} className="mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {formData.faltasAnuais.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="border border-black p-4 text-center text-gray-400 italic"
                      >
                        Nenhum registo de falta anual.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() =>
                    addRow("faltasAnuais", {
                      data: "",
                      categoria: "",
                      vencimento: "",
                      data2: "",
                      categoria2: "",
                      vencimento2: "",
                    })
                  }
                  className="bg-blue-900 text-white px-4 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-blue-800 transition-colors"
                >
                  <Plus size={12} /> + linha
                </button>
              </div>
            </div>

            <div>
              <span className="font-bold">Observações:</span>
              <textarea
                className="w-full border border-black mt-2 p-2 h-32 outline-none"
                value={formData.observacoesPag3 || ""}
                onChange={(e) =>
                  handleInputChange("observacoesPag3", e.target.value)
                }
              ></textarea>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-8 text-[10px]">
            <div className="grid grid-cols-1 gap-8">
              <div>
                <h3 className="text-center font-bold mb-2">Punições</h3>
                <table className="w-full border-collapse border border-black">
                  <thead>
                    <tr>
                      <th className="border border-black p-1 w-24">Data</th>
                      <th className="border border-black p-1">Descrição</th>
                      {formData.punicoes.length > 0 && (
                        <th className="border border-black p-1 w-12 text-center">
                          Excluir
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {formData.punicoes.map((item, idx) => (
                      <tr key={idx}>
                        <td className="border border-black p-0">
                          <input
                            type="date"
                            className="w-full p-1 outline-none"
                            value={item.data}
                            onChange={(e) =>
                              handleTableChange(
                                "punicoes",
                                idx,
                                "data",
                                e.target.value,
                              )
                            }
                          />
                        </td>
                        <td className="border border-black p-0">
                          <input
                            type="text"
                            className="w-full p-1 outline-none"
                            value={item.descricao}
                            onChange={(e) =>
                              handleTableChange(
                                "punicoes",
                                idx,
                                "descricao",
                                e.target.value,
                              )
                            }
                          />
                        </td>
                        <td className="border border-black p-1 text-center">
                          <button
                            type="button"
                            onClick={() => removeRow("punicoes", idx)}
                            className="text-red-600 hover:text-red-800 transition-colors p-1"
                            title="Remover linha"
                          >
                            <Trash2 size={12} className="mx-auto" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {formData.punicoes.length === 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="border border-black p-4 text-center text-gray-400 italic"
                        >
                          Nenhum registo de punição.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() =>
                      addRow("punicoes", { data: "", descricao: "" })
                    }
                    className="bg-blue-900 text-white px-4 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-blue-800 transition-colors"
                  >
                    <Plus size={12} /> + linha
                  </button>
                </div>
              </div>
              <div>
                <h3 className="text-center font-bold mb-2 leading-tight">
                  Descontos Anuais
                  <br />
                  <span className="text-[8px]">
                    (por punições, faltas ou acumulação de atrasos)
                  </span>
                </h3>
                <table className="w-full border-collapse border border-black">
                  <thead>
                    <tr>
                      <th className="border border-black p-1">Data</th>
                      <th className="border border-black p-1">Descrição</th>
                      <th className="border border-black p-1">Ano</th>
                      <th className="border border-black p-1">Descrição</th>
                      {formData.descontosAnuais.length > 0 && (
                        <th className="border border-black p-1 w-12 text-center">
                          Excluir
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {formData.descontosAnuais.map((item, idx) => (
                      <tr key={idx}>
                        <td className="border border-black p-0">
                          <input
                            type="date"
                            className="w-full p-1 outline-none"
                            value={item.data}
                            onChange={(e) =>
                              handleTableChange(
                                "descontosAnuais",
                                idx,
                                "data",
                                e.target.value,
                              )
                            }
                          />
                        </td>
                        <td className="border border-black p-0">
                          <input
                            type="text"
                            className="w-full p-1 outline-none"
                            value={item.descricao}
                            onChange={(e) =>
                              handleTableChange(
                                "descontosAnuais",
                                idx,
                                "descricao",
                                e.target.value,
                              )
                            }
                          />
                        </td>
                        <td className="border border-black p-0">
                          <input
                            type="number"
                            min="1900"
                            max="2100"
                            className="w-full p-1 outline-none"
                            value={item.ano}
                            onChange={(e) =>
                              handleTableChange(
                                "descontosAnuais",
                                idx,
                                "ano",
                                e.target.value,
                              )
                            }
                          />
                        </td>
                        <td className="border border-black p-0">
                          <input
                            type="text"
                            className="w-full p-1 outline-none"
                            value={item.descricao2}
                            onChange={(e) =>
                              handleTableChange(
                                "descontosAnuais",
                                idx,
                                "descricao2",
                                e.target.value,
                              )
                            }
                          />
                        </td>
                        <td className="border border-black p-1 text-center">
                          <button
                            type="button"
                            onClick={() => removeRow("descontosAnuais", idx)}
                            className="text-red-600 hover:text-red-800 transition-colors p-1"
                            title="Remover linha"
                          >
                            <Trash2 size={12} className="mx-auto" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {formData.descontosAnuais.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="border border-black p-4 text-center text-gray-400 italic"
                        >
                          Nenhum registo de desconto anual.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() =>
                      addRow("descontosAnuais", {
                        data: "",
                        descricao: "",
                        ano: "",
                        descricao2: "",
                      })
                    }
                    className="bg-blue-900 text-white px-4 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-blue-800 transition-colors"
                  >
                    <Plus size={12} /> + linha
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
              <div>
                <h3 className="text-center font-bold mb-2">Louvores</h3>
                <table className="w-full border-collapse border border-black">
                  <thead>
                    <tr>
                      <th className="border border-black p-1 w-24">Data</th>
                      <th className="border border-black p-1">Descrição</th>
                      {formData.louvores.length > 0 && (
                        <th className="border border-black p-1 w-12 text-center">
                          Excluir
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {formData.louvores.map((item, idx) => (
                      <tr key={idx}>
                        <td className="border border-black p-0">
                          <input
                            type="date"
                            className="w-full p-1 outline-none"
                            value={item.data}
                            onChange={(e) =>
                              handleTableChange(
                                "louvores",
                                idx,
                                "data",
                                e.target.value,
                              )
                            }
                          />
                        </td>
                        <td className="border border-black p-0">
                          <input
                            type="text"
                            className="w-full p-1 outline-none"
                            value={item.descricao}
                            onChange={(e) =>
                              handleTableChange(
                                "louvores",
                                idx,
                                "descricao",
                                e.target.value,
                              )
                            }
                          />
                        </td>
                        <td className="border border-black p-1 text-center">
                          <button
                            type="button"
                            onClick={() => removeRow("louvores", idx)}
                            className="text-red-600 hover:text-red-800 transition-colors p-1"
                            title="Remover linha"
                          >
                            <Trash2 size={12} className="mx-auto" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {formData.louvores.length === 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="border border-black p-4 text-center text-gray-400 italic"
                        >
                          Nenhum registo de louvor.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() =>
                      addRow("louvores", { data: "", descricao: "" })
                    }
                    className="bg-blue-900 text-white px-4 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-blue-800 transition-colors"
                  >
                    <Plus size={12} /> + linha
                  </button>
                </div>
              </div>
              <div>
                <h3 className="text-center font-bold mb-2">Gratificações</h3>
                <table className="w-full border-collapse border border-black table-fixed text-[9px]">
                  <thead>
                    <tr>
                      <th
                        rowSpan={2}
                        className="border border-black p-1 w-[15%]"
                      >
                        Data
                      </th>
                      <th colSpan={2} className="border border-black p-1">
                        Gratificações
                      </th>
                      <th
                        rowSpan={2}
                        className="border border-black p-1 w-[15%]"
                      >
                        Data
                      </th>
                      <th colSpan={2} className="border border-black p-1">
                        Gratificações
                      </th>
                      {formData.gratificacoes.length > 0 && (
                        <th
                          rowSpan={2}
                          className="border border-black p-1 w-[12%] text-center"
                        >
                          Excluir
                        </th>
                      )}
                    </tr>
                    <tr>
                      <th className="border border-black p-1">Normal</th>
                      <th className="border border-black p-1">Especial</th>
                      <th className="border border-black p-1">Normal</th>
                      <th className="border border-black p-1">Especial</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.gratificacoes.map((item, idx) => (
                      <tr key={idx}>
                        <td className="border border-black p-0">
                          <input
                            type="date"
                            className="w-full p-1 outline-none"
                            value={item.data}
                            onChange={(e) =>
                              handleTableChange(
                                "gratificacoes",
                                idx,
                                "data",
                                e.target.value,
                              )
                            }
                          />
                        </td>
                        <td className="border border-black p-0">
                          <input
                            type="text"
                            className="w-full p-1 outline-none"
                            value={item.normal}
                            onChange={(e) =>
                              handleTableChange(
                                "gratificacoes",
                                idx,
                                "normal",
                                e.target.value,
                              )
                            }
                          />
                        </td>
                        <td className="border border-black p-0">
                          <input
                            type="text"
                            className="w-full p-1 outline-none"
                            value={item.especial}
                            onChange={(e) =>
                              handleTableChange(
                                "gratificacoes",
                                idx,
                                "especial",
                                e.target.value,
                              )
                            }
                          />
                        </td>
                        <td className="border border-black p-0">
                          <input
                            type="date"
                            className="w-full p-1 outline-none"
                            value={item.data2}
                            onChange={(e) =>
                              handleTableChange(
                                "gratificacoes",
                                idx,
                                "data2",
                                e.target.value,
                              )
                            }
                          />
                        </td>
                        <td className="border border-black p-0">
                          <input
                            type="text"
                            className="w-full p-1 outline-none"
                            value={item.normal2}
                            onChange={(e) =>
                              handleTableChange(
                                "gratificacoes",
                                idx,
                                "normal2",
                                e.target.value,
                              )
                            }
                          />
                        </td>
                        <td className="border border-black p-0">
                          <input
                            type="text"
                            className="w-full p-1 outline-none"
                            value={item.especial2}
                            onChange={(e) =>
                              handleTableChange(
                                "gratificacoes",
                                idx,
                                "especial2",
                                e.target.value,
                              )
                            }
                          />
                        </td>
                        <td className="border border-black p-1 text-center">
                          <button
                            type="button"
                            onClick={() => removeRow("gratificacoes", idx)}
                            className="text-red-600 hover:text-red-800 transition-colors p-1"
                            title="Remover linha"
                          >
                            <Trash2 size={12} className="mx-auto" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {formData.gratificacoes.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="border border-black p-4 text-center text-gray-400 italic"
                        >
                          Nenhum registo de gratificação.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() =>
                      addRow("gratificacoes", {
                        data: "",
                        normal: "",
                        especial: "",
                        data2: "",
                        normal2: "",
                        especial2: "",
                      })
                    }
                    className="bg-blue-900 text-white px-4 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-blue-800 transition-colors"
                  >
                    <Plus size={12} /> + linha
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-center font-bold mb-4 text-xl">
                Relação De Documentos Anexos
              </h3>
              <table className="w-full border-collapse border border-black table-fixed">
                <thead>
                  <tr>
                    <th className="border border-black p-2 w-[20%]">Data</th>
                    <th className="border border-black p-2">
                      Descrição Dos Documentos
                    </th>
                    {formData.documentosAnexos.length > 0 && (
                      <th className="border border-black p-2 w-[12%] text-center">
                        Excluir
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {formData.documentosAnexos.map((item, idx) => (
                    <tr key={idx}>
                      <td className="border border-black p-0">
                        <input
                          type="date"
                          className="w-full p-2 outline-none"
                          value={item.data}
                          onChange={(e) =>
                            handleTableChange(
                              "documentosAnexos",
                              idx,
                              "data",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="border border-black p-0">
                        <input
                          type="text"
                          className="w-full p-2 outline-none"
                          value={item.descricao}
                          onChange={(e) =>
                            handleTableChange(
                              "documentosAnexos",
                              idx,
                              "descricao",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="border border-black p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeRow("documentosAnexos", idx)}
                          className="text-red-600 hover:text-red-800 transition-colors p-2"
                          title="Remover linha"
                        >
                          <Trash2 size={16} className="mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {formData.documentosAnexos.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="border border-black p-4 text-center text-gray-400 italic"
                      >
                        Nenhum documento registado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() =>
                    addRow("documentosAnexos", { data: "", descricao: "" })
                  }
                  className="bg-blue-900 text-white px-4 py-2 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-blue-800 transition-colors"
                >
                  <Plus size={14} /> + adicionar linha
                </button>
              </div>
            </div>

            <div className="bg-blue-50/60 p-6 md:p-8 rounded-3xl border-2 border-dashed border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-blue-900 font-bold flex items-center gap-2 text-base">
                  <Upload size={20} className="text-blue-600" /> Upload e
                  Pré-Visualização de Ficheiros Complementares
                </h4>
                <span className="text-xs text-blue-700 font-semibold bg-blue-100 px-3 py-1 rounded-full">
                  {formData.ficheiros.length} documento(s) em pré-visualização
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <label className="flex flex-col items-center justify-center h-44 bg-white rounded-2xl border-2 border-dashed border-blue-300 cursor-pointer hover:border-blue-600 hover:bg-blue-50/80 transition-all shadow-sm group">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-full group-hover:scale-110 transition-transform">
                    <Plus size={28} />
                  </div>
                  <span className="text-xs font-bold text-blue-900 mt-2">
                    Adicionar Anexo
                  </span>
                  <span className="text-[9px] font-semibold text-gray-400 mt-0.5">
                    PDF, PNG, JPG, DOC
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    onChange={handleFileUpload}
                  />
                </label>

                {formData.ficheiros.map((file: any, idx: number) => {
                  const isImage =
                    file.type?.startsWith("image/") ||
                    file.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                  const fileUrl =
                    file instanceof File
                      ? URL.createObjectURL(file)
                      : file.url || file.dataUrl || "";

                  const docFile: DocumentFile = {
                    name: file.name || `Anexo_${idx + 1}`,
                    url: fileUrl,
                    type: file.type,
                    size: file.size,
                    fileObject: file instanceof File ? file : undefined,
                  };

                  return (
                    <div
                      key={idx}
                      className="group relative h-44 bg-white rounded-2xl border border-gray-200 hover:border-blue-500 flex flex-col justify-between p-2.5 shadow-sm hover:shadow-xl transition-all overflow-hidden"
                    >
                      {/* Thumbnail Preview Area */}
                      <div
                        onClick={() => {
                          setSelectedPreviewFile(docFile);
                          setIsPreviewModalOpen(true);
                        }}
                        className="w-full flex-1 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center cursor-pointer relative group-hover:bg-gray-100 transition-colors"
                      >
                        {isImage && fileUrl ? (
                          <img
                            src={fileUrl}
                            className="w-full h-full object-cover rounded-xl"
                            alt={file.name}
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-1.5 p-2">
                            <FileText size={36} className="text-blue-600" />
                            <span className="text-[9px] font-black  tracking-wider text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                              {file.name?.split(".").pop()?.toUpperCase() ||
                                "DOC"}
                            </span>
                          </div>
                        )}

                        {/* Hover Overlay with Preview and Read actions */}
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px]">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPreviewFile(docFile);
                              setIsPreviewModalOpen(true);
                            }}
                            className="p-2 bg-white text-blue-900 rounded-xl hover:bg-blue-50 transition-colors shadow-md"
                            title="Pré-visualizar / Ler Documento"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (fileUrl) {
                                const link = document.createElement("a");
                                link.href = fileUrl;
                                link.download = file.name || "documento";
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }
                            }}
                            className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-md"
                            title="Descarregar Ficheiro"
                          >
                            <Download size={16} />
                          </button>
                        </div>
                      </div>

                      {/* File details footer */}
                      <div className="mt-2 flex items-center justify-between gap-1 text-left">
                        <span
                          className="text-[10px] font-bold text-gray-800 truncate flex-1"
                          title={file.name}
                        >
                          {file.name}
                        </span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (
                              window.confirm(
                                "Tem a certeza que deseja eliminar este ficheiro?",
                              )
                            ) {
                              setFormData((prev) => ({
                                ...prev,
                                ficheiros: prev.ficheiros.filter(
                                  (_, i) => i !== idx,
                                ),
                              }));
                            }
                          }}
                          type="button"
                          className="text-gray-400 hover:text-red-600 transition-colors p-1"
                          title="Eliminar Ficheiro"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <DraftModal
        show={showDraftModal}
        onRecover={recoverDraft}
        onDiscard={discardDraft}
        title="Rascunho de Processo"
        message="Encontramos um preenchimento anterior deste Processo Individual. Deseja recuperar os dados e continuar o preenchimento?"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-5xl h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden relative"
      >
        <SyncIndicator
          isSyncing={isSyncing}
          className="absolute top-6 right-24 z-[60]"
        />

        <header className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10 w-full">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <div></div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-10 h-10 rounded-xl font-bold transition-all ${currentPage === p ? "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}
                >
                  {p}
                </button>
              ))}
            </div>
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  if (onDelete) onDelete();
                }}
                className="flex items-center gap-2 p-2 hover:bg-red-50 text-red-500 rounded-xl transition-colors font-bold text-sm ml-4 border border-red-100"
                title="Excluir Colaborador"
              >
                <Trash2 size={20} />{" "}
                <span className="hidden md:inline">Excluir</span>
              </button>
            )}
          </div>
        </header>

        {errorMessage && (
          <div className="bg-red-50 border-b border-red-200 text-red-700 px-6 py-4 text-xs font-bold flex flex-col gap-2 sticky top-[89px] z-20 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertCircle
                size={16}
                className="shrink-0 text-red-500 animate-pulse"
              />
              <span>{errorMessage}</span>
            </div>
            {Object.keys(validationErrors).length > 1 && (
              <div className="mt-2 pl-6 border-l-2 border-red-200">
                <p className="font-bold text-red-800 mb-1">
                  Por favor, corrija os seguintes campos obrigatórios:
                </p>
                <ul className="list-disc space-y-1 text-red-600 font-semibold">
                  {Object.entries(validationErrors).map(([key, msg]) => (
                    <li key={key}>{msg}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {duplicateError && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-800 px-6 py-4 text-xs font-bold flex flex-col gap-2 sticky top-[89px] z-20 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertCircle
                size={16}
                className="shrink-0 text-amber-600 animate-bounce"
              />
              <span className="font-black text-amber-900">
                Aviso do Sistema: Conflito de Registo Detetado
              </span>
            </div>
            <p className="pl-6 font-semibold text-amber-700">
              {duplicateError}
            </p>
          </div>
        )}

        <main className="flex-grow overflow-auto p-4 md:p-8 bg-[#f8fafc]">
          <div className="bg-white shadow-sm border border-gray-100 rounded-[2rem] p-6 md:p-10 min-h-full mx-auto max-w-4xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderPage()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <footer className="p-6 border-t border-gray-100 flex flex-col items-center justify-between bg-white relative">
          {(isVerifying || duplicateError) && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center justify-center p-2 rounded-lg bg-white shadow-md border border-gray-100 px-4 whitespace-nowrap z-50">
              {isVerifying ? (
                <span className="text-xs text-blue-600 font-bold flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></span>
                  Verificando registos...
                </span>
              ) : (
                <span className="text-xs text-red-600 font-bold flex items-center gap-2">
                  <AlertCircle size={14} />
                  {duplicateError}
                </span>
              )}
            </div>
          )}
          <div className="flex w-full items-center justify-between">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-all"
            >
              <ArrowLeft size={20} /> Anterior
            </button>

            {currentPage < 5 ? (
              <button
                onClick={() => setCurrentPage((prev) => Math.min(5, prev + 1))}
                disabled={!!duplicateError || isVerifying}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all disabled:opacity-30 disabled:hover:bg-blue-600"
              >
                Próxima Página <ArrowRight size={20} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !!duplicateError || isVerifying}
                className="flex items-center gap-2 px-10 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-100 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>Processando...</>
                ) : (
                  <>
                    Submeter Processo <Save size={20} />
                  </>
                )}
              </button>
            )}
          </div>
        </footer>
      </motion.div>

      {/* Modal de Leitura e Pré-visualização de Documentos / Anexos */}
      <DocumentPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        file={selectedPreviewFile}
        processNo={formData.processoNo || formData.processoIndividualNo}
        collaboratorName={formData.nome}
      />

      {/* Certo Verde de Sucesso e Fechamento Automático */}
      <AnimatePresence>
        {showSuccessCheck && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center z-[100]"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-10 shadow-2xl flex flex-col items-center gap-4 max-w-sm text-center border border-gray-100 mx-4"
            >
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100">
                <CheckCircle2 size={44} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Gravado com Sucesso!
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  O processo foi guardado e atualizado corretamente.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

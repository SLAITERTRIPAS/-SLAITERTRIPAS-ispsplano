import { printElementById } from "../../lib/printUtils";
import React, { useState, useEffect } from "react";
import {
  UserPlus,
  Calendar,
  CreditCard,
  FileText,
  Building,
  BookOpen,
  GraduationCap,
  Upload,
  ShieldCheck,
  Printer,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { firestoreService } from "../../lib/firestoreService";
import { DraftModal, SyncIndicator } from "../../components/ui/DraftMemoryUI";
import {
  PROVINCIAS_DISTRITOS,
  UNIDADES_ORGANICAS_SISTEMA,
  DEPARTAMENTOS,
  REPARTICOES,
  SECTORES,
  CURSOS,
  NIVEIS_ACADEMICOS,
  CATEGORIAS_FUNCIONARIOS,
  CATEGORIAS_DOCENTES,
  CATEGORIAS_CTAA,
  LISTA_FUNCOES,
  FUNCIONARIOS,
  HABILITACOES_PROFISSIONAIS_LIST,
} from "../../constants/formOptions";
import { EFETIVO_GERAL_DATA } from "../../constants/colaboradoresList";
import { extractTextFromPDF } from "../../lib/pdfParser";
import {
  toTitleCase,
  toSentenceCase,
  classifyTipo,
  generateCollaboratorId,
} from "../../lib/utils";

import { getRoles } from "../../lib/auth";

export default function RegistarFuncionarioForm({
  onCancel,
  onSubmit,
  initialData,
  user,
  allDocentes = EFETIVO_GERAL_DATA,
}: {
  onCancel: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  user?: any;
  allDocentes?: any[];
}) {
  const roles = getRoles(user?.title || user?.cargo || user?.cargoChefia || "");
  const isDCC = roles.isDCC;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [tipoAcesso, setTipoAcesso] = useState<"Chefe" | "Técnico">("Chefe");
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [page, setPage] = useState(1);
  const totalPages = 5;

  const renderPagination = () => (
    <div className="flex justify-between mt-8 border-t border-black pt-4">
      <button
        type="button"
        onClick={() => setPage(p => Math.max(1, p - 1))}
        disabled={page === 1}
        className="px-6 py-2 border border-black font-bold text-black hover:bg-gray-100 disabled:opacity-50"
      >
        Anterior
      </button>
      <span className="font-bold">Página {page} de {totalPages}</span>
      {page < totalPages ? (
        <button
          type="button"
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          className="px-6 py-2 bg-blue-600 text-white font-bold hover:bg-blue-700"
        >
          Próximo
        </button>
      ) : (
        <button
          onClick={handleLocalSubmit}
          disabled={isSubmitting || isSubmitted}
          className="px-6 py-2 bg-[#00b0f0] border border-black text-black font-bold hover:bg-[#0090c0] tracking-widest text-sm flex items-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? "A processar..." : isSubmitted ? "Registado" : "Submeter"}
        </button>
      )}
    </div>
  );

  const getSectorsForDepartment = (dept: string): string[] => {
    if (!dept) return [];
    const reparticoes = DEPARTAMENTOS[dept] || [];
    let sectors: string[] = [];
    reparticoes.forEach((rep) => {
      if (SECTORES[rep]) {
        sectors = [...sectors, ...SECTORES[rep]];
      }
      if (REPARTICOES[rep]) {
        REPARTICOES[rep].forEach((subRep) => {
          if (SECTORES[subRep]) {
            sectors = [...sectors, ...SECTORES[subRep]];
          }
        });
      }
    });
    return Array.from(new Set(sectors));
  };

  const [selectedExistingId, setSelectedExistingId] = useState<string | null>(
    initialData?.id || null,
  );
  const [numeroProcesso, setNumeroProcesso] = useState(
    initialData?.numeroProcesso || initialData?.id || "",
  );

  const [ord, setOrd] = useState(initialData?.ord?.toString() || "");
  const [nome, setNome] = useState(initialData?.nome || "");
  const [genero, setGenero] = useState(initialData?.genero || "");
  const [dataNascimento, setDataNascimento] = useState(
    initialData?.dataNascimento || "",
  );
  const [nacionalidade, setNacionalidade] = useState(
    initialData?.localNascimento?.pais ||
      initialData?.nacionalidade ||
      "Moçambique",
  );
  const [provincia, setProvincia] = useState(
    initialData?.localNascimento?.provincia || initialData?.provincia || "",
  );
  const [distrito, setDistrito] = useState(
    initialData?.localNascimento?.distrito || initialData?.distrito || "",
  );
  const [nuit, setNuit] = useState(initialData?.nuit || "");
  const [numeroBI, setNumeroBI] = useState(initialData?.numeroBI || "");
  const [nivelAcademico, setNivelAcademico] = useState(
    initialData?.nivelAcademico || "",
  );
  const [areaFormacao, setAreaFormacao] = useState(
    initialData?.areaFormacao || "",
  );
  const [categoria, setCategoria] = useState(initialData?.categoria || "");
  const [vinculoContractual, setVinculoContractual] = useState(
    initialData?.vinculoContractual || "",
  );
  const [funcao, setFuncao] = useState(initialData?.funcao || "");
  const [cargoChefia, setCargoChefia] = useState(
    initialData?.cargoChefia || "",
  );
  const [tipoContrato, setTipoContrato] = useState(
    initialData?.tipoContrato || "",
  );
  const [carreira, setCarreira] = useState(
    initialData?.carreira || (initialData?.tipo === "Docente" ? "Docente" : ""),
  );
  const [efetivo, setEfetivo] = useState(initialData?.efetivo || false);

  const handleCargoChefiaChange = (val: string) => {
    setCargoChefia(val);
    if (
      val !== "Nenhum" &&
      val !== "" &&
      estadoMandato !== "Cessado" &&
      estadoMandato !== "Despromovido"
    ) {
      setEstadoMandato("Em Atividade");
    }
  };
  const [cargo, setCargo] = useState(initialData?.cargo || "");
  console.log("RegistarFuncionarioForm initialData:", initialData);
  const [unidade, setUnidade] = useState(
    initialData?.unidade || initialData?.userArea?.unidade || "",
  );
  const [direcao, setDirecao] = useState(
    initialData?.direcao || initialData?.userArea?.direcao || "",
  );
  const [departamento, setDepartamento] = useState(
    initialData?.departamento || initialData?.userArea?.departamento || "",
  );
  const availableSectors = getSectorsForDepartment(departamento);
  const [reparticao, setReparticao] = useState(
    initialData?.reparticao || initialData?.userArea?.reparticao || "",
  );
  const [sector, setSector] = useState(
    initialData?.sector || initialData?.userArea?.setor || "",
  );
  const [setoresAtribuidos, setSetoresAtribuidos] = useState<string[]>(
    initialData?.setoresAtribuidos || [],
  );
  const [curso, setCurso] = useState(initialData?.curso || "");
  const [cursos, setCursos] = useState<string[]>(
    initialData?.cursos ||
      (initialData?.curso ? [initialData.curso, "", "", ""] : ["", "", "", ""]),
  );

  // Sincronizar estado local quando initialData mudar (importante para edições sucessivas)
  React.useEffect(() => {
    if (initialData) {
      setUnidade(initialData.unidade || initialData.userArea?.unidade || "");
      setDirecao(initialData.direcao || initialData.userArea?.direcao || "");
      setDepartamento(
        initialData.departamento || initialData.userArea?.departamento || "",
      );
      setReparticao(
        initialData.reparticao || initialData.userArea?.reparticao || "",
      );
      setSector(initialData.sector || initialData.userArea?.setor || "");
      setCurso(initialData.curso || "");
      setCursos(
        initialData.cursos ||
          (initialData.curso
            ? [initialData.curso, "", "", ""]
            : ["", "", "", ""]),
      );
      setCargo(initialData.cargo || "");
      setCargoChefia(initialData.cargoChefia || "Nenhum");
      setEstado(initialData.estado || "Ativo");
      setEstadoMandato(initialData.estadoMandato || "Em Atividade");
    }
  }, [initialData]);
  const [disciplinas, setDisciplinas] = useState<string[]>(
    initialData?.disciplinas || ["", "", "", ""],
  );
  const [estado, setEstado] = useState(initialData?.estado || "Ativo");
  const [estadoMandato, setEstadoMandato] = useState(
    initialData?.estadoMandato || "Em Atividade",
  );

  // Lógica de Persistência (Memória do Sistema)
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const FORM_ID = "registar_funcionario_form";
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
      if (!currentUser?.id || initialData) {
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
  }, [currentUser?.id, initialData]);

  useEffect(() => {
    if (isDraftLoaded && !initialData && currentUser?.id) {
      setIsSyncing(true);
      const draftData = {
        nome,
        genero,
        dataNascimento,
        nacionalidade,
        provincia,
        distrito,
        nuit,
        numeroBI,
        nivelAcademico,
        areaFormacao,
        categoria,
        vinculoContractual,
        funcao,
        cargoChefia,
        tipoContrato,
        carreira,
        efetivo,
        cargo,
        unidade,
        direcao,
        departamento,
        reparticao,
        sector,
        curso,
        estado,
        estadoMandato,
        numeroProcesso,
        ord,
        lastSync: new Date().toISOString(),
      };
      const timer = setTimeout(() => {
        firestoreService.drafts
          .save(currentUser.id, FORM_ID, draftData)
          .finally(() => setIsSyncing(false));
      }, 15000); // 15s debounce para evitar esgotamento de quota
      return () => clearTimeout(timer);
    }
  }, [
    isDraftLoaded,
    nome,
    genero,
    dataNascimento,
    nacionalidade,
    provincia,
    distrito,
    nuit,
    numeroBI,
    nivelAcademico,
    areaFormacao,
    categoria,
    vinculoContractual,
    funcao,
    cargoChefia,
    tipoContrato,
    carreira,
    efetivo,
    cargo,
    unidade,
    direcao,
    departamento,
    reparticao,
    sector,
    curso,
    estado,
    estadoMandato,
    numeroProcesso,
    ord,
    currentUser?.id,
    initialData,
  ]);

  const recoverDraft = async () => {
    setShowDraftModal(false);
    try {
      const draft: any = await firestoreService.drafts.getByUserAndForm(
        currentUser.id,
        FORM_ID,
      );
      if (draft) {
        if (draft.nome) setNome(draft.nome);
        if (draft.genero) setGenero(draft.genero);
        if (draft.dataNascimento) setDataNascimento(draft.dataNascimento);
        if (draft.nacionalidade) setNacionalidade(draft.nacionalidade);
        if (draft.provincia) setProvincia(draft.provincia);
        if (draft.distrito) setDistrito(draft.distrito);
        if (draft.nuit) setNuit(draft.nuit);
        if (draft.numeroBI) setNumeroBI(draft.numeroBI);
        if (draft.nivelAcademico) setNivelAcademico(draft.nivelAcademico);
        if (draft.areaFormacao) setAreaFormacao(draft.areaFormacao);
        if (draft.categoria) setCategoria(draft.categoria);
        if (draft.vinculoContractual)
          setVinculoContractual(draft.vinculoContractual);
        if (draft.funcao) setFuncao(draft.funcao);
        if (draft.cargoChefia) setCargoChefia(draft.cargoChefia);
        if (draft.tipoContrato) setTipoContrato(draft.tipoContrato);
        if (draft.carreira) setCarreira(draft.carreira);
        if (draft.efetivo !== undefined) setEfetivo(draft.efetivo);
        if (draft.cargo) setCargo(draft.cargo);
        if (draft.unidade) setUnidade(draft.unidade);
        if (draft.direcao) setDirecao(draft.direcao);
        if (draft.departamento) setDepartamento(draft.departamento);
        if (draft.reparticao) setReparticao(draft.reparticao);
        if (draft.sector) setSector(draft.sector);
        if (draft.curso) setCurso(draft.curso);
        if (draft.cursos) setCursos(draft.cursos);
        if (draft.disciplinas) setDisciplinas(draft.disciplinas);
        if (draft.estado) setEstado(draft.estado);
        if (draft.estadoMandato) setEstadoMandato(draft.estadoMandato);
        if (draft.numeroProcesso) setNumeroProcesso(draft.numeroProcesso);
        if (draft.ord) setOrd(draft.ord);
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

  const handleSelectDocente = (docente: any) => {
    setSelectedExistingId(docente.id || null);
    setNome(docente.nome || "");
    setGenero(docente.genero || "");
    setDataNascimento(docente.dataNascimento || "");
    setNacionalidade(
      docente.localNascimento?.pais || docente.nacionalidade || "Moçambique",
    );
    setProvincia(docente.localNascimento?.provincia || docente.provincia || "");
    setDistrito(docente.localNascimento?.distrito || docente.distrito || "");
    setNuit(docente.nuit || "");
    setNumeroBI(docente.numeroBI || "");
    setNivelAcademico(docente.nivelAcademico || "");
    setAreaFormacao(docente.areaFormacao || "");
    setCategoria(docente.categoria || "");
    setVinculoContractual(docente.vinculoContractual || "");
    setFuncao(docente.funcao || "");
    setCargoChefia(docente.cargoChefia || "");
    setTipoContrato(docente.tipoContrato || "");
    setCarreira(
      docente.carreira || (docente.tipo === "Docente" ? "Docente" : ""),
    );
    setEfetivo(docente.efetivo || false);
    setCargo(docente.cargo || "");
    setUnidade(docente.unidade || "");
    setDirecao(docente.direcao || "");
    setDepartamento(docente.departamento || "");
    setReparticao(docente.reparticao || "");
    setSector(docente.sector || "");
    setSetoresAtribuidos(docente.setoresAtribuidos || []);
    setCurso(docente.curso || "");
    setCursos(
      docente.cursos ||
        (docente.curso ? [docente.curso, "", "", ""] : ["", "", "", ""]),
    );
    setDisciplinas(docente.disciplinas || ["", "", "", ""]);
    setEstado(docente.estado || "Ativo");
    setEstadoMandato(docente.estadoMandato || "Em Atividade");

    setSearchTerm(docente.nome);
    setShowSearchResults(false);
    setSelectedExistingId(docente.id || null);
    if (docente.numeroProcesso || docente.id) {
      setNumeroProcesso(docente.numeroProcesso || docente.id);
    }
  };

  React.useEffect(() => {
    if (nome || nuit) {
      const generatedId = generateCollaboratorId(nome, nuit);
      if (generatedId) {
        setNumeroProcesso(generatedId);
      }
    }
  }, [nome, nuit]);

  React.useEffect(() => {
    // A alocação automática foi removida para permitir que o campo esteja em branco conforme solicitado pelo utilizador.
  }, [cargoChefia, unidade, direcao]);

  const CARGOS_CHEFIA_LIST = [
    "Diretor-Geral",
    "Diretor",
    "Diretor da Divisão",
    "Adjunto Pedagógico",
    "Diretor Central",
    "Diretor de curso",
    "Chefe do Departamento",
    "Chefe de Repartição",
    "Nenhum",
    "Utilizador",
    "Administrador de sistema",
    "Proprietário do sistema",
  ];

  const handleUnidadeChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>,
  ) => {
    setUnidade(e.target.value);
    setDirecao("");
    setDepartamento("");
    setReparticao("");
    setCurso("");
    setSector("");
  };

  const handleDirecaoChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>,
  ) => {
    const val = e.target.value;
    setDirecao(val);
    if (val && !unidade) {
      const parentUnit = UNIDADES_ORGANICAS_SISTEMA.find((u) =>
        u.direcoes?.includes(val),
      );
      if (parentUnit) setUnidade(parentUnit.nome);
    }
    setDepartamento("");
    setReparticao("");
    setCurso("");
    setSector("");
  };

  const handleDepartamentoChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>,
  ) => {
    const val = e.target.value;
    setDepartamento(val);
    if (val && !direcao) {
      for (const [dKey, deptList] of Object.entries({
        ...DEPARTAMENTOS,
        ...DEPARTAMENTOS,
      })) {
        if (deptList?.includes(val)) {
          setDirecao(dKey);
          if (!unidade) {
            const parentUnit = UNIDADES_ORGANICAS_SISTEMA.find((u) =>
              u.direcoes?.includes(dKey),
            );
            if (parentUnit) setUnidade(parentUnit.nome);
          }
          break;
        }
      }
    }
    setReparticao("");
    setCurso("");
    setSector("");
  };

  const handleReparticaoChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>,
  ) => {
    setReparticao(e.target.value);
    setSector("");
  };

  const handleEstadoMandatoChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const val = e.target.value;
    setEstadoMandato(val);
    if (val === "Cessado" || val === "Nenhum" || val === "Despromovido") {
      setCargoChefia("Nenhum");
      setCarreira(carreira || "Docente"); // Ensure we have a base function
      setCargo(carreira || "Docente"); // Reset cargo to base function
      setDirecao("");
      setDepartamento("");
      setReparticao("");
      setSector("");
      setCurso("");
    }
  };

  const handleProvinciaChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>,
  ) => {
    setProvincia(e.target.value);
    setDistrito("");
  };

  const handleSubmit = () => {
    if (!nome || !genero || !unidade) {
      alert(
        "Por favor, preencha os campos obrigatórios (Nome, Género, Unidade).",
      );
      return;
    }

    if (nuit) {
      const isDuplicateNUIT = EFETIVO_GERAL_DATA.some((c) => c.nuit === nuit);
      if (isDuplicateNUIT) {
        alert("Este NUIT já está registado. Verifique os dados repetidos.");
        return;
      }
    }

    if (numeroBI) {
      const isDuplicateBI = EFETIVO_GERAL_DATA.some(
        (c) => c.numeroBI?.toLowerCase() === numeroBI.toLowerCase(),
      );
      if (isDuplicateBI) {
        alert(
          "Este número de B.I. já está registado. Verifique os dados repetidos.",
        );
        return;
      }
    }

    const computedId =
      selectedExistingId ||
      initialData?.id ||
      numeroProcesso ||
      generateCollaboratorId(nome, nuit) ||
      `COLAB-${Date.now()}`;

    const data = {
      ...initialData,
      id: computedId,
      numeroProcesso: numeroProcesso || computedId,
      ord: parseInt(ord, 10) || EFETIVO_GERAL_DATA.length + 1,
      nome: toTitleCase(nome),
      genero,
      dataNascimento,
      localNascimento: {
        pais: toTitleCase(nacionalidade),
        provincia: toTitleCase(provincia),
        distrito: toTitleCase(distrito),
      },
      nuit,
      numeroBI,
      nivelAcademico: toTitleCase(nivelAcademico),
      areaFormacao: toTitleCase(areaFormacao),
      categoria: toTitleCase(categoria),
      vinculoContractual: toTitleCase(vinculoContractual),
      funcao: toTitleCase(funcao),
      cargoChefia: toTitleCase(cargoChefia),
      tipoContrato: toSentenceCase(tipoContrato),
      carreira: toSentenceCase(carreira),
      efetivo: efetivo,
      unidade: toTitleCase(unidade),
      direcao: toTitleCase(direcao),
      departamento: toTitleCase(departamento),
      reparticao: toTitleCase(reparticao),
      sector: toTitleCase(sector),
      setoresAtribuidos: setoresAtribuidos,
      curso: toTitleCase(curso),
      cursos: cursos.map((c) => toTitleCase(c)),
      disciplinas: disciplinas.map((d) => toTitleCase(d)),
      cargo: toSentenceCase(cargo || carreira),
      tipo: carreira === "CTA" ? "CTA" : toSentenceCase(carreira),
      estado: toTitleCase(estado),
      status: toTitleCase(estado),
      estadoMandato: estadoMandato,
      areaDeAfetacao: (() => {
        if (reparticao && reparticao !== "Nenhum" && reparticao !== "-")
          return toTitleCase(reparticao);
        if (departamento && departamento !== "Nenhum" && departamento !== "-")
          return toTitleCase(departamento);
        if (direcao && direcao !== "Nenhum" && direcao !== "-")
          return toTitleCase(direcao);
        return toTitleCase(unidade || "");
      })(),
    };

    onSubmit(data);
    // Limpar rascunho ao submeter com sucesso (Memória do Sistema)
    if (currentUser?.id) {
      firestoreService.drafts.deleteByUserAndForm(currentUser.id, FORM_ID);
    }
    setIsSubmitted(true);
  };

  const handleLocalSubmit = async () => {
    setIsSubmitting(true);
    try {
      await handleSubmit();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <div className="relative">
      <DraftModal
        show={showDraftModal}
        onRecover={recoverDraft}
        onDiscard={discardDraft}
      />

      <SyncIndicator
        isSyncing={isSyncing}
        className="absolute top-4 right-4 z-50"
      />

      {/* Success Overlay */}
      {isSubmitted && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:hidden">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center"
          >
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 mx-auto">
              <ShieldCheck size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-2">
              Funcionário Registado!
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              O funcionário{" "}
              <span className="font-bold text-slate-900">{nome}</span> foi
              registado no sistema com sucesso. Pode agora imprimir a ficha de
              cadastro individual.
            </p>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => printElementById("print-area")}
                className="w-full bg-[#00b0f0] border border-black text-black py-4 rounded-lg font-bold text-[10px] tracking-[0.2em] hover:bg-[#0090c0] transition-all shadow-xl flex items-center justify-center gap-2"
              >
                <Printer size={18} /> Imprimir Ficha de Cadastro
              </button>
              <button
                onClick={onCancel}
                className="w-full bg-slate-100 text-slate-600 py-4 rounded-lg font-bold text-[10px] tracking-[0.2em] hover:bg-slate-200 transition-all border border-slate-200"
              >
                Fechar e Voltar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="bg-white rounded-none shadow-xl border border-black overflow-hidden w-[90%] max-w-5xl mx-auto font-[Times_New_Roman,Times,serif]">
        <div className="bg-[#00b0f0] text-black p-4 flex items-center justify-between gap-4 border-b border-black">
          <div className="flex items-center gap-4">
            <UserPlus size={32} />
            <div>
              <h2 className="text-2xl font-bold tracking-wider">
                Registo de Funcionário
              </h2>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8">
            <label className="block text-xs font-black text-blue-600 tracking-widest mb-3">
              Pesquisar Docente Existente (Auto-preenchimento)
            </label>
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Digite o nome para pesquisar na base de dados do RH..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                className="w-full pl-12 pr-6 py-4 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-700 focus:border-blue-500 focus:ring-0 outline-none transition-all"
              />

              <AnimatePresence>
                {showSearchResults && searchTerm.length > 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 z-[120] overflow-hidden max-h-60 overflow-y-auto"
                  >
                    {allDocentes
                      .filter(
                        (d) =>
                          d.tipo === "Docente" &&
                          d.nome
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()),
                      )
                      .map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => handleSelectDocente(doc)}
                          className="w-full px-6 py-4 text-left hover:bg-blue-50 flex items-center justify-between group border-b border-slate-50 last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-[10px] font-black">
                              {(doc.nome || "S N")
                                .split(" ")
                                .filter(Boolean)
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2) || "S/N"}
                            </div>
                            <span className="font-bold text-slate-800">
                              {doc.nome}
                            </span>
                          </div>
                          <span className="text-[10px] font-black text-slate-400 tracking-widest group-hover:text-blue-600 transition-colors">
                            Selecionar
                          </span>
                        </button>
                      ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-medium italic">
              * Se o docente já existir no sistema, selecione-o para carregar
              todos os dados automaticamente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {page === 1 && (
              <>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-red-600 border-b border-red-200 mb-1">
                      Nº Processo / ID Único
                    </label>
                    <input
                      type="text"
                      className="w-full py-1 px-2 outline-none focus:ring-0 text-base font-mono font-bold text-red-700 bg-red-50/70 border border-red-200 rounded"
                      value={numeroProcesso}
                      onChange={(e) => setNumeroProcesso(e.target.value)}
                      placeholder="Preenchido Automaticamente..."
                      disabled={isDCC}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-black border-b border-black mb-1">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      className="w-full py-1 px-0 outline-none focus:ring-0 text-base"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Digite o nome completo"
                      disabled={isDCC}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-black border-b border-black mb-1">
                    Género
                  </label>
                  <select
                    className="w-full py-1 px-0 outline-none focus:ring-0 text-base bg-transparent appearance-none"
                    value={genero}
                    onChange={(e) => setGenero(e.target.value)}
                    disabled={isDCC}
                  >
                    <option value="">Selecione...</option>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </select>
                </div>
                {!(
                  categoria === "Administrador" ||
                  categoria === "Proprietário" ||
                  cargo === "Administrador" ||
                  cargo === "Proprietário"
                ) && (
                  <div>
                    <label className="block text-sm font-bold text-black border-b border-black mb-1">
                      NUIT
                    </label>
                    <input
                      type="text"
                      className="w-full py-1 px-0 outline-none focus:ring-0 text-base"
                      value={nuit}
                      onChange={(e) =>
                        setNuit(e.target.value.replace(/\D/g, "").slice(0, 9))
                      }
                      maxLength={9}
                      placeholder="Digite os 9 dígitos"
                      disabled={isDCC}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-bold text-black border-b border-black mb-1">
                    Nº B.I.
                  </label>
                  <input
                    type="text"
                    className="w-full py-1 px-0 outline-none focus:ring-0 text-base"
                    value={numeroBI}
                    onChange={(e) => setNumeroBI(e.target.value)}
                    disabled={isDCC}
                  />
                </div>
              </>
            )}

            {page === 2 && (
              <>
                <div>
                  <label className="block text-sm font-bold text-black border-b border-black mb-1">
                    País
                  </label>
                  <input
                    type="text"
                    className="w-full py-1 px-0 outline-none focus:ring-0 text-base"
                    value={nacionalidade}
                    onChange={(e) => setNacionalidade(e.target.value)}
                    disabled={isDCC}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-black border-b border-black mb-1">
                    Província
                  </label>
                  <input
                    type="text"
                    list="provincia-list"
                    className="w-full py-1 px-0 outline-none focus:ring-0 text-base bg-transparent appearance-none"
                    value={provincia}
                    onChange={handleProvinciaChange}
                    placeholder="Selecione ou digite..."
                    disabled={isDCC}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-black border-b border-black mb-1">
                    Distrito
                  </label>
                  <input
                    type="text"
                    list="distrito-list"
                    className="w-full py-1 px-0 outline-none focus:ring-0 text-base bg-transparent appearance-none"
                    value={distrito}
                    onChange={(e) => setDistrito(e.target.value)}
                    disabled={!provincia || isDCC}
                    placeholder="Selecione ou digite..."
                  />
                </div>
              </>
            )}

            {page === 3 && (
              <>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-black border-b border-black mb-1">
                    Órgão
                  </label>
                  <select
                    className="w-full py-1 px-0 outline-none focus:ring-0 text-base bg-transparent appearance-none border-b border-gray-100"
                    value={unidade}
                    onChange={(e) => {
                      setUnidade(e.target.value);
                      setDirecao("");
                      setDepartamento("");
                    }}
                    disabled={isDCC}
                  >
                    <option value="">Selecione o Órgão...</option>
                    {UNIDADES_ORGANICAS_SISTEMA.map((u) => (
                      <option key={u.id} value={u.nome}>
                        {u.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-black border-b border-black mb-1">
                    Departamento / Direção
                  </label>
                  <select
                    className="w-full py-1 px-0 outline-none focus:ring-0 text-base bg-transparent appearance-none border-b border-gray-100"
                    value={direcao}
                    onChange={(e) => {
                      setDirecao(e.target.value);
                      setDepartamento("");
                    }}
                    disabled={!unidade || isDCC}
                  >
                    <option value="">Selecione o Departamento...</option>
                    {UNIDADES_ORGANICAS_SISTEMA.find((u) => u.nome === unidade)?.direcoes.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-black border-b border-black mb-1">
                    Departamento de Afetação
                  </label>
                  <select
                    className="w-full py-1 px-0 outline-none focus:ring-0 text-base bg-transparent appearance-none border-b border-gray-100"
                    value={departamento}
                    onChange={(e) => setDepartamento(e.target.value)}
                    disabled={!direcao || isDCC}
                  >
                    <option value="">Selecione o Departamento...</option>
                    {(DEPARTAMENTOS[direcao] || []).map((dep) => (
                      <option key={dep} value={dep}>
                        {dep}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-bold text-black border-b border-black mb-1">
                Nível Académico
              </label>
              <select
                className="w-full py-1 px-0 outline-none focus:ring-0 text-base bg-transparent appearance-none"
                value={nivelAcademico}
                onChange={(e) => setNivelAcademico(e.target.value)}
              >
                <option value="">Selecione o nível...</option>
                {NIVEIS_ACADEMICOS.map((nivel) => (
                  <option key={nivel} value={nivel}>
                    {nivel}
                  </option>
                ))}
                {nivelAcademico && !NIVEIS_ACADEMICOS.includes(nivelAcademico) && (
                  <option value={nivelAcademico}>{nivelAcademico}</option>
                )}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-black border-b border-black mb-1">
                Área De Formação
              </label>
              <input
                type="text"
                className="w-full py-1 px-0 outline-none focus:ring-0 text-base"
                value={areaFormacao}
                onChange={(e) => setAreaFormacao(e.target.value)}
                placeholder="Digite a área de formação"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-black border-b border-black mb-1">
                Categoria
              </label>
              <select
                className="w-full py-1 px-0 outline-none focus:ring-0 text-base bg-transparent appearance-none"
                value={categoria}
                onChange={(e) => {
                  const val = e.target.value;
                  setCategoria(val);
                  if (CATEGORIAS_DOCENTES.includes(val) && val !== "Assistente") {
                    setCarreira("Docente");
                  } else if (["Técnico Superior", "Técnico Profissional", "Técnico"].includes(val)) {
                    setCarreira("CTA");
                  } else if (val === "Assistente" && !carreira) {
                    setCarreira("Docente");
                  } else {
                    const res = classifyTipo({ categoria: val, carreira });
                    setCarreira(res);
                  }
                }}
              >
                <option value="">Selecione...</option>
                {carreira === "Docente" ? (
                  <>
                    <optgroup label="Docentes">
                      {CATEGORIAS_DOCENTES.map((c) => (
                        <option key={`doc-${c}`} value={c}>
                          {c}
                        </option>
                      ))}
                    </optgroup>
                  </>
                ) : carreira === "CTA" ? (
                  <>
                    <optgroup label="CTAA">
                      {CATEGORIAS_CTAA.map((c) => (
                        <option key={`cta-${c}`} value={c}>
                          {c}
                        </option>
                      ))}
                    </optgroup>
                  </>
                ) : (
                  <>
                    <optgroup label="Docentes">
                      {CATEGORIAS_DOCENTES.map((c) => (
                        <option key={`all-doc-${c}`} value={c}>
                          {c}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="CTAA">
                      {CATEGORIAS_CTAA.map((c) => (
                        <option key={`all-cta-${c}`} value={c}>
                          {c}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Outras">
                      <option value="Proprietário e Programador do Sistema">
                        Proprietário e Programador do Sistema
                      </option>
                    </optgroup>
                  </>
                )}
                {categoria &&
                  !CATEGORIAS_DOCENTES.includes(categoria) &&
                  !CATEGORIAS_CTAA.includes(categoria) &&
                  categoria !== "Proprietário e Programador do Sistema" && (
                    <option value={categoria}>{categoria}</option>
                  )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-black border-b border-black mb-1">
                Tipo De Contrato
              </label>
              <select
                className="w-full py-1 px-0 outline-none focus:ring-0 text-base bg-transparent appearance-none"
                value={tipoContrato}
                onChange={(e) => setTipoContrato(e.target.value)}
              >
                <option value="">Selecione...</option>
                <option value="Tempo inteiro">Tempo inteiro</option>
                <option value="Tempo Parcial">Tempo Parcial</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-black border-b border-black mb-1">
                Vínculo Contractual
              </label>
              <select
                className="w-full py-1 px-0 outline-none focus:ring-0 text-base bg-transparent appearance-none"
                value={vinculoContractual}
                onChange={(e) => setVinculoContractual(e.target.value)}
              >
                <option value="">Selecione...</option>
                <option value="Pertence ao quadro">Pertence ao quadro</option>
                <option value="Não pertence ao quadro">
                  Não pertence ao quadro
                </option>
                {vinculoContractual &&
                  ![
                    "",
                    "Pertence ao quadro",
                    "Não pertence ao quadro",
                  ].includes(vinculoContractual) && (
                    <option value={vinculoContractual}>
                      {vinculoContractual}
                    </option>
                  )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-black border-b border-black mb-1">
                Carreira
              </label>
              <select
                className="w-full py-1 px-0 outline-none focus:ring-0 text-base bg-transparent appearance-none"
                value={carreira}
                onChange={(e) => setCarreira(e.target.value)}
              >
                <option value="">Selecione...</option>
                <option value="Docente">Docente</option>
                <option value="CTA">CTA</option>
                <option value="Investigador">Investigador</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-black border-b border-black mb-1">
                EFETIVO?
              </label>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  checked={efetivo}
                  onChange={(e) => setEfetivo(e.target.checked)}
                />
                <span className="text-sm text-gray-700">
                  {efetivo ? "Sim" : "Não"}
                </span>
              </div>
            </div>



            {departamento &&
            [
              "Departamento de Engenharia Eletrotécnica",
              "Departamento de Engenharia de Construção Civil",
              "Departamento de Engenharia de Construção Mecânica",
            ].includes(departamento) ? (
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-black border-b border-black mb-2">
                  Afetação por Curso (Até 4)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[0, 1, 2, 3].map((idx) => (
                    <div key={idx} className="flex flex-col">
                      <label className="text-[10px] text-gray-400 font-bold  tracking-widest">
                        Curso {idx + 1}
                      </label>
                      <select
                        className="w-full py-1 px-0 outline-none focus:ring-0 text-sm bg-transparent appearance-none border-b border-gray-100"
                        value={cursos[idx]}
                        onChange={(e) => {
                          const newCursos = [...cursos];
                          newCursos[idx] = e.target.value;
                          setCursos(newCursos);
                          if (idx === 0) setCurso(e.target.value);
                        }}
                      >
                        <option value="">Selecione o Curso {idx + 1}...</option>
                        {CURSOS[departamento]?.map((c) => (
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
              <>
                <div>
                  <label className="block text-sm font-bold text-black border-b border-black mb-1">
                    Tipo de Acesso
                  </label>
                  <select
                    className="w-full py-1 px-0 outline-none focus:ring-0 text-base bg-transparent appearance-none border-b border-gray-100"
                    value={tipoAcesso}
                    onChange={(e) =>
                      setTipoAcesso(e.target.value as "Chefe" | "Técnico")
                    }
                  >
                    <option value="Chefe">Chefe do Departamento</option>
                    <option value="Técnico">Técnico</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-black border-b border-black mb-1">
                    Repartição
                  </label>
                  <input
                    type="text"
                    list="reparticao-list"
                    className="w-full py-1 px-0 outline-none focus:ring-0 text-base bg-transparent appearance-none"
                    value={reparticao}
                    onChange={handleReparticaoChange}
                    placeholder="Selecione ou digite..."
                  />
                  <datalist id="reparticao-list">
                    {Array.from(
                      new Set(
                        departamento &&
                          REPARTICOES[departamento as keyof typeof REPARTICOES]
                          ? REPARTICOES[
                              departamento as keyof typeof REPARTICOES
                            ]
                          : Object.values(REPARTICOES).flat(),
                      ),
                    ).map((r, idx) => (
                      <option key={`${r}-${idx}`} value={r}>
                        {r}
                      </option>
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-bold text-black border-b border-black mb-1 tracking-tight">
                    Setor
                  </label>
                  <input
                    type="text"
                    list="sector-list"
                    className="w-full py-1 px-0 outline-none focus:ring-0 text-base bg-transparent appearance-none"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    placeholder="Selecione ou digite..."
                  />
                  <datalist id="sector-list">
                    {reparticao &&
                      SECTORES[reparticao]?.map((s) => (
                        <option key={s + "-" + Math.random()} value={s}>
                          {s}
                        </option>
                      ))}
                  </datalist>
                </div>

                {tipoAcesso === "Técnico" &&
                  departamento &&
                  availableSectors.length > 0 && (
                    <div className="mt-4 md:col-span-2">
                      <label className="block text-sm font-bold text-black border-b border-black mb-2">
                        Setores Atribuídos (Múltipla Seleção)
                      </label>
                      <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                        {availableSectors.map((s) => (
                          <label
                            key={s + "-" + Math.random()}
                            className="flex items-center gap-2 text-sm text-gray-700"
                          >
                            <input
                              type="checkbox"
                              checked={setoresAtribuidos.includes(s)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSetoresAtribuidos([
                                    ...setoresAtribuidos,
                                    s,
                                  ]);
                                } else {
                                  setSetoresAtribuidos(
                                    setoresAtribuidos.filter(
                                      (item) => item !== s,
                                    ),
                                  );
                                }
                              }}
                            />
                            {s}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
              </>
            )}

            {(carreira === "Docente" && carreira !== "CTA" && carreira !== "Investigador") && (
              <div className="md:col-span-2 bg-slate-50/50 p-4 rounded-xl border border-dotted border-slate-300">
                <label className="block text-sm font-bold text-black border-b border-black mb-3">
                  Disciplinas Leccionadas (Até 4)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[0, 1, 2, 3].map((idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-300">
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        className="flex-grow py-1 px-0 outline-none focus:ring-0 text-sm border-b border-slate-200 bg-transparent"
                        value={disciplinas[idx] || ""}
                        onChange={(e) => {
                          const newD = [...disciplinas];
                          newD[idx] = e.target.value;
                          setDisciplinas(newD);
                        }}
                        placeholder={`Nome da disciplina ${idx + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-black border-b border-black mb-1">
                Função
              </label>
              <select
                className="w-full py-1 px-0 outline-none focus:ring-0 text-base bg-transparent appearance-none"
                value={funcao}
                onChange={(e) => setFuncao(e.target.value)}
              >
                <option value="">Selecione...</option>
                {LISTA_FUNCOES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-black border-b border-black mb-1 text-blue-800">
                CARGO / CHEFIA
              </label>
              <input
                type="text"
                className="w-full py-1 px-0 outline-none focus:ring-0 text-base font-bold text-blue-800 placeholder:font-normal"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Digite o cargo ou chefia"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-black border-b border-black mb-1">
                Cargo De Chefia
              </label>
              <select
                className="w-full py-1 px-0 outline-none focus:ring-0 text-base bg-transparent appearance-none"
                value={cargoChefia}
                onChange={(e) => handleCargoChefiaChange(e.target.value)}
              >
                <option value="">Selecione...</option>
                {CARGOS_CHEFIA_LIST.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-black border-b border-black mb-1">
                Estado do Colaborador
              </label>
              <select
                className={`w-full py-1 px-0 outline-none focus:ring-0 text-base bg-transparent font-[900] ${["Falecido", "Reformado", "Transferido"].includes(estado || "Ativo") ? "text-red-600 font-[900]" : estado === "Ativo" || !estado ? "text-green-600 font-[900]" : "text-blue-600"}`}
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
              >
                <option value="Ativo" className="text-green-600 font-bold">
                  Ativo
                </option>
                <option value="Em Formação" className="text-blue-600 font-bold">
                  Em Formação
                </option>
                <option value="Inativo" className="text-black">
                  Inativo
                </option>
                <option value="Aposentado" className="text-black">
                  Aposentado
                </option>
                <option value="Licença" className="text-black">
                  Licença
                </option>
                <option value="Reformado" className="text-red-600 font-bold">
                  Reformado
                </option>
                <option value="Transferido" className="text-red-600 font-bold">
                  Transferido
                </option>
                <option value="Falecido" className="text-red-600 font-bold">
                  Falecido
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-black border-b border-black mb-1 text-red-600">
                Estado De Mandato
              </label>
              <select
                className="w-full py-1 px-0 outline-none focus:ring-0 text-base bg-transparent appearance-none font-bold text-red-600"
                value={estadoMandato}
                onChange={handleEstadoMandatoChange}
              >
                <option value="Em Atividade">Em Atividade</option>
                <option value="Cessado">Cessado</option>
                <option value="Despromovido">Despromovido</option>
              </select>
            </div>
          </div>

          {renderPagination()}
        </div>
      </div>
    </div>
  );
}

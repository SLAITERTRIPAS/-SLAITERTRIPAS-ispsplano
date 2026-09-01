import { printElementById } from "../../lib/printUtils";
import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  GraduationCap,
  School,
  Globe,
  Calendar,
  Clock,
  ArrowLeft,
  Save,
  Trash2,
  User,
  Filter,
  Download,
  FileText,
  Printer,
  DownloadCloud,
  CheckCircle2,
  UserCheck,
  X,
  Pen,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import FormularioFormacaoImpressao from "../bloco6_documentos/FormularioFormacaoImpressao";
import { EFETIVO_GERAL_DATA } from "../../constants/colaboradoresList";
import { mergeColaboradores } from "../../lib/utils";
import { firestoreService } from "../../lib/firestoreService";

interface FormacaoColaborador {
  id: string;
  // 1. Dados do Colaborador
  colaboradorId?: string;
  nome: string;
  cargo: string;
  departamento: string;
  dataAdmissao: string;
  email: string;
  telefone: string;

  // 2. Dados da Formação
  tipoFormacao: "Presencial (Local)" | "Online (EAD)";
  localizacao: "No País" | "Fora do País";
  curso: string;
  universidade: string;
  paisCidade: string;
  dataInicio: string;
  dataTermino: string;
  cargaHoraria: string;
  horarioTrabalho: "Sim" | "Não";

  // 3. Justificativa e Objetivos
  objetivoFormacao: string;
  beneficioTrabalho: string;

  // 4. Custos e Necessidades
  custoInscricao: string;
  custoViagem: string;
  ajudaCusto: "Sim" | "Não";

  status: "Em Curso" | "Concluído" | "Suspenso";
}

export default function GestaoFormacaoView({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<"list" | "new">("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLocal, setFilterLocal] = useState<
    "Todos" | "No País" | "Fora do País"
  >("Todos");

  const [formacoes, setFormacoes] = useState<FormacaoColaborador[]>([]);
  const [dbColaboradores, setDbColaboradores] = useState<any[]>([]);
  const [allColaboradores, setAllColaboradores] = useState<any[]>([]);

  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedColabIds, setSelectedColabIds] = useState<string[]>([]);
  const [importSearchTerm, setImportSearchTerm] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  const [newFormacao, setNewFormacao] = useState<Partial<FormacaoColaborador>>({
    localizacao: "No País",
    status: "Em Curso",
    tipoFormacao: "Presencial (Local)",
    horarioTrabalho: "Não",
    ajudaCusto: "Não",
  });

  const [printFormacao, setPrintFormacao] =
    useState<Partial<FormacaoColaborador> | null>(null);
  const [searchIdNuit, setSearchIdNuit] = useState("");

  // 1. Carregar Formações do Firestore em tempo real
  useEffect(() => {
    const unsub = firestoreService.colaboradores_formacao.subscribe(
      (data: any) => {
        setFormacoes(data || []);
      },
    );
    return () => unsub();
  }, []);

  // 2. Carregar Colaboradores do Firestore em tempo real
  useEffect(() => {
    const unsubColabs = firestoreService.colaboradores.subscribe((cols) => {
      setDbColaboradores(cols || []);
    });
    return () => unsubColabs();
  }, []);

  // 3. Unificar dados de colaboradores estáticos e Firestore
  useEffect(() => {
    const merged = mergeColaboradores(dbColaboradores);
    setAllColaboradores(merged);
  }, [dbColaboradores]);

  // Função para mostrar aviso temporário
  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Importar automaticamente colaboradores que já possuem estado 'Em Formação' no sistema
  const handleAutoImportEmFormacao = async () => {
    const emFormacaoList = allColaboradores.filter(
      (c) =>
        c.estado === "Em Formação" ||
        c.estadoForaSongo === "Em Formação" ||
        c.situacao === "Em Formação" ||
        c.emFormacao === true,
    );

    if (emFormacaoList.length === 0) {
      showNotice(
        'Nenhum colaborador no quadro geral possui estado marcado como "Em Formação". Utilize a importação manual para selecionar colaboradores.',
      );
      setShowImportModal(true);
      return;
    }

    let importedCount = 0;
    for (const c of emFormacaoList) {
      const alreadyExists = formacoes.some(
        (f) =>
          (f.colaboradorId && f.colaboradorId === c.id) ||
          f.nome?.toLowerCase() === c.nome?.toLowerCase(),
      );

      if (!alreadyExists) {
        const newRecord: FormacaoColaborador = {
          id: c.id || Math.random().toString(36).substr(2, 9),
          colaboradorId: c.id,
          nome: c.nome || "",
          cargo: c.cargo || c.carreira || "Colaborador",
          departamento: c.departamento || c.direcao || c.unidade || "",
          dataAdmissao: c.dataAdmissao || "",
          email: c.email || "",
          telefone: c.telefone || c.contacto || "",
          tipoFormacao: "Presencial (Local)",
          localizacao: "No País",
          curso: c.curso || "Formação Académica/Profissional",
          universidade: c.universidade || c.instituicao || "Não Especificada",
          paisCidade: c.paisCidade || "Moçambique",
          dataInicio: new Date().toISOString().split("T")[0],
          dataTermino: "",
          cargaHoraria: "",
          horarioTrabalho: "Não",
          objetivoFormacao:
            "Melhoria de competências profissionais e académicas no âmbito do plano de desenvolvimento.",
          beneficioTrabalho:
            "Aumento do rendimento institucional e aperfeiçoamento técnico-pedagógico.",
          custoInscricao: "",
          custoViagem: "",
          ajudaCusto: "Não",
          status: "Em Curso",
        };

        await firestoreService.colaboradores_formacao.set(
          newRecord.id,
          newRecord,
        );
        importedCount++;
      }
    }

    if (importedCount > 0) {
      showNotice(
        `Sucesso! ${importedCount} colaborador(es) em formação foram importados do Quadro Geral.`,
      );
    } else {
      showNotice(
        'Todos os colaboradores marcados como "Em Formação" já foram previamente importados.',
      );
    }
  };

  // Importação manual de colaboradores selecionados
  const handleImportSelected = async () => {
    if (selectedColabIds.length === 0) return;

    let imported = 0;
    for (const id of selectedColabIds) {
      const c = allColaboradores.find((col) => col.id === id);
      if (!c) continue;

      const alreadyExists = formacoes.some(
        (f) =>
          (f.colaboradorId && f.colaboradorId === c.id) ||
          f.nome?.toLowerCase() === c.nome?.toLowerCase(),
      );

      if (!alreadyExists) {
        const newRecord: FormacaoColaborador = {
          id: c.id || Math.random().toString(36).substr(2, 9),
          colaboradorId: c.id,
          nome: c.nome || "",
          cargo: c.cargo || c.carreira || "Colaborador",
          departamento: c.departamento || c.direcao || c.unidade || "",
          dataAdmissao: c.dataAdmissao || "",
          email: c.email || "",
          telefone: c.telefone || c.contacto || "",
          tipoFormacao: "Presencial (Local)",
          localizacao: "No País",
          curso: c.curso || "Formação Académica/Profissional",
          universidade: c.universidade || c.instituicao || "Não Especificada",
          paisCidade: c.paisCidade || "Moçambique",
          dataInicio: new Date().toISOString().split("T")[0],
          dataTermino: "",
          cargaHoraria: "",
          horarioTrabalho: "Não",
          objetivoFormacao:
            "Formação académica/profissional do quadro de pessoal.",
          beneficioTrabalho: "Capacitação institucional.",
          custoInscricao: "",
          custoViagem: "",
          ajudaCusto: "Não",
          status: "Em Curso",
        };

        // Salvar formulário de formação
        await firestoreService.colaboradores_formacao.set(
          newRecord.id,
          newRecord,
        );

        // Atualizar estado do colaborador no Firestore para 'Em Formação'
        if (c.id) {
          try {
            await firestoreService.colaboradores.update(c.id, {
              estado: "Em Formação",
              estadoForaSongo: "Em Formação",
              emFormacao: true,
            });
          } catch (err) {}
        }
        imported++;
      }
    }

    setShowImportModal(false);
    setSelectedColabIds([]);
    showNotice(
      `${imported} colaborador(es) importado(s) com sucesso para a Gestão de Formação!`,
    );
  };

  const handleIdNuitSearch = (value: string) => {
    setSearchIdNuit(value);
    const upperVal = value.toUpperCase().trim();
    if (upperVal.length > 0) {
      const found = allColaboradores.find(
        (c) =>
          (c.id && c.id.toUpperCase() === upperVal) ||
          (c.numeroProcesso && c.numeroProcesso.toUpperCase() === upperVal) ||
          (c.nuit && c.nuit === value) ||
          (c.nome && c.nome.toUpperCase().includes(upperVal)),
      );
      if (found) {
        setNewFormacao((prev) => ({
          ...prev,
          colaboradorId: found.id,
          nome: found.nome,
          cargo: found.cargo || found.carreira,
          departamento: found.departamento || found.direcao || found.unidade,
          email: found.email || "",
          telefone: found.telefone || found.contacto || "",
          dataAdmissao: found.dataAdmissao || "",
        }));
        showNotice(`Colaborador "${found.nome}" localizado e preenchido!`);
      } else {
        showNotice("Nenhum colaborador localizado com esse ID, NUIT ou Nome.");
      }
    }
  };

  const handlePrint = (formacao?: Partial<FormacaoColaborador>) => {
    setPrintFormacao(formacao || {});
    setTimeout(() => {
      printElementById("print-area");
      window.addEventListener("afterprint", () => setPrintFormacao(null), {
        once: true,
      });
    }, 100);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = newFormacao.id || Math.random().toString(36).substr(2, 9);
    const recordToSave: FormacaoColaborador = {
      ...newFormacao,
      id,
    } as FormacaoColaborador;

    await firestoreService.colaboradores_formacao.set(id, recordToSave);

    // Se o colaborador existir na base de dados, atualiza seu estado para 'Em Formação'
    if (newFormacao.colaboradorId) {
      try {
        await firestoreService.colaboradores.update(newFormacao.colaboradorId, {
          estado: "Em Formação",
          estadoForaSongo: "Em Formação",
          emFormacao: true,
        });
      } catch (err) {}
    }

    setMode("list");
    setNewFormacao({
      localizacao: "No País",
      status: "Em Curso",
      tipoFormacao: "Presencial (Local)",
      horarioTrabalho: "Não",
      ajudaCusto: "Não",
    });
    showNotice("Registo de formação guardado com sucesso!");
  };

  const handleDelete = async (idToDelete: string) => {
    if (
      window.confirm("Tem certeza que deseja remover este registo de formação?")
    ) {
      await firestoreService.colaboradores_formacao.delete(idToDelete);
      showNotice("Registo removido com sucesso.");
    }
  };

  const filteredFormacoes = formacoes.filter((f) => {
    const matchesSearch =
      f.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.curso?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.universidade?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterLocal === "Todos" || f.localizacao === filterLocal;
    return matchesSearch && matchesFilter;
  });

  const handleDownloadList = () => {
    let content =
      "Nome;Cargo;Departamento;Curso;Instituicao/Universidade;Pais/Cidade;Localizacao;Status;Data Inicio;Data Termino\n";
    filteredFormacoes.forEach((f) => {
      content += `"${f.nome || ""}";"${f.cargo || ""}";"${f.departamento || ""}";"${f.curso || ""}";"${f.universidade || ""}";"${f.paisCidade || ""}";"${f.localizacao || ""}";"${f.status || ""}";"${f.dataInicio || ""}";"${f.dataTermino || ""}"\n`;
    });

    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), content], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Lista_Formacao_Colaboradores_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (printFormacao) {
    return <FormularioFormacaoImpressao colaboracao={printFormacao} />;
  }

  const modalFilteredColabs = allColaboradores.filter((c) => {
    if (!importSearchTerm) return true;
    const term = importSearchTerm.toLowerCase();
    return (
      (c.nome || "").toLowerCase().includes(term) ||
      (c.id || "").toLowerCase().includes(term) ||
      (c.nuit || "").toLowerCase().includes(term) ||
      (c.cargo || "").toLowerCase().includes(term) ||
      (c.unidade || c.departamento || c.direcao || "")
        .toLowerCase()
        .includes(term)
    );
  });

  return (
      <div className="w-full h-full flex flex-col bg-gray-50 print:hidden relative">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-bounce">
          <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      <header className="bg-white border-b border-gray-100 p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (mode === "new") {
                setMode("list");
                setNewFormacao({
                  localizacao: "No País",
                  tipoFormacao: "Presencial (Local)",
                  horarioTrabalho: "Não",
                  ajudaCusto: "Não",
                });
              } else {
                onBack();
              }
            }}
            className="p-2.5 bg-gray-100 rounded-xl hover:bg-gray-200 active:scale-95 touch-manipulation transition-all"
            title="Voltar"
          >
            <ArrowLeft size={18} className="text-gray-700" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-blue-900 font-serif tracking-tight">
              Gestão de Formação
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 font-serif italic">
              Controlo e acompanhamento de pessoal em formação académica e
              profissional
            </p>
          </div>
        </div>

        {mode === "list" && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleAutoImportEmFormacao}
              className="flex-1 sm:flex-none bg-amber-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-amber-700 active:scale-95 touch-manipulation transition-all shadow-md"
              title="Importar automaticamente colaboradores com estado em formação"
            >
              <DownloadCloud size={18} />
              <span>Importar em Formação</span>
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex-1 sm:flex-none bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 touch-manipulation transition-all shadow-md"
              title="Selecionar colaboradores do quadro para formação"
            >
              <UserCheck size={18} />
              <span>Importar do Quadro</span>
            </button>
            <button
              onClick={() => {
                setNewFormacao({
                  localizacao: "No País",
                  tipoFormacao: "Presencial (Local)",
                  horarioTrabalho: "Não",
                  ajudaCusto: "Não",
                });
                setMode("new");
              }}
              className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 touch-manipulation transition-all shadow-md"
            >
              <Plus size={18} />
              <span>Novo</span>
            </button>
          </div>
        )}
      </header>

      <main className="flex-grow overflow-auto p-4 sm:p-8">
        <AnimatePresence mode="wait">
          {mode === "list" ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Resumo Métricas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold  text-gray-400 tracking-wider">
                      Total em Formação
                    </span>
                    <h3 className="text-2xl font-black text-blue-900 mt-1">
                      {formacoes.length}
                    </h3>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <GraduationCap size={24} />
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold  text-gray-400 tracking-wider">
                      No País
                    </span>
                    <h3 className="text-2xl font-black text-emerald-600 mt-1">
                      {
                        formacoes.filter((f) => f.localizacao === "No País")
                          .length
                      }
                    </h3>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <School size={24} />
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold  text-gray-400 tracking-wider">
                      Fora do País
                    </span>
                    <h3 className="text-2xl font-black text-purple-600 mt-1">
                      {
                        formacoes.filter(
                          (f) => f.localizacao === "Fora do País",
                        ).length
                      }
                    </h3>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <Globe size={24} />
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Procurar por nome, curso ou universidade..."
                    className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full md:w-auto justify-between sm:justify-end">
                  <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
                    {["Todos", "No País", "Fora do País"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setFilterLocal(opt as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterLocal === opt ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => handlePrint()}
                    title="Imprimir Formulário em Branco"
                    className="px-3.5 py-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 hover:bg-blue-100 transition-all flex items-center gap-2 font-bold text-xs sm:text-sm"
                  >
                    <Printer size={16} />
                    <span className="hidden sm:inline">Modelo</span>
                  </button>
                  <button
                    onClick={handleDownloadList}
                    title="Descarregar lista em CSV"
                    className="p-2.5 bg-gray-100 text-gray-600 rounded-xl border border-gray-200 hover:bg-gray-200 hover:text-blue-600 transition-all"
                  >
                    <Download size={18} />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {filteredFormacoes.length > 0 ? (
                  filteredFormacoes.map((f) => (
                    <div
                      key={f.id}
                      className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 group"
                    >
                      <div className="flex items-start sm:items-center gap-4 sm:gap-6">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center flex-none group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <GraduationCap size={28} className="sm:w-8 sm:h-8" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-base sm:text-lg font-bold text-gray-900">
                            {f.nome}
                          </h4>
                          <p className="text-xs text-gray-500 font-semibold">
                            {f.cargo}{" "}
                            {f.departamento ? `• ${f.departamento}` : ""}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 mt-1">
                            <div className="flex items-center gap-1.5 font-bold text-blue-900">
                              <School size={14} className="text-blue-500" />
                              <span>{f.curso || "Curso N/D"}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Globe size={14} className="text-blue-500" />
                              <span>
                                {f.universidade || "Instituição N/D"}{" "}
                                {f.paisCidade ? `(${f.paisCidade})` : ""}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${f.localizacao === "No País" ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"}`}
                            >
                              {f.localizacao}
                            </span>
                            <span className="text-[10px] bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full font-bold">
                              {f.status || "Em Curso"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-4 sm:gap-8 flex-none w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0">
                        <div className="flex flex-col items-start md:items-center gap-0.5">
                          <span className="text-[10px] font-bold text-gray-400 ">
                            Início
                          </span>
                          <div className="flex items-center gap-1.5 text-gray-700 font-bold text-xs">
                            <Calendar size={14} className="text-blue-500" />
                            {f.dataInicio || "N/D"}
                          </div>
                        </div>
                        <div className="flex flex-col items-start md:items-center gap-0.5">
                          <span className="text-[10px] font-bold text-gray-400 ">
                            Previsão
                          </span>
                          <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs">
                            <Clock size={14} />
                            {f.dataTermino || "Em Curso"}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setNewFormacao(f);
                              setMode("new");
                            }}
                            className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                            title="Editar registo"
                          >
                            <Pen size={18} />
                          </button>
                          <button
                            onClick={() => handlePrint(f)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            title="Imprimir Formulário Preenchido"
                          >
                            <FileText size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(f.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title="Eliminar registo"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200 space-y-3">
                    <GraduationCap
                      size={48}
                      className="mx-auto text-gray-300"
                    />
                    <p className="text-gray-500 font-bold text-sm">
                      Nenhum colaborador encontrado na lista de formação.
                    </p>
                    <p className="text-xs text-gray-400 max-w-md mx-auto">
                      Clique no botão "Importar em Formação" para detetar
                      colaboradores do quadro com estado em formação, ou
                      selecione colaboradores manualmente.
                    </p>
                    <button
                      onClick={handleAutoImportEmFormacao}
                      className="mt-2 inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-700 transition-all shadow-md"
                    >
                      <DownloadCloud size={16} /> Importar do Quadro Geral
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="new"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-3xl mx-auto"
            >
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-6 sm:p-8 bg-blue-900 text-white">
                  <h3 className="text-xl sm:text-2xl font-black flex items-center gap-3">
                    {newFormacao.id ? <Pen size={24} /> : <Plus size={24} />}
                    {newFormacao.id
                      ? "Editar Registo de Formação"
                      : "Registar Novo Colaborador em Formação"}
                  </h3>
                  <p className="text-blue-200 mt-1 text-xs sm:text-sm">
                    Preencha os dados académicos e profissionais do colaborador.
                  </p>
                </div>

                <form onSubmit={handleSave} className="p-6 sm:p-10 space-y-8">
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-4">
                      <h4 className="text-base font-bold text-gray-800">
                        1. Identificação do Colaborador
                      </h4>
                      <div className="w-full md:w-80 flex gap-2">
                        <div className="relative flex-1">
                          <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            size={16}
                          />
                          <input
                            type="text"
                            placeholder="Pesquisar ID, NUIT ou Nome"
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-xs font-semibold text-gray-800"
                            value={searchIdNuit}
                            onChange={(e) => setSearchIdNuit(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" &&
                              (e.preventDefault(),
                              handleIdNuitSearch(searchIdNuit))
                            }
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleIdNuitSearch(searchIdNuit)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
                        >
                          Auto-Preencher
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700">
                          Nome Completo
                        </label>
                        <input
                          required
                          type="text"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                          value={newFormacao.nome || ""}
                          onChange={(e) =>
                            setNewFormacao({
                              ...newFormacao,
                              nome: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700">
                          Cargo / Função
                        </label>
                        <input
                          required
                          type="text"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                          value={newFormacao.cargo || ""}
                          onChange={(e) =>
                            setNewFormacao({
                              ...newFormacao,
                              cargo: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700">
                          Departamento / Setor / Unidade
                        </label>
                        <input
                          required
                          type="text"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                          value={newFormacao.departamento || ""}
                          onChange={(e) =>
                            setNewFormacao({
                              ...newFormacao,
                              departamento: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700">
                          Data de Admissão
                        </label>
                        <input
                          type="date"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                          value={newFormacao.dataAdmissao || ""}
                          onChange={(e) =>
                            setNewFormacao({
                              ...newFormacao,
                              dataAdmissao: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700">
                          Email Corporativo
                        </label>
                        <input
                          type="email"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                          value={newFormacao.email || ""}
                          onChange={(e) =>
                            setNewFormacao({
                              ...newFormacao,
                              email: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700">
                          Telefone
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                          value={newFormacao.telefone || ""}
                          onChange={(e) =>
                            setNewFormacao({
                              ...newFormacao,
                              telefone: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <h4 className="text-base font-bold text-gray-800 border-b pb-2 pt-4">
                      2. Dados da Formação
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700">
                          Tipo de Formação
                        </label>
                        <select
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                          value={newFormacao.tipoFormacao}
                          onChange={(e) =>
                            setNewFormacao({
                              ...newFormacao,
                              tipoFormacao: e.target.value as any,
                            })
                          }
                        >
                          <option value="Presencial (Local)">
                            Presencial (Local)
                          </option>
                          <option value="Online (EAD)">Online (EAD)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700">
                          Localização
                        </label>
                        <select
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                          value={newFormacao.localizacao}
                          onChange={(e) =>
                            setNewFormacao({
                              ...newFormacao,
                              localizacao: e.target.value as any,
                            })
                          }
                        >
                          <option value="No País">No País</option>
                          <option value="Fora do País">Fora do País</option>
                        </select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold text-gray-700">
                          Nome do Curso / Evento de Formação
                        </label>
                        <input
                          required
                          type="text"
                          placeholder="Ex: Mestrado em Gestão Pública, Doutoramento em Informática..."
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                          value={newFormacao.curso || ""}
                          onChange={(e) =>
                            setNewFormacao({
                              ...newFormacao,
                              curso: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700">
                          Instituição / Entidade Promotora
                        </label>
                        <input
                          required
                          type="text"
                          placeholder="Ex: Universidade Eduardo Mondlane, UEM, UP..."
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                          value={newFormacao.universidade || ""}
                          onChange={(e) =>
                            setNewFormacao({
                              ...newFormacao,
                              universidade: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700">
                          País e Cidade da Formação
                        </label>
                        <input
                          required
                          type="text"
                          placeholder="Ex: Moçambique, Maputo / Portugal, Lisboa"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                          value={newFormacao.paisCidade || ""}
                          onChange={(e) =>
                            setNewFormacao({
                              ...newFormacao,
                              paisCidade: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700">
                          Data de Início
                        </label>
                        <input
                          required
                          type="date"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                          value={newFormacao.dataInicio || ""}
                          onChange={(e) =>
                            setNewFormacao({
                              ...newFormacao,
                              dataInicio: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700">
                          Previsão de Término
                        </label>
                        <input
                          required
                          type="date"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                          value={newFormacao.dataTermino || ""}
                          onChange={(e) =>
                            setNewFormacao({
                              ...newFormacao,
                              dataTermino: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700">
                          Carga Horária Total (Horas)
                        </label>
                        <input
                          type="number"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                          value={newFormacao.cargaHoraria || ""}
                          onChange={(e) =>
                            setNewFormacao({
                              ...newFormacao,
                              cargaHoraria: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700">
                          A formação ocorre no horário de trabalho?
                        </label>
                        <select
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                          value={newFormacao.horarioTrabalho}
                          onChange={(e) =>
                            setNewFormacao({
                              ...newFormacao,
                              horarioTrabalho: e.target.value as any,
                            })
                          }
                        >
                          <option value="Sim">Sim</option>
                          <option value="Não">Não</option>
                        </select>
                      </div>
                    </div>

                    <h4 className="text-base font-bold text-gray-800 border-b pb-2 pt-4">
                      3. Justificativa e Objetivos
                    </h4>
                    <div className="grid grid-cols-1 gap-4 sm:gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700">
                          Objetivo da Formação (O que será aprendido?)
                        </label>
                        <textarea
                          rows={3}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                          value={newFormacao.objetivoFormacao || ""}
                          onChange={(e) =>
                            setNewFormacao({
                              ...newFormacao,
                              objetivoFormacao: e.target.value,
                            })
                          }
                        ></textarea>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700">
                          Como este curso beneficiará o seu trabalho e a
                          organização?
                        </label>
                        <textarea
                          rows={3}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                          value={newFormacao.beneficioTrabalho || ""}
                          onChange={(e) =>
                            setNewFormacao({
                              ...newFormacao,
                              beneficioTrabalho: e.target.value,
                            })
                          }
                        ></textarea>
                      </div>
                    </div>

                    <h4 className="text-base font-bold text-gray-800 border-b pb-2 pt-4">
                      4. Custos e Necessidades
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700">
                          Custo da Inscrição (MT/$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                          value={newFormacao.custoInscricao || ""}
                          onChange={(e) =>
                            setNewFormacao({
                              ...newFormacao,
                              custoInscricao: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700">
                          Custo Estimado de Viagem (MT/$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                          value={newFormacao.custoViagem || ""}
                          onChange={(e) =>
                            setNewFormacao({
                              ...newFormacao,
                              custoViagem: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold text-gray-700">
                          Solicita ajuda de custo / subsídio?
                        </label>
                        <select
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                          value={newFormacao.ajudaCusto}
                          onChange={(e) =>
                            setNewFormacao({
                              ...newFormacao,
                              ajudaCusto: e.target.value as any,
                            })
                          }
                        >
                          <option value="Sim">Sim</option>
                          <option value="Não">Não</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 flex gap-4">
                    <button
                      type="button"
                      onClick={() => setMode("list")}
                      className="flex-1 py-3.5 rounded-2xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all text-xs sm:text-sm"
                    >
                      CANCELAR
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 text-xs sm:text-sm"
                    >
                      <Save size={18} />
                      <span>GUARDAR REGISTO</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modal de Importação Manual de Colaboradores do Quadro */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-black font-serif flex items-center gap-2">
                  <UserCheck size={22} className="text-blue-400" />
                  Importar Colaboradores para Formação
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Selecione colaboradores do quadro geral da instituição para
                  adicionar ao controlo de formação.
                </p>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Pesquisar por nome, NUIT, ID ou departamento..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={importSearchTerm}
                  onChange={(e) => setImportSearchTerm(e.target.value)}
                />
              </div>
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
                {modalFilteredColabs.length} colaborador(es)
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {modalFilteredColabs.length > 0 ? (
                modalFilteredColabs.map((col) => {
                  const isChecked = selectedColabIds.includes(col.id);
                  const isAlreadyInFormacao = formacoes.some(
                    (f) =>
                      (f.colaboradorId && f.colaboradorId === col.id) ||
                      f.nome?.toLowerCase() === col.nome?.toLowerCase(),
                  );

                  return (
                    <div
                      key={col.id}
                      onClick={() => {
                        if (isAlreadyInFormacao) return;
                        setSelectedColabIds((prev) =>
                          isChecked
                            ? prev.filter((i) => i !== col.id)
                            : [...prev, col.id],
                        );
                      }}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-4 transition-all cursor-pointer ${
                        isAlreadyInFormacao
                          ? "bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed"
                          : isChecked
                            ? "bg-blue-50/80 border-blue-400 shadow-sm"
                            : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked || isAlreadyInFormacao}
                          disabled={isAlreadyInFormacao}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 shrink-0"
                        />
                        <div className="min-w-0">
                          <h5 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {col.nome}
                          </h5>
                          <p className="text-[11px] text-slate-500 font-medium truncate">
                            {col.cargo || col.carreira}{" "}
                            {col.unidade || col.departamento
                              ? `• ${col.unidade || col.departamento}`
                              : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isAlreadyInFormacao ? (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
                            Já na Lista
                          </span>
                        ) : col.estado === "Em Formação" ? (
                          <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full">
                            Estado: Em Formação
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                            {col.estado || "Ativo"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-slate-400 text-xs font-bold">
                  Nenhum colaborador encontrado para o termo pesquisado.
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-600">
                {selectedColabIds.length} selecionado(s)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleImportSelected}
                  disabled={selectedColabIds.length === 0}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                >
                  Importar Selecionados ({selectedColabIds.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

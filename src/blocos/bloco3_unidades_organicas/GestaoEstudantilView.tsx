import { printElementById } from "../../lib/printUtils";
import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Users,
  FileText,
  Search,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  GraduationCap,
  Send,
  Layers,
  Printer,
  FileCheck,
  Filter,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { firestoreService } from "../../lib/firestoreService";
import { isSuperBossUser } from "../../lib/auth";

interface AtendimentoEstudantil {
  id?: string;
  estudanteNome: string;
  raCodigo: string;
  curso: string;
  categoriaServico:
    | "Declaração de Frequência"
    | "Certificado de Notas"
    | "Reintegração/Matrícula"
    | "Reclamação de Nota"
    | "Pedido de Isenção"
    | "Outro";
  urgencia: "Alta" | "Média" | "Baixa";
  status: "Pendente" | "Em Processamento" | "Concluído";
  descricao: string;
  dataCriacao?: string;
  observacoes?: string;
}

export default function GestaoEstudantilView({
  user,
  onBack,
  title = "Gestão Estudantil",
}: {
  user?: any;
  onBack: () => void;
  title?: string;
}) {
  const isAdmin = isSuperBossUser(user);
  const [atendimentos, setAtendimentos] = useState<AtendimentoEstudantil[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("Todos");
  const [filterStatus, setFilterStatus] = useState<string>("Todos");
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [estudanteNome, setEstudanteNome] = useState("");
  const [raCodigo, setRaCodigo] = useState("");
  const [curso, setCurso] = useState("Engenharia Termotécnica");
  const [categoriaServico, setCategoriaServico] = useState<
    AtendimentoEstudantil["categoriaServico"]
  >("Declaração de Frequência");
  const [urgencia, setUrgencia] =
    useState<AtendimentoEstudantil["urgencia"]>("Média");
  const [descricao, setDescricao] = useState("");
  const [observacoes, setObservacoes] = useState("");

  // Selected for inspection / printing
  const [selectedAtendimento, setSelectedAtendimento] =
    useState<AtendimentoEstudantil | null>(null);

  useEffect(() => {
    const unsubscribe = firestoreService.atendimentos_estudantis.subscribe(
      async (data: any[]) => {
        setAtendimentos(data);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!estudanteNome || !raCodigo || !descricao) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setIsSubmitting(true);
    const payload: AtendimentoEstudantil = {
      estudanteNome,
      raCodigo,
      curso,
      categoriaServico,
      urgencia,
      status: "Pendente",
      descricao,
      observacoes,
      dataCriacao: new Date().toISOString().split("T")[0],
    };

    try {
      await firestoreService.atendimentos_estudantis.add(payload);
      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error("Erro ao registar atendimento:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEstudanteNome("");
    setRaCodigo("");
    setCurso("Engenharia Termotécnica");
    setCategoriaServico("Declaração de Frequência");
    setUrgencia("Média");
    setDescricao("");
    setObservacoes("");
  };

  const handleUpdateStatus = async (
    id: string,
    newStatus: AtendimentoEstudantil["status"],
  ) => {
    try {
      await firestoreService.atendimentos_estudantis.update(id, {
        status: newStatus,
      });
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "Tem a certeza que deseja excluir este registo de atendimento?",
      )
    ) {
      return;
    }
    try {
      await firestoreService.atendimentos_estudantis.delete(id);
    } catch (err) {
      console.error("Erro ao eliminar atendimento:", err);
    }
  };

  // Filtering Logic
  const filtered = atendimentos.filter((a) => {
    const matchesSearch =
      a.estudanteNome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.raCodigo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.descricao.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      filterCategory === "Todos" || a.categoriaServico === filterCategory;
    const matchesStatus = filterStatus === "Todos" || a.status === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getUrgencyBadge = (urg: AtendimentoEstudantil["urgencia"]) => {
    switch (urg) {
      case "Alta":
        return (
          <span className="bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full text-[10px] font-black  tracking-wider">
            Alta
          </span>
        );
      case "Média":
        return (
          <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-[10px] font-black  tracking-wider">
            Média
          </span>
        );
      case "Baixa":
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-black  tracking-wider">
            Baixa
          </span>
        );
    }
  };

  const getStatusBadge = (st: AtendimentoEstudantil["status"]) => {
    switch (st) {
      case "Pendente":
        return (
          <span className="flex items-center gap-1.5 text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1 rounded-full font-extrabold text-xs">
            <Clock size={14} className="animate-pulse" /> Pendente
          </span>
        );
      case "Em Processamento":
        return (
          <span className="flex items-center gap-1.5 text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full font-extrabold text-xs">
            <RefreshCw
              size={14}
              className="animate-spin text-blue-500 duration-1000"
            />{" "}
            Processando
          </span>
        );
      case "Concluído":
        return (
          <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full font-extrabold text-xs">
            <CheckCircle size={14} /> Concluído
          </span>
        );
    }
  };

  return (
      <div className="w-full h-full flex flex-col p-6 overflow-y-auto scrollbar bg-slate-50/50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl shadow-sm transition-all text-sm font-bold flex items-center justify-center.active:scale-95"
            title="Voltar"
          >
            <ArrowLeft size={16} className="-translate-x-0.5" />
          </button>
          <div className="w-px h-8 bg-slate-200"></div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <GraduationCap size={26} className="text-blue-600" />
              Gestão Estudantil
            </h1>
            <p className="text-xs text-slate-500 font-semibold tracking-wider mt-0.5">
              Atendimento ao Aluno & Requerimentos
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3.5 rounded-2xl font-bold hover:shadow-lg hover:shadow-blue-200 transition-all text-xs"
        >
          {showForm ? <ArrowLeft size={16} /> : <Plus size={16} />}
          {showForm ? "Voltar aos Atendimentos" : "Novo Requerimento"}
        </button>
      </div>

      {loading ? (
        <div className="flex-grow flex items-center justify-center py-20 flex-col gap-3">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-2 border-slate-200 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <span className="text-slate-500 font-bold text-sm">
            A carregar registos estudantis...
          </span>
        </div>
      ) : showForm ? (
        /* Requerimento Registration Form */
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-2xl mx-auto w-full"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <FileCheck size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-tight">
                Novo Requerimento de Estudante
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Preencha os detalhes para abrir uma nova ocorrência de
                atendimento.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600  tracking-wider mb-2">
                  Nome Completo do Estudante *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome do aluno"
                  value={estudanteNome}
                  onChange={(e) => setEstudanteNome(e.target.value)}
                  className="w-full text-sm font-bold text-slate-800 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600  tracking-wider mb-2">
                  Código Siga/RA *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Songo-2024-XXX"
                  value={raCodigo}
                  onChange={(e) => setRaCodigo(e.target.value)}
                  className="w-full text-sm font-bold text-slate-800 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600  tracking-wider mb-2">
                  Curso Académico
                </label>
                <select
                  value={curso}
                  onChange={(e) => setCurso(e.target.value)}
                  className="w-full text-sm font-bold text-slate-800 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                >
                  <option value="Engenharia Termotécnica">
                    Engenharia Termotécnica
                  </option>
                  <option value="Engenharia de Electricidade Industrial">
                    Engenharia de Electricidade Industrial
                  </option>
                  <option value="Engenharia Termotecnia">
                    Engenharia Termotecnia
                  </option>
                  <option value="Engenharia Agro-processamento">
                    Engenharia Agro-processamento
                  </option>
                  <option value="Engenharia de Hidráulica">
                    Engenharia de Hidráulica
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600  tracking-wider mb-2">
                  Serviço/Requerimento *
                </label>
                <select
                  value={categoriaServico}
                  onChange={(e) => setCategoriaServico(e.target.value as any)}
                  className="w-full text-sm font-bold text-slate-800 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                >
                  <option value="Declaração de Frequência">
                    Declaração de Frequência
                  </option>
                  <option value="Certificado de Notas">
                    Certificado de Notas
                  </option>
                  <option value="Reintegração/Matrícula">
                    Reintegração/Matrícula
                  </option>
                  <option value="Reclamação de Nota">Reclamação de Nota</option>
                  <option value="Pedido de Isenção">Pedido de Isenção</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600  tracking-wider mb-2">
                  Grau de Urgência
                </label>
                <div className="flex gap-2">
                  {(
                    [
                      "Baixa",
                      "Média",
                      "Alta",
                    ] as AtendimentoEstudantil["urgencia"][]
                  ).map((lvl) => (
                    <button
                      type="button"
                      key={lvl}
                      onClick={() => setUrgencia(lvl)}
                      className={`flex-1 p-2.5 rounded-xl border text-xs font-extrabold  transition-all ${
                        urgencia === lvl
                          ? lvl === "Alta"
                            ? "bg-red-500 border-red-500 text-white shadow-md"
                            : lvl === "Média"
                              ? "bg-amber-500 border-amber-500 text-white shadow-md"
                              : "bg-emerald-500 border-emerald-500 text-white shadow-md"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600  tracking-wider mb-2">
                Pedido / Descrição do Requerimento *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Descreva detalhadamente o pedido do estudante..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full text-sm font-bold text-slate-800 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600  tracking-wider mb-2">
                Observações Adicionais (Opcional)
              </label>
              <textarea
                rows={2}
                placeholder="Comentários internos ou notas de expedição..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full text-sm font-bold text-slate-800 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              />
            </div>

            <div className="pt-2 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-5 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-100 transition-colors "
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl text-xs hover:shadow-md transition-all  flex items-center gap-2"
              >
                {isSubmitting ? "A registar..." : "Salvar Registo"}
                <Send size={14} />
              </button>
            </div>
          </form>
        </motion.div>
      ) : (
        /* List dashboard view */
        <div className="flex flex-col gap-6">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Users size={24} />
              </div>
              <div>
                <span className="text-xl font-extrabold text-slate-900 block">
                  {atendimentos.length}
                </span>
                <span className="text-[10px] tracking-wider font-extrabold text-slate-400">
                  Total Ocorrências
                </span>
              </div>
            </div>

            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                <Clock size={24} className="animate-pulse" />
              </div>
              <div>
                <span className="text-xl font-extrabold text-slate-900 block">
                  {atendimentos.filter((a) => a.status === "Pendente").length}
                </span>
                <span className="text-[10px] tracking-wider font-extrabold text-slate-400">
                  Pedidos Pendentes
                </span>
              </div>
            </div>

            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <RefreshCw
                  size={24}
                  className="animate-spin duration-[4000ms]"
                />
              </div>
              <div>
                <span className="text-xl font-extrabold text-slate-900 block">
                  {
                    atendimentos.filter((a) => a.status === "Em Processamento")
                      .length
                  }
                </span>
                <span className="text-[10px] tracking-wider font-extrabold text-slate-400">
                  Em Processamento
                </span>
              </div>
            </div>

            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle size={24} />
              </div>
              <div>
                <span className="text-xl font-extrabold text-slate-900 block">
                  {atendimentos.filter((a) => a.status === "Concluído").length}
                </span>
                <span className="text-[10px] tracking-wider font-extrabold text-slate-400">
                  Concluídos
                </span>
              </div>
            </div>
          </div>

          {/* Table and Filter Bar */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            {/* Filter Bar */}
            <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search
                  className="absolute left-4 top-3.5 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Pesquisar por estudante, curso ou descrição..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                <div className="flex items-center gap-2 bg-white px-3 py-2 border border-slate-200 rounded-2xl flex-1 md:flex-initial">
                  <Filter size={15} className="text-slate-400" />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="text-[11px] font-bold text-slate-600 outline-none pr-4 bg-transparent cursor-pointer"
                  >
                    <option value="Todos">Todas Categorias</option>
                    <option value="Declaração de Frequência">
                      Declaração de Frequência
                    </option>
                    <option value="Certificado de Notas">
                      Certificado de Notas
                    </option>
                    <option value="Reintegração/Matrícula">
                      Reintegração/Matrícula
                    </option>
                    <option value="Reclamação de Nota">
                      Reclamação de Nota
                    </option>
                    <option value="Pedido de Isenção">Pedido de Isenção</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-white px-3 py-2 border border-slate-200 rounded-2xl flex-1 md:flex-initial">
                  <Layers size={15} className="text-slate-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="text-[11px] font-bold text-slate-600 outline-none pr-4 bg-transparent cursor-pointer"
                  >
                    <option value="Todos">Todos Estados</option>
                    <option value="Pendente">Pendentes</option>
                    <option value="Em Processamento">Em Processamento</option>
                    <option value="Concluído">Concluídos</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="overflow-x-auto">
              {filtered.length === 0 ? (
                <div className="text-center py-16 text-slate-400 flex flex-col items-center">
                  <FileText
                    size={48}
                    className="opacity-40 mb-3 text-slate-300 animate-bounce duration-[3000ms]"
                  />
                  <p className="font-bold text-slate-500">
                    Nenhum requerimento encontrado.
                  </p>
                  <p className="text-xs mt-1">
                    Tente ajustar os critérios de pesquisa ou filtros aplicados.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-extrabold text-[10px] tracking-wider border-b border-slate-200">
                      <th className="p-4">Estudante</th>
                      <th className="p-4">Código / RA</th>
                      <th className="p-4">Serviço Solicitado</th>
                      <th className="p-4 text-center">Urgência</th>
                      <th className="p-4">Estado</th>
                      <th className="p-4">Criado em</th>
                      <th className="p-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((att) => (
                      <tr
                        key={att.id}
                        className="hover:bg-slate-50/50 transition-colors font-bold text-xs text-slate-700"
                      >
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-900">
                              {att.estudanteNome}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {att.curso}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-slate-600 font-black">
                          {att.raCodigo}
                        </td>
                        <td className="p-4">
                          <span className="bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-1 rounded-lg text-[10px] font-extrabold ">
                            {att.categoriaServico}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {getUrgencyBadge(att.urgencia)}
                        </td>
                        <td className="p-4">{getStatusBadge(att.status)}</td>
                        <td className="p-4 text-slate-500">
                          {att.dataCriacao || "N/A"}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end items-center gap-2">
                            {/* Status Change actions */}
                            {att.status === "Pendente" && (
                              <button
                                onClick={() =>
                                  att.id &&
                                  handleUpdateStatus(att.id, "Em Processamento")
                                }
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg transition-all text-[10px] border border-blue-200"
                                title="Iniciar Processamento"
                              >
                                Processar
                              </button>
                            )}
                            {att.status === "Em Processamento" && (
                              <button
                                onClick={() =>
                                  att.id &&
                                  handleUpdateStatus(att.id, "Concluído")
                                }
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg transition-all text-[10px] border border-emerald-200"
                                title="Concluir Pedido"
                              >
                                Concluir
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedAtendimento(att)}
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                              title="Visualizar Comprovativo"
                            >
                              <Printer size={15} />
                            </button>

                            {isAdmin && (
                              <button
                                onClick={() => att.id && handleDelete(att.id)}
                                className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                                title="Eliminar Atendimento"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-[11px] text-slate-400 font-bold flex justify-between">
              <span>
                Registados {filtered.length} requerimentos filtrados de um total
                de {atendimentos.length}.
              </span>
              <span>SIGEP - Songo</span>
            </div>
          </div>
        </div>
      )}

      {/* Comprovativo / Print Modal */}
      <AnimatePresence>
        {selectedAtendimento && (
          <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-2xl max-w-lg w-full relative"
            >
              {/* Header inside modal */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-sm font-black text-slate-400  tracking-widest">
                    Recibo de Requerimento
                  </h3>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                    Comprovativo de Atendimento
                  </h2>
                </div>
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl font-mono text-[10px] font-black tracking-wider ">
                  Nº {Math.floor(100000 + Math.random() * 900000)}
                </div>
              </div>

              {/* Physical Slip Styling */}
              <div className="border border-slate-200 border-dashed rounded-2xl p-6 bg-slate-50 font-serif leading-relaxed text-slate-800 space-y-4 mb-6">
                <div className="text-center font-serif  tracking-wider font-bold text-xs pb-3 border-b border-slate-200 text-slate-900">
                  Instituto Superior Politécnico de Songo
                </div>

                <div className="grid grid-cols-2 text-xs gap-y-2 py-2">
                  <span className="font-bold font-sans text-slate-500  tracking-wider text-[9px]">
                    Estudante:
                  </span>
                  <span className="font-sans font-black text-slate-900 text-right">
                    {selectedAtendimento.estudanteNome}
                  </span>

                  <span className="font-bold font-sans text-slate-500  tracking-wider text-[9px]">
                    RA/Código Siga:
                  </span>
                  <span className="font-mono font-black text-slate-900 text-right">
                    {selectedAtendimento.raCodigo}
                  </span>

                  <span className="font-bold font-sans text-slate-500  tracking-wider text-[9px]">
                    Curso:
                  </span>
                  <span className="font-sans text-slate-700 text-right font-bold text-[11px]">
                    {selectedAtendimento.curso}
                  </span>

                  <span className="font-bold font-sans text-slate-500  tracking-wider text-[9px]">
                    Tipo do Pedido:
                  </span>
                  <span className="font-sans font-extrabold text-blue-700 text-right">
                    {selectedAtendimento.categoriaServico}
                  </span>

                  <span className="font-bold font-sans text-slate-500  tracking-wider text-[9px]">
                    Prioridade:
                  </span>
                  <span className="font-sans text-right">
                    {selectedAtendimento.urgencia}
                  </span>

                  <span className="font-bold font-sans text-slate-500  tracking-wider text-[9px]">
                    Data de Entrada:
                  </span>
                  <span className="font-sans text-right">
                    {selectedAtendimento.dataCriacao || "Recorrente"}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex flex-col text-xs font-sans">
                  <span className="font-bold text-slate-500  tracking-wider text-[9px] mb-1">
                    Descrição do Requerimento:
                  </span>
                  <p className="bg-white p-3 border border-slate-200 rounded-xl font-medium text-slate-600 text-xs italic">
                    "{selectedAtendimento.descricao}"
                  </p>
                </div>

                <div className="pt-4 flex flex-col text-center border-t border-slate-200 text-[10px] text-slate-400 font-sans">
                  <span>Assinatura do Atendente</span>
                  <div className="h-6 border-b border-slate-300 w-40 mx-auto my-2"></div>
                  <span>
                    Repartição de Assuntos Estudantis e Registo Académico
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedAtendimento(null)}
                  className="flex-1 px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs "
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    printElementById("print-area");
                  }}
                  className="flex-1 px-5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs  flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                >
                  <Printer size={15} /> Imprimir Comprovativo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  ArrowLeft,
  GraduationCap,
  Building2,
  MapPin,
  Mail,
  Hash,
  BookOpen,
  Trash2,
  UserPlus2,
} from "lucide-react";
import { EFETIVO_GERAL_DATA } from "../../constants/colaboradoresList";
import {
  toTitleCase as tc,
  checkIsQuadro,
  classifyTipo,
  mergeColaboradores,
  generateCollaboratorId,
} from "../../lib/utils";
import { firestoreService } from "../../lib/firestoreService";
import RegistarFuncionarioForm from "../bloco8_gerais/RegistarFuncionarioForm";
import FormularioAlocacaoDocente from "./FormularioAlocacaoDocente";
import { isSuperBossUser } from "../../lib/auth";

interface AlocacaoDocente {
  id?: string;
  docenteId: string;
  curso: string;
  disciplina?: string;
  dataAlocacao: any;
}

export default function GestaoAcademicaView({
  title,
  user,
  onBack,
  initialShowList = false,
  initialShowForm = false,
}: {
  title: string;
  user: any;
  onBack: () => void;
  initialShowList?: boolean;
  initialShowForm?: boolean;
}) {
  const isAdmin = isSuperBossUser(user);
  const [showDocenteList, setShowDocenteList] = useState(initialShowList);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocenteId, setSelectedDocenteId] = useState<string | null>(
    null,
  );
  const [allAllocations, setAllAllocations] = useState<AlocacaoDocente[]>([]);
  const [dbColaboradores, setDbColaboradores] = useState<any[]>([]);
  const [showDisciplinasModal, setShowDisciplinasModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [showRegistrationForm, setShowRegistrationForm] =
    useState(initialShowForm);
  const [selectedDocenteForForm, setSelectedDocenteForForm] =
    useState<any | null>(null);

  // States for DRA (Academic Registry)
  const [efetivoRecords, setEfetivoRecords] = useState<any[]>([]);
  const [efetivoLoading, setEfetivoLoading] = useState(true);
  const [selectedCurso, setSelectedCurso] = useState(
    "Curso de Engenharia Elétrica",
  );
  const [selectedNivel, setSelectedNivel] = useState("1º Ano");
  const [novosIngressos, setNovosIngressos] = useState<number>(0);
  const [matriculados, setMatriculados] = useState<number>(0);
  const [graduados, setGraduados] = useState<number>(0);
  const [transferidos, setTransferidos] = useState<number>(0);
  const [desistentes, setDesistentes] = useState<number>(0);
  const [genderHomens, setGenderHomens] = useState<number>(0);
  const [genderMulheres, setGenderMulheres] = useState<number>(0);

  useEffect(() => {
    const unsubAloc = firestoreService.alocacoes_docentes.subscribe(
      (data: any) => {
        setAllAllocations(data);
      },
    );
    const unsubColab = firestoreService.colaboradores.subscribe((data: any) => {
      setDbColaboradores(data);
    }, undefined);
    const unsubEfetivo = firestoreService.efetivo_escolar.subscribe(
      (data: any[]) => {
        setEfetivoRecords(data || []);
        setEfetivoLoading(false);
      },
    );
    return () => {
      unsubAloc();
      unsubColab();
      unsubEfetivo();
    };
  }, []);

  // Merge constants and DB using the central utility
  const allDocentes = mergeColaboradores(dbColaboradores);

  // Filter docentes for the current area (direction) OR those explicitly allocated to this course (title)
  const currentCourseAllocations = allAllocations.filter(
    (a) => a.curso === title,
  );
  const allocatedDocenteIds = currentCourseAllocations.map((a) => a.docenteId);

  // Filter docentes: when showDocenteList is true, we show all Docentes available for allocation
  const filteredDocentes = allDocentes.filter(
    (c) =>
      c.tipo === "Docente" &&
      (searchTerm === "" ||
        (c.nome || "").toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const isHeadOfPersonnel =
    isAdmin || user?.cargoChefia === "Chefe de Repartição de Pessoal";

  const handleAllocate = async (docenteId: string) => {
    // Allocation to course might be allowed by Course Director,
    // but the user specifically mentioned "disciplinas" should be by Head of Personnel.
    // Let's check if the user wants to restrict EVERYTHING or just disciplines.
    // "as disciplinas deve ser registradas pelo chefe da repartição"

    const docenteAllocations = allAllocations.filter(
      (a) => a.docenteId === docenteId,
    );

    if (docenteAllocations.some((a) => a.curso === title)) {
      setAlertMessage(`O docente já está alocado ao curso ${title}.`);
      return;
    }

    if (docenteAllocations.length >= 2) {
      setAlertMessage(
        `O docente já está alocado em dois cursos e atingiu o limite permitido.`,
      );
      return;
    }

    try {
      await firestoreService.alocacoes_docentes.add({
        docenteId,
        curso: title,
        dataAlocacao: new Date().toISOString(),
      });
      setAlertMessage(`Docente alocado com sucesso ao curso ${title}!`);
    } catch (error) {
      console.error("Erro de alocação:", error);
      setAlertMessage(
        "Erro ao alocar docente. Verifique permissões ou conexão.",
      );
    }
  };

  const handleDeallocate = async (alocId: string) => {
    if (
      window.confirm("Tem certeza que deseja remover este docente deste curso?")
    ) {
      try {
        await firestoreService.alocacoes_docentes.delete(alocId);
        setAlertMessage("Alocação removida com sucesso.");
      } catch (error) {
        console.error("Erro de desalocação:", error);
        setAlertMessage("Erro ao remover alocação.");
      }
    }
  };

  const handleAllocateDisciplina = async (
    docenteId: string,
    disciplina: string,
  ) => {
    const aloc = currentCourseAllocations.find(
      (a) => a.docenteId === docenteId,
    );
    if (!aloc) {
      // Must allocate to course first, but we can do it automatically
      try {
        await firestoreService.alocacoes_docentes.add({
          docenteId,
          curso: title,
          disciplina,
          dataAlocacao: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Erro de alocação disciplina (add):", error);
        setAlertMessage("Erro ao alocar disciplina.");
      }
    } else {
      try {
        await firestoreService.alocacoes_docentes.update(aloc.id!, {
          disciplina,
        });
      } catch (error) {
        console.error("Erro de alocação disciplina (update):", error);
        setAlertMessage("Erro ao atualizar disciplina.");
      }
    }
    setShowDisciplinasModal(false);
    setSelectedDocenteId(null);
  };

  const isDRA =
    title.toUpperCase().includes("REGISTO") || title.toUpperCase() === "DRA";

  const handleAddEfetivo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCurso) {
      setAlertMessage("Por favor, selecione um curso.");
      return;
    }

    let dept = "Departamento de Engenharia Eletrotécnica";
    if (
      selectedCurso.includes("Construção Civil") ||
      selectedCurso.includes("Hidráulica")
    ) {
      dept = "Departamento de Engenharia de Construção Civil";
    } else if (
      selectedCurso.includes("Mecânica") ||
      selectedCurso.includes("Termotécnica")
    ) {
      dept = "Departamento de Engenharia de Construção Mecânica";
    }

    try {
      const total =
        (novosIngressos || 0) +
        (matriculados || 0) +
        (graduados || 0) +
        (transferidos || 0) +
        (desistentes || 0);

      const payload = {
        departamento: dept,
        curso: selectedCurso,
        nivel: selectedNivel,
        novosIngressos: novosIngressos || 0,
        matriculados: matriculados || 0,
        graduados: graduados || 0,
        transferidos: transferidos || 0,
        desistentes: desistentes || 0,
        homens: genderHomens || 0,
        mulheres: genderMulheres || 0,
        total: total,
        dataRegisto: new Date().toISOString(),
      };

      await firestoreService.efetivo_escolar.add(payload);
      setAlertMessage("Registo de estudantes adicionado com sucesso!");

      setNovosIngressos(0);
      setMatriculados(0);
      setGraduados(0);
      setTransferidos(0);
      setDesistentes(0);
      setGenderHomens(0);
      setGenderMulheres(0);
    } catch (err) {
      console.error(err);
      setAlertMessage("Erro ao salvar os dados.");
    }
  };

  if (isDRA) {
    const totalNovosGeral = efetivoRecords.reduce(
      (acc, curr) => acc + (parseInt(curr.novosIngressos) || 0),
      0,
    );
    const totalMatriculadosGeral = efetivoRecords.reduce(
      (acc, curr) => acc + (parseInt(curr.matriculados) || 0),
      0,
    );
    const totalGraduadosGeral = efetivoRecords.reduce(
      (acc, curr) => acc + (parseInt(curr.graduados) || 0),
      0,
    );
    const totalTransferidosGeral = efetivoRecords.reduce(
      (acc, curr) => acc + (parseInt(curr.transferidos) || 0),
      0,
    );
    const totalDesistentesGeral = efetivoRecords.reduce(
      (acc, curr) => acc + (parseInt(curr.desistentes) || 0),
      0,
    );
    const totalEstudantesGeral = efetivoRecords.reduce(
      (acc, curr) => acc + (parseInt(curr.total) || 0),
      0,
    );

    const handleDeleteEfetivo = async (id: string) => {
      if (
        window.confirm(
          "Tem certeza de que deseja eliminar este registo académico?",
        )
      ) {
        try {
          await firestoreService.efetivo_escolar.delete(id);
          setAlertMessage("Registo académico removido com sucesso.");
        } catch (err) {
          console.error(err);
          setAlertMessage("Erro ao remover o registo.");
        }
      }
    };

    return (
      <div className="w-full space-y-8 animate-fade-in text-left">
        {alertMessage && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-950 text-white px-8 py-4 rounded-2xl shadow-2xl border border-slate-800 animate-bounce flex items-center gap-4">
            <p className="font-bold text-sm tracking-tight">{alertMessage}</p>
            <button
              onClick={() => setAlertMessage(null)}
              className="hover:text-amber-500 transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-8 rounded-[2.5rem] shadow-xl border-b-4 border-amber-500">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl">
                <GraduationCap
                  size={28}
                  className="text-amber-400 animate-pulse"
                />
              </div>
              <h2 className="text-3xl font-black tracking-tighter text-white font-sans">
                Gestão Académica (DRA)
              </h2>
            </div>
            <p className="text-blue-200 font-bold text-xs tracking-widest mt-2 ml-1">
              Departamento de Registo Académico • Formulário de Registro e
              Estatísticas do Efetivo Escolar
            </p>
          </div>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-xs tracking-widest transition-all flex items-center gap-2 border border-white/10"
          >
            &larr; Voltar
          </button>
        </div>

        {/* Key Metrics Dashboard Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                <UserPlus size={20} />
              </div>
              <p className="text-[10px] font-black text-slate-400 tracking-wider leading-tight">
                Novos Ingressos
              </p>
            </div>
            <p className="text-3xl font-black text-slate-900">
              {totalNovosGeral.toLocaleString("pt-PT")}
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                <GraduationCap size={20} />
              </div>
              <p className="text-[10px] font-black text-slate-400 tracking-wider leading-tight">
                Matriculados
              </p>
            </div>
            <p className="text-3xl font-black text-slate-900">
              {totalMatriculadosGeral.toLocaleString("pt-PT")}
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
                <Users size={20} />
              </div>
              <p className="text-[10px] font-black text-slate-400 tracking-wider leading-tight">
                Graduados
              </p>
            </div>
            <p className="text-3xl font-black text-slate-900">
              {totalGraduadosGeral.toLocaleString("pt-PT")}
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center shrink-0">
                <ArrowLeft size={20} />
              </div>
              <p className="text-[10px] font-black text-slate-400 tracking-wider leading-tight">
                Transferidos
              </p>
            </div>
            <p className="text-3xl font-black text-slate-900">
              {totalTransferidosGeral.toLocaleString("pt-PT")}
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <p className="text-[10px] font-black text-slate-400 tracking-wider leading-tight">
                Desistentes
              </p>
            </div>
            <p className="text-3xl font-black text-slate-900">
              {totalDesistentesGeral.toLocaleString("pt-PT")}
            </p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-3xl border border-slate-150 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center shrink-0">
                <Hash size={20} />
              </div>
              <p className="text-[10px] font-black text-amber-800 tracking-wider leading-tight">
                Total Geral
              </p>
            </div>
            <p className="text-3xl font-black text-amber-950">
              {totalEstudantesGeral.toLocaleString("pt-PT")}
            </p>
          </div>
        </div>

        {/* Content Layout: Left Form, Right Table/List */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Student Registration Form */}
          <div className="lg:col-span-4 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Novo Registo de Efetivo
              </h3>
              <p className="text-xs font-medium text-slate-400">
                Insira as estatísticas de matrícula por curso e nível
              </p>
            </div>

            <form onSubmit={handleAddEfetivo} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 tracking-wider mb-1.5">
                  Curso Existente no Sistema
                </label>
                <select
                  value={selectedCurso}
                  onChange={(e) => setSelectedCurso(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-bold text-slate-705 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-sans"
                >
                  <option value="Curso de Engenharia Elétrica">
                    Engenharia Elétrica
                  </option>
                  <option value="Curso de Engenharia Eletrónica e de Telecomunicações">
                    Engenharia Eletrónica e Telecomunicações
                  </option>
                  <option value="Curso de Engenharia de Energias Renováveis">
                    Engenharia de Energias Renováveis
                  </option>
                  <option value="Curso de Engenharia de Construção Civil">
                    Engenharia de Construção Civil
                  </option>
                  <option value="Curso de Engenharia Hidráulica">
                    Engenharia Hidráulica
                  </option>
                  <option value="Curso de Engenharia de Construção Mecânica">
                    Engenharia de Construção Mecânica
                  </option>
                  <option value="Curso de Engenharia Termotécnica">
                    Engenharia Termotécnica
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black  text-slate-500 tracking-wider mb-1.5">
                  Nível / Ano Curricular
                </label>
                <select
                  value={selectedNivel}
                  onChange={(e) => setSelectedNivel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-bold text-slate-705 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-sans"
                >
                  <option value="1º Ano">1º Ano</option>
                  <option value="2º Ano">2º Ano</option>
                  <option value="3º Ano">3º Ano</option>
                  <option value="4º Ano">4º Ano</option>
                  <option value="5º Ano">5º Ano</option>
                </select>
              </div>

              {/* Statistical Numeric Inputs */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black  text-slate-500 tracking-wider mb-1.5">
                    Novos Ingressos
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={novosIngressos}
                    onChange={(e) =>
                      setNovosIngressos(
                        Math.max(0, parseInt(e.target.value) || 0),
                      )
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-bold text-slate-705 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black  text-slate-500 tracking-wider mb-1.5">
                    Matriculados
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={matriculados}
                    onChange={(e) =>
                      setMatriculados(
                        Math.max(0, parseInt(e.target.value) || 0),
                      )
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-bold text-slate-705 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black  text-slate-500 tracking-wider mb-1.5">
                    Graduados
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={graduados}
                    onChange={(e) =>
                      setGraduados(Math.max(0, parseInt(e.target.value) || 0))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-bold text-slate-705 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black  text-slate-500 tracking-wider mb-1.5">
                    Transferidos
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={transferidos}
                    onChange={(e) =>
                      setTransferidos(
                        Math.max(0, parseInt(e.target.value) || 0),
                      )
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-bold text-slate-705 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black  text-slate-500 tracking-wider mb-1.5">
                    Desistentes
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={desistentes}
                    onChange={(e) =>
                      setDesistentes(Math.max(0, parseInt(e.target.value) || 0))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-bold text-slate-705 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-sans"
                  />
                </div>
              </div>

              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/30 space-y-3">
                <span className="block text-[9px] font-black  text-blue-805 tracking-wider">
                  Distribuição por Género (Opcional)
                </span>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 mb-1">
                      Total Homens
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={genderHomens}
                      onChange={(e) =>
                        setGenderHomens(
                          Math.max(0, parseInt(e.target.value) || 0),
                        )
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 mb-1">
                      Total Mulheres
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={genderMulheres}
                      onChange={(e) =>
                        setGenderMulheres(
                          Math.max(0, parseInt(e.target.value) || 0),
                        )
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-705 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
                  <span className="text-xs font-black text-slate-500  tracking-wider">
                    Total de Estudantes:
                  </span>
                  <span className="text-base font-black text-blue-900">
                    {(
                      novosIngressos +
                      matriculados +
                      graduados +
                      transferidos +
                      desistentes
                    ).toLocaleString("pt-PT")}
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs  tracking-widest py-4 px-6 rounded-xl shadow-lg transition-all active:scale-[0.98] cursor-pointer text-center block"
                >
                  Submeter Registo Escolar
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT: Registered Students Summary Table */}
          <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-905 font-sans">
                  Efetivos e Matrículas Lançados
                </h3>
                <p className="text-xs font-medium text-slate-400  tracking-wider mt-0.5">
                  Total de registos académicos armazenados no sistema
                </p>
              </div>
              <span className="bg-indigo-50 text-indigo-700 px-3 py-1 bg-indigo-50/40 rounded-full font-black text-[10px]  tracking-wider">
                {efetivoRecords.length} Registos Ativos
              </span>
            </div>

            {efetivoLoading ? (
              <div className="py-20 text-center text-slate-400">
                <div className="animate-spin text-blue-600 mb-3 mx-auto border-2 border-slate-200 border-t-current rounded-full h-8 w-8"></div>
                <p className="text-xs font-bold  tracking-widest">
                  A carregar dados académicos...
                </p>
              </div>
            ) : efetivoRecords.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                <p className="text-sm font-bold text-slate-600">
                  Nenhum registo do efetivo escalar foi encontrado.
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  Utilize o formulário ao lado para fazer o lançamento do
                  primeiro registo por curso no sistema.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left border-collapse font-sans font-semibold">
                  <thead className="bg-[#f8fafc] text-slate-700 text-xs font-bold tracking-wider border-b border-slate-150">
                    <tr>
                      <th className="p-4 text-slate-500 font-bold font-sans">
                        Curso
                      </th>
                      <th className="p-4 text-slate-500 font-bold text-center font-sans">
                        Nível
                      </th>
                      <th className="p-4 text-slate-500 font-bold text-center font-sans">
                        Novos Ingr.
                      </th>
                      <th className="p-4 text-slate-500 font-bold text-center font-sans">
                        Matriculados
                      </th>
                      <th className="p-4 text-slate-500 font-bold text-center font-sans">
                        Graduados
                      </th>
                      <th className="p-4 text-slate-500 font-bold text-center font-sans">
                        Transferidos
                      </th>
                      <th className="p-4 text-slate-500 font-bold text-center font-sans">
                        Desistentes
                      </th>
                      <th className="p-4 text-slate-500 font-bold text-center font-sans">
                        Total G.
                      </th>
                      <th className="p-4 text-slate-500 font-bold text-center font-sans">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600 text-xs text-left">
                    {efetivoRecords.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-slate-50/55 border-b border-slate-100 last:border-none transition-colors"
                      >
                        <td className="p-4 text-left">
                          <div className="font-extrabold text-slate-900 text-sm">
                            {row.curso}
                          </div>
                          <div className="text-[9px] font-bold text-slate-400  tracking-widest mt-1">
                            {row.departamento}
                          </div>
                        </td>
                        <td className="p-4 text-center font-bold text-slate-705">
                          {row.nivel || "---"}
                        </td>
                        <td className="p-4 text-center font-bold text-blue-600">
                          {row.novosIngressos || 0}
                        </td>
                        <td className="p-4 text-center font-bold text-emerald-600">
                          {row.matriculados || 0}
                        </td>
                        <td className="p-4 text-center font-bold text-purple-600">
                          {row.graduados || 0}
                        </td>
                        <td className="p-4 text-center font-bold text-orange-500">
                          {row.transferidos || 0}
                        </td>
                        <td className="p-4 text-center font-bold text-red-500">
                          {row.desistentes || 0}
                        </td>
                        <td className="p-4 text-center font-black text-amber-600">
                          {row.total || 0}
                        </td>
                        <td className="p-4 text-center">
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteEfetivo(row.id)}
                              className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors inline-flex justify-center"
                              title="Eliminar"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (showRegistrationForm || selectedDocenteForForm) {
    return (
      <div className="w-full bg-slate-50 min-h-screen p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => {
              setShowRegistrationForm(false);
              setSelectedDocenteForForm(null);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 font-bold rounded-xl border border-slate-200 hover:bg-slate-100 transition-all text-xs shadow-sm"
          >
            <ArrowLeft size={16} /> Voltar para a gestão académica
          </button>
        </div>

        <FormularioAlocacaoDocente
          docente={selectedDocenteForForm}
          cursoContexto={title}
          onCancel={() => {
            setShowRegistrationForm(false);
            setSelectedDocenteForForm(null);
          }}
          onSubmitSuccess={() => {
            setShowRegistrationForm(false);
            setSelectedDocenteForForm(null);
            setAlertMessage("Processo individual do docente guardado e alocado com sucesso!");
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      {alertMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-950 text-white px-8 py-4 rounded-2xl shadow-2xl border border-slate-800 animate-bounce flex items-center gap-4">
          <p className="font-bold text-sm tracking-tight">{alertMessage}</p>
          <button
            onClick={() => setAlertMessage(null)}
            className="hover:text-amber-500 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {showDisciplinasModal && selectedDocenteId && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[2rem] p-10 max-w-md w-full shadow-2xl border border-slate-100"
          >
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-2">
              Alocar disciplina
            </h3>
            <p className="text-slate-500 mb-8 font-medium">
              Selecione a disciplina para o docente{" "}
              {tc(
                allDocentes.find((d) => d.id === selectedDocenteId)?.nome || "",
              )}
            </p>

            <div className="grid grid-cols-1 gap-3 mb-10 overflow-y-auto max-h-60">
              {/* Disciplinas devem ser cadastradas dinamicamente via DRA */}
              <div className="text-center py-6 text-slate-400 text-xs italic">
                Nenhuma disciplina cadastrada para alocação.
              </div>
            </div>

            <button
              onClick={() => setShowDisciplinasModal(false)}
              className="w-full py-4 bg-slate-100 text-slate-900 rounded-xl font-black text-xs tracking-widest hover:bg-slate-200 transition-all underline"
            >
              FECHAR
            </button>
          </motion.div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-950 tracking-tighter mb-1">
            Pessoal - Docentes
          </h2>
          <p className="text-slate-500 font-medium italic text-sm">
            Administração de corpo docente da área
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowRegistrationForm(true)}
            className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs tracking-[0.2em] shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            <UserPlus2 size={18} /> Registar Docente
          </button>
          <button
            onClick={() => setShowDocenteList(!showDocenteList)}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <Users size={18} />{" "}
            {showDocenteList
              ? "Ocultar Todos Docentes"
              : "Listar Docentes Disponíveis"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
            <GraduationCap size={32} />
          </div>
          <h4 className="text-xs font-black text-slate-400 tracking-widest mb-1">
            Docentes no Curso
          </h4>
          <p className="text-4xl font-black text-slate-950">
            {allocatedDocenteIds.length}
          </p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
            <Building2 size={32} />
          </div>
          <h4 className="text-xs font-black text-slate-400 tracking-widest mb-1">
            Turmas vigentes
          </h4>
          <p className="text-4xl font-black text-slate-950">0</p>
        </div>
      </div>

      <AnimatePresence>
        {showDocenteList && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden"
          >
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-900 tracking-tighter text-blue-600">
                Lista Geral De Docentes Disponíveis
              </h3>
              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Pesquisar por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all w-72"
                />
              </div>
            </div>

            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 tracking-widest">
                      Docente
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 tracking-widest">
                      Disciplina
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 tracking-widest">
                      Categoria
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 tracking-widest">
                      Alocações
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 tracking-widest text-right">
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredDocentes.map((docente) => {
                    const docAllocations = allAllocations.filter(
                      (a) => a.docenteId === docente.id,
                    );
                    const isAllocatedToThis = docAllocations.some(
                      (a) => a.curso === title,
                    );
                    const alocForThis = docAllocations.find(
                      (a) => a.curso === title,
                    );

                    return (
                      <tr
                        key={docente.id}
                        className={`hover:bg-slate-50/50 transition-colors group ${isAllocatedToThis ? "bg-blue-50/20" : ""}`}
                      >
                        <td className="px-8 py-6 relative">
                          <div className="flex items-center gap-4">
                            <div
                              className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black text-sm group-hover:bg-blue-600 group-hover:text-white transition-all cursor-pointer"
                              onClick={() =>
                                setSelectedDocenteId(
                                  selectedDocenteId === docente.id
                                    ? null
                                    : docente.id,
                                )
                              }
                            >
                              { (docente.nome || "S N")
                                .split(" ")
                                .filter(Boolean)
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2) || "Docente" }
                            </div>
                            <div className="relative">
                              <div
                                className="font-black text-slate-900 text-sm hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-2 group/name"
                                onClick={() =>
                                  setSelectedDocenteId(
                                    selectedDocenteId === docente.id
                                      ? null
                                      : docente.id,
                                  )
                                }
                              >
                                {tc(docente.nome)}
                                <Filter
                                  size={12}
                                  className={`opacity-0 group-hover/name:opacity-100 transition-opacity ${selectedDocenteId === docente.id ? "opacity-100 text-blue-600" : ""}`}
                                />
                              </div>
                              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mt-1 tracking-widest">
                                <Mail size={12} />{" "}
                                {docente.email?.toLowerCase()}
                              </div>

                              <AnimatePresence>
                                {selectedDocenteId === docente.id && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-full left-0 mt-2 w-48 bg-slate-950 text-white rounded-xl shadow-2xl z-[80] overflow-hidden border border-slate-800"
                                  >
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (!isHeadOfPersonnel) {
                                          setAlertMessage(
                                            "Apenas o Chefe da Repartição de Pessoal pode gerir disciplinas.",
                                          );
                                          return;
                                        }
                                        setShowDisciplinasModal(true);
                                      }}
                                      className={`w-full px-4 py-3 text-left text-[10px] font-black tracking-widest flex items-center gap-2 transition-colors border-b border-slate-900 ${!isHeadOfPersonnel ? "text-slate-600 cursor-not-allowed" : "hover:bg-slate-900"}`}
                                    >
                                      <BookOpen
                                        size={14}
                                        className={
                                          !isHeadOfPersonnel
                                            ? "text-slate-700"
                                            : "text-blue-400"
                                        }
                                      />{" "}
                                      Alocar Disciplina
                                    </button>
                                    <button className="w-full px-4 py-3 text-left text-[10px] font-black tracking-widest hover:bg-slate-900 flex items-center gap-2 transition-colors">
                                      <Users
                                        size={14}
                                        className="text-amber-400"
                                      />{" "}
                                      Ver Perfil
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span
                              className={`text-xs font-black tracking-tight ${alocForThis?.disciplina ? "text-blue-600" : "text-slate-400 italic"}`}
                            >
                              {alocForThis?.disciplina || "Não definida"}
                            </span>
                            {isAllocatedToThis && (
                              <button
                                onClick={() => {
                                  if (!isHeadOfPersonnel) {
                                    setAlertMessage(
                                      "Apenas o Chefe da Repartição de Pessoal pode gerir disciplinas.",
                                    );
                                    return;
                                  }
                                  setSelectedDocenteId(docente.id);
                                  setShowDisciplinasModal(true);
                                }}
                                className={`text-[9px] font-bold transition-colors tracking-widest mt-1 text-left ${!isHeadOfPersonnel ? "text-slate-300" : "text-blue-400 hover:text-blue-600"}`}
                              >
                                {alocForThis?.disciplina
                                  ? "Alterar disciplina"
                                  : "Definir disciplina"}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-xs font-black text-slate-700 tracking-tight">
                          {docente.cargo || docente.categoria}
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-wrap gap-1">
                            {docAllocations.map((aloc) => (
                              <div
                                key={aloc.id}
                                className={`flex items-center px-2 py-0.5 rounded-full ${aloc.curso === title ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500 underline decoration-slate-200"}`}
                              >
                                <span className="text-[9px] font-black tracking-tighter">
                                  {aloc.curso.replace("Diretor do ", "")}
                                </span>
                                {isHeadOfPersonnel && (
                                  <button
                                    onClick={() => handleDeallocate(aloc.id!)}
                                    className="ml-1 hover:text-red-500"
                                    title="Remover Alocação"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                )}
                              </div>
                            ))}
                            {docAllocations.length === 0 && (
                              <span className="text-[9px] font-black text-slate-400">
                                Sem alocações
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          {!isAllocatedToThis ? (
                            docAllocations.length >= 2 ? (
                              <div className="flex flex-col items-end">
                                <span className="px-4 py-2 bg-slate-100 text-slate-400 rounded-lg font-black text-[10px] tracking-widest border border-slate-200 cursor-not-allowed">
                                  Limite Atingido
                                </span>
                                <span className="text-[8px] font-bold text-red-500 mt-1">
                                  Máximo 2 cursos
                                </span>
                              </div>
                            ) : (
                              <button
                                onClick={() => setSelectedDocenteForForm(docente)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-black text-[10px] tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                              >
                                Alocar ao curso
                              </button>
                            )
                          ) : (
                            <div className="flex flex-col items-end">
                              <span className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg font-black text-[10px] tracking-widest border border-emerald-100">
                                Alocado
                              </span>
                              <span className="text-[8px] font-bold text-emerald-500 mt-1">
                                Neste Curso
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex justify-between items-center text-slate-500 text-xs">
              <p className="font-medium italic">
                Mostrando{" "}
                <span className="font-bold text-slate-900">
                  {filteredDocentes.length}
                </span>{" "}
                docentes.
              </p>
              <button
                onClick={() => setShowDocenteList(false)}
                className="text-slate-400 hover:text-slate-600 font-bold tracking-widest"
              >
                Recolher lista
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Course's Own Docente List (Summary) */}
      {!showDocenteList && (
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-slate-950 tracking-tighter">
              Corpo docente do curso
            </h3>
            <button
              onClick={() => setShowDocenteList(true)}
              className="text-blue-600 text-xs font-black tracking-widest hover:underline"
            >
              Gerir alocações
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allocatedDocenteIds.length > 0 ? (
              allDocentes
                .filter((d) => allocatedDocenteIds.includes(d.id))
                .map((docente) => {
                  const aloc = currentCourseAllocations.find(
                    (a) => a.docenteId === docente.id,
                  );
                  return (
                    <div
                      key={docente.id}
                      className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4 group"
                    >
                      <div className="w-12 h-12 bg-white text-blue-600 rounded-xl flex items-center justify-center font-black text-sm shadow-sm">
                        {(docente.nome || "S N")
                          .split(" ")
                          .filter(Boolean)
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2) || "Doc"}
                      </div>
                      <div className="flex-grow">
                        <div className="font-black text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                          {tc(docente.nome)}
                        </div>
                        <div className="text-[10px] font-bold text-blue-500 tracking-widest mt-1">
                          {aloc?.disciplina || "Sem disciplina alocada"}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (!isHeadOfPersonnel) {
                            setAlertMessage(
                              "Apenas o Chefe da Repartição de Pessoal pode gerir disciplinas.",
                            );
                            return;
                          }
                          setSelectedDocenteId(docente.id);
                          setShowDisciplinasModal(true);
                        }}
                        className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                        title="Gestão de Disciplina"
                      >
                        <BookOpen size={16} />
                      </button>
                    </div>
                  );
                })
            ) : (
              <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                <Users size={32} className="mx-auto mb-4 opacity-30" />
                <p className="font-medium italic">
                  Nenhum docente alocado individualmente a este curso.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

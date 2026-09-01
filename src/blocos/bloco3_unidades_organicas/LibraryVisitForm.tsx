import React, { useState, useMemo, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  User,
  Book,
  Monitor,
  Clock,
  CheckCircle2,
  Search,
  MapPin,
  AlertCircle,
  Hash,
  ChevronDown,
  FileText,
  Send,
  CheckCircle,
  RefreshCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { EFETIVO_GERAL_DATA } from "../../constants/colaboradoresList";
import { ESTUDANTES_DATA } from "../../constants/estudantesList";
import { toTitleCase as tc, mergeColaboradores } from "../../lib/utils";
import { firestoreService } from "../../lib/firestoreService";
import { auth } from "../../lib/firebase";

import {
  LibraryRegistration,
  BookRegistration,
  ServiceRequest,
} from "../../types";

export default function LibraryVisitForm({
  onBack,
  onSubmit,
  initialTipoVisitante,
  bookRegistrations = [],
  user,
}: {
  onBack: () => void;
  onSubmit?: (reg: LibraryRegistration) => void;
  initialTipoVisitante?: string;
  bookRegistrations?: BookRegistration[];
  user?: any;
}) {
  const [success, setSuccess] = useState(false);
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [serviceType, setServiceType] = useState<
    "biblioteca" | "rastreio" | "reposicao" | null
  >(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");
  const [trackingResult, setTrackingResult] = useState<ServiceRequest | null>(
    null,
  );
  const [hasSearchedTracking, setHasSearchedTracking] = useState(false);
  const [dbColaboradores, setDbColaboradores] = useState<any[]>([]);
  const [dbEstudantes, setDbEstudantes] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    nome: "",
    tipoVisitante: initialTipoVisitante || "Estudante",
    posicao: "",
    numeroIdentificacao: "",
    curso: "",
    objetivo: "Estudo",
    usaComputador: false,
    computadorId: "",
    livrosConsulta: "",
    livrosEmprestimo: "",
    data: new Date().toISOString().split("T")[0],
    horaEntrada: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  });

  useEffect(() => {
    let unsubColab: any;
    let unsubEst: any;

    const authUnsub = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        unsubColab =
          firestoreService.colaboradores.subscribe(setDbColaboradores);
        unsubEst = firestoreService.efetivo_escolar.subscribe(setDbEstudantes);
      }
    });

    return () => {
      authUnsub();
      if (unsubColab) unsubColab();
      if (unsubEst) unsubEst();
    };
  }, []);

  const allColaboradores = useMemo(
    () => mergeColaboradores(dbColaboradores),
    [dbColaboradores],
  );

  // Auto-fill if user is logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        nome: user.name || user.nome || "",
        numeroIdentificacao:
          user.numeroEstudante || user.nuit || user.email || "",
        tipoVisitante:
          user.role === "Estudante"
            ? "Estudante"
            : user.role === "Docente"
              ? "Docente"
              : user.role === "CTA"
                ? "CTA"
                : prev.tipoVisitante,
        curso: user.curso || user.departamento || user.direcao || "",
      }));
    }
  }, [user]);

  // Auto-populate when NUIT or ID is entered
  useEffect(() => {
    if (!formData.numeroIdentificacao) {
      setWarning("");
      return;
    }

    const ident = formData.numeroIdentificacao.trim();
    if (ident.length >= 6 && !user) {
      // Search in Collaborators
      const foundColab = allColaboradores.find(
        (c) => c.nuit === ident || c.id === ident || c.numeroBI === ident,
      );

      if (foundColab) {
        const foundTipo =
          foundColab.tipo === "Docente"
            ? "Docente"
            : foundColab.tipo === "CTA"
              ? "CTA"
              : formData.tipoVisitante;
        if (foundTipo !== formData.tipoVisitante) {
          setWarning(
            `SISTEMA DETECTOU: Você está registado como ${foundTipo} na Repartição de Pessoal. Por favor, selecione a opção "${foundTipo}" para realizar o login e registo corretamente.`,
          );
        } else {
          setWarning("");
        }

        setFormData((prev) => ({
          ...prev,
          nome: foundColab.nome,
          tipoVisitante: foundTipo,
          posicao: foundColab.cargo || foundColab.categoria || foundColab.tipo,
          curso:
            foundColab.curso ||
            foundColab.departamento ||
            foundColab.direcao ||
            "",
        }));
        return;
      }

      // Search in Students
      const foundEst = dbEstudantes.find(
        (s) =>
          s.nuit === ident ||
          s.id === ident ||
          s.numeroEstudante === ident ||
          s.numeroBI === ident,
      );

      if (foundEst) {
        if (formData.tipoVisitante !== "Estudante") {
          setWarning(
            `SISTEMA DETECTOU: Você está registado como Estudante no SIGPRO. Por favor, selecione a opção "Estudante" para realizar o login e registo corretamente.`,
          );
        } else {
          setWarning("");
        }

        setFormData((prev) => ({
          ...prev,
          nome: foundEst.nome,
          tipoVisitante: "Estudante",
          curso: foundEst.curso || foundEst.departamento || "",
        }));
      } else {
        setWarning("");
      }
    }
  }, [formData.numeroIdentificacao, allColaboradores, dbEstudantes, user]);

  const availableBooks = useMemo(() => {
    // If no course defined, show all, but prioritize course
    if (!formData.curso) return bookRegistrations;
    return bookRegistrations;
  }, [bookRegistrations]);

  const searchedBooks = useMemo(() => {
    if (!searchTerm) {
      // Prioritize books from user's course if available
      return availableBooks
        .filter(
          (b) =>
            !formData.curso ||
            b.curso?.toLowerCase() === formData.curso.toLowerCase(),
        )
        .slice(0, 5);
    }
    return availableBooks.filter(
      (b) =>
        b.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.autor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.area?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [searchTerm, availableBooks, formData.curso]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Verificacao de ID na base de dados SIGPRO
    if (!user && formData.tipoVisitante !== "Externo") {
      const ident = formData.numeroIdentificacao.trim();

      const foundEst = dbEstudantes.find(
        (s) =>
          s.nuit === ident ||
          s.id === ident ||
          s.numeroEstudante === ident ||
          s.numeroBI === ident,
      );

      const foundColab = allColaboradores.find(
        (c) => c.nuit === ident || c.id === ident || c.numeroBI === ident,
      );

      if (formData.tipoVisitante === "Estudante") {
        if (!foundEst) {
          setError(
            "Acesso Negado: A confirmação de dados de Estudante deve ser feita no SIGPRO. O identificador fornecido não consta na base de dados.",
          );
          return;
        }
      } else {
        if (!foundColab) {
          setError(
            `Acesso Negado: A confirmação de dados de ${formData.tipoVisitante} deve ser feita na Repartição de Pessoal. O identificador fornecido não consta na base de dados.`,
          );
          return;
        }
      }
    }

    if (onSubmit) {
      onSubmit({
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
      });
    }

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onBack();
    }, 3000);
  };

  return (
    <div className="h-[100dvh] bg-gray-50 flex flex-col overflow-hidden">
      <header className="flex-none bg-[#e67e22] text-white p-4 md:p-6 flex items-center gap-4 shadow-md z-10">
        <button
          type="button"
          onClick={onBack}
          className="p-2 hover:bg-white/20 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg md:text-xl font-bold tracking-wider truncate">
          Registo de Visita
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50 p-4 md:p-8">
        <div className="max-w-3xl mx-auto pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
          >
            <AnimatePresence mode="wait">
              {!isVerified ? (
                <motion.div
                  key="verification"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative min-h-[400px] flex flex-col items-center justify-center p-8 bg-cover bg-center"
                  style={{
                    backgroundImage:
                      'url("https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=1000")',
                  }}
                >
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

                  <div className="relative z-10 w-full max-w-xl mx-auto">
                    <h2 className="text-white text-2xl font-bold mb-8 drop-shadow-md text-center">
                      Verificação de Identidade
                    </h2>

                    <div className="relative group bg-black/40 backdrop-blur-md rounded-2xl border border-white/20 p-2 shadow-2xl transition-all hover:bg-black/50">
                      <input
                        type="text"
                        placeholder="INTRODUZA O SEU ID/NUIT OU NOME COMPLETO"
                        className="w-full px-8 py-6 rounded-xl bg-transparent text-white focus:ring-0 outline-none transition-all text-sm font-black tracking-[0.1em]  placeholder:text-gray-300 pr-16 text-center"
                        value={formData.numeroIdentificacao}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            numeroIdentificacao: e.target.value,
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const btn =
                              document.getElementById("btn-verificar");
                            if (btn) btn.click();
                          }
                        }}
                      />
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors">
                        <ChevronDown className="text-white" size={24} />
                      </div>
                    </div>

                    <motion.button
                      id="btn-verificar"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => {
                        const ident = formData.numeroIdentificacao
                          .trim()
                          .toUpperCase();
                        if (!ident) {
                          setError(
                            "Por favor, insira o NUIT, Número de Identificação ou Nome Completo.",
                          );
                          return;
                        }

                        // Normalized search function
                        const match = (val: any) => {
                          if (!val) return false;
                          const nVal = String(val).toUpperCase().trim();
                          return nVal === ident || nVal.includes(ident);
                        };

                        const foundColab = EFETIVO_GERAL_DATA.find(
                          (c) =>
                            match(c.nuit) ||
                            match(c.id) ||
                            match(c.numeroBI) ||
                            match(c.nome),
                        );

                        if (foundColab) {
                          setFormData((prev) => ({
                            ...prev,
                            nome: foundColab.nome,
                            tipoVisitante: foundColab.tipo || "Colaborador",
                            posicao:
                              foundColab.cargo ||
                              foundColab.categoria ||
                              foundColab.tipo,
                            curso:
                              foundColab.curso ||
                              foundColab.departamento ||
                              foundColab.direcao ||
                              "",
                          }));
                          setError("");
                          setIsVerified(true);
                          setServiceType("biblioteca");
                          return;
                        }

                        const foundEst = ESTUDANTES_DATA.find(
                          (s) =>
                            match(s.nuit) ||
                            match(s.id) ||
                            match(s.numeroEstudante) ||
                            match(s.numeroBI) ||
                            match(s.nome),
                        );

                        if (foundEst) {
                          setFormData((prev) => ({
                            ...prev,
                            nome: foundEst.nome,
                            tipoVisitante: "Estudante",
                            posicao: "Estudante",
                            curso:
                              foundEst.curso || foundEst.departamento || "",
                          }));
                          setError("");
                          setIsVerified(true);
                          setServiceType("biblioteca");
                        } else {
                          setError(
                            "Acesso Negado: Dados não localizados na base de dados.",
                          );
                        }
                      }}
                      className="w-full mt-6 flex items-center justify-center gap-3 px-8 py-5 bg-orange-600 text-white rounded-2xl font-black text-lg hover:bg-orange-700 transition-all shadow-xl shadow-orange-900/40"
                    >
                      <Search size={22} strokeWidth={3} />
                      VERIFICAR AGORA
                    </motion.button>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/90 backdrop-blur-md text-white font-bold p-4 rounded-xl mt-6 text-sm flex items-center justify-center gap-2 border border-red-400"
                      >
                        <AlertCircle size={18} />
                        {error}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ) : !serviceType ? (
                <motion.div
                  key="services"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-12"
                >
                  <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      Serviços Disponíveis para Docente
                    </h2>
                    <p className="text-gray-600">
                      Selecione o serviço que deseja aceder hoje
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    <button
                      onClick={() => setServiceType("biblioteca")}
                      className="p-8 bg-white border-2 border-gray-100 rounded-3xl hover:border-orange-500 hover:shadow-xl hover:shadow-orange-100 transition-all group text-center"
                    >
                      <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <Book size={32} />
                      </div>
                      <h3 className="font-bold text-lg text-gray-900">
                        Biblioteca
                      </h3>
                      <p className="text-sm text-gray-500 mt-2">
                        Visita, consulta e empréstimo
                      </p>
                    </button>

                    <button
                      onClick={() => {
                        setServiceType("rastreio");
                        setLoadingRequests(true);
                        firestoreService.serviceRequests.get().then((data) => {
                          setServiceRequests(data);
                          setLoadingRequests(false);
                        });
                      }}
                      className="p-8 bg-white border-2 border-gray-100 rounded-3xl hover:border-blue-500 hover:shadow-xl hover:shadow-blue-100 transition-all group text-center"
                    >
                      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <RefreshCcw size={32} />
                      </div>
                      <h3 className="font-bold text-lg text-gray-900">
                        Rastreio de documento
                      </h3>
                      <p className="text-sm text-gray-500 mt-2">
                        Verificar estado de processos
                      </p>
                    </button>

                    <button
                      onClick={() => {
                        setServiceType("reposicao");
                        setLoadingRequests(true);
                        firestoreService.serviceRequests.get().then((data) => {
                          setServiceRequests(
                            data.filter(
                              (d) =>
                                d.service ===
                                "Pedido de realização de reposição de teste",
                            ),
                          );
                          setLoadingRequests(false);
                        });
                      }}
                      className="p-8 bg-white border-2 border-gray-100 rounded-3xl hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-100 transition-all group text-center"
                    >
                      <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <FileText size={32} />
                      </div>
                      <h3 className="font-bold text-lg text-gray-900">
                        Reposiçao de Teste
                      </h3>
                      <p className="text-sm text-gray-500 mt-2">
                        Estudantes com testes em falta
                      </p>
                    </button>
                  </div>
                </motion.div>
              ) : serviceType === "rastreio" ? (
                <motion.div
                  key="rastreio"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-8"
                >
                  <div className="flex items-center justify-between mb-8">
                    <button
                      onClick={() => setServiceType(null)}
                      className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-bold"
                    >
                      <ArrowLeft size={20} />
                      Voltar ao Menu
                    </button>
                    <h3 className="text-xl font-bold text-gray-900">
                      Rastreio de Documentos
                    </h3>
                    <div className="w-20" />
                  </div>

                  <div className="max-w-2xl mx-auto space-y-6">
                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                      <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                        <Search size={18} />
                        Consultar Estado
                      </h4>
                      <p className="text-sm text-blue-700 mb-4">
                        Insira o código de rastreio para verificar o andamento
                        do processo.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Ex: JD-EC-08042026-3ANO/CERTIFICADO"
                          className="flex-1 px-4 py-3 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm"
                          value={trackingCode}
                          onChange={(e) =>
                            setTrackingCode(e.target.value.toUpperCase())
                          }
                        />
                        <button
                          onClick={() => {
                            const found = serviceRequests.find(
                              (r) => r.trackingCode === trackingCode,
                            );
                            setTrackingResult(found || null);
                            setHasSearchedTracking(true);
                          }}
                          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95"
                        >
                          Buscar
                        </button>
                      </div>
                    </div>

                    {hasSearchedTracking && (
                      <AnimatePresence mode="wait">
                        {trackingResult ? (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden"
                          >
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                              <div>
                                <h5 className="font-bold text-gray-900">
                                  {trackingResult.service}
                                </h5>
                                <p className="text-xs text-gray-500 font-mono mt-1">
                                  {trackingResult.trackingCode}
                                </p>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                  trackingResult.status === "Concluído"
                                    ? "bg-green-100 text-green-800 border-green-200"
                                    : trackingResult.status === "Submetido"
                                      ? "bg-blue-100 text-blue-800 border-blue-200"
                                      : "bg-orange-100 text-orange-800 border-orange-200"
                                }`}
                              >
                                {trackingResult.status}
                              </span>
                            </div>
                            <div className="p-6">
                              <h6 className="text-xs font-black text-gray-400  tracking-widest mb-4">
                                Histórico
                              </h6>
                              <div className="space-y-4">
                                {trackingResult.history.map((h, i) => (
                                  <div key={i} className="flex gap-3">
                                    <div className="relative flex flex-col items-center">
                                      <div
                                        className={`w-3 h-3 rounded-full ${i === 0 ? "bg-blue-600" : "bg-gray-200"} z-10`}
                                      />
                                      {i <
                                        trackingResult.history.length - 1 && (
                                        <div className="w-0.5 h-full bg-gray-100 absolute top-3" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-gray-800">
                                        {h.stage}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {new Date(h.date).toLocaleDateString(
                                          "pt-PT",
                                        )}
                                      </p>
                                      <p className="text-xs text-gray-600 mt-1 italic">
                                        "{h.parecer}"
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-red-50 p-8 rounded-2xl border border-red-100 text-center"
                          >
                            <AlertCircle
                              className="mx-auto mb-3 text-red-400"
                              size={32}
                            />
                            <p className="font-bold text-red-900">
                              Código não localizado
                            </p>
                            <p className="text-sm text-red-700">
                              Verifique os dados e tente novamente.
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                </motion.div>
              ) : serviceType === "reposicao" ? (
                <motion.div
                  key="reposicao"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-8"
                >
                  <div className="flex items-center justify-between mb-8">
                    <button
                      onClick={() => setServiceType(null)}
                      className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-bold"
                    >
                      <ArrowLeft size={20} />
                      Voltar ao Menu
                    </button>
                    <h3 className="text-xl font-bold text-gray-900">
                      Pedidos de Reposição de Teste
                    </h3>
                    <div className="w-20" />
                  </div>

                  <div className="space-y-4">
                    {loadingRequests ? (
                      <div className="text-center py-12 text-gray-500">
                        <RefreshCcw
                          className="mx-auto mb-4 animate-spin text-orange-500"
                          size={32}
                        />
                        <p className="font-medium">
                          A carregar lista de estudantes...
                        </p>
                      </div>
                    ) : serviceRequests.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {serviceRequests.map((req) => (
                          <div
                            key={req.id}
                            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                          >
                            <div className="flex gap-4 items-center">
                              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                                <User size={24} />
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900">
                                  {req.nome}
                                </h4>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                  <span className="text-xs text-gray-500 font-medium">
                                    Curso: {req.curso}
                                  </span>
                                  <span className="text-xs text-gray-800 font-bold">
                                    Cadeira: {req.nomeCadeira || "N/A"}
                                  </span>
                                  <span className="text-xs text-orange-600 font-black">
                                    Teste: {req.numeroTeste || "N/A"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <span
                                className={`px-3 py-1 rounded-full text-[10px] font-black  border ${
                                  req.status === "Concluído"
                                    ? "bg-green-100 text-green-700 border-green-200"
                                    : "bg-orange-100 text-orange-700 border-orange-200"
                                }`}
                              >
                                {req.status}
                              </span>
                              <p className="text-[10px] font-mono text-gray-400">
                                {req.trackingCode}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-12 rounded-3xl border border-dashed border-gray-200 text-center">
                        <FileText
                          className="mx-auto mb-4 text-gray-300"
                          size={48}
                        />
                        <p className="font-bold text-gray-500">
                          Nenhum pedido de reposição encontrado.
                        </p>
                        <p className="text-sm text-gray-400">
                          Verifique se existem estudantes com testes em falta
                          pendentes.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onSubmit={handleSubmit}
                  className="p-8 space-y-8"
                >
                  <div className="p-8 bg-orange-50 border-b border-orange-100 -m-8 mb-8 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-orange-900 flex items-center gap-3">
                      <User className="text-orange-600" />
                      Dados do Visitante
                    </h2>
                    {formData.tipoVisitante === "Docente" && (
                      <button
                        type="button"
                        onClick={() => setServiceType(null)}
                        className="text-sm font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 bg-white px-4 py-2 rounded-xl shadow-sm border border-orange-100"
                      >
                        <ArrowLeft size={16} />
                        Mudar Serviço
                      </button>
                    )}
                  </div>
                  {error && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-700 text-sm animate-shake">
                      <AlertCircle size={20} className="shrink-0" />
                      <p className="font-bold">{error}</p>
                    </div>
                  )}
                  {warning && (
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center gap-3 text-blue-700 text-sm animate-pulse">
                      <AlertCircle size={20} className="shrink-0" />
                      <p className="font-medium">{warning}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        Posição
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        value={formData.posicao}
                        onChange={(e) =>
                          setFormData({ ...formData, posicao: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">
                        Tipo de Visitante
                      </label>
                      <select
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        value={formData.tipoVisitante}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            tipoVisitante: e.target.value,
                          })
                        }
                      >
                        <option value="Estudante">Estudante</option>
                        <option value="Docente">Docente</option>
                        <option value="CTA">CTA</option>
                        <option value="Externo">Externo</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">
                        Nº Identificação / NUIT
                      </label>
                      <div className="flex gap-2">
                        <input
                          required
                          type="text"
                          placeholder="Ex: 108164611 ou NUIT"
                          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                          value={formData.numeroIdentificacao}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              numeroIdentificacao: e.target.value,
                            })
                          }
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const ident = formData.numeroIdentificacao.trim();
                            if (!ident) {
                              setError(
                                "Por favor, insira o NUIT ou Número de Identificação.",
                              );
                              return;
                            }

                            // Search in Collaborators
                            const foundColab = allColaboradores.find(
                              (c) =>
                                c.nuit === ident ||
                                c.id === ident ||
                                c.numeroBI === ident,
                            );

                            if (foundColab) {
                              setFormData((prev) => ({
                                ...prev,
                                nome: foundColab.nome,
                                tipoVisitante: foundColab.tipo || "Colaborador",
                                posicao:
                                  foundColab.cargo ||
                                  foundColab.categoria ||
                                  foundColab.tipo,
                                curso:
                                  foundColab.curso ||
                                  foundColab.departamento ||
                                  foundColab.direcao ||
                                  "",
                              }));
                              setError("");
                              return;
                            }

                            // Search in Students
                            const foundEst = dbEstudantes.find(
                              (s) =>
                                s.nuit === ident ||
                                s.id === ident ||
                                s.numeroEstudante === ident ||
                                s.numeroBI === ident,
                            );

                            if (foundEst) {
                              setFormData((prev) => ({
                                ...prev,
                                nome: foundEst.nome,
                                tipoVisitante: "Estudante",
                                posicao: "Estudante",
                                curso:
                                  foundEst.curso || foundEst.departamento || "",
                              }));
                              setError("");
                            } else {
                              setError(
                                "Acesso Negado: Identificador não localizado na base de dados.",
                              );
                              setFormData((prev) => ({
                                ...prev,
                                nome: "",
                                posicao: "",
                                curso: "",
                              }));
                            }
                          }}
                          className="px-4 py-3 bg-gray-800 text-white rounded-xl hover:bg-black transition-all"
                        >
                          <Search size={20} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">
                        Curso / Departamento
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        value={formData.curso}
                        onChange={(e) =>
                          setFormData({ ...formData, curso: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <Monitor className="text-orange-500" size={20} />
                      Uso de Recursos
                    </h3>

                    <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                      <input
                        type="checkbox"
                        id="usaComputador"
                        className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        checked={formData.usaComputador}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            usaComputador: e.target.checked,
                          })
                        }
                      />
                      <label
                        htmlFor="usaComputador"
                        className="text-sm font-medium text-gray-700"
                      >
                        Irá utilizar computador da biblioteca?
                      </label>
                    </div>

                    {formData.usaComputador && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-2"
                      >
                        <label className="text-sm font-bold text-gray-700">
                          Identificação do Computador (Nº)
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: PC-05"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                          value={formData.computadorId}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              computadorId: e.target.value,
                            })
                          }
                        />
                      </motion.div>
                    )}
                  </div>

                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <Book className="text-orange-500" size={20} />
                      Livros e Obras
                    </h3>

                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-4">
                        <div className="relative">
                          <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            size={20}
                          />
                          <input
                            type="text"
                            placeholder="Pesquisar livro por título ou autor..."
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>

                        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 max-h-80 overflow-y-auto custom-scrollbar">
                          {searchedBooks.length > 0 ? (
                            <div className="space-y-3">
                              {searchedBooks.map((book) => {
                                const isAvailable = (book.quantidade || 1) > 0;
                                return (
                                  <div
                                    key={book.id}
                                    className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                  >
                                    <div className="flex-grow">
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-gray-800">
                                          {book.titulo}
                                        </h4>
                                        <span
                                          className={`text-[10px] font-black px-2 py-0.5 rounded ${isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                                        >
                                          {isAvailable
                                            ? "Disponível"
                                            : "Indisponível"}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-500">
                                        {book.autor} • {book.area}
                                      </p>
                                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md">
                                          <MapPin size={10} />
                                          <span>
                                            Estante: {book.estante || "N/A"} |
                                            Prateleira:{" "}
                                            {book.prateleira || "N/A"}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                                          <Hash size={10} />
                                          <span>
                                            Stock: {book.quantidade || 0} unid.
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                                      <button
                                        type="button"
                                        disabled={!isAvailable}
                                        onClick={() =>
                                          setFormData((prev) => ({
                                            ...prev,
                                            livrosConsulta: prev.livrosConsulta
                                              ? `${prev.livrosConsulta}\n- ${book.titulo}`
                                              : `- ${book.titulo}`,
                                          }))
                                        }
                                        className={`text-[10px] font-black px-3 py-2 rounded-lg transition-all ${isAvailable ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                                      >
                                        Consulta
                                      </button>
                                      <button
                                        type="button"
                                        disabled={!isAvailable}
                                        onClick={() =>
                                          setFormData((prev) => ({
                                            ...prev,
                                            livrosEmprestimo:
                                              prev.livrosEmprestimo
                                                ? `${prev.livrosEmprestimo}\n- ${book.titulo}`
                                                : `- ${book.titulo}`,
                                          }))
                                        }
                                        className={`text-[10px] font-black px-3 py-2 rounded-lg transition-all ${isAvailable ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                                      >
                                        Empréstimo
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-12 text-gray-400">
                              <AlertCircle
                                className="mx-auto mb-3 opacity-20"
                                size={48}
                              />
                              <p className="font-bold text-gray-600">
                                Obra ou Livro Indisponível
                              </p>
                              <p className="text-sm">
                                Tente pesquisar com outros termos ou verifique a
                                área.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">
                        Livros para Consulta Local
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Liste os livros que irá consultar na biblioteca..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none"
                        value={formData.livrosConsulta}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            livrosConsulta: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">
                        Livros para Empréstimo Externo
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Liste os livros que deseja levar para casa (sujeito a aprovação)..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none"
                        value={formData.livrosEmprestimo}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            livrosEmprestimo: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <Clock size={16} className="text-orange-500" />
                        Data
                      </label>
                      <input
                        type="date"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        value={formData.data}
                        onChange={(e) =>
                          setFormData({ ...formData, data: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <Clock size={16} className="text-orange-500" />
                        Hora de Entrada
                      </label>
                      <input
                        type="time"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        value={formData.horaEntrada}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            horaEntrada: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={success}
                    className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg ${
                      success
                        ? "bg-green-500 text-white"
                        : "bg-orange-600 text-white hover:bg-orange-700 shadow-orange-100 hover:shadow-orange-200"
                    }`}
                  >
                    {success ? (
                      <>
                        <CheckCircle2 size={24} />
                        Registo Submetido!
                      </>
                    ) : (
                      <>
                        <Save size={24} />
                        Submeter
                      </>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>

      <footer className="flex-none bg-blue-900 text-white text-center py-3 text-[10px] md:text-xs z-10">
        Sistema de Gestão de Biblioteca - DICOSSER
      </footer>
    </div>
  );
}

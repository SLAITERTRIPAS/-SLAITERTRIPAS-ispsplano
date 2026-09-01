import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  BookOpen,
  Users,
  Briefcase,
  Globe,
  Search,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ProcessingCircle } from "../../components/ui/ProcessingCircle";
import { EFETIVO_GERAL_DATA } from "../../constants/colaboradoresList";
import { firestoreService } from "../../lib/firestoreService";
import { mergeColaboradores } from "../../lib/utils";
import { auth } from "../../lib/firebase";

export default function VisitorWelcomeView({
  onBack,
  onSelectType,
}: {
  onBack: () => void;
  onSelectType: (type: string, userObj?: any) => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<
    "idle" | "verifying" | "success" | "error"
  >("idle");
  const [verifiedData, setVerifiedData] = useState<any>(null);

  const [dbColaboradores, setDbColaboradores] = useState<any[]>([]);
  const [dbEstudantes, setDbEstudantes] = useState<any[]>([]);

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

  const allColaboradores = useMemo(() => {
    return mergeColaboradores(dbColaboradores);
  }, [dbColaboradores]);

  const visitorTypes = [
    { name: "Estudante", icon: BookOpen },
    { name: "Docente", icon: Users },
    { name: "CTA", icon: Briefcase },
    { name: "Biblioteca", icon: Globe },
    { name: "Visitante", icon: Users },
  ];

  const currentYear = new Date().getFullYear();

  const suggestions = useMemo(() => {
    if (!selectedCategory) return [];
    const term = inputValue.trim().toLowerCase();

    if (selectedCategory === "Docente") {
      return [];
    } else if (selectedCategory === "CTA") {
      const activeCTA = allColaboradores.filter(
        (c) => c.tipo === "CTA" && c.estado === "Ativo",
      );
      if (term) {
        return activeCTA
          .filter(
            (c) =>
              (c.nome && c.nome.toLowerCase().includes(term)) ||
              (c.nuit && c.nuit.toLowerCase().includes(term)),
          )
          .slice(0, 5);
      }
      return activeCTA.slice(0, 5);
    } else if (selectedCategory === "Estudante") {
      if (term) {
        return dbEstudantes
          .filter(
            (s) =>
              (s.nome && s.nome.toLowerCase().includes(term)) ||
              (s.numeroEstudante &&
                s.numeroEstudante.toLowerCase().includes(term)) ||
              (s.nuit && s.nuit.toLowerCase().includes(term)),
          )
          .slice(0, 5);
      }
      return dbEstudantes.slice(0, 5);
    }
    return [];
  }, [selectedCategory, inputValue, allColaboradores, dbEstudantes]);

  const executeVerificationOfItem = (inputVal: string, matchedObj: any) => {
    setVerificationStatus("verifying");
    setVerifiedData(null);

    const searchPath =
      selectedCategory === "Estudante"
        ? "DICOSSER > Registo Académico > Efetivo Estudantil"
        : "DICOSAFA > Recursos Humanos > Repartição de Pessoal > Efetivo Geral";

    setTimeout(() => {
      if (matchedObj) {
        const isEst = selectedCategory === "Estudante";
        const formatted = {
          ...matchedObj,
          name: matchedObj.nome || matchedObj.name,
          course: isEst
            ? matchedObj.curso || "Engenharia"
            : matchedObj.departamento || matchedObj.direcao || "Divisão Geral",
          level: isEst
            ? `Ano ${matchedObj.anoIngresso || "1"}`
            : matchedObj.tipo || selectedCategory || "Colaborador",
        };
        setVerifiedData(formatted);
        setVerificationStatus("success");
        setTimeout(
          () => onSelectType(selectedCategory || "Visitante", formatted),
          1500,
        );
      } else {
        setVerificationStatus("error");
      }
    }, 1500);
  };

  const handleVerify = () => {
    const normInput = inputValue.trim().toLowerCase();
    console.log(
      "Verificando com input:",
      normInput,
      "Categoria:",
      selectedCategory,
    );
    console.log("Base de dados:", dbEstudantes);
    if (!normInput) return;

    let matched: any = null;
    if (selectedCategory === "Estudante") {
      matched = dbEstudantes.find(
        (s) =>
          (s.numeroEstudante &&
            s.numeroEstudante.toLowerCase() === normInput) ||
          (s.nuit && s.nuit.toLowerCase() === normInput) ||
          (s.nome && s.nome.toLowerCase() === normInput),
      );
      console.log("Resultado da busca (Estudante):", matched);
    } else {
      matched = allColaboradores.find(
        (c) =>
          (c.nuit && c.nuit.toLowerCase() === normInput) ||
          (c.id && c.id.toLowerCase() === normInput) ||
          (c.numeroBI && c.numeroBI.toLowerCase() === normInput) ||
          (c.nome && c.nome.toLowerCase() === normInput),
      );
      console.log("Resultado da busca (Colaborador):", matched);
    }

    executeVerificationOfItem(inputValue, matched);
  };

  const searchPath =
    selectedCategory === "Estudante"
      ? "DICOSSER > Registo Académico > Efetivo Estudantil"
      : "DICOSAFA > Recursos Humanos > Repartição de Pessoal > Efetivo Geral";

  const handleCategoryClick = (name: string) => {
    if (name === "Estudante" || name === "Docente" || name === "CTA") {
      setSelectedCategory(name);
      setInputValue("");
      setVerificationStatus("idle");
      setVerifiedData(null);
    } else {
      // Se for "Biblioteca", pular a verificação e ir direto.
      onSelectType(name);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col">
      <div
        className="absolute inset-0 z-0 cursor-pointer group overflow-hidden"
        onClick={() =>
          window.open("https://canva.link/b9s5ul6zwcpt5d5", "_blank")
        }
        title="Clique para ver o design original no Canva"
      >
        <img
          src="https://lh3.googleusercontent.com/d/1CDBqWNkpDe29yT2s79HHRBLlrClIJLBe"
          alt="Library Background"
          className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-500"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40"></div>
        <div className="absolute bottom-4 right-4 text-white/40 text-[10px] font-mono pointer-events-none">
          Design via Canva.link
        </div>
      </div>

      <div className="relative z-10 p-8 md:p-16 flex-grow flex flex-col">
        <button
          onClick={selectedCategory ? () => setSelectedCategory(null) : onBack}
          className="flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors self-start"
        >
          <ArrowLeft size={20} /> Voltar
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto text-center mt-12 w-full"
        >
          <h1 className="text-5xl md:text-6xl font-black mb-6 text-white tracking-tight">
            Bem-vindo a Biblioteca do Songo ({currentYear})
          </h1>

          <AnimatePresence mode="wait">
            {!selectedCategory ? (
              <motion.div
                key="categories"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-md mx-auto"
              >
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full flex items-center justify-between p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-white hover:bg-white/20 transition-all group"
                  >
                    <span className="text-xl font-bold">
                      Clique para selecionar a categoria
                    </span>
                    <ChevronDown
                      size={24}
                      className={`transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a5a]/90 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden z-50 shadow-2xl"
                      >
                        {visitorTypes.map((type) => (
                          <button
                            key={type.name}
                            onClick={() => {
                              handleCategoryClick(type.name);
                              setIsDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-4 p-4 hover:bg-white/10 text-white transition-colors border-b border-white/10 last:border-0"
                          >
                            <div className="p-2 bg-white/10 rounded-lg">
                              <type.icon size={20} />
                            </div>
                            <span className="font-bold">{type.name}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <p className="mt-8 text-white/40 text-sm font-medium tracking-widest">
                  Indique a sua categoria para prosseguir
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="verification"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white/10 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/20 shadow-2xl"
              >
                <h2 className="text-3xl font-bold text-white mb-4">
                  Verificação de {selectedCategory}
                </h2>
                <p className="text-white/70 mb-8">
                  {selectedCategory === "Estudante"
                    ? "Por favor, digite o seu código de estudante para preenchimento automático."
                    : "Por favor, digite o seu NUIT ou número de cartão de funcionário."}
                </p>

                <div className="max-w-md mx-auto space-y-6">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={
                        selectedCategory === "Estudante"
                          ? "Ex: 2024001"
                          : "Ex: 123456"
                      }
                      className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-6 py-4 text-white text-xl font-bold placeholder:text-white/30 outline-none focus:border-white/50 transition-all text-center"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                    />
                    {verificationStatus === "success" && (
                      <CheckCircle2
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-green-400"
                        size={24}
                      />
                    )}
                  </div>

                  {/* Sugestões de Dados Reais */}
                  {suggestions.length > 0 &&
                    verificationStatus !== "success" && (
                      <div className="bg-white/10 border border-white/10 rounded-2xl p-4 text-left space-y-2 max-h-48 overflow-y-auto">
                        <p className="text-white/40 text-[9px] font-bold tracking-widest  mb-1">
                          {selectedCategory === "Docente"
                            ? "Docentes Ativos (Dados Reais - Clique para Selecionar)"
                            : selectedCategory === "CTA"
                              ? "Colaboradores CTA (Dados Reais - Clique para Selecionar)"
                              : "Estudantes Registados (Dados Reais - Clique para Selecionar)"}
                        </p>
                        <div className="space-y-1">
                          {suggestions.map((item: any) => {
                            const name = item.nome || item.name;
                            const identCode =
                              selectedCategory === "Estudante"
                                ? item.numeroEstudante || item.nuit
                                : item.nuit;
                            return (
                              <button
                                key={
                                  item.id || item.nuit || item.numeroEstudante
                                }
                                type="button"
                                onClick={() => {
                                  setInputValue(identCode || "");
                                  executeVerificationOfItem(
                                    identCode || "",
                                    item,
                                  );
                                }}
                                className="w-full flex items-center justify-between text-left p-2 rounded-lg hover:bg-white/10 text-white text-xs transition-colors group cursor-pointer"
                              >
                                <div className="truncate pr-2">
                                  <p className="font-bold truncate group-hover:text-blue-300 transition-colors text-white">
                                    {name}
                                  </p>
                                  <p className="text-[10px] text-white/50 truncate">
                                    {selectedCategory === "Estudante"
                                      ? item.curso || "Estudante"
                                      : item.cargo ||
                                        item.departamento ||
                                        "Colaborador"}
                                  </p>
                                </div>
                                <span className="shrink-0 text-[10px] font-mono font-bold bg-white/20 text-white/90 px-2 py-1 rounded select-none group-hover:bg-white/30 transition-colors">
                                  NUIT/Cod: {identCode}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  {verificationStatus === "error" && (
                    <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-xl flex items-center gap-3 text-red-200 text-sm">
                      <AlertCircle size={20} />
                      <div className="text-left">
                        <p className="font-bold">Dados não conferem</p>
                        <p className="text-xs opacity-70">
                          Volte e escolha visitante para aceder à biblioteca
                        </p>
                      </div>
                    </div>
                  )}

                  {verificationStatus === "success" && verifiedData && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-green-500/20 border border-green-500/50 p-6 rounded-2xl text-left"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-green-200 text-xs font-bold tracking-widest">
                          Dados Confirmados
                        </p>
                        <p className="text-green-400 text-[8px] font-mono">
                          {searchPath.split(" > ").pop()}
                        </p>
                      </div>
                      <p className="text-white text-xl font-bold">
                        {verifiedData.name}
                      </p>
                      <p className="text-white/60">
                        {verifiedData.course || verifiedData.role} •{" "}
                        {verifiedData.level || verifiedData.department}
                      </p>
                    </motion.div>
                  )}

                  <div className="flex gap-4">
                    <button
                      onClick={handleVerify}
                      disabled={
                        !inputValue ||
                        verificationStatus === "verifying" ||
                        verificationStatus === "success"
                      }
                      className="w-full py-4 bg-white text-blue-900 rounded-2xl font-bold hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {verificationStatus === "verifying" ? (
                        <ProcessingCircle size={20} strokeWidth={1.5} />
                      ) : (
                        <>
                          <Search size={20} />
                          Verificar
                        </>
                      )}
                    </button>
                  </div>

                  {verificationStatus === "verifying" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center space-y-2"
                    >
                      <p className="text-white/40 text-[10px] font-bold tracking-widest">
                        Consultando Base de Dados
                      </p>
                      <p className="text-blue-300 text-xs font-mono">
                        {searchPath}
                      </p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

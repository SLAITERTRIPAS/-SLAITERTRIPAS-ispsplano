import { printElementById } from "../../lib/printUtils";
import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Calendar,
  ArrowLeft,
  Save,
  Trash2,
  Heart,
  Printer,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import CartaoAssistenciaMedicaImpressao from "../bloco6_documentos/CartaoAssistenciaMedicaImpressao";
import { EFETIVO_GERAL_DATA } from "../../constants/colaboradoresList";
import { firestoreService } from "../../lib/firestoreService";
import { mergeColaboradores } from "../../lib/utils";
import { Colaborador } from "../../types";

interface CartaoAssistencia {
  id: string;
  // Campos do Cartão
  servico: string;
  nome: string;
  categoria: string;
  grupo: string;
  letra: string;
  morada: string;
  conjuge: string;
  outrosFamiliares: string[];
  localEmissao: string;
  diaEmissao: string;
  mesEmissao: string;
  anoEmissao: string;
  validoAte: string;
  numeroRegisto: string;
  status: "Ativo" | "Expirado" | "Cancelado";
  foto?: string;
  emblema?: string;
}

export default function AssistenciaMedicaView({
  onBack,
}: {
  onBack: () => void;
}) {
  const [cartoes, setCartoes] = useState<CartaoAssistencia[]>([]);
  const [mode, setMode] = useState<"list" | "new">("list");
  const [searchTerm, setSearchTerm] = useState("");

  const currentYearStr = new Date().getFullYear().toString().slice(2);
  const currentMonthStr = new Date().toLocaleString("pt-PT", { month: "long" });
  const currentDayStr = new Date().getDate().toString().padStart(2, "0");

  const [newCartao, setNewCartao] = useState<Partial<CartaoAssistencia>>({
    outrosFamiliares: ["", "", "", ""],
    localEmissao: "Songo",
    diaEmissao: currentDayStr,
    mesEmissao: currentMonthStr,
    anoEmissao: currentYearStr,
    status: "Ativo",
    emblema:
      "https://upload.wikimedia.org/wikipedia/commons/4/4b/Emblem_of_Mozambique.svg",
  });

  const [printCartao, setPrintCartao] =
    useState<Partial<CartaoAssistencia> | null>(null);

  const [searchIdNuit, setSearchIdNuit] = useState("");
  const [dbColaboradores, setDbColaboradores] = useState<Colaborador[]>([]);
  const [dbProcessos, setDbProcessos] = useState<any[]>([]);
  const [signatures, setSignatures] = useState<any[]>([]);

  useEffect(() => {
    const unsubColab =
      firestoreService.colaboradores.subscribe(setDbColaboradores);
    const unsubProc = firestoreService.processos.subscribe(setDbProcessos);
    const unsubSigs = firestoreService.signatures.subscribe(setSignatures);
    return () => {
      unsubColab();
      unsubProc();
      unsubSigs();
    };
  }, []);

  const handleIdNuitSearch = (value: string) => {
    setSearchIdNuit(value);
    const upperVal = value.toUpperCase();
    if (upperVal.trim().length > 0) {
      const allColaboradores = mergeColaboradores(dbColaboradores);
      const found = allColaboradores.find(
        (c) =>
          (c.id && c.id.toUpperCase() === upperVal) ||
          (c.numeroProcesso && c.numeroProcesso.toUpperCase() === upperVal) ||
          (c.nuit && c.nuit === value),
      );

      if (found) {
        // Find matching process to get the photo if it exists there
        const matchingProcess = dbProcessos.find(
          (p) =>
            p.id === found.id ||
            p.nuit === found.nuit ||
            p.numeroProcesso === found.numeroProcesso,
        );
        const fotoFromProcess = matchingProcess?.individualData?.fotoUrl;

        setNewCartao((prev) => ({
          ...prev,
          nome: found.nome,
          categoria: found.cargo || found.categoria,
          servico: found.departamento || found.direcao || found.unidade,
          foto: fotoFromProcess || found.fotoUrl,
          morada:
            found.morada ||
            matchingProcess?.individualData?.morada ||
            found.bairro ||
            "",
        }));
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = Math.random().toString(36).substr(2, 9);

    // Sync with process if applicable
    if (newCartao.nome && newCartao.foto) {
      const matchingProcess = dbProcessos.find(
        (p) =>
          p.nome === newCartao.nome ||
          p.id === newCartao.id ||
          p.nuit === (newCartao as any).nuit ||
          p.numeroProcesso === newCartao.numeroRegisto,
      );
      if (matchingProcess && !matchingProcess.individualData?.fotoUrl) {
        // We have a process, but no photo - update it
        await firestoreService.processos.update(matchingProcess.id, {
          ...matchingProcess,
          individualData: {
            ...(matchingProcess.individualData || {}),
            fotoUrl: newCartao.foto,
          },
        });
      }
    }

    setCartoes([...cartoes, { ...newCartao, id } as CartaoAssistencia]);
    setMode("list");
    setNewCartao({
      outrosFamiliares: ["", "", "", ""],
      localEmissao: "Songo",
      diaEmissao: currentDayStr,
      mesEmissao: currentMonthStr,
      anoEmissao: currentYearStr,
      status: "Ativo",
    });
    setSearchIdNuit("");
  };

  const handlePrint = (cartao?: Partial<CartaoAssistencia>) => {
    setPrintCartao(cartao || {});
    setTimeout(() => {
      printElementById("print-area");
      window.addEventListener("afterprint", () => setPrintCartao(null), {
        once: true,
      });
    }, 100);
  };

  const filteredCartoes = cartoes.filter(
    (c) =>
      c.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.numeroRegisto?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (printCartao) {
    return (
      <CartaoAssistenciaMedicaImpressao
        cartao={printCartao}
        signatures={signatures}
      />
    );
  }

  return (
      <div className="w-full h-full flex flex-col bg-gray-50 border-2 border-slate-100 rounded-3xl overflow-hidden shadow-sm print:hidden">
      <header className="bg-white border-b border-gray-100 p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={mode === "list" ? onBack : () => setMode("list")}
            className="p-2 hover:bg-gray-100 rounded-xl transition-all"
          >
            <ArrowLeft className="text-gray-500" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Heart className="text-red-500" /> Assistência Médica e
              Medicamentosa
            </h2>
            <p className="text-sm text-gray-500">
              Gerar e gerir Cartões de Assistência Médica
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {mode === "list" && (
            <>
              <button
                onClick={() => handlePrint()}
                title="Imprimir Cartão em Branco"
                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 hover:bg-blue-100 transition-all flex items-center gap-2 font-bold text-sm"
              >
                <Printer size={18} /> Imprimir Em Branco
              </button>
              <button
                onClick={() => setMode("new")}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-sm"
              >
                <Plus size={20} /> Novo Cartão
              </button>
            </>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6 relative">
        <AnimatePresence mode="wait">
          {mode === "list" ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6 max-w-6xl mx-auto"
            >
              <div className="flex flex-col md:flex-row gap-4 justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="relative flex-1 max-w-md">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Buscar por funcionário ou n.º registo..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {filteredCartoes.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm mt-6">
                  <Heart size={64} className="mx-auto text-gray-200 mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Nenhum cartão registado
                  </h3>
                  <p className="text-gray-500">
                    Clique em "Novo Cartão" para começar.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                  {filteredCartoes.map((cartao) => (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={cartao.id}
                      className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all group relative"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                          <Heart size={24} />
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider ${
                            cartao.status === "Ativo"
                              ? "bg-green-100 text-green-700"
                              : cartao.status === "Cancelado"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {cartao.status}
                        </span>
                      </div>

                      <h3 className="font-bold text-lg text-gray-800 mb-1 line-clamp-1">
                        {cartao.nome}
                      </h3>
                      <p className="text-sm font-semibold text-blue-600 mb-4">
                        N.º Reg: {cartao.numeroRegisto || "---"}
                      </p>

                      <div className="space-y-2 mt-4 p-4 bg-gray-50 rounded-2xl">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 font-medium">
                            Categoria
                          </span>
                          <span className="font-bold text-gray-800 line-clamp-1 text-right flex-1 ml-4">
                            {cartao.categoria || "---"}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 font-medium">
                            Válido Até
                          </span>
                          <span className="font-bold text-gray-800">
                            {cartao.validoAte || "---"}
                          </span>
                        </div>
                      </div>

                      <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => handlePrint(cartao)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl font-bold"
                          title="Imprimir Cartão"
                        >
                          <Printer size={18} />
                        </button>
                        <button
                          onClick={() =>
                            setCartoes(
                              cartoes.filter((a) => a.id !== cartao.id),
                            )
                          }
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl font-bold"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="new"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full h-full flex flex-col bg-gray-100 overflow-hidden"
            >
              <div className="p-6 bg-white border-b flex justify-between items-center shadow-sm z-10 shrink-0">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      Preencher Cartão
                    </h3>
                    <p className="text-sm font-semibold text-gray-500">
                      Assistência Médica
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative w-72 hidden md:block">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <input
                      type="text"
                      placeholder="Buscar Colaborador (ID) ou preencher..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 border border-transparent outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 font-semibold text-sm transition-all text-gray-800"
                      value={searchIdNuit}
                      onChange={(e) => setSearchIdNuit(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleIdNuitSearch(searchIdNuit)
                      }
                    />
                  </div>
                  <button
                    onClick={() => setMode("list")}
                    className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 font-bold rounded-xl text-sm transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-sm text-sm"
                  >
                    <Save size={18} /> Salvar Formulário
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto custom-scrollbar flex justify-center py-12 px-4 shadow-inner">
                <div className="origin-top transition-transform bg-white rounded-xl">
                  <CartaoAssistenciaMedicaImpressao
                    cartao={newCartao}
                    isPreview={true}
                    signatures={signatures}
                    onChange={(k, v) =>
                      setNewCartao((prev) => ({ ...prev, [k]: v }))
                    }
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

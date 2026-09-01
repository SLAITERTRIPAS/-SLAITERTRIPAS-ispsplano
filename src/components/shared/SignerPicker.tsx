import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Search, UserCheck, Send, Check } from "lucide-react";
import { Colaborador } from "../../types";
import { 
  buscarColaboradoresEfetivo, 
  buscarChefePorAfetacao,
  buscarChefeSecretariaGeral,
  buscarChefeDPEP,
  buscarChefeDAF,
  buscarChefePatrimonio,
  buscarDirectorDicosafa,
  buscarChefeSecretariaExecutiva,
  buscarDiretorGeral
} from "../../lib/responsaveisService";

interface SignerPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (signer: Colaborador) => void;
  nextStep: string;
  siglaUnidade?: string;
  isSubmitting?: boolean;
}

export const SignerPicker: React.FC<SignerPickerProps> = ({
  isOpen,
  onClose,
  onConfirm,
  nextStep,
  siglaUnidade,
  isSubmitting = false
}) => {
  const [availableSigners, setAvailableSigners] = useState<Colaborador[]>([]);
  const [selectedSigner, setSelectedSigner] = useState<Colaborador | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadSigners();
    }
  }, [isOpen, nextStep]);

  const loadSigners = async () => {
    setIsSearching(true);
    try {
      const all = await buscarColaboradoresEfetivo();
      let filtered: Colaborador[] = [];

      const stepClean = String(nextStep || "").toLowerCase();

      if (stepClean.includes("chefe do departamento") || stepClean.includes("chefe de setor")) {
        const chefe = buscarChefePorAfetacao(all, siglaUnidade || "");
        filtered = chefe ? [chefe] : [];
      } else if (stepClean.includes("secretaria geral")) {
        const chefe = buscarChefeSecretariaGeral(all);
        filtered = chefe ? [chefe] : [];
      } else if (stepClean.includes("dpep")) {
        const chefe = buscarChefeDPEP(all);
        filtered = chefe ? [chefe] : [];
      } else if (stepClean.includes("daf")) {
        const chefe = buscarChefeDAF(all);
        filtered = chefe ? [chefe] : [];
      } else if (stepClean.includes("património") || stepClean.includes("patrimonio")) {
        const chefe = buscarChefePatrimonio(all);
        filtered = chefe ? [chefe] : [];
      } else if (stepClean.includes("dicosafa")) {
        const chefe = buscarDirectorDicosafa(all);
        filtered = chefe ? [chefe] : [];
      } else if (stepClean.includes("secretaria executiva")) {
        const chefe = buscarChefeSecretariaExecutiva(all);
        filtered = chefe ? [chefe] : [];
      } else if (stepClean.includes("diretor geral") || stepClean.includes("direção geral") || stepClean.includes("gdg")) {
        const chefe = buscarDiretorGeral(all);
        filtered = chefe ? [chefe] : [];
      }

      // Se não encontrou nada específico, mostra chefias gerais como fallback
      if (filtered.length === 0) {
        filtered = all.filter(c => 
          String(c.cargo || "").toLowerCase().includes("chefe") || 
          String(c.cargo || "").toLowerCase().includes("director") ||
          String(c.cargo || "").toLowerCase().includes("diretor")
        ).slice(0, 15);
      }

      setAvailableSigners(filtered);
      if (filtered.length === 1) {
        setSelectedSigner(filtered[0]);
      }
    } catch (err) {
      console.error("Erro ao carregar assinantes:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const filteredSigners = availableSigners.filter(s => 
    String(s.nome || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    String(s.cargo || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:hidden">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-100"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-2">
                <Send className="text-blue-600" size={24} />
                Encaminhar Documento
              </h3>
              <p className="text-slate-500 text-xs font-bold  tracking-widest mt-1">
                Selecione o destinatário para a próxima etapa
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg text-white">
                  <UserCheck size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-blue-900  tracking-wider">Destino Atual</p>
                  <p className="text-sm font-bold text-blue-800">{nextStep}</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="Pesquisar por nome ou cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-600 transition-all"
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {isSearching ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-black  tracking-widest">Buscando responsáveis...</p>
                </div>
              ) : filteredSigners.length > 0 ? (
                filteredSigners.map((col) => (
                  <button
                    key={col.id}
                    onClick={() => setSelectedSigner(col)}
                    className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between group ${
                      selectedSigner?.id === col.id
                        ? "border-blue-600 bg-blue-50 shadow-md"
                        : "border-slate-100 hover:border-blue-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${
                        selectedSigner?.id === col.id ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"
                      }`}>
                        {col.nome.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-sm leading-tight">{col.nome}</p>
                        <p className="text-[10px] font-bold text-slate-500  tracking-wider mt-0.5">{col.cargo}</p>
                        <p className="text-[9px] text-blue-600 font-bold mt-0.5">{col.departamento || col.direcao}</p>
                      </div>
                    </div>
                    {selectedSigner?.id === col.id && (
                      <div className="bg-blue-600 text-white p-1.5 rounded-full shadow-lg">
                        <Check size={16} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <p className="text-xs font-bold ">Nenhum responsável encontrado.</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            <button
              onClick={onClose}
              className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] tracking-[0.2em]  hover:bg-slate-200 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={() => selectedSigner && onConfirm(selectedSigner)}
              disabled={!selectedSigner || isSubmitting}
              className="w-full py-4 bg-blue-900 text-white rounded-2xl font-black text-[10px] tracking-[0.2em]  hover:bg-blue-800 transition-all shadow-xl shadow-blue-100 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {isSubmitting ? "Enviando..." : "Confirmar Envio"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

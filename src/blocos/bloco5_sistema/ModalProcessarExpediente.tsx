import React, { useState } from "react";
import { motion } from "motion/react";
import {
  X,
  FileText,
  Send,
  MessageSquare,
  ShieldCheck,
  Building2,
  History,
  ArrowRight,
  Upload,
} from "lucide-react";
import { firestoreService } from "../../lib/firestoreService";
import SignatureUpload from "../bloco5_sistema/SignatureUpload";

const LIDERANCA = [
  "Diretor-Geral",
  "Diretor da Direção",
  "Chefe do Departamento",
  "Secretário Geral",
];

interface ModalProcessarExpedienteProps {
  user: any;
  expediente: any;
  onClose: () => void;
  onComplete: () => void;
}

export default function ModalProcessarExpediente({
  user,
  expediente,
  onClose,
  onComplete,
}: ModalProcessarExpedienteProps) {
  const [parecerTexto, setParecerTexto] = useState("");
  const [parecerAnexo, setParecerAnexo] = useState("");
  const [despacho, setDespacho] = useState<"AUTORIZAR" | "NAO_AUTORIZAR" | "">(
    "",
  );
  const [proximoDestino, setProximoDestino] = useState(
    expediente.destino || "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEncaminhar = async () => {
    setIsSubmitting(true);
    try {
      const updatedHistorico = [
        ...(expediente.historico || []),
        {
          data: new Date().toISOString(),
          setor: user.departamento || user.direcao || "Admin",
          acao: "Tramitação/Encaminhamento",
          parecer: parecerTexto,
          despacho: despacho,
          responsavel: user.name,
        },
      ];

      await firestoreService.expedientes.update(expediente.id, {
        destino: proximoDestino,
        status: despacho ? "Concluído" : "Pendente",
        historico: updatedHistorico,
        ultimaAtualizacao: new Date().toISOString(),
        vistoDigital: despacho
          ? { assinadoPor: user.name, data: new Date().toISOString() }
          : expediente.vistoDigital,
      });
      onComplete();
    } catch (error) {
      console.error("Erro ao processar expediente:", error);
      alert("Ocorreu um erro ao processar o expediente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      ></motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto"
      >
        <div className="w-full md:w-1/3 bg-slate-900 p-8 text-white flex flex-col">
          <button
            onClick={onClose}
            className="absolute top-6 left-6 text-slate-400 hover:text-white transition-all"
          >
            <X size={24} />
          </button>
          <div className="mt-8 mb-12">
            <div className="bg-amber-600 w-16 h-16 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-amber-600/20">
              <FileText size={32} />
            </div>
            <h2 className="text-2xl font-black tracking-tighter leading-tight">
              Tramitação
              <br />
              Expediente
            </h2>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[10px] font-mono font-black text-slate-500 tracking-widest">
                {expediente.numero}
              </span>
              <div className="h-1 w-8 bg-amber-600 rounded-full"></div>
            </div>
          </div>
          <div className="space-y-6 flex-1 text-sm font-bold">
            <p>
              <span className="text-slate-500 block text-[10px]">Origem</span>
              {expediente.origem}
            </p>
            <p>
              <span className="text-slate-500 block text-[10px]">Assunto</span>
              {expediente.assunto}
            </p>
          </div>
        </div>
        <div className="flex-1 p-10 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-black text-slate-400 tracking-[0.2em] mb-3 flex items-center gap-2">
                <MessageSquare size={16} className="text-amber-600" /> Parecer e
                Despacho
              </h3>
              <div className="space-y-4">
                <textarea
                  rows={3}
                  value={parecerTexto}
                  onChange={(e) => setParecerTexto(e.target.value)}
                  placeholder="Insira o seu parecer técnico aqui..."
                  className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm font-medium focus:ring-4 focus:ring-amber-500/10 outline-none transition-all resize-none"
                />
                <SignatureUpload
                  label="Upload Parecer (Anexo)"
                  value={parecerAnexo}
                  onChange={setParecerAnexo}
                  user={user}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 tracking-widest mb-2 block">
                  Emitir Despacho
                </label>
                <select
                  value={despacho}
                  onChange={(e) => setDespacho(e.target.value as any)}
                  className={`w-full p-4 rounded-xl border-2 font-black text-sm outline-none transition-all ${despacho === "AUTORIZAR" ? "border-green-600 text-green-700 bg-green-50" : despacho === "NAO_AUTORIZAR" ? "border-red-600 text-red-700 bg-red-50" : "border-slate-200"}`}
                >
                  <option value="">Selecione o despacho...</option>
                  <option
                    value="AUTORIZAR"
                    className="font-bold text-green-700"
                  >
                    É DE AUTORIZAR
                  </option>
                  <option
                    value="NAO_AUTORIZAR"
                    className="font-bold text-red-700"
                  >
                    NÃO É DE AUTORIZAR
                  </option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 tracking-widest mb-2 block">
                  Submeter a (Chefia)
                </label>
                <select
                  value={proximoDestino}
                  onChange={(e) => setProximoDestino(e.target.value)}
                  className="w-full p-4 rounded-xl border-2 border-slate-200 text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="">Selecione a chefia...</option>
                  {LIDERANCA.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleEncaminhar}
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center gap-3 px-10 py-4 bg-slate-900 text-white rounded-[2rem] font-black tracking-widest text-xs hover:bg-slate-800 transition-all shadow-2xl disabled:opacity-50`}
            >
              {isSubmitting ? (
                "Processando..."
              ) : (
                <>
                  Finalizar Tramitação <Send size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

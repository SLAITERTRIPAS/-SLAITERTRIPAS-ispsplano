import React, { useState } from "react";
import { motion } from "motion/react";
import {
  X,
  FileText,
  CheckCircle2,
  XCircle,
  ArrowRight,
  MessageSquare,
  ClipboardList,
  ShieldCheck,
  Building2,
  Settings,
  History,
} from "lucide-react";
import { firestoreService } from "../../lib/firestoreService";

interface ModalProcessarRequisicaoProps {
  user: any;
  requisicao: any;
  onClose: () => void;
  onComplete: () => void;
}

export default function ModalProcessarRequisicao({
  user,
  requisicao,
  onClose,
  onComplete,
}: ModalProcessarRequisicaoProps) {
  const [parecer, setParecer] = useState("");
  const [decisao, setDecisao] = useState<"Favorável" | "Desfavorável" | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEncaminhar = async () => {
    if (!decisao) {
      alert("Por favor, selecione se o parecer é Favorável ou Desfavorável.");
      return;
    }
    if (!parecer.trim()) {
      alert("Por favor, escreva uma breve descrição do seu parecer.");
      return;
    }

    setIsSubmitting(true);
    try {
      const currentStep = requisicao.etapaAtual;
      let nextStep = currentStep + 1;

      // Workflow branching logic requested by user
      // 0:Necessitado -> 1:Secretaria -> 2:Economato -> 3:Chefe
      // From 3 onwards, it branches

      const updatedHistorico = [
        ...(requisicao.historicoPareceres || []),
        {
          etapa: currentStep,
          unidade: user.departamento || user.direcao || "Admin",
          responsavel: user.name,
          parecer: parecer,
          decisao: decisao,
          despacho: parecer, // User requested "despacho"
          data: new Date().toISOString(),
        },
      ];

      const updateData: any = {
        etapaAtual: nextStep,
        status: decisao, // Update global status based on current decision
        historicoPareceres: updatedHistorico,
        ultimaAtualizacao: new Date().toISOString(),
      };

      // Generate intermediate references for transparency
      if (nextStep === 4) {
        if (decisao === "Favorável") {
          updateData.referenciaEtapa = `TE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`; // Termo de Entrega ref
        } else {
          updateData.referenciaEtapa = `CP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`; // Comunicado de Parecer ref
        }
      }

      await firestoreService.requisicoes_internas.update(
        requisicao.id,
        updateData,
      );

      // Send notification if we have a student ID
      if (requisicao.solicitanteId) {
        await firestoreService.messages.add({
          text: `O seu pedido ${requisicao.numero} recebeu um despacho: ${parecer}. Decisão: ${decisao}.`,
          subject: `Atualização do pedido ${requisicao.numero}`,
          senderId: user.id,
          senderName: user.name,
          recipientId: requisicao.solicitanteId,
          recipientName: requisicao.solicitante,
          timestamp: new Date().toISOString(),
          read: false,
        });
      }

      onComplete();
    } catch (error) {
      console.error("Erro ao processar requisição:", error);
      alert("Ocorreu um erro ao processar o documento. Tente novamente.");
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
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto"
      >
        {/* Lado Esquerdo: Informação do Documento */}
        <div className="w-full md:w-1/3 bg-slate-900 p-8 text-white flex flex-col">
          <button
            onClick={onClose}
            className="absolute top-6 left-6 text-slate-400 hover:text-white transition-all"
          >
            <X size={24} />
          </button>

          <div className="mt-8 mb-12">
            <div className="bg-blue-600 w-16 h-16 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-blue-600/20">
              <FileText size={32} />
            </div>
            <h2 className="text-2xl font-black tracking-tighter leading-tight">
              Processar
              <br />
              Requisição
            </h2>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[10px] font-mono font-black text-slate-500 tracking-widest">
                {requisicao.numero}
              </span>
              <div className="h-1 w-8 bg-blue-600 rounded-full"></div>
            </div>
          </div>

          <div className="space-y-6 flex-1">
            <div>
              <label className="text-[10px] font-black text-slate-500 tracking-widest mb-1 block">
                Solicitante
              </label>
              <p className="text-sm font-bold">{requisicao.solicitante}</p>
              <p className="text-[10px] text-slate-400 italic">
                Departamento: {requisicao.departamento}
              </p>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 tracking-widest mb-1 block">
                Data do Pedido
              </label>
              <p className="text-sm font-bold">{requisicao.data}</p>
            </div>

            {/* Histórico Simplificado */}
            <div className="pt-6 border-t border-white/10">
              <h4 className="text-[10px] font-black text-white tracking-widest mb-4 flex items-center gap-2">
                <History size={14} className="text-blue-400" /> Histórico de
                Tramitação
              </h4>
              <div className="space-y-4">
                {requisicao.historicoPareceres?.map((h: any, i: number) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={12} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black tracking-tighter text-slate-200">
                        {h.unidade}
                      </p>
                      <p className="text-[9px] text-slate-400 italic font-medium">
                        {h.decisao}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito: Formulário de Parecer */}
        <div className="flex-1 p-10 overflow-y-auto">
          <div className="mb-10">
            <h3 className="text-xs font-black text-slate-400 tracking-[0.2em] mb-2 flex items-center gap-2">
              <ClipboardList size={16} className="text-blue-600" /> Detalhes dos
              Itens Requisitados
            </h3>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-600 text-sm">
              {requisicao.itens?.map((item: any, i: number) => (
                <div
                  key={i}
                  className="flex justify-between border-b border-slate-200 py-2 last:border-0"
                >
                  <span className="font-bold">{item.descricao}</span>
                  <span className="font-mono text-xs">
                    {item.quantidade} {item.unidade}
                  </span>
                </div>
              )) || (
                <p>
                  Verificando listagem de materiais no documento original...
                </p>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-xs font-black text-slate-400 tracking-[0.2em] mb-4">
                Unidade Decisora: {user.departamento || "Geral"}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setDecisao("Favorável")}
                  className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${
                    decisao === "Favorável"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                      : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                  }`}
                >
                  <CheckCircle2 size={24} />
                  <span className="text-xs font-black tracking-widest">
                    Favorável
                  </span>
                </button>
                <button
                  onClick={() => setDecisao("Desfavorável")}
                  className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${
                    decisao === "Desfavorável"
                      ? "bg-red-50 border-red-500 text-red-700"
                      : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                  }`}
                >
                  <XCircle size={24} />
                  <span className="text-xs font-black tracking-widest">
                    Desfavorável
                  </span>
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-black text-slate-400 tracking-[0.2em] mb-3 flex items-center gap-2">
                <MessageSquare size={16} className="text-blue-600" /> Parecer
                Técnico / Justificação
              </h3>
              <textarea
                rows={5}
                value={parecer}
                onChange={(e) => setParecer(e.target.value)}
                placeholder="Descreva a sua análise técnica sobre este pedido..."
                className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm font-medium focus:ring-4 focus:ring-blue-500/10 outline-none transition-all resize-none"
              />
            </div>

            <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-900 leading-none">
                    {user.name}
                  </p>
                  <p className="text-[8px] text-slate-400 font-black tracking-widest mt-1">
                    Responsável pela Validação
                  </p>
                </div>
              </div>

              <button
                onClick={handleEncaminhar}
                disabled={isSubmitting}
                className={`flex items-center gap-3 px-10 py-4 bg-slate-900 text-white rounded-[2rem] font-black tracking-widest text-xs hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSubmitting ? (
                  "Processando..."
                ) : (
                  <>
                    Encaminhar Processo <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

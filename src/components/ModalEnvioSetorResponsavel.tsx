import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Send,
  Building2,
  UserCheck,
  Mail,
  ShieldCheck,
  Info,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Sparkles,
  X,
} from "lucide-react";
import {
  DestinatarioInfo,
  LISTA_SETORES_DESTINATARIOS,
  resolverDestinatarioSetorEResponsavel,
} from "../lib/responsaveisService";

interface ModalEnvioSetorResponsavelProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (destinatario: DestinatarioInfo) => void | Promise<void>;
  user: any;
  colaboradoresList?: any[];
  defaultSetorDestino?: string;
  defaultToStatus?: string;
  customTitle?: string;
  itemCount?: number;
  itemDescription?: string;
  isLoading?: boolean;
}

export const ModalEnvioSetorResponsavel: React.FC<ModalEnvioSetorResponsavelProps> = ({
  isOpen,
  onClose,
  onConfirm,
  user,
  colaboradoresList = [],
  defaultSetorDestino = "",
  defaultToStatus = "",
  customTitle = "Enviar e Encaminhar ao Setor",
  itemCount = 1,
  itemDescription = "Atividade de Planificação",
  isLoading = false,
}) => {
  const [selectedSetorStr, setSelectedSetorStr] = useState<string>(
    defaultSetorDestino || "DPEP"
  );
  const [destinatarioInfo, setDestinatarioInfo] = useState<DestinatarioInfo>(
    resolverDestinatarioSetorEResponsavel(
      defaultSetorDestino || "DPEP",
      user,
      colaboradoresList
    )
  );

  // Determinar opções de setores adequadas ao fluxo
  useEffect(() => {
    let initialTarget = defaultSetorDestino;
    if (!initialTarget) {
      if (defaultToStatus === "reparticao") {
        initialTarget = user?.reparticao || "Repartição";
      } else if (defaultToStatus === "departamento") {
        initialTarget = user?.departamento || "Departamento";
      } else if (defaultToStatus === "direcao") {
        initialTarget = user?.direcao || "Direção";
      } else if (defaultToStatus === "planificacao" || defaultToStatus === "dpep_chefe") {
        initialTarget = "Departamento de Planificação Estudos e Projetos (DPEP)";
      } else if (defaultToStatus === "orgao_colegial" || defaultToStatus === "institucional") {
        initialTarget = "Conselho de Direção / Órgão Colegial";
      } else {
        initialTarget = "Departamento de Planificação Estudos e Projetos (DPEP)";
      }
    }
    setSelectedSetorStr(initialTarget);
  }, [defaultSetorDestino, defaultToStatus, user]);

  // Atualizar informações do responsável sempre que o setor mudar
  useEffect(() => {
    if (selectedSetorStr) {
      const info = resolverDestinatarioSetorEResponsavel(
        selectedSetorStr,
        user,
        colaboradoresList
      );
      setDestinatarioInfo(info);
    }
  }, [selectedSetorStr, user, colaboradoresList]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 15 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-950/40">
                <Send size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">{customTitle}</h3>
                <p className="text-xs text-emerald-200 font-medium">
                  {itemCount} {itemCount === 1 ? itemDescription : `${itemDescription}s`} para expedição oficial
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-5">
            {/* Aviso de Visibilidade */}
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3">
              <div className="p-1.5 bg-blue-600 text-white rounded-lg shrink-0 mt-0.5">
                <Info size={14} />
              </div>
              <p className="text-xs text-blue-950 leading-relaxed font-medium">
                <strong>Regra de Visibilidade do Sistema:</strong> Este registo só ficará visível para os colaboradores do setor destinatário assim que for enviado e recebido pelo respetivo responsável.
              </p>
            </div>

            {/* Seleção do Setor Destinatário */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Setor / Unidade Destinatária:</span>
                <span className="text-[11px] text-emerald-700 font-semibold">
                  {destinatarioInfo.siglaSetor}
                </span>
              </label>

              <select
                value={selectedSetorStr}
                onChange={(e) => setSelectedSetorStr(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none text-sm font-semibold bg-slate-50 hover:bg-white transition-all text-slate-800"
              >
                {LISTA_SETORES_DESTINATARIOS.map((s) => (
                  <option key={s.setorNome} value={s.setorNome}>
                    {s.setorNome} ({s.responsavelCargo})
                  </option>
                ))}
              </select>
            </div>

            {/* CARD DESTACADO: SETOR E RESPONSÁVEL QUE IRÁ RECEBER */}
            <div className="rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50/50 via-teal-50/30 to-slate-50 p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3">
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-emerald-700" />
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-900">
                    Setor de Destino
                  </span>
                </div>
                <span className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-black rounded-lg uppercase tracking-wide">
                  {destinatarioInfo.siglaSetor || "DESTINO"}
                </span>
              </div>

              {/* Nome do Setor */}
              <div>
                <p className="text-sm font-extrabold text-slate-900">
                  {destinatarioInfo.setorNome}
                </p>
                {destinatarioInfo.descricao && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {destinatarioInfo.descricao}
                  </p>
                )}
              </div>

              {/* Responsável que irá receber */}
              <div className="p-3.5 bg-white rounded-xl border border-emerald-200/70 shadow-sm flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md shadow-emerald-200">
                  <UserCheck size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      Responsável a Receber:
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 truncate">
                    {destinatarioInfo.responsavelNome}
                  </h4>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">
                    {destinatarioInfo.responsavelCargo}
                  </p>
                  {destinatarioInfo.responsavelEmail && (
                    <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-500 font-medium">
                      <Mail size={12} className="text-slate-400" />
                      <span>{destinatarioInfo.responsavelEmail}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Assinatura do Remetente */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-200/40">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <ShieldCheck size={15} className="text-emerald-600" />
                  <span>
                    Remetente: <strong>{user?.nome || user?.name || user?.email}</strong>
                  </span>
                </div>
                <span className="text-[11px] text-emerald-700 font-bold">
                  {user?.cargo || user?.cargoChefia || "Responsável"}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-200 font-bold text-xs transition-all active:scale-95 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onConfirm(destinatarioInfo)}
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-200 flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>A Enviar...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Confirmar e Enviar para {destinatarioInfo.siglaSetor}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
export default ModalEnvioSetorResponsavel;

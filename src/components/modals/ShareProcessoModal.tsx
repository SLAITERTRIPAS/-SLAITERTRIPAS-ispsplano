import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Share2,
  Power,
  Copy,
  Check,
  MessageSquare,
  Mail,
  ExternalLink,
} from "lucide-react";

interface ShareProcessoModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

export default function ShareProcessoModal({
  isOpen,
  onClose,
  userName,
}: ShareProcessoModalProps) {
  const [selectedRole, setSelectedRole] = useState("Docente");
  const [selectedDept, setSelectedDept] = useState("Geral");
  const [selectedProcessoId, setSelectedProcessoId] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  const getGeneratedLink = () => {
    const baseAppUrl = window.location.origin;
    return selectedProcessoId
      ? `${baseAppUrl}?processoId=${encodeURIComponent(selectedProcessoId)}`
      : `${baseAppUrl}?dept=${encodeURIComponent(selectedDept)}&role=${encodeURIComponent(selectedRole)}`;
  };

  const getInvitationText = () => {
    const genLink = getGeneratedLink();
    return selectedProcessoId
      ? `*SIGEP - Sistema Integrado de Gestão do Pessoal*\n\nSaudações institucionais do Songo.\n\nConvidamos a aceder ao Processo Individual *${selectedProcessoId}*.\n\nLink de acesso:\n${genLink}\n\n_Autenticado digitalmente pelo Songo._`
      : `*SIGEP - Sistema Integrado de Gestão do Pessoal*\n\nSaudações institucionais do Songo.\n\nConvidamos a aceder ao canal de partilha para o cargo de *${selectedRole}* (${selectedDept}).\n\nLink de acesso permanente:\n${genLink}\n\n_Autenticado digitalmente pelo Songo._`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm pointer-events-auto p-4 font-sans">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-[2rem] border-4 border-[#121c60] w-full max-w-2xl overflow-hidden shadow-2xl relative text-slate-800"
          >
            {/* Header */}
            <div className="bg-[#121c60] p-6 text-white flex items-center justify-between border-b-4 border-[#FFB800]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Share2 size={24} className="text-[#FFB800]" />
                </div>
                <div>
                  <h3
                    className="font-sans font-black text-lg tracking-wider text-white"
                    style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.5)" }}
                  >
                    Gerar Link de Processo
                  </h3>
                  <p className="text-xs text-blue-200">
                    Partilhe o link direto para o Processo Individual
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/10 rounded-lg text-white transition-colors"
              >
                <Power size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 md:p-8 space-y-6 max-h-[70vh] overflow-y-auto text-left">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-[11px] text-amber-900 leading-relaxed font-semibold">
                Insira o Nº de Processo Individual (Ex: Songo/001/2026) para
                obter o link autenticado de acesso.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 tracking-wider mb-1.5">
                      Nº de Processo Individual
                    </label>
                    <input
                      type="text"
                      value={selectedProcessoId}
                      onChange={(e) => setSelectedProcessoId(e.target.value)}
                      placeholder="Ex: Songo/001/2026"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#121c60] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 tracking-wider mb-1.5">
                      Cargo / Perfil
                    </label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#121c60] transition-all"
                    >
                      <option value="Docente">Docente</option>
                      <option value="Técnico Administrativo">
                        Técnico Administrativo
                      </option>
                      <option value="Chefe de Departamento">
                        Chefe de Departamento
                      </option>
                      <option value="Diretor">Diretor</option>
                    </select>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-500 tracking-wider">
                        Link Direto
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(getGeneratedLink());
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2000);
                        }}
                        className="text-[10px] text-[#121c60] hover:text-blue-800 font-extrabold flex items-center gap-1.5"
                      >
                        {copiedLink ? (
                          <Check size={11} className="text-emerald-600" />
                        ) : (
                          <Copy size={11} />
                        )}
                        <span className={copiedLink ? "text-emerald-600" : ""}>
                          {copiedLink ? "Copiado!" : "Copiar"}
                        </span>
                      </button>
                    </div>
                    <div className="bg-white border border-slate-100 p-2.5 rounded-lg select-all break-all text-[9.5px] font-mono font-semibold text-[#121c60]">
                      {getGeneratedLink()}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 items-center justify-center">
                  <div className="w-full space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-[10px] font-black text-slate-500 tracking-wider">
                        Convite
                      </strong>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(getInvitationText());
                          setCopiedMsg(true);
                          setTimeout(() => setCopiedMsg(false), 2000);
                        }}
                        className="text-[10px] text-[#121c60] hover:text-blue-800 font-extrabold flex items-center gap-1.5"
                      >
                        {copiedMsg ? (
                          <Check size={11} className="text-emerald-600" />
                        ) : (
                          <Copy size={11} />
                        )}
                        <span className={copiedMsg ? "text-emerald-600" : ""}>
                          {copiedMsg ? "Copiada!" : "Copiar"}
                        </span>
                      </button>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[10px] text-[#121c60] font-bold text-left whitespace-pre-line leading-relaxed h-[80px] overflow-hidden truncate">
                      {getInvitationText()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row gap-3">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(getInvitationText())}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs tracking-wider"
                >
                  <MessageSquare size={16} />
                  <span>WhatsApp</span>
                </a>

                <a
                  href={`mailto:?subject=Acesso%20Partilhado%20ao%20SIGEP&body=${encodeURIComponent(getInvitationText())}`}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs tracking-wider"
                >
                  <Mail size={16} />
                  <span>E-mail</span>
                </a>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-bold tracking-wider">
              <span>© Songo | Direção de Tecnologia</span>
              <span className="text-emerald-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Autenticado
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

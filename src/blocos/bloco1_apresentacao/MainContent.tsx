import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function MainContent({
  onStart,
  onVisitante,
  onSigpro,
  onMonografia,
  user,
}: {
  onStart: () => void;
  onVisitante: () => void;
  onSigpro: () => void;
  onMonografia: () => void;
  user?: any;
}) {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div className="text-center px-4 max-w-5xl mx-auto relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <h1 className="text-white font-bookman font-bold text-4xl md:text-[50px] leading-tight tracking-tighter mb-2 text-3d">
          <span className="block text-3xl md:text-[50px] leading-tight">
            Sistema Integrado de Gestão
          </span>
          <span className="block text-3xl md:text-[50px] leading-tight mb-2">
            de Planificação Songo
          </span>
          <span className="block text-6xl md:text-[80px] mt-2 font-bookman">
            2026
          </span>
        </h1>

        {user && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-amber-400 text-sm md:text-lg mb-1 font-bold tracking-widest"
          >
            Sessão ativa: {user.name}
          </motion.p>
        )}

        <p className="text-white/60 text-sm md:text-base max-w-xl mx-auto mb-3 leading-relaxed font-serif italic tracking-wide">
          Plataforma unificada para indicadores estratégicos, projeções
          acadêmicas <br className="hidden md:block" /> e conformidade normativa
          do Songo.
        </p>
      </motion.div>

      <div className="flex flex-col gap-3 items-center relative">
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="w-72 bg-white/10 backdrop-blur-xl text-white px-10 py-3 font-black hover:bg-white/20 transition-all tracking-[0.3em] text-sm flex items-center justify-center gap-3 border border-white/20 group relative overflow-visible rounded-xl"
          style={{
            boxShadow:
              "0 4px 0 rgba(255, 255, 255, 0.2), 0 10px 15px rgba(0, 0, 0, 0.5)",
            transform: showOptions ? "translateY(4px)" : "translateY(0)",
            marginBottom: showOptions ? "-4px" : "0",
          }}
        >
          <span className="group-hover:scale-110 transition-transform">
            {user ? "Continuar" : "Entrar"}
          </span>
          {showOptions ? (
            <ChevronUp size={20} className="opacity-80" />
          ) : (
            <ChevronDown size={20} className="opacity-80" />
          )}
        </button>

        <AnimatePresence>
          {showOptions && (
            <motion.div
              initial={{ opacity: 0, y: -10, rotateX: -15 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, y: -10, rotateX: -15 }}
              className="flex flex-col gap-2 mt-2 w-72 absolute top-full mb-8 z-20 perspective-1000"
            >
              <button
                onClick={onStart}
                className="w-full bg-white text-[#0a0a5a] px-10 py-3 font-black hover:bg-slate-100 transition-all tracking-widest text-[12px] flex items-center justify-center gap-2 rounded-xl active:translate-y-1"
                style={{
                  boxShadow: "0 4px 0 #cbd5e1, 0 10px 15px rgba(0, 0, 0, 0.5)",
                }}
              >
                <span>{user ? "Aceder ao Painel" : "Iniciar O Sistema"}</span>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse shadow-md"></div>
              </button>

              <button
                onClick={() => {
                  onVisitante();
                }}
                className="w-full bg-white/10 backdrop-blur-md text-white px-10 py-3 font-black hover:bg-white/20 transition-all tracking-widest text-[12px] border border-white/10 rounded-xl active:translate-y-1"
                style={{
                  boxShadow:
                    "0 4px 0 rgba(255, 255, 255, 0.2), 0 10px 15px rgba(0, 0, 0, 0.5)",
                }}
              >
                <span>Biblioteca</span>
              </button>

              <button
                onClick={onSigpro}
                className="w-full bg-white text-orange-600 px-10 py-3 font-black hover:bg-slate-100 transition-all tracking-widest text-[12px] flex items-center justify-center gap-2 rounded-xl active:translate-y-1"
                style={{
                  boxShadow: "0 4px 0 #fdba74, 0 10px 15px rgba(0, 0, 0, 0.5)",
                }}
              >
                <span>Sigpro</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-3">
        <div className="flex justify-center gap-2">
          <div className="w-1 h-1 rounded-full bg-white/20"></div>
          <div className="w-1 h-1 rounded-full bg-white/20"></div>
          <div className="w-1 h-1 rounded-full bg-white/20"></div>
        </div>
      </div>
    </div>
  );
}

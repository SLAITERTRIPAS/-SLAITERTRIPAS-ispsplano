import React from "react";
import { motion } from "motion/react";
import { ProcessingCircle } from "../../components/ui/ProcessingCircle";

export default function LoadingSpinner() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/60 backdrop-blur-md">
      <div className="relative flex flex-col items-center justify-center">
        <ProcessingCircle size={140} strokeWidth={0.8} />
        <div className="mt-8 text-center flex flex-col items-center">
          <motion.p
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-slate-800 font-black text-sm tracking-[0.4em]"
          >
            SISTEMA CARREGANDO
          </motion.p>
          <p className="mt-2 text-[10px] text-slate-400 font-bold tracking-widest ">
            Aguarde um momento...
          </p>
        </div>
      </div>
    </div>
  );
}

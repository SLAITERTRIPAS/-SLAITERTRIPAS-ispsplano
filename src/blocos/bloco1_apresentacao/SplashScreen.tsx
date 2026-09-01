import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ProcessingCircle } from "../../components/ui/ProcessingCircle";
import { isSuperBossUser } from "../../lib/auth";

export default function SplashScreen({
  user,
  isFirstLogin,
  onFinish,
  initStatus,
}: {
  user: any;
  isFirstLogin: boolean;
  onFinish: () => void;
  initStatus?: string;
}) {
  const [phase, setPhase] = useState<"loading" | "welcome">("loading");
  const [progress, setProgress] = useState(0);

  const onFinishRef = React.useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    if (phase !== "loading") return;

    let progressTimer: NodeJS.Timeout;
    let currentProg = 0;

    progressTimer = setInterval(() => {
      currentProg += 2.5; // 40 passos para chegar a 100
      if (currentProg >= 100) {
        setProgress(100);
        clearInterval(progressTimer);
        setTimeout(() => {
          setProgress(0);
          setPhase("welcome");
        }, 150);
      } else {
        setProgress(Math.min(100, Math.round(currentProg)));
      }
    }, 50); // 50ms * 40 passos = 2000ms (2.0 segundos para a primeira fase)

    return () => {
      if (progressTimer) clearInterval(progressTimer);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "welcome") return;

    let progressTimer: NodeJS.Timeout;
    let currentProg = 0;

    progressTimer = setInterval(() => {
      currentProg += 2.5; // 40 passos para chegar a 100
      if (currentProg >= 100) {
        setProgress(100);
        clearInterval(progressTimer);
        setTimeout(() => {
          onFinishRef.current();
        }, 150);
      } else {
        setProgress(Math.min(100, Math.round(currentProg)));
      }
    }, 50); // 50ms * 40 passos = 2000ms (2.0 segundos para a segunda fase)

    return () => {
      if (progressTimer) clearInterval(progressTimer);
    };
  }, [phase]);

  const currentYear = new Date().getFullYear();

  const textShadowStyle = {
    textShadow: `
      1px 1px 0px #1e293b,
      2px 2px 0px #1e293b,
      3px 3px 0px #1e293b,
      4px 4px 0px #1e293b,
      5px 5px 0px #1e293b,
      6px 6px 15px rgba(0,0,0,0.5)
    `,
  };

  const welcomeMessage = () => {
    const cargo =
      user?.cargoChefia && user?.cargoChefia !== "Nenhum"
        ? user.cargoChefia
        : user?.role || user?.cargo || user?.funcao || "---";
    const isOwnerOrAdmin = isSuperBossUser(user);

    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-4xl md:text-5xl font-black text-[#0a0a5a] text-center leading-tight font-serif">
            {user?.name || "Utilizador"}
          </h1>
          <p className="text-2xl md:text-3xl font-bold text-gray-800 text-center leading-relaxed font-serif">
            {isOwnerOrAdmin ? (
              <span className="block text-3xl md:text-4xl font-extrabold text-[#13136e]">
                Proprietário / Programador
              </span>
            ) : (
              <>
                Seja bem-vindo a <br />
                {user?.direcao && (
                  <span className="block text-3xl md:text-4xl font-extrabold text-[#13136e]">
                    {user.direcao}
                  </span>
                )}
                {user?.departamento && (
                  <span className="block text-xl md:text-2xl font-bold text-gray-700">
                    {user.departamento}
                  </span>
                )}
                {user?.reparticao && (
                  <span className="block text-xl md:text-2xl font-bold text-gray-700">
                    {user.reparticao}
                  </span>
                )}
              </>
            )}
          </p>
          <p 
            className="text-4xl md:text-5xl font-black text-[#0a0a5a] text-center leading-relaxed font-bookman-bordado"
            style={textShadowStyle}
          >
            2026
          </p>
          <p className="text-xl md:text-2xl font-bold text-gray-800 text-center leading-relaxed font-serif pt-4">
            {isOwnerOrAdmin ? "Proprietário e Programador" : cargo}
          </p>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-white overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.8 }}
            className="relative flex flex-col items-center justify-center"
          >
            <div className="flex items-center justify-center gap-1 md:gap-4 mb-10">
              {currentYear
                .toString()
                .split("")
                .map((char, i) => (
                  <motion.div
                    key={i}
                    initial={{
                      scale: 8,
                      opacity: 0,
                      filter: "blur(20px)",
                      zIndex: 10 - i,
                    }}
                    animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                    transition={{
                      duration: 0.4,
                      delay: i * 0.1,
                      type: "spring",
                      stiffness: 120,
                      damping: 12,
                    }}
                    className="text-[120px] md:text-[200px] select-none tabular-nums font-bookman-bordado"
                    style={{ textShadow: "none" }}
                  >
                    {char}
                  </motion.div>
                ))}
            </div>

            <div className="mb-6">
              <ProcessingCircle size={60} strokeWidth={2} />
            </div>

            {/* Progress bar with numeric percentage underneath */}
            <div className="w-full max-w-sm flex flex-col items-center gap-2 mb-6 px-4">
              <div className="w-full h-4 bg-slate-100 rounded-full p-[2px] border border-slate-200/80 shadow-inner overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 shadow"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-blue-700 font-serif text-2xl font-black tracking-tight tabular-nums animate-pulse">
                {progress}%
              </span>
            </div>

            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <p className="font-black text-xl tracking-[0.2em] text-slate-700">
                {initStatus || "Processando..."}
              </p>
            </motion.div>
          </motion.div>
        )}

        {phase === "welcome" && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className="text-center w-full max-w-5xl px-6"
          >
            {welcomeMessage()}

            {/* Auto-transitioning... */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center mt-12 gap-4"
            >
              <div className="w-full max-w-lg h-5 bg-slate-100/80 rounded-full p-[3px] border border-slate-200/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] relative overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 via-purple-500 via-pink-500 via-red-500 via-orange-500 via-yellow-400 to-emerald-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.08, ease: "easeInOut" }}
                />
              </div>
              <span className="text-rose-600 font-serif text-3xl md:text-5xl font-black tracking-tight drop-shadow-sm leading-none tabular-nums select-none animate-pulse">
                {progress}%
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Decorative Elements */}
      <div className="absolute inset-0 -z-10 opacity-5 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-600 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2"></div>
      </div>
    </div>
  );
}

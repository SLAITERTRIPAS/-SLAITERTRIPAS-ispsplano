import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Check,
  X,
  AlertCircle,
  RefreshCw,
  Feather,
  CheckCheck,
  Loader2,
  ChevronRight,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { safeJSONStringify } from "../../lib/utils";

interface Correction {
  original: string;
  replacement: string;
  explanation: string;
  type: "spelling" | "grammar" | "style" | "clarity";
}

export default function GrammarlySystemOverlay() {
  const [activeElement, setActiveElement] = useState<
    HTMLTextAreaElement | HTMLInputElement | null
  >(null);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0 });
  const [showIndicator, setShowIndicator] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const [textValue, setTextValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [correctedText, setCorrectedText] = useState("");
  const [summary, setSummary] = useState("");
  const [mode, setMode] = useState<"standard" | "formal" | "simple" | "expand">(
    "standard",
  );
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const popoverRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLButtonElement>(null);

  // Monitorar focus em inputs/textareas por todo o DOM
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "TEXTAREA" ||
          (target.tagName === "INPUT" &&
            ![
              "checkbox",
              "radio",
              "file",
              "submit",
              "button",
              "password",
              "number",
              "range",
              "color",
              "date",
              "time",
            ].includes((target as HTMLInputElement).type)))
      ) {
        const textTarget = target as HTMLTextAreaElement | HTMLInputElement;
        setActiveElement(textTarget);
        setTextValue(textTarget.value);
        updatePositions(textTarget);
      }
    };

    const handleInput = (e: Event) => {
      const target = e.target as HTMLElement;
      if (activeElement && target === activeElement) {
        const val = (target as HTMLInputElement).value;
        setTextValue(val);
        // Atualiza a visibilidade do indicador de acordo com o tamanho do texto
        setShowIndicator(val.trim().length >= 5);
      }
    };

    // Monitorar cliques fora para fechar popover
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        indicatorRef.current &&
        !indicatorRef.current.contains(target)
      ) {
        setShowPopover(false);
      }
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("input", handleInput);
    document.addEventListener("mousedown", handleDocumentClick);

    // Também atualizar posições ao redimensionar ou rolar a tela
    const handleResizeOrScroll = () => {
      if (activeElement) {
        updatePositions(activeElement);
      }
    };
    window.addEventListener("resize", handleResizeOrScroll);
    window.addEventListener("scroll", handleResizeOrScroll, { passive: true });

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("input", handleInput);
      document.removeEventListener("mousedown", handleDocumentClick);
      window.removeEventListener("resize", handleResizeOrScroll);
      window.removeEventListener("scroll", handleResizeOrScroll);
    };
  }, [activeElement]);

  // Atualizar visibilidade do indicador conforme o texto do activeElement muda
  useEffect(() => {
    if (activeElement) {
      setShowIndicator(textValue.trim().length >= 5);
    } else {
      setShowIndicator(false);
    }
  }, [textValue, activeElement]);

  const updatePositions = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

    // Posicionar o botão G flutuante na parte interna/inferior direita do input/textarea
    // ou fora dele caso o input seja muito pequeno
    const isSmall = rect.height < 45;
    const buttonTop = isSmall
      ? rect.top + scrollTop + (rect.height - 24) / 2
      : rect.bottom + scrollTop - 32;
    const buttonLeft = isSmall
      ? rect.right + scrollLeft - 28
      : rect.right + scrollLeft - 32;

    setButtonPosition({ top: buttonTop, left: buttonLeft });

    // Determinar melhor local para o popover
    let popTop = rect.bottom + scrollTop + 8;
    let popLeft = rect.right + scrollLeft - 320; // Alinhar à direita por padrão

    // Garantir limites na tela
    if (popLeft < 10) popLeft = 10;
    if (popTop + 360 > window.innerHeight + scrollTop) {
      // Mostrar em cima se não couber embaixo
      popTop = rect.top + scrollTop - 330;
    }

    setPopoverPosition({ top: popTop, left: popLeft });
  };

  const checkGrammar = async (selectedMode = mode) => {
    if (!textValue.trim()) return;
    setIsLoading(true);
    setErrorStatus(null);
    setCorrections([]);
    setCorrectedText("");

    try {
      const response = await fetch("/api/grammarly/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: safeJSONStringify({
          text: textValue,
          mode: selectedMode,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro no servidor de análise gramatical");
      }

      const data = await response.json();
      setCorrectedText(data.correctedText || textValue);
      setCorrections(data.corrections || []);
      setSummary(data.summary || "Texto analisado com sucesso.");
    } catch (err: any) {
      console.error(err);
      setErrorStatus(
        "Não foi possível conectar ao assistente de IA. Tente novamente.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Aplica as correções parciais ou totais no elemento de origem
  const applyCorrectedText = (newText: string) => {
    if (!activeElement) return;

    activeElement.value = newText;
    setTextValue(newText);

    // Disparar evento de input para que os estados do React do formulário original sejam atualizados
    const event = new Event("input", { bubbles: true });
    activeElement.dispatchEvent(event);

    // Fechar e redefinir correções
    setCorrections([]);
    setCorrectedText("");
    setShowPopover(false);
  };

  // Substituir um termo termo-a-termo de forma individual
  const replaceSingleWord = (original: string, replacement: string) => {
    const regex = new RegExp(escapeRegExp(original), "g");
    const updated = textValue.replace(regex, replacement);

    // Atualiza no popover e no input real
    if (activeElement) {
      activeElement.value = updated;
      const event = new Event("input", { bubbles: true });
      activeElement.dispatchEvent(event);
    }

    setTextValue(updated);
    // Remover termo específico da lista de exibição local
    setCorrections((prev) => prev.filter((c) => c.original !== original));

    // Atualizar texto corrigido geral para sincronismo
    const updatedCorrected = correctedText.replace(regex, replacement);
    setCorrectedText(updatedCorrected);
  };

  const escapeRegExp = (str: string) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  const togglePopover = () => {
    if (activeElement) {
      updatePositions(activeElement);
      setTextValue(activeElement.value);
    }
    setErrorStatus(null);
    setShowPopover(!showPopover);
    if (!showPopover) {
      // Iniciar verificação automática se o popover abrir
      setTimeout(() => {
        checkGrammar(mode);
      }, 50);
    }
  };

  const handleModeChange = (
    newMode: "standard" | "formal" | "simple" | "expand",
  ) => {
    setMode(newMode);
    checkGrammar(newMode);
  };

  if (!activeElement) return null;

  return (
    <div className="absolute top-0 left-0 z-50 pointer-events-none">
      {/* 1. Botão/Indicador flutuante elegante que aparece sobre o elemento em foco */}
      <AnimatePresence>
        {showIndicator && (
          <motion.button
            ref={indicatorRef}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={togglePopover}
            style={{ top: buttonPosition.top, left: buttonPosition.left }}
            className="absolute pointer-events-auto w-6 h-6 rounded-full bg-emerald-600 border-2 border-white shadow-md flex items-center justify-center cursor-pointer hover:bg-emerald-700 transition-colors group"
            title="Grammarly AI: Verificar Gramática & Estilo"
          >
            <Feather
              size={11}
              className="text-white group-hover:rotate-12 transition-transform duration-300"
            />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full border border-white animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 2. Popover de sugestões e controle da IA */}
      <AnimatePresence>
        {showPopover && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{ top: popoverPosition.top, left: popoverPosition.left }}
            className="absolute pointer-events-auto w-[330px] rounded-2xl bg-white border border-slate-100 shadow-xl overflow-hidden text-slate-700 font-sans text-xs z-50 transform"
          >
            {/* Cabeçalho */}
            <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-white/20 rounded-lg">
                  <Feather size={14} className="text-white" />
                </div>
                <div>
                  <h4 className="font-black tracking-wide text-[11px]">
                    Grammarly AI Assistant
                  </h4>
                  <p className="text-[9px] text-emerald-100 font-medium">
                    Língua Portuguesa • Songo
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPopover(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Abas de Modo */}
            <div className="flex bg-slate-50 border-b border-slate-100 p-1.5 gap-1">
              {[
                { id: "standard", label: "Padrão" },
                { id: "formal", label: "Formal" },
                { id: "simple", label: "Simples" },
                { id: "expand", label: "Expandir" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleModeChange(m.id as any)}
                  className={`flex-1 py-1 px-1.5 rounded-lg text-[9px] font-bold text-center transition-all tracking-wider ${
                    mode === m.id
                      ? "bg-white text-emerald-700 border border-slate-200/50 shadow-xs"
                      : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-700"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Painel Central */}
            <div className="max-h-[220px] overflow-y-auto p-4 space-y-3">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                  <Loader2
                    size={24}
                    className="text-emerald-600 animate-spin"
                  />
                  <div className="text-center space-y-1">
                    <p className="text-slate-500 font-bold text-[10px] tracking-wide">
                      Analisando escrita...
                    </p>
                    <p className="text-slate-400 text-[9px]">
                      Ajustando{" "}
                      {mode === "standard"
                        ? "regras gramaticais"
                        : `estilo ${mode}`}
                    </p>
                  </div>
                </div>
              ) : errorStatus ? (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                  <AlertTriangle className="text-amber-500" size={24} />
                  <p className="text-[10px] font-bold text-slate-700">
                    Atenção
                  </p>
                  <p className="text-slate-500 max-w-[240px] leading-relaxed">
                    {errorStatus}
                  </p>
                  <button
                    onClick={() => checkGrammar(mode)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold"
                  >
                    <RefreshCw size={11} />
                    <span>Tentar Novamente</span>
                  </button>
                </div>
              ) : corrections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                  <CheckCheck className="text-emerald-500" size={26} />
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-700 tracking-wide">
                      Tudo Certo!
                    </p>
                    <p className="text-slate-400 text-[9px] max-w-[240px] leading-relaxed">
                      Nenhum erro crítico ou clareza sugerida no modo{" "}
                      <span className="font-bold text-slate-600">{mode}</span>.
                      O texto está perfeito.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-[9px] bg-emerald-50 text-emerald-800 px-2 py-1 rounded-lg font-bold">
                    <BookOpen size={10} />
                    <span>Sugeriu-se aplicar as correções abaixo:</span>
                  </div>

                  {/* Lista de cards de correção */}
                  <div className="space-y-2.5">
                    {corrections.map((c, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 hover:bg-slate-100/70 border border-slate-200/50 p-2.5 rounded-xl transition-all space-y-1.5"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-red-500 line-through font-mono tracking-tight font-medium bg-red-50 px-1 py-0.5 rounded text-[10px]">
                              {c.original}
                            </span>
                            <ChevronRight
                              size={10}
                              className="text-slate-400"
                            />
                            <span className="text-emerald-700 font-mono tracking-tight font-bold bg-emerald-50 px-1 py-0.5 rounded text-[10px]">
                              {c.replacement}
                            </span>
                          </div>
                          <span
                            className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${
                              c.type === "spelling"
                                ? "bg-red-100 text-red-700"
                                : c.type === "grammar"
                                  ? "bg-orange-100 text-orange-700"
                                  : c.type === "style"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {c.type === "spelling"
                              ? "Ortografia"
                              : c.type === "grammar"
                                ? "Gramática"
                                : c.type === "style"
                                  ? "Estilo"
                                  : "Clareza"}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[9px] leading-relaxed font-medium">
                          {c.explanation}
                        </p>
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() =>
                              replaceSingleWord(c.original, c.replacement)
                            }
                            className="text-[9px] font-black text-emerald-700 bg-white hover:bg-emerald-50 hover:text-emerald-800 border border-emerald-100/70 px-2 py-1 rounded-md cursor-pointer shadow-2xs"
                          >
                            Aplicar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé / Ações Totais */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px]">
              <span className="text-slate-400 font-medium">
                {corrections.length}{" "}
                {corrections.length === 1 ? "sugestão" : "sugestões"}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={isLoading}
                  onClick={() => checkGrammar(mode)}
                  className="p-1 px-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg font-bold"
                  title="Recarregar Análise"
                >
                  <RefreshCw
                    size={12}
                    className={isLoading ? "animate-spin" : ""}
                  />
                </button>
                {correctedText && corrections.length > 0 && (
                  <button
                    onClick={() => applyCorrectedText(correctedText)}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-xl shadow-sm transition-all text-[9px] tracking-wider cursor-pointer"
                  >
                    <Sparkles size={11} />
                    <span>Aplicar Tudo</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

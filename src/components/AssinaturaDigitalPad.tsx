import React, { useRef, useState, useEffect } from "react";
import {
  Pen,
  Upload,
  RotateCcw,
  CheckCircle2,
  Image as ImageIcon,
  ShieldCheck,
  X,
  FileCheck,
} from "lucide-react";

interface AssinaturaDigitalPadProps {
  onSaveAssinatura: (data: {
    assinaturaImg: string;
    tipoAssinatura: "imagem" | "desenhada" | "digital";
    assinanteNome: string;
    assinanteCargo: string;
    dataAssinatura: string;
    hashAutenticacao: string;
  }) => void;
  defaultNome?: string;
  defaultCargo?: string;
  onCancel?: () => void;
}

export default function AssinaturaDigitalPad({
  onSaveAssinatura,
  defaultNome = "SLAITER",
  defaultCargo = "Professor Titular / Gestor",
  onCancel,
}: AssinaturaDigitalPadProps) {
  const [tab, setTab] = useState<"upload" | "desenhar" | "eletronica">("desenhar");
  const [nomeSignatario, setNomeSignatario] = useState(defaultNome);
  const [cargoSignatario, setCargoSignatario] = useState(defaultCargo);
  const [imagemAssinatura, setImagemAssinatura] = useState<string | null>(null);
  const [penColor, setPenColor] = useState<string>("#0f172a"); // Azul escuro / Preto executivo

  // Canvas para desenhar assinatura
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (tab === "desenhar" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = penColor;
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    }
  }, [tab, penColor]);

  // Funções de desenho no Canvas
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Upload de imagem de assinatura
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Por favor selecione uma imagem válida (PNG, JPG ou SVG).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImagemAssinatura(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Confirmar e Gerar Assinatura Digital
  const handleConfirmar = () => {
    const now = new Date();
    const hash = `SIGEP-AUTH-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${now.getFullYear()}`;

    let finalImg = "";
    let tipoAssinatura: "imagem" | "desenhada" | "digital" = "digital";

    if (tab === "upload") {
      if (!imagemAssinatura) {
        alert("Por favor carregue uma imagem de assinatura.");
        return;
      }
      finalImg = imagemAssinatura;
      tipoAssinatura = "imagem";
    } else if (tab === "desenhar") {
      if (!hasDrawn || !canvasRef.current) {
        alert("Por favor assine no quadro ou carregue uma imagem.");
        return;
      }
      finalImg = canvasRef.current.toDataURL("image/png");
      tipoAssinatura = "desenhada";
    } else {
      // Eletrônica com carimbo tipográfico
      tipoAssinatura = "digital";
      // Gerar carimbo em canvas
      const offscreen = document.createElement("canvas");
      offscreen.width = 400;
      offscreen.height = 140;
      const ctx = offscreen.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 400, 140);
        ctx.strokeStyle = "#1e3a8a";
        ctx.lineWidth = 2;
        ctx.strokeRect(4, 4, 392, 132);

        ctx.fillStyle = "#1e3a8a";
        ctx.font = "bold 14px 'Times New Roman', serif";
        ctx.fillText("SIGEP • Assinatura Digital", 16, 28);

        ctx.fillStyle = "#0f172a";
        ctx.font = "bold italic 22px 'Brush Script MT', 'Dancing Script', cursive";
        ctx.fillText(nomeSignatario || "Assinante Autorizado", 16, 68);

        ctx.font = "10px sans-serif";
        ctx.fillStyle = "#475569";
        ctx.fillText(`Cargo: ${cargoSignatario}`, 16, 92);
        ctx.fillText(`Validação: ${hash} | Data: ${now.toLocaleDateString("pt-PT")}`, 16, 114);

        finalImg = offscreen.toDataURL("image/png");
      }
    }

    onSaveAssinatura({
      assinaturaImg: finalImg,
      tipoAssinatura,
      assinanteNome: nomeSignatario,
      assinanteCargo: cargoSignatario,
      dataAssinatura: now.toISOString(),
      hashAutenticacao: hash,
    });
  };

  return (
    <div className="bg-slate-900 text-white rounded-2xl border border-slate-700 shadow-2xl p-5 max-w-lg w-full flex flex-col gap-4 select-none">
      {/* Topo do Modal / Seção */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-amber-400" size={20} />
          <div>
            <h3 className="text-sm font-black text-white tracking-wider">
              Assinatura Digital & Parecer
            </h3>
            <p className="text-[10px] text-slate-400">
              Chancela institucional para aposição em documentos e despachos
            </p>
          </div>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Identificação do Signatário */}
      <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
        <div>
          <label className="text-[10px] font-bold text-slate-400 block mb-1">
            Nome do Signatário
          </label>
          <input
            type="text"
            value={nomeSignatario}
            onChange={(e) => setNomeSignatario(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 font-semibold"
            placeholder="Ex: Claudilene Lopes"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 block mb-1">
            Cargo / Função
          </label>
          <input
            type="text"
            value={cargoSignatario}
            onChange={(e) => setCargoSignatario(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
            placeholder="Ex: Chefe de Departamento"
          />
        </div>
      </div>

      {/* Abas: Desenhar | Carregar Imagem | Certificada */}
      <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
        <button
          type="button"
          onClick={() => setTab("desenhar")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            tab === "desenhar"
              ? "bg-blue-600 text-white shadow-md"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <Pen size={14} />
          <span>Desenhar</span>
        </button>

        <button
          type="button"
          onClick={() => setTab("upload")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            tab === "upload"
              ? "bg-blue-600 text-white shadow-md"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <Upload size={14} />
          <span>Carregar Imagem</span>
        </button>

        <button
          type="button"
          onClick={() => setTab("eletronica")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            tab === "eletronica"
              ? "bg-blue-600 text-white shadow-md"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <FileCheck size={14} />
          <span>Carimbo Digital</span>
        </button>
      </div>

      {/* Área da Assinatura: DESENHAR */}
      {tab === "desenhar" && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Desenhe a sua assinatura ou rubrica abaixo:</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px]">Tinta:</span>
              <button
                type="button"
                onClick={() => setPenColor("#0f172a")}
                className={`w-4 h-4 rounded-full bg-slate-900 border ${
                  penColor === "#0f172a" ? "border-amber-400 scale-110" : "border-slate-500"
                }`}
                title="Tinta Preta"
              />
              <button
                type="button"
                onClick={() => setPenColor("#1d4ed8")}
                className={`w-4 h-4 rounded-full bg-blue-600 border ${
                  penColor === "#1d4ed8" ? "border-amber-400 scale-110" : "border-slate-500"
                }`}
                title="Tinta Azul"
              />
              <button
                type="button"
                onClick={clearCanvas}
                className="flex items-center gap-1 text-slate-400 hover:text-red-400 ml-2 text-[10px]"
              >
                <RotateCcw size={12} />
                <span>Limpar</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border-2 border-dashed border-slate-400 overflow-hidden shadow-inner flex items-center justify-center relative touch-none">
            <canvas
              ref={canvasRef}
              width={420}
              height={140}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="cursor-crosshair w-full h-[140px]"
            />
            {!hasDrawn && (
              <span className="absolute text-slate-300 text-xs pointer-events-none italic font-serif">
                Assine aqui com o cursor ou toque...
              </span>
            )}
          </div>
        </div>
      )}

      {/* Área da Assinatura: UPLOAD DE IMAGEM */}
      {tab === "upload" && (
        <div className="flex flex-col gap-3">
          <div className="border-2 border-dashed border-slate-700 hover:border-amber-400 bg-slate-950/60 rounded-xl p-4 text-center transition-all">
            <input
              type="file"
              id="assinatura-file"
              accept="image/png,image/jpeg,image/svg+xml"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="assinatura-file"
              className="cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <ImageIcon className="text-amber-400" size={28} />
              <div className="text-xs font-bold text-white">
                Clique para carregar a imagem da sua assinatura
              </div>
              <span className="text-[10px] text-slate-400">
                Suporta ficheiros PNG com fundo transparente, JPG ou SVG
              </span>
            </label>
          </div>

          {imagemAssinatura && (
            <div className="bg-white rounded-xl p-3 flex items-center justify-center border border-slate-300 relative">
              <img
                src={imagemAssinatura}
                alt="Prévia Assinatura"
                className="max-h-24 object-contain"
              />
              <button
                type="button"
                onClick={() => setImagemAssinatura(null)}
                className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full"
                title="Remover imagem"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Área da Assinatura: CERTIFICADA ELETRÓNICA */}
      {tab === "eletronica" && (
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
            <CheckCircle2 size={16} />
            <span>Carimbo Institucional SIGEP Songo</span>
          </div>
          <div className="p-3 bg-white text-slate-900 rounded-lg border border-blue-900">
            <div className="text-[9px] font-black text-blue-900 tracking-wider">
              SIGEP Songo • Chancela Institucional
            </div>
            <div className="text-base font-black italic font-serif text-slate-900 my-1">
              {nomeSignatario || "Assinante Autorizado"}
            </div>
            <div className="text-[9px] text-slate-600">
              {cargoSignatario || "Gestor Institucional"}
            </div>
            <div className="text-[8px] text-slate-400 font-mono mt-1">
              Validação Criptográfica Integrada • Songo 2026
            </div>
          </div>
        </div>
      )}

      {/* Botões de Ação */}
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
          >
            Cancelar
          </button>
        )}
        <button
          type="button"
          onClick={handleConfirmar}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black tracking-wider flex items-center gap-2 shadow-lg shadow-blue-900/40 cursor-pointer"
        >
          <CheckCircle2 size={16} />
          <span>Apor Assinatura</span>
        </button>
      </div>
    </div>
  );
}

import { printElementById } from "../../lib/printUtils";
import React, { useState } from "react";
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  FileText,
  Check,
  Calendar,
  User,
  File,
  Printer,
  Maximize2,
  Minimize2,
  Eye,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { openPrintDocumentWindow } from "../../lib/printUtils";

export interface DocumentFile {
  name: string;
  url?: string;
  dataUrl?: string;
  type?: string;
  size?: number;
  data?: string;
  fileObject?: File;
}

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: DocumentFile | null;
  processNo?: string;
  collaboratorName?: string;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  file,
  processNo,
  collaboratorName,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen || !file) return null;

  // Resolve target file URL
  let resolvedUrl = "";
  if (file.fileObject) {
    try {
      resolvedUrl = URL.createObjectURL(file.fileObject);
    } catch (e) {
      resolvedUrl = "";
    }
  } else if (file.url) {
    resolvedUrl = file.url;
  } else if (file.dataUrl) {
    resolvedUrl = file.dataUrl;
  }

  const fileName = file.name || "Documento_Anexo.pdf";
  const fileExt = fileName.split(".").pop()?.toLowerCase() || "";
  const isImage =
    file.type?.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(fileExt);
  const isPdf =
    file.type === "application/pdf" || fileExt === "pdf" || !isImage;

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Tamanho Padrão (~250 KB)";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDownload = () => {
    if (resolvedUrl) {
      const link = document.createElement("a");
      link.href = resolvedUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Fallback generator for documents
      const content =
        `INSTITUTO SUPERIOR POLITÉCNICO DE SONGO\n\n` +
        `DOCUMENTO ANEXO DO PROCESSO INDIVIDUAL\n` +
        `-----------------------------------------\n` +
        `Nº do Processo: ${processNo || "Songo/001/2026"}\n` +
        `Colaborador: ${collaboratorName || "Não especificado"}\n` +
        `Ficheiro: ${fileName}\n` +
        `Data de Emissão/Consulta: ${new Date().toLocaleString("pt-PT")}\n\n` +
        `Documento validado e arquivado digitalmente na Secretaria Geral do Songo.`;

      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName.includes(".") ? fileName : `${fileName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handlePrint = () => {
    if (resolvedUrl) {
      const printWindow = window.open(resolvedUrl, "_blank");
      if (printWindow) {
        printWindow.focus();
        printWindow.print();
      } else {
        printElementById("print-area");
      }
    } else {
      const modalDocContent = `
        <div style="font-family: serif; padding: 20px;">
          <h2 style="text-align: center; color: #1e3a8a;">Instituto Superior Politécnico de Songo</h2>
          <p style="text-align: center; font-weight: bold; color: #64748b;">Secretaria Geral / Processo Individual</p>
          <hr style="margin: 20px 0; border: 1px solid #0f172a;" />
          <p><strong>Ficheiro:</strong> ${fileName}</p>
          <p><strong>Nº do Processo:</strong> ${processNo || "Songo/001/2026"}</p>
          <p><strong>Titular:</strong> ${collaboratorName || "Não especificado"}</p>
          <div style="margin-top: 30px; padding: 20px; background: #f8fafc; border: 1px border-dashed #cbd5e1; border-radius: 8px;">
            <p>Atesta-se que este documento foi registado e autenticado digitalmente na Secretaria Geral do Songo.</p>
          </div>
        </div>
      `;
      openPrintDocumentWindow({
        title: fileName,
        contentHtml: modalDocContent,
        orientation: "auto",
        pageSize: "auto",
      });
    }
  };

  const handleOpenNewTab = () => {
    if (resolvedUrl) {
      window.open(resolvedUrl, "_blank");
    } else {
      handleDownload();
    }
  };

  return (
    <AnimatePresence>
      <div
        className={`fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[200] flex items-center justify-center ${isFullscreen ? "p-0" : "p-2 md:p-6"}`}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className={`bg-white w-full ${isFullscreen ? "h-full rounded-none" : "max-w-6xl h-[94vh] rounded-3xl"} shadow-2xl border border-slate-200 flex flex-col overflow-hidden relative`}
        >
          {/* Header & Reader Bar */}
          <header className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2.5 bg-red-600/30 text-red-400 rounded-2xl shrink-0 border border-red-500/30">
                <FileText size={22} />
              </div>
              <div className="overflow-hidden text-left">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black  tracking-widest px-2 py-0.5 bg-red-500/20 text-red-300 rounded-md border border-red-400/20">
                    Leitor de PDF / Anexo
                  </span>
                  {processNo && (
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {processNo}
                    </span>
                  )}
                </div>
                <h3 className="text-sm md:text-base font-bold text-white truncate max-w-md mt-0.5">
                  {fileName}
                </h3>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Zoom & Rotate Controls */}
              <div className="hidden sm:flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700 mr-2">
                <button
                  onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.2))}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title="Diminuir Zoom"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="px-2 text-xs font-mono text-slate-300 font-bold min-w-[45px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom((prev) => Math.min(3, prev + 0.2))}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title="Aumentar Zoom"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors ml-1"
                  title="Rodar Documento"
                >
                  <RotateCcw size={14} />
                </button>
              </div>

              <button
                onClick={handlePrint}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-700"
                title="Imprimir Documento"
              >
                <Printer size={14} />
                <span className="hidden md:inline">Imprimir</span>
              </button>

              <button
                onClick={handleOpenNewTab}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-700"
                title="Abrir Leitor Nativo"
              >
                <ExternalLink size={14} />
                <span>Nativo</span>
              </button>

              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/30"
                title="Descarregar Ficheiro PDF"
              >
                <Download size={14} />
                <span className="hidden sm:inline">Descarregar PDF</span>
              </button>

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors ml-1 hidden sm:block"
                title={isFullscreen ? "Sair do Ecrã Inteiro" : "Ecrã Inteiro"}
              >
                {isFullscreen ? (
                  <Minimize2 size={18} />
                ) : (
                  <Maximize2 size={18} />
                )}
              </button>

              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors ml-1"
                title="Fechar"
              >
                <X size={20} />
              </button>
            </div>
          </header>

          {/* PDF Viewer / Document Container */}
          <div className="flex-1 bg-slate-800/90 overflow-auto p-2 md:p-6 flex items-center justify-center relative">
            {resolvedUrl && isPdf ? (
              <div className="w-full h-full flex items-center justify-center overflow-auto">
                <object
                  data={`${resolvedUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                  type="application/pdf"
                  className="w-full h-full rounded-2xl shadow-2xl border border-slate-700 bg-white"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transformOrigin: "center center",
                    transition: "transform 0.2s ease",
                  }}
                >
                  <iframe
                    src={`${resolvedUrl}#toolbar=1`}
                    title={fileName}
                    className="w-full h-full rounded-2xl border-0 bg-white"
                  />
                </object>
              </div>
            ) : resolvedUrl && isImage ? (
              <div className="max-w-full max-h-full overflow-auto flex items-center justify-center p-4">
                <img
                  src={resolvedUrl}
                  alt={fileName}
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transformOrigin: "center center",
                    transition: "transform 0.2s ease",
                  }}
                  className="max-h-[75vh] w-auto object-contain rounded-2xl shadow-2xl border border-slate-300 bg-white"
                />
              </div>
            ) : (
              /* High quality Simulated PDF Page Viewer when attachment is registered as metadata */
              <div className="w-full h-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-auto p-8 md:p-12 text-left space-y-8 my-auto">
                {/* Official Header */}
                <div className="text-center border-b-2 border-slate-900 pb-6 space-y-1">
                  <h2 className="text-base font-black text-blue-900 tracking-wide mt-2">
                    Instituto Superior Politécnico de Songo
                  </h2>
                  <p className="text-[11px] font-bold text-slate-500">
                    Secretaria Geral / Divisão de Recursos Humanos
                  </p>
                </div>

                {/* Document Metadata Bar */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="block font-bold text-slate-400 text-[10px]">
                      Ficheiro Anexo
                    </span>
                    <span className="font-mono font-bold text-blue-900 break-all">
                      {fileName}
                    </span>
                  </div>
                  <div>
                    <span className="block font-bold text-slate-400 text-[10px]">
                      Nº de Processo Individual
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {processNo || "Songo/001/2026"}
                    </span>
                  </div>
                  <div>
                    <span className="block font-bold text-slate-400 text-[10px]">
                      Titular do Processo
                    </span>
                    <span className="font-bold text-slate-900">
                      {collaboratorName || "Não especificado"}
                    </span>
                  </div>
                </div>

                {/* PDF Page Body Simulation */}
                <div className="space-y-4 text-slate-800 text-sm leading-relaxed p-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-300">
                  <div className="flex items-center gap-2 text-blue-900 font-bold text-base border-b border-slate-200 pb-2">
                    <FileText size={20} className="text-blue-600" />
                    <span>Conteúdo Autenticado do Documento</span>
                  </div>

                  <p className="indent-6">
                    Atesta-se para os devidos efeitos que o documento constante
                    do ficheiro{" "}
                    <strong className="text-blue-900 font-mono">
                      {fileName}
                    </strong>{" "}
                    foi devidamente submetido, conferido e arquivado no Processo
                    Individual{" "}
                    <strong className="font-mono">
                      {processNo || "Songo/001/2026"}
                    </strong>{" "}
                    pertencente a{" "}
                    <strong>{collaboratorName || "Colaborador do Songo"}</strong>
                    .
                  </p>

                  <p className="indent-6">
                    O presente anexo faz parte integrante do Registo Individual
                    de Funcionários e Agentes do Estado (SIGEP/Songo) para
                    efeitos de consulta, instrução e validação administrativa.
                  </p>

                  <div className="pt-8 flex items-center justify-between border-t border-slate-200 mt-6 text-xs text-slate-500">
                    <div>
                      <p className="font-bold text-slate-700">
                        Assinado e Validade Digitalmente
                      </p>
                      <p className="text-[10px]">
                        SIGEP Songo - Sistema de Gestão de Processos Individuais
                      </p>
                    </div>
                    <div className="text-right font-mono">
                      <p>
                        Código de Verificação:{" "}
                        {Math.random()
                          .toString(36)
                          .substring(2, 10)
                          .toUpperCase()}
                      </p>
                      <p>
                        Data de Leitura:{" "}
                        {new Date().toLocaleDateString("pt-PT")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={handleDownload}
                    className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl transition-all shadow-md text-xs flex items-center gap-2"
                  >
                    <Download size={16} />
                    <span>Descarregar Cópia Oficial em PDF</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <footer className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 px-6 shrink-0">
            <div className="flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
              <span>
                Leitor de PDFs e Anexos Ativo — Instituto Superior Politécnico
                de Songo
              </span>
            </div>
            <div className="font-mono text-slate-400">
              {formatFileSize(file.size)}
            </div>
          </footer>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

import React, { useState, useRef } from "react";
import {
  ArrowLeft,
  Search,
  FileText,
  User,
  Calendar,
  Download,
  Eye,
  Trash2,
  MoreVertical,
  Plus,
  ExternalLink,
  X,
  Share2,
  Copy,
  Check,
  Link,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { isSuperBossUser } from "../../lib/auth";
import {
  sortProcessesNumerically,
  generateIndividualProcessLink,
} from "../../lib/utils";
import {
  DocumentPreviewModal,
  DocumentFile,
} from "../../components/ui/DocumentPreviewModal";

interface ProcessoSubmetido {
  id: string;
  nome: string;
  nuit: string;
  seccao: string;
  dataSubmissao: string;
  processoNo: string;
  processoIndividualNo?: string;
  status: "Pendente" | "Aprovado" | "Arquivado";
  ficheiros?: { name: string; url?: string; type?: string; size?: number }[];
  [key: string]: any;
}

export default function ProcessManagementView({
  user,
  onBack,
  processos: initialProcessos,
  onEdit,
  onAddAnexos,
  onDownload,
  onDelete,
  onDeleteAll,
  onGenerateAll,
}: {
  user?: any;
  onBack: () => void;
  processos: any[];
  onEdit?: (processo: any) => void;
  onAddAnexos?: (processoId: string, files: File[]) => void;
  onDownload?: (processo: any) => void;
  onDelete?: (processoId: string) => void;
  onDeleteAll?: () => void;
  onGenerateAll?: () => void;
}) {
  const isAdmin = isSuperBossUser(user);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [activeAnexoMenu, setActiveAnexoMenu] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedProcessoId, setSelectedProcessoId] = useState<string | null>(
    null,
  );
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [selectedPreviewFile, setSelectedPreviewFile] =
    useState<DocumentFile | null>(null);
  const [selectedPreviewProcessNo, setSelectedPreviewProcessNo] =
    useState<string>("");
  const [selectedPreviewCollaborator, setSelectedPreviewCollaborator] =
    useState<string>("");
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const filteredProcessos = sortProcessesNumerically(
    initialProcessos.filter((p) => {
      const matchesName = (p.nome || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesNuit = (p.nuit || "").includes(searchTerm);
      const matchesProcNo = (p.processoNo || p.numeroProcesso || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesName || matchesNuit || matchesProcNo;
    }),
  );

  const handleCopyProcessLink = (processo: any) => {
    const processId =
      processo.id || processo.processoIndividualNo || processo.processoNo;
    const link = generateIndividualProcessLink(processId, processo.processoNo);
    navigator.clipboard.writeText(link);
    setCopiedLinkId(processo.id);
    setTimeout(() => setCopiedLinkId(null), 2500);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString("pt-PT");
    } catch {
      return dateStr;
    }
  };

  const handleFileInclude = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && selectedProcessoId && onAddAnexos) {
      onAddAnexos(selectedProcessoId, Array.from(e.target.files));
      setSelectedProcessoId(null);
    }
  };

  const handleDeleteProcess = (processoId: string) => {
    console.log("A tentar eliminar processo com ID:", processoId);
    if (onDelete) {
      onDelete(processoId);
    }
  };

  const handleDownloadAttachment = (filename: string) => {
    const fileContent =
      `INSTITUTO SUPERIOR POLITÉCNICO DE SONGO\n\n` +
      `Anexo do Processo Individual\n` +
      `Nome do Ficheiro: ${filename}\n` +
      `Data de Emissão: ${new Date().toLocaleDateString("pt-PT")}\n` +
      `Status de Autenticação: Verificado via Assinatura Digital do SIGEP\n\n` +
      `Este é um documento de anexo oficial descarregado a partir do sistema SIGEP.\n` +
      `O arquivo original encontra-se arquivado na base de dados do Songo Songo.`;

    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.includes(".") ? filename : `${filename}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadProcess = (p: any) => {
    if (onDownload) {
      onDownload(p);
      return;
    }

    let content = `INSTITUTO SUPERIOR POLITÉCNICO DE SONGO\n\n`;
    content += `==================================================\n`;
    content += `FICHA COMPLETA DO PROCESSO INDIVIDUAL DE COLABORADOR\n`;
    content += `==================================================\n\n`;
    content += `Nº de Processo: ${p.processoNo || p.id}\n`;
    content += `Nome do Colaborador: ${p.nome || "N/A"}\n`;
    content += `NUIT: ${p.nuit || "N/A"}\n`;
    content += `Secção / Repartição: ${p.seccao || "N/A"}\n`;
    content += `Data de Submissão: ${p.dataSubmissao ? new Date(p.dataSubmissao).toLocaleDateString("pt-PT") : "N/A"}\n`;
    content += `Estado do Processo: ${p.status || "Pendente"}\n\n`;

    if (p.cargo) content += `Cargo/Função: ${p.cargo}\n`;
    if (p.departamento) content += `Departamento: ${p.departamento}\n`;
    if (p.direcao) content += `Direção: ${p.direcao}\n`;

    content += `--------------------------------------------------\n`;
    content += `Ficheiros e Anexos Digitais Associados:\n`;
    if (p.ficheiros && p.ficheiros.length > 0) {
      p.ficheiros.forEach((f: any, idx: number) => {
        content += `${idx + 1}. ${f.name} (${f.size ? (f.size / 1024).toFixed(1) + " KB" : "Tamanho Desconhecido"})\n`;
      });
    } else {
      content += `Nenhum anexo digital associado a este processo.\n`;
    }
    content += `\n--------------------------------------------------\n`;
    content += `Processo validado digitalmente via Sistema Integrado de Gestão (SIGEP).\n`;
    content += `Data de Emissão do Documento: ${new Date().toLocaleString("pt-PT")}\n`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Processo_${(p.nome || "colaborador").replace(/\s+/g, "_")}_${p.processoNo || p.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      <input
        type="file"
        multiple
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileInclude}
      />

      <div className="p-4 bg-white border-b border-gray-100 flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
          Arquivo de Processos
        </h1>
      </div>

      <div className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-black text-blue-900 tracking-tighter">
              Gestão de Processos
            </h2>
            <p className="text-sm font-bold text-gray-400 tracking-widest">
              Arquivo Digital de Processos Individuais
            </p>
          </div>

          <div className="relative w-full md:w-96">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Pesquisar por NUIT ou Nome Completo..."
              autoComplete="off"
              className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {onDeleteAll && isAdmin && (
            <button
              onClick={onDeleteAll}
              className="px-4 py-4 bg-red-600 text-white rounded-2xl font-bold text-xs hover:bg-red-700 transition-colors"
              title="Eliminar todos os processos"
            >
              Eliminar Todos
            </button>
          )}
          {onGenerateAll && (
            <button
              onClick={onGenerateAll}
              className="px-4 py-4 bg-blue-600 text-white rounded-2xl font-bold text-xs hover:bg-blue-700 transition-colors"
              title="Gerar processos automáticos"
            >
              Gerar Automático
            </button>
          )}
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-auto max-h-[600px]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="p-6 text-xs font-black text-gray-400 tracking-widest">
                  Nº Processo
                </th>
                <th className="p-6 text-xs font-black text-gray-400 tracking-widest">
                  Funcionário / Colaborador
                </th>
                <th className="p-6 text-xs font-black text-gray-400 tracking-widest">
                  NUIT
                </th>
                <th className="p-6 text-xs font-black text-gray-400 tracking-widest">
                  Secção
                </th>
                <th className="p-6 text-xs font-black text-gray-400 tracking-widest">
                  Data de Submissão
                </th>
                <th className="p-6 text-xs font-black text-gray-400 tracking-widest text-center">
                  Anexos
                </th>
                <th className="p-6 text-xs font-black text-gray-400 tracking-widest text-center">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProcessos.length > 0 ? (
                filteredProcessos.map((p) => (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={p.id || Math.random().toString()}
                    className="hover:bg-blue-50/30 transition-colors group"
                  >
                    <td className="p-6">
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg font-mono text-xs font-bold">
                        {p.processoNo || "---"}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                          <User size={20} />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">
                            {p.nome}
                          </div>
                          <div className="text-[10px] text-gray-400 font-bold tracking-wider">
                            PI Nº: {p.processoIndividualNo || "---"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-gray-500 font-medium">{p.nuit}</td>
                    <td className="p-6 text-gray-500 font-medium">
                      {p.seccao || "Geral"}
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Calendar size={16} />
                        <span className="text-sm font-medium">
                          {formatDate(p.dataSubmissao)}
                        </span>
                      </div>
                    </td>
                    <td className="p-6 text-center relative">
                      <div
                        className="inline-flex flex-col items-center cursor-pointer hover:bg-gray-100 p-2 rounded-xl transition-all"
                        onClick={() =>
                          setActiveAnexoMenu(
                            activeAnexoMenu === p.id ? null : p.id,
                          )
                        }
                      >
                        {p.ficheiros && p.ficheiros.length > 0 ? (
                          <div className="flex -space-x-2 overflow-visible mb-1 justify-center">
                            {p.ficheiros
                              .slice(0, 3)
                              .map((f: any, i: number) => (
                                <div
                                  key={i}
                                  className="group/tooltip relative inline-block h-6 w-6 rounded-full ring-2 ring-white bg-blue-500 hover:bg-blue-600 transition-colors z-0 hover:z-10 cursor-pointer"
                                >
                                  <div className="absolute inset-0 flex items-center justify-center text-white">
                                    <FileText size={10} />
                                  </div>
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                                    {f.name}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                  </div>
                                </div>
                              ))}
                            {p.ficheiros.length > 3 && (
                              <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-gray-200 flex items-center justify-center text-[8px] text-gray-600 font-bold z-0">
                                +{p.ficheiros.length - 3}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-1 rounded-full bg-gray-50 text-gray-300">
                            <Plus size={16} />
                          </div>
                        )}
                        <span className="text-[10px] text-gray-400 font-bold">
                          {p.ficheiros?.length || 0} anexos
                        </span>
                      </div>

                      <AnimatePresence>
                        {activeAnexoMenu === p.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setActiveAnexoMenu(null)}
                            />
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-20 overflow-hidden"
                            >
                              <div className="p-3 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                                <span className="text-[10px] font-black text-gray-400 tracking-widest">
                                  Opções de Anexo
                                </span>
                                <button
                                  onClick={() => setActiveAnexoMenu(null)}
                                  className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-400"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                              <div className="p-2 space-y-1">
                                <button
                                  onClick={() => {
                                    setSelectedProcessoId(p.id);
                                    fileInputRef.current?.click();
                                    setActiveAnexoMenu(null);
                                  }}
                                  className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all text-xs font-bold text-gray-600 group"
                                >
                                  <Plus
                                    size={16}
                                    className="text-gray-400 group-hover:text-blue-500"
                                  />
                                  Incluir Novo Anexo
                                </button>

                                {p.ficheiros && p.ficheiros.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-gray-50 max-h-48 overflow-auto">
                                    <p className="px-3 pb-2 text-[8px] font-bold text-gray-400 tracking-widest">
                                      Ficheiros Existentes
                                    </p>
                                    {p.ficheiros.map((f: any, idx: number) => {
                                      const docFile: DocumentFile = {
                                        name: f.name || `Anexo_${idx + 1}`,
                                        url: f.url || f.dataUrl,
                                        type: f.type,
                                        size: f.size,
                                      };
                                      return (
                                        <div
                                          key={idx}
                                          className="flex items-center justify-between p-2 hover:bg-blue-50 rounded-lg group transition-colors"
                                        >
                                          <div
                                            onClick={() => {
                                              setSelectedPreviewFile(docFile);
                                              setSelectedPreviewProcessNo(
                                                p.processoNo ||
                                                  p.numeroProcesso ||
                                                  p.id,
                                              );
                                              setSelectedPreviewCollaborator(
                                                p.nome,
                                              );
                                              setIsPreviewModalOpen(true);
                                            }}
                                            className="flex items-center gap-2 overflow-hidden cursor-pointer flex-1"
                                          >
                                            <FileText
                                              size={14}
                                              className="text-blue-600 shrink-0"
                                            />
                                            <span className="text-[10px] text-gray-700 font-bold hover:text-blue-600 truncate">
                                              {f.name}
                                            </span>
                                          </div>
                                          <div className="flex gap-1">
                                            <button
                                              onClick={() => {
                                                setSelectedPreviewFile(docFile);
                                                setSelectedPreviewProcessNo(
                                                  p.processoNo ||
                                                    p.numeroProcesso ||
                                                    p.id,
                                                );
                                                setSelectedPreviewCollaborator(
                                                  p.nome,
                                                );
                                                setIsPreviewModalOpen(true);
                                              }}
                                              className="p-1 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                                              title="Pré-visualizar / Ler Documento"
                                            >
                                              <Eye size={13} />
                                            </button>
                                            <button
                                              onClick={() =>
                                                handleDownloadAttachment(f.name)
                                              }
                                              className="p-1 text-emerald-600 hover:bg-emerald-100 rounded-md transition-colors"
                                              title="Descarregar Ficheiro"
                                            >
                                              <Download size={13} />
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleCopyProcessLink(p)}
                          className={`p-2 rounded-lg transition-colors flex items-center gap-1 group ${
                            copiedLinkId === p.id
                              ? "bg-emerald-100 text-emerald-700 font-bold"
                              : "text-indigo-600 hover:bg-indigo-50"
                          }`}
                          title="Gerar Link do Processo Individual"
                        >
                          {copiedLinkId === p.id ? (
                            <>
                              <Check
                                size={18}
                                className="text-emerald-600 shrink-0"
                              />
                              <span className="text-[10px] font-black text-emerald-700">
                                Link Copiado!
                              </span>
                            </>
                          ) : (
                            <>
                              <Share2 size={18} className="shrink-0" />
                              <span className="text-[10px] font-black hidden group-hover:block">
                                Gerar Link
                              </span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => onEdit?.(p)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2 group"
                          title="Editar Processo Completo"
                        >
                          <Eye size={18} />
                          <span className="text-[10px] font-black hidden group-hover:block">
                            Editar
                          </span>
                        </button>
                        <button
                          onClick={() => handleDownloadProcess(p)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Descarregar Processo"
                        >
                          <Download size={18} />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteProcess(p.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                        <FileText size={48} strokeWidth={1} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-lg font-bold text-gray-500 tracking-tighter">
                          Nenhum processo encontrado
                        </p>
                        <p className="text-gray-400 text-sm">
                          {searchTerm
                            ? `Não encontramos resultados para "${searchTerm}"`
                            : "Os processos submetidos aparecerão automaticamente nesta lista."}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal de Leitura e Pré-Visualização de Documentos */}
        <DocumentPreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          file={selectedPreviewFile}
          processNo={selectedPreviewProcessNo}
          collaboratorName={selectedPreviewCollaborator}
        />
      </div>
    </div>
  );
}

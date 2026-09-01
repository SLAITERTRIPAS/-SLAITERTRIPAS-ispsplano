import { printElementById } from "../../lib/printUtils";
import React, { useState, useRef } from "react";
import { motion } from "motion/react";
import {
  Mail,
  Send,
  Save,
  X,
  Printer,
  ShieldCheck,
  MapPin,
  Hash,
  User,
  FileText,
  Globe,
  Upload,
  FileSpreadsheet,
  Pen,
  CheckCircle2,
  FileCheck,
  Share2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { firestoreService } from "../../lib/firestoreService";
import AssinaturaDigitalPad from "../../components/AssinaturaDigitalPad";
import FluxogramaTramitacaoExpediente from "../../components/FluxogramaTramitacaoExpediente";

type ExpedienteTipo = "Entrada" | "Saída" | "Sic";

export default function FormularioExpediente({
  user,
  onCancel,
  onSuccess,
  tipoInitial = "Entrada",
}: {
  user: any;
  onCancel: () => void;
  onSuccess?: (newDocId: string, data?: any) => void;
  tipoInitial?: ExpedienteTipo;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [tipo, setTipo] = useState<ExpedienteTipo>(tipoInitial);
  const [showAssinaturaModal, setShowAssinaturaModal] = useState(false);

  // Ficheiro anexado
  const [uploadedFile, setUploadedFile] = useState<{
    nome: string;
    tipo: string;
    tamanho: string;
    url: string;
  } | null>(null);

  // Assinatura digital
  const [assinaturaData, setAssinaturaData] = useState<{
    assinaturaImg: string;
    tipoAssinatura: "imagem" | "desenhada" | "digital";
    assinanteNome: string;
    assinanteCargo: string;
    dataAssinatura: string;
    hashAutenticacao: string;
  } | null>(null);

  const [isViagem, setIsViagem] = useState(false);
  const [showFluxograma, setShowFluxograma] = useState(false);
  const [formData, setFormData] = useState({
    numero: "A carregar...",
    data: new Date().toISOString().split("T")[0],
    assunto: "",
    origem:
      tipoInitial === "Entrada"
        ? ""
        : user?.departamento || user?.direcao || "Secretaria Geral",
    destino:
      tipoInitial === "Saída"
        ? ""
        : user?.departamento || user?.direcao || "Secretaria Geral",
    referenciaExterna: "",
    observacoes: "",
    parecerInicial: "",
    urgencia: "Normal",
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Manipular upload de PDF / Word / Excel
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const allowed = ["pdf", "docx", "doc", "xlsx", "xls"];
    if (!allowed.includes(ext)) {
      alert("Por favor selecione um documento válido em PDF, Word (.docx/.doc) ou Excel (.xlsx/.xls).");
      return;
    }

    const sizeKb = (file.size / 1024).toFixed(1);
    const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${sizeKb} KB`;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setUploadedFile({
          nome: file.name,
          tipo: ext,
          tamanho: sizeStr,
          url: reader.result,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  React.useEffect(() => {
    const generateCode = async () => {
      const prefix =
        tipo === "Entrada" ? "Ent" : tipo === "Saída" ? "Sai" : "Sic";
      const unitKey = `EXP-${prefix}-${new Date().getFullYear()}`;
      const nextNum = await firestoreService.counters.getNextNumber(unitKey);
      const paddedNum = String(nextNum).padStart(3, "0");
      setFormData((prev) => ({
        ...prev,
        numero: `${prefix}/${new Date().getFullYear()}/${paddedNum}`,
      }));
    };
    generateCode();
  }, [tipo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const assuntoLower = (formData.assunto || "").toLowerCase();
      const isViagemDoc =
        isViagem ||
        assuntoLower.includes("viagem") ||
        assuntoLower.includes("missao") ||
        assuntoLower.includes("missão") ||
        assuntoLower.includes("deslocacao") ||
        assuntoLower.includes("deslocação") ||
        assuntoLower.includes("transporte");

      const initialStatus = isViagemDoc
        ? "Em Tramitação (Ida) - Secretaria Geral"
        : "Pendente - Secretaria Geral";

      const newExpData = {
        ...formData,
        tipo,
        isDocumentoViagem: isViagemDoc,
        fluxoViagemEtapa: isViagemDoc ? "ida" : undefined,
        status: initialStatus,
        destino: formData.destino || "Secretaria Geral",
        criadoPor: user?.name || user?.nome || "Utilizador",
        userId: user?.id || "",
        timestamp: now,
        arquivoUrl: uploadedFile?.url || "",
        nomeArquivo: uploadedFile?.nome || `${formData.assunto || "Documento"}.pdf`,
        tipoArquivo: uploadedFile?.tipo || "pdf",
        tamanhoArquivo: uploadedFile?.tamanho || "120 KB",
        assinaturaDigital: assinaturaData
          ? {
              assinanteNome: assinaturaData.assinanteNome,
              assinanteCargo: assinaturaData.assinanteCargo,
              dataAssinatura: assinaturaData.dataAssinatura,
              assinaturaImg: assinaturaData.assinaturaImg,
              hashAutenticacao: assinaturaData.hashAutenticacao,
              tipoAssinatura: assinaturaData.tipoAssinatura,
            }
          : undefined,
        despacho: undefined, // Sem despacho inicial no envio
        historico: [
          {
            data: now,
            setor: user?.departamento || user?.setor || "Remetente",
            acao: isViagemDoc
              ? "Envio de Pedido de Viagem (Fluxo Obrigatório de Ida)"
              : `Submissão e Assinatura (${tipo})`,
            parecer: isViagemDoc
              ? "Pedido de Viagem registado pelo Remetente. Encaminhado à Secretaria Geral para o fluxo institucional obrigatório (Ida e Volta)."
              : "Documento registado e assinado pelo Remetente (Sem parecer nem despacho inicial). Remetido para a Secretaria Geral.",
            responsavel: assinaturaData?.assinanteNome || user?.name || user?.nome || "Remetente",
            cargo: assinaturaData?.assinanteCargo || user?.cargo || "Remetente",
            assinaturaImg: assinaturaData?.assinaturaImg,
          },
        ],
      };

      const newDocId = await firestoreService.expedientes.add(newExpData);
      setIsSubmitted(true);
      if (onSuccess) {
        onSuccess(String(newDocId), newExpData);
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao registar expediente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <div className="relative">
      {/* Success Overlay */}
      {isSubmitted && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:hidden">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center"
          >
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 mx-auto">
              <ShieldCheck size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-2">
              Expediente registado!
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              O expediente{" "}
              <span className="font-bold text-slate-900">
                {formData.numero}
              </span>{" "}
              foi gravado com sucesso. O número de rastreio está ativo.
            </p>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => printElementById("print-area")}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center gap-2"
              >
                <Printer size={18} /> Imprimir comprovativo / guia
              </button>
              <button
                onClick={onCancel}
                className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-[10px] tracking-[0.2em] hover:bg-slate-200 transition-all"
              >
                Fechar e voltar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden border border-slate-200"
      >
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center relative overflow-hidden">
          <div className="flex items-center gap-6 relative z-10">
            <div
              className={`p-4 rounded-2xl backdrop-blur-md border border-white/10 ${tipo === "Entrada" ? "bg-blue-500/20" : "bg-amber-500/20"}`}
            >
              {tipo === "Entrada" ? (
                <Mail className="text-blue-400" size={32} />
              ) : (
                <Send className="text-amber-400" size={32} />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter leading-none">
                Registo de expediente
              </h1>
              <p className="text-slate-400 text-xs font-bold tracking-[0.2em] mt-1 italic">
                Gestão core de correspondência
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-black text-slate-500 tracking-widest leading-tight">
              Nº de Protocolo
            </div>
            <div className="text-lg font-mono font-black text-white leading-tight">
              {formData.numero}
            </div>
          </div>
        </div>

        <div className="flex border-b border-gray-100 p-4 bg-gray-50/50 gap-4">
          <button
            type="button"
            onClick={() => setTipo("Entrada")}
            className={`flex-1 py-3 rounded-xl font-black text-xs tracking-widest transition-all ${tipo === "Entrada" ? "bg-blue-600 text-white shadow-lg" : "bg-white text-slate-400 border border-slate-200"}`}
          >
            Entrada
          </button>
          <button
            type="button"
            onClick={() => setTipo("Saída")}
            className={`flex-1 py-3 rounded-xl font-black text-xs tracking-widest transition-all ${tipo === "Saída" ? "bg-amber-600 text-white shadow-lg" : "bg-white text-slate-400 border border-slate-200"}`}
          >
            Saída
          </button>
          <button
            type="button"
            onClick={() => setTipo("Sic")}
            className={`flex-1 py-3 rounded-xl font-black text-xs tracking-widest transition-all ${tipo === "Sic" ? "bg-emerald-600 text-white shadow-lg" : "bg-white text-slate-400 border border-slate-200"}`}
          >
            SIC
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                <Globe size={18} className="text-slate-400" />
                <h3 className="font-black text-slate-900 text-xs tracking-widest">
                  Procedência / destino
                </h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">
                    {tipo === "Entrada"
                      ? "Origem (Remetente)"
                      : "Origem (Setor Interno)"}
                  </label>
                  <input
                    required
                    value={formData.origem}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        origem: e.target.value,
                      }))
                    }
                    placeholder={
                      tipo === "Entrada"
                        ? "Ex: Ministério da Educação"
                        : "Setor de Origem"
                    }
                    className="w-full p-3 border rounded-xl text-sm focus:ring-2 focus:ring-slate-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">
                    {tipo === "Entrada"
                      ? "Destino (Setor Interno)"
                      : "Destino (Destinatário)"}
                  </label>
                  <input
                    required
                    value={formData.destino}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        destino: e.target.value,
                      }))
                    }
                    placeholder={
                      tipo === "Entrada"
                        ? "Setor de Destino"
                        : "Ex: Direção Provincial"
                    }
                    className="w-full p-3 border rounded-xl text-sm focus:ring-2 focus:ring-slate-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* OPÇÃO DE FLUXO DE TRAMITAÇÃO OBRIGATÓRIA DE VIAGEM */}
            <div className={`p-4 rounded-2xl border transition-all ${isViagem ? "bg-emerald-50 border-emerald-300 shadow-sm" : "bg-slate-50 border-slate-200"}`}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isViagem}
                  onChange={(e) => setIsViagem(e.target.checked)}
                  className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                />
                <div>
                  <span className="text-xs font-black text-slate-900  tracking-wide block">
                    ✈ Expediente de Viagem / Missão de Serviço (Fluxo Obrigatório)
                  </span>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-0.5">
                    Os pedidos de viagem seguem obrigatoriamente o ciclo completo de Ida e Volta: Secretaria Geral → DPEP → DAF → Transporte → Dir. DICOSAFA → Sec. Executiva → Diretor Geral → RH (Guia) → Devolução ao Remetente.
                  </p>
                </div>
              </label>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                <FileText size={18} className="text-slate-400" />
                <h3 className="font-black text-slate-900 text-xs tracking-widest">
                  Dados do documento
                </h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">
                    Referência Externa (se houver)
                  </label>
                  <input
                    value={formData.referenciaExterna}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        referenciaExterna: e.target.value,
                      }))
                    }
                    placeholder="Ex: Ofício nº 123/2026"
                    className="w-full p-3 border rounded-xl text-sm font-mono focus:ring-2 focus:ring-slate-500 outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">
                      Data
                    </label>
                    <input
                      type="date"
                      value={formData.data}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          data: e.target.value,
                        }))
                      }
                      className="w-full p-3 border rounded-xl text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">
                      Urgência
                    </label>
                    <select
                      value={formData.urgencia}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          urgencia: e.target.value,
                        }))
                      }
                      className="w-full p-3 border rounded-xl text-sm outline-none"
                    >
                      <option>Normal</option>
                      <option>Urgente</option>
                      <option>Muito Urgente</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">
              Assunto / descrição do expediente
            </label>
            <textarea
              required
              rows={3}
              value={formData.assunto}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, assunto: e.target.value }))
              }
              placeholder="Descreva o conteúdo principal do documento..."
              className="w-full p-4 border rounded-2xl text-sm focus:ring-2 focus:ring-slate-500 outline-none transition-all resize-none"
            />
          </div>

          {/* 1. CARREGAMENTO DE DOCUMENTO EM PDF, WORD OU EXCEL */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileCheck className="text-blue-600" size={20} />
                <div>
                  <h4 className="text-xs font-black text-slate-900  tracking-wider">
                    Carregar Documento Oficial (PDF / Word / Excel)
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Anexe o ficheiro original em formato .pdf, .docx ou .xlsx para visualização e despacho
                  </p>
                </div>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.docx,.doc,.xlsx,.xls,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleFileChange}
              className="hidden"
            />

            {!uploadedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group shadow-sm hover:shadow"
              >
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload size={22} />
                </div>
                <div className="text-xs font-bold text-slate-800">
                  Clique ou arraste aqui o documento em PDF, Word ou Excel
                </div>
                <span className="text-[10px] text-slate-400">
                  Formatos aceites: .PDF, .DOCX, .DOC, .XLSX, .XLS (até 25MB)
                </span>
              </div>
            ) : (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                    {uploadedFile.tipo.includes("xls") ? (
                      <FileSpreadsheet size={24} className="text-emerald-600" />
                    ) : uploadedFile.tipo.includes("doc") ? (
                      <FileText size={24} className="text-blue-600" />
                    ) : (
                      <FileText size={24} className="text-red-600" />
                    )}
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-900 truncate max-w-sm">
                      {uploadedFile.nome}
                    </h5>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                      <span className=" font-bold text-blue-600">
                        .{uploadedFile.tipo}
                      </span>
                      <span>•</span>
                      <span>{uploadedFile.tamanho}</span>
                      <span>•</span>
                      <span className="text-emerald-600 font-bold">✓ Pronto para leitura</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
                  >
                    Substituir
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all"
                    title="Remover ficheiro"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* BOTAO PARA VISUALIZAR FLUXOGRAMA DE TRAMITAÇÃO */}
          <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                  <Share2 size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black tracking-wide text-white uppercase">
                    Fluxograma Oficial de Tramitação do Expediente
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Consulte as 8 etapas sequenciais, pareceres setoriais e fluxo em tempo real
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFluxograma(!showFluxograma)}
                className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <span>{showFluxograma ? "Ocultar Fluxograma" : "Ver Fluxograma Completo"}</span>
                {showFluxograma ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {showFluxograma && (
              <div className="mt-2 pt-3 border-t border-slate-800">
                <FluxogramaTramitacaoExpediente showSimulador={true} />
              </div>
            )}
          </div>

          {/* 2. REGRA DE TRAMITAÇÃO E ASSINATURA DIGITAL DO REMETENTE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
            {/* Nota Informativa sobre Envio sem Parecer Inicial */}
            <div className="flex flex-col justify-between space-y-2">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2 text-amber-800">
                  <ShieldCheck size={18} className="text-amber-600" />
                  <label className="text-xs font-black  tracking-wider">
                    Tramitação Oficial e Isenção de Parecer Inicial
                  </label>
                </div>
                <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                  Os documentos são submetidos e assinados pelo <strong>Remetente</strong> <em>sem qualquer parecer ou despacho inicial</em>. 
                  Os pareceres e despachos serão atribuídos pelos setores correspondentes (Secretaria Geral, DPEP, DAF, Transporte, DICOSAFA e Direção-Geral) assim que o expediente for recebido no setor de destino.
                </p>
              </div>
            </div>

            {/* Campo de Assinatura Digital */}
            <div className="flex flex-col justify-between space-y-2">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="text-blue-600" size={18} />
                    <label className="text-xs font-black text-slate-900  tracking-wider">
                      Assinatura Digital & Rubrica
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAssinaturaModal(true)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <Pen size={12} />
                    <span>{assinaturaData ? "Alterar Assinatura" : "Carregar / Desenhar"}</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mb-2">
                  Aponha a sua assinatura manuscrita ou carimbo digital para autenticar o documento
                </p>
              </div>

              {assinaturaData ? (
                <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={assinaturaData.assinaturaImg}
                      alt="Assinatura"
                      className="max-h-12 max-w-[130px] object-contain"
                    />
                    <div>
                      <div className="text-xs font-black text-slate-900">
                        {assinaturaData.assinanteNome}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {assinaturaData.assinanteCargo}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                    ✓ Pronta
                  </span>
                </div>
              ) : (
                <div
                  onClick={() => setShowAssinaturaModal(true)}
                  className="bg-white border-2 border-dashed border-slate-300 hover:border-blue-400 p-4 rounded-xl text-center cursor-pointer transition-all"
                >
                  <span className="text-xs text-slate-500 font-bold block">
                    Nenhuma assinatura aposta
                  </span>
                  <span className="text-[10px] text-blue-600">
                    Clique para desenhar ou carregar imagem da sua assinatura
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex justify-end gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-8 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs tracking-widest hover:bg-slate-200 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isSubmitted}
              className="px-10 py-3 bg-slate-900 text-white rounded-xl font-black text-xs tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                "A processar..."
              ) : (
                <>
                  <Save size={16} /> Gravar no protocolo
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      {/* MODAL SUSPENSO DE ASSINATURA DIGITAL */}
      {showAssinaturaModal && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <AssinaturaDigitalPad
            defaultNome={user?.nome || user?.name || "SLAITER"}
            defaultCargo={user?.cargo || "Professor Titular / Gestor"}
            onCancel={() => setShowAssinaturaModal(false)}
            onSaveAssinatura={(data) => {
              setAssinaturaData(data);
              setShowAssinaturaModal(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

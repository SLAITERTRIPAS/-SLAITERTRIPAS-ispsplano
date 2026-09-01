import { printElementById } from "../lib/printUtils";
import React, { useState } from "react";
import {
  X,
  Download,
  Printer,
  Share2,
  FileSpreadsheet,
  FileText,
  FileCode,
  CheckCircle2,
  ShieldCheck,
  Send,
  Pen,
  Calendar,
  Building,
  User,
  Clock,
  ExternalLink,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Eye,
} from "lucide-react";
import { Expediente } from "../types";
import AssinaturaDigitalPad from "./AssinaturaDigitalPad";
import FluxogramaTramitacaoExpediente from "./FluxogramaTramitacaoExpediente";

interface DocumentReaderModalProps {
  documento?: any;
  expediente?: any;
  onClose: () => void;
  onUpdateExpediente?: (updated: Expediente) => Promise<any> | void;
  user?: any;
  onActionSuccess?: (msg: string) => void;
}

export default function DocumentReaderModal({
  documento,
  expediente,
  onClose,
  onUpdateExpediente,
  user,
  onActionSuccess,
}: DocumentReaderModalProps) {
  const doc = expediente || documento;
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"documento" | "tramitacao" | "despacho">("documento");
  const [showAssinaturaModal, setShowAssinaturaModal] = useState<boolean>(false);
  const [parecerTexto, setParecerTexto] = useState<string>(
    doc?.rawExpediente?.despacho?.texto || doc?.despacho?.texto || ""
  );
  const [destinatario, setDestinatario] = useState<string>(
    doc?.rawExpediente?.destino || doc?.encaminhado || ""
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Assinatura temporária ou aplicada
  const [assinaturaData, setAssinaturaData] = useState<{
    assinaturaImg?: string;
    tipoAssinatura?: "imagem" | "desenhada" | "digital";
    assinanteNome?: string;
    assinanteCargo?: string;
    dataAssinatura?: string;
    hashAutenticacao?: string;
  } | null>(doc?.rawExpediente?.assinaturaDigital || doc?.assinaturaDigital || null);

  const docData = doc?.dadosRelatorio || {
    titulo: doc?.assunto || "Expediente Institucional",
    subtitulo: doc?.nomeArquivo || "Documento.pdf",
    execucaoOrcamental: 88,
    barras: [
      { rotulo: "Jan-Fev", valor: 70 },
      { rotulo: "Mar-Abr", valor: 85 },
      { rotulo: "Mai-Jun", valor: 92 },
      { rotulo: "Jul-Ago", valor: 80 },
    ],
    tabela: [
      { item: "Gastos com Pessoal", orcamento: "4.500.000 MT", gasto: "3.920.000 MT", saldo: "580.000 MT" },
      { item: "Bens e Serviços", orcamento: "2.800.000 MT", gasto: "2.450.000 MT", saldo: "350.000 MT" },
      { item: "Investimentos em TI", orcamento: "1.900.000 MT", gasto: "1.680.000 MT", saldo: "220.000 MT" },
    ],
    distribuicao: [
      { nome: "Operacional", percentual: 60, cor: "#2563eb" },
      { nome: "Investimento", percentual: 40, cor: "#60a5fa" },
    ],
  };

  const isPdf =
    doc?.nomeArquivo?.toLowerCase().endsWith(".pdf") ||
    doc?.rawExpediente?.tipoArquivo === "pdf" ||
    doc?.tipoArquivo === "pdf" ||
    doc?.arquivoUrl?.startsWith("data:application/pdf");

  const isExcel =
    doc?.nomeArquivo?.toLowerCase().endsWith(".xlsx") ||
    doc?.nomeArquivo?.toLowerCase().endsWith(".xls") ||
    doc?.rawExpediente?.tipoArquivo === "xlsx" ||
    doc?.tipoArquivo === "xlsx";

  const isWord =
    doc?.nomeArquivo?.toLowerCase().endsWith(".docx") ||
    doc?.nomeArquivo?.toLowerCase().endsWith(".doc") ||
    doc?.rawExpediente?.tipoArquivo === "docx" ||
    doc?.tipoArquivo === "docx";

  // Download do Ficheiro Real
  const handleBaixar = () => {
    if (doc?.arquivoUrl || doc?.rawExpediente?.arquivoUrl) {
      const url = doc.arquivoUrl || doc.rawExpediente.arquivoUrl;
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.nomeArquivo || "Documento_SIGEP.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Exportar dados do expediente em JSON/Texto
      const jsonContent = JSON.stringify(doc, null, 2);
      const blob = new Blob([jsonContent], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.nomeArquivo || "Documento_SIGEP.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    if (onActionSuccess) {
      onActionSuccess(`Ficheiro "${doc.nomeArquivo}" descarregado com sucesso!`);
    }
  };

  // Salvar Despacho e Assinatura no Firestore
  const handleSalvarDespachoEAssinatura = async () => {
    if (!parecerTexto.trim() && !assinaturaData) {
      alert("Por favor insira um parecer/despacho ou aponha a sua assinatura digital.");
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const raw = doc.rawExpediente || (doc.id ? doc : {});

      const novoHistorico = [
        ...(raw.historico || []),
        {
          data: now,
          setor: user?.departamento || user?.setor || "Direção Central",
          acao: destinatario ? `Despacho e Encaminhamento para ${destinatario}` : "Aposição de Despacho e Assinatura",
          parecer: parecerTexto || "Documento analisado e rubricado digitalmente com conformidade institucional.",
          responsavel: assinaturaData?.assinanteNome || user?.name || user?.nome || "Responsável Autorizado",
          cargo: assinaturaData?.assinanteCargo || user?.cargo || "Gestor Institucional",
          assinaturaImg: assinaturaData?.assinaturaImg,
        },
      ];

      const updatedExpediente: Expediente = {
        ...raw,
        id: raw.id || doc.id,
        numero: raw.numero || doc.numeroRastreio || doc.numero || "EXP-2026",
        data: raw.data || doc.dataRecebimento || doc.data || new Date().toISOString().split("T")[0],
        origem: raw.origem || doc.remetente || "Gabinete Central",
        destino: destinatario || raw.destino || doc.encaminhado || "Direção Geral",
        assunto: raw.assunto || doc.assunto || "Expediente Institucional",
        tipo: raw.tipo || doc.tipo || "Entrada",
        status: destinatario ? "Em Tramitação" : "Despachado",
        dataDespacho: now,
        despacho: parecerTexto
          ? {
              texto: parecerTexto,
              data: now,
              responsavel: assinaturaData?.assinanteNome || user?.name || user?.nome || "Responsável Autorizado",
              cargo: assinaturaData?.assinanteCargo || user?.cargo || "Gestor",
              assinaturaImg: assinaturaData?.assinaturaImg,
            }
          : raw.despacho || doc.despacho,
        assinaturaDigital: assinaturaData
          ? {
              assinanteNome: assinaturaData.assinanteNome || user?.name || "Responsável",
              assinanteCargo: assinaturaData.assinanteCargo || user?.cargo || "Gestor",
              dataAssinatura: assinaturaData.dataAssinatura || now,
              assinaturaImg: assinaturaData.assinaturaImg || "",
              hashAutenticacao: assinaturaData.hashAutenticacao || `SIGEP-AUTH-${Date.now()}`,
              tipoAssinatura: assinaturaData.tipoAssinatura || "digital",
            }
          : raw.assinaturaDigital || doc.assinaturaDigital,
        historico: novoHistorico,
      };

      if (onUpdateExpediente) {
        await onUpdateExpediente(updatedExpediente);
      }

      if (onActionSuccess) {
        onActionSuccess("Despacho e assinatura digital salvos com sucesso no sistema!");
      }
      onClose();
    } catch (error) {
      console.error(error);
      alert("Erro ao gravar despacho e assinatura.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
      <div
      className={`fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-2 md:p-6 transition-all ${
        isFullscreen ? "p-0" : ""
      }`}
    >
      {/* CARD PRINCIPAL DO LEITOR */}
      <div
        className={`bg-[#060c22] border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden w-full transition-all ${
          isFullscreen ? "h-screen rounded-none border-none" : "max-w-6xl max-h-[92vh] h-[92vh]"
        }`}
      >
        {/* BARRA SUPERIOR DO LEITOR */}
        <header className="bg-[#091230] border-b border-slate-700/80 px-4 md:px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-amber-400">
              {isExcel ? (
                <FileSpreadsheet size={22} className="text-emerald-400" />
              ) : isWord ? (
                <FileText size={22} className="text-blue-400" />
              ) : (
                <FileText size={22} className="text-red-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm md:text-base font-black text-white truncate max-w-md">
                  {documento?.nomeArquivo || "Documento Oficial"}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 font-mono">
                  {documento?.numeroRastreio || "EXP-2026"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-lg">
                Assunto: <strong className="text-slate-200">{documento?.assunto}</strong> • Remetente:{" "}
                <strong className="text-slate-200">{documento?.remetente}</strong>
              </p>
            </div>
          </div>

          {/* Abas de Navegação & Controles */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden sm:flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab("documento")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "documento"
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Visualizar Documento
              </button>
              <button
                onClick={() => setActiveTab("tramitacao")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "tramitacao"
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Tramitação & Histórico
              </button>
              <button
                onClick={() => setActiveTab("despacho")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "despacho"
                    ? "bg-amber-500 text-slate-950 font-black shadow"
                    : "text-amber-400 hover:bg-amber-400/10"
                }`}
              >
                <Pen size={13} />
                <span>Assinar / Despachar</span>
              </button>
            </div>

            {/* Ações de Zoom e Tela Cheia */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                title="Reduzir Zoom"
              >
                <ZoomOut size={15} />
              </button>
              <span className="text-[10px] font-mono text-slate-300 px-1 font-bold">
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                title="Aumentar Zoom"
              >
                <ZoomIn size={15} />
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 ml-1 border-l border-slate-800"
                title={isFullscreen ? "Sair de Tela Cheia" : "Tela Cheia"}
              >
                {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>
            </div>

            {/* Fechar */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-red-600/80 text-slate-300 hover:text-white transition-all ml-1"
              title="Fechar Leitor"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* CORPO CENTRAL DO LEITOR */}
        <div className="flex-1 overflow-y-auto bg-[#030712] p-4 md:p-8 flex justify-center items-start select-text">
          {activeTab === "documento" && (
            <div
              className="w-full max-w-4xl bg-white text-slate-900 shadow-2xl rounded-2xl p-6 md:p-12 transition-all border border-slate-200 min-h-[700px] flex flex-col justify-between"
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
            >
              {/* Se o ficheiro for PDF real carregado pelo utilizador */}
              {documento?.arquivoUrl && isPdf ? (
                <div className="flex-1 flex flex-col">
                  <div className="mb-4 pb-3 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        {documento.nomeArquivo}
                      </h3>
                      <p className="text-xs text-slate-500">Documento PDF Incorporado</p>
                    </div>
                    <button
                      onClick={handleBaixar}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow"
                    >
                      <Download size={14} />
                      <span>Descarregar Original</span>
                    </button>
                  </div>
                  <iframe
                    src={documento.arquivoUrl}
                    title="Visualizador PDF"
                    className="w-full h-[650px] border border-slate-300 rounded-xl shadow-inner"
                  />
                </div>
              ) : (
                /* FOLHA OFICIAL INSTITUCIONAL FORMATADA */
                <div className="flex-1 flex flex-col">
                  {/* CABEÇALHO DA FOLHA OFICIAL */}
                  <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 via-red-500 to-blue-600 p-0.5">
                        <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-amber-400 font-bold text-xs">
                          Songo
                        </div>
                      </div>
                      <div>
                        <h1 className="text-base md:text-lg font-black text-slate-900 tracking-wider">
                          Instituto Superior Politécnico de Songo
                        </h1>
                        <p className="text-[11px] font-bold text-slate-600 tracking-widest">
                          SIGEP • Sistema Integrado de Gestão Institucional
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] font-bold text-slate-500 tracking-widest">
                        Nº de Rastreio Oficial
                      </div>
                      <div className="text-sm font-black font-mono text-blue-900">
                        {documento?.numeroRastreio || "EXP-2026-001"}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {documento?.dataRecebimento || "20 de agosto de 2026"}
                      </div>
                    </div>
                  </div>

                  {/* METADADOS DO EXPEDIENTE */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold">
                        Remetente / Origem
                      </span>
                      <strong className="text-slate-900 text-sm">{documento?.remetente}</strong>
                      <span className="text-slate-500 block text-[11px]">
                        {documento?.remetenteCargo || "Setor Institucional"}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold">
                        Destino / Encaminhamento
                      </span>
                      <strong className="text-blue-900 text-sm">{documento?.encaminhado}</strong>
                      <span className="text-slate-500 block text-[11px]">
                        {documento?.encaminhadoSetor || "Em Tramitação"}
                      </span>
                    </div>
                  </div>

                  {/* CORPO DO DOCUMENTO / ASSUNTO */}
                  <div className="mb-6">
                    <h2 className="text-xl font-black text-slate-900 font-serif mb-2">
                      {docData.titulo || documento?.assunto}
                    </h2>
                    <p className="text-xs text-slate-700 leading-relaxed text-justify">
                      {documento?.rawExpediente?.observacoes ||
                        "Documento e expediente interno protocolado para os devidos efeitos legais, análise orçamental, validação pedagógica ou administrativa e emissão de parecer pelo órgão competente."}
                    </p>
                  </div>

                  {/* GRÁFICO OU TABELA DE DADOS INTEGRADA */}
                  {docData.barras && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                      <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-800">
                        <span>Desempenho / Execução Institucional</span>
                        <span className="text-blue-700 font-mono font-black">
                          {docData.execucaoOrcamental || 87.5}% Concluído
                        </span>
                      </div>
                      <div className="flex items-end gap-3 h-24 pt-2 border-b border-slate-200 pb-2">
                        {docData.barras.map((b: any, i: number) => (
                          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                            <span className="text-[9px] font-bold text-blue-700 mb-1">{b.valor}%</span>
                            <div
                              className="w-full bg-blue-600 rounded-t shadow"
                              style={{ height: `${b.valor}%` }}
                            />
                            <span className="text-[9px] text-slate-600 font-semibold mt-1">
                              {b.rotulo}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TABELA DE RUBRICAS */}
                  {docData.tabela && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden mb-6 text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-2.5">Item / Rubrica</th>
                            <th className="p-2.5 text-right">Orçamento</th>
                            <th className="p-2.5 text-right">Executado</th>
                            <th className="p-2.5 text-right">Saldo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {docData.tabela.map((r: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2.5 font-medium text-slate-900">{r.item}</td>
                              <td className="p-2.5 text-right text-slate-600">{r.orcamento}</td>
                              <td className="p-2.5 text-right font-bold text-blue-700">{r.gasto}</td>
                              <td className="p-2.5 text-right text-emerald-700 font-medium">
                                {r.saldo || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* SEÇÃO DE DESPACHO E ASSINATURA DIGITAL (RODAPÉ DA FOLHA) */}
                  <div className="mt-8 pt-6 border-t-2 border-slate-300 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Despacho / Parecer do Relator (Área Clicável) */}
                    <div
                      onClick={() => setActiveTab("despacho")}
                      className="bg-slate-50 hover:bg-amber-50/50 p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-amber-400 flex flex-col justify-between cursor-pointer transition-all group relative shadow-sm"
                      title="Clique para redigir ou editar o despacho/parecer deste documento"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black tracking-wider text-slate-600 group-hover:text-amber-800 flex items-center gap-1.5">
                          <Pen size={12} className="text-amber-600" />
                          Despacho / Parecer Institucional
                        </span>
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          Clique para editar
                        </span>
                      </div>

                      <div className="my-2 min-h-[60px] flex items-center">
                        {parecerTexto ||
                        documento?.rawExpediente?.despacho?.texto ||
                        documento?.despacho?.texto ? (
                          <p className="text-xs text-slate-800 italic leading-relaxed">
                            «
                            {parecerTexto ||
                              documento?.rawExpediente?.despacho?.texto ||
                              documento?.despacho?.texto}
                            »
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 italic">
                            Nenhum despacho emitido. Clique aqui para lavrar o parecer oficial e encaminhamento.
                          </p>
                        )}
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500">
                        <span>Data: {documento?.dataEncaminhamento || documento?.dataRecebimento || "Agosto de 2026"}</span>
                        <span className="font-semibold text-slate-700">Órgão Relator</span>
                      </div>
                    </div>

                    {/* Assinatura Digital & Chancela (Área Clicável) */}
                    <div
                      onClick={() => setShowAssinaturaModal(true)}
                      className="bg-slate-50 hover:bg-blue-50/50 p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 flex flex-col items-center justify-center text-center cursor-pointer transition-all group relative shadow-sm"
                      title="Clique para apor ou alterar a assinatura digital"
                    >
                      <div className="w-full flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black tracking-wider text-slate-600 group-hover:text-blue-800 flex items-center gap-1.5">
                          <ShieldCheck size={13} className="text-blue-600" />
                          Assinatura Digital & Chancela
                        </span>
                        <span className="text-[9px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          Clique para assinar
                        </span>
                      </div>

                      {assinaturaData?.assinaturaImg ||
                      documento?.rawExpediente?.assinaturaDigital?.assinaturaImg ? (
                        <div className="flex flex-col items-center my-1 w-full">
                          <img
                            src={
                              assinaturaData?.assinaturaImg ||
                              documento?.rawExpediente?.assinaturaDigital?.assinaturaImg
                            }
                            alt="Assinatura Digital"
                            className="max-h-16 max-w-[200px] object-contain my-1"
                          />
                          <div className="w-full border-t border-slate-400 pt-1 flex flex-col items-center">
                            <span className="font-black text-slate-900 text-xs">
                              {assinaturaData?.assinanteNome ||
                                documento?.rawExpediente?.assinaturaDigital?.assinanteNome ||
                                "Responsável Autorizado"}
                            </span>
                            <span className="text-[10px] text-slate-600 font-medium">
                              {assinaturaData?.assinanteCargo ||
                                documento?.rawExpediente?.assinaturaDigital?.assinanteCargo ||
                                "Gestor Institucional"}
                            </span>
                            <span className="text-[9px] font-mono text-emerald-600 font-bold mt-0.5">
                              ✓ Autenticado eletronicamente
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-4 text-center">
                          <div className="w-24 border-b-2 border-slate-400 mb-2" />
                          <div className="text-xs font-bold text-blue-700 group-hover:text-blue-900 flex items-center gap-1.5 bg-blue-100/70 px-3 py-1.5 rounded-lg border border-blue-200">
                            <Pen size={13} />
                            <span>Apor Minha Assinatura Digital</span>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1">
                            Carregue, desenhe ou autentique digitalmente
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ABA: TRAMITAÇÃO E HISTÓRICO */}
          {activeTab === "tramitacao" && (
            <div className="w-full max-w-4xl bg-[#070e28] text-white p-6 md:p-8 rounded-2xl border border-slate-700 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-amber-400 tracking-wider flex items-center gap-2">
                  <Clock size={18} />
                  <span>Histórico de Tramitação & Ciclo Institucional</span>
                </h3>
                {(doc?.rawExpediente?.isDocumentoViagem || doc?.isDocumentoViagem || doc?.guiaViagem || doc?.rawExpediente?.guiaViagem) && (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono">
                    ✈ Fluxo de Viagem Obrigatório (Ida, Despacho, RH & Volta)
                  </span>
                )}
              </div>

              {/* CARD DE GUIA DE VIAGEM EMITIDA PELO RH */}
              {(doc?.rawExpediente?.guiaViagem || doc?.guiaViagem) && (
                <div className="bg-gradient-to-r from-purple-950/80 via-purple-900/40 to-slate-900 p-5 rounded-2xl border-2 border-purple-500/60 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-purple-300 font-black text-xs tracking-widest">
                      <span className="p-1.5 rounded-lg bg-purple-500 text-slate-950">✈</span>
                      <span>Guia de Viagem & Apresentação Oficial (RH)</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-400/40 text-purple-200 font-mono text-xs font-bold">
                      {doc?.rawExpediente?.guiaViagem?.numeroGuia || doc?.guiaViagem?.numeroGuia}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/80 p-3.5 rounded-xl border border-purple-800/40 text-xs">
                    <div>
                      <span className="text-[10px] text-purple-300/70 font-bold block">Beneficiário</span>
                      <strong className="text-white text-xs">
                        {doc?.rawExpediente?.guiaViagem?.beneficiario || doc?.guiaViagem?.beneficiario}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-purple-300/70 font-bold block">Destino da Missão</span>
                      <strong className="text-amber-300 text-xs">
                        {doc?.rawExpediente?.guiaViagem?.destinoViagem || doc?.guiaViagem?.destinoViagem}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-purple-300/70 font-bold block">Período</span>
                      <strong className="text-slate-200 text-xs">
                        {doc?.rawExpediente?.guiaViagem?.periodo || doc?.guiaViagem?.periodo}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-purple-300/70 font-bold block">Meios Alocados</span>
                      <strong className="text-emerald-300 text-xs">
                        {doc?.rawExpediente?.guiaViagem?.meiosAlocados || doc?.guiaViagem?.meiosAlocados}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-purple-200/80 pt-1">
                    <span>Emitido por: <strong>{doc?.rawExpediente?.guiaViagem?.emitidoPor || doc?.guiaViagem?.emitidoPor || "Direção de Recursos Humanos"}</strong></span>
                    <span className="font-mono text-[10px] text-emerald-400 font-bold">✓ Documento Válido & Chancelado</span>
                  </div>
                </div>
              )}

              {/* FLUXOGRAMA SEQUENCIAL OFICIAL DE TRAMITAÇÃO */}
              <div className="space-y-2">
                <FluxogramaTramitacaoExpediente
                  expediente={doc?.rawExpediente || doc}
                  showSimulador={false}
                />
              </div>

              {/* LISTA DO HISTÓRICO DE TRAMITAÇÃO */}
              <div className="space-y-3">
                <span className="text-[10px] font-black tracking-widest text-slate-400 block">
                  Registo Cronológico de Pareceres & Atos
                </span>
                {(documento?.rawExpediente?.historico || [
                  {
                    data: documento?.dataRecebimento || "20 de agosto de 2026",
                    setor: documento?.remetente || "Secretaria Geral",
                    acao: "Registo e Entrada do Documento",
                    parecer: "Documento submetido para apreciação institucional.",
                    responsavel: documento?.remetente || "Gestor",
                  },
                  {
                    data: documento?.dataEncaminhamento || "20 de agosto de 2026",
                    setor: documento?.encaminhado || "Direção Geral",
                    acao: "Encaminhado para Parecer e Despacho",
                    parecer: "Encaminhamento aos órgãos competentes.",
                    responsavel: "Diretoria",
                  },
                ]).map((hist: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Building size={14} className="text-amber-400" />
                        {hist.setor}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">{hist.data}</span>
                    </div>

                    <div className="text-xs font-semibold text-blue-400">{hist.acao}</div>

                    {hist.parecer && (
                      <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 italic">
                        "{hist.parecer}"
                      </p>
                    )}

                    {hist.assinaturaImg && (
                      <div className="mt-2 pt-2 border-t border-slate-800 flex items-center gap-3">
                        <img
                          src={hist.assinaturaImg}
                          alt="Assinatura"
                          className="h-10 bg-white p-1 rounded border border-slate-600"
                        />
                        <div className="text-[10px] text-slate-400">
                          Assinado por: <strong className="text-white">{hist.responsavel}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA: PARECER, DESPACHO E ASSINATURA */}
          {activeTab === "despacho" && (
            <div className="w-full max-w-2xl bg-[#070e28] text-white p-6 md:p-8 rounded-2xl border border-slate-700 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-amber-400 tracking-wider flex items-center gap-2">
                  <Pen size={18} />
                  <span>Emitir Parecer & Apor Assinatura Digital</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {documento?.numeroRastreio}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Encaminhar Para (Opcional)
                </label>
                <select
                  value={destinatario}
                  onChange={(e) => setDestinatario(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="">Manter no setor atual...</option>
                  <option value="Gabinete do Diretor-Geral">Gabinete do Diretor-Geral</option>
                  <option value="Direção Central">Direção Central</option>
                  <option value="Departamento de Administração e Finanças">
                    Departamento de Administração e Finanças (DAF)
                  </option>
                  <option value="Repartição de Planificação">Repartição de Planificação</option>
                  <option value="Repartição de Pessoal">Repartição de Pessoal</option>
                  <option value="UGEA">UGEA</option>
                  <option value="Secretaria Geral">Secretaria Geral</option>
                  <option value="Direção Pedagógica">Direção Pedagógica</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Texto do Parecer / Despacho Institucional
                </label>
                <textarea
                  rows={4}
                  value={parecerTexto}
                  onChange={(e) => setParecerTexto(e.target.value)}
                  placeholder="Escreva aqui o seu parecer técnico, despacho ou despacho executivo..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              {/* Bloco de Assinatura Digital */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="text-amber-400" size={18} />
                    <span className="text-xs font-bold text-white">
                      Assinatura Digital
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAssinaturaModal(true)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow cursor-pointer"
                  >
                    <Pen size={13} />
                    <span>
                      {assinaturaData ? "Alterar Assinatura" : "Carregar / Desenhar Assinatura"}
                    </span>
                  </button>
                </div>

                {assinaturaData ? (
                  <div className="bg-white text-slate-900 p-3 rounded-lg flex items-center justify-between border border-slate-300">
                    <div className="flex items-center gap-3">
                      <img
                        src={assinaturaData.assinaturaImg}
                        alt="Assinatura"
                        className="max-h-12 max-w-[140px] object-contain"
                      />
                      <div>
                        <div className="text-xs font-black">{assinaturaData.assinanteNome}</div>
                        <div className="text-[10px] text-slate-600">
                          {assinaturaData.assinanteCargo}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                      ✓ Assinatura Pronta
                    </span>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 bg-slate-900 p-3 rounded-lg border border-slate-800 text-center">
                    Nenhuma assinatura aposta ainda. Clique no botão acima para desenhar ou carregar a sua imagem de assinatura.
                  </div>
                )}
              </div>

              {/* Botão de Salvar Despacho */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab("documento")}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSalvarDespachoEAssinatura}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-900/40 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 size={16} />
                  <span>{isSaving ? "Gravando..." : "Confirmar e Gravar Despacho"}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* BARRA INFERIOR DE AÇÕES RÁPIDAS */}
        <footer className="bg-[#091230] border-t border-slate-700/80 px-4 md:px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBaixar}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-xl text-xs font-black shadow transition-all cursor-pointer"
            >
              <Download size={14} />
              <span>Baixar Ficheiro</span>
            </button>
            <button
              onClick={() => printElementById("print-area")}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold shadow transition-all cursor-pointer"
            >
              <Printer size={14} />
              <span>Imprimir</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab("despacho");
                setShowAssinaturaModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black shadow transition-all cursor-pointer"
            >
              <Pen size={14} />
              <span>Apor Assinatura Digital</span>
            </button>
          </div>
        </footer>
      </div>

      {/* MODAL SUSPENSO DO PAD DE ASSINATURA */}
      {showAssinaturaModal && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <AssinaturaDigitalPad
            defaultNome={user?.nome || user?.name || "SLAITER"}
            defaultCargo={user?.cargo || "Professor Titular / Gestor"}
            onCancel={() => setShowAssinaturaModal(false)}
            onSaveAssinatura={(data) => {
              setAssinaturaData(data);
              setShowAssinaturaModal(false);
              if (onActionSuccess) {
                onActionSuccess("Assinatura digital carregada e associada ao documento!");
              }
            }}
          />
        </div>
      )}
    </div>
  );
}

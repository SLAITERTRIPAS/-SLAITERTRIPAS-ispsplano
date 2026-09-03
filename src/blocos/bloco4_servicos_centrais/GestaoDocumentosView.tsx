import React, { useState } from "react";
import {
  ArrowLeft,
  Inbox,
  Send,
  FileText,
  CheckCircle2,
  Search,
  UserCheck,
  History,
  Forward,
  AlertCircle,
  Plus,
  Pen,
  LayoutGrid,
} from "lucide-react";
import { Expediente } from "../../types";
import {
  UNIDADES_ORGANICAS_SISTEMA,
  DEPARTAMENTOS,
  REPARTICOES,
  CURSOS,
} from "../../constants/formOptions";
import LoadingSpinner from "../bloco1_apresentacao/LoadingSpinner";
import { InstitutionalHeader } from "../../components/InstitutionalHeader";
import FormularioExpediente from "../bloco6_documentos/FormularioExpediente";
import GerarDespachoSection from "../bloco5_sistema/GerarDespachoSection";
import GestaoExpedienteHistoricoView from "./GestaoExpedienteHistoricoView";
import { firestoreService } from "../../lib/firestoreService";

export default function GestaoDocumentosView({
  onBack,
  expedientes,
  onUpdateExpediente,
  onTrackingClick,
  title = "Secretaria Geral",
  hideHeader = false,
  user,
  onLogout,
}: {
  onBack: () => void;
  expedientes: Expediente[];
  onUpdateExpediente: (expediente: Expediente) => void;
  onTrackingClick: () => void;
  title?: string;
  hideHeader?: boolean;
  user?: any;
  onLogout?: () => void;
}) {
  const [viewMode, setViewMode] = useState<"historico_oficial" | "classico">("historico_oficial");

  if (viewMode === "historico_oficial") {
    return (
      <GestaoExpedienteHistoricoView
        onBack={onBack}
        expedientes={expedientes}
        onUpdateExpediente={onUpdateExpediente}
        user={user}
        title={title}
      />
    );
  }
  const [activeTab, setActiveTab] = useState<"entrada" | "saida" | "rastrear" | "gerar-despacho">(
    "entrada",
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedExpediente, setSelectedExpediente] =
    useState<Expediente | null>(null);
  const [showNovoExpediente, setShowNovoExpediente] = useState(false);
  const [parecer, setParecer] = useState("");
  const [vistoAplicado, setVistoAplicado] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");
  const [trackingResult, setTrackingResult] = useState<Expediente | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showTracking, setShowTracking] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackedExpediente, setTrackedExpediente] = useState<Expediente | null>(
    null,
  );

  // Filter expedientes for the current sector
  // Entrada: Documents where current sector is the destination
  const entradas = expedientes.filter(
    (e) =>
      e.destino.toUpperCase() === title.toUpperCase() &&
      e.status !== "Concluído",
  );

  // Saída: Documents that were processed by this sector or originated here
  const saidas = expedientes.filter(
    (e) =>
      (e.origem.toUpperCase() === title.toUpperCase() &&
        e.status === "Concluído") ||
      (e.historico?.some(
        (h) => h.setor.toUpperCase() === title.toUpperCase(),
      ) &&
        e.destino.toUpperCase() !== title.toUpperCase()),
  );

  const handleAplicarVisto = () => {
    setVistoAplicado(true);
  };

  const [showDestinos, setShowDestinos] = useState(false);
  const [selectedDestinoUnidade, setSelectedDestinoUnidade] = useState("");
  const [selectedDestinoDirecao, setSelectedDestinoDirecao] = useState("");
  const [selectedDestinoDepartamento, setSelectedDestinoDepartamento] =
    useState("");
  const [selectedDestinoReparticao, setSelectedDestinoReparticao] =
    useState("");
  const [selectedDestinoCurso, setSelectedDestinoCurso] = useState("");

  const destinos = [
    "Gabinete do Diretor-Geral",
    "Direção Central",
    "Departamento de Administração",
    "Departamento de Engenharia",
    "Repartição de Pessoal",
    "Repartição de Planificação",
    "Secretaria Geral",
  ];

  const handleDevolver = async () => {
    if (selectedExpediente) {
      setIsProcessing(true);
      try {
        const updated = {
          ...selectedExpediente,
          destino: selectedExpediente.origem,
          status: "Devolvido",
          historico: [
            ...(selectedExpediente.historico || []),
            {
              data: new Date().toISOString(),
              setor: title,
              acao: "Devolvido",
              parecer: parecer || "Devolvido sem parecer adicional.",
            },
          ],
        };
        await onUpdateExpediente(updated);
        
        // Notify the sender about the return and opinion
        if (selectedExpediente.userId) {
          try {
            await firestoreService.messages.add({
              subject: `Expediente Devolvido: ${selectedExpediente.numero}`,
              text: `O seu expediente ${selectedExpediente.numero} foi devolvido pelo setor ${title}. Parecer/Justificação: ${parecer || "Devolvido sem parecer adicional."}`,
              senderId: user?.id || "system",
              senderName: user?.nome || user?.name || title,
              recipientId: selectedExpediente.userId,
              recipientName: selectedExpediente.criadoPor || "Remetente",
              timestamp: new Date().toISOString(),
              read: false,
            });
          } catch (err) {
            console.error("Erro ao enviar notificação:", err);
          }
        }

        setIsProcessing(false);
        setSelectedExpediente(null);
        setParecer("");
        setVistoAplicado(false);
      } catch (error) {
        console.error("Error devolving expediente:", error);
        setIsProcessing(false);
        alert("Erro ao devolver expediente.");
      }
    }
  };

  const handleEnviar = async () => {
    if (!showDestinos) {
      setShowDestinos(true);
      return;
    }

    const finalDestino =
      selectedDestinoCurso ||
      selectedDestinoReparticao ||
      selectedDestinoDepartamento ||
      selectedDestinoDirecao ||
      selectedDestinoUnidade;

    if (!finalDestino) {
      alert("Por favor, selecione um destino.");
      return;
    }

    if (selectedExpediente) {
      setIsProcessing(true);
      try {
        const updated = {
          ...selectedExpediente,
          destino: finalDestino,
          status: "Em Trânsito",
          historico: [
            ...(selectedExpediente.historico || []),
            {
              data: new Date().toISOString(),
              setor: title,
              acao: `Encaminhado para ${finalDestino}`,
              parecer:
                parecer || (vistoAplicado ? "Visto digital aplicado." : ""),
            },
          ],
        };
        await onUpdateExpediente(updated);
        
        // Notify the sender about the routing and opinion
        if (selectedExpediente.userId && (parecer || vistoAplicado)) {
          try {
            await firestoreService.messages.add({
              subject: `Novo Parecer no Expediente ${selectedExpediente.numero}`,
              text: `O expediente ${selectedExpediente.numero} recebeu um parecer no setor ${title} e foi encaminhado para ${finalDestino}.\nParecer: ${parecer || (vistoAplicado ? "Visto digital aplicado." : "")}`,
              senderId: user?.id || "system",
              senderName: user?.nome || user?.name || title,
              recipientId: selectedExpediente.userId,
              recipientName: selectedExpediente.criadoPor || "Remetente",
              timestamp: new Date().toISOString(),
              read: false,
            });
          } catch (err) {
            console.error("Erro ao enviar notificação:", err);
          }
        }

        setIsProcessing(false);
        setSelectedExpediente(null);
        setParecer("");
        setVistoAplicado(false);
        setShowDestinos(false);
        setSelectedDestinoUnidade("");
        setSelectedDestinoDirecao("");
        setSelectedDestinoDepartamento("");
        setSelectedDestinoReparticao("");
        setSelectedDestinoCurso("");
      } catch (error) {
        console.error("Error sending expediente:", error);
        setIsProcessing(false);
        alert("Erro ao enviar expediente.");
      }
    }
  };

  if (showNovoExpediente) {
    return (
      <div
        className={`flex-1 overflow-y-auto bg-gray-50/30 w-full p-4 md:p-12`}
      >
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setShowNovoExpediente(false)}
            className="mb-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 font-black text-xs tracking-widest transition-all"
          >
            <ArrowLeft size={18} /> Voltar para o Expediente
          </button>
          <FormularioExpediente
            user={user}
            onCancel={() => setShowNovoExpediente(false)}
            tipoInitial={activeTab === "saida" ? "Saída" : "Entrada"}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col overflow-hidden ${hideHeader ? "h-full w-full" : "min-h-screen bg-slate-50/50"}`}
    >
      {isProcessing && <LoadingSpinner />}
      {!hideHeader && (
        <div className="bg-white">
          <InstitutionalHeader
            unidadeName={user?.unidadeOrganica || "UNIDADE ORGÂNICA"}
            direcaoName={user?.direcao}
            departamentoName={user?.departamento}
            reparticaoName={user?.reparticao}
            sectorName={user?.setor}
            year={2027}
            title="SISTEMA DE GESTÃO DE EXPEDIENTE"
          />
          <div className="px-4 md:px-12 pb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-black text-xs tracking-widest transition-all"
            >
              <ArrowLeft size={18} /> Voltar ao Painel
            </button>
          </div>
        </div>
      )}
      {showTracking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold text-blue-900 mb-4">
              Rastrear Expediente
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full p-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Introduza o número de rastreio"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowTracking(false);
                    setTrackedExpediente(null);
                  }}
                  className="px-4 py-2 text-gray-600 font-bold text-sm hover:bg-gray-50 rounded-lg"
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    const query = (trackingNumber || "").toLowerCase().trim();
                    const found = expedientes.find(
                      (e: any) =>
                        (e.numero || "").toLowerCase() === query ||
                        (e.numero || "").toLowerCase().includes(query) ||
                        (e.assunto || "").toLowerCase().includes(query) ||
                        (e.beneficiario || "").toLowerCase().includes(query) ||
                        (e.nomeBeneficiario || "").toLowerCase().includes(query) ||
                        (e.solicitante || "").toLowerCase().includes(query) ||
                        (e.guiaViagem?.beneficiario || "").toLowerCase().includes(query),
                    );
                    setTrackedExpediente(found || null);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700"
                >
                  Rastrear
                </button>
              </div>
              {trackedExpediente ? (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs font-bold text-blue-900 mb-1">
                    Status Atual:
                  </p>
                  <p className="text-sm font-bold text-blue-700">
                    {trackedExpediente.status}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    Assunto: {trackedExpediente.assunto}
                  </p>
                </div>
              ) : (
                trackingNumber && (
                  <p className="text-xs text-red-500 mt-2">
                    Expediente não encontrado.
                  </p>
                )
              )}
            </div>
          </div>
        </div>
      )}
      <main
        className={`flex-1 overflow-y-auto bg-gray-50/30 w-full ${hideHeader ? "p-0" : "p-4 md:p-12"}`}
      >
        <div className="w-full h-full">
          <div className="flex flex-col md:flex-row gap-6 mb-12">
            <button
              onClick={() => {
                setActiveTab("entrada");
                setSelectedExpediente(null);
              }}
              className={`flex-1 py-6 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all border-2 ${activeTab === "entrada" ? "bg-[#2563eb] text-white border-[#2563eb] shadow-2xl shadow-blue-200 scale-[1.02]" : "bg-slate-50/50 text-gray-600 border-gray-100 hover:border-blue-200 hover:bg-blue-50/30"}`}
            >
              <Inbox size={28} />
              <span className="tracking-tight">Caixa de Entrada</span>
              {entradas.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {entradas.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab("saida");
                setSelectedExpediente(null);
              }}
              className={`flex-1 py-6 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all border-2 ${activeTab === "saida" ? "bg-[#2563eb] text-white border-[#2563eb] shadow-2xl shadow-blue-200 scale-[1.02]" : "bg-slate-50/50 text-gray-600 border-gray-100 hover:border-blue-200 hover:bg-blue-50/30"}`}
            >
              <Send size={28} />
              <span className="tracking-tight">Caixa de Saída</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("rastrear");
                setSelectedExpediente(null);
              }}
              className={`flex-1 py-6 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all border-2 ${activeTab === "rastrear" ? "bg-[#2563eb] text-white border-[#2563eb] shadow-2xl shadow-blue-200 scale-[1.02]" : "bg-slate-50/50 text-gray-600 border-gray-100 hover:border-blue-200 hover:bg-blue-50/30"}`}
            >
              <Search size={28} />
              <span className="tracking-tight">Rastrear Fluxo</span>
            </button>
            {user?.isChefia && (
              <button
                onClick={() => {
                  setActiveTab("gerar-despacho");
                  setSelectedExpediente(null);
                }}
                className={`flex-1 py-6 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all border-2 ${activeTab === "gerar-despacho" ? "bg-amber-600 text-white border-amber-600 shadow-2xl shadow-amber-200 scale-[1.02]" : "bg-slate-50/50 text-gray-600 border-gray-100 hover:border-amber-200 hover:bg-amber-50/30"}`}
              >
                <Pen size={28} />
                <span className="tracking-tight">Gerar Despacho</span>
              </button>
            )}
          </div>

          {activeTab !== "rastrear" && !selectedExpediente && (
            <div className="flex justify-end mb-6">
              <button
                onClick={() => setShowNovoExpediente(true)}
                className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center gap-3"
              >
                <Plus size={20} /> Novo Registro de{" "}
                {activeTab === "entrada" ? "Entrada" : "Saída"}
              </button>
            </div>
          )}

          {activeTab === "gerar-despacho" && user?.isChefia ? (
            <GerarDespachoSection
              expedientes={expedientes}
              user={user}
              onUpdateExpediente={onUpdateExpediente}
            />
          ) : activeTab === "rastrear" ? (
            <div className="bg-slate-50/50 rounded-[2.5rem] shadow-2xl border border-gray-100 p-12">
              <h2 className="text-3xl font-black text-amber-500 tracking-tighter font-serif mb-6 inline-block bg-transparent">
                Rastrear expediente
              </h2>
              <p className="text-gray-600 mb-8">
                Insira o número de referência do expediente para acompanhar o
                seu fluxo em tempo real.
              </p>

              <div className="flex gap-4 mb-12">
                <div className="relative flex-1">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={24}
                  />
                  <input
                    type="text"
                    placeholder="Pesquisar por nº rastreio (Ex: EXP-2026-001), beneficiário ou assunto..."
                    className="w-full pl-14 pr-4 py-4 rounded-2xl border-2 border-gray-100 focus:border-blue-500 outline-none transition-all text-base"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => {
                    const query = (trackingCode || "").toLowerCase().trim();
                    const found = expedientes.find(
                      (e: any) =>
                        (e.numero || "").toLowerCase() === query ||
                        (e.numero || "").toLowerCase().includes(query) ||
                        (e.assunto || "").toLowerCase().includes(query) ||
                        (e.beneficiario || "").toLowerCase().includes(query) ||
                        (e.nomeBeneficiario || "").toLowerCase().includes(query) ||
                        (e.solicitante || "").toLowerCase().includes(query) ||
                        (e.guiaViagem?.beneficiario || "").toLowerCase().includes(query) ||
                        (e.guiaViagem?.numeroGuia || "").toLowerCase().includes(query),
                    );
                    setTrackingResult(found || null);
                    setHasSearched(true);
                  }}
                  className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100 tracking-tighter"
                >
                  Consultar
                </button>
              </div>

              {hasSearched &&
                (trackingResult ? (
                  <div className="space-y-8">
                    <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">
                          Referência
                        </p>
                        <p className="text-lg font-bold text-gray-900 font-mono">
                          {trackingResult.numero}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">
                          Origem
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                          {trackingResult.origem}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">
                          Estado
                        </p>
                        <p className="text-lg font-bold text-blue-600">
                          {trackingResult.status}
                        </p>
                      </div>
                      <div className="md:col-span-3">
                        <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">
                          Assunto
                        </p>
                        <p className="text-gray-900 font-medium">
                          {trackingResult.assunto}
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50/50 border border-gray-100 rounded-[2rem] p-8 shadow-sm">
                      <h4 className="text-sm font-black text-blue-900 tracking-widest mb-8 flex items-center gap-2">
                        <History size={20} /> Histórico do fluxo
                      </h4>
                      <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                        {trackingResult.historico?.map((h, i) => (
                          <div
                            key={i}
                            className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                          >
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-100 text-blue-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                              <CheckCircle2 size={20} />
                            </div>

                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl border border-gray-100 bg-slate-50/50 shadow-sm">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-bold text-gray-900">
                                  {h.setor}
                                </h5>
                                <time className="text-xs font-medium text-gray-500">
                                  {new Date(h.data).toLocaleString("pt-PT")}
                                </time>
                              </div>
                              <p className="text-sm font-bold text-blue-600 mb-2">
                                {h.acao}
                              </p>
                              {h.parecer && (
                                <p className="text-sm text-gray-600 italic bg-gray-50 p-3 rounded-xl">
                                  "{h.parecer}"
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                        {(!trackingResult.historico ||
                          trackingResult.historico.length === 0) && (
                          <p className="text-sm text-gray-400 italic text-center">
                            Nenhum histórico registado.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle
                      size={48}
                      className="text-orange-400 mx-auto mb-4"
                    />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Expediente não encontrado
                    </h3>
                    <p className="text-gray-600">
                      Verifique o número de referência e tente novamente.
                    </p>
                  </div>
                ))}
            </div>
          ) : selectedExpediente ? (
            <div className="bg-slate-50/50 rounded-[2.5rem] shadow-2xl border border-gray-100 p-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-black text-amber-500 tracking-tighter font-serif mb-4 inline-block bg-transparent">
                    Análise de expediente
                  </h2>
                  <p className="text-gray-400 font-mono text-sm tracking-widest block mt-2">
                    REF: {selectedExpediente.numero}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedExpediente(null);
                    setVistoAplicado(false);
                  }}
                  className="p-3 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ArrowLeft size={28} className="text-gray-400" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 space-y-6">
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">
                          Origem
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                          {selectedExpediente.origem}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">
                          Data de Envio
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                          {new Date(selectedExpediente.data).toLocaleDateString(
                            "pt-PT",
                          )}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">
                        Assunto
                      </p>
                      <div className="bg-white p-6 rounded-2xl border border-gray-100 text-gray-700 leading-relaxed font-serif italic">
                        {selectedExpediente.assunto}
                      </div>
                    </div>
                  </div>

                  {activeTab === "entrada" && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-blue-900 tracking-tighter">
                          Ações Disponíveis
                        </h3>
                        <button
                          onClick={handleAplicarVisto}
                          disabled={vistoAplicado}
                          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black tracking-tighter text-xs transition-all ${vistoAplicado ? "bg-green-100 text-green-700 border border-green-200" : "bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white"}`}
                        >
                          <UserCheck size={18} />
                          {vistoAplicado
                            ? "Visto Digital Aplicado"
                            : "Aplicar Visto Digital"}
                        </button>
                      </div>
                      <textarea
                        rows={4}
                        placeholder="Adicione um parecer ou observação (opcional)..."
                        className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium resize-none"
                        value={parecer}
                        onChange={(e) => setParecer(e.target.value)}
                      />
                      <div className="flex gap-4">
                        <button
                          onClick={handleDevolver}
                          className="flex-1 py-6 bg-red-50 text-red-600 rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:bg-red-600 hover:text-white transition-all tracking-tighter"
                        >
                          Devolver
                        </button>
                        <div className="flex-1 relative">
                          {showDestinos ? (
                            <div className="flex flex-col gap-3 bg-white p-6 rounded-2xl border border-blue-100 shadow-xl mb-4">
                              <div className="grid grid-cols-1 gap-3">
                                <div>
                                  <label className="block text-[10px] font-black text-gray-400 mb-1">
                                    Órgão
                                  </label>
                                  <select
                                    value={selectedDestinoUnidade}
                                    onChange={(e) => {
                                      setSelectedDestinoUnidade(e.target.value);
                                      setSelectedDestinoDirecao("");
                                      setSelectedDestinoDepartamento("");
                                    }}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                  >
                                    <option value="">Selecione...</option>
                                    {UNIDADES_ORGANICAS_SISTEMA.map((u) => (
                                      <option key={u.id} value={u.nome}>
                                        {u.nome}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-black text-gray-400 mb-1">
                                    Direção
                                  </label>
                                  <select
                                    value={selectedDestinoDirecao}
                                    onChange={(e) => {
                                      setSelectedDestinoDirecao(e.target.value);
                                      setSelectedDestinoDepartamento("");
                                    }}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                  >
                                    <option value="">Selecione...</option>
                                    {selectedDestinoUnidade &&
                                      UNIDADES_ORGANICAS_SISTEMA.find(
                                        (u) =>
                                          u.nome === selectedDestinoUnidade,
                                      )?.direcoes?.map((d) => (
                                        <option key={d} value={d}>
                                          {d}
                                        </option>
                                      ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-black text-gray-400 mb-1">
                                    Departamento
                                  </label>
                                  <select
                                    value={selectedDestinoDepartamento}
                                    onChange={(e) => {
                                      setSelectedDestinoDepartamento(
                                        e.target.value,
                                      );
                                      setSelectedDestinoReparticao("");
                                      setSelectedDestinoCurso("");
                                    }}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                  >
                                    <option value="">Selecione...</option>
                                    {selectedDestinoDirecao &&
                                      (
                                        DEPARTAMENTOS[selectedDestinoDirecao] ||
                                        DEPARTAMENTOS[selectedDestinoDirecao]
                                      )?.map((d) => (
                                        <option key={d} value={d}>
                                          {d}
                                        </option>
                                      ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-black text-gray-400 mb-1">
                                    Repartição / Curso
                                  </label>
                                  <select
                                    value={
                                      selectedDestinoCurso ||
                                      selectedDestinoReparticao
                                    }
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (
                                        selectedDestinoDepartamento &&
                                        CURSOS[
                                          selectedDestinoDepartamento
                                        ]?.includes(val)
                                      ) {
                                        setSelectedDestinoCurso(val);
                                        setSelectedDestinoReparticao("");
                                      } else {
                                        setSelectedDestinoReparticao(val);
                                        setSelectedDestinoCurso("");
                                      }
                                    }}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                  >
                                    <option value="">Selecione...</option>
                                    {selectedDestinoDepartamento &&
                                      CURSOS[selectedDestinoDepartamento]?.map(
                                        (c) => (
                                          <option key={c} value={c}>
                                            {c}
                                          </option>
                                        ),
                                      )}
                                    {selectedDestinoDepartamento &&
                                      REPARTICOES[
                                        selectedDestinoDepartamento
                                      ]?.map((r) => (
                                        <option key={r} value={r}>
                                          {r}
                                        </option>
                                      ))}
                                  </select>
                                </div>
                              </div>
                              <button
                                onClick={handleEnviar}
                                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 tracking-tighter mt-4"
                              >
                                Confirmar Envio
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={handleEnviar}
                              className="w-full h-full py-6 bg-blue-600 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 tracking-tighter"
                            >
                              <Forward size={28} />
                              Enviar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="bg-slate-50/50 border border-gray-100 rounded-[2rem] p-6 shadow-sm">
                    <h4 className="text-xs font-black text-blue-900 tracking-widest mb-6 flex items-center gap-2">
                      <History size={16} /> Histórico do fluxo
                    </h4>
                    <div className="space-y-6">
                      {selectedExpediente.historico?.map((h, i) => (
                        <div
                          key={i}
                          className="relative pl-6 border-l-2 border-blue-100 pb-2"
                        >
                          <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-white"></div>
                          <p className="text-[10px] font-black text-blue-600 tracking-widest">
                            {h.setor}
                          </p>
                          <p className="text-xs font-bold text-gray-900">
                            {h.acao}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {new Date(h.data).toLocaleString("pt-PT")}
                          </p>
                          {h.parecer && (
                            <p className="mt-2 text-xs text-gray-500 italic bg-gray-50 p-2 rounded-lg">
                              "{h.parecer}"
                            </p>
                          )}
                        </div>
                      ))}
                      {(!selectedExpediente.historico ||
                        selectedExpediente.historico.length === 0) && (
                        <p className="text-xs text-gray-400 italic">
                          Nenhum histórico registado.
                        </p>
                      )}
                    </div>
                  </div>

                  {selectedExpediente.vistoDigital && (
                    <div className="bg-green-50 border border-green-100 rounded-[2rem] p-6">
                      <h4 className="text-[10px] font-black text-green-700 tracking-widest mb-4 flex items-center gap-2">
                        <CheckCircle2 size={16} /> Visto Digital Ativo
                      </h4>
                      <div className="text-center py-4 border-2 border-dashed border-green-200 rounded-xl">
                        <p className="text-sm font-black text-green-800 tracking-tighter">
                          {selectedExpediente.vistoDigital.assinadoPor}
                        </p>
                        <p className="text-[9px] text-green-600 tracking-widest mt-1">
                          Assinado Digitalmente
                        </p>
                        <p className="text-[9px] text-green-500 mt-2">
                          {new Date(
                            selectedExpediente.vistoDigital.data,
                          ).toLocaleString("pt-PT")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50/50 rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="p-6 font-black text-blue-900 tracking-tighter text-sm">
                        Nº
                      </th>
                      <th className="p-6 font-black text-blue-900 tracking-tighter text-sm">
                        Data
                      </th>
                      <th className="p-6 font-black text-blue-900 tracking-tighter text-sm">
                        Assunto
                      </th>
                      <th className="p-6 font-black text-blue-900 tracking-tighter text-sm">
                        Origem
                      </th>
                      <th className="p-6 font-black text-blue-900 tracking-tighter text-sm">
                        Visto
                      </th>
                      <th className="p-6 font-black text-blue-900 tracking-tighter text-sm">
                        Ação
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeTab === "entrada" ? entradas : saidas).map(
                      (exp) => (
                        <tr
                          key={exp.id}
                          className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors group"
                        >
                          <td className="p-6 font-mono text-sm text-gray-600">
                            {exp.numero}
                          </td>
                          <td className="p-6 text-gray-900 font-medium">
                            {new Date(exp.data).toLocaleDateString("pt-PT")}
                          </td>
                          <td className="p-6 text-gray-900 max-w-xs truncate font-medium">
                            {exp.assunto.split("\n")[0]}
                          </td>
                          <td className="p-6 text-gray-600 font-medium">
                            {exp.origem}
                          </td>
                          <td className="p-6">
                            {exp.vistoDigital ? (
                              <span className="flex items-center gap-1 text-green-600 font-black text-[10px] tracking-widest">
                                <CheckCircle2 size={14} /> Sim
                              </span>
                            ) : (
                              <span className="text-gray-300 font-black text-[10px] tracking-widest">
                                Não
                              </span>
                            )}
                          </td>
                          <td className="p-6">
                            <button
                              onClick={() => setSelectedExpediente(exp)}
                              className="px-6 py-2 bg-blue-50 text-blue-600 rounded-xl font-black tracking-tighter hover:bg-blue-600 hover:text-white transition-all text-xs"
                            >
                              Analisar
                            </button>
                          </td>
                        </tr>
                      ),
                    )}
                    {(activeTab === "entrada" ? entradas : saidas).length ===
                      0 && (
                      <tr>
                        <td colSpan={6} className="p-20 text-center">
                          <p className="text-xl font-medium text-gray-400 font-serif italic">
                            Nenhum expediente na{" "}
                            {activeTab === "entrada"
                              ? "caixa de entrada"
                              : "caixa de saída"}
                            .
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

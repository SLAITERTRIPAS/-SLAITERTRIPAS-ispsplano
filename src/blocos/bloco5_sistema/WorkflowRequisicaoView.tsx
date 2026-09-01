import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { firestoreService } from "../../lib/firestoreService";
import {
  ClipboardList,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Building2,
  Settings,
  ShieldCheck,
  Plus,
  FileText,
  Search,
  MessageSquare,
  Maximize2,
} from "lucide-react";
import FormularioRequisicaoInterna from "../bloco6_documentos/FormularioRequisicaoInterna";
import InformacaoPropostaForm from "../bloco6_documentos/InformacaoPropostaForm";

import { SignerPicker } from "../../components/shared/SignerPicker";

interface RequisicaoWorkflow {
  id: string;
  numero: string;
  data: string;
  solicitante: string;
  departamento: string;
  status: "Pendente" | "Favorável" | "Desfavorável";
  etapaAtual: number; // 0 to 5
}

const stepsFavoravel = [
  { id: "necessitado", label: "Necessitado", icon: User, role: "Solicitante" },
  {
    id: "secretaria",
    label: "Secretaria",
    icon: Building2,
    role: "Secretaria",
  },
  { id: "economato", label: "Economato", icon: Settings, role: "Economato" },
  {
    id: "chefe",
    label: "Chefe do Departamento",
    icon: ShieldCheck,
    role: "Chefe de Departamento",
  },
  {
    id: "economato_ret",
    label: "Economato (Retorno)",
    icon: Settings,
    role: "Economato",
  },
  {
    id: "setor",
    label: "Setor (Termo de Entrega)",
    icon: CheckCircle2,
    role: "Solicitante",
  },
];

const stepsDesfavoravel = [
  { id: "necessitado", label: "Necessitado", icon: User, role: "Solicitante" },
  {
    id: "secretaria",
    label: "Secretaria",
    icon: Building2,
    role: "Secretaria",
  },
  { id: "economato", label: "Economato", icon: Settings, role: "Economato" },
  {
    id: "chefe",
    label: "Chefe do Departamento",
    icon: ShieldCheck,
    role: "Chefe de Departamento",
  },
  {
    id: "secretaria_ret",
    label: "Secretaria (Retorno)",
    icon: Building2,
    role: "Secretaria",
  },
  {
    id: "setor_com",
    label: "Setor (Comunicado)",
    icon: MessageSquare,
    role: "Solicitante",
  },
];

export default function WorkflowRequisicaoView({
  user,
  onNew,
  onBack,
}: {
  user: any;
  onNew: () => void;
  onBack?: () => void;
}) {
  const [requisicoes, setRequisicoes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [parecerText, setParecerText] = useState("");
  const [nextAction, setNextAction] = useState<
    "Favorável" | "Desfavorável" | null
  >(null);
  const [proximoDestino, setProximoDestino] = useState(
    "Chefia do Departamento",
  );
  const [showSignerPicker, setShowSignerPicker] = useState(false);
  const [selectedSigner, setSelectedSigner] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const unidadesDestino = [
    "Chefia do Departamento",
    "Gabinete do Diretor-Geral",
    "Secretaria Geral",
    "Economato e Património",
    "Contabilidade e Finanças",
    "Recursos Humanos",
    "Logística",
    "Concluído / Arquivado",
  ];

  useEffect(() => {
    if (!firestoreService || !firestoreService.requisicoes_internas) return;
    const unsub = firestoreService.requisicoes_internas.subscribe(
      (data: any[]) => {
        setRequisicoes(data);
        setIsLoading(false);
      },
    );
    return () => unsub();
  }, []);

  const [selectedReq, setSelectedReq] = useState<any | null>(null);

  const getSteps = (req: any) => {
    if (req.workflowSteps && Array.isArray(req.workflowSteps)) {
      return [
        { id: "solicitante", label: "Requerente", icon: User, role: "Solicitante" },
        ...req.workflowSteps.map((step: string, idx: number) => ({
          id: `step_${idx}`,
          label: step,
          icon: step.toLowerCase().includes("direção geral") || step.toLowerCase().includes("gdg") 
            ? ShieldCheck 
            : step.toLowerCase().includes("transporte") 
              ? Settings 
              : Building2,
          role: step
        }))
      ];
    }
    return req.status === "Desfavorável" ? stepsDesfavoravel : stepsFavoravel;
  };

  const getNextStepName = (req: any) => {
    const steps = getSteps(req);
    const nextIdx = req.etapaAtual + 1;
    if (nextIdx < steps.length) {
      return steps[nextIdx].label;
    }
    return "Concluído / Arquivado";
  };

  const handleParecer = async () => {
    if (!selectedReq) return;

    const nextStepName = getNextStepName(selectedReq);
    if (nextStepName === "Concluído / Arquivado") {
      await processNextStep(null);
    } else {
      setShowSignerPicker(true);
    }
  };

  const processNextStep = async (signer: any) => {
    if (!selectedReq) return;
    setIsSubmitting(true);

    try {
      const steps = getSteps(selectedReq);
      const nextStepIdx = selectedReq.etapaAtual + 1;
      const currentStepName = steps[selectedReq.etapaAtual]?.label || "Desconhecido";
      
      let updatedWorkflowSteps = [...(selectedReq.workflowSteps || [])];

      // Verificar pareceres desfavoráveis no fluxo (ex: DICOSAFA ou DAF)
      const isDicosafaOuDaf = currentStepName.toLowerCase().includes("dicosafa") || currentStepName.toLowerCase().includes("daf");
      const isDesfavoravel = (nextAction || "").toLowerCase().includes("desfavorável") || (parecerText || "").toLowerCase().includes("não autorizado") || (parecerText || "").toLowerCase().includes("não favorável");
      
      if (isDicosafaOuDaf && isDesfavoravel) {
        // Se reprovar, o processo não segue para o DG. Vai direto para a Secretaria Geral.
        updatedWorkflowSteps = [
          ...updatedWorkflowSteps.slice(0, selectedReq.etapaAtual), 
          "Secretaria Geral (Emissão)"
        ];
      }

      // Função auxiliar local para recalcular o próximo destino baseada no workflow atualizado
      const getDynamicNextStepName = () => {
        if (!updatedWorkflowSteps || updatedWorkflowSteps.length === 0) return getNextStepName(selectedReq);
        const dynamicSteps = [
          { label: "Requerente" },
          ...updatedWorkflowSteps.map(step => ({ label: step }))
        ];
        if (nextStepIdx < dynamicSteps.length) {
          return dynamicSteps[nextStepIdx].label;
        }
        return "Concluído / Arquivado";
      };

      let proximoDestinoAuto = getDynamicNextStepName();
      
      // Se chegamos ao Diretor Geral e ele aprova, adicionamos os passos de retorno se ainda não existirem
      if (proximoDestinoAuto.toLowerCase().includes("diretor geral") || proximoDestinoAuto.toLowerCase().includes("gdg")) {
        if (!updatedWorkflowSteps.includes("Secretaria Executiva (Retorno)")) {
          updatedWorkflowSteps.push("Secretaria Executiva (Retorno)");
          updatedWorkflowSteps.push("Secretaria Geral (Emissão)");
          proximoDestinoAuto = getDynamicNextStepName(); // Atualizar caso o passo atual seja antes do DG
        }
      }

      const isFinal = proximoDestinoAuto === "Concluído / Arquivado";

      let newStatus = selectedReq.status;
      let newEtapa = nextStepIdx;

      await firestoreService.requisicoes_internas.update(selectedReq.id, {
        status: isFinal ? "Concluído" : newStatus,
        etapaAtual: newEtapa,
        destinoAtual: isFinal ? "Arquivo" : proximoDestinoAuto,
        nextStepRecipientId: signer?.id || null,
        nextStepRecipientName: signer?.nome || null,
        workflowSteps: updatedWorkflowSteps,
        historicoPareceres: [
          ...(selectedReq.historicoPareceres || []),
          {
            etapa: selectedReq.etapaAtual,
            unidade: user?.departamento || user?.cargo || "Unidade",
            responsavel: user?.name,
            parecer: parecerText,
            decisao: isFinal
              ? "Concluído"
              : nextAction || `Encaminhado para ${proximoDestinoAuto} (${signer?.nome || "Responsável"})`,
            data: new Date().toISOString(),
          },
        ],
      });

      // Notificar o assinante/requerente original sobre o parecer em tempo real
      if (selectedReq.userId && parecerText) {
        await firestoreService.messages.add({
          subject: `Novo Parecer: ${selectedReq.numero}`,
          text: `O seu pedido ${selectedReq.numero} recebeu um parecer na etapa '${currentStepName}'.\nParecer: ${parecerText}`,
          senderId: user?.id || "system",
          senderName: user?.name || "Sistema",
          recipientId: selectedReq.userId,
          recipientName: selectedReq.solicitante || "Requerente",
          timestamp: new Date().toISOString(),
          read: false,
        });
      }

      // Notificar o próximo assinante
      if (signer?.id) {
        await firestoreService.messages.add({
          text: `Você recebeu o documento ${selectedReq.numero} para despacho. Proveniência: ${user?.departamento || user?.name}.`,
          subject: `Documento para Despacho: ${selectedReq.numero}`,
          senderId: user?.id,
          senderName: user?.name,
          recipientId: signer.id,
          recipientName: signer.nome,
          timestamp: new Date().toISOString(),
          read: false,
        });
      }

      // Se o Diretor-Geral der um despacho positivo
      const isDiretorGeral = currentStepName.toLowerCase().includes("diretor geral") || currentStepName.toLowerCase().includes("gdg");
      const isDespachoPositivo = (nextAction || "").toLowerCase().includes("favorável") || (nextAction || "").toLowerCase().includes("aprovado") || (parecerText || "").toLowerCase().includes("autorizo");
      
      if (isDiretorGeral && isDespachoPositivo) {
        // Notificar RH e Secretaria Geral sobre o despacho positivo do DG
        const allColabs = await firestoreService.colaboradores.get();
        const rhHead = allColabs.find(c => c.departamento?.toLowerCase().includes("recursos humanos") && c.cargo?.toLowerCase().includes("chefe"));
        const sgHead = allColabs.find(c => (c.departamento?.toLowerCase().includes("secretaria geral") || c.direcao?.toLowerCase().includes("secretaria geral")) && c.cargo?.toLowerCase().includes("chefe"));

        if (rhHead) {
          await firestoreService.messages.add({
            text: `O Diretor-Geral deu despacho positivo ao documento ${selectedReq.numero}. Proceda com a produção da guia de marcha/apresentação.`,
            subject: `Despacho Positivo - Guia Necessária: ${selectedReq.numero}`,
            senderId: user?.id || "system",
            senderName: user?.name || "Diretor-Geral",
            recipientId: rhHead.id,
            recipientName: rhHead.nome,
            timestamp: new Date().toISOString(),
            read: false,
          });
        }
        
        if (sgHead) {
          await firestoreService.messages.add({
            text: `O Diretor-Geral deu despacho positivo ao documento ${selectedReq.numero}. Proceda com a emissão do comunicado do despacho e envie para o remetente.`,
            subject: `Despacho Positivo - Emissão de Comunicado: ${selectedReq.numero}`,
            senderId: user?.id || "system",
            senderName: user?.name || "Diretor-Geral",
            recipientId: sgHead.id,
            recipientName: sgHead.nome,
            timestamp: new Date().toISOString(),
            read: false,
          });
        }
      }

      // Se for o passo final (Secretaria Geral emitindo), notificar RH (mantemos a lógica anterior caso seja necessária)
      if (proximoDestinoAuto.toLowerCase().includes("secretaria geral (emissão)")) {
        // Notificar RH para emissão de guia
        const allColabs = await firestoreService.colaboradores.get();
        const rhHead = allColabs.find(c => c.departamento?.toLowerCase().includes("recursos humanos") && c.cargo?.toLowerCase().includes("chefe"));
        
        if (rhHead) {
          await firestoreService.messages.add({
            text: `O documento ${selectedReq.numero} foi aprovado. Por favor, proceda com a emissão da guia de marcha.`,
            subject: `Emissão de Guia: ${selectedReq.numero}`,
            senderId: user?.id,
            senderName: user?.name,
            recipientId: rhHead.id,
            recipientName: rhHead.nome,
            timestamp: new Date().toISOString(),
            read: false,
          });
        }
      }

      setParecerText("");
      setNextAction(null);
      setShowSignerPicker(false);
      setSelectedSigner(null);
      
      alert(
        isFinal
          ? "Processo concluído e arquivado!"
          : `Parecer submetido! O documento foi encaminhado para: ${proximoDestinoAuto}`,
      );
    } catch (error) {
      console.error("Erro ao submeter parecer:", error);
      alert("Erro ao submeter parecer. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canUserAct =
    selectedReq &&
    ((selectedReq.etapaAtual === 0 && (selectedReq.solicitante === user?.name || selectedReq.userId === user?.id)) ||
      (() => {
        const steps = getSteps(selectedReq);
        const currentStep = steps[selectedReq.etapaAtual];
        if (!currentStep) return false;
        
        const userCargo = (user?.cargo || "").toLowerCase();
        const userDept = (user?.departamento || "").toLowerCase();
        const stepRole = (currentStep.role || "").toLowerCase();
        
        // Match by keywords for robustness
        const isSecretaria = stepRole.includes("secretaria") && userDept.includes("secretaria");
        const isDpep = stepRole.includes("dpep") && userDept.includes("dpep");
        const isDaf = stepRole.includes("daf") && userDept.includes("daf");
        const isTransporte = stepRole.includes("transporte") && userDept.includes("transporte");
        const isDicosafa = stepRole.includes("dicosafa") && userDept.includes("dicosafa");
        const isDG = (stepRole.includes("direção geral") || stepRole.includes("gdg") || stepRole.includes("diretor geral")) && 
                     (userCargo.includes("diretor geral") || userCargo.includes("diretor-geral"));
        
        // General matching
        const generalMatch = stepRole !== "solicitante" && (userCargo.includes(stepRole) || userDept.includes(stepRole));

        return isSecretaria || isDpep || isDaf || isTransporte || isDicosafa || isDG || generalMatch;
      })());

  const [showFullDoc, setShowFullDoc] = useState(false);

  if (showFullDoc && selectedReq) {
    if (
      (selectedReq as any).tipo === "Informação Proposta" ||
      (selectedReq as any).formData?.assunto
    ) {
      return (
        <InformacaoPropostaForm
          user={user}
          initialData={selectedReq}
          onCancel={() => setShowFullDoc(false)}
        />
      );
    }
    return (
      <FormularioRequisicaoInterna
        user={user}
        initialData={selectedReq}
        onCancel={() => setShowFullDoc(false)}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header com Ação */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-500 hover:text-slate-900 group"
            >
              <ArrowLeft
                size={24}
                className="group-hover:-translate-x-1 transition-transform"
              />
            </button>
          )}
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tighter">
              Workflow de Requisição Interna
            </h3>
            <p className="text-xs text-slate-500 font-medium italic">
              Rastreamento do caminho administrativo das requisições de bens
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="relative group">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Pesquisar RI..."
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none w-48 transition-all"
            />
          </div>
          <button
            onClick={onNew}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
          >
            <Plus size={18} /> Nova Requisição
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Lista de Requisições */}
        <div className="lg:col-span-5 space-y-4">
          <h4 className="text-[10px] font-black text-slate-400 tracking-widest px-2">
            Requisições Ativas
          </h4>
          {requisicoes.map((req) => (
            <motion.div
              key={req.id}
              whileHover={{ x: 5 }}
              onClick={() => setSelectedReq(req)}
              className={`p-5 rounded-3xl border cursor-pointer transition-all ${
                selectedReq?.id === req.id
                  ? "bg-slate-900 text-white border-slate-900 shadow-xl"
                  : "bg-white border-slate-200 text-slate-900 hover:border-slate-400"
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="font-mono text-xs font-black opacity-60 tracking-wider">
                  {req.numero}
                </div>
                <div
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    req.status === "Favorável"
                      ? "bg-emerald-500 text-white"
                      : req.status === "Desfavorável"
                        ? "bg-red-500 text-white"
                        : "bg-amber-500 text-white"
                  }`}
                >
                  {req.status}
                </div>
              </div>
              <h5 className="font-bold text-sm">{req.solicitante}</h5>
              <div className="text-[10px] font-bold mt-1 opacity-70">
                Local: {req.destinoAtual || "Secretaria"}
              </div>
              <div className="flex items-center justify-between mt-4">
                <span
                  className={`text-[10px] font-bold ${selectedReq?.id === req.id ? "text-slate-400" : "text-slate-500"}`}
                >
                  {req.departamento}
                </span>
                <div className="flex items-center gap-1.5 text-[10px] font-bold">
                  <Clock size={12} /> {req.data}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Visualização do Workflow */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {selectedReq ? (
              <motion.div
                key={selectedReq.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-full"
              >
                <div className="flex items-center gap-4 mb-10 border-b border-slate-100 pb-6">
                  <div className="bg-slate-900 text-white p-3 rounded-2xl">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 tracking-tighter">
                      Caminho da Requisição
                    </h3>
                    <p className="text-xs text-slate-500 font-bold">
                      {selectedReq.numero}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowFullDoc(true)}
                    className="ml-auto bg-slate-50 hover:bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest border border-slate-200 flex items-center gap-2 transition-all"
                  >
                    <Maximize2 size={14} /> Visualizar Documento Original
                  </button>
                </div>

                <div className="space-y-12 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                  {getSteps(selectedReq).map((step, idx) => {
                    const isCompleted = idx < selectedReq.etapaAtual;
                    const isCurrent = idx === selectedReq.etapaAtual;

                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-6 relative group"
                      >
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center z-10 transition-all duration-500 ${
                            isCompleted
                              ? "bg-emerald-500 shadow-lg shadow-emerald-500/20 text-white"
                              : isCurrent
                                ? "bg-blue-600 shadow-lg shadow-blue-600/20 text-white scale-110"
                                : "bg-slate-50 text-slate-300 border-2 border-slate-100"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 size={24} />
                          ) : (
                            <step.icon size={24} />
                          )}
                        </div>

                        <div className="flex-1">
                          <div
                            className={`text-[10px] font-black tracking-widest mb-1 ${
                              isCurrent
                                ? "text-blue-600"
                                : isCompleted
                                  ? "text-emerald-500"
                                  : "text-slate-400"
                            }`}
                          >
                            Etapa {idx + 1}
                          </div>
                          <div
                            className={`text-base font-black tracking-tighter ${
                              isCurrent ? "text-slate-900" : "text-slate-400"
                            }`}
                          >
                            {step.label}
                          </div>
                          {isCurrent && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="mt-2 space-y-4"
                            >
                              <div className="text-xs text-slate-500 font-medium italic bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                                Aguardando tratamento administrativo nesta
                                unidade.
                              </div>

                              {canUserAct && (
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                                  <textarea
                                    placeholder="Colocar seu parecer aqui..."
                                    value={parecerText}
                                    onChange={(e) =>
                                      setParecerText(e.target.value)
                                    }
                                    className="w-full p-3 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
                                  />

                                  <div className="flex gap-2">
                                    <button
                                      onClick={() =>
                                        setNextAction("Favorável")
                                      }
                                      className={`flex-1 py-2 rounded-lg text-[10px] font-black tracking-widest border-2 transition-all ${
                                        nextAction === "Favorável"
                                          ? "bg-emerald-500 border-emerald-500 text-white"
                                          : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                      }`}
                                    >
                                      Favorável
                                    </button>
                                    <button
                                      onClick={() =>
                                        setNextAction("Desfavorável")
                                      }
                                      className={`flex-1 py-2 rounded-lg text-[10px] font-black tracking-widest border-2 transition-all ${
                                        nextAction === "Desfavorável"
                                          ? "bg-red-500 border-red-500 text-white"
                                          : "border-red-200 text-red-600 hover:bg-red-50"
                                      }`}
                                    >
                                      Desfavorável
                                    </button>
                                  </div>

                                  <div className="space-y-4">
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                      <label className="block text-[10px] font-black text-slate-400 tracking-widest mb-2">
                                        Próximo Destino
                                      </label>
                                      <select
                                        value={proximoDestino}
                                        onChange={(e) =>
                                          setProximoDestino(e.target.value)
                                        }
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                      >
                                        {unidadesDestino.map((u) => (
                                          <option key={u} value={u}>
                                            {u}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    <button
                                      onClick={handleParecer}
                                      className="w-full bg-blue-600 text-white py-3 rounded-xl text-[10px] font-black tracking-widest hover:bg-blue-700 transition-all flex flex-col items-center justify-center gap-1 shadow-lg shadow-blue-200"
                                    >
                                      <div className="flex items-center gap-2">
                                        <CheckCircle2 size={16} /> Submeter e
                                        Reencaminhar
                                      </div>
                                      <span className="text-[8px] opacity-70 tracking-normal normal-case">
                                        Destino Selecionado: {proximoDestino}
                                      </span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </div>

                        {idx < getSteps(selectedReq).length - 1 && (
                          <div
                            className={`absolute left-5.5 top-12 w-0.5 h-12 transition-all duration-1000 ${
                              isCompleted ? "bg-emerald-500" : "bg-slate-100"
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {selectedReq.etapaAtual === 5 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`mt-12 p-6 rounded-3xl flex items-center gap-6 border-2 border-dashed ${
                      selectedReq.status === "Favorável"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-red-50 border-red-200 text-red-800"
                    }`}
                  >
                    <div
                      className={
                        selectedReq.status === "Favorável"
                          ? "text-emerald-500"
                          : "text-red-500"
                      }
                    >
                      {selectedReq.status === "Favorável" ? (
                        <CheckCircle2 size={40} />
                      ) : (
                        <XCircle size={40} />
                      )}
                    </div>
                    <div>
                      <h4 className="font-black text-sm">
                        {selectedReq.status === "Favorável"
                          ? "Documento Final: Termo de Entrega"
                          : "Documento Final: Comunicado do Parecer"}
                      </h4>
                      <p className="text-xs font-medium opacity-80 mt-1">
                        O processo foi concluído e o documento normativo foi
                        enviado ao setor solicitante.
                      </p>
                      <button className="mt-4 bg-white/50 hover:bg-white text-xs font-bold px-4 py-2 rounded-xl transition-all border border-current flex items-center gap-2">
                        <FileText size={14} /> Descarregar{" "}
                        {selectedReq.status === "Favorável"
                          ? "Termo de Entrega"
                          : "Comunicado"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <div className="h-full bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-12 text-center">
                <div className="bg-white p-6 rounded-full shadow-lg text-slate-200 mb-6">
                  <ClipboardList size={64} />
                </div>
                <h3 className="text-lg font-black text-slate-400 tracking-tight">
                  {" "}
                  workflow da Requisição
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mt-2 font-medium">
                  Selecione uma requisição ao lado para visualizar o seu caminho
                  administrativo e etapa atual.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <SignerPicker
        isOpen={showSignerPicker}
        onClose={() => setShowSignerPicker(false)}
        onConfirm={processNextStep}
        nextStep={selectedReq ? getNextStepName(selectedReq) : ""}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

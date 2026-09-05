import { printElementById } from "../../lib/printUtils";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Save,
  X,
  FileText,
  Plus,
  Trash2,
  Printer,
  Info,
  User,
  ClipboardList,
  MapPin,
  Hash,
  ShieldCheck,
  Building2,
  Layers,
  ClipboardCheck,
  Calculator,
  Calendar,
  UserCheck,
  TrendingDown,
  Database,
  CheckCircle2,
  AlertTriangle,
  Package,
  ShieldAlert,
} from "lucide-react";
import { firestoreService } from "../../lib/firestoreService";
import { formatTrackingCode } from "../../lib/trackingUtils";
import { PRODUTOS_POR_NECESSIDADE, SUB_REFERENCIAS_PRODUTOS } from "../../constants/formOptions";
import SignatureUpload from "../bloco5_sistema/SignatureUpload";
import { FormLayout } from "../../components/shared/FormLayout";
import ConsultarEstoqueModal from "../../components/ConsultarEstoqueModal";

export default function FormularioRequisicaoInterna({
  user,
  onCancel,
  initialData,
  onSubmit,
}: {
  user: any;
  onCancel: () => void;
  initialData?: any;
  onSubmit?: (data: any) => void;
}) {
  const [showEstoqueModal, setShowEstoqueModal] = useState(false);
  const [existingBens, setExistingBens] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedNecessidade, setSelectedNecessidade] = useState<string>(
    initialData?.necessidade || ""
  );

  // Custom states for submission & processing animations
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStepLabel, setProcessingStepLabel] =
    useState("Iniciando...");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [proximoDestinatario, setProximoDestinatario] =
    useState("Secretaria Geral");
  const [selectedTituloComum, setSelectedTituloComum] = useState("");
  const subRefsDisponiveis = selectedTituloComum ? SUB_REFERENCIAS_PRODUTOS[selectedTituloComum] || [] : [];

  // Load Date variables in index format
  const today = new Date().toISOString().split("T")[0];
  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const currentMonthName = months[new Date().getMonth()];

  const [formData, setFormData] = useState({
    numeroRequisicao:
      initialData?.numeroRequisicao || initialData?.numero || "Gerando nº...",
    unidadeOrganica:
      initialData?.unidadeOrganica ||
      user?.direcao ||
      "Gabinete do Diretor-Geral",
    departamentoRequisitante:
      initialData?.departamentoRequisitante ||
      initialData?.departamento ||
      user?.departamento ||
      "",
    codigoActividade: initialData?.codigoActividade || "",
    classeMaterial: initialData?.classeMaterial || "Material de Consumo",
    descricaoMaterial:
      initialData?.descricaoMaterial ||
      (initialData?.itens && initialData?.itens[0]?.descricao) ||
      "",
    quantidade:
      initialData?.quantidade ||
      (initialData?.itens && initialData?.itens[0]?.qtd) ||
      1,
    mes: initialData?.mes || currentMonthName,
    data: initialData?.data || today,
    recebeu:
      initialData?.recebeu ||
      initialData?.solicitante ||
      user?.name ||
      "Administrador do Sistema",
    saldoDisponivel: initialData?.saldoDisponivel || 0,

    // Additional workflow states for compatibility
    prioridade: initialData?.prioridade || "Normal",
    justificativa: initialData?.justificativa || "consumo",
    detalhesJustificativa: initialData?.detalhesJustificativa || "",
    localEntrega: initialData?.localEntrega || "",
    assinaturaSolicitante: initialData?.assinaturaSolicitante || "",
    assinaturaChefia: initialData?.assinaturaChefia || "",
    assinaturaEconomato: initialData?.assinaturaEconomato || "",
  });

  // Fetch real-time available stock data to track current "Saldo Disponivel"
  useEffect(() => {
    const unsub = firestoreService.materiais_bens.subscribe((data: any[]) => {
      setExistingBens(data || []);
    });
    return () => unsub();
  }, []);

  // Compute if the entered product is planified in the sector or catalog
  const isPlanificado = React.useMemo(() => {
    const desc = formData.descricaoMaterial.trim().toLowerCase();
    if (!desc) return true; // Default true when empty to avoid early alarm

    // 1. Check existingBens (Firestore inventory & plan)
    const inBens = existingBens.some(
      (b) =>
        b.nome?.trim().toLowerCase() === desc ||
        b.descricao?.trim().toLowerCase() === desc ||
        b.nome?.trim().toLowerCase().includes(desc) ||
        desc.includes(b.nome?.trim().toLowerCase())
    );
    if (inBens) return true;

    // 2. Check PRODUTOS_POR_NECESSIDADE
    for (const key of Object.keys(PRODUTOS_POR_NECESSIDADE)) {
      const prods = (PRODUTOS_POR_NECESSIDADE as Record<string, any[]>)[key] || [];
      if (
        prods.some((p: any) => {
          const pName = (typeof p === "string" ? p : p?.nome || p?.descricao || "").trim().toLowerCase();
          return pName && (pName === desc || desc.includes(pName) || pName.includes(desc));
        })
      ) {
        return true;
      }
    }

    // 3. Check SUB_REFERENCIAS_PRODUTOS
    for (const cat of Object.keys(SUB_REFERENCIAS_PRODUTOS)) {
      const refs = SUB_REFERENCIAS_PRODUTOS[cat] || [];
      if (
        refs.some(
          (r: string) =>
            r.trim().toLowerCase() === desc ||
            desc.includes(r.trim().toLowerCase()) ||
            r.trim().toLowerCase().includes(desc)
        )
      ) {
        return true;
      }
    }

    return false;
  }, [formData.descricaoMaterial, existingBens]);

  // Set the "Saldo Disponível" dynamically in real-time matching Sector + Description
  useEffect(() => {
    if (initialData) return; // do not update if we are viewing an archived record
    const descLower = formData.descricaoMaterial.trim().toLowerCase();
    const sectorLower = (formData.departamentoRequisitante || formData.unidadeOrganica || "").trim().toLowerCase();

    if (!descLower) {
      setFormData((prev) => ({ ...prev, saldoDisponivel: 0 }));
      return;
    }

    // First try exact sector + product match
    let matchedItem = existingBens.find(
      (b) =>
        b.nome?.trim().toLowerCase() === descLower &&
        ((b.setor || b.unidadeOrganica || b.departamento || "").trim().toLowerCase().includes(sectorLower) ||
         sectorLower.includes((b.setor || b.unidadeOrganica || b.departamento || "").trim().toLowerCase()))
    );

    // If not found by sector, fallback to general product match
    if (!matchedItem) {
      matchedItem = existingBens.find(
        (b) => b.nome?.trim().toLowerCase() === descLower
      );
    }

    if (matchedItem) {
      setFormData((prev) => ({
        ...prev,
        saldoDisponivel: Number(matchedItem.quantidadeDisponivel || 0),
      }));
    } else {
      setFormData((prev) => ({ ...prev, saldoDisponivel: 0 }));
    }
  }, [formData.descricaoMaterial, formData.departamentoRequisitante, formData.unidadeOrganica, existingBens, initialData]);

  // Generate Requisition code
  useEffect(() => {
    if (!initialData) {
      const getUniqueCode = async () => {
        const unitKey = `REQ-${user?.direcao || "GDG"}-${user?.departamento || "ALMOX"}`;
        const nextNum = await firestoreService.counters.getNextNumber(unitKey);
        const trackingCode = formatTrackingCode(
          user?.direcao || "GDG",
          user?.departamento || "ALMOX",
          "REQ",
          nextNum,
        );
        setFormData((prev) => ({ ...prev, numeroRequisicao: trackingCode }));
      };
      getUniqueCode();
    }
  }, [user, initialData]);

  const updateField = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectExisting = (name: string, qty: number) => {
    setFormData((prev) => ({
      ...prev,
      descricaoMaterial: name,
      saldoDisponivel: Number(qty),
    }));
    setShowDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.descricaoMaterial.trim()) {
      alert("Por favor, preencha a descrição do material.");
      return;
    }
    if (!formData.unidadeOrganica.trim()) {
      alert("Por favor, indique o Órgão.");
      return;
    }
    if (!formData.departamentoRequisitante.trim()) {
      alert("Por favor, indique o Departamento Requisitante.");
      return;
    }

    const requestedQty = Number(formData.quantidade) || 0;
    const availableQty = Number(formData.saldoDisponivel) || 0;

    if (requestedQty <= 0) {
      alert("A quantidade requisitada deve ser maior que zero (pelo menos 1 UN).");
      return;
    }

    // CONTROLO DE ESTOQUE POR DIREÇÃO E DEPARTAMENTO:
    // 1. Produto não planificado
    if (!isPlanificado) {
      alert(
        `⛔ REQUISIÇÃO BLOQUEADA!\n\nproduto nao planificado\n\nO produto "${formData.descricaoMaterial}" não foi encontrado no plano de necessidades do seu departamento (${formData.departamentoRequisitante || formData.unidadeOrganica}).\n\nPor favor, consulte o plano de necessidades antes de efetuar a requisição.`
      );
      return;
    }

    // 2. Produto planificado, mas sem saldo em estoque
    if (availableQty <= 0) {
      alert(
        `⛔ REQUISIÇÃO BLOQUEADA!\n\nproduto esgotado no estoque do seu departamento\n\nO produto "${formData.descricaoMaterial}" consta no plano, mas possui 0 UN disponíveis em estoque no departamento ${formData.departamentoRequisitante || formData.unidadeOrganica}.\n\nNenhum setor pode requisitar o que não tem em estoque.`
      );
      return;
    }

    // 3. Quantidade solicitada é superior ao saldo disponível
    if (requestedQty > availableQty) {
      alert(
        `⛔ REQUISIÇÃO BLOQUEADA!\n\nQuantidade requisitada (${requestedQty} UN) excede o saldo disponível (${availableQty} UN) para o produto "${formData.descricaoMaterial}".\n\nAjuste a quantidade solicitada ou consulte o estoque.`
      );
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmAndSubmit = async () => {
    setIsProcessing(true);
    setShowConfirmModal(false);
    setProcessingProgress(0);
    setProcessingStepLabel("Iniciando integração de saída de material...");

    const requestedQty = Number(formData.quantidade) || 0;
    const currentSaldo = Number(formData.saldoDisponivel) || 0;
    const finalRealTimeSaldo = Math.max(0, currentSaldo - requestedQty);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 14) + 8;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setProcessingProgress(100);
        setProcessingStepLabel("Transações concluídas com sucesso!");

        setTimeout(async () => {
          try {
            // Write database changes
            const matchedItem = existingBens.find(
              (b) =>
                b.nome?.trim().toLowerCase() ===
                formData.descricaoMaterial.trim().toLowerCase(),
            );

            // 1. Subtract in Real-Time from materials/stock database
            if (matchedItem) {
              await firestoreService.materiais_bens.update(matchedItem.id, {
                quantidadeDisponivel: finalRealTimeSaldo,
                updatedBy: user?.email || "Sistema",
                necessidade: selectedNecessidade || matchedItem.necessidade || "",
              });
            } else {
              // Create it as negative / new output if non-existent but allowed
              await firestoreService.materiais_bens.add({
                nome: formData.descricaoMaterial,
                quantidadeDisponivel: 0,
                localizacaoAtual: "Almoxarifado Consumo",
                grupo: "Consumíveis",
                estado: "Uso Clínico / Geral",
                setor: "Economato",
                updatedBy: user?.email,
                necessidade: selectedNecessidade || "",
              });
            }

            // 2. Register stock movement
            await firestoreService.movimentos_economato.add({
              descricao: formData.descricaoMaterial,
              descricaoMaterial: formData.descricaoMaterial,
              quantidade: requestedQty,
              quantidadeRequisitada: requestedQty,
              departamento: formData.departamentoRequisitante,
              departamentoRequisitante: formData.departamentoRequisitante,
              unidadeOrganica: formData.unidadeOrganica,
              classeMaterial: formData.classeMaterial,
              mes: formData.mes,
              data: formData.data,
              tipo: "SAIDA_CONSUMO",
              origem: "Almoxarifado",
              operador: formData.recebeu,
              recebeu: formData.recebeu,
              saldoAnterior: currentSaldo,
              saldoDisponivel: finalRealTimeSaldo,
              necessidade: selectedNecessidade,
              timestamp: new Date().toISOString(),
            });

            // 3. Add to workflow notifications / requisicoes_internas
            const workflowPayload = {
              ...formData,
              necessidade: selectedNecessidade,
              status: "Pendente",
              etapaAtual: 1,
              destinoAtual: proximoDestinatario,
              solicitante: formData.recebeu,
              solicitanteId: user?.id, // Add this
              departamento: formData.departamentoRequisitante,
              timestamp: new Date().toISOString(),
              numero: formData.numeroRequisicao,
              itens: [
                {
                  id: Math.random().toString(36).substring(2, 9),
                  codigo: "#SAI",
                  descricao: formData.descricaoMaterial,
                  qtd: requestedQty,
                  unid: "UN",
                },
              ],
              historicoPareceres: [
                {
                  etapa: 0,
                  unidade: formData.departamentoRequisitante,
                  responsavel: formData.recebeu,
                  parecer:
                    "Requisição de Saída registrada e integrada no estoque em tempo real.",
                  decisao: `Encaminhado para ${proximoDestinatario}`,
                  data: new Date().toISOString(),
                },
              ],
            };

            await firestoreService.requisicoes_internas.add(workflowPayload);

            if (onSubmit) {
              onSubmit(workflowPayload);
            }

            setIsProcessing(false);
            setIsSubmitted(true);
          } catch (error) {
            console.error("Erro ao efetuar saída estoque:", error);
            alert("Falha ao processar a saída. Tente novamente.");
            setIsProcessing(false);
          }
        }, 600);
      } else {
        setProcessingProgress(progress);
        if (progress < 40) {
          setProcessingStepLabel(
            "Conectando base de dados do inventário central...",
          );
        } else if (progress < 70) {
          setProcessingStepLabel(
            `Mapeando histórico e retirando ${requestedQty} UN do estoque real...`,
          );
        } else {
          setProcessingStepLabel(
            `Atualizando saldo disponível de ${currentSaldo} UN para ${finalRealTimeSaldo} UN...`,
          );
        }
      }
    }, 100);
  };

  const finalRealTimeSaldo = Math.max(
    0,
    Number(formData.saldoDisponivel || 0) - Number(formData.quantidade || 0),
  );

  // Get all suggestions for the selected necessity
  const getSuggestions = () => {
    let list: any[] = [];
    
    // 1. Add matching items from existing stock
    existingBens.forEach((b) => {
      let isMatch = true;
      if (selectedNecessidade) {
        const allowedProducts = PRODUTOS_POR_NECESSIDADE[selectedNecessidade] || [];
        const itemNomeLower = b.nome?.trim().toLowerCase();
        const belongsToNecessidade = allowedProducts.some(
          (p) => p.nome.trim().toLowerCase() === itemNomeLower ||
                 itemNomeLower.includes(p.nome.trim().toLowerCase())
        ) || b.necessidade === selectedNecessidade;
        isMatch = belongsToNecessidade;
      }
      if (isMatch) {
        // Avoid duplicate names in list
        if (!list.some((item) => item.nome.toLowerCase() === b.nome.toLowerCase())) {
          list.push({
            nome: b.nome,
            quantidadeDisponivel: Number(b.quantidadeDisponivel || 0),
            isFromDb: true,
          });
        }
      }
    });

    // 2. Add default products from PRODUTOS_POR_NECESSIDADE if not already present in the list
    if (selectedNecessidade) {
      const defaultProducts = PRODUTOS_POR_NECESSIDADE[selectedNecessidade] || [];
      defaultProducts.forEach((dp) => {
        const alreadyInList = list.some(
          (item) => item.nome.toLowerCase() === dp.nome.toLowerCase()
        );
        if (!alreadyInList) {
          list.push({
            nome: dp.nome,
            quantidadeDisponivel: 0, // Not in stock yet
            isFromDb: false,
          });
        }
      });
    }

    // 3. Filter by search string if typed
    if (formData.descricaoMaterial.trim() !== "") {
      const searchLower = formData.descricaoMaterial.toLowerCase();
      list = list.filter((item) => item.nome.toLowerCase().includes(searchLower));
    }

    return list;
  };

  const filteredBens = getSuggestions();
  const shouldShowDropdown = showDropdown && (selectedNecessidade !== "" || formData.descricaoMaterial.trim() !== "");

  // If initialData is true, we render in readonly mode
  if (initialData && !initialData.isDraft) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden border border-slate-200"
      >
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-3 rounded-xl border border-white/10">
              <ClipboardList className="text-amber-400" size={24} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight leading-none">
                Visualizar Requisição de Saída
              </h1>
              <p className="text-slate-400 text-[10px] font-bold tracking-widest mt-1">
                Nº {formData.numeroRequisicao}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div>
              <div className="text-[10px] font-bold text-slate-400 ">
                Órgão
              </div>
              <div className="text-xs font-black text-slate-700 mt-1">
                {formData.unidadeOrganica}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 ">
                Dpto Requisitante
              </div>
              <div className="text-xs font-black text-slate-700 mt-1">
                {formData.departamentoRequisitante}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 ">
                Classe do Material
              </div>
              <div className="text-xs font-black text-slate-700 mt-1">
                {formData.classeMaterial}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 ">
                Data
              </div>
              <div className="text-xs font-black text-slate-700 mt-1">
                {formData.data} ({formData.mes})
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-[10px] font-black text-slate-400  tracking-wider">
              Item Requisitado
            </h4>
            <div className="flex justify-between items-center text-sm font-bold text-slate-800 py-2 border-b">
              <span>{formData.descricaoMaterial}</span>
              <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded-full font-mono font-black">
                {formData.quantidade} UN
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-50/50 p-3 rounded-xl text-center">
                <span className="text-[9px] text-slate-400 font-bold  block">
                  Saldo Anterior
                </span>
                <span className="text-sm font-black text-slate-700 font-mono">
                  {formData.saldoDisponivel} UN
                </span>
              </div>
              <div className="bg-[#121c60]/5 p-3 rounded-xl text-center border border-[#121c60]/10">
                <span className="text-[9px] text-blue-800 font-semibold  block">
                  Saldo após Saída
                </span>
                <span className="text-sm font-black text-blue-900 font-mono">
                  {Math.max(0, formData.saldoDisponivel - formData.quantidade)}{" "}
                  UN
                </span>
              </div>
            </div>
          </div>

          {/* Signatures view block */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t font-mono text-center">
            <div className="p-4 bg-slate-50/30 rounded-xl border border-dashed">
              <div className="text-[9px] text-slate-400 font-bold">
                REQUISITANTE / RECEBEDOR
              </div>
              <div className="text-[11px] font-black text-slate-800 mt-2">
                {formData.recebeu}
              </div>
              {formData.assinaturaSolicitante ? (
                <img
                  src={formData.assinaturaSolicitante}
                  className="h-10 mx-auto mt-2 object-contain"
                  alt="Assinatura"
                />
              ) : (
                <div className="text-[10px] text-slate-300 italic mt-2">
                  Assinatura Digital Ausente
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-50/30 rounded-xl border border-dashed">
              <div className="text-[9px] text-slate-400 font-bold">
                CHEFIA / AUTORIZAÇÃO
              </div>
              <div className="text-[11px] font-black text-slate-800 mt-1">
                Despacho de Saída
              </div>
              {formData.assinaturaChefia ? (
                <img
                  src={formData.assinaturaChefia}
                  className="h-10 mx-auto mt-2 object-contain"
                  alt="Assinatura"
                />
              ) : (
                <div className="text-[10px] text-slate-300 italic mt-2">
                  Pendente de Assinatura
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-50/30 rounded-xl border border-dashed">
              <div className="text-[9px] text-slate-400 font-bold">
                ECONOMATO / CONFERÊNCIA
              </div>
              <div className="text-[11px] font-black text-slate-800 mt-1">
                Aprovação Final
              </div>
              {formData.assinaturaEconomato ? (
                <img
                  src={formData.assinaturaEconomato}
                  className="h-10 mx-auto mt-2 object-contain"
                  alt="Assinatura"
                />
              ) : (
                <div className="text-[10px] text-slate-300 italic mt-2">
                  Pendente de Assinatura
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => printElementById("print-area")}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold  hover:bg-slate-800 transition-all flex items-center gap-2"
            >
              <Printer size={14} /> Imprimir Via PDF
            </button>
            <button
              onClick={onCancel}
              className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold  hover:bg-slate-200"
            >
              Voltar
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <FormLayout
      title="Requisição & Saída de Consumo Interno"
      subtitle="Subtração Automática Real-Time"
      icon={TrendingDown}
      bannerColor="bg-[#121c60]"
      iconColor="text-[#FF9500]"
      trackingCode={formData.numeroRequisicao}
      onCancel={onCancel}
      onSubmit={handleSubmit}
      isSubmitting={isProcessing}
      isSubmitted={isSubmitted}
      successTitle="Saída Processada!"
      successMessage={
        <>
          A requisição{" "}
          <span className="font-bold text-slate-900">
            {formData.numeroRequisicao}
          </span>{" "}
          foi registada. O saldo do material{" "}
          <span className="font-bold text-slate-900">
            {formData.descricaoMaterial}
          </span>{" "}
          foi reduzido em tempo real para{" "}
          <span className="font-bold text-green-600">
            {finalRealTimeSaldo} UN
          </span>
          .
        </>
      }
      maxWidth="max-w-4xl"
    >
      {/* Dynamic Processing Overlay with RGB Progression */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0a1240]/95 z-[210] flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="max-w-md w-full space-y-8">
              <div className="relative">
                <div
                  className="w-24 h-24 rounded-full mx-auto flex items-center justify-center animate-pulse shadow-2xl"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(18,28,96,0.8) 0%, rgba(10,18,64,1) 100%)",
                    boxShadow: "0 0 40px rgba(0, 240, 255, 0.3)",
                  }}
                >
                  <Database
                    size={36}
                    className="text-[#FFB800] animate-spin"
                    style={{ animationDuration: "4s" }}
                  />
                </div>
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white font-mono text-xs font-black select-none">
                  {processingProgress}%
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-white tracking-tight">
                  PROCESSANDO SUBTRAÇÃO DE ESTOQUE
                </h3>
                <p className="text-xs text-blue-200 font-bold tracking-widest ">
                  {processingStepLabel}
                </p>
              </div>

              {/* RGB Slide Progress Bar */}
              <div className="space-y-1 relative pb-6 w-full">
                <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden p-[2px] border border-blue-500/30">
                  <div
                    className="h-full rounded-full transition-all duration-150 ease-out animate-rgb-horizontal"
                    style={{
                      width: `${processingProgress}%`,
                      background:
                        "linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff)",
                      backgroundSize: "200% 100%",
                    }}
                  />
                </div>
                {/* Porcentagem acompanhando a barra por baixo */}
                <div
                  className="absolute top-5 transition-all duration-150 ease-out flex flex-col items-center"
                  style={{ left: `calc(${processingProgress}% - 12px)` }}
                >
                  <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[4px] border-l-transparent border-r-transparent border-b-blue-500 mb-[1px]"></div>
                  <span className="text-[10px] font-black text-white bg-blue-500 px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap">
                    {processingProgress}%
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black text-slate-400 font-mono tracking-wider pt-4">
                  <span>SISTEMA: ATIVO</span>
                  <span>{processingProgress}% CONCLUÍDO</span>
                </div>
              </div>

              <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 text-left grid grid-cols-2 gap-y-2 text-[11px] font-bold text-slate-300">
                <div>
                  Requisitante:{" "}
                  <span className="text-white font-black">
                    {formData.departamentoRequisitante}
                  </span>
                </div>
                <div>
                  Quantidade Saída:{" "}
                  <span className="text-red-400 font-black">
                    {formData.quantidade} UN
                  </span>
                </div>
                <div>
                  Saldo Anterior:{" "}
                  <span className="text-slate-400 font-black">
                    {formData.saldoDisponivel} UN
                  </span>
                </div>
                <div>
                  Saldo Restante:{" "}
                  <span className="text-green-400 font-black">
                    {finalRealTimeSaldo} UN
                  </span>
                </div>
              </div>
            </div>

            <style
              dangerouslySetInnerHTML={{
                __html: `
              @keyframes rgb-horizontal {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
              .animate-rgb-horizontal {
                animation: rgb-horizontal 1.5s linear infinite;
              }
            `,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Step */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100"
          >
            <div className="w-16 h-16 bg-blue-50 text-[#121c60] rounded-2xl flex items-center justify-center mb-6 border border-blue-100">
              <FileText size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tighter mb-2">
              Confirmar Saída
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-4">
              Ao confirmar, a quantidade de{" "}
              <span className="font-bold text-red-500">
                {formData.quantidade} UN
              </span>{" "}
              será subtraída do estoque de forma irreversível e em tempo real.
            </p>

            <div className="mb-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 tracking-widest mb-1 ">
                  Próxima Etapa Administrativa
                </label>
                <select
                  value={proximoDestinatario}
                  onChange={(e) => setProximoDestinatario(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 transition-all outline-none cursor-pointer"
                >
                  <option value="Secretaria Geral">Secretaria Geral</option>
                  <option value="Chefia do Departamento">
                    Chefia do Departamento
                  </option>
                  <option value="Chefia do Economato">
                    Chefia do Economato
                  </option>
                  <option value="Gabinete do Diretor-Geral">
                    Gabinete do Diretor-Geral
                  </option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={confirmAndSubmit}
                className="w-full bg-[#121c60] text-white py-3.5 rounded-xl font-bold text-xs hover:bg-blue-800 transition-all shadow-md"
              >
                Sim, Subtrair Estoque em Tempo Real
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="w-full bg-slate-100 text-slate-500 py-3 rounded-xl font-bold text-xs hover:bg-slate-200"
              >
                Voltar ao Formulário
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* UNIDADE ORGANICA */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-wider text-slate-500  flex items-center gap-1">
              <Building2 size={12} className="text-blue-500" /> Órgão
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Gabinete do Diretor-Geral, Faculdade de Ciências"
              value={formData.unidadeOrganica}
              onChange={(e) => updateField("unidadeOrganica", e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          {/* DEPARTAMENTO REQUISITANTE */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-wider text-slate-500  flex items-center gap-1">
              <Building2 size={12} className="text-blue-500" /> Departamento
              Requisitante
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Departamento de Recursos Humanos"
              value={formData.departamentoRequisitante}
              onChange={(e) =>
                updateField("departamentoRequisitante", e.target.value)
              }
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          {/* CÓDIGO DA ATIVIDADE NO PLANO */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-wider text-slate-500  flex items-center gap-1">
              <ClipboardList size={12} className="text-blue-500" /> Cód. Actividade (Plano)
            </label>
            <input
              type="text"
              placeholder="Ex: 01.DPEP (Ref. de rastreio)"
              value={formData.codigoActividade || ""}
              onChange={(e) => updateField("codigoActividade", e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          {/* CLASSE DO MATERIAL */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-wider text-slate-500  flex items-center gap-1">
              <Layers size={12} className="text-blue-500" /> Classe do Material
            </label>
            <select
              value={formData.classeMaterial}
              onChange={(e) => updateField("classeMaterial", e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
            >
              <option value="Material de Consumo">
                Material de Consumo (Rápido desgaste)
              </option>
              <option value="Material Permanente">Material Permanente</option>
              <option value="Equipamento Clínico / Laboratório">
                Equipamento Clínico / Laboratório
              </option>
              <option value="Material Tecnológico / TI">
                Material Tecnológico / TI
              </option>
            </select>
          </div>

          {/* NECESSIDADE */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-wider text-slate-500  flex items-center gap-1">
              <Layers size={12} className="text-blue-500" /> Necessidade (Grupamento)
            </label>
            <select
              value={selectedNecessidade}
              onChange={(e) => {
                setSelectedNecessidade(e.target.value);
                // Clear description to prevent mismatch
                updateField("descricaoMaterial", "");
                updateField("saldoDisponivel", 0);
              }}
              className="w-full p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-black text-blue-700 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
            >
              <option value="">Selecione a necessidade...</option>
              {Object.keys(PRODUTOS_POR_NECESSIDADE).sort().map((nec) => (
                <option key={nec} value={nec}>
                  {nec}
                </option>
              ))}
            </select>
          </div>

          {/* SELEÇÃO POR TÍTULO COMUM E CAPACIDADE/MODELO */}
          <div className="bg-blue-50/80 p-4 rounded-2xl border border-blue-200/60 space-y-3">
            <label className="text-[10px] font-black tracking-wider text-blue-900  flex items-center gap-1">
              <Layers size={12} className="text-blue-600" /> Seleção por Título Comum e Capacidade/Modelo (Ex: Flash USB, Computador)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-600 mb-1">1. Título Comum (Categoria):</label>
                <select
                  value={selectedTituloComum}
                  onChange={(e) => {
                    const cat = e.target.value;
                    setSelectedTituloComum(cat);
                  }}
                  className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg text-xs font-bold text-blue-950 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer"
                >
                  <option value="">Selecione o título comum (ex: Flash Drive, Computador)...</option>
                  {Object.keys(SUB_REFERENCIAS_PRODUTOS).map((cat) => (
                    <option key={cat} value={cat}>
                      📦 {cat} ({SUB_REFERENCIAS_PRODUTOS[cat].length} modelos/capacidades)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-600 mb-1">2. Capacidade e Modelo Pretendido:</label>
                <select
                  disabled={!selectedTituloComum}
                  onChange={(e) => {
                    const refName = e.target.value;
                    if (!refName) return;
                    updateField("descricaoMaterial", refName);
                  }}
                  className={`w-full px-3 py-2 border rounded-lg text-xs font-bold outline-none shadow-sm transition-all ${
                    !selectedTituloComum 
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                      : 'bg-white text-slate-800 border-blue-300 focus:ring-2 focus:ring-blue-500 cursor-pointer'
                  }`}
                  value={formData.descricaoMaterial}
                >
                  <option value="">
                    {selectedTituloComum ? "Selecione a capacidade ou modelo pretendido..." : "<- Primeiro indique o título comum acima"}
                  </option>
                  {subRefsDisponiveis.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-[9px] text-blue-800/70 italic">
              💡 Passo 1: Indique o título comum (ex: Flash Drive). Passo 2: O subdropdown abre/ativa para escolher a capacidade e modelo pretendido.
            </p>
          </div>

          {/* DESCRICAO MATERIAL */}
          <div className="space-y-1.5 relative">
            <label className="text-[10px] font-black tracking-wider text-slate-500  flex items-center gap-1">
              <ClipboardCheck size={12} className="text-blue-500" /> Descrição do Material
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Resma de Papel A4, Projetores, etc."
              value={formData.descricaoMaterial}
              onChange={(e) => {
                updateField("descricaoMaterial", e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />

            {shouldShowDropdown &&
              filteredBens.length > 0 && (
                <div className="absolute z-[100] left-0 right-0 top-[100%] mt-1 max-h-40 overflow-y-auto bg-white border border-slate-200 shadow-2xl rounded-2xl p-2 divide-y divide-slate-100 animate-fade-in">
                  <div className="p-1 px-2 text-[8px] font-bold text-slate-400  tracking-widest">
                    {selectedNecessidade ? `Itens de: ${selectedNecessidade}` : "Sugerir itens do Estoque Atual"}
                  </div>
                  {filteredBens.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        handleSelectExisting(
                          item.nome,
                          item.quantidadeDisponivel,
                        )
                      }
                      className="w-full text-left p-2.5 hover:bg-slate-50 text-xs font-bold text-slate-700 flex justify-between items-center rounded-lg transition-all"
                    >
                      <span className="font-bold">{item.nome}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${item.quantidadeDisponivel > 0 ? "bg-green-50 text-green-700 font-bold" : "bg-slate-100 text-slate-400"}`}>
                        Saldo: {item.quantidadeDisponivel} UN
                      </span>
                    </button>
                  ))}
                </div>
              )}
            {showDropdown && (
              <div
                className="absolute right-3 top-9 z-[60] text-slate-300 hover:text-slate-500 cursor-pointer"
                onClick={() => setShowDropdown(false)}
              >
                <X size={14} />
              </div>
            )}

            {/* Status do Produto Planificado & Estoque */}
            {formData.descricaoMaterial.trim().length > 0 && (
              <div className="mt-2">
                {!isPlanificado ? (
                  <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-xs font-bold text-amber-900 flex items-center gap-2 shadow-sm">
                    <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                    <div>
                      <span className=" font-black text-amber-950 block">produto nao planificado</span>
                      <span className="text-[10px] text-amber-800 font-normal">Este item não foi encontrado no plano de necessidades da sua unidade/direção.</span>
                    </div>
                  </div>
                ) : formData.saldoDisponivel <= 0 ? (
                  <div className="p-2.5 bg-red-50 border border-red-300 rounded-xl text-xs font-bold text-red-900 flex items-center gap-2 shadow-sm">
                    <ShieldAlert size={16} className="text-red-600 shrink-0" />
                    <div>
                      <span className=" font-black text-red-950 block">produto esgotado no estoque do seu departamento</span>
                      <span className="text-[10px] text-red-800 font-normal">Item planificado, mas sem saldo disponível em estoque (0 UN).</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2 shadow-sm">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <div>
                      <span className=" font-black text-emerald-950 block">Produto planificado em estoque</span>
                      <span className="text-[10px] text-emerald-800 font-normal">Disponibilidade para requisitar: <strong>{formData.saldoDisponivel} UN</strong></span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* QUANTIDADE */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-wider text-slate-500  flex items-center gap-1">
              <Calculator size={12} className="text-blue-500" /> Quantidade
              Requisitada
            </label>
            <input
              type="number"
              required
              min={1}
              value={formData.quantidade}
              onChange={(e) =>
                updateField(
                  "quantidade",
                  Math.max(1, parseInt(e.target.value) || 1),
                )
              }
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-red-600 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          {/* MES */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-wider text-slate-500  flex items-center gap-1">
              <Calendar size={12} className="text-blue-500" /> Mês de Saída
            </label>
            <select
              value={formData.mes}
              onChange={(e) => updateField("mes", e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* DATA */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-wider text-slate-500  flex items-center gap-1">
              <Calendar size={12} className="text-blue-500" /> Data de Saída
            </label>
            <input
              type="date"
              required
              value={formData.data}
              onChange={(e) => updateField("data", e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          {/* RECEBEU */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-wider text-slate-500  flex items-center gap-1">
              <UserCheck size={12} className="text-blue-500" /> Recebeu
              (Conferente / Responsável)
            </label>
            <input
              type="text"
              required
              placeholder="Nome do responsável pela recepção / consumo"
              value={formData.recebeu}
              onChange={(e) => updateField("recebeu", e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Real-time stock display with direct arithmetic subtract preview */}
        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200/60 grid grid-cols-1 md:grid-cols-3 gap-6 relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-[10px] font-black tracking-wider text-slate-400 ">
              Saldo Disponível Atual
            </span>
            <div className="text-xl font-black text-slate-800 font-mono mt-0.5">
              {formData.saldoDisponivel}{" "}
              <span className="text-[10px] font-bold text-slate-400">
                UNIDADES
              </span>
            </div>
            <p className="text-[9px] text-slate-400">
              Auto-recuperado do inventário
            </p>
          </div>

          <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-200/80 md:pl-6">
            <span className="text-[10px] font-black tracking-wider text-slate-400 ">
              Quantidade Requisitada
            </span>
            <div className="text-lg font-black text-red-600 font-mono flex items-center gap-1 mt-0.5">
              -{formData.quantidade}{" "}
              <span className="text-[10px] font-bold text-slate-400">
                UNIDADE(S)
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-center bg-gradient-to-br from-[#121c60] to-[#04092b] text-white p-4 rounded-2xl md:pl-6 shadow-md shadow-blue-900/10">
            <span className="text-[9px] font-black tracking-widest text-[#FFB800]  flex items-center gap-1">
              SALDO DISPONIVEL APÓS SAÍDA
            </span>
            <div className="text-2xl font-black font-mono tracking-tight mt-0.5 flex items-baseline gap-1.5">
              {finalRealTimeSaldo}
              <span className="text-[9px] text-zinc-300 font-bold ">
                Unidades
              </span>
            </div>
          </div>
        </div>

        {/* SE O PRODUTO NÃO É PLANIFICADO OU O SALDO É ZERO OU INSUFICIENTE, EXIBIR ALERTA DE BLOQUEIO */}
        {formData.descricaoMaterial.trim().length > 0 && (!isPlanificado || formData.saldoDisponivel <= 0 || formData.quantidade > formData.saldoDisponivel) && (
          <div className="bg-red-50 rounded-2xl p-5 border-2 border-red-300 flex items-start gap-4 shadow-sm">
            <div className="bg-red-600 text-white p-2.5 rounded-xl shrink-0 mt-0.5">
              <ShieldAlert size={22} />
            </div>
            <div className="flex-1">
              <h5 className="text-xs font-black text-red-900  tracking-wider flex items-center gap-2">
                {!isPlanificado ? "REQUISIÇÃO BLOQUEADA: PRODUTO NÃO PLANIFICADO" : "REQUISIÇÃO BLOQUEADA: ESTOQUE DO SETOR INSUFICIENTE"}
              </h5>
              <p className="text-xs text-red-800 font-bold mt-1">
                Status do Sistema:{" "}
                <span className="bg-red-200 text-red-950 px-2 py-0.5 rounded font-black  tracking-wide">
                  {!isPlanificado ? "produto nao planificado" : "produto esgotado no estoque do seu departamento"}
                </span>
              </p>
              <p className="text-xs text-red-700 font-medium mt-1">
                O setor <strong className="underline">{formData.departamentoRequisitante || formData.unidadeOrganica || "Selecionado"}</strong>{" "}
                {!isPlanificado
                  ? `não possui o produto "${formData.descricaoMaterial}" cadastrado em seu plano de necessidades.`
                  : `possui apenas ${formData.saldoDisponivel} UN disponíveis em estoque para o produto "${formData.descricaoMaterial}".`}
              </p>
              <p className="text-[11px] text-red-600 font-medium mt-1">
                Regra de Controlo: Nenhum setor tem autorização para requisitar produtos não planificados ou sem saldo em estoque.
              </p>
              <button
                type="button"
                onClick={() => setShowEstoqueModal(true)}
                className="mt-3 px-4 py-2 bg-red-700 text-white rounded-xl text-xs font-black hover:bg-red-800 transition-all flex items-center gap-2 shadow-sm"
              >
                <Package size={14} /> Consultar Estoque Planificado do Setor
              </button>
            </div>
          </div>
        )}

        {/* Modal de Consulta de Estoque do Setor */}
        <ConsultarEstoqueModal
          user={user}
          isOpen={showEstoqueModal}
          onClose={() => setShowEstoqueModal(false)}
          defaultSector={formData.departamentoRequisitante || formData.unidadeOrganica}
          onSelectProductForRequisition={(item) => {
            updateField("descricaoMaterial", item.nome);
            if (item.setor) {
              updateField("departamentoRequisitante", item.setor);
            }
            updateField("saldoDisponivel", item.saldoDisponivel);
          }}
        />

        {/* Signatures block for confirmation */}
        <div className="border-t pt-6">
          <h4 className="text-[10px] font-black text-slate-400  tracking-widest mb-4">
            Assinaturas e Autorizações do Lançamento
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
            <SignatureUpload
              label="O Solicitante Requisitante"
              subLabel="Assinatura Digital de Saída"
              value={formData.assinaturaSolicitante}
              onChange={(val) => updateField("assinaturaSolicitante", val)}
              user={user}
            />
            <SignatureUpload
              label="Responsável pelo Economato"
              subLabel="Conferência Geral de Estoque"
              value={formData.assinaturaEconomato}
              onChange={(val) => updateField("assinaturaEconomato", val)}
              user={user}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-8 border-t border-slate-100 print:hidden">
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-xs tracking-widest "
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isProcessing || isSubmitted}
            className="px-10 py-3 bg-[#121c60] text-white rounded-xl font-black text-xs tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-blue-100 disabled:opacity-50 flex items-center gap-2 "
          >
            <Save size={18} className="text-[#FFB800]" />{" "}
            {isProcessing
              ? "Processando..."
              : isSubmitted
                ? "Processado"
                : "Processar Saída & Reduzir Estoque"}
          </button>
        </div>
      </div>
    </FormLayout>
  );
}

import React, { useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import {
  Save,
  Package,
  ClipboardCheck,
  Truck,
  Calendar,
  Layers,
  Calculator,
  Briefcase,
  Cpu,
  X,
} from "lucide-react";
import { firestoreService } from "../../lib/firestoreService";
import { FormLayout } from "../../components/shared/FormLayout";
import { PRODUTOS_POR_NECESSIDADE, SUB_REFERENCIAS_PRODUTOS } from "../../constants/formOptions";

export default function FormularioEntradaEstoque({
  user,
  onCancel,
  onSubmit,
}: {
  user?: any;
  onCancel: () => void;
  onSubmit: (data: any) => void;
}) {
  const [existingBens, setExistingBens] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedNecessidade, setSelectedNecessidade] = useState<string>("");
  const [selectedTituloComum, setSelectedTituloComum] = useState("");
  const subRefsDisponiveis = selectedTituloComum ? SUB_REFERENCIAS_PRODUTOS[selectedTituloComum] || [] : [];

  // Processing Animation state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStepLabel, setProcessingStepLabel] =
    useState("Iniciando...");

  // Get current date components in 2026-05-25 (May is index 4 in JS, or "Maio" in Portuguese)
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
  const currentMonthName = months[new Date().getMonth()]; // E.g., 'Maio' if May

  const [formData, setFormData] = useState({
    fornecedor: "",
    tipoServicos: "Material de Escritório",
    classeMaterial: "Material de Consumo",
    descricaoMaterial: "",
    quantidadeEntrada: 1,
    mes: currentMonthName,
    data: today,
    recebeu: user?.name || "Administrador do Sistema",
    saldoAnterior: 0,
  });

  // Fetch existing items for autocomplete and Saldo Anterior retrieval
  useEffect(() => {
    const unsub = firestoreService.materiais_bens.subscribe((data: any[]) => {
      setExistingBens(data || []);
    });
    return () => unsub();
  }, []);

  // Update Saldo Anterior automatically if match is found
  useEffect(() => {
    const matchedItem = existingBens.find(
      (b) =>
        b.nome?.trim().toLowerCase() ===
        formData.descricaoMaterial.trim().toLowerCase(),
    );
    if (matchedItem) {
      setFormData((prev) => ({
        ...prev,
        saldoAnterior: Number(matchedItem.quantidadeDisponivel || 0),
      }));
    } else {
      // If no match, don't force reset to 0 in case the user edited it manually,
      // but let's default to 0 on clean fields
      if (formData.descricaoMaterial.trim() === "") {
        setFormData((prev) => ({ ...prev, saldoAnterior: 0 }));
      }
    }
  }, [formData.descricaoMaterial, existingBens]);

  const updateField = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectExisting = (nome: string, qtd: number) => {
    setFormData((prev) => ({
      ...prev,
      descricaoMaterial: nome,
      saldoAnterior: Number(qtd),
    }));
    setShowDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.descricaoMaterial.trim()) {
      alert("Por favor, preencha a descrição do material.");
      return;
    }
    if (!formData.fornecedor.trim()) {
      alert("Por favor, indique o fornecedor.");
      return;
    }

    const qtyEntrada = Number(formData.quantidadeEntrada) || 0;
    const prevSaldo = Number(formData.saldoAnterior) || 0;
    const totalExists = prevSaldo + qtyEntrada;

    const payload = {
      fornecedor: formData.fornecedor,
      tipoServicos: formData.tipoServicos,
      classeMaterial: formData.classeMaterial,
      descricao: formData.descricaoMaterial, // critical match for EconomatoView/GestaoPatrimonial
      descricaoMaterial: formData.descricaoMaterial,
      quantidade: qtyEntrada, // critical match
      quantidadeEntrada: qtyEntrada,
      mes: formData.mes,
      data: formData.data,
      dataRecebimento: formData.data,
      recebeu: formData.recebeu,
      responsavelRecebimento: formData.recebeu,
      saldoAnterior: prevSaldo,
      novaEntradaTotalExiste: totalExists,
      necessidade: selectedNecessidade,
      itens: [
        {
          codigo: "#ENT",
          descricao: formData.descricaoMaterial,
          unidade: "UN",
          qtdPedida: qtyEntrada,
          qtdRecebida: qtyEntrada,
          avaria: false,
        },
      ],
    };

    // Trigger the RGB processing cycle
    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingStepLabel("Validando dados do fornecedor...");

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 12) + 6;

      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setProcessingProgress(100);
        setProcessingStepLabel("Sincronização concluída! Gravando...");

        setTimeout(() => {
          setIsProcessing(false);
          onSubmit(payload);
        }, 800);
      } else {
        setProcessingProgress(currentProgress);
        if (currentProgress < 30) {
          setProcessingStepLabel("Conectando base de dados do Almoxarifado...");
        } else if (currentProgress < 60) {
          setProcessingStepLabel(
            `Mapeando histórico e atualizando Saldo Anterior de ${formData.saldoAnterior} UN...`,
          );
        } else if (currentProgress < 85) {
          setProcessingStepLabel(
            `Calculando Nova Entrada Total de ${totalExists} UN existente...`,
          );
        } else {
          setProcessingStepLabel(
            "Registrando transações e consolidando saldo total ERP...",
          );
        }
      }
    }, 120);
  };

  const novaEntradaTotalExiste =
    Number(formData.saldoAnterior || 0) +
    Number(formData.quantidadeEntrada || 0);

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

  return (
    <FormLayout
      title="Atualização Contínua de Estoque"
      subtitle="Registo de Entrada de Produtos pelo Fornecedor"
      icon={Package}
      bannerColor="bg-[#121c60]"
      iconColor="text-[#FFB800]"
      onCancel={onCancel}
      onSubmit={handleSubmit}
      isSubmitting={isProcessing}
      isSubmitted={false}
      successMessage=""
      maxWidth="max-w-4xl"
    >
      {/* Dynamic Processing Overlay with RGB Progression */}
      <AnimatePresence>
        {isProcessing && (
          <div className="absolute inset-0 bg-[#0a1240]/95 z-[200] flex flex-col items-center justify-center p-8 text-center rounded-[2rem]">
            <div className="max-w-md w-full space-y-8">
              <div className="relative">
                {/* Glowing Background Ring */}
                <div
                  className="w-24 h-24 rounded-full mx-auto flex items-center justify-center animate-pulse shadow-2xl"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(18,28,96,0.8) 0%, rgba(10,18,64,1) 100%)",
                    boxShadow: "0 0 40px rgba(0, 240, 255, 0.3)",
                  }}
                >
                  <Cpu
                    size={36}
                    className="text-[#FFB800] animate-spin"
                    style={{ animationDuration: "4s" }}
                  />
                </div>
                {/* Micro Percentage count inside */}
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white font-mono text-xs font-black select-none">
                  {processingProgress}%
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-white tracking-tight">
                  PROCESSANDO INTEGRAÇÃO DO ESTOQUE
                </h3>
                <p className="text-xs text-blue-200 font-bold tracking-widest ">
                  {processingStepLabel}
                </p>
              </div>

              {/* RGB Sliding Progress Bar */}
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
                  <span>ESTADO: ATIVO</span>
                  <span>{processingProgress}% CONCLUÍDO</span>
                </div>
              </div>

              <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 text-left grid grid-cols-2 gap-y-2 text-[11px] font-bold text-slate-300">
                <div>
                  Fornecedor:{" "}
                  <span className="text-white font-black">
                    {formData.fornecedor}
                  </span>
                </div>
                <div>
                  Nova Entrada:{" "}
                  <span className="text-blue-400 font-black">
                    {formData.quantidadeEntrada} UN
                  </span>
                </div>
                <div>
                  Saldo Anterior:{" "}
                  <span className="text-slate-400 font-black">
                    {formData.saldoAnterior} UN
                  </span>
                </div>
                <div>
                  Total em Estoque:{" "}
                  <span className="text-green-400 font-black">
                    {novaEntradaTotalExiste} UN
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
          </div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* FORNECEDOR */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-wider text-slate-500  flex items-center gap-1">
              <Truck size={12} className="text-blue-500" /> Fornecedor
            </label>
            <input
              type="text"
              required
              placeholder="Digite o nome da empresa fornecedora"
              value={formData.fornecedor}
              onChange={(e) => updateField("fornecedor", e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          {/* TIPO DE SERVICOS */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-wider text-slate-500  flex items-center gap-1">
              <Briefcase size={12} className="text-blue-500" /> Tipo de Serviços
            </label>
            <select
              value={formData.tipoServicos}
              onChange={(e) => updateField("tipoServicos", e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
            >
              <option value="Material de Escritório">
                Material de Escritório
              </option>
              <option value="Equipamento de TI e Telecom">
                Equipamento de TI e Telecom
              </option>
              <option value="Material de Limpeza e Higiene">
                Material de Limpeza e Higiene
              </option>
              <option value="Serviços Gráficos e Publicidade">
                Serviços Gráficos e Publicidade
              </option>
              <option value="Serviços de Copa / Alimentação">
                Serviços de Copa / Alimentação
              </option>
              <option value="Material de Ensino e Laboratório">
                Material de Ensino e Laboratório
              </option>
              <option value="Mobiliário e Decoração">
                Mobiliário e Decoração
              </option>
              <option value="Outros Serviços / Produtos">
                Outros Serviços / Produtos
              </option>
            </select>
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
              <option value="Material Permanente">
                Material Permanente (Ativos permanentes)
              </option>
              <option value="Equipamento de Proteção">
                Equipamento de Proteção / Utilidades
              </option>
              <option value="Material Técnico Especializado">
                Material Técnico Especializado
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
                // Reset description & previous balances to avoid mismatches
                updateField("descricaoMaterial", "");
                updateField("saldoAnterior", 0);
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
                <div className="absolute z-[100] left-0 right-0 top-[100%] mt-1 max-h-40 overflow-y-auto bg-white border border-slate-200 shadow-2xl rounded-2xl p-2 divide-y divide-slate-100">
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
                        Qtd Atual: {item.quantidadeDisponivel || 0}
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
          </div>

          {/* QUANTIDADE DE ENTRADA */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-wider text-slate-500  flex items-center gap-1">
              <Calculator size={12} className="text-blue-500" /> Quantidade de
              Entrada
            </label>
            <input
              type="number"
              required
              min={1}
              value={formData.quantidadeEntrada}
              onChange={(e) =>
                updateField(
                  "quantidadeEntrada",
                  Math.max(1, parseInt(e.target.value) || 1),
                )
              }
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          {/* MES */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-wider text-slate-500  flex items-center gap-1">
              <Calendar size={12} className="text-blue-500" /> Mês de Referência
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
              <Calendar size={12} className="text-blue-500" /> Data de
              Recebimento
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
              <ClipboardCheck size={12} className="text-blue-500" /> Recebeu
              (Conferente)
            </label>
            <input
              type="text"
              required
              placeholder="Nome de quem recebeu o material"
              value={formData.recebeu}
              onChange={(e) => updateField("recebeu", e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Dynamic Balance Visual Board */}
        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200/60 grid grid-cols-1 md:grid-cols-3 gap-6 relative overflow-hidden">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-wider text-slate-400 ">
              Saldo Anterior em Estoque
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={formData.saldoAnterior}
                onChange={(e) =>
                  updateField(
                    "saldoAnterior",
                    Math.max(0, parseInt(e.target.value) || 0),
                  )
                }
                className="w-24 p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <span className="text-[10px] font-bold text-slate-400 italic">
                Unidades
              </span>
            </div>
            <p className="text-[9px] text-slate-400 font-medium">
              Auto-preenchido se o material já existir
            </p>
          </div>

          <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-200/80 md:pl-6">
            <span className="text-[10px] font-black tracking-wider text-slate-400 ">
              Input Recente
            </span>
            <div className="text-lg font-black text-blue-600 font-mono flex items-center gap-1 mt-1">
              +{formData.quantidadeEntrada}{" "}
              <span className="text-[10px] font-bold text-slate-400">
                UNIDADE(S)
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-center bg-gradient-to-br from-[#121c60] to-[#0d1547] text-white p-4 rounded-2xl md:pl-6 shadow-md shadow-blue-900/10">
            <span className="text-[9px] font-black tracking-widest text-[#FFB800]  flex items-center gap-1">
              NOVA ENTRADA TOTAL EXISTE
            </span>
            <div className="text-2xl font-black font-mono tracking-tight mt-1 flex items-baseline gap-1.5">
              {novaEntradaTotalExiste}
              <span className="text-[9px] text-zinc-300 font-bold ">
                Unidades
              </span>
            </div>
          </div>
        </div>

        {/* Form Actions */}
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
            disabled={isProcessing}
            className="px-10 py-3 bg-[#121c60] text-white rounded-xl font-black text-xs tracking-[0.2em] hover:bg-[#1a2c94] transition-all shadow-xl shadow-blue-100 disabled:opacity-50 flex items-center gap-2 "
          >
            <Save size={18} />{" "}
            {isProcessing ? "Sincronizando..." : "Atualizar Estoque / Entrada"}
          </button>
        </div>
      </div>
    </FormLayout>
  );
}

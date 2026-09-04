import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Table,
  FolderTree,
  Search,
  Filter,
  Edit3,
  Check,
  DollarSign,
  X,
  Package,
  Layers,
  ArrowRight,
  Inbox,
  SlidersHorizontal,
} from "lucide-react";
import {
  getUnifiedProducts,
  saveUnifiedProduct,
  deleteUnifiedProduct,
  deduplicateDatabaseProducts,
  getCategoryForRubricaOrNecessidade,
  UnifiedProduct,
} from "../../lib/unifiedManager";
import {
  RUBRICAS,
  getNecessidadesOptions,
  formatNecessidadeWithCode,
  PRODUTOS_POR_NECESSIDADE,
  SUB_REFERENCIAS_PRODUTOS,
} from "../../constants/formOptions";

const CATEGORIAS_LIST = [
  "TODAS",
  "121 - Bens de Consumo e Materiais",
  "122 - Serviços de Terceiros e Encargos",
  "112 - Despesas com Pessoal e Diárias",
  "1434 - Transferências e Bolsas",
  "12 - Exercícios Findos",
];

export default function GestaoProdutosPrecosView({ isAddingModeOnStart = false }: { isAddingModeOnStart?: boolean }) {
  const [products, setProducts] = useState<UnifiedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeduplicating, setIsDeduplicating] = useState(false);
  const [viewMode, setViewMode] = useState<"planilha" | "agrupado">("planilha");

  // Filters - Inicialmente vazios para iniciar limpo
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("TODAS");
  const [filterRubrica, setFilterRubrica] = useState("");
  const [filterNecessidade, setFilterNecessidade] = useState("");

  // Modals & Forms
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(isAddingModeOnStart);
  const [newProduct, setNewProduct] = useState({
    nome: "",
    preco: 0,
    unidade: "",
    especificacao: "",
    rubrica: "",
    necessidade: "",
    quantidade: 1,
  });

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    if (editingProduct) {
      setModalError(null);
    }
  }, [editingProduct]);

  useEffect(() => {
    if (isAddingNew) {
      setModalError(null);
    }
  }, [isAddingNew]);

  // Load products and deduplicate on mount
  const refreshProducts = async () => {
    setIsLoading(true);
    try {
      const prods = await getUnifiedProducts();
      setProducts(prods);
    } catch (e) {
      console.error("Erro ao carregar produtos:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProducts();
  }, []);

  // Handle explicit database deduplication
  const handleDeduplicate = async () => {
    setIsDeduplicating(true);
    try {
      const res = await deduplicateDatabaseProducts();
      await refreshProducts();
      setSuccessMsg(
        `Verificação concluída! A base de dados contém ${res.totalUnique} produtos únicos. ${
          res.duplicatesRemoved > 0
            ? `${res.duplicatesRemoved} produtos repetidos foram eliminados/consolidados.`
            : "Nenhum produto duplicado foi encontrado."
        }`
      );
    } catch (e) {
      console.error("Erro na deduplicação:", e);
    } finally {
      setIsDeduplicating(false);
      setTimeout(() => setSuccessMsg(null), 6000);
    }
  };

  // Compute available necessity options based strictly on the selected Rubrica
  const rawFilterNecessidades: string[] = useMemo(() => {
    if (!filterRubrica) return [];
    return getNecessidadesOptions(filterRubrica);
  }, [filterRubrica]);

  const availableFilterNecessidades = useMemo(() => {
    if (!filterRubrica) return [];
    return rawFilterNecessidades
      .map((nec) => formatNecessidadeWithCode(nec, filterRubrica))
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => a.localeCompare(b, "pt-MZ", { sensitivity: "base" }));
  }, [rawFilterNecessidades, filterRubrica]);

  // Grouped products for the "agrupado" view mode
  const groupedByNecessidade = useMemo(() => {
    if (!filterRubrica) return {};
    
    const groups: Record<string, UnifiedProduct[]> = {};
    
    // Initialize groups for all available necessities to ensure "empty" ones show up
    availableFilterNecessidades.forEach(nec => {
      groups[nec] = [];
    });
    
    // Distribute products into groups
    products.forEach(p => {
      // Basic rubrica check
      if ((p.rubrica || "").trim().toLowerCase() !== filterRubrica.trim().toLowerCase()) return;
      
      // Filter by search query if present
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const pCat = p.categoria || getCategoryForRubricaOrNecessidade(p.rubrica, p.necessidade);
        const pCodeNec = formatNecessidadeWithCode(p.necessidade || "", p.rubrica);
        const match =
          p.nome.toLowerCase().includes(q) ||
          (p.especificacao || "").toLowerCase().includes(q) ||
          (p.unidade || "").toLowerCase().includes(q) ||
          (p.rubrica || "").toLowerCase().includes(q) ||
          pCat.toLowerCase().includes(q) ||
          pCodeNec.toLowerCase().includes(q);
        if (!match) return;
      }

      // Find matching necessity group
      const pCodeNec = formatNecessidadeWithCode(p.necessidade || "", p.rubrica);
      const cleanPNec = (p.necessidade || "").replace(/^\d+\s*[-_.]?\s*/, "").trim().toLowerCase();
      
      const matchingNec = availableFilterNecessidades.find(nec => {
        const cleanNec = nec.replace(/^\d+\s*[-_.]?\s*/, "").trim().toLowerCase();
        return (
          (p.necessidade || "").trim().toLowerCase() === nec.trim().toLowerCase() ||
          pCodeNec.trim().toLowerCase() === nec.trim().toLowerCase() ||
          (cleanPNec && cleanPNec === cleanNec)
        );
      });
      
      if (matchingNec) {
        groups[matchingNec].push(p);
      }
    });
    
    return groups;
  }, [products, filterRubrica, availableFilterNecessidades, searchQuery]);

  // Verificar se a consulta tem Rúbrica e Necessidade selecionadas
  const isSelectionComplete = Boolean(filterRubrica && filterNecessidade);

  // Main Filtering Logic - só retorna produtos se Rúbrica e Necessidade estiverem indicadas
  const filteredProducts = useMemo(() => {
    if (!isSelectionComplete) {
      return [];
    }

    return products.filter((p) => {
      // 1. Categoria
      const pCat = p.categoria || getCategoryForRubricaOrNecessidade(p.rubrica, p.necessidade);
      if (filterCategoria !== "TODAS" && pCat !== filterCategoria) {
        return false;
      }

      // 2. Rubrica
      if (
        filterRubrica &&
        (p.rubrica || "").trim().toLowerCase() !== filterRubrica.trim().toLowerCase()
      ) {
        return false;
      }

      // 3. Necessidade
      if (filterNecessidade) {
        const pCodeNec = formatNecessidadeWithCode(p.necessidade || "", p.rubrica);
        const cleanFilterNec = filterNecessidade.replace(/^\d+\s*[-_.]?\s*/, "").trim().toLowerCase();
        const cleanPNec = (p.necessidade || "").replace(/^\d+\s*[-_.]?\s*/, "").trim().toLowerCase();
        const matchNec =
          (p.necessidade || "").trim().toLowerCase() === filterNecessidade.trim().toLowerCase() ||
          pCodeNec.trim().toLowerCase() === filterNecessidade.trim().toLowerCase() ||
          (cleanFilterNec && cleanPNec && (cleanFilterNec === cleanPNec || cleanFilterNec.includes(cleanPNec) || cleanPNec.includes(cleanFilterNec)));
        if (!matchNec) return false;
      }

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const pCodeNec = formatNecessidadeWithCode(p.necessidade || "", p.rubrica);
        const match =
          p.nome.toLowerCase().includes(q) ||
          (p.especificacao || "").toLowerCase().includes(q) ||
          (p.unidade || "").toLowerCase().includes(q) ||
          (p.rubrica || "").toLowerCase().includes(q) ||
          pCat.toLowerCase().includes(q) ||
          pCodeNec.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [products, isSelectionComplete, filterCategoria, filterRubrica, filterNecessidade, searchQuery]);

  const handleDeleteProduct = async (nome: string) => {
    if (window.confirm(`Tem certeza que deseja excluir permanentemente o produto "${nome}" da base de dados?`)) {
      await deleteUnifiedProduct(nome);
      await refreshProducts();
      setSuccessMsg(`Produto "${nome}" excluído com sucesso da base de dados.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!editingProduct || !editingProduct.nome) return;
    if (!editingProduct.especificacao || !editingProduct.especificacao.trim()) {
      setModalError("O preenchimento das especificações técnicas é obrigatório para cada produto inserido.");
      return;
    }
    if (!editingProduct.unidade || !editingProduct.unidade.trim()) {
      setModalError("O preenchimento dos detalhes / unidade é obrigatório para cada produto inserido.");
      return;
    }
    
    // Check for duplicate names
    const newNameTrimmed = editingProduct.nome.trim().toLowerCase();
    const originalNameTrimmed = (editingProduct._originalNome || "").trim().toLowerCase();
    
    if (newNameTrimmed !== originalNameTrimmed) {
      const exists = products.some(p => p.nome.trim().toLowerCase() === newNameTrimmed);
      if (exists) {
        setModalError("Já existe um produto com este nome. Por favor, escolha outro nome ou edite o produto existente.");
        return;
      }
    }

    try {
      if (editingProduct._originalNome && editingProduct._originalNome !== editingProduct.nome) {
        await deleteUnifiedProduct(editingProduct._originalNome);
      }
      const cat = getCategoryForRubricaOrNecessidade(editingProduct.rubrica, editingProduct.necessidade);
      await saveUnifiedProduct({
        nome: editingProduct.nome,
        preco: Number(editingProduct.preco) || 0,
        unidade: editingProduct.unidade || "Unidade",
        especificacao: editingProduct.especificacao || "",
        rubrica: editingProduct.rubrica,
        necessidade: editingProduct.necessidade,
        categoria: cat,
      });
      await refreshProducts();
      setSuccessMsg(`Produto "${editingProduct.nome}" atualizado e substituído com sucesso na base de dados!`);
      setEditingProduct(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error("Erro ao salvar produto:", err);
      setModalError("Ocorreu um erro ao guardar na base de dados: " + (err?.message || String(err)));
    }
  };

  const handleAddNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!newProduct.nome || !newProduct.nome.trim()) return;
    if (!newProduct.especificacao || !newProduct.especificacao.trim()) {
      setModalError("O preenchimento das especificações técnicas é obrigatório para cada produto inserido.");
      return;
    }
    if (!newProduct.unidade || !newProduct.unidade.trim()) {
      setModalError("O preenchimento dos detalhes / unidade é obrigatório para cada produto inserido.");
      return;
    }

    const newNameTrimmed = newProduct.nome.trim().toLowerCase();
    const exists = products.some(p => p.nome.trim().toLowerCase() === newNameTrimmed);
    if (exists) {
      setModalError("Já existe um produto com este nome. Por favor, escolha outro nome ou edite o produto existente.");
      return;
    }

    try {
      const cat = getCategoryForRubricaOrNecessidade(newProduct.rubrica, newProduct.necessidade);
      await saveUnifiedProduct({
        nome: newProduct.nome.trim(),
        preco: Number(newProduct.preco) || 0,
        unidade: newProduct.unidade || "Unidade",
        especificacao: newProduct.especificacao || "",
        rubrica: newProduct.rubrica,
        necessidade: newProduct.necessidade,
        categoria: cat,
      });
      await refreshProducts();
      setSuccessMsg(`Novo produto "${newProduct.nome}" registado de forma única na base de dados!`);
      setIsAddingNew(false);
      setNewProduct({
        nome: "",
        preco: 0,
        unidade: "",
        especificacao: "",
        rubrica: "",
        necessidade: "",
        quantidade: 1,
      });
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error("Erro ao registar novo produto:", err);
      setModalError("Ocorreu um erro ao registar na base de dados: " + (err?.message || String(err)));
    }
  };

  const availableNecessidadesForNew = getNecessidadesOptions(newProduct.rubrica);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-blue-800/40">
        <div className="relative z-10 space-y-2 text-center md:text-left">
          <span className="text-[10px] font-black  tracking-widest bg-blue-500/30 text-blue-200 px-3.5 py-1 rounded-full border border-blue-400/30 inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            Bloco 9 — Gestão de Produtos & Preços
          </span>
          <h2 className="text-2xl font-black tracking-tight font-serif text-white">
            Planilha Gestão de Produtos e Preços
          </h2>
          <p className="text-xs text-blue-200 max-w-2xl leading-relaxed">
            Consolidação de todos os produtos do sistema. Produtos com o mesmo nome são automaticamente identificados e mantidos como itens únicos, organizados rigorosamente por Categoria, Rúbrica e Necessidade Específica.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 shrink-0">
          <button
            onClick={handleDeduplicate}
            disabled={isDeduplicating}
            className="px-4 py-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-black rounded-2xl text-xs tracking-wider transition-all shadow-xl shadow-amber-500/20 flex items-center gap-2 border border-amber-300 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isDeduplicating ? "animate-spin" : ""}`} />
            <span>{isDeduplicating ? "A verificar..." : "⚡ Verificador de Duplicados"}</span>
          </button>

          <button
            onClick={() => setIsAddingNew(true)}
            className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl text-xs tracking-wider transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-2 border border-emerald-400/30"
          >
            <Plus className="w-4 h-4" />
            <span>Registar Novo Produto Único</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="leading-snug">{successMsg}</span>
        </div>
      )}

      {/* Metrics Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-50/50 p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-black text-gray-400  tracking-widest">Rúbrica Selecionada</span>
          <span className="text-sm font-black text-blue-900 mt-1 truncate" title={filterRubrica || "Não selecionada"}>
            {filterRubrica ? filterRubrica : "⚪ Não selecionada"}
          </span>
        </div>
        <div className="bg-slate-50/50 p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-black text-gray-400  tracking-widest">Necessidade Pretendida</span>
          <span className="text-sm font-black text-indigo-900 mt-1 truncate" title={filterNecessidade || "Não selecionada"}>
            {filterNecessidade ? filterNecessidade : "⚪ Não selecionada"}
          </span>
        </div>
        <div className="bg-slate-50/50 p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-black text-gray-400  tracking-widest">Produtos na Necessidade</span>
          <span className="text-2xl font-black text-blue-900 mt-1 font-mono">
            {isSelectionComplete ? filteredProducts.length : "—"}
          </span>
        </div>
        <div className="bg-slate-50/50 p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-black text-gray-400  tracking-widest">Estado da Consulta</span>
          <span
            className={`text-xs font-black px-3 py-1 rounded-full w-fit mt-2 border inline-flex items-center gap-1.5 ${
              isSelectionComplete
                ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                : filterRubrica
                ? "text-amber-700 bg-amber-50 border-amber-200"
                : "text-slate-600 bg-slate-50 border-slate-200"
            }`}
          >
            {isSelectionComplete ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Consulta Ativa
              </>
            ) : filterRubrica ? (
              <>
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" /> Aguardando Necessidade
              </>
            ) : (
              "⚪ Aguardando Filtros"
            )}
          </span>
        </div>
      </div>

      {/* View Tabs & Filters Container */}
      <div className="bg-slate-50/50 p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        {/* View Mode Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-2xl w-fit">
            <button
              onClick={() => setViewMode("planilha")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                viewMode === "planilha"
                  ? "bg-white text-blue-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <Table className="w-4 h-4" />
              <span>📊 Planilha de Produtos</span>
            </button>
            <button
              onClick={() => setViewMode("agrupado")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                viewMode === "agrupado"
                  ? "bg-white text-blue-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <FolderTree className="w-4 h-4" />
              <span>📂 Visão Agrupada</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isSelectionComplete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">
                  {filteredProducts.length} {filteredProducts.length === 1 ? "produto encontrado" : "produtos encontrados"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFilterNecessidade("");
                    setSearchQuery("");
                    setFilterCategoria("TODAS");
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Trocar Necessidade
                </button>
              </div>
            ) : (
              <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl">
                ⚠️ Indique a Rúbrica e a Necessidade para consultar
              </span>
            )}
          </div>
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
          {/* 1. Rubrica (Obrigatória) */}
          <div>
            <label className="block text-[10px] font-black text-blue-900  tracking-widest mb-1 flex items-center gap-1">
              <span className="text-rose-600 font-black">*</span> 1. Rúbrica Orçamental
            </label>
            <select
              value={filterRubrica}
              onChange={(e) => {
                setFilterRubrica(e.target.value);
                setFilterNecessidade("");
              }}
              className={`w-full px-4 py-2.5 bg-white border rounded-xl text-xs font-bold text-gray-800 outline-none transition-all ${
                !filterRubrica
                  ? "border-blue-300 ring-2 ring-blue-100 focus:border-blue-600"
                  : "border-gray-200 focus:border-blue-600"
              }`}
            >
              <option value="">-- Selecione a Rúbrica Orçamental --</option>
              {[...RUBRICAS].sort((a, b) => a.localeCompare(b, "pt-MZ")).map((r, i) => (
                <option key={i} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Necessidade (Obrigatória) */}
          <div>
            <label className="block text-[10px] font-black text-blue-900  tracking-widest mb-1 flex items-center gap-1">
              <span className="text-rose-600 font-black">*</span> 2. Necessidade Pretendida
            </label>
            <select
              value={filterNecessidade}
              onChange={(e) => setFilterNecessidade(e.target.value)}
              disabled={!filterRubrica}
              className={`w-full px-4 py-2.5 bg-white border rounded-xl text-xs font-bold text-gray-800 outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed ${
                filterRubrica && !filterNecessidade
                  ? "border-indigo-400 ring-2 ring-indigo-100 focus:border-indigo-600"
                  : "border-gray-200 focus:border-blue-600"
              }`}
            >
              {!filterRubrica ? (
                <option value="">-- Selecione primeiro a Rúbrica --</option>
              ) : (
                <>
                  <option value="">-- Selecione a Necessidade Pretendida --</option>
                  {availableFilterNecessidades.map((nec, i) => (
                    <option key={i} value={nec}>
                      {nec}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* 3. Search */}
          <div>
            <label className="block text-[10px] font-black text-blue-900  tracking-widest mb-1 flex items-center gap-1">
              <Search className="w-3 h-3" /> 3. Pesquisar Produto
            </label>
            <input
              type="text"
              placeholder={isSelectionComplete ? "Filtrar por nome, especificação..." : "Disponível após selecionar necessidade"}
              value={searchQuery}
              disabled={!isSelectionComplete}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-blue-600 transition-all disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            />
          </div>

          {/* 4. Categoria */}
          <div>
            <label className="block text-[10px] font-black text-blue-900  tracking-widest mb-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> 4. Categoria
            </label>
            <select
              value={filterCategoria}
              disabled={!isSelectionComplete}
              onChange={(e) => setFilterCategoria(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-blue-600 transition-all disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {CATEGORIAS_LIST.map((cat, i) => (
                <option key={i} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Content */}
        {isLoading ? (
          <div className="text-center py-16 space-y-3">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-xs font-bold text-gray-500">A carregar produtos do sistema...</p>
          </div>
        ) : !filterRubrica ? (
          /* ESTADO INICIAL 1: NENHUMA RÚBRICA SELECIONADA */
          <div className="py-12 px-6 text-center bg-gradient-to-b from-slate-50 to-white rounded-3xl border-2 border-dashed border-slate-200 space-y-6">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <Package className="w-8 h-8" />
            </div>
            <div className="max-w-xl mx-auto space-y-2">
              <h3 className="text-lg font-black font-serif text-slate-900">
                Consulta de Gestão de Produtos e Preços
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Para consultar os produtos e respetivos preços, indique a <strong>Rúbrica Orçamental</strong> e a <strong>Necessidade Pretendida</strong> nos seletores acima ou clique diretamente numa das Rúbricas abaixo:
              </p>
            </div>

            {/* Quick-Select Rubricas Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 max-w-5xl mx-auto text-left pt-2">
              {[...RUBRICAS].sort((a, b) => a.localeCompare(b, "pt-MZ")).map((r, i) => {
                const necessidadesCount = getNecessidadesOptions(r).length;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setFilterRubrica(r);
                      setFilterNecessidade("");
                    }}
                    className="p-4 bg-white hover:bg-blue-50/50 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between gap-3 group text-left"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-black  text-blue-600 tracking-wider">
                        Rúbrica
                      </span>
                      <h4 className="text-xs font-black text-slate-900 leading-snug group-hover:text-blue-950">
                        {r}
                      </h4>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-bold">
                      <span>{necessidadesCount} Necessidades</span>
                      <ArrowRight className="w-3.5 h-3.5 text-blue-500 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : !filterNecessidade ? (
          /* ESTADO INICIAL 2: RÚBRICA SELECIONADA, AGUARDANDO NECESSIDADE */
          <div className="py-8 px-6 bg-gradient-to-b from-blue-50/40 to-white rounded-3xl border border-blue-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-sm">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black  tracking-wider text-blue-600 block">
                    Rúbrica Selecionada
                  </span>
                  <h3 className="text-base font-black font-serif text-slate-900">
                    {filterRubrica}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFilterRubrica("");
                  setFilterNecessidade("");
                }}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 transition-all flex items-center gap-1.5 self-start sm:self-auto"
              >
                <X className="w-3.5 h-3.5 text-slate-500" /> Escolher Outra Rúbrica
              </button>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-black  tracking-wider text-slate-700 flex items-center gap-1.5">
                <FolderTree className="w-4 h-4 text-blue-600" /> Selecione a Necessidade Pretendida:
              </h4>
              <p className="text-xs text-slate-500">
                Clique numa necessidade abaixo para carregar imediatamente a planilha de produtos e preços correspondente:
              </p>
            </div>

            {/* Grid de Necessidades da Rúbrica */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {availableFilterNecessidades.map((formattedNec, idx) => {
                const cleanFormatted = formattedNec.replace(/^\d+\s*[-_.]?\s*/, "").trim().toLowerCase();
                const countProds = products.filter((p) => {
                  const pCodeNec = formatNecessidadeWithCode(p.necessidade || "", p.rubrica);
                  const cleanP = (p.necessidade || "").replace(/^\d+\s*[-_.]?\s*/, "").trim().toLowerCase();
                  return (
                    (p.necessidade || "").trim().toLowerCase() === formattedNec.trim().toLowerCase() ||
                    pCodeNec.trim().toLowerCase() === formattedNec.trim().toLowerCase() ||
                    (cleanP && cleanP === cleanFormatted)
                  );
                }).length;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFilterNecessidade(formattedNec)}
                    className="p-4 bg-white hover:bg-blue-600 hover:text-white rounded-2xl text-left border border-slate-200 hover:border-blue-600 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between gap-3 group"
                  >
                    <span className="text-xs font-black leading-snug text-slate-900 group-hover:text-white transition-colors">
                      {formattedNec}
                    </span>
                    <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-100 group-hover:border-white/20 transition-colors">
                      <span className="font-bold text-slate-500 group-hover:text-blue-100">
                        {countProds} {countProds === 1 ? "produto" : "produtos"}
                      </span>
                      <span className="font-black  tracking-wider text-blue-600 group-hover:text-white flex items-center gap-1">
                        Carregar <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : viewMode === "planilha" ? (
          /* ESTADO 3: RÚBRICA E NECESSIDADE SELECIONADAS - PLANILHA GERAL TABLE */
          <div className="space-y-4">
            {/* Banner Ativo de Rúbrica & Necessidade */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/30 border border-blue-400/40 rounded-xl">
                  <FolderTree className="w-5 h-5 text-blue-200" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black  tracking-wider bg-blue-400/20 text-blue-200 px-2 py-0.5 rounded-md">
                      {filterRubrica}
                    </span>
                    <span className="text-xs font-bold text-emerald-300">
                      • {filteredProducts.length} {filteredProducts.length === 1 ? "produto" : "produtos"}
                    </span>
                  </div>
                  <h4 className="text-sm font-black font-serif text-white mt-1">
                    {filterNecessidade}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setNewProduct({
                      nome: "",
                      preco: 0,
                      unidade: "Unidade",
                      especificacao: "",
                      rubrica: filterRubrica,
                      necessidade: filterNecessidade,
                      quantidade: 1,
                    });
                    setIsAddingNew(true);
                  }}
                  className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-xs tracking-wider transition-all shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Produto Nesta Necessidade</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterNecessidade("");
                    setSearchQuery("");
                  }}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs border border-white/20 transition-all flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Trocar
                </button>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-3">
                <Inbox className="w-10 h-10 text-gray-400 mx-auto" />
                <p className="text-xs font-bold text-gray-600">
                  Nenhum produto cadastrado para esta necessidade com os filtros aplicados.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => {
                      setNewProduct({
                        nome: "",
                        preco: 0,
                        unidade: "Unidade",
                        especificacao: "",
                        rubrica: filterRubrica,
                        necessidade: filterNecessidade,
                        quantidade: 1,
                      });
                      setIsAddingNew(true);
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 shadow-sm flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Registar Primeiro Produto
                  </button>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-black hover:bg-blue-100"
                    >
                      Limpar Pesquisa
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[10px] font-black  tracking-wider">
                      <th className="px-4 py-3.5 w-12 text-center">#</th>
                      <th className="px-4 py-3.5">Categoria</th>
                      <th className="px-4 py-3.5">Rúbrica Orçamental</th>
                      <th className="px-4 py-3.5">Necessidade Específica</th>
                      <th className="px-4 py-3.5">Nome do Produto (Único)</th>
                      <th className="px-4 py-3.5 text-right">Preço Unificado (MZN)</th>
                      <th className="px-4 py-3.5">Unidade</th>
                      <th className="px-4 py-3.5">Especificação Técnica</th>
                      <th className="px-4 py-3.5 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white text-xs">
                    {filteredProducts.map((p, idx) => {
                      const catName = p.categoria || getCategoryForRubricaOrNecessidade(p.rubrica, p.necessidade);
                      return (
                        <tr
                          key={p.id || idx}
                          className="hover:bg-blue-50/30 transition-colors group"
                        >
                          <td className="px-4 py-3 text-center text-gray-400 font-mono text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-800 border border-slate-200 inline-block">
                              {catName}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-800">
                            {p.rubrica || "Bens - 121"}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-600">
                            {formatNecessidadeWithCode(p.necessidade || "Geral", p.rubrica)}
                          </td>
                          <td className="px-4 py-3 font-black text-blue-950 font-serif">
                            {p.nome}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-black text-blue-700 whitespace-nowrap bg-blue-50/30">
                            {Number(p.preco || 0).toLocaleString("pt-MZ", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            MZN
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-600">
                            {p.unidade || "Unidade"}
                          </td>
                          <td className="px-4 py-3 text-gray-500 max-w-xs truncate" title={p.especificacao}>
                            {p.especificacao || "—"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5 opacity-90 group-hover:opacity-100">
                              <button
                                onClick={() => setEditingProduct({ ...p, _originalNome: p.nome })}
                                className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg transition-all border border-blue-200"
                                title="Editar Preço e Dados do Produto"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.nome)}
                                className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white rounded-lg transition-all border border-rose-200"
                                title="Excluir Produto Único"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* ESTADO 3: RÚBRICA SELECIONADA - VISÃO AGRUPADA POR TODAS AS NECESSIDADES */
          <div className="space-y-10">
            {/* Directório Interativo de Grupos de Necessidades (Resumo) */}
            <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4 shadow-lg border border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-blue-400" />
                  <h3 className="text-sm font-black text-white font-serif tracking-wide">
                    Divisão por Necessidades — Rúbrica: {filterRubrica}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setFilterRubrica("");
                      setFilterNecessidade("");
                    }}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black  tracking-wider transition-all flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Trocar Rúbrica
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {availableFilterNecessidades.map((formattedNec, idx) => {
                  const prods = groupedByNecessidade[formattedNec] || [];
                  const hasProducts = prods.length > 0;

                  return (
                    <a
                      key={idx}
                      href={`#nec-${idx}`}
                      className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between gap-1 group ${
                        hasProducts
                          ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-blue-500/50"
                          : "bg-slate-900/50 text-slate-500 border-slate-800/50 opacity-60"
                      }`}
                    >
                      <span className="text-[10px] font-bold leading-tight group-hover:text-white truncate">
                        {formattedNec}
                      </span>
                      <span className={`text-[9px] font-black  ${hasProducts ? "text-blue-400" : "text-slate-600"}`}>
                        {prods.length} {prods.length === 1 ? "item" : "itens"}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Listagem Completa Separada por Necessidade */}
            <div className="space-y-12">
              {availableFilterNecessidades.map((nec, idx) => {
                const prods = groupedByNecessidade[nec] || [];
                const hasProducts = prods.length > 0;

                return (
                  <div 
                    key={idx} 
                    id={`nec-${idx}`}
                    className={`scroll-mt-24 space-y-4 transition-all ${!hasProducts ? "opacity-70" : ""}`}
                  >
                    <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border-2 transition-all ${
                      hasProducts 
                        ? "bg-white border-blue-50 shadow-sm" 
                        : "bg-gray-50/50 border-dashed border-gray-200"
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${hasProducts ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "bg-gray-200 text-gray-400"}`}>
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900 font-serif flex items-center gap-2">
                            {nec}
                            {!hasProducts && (
                              <span className="text-[8px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-black ">Vazio</span>
                            )}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-bold  tracking-wider">
                            Necessidade Orçamental
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl border shadow-sm ${
                          hasProducts 
                            ? "bg-blue-50 text-blue-700 border-blue-200" 
                            : "bg-white text-gray-400 border-gray-200"
                        }`}>
                          {hasProducts ? `${prods.length} PRODUTOS REGISTADOS` : "SEM PRODUTOS — VAZIO"}
                        </span>
                        <button
                          onClick={() => {
                            setNewProduct({
                              nome: "",
                              preco: 0,
                              unidade: "Unidade",
                              especificacao: "",
                              rubrica: filterRubrica,
                              necessidade: nec,
                              quantidade: 1,
                            });
                            setIsAddingNew(true);
                          }}
                          className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-xl border border-emerald-200 transition-all flex items-center gap-2 group shadow-sm"
                          title="Adicionar produto nesta necessidade"
                        >
                          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                          <span className="text-[10px] font-black  tracking-widest hidden sm:inline">Novo</span>
                        </button>
                      </div>
                    </div>

                    {!hasProducts ? (
                      <div className="bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-[2rem] py-8 text-center space-y-2">
                        <Inbox className="w-8 h-8 text-gray-300 mx-auto" />
                        <p className="text-xs font-bold text-gray-400">
                          Nenhum produto cadastrado para esta necessidade.
                        </p>
                        <button
                          onClick={() => {
                            setNewProduct({
                              nome: "",
                              preco: 0,
                              unidade: "Unidade",
                              especificacao: "",
                              rubrica: filterRubrica,
                              necessidade: nec,
                              quantidade: 1,
                            });
                            setIsAddingNew(true);
                          }}
                          className="text-[10px] font-black text-emerald-600 hover:text-emerald-700  tracking-widest bg-white px-4 py-2 rounded-xl border border-emerald-100 shadow-sm"
                        >
                          + Registar Primeiro Produto
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {prods.map((p, pIdx) => (
                          <div 
                            key={pIdx}
                            className="bg-white border border-slate-200 rounded-[1.5rem] p-4 hover:shadow-lg transition-all group flex flex-col justify-between"
                          >
                            <div className="space-y-2">
                              <div className="flex justify-between items-start gap-2">
                                <h5 className="text-xs font-black text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2 leading-tight">
                                  {p.nome}
                                </h5>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => setEditingProduct({ ...p, _originalNome: p.nome })}
                                    className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(p.nome)}
                                    className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-[10px] text-slate-500 line-clamp-2 italic leading-relaxed">
                                {p.especificacao || "Sem especificações adicionais."}
                              </p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                              <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-400  tracking-wider">Preço Unitário</span>
                                <span className="text-sm font-black text-blue-700 font-mono">
                                  {Number(p.preco || 0).toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN
                                </span>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-[9px] font-black text-slate-400  tracking-wider">Unidade</span>
                                <span className="text-[11px] font-bold text-slate-700">{p.unidade}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* EDIT MODAL - Passo VII Layout */}
      {editingProduct && (
        <ProductFormPassoVIIModal
          title="Atualizar & Substituir Produto na Base de Dados"
          submitLabel="Substituir na Base de Dados"
          productState={editingProduct}
          setProductState={setEditingProduct}
          onSubmit={handleSaveEdit}
          onCancel={() => setEditingProduct(null)}
          isNew={false}
          error={modalError}
        />
      )}

      {/* NEW PRODUCT MODAL - Passo VII Layout */}
      {isAddingNew && (
        <ProductFormPassoVIIModal
          title="Registar Novo Produto Único na Gestão de Preços"
          submitLabel="Registar na Base de Dados"
          productState={newProduct}
          setProductState={setNewProduct}
          onSubmit={handleAddNew}
          onCancel={() => setIsAddingNew(false)}
          isNew={true}
          error={modalError}
        />
      )}
    </div>
  );
}

interface ProductFormPassoVIIProps {
  title: string;
  submitLabel: string;
  productState: any;
  setProductState: (val: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isNew?: boolean;
  error?: string | null;
}

function ProductFormPassoVIIModal({
  title,
  submitLabel,
  productState,
  setProductState,
  onSubmit,
  onCancel,
  isNew = false,
  error = null,
}: ProductFormPassoVIIProps) {
  const cleanKey = (productState.necessidade || "").replace(/^\d+\s*-\s*/, "").trim();
  const catalogProducts = PRODUTOS_POR_NECESSIDADE[cleanKey] || [];
  const [selectedTituloComum, setSelectedTituloComum] = useState("");
  const subRefsDisponiveis = selectedTituloComum ? SUB_REFERENCIAS_PRODUTOS[selectedTituloComum] || [] : [];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-6xl w-full p-6 md:p-8 space-y-6 border border-gray-100 my-8">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-blue-600"></span>
            <h3 className="text-base font-black text-blue-950 font-serif">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {error && (
            <div className="bg-rose-50 text-rose-700 border border-rose-200 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
              <span className="text-sm">⚠️</span>
              <div>{error}</div>
            </div>
          )}
          {/* Título Comum e Subdropdown Condicional de Capacidade/Modelo */}
          <div className="bg-blue-50/80 p-4 rounded-2xl border border-blue-200/60 space-y-3">
            <label className="block text-[10px] font-black text-[#1e3a8a]  tracking-widest flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              SELEÇÃO POR TÍTULO COMUM E CAPACIDADE/MODELO (EX: FLASH USB, COMPUTADOR, TONER)
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
                  className="w-full px-3 py-2 bg-white border border-blue-900/20 rounded-xl text-xs font-bold text-blue-950 outline-none focus:border-blue-900 shadow-sm"
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
                    setProductState({
                      ...productState,
                      nome: refName,
                      especificacao: `${selectedTituloComum} - ${refName}`,
                    });
                  }}
                  className={`w-full px-3 py-2 border rounded-xl text-xs font-bold outline-none shadow-sm transition-all ${
                    !selectedTituloComum 
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                      : 'bg-white text-slate-800 border-blue-900/20 focus:border-blue-900'
                  }`}
                  value={productState.nome || ""}
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
              💡 Passo 1: Indique o título comum (ex: Flash Drive). Passo 2: O campo abre/ativa para selecionar a capacidade e modelo exato.
            </p>
          </div>

          {/* Section 1: RÚBRICA & NECESSIDADE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/70 p-5 rounded-2xl border border-gray-200/80">
            <div>
              <label className="block text-[10px] font-black text-[#1e3a8a]  tracking-widest mb-1.5">
                RÚBRICA ORÇAMENTAL
              </label>
              {isNew ? (
                <input
                  type="text"
                  required
                  value={productState.rubrica || ""}
                  onChange={(e) =>
                    setProductState({ ...productState, rubrica: e.target.value })
                  }
                  placeholder="Ex: Bens - 121"
                  className="w-full px-4 py-3 bg-white border border-blue-900/15 rounded-2xl text-[13px] font-bold text-slate-800 outline-none focus:border-blue-900 shadow-sm"
                />
              ) : (
                <select
                  value={productState.rubrica || RUBRICAS[0]}
                  onChange={(e) => {
                    const r = e.target.value;
                    const necs = getNecessidadesOptions(r);
                    setProductState({
                      ...productState,
                      rubrica: r,
                      necessidade: necs[0] || "",
                    });
                  }}
                  className="w-full px-4 py-3 bg-white border border-blue-900/15 rounded-2xl text-[13px] font-bold text-slate-800 outline-none focus:border-blue-900 shadow-sm"
                >
                  {RUBRICAS.map((r, i) => (
                    <option key={i} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black text-[#1e3a8a]  tracking-widest mb-1.5">
                NECESSIDADE ESPECÍFICA
              </label>
              {isNew ? (
                <input
                  type="text"
                  required
                  value={productState.necessidade || ""}
                  onChange={(e) =>
                    setProductState({ ...productState, necessidade: e.target.value })
                  }
                  placeholder="Ex: Material de escritório"
                  className="w-full px-4 py-3 bg-white border border-blue-900/15 rounded-2xl text-[13px] font-bold text-slate-800 outline-none focus:border-blue-900 shadow-sm"
                />
              ) : (
                <select
                  value={productState.necessidade || ""}
                  onChange={(e) =>
                    setProductState({
                      ...productState,
                      necessidade: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-white border border-blue-900/15 rounded-2xl text-[13px] font-bold text-slate-800 outline-none focus:border-blue-900 shadow-sm"
                >
                  {getNecessidadesOptions(productState.rubrica).map((nec, i) => (
                    <option key={i} value={nec}>
                      {formatNecessidadeWithCode(nec, productState.rubrica)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Section 2: BLOCO DE PRODUTO */}
          <div className="bg-[#f8fafc]/90 p-6 rounded-[28px] border border-slate-200/60 shadow-sm backdrop-blur-sm">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* Coluna 1: SELEÇÃO DE PRODUTO/SERVIÇO (Gestão de Preços) - Apenas em Edição */}
              {!isNew && (
                <div className="xl:col-span-3 space-y-2.5">
                  <label className="block text-[10px] font-black text-[#1e3a8a]  tracking-widest flex items-center gap-1.5 mb-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                    $ SELEÇÃO DE PRODUTO/SERVIÇO (GESTÃO DE PREÇOS)
                  </label>
                  <div className="space-y-2.5">
                    <select
                      value={
                        catalogProducts.some((p) => p.nome === productState.nome)
                          ? productState.nome
                          : productState.nome
                          ? "__custom__"
                          : ""
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "__custom__") return;
                        const selected = catalogProducts.find((p) => p.nome === val);
                        if (selected) {
                          setProductState({
                            ...productState,
                            nome: selected.nome,
                            preco: Number(selected.preco) || 0,
                            unidade: selected.unidade || "Unidade",
                            especificacao: selected.especificacao || "",
                          });
                        }
                      }}
                      className="w-full px-4 py-3 bg-white border border-blue-900/15 rounded-2xl text-[13px] font-bold text-slate-800 outline-none focus:border-blue-900 transition-all shadow-sm appearance-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%231e3a8a' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: "right 1rem center",
                        backgroundRepeat: "no-repeat",
                        backgroundSize: "1em 1em",
                      }}
                    >
                      <option value="">Selecione o produto...</option>
                      {catalogProducts.map((p, idx) => (
                        <option key={idx} value={p.nome}>{p.nome}</option>
                      ))}
                      <option value="__custom__">
                        Outro produto personalizado (Digitar abaixo)
                      </option>
                    </select>

                    <input
                      type="text"
                      value={productState.nome || ""}
                      placeholder="Ou digite o nome do produto..."
                      onChange={(e) =>
                        setProductState({ ...productState, nome: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white border border-blue-900/15 rounded-2xl text-[13px] font-bold text-slate-800 outline-none focus:border-blue-900 transition-all shadow-sm"
                    />
                  </div>
                  <p className="text-[9px] text-blue-800/60 italic leading-tight mt-1.5 flex items-center gap-1">
                    💡 Apenas produtos registados na Gestão de Produtos são listados aqui.
                  </p>
                </div>
              )}

              {/* Coluna 2: DETALHES / UNIDADE */}
              <div className={isNew ? "xl:col-span-3 space-y-2.5" : "xl:col-span-1 space-y-2.5"}>
                <label className="block text-[10px] font-black text-[#1e3a8a]  tracking-widest mb-1.5">
                  DETALHES / UNIDADE
                </label>
                {isNew ? (
                  <input
                    type="text"
                    required
                    value={productState.unidade || ""}
                    placeholder="Ex: Unidade, Kg, Caixa..."
                    onChange={(e) =>
                      setProductState({ ...productState, unidade: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white border border-blue-900/15 rounded-2xl text-[13px] font-bold text-slate-800 outline-none focus:border-blue-900 shadow-sm"
                  />
                ) : (
                  <select
                    value={productState.unidade || "Unidade"}
                    onChange={(e) =>
                      setProductState({ ...productState, unidade: e.target.value })
                    }
                    className="w-full px-3 py-3 bg-white border border-blue-900/15 rounded-2xl text-[13px] font-bold text-slate-700 outline-none focus:border-blue-900 transition-all shadow-sm appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%231e3a8a' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: "right 0.8rem center",
                      backgroundRepeat: "no-repeat",
                      backgroundSize: "0.9em 0.9em",
                    }}
                  >
                    {[
                      "Unidade",
                      "Lote",
                      "Global",
                      "Kit",
                      "Mês",
                      "Trimestre",
                      "Ano",
                      "Kg",
                      "Litro",
                      "Metro",
                      "Resma",
                      "Caixa",
                      "Pacote",
                    ].map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Coluna 3: DESCRIÇÃO / ESPECIFICAÇÃO */}
              <div className={isNew ? "xl:col-span-4 space-y-2.5" : "xl:col-span-4 space-y-2.5"}>
                <label className="block text-[10px] font-black text-[#1e3a8a]  tracking-widest mb-1.5">
                  DESCRIÇÃO / ESPECIFICAÇÃO
                </label>
                <textarea
                  value={productState.especificacao || ""}
                  placeholder="Descrição detalhada..."
                  onChange={(e) =>
                    setProductState({
                      ...productState,
                      especificacao: e.target.value,
                    })
                  }
                  className="w-full p-4 bg-white border border-blue-900/10 rounded-2xl min-h-[110px] text-[12px] font-bold text-slate-700 leading-relaxed shadow-sm outline-none focus:border-blue-900 transition-all"
                />
              </div>

              {/* Coluna 4: NOME DO PRODUTO & QUANTIDADE */}
              <div className={isNew ? "xl:col-span-3 space-y-4" : "xl:col-span-2 space-y-4"}>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-[#1e3a8a]  tracking-widest mb-1">
                    NOME DO PRODUTO
                  </label>
                  <input
                    type="text"
                    required
                    value={productState.nome || ""}
                    placeholder="Nome do produto..."
                    onChange={(e) =>
                      setProductState({ ...productState, nome: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white border border-blue-900/15 rounded-2xl text-[13px] font-bold text-slate-800 outline-none focus:border-blue-900 shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-[#1e3a8a]  tracking-widest mb-1">
                    QUANTIDADE
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={productState.quantidade || 1}
                    onChange={(e) =>
                      setProductState({
                        ...productState,
                        quantidade: Math.max(1, Number(e.target.value)),
                      })
                    }
                    className="w-full px-4 py-3 bg-white border border-blue-900/15 rounded-2xl text-[13px] font-bold text-slate-800 outline-none focus:border-blue-900 shadow-sm"
                  />
                </div>
              </div>

              {/* Coluna 5: PREÇO UNITARIO & TOTAL EM MZN */}
              <div className="xl:col-span-2 grid grid-cols-1 gap-4 bg-white/60 p-5 rounded-[24px] border border-blue-900/10 items-end shadow-sm">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-[#1e3a8a]  tracking-widest mb-1">
                    PREÇO UNITARIO (MZN)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productState.preco ?? ""}
                    onChange={(e) =>
                      setProductState({
                        ...productState,
                        preco: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-3 bg-white border border-blue-900/15 rounded-2xl text-[13px] font-bold text-slate-800 outline-none focus:border-blue-900 shadow-sm font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-[#1e3a8a]  tracking-widest mb-1">
                    TOTAL EM MZN
                  </label>
                  <div className="bg-[#edf5ff] p-3 rounded-2xl text-center border border-blue-100 font-mono font-black text-blue-900 text-sm shadow-inner">
                    {(
                      (productState.quantidade || 1) *
                      (Number(productState.preco) || 0)
                    ).toLocaleString("pt-MZ", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    MZN
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Submit Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl text-xs font-bold hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-blue-900 hover:bg-blue-950 text-white rounded-2xl text-xs font-black tracking-widest transition-all shadow-lg shadow-blue-900/20"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

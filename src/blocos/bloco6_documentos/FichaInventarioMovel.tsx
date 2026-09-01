import { printElementById } from "../../lib/printUtils";
import React from "react";
import { motion } from "motion/react";
import {
  X,
  Printer,
  Save,
  FileText,
  MapPin,
  Package,
  Info,
  History,
  ArrowRightLeft,
  Upload,
  Paperclip,
  Trash2,
} from "lucide-react";
import SignatureUpload from "../bloco5_sistema/SignatureUpload";

interface FichaInventarioMovelProps {
  onCancel: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  user?: any;
  isReadOnly?: boolean;
}

const FichaInventarioMovel: React.FC<FichaInventarioMovelProps> = ({
  onCancel,
  onSubmit,
  initialData,
  user,
  isReadOnly = false,
}) => {
  const [anexos, setAnexos] = React.useState<any[]>(initialData?.anexos || []);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [formData, setFormData] = React.useState({
    // Secção 1
    numeroOrdem: initialData?.numeroOrdem || "",
    data: initialData?.data || new Date().toISOString().split("T")[0],
    ugeCodigo: initialData?.ugeCodigo || "",
    ugeDesignacao: initialData?.ugeDesignacao || "",
    ugbDesignacao: initialData?.ugbDesignacao || "",
    sector: initialData?.sector || initialData?.setor || "",
    sectorCodigo: initialData?.sectorCodigo || "",
    provincia: initialData?.provincia || "Maputo",
    distrito: initialData?.distrito || "",
    postoAdministrativo: initialData?.postoAdministrativo || "",
    localidade: initialData?.localidade || "",
    bairro: initialData?.bairro || "",
    endereco: initialData?.endereco || "",
    classificadorTerritorial: initialData?.classificadorTerritorial || "",

    // Secção 2
    codigoBem: initialData?.codigoBem || initialData?.id || "",
    designacaoBem: initialData?.designacaoBem || initialData?.nome || "",
    marca: initialData?.marca || "",
    numeroSerie: initialData?.numeroSerie || "",
    nip: initialData?.nip || "",
    modelo: initialData?.modelo || "",
    comprimento: initialData?.comprimento || "",
    largura: initialData?.largura || "",
    altura: initialData?.altura || "",
    cor: initialData?.cor || "",
    materialPredominante: initialData?.materialPredominante || "",
    formaAquisicao: initialData?.formaAquisicao || "",
    aquisicaoEstado: initialData?.aquisicaoEstado || "Novo",
    estadoConservacao: initialData?.estadoConservacao || "Bom",
    codigoAquisicao: initialData?.codigoAquisicao || "",
    dataAquisicao: initialData?.dataAquisicao || "",
    valorAquisicao: initialData?.valorAquisicao || "",
    valorExtenso: initialData?.valorExtenso || "",

    // Secção 3
    fornecedor: initialData?.fornecedor || "",
    nuit: initialData?.nuit || "",
    fornecedorEndereco: initialData?.fornecedorEndereco || "",
    fornecedorCidade: initialData?.fornecedorCidade || "",
    tipoComprovativo: initialData?.tipoComprovativo || "",
    numeroComprovativo: initialData?.numeroComprovativo || "",
    dataComprovativo: initialData?.dataComprovativo || "",
    assistenciaTecnica: initialData?.assistenciaTecnica || "Nao",
    garantia: initialData?.garantia || "",
    utilizador: initialData?.utilizador || user?.name || "",
    observacoes: initialData?.observacoes || "",
    preenchidoPor: initialData?.preenchidoPor || user?.name || "",
    responsavel: initialData?.responsavel || "",

    // Meta
    utilizadorNome: initialData?.utilizadorNome || user?.name || "Sistema",
    utilizadorEmail: initialData?.utilizadorEmail || user?.email || "",
    bemId: initialData?.bemId || initialData?.id || null,
    tipoFicha: "Móvel",

    // Secção 4 (Abate)
    abateAutoVerificacao: initialData?.abateAutoVerificacao || "",
    abateDataDespacho: initialData?.abateDataDespacho || "",
    abateValorResidual: initialData?.abateValorResidual || "",
    abateData: initialData?.abateData || "",
    abateEntidade: initialData?.abateEntidade || "",
    abateDestino: initialData?.abateDestino || "",
    abateMotivo: initialData?.abateMotivo || "",
    abateReferenciaEntrega: initialData?.abateReferenciaEntrega || "",
    abateCausa: initialData?.abateCausa || "",

    // Assinaturas
    assinaturaPreenchidoPor: initialData?.assinaturaPreenchidoPor || "",
    assinaturaResponsavel: initialData?.assinaturaResponsavel || "",

    // Secção 5 (Transferência)
    transfReferencia: initialData?.transfReferencia || "",
    transfDataDespacho: initialData?.transfDataDespacho || "",
    transfEntidade: initialData?.transfEntidade || "",
    transfMotivo: initialData?.transfMotivo || "",
    transfDestino: initialData?.transfDestino || "",
    transfValorResidual: initialData?.transfValorResidual || "",
    transfValorExtenso: initialData?.transfValorExtenso || "",
    transfCusto: initialData?.transfCusto || "",
    transfCustoExtenso: initialData?.transfCustoExtenso || "",
    transfRefEntrega: initialData?.transfRefEntrega || "",
    transfDataRecepcao: initialData?.transfDataRecepcao || "",
    transfFuncionario: initialData?.transfFuncionario || "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newAnexos = Array.from(files).map((file: File) => ({
        nome: file.name,
        tamanho: (file.size / 1024).toFixed(2) + " Kb",
        tipo: file.type,
        data: new Date().toLocaleDateString(),
      }));
      setAnexos((prev) => [...prev, ...newAnexos]);
    }
  };

  const removeAnexo = (index: number) => {
    setAnexos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLocalSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({ ...formData, anexos });
      setIsSubmitted(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    printElementById("print-area");
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
              <FileText size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-2">
              Móvel Registado!
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              A ficha de inventário para{" "}
              <span className="font-bold text-slate-900">
                {formData.designacaoBem}
              </span>{" "}
              foi submetida com sucesso. Pode agora descarregar o PDF oficial.
            </p>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={handlePrint}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-[10px] tracking-[0.2em] hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-2"
              >
                <Printer size={18} /> Descarregar / Imprimir Ficha
              </button>
              <button
                onClick={onCancel}
                className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-[10px] tracking-[0.2em] hover:bg-slate-200 transition-all"
              >
                Fechar e Voltar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden border border-slate-200 mb-12 print:shadow-none print:border-none print:m-0"
      >
        {/* Header Form */}
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center print:bg-white print:text-black print:border-b print:p-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-3 rounded-2xl print:hidden">
              <FileText className="text-blue-400" size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Ministério Das Finanças
              </h2>
              <p className="text-xs text-slate-400 font-bold tracking-widest print:text-slate-600">
                Direcção Nacional do Património do Estado
              </p>
            </div>
          </div>
          <div className="flex gap-3 print:hidden">
            <button
              onClick={handlePrint}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all flex items-center gap-2 text-sm font-bold"
            >
              <Printer size={18} /> Imprimir FIM
            </button>
          </div>
          <div className="hidden print:block text-right">
            <div className="text-sm font-bold border-2 border-black p-4 inline-block rounded-lg">
              Etiqueta
            </div>
            <div className="text-[10px] font-bold mt-1">MIP 01</div>
          </div>
        </div>

        <div className="p-8 space-y-8 print:p-4">
          <fieldset
            disabled={isReadOnly}
            className="border-none p-0 m-0 w-full min-w-0 space-y-8"
          >
            <div className="text-center">
              <h1 className="text-2xl font-black text-slate-900">
                Ficha de Inventário Para Móveis (FIM)
              </h1>
            </div>

            {/* SECÇÃO 1 */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-900">
                <MapPin size={20} className="text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Secção 1 - Entidade utilizadora / Localização institucional e
                  geográfica
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">
                    Número de Ordem
                  </label>
                  <input
                    name="numeroOrdem"
                    value={formData.numeroOrdem}
                    onChange={handleChange}
                    className="w-full p-2 bg-slate-50 border rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">
                    Data
                  </label>
                  <input
                    type="date"
                    name="data"
                    value={formData.data}
                    onChange={handleChange}
                    className="w-full p-2 bg-slate-50 border rounded-lg text-sm"
                  />
                </div>
                <div className="md:col-span-1 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">
                    Código UGE
                  </label>
                  <input
                    name="ugeCodigo"
                    value={formData.ugeCodigo}
                    onChange={handleChange}
                    className="w-full p-2 bg-slate-50 border rounded-lg text-sm"
                  />
                </div>
                <div className="md:col-span-1 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">
                    Designação UGE
                  </label>
                  <input
                    name="ugeDesignacao"
                    value={formData.ugeDesignacao}
                    onChange={handleChange}
                    className="w-full p-2 bg-slate-50 border rounded-lg text-sm"
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">
                    Designação UGB
                  </label>
                  <input
                    name="ugbDesignacao"
                    value={formData.ugbDesignacao}
                    onChange={handleChange}
                    className="w-full p-2 bg-slate-50 border rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">
                    Sector que utiliza o bem
                  </label>
                  <input
                    name="sector"
                    value={formData.sector}
                    onChange={handleChange}
                    className="w-full p-2 bg-slate-50 border rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">
                    Código Sector
                  </label>
                  <input
                    name="sectorCodigo"
                    value={formData.sectorCodigo}
                    onChange={handleChange}
                    className="w-full p-2 bg-slate-50 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-blue-900">
                    Província
                  </label>
                  <input
                    name="provincia"
                    value={formData.provincia}
                    onChange={handleChange}
                    className="w-full p-2 bg-white border rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-blue-900">
                    Distrito/Urbano
                  </label>
                  <input
                    name="distrito"
                    value={formData.distrito}
                    onChange={handleChange}
                    className="w-full p-2 bg-white border rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-blue-900">
                    Posto Administrativo
                  </label>
                  <input
                    name="postoAdministrativo"
                    value={formData.postoAdministrativo}
                    onChange={handleChange}
                    className="w-full p-2 bg-white border rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-blue-900">
                    Localidade
                  </label>
                  <input
                    name="localidade"
                    value={formData.localidade}
                    onChange={handleChange}
                    className="w-full p-2 bg-white border rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-blue-900">
                    Bairro
                  </label>
                  <input
                    name="bairro"
                    value={formData.bairro}
                    onChange={handleChange}
                    className="w-full p-2 bg-white border rounded-lg text-sm"
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-blue-900">
                    Endereço
                  </label>
                  <input
                    name="endereco"
                    value={formData.endereco}
                    onChange={handleChange}
                    className="w-full p-2 bg-white border rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-blue-900">
                    Classificador Territorial
                  </label>
                  <input
                    name="classificadorTerritorial"
                    value={formData.classificadorTerritorial}
                    onChange={handleChange}
                    className="w-full p-2 bg-white border rounded-lg text-sm"
                  />
                </div>
              </div>
            </section>

            {/* SECÇÃO 2 */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-900">
                <Package size={20} className="text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Secção 2 - Identificação e caracterização do bem - móvel
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">
                    Código
                  </label>
                  <input
                    name="codigoBem"
                    value={formData.codigoBem}
                    onChange={handleChange}
                    className="w-full p-2 bg-slate-50 border rounded-lg text-sm font-mono"
                  />
                </div>
                <div className="md:col-span-3 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">
                    Designação
                  </label>
                  <input
                    name="designacaoBem"
                    value={formData.designacaoBem}
                    onChange={handleChange}
                    className="w-full p-2 bg-slate-50 border rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">
                    Marca
                  </label>
                  <input
                    name="marca"
                    value={formData.marca}
                    onChange={handleChange}
                    className="w-full p-2 bg-slate-50 border rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">
                    Número de Série
                  </label>
                  <input
                    name="numeroSerie"
                    value={formData.numeroSerie}
                    onChange={handleChange}
                    className="w-full p-2 bg-slate-50 border rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">
                    Nip
                  </label>
                  <input
                    name="nip"
                    value={formData.nip}
                    onChange={handleChange}
                    className="w-full p-2 bg-slate-50 border rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">
                    Modelo
                  </label>
                  <input
                    name="modelo"
                    value={formData.modelo}
                    onChange={handleChange}
                    className="w-full p-2 bg-slate-50 border rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1 text-center">
                  <label className="text-[10px] font-bold text-slate-500 block mb-2">
                    Aquisição em Estado
                  </label>
                  <div className="flex justify-center gap-4">
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="radio"
                        name="aquisicaoEstado"
                        value="Novo"
                        disabled={isReadOnly}
                        checked={formData.aquisicaoEstado === "Novo"}
                        onChange={handleChange}
                      />{" "}
                      Novo
                    </label>
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="radio"
                        name="aquisicaoEstado"
                        value="Usado"
                        disabled={isReadOnly}
                        checked={formData.aquisicaoEstado === "Usado"}
                        onChange={handleChange}
                      />{" "}
                      Usado
                    </label>
                  </div>
                </div>
                <div className="md:col-span-2 space-y-1 text-center">
                  <label className="text-[10px] font-bold text-slate-500 block mb-2">
                    Estado de Conservação
                  </label>
                  <div className="flex justify-center gap-6">
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="radio"
                        name="estadoConservacao"
                        value="MBom"
                        disabled={isReadOnly}
                        checked={formData.estadoConservacao === "MBom"}
                        onChange={handleChange}
                      />{" "}
                      MBom
                    </label>
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="radio"
                        name="estadoConservacao"
                        value="Bom"
                        disabled={isReadOnly}
                        checked={formData.estadoConservacao === "Bom"}
                        onChange={handleChange}
                      />{" "}
                      Bom
                    </label>
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="radio"
                        name="estadoConservacao"
                        value="Mau"
                        disabled={isReadOnly}
                        checked={formData.estadoConservacao === "Mau"}
                        onChange={handleChange}
                      />{" "}
                      Mau
                    </label>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">
                    Dimensões (CxLxA em metros)
                  </label>
                  <div className="flex gap-1">
                    <input
                      name="comprimento"
                      placeholder="C"
                      value={formData.comprimento}
                      onChange={handleChange}
                      className="w-full p-2 bg-slate-50 border rounded-lg text-sm"
                    />
                    <input
                      name="largura"
                      placeholder="L"
                      value={formData.largura}
                      onChange={handleChange}
                      className="w-full p-2 bg-slate-50 border rounded-lg text-sm"
                    />
                    <input
                      name="altura"
                      placeholder="A"
                      value={formData.altura}
                      onChange={handleChange}
                      className="w-full p-2 bg-slate-50 border rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">
                    Cor
                  </label>
                  <input
                    name="cor"
                    value={formData.cor}
                    onChange={handleChange}
                    className="w-full p-2 bg-slate-50 border rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">
                    Material Predominante
                  </label>
                  <input
                    name="materialPredominante"
                    value={formData.materialPredominante}
                    onChange={handleChange}
                    className="w-full p-2 bg-slate-50 border rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">
                    Forma de Aquisição
                  </label>
                  <input
                    name="formaAquisicao"
                    value={formData.formaAquisicao}
                    onChange={handleChange}
                    className="w-full p-2 bg-slate-50 border rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">
                    Data de Aquisição
                  </label>
                  <input
                    type="date"
                    name="dataAquisicao"
                    value={formData.dataAquisicao}
                    onChange={handleChange}
                    className="w-full p-2 bg-slate-50 border rounded-lg text-sm"
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">
                    Valor de Aquisição / Avaliação (Mt)
                  </label>
                  <input
                    name="valorAquisicao"
                    placeholder="0,00"
                    value={formData.valorAquisicao}
                    onChange={handleChange}
                    className="w-full p-2 bg-slate-50 border rounded-lg text-sm font-bold text-emerald-700"
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">
                    Valor por extenso
                  </label>
                  <input
                    name="valorExtenso"
                    value={formData.valorExtenso}
                    onChange={handleChange}
                    className="w-full p-2 bg-slate-50 border rounded-lg text-sm italic"
                  />
                </div>
              </div>
            </section>

            {/* SECÇÃO 3 */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-900">
                <Info size={20} className="text-purple-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Secção 3 - Outras informações
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">
                    Nome da Empresa / Entidade Fornecedora
                  </label>
                  <input
                    name="fornecedor"
                    value={formData.fornecedor}
                    onChange={handleChange}
                    className="w-full p-2 bg-slate-50 border rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">
                    NUIT
                  </label>
                  <input
                    name="nuit"
                    value={formData.nuit}
                    onChange={handleChange}
                    className="w-full p-2 bg-slate-50 border rounded-lg text-sm font-mono"
                  />
                </div>
                <div className="md:col-span-3 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">
                    Endereço Fornecedor
                  </label>
                  <input
                    name="fornecedorEndereco"
                    value={formData.fornecedorEndereco}
                    onChange={handleChange}
                    className="w-full p-2 bg-slate-50 border rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">
                    Cidade
                  </label>
                  <input
                    name="fornecedorCidade"
                    value={formData.fornecedorCidade}
                    onChange={handleChange}
                    className="w-full p-2 bg-slate-50 border rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">
                    Tipo Comprovativo
                  </label>
                  <input
                    name="tipoComprovativo"
                    value={formData.tipoComprovativo}
                    onChange={handleChange}
                    className="w-full p-2 bg-slate-50 border rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">
                    Nº do Comprovativo
                  </label>
                  <input
                    name="numeroComprovativo"
                    value={formData.numeroComprovativo}
                    onChange={handleChange}
                    className="w-full p-2 bg-slate-50 border rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">
                    Data Comprovativo
                  </label>
                  <input
                    type="date"
                    name="dataComprovativo"
                    value={formData.dataComprovativo}
                    onChange={handleChange}
                    className="w-full p-2 bg-slate-50 border rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1 text-center">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">
                    Assistência Técnica
                  </label>
                  <div className="flex justify-center gap-4">
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="radio"
                        name="assistenciaTecnica"
                        value="Sim"
                        disabled={isReadOnly}
                        checked={formData.assistenciaTecnica === "Sim"}
                        onChange={handleChange}
                      />{" "}
                      Sim
                    </label>
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="radio"
                        name="assistenciaTecnica"
                        value="Nao"
                        disabled={isReadOnly}
                        checked={formData.assistenciaTecnica === "Nao"}
                        onChange={handleChange}
                      />{" "}
                      Não
                    </label>
                  </div>
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">
                    Garantia
                  </label>
                  <input
                    name="garantia"
                    value={formData.garantia}
                    onChange={handleChange}
                    className="w-full p-2 bg-slate-50 border rounded-lg text-sm"
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">
                    Utilizador
                  </label>
                  <input
                    name="utilizador"
                    value={formData.utilizador}
                    onChange={handleChange}
                    className="w-full p-2 bg-slate-50 border rounded-lg text-sm"
                  />
                </div>
                <div className="md:col-span-4 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">
                    Observações
                  </label>
                  <textarea
                    name="observacoes"
                    value={formData.observacoes}
                    onChange={handleChange}
                    className="w-full p-2 bg-slate-50 border rounded-lg text-sm"
                    rows={2}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="p-4 border-2 border-slate-100 rounded-2xl space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">
                      Preenchida por
                    </label>
                    <input
                      name="preenchidoPor"
                      value={formData.preenchidoPor}
                      onChange={handleChange}
                      className="w-full border-b border-dashed border-slate-400 p-1 text-sm bg-transparent"
                    />
                  </div>
                  <SignatureUpload
                    label="Assinatura"
                    value={formData.assinaturaPreenchidoPor}
                    onChange={(val) =>
                      setFormData((prev) => ({
                        ...prev,
                        assinaturaPreenchidoPor: val,
                      }))
                    }
                    readOnly={isReadOnly}
                    user={user}
                  />
                </div>
                <div className="p-4 border-2 border-slate-100 rounded-2xl space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">
                      Responsável
                    </label>
                    <input
                      name="responsavel"
                      value={formData.responsavel}
                      onChange={handleChange}
                      className="w-full border-b border-dashed border-slate-400 p-1 text-sm bg-transparent"
                    />
                  </div>
                  <SignatureUpload
                    label="Assinatura"
                    value={formData.assinaturaResponsavel}
                    onChange={(val) =>
                      setFormData((prev) => ({
                        ...prev,
                        assinaturaResponsavel: val,
                      }))
                    }
                    readOnly={isReadOnly}
                    user={user}
                  />
                </div>
              </div>
            </section>

            {/* SECÇÃO 4 & 5 - Rendered as tabs or expansion print-wise */}
            <div className="print:break-before-page pt-12 space-y-12">
              {/* SECÇÃO 4 - ABATE */}
              <section className="space-y-4 border-t-2 border-slate-900 pt-8">
                <div className="flex items-center gap-2 pb-2">
                  <History size={20} className="text-red-600" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    Secção 4 - Abate (Dados do Processo)
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-red-50/30 p-4 rounded-2xl border border-red-100/50">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">
                      Nº Auto de Verificação de Incapacidade
                    </label>
                    <input
                      name="abateAutoVerificacao"
                      value={formData.abateAutoVerificacao}
                      onChange={handleChange}
                      className="w-full p-2 bg-white border rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">
                      Data Despacho
                    </label>
                    <input
                      type="date"
                      name="abateDataDespacho"
                      value={formData.abateDataDespacho}
                      onChange={handleChange}
                      className="w-full p-2 bg-white border rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">
                      Data Processo
                    </label>
                    <input
                      type="date"
                      name="abateData"
                      value={formData.abateData}
                      onChange={handleChange}
                      className="w-full p-2 bg-white border rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">
                      Valor Residual / Actual
                    </label>
                    <input
                      name="abateValorResidual"
                      value={formData.abateValorResidual}
                      onChange={handleChange}
                      className="w-full p-2 bg-white border rounded-lg text-sm"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">
                      Entidade que autorizou
                    </label>
                    <input
                      name="abateEntidade"
                      value={formData.abateEntidade}
                      onChange={handleChange}
                      className="w-full p-2 bg-white border rounded-lg text-sm"
                    />
                  </div>
                  <div className="md:col-span-1 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">
                      Destino
                    </label>
                    <input
                      name="abateDestino"
                      value={formData.abateDestino}
                      onChange={handleChange}
                      className="w-full p-2 bg-white border rounded-lg text-sm"
                    />
                  </div>
                  <div className="md:col-span-4 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">
                      Motivo
                    </label>
                    <input
                      name="abateMotivo"
                      value={formData.abateMotivo}
                      onChange={handleChange}
                      className="w-full p-2 bg-white border rounded-lg text-sm"
                    />
                  </div>
                  <div className="md:col-span-4 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 italic">
                      Selecione a Causa do Abate:
                    </label>
                    <select
                      name="abateCausa"
                      value={formData.abateCausa}
                      onChange={handleChange}
                      className="w-full p-2 bg-white border rounded-lg text-sm"
                    >
                      <option value="">Escolha uma opção...</option>
                      <option>Estar totalmente amortizado</option>
                      <option>Acidentado</option>
                      <option>Defeitos de produção ou fabrico</option>
                      <option>
                        Avaria em serviço cuja reparação exceda 50% do valor
                      </option>
                      <option>
                        Inutilizado por utilização negligente ou intencional
                      </option>
                      <option>
                        Já não ser necessário ao serviço a que está afecto
                      </option>
                      <option>Inutilizado por excesso de trabalho</option>
                      <option>
                        Já não ter utilidade para o fim a que se destinava
                        (evolução tecnológica)
                      </option>
                      <option>Outra razão</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* SECÇÃO 5 - TRANSFERÊNCIA */}
              <section className="space-y-4 border-t-2 border-slate-900 pt-8">
                <div className="flex items-center gap-2 pb-2">
                  <ArrowRightLeft size={20} className="text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    Secção 5 - Transferência (Dados do Processo)
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-blue-50/30 p-4 rounded-2xl border border-blue-100/50">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">
                      Referência
                    </label>
                    <input
                      name="transfReferencia"
                      value={formData.transfReferencia}
                      onChange={handleChange}
                      className="w-full p-2 bg-white border rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">
                      Data Despacho
                    </label>
                    <input
                      type="date"
                      name="transfDataDespacho"
                      value={formData.transfDataDespacho}
                      onChange={handleChange}
                      className="w-full p-2 bg-white border rounded-lg text-sm"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">
                      Entidade que autorizou
                    </label>
                    <input
                      name="transfEntidade"
                      value={formData.transfEntidade}
                      onChange={handleChange}
                      className="w-full p-2 bg-white border rounded-lg text-sm"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">
                      Motivo da Transferência
                    </label>
                    <input
                      name="transfMotivo"
                      value={formData.transfMotivo}
                      onChange={handleChange}
                      className="w-full p-2 bg-white border rounded-lg text-sm"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">
                      Destino
                    </label>
                    <input
                      name="transfDestino"
                      value={formData.transfDestino}
                      onChange={handleChange}
                      className="w-full p-2 bg-white border rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">
                      Valor Residual / Actual
                    </label>
                    <input
                      name="transfValorResidual"
                      value={formData.transfValorResidual}
                      onChange={handleChange}
                      className="w-full p-2 bg-white border rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">
                      Data
                    </label>
                    <input
                      type="date"
                      name="transfData"
                      value={formData.data}
                      onChange={handleChange}
                      className="w-full p-2 bg-white border rounded-lg text-sm"
                    />
                  </div>
                  <div className="md:col-span-4 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 font-mono">
                      Valor por Extenso:
                    </label>
                    <input
                      name="transfValorExtenso"
                      value={formData.transfValorExtenso}
                      onChange={handleChange}
                      className="w-full p-2 bg-white border rounded-lg text-sm italic"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">
                      Custo de Transferência
                    </label>
                    <input
                      name="transfCusto"
                      value={formData.transfCusto}
                      onChange={handleChange}
                      className="w-full p-2 bg-white border rounded-lg text-sm font-bold text-blue-700"
                    />
                  </div>
                  <div className="md:col-span-3 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">
                      Custo por Extenso
                    </label>
                    <input
                      name="transfCustoExtenso"
                      value={formData.transfCustoExtenso}
                      onChange={handleChange}
                      className="w-full p-2 bg-white border rounded-lg text-sm italic"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">
                      Referência da Entrega
                    </label>
                    <input
                      name="transfRefEntrega"
                      value={formData.transfRefEntrega}
                      onChange={handleChange}
                      className="w-full p-2 bg-white border rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">
                      Data de Recepção
                    </label>
                    <input
                      type="date"
                      name="transfDataRecepcao"
                      value={formData.transfDataRecepcao}
                      onChange={handleChange}
                      className="w-full p-2 bg-white border rounded-lg text-sm"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">
                      Funcionário que recebeu o bem
                    </label>
                    <input
                      name="transfFuncionario"
                      value={formData.transfFuncionario}
                      onChange={handleChange}
                      className="w-full p-2 bg-white border rounded-lg text-sm"
                    />
                  </div>
                </div>
              </section>
            </div>

            <section className="p-8 space-y-4 print:hidden">
              <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-900">
                <Paperclip size={20} className="text-blue-600" />
                <h3 className="font-bold text-slate-900 text-xs">
                  Documentação Anexa (Scan / Comprovativos)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  className={`border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center transition-all relative ${isReadOnly ? "bg-slate-50 cursor-not-allowed" : "hover:border-blue-400 hover:bg-blue-50/10 cursor-pointer group"}`}
                >
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    disabled={isReadOnly}
                    className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`p-4 rounded-full transition-colors ${isReadOnly ? "bg-slate-100 text-slate-300" : "bg-slate-100 group-hover:bg-blue-100"}`}
                    >
                      <Upload
                        className={
                          isReadOnly
                            ? "text-slate-300"
                            : "text-slate-400 group-hover:text-blue-500"
                        }
                        size={32}
                      />
                    </div>
                    <p
                      className={`text-sm font-bold transition-colors ${isReadOnly ? "text-slate-400" : "text-slate-600 group-hover:text-blue-900"}`}
                    >
                      {isReadOnly
                        ? "Documentos em Anexo"
                        : "Arraste ou Clique para Anexar"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-black">
                      Factura, Guia de Remessa, Fotos (PDF, JPG, PNG)
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {anexos.length === 0 ? (
                    <div className="h-full flex items-center justify-center border-2 border-slate-50 rounded-2xl p-4 italic text-slate-400 text-xs">
                      Nenhum documento anexado ainda.
                    </div>
                  ) : (
                    anexos.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-lg shadow-sm">
                            <FileText className="text-blue-500" size={16} />
                          </div>
                          <div className="leading-tight">
                            <p className="text-xs font-bold text-slate-900 truncate max-w-[150px]">
                              {file.nome}
                            </p>
                            <p className="text-[9px] text-slate-500 font-bold">
                              {file.tamanho} • {file.data}
                            </p>
                          </div>
                        </div>
                        {!isReadOnly && (
                          <button
                            onClick={() => removeAnexo(idx)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </fieldset>

          {/* Action Bar */}
          <div className="flex justify-end gap-4 p-8 pt-0 print:hidden">
            <button
              onClick={onCancel}
              className="px-8 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
            >
              {isReadOnly ? "Fechar" : "Cancelar"}
            </button>
            {!isReadOnly && (
              <button
                onClick={handleLocalSubmit}
                disabled={isSubmitting || isSubmitted}
                className={`px-8 py-3 bg-slate-900 text-white font-bold rounded-2xl transition-all flex items-center gap-2 shadow-lg ${isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-800"}`}
              >
                {isSubmitting ? (
                  "A processar..."
                ) : (
                  <>
                    <Save size={18} />{" "}
                    {isSubmitted ? "Registado" : "Registar FIM no Sistema"}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FichaInventarioMovel;

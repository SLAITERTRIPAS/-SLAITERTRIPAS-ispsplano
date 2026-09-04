import React, { useEffect, useState } from "react";
import { ArrowLeft, Save, Building2, MapPin, UserCheck, CreditCard, Briefcase, FileCheck, ShieldCheck, Printer, CheckCircle2 } from "lucide-react";
import { Supplier } from "../../types";
import { usePersistentDraft } from "../../hooks/usePersistentDraft";
import { DraftModal, SyncIndicator } from "../../components/ui/DraftMemoryUI";

interface SupplierRegistrationFormProps {
  onBack: () => void;
  onSubmit: (supplier: Supplier) => Promise<void> | void;
  initialData?: Partial<Supplier> | null;
  isReadOnly?: boolean;
}

const initialSupplierState = {
  nome: "",
  contacto: "",
  tipoServico: "",

  // 1. Identificação da Empresa
  razaoSocial: "",
  nomeFantasia: "",
  nif: "",
  dataConstituicao: "",
  tipoEmpresa: "Sociedade",

  // 2. Endereço e Contatos
  enderecoCompleto: "",
  cidadeProvincia: "",
  pais: "Moçambique",
  telefone: "",
  email: "",
  website: "",

  // 3. Representante Legal
  repNomeCompleto: "",
  repCargo: "",
  repTelefone: "",
  repEmail: "",

  // 4. Dados Bancários
  banco: "",
  agencia: "",
  numeroConta: "",
  ibanSwift: "",

  // 5. Áreas de Atuação
  produtosServicosOferecidos: "",
  categoriaPrincipal: "",
  certificacoesAutorizacoes: "",

  // 6. Documentação Anexa (Checklist)
  docCertidaoRegistoComercial: false,
  docNifFiscal: false,
  docEstatutosEmpresa: false,
  docCertificadoContaBancaria: false,
  docLicencasEspecificas: false,
  docOutros: "",

  // 7. Declaração
  declaracaoAceite: true,
  localDataDeclaracao: new Date().toLocaleDateString("pt-MZ"),
  assinaturaRepresentante: "",
};

export default function UGEA_SupplierRegistrationForm({
  onBack,
  onSubmit,
  initialData,
  isReadOnly = false,
}: SupplierRegistrationFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    data: formData,
    setData: setFormData,
    isDraftLoaded,
    showDraftModal,
    isSyncing,
    recoverDraft,
    discardDraft,
    clearDraft,
  } = usePersistentDraft(
    initialData?.id ? `ugea_supplier_edit_${initialData.id}` : "ugea_supplier_registration_form_v2",
    initialData ? { ...initialSupplierState, ...initialData } : initialSupplierState
  );

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
        razaoSocial: initialData.razaoSocial || initialData.nome || prev.razaoSocial,
        categoriaPrincipal: initialData.categoriaPrincipal || initialData.tipoServico || prev.categoriaPrincipal,
        telefone: initialData.telefone || initialData.contacto || prev.telefone,
      }));
    }
  }, [initialData, setFormData]);

  const handleInputChange = (field: string, value: any) => {
    if (isReadOnly) return;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    try {
      setIsSaving(true);
      const finalSupplier: Supplier = {
        id: initialData?.id || Math.random().toString(36).substring(2, 11),
        nome: formData.razaoSocial || formData.nomeFantasia || "Empresa sem Nome",
        tipoServico: formData.categoriaPrincipal || "Fornecimento Geral",
        contacto: formData.telefone || formData.repTelefone || "",
        email: formData.email || formData.repEmail || "",
        validadeContrato:
          initialData?.validadeContrato ||
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        dataRegisto: initialData?.dataRegisto || new Date().toISOString().split("T")[0],
        ...formData,
      };

      await onSubmit(finalSupplier);
      clearDraft();
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);
    } catch (err) {
      console.error("Erro ao gravar fornecedor:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isDraftLoaded && !showDraftModal && !initialData) return null;

  return (
    <div className="min-h-screen w-full bg-slate-50 p-3 sm:p-6 md:p-8 relative print:bg-white print:p-0">
      <DraftModal
        show={showDraftModal && !initialData}
        onRecover={recoverDraft}
        onDiscard={discardDraft}
      />

      <SyncIndicator
        isSyncing={isSyncing}
        className="fixed top-6 right-8 z-50 bg-white shadow-md border border-slate-200 px-3 py-1.5 rounded-full print:hidden"
      />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Cabeçalho Institucional */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm print:shadow-none print:border-b-2 print:border-slate-800 print:rounded-none">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all print:hidden"
              title="Voltar"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest text-[#121c60] uppercase bg-blue-50 px-2 py-0.5 rounded">
                  República de Moçambique · UGEA
                </span>
                {initialData?.id && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    ID: {initialData.id}
                  </span>
                )}
              </div>
              <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight mt-1">
                Formulário de Registo de Fornecedor
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Cadastro e Homologação de Fornecedores de Bens, Serviços e Empreitadas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden self-end sm:self-center">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
              title="Imprimir Ficha Cadastral"
            >
              <Printer size={16} /> Imprimir Ficha
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 font-bold text-sm shadow-sm animate-fade-in print:hidden">
            <CheckCircle2 className="text-emerald-600" size={20} />
            Fornecedor guardado com sucesso na base de dados institucional!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 pb-12 print:space-y-4 print:pb-0">
          {/* SECÇÃO 1: Identificação da Empresa */}
          <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 print:border print:shadow-none">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="p-2 bg-blue-50 text-[#121c60] rounded-xl print:border">
                <Building2 size={20} />
              </div>
              <h2 className="text-sm font-black tracking-wider text-slate-800 uppercase">
                1. Identificação da Empresa
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Razão Social *
                </label>
                <input
                  type="text"
                  value={formData.razaoSocial || formData.nome || ""}
                  onChange={(e) => handleInputChange("razaoSocial", e.target.value)}
                  placeholder="Ex: Sociedade Comercial Exemplo, Lda."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Fantasia
                </label>
                <input
                  type="text"
                  value={formData.nomeFantasia || ""}
                  onChange={(e) => handleInputChange("nomeFantasia", e.target.value)}
                  placeholder="Ex: Exemplo Comercial"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  NIF / Número de Contribuinte *
                </label>
                <input
                  type="text"
                  value={formData.nif || ""}
                  onChange={(e) => handleInputChange("nif", e.target.value)}
                  placeholder="Ex: 400123456"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Data de Constituição
                </label>
                <input
                  type="date"
                  value={formData.dataConstituicao || ""}
                  onChange={(e) => handleInputChange("dataConstituicao", e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  disabled={isReadOnly}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Tipo de Empresa
                </label>
                <div className="flex flex-wrap gap-4">
                  {["Individual", "Sociedade", "Outro"].map((tipo) => (
                    <label key={tipo} className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                      <input
                        type="radio"
                        name="tipoEmpresa"
                        value={tipo}
                        checked={formData.tipoEmpresa === tipo}
                        onChange={(e) => handleInputChange("tipoEmpresa", e.target.value)}
                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                        disabled={isReadOnly}
                      />
                      {tipo}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECÇÃO 2: Endereço e Contatos */}
          <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 print:border print:shadow-none">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl print:border">
                <MapPin size={20} />
              </div>
              <h2 className="text-sm font-black tracking-wider text-slate-800 uppercase">
                2. Endereço e Contatos
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Endereço Completo *
                </label>
                <input
                  type="text"
                  value={formData.enderecoCompleto || ""}
                  onChange={(e) => handleInputChange("enderecoCompleto", e.target.value)}
                  placeholder="Av./Rua, Bairro, Quarteirão, N.º de Edifício"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cidade / Província *
                </label>
                <input
                  type="text"
                  value={formData.cidadeProvincia || ""}
                  onChange={(e) => handleInputChange("cidadeProvincia", e.target.value)}
                  placeholder="Ex: Songo, Tete / Maputo"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  País
                </label>
                <input
                  type="text"
                  value={formData.pais || "Moçambique"}
                  onChange={(e) => handleInputChange("pais", e.target.value)}
                  placeholder="Ex: Moçambique"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Telefone Principal *
                </label>
                <input
                  type="text"
                  value={formData.telefone || formData.contacto || ""}
                  onChange={(e) => handleInputChange("telefone", e.target.value)}
                  placeholder="Ex: +258 84 123 4567"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Institucional *
                </label>
                <input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="fornecedor@exemplo.co.mz"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                  disabled={isReadOnly}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Website / Portal
                </label>
                <input
                  type="text"
                  value={formData.website || ""}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  placeholder="https://www.empresa.co.mz"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>

          {/* SECÇÃO 3: Representante Legal */}
          <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 print:border print:shadow-none">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl print:border">
                <UserCheck size={20} />
              </div>
              <h2 className="text-sm font-black tracking-wider text-slate-800 uppercase">
                3. Representante Legal
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.repNomeCompleto || ""}
                  onChange={(e) => handleInputChange("repNomeCompleto", e.target.value)}
                  placeholder="Nome do representante legal"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cargo / Função *
                </label>
                <input
                  type="text"
                  value={formData.repCargo || ""}
                  onChange={(e) => handleInputChange("repCargo", e.target.value)}
                  placeholder="Ex: Director-Geral, Gerente, Procurador"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Telefone do Representante
                </label>
                <input
                  type="text"
                  value={formData.repTelefone || ""}
                  onChange={(e) => handleInputChange("repTelefone", e.target.value)}
                  placeholder="+258 82 000 0000"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email do Representante
                </label>
                <input
                  type="email"
                  value={formData.repEmail || ""}
                  onChange={(e) => handleInputChange("repEmail", e.target.value)}
                  placeholder="representante@exemplo.co.mz"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>

          {/* SECÇÃO 4: Dados Bancários */}
          <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 print:border print:shadow-none">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl print:border">
                <CreditCard size={20} />
              </div>
              <h2 className="text-sm font-black tracking-wider text-slate-800 uppercase">
                4. Dados Bancários
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Instituição Bancária *
                </label>
                <input
                  type="text"
                  value={formData.banco || ""}
                  onChange={(e) => handleInputChange("banco", e.target.value)}
                  placeholder="Ex: Millennium BIM, BCI, Standard Bank, Moza Banco"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Agência / Balcão
                </label>
                <input
                  type="text"
                  value={formData.agencia || ""}
                  onChange={(e) => handleInputChange("agencia", e.target.value)}
                  placeholder="Nome ou código da agência"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Número de Conta Bancária *
                </label>
                <input
                  type="text"
                  value={formData.numeroConta || ""}
                  onChange={(e) => handleInputChange("numeroConta", e.target.value)}
                  placeholder="N.º de conta bancária"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  NIB / IBAN / SWIFT
                </label>
                <input
                  type="text"
                  value={formData.ibanSwift || ""}
                  onChange={(e) => handleInputChange("ibanSwift", e.target.value)}
                  placeholder="MZ59 0000 0000 0000 0000 00"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>

          {/* SECÇÃO 5: Áreas de Atuação */}
          <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 print:border print:shadow-none">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl print:border">
                <Briefcase size={20} />
              </div>
              <h2 className="text-sm font-black tracking-wider text-slate-800 uppercase">
                5. Áreas de Atuação e Fornecimento
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Categoria Principal *
                </label>
                <input
                  type="text"
                  value={formData.categoriaPrincipal || formData.tipoServico || ""}
                  onChange={(e) => handleInputChange("categoriaPrincipal", e.target.value)}
                  placeholder="Ex: Consumíveis de Escritório, Informática, Obras e Manutenção, Combustíveis, Consultoria"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                  disabled={isReadOnly}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Produtos e Serviços Oferecidos *
                </label>
                <textarea
                  rows={3}
                  value={formData.produtosServicosOferecidos || ""}
                  onChange={(e) => handleInputChange("produtosServicosOferecidos", e.target.value)}
                  placeholder="Descreva detalhadamente os principais bens e serviços fornecidos pela empresa..."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  required
                  disabled={isReadOnly}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alvará, Licenças e Certificações Técnicas
                </label>
                <input
                  type="text"
                  value={formData.certificacoesAutorizacoes || ""}
                  onChange={(e) => handleInputChange("certificacoesAutorizacoes", e.target.value)}
                  placeholder="Ex: Alvará de Construção Classe 4, Certificação ISO, Licença Comercial Geral"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>

          {/* SECÇÃO 6: Documentação Anexa (Checklist) */}
          <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 print:border print:shadow-none">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="p-2 bg-teal-50 text-teal-600 rounded-xl print:border">
                <FileCheck size={20} />
              </div>
              <h2 className="text-sm font-black tracking-wider text-slate-800 uppercase">
                6. Documentação Anexa (Checklist de Conformidade)
              </h2>
            </div>

            <div className="space-y-3">
              {[
                { id: "docCertidaoRegistoComercial", label: "Certidão de Registo Comercial e Publicação em BR" },
                { id: "docNifFiscal", label: "Cartão / Certidão de Quitação Fiscal (NIF)" },
                { id: "docEstatutosEmpresa", label: "Estatutos da Sociedade e Pacto Social" },
                { id: "docCertificadoContaBancaria", label: "Declaração Bancária com Comprovativo de IBAN/NIB" },
                { id: "docLicencasEspecificas", label: "Alvará ou Licenças de Exercício de Atividade Específica" },
              ].map((doc) => (
                <label key={doc.id} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/80 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={Boolean((formData as any)[doc.id])}
                    onChange={(e) => handleInputChange(doc.id, e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    disabled={isReadOnly}
                  />
                  <span className="text-xs font-bold text-slate-700">
                    [ {(formData as any)[doc.id] ? "X" : " "} ] {doc.label}
                  </span>
                </label>
              ))}

              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Outros Documentos Relevantes
                </label>
                <input
                  type="text"
                  value={formData.docOutros || ""}
                  onChange={(e) => handleInputChange("docOutros", e.target.value)}
                  placeholder="Especifique outros documentos anexados ao processo de cadastro..."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>

          {/* SECÇÃO 7: Declaração e Homologação */}
          <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 print:border print:shadow-none">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl print:border">
                <ShieldCheck size={20} />
              </div>
              <h2 className="text-sm font-black tracking-wider text-slate-800 uppercase">
                7. Declaração e Termo de Responsabilidade
              </h2>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-medium">
              Declaro sob compromisso de honra que as informações prestadas neste formulário são verdadeiras, completas e que a empresa cumpre com todas as exigências legais, tributárias e regulamentares para o fornecimento de bens e serviços ao Estado / Instituição.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Local e Data *
                </label>
                <input
                  type="text"
                  value={formData.localDataDeclaracao || ""}
                  onChange={(e) => handleInputChange("localDataDeclaracao", e.target.value)}
                  placeholder="Ex: Songo, 11 de Agosto de 2026"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome do Representante / Signatário *
                </label>
                <input
                  type="text"
                  value={formData.assinaturaRepresentante || ""}
                  onChange={(e) => handleInputChange("assinaturaRepresentante", e.target.value)}
                  placeholder="Digite o nome completo para homologação digital"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>

          {/* Submissão / Ações */}
          {!isReadOnly && (
            <div className="flex items-center justify-end gap-3 pt-4 print:hidden">
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition-all"
                disabled={isSaving}
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className={`px-8 py-3 ${
                  isSaving ? "bg-slate-400 cursor-not-allowed" : "bg-[#121c60] hover:bg-[#0e164d]"
                } text-white font-black rounded-xl text-xs shadow-md transition-all flex items-center gap-2`}
              >
                <Save size={18} />
                {isSaving
                  ? "A Gravar Fornecedor..."
                  : initialData?.id
                  ? "Atualizar Fornecedor"
                  : "Cadastrar Fornecedor"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}


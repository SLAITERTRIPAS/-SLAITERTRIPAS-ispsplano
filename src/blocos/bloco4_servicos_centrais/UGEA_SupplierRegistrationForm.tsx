import React from "react";
import { ArrowLeft, Save, Building2, MapPin, UserCheck, CreditCard, Briefcase, FileCheck, ShieldCheck } from "lucide-react";
import { Supplier } from "../../types";
import { usePersistentDraft } from "../../hooks/usePersistentDraft";
import { DraftModal, SyncIndicator } from "../../components/ui/DraftMemoryUI";

interface SupplierRegistrationFormProps {
  onBack: () => void;
  onSubmit: (supplier: Supplier) => void;
}

const initialSupplierState = {
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
}: SupplierRegistrationFormProps) {
  const {
    data: formData,
    setData: setFormData,
    isDraftLoaded,
    showDraftModal,
    isSyncing,
    recoverDraft,
    discardDraft,
    clearDraft,
  } = usePersistentDraft("ugea_supplier_registration_form_v2", initialSupplierState);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSupplier: Supplier = {
      id: Math.random().toString(36).substring(2, 11),
      nome: formData.razaoSocial || formData.nomeFantasia || "Empresa sem Nome",
      tipoServico: formData.categoriaPrincipal || "Fornecimento Geral",
      contacto: formData.telefone || formData.repTelefone || "",
      email: formData.email || formData.repEmail || "",
      validadeContrato: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      dataRegisto: new Date().toISOString().split("T")[0],
      ...formData,
    };

    onSubmit(finalSupplier);
    clearDraft();
  };

  if (!isDraftLoaded && !showDraftModal) return null;

  return (
    <div className="min-h-screen w-full bg-slate-50 p-4 md:p-8 relative">
      <DraftModal
        show={showDraftModal}
        onRecover={recoverDraft}
        onDiscard={discardDraft}
      />

      <SyncIndicator
        isSyncing={isSyncing}
        className="fixed top-6 right-8 z-50 bg-white shadow-md border border-slate-200 px-3 py-1.5 rounded-full"
      />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header Navigation */}
        <div className="flex items-center justify-between bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
              title="Voltar"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <span className="text-[10px] font-black tracking-widest text-sky-600 ">
                UGEA · Cadastro Oficial
              </span>
              <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
                Formulário de Registo de Fornecedor
              </h1>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pb-12">
          {/* SECÇÃO 1: Identificação da Empresa */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                <Building2 size={20} />
              </div>
              <h2 className="text-sm font-black  tracking-wider text-slate-800">
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
                  value={formData.razaoSocial}
                  onChange={(e) => handleInputChange("razaoSocial", e.target.value)}
                  placeholder="Ex: Sociedade Comercial Exemplo, Lda."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Fantasia
                </label>
                <input
                  type="text"
                  value={formData.nomeFantasia}
                  onChange={(e) => handleInputChange("nomeFantasia", e.target.value)}
                  placeholder="Ex: Exemplo Comercial"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  NIF / Número de Contribuinte *
                </label>
                <input
                  type="text"
                  value={formData.nif}
                  onChange={(e) => handleInputChange("nif", e.target.value)}
                  placeholder="Ex: 400123456"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Data de Constituição
                </label>
                <input
                  type="date"
                  value={formData.dataConstituicao}
                  onChange={(e) => handleInputChange("dataConstituicao", e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
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
                        className="w-4 h-4 text-sky-600 border-slate-300 focus:ring-sky-500"
                      />
                      ( ) {tipo}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECÇÃO 2: Endereço e Contatos */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <MapPin size={20} />
              </div>
              <h2 className="text-sm font-black  tracking-wider text-slate-800">
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
                  value={formData.enderecoCompleto}
                  onChange={(e) => handleInputChange("enderecoCompleto", e.target.value)}
                  placeholder="Av./Rua, Bairro, Quarteirão, N.º de Edifício"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cidade / Província *
                </label>
                <input
                  type="text"
                  value={formData.cidadeProvincia}
                  onChange={(e) => handleInputChange("cidadeProvincia", e.target.value)}
                  placeholder="Ex: Lichinga, Niassa"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  País
                </label>
                <input
                  type="text"
                  value={formData.pais}
                  onChange={(e) => handleInputChange("pais", e.target.value)}
                  placeholder="Ex: Moçambique"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Telefone *
                </label>
                <input
                  type="text"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange("telefone", e.target.value)}
                  placeholder="Ex: +258 84 123 4567"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="empresa@exemplo.co.mz"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Website
                </label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  placeholder="https://www.empresa.co.mz"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECÇÃO 3: Representante Legal */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <UserCheck size={20} />
              </div>
              <h2 className="text-sm font-black  tracking-wider text-slate-800">
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
                  value={formData.repNomeCompleto}
                  onChange={(e) => handleInputChange("repNomeCompleto", e.target.value)}
                  placeholder="Nome do representante legal"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cargo *
                </label>
                <input
                  type="text"
                  value={formData.repCargo}
                  onChange={(e) => handleInputChange("repCargo", e.target.value)}
                  placeholder="Ex: Director-Geral, Gerente, Procurador"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Telefone do Representante
                </label>
                <input
                  type="text"
                  value={formData.repTelefone}
                  onChange={(e) => handleInputChange("repTelefone", e.target.value)}
                  placeholder="+258 82 000 0000"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email do Representante
                </label>
                <input
                  type="email"
                  value={formData.repEmail}
                  onChange={(e) => handleInputChange("repEmail", e.target.value)}
                  placeholder="representante@exemplo.co.mz"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECÇÃO 4: Dados Bancários */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <CreditCard size={20} />
              </div>
              <h2 className="text-sm font-black  tracking-wider text-slate-800">
                4. Dados Bancários
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Banco *
                </label>
                <input
                  type="text"
                  value={formData.banco}
                  onChange={(e) => handleInputChange("banco", e.target.value)}
                  placeholder="Ex: Millennium BIM, BCI, Standard Bank"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Agência
                </label>
                <input
                  type="text"
                  value={formData.agencia}
                  onChange={(e) => handleInputChange("agencia", e.target.value)}
                  placeholder="Nome ou código da agência"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Número da Conta *
                </label>
                <input
                  type="text"
                  value={formData.numeroConta}
                  onChange={(e) => handleInputChange("numeroConta", e.target.value)}
                  placeholder="N.º de conta bancária"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  IBAN / NIB / Swift Code
                </label>
                <input
                  type="text"
                  value={formData.ibanSwift}
                  onChange={(e) => handleInputChange("ibanSwift", e.target.value)}
                  placeholder="MZ59 0000 0000 0000 0000 00"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECÇÃO 5: Áreas de Atuação */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <Briefcase size={20} />
              </div>
              <h2 className="text-sm font-black  tracking-wider text-slate-800">
                5. Áreas de Atuação
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Categoria Principal *
                </label>
                <input
                  type="text"
                  value={formData.categoriaPrincipal}
                  onChange={(e) => handleInputChange("categoriaPrincipal", e.target.value)}
                  placeholder="Ex: Consumíveis de Escritório, Informática, Obras e Manutenção, Combustíveis"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Produtos / Serviços Oferecidos *
                </label>
                <textarea
                  rows={3}
                  value={formData.produtosServicosOferecidos}
                  onChange={(e) => handleInputChange("produtosServicosOferecidos", e.target.value)}
                  placeholder="Descreva resumidamente os principais bens e serviços fornecidos pela empresa..."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none resize-none"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Certificações / Autorizações
                </label>
                <input
                  type="text"
                  value={formData.certificacoesAutorizacoes}
                  onChange={(e) => handleInputChange("certificacoesAutorizacoes", e.target.value)}
                  placeholder="Ex: Alvará de Construção, Certificação ISO, Licença Ambiental"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECÇÃO 6: Documentação Anexa (Checklist) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                <FileCheck size={20} />
              </div>
              <h2 className="text-sm font-black  tracking-wider text-slate-800">
                6. Documentação Anexa (Checklist)
              </h2>
            </div>

            <div className="space-y-3">
              {[
                { id: "docCertidaoRegistoComercial", label: "Certidão de Registo Comercial" },
                { id: "docNifFiscal", label: "NIF / Documento Fiscal" },
                { id: "docEstatutosEmpresa", label: "Estatutos da Empresa" },
                { id: "docCertificadoContaBancaria", label: "Certificado de Conta Bancária" },
                { id: "docLicencasEspecificas", label: "Licenças / Certificações específicas" },
              ].map((doc) => (
                <label key={doc.id} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/80 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={Boolean((formData as any)[doc.id])}
                    onChange={(e) => handleInputChange(doc.id, e.target.checked)}
                    className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                  />
                  <span className="text-xs font-bold text-slate-700">[ { (formData as any)[doc.id] ? "X" : " " } ] {doc.label}</span>
                </label>
              ))}

              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Outros Documentos
                </label>
                <input
                  type="text"
                  value={formData.docOutros}
                  onChange={(e) => handleInputChange("docOutros", e.target.value)}
                  placeholder="Especifique outros documentos anexados..."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECÇÃO 7: Declaração */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <ShieldCheck size={20} />
              </div>
              <h2 className="text-sm font-black  tracking-wider text-slate-800">
                7. Declaração
              </h2>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-medium">
              Declaro que as informações acima são verdadeiras e que a empresa cumpre com todas as exigências legais e regulamentares para fornecimento de bens/serviços.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Local e Data *
                </label>
                <input
                  type="text"
                  value={formData.localDataDeclaracao}
                  onChange={(e) => handleInputChange("localDataDeclaracao", e.target.value)}
                  placeholder="Ex: Lichinga, 11 de Agosto de 2026"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assinatura do Representante Legal (Nome) *
                </label>
                <input
                  type="text"
                  value={formData.assinaturaRepresentante}
                  onChange={(e) => handleInputChange("assinaturaRepresentante", e.target.value)}
                  placeholder="Digite o nome completo para assinar digitalmente"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Submissão */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-sky-600 hover:bg-sky-700 text-white font-black rounded-xl text-xs shadow-md transition-all flex items-center gap-2"
            >
              <Save size={18} /> Cadastrar Fornecedor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

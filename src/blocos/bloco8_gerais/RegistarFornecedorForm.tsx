import React, { useState } from "react";
import { Building, Save, X, Info, Phone, Mail, MapPin, CreditCard } from "lucide-react";
import { firestoreService } from "../../lib/firestoreService";

export default function RegistarFornecedorForm({
  onCancel,
  onSubmit,
  user,
  onShowAlert,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  user?: any;
  onShowAlert: (msg: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    nuit: "",
    email: "",
    telefone: "",
    endereco: "",
    cidade: "Songo",
    provincia: "Tete",
    tipoFornecimento: "Bens e Serviços",
    banco: "",
    contaBancaria: "",
    nib: "",
    status: "Ativo",
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.nuit) {
      onShowAlert("Preencha o nome e o NUIT do fornecedor.");
      return;
    }

    setLoading(true);
    try {
      await firestoreService.suppliers.add({
        ...formData,
        createdAt: new Date().toISOString(),
        registadoPor: user?.email || "Sistema",
      });
      onShowAlert("Fornecedor registado com sucesso!");
      onSubmit();
    } catch (err) {
      onShowAlert("Erro ao registar fornecedor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <Building size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Registar Novo Fornecedor
            </h2>
            <p className="text-xs text-gray-500 font-medium italic">
              Insira os dados da entidade fornecedora para o cadastro institucional.
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={20} className="text-gray-400" />
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nome */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Nome da Empresa / Entidade
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-slate-500 transition-all"
                placeholder="Ex: Papelaria Central Lda"
              />
              <Building className="absolute right-4 top-4 text-gray-300" size={18} />
            </div>
          </div>

          {/* NUIT */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              NUIT (Identificação Fiscal)
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.nuit}
                onChange={(e) => setFormData({ ...formData, nuit: e.target.value })}
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-slate-500 transition-all"
                placeholder="Ex: 400123456"
              />
              <Info className="absolute right-4 top-4 text-gray-300" size={18} />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              E-mail de Contacto
            </label>
            <div className="relative">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-slate-500 transition-all"
                placeholder="exemplo@empresa.co.mz"
              />
              <Mail className="absolute right-4 top-4 text-gray-300" size={18} />
            </div>
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Telefone / Telemóvel
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-slate-500 transition-all"
                placeholder="+258 84..."
              />
              <Phone className="absolute right-4 top-4 text-gray-300" size={18} />
            </div>
          </div>

          {/* Tipo de Fornecimento */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Tipo de Fornecimento
            </label>
            <select
              value={formData.tipoFornecimento}
              onChange={(e) => setFormData({ ...formData, tipoFornecimento: e.target.value })}
              className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-slate-500 transition-all"
            >
              <option value="Bens e Serviços">Bens e Serviços</option>
              <option value="Material de Escritório">Material de Escritório</option>
              <option value="Equipamento de Informática">Equipamento de Informática</option>
              <option value="Serviços de Manutenção">Serviços de Manutenção</option>
              <option value="Construção Civil">Construção Civil</option>
              <option value="Alimentação / Catering">Alimentação / Catering</option>
            </select>
          </div>

          {/* Cidade/Endereço */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Endereço / Localização
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-slate-500 transition-all"
                placeholder="Rua, Bairro, Nº..."
              />
              <MapPin className="absolute right-4 top-4 text-gray-300" size={18} />
            </div>
          </div>
        </div>

        {/* Dados Bancários Section */}
        <div className="bg-slate-50 p-6 rounded-3xl space-y-4 border border-slate-100">
          <h3 className="text-xs font-black text-slate-800 tracking-widest uppercase flex items-center gap-2">
            <CreditCard size={16} /> Dados Bancários (Para Pagamentos)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Banco</label>
              <input
                type="text"
                value={formData.banco}
                onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                className="w-full bg-white border-none rounded-xl px-4 py-3 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-slate-500 transition-all"
                placeholder="Ex: Millennium BIM"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Conta Bancária</label>
              <input
                type="text"
                value={formData.contaBancaria}
                onChange={(e) => setFormData({ ...formData, contaBancaria: e.target.value })}
                className="w-full bg-white border-none rounded-xl px-4 py-3 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-slate-500 transition-all"
                placeholder="Número da conta"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">NIB / IBAN</label>
              <input
                type="text"
                value={formData.nib}
                onChange={(e) => setFormData({ ...formData, nib: e.target.value })}
                className="w-full bg-white border-none rounded-xl px-4 py-3 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-slate-500 transition-all"
                placeholder="Código NIB"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-4 rounded-2xl text-sm font-black text-gray-500 hover:bg-gray-100 transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-slate-900 hover:bg-slate-800 text-white px-10 py-4 rounded-2xl text-sm font-black tracking-widest shadow-xl shadow-slate-200 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? "A processar..." : <><Save size={18} /> Registar Fornecedor</>}
          </button>
        </div>
      </form>
    </div>
  );
}

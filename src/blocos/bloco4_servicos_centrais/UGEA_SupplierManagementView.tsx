import React, { useState } from "react";
import {
  ArrowLeft,
  Plus,
  Building2,
  Search,
  FileText,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Eye,
  Printer,
  X,
} from "lucide-react";
import { Supplier } from "../../types";
import { firestoreService } from "../../lib/firestoreService";
import UGEA_SupplierRegistrationForm from "./UGEA_SupplierRegistrationForm";

interface SupplierManagementViewProps {
  onBack: () => void;
  onAddSupplier: () => void;
  suppliers: Supplier[];
  onShowAlert?: (msg: string, type?: string) => void;
}

export default function UGEA_SupplierManagementView({
  onBack,
  onAddSupplier,
  suppliers = [],
  onShowAlert,
}: SupplierManagementViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("Todos");
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtragem de fornecedores
  const filteredSuppliers = (suppliers || []).filter((s) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (s.nome && s.nome.toLowerCase().includes(term)) ||
      (s.razaoSocial && s.razaoSocial.toLowerCase().includes(term)) ||
      (s.nif && s.nif.toLowerCase().includes(term)) ||
      (s.tipoServico && s.tipoServico.toLowerCase().includes(term)) ||
      (s.categoriaPrincipal && s.categoriaPrincipal.toLowerCase().includes(term)) ||
      (s.cidadeProvincia && s.cidadeProvincia.toLowerCase().includes(term)) ||
      (s.contacto && s.contacto.toLowerCase().includes(term));

    const matchesType =
      selectedType === "Todos" ||
      (s.tipoEmpresa && s.tipoEmpresa.toLowerCase() === selectedType.toLowerCase());

    return matchesSearch && matchesType;
  });

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      await firestoreService.suppliers.delete(id);
      if (onShowAlert) {
        onShowAlert("Fornecedor removido com sucesso.", "success");
      }
      setDeletingId(null);
    } catch (err) {
      console.error("Erro ao eliminar fornecedor:", err);
      if (onShowAlert) {
        onShowAlert("Erro ao eliminar fornecedor.", "error");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateSupplier = async (updated: Supplier) => {
    try {
      await firestoreService.suppliers.update(updated.id, updated);
      if (onShowAlert) {
        onShowAlert("Fornecedor atualizado com sucesso!", "success");
      }
      setEditingSupplier(null);
    } catch (err) {
      console.error("Erro ao atualizar fornecedor:", err);
      if (onShowAlert) {
        onShowAlert("Erro ao atualizar fornecedor.", "error");
      }
    }
  };

  // Se estiver a editar um fornecedor diretamente
  if (editingSupplier) {
    return (
      <UGEA_SupplierRegistrationForm
        initialData={editingSupplier}
        onBack={() => setEditingSupplier(null)}
        onSubmit={handleUpdateSupplier}
      />
    );
  }

  const totalCount = (suppliers || []).length;
  const sociedadesCount = (suppliers || []).filter(
    (s) => s.tipoEmpresa === "Sociedade" || (!s.tipoEmpresa && s.nome?.toLowerCase().includes("lda"))
  ).length;
  const individuaisCount = (suppliers || []).filter(
    (s) => s.tipoEmpresa === "Individual"
  ).length;

  return (
    <div className="h-full w-full bg-slate-50 flex flex-col p-4 md:p-8 overflow-y-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
            title="Voltar"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-widest text-[#121c60] uppercase bg-blue-50 px-2.5 py-0.5 rounded">
                UGEA · Setor de Compras e Contratações
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight mt-1">
              Gestão e Registo de Fornecedores
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Base de dados oficial de fornecedores de bens, serviços e consultoria homologados
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs transition-all"
          >
            <Printer size={16} /> Imprimir Lista
          </button>

          <button
            onClick={onAddSupplier}
            className="flex items-center gap-2 bg-[#121c60] hover:bg-[#0e164d] text-white px-5 py-2.5 rounded-xl font-black text-xs tracking-wider shadow-md transition-all"
          >
            <Plus size={18} /> Novo Registo de Fornecedor
          </button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total de Fornecedores
            </span>
            <p className="text-2xl font-black text-[#121c60] mt-1">{totalCount}</p>
          </div>
          <div className="p-3 bg-blue-50 text-[#121c60] rounded-xl">
            <Building2 size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Sociedades Comerciais
            </span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{sociedadesCount}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Empresas Individuais
            </span>
            <p className="text-2xl font-black text-amber-600 mt-1">{individuaisCount}</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <FileText size={24} />
          </div>
        </div>
      </div>

      {/* Barra de Pesquisa e Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome, NIF, serviço, contacto..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto overflow-x-auto w-full md:w-auto">
          {["Todos", "Sociedade", "Individual", "Outro"].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedType === type
                  ? "bg-[#121c60] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela de Fornecedores */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-grow overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-grow">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                <th className="p-4 pl-6">Fornecedor / Razão Social</th>
                <th className="p-4">NIF</th>
                <th className="p-4">Categoria / Atuação</th>
                <th className="p-4">Contactos</th>
                <th className="p-4">Banco / Conta</th>
                <th className="p-4 pr-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <Building2 className="mx-auto mb-3 text-slate-300" size={40} />
                    <p className="font-bold text-slate-600">Nenhum fornecedor encontrado</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchTerm
                        ? "Tente ajustar os termos de pesquisa."
                        : "Clique em 'Novo Registo de Fornecedor' para cadastrar o primeiro."}
                    </p>
                    {!searchTerm && (
                      <button
                        onClick={onAddSupplier}
                        className="mt-4 inline-flex items-center gap-2 bg-[#121c60] text-white px-4 py-2 rounded-xl text-xs font-bold"
                      >
                        <Plus size={16} /> Registar Fornecedor Agora
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 text-[#121c60] rounded-xl shrink-0">
                          <Building2 size={18} />
                        </div>
                        <div>
                          <p className="font-black text-slate-800">
                            {s.razaoSocial || s.nome || "Empresa sem Razão Social"}
                          </p>
                          {s.nomeFantasia && s.nomeFantasia !== s.razaoSocial && (
                            <p className="text-[11px] text-slate-500 font-medium">
                              Nome Fantasia: {s.nomeFantasia}
                            </p>
                          )}
                          {s.tipoEmpresa && (
                            <span className="inline-block mt-0.5 text-[9px] font-bold px-2 py-0.2 rounded bg-slate-100 text-slate-600">
                              {s.tipoEmpresa}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded">
                        {s.nif || "N/D"}
                      </span>
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-slate-800">
                        {s.categoriaPrincipal || s.tipoServico || "Geral"}
                      </p>
                      {s.produtosServicosOferecidos && (
                        <p className="text-[11px] text-slate-500 truncate max-w-xs">
                          {s.produtosServicosOferecidos}
                        </p>
                      )}
                    </td>

                    <td className="p-4 space-y-1">
                      {(s.telefone || s.contacto) && (
                        <p className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                          <Phone size={12} className="text-slate-400" />
                          {s.telefone || s.contacto}
                        </p>
                      )}
                      {s.email && (
                        <p className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                          <Mail size={12} className="text-slate-400" />
                          {s.email}
                        </p>
                      )}
                    </td>

                    <td className="p-4">
                      {s.banco ? (
                        <div className="text-[11px]">
                          <p className="font-bold text-slate-800">{s.banco}</p>
                          {s.numeroConta && <p className="text-slate-500">C/C: {s.numeroConta}</p>}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">N/D</span>
                      )}
                    </td>

                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingSupplier(s)}
                          className="p-2 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
                          title="Ver Ficha Cadastral"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          onClick={() => setEditingSupplier(s)}
                          className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Editar Fornecedor"
                        >
                          <Edit2 size={16} />
                        </button>

                        <button
                          onClick={() => setDeletingId(s.id)}
                          className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Eliminar Fornecedor"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Visualização da Ficha */}
      {viewingSupplier && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 text-[#121c60] rounded-xl">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">
                    {viewingSupplier.razaoSocial || viewingSupplier.nome}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    NIF: {viewingSupplier.nif || "N/D"} · {viewingSupplier.tipoEmpresa || "Sociedade"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingSupplier(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
              {/* Secção 1 */}
              <div className="space-y-2">
                <h4 className="font-black text-slate-800 uppercase text-[11px] tracking-wider border-b pb-1">
                  1. Dados da Empresa
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 font-bold block">Razão Social:</span>
                    <span className="font-semibold text-slate-800">{viewingSupplier.razaoSocial || viewingSupplier.nome}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">Nome Fantasia:</span>
                    <span className="font-semibold text-slate-800">{viewingSupplier.nomeFantasia || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">NIF:</span>
                    <span className="font-semibold text-slate-800">{viewingSupplier.nif || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">Data de Constituição:</span>
                    <span className="font-semibold text-slate-800">{viewingSupplier.dataConstituicao || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Secção 2 */}
              <div className="space-y-2">
                <h4 className="font-black text-slate-800 uppercase text-[11px] tracking-wider border-b pb-1">
                  2. Localização e Contactos
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <span className="text-slate-400 font-bold block">Endereço Completo:</span>
                    <span className="font-semibold text-slate-800">{viewingSupplier.enderecoCompleto || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">Cidade / Província:</span>
                    <span className="font-semibold text-slate-800">{viewingSupplier.cidadeProvincia || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">País:</span>
                    <span className="font-semibold text-slate-800">{viewingSupplier.pais || "Moçambique"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">Telefone:</span>
                    <span className="font-semibold text-slate-800">{viewingSupplier.telefone || viewingSupplier.contacto || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">Email:</span>
                    <span className="font-semibold text-slate-800">{viewingSupplier.email || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Secção 3 */}
              <div className="space-y-2">
                <h4 className="font-black text-slate-800 uppercase text-[11px] tracking-wider border-b pb-1">
                  3. Representante Legal
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 font-bold block">Nome:</span>
                    <span className="font-semibold text-slate-800">{viewingSupplier.repNomeCompleto || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">Cargo:</span>
                    <span className="font-semibold text-slate-800">{viewingSupplier.repCargo || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">Telefone:</span>
                    <span className="font-semibold text-slate-800">{viewingSupplier.repTelefone || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">Email:</span>
                    <span className="font-semibold text-slate-800">{viewingSupplier.repEmail || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Secção 4 */}
              <div className="space-y-2">
                <h4 className="font-black text-slate-800 uppercase text-[11px] tracking-wider border-b pb-1">
                  4. Dados Bancários
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 font-bold block">Banco:</span>
                    <span className="font-semibold text-slate-800">{viewingSupplier.banco || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">Agência:</span>
                    <span className="font-semibold text-slate-800">{viewingSupplier.agencia || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">Conta Bancária:</span>
                    <span className="font-semibold text-slate-800">{viewingSupplier.numeroConta || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">IBAN / NIB:</span>
                    <span className="font-semibold text-slate-800">{viewingSupplier.ibanSwift || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Secção 5 */}
              <div className="space-y-2">
                <h4 className="font-black text-slate-800 uppercase text-[11px] tracking-wider border-b pb-1">
                  5. Atuação & Documentação
                </h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-slate-400 font-bold block">Categoria Principal:</span>
                    <span className="font-semibold text-slate-800">{viewingSupplier.categoriaPrincipal || viewingSupplier.tipoServico || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">Produtos / Serviços Oferecidos:</span>
                    <span className="font-semibold text-slate-800">{viewingSupplier.produtosServicosOferecidos || "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  const s = viewingSupplier;
                  setViewingSupplier(null);
                  setEditingSupplier(s);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2"
              >
                <Edit2 size={16} /> Editar Informações
              </button>

              <button
                onClick={() => setViewingSupplier(null)}
                className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Eliminação */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-xl">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-base font-black text-slate-800">
                Confirmar Eliminação
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              Tem a certeza de que deseja remover este fornecedor do sistema? Esta ação é irreversível.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md"
                disabled={isDeleting}
              >
                {isDeleting ? "A Eliminar..." : "Sim, Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


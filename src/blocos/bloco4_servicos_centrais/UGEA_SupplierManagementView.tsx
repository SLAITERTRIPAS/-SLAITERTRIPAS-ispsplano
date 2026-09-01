import React from "react";
import { ArrowLeft, Plus, Building2 } from "lucide-react";
import { Supplier } from "../../types";

interface SupplierManagementViewProps {
  onBack: () => void;
  onAddSupplier: () => void;
  suppliers: Supplier[];
}

export default function UGEA_SupplierManagementView({
  onBack,
  onAddSupplier,
  suppliers,
}: SupplierManagementViewProps) {
  return (
    <div className="h-full w-full bg-white flex flex-col p-6">
      <div className="flex justify-between items-center mb-8 bg-gray-50 p-6 rounded-3xl border border-gray-100">
        <h1 className="text-2xl font-black text-blue-900">
          Gestão de Fornecedores
        </h1>
        <button
          onClick={onAddSupplier}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-black tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-100"
        >
          <Plus size={20} /> Novo Registo
        </button>
      </div>
      <div className="flex-grow overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="p-4">Fornecedor</th>
              <th className="p-4">Tipo de Serviço</th>
              <th className="p-4">Validade de Contrato</th>
              <th className="p-4">Contato</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id} className="border-b border-gray-100">
                <td className="p-4 flex items-center gap-3">
                  <div className="bg-gray-100 p-2 rounded-full">
                    <Building2 size={16} />
                  </div>
                  {s.nome}
                </td>
                <td className="p-4">{s.tipoServico}</td>
                <td className="p-4">{s.validadeContrato}</td>
                <td className="p-4">{s.contacto}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

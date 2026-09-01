import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Save,
  X,
  Printer,
  MapPin,
  Package,
  ArrowRight,
  User,
} from "lucide-react";
import { firestoreService } from "../../lib/firestoreService";
import { formatTrackingCode } from "../../lib/trackingUtils";
import { FormLayout } from "../../components/shared/FormLayout";

export default function GuiaTransferenciaBens({
  user,
  onCancel,
}: {
  user: any;
  onCancel: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    numeroGuia: "A carregar...",
    data: new Date().toISOString().split("T")[0],
    origem: user?.departamento || "",
    destino: "",
    solicitante: user?.name || "",
    responsavelTransp: "",
    matriculaVeiculo: "",
    observacoes: "",
    itens: [
      { id: "1", codigo: "", descricao: "", qtd: 1, unid: "UN", estado: "Bom" },
    ],
  });

  React.useEffect(() => {
    const generateCode = async () => {
      const unitKey = `GUIA-${user?.direcao || "Dir"}-${user?.departamento || "Dep"}`;
      const nextNum = await firestoreService.counters.getNextNumber(unitKey);
      setFormData((prev) => ({
        ...prev,
        numeroGuia: formatTrackingCode(
          user?.direcao || "GDG",
          user?.departamento || "DPEP",
          "Transf",
          nextNum,
        ),
      }));
    };
    generateCode();
  }, [user]);

  const handleAddField = () => {
    setFormData((prev) => ({
      ...prev,
      itens: [
        ...prev.itens,
        {
          id: Math.random().toString(36).substr(2, 9),
          codigo: "",
          descricao: "",
          qtd: 1,
          unid: "UN",
          estado: "Bom",
        },
      ],
    }));
  };

  const handleUpdateItem = (id: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      itens: prev.itens.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const handleRemoveField = (id: string) => {
    if (formData.itens.length > 1) {
      setFormData((prev) => ({
        ...prev,
        itens: prev.itens.filter((item) => item.id !== id),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await firestoreService.requisicoes_internas.add({
        ...formData,
        tipo: "Guia de Transferência",
        userId: user.id,
        timestamp: new Date().toISOString(),
      });
      setIsSubmitted(true);
    } catch (error) {
      console.error(error);
      alert("Erro ao submeter guia.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormLayout
      hidePrintHeader={true}
      title="Guia de Transferência de Bens"
      subtitle="Movimentação Patrimonial Interna"
      icon={ArrowRight}
      bannerColor="bg-emerald-900"
      iconColor="text-emerald-400"
      trackingCode={formData.numeroGuia}
      onCancel={onCancel}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      isSubmitted={isSubmitted}
      successTitle="Guia Registada!"
      successMessage={
        <>
          A Guia de Transferência{" "}
          <span className="font-bold text-slate-900">
            {formData.numeroGuia}
          </span>{" "}
          foi registada. O transporte dos bens está agora autorizado.
        </>
      }
      maxWidth="max-w-5xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
            <MapPin size={18} className="text-emerald-600" />
            <h3 className="font-black text-slate-900 text-xs tracking-widest">
              Rota e Origem
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">
                Unidade/Setor de Origem
              </label>
              <input
                readOnly
                value={formData.origem}
                className="w-full p-3 bg-slate-50 border rounded-xl text-sm font-bold outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">
                Unidade/Setor de Destino
              </label>
              <input
                required
                value={formData.destino}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, destino: e.target.value }))
                }
                placeholder="Ex: Secretaria Geral / Armazém B"
                className="w-full p-3 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
            <User size={18} className="text-emerald-600" />
            <h3 className="font-black text-slate-900 text-xs tracking-widest">
              Responsabilidade e Transporte
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">
                Responsável pelo Transporte
              </label>
              <input
                required
                value={formData.responsavelTransp}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    responsavelTransp: e.target.value,
                  }))
                }
                placeholder="Nome do condutor / funcionário"
                className="w-full p-3 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">
                Matrícula do Veículo (se aplicável)
              </label>
              <input
                value={formData.matriculaVeiculo}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    matriculaVeiculo: e.target.value,
                  }))
                }
                placeholder="Ex: ABC-123-GP"
                className="w-full p-3 border rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Package size={18} className="text-emerald-600" />
            <h3 className="font-black text-slate-900 text-xs tracking-widest">
              Relação de Bens Transferidos
            </h3>
          </div>
          <button
            type="button"
            onClick={handleAddField}
            className="text-[10px] font-bold text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-all border border-emerald-100 print:hidden"
          >
            + Adicionar Item
          </button>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] font-black text-slate-400 tracking-widest border-b border-slate-100">
              <th className="py-4 px-2">Cód. Património</th>
              <th className="py-4 px-2">Descrição do Bem</th>
              <th className="py-4 px-2 w-20 text-center">Qtd</th>
              <th className="py-4 px-2 w-20 text-center">Unid</th>
              <th className="py-4 px-2">Estado</th>
              <th className="py-4 px-2 w-10 print:hidden"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {formData.itens.map((item) => (
              <tr key={item.id} className="group">
                <td className="py-3 px-2">
                  <input
                    value={item.codigo}
                    onChange={(e) =>
                      handleUpdateItem(item.id, "codigo", e.target.value)
                    }
                    className="w-full bg-transparent outline-none text-xs font-mono font-bold"
                    placeholder="Ex: GP-001"
                  />
                </td>
                <td className="py-3 px-2">
                  <input
                    required
                    value={item.descricao}
                    onChange={(e) =>
                      handleUpdateItem(item.id, "descricao", e.target.value)
                    }
                    className="w-full bg-transparent outline-none text-xs font-bold"
                    placeholder="Descrição detalhada..."
                  />
                </td>
                <td className="py-3 px-2">
                  <input
                    type="number"
                    value={item.qtd}
                    onChange={(e) =>
                      handleUpdateItem(item.id, "qtd", Number(e.target.value))
                    }
                    className="w-full bg-transparent outline-none text-xs text-center font-bold"
                  />
                </td>
                <td className="py-3 px-2">
                  <select
                    value={item.unid}
                    onChange={(e) =>
                      handleUpdateItem(item.id, "unid", e.target.value)
                    }
                    className="w-full bg-transparent outline-none text-xs text-center font-bold"
                  >
                    <option>UN</option>
                    <option>CX</option>
                    <option>Pct</option>
                  </select>
                </td>
                <td className="py-3 px-2">
                  <select
                    value={item.estado}
                    onChange={(e) =>
                      handleUpdateItem(item.id, "estado", e.target.value)
                    }
                    className="w-full bg-transparent outline-none text-xs font-bold"
                  >
                    <option>Bom</option>
                    <option>Regular</option>
                    <option>Danificado</option>
                  </select>
                </td>
                <td className="py-3 px-2 text-right print:hidden">
                  <button
                    type="button"
                    onClick={() => handleRemoveField(item.id)}
                    className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pt-8 border-t border-slate-100 flex justify-end gap-4 print:hidden">
        <button
          type="button"
          onClick={onCancel}
          className="px-8 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs tracking-widest hover:bg-slate-200 transition-all"
        >
          Descartar
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isSubmitted}
          className="px-10 py-3 bg-emerald-900 text-white rounded-xl font-black text-xs tracking-[0.2em] hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50 flex items-center gap-2"
        >
          <Save size={18} />{" "}
          {isSubmitting
            ? "Submetendo..."
            : isSubmitted
              ? "Transferência Registada"
              : "Emitir Guia de Transferência"}
        </button>
      </div>
    </FormLayout>
  );
}

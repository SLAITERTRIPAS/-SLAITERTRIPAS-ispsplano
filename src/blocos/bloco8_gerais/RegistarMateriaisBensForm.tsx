import { printElementById } from "../../lib/printUtils";
import React, { useEffect } from "react";
import { Package, Save, X, ShieldCheck, Printer } from "lucide-react";
import { motion } from "motion/react";
import { firestoreService } from "../../lib/firestoreService";
import { formatTrackingCode } from "../../lib/trackingUtils";

export default function RegistarMateriaisBensForm({
  onCancel,
  onSubmit,
  local,
  user,
}: {
  onCancel: () => void;
  onSubmit: (data: any) => void;
  local: string;
  user?: any;
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [nome, setNome] = React.useState("");
  const [tipo, setTipo] = React.useState("Equipamento");

  // State for all potential fields
  const [fields, setFields] = React.useState<any>({
    referencia: "A carregar...",
    proprietario: user?.name || "",
    nif: user?.nuit || "",
  });

  useEffect(() => {
    const generateCode = async () => {
      const unitKey = `BEM-${user?.direcao || "Dir"}-${user?.departamento || "Dep"}`;
      const nextNum = await firestoreService.counters.getNextNumber(unitKey);
      const trackingCode = formatTrackingCode(
        user?.direcao || "GDG",
        user?.departamento || "DPEP",
        user?.reparticao || "Patr",
        nextNum,
      );
      setFields((prev) => ({ ...prev, referencia: trackingCode }));
    };
    generateCode();
  }, [user]);

  const handleLocalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        nome,
        tipo,
        ...fields,
        local,
        dataRegisto: new Date().toISOString(),
      });
      setIsSubmitted(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (key: string, value: any) => {
    setFields((prev: any) => ({ ...prev, [key]: value }));
  };

  const renderFields = () => {
    // Determine which fields to show based on the selected category (tipo)
    if (tipo === "Imóveis") {
      return (
      <div className="space-y-4">
          <h4 className="font-bold text-sm text-gray-700">
            A. Identificação do Apresentante/Proprietário
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nome Completo"
              onChange={(e) => updateField("proprietario", e.target.value)}
              className="p-3 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Nif"
              onChange={(e) => updateField("nif", e.target.value)}
              className="p-3 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Estado Civil"
              onChange={(e) => updateField("estadoCivil", e.target.value)}
              className="p-3 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Documento Identificação"
              onChange={(e) => updateField("docIdent", e.target.value)}
              className="p-3 border rounded-lg"
            />
          </div>

          <h4 className="font-bold text-sm text-gray-700 mt-4">
            B. Identificação do Imóvel
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Localização (Distrito/Concelho)"
              onChange={(e) => updateField("localizacao", e.target.value)}
              className="p-3 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Artigo Matricial"
              onChange={(e) => updateField("artigo", e.target.value)}
              className="p-3 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Morada completa"
              onChange={(e) => updateField("morada", e.target.value)}
              className="p-3 border rounded-lg col-span-2"
            />
          </div>
        </div>
      );
    }

    if (tipo === "Móveis") {
      return (
        <div className="space-y-4">
          <h4 className="font-bold text-sm text-gray-700">
            1. Identificação Geral
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Tipo de Móvel (Mesa, Cadeira, etc)"
              onChange={(e) => updateField("subtipo", e.target.value)}
              className="p-3 border rounded-lg"
            />
            <input
              type="text"
              placeholder="ID/Nº de Património"
              onChange={(e) => updateField("patrimonio", e.target.value)}
              className="p-3 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Divisão/Localização"
              onChange={(e) => updateField("divisao", e.target.value)}
              className="p-3 border rounded-lg"
            />
          </div>
        </div>
      );
    }

    // Default for Consumíveis, Inconsumíveis, Bens Duráveis, Bens Não Duráveis
    return (
      <div className="space-y-4">
        <h4 className="font-bold text-sm text-gray-700">Detalhes do Item</h4>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Marca/Fabricante"
            onChange={(e) => updateField("marca", e.target.value)}
            className="p-3 border rounded-lg"
          />
          <input
            type="text"
            placeholder="Modelo/Referência"
            onChange={(e) => updateField("modelo", e.target.value)}
            className="p-3 border rounded-lg"
          />
          <input
            type="number"
            placeholder="Quantidade Inicial"
            onChange={(e) => updateField("quantidadeInicial", e.target.value)}
            className="p-3 border rounded-lg"
          />
          <input
            type="text"
            placeholder="Unidade (Ex: Kg, Un, Caixa)"
            onChange={(e) => updateField("unidade", e.target.value)}
            className="p-3 border rounded-lg"
          />
          <select
            onChange={(e) => updateField("estadoAtual", e.target.value)}
            className="p-3 border rounded-lg"
          >
            <option value="">Estado Atual...</option>
            <option>Novo</option>
            <option>Bom</option>
            <option>Necessita Reparação</option>
            <option>Inoperante</option>
          </select>
          <input
            type="text"
            placeholder="Localização no Depósito"
            onChange={(e) => updateField("localDeposito", e.target.value)}
            className="p-3 border rounded-lg"
          />
        </div>
      </div>
    );
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
            <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-6 mx-auto">
              <ShieldCheck size={40} className="text-amber-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-2">
              Bem Registado!
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              O bem <span className="font-bold text-slate-900">{nome}</span> foi
              registado no inventário com sucesso sob a referência{" "}
              <span className="font-black text-blue-600 font-mono tracking-tighter">
                {fields.referencia}
              </span>
              .
            </p>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => printElementById("print-area")}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2"
              >
                <Printer size={18} /> Imprimir Etiqueta / Ficha
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

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-4xl mx-auto border border-gray-200">
        <div className="bg-blue-900 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Package size={32} />
            <div>
              <h2 className="text-2xl font-bold">Registo de Bens</h2>
              <p className="text-blue-100 text-sm">
                Registe os bens em: {local}
              </p>
            </div>
          </div>

          {/* Tracking Code Badge */}
          <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/20 backdrop-blur-md">
            <div className="text-[10px] font-black text-blue-300 tracking-widest leading-tight">
              Rastreio Interno
            </div>
            <div className="text-sm font-mono font-black text-white leading-tight">
              {fields.referencia}
            </div>
          </div>
        </div>

        <form onSubmit={handleLocalSubmit} className="p-8 space-y-6">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center mb-6">
            <div className="text-blue-900 font-bold text-sm tracking-widest">
              Referência de Registo
            </div>
            <div className="font-mono text-blue-900 font-black">
              {fields.referencia}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do Bem"
              className="p-3 border rounded-lg"
              required
            />
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="p-3 border rounded-lg"
            >
              <option value="Imóveis">Imóveis</option>
              <option value="Móveis">Móveis</option>
              <option value="Consumíveis">Consumíveis</option>
              <option value="Inconsumíveis">Inconsumíveis</option>
              <option value="Bens Duráveis">Bens Duráveis</option>
              <option value="Bens Não Duráveis">Bens Não Duráveis</option>
            </select>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-bold mb-4">Detalhes Específicos</h3>
            {renderFields()}
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border rounded-lg font-bold text-gray-700 hover:bg-gray-50 text-sm flex items-center gap-2"
            >
              <X size={16} /> Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isSubmitted}
              className="px-10 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-2xl flex items-center gap-3 text-xs tracking-[0.2em] border border-slate-800 disabled:opacity-50"
            >
              <Save size={18} className="text-amber-400" />{" "}
              {isSubmitting
                ? "Regastrando..."
                : isSubmitted
                  ? "Registado"
                  : "Submeter no Inventário"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

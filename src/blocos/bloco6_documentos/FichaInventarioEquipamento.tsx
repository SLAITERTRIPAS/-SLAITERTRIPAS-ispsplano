import React from "react";
import {
  Save,
  Cpu,
  Info,
  Settings,
  Zap,
  Upload,
  FileText,
  Trash2,
} from "lucide-react";

import { firestoreService } from "../../lib/firestoreService";
import { formatTrackingCode } from "../../lib/trackingUtils";
import { FormLayout } from "../../components/shared/FormLayout";

interface FichaInventarioEquipamentoProps {
  onCancel: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  user?: any;
  isReadOnly?: boolean;
}

export const FichaInventarioEquipamento: React.FC<
  FichaInventarioEquipamentoProps
> = ({ onCancel, onSubmit, initialData, user, isReadOnly = false }) => {
  const [anexos, setAnexos] = React.useState<any[]>(initialData?.anexos || []);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [formData, setFormData] = React.useState({
    // Identificação
    numeroInventario: initialData?.numeroInventario || "A carregar...",
    data: initialData?.data || new Date().toISOString().split("T")[0],
    codigoBem: initialData?.id || initialData?.codigoBem || "",

    // Equipamento
    designacao: initialData?.nome || initialData?.designacao || "",
    marca: initialData?.marca || "",
    modelo: initialData?.modelo || "",
    numeroSerie: initialData?.numeroSerie || "",
    fabricante: initialData?.fabricante || "",

    // Características
    voltagem: initialData?.voltagem || "220V",
    potencia: initialData?.potencia || "",
    peso: initialData?.peso || "",

    // Localização/Uso
    departamento: initialData?.departamento || user?.departamento || "",
    utilizador:
      initialData?.reponsavel || initialData?.utilizador || user?.name || "",

    // Estado
    estadoFuncionamento: initialData?.estadoFuncionamento || "Operacional",
    ultimaManutencao: initialData?.ultimaManutencao || "",
    periodicidadeManutencao: initialData?.periodicidadeManutencao || "Anual",

    // Meta
    utilizadorNome: user?.name || "Sistema",
    utilizadorEmail: user?.email || "",
    preenchidoPor: user?.name || "",
    tipoFicha: "Equipamento",
  });

  React.useEffect(() => {
    if (!initialData?.numeroInventario) {
      const generateCode = async () => {
        const unitKey = `INV-${user?.direcao || "Dir"}-${user?.departamento || "Dep"}`;
        const nextNum = await firestoreService.counters.getNextNumber(unitKey);
        const trackingCode = formatTrackingCode(
          user?.direcao || "GDG",
          user?.departamento || "DPEP",
          user?.reparticao || "Patr",
          nextNum,
        );
        setFormData((prev) => ({ ...prev, numeroInventario: trackingCode }));
      };
      generateCode();
    }
  }, [user, initialData]);

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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({ ...formData, anexos });
      setIsSubmitted(true);
    } catch (error) {
      console.error(error);
      alert("Erro ao submeter ficha de inventário.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormLayout
      title="Ficha de Inventário de Equipamento"
      subtitle="Património do Estado - MIP 04"
      icon={Cpu}
      bannerColor="bg-slate-800"
      iconColor="text-emerald-400"
      trackingCode={formData.numeroInventario}
      onCancel={onCancel}
      onSubmit={handleLocalSubmit}
      isSubmitting={isSubmitting}
      isSubmitted={isSubmitted}
      successTitle="Inventário Registado!"
      successMessage={
        <>
          A ficha{" "}
          <span className="font-bold text-slate-900">
            {formData.numeroInventario}
          </span>{" "}
          foi gravada com sucesso. Pode agora descarregar o documento oficial
          para arquivo físico.
        </>
      }
      maxWidth="max-w-4xl"
    >
      <div className="space-y-8">
        <fieldset
          disabled={isReadOnly}
          className="border-none p-0 m-0 w-full min-w-0 space-y-8"
        >
          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-800">
              <Info size={20} className="text-emerald-500" />
              <h3 className="font-bold text-slate-900 text-xs tracking-widest ">
                Especificações Gerais
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1 space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ">
                  Código do Bem
                </label>
                <input
                  name="codigoBem"
                  value={formData.codigoBem}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border rounded-xl text-sm font-mono outline-none"
                />
              </div>
              <div className="md:col-span-3 space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ">
                  Designação Completa
                </label>
                <input
                  name="designacao"
                  value={formData.designacao}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border rounded-xl text-sm font-bold outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ">
                  Marca
                </label>
                <input
                  name="marca"
                  value={formData.marca}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ">
                  Modelo
                </label>
                <input
                  name="modelo"
                  value={formData.modelo}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none"
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ">
                  Nº de Série
                </label>
                <input
                  name="numeroSerie"
                  value={formData.numeroSerie}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border rounded-xl text-sm font-mono outline-none"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-800">
              <Zap size={20} className="text-emerald-500" />
              <h3 className="font-bold text-slate-900 text-xs tracking-widest ">
                Características Técnicas
              </h3>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ">
                  Voltagem
                </label>
                <input
                  name="voltagem"
                  value={formData.voltagem}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ">
                  Potência
                </label>
                <input
                  name="potencia"
                  value={formData.potencia}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ">
                  Peso (Kg)
                </label>
                <input
                  name="peso"
                  value={formData.peso}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none"
                />
              </div>
              <div className="md:col-span-3 space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ">
                  Fabricante / Fornecedor
                </label>
                <input
                  name="fabricante"
                  value={formData.fabricante}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-800">
              <Settings size={20} className="text-emerald-500" />
              <h3 className="font-bold text-slate-900 text-xs tracking-widest ">
                Utilização e Manutenção
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ">
                  Localização / Dep.
                </label>
                <input
                  name="departamento"
                  value={formData.departamento}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ">
                  Utilizador Actual
                </label>
                <input
                  name="utilizador"
                  value={formData.utilizador}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ">
                  Estado de Funcionamento
                </label>
                <select
                  name="estadoFuncionamento"
                  value={formData.estadoFuncionamento}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border rounded-xl text-sm text-emerald-600 font-bold outline-none"
                >
                  <option>Operacional</option>
                  <option>Em Manutenção</option>
                  <option>Avariado</option>
                  <option>Inoperacional/Abate</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ">
                  Data da Última Manutenção
                </label>
                <input
                  type="date"
                  name="ultimaManutencao"
                  value={formData.ultimaManutencao}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ">
                  Periodicidade de Manutenção
                </label>
                <select
                  name="periodicidadeManutencao"
                  value={formData.periodicidadeManutencao}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none"
                >
                  <option>Semanal</option>
                  <option>Mensal</option>
                  <option>Trimestral</option>
                  <option>Semestral</option>
                  <option>Anual</option>
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-800">
              <FileText size={20} className="text-emerald-500" />
              <h3 className="font-bold text-slate-900 text-xs tracking-widest ">
                Documentação Técnica Anexa
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                className={`border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center transition-all relative print:hidden ${isReadOnly ? "bg-slate-50 cursor-not-allowed" : "hover:border-emerald-400 hover:bg-emerald-50/10 cursor-pointer group"}`}
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
                    className={`p-4 rounded-full transition-colors ${isReadOnly ? "bg-slate-100 text-slate-300" : "bg-slate-100 group-hover:bg-emerald-100"}`}
                  >
                    <Upload
                      className={
                        isReadOnly
                          ? "text-slate-300"
                          : "text-slate-400 group-hover:text-emerald-500"
                      }
                      size={32}
                    />
                  </div>
                  <p
                    className={`text-sm font-bold transition-colors ${isReadOnly ? "text-slate-400" : "text-slate-600 group-hover:text-indigo-900"}`}
                  >
                    {isReadOnly
                      ? "Documentos em Anexo"
                      : "Arraste ou Clique para Anexar"}
                  </p>
                  <p className="text-[10px] text-slate-400 font-black">
                    Manuais, Garantias, Certificados (PDF, JPG, PNG)
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
                          <FileText className="text-emerald-500" size={16} />
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
                          type="button"
                          onClick={() => removeAnexo(idx)}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all print:hidden"
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

        <div className="flex justify-end gap-4 pt-8 border-t border-slate-100 print:hidden">
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-xs tracking-widest "
          >
            {isReadOnly ? "Fechar" : "Cancelar"}
          </button>
          {!isReadOnly && (
            <button
              type="submit"
              disabled={isSubmitting || isSubmitted}
              className="px-10 py-3 bg-slate-800 text-white rounded-xl font-black text-xs tracking-[0.2em] hover:bg-slate-700 transition-all shadow-xl shadow-slate-100 disabled:opacity-50 flex items-center gap-2 "
            >
              <Save size={18} />{" "}
              {isSubmitting
                ? "Submetendo..."
                : isSubmitted
                  ? "Registado"
                  : "Registar Equipamento no Sistema"}
            </button>
          )}
        </div>
      </div>
    </FormLayout>
  );
};

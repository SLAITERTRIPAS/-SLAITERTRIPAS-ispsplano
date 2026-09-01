import React from "react";
import { Save, Car, Info, Gauge, Upload, FileText, Trash2 } from "lucide-react";

import { firestoreService } from "../../lib/firestoreService";
import { formatTrackingCode } from "../../lib/trackingUtils";
import { FormLayout } from "../../components/shared/FormLayout";

interface FichaInventarioVeiculoProps {
  onCancel: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  user?: any;
  isReadOnly?: boolean;
}

export const FichaInventarioVeiculo: React.FC<FichaInventarioVeiculoProps> = ({
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
    // Identificação
    numeroInventario: initialData?.numeroInventario || "A carregar...",
    data: initialData?.data || new Date().toISOString().split("T")[0],

    // Veículo
    matricula: initialData?.matricula || "",
    marca: initialData?.marca || "",
    modelo: initialData?.modelo || "",
    anoFabrico: initialData?.anoFabrico || "",
    cor: initialData?.cor || "",
    numeroChassis: initialData?.numeroChassis || "",
    numeroMotor: initialData?.numeroMotor || "",
    tipoCombustivel: initialData?.tipoCombustivel || "Diesel",
    quilometragem: initialData?.quilometragem || "",

    // Estado
    estadoGeral: initialData?.estadoGeral || "Bom",
    seguroValidade: initialData?.seguroValidade || "",
    inspeccaoValidade: initialData?.inspeccaoValidade || "",

    // Meta
    utilizadorNome: user?.name || "Sistema",
    utilizadorEmail: user?.email || "",
    preenchidoPor: user?.name || "",
    tipoFicha: "Veículo",
  });

  React.useEffect(() => {
    if (!initialData?.numeroInventario) {
      const generateCode = async () => {
        const unitKey = `INV-VEI-${user?.direcao || "Dir"}-${user?.departamento || "Dep"}`;
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

  return (
    <FormLayout
      title="Ficha de Inventário de Veículo"
      subtitle="Património do Estado - MIP 03"
      icon={Car}
      bannerColor="bg-slate-900"
      iconColor="text-orange-400"
      trackingCode={formData.numeroInventario}
      onCancel={onCancel}
      onSubmit={handleLocalSubmit}
      isSubmitting={isSubmitting}
      isSubmitted={isSubmitted}
      successTitle="Inventário de Veículo!"
      successMessage={
        <>
          O veículo{" "}
          <span className="font-bold text-slate-900">
            {formData.matricula || formData.numeroInventario}
          </span>{" "}
          foi registado. Pode descarregar a ficha MIP 03 agora.
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
            <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-900">
              <Info size={20} className="text-orange-500" />
              <h3 className="font-bold text-slate-900 text-xs tracking-widest ">
                Identificação do Veículo
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ">
                  Matrícula
                </label>
                <input
                  name="matricula"
                  value={formData.matricula}
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
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ">
                  Ano de Fabrico
                </label>
                <input
                  name="anoFabrico"
                  value={formData.anoFabrico}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-900">
              <Gauge size={20} className="text-orange-500" />
              <h3 className="font-bold text-slate-900 text-xs tracking-widest ">
                Especificações Técnicas
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ">
                  Número do Chassis
                </label>
                <input
                  name="numeroChassis"
                  value={formData.numeroChassis}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border rounded-xl text-sm font-mono outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ">
                  Número do Motor
                </label>
                <input
                  name="numeroMotor"
                  value={formData.numeroMotor}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border rounded-xl text-sm font-mono outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ">
                  Tipo de Combustível
                </label>
                <select
                  name="tipoCombustivel"
                  value={formData.tipoCombustivel}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none"
                >
                  <option>Gasolina</option>
                  <option>Diesel</option>
                  <option>Gás</option>
                  <option>Eléctrico</option>
                  <option>Híbrido</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ">
                  Cor Predominante
                </label>
                <input
                  name="cor"
                  value={formData.cor}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ">
                  Quilometragem Actual (Km)
                </label>
                <input
                  name="quilometragem"
                  value={formData.quilometragem}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border rounded-xl text-sm font-bold outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ">
                  Estado Geral
                </label>
                <select
                  name="estadoGeral"
                  value={formData.estadoGeral}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none"
                >
                  <option>Novo</option>
                  <option>Muito Bom</option>
                  <option>Bom</option>
                  <option>Razoável</option>
                  <option>Mau (Inoperante)</option>
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-900">
              <FileText size={20} className="text-orange-500" />
              <h3 className="font-bold text-slate-900 text-xs tracking-widest ">
                Documentação e Validades
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ">
                  Data Validade Seguro
                </label>
                <input
                  type="date"
                  name="seguroValidade"
                  value={formData.seguroValidade}
                  onChange={handleChange}
                  className="w-full p-3 bg-orange-50/50 border border-orange-100 rounded-xl text-sm outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ">
                  Data Validade Inspecção
                </label>
                <input
                  type="date"
                  name="inspeccaoValidade"
                  value={formData.inspeccaoValidade}
                  onChange={handleChange}
                  className="w-full p-3 bg-orange-50/50 border border-orange-100 rounded-xl text-sm outline-none"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-900">
              <FileText size={20} className="text-orange-500" />
              <h3 className="font-bold text-slate-900 text-xs tracking-widest ">
                Documentação Anexa
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                className={`border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center transition-all relative print:hidden ${isReadOnly ? "bg-slate-50 cursor-not-allowed" : "hover:border-orange-400 hover:bg-orange-50/10 cursor-pointer group"}`}
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
                    className={`p-4 rounded-full transition-colors ${isReadOnly ? "bg-slate-100 text-slate-300" : "bg-slate-100 group-hover:bg-orange-100"}`}
                  >
                    <Upload
                      className={
                        isReadOnly
                          ? "text-slate-300"
                          : "text-slate-400 group-hover:text-orange-500"
                      }
                      size={32}
                    />
                  </div>
                  <p
                    className={`text-sm font-bold transition-colors ${isReadOnly ? "text-slate-400" : "text-slate-600 group-hover:text-orange-900"}`}
                  >
                    {isReadOnly
                      ? "Documentos em Anexo"
                      : "Arraste ou Clique para Anexar"}
                  </p>
                  <p className="text-[10px] text-slate-400 font-black">
                    Livrete, Seguro, Título de Propriedade (PDF, JPG, PNG)
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
                          <FileText className="text-orange-500" size={16} />
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
              className="px-10 py-3 bg-slate-900 text-white rounded-xl font-black text-xs tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-100 disabled:opacity-50 flex items-center gap-2 "
            >
              <Save size={18} />{" "}
              {isSubmitting
                ? "Submetendo..."
                : isSubmitted
                  ? "Registado"
                  : "Registar FIV no Sistema"}
            </button>
          )}
        </div>
      </div>
    </FormLayout>
  );
};

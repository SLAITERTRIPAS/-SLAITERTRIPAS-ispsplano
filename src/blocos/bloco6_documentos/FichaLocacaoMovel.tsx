import React from "react";
import { Save, LayoutGrid, User, Upload, FileText, Trash2 } from "lucide-react";

import { firestoreService } from "../../lib/firestoreService";
import { formatTrackingCode } from "../../lib/trackingUtils";
import { FormLayout } from "../../components/shared/FormLayout";

interface FichaLocacaoMovelProps {
  onCancel: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  user?: any;
}

export const FichaLocacaoMovel: React.FC<FichaLocacaoMovelProps> = ({
  onCancel,
  onSubmit,
  initialData,
  user,
}) => {
  const [anexos, setAnexos] = React.useState<any[]>(initialData?.anexos || []);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [formData, setFormData] = React.useState({
    numeroFicha: initialData?.numeroFicha || "A carregar...",
    dataSolicitacao:
      initialData?.dataSolicitacao || new Date().toISOString().split("T")[0],

    // Locatário
    locatarioNome: initialData?.locatarioNome || user?.name || "",
    locatarioCargo: initialData?.locatarioCargo || user?.cargo || "",
    locatarioNuit: initialData?.locatarioNuit || user?.nuit || "",

    // Bem
    designacao: initialData?.designacao || "",
    quantidade: initialData?.quantidade || "1",
    localizacaoDestino: initialData?.localizacaoDestino || "",

    // Condições
    prazoMese: initialData?.prazoMese || "12",

    // Meta
    utilizadorNome: user?.name || "Sistema",
    tipoFicha: "LOCACAO_MOVEL",
  });

  React.useEffect(() => {
    if (!initialData?.numeroFicha) {
      const generateCode = async () => {
        const unitKey = `LOC-MOV-${user?.direcao || "Dir"}-${user?.departamento || "Dep"}`;
        const nextNum = await firestoreService.counters.getNextNumber(unitKey);
        const trackingCode = formatTrackingCode(
          user?.direcao || "GDG",
          user?.departamento || "DPEP",
          user?.reparticao || "Patr",
          nextNum,
        );
        setFormData((prev) => ({ ...prev, numeroFicha: trackingCode }));
      };
      generateCode();
    }
  }, [user, initialData]);

  const handleLocalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({ ...formData, anexos });
      setIsSubmitted(true);
    } catch (error) {
      console.error(error);
      alert("Erro ao submeter ficha de locação.");
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <FormLayout
      title="Ficha de Locação de Móveis / Mobiliário"
      subtitle="Património do Estado - Modelo de Mobiliário"
      icon={LayoutGrid}
      bannerColor="bg-blue-900"
      iconColor="text-blue-300"
      trackingCode={formData.numeroFicha}
      onCancel={onCancel}
      onSubmit={handleLocalSubmit}
      isSubmitting={isSubmitting}
      isSubmitted={isSubmitted}
      successTitle="Locação Registada!"
      successMessage={
        <>
          A ficha de locação{" "}
          <span className="font-bold text-slate-900">
            {formData.numeroFicha}
          </span>{" "}
          foi submetida com sucesso. Pode agora descarregar o PDF oficial.
        </>
      }
      maxWidth="max-w-4xl"
    >
      <div className="space-y-8">
        <section className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b-2 border-blue-900">
            <User size={20} className="text-blue-600" />
            <h3 className="font-bold text-slate-900 text-xs tracking-widest ">
              Dados do Solicitante / Utilizador
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 ">
                Nome Completo
              </label>
              <input
                name="locatarioNome"
                value={formData.locatarioNome}
                onChange={handleChange}
                className="w-full p-3 bg-slate-50 border rounded-xl text-sm font-bold outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 ">
                Cargo / Função
              </label>
              <input
                name="locatarioCargo"
                value={formData.locatarioCargo}
                onChange={handleChange}
                className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b-2 border-blue-900">
            <LayoutGrid size={20} className="text-blue-600" />
            <h3 className="font-bold text-slate-900 text-xs tracking-widest ">
              Identificação do Bem
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-slate-500 ">
                Designação do Bem (Móveis)
              </label>
              <input
                name="designacao"
                value={formData.designacao}
                onChange={handleChange}
                className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none"
                placeholder="Ex: Conjunto de mesa e cadeira de escritório"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 ">
                Quantidade
              </label>
              <input
                name="quantidade"
                type="number"
                value={formData.quantidade}
                onChange={handleChange}
                className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none"
              />
            </div>
            <div className="md:col-span-3 space-y-1">
              <label className="text-[10px] font-bold text-slate-500 ">
                Localização de Destino
              </label>
              <input
                name="localizacaoDestino"
                value={formData.localizacaoDestino}
                onChange={handleChange}
                className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b-2 border-blue-900">
            <FileText size={20} className="text-blue-600" />
            <h3 className="font-bold text-slate-900 text-xs tracking-widest ">
              Documentos Anexos
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/10 transition-all group relative cursor-pointer print:hidden">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload
                className="text-slate-400 group-hover:text-blue-500 mx-auto"
                size={32}
              />
              <p className="text-sm font-bold text-slate-600 mt-2">
                Arraste ou Clique para Anexar
              </p>
            </div>
            <div className="space-y-3">
              {anexos.length === 0 ? (
                <div className="h-full flex items-center justify-center border-2 border-slate-50 rounded-2xl p-4 italic text-slate-400 text-xs">
                  Nenhum item anexado.
                </div>
              ) : (
                anexos.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="text-blue-500" size={16} />
                      <span className="text-xs font-bold truncate max-w-[150px]">
                        {f.nome}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAnexo(i)}
                      className="text-slate-300 hover:text-red-500 transition-all print:hidden"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-4 pt-8 border-t border-slate-100 print:hidden">
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-xs tracking-widest "
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isSubmitted}
            className="px-10 py-3 bg-blue-900 text-white rounded-xl font-black text-xs tracking-[0.2em] hover:bg-blue-800 transition-all shadow-xl shadow-blue-100 disabled:opacity-50 flex items-center gap-2 "
          >
            <Save size={18} />{" "}
            {isSubmitting
              ? "Submetendo..."
              : isSubmitted
                ? "Registado"
                : "Submeter Locação de Móveis"}
          </button>
        </div>
      </div>
    </FormLayout>
  );
};

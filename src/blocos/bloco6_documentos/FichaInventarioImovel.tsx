import React from "react";
import {
  Home,
  MapPin,
  Info,
  FileText,
  Upload,
  Trash2,
  ShieldCheck,
  Save,
} from "lucide-react";

import { firestoreService } from "../../lib/firestoreService";
import { formatTrackingCode } from "../../lib/trackingUtils";
import { FormLayout } from "../../components/shared/FormLayout";

interface FichaInventarioImovelProps {
  onCancel: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  user?: any;
  isReadOnly?: boolean;
}

export const FichaInventarioImovel: React.FC<FichaInventarioImovelProps> = ({
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
    // Header
    numeroInventario: initialData?.numeroInventario || "A carregar...",
    data: initialData?.data || new Date().toISOString().split("T")[0],

    // Identificação
    designacao: initialData?.nome || initialData?.designacao || "",
    tipoImovel: initialData?.tipoImovel || "Residencial", // Residencial, Escritório, Armazém
    localizacao: initialData?.localizacao || "",
    areaBruta: initialData?.areaBruta || "",
    areaUtil: initialData?.areaUtil || "",
    numeroPisos: initialData?.numeroPisos || "",
    anoConstrucao: initialData?.anoConstrucao || "",

    // Registo
    conservatoria: initialData?.conservatoria || "",
    numRegisto: initialData?.numRegisto || "",
    artigoMatricial: initialData?.artigoMatricial || "",

    // Estado
    estadoConservacao: initialData?.estadoConservacao || "Bom",
    valorFiscal: initialData?.valorFiscal || "",
    valorMercado: initialData?.valorMercado || "",

    // Meta
    utilizadorNome: user?.name || "Sistema",
    utilizadorEmail: user?.email || "",
    preenchidoPor: user?.name || "",
    tipoFicha: "Imóvel",
  });

  React.useEffect(() => {
    if (!initialData?.numeroInventario) {
      const generateCode = async () => {
        const unitKey = `INV-IMO-${user?.direcao || "Dir"}-${user?.departamento || "Dep"}`;
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
      title="Ficha de Inventário de Imóvel"
      subtitle="Património do Estado - MIP 02"
      icon={Home}
      bannerColor="bg-indigo-900"
      iconColor="text-indigo-300"
      trackingCode={formData.numeroInventario}
      onCancel={onCancel}
      onSubmit={handleLocalSubmit}
      isSubmitting={isSubmitting}
      isSubmitted={isSubmitted}
      successTitle="Inventário Registado!"
      successMessage={
        <>
          O imóvel{" "}
          <span className="font-bold text-slate-900">
            {formData.designacao}
          </span>{" "}
          foi registado com o código{" "}
          <span className="font-black">{formData.numeroInventario}</span>. Pode
          agora descarregar a ficha MIP 02.
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
            <div className="flex items-center gap-2 pb-2 border-b-2 border-indigo-900">
              <MapPin size={20} className="text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-xs tracking-widest ">
                Identificação e Localização
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ">
                  Designação do Imóvel
                </label>
                <input
                  name="designacao"
                  value={formData.designacao}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ">
                  Tipo de Imóvel
                </label>
                <select
                  name="tipoImovel"
                  value={formData.tipoImovel}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border rounded-xl text-sm font-bold outline-none"
                >
                  <option>Residencial</option>
                  <option>Escritório</option>
                  <option>Armazém</option>
                  <option>Terreno</option>
                  <option>Equipamento Social</option>
                </select>
              </div>
              <div className="md:col-span-3 space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ">
                  Localização / Endereço Completo
                </label>
                <input
                  name="localizacao"
                  value={formData.localizacao}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-indigo-900">
              <Info size={20} className="text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-xs tracking-widest ">
                Características Técnicas e Legais
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ">
                  Área Bruta (m²)
                </label>
                <input
                  name="areaBruta"
                  value={formData.areaBruta}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border rounded-xl text-sm font-bold outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ">
                  Área Útil (m²)
                </label>
                <input
                  name="areaUtil"
                  value={formData.areaUtil}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ">
                  Nº de Pisos
                </label>
                <input
                  name="numeroPisos"
                  value={formData.numeroPisos}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ">
                  Ano de Construção
                </label>
                <input
                  name="anoConstrucao"
                  value={formData.anoConstrucao}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none"
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ">
                  Conservatória do Registo Predial
                </label>
                <input
                  name="conservatoria"
                  value={formData.conservatoria}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ">
                  Nº de Registo
                </label>
                <input
                  name="numRegisto"
                  value={formData.numRegisto}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border rounded-xl text-sm font-mono outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ">
                  Artigo Matricial
                </label>
                <input
                  name="artigoMatricial"
                  value={formData.artigoMatricial}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border rounded-xl text-sm font-mono outline-none"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-indigo-900">
              <FileText size={20} className="text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-xs tracking-widest ">
                Avaliação e Estado
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ">
                  Estado de Conservação
                </label>
                <select
                  name="estadoConservacao"
                  value={formData.estadoConservacao}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none"
                >
                  <option>Excelente</option>
                  <option>Bom</option>
                  <option>Razoável</option>
                  <option>Necessita Obras</option>
                  <option>Ruína</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ">
                  Valor Patrimonial / Fiscal (Mt)
                </label>
                <input
                  name="valorFiscal"
                  value={formData.valorFiscal}
                  onChange={handleChange}
                  className="w-full p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-sm font-bold text-indigo-700 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ">
                  Valor de Mercado / Avaliação (Mt)
                </label>
                <input
                  name="valorMercado"
                  value={formData.valorMercado}
                  onChange={handleChange}
                  className="w-full p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-sm font-bold text-indigo-700 outline-none"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-indigo-900">
              <FileText size={20} className="text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-xs tracking-widest ">
                Documentação Anexa
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                className={`border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center transition-all relative print:hidden ${isReadOnly ? "bg-slate-50 cursor-not-allowed" : "hover:border-indigo-400 hover:bg-indigo-50/10 cursor-pointer group"}`}
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
                    className={`p-4 rounded-full transition-colors ${isReadOnly ? "bg-slate-100 text-slate-300" : "bg-slate-100 group-hover:bg-indigo-100"}`}
                  >
                    <Upload
                      className={
                        isReadOnly
                          ? "text-slate-300"
                          : "text-slate-400 group-hover:text-indigo-500"
                      }
                      size={32}
                    />
                  </div>
                  <p
                    className={`text-sm font-bold transition-colors ${isReadOnly ? "text-slate-400" : "text-slate-600 group-hover:text-indigo-900"}`}
                  >
                    {isReadOnly
                      ? "Documentos em Anexo"
                      : "Arraste ou Clique para Anexar Comprovativos"}
                  </p>
                  <p className="text-[10px] text-slate-400 font-black">
                    Certidão, Planta, Fotos (PDF, JPG, PNG)
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
                          <FileText className="text-indigo-500" size={16} />
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
              className="px-10 py-3 bg-indigo-900 text-white rounded-xl font-black text-xs tracking-[0.2em] hover:bg-indigo-800 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 flex items-center gap-2 "
            >
              <Save size={18} />{" "}
              {isSubmitting
                ? "Submetendo..."
                : isSubmitted
                  ? "Registado"
                  : "Registar FII no Sistema"}
            </button>
          )}
        </div>
      </div>
    </FormLayout>
  );
};

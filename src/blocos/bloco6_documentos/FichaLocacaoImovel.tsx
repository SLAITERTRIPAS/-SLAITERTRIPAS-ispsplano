import React from "react";
import {
  Home,
  User,
  ShieldCheck,
  MapPin,
  Calendar,
  Upload,
  FileText,
  Trash2,
  Save,
} from "lucide-react";

import { firestoreService } from "../../lib/firestoreService";
import { formatTrackingCode } from "../../lib/trackingUtils";
import { FormLayout } from "../../components/shared/FormLayout";

interface FichaLocacaoImovelProps {
  onCancel: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  user?: any;
}

export const FichaLocacaoImovel: React.FC<FichaLocacaoImovelProps> = ({
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

    // Imóvel
    codigoImovel: initialData?.codigoImovel || "",
    tipoImovel: initialData?.tipoImovel || "Residência",
    endereco: initialData?.endereco || "",

    // Condições
    dataInicio: initialData?.dataInicio || "",
    dataFim: initialData?.dataFim || "",
    valorMensal: initialData?.valorMensal || "",

    // Meta
    utilizadorNome: user?.name || "Sistema",
    tipoFicha: "LOCACAO_IMOVEL",
  });

  React.useEffect(() => {
    if (!initialData?.numeroFicha) {
      const generateCode = async () => {
        const unitKey = `LOC-IMO-${user?.direcao || "Dir"}-${user?.departamento || "Dep"}`;
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
      title="Ficha de Locação de Imóvel"
      subtitle="Património do Estado - Modelo de Habitação/Escritório"
      icon={Home}
      bannerColor="bg-indigo-900"
      iconColor="text-indigo-300"
      trackingCode={formData.numeroFicha}
      onCancel={onCancel}
      onSubmit={handleLocalSubmit}
      isSubmitting={isSubmitting}
      isSubmitted={isSubmitted}
      successTitle="Locação Registada!"
      successMessage={
        <>
          A locação do imóvel{" "}
          <span className="font-bold text-slate-900">{formData.endereco}</span>{" "}
          foi submetida com sucesso. Pode agora descarregar o PDF oficial.
        </>
      }
      maxWidth="max-w-4xl"
    >
      <div className="space-y-8">
        <section className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b-2 border-indigo-900">
            <User size={20} className="text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-xs">
              Dados do Locatário / Ocupante
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
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 ">
                NUIT
              </label>
              <input
                name="locatarioNuit"
                value={formData.locatarioNuit}
                onChange={handleChange}
                className="w-full p-3 bg-slate-50 border rounded-xl text-sm font-mono outline-none"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b-2 border-indigo-900">
            <MapPin size={20} className="text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-xs">
              Identificação do Imóvel
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 ">
                Código do Imóvel
              </label>
              <input
                name="codigoImovel"
                value={formData.codigoImovel}
                onChange={handleChange}
                className="w-full p-3 bg-slate-50 border rounded-xl text-sm font-black outline-none"
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
                className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none"
              >
                <option>Residência</option>
                <option>Escritório</option>
                <option>Apartamento</option>
                <option>Armazém</option>
              </select>
            </div>
            <div className="md:col-span-3 space-y-1">
              <label className="text-[10px] font-bold text-slate-500 ">
                Endereço Completo
              </label>
              <input
                name="endereco"
                value={formData.endereco}
                onChange={handleChange}
                className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b-2 border-indigo-900">
            <Calendar size={20} className="text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-xs">
              Prazos e Valores
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 ">
                Data Início
              </label>
              <input
                type="date"
                name="dataInicio"
                value={formData.dataInicio}
                onChange={handleChange}
                className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 ">
                Data Fim (Contrato)
              </label>
              <input
                type="date"
                name="dataFim"
                value={formData.dataFim}
                onChange={handleChange}
                className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 ">
                Valor Mensal (MZN)
              </label>
              <input
                name="valorMensal"
                value={formData.valorMensal}
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
              Documentos Anexos
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-indigo-400 hover:bg-indigo-50/10 transition-all group relative cursor-pointer print:hidden">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-2">
                <div className="bg-slate-100 p-4 rounded-full group-hover:bg-indigo-100 transition-colors">
                  <Upload
                    className="text-slate-400 group-hover:text-indigo-500"
                    size={32}
                  />
                </div>
                <p className="text-sm font-bold text-slate-600 group-hover:text-indigo-900 transition-colors">
                  Arraste ou Clique para Anexar
                </p>
                <p className="text-[10px] text-slate-400">
                  BI, NUIT, Contrato de Aluguer
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {anexos.length === 0 ? (
                <div className="h-full flex items-center justify-center border-2 border-slate-50 rounded-2xl p-4 italic text-slate-400 text-xs">
                  Nenhum documento anexado.
                </div>
              ) : (
                anexos.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="text-indigo-500" size={16} />
                      <div className="leading-tight">
                        <p className="text-xs font-bold text-slate-900 truncate max-w-[150px]">
                          {file.nome}
                        </p>
                        <p className="text-[9px] text-slate-500 font-bold">
                          {file.tamanho}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAnexo(idx)}
                      className="p-1 text-slate-300 hover:text-red-500 transition-all print:hidden"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <div className="p-6 bg-slate-900 rounded-2xl text-white space-y-4">
          <div className="flex items-start gap-4">
            <ShieldCheck className="text-indigo-300 shrink-0" size={24} />
            <p className="text-[10px] text-indigo-100 italic leading-relaxed">
              Comprometo-me a zelar pela conservação do imóvel e seus pertences,
              responsabilizando-me por quaisquer danos decorrentes de mau uso. O
              não pagamento do aluguel ou taxas poderá resultar no despejo
              imediato conforme regulamentação vigente.
            </p>
          </div>
        </div>

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
            className="px-10 py-3 bg-indigo-900 text-white rounded-xl font-black text-xs tracking-[0.2em] hover:bg-indigo-800 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 flex items-center gap-2 "
          >
            <Save size={18} />{" "}
            {isSubmitting
              ? "Submetendo..."
              : isSubmitted
                ? "Registado"
                : "Submeter Ficha de Locação"}
          </button>
        </div>
      </div>
    </FormLayout>
  );
};

import React from "react";
import {
  Car,
  User,
  ShieldCheck,
  Calendar,
  Upload,
  Paperclip,
  FileText,
  Trash2,
  Save,
} from "lucide-react";
import { firestoreService } from "../../lib/firestoreService";
import { formatTrackingCode } from "../../lib/trackingUtils";
import { FormLayout } from "../../components/shared/FormLayout";

interface FichaLocacaoVeiculoProps {
  onCancel: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  user?: any;
}

export const FichaLocacaoVeiculo: React.FC<FichaLocacaoVeiculoProps> = ({
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
    locatarioNome: initialData?.locatarioNome || user?.name || "",
    locatarioCargo: initialData?.locatarioCargo || user?.cargo || "",
    locatarioDepartamento:
      initialData?.locatarioDepartamento || user?.departamento || "",
    locatarioNuit: initialData?.locatarioNuit || user?.nuit || "",
    matricula: initialData?.matricula || "",
    marcaModelo: initialData?.marcaModelo || "",
    anoFabrico: initialData?.anoFabrico || "",
    quilometragemSaida: initialData?.quilometragemSaida || "",
    dataInicio: initialData?.dataInicio || "",
    dataFim: initialData?.dataFim || "",
    finalidade: initialData?.finalidade || "",
    utilizadorNome: user?.name || "Sistema",
    tipoFicha: "LOCACAO_VEICULO",
  });

  React.useEffect(() => {
    if (!initialData?.numeroFicha) {
      const generateCode = async () => {
        const unitKey = `LOC-VEI-${user?.direcao || "Dir"}-${user?.departamento || "Dep"}`;
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
      title="Ficha de Locação de Veículo"
      subtitle="Património do Estado - Modelo de Cessão"
      icon={Car}
      trackingCode={formData.numeroFicha}
      onCancel={onCancel}
      onSubmit={handleLocalSubmit}
      isSubmitting={isSubmitting}
      isSubmitted={isSubmitted}
      successTitle="Locação Registada!"
      successMessage={
        <>
          A ficha de locação para a viatura{" "}
          <span className="font-bold text-slate-900">{formData.matricula}</span>{" "}
          foi submetida com sucesso. Pode agora descarregar o PDF oficial.
        </>
      }
    >
      <section className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-900">
          <User size={20} className="text-blue-600" />
          <h3 className="font-bold text-slate-900 text-xs">
            Dados do Locatário / Utilizador
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">
              Nome Completo
            </label>
            <input
              name="locatarioNome"
              value={formData.locatarioNome}
              onChange={handleChange}
              className="w-full p-2 bg-slate-50 border rounded-lg text-sm font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">
              Cargo / Função
            </label>
            <input
              name="locatarioCargo"
              value={formData.locatarioCargo}
              onChange={handleChange}
              className="w-full p-2 bg-slate-50 border rounded-lg text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">
              Departamento
            </label>
            <input
              name="locatarioDepartamento"
              value={formData.locatarioDepartamento}
              onChange={handleChange}
              className="w-full p-2 bg-slate-50 border rounded-lg text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">NUIT</label>
            <input
              name="locatarioNuit"
              value={formData.locatarioNuit}
              onChange={handleChange}
              className="w-full p-2 bg-slate-50 border rounded-lg text-sm font-mono"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-900">
          <Car size={20} className="text-blue-600" />
          <h3 className="font-bold text-slate-900 text-xs">
            Identificação da Viatura
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">
              Matrícula
            </label>
            <input
              name="matricula"
              value={formData.matricula}
              onChange={handleChange}
              className="w-full p-2 bg-slate-50 border rounded-lg text-sm font-black"
            />
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-[10px] font-bold text-slate-500">
              Marca e Modelo
            </label>
            <input
              name="marcaModelo"
              value={formData.marcaModelo}
              onChange={handleChange}
              className="w-full p-2 bg-slate-50 border rounded-lg text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">
              Km à Saída
            </label>
            <input
              name="quilometragemSaida"
              value={formData.quilometragemSaida}
              onChange={handleChange}
              className="w-full p-2 bg-slate-50 border rounded-lg text-sm font-mono"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-900">
          <Calendar size={20} className="text-blue-600" />
          <h3 className="font-bold text-slate-900 text-xs">
            Vigência e Finalidade
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500">
                Data Início
              </label>
              <input
                type="date"
                name="dataInicio"
                value={formData.dataInicio}
                onChange={handleChange}
                className="w-full p-2 bg-slate-50 border rounded-lg text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500">
                Data Fim (Prevista)
              </label>
              <input
                type="date"
                name="dataFim"
                value={formData.dataFim}
                onChange={handleChange}
                className="w-full p-2 bg-slate-50 border rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">
              Finalidade do Uso
            </label>
            <input
              name="finalidade"
              value={formData.finalidade}
              onChange={handleChange}
              className="w-full p-2 bg-slate-50 border rounded-lg text-sm"
              placeholder="Ex: Missão de serviço à Província"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-900">
          <Paperclip size={20} className="text-blue-600" />
          <h3 className="font-bold text-slate-900 text-xs">
            Anexos (Carta de Condução, Termo de Resp.)
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
            <div className="flex flex-col items-center gap-2">
              <div className="bg-slate-100 p-4 rounded-full group-hover:bg-blue-100 transition-colors">
                <Upload
                  className="text-slate-400 group-hover:text-blue-500"
                  size={32}
                />
              </div>
              <p className="text-sm font-bold text-slate-600 group-hover:text-blue-900 transition-colors">
                Arraste ou Clique para Anexar
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
                    <FileText className="text-blue-500" size={16} />
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

      <div className="p-6 bg-slate-950 rounded-2xl text-white space-y-4">
        <div className="flex items-start gap-4">
          <ShieldCheck className="text-amber-400 shrink-0" size={24} />
          <p className="text-[10px] text-slate-300 italic leading-relaxed">
            Declaro que recebi a viatura acima descrita em perfeitas condições
            de funcionamento e limpeza. Comprometo-me a utilizá-la
            exclusivamente para fins oficiais e a zelar pela sua conservação,
            respondendo civil e criminalmente por qualquer negligência.
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-8 print:hidden">
        <button
          type="button"
          onClick={onCancel}
          className="px-8 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all text-sm"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isSubmitted}
          className={`px-8 py-3 bg-slate-900 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center gap-2 text-sm ${isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-800"}`}
        >
          {isSubmitting ? (
            "A processar..."
          ) : (
            <>
              <Save size={18} />{" "}
              {isSubmitted ? "Registado" : "Submeter Ficha de Locação"}
            </>
          )}
        </button>
      </div>
    </FormLayout>
  );
};

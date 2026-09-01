import React from "react";
import { motion } from "motion/react";
import {
  ClipboardList,
  Save,
  X,
  Building,
  LayoutGrid,
  Monitor,
  Car,
  User,
  ShieldCheck,
  MapPin,
  Calendar,
  DollarSign,
  Info,
} from "lucide-react";

interface FormularioAlocacaoProps {
  type: string;
  onCancel: () => void;
}

export default function FormularioAlocacao({
  type,
  onCancel,
}: FormularioAlocacaoProps) {
  const [formData, setFormData] = React.useState<any>({
    numeroFicha: `LOC-${type.substring(0, 3)}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    dataSolicitacao: new Date().toISOString().split("T")[0],
    objetivoLocacao: type,
    proponente: {
      nome: "",
      nacionalidade: "",
      estadoCivil: "",
      contato: "",
      email: "",
      profissao: "",
      rendaMensal: 0,
      enderecoAtual: "",
    },
    detalhesBem: {},
    prazos: {
      inicio: "",
      fim: "",
      periodo: "12 meses",
    },
  });

  const getIcon = () => {
    switch (type) {
      case "Imóvel":
        return <Building size={32} className="text-indigo-400" />;
      case "Móvel":
        return <LayoutGrid size={32} className="text-blue-400" />;
      case "Equipamento":
        return <Monitor size={32} className="text-emerald-400" />;
      case "Veículo":
        return <Car size={32} className="text-slate-400" />;
      default:
        return <ClipboardList size={32} className="text-blue-400" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case "Imóvel":
        return "Locação de Imóvel Residencial";
      case "Móvel":
        return "Locação de Mobiliário / Escritório";
      case "Equipamento":
        return "Locação de Equipamentos / TI";
      case "Veículo":
        return "Locação de Veículo / Frota";
      default:
        return "Locação de Bens";
    }
  };

  const updateField = (section: string, key: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [section]:
        typeof prev[section] === "object"
          ? { ...prev[section], [key]: value }
          : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting Alocação:", formData);
    alert("Ficha de Locação submetida com sucesso! Aguarde o parecer técnico.");
    onCancel();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-5xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden border border-slate-200"
    >
      {/* Dynamic Header based on Type */}
      <div className="bg-slate-900 p-8 text-white flex justify-between items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">{getIcon()}</div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-md border border-white/10 shadow-inner">
            {getIcon()}
          </div>
          <div>
            <h1 className="text-3xl font-black text-white leading-none tracking-tighter">
              {getTitle()}
            </h1>
            <p className="text-slate-400 text-xs font-bold tracking-[0.3em] mt-2 italic">
              MIP - Modelo Internacional de Património • Locação
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 relative z-10"
        >
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-12">
        {/* Section 1: Informações Gerais */}
        <section className="space-y-8">
          <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-900">
            <div className="bg-slate-900 text-white p-2 rounded-xl">
              <Info size={16} />
            </div>
            <h3 className="font-black text-slate-900 text-sm tracking-widest leading-none">
              01. Dados do Processo
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 tracking-widest">
                Nº da Ficha
              </label>
              <input
                readOnly
                value={formData.numeroFicha}
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 tracking-widest">
                Data Solicitação
              </label>
              <input
                type="date"
                value={formData.dataSolicitacao}
                className="w-full p-4 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-slate-900 outline-none"
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-black text-slate-400 tracking-widest">
                Finalidade da Locação
              </label>
              <input
                type="text"
                placeholder="Ex: Reforço de frota para projeto, moradia de técnico expatriado..."
                className="w-full p-4 border-2 border-slate-100 rounded-2xl text-sm font-medium focus:border-slate-900 outline-none"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Proponente */}
        <section className="space-y-8">
          <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-900">
            <div className="bg-slate-900 text-white p-2 rounded-xl">
              <User size={16} />
            </div>
            <h3 className="font-black text-slate-900 text-sm tracking-widest leading-none">
              02. Identificação do Locatário
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-black text-slate-400 tracking-widest">
                Nome Completo / Instituição
              </label>
              <input
                required
                type="text"
                placeholder="Nome do solicitante ou departamento"
                className="w-full p-4 border-2 border-slate-100 rounded-2xl text-sm font-black focus:border-slate-900 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 tracking-widest">
                BI / NUIT
              </label>
              <input
                type="text"
                className="w-full p-4 border-2 border-slate-100 rounded-2xl text-sm font-mono focus:border-slate-900 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 tracking-widest">
                Profissão / Função
              </label>
              <input
                type="text"
                className="w-full p-4 border-2 border-slate-100 rounded-2xl text-sm font-medium focus:border-slate-900 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 tracking-widest">
                E-mail Corporativo
              </label>
              <input
                type="email"
                placeholder="exemplo@instituicao.gov"
                className="w-full p-4 border-2 border-slate-100 rounded-2xl text-sm font-medium focus:border-slate-900 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 tracking-widest">
                Telefone / Ramal
              </label>
              <input
                type="tel"
                className="w-full p-4 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-slate-900 outline-none"
              />
            </div>
          </div>
        </section>

        {/* Section 3: Detalhes Específicos do Bem */}
        <section className="space-y-8">
          <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-900">
            <div className="bg-slate-900 text-white p-2 rounded-xl">
              {getIcon()}
            </div>
            <h3 className="font-black text-slate-900 text-sm tracking-widest leading-none">
              03. Especificações do Bem Pretendido
            </h3>
          </div>

          <div className="p-8 bg-slate-50 rounded-3xl border-2 border-slate-100 space-y-6">
            {type === "Imóvel" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 tracking-widest">
                    Tipo de Imóvel
                  </label>
                  <select className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold">
                    <option>Apartamento</option>
                    <option>Moradia</option>
                    <option>Escritório / Sala</option>
                    <option>Pavilhão Industrial</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 tracking-widest">
                    Localização Preferencial
                  </label>
                  <input
                    type="text"
                    placeholder="Bairro / Cidade"
                    className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 tracking-widest">
                    Nº de Quartos / Áreas
                  </label>
                  <input
                    type="number"
                    defaultValue={2}
                    className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold"
                  />
                </div>
                <div className="space-y-1 text-xs text-slate-500 italic flex items-center p-4">
                  Necessidade de mobiliário incluso?{" "}
                  <input type="checkbox" className="ml-2 w-4 h-4" />
                </div>
              </div>
            )}

            {type === "Móvel" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 tracking-widest">
                    Tipo de Mobiliário
                  </label>
                  <select className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold">
                    <option>Conjunto Direção (Mesa + Cadeira + Armário)</option>
                    <option>Mesa de Reunião</option>
                    <option>Estantes Arquivo</option>
                    <option>Sofás / Poltronas</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 tracking-widest">
                    Quantidade Estimada
                  </label>
                  <input
                    type="number"
                    defaultValue={1}
                    className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold"
                  />
                </div>
              </div>
            )}

            {type === "Equipamento" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 tracking-widest">
                    Categoria de Hardware
                  </label>
                  <select className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold">
                    <option>Computador / Laptop</option>
                    <option>Servidor / Storage</option>
                    <option>Impressora / Multifuncional</option>
                    <option>Equipamento Audiovisual</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 tracking-widest">
                    Configuração Mínima
                  </label>
                  <input
                    type="text"
                    placeholder="i7, 16GB RAM, 512GB SSD..."
                    className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold"
                  />
                </div>
              </div>
            )}

            {type === "Veículo" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 tracking-widest">
                    Tipo de Viatura
                  </label>
                  <select className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold">
                    <option>Ligeiro de Passageiros</option>
                    <option>Todo o Terreno (4x4)</option>
                    <option>Furgão de Carga</option>
                    <option>Motociclo</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 tracking-widest">
                    Preferência de Transmissão
                  </label>
                  <div className="flex gap-4 pt-2">
                    <label className="flex items-center gap-2 text-xs font-bold">
                      <input type="radio" name="trans" /> Manual
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold">
                      <input type="radio" name="trans" /> Automática
                    </label>
                  </div>
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-slate-400 tracking-widest">
                    Justificativa de Uso Fora de Horas
                  </label>
                  <textarea
                    className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-medium"
                    rows={2}
                  ></textarea>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Section 4: Condições e Prazos */}
        <section className="space-y-8">
          <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-900">
            <div className="bg-slate-900 text-white p-2 rounded-xl">
              <Calendar size={16} />
            </div>
            <h3 className="font-black text-slate-900 text-sm tracking-widest leading-none">
              04. Vigência e Orçamento
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 tracking-widest">
                Período Pretendido
              </label>
              <select className="w-full p-4 border-2 border-slate-100 rounded-2xl text-sm font-bold">
                <option>Curto Prazo (Até 3 meses)</option>
                <option>Médio Prazo (6 a 12 meses)</option>
                <option>Longo Prazo (12 a 24 meses)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 tracking-widest">
                Teto Orçamental (Mensal)
              </label>
              <div className="relative">
                <DollarSign
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="number"
                  placeholder="Valor em MZN"
                  className="w-full p-4 pl-10 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-slate-900 outline-none"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 tracking-widest">
                Garantia / Caução
              </label>
              <select className="w-full p-4 border-2 border-slate-100 rounded-2xl text-sm font-bold">
                <option>Retenção na Fonte (Salário)</option>
                <option>Seguro de Fiança</option>
                <option>Caução em Numerário</option>
                <option>Fiador Institucional</option>
              </select>
            </div>
          </div>
        </section>

        {/* Section 5: Declaração e Termos */}
        <div className="p-8 bg-slate-900 rounded-3xl text-white space-y-6">
          <div className="flex items-start gap-4">
            <ShieldCheck size={32} className="text-amber-400 shrink-0" />
            <div className="space-y-2">
              <h4 className="font-black text-xs tracking-widest">
                Termo de Responsabilidade
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Declaro que as informações acima são verdadeiras. Comprometo-me
                a zelar pela integridade do bem alocado conforme as normas do
                Artigo 45 do Regulamento Geral de Património, respondendo por
                quaisquer danos decorrentes de mau uso ou negligência.
              </p>
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
            <input
              type="checkbox"
              required
              className="w-5 h-5 rounded border-white/20 bg-transparent text-amber-500 focus:ring-amber-500"
            />
            <span className="text-xs font-bold tracking-wide">
              Aceito os termos e as condições de locação
            </span>
          </label>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-4 pt-10 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-10 py-5 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all text-xs tracking-widest"
          >
            Sair sem Gravar
          </button>
          <button
            type="submit"
            className="px-10 py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-2xl flex items-center gap-3 text-xs tracking-[0.2em]"
          >
            <Save size={20} className="text-amber-400" /> Submeter para
            Validação
          </button>
        </div>
      </form>
    </motion.div>
  );
}

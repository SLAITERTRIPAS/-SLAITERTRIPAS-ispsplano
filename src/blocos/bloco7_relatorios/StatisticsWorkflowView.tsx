import React, { useState } from "react";
import {
  Users,
  Briefcase,
  Microscope,
  Send,
  CheckCircle,
  FileText,
  ArrowRight,
  Printer,
  LucideIcon,
} from "lucide-react";
import Quadro1_1Form from "../bloco8_gerais/Quadro1_1Form";
import Quadro1_2Form from "../bloco8_gerais/Quadro1_2Form";
import Quadro1_3Form from "../bloco8_gerais/Quadro1_3Form";

export interface Category {
  title: string;
  icon: LucideIcon;
}

const FORM_COMPONENTS: Record<string, React.FC> = {
  "Quadro 1.1": Quadro1_1Form,
  "Quadro 1.2": Quadro1_2Form,
  "Quadro 1.3": Quadro1_3Form,
};

interface StatisticsWorkflowViewProps {
  title: string;
  categories: Category[];
  forms?: string[];
  isReparticao?: boolean;
  isChefeRH?: boolean;
  isDPEP?: boolean;
}

export default function StatisticsWorkflowView({
  title,
  categories,
  forms = ["Quadro 1.1", "Quadro 1.2", "Quadro 1.3"],
  isReparticao = false,
  isChefeRH = false,
  isDPEP = false,
}: StatisticsWorkflowViewProps) {
  const [status, setStatus] = useState<
    "draft" | "sentToRH" | "analyzed" | "sentToDPEP"
  >("draft");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedForm, setSelectedForm] = useState<string | null>(null);
  const [completedForms, setCompletedForms] = useState<
    Record<string, string[]>
  >({});

  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 2021 },
    (_, i) => currentYear - 1 - i,
  );

  const handleAction = (action: string) => {
    if (action === "sendToRH") setStatus("sentToRH");
    if (action === "analyze") setStatus("analyzed");
    if (action === "sendToDPEP") setStatus("sentToDPEP");
  };

  const FormComponent = selectedForm ? FORM_COMPONENTS[selectedForm] : null;

  return (
    <div className="w-full flex flex-col p-8 gap-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-amber-500 tracking-tighter">
          {title}
        </h2>
        <div className="bg-slate-100 px-4 py-2 rounded-full font-bold text-sm text-slate-700 font-mono">
          Estado:{" "}
          <span className=" text-blue-600 font-black">
            {title.toUpperCase().includes("BOLSA") && status === "draft"
              ? "ATIVO"
              : status}
          </span>
        </div>
      </div>

      {/* Navigation Hub / Categories */}
      {!selectedCategory && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
            <h3 className="text-xl font-bold text-slate-900 italic">
              Módulos de Navegação Estatística
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((item) => (
              <button
                key={item.title}
                onClick={() => {
                  setSelectedCategory(item.title);
                  setSelectedYear(null);
                  setSelectedForm(null);
                }}
                className="group relative p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-500 transition-all text-left flex items-center gap-5 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 opacity-[0.03] -mr-8 -mt-8 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                <div className="p-4 bg-slate-50 group-hover:bg-amber-50 text-slate-400 group-hover:text-amber-600 rounded-2xl transition-colors">
                  <item.icon size={28} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900 text-lg leading-tight group-hover:text-amber-600 transition-colors  tracking-tight">
                    {item.title}
                  </span>
                  <span className="text-xs text-slate-500 font-medium mt-1">
                    Aceder registos e indicadores
                  </span>
                </div>
                <ArrowRight
                  size={20}
                  className="ml-auto text-slate-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Category Header (as Navigation Title) */}
      {selectedCategory && (
        <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
            title="Voltar para módulos"
          >
            <ArrowRight size={20} className="rotate-180" />
          </button>
          <div className="w-px h-6 bg-slate-200"></div>
          <div className="flex items-center gap-3 px-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              {(() => {
                const Icon =
                  categories.find((c) => c.title === selectedCategory)?.icon ||
                  Users;
                return <Icon size={20} />;
              })()}
            </div>
            <div>
              <h3 className="font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span className="text-slate-400 font-medium">
                  Navegando em:
                </span>{" "}
                {selectedCategory}
              </h3>
            </div>
          </div>
          {selectedYear && (
            <>
              <div className="w-px h-6 bg-slate-200"></div>
              <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg font-bold text-sm">
                Ano {selectedYear}
              </div>
            </>
          )}
        </div>
      )}

      {/* Workflow Controls */}
      {selectedCategory && selectedYear && (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="flex gap-4">
            {isReparticao &&
              status === "draft" &&
              forms.every((f) =>
                completedForms[`${selectedYear}-${selectedCategory}`]?.includes(
                  f,
                ),
              ) && (
                <button
                  onClick={() => handleAction("sendToRH")}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700"
                >
                  <Send size={18} /> Enviar para RH
                </button>
              )}
            {isChefeRH && status === "sentToRH" && (
              <>
                <button
                  onClick={() => handleAction("analyze")}
                  className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700"
                >
                  <CheckCircle size={18} /> Analisar e Aprovar
                </button>
              </>
            )}
            {isChefeRH && status === "analyzed" && (
              <button
                onClick={() => handleAction("sendToDPEP")}
                className="bg-violet-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-violet-700"
              >
                <Send size={18} /> Enviar para Estatística Departamento de
                Planificação Estudos e Projetos
              </button>
            )}
          </div>
          <div className="flex-1">
            <select
              value={selectedForm || "Seleccione o formulário"}
              onChange={(e) =>
                setSelectedForm(
                  e.target.value === "Seleccione o formulário"
                    ? null
                    : e.target.value,
                )
              }
              className="w-full p-3 border border-gray-200 rounded-xl font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Seleccione o formulário</option>
              {forms.map((form) => (
                <option key={form}>{form}</option>
              ))}
            </select>
          </div>
          <button className="text-slate-500 flex items-center gap-2 font-bold hover:text-black">
            <Printer size={18} /> Imprimir Relatório
          </button>
        </div>
      )}

      {selectedCategory && !selectedYear && (
        <div className="flex flex-col gap-6 items-center w-full">
          <div className="bg-slate-900 text-white font-bold py-3 px-8 rounded-full mb-6">
            Seleccione o Ano
          </div>

          <div className="flex flex-row gap-8 w-full max-w-4xl">
            {/* 2025/Current Year (Simulated) */}
            <button
              onClick={() => setSelectedYear(2025)}
              className="flex-1 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:border-blue-300 transition-all text-left"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <FileText size={24} />
                </div>
                <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">
                  Atual
                </span>
              </div>
              <h3 className="text-3xl font-black text-slate-900">Ano 2025</h3>
              <p className="text-slate-500">
                Programar novos dados estatísticos (Ano N-1)
              </p>
            </button>

            {/* Past Years */}
            <div className="flex-1 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-2 font-bold text-slate-900 mb-2">
                <FileText size={20} /> Anos Anteriores
              </div>
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className="flex justify-between items-center p-4 border border-gray-100 rounded-xl hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="text-slate-400" />
                    <div className="text-left">
                      <div className="font-bold">{year}</div>
                      <div className="text-xs text-slate-500">
                        Consultar dados estatísticos
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedCategory && selectedYear && !selectedForm && (
        <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-center">
            Seleccione o formulário a preencher:
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {forms.map((form) => (
              <button
                key={form}
                onClick={() => setSelectedForm(form)}
                className="p-6 bg-white border border-gray-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 text-left font-bold transition-all"
              >
                {form}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSelectedYear(null)}
            className="text-sm font-bold text-blue-600 hover:text-blue-800 text-center"
          >
            ← Voltar para seleccionar ano
          </button>
        </div>
      )}

      {selectedCategory && selectedYear && selectedForm && FormComponent && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">
              Formulário: {selectedForm} - {selectedCategory} ({selectedYear})
            </h3>
            <button
              onClick={() => {
                const key = `${selectedYear}-${selectedCategory}`;
                setCompletedForms((prev) => ({
                  ...prev,
                  [key]: [
                    ...(prev[key] || []).filter((f) => f !== selectedForm),
                    selectedForm,
                  ],
                }));
                setSelectedForm(null);
              }}
              className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700"
            >
              <CheckCircle size={18} /> Concluir e Guardar
            </button>
          </div>
          <FormComponent />
        </div>
      )}
    </div>
  );
}

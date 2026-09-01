import React, { useState } from "react";
import {
  Save,
  Send,
  X,
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  Landmark,
  BookOpen,
  Award,
  FileText,
  Coffee,
  Home,
} from "lucide-react";
import { FinancialData } from "../../types";

interface Props {
  onClose: () => void;
  onSubmit: (data: FinancialData) => void;
  initialYear?: string;
}

export default function RecursosFinanceirosForm({
  onClose,
  onSubmit,
  initialYear = "2025",
}: Props) {
  const [formData, setFormData] = useState<Partial<FinancialData>>({
    ano: initialYear,
    orcamentoAnual: 0,
    receitasProprias: 0,
    subvencaoEstado: 0,
    despesasPessoal: 0,
    despesasFuncionamento: 0,
    despesasInvestimento: 0,
    propinas: 0,
    admissoes: 0,
    inscricoes: 0,
    matriculas: 0,
    alimentacao: 0,
    alojamento: 0,
  });

  const handleDetailChange = (field: keyof FinancialData, val: number) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: val };
      const sum =
        (Number(next.propinas) || 0) +
        (Number(next.admissoes) || 0) +
        (Number(next.inscricoes) || 0) +
        (Number(next.matriculas) || 0) +
        (Number(next.alimentacao) || 0) +
        (Number(next.alojamento) || 0);
      next.receitasProprias = sum;
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: FinancialData = {
      id: Math.random().toString(36).substr(2, 9),
      ano: formData.ano || initialYear,
      orcamentoAnual: Number(formData.orcamentoAnual) || 0,
      receitasProprias: Number(formData.receitasProprias) || 0,
      subvencaoEstado: Number(formData.subvencaoEstado) || 0,
      despesasPessoal: Number(formData.despesasPessoal) || 0,
      despesasFuncionamento: Number(formData.despesasFuncionamento) || 0,
      despesasInvestimento: Number(formData.despesasInvestimento) || 0,
      propinas: Number(formData.propinas) || 0,
      admissoes: Number(formData.admissoes) || 0,
      inscricoes: Number(formData.inscricoes) || 0,
      matriculas: Number(formData.matriculas) || 0,
      alimentacao: Number(formData.alimentacao) || 0,
      alojamento: Number(formData.alojamento) || 0,
      dataSubmissao: new Date().toISOString(),
      status: "Pendente",
    };
    onSubmit(data);
  };

  const totalReceitas =
    (Number(formData.receitasProprias) || 0) +
    (Number(formData.subvencaoEstado) || 0);
  const totalDespesas =
    (Number(formData.despesasPessoal) || 0) +
    (Number(formData.despesasFuncionamento) || 0) +
    (Number(formData.despesasInvestimento) || 0);
  const saldo = totalReceitas - totalDespesas;

  return (
    <div className="flex-grow overflow-auto bg-[#fafbfc] p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* DICOSAFA Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8 text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-9xl font-black pointer-events-none tracking-widest ">
            DF
          </div>
          <div className="relative z-10 space-y-2">
            <span className="bg-blue-500/10 text-blue-400 font-black tracking-widest text-[10px]  px-3 py-1 rounded-full border border-blue-500/20">
              SISTEMA INTEGRADO DE ADMINISTRAÇÃO E FINANÇAS
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight font-sans ">
              DICOSAFA • DEPARTAMENTO DE FINANÇAS
            </h1>
            <p className="text-xs text-slate-400 font-semibold  tracking-wider">
              Gabinetes e Departamentos Administrativos • Responsável exclusivo
              pelo lançamento de Entrada e Saída de Valores
            </p>
          </div>
          <div className="shrink-0 flex gap-4 text-xs font-bold text-slate-300">
            <div className="border-l-2 border-blue-500 pl-4 py-1">
              <span className="block text-slate-400 font-black">ENTRADAS</span>
              <span>Receitas & Dotações</span>
            </div>
            <div className="border-l-2 border-red-500 pl-4 py-1">
              <span className="block text-slate-400 font-black">SAÍDAS</span>
              <span>Despesas & Rubricas</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden">
          <div className="bg-blue-600 p-8 text-white flex justify-between items-center relative">
            <div>
              <h2 className="text-xl font-black tracking-tight  mb-1">
                Formulário de Lançamento Financeiro
              </h2>
              <p className="text-blue-100 text-xs font-bold  tracking-wide">
                Ano Estatístico Especial de {formData.ano}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-blue-500 rounded-full transition-colors"
              title="Fechar formulário"
            >
              <X size={22} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8 font-sans">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Entradas & Receitas Section */}
              <div className="space-y-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 text-blue-900 font-black tracking-widest text-xs border-b border-slate-200 pb-3">
                  <TrendingUp
                    className="text-blue-600 animate-pulse"
                    size={18}
                  />
                  <span className="">
                    Entrada de Valores (Receitas)
                  </span>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 tracking-widest mb-1.5 ">
                      Orçamento Geral de Estado (MZN)
                    </label>
                    <div className="relative">
                      <Landmark
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        size={16}
                      />
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.subvencaoEstado || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            subvencaoEstado: Number(e.target.value),
                          })
                        }
                        placeholder="Ex: 10500000"
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-bold text-sm"
                      />
                    </div>
                  </div>

                  {/* Receitas Proprias Section */}
                  <div className="border-t border-slate-200/60 pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-500 tracking-widest ">
                        Detalhamento de Receitas Próprias
                      </span>
                      <span className="bg-blue-50 text-blue-700 text-[10px] px-2.5 py-1 rounded-lg font-black  tracking-wider border border-blue-100">
                        Soma:{" "}
                        {(formData.receitasProprias || 0).toLocaleString()} MZN
                      </span>
                    </div>

                    {/* Propinas - Solicitado */}
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 tracking-widest mb-1  flex items-center gap-1">
                        <BookOpen size={12} className="text-blue-500" />
                        Propinas (MZN){" "}
                        <span className="text-blue-600 font-black">
                          * Incluído
                        </span>
                      </label>
                      <div className="relative">
                        <DollarSign
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                          size={14}
                        />
                        <input
                          type="number"
                          min="0"
                          value={formData.propinas || ""}
                          onChange={(e) =>
                            handleDetailChange(
                              "propinas",
                              Number(e.target.value),
                            )
                          }
                          placeholder="Ex: 1620000"
                          className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-bold text-xs"
                        />
                      </div>
                    </div>

                    {/* Inscrições para exame de Admissão */}
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 tracking-widest mb-1  flex items-center gap-1">
                        <Award size={12} className="text-purple-500" />
                        Inscrições para exame de Admissão (MZN)
                      </label>
                      <div className="relative">
                        <DollarSign
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                          size={14}
                        />
                        <input
                          type="number"
                          min="0"
                          value={formData.admissoes || ""}
                          onChange={(e) =>
                            handleDetailChange(
                              "admissoes",
                              Number(e.target.value),
                            )
                          }
                          placeholder="Ex: 1200000"
                          className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-bold text-xs"
                        />
                      </div>
                    </div>

                    {/* Inscrições */}
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 tracking-widest mb-1  flex items-center gap-1">
                        <FileText size={12} className="text-emerald-500" />
                        Inscrições Anuais (MZN)
                      </label>
                      <div className="relative">
                        <DollarSign
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                          size={14}
                        />
                        <input
                          type="number"
                          min="0"
                          value={formData.inscricoes || ""}
                          onChange={(e) =>
                            handleDetailChange(
                              "inscricoes",
                              Number(e.target.value),
                            )
                          }
                          placeholder="Ex: 850000"
                          className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-bold text-xs"
                        />
                      </div>
                    </div>

                    {/* Matrículas */}
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 tracking-widest mb-1  flex items-center gap-1">
                        <FileText size={12} className="text-amber-500" />
                        Matrículas (MZN)
                      </label>
                      <div className="relative">
                        <DollarSign
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                          size={14}
                        />
                        <input
                          type="number"
                          min="0"
                          value={formData.matriculas || ""}
                          onChange={(e) =>
                            handleDetailChange(
                              "matriculas",
                              Number(e.target.value),
                            )
                          }
                          placeholder="Ex: 1000000"
                          className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-bold text-xs"
                        />
                      </div>
                    </div>

                    {/* Alimentação */}
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 tracking-widest mb-1  flex items-center gap-1">
                        <Coffee size={12} className="text-orange-500" />
                        Alimentação (MZN)
                      </label>
                      <div className="relative">
                        <DollarSign
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                          size={14}
                        />
                        <input
                          type="number"
                          min="0"
                          value={formData.alimentacao || ""}
                          onChange={(e) =>
                            handleDetailChange(
                              "alimentacao",
                              Number(e.target.value),
                            )
                          }
                          placeholder="Ex: 500000"
                          className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-bold text-xs"
                        />
                      </div>
                    </div>

                    {/* Alojamento */}
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 tracking-widest mb-1  flex items-center gap-1">
                        <Home size={12} className="text-indigo-500" />
                        Alojamento (MZN)
                      </label>
                      <div className="relative">
                        <DollarSign
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                          size={14}
                        />
                        <input
                          type="number"
                          min="0"
                          value={formData.alojamento || ""}
                          onChange={(e) =>
                            handleDetailChange(
                              "alojamento",
                              Number(e.target.value),
                            )
                          }
                          placeholder="Ex: 300000"
                          className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-bold text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Orçamento Total Alocado de Entrada */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 tracking-widest mb-1.5 ">
                      Receitas Próprias Acumuladas (MZN)
                    </label>
                    <div className="relative">
                      <DollarSign
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 animate-pulse"
                        size={16}
                      />
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.receitasProprias || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            receitasProprias: Number(e.target.value),
                          })
                        }
                        placeholder="Calculado automaticamente"
                        className="w-full pl-12 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-black text-sm text-blue-900"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Saídas & Despesas Section */}
              <div className="space-y-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 text-red-900 font-black tracking-widest text-xs border-b border-slate-200 pb-3">
                  <TrendingDown
                    className="text-red-600 animate-pulse"
                    size={18}
                  />
                  <span className="">Saída de Valores (Despesas)</span>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 tracking-widest mb-1.5 ">
                      Despesas com Pessoal (MZN)
                    </label>
                    <div className="relative">
                      <DollarSign
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        size={16}
                      />
                      <input
                        type="number"
                        required
                        min="0"
                        value={
                          formData.despesasPessoal ||
                          ""
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            despesasPessoal: Number(e.target.value),
                          })
                        }
                        placeholder="Ex: 4200000"
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-bold text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 tracking-widest mb-1.5 ">
                      Despesas de Funcionamento (MZN)
                    </label>
                    <div className="relative">
                      <DollarSign
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        size={16}
                      />
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.despesasFuncionamento || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            despesasFuncionamento: Number(e.target.value),
                          })
                        }
                        placeholder="Ex: 1800000"
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-bold text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 tracking-widest mb-1.5 ">
                      Despesas de Investimento (MZN)
                    </label>
                    <div className="relative">
                      <DollarSign
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        size={16}
                      />
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.despesasInvestimento || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            despesasInvestimento: Number(e.target.value),
                          })
                        }
                        placeholder="Ex: 2450000"
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-bold text-sm"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-200/60 pt-4">
                    <label className="block text-[10px] font-black text-slate-500 tracking-widest mb-1.5 ">
                      Orçamento Geral Limite (Consolidado) (MZN)
                    </label>
                    <div className="relative">
                      <DollarSign
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        size={16}
                      />
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.orcamentoAnual || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            orcamentoAnual: Number(e.target.value),
                          })
                        }
                        placeholder="Ex: 15450000"
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-extrabold text-sm"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold  tracking-wide mt-1 block">
                      Recomendado alinhar dotação autorizada com limite total
                      anual.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Audit Balance Panel */}
            <div className="p-6 bg-slate-900 text-white rounded-2xl border border-slate-850 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-[10px] font-black text-slate-400 tracking-widest mb-1 shadow-sm ">
                  Total Receita Lançada
                </p>
                <p className="text-xl font-black text-blue-400">
                  {totalReceitas.toLocaleString()} MZN
                </p>
                <span className="text-[9px] text-slate-500 font-bold block  mt-0.5">
                  Rec. Próprias + Estado
                </span>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 tracking-widest mb-1 ">
                  Total Saídas Lançadas
                </p>
                <p className="text-xl font-black text-red-400">
                  {totalDespesas.toLocaleString()} MZN
                </p>
                <span className="text-[9px] text-slate-500 font-bold block  mt-0.5">
                  Pessoal + Func + Invest
                </span>
              </div>
              <div className="border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
                <p
                  className={`text-[10px] font-black tracking-widest mb-1  ${saldo >= 0 ? "text-emerald-400" : "text-amber-500"}`}
                >
                  Saldo de Exercício
                </p>
                <p
                  className={`text-xl font-black ${saldo >= 0 ? "text-emerald-400" : "text-amber-500"}`}
                >
                  {saldo.toLocaleString()} MZN
                </p>
                <span className="text-[9px] text-slate-500 font-bold block  mt-0.5">
                  Superávit / Déficit do Período
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-slate-100">
              <span className="text-[10px] text-slate-400 font-black tracking-wider  text-center sm:text-left">
                Os lançamentos efetuados serão submetidos à Repartição de
                Estatística para posterior consolidação geral.
              </span>
              <div className="flex gap-4 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 text-slate-500 font-black text-xs tracking-widest hover:bg-slate-100 rounded-xl transition-all "
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-8 py-3.5 bg-blue-600 text-white font-black text-xs tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-lg active:scale-95 flex items-center gap-2 "
                >
                  <Send size={14} />
                  Gravar e Submeter Lançamento
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

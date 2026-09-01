import { printElementById } from "../../lib/printUtils";
import React, { useState } from "react";
import { GraduationCap, Save, X, ShieldCheck, Printer } from "lucide-react";
import { motion } from "motion/react";

export default function RegistarGraduadoForm({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (data: any) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    genero: "",
    idade: "",
    anoIngresso: "",
    anoGraduacao: "2026",
    mediaFinal: "",
    tituloTfc: "",
  });

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
      await onSubmit(formData);
      setIsSubmitted(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
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
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 mx-auto">
              <ShieldCheck size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-2">
              Graduado Registado!
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              O graduado{" "}
              <span className="font-bold text-slate-900">{formData.nome}</span>{" "}
              foi registado no sistema com sucesso. Pode agora imprimir o
              certificado de registo.
            </p>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => printElementById("print-area")}
                className="w-full bg-blue-900 text-white py-4 rounded-2xl font-black text-[10px] tracking-[0.2em] hover:bg-blue-800 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-2"
              >
                <Printer size={18} /> Imprimir Ficha de Graduado
              </button>
              <button
                onClick={onCancel}
                className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-[10px] tracking-[0.2em] hover:bg-slate-200 transition-all border border-slate-200"
              >
                Fechar e Voltar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-4xl mx-auto border border-gray-200">
        <div className="bg-blue-900 text-white p-6 flex items-center gap-4">
          <GraduationCap size={32} />
          <div>
            <h2 className="text-2xl font-bold">Registo de Graduados</h2>
            <p className="text-blue-100 text-sm">
              Preencha os dados para registar um novo graduado no sistema
            </p>
          </div>
        </div>

        <form onSubmit={handleLocalSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2 tracking-widest">
              Nome Completo Do Graduado
            </label>
            <input
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              type="text"
              required
              placeholder="Insira o nome completo..."
              className="w-full p-4 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 tracking-widest">
                Género
              </label>
              <select
                name="genero"
                value={formData.genero}
                onChange={handleChange}
                required
                className="w-full p-4 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
              >
                <option value="">Selecione O Género</option>
                <option value="Homem">Homem</option>
                <option value="Mulher">Mulher</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 tracking-widest">
                IDADE
              </label>
              <input
                name="idade"
                value={formData.idade}
                onChange={handleChange}
                type="number"
                placeholder="Ex: 23"
                className="w-full p-4 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 tracking-widest">
                Ano De Ingresso
              </label>
              <input
                name="anoIngresso"
                value={formData.anoIngresso}
                onChange={handleChange}
                type="number"
                placeholder="Ex: 2020"
                className="w-full p-4 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 tracking-widest">
                Ano De Graduação
              </label>
              <input
                name="anoGraduacao"
                value={formData.anoGraduacao}
                onChange={handleChange}
                type="number"
                className="w-full p-4 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 tracking-widest">
                Média Final
              </label>
              <input
                name="mediaFinal"
                value={formData.mediaFinal}
                onChange={handleChange}
                type="number"
                step="0.1"
                placeholder="Ex: 14.5"
                className="w-full p-4 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2 tracking-widest">
              TÍTULO DO TRABALHO DE FIM DE CURSO (TFC)
            </label>
            <textarea
              name="tituloTfc"
              value={formData.tituloTfc}
              onChange={handleChange}
              rows={4}
              placeholder="Insira o título do trabalho..."
              className="w-full p-4 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
            />
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isSubmitted}
              className="px-6 py-2 bg-blue-900 text-white rounded-lg font-bold hover:bg-blue-800 flex items-center gap-2 text-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <Save size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {isSubmitted ? "Registado" : "Registar Graduado"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { ArrowLeft, FileText } from "lucide-react";
import { motion } from "motion/react";
import { Nota } from "../../types";

export default function NotaDoDiaForm({
  onBack,
  onSubmit,
  currentDepartment,
}: {
  onBack: () => void;
  onSubmit: (note: Omit<Nota, "id">) => void;
  currentDepartment?: string;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [prazo, setPrazo] = useState("");
  const [remetente, setRemetente] = useState(currentDepartment || "");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-white text-gray-900 p-8 md:p-16"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 transition-colors"
      >
        <ArrowLeft size={20} /> Voltar
      </button>
      <div className="max-w-2xl mx-auto bg-gray-50 p-8 rounded-3xl">
        <h2 className="text-2xl font-bold mb-6">Nova Nota do Dia</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ title, content, date, prazo, remetente });
          }}
          className="space-y-4"
        >
          <input
            required
            type="text"
            placeholder="Título"
            className="w-full px-4 py-2 rounded-xl border border-gray-200"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Data
              </label>
              <input
                required
                type="date"
                className="w-full px-4 py-2 rounded-xl border border-gray-200"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Prazo
              </label>
              <input
                required
                type="date"
                className="w-full px-4 py-2 rounded-xl border border-gray-200"
                value={prazo}
                onChange={(e) => setPrazo(e.target.value)}
              />
            </div>
          </div>
          <input
            required
            type="text"
            placeholder="Remetente (nome do departamento)"
            className="w-full px-4 py-2 rounded-xl border border-gray-200"
            value={remetente}
            onChange={(e) => setRemetente(e.target.value)}
          />
          <textarea
            required
            placeholder="Conteúdo"
            className="w-full px-4 py-2 rounded-xl border border-gray-200"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700"
          >
            Submeter Nota
          </button>
        </form>
      </div>
    </motion.div>
  );
}

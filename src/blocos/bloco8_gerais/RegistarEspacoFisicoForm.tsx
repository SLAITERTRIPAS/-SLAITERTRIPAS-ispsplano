import { printElementById } from "../../lib/printUtils";
import React, { useState } from "react";
import { MapPin, Save, X, BookOpen, ShieldCheck, Printer } from "lucide-react";
import { motion } from "motion/react";

export default function RegistarEspacoFisicoForm({
  onCancel,
  courseName,
  onSubmit,
}: {
  onCancel: () => void;
  courseName?: string;
  onSubmit?: (data: any) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [bloco, setBloco] = useState("");
  const [piso, setPiso] = useState("");
  const [sala, setSala] = useState("");
  const [tipo, setTipo] = useState("Sala de Aula");

  const handleLocalSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit({ bloco, piso, sala, tipo, courseName });
      }
      setIsSubmitted(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pisos = ["Rés do Chão", "1º Andar", "2º Andar"];

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
              Espaço Registado!
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              A{" "}
              <span className="font-bold text-slate-900">
                {tipo} - {sala}
              </span>{" "}
              foi registada no sistema. Agora faz parte do mapa oficial de
              espaços físicos.
            </p>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => printElementById("print-area")}
                className="w-full bg-blue-900 text-white py-4 rounded-2xl font-black text-[10px] tracking-[0.2em] hover:bg-blue-800 transition-all shadow-xl flex items-center justify-center gap-2"
              >
                <Printer size={18} /> Imprimir Comprovativo de Espaço
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

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-2xl mx-auto border border-gray-200">
        <div className="bg-blue-900 text-white p-6 flex items-center gap-4">
          <MapPin size={32} />
          <div>
            <h2 className="text-2xl font-bold">Registo de Espaço Físico</h2>
            <p className="text-blue-100 text-sm">
              Registe salas, laboratórios ou oficinas para o curso.
            </p>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 tracking-widest">
                BLOCO / EDIFÍCIO
              </label>
              <select
                value={bloco}
                onChange={(e) => setBloco(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="">Selecione o bloco...</option>
                <option value="Bloco Administrativo">
                  Bloco Administrativo
                </option>
                <option value="Auditório">Auditório</option>
                <option
                  value={`Oficina (${courseName || "Curso"})`}
                >{`Oficina (${courseName || "Curso"})`}</option>
                <option
                  value={`Laboratorio (${courseName || "Curso"})`}
                >{`Laboratorio (${courseName || "Curso"})`}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">
                PISO / ANDAR
              </label>
              <select
                value={piso}
                onChange={(e) => setPiso(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Selecione o piso...</option>
                {pisos.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">
                Número Da Sala
              </label>
              <input
                type="text"
                value={sala}
                onChange={(e) => setSala(e.target.value)}
                placeholder="Ex: 101"
                className="w-full p-3 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">
                Tipo De Espaço
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm"
              >
                <option>Sala de Aula</option>
                <option>Laboratório</option>
                <option>Oficina</option>
              </select>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg flex items-center gap-4 border border-gray-200">
            <div className="bg-white p-2 rounded-lg border border-gray-200">
              <BookOpen className="text-blue-900" size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500">
                PRÉ-VISUALIZAÇÃO
              </p>
              <p className="text-sm font-bold text-blue-900">
                {piso && sala
                  ? `${piso} - Sala ${sala}`
                  : "Sala de Aula - ... (...)"}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 text-sm flex items-center gap-2"
            >
              <X size={16} />
              Cancelar
            </button>
            <button
              onClick={handleLocalSubmit}
              disabled={isSubmitting || isSubmitted}
              className="px-6 py-2 bg-blue-900 text-white rounded-lg font-bold hover:bg-blue-800 flex items-center gap-2 text-sm disabled:opacity-50"
            >
              <Save size={16} />
              {isSubmitting
                ? "A processar..."
                : isSubmitted
                  ? "Registado"
                  : "Registar Espaço"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

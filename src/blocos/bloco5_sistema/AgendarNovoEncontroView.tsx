import React, { useState } from "react";
import {
  ArrowLeft,
  FileText,
  Calendar,
  Clock,
  MapPin,
  Users,
} from "lucide-react";
import { motion } from "motion/react";

export default function AgendarNovoEncontroView({
  onBack,
  onSchedule,
}: {
  onBack: () => void;
  onSchedule: (event: any) => void;
}) {
  const [activeTab, setActiveTab] = useState<"agenda" | "nota">("agenda");
  const [formData, setFormData] = useState({
    title: "",
    type: "Reunião",
    agenda: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "",
    endTime: "",
    location: "",
    participants: [] as string[],
    preside: "",
  });

  const [noteData, setNoteData] = useState({
    title: "",
    content: "",
  });

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    onSchedule(formData);
    onBack();
  };

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic to save note
    onBack();
  };

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

      <div className="max-w-2xl mx-auto">
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab("agenda")}
            className={`px-6 py-3 rounded-xl font-bold transition-colors ${activeTab === "agenda" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
          >
            Agenda
          </button>
          <button
            onClick={() => setActiveTab("nota")}
            className={`px-6 py-3 rounded-xl font-bold transition-colors ${activeTab === "nota" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
          >
            Nota do dia
          </button>
        </div>

        {activeTab === "agenda" ? (
          <form
            onSubmit={handleSchedule}
            className="space-y-6 bg-gray-50 p-8 rounded-3xl"
          >
            <h2 className="text-2xl font-bold mb-6">Agendar Novo Encontro</h2>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Data
              </label>
              <input
                required
                type="date"
                className="w-full px-4 py-2 rounded-xl border border-gray-200"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Título
              </label>
              <input
                required
                type="text"
                className="w-full px-4 py-2 rounded-xl border border-gray-200"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Tipo de Evento
                </label>
                <select
                  className="w-full px-4 py-2 rounded-xl border border-gray-200"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                >
                  <option value="Reunião">Reunião</option>
                  <option value="Encontro">Encontro</option>
                  <option value="Início e Fechamento de Atividade">Início e Fechamento de Atividade</option>
                  <option value="Data Comemorativa">Data Comemorativa</option>
                  <option value="Feriado Nacional">Feriado Nacional</option>
                  <option value="Feriado Institucional">
                    Feriado Institucional
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Local
                </label>
                <select
                  className="w-full px-4 py-2 rounded-xl border border-gray-200"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                >
                  <option value="">Selecione o Local</option>
                  <option value="Sala de Reuniões">Sala de Reuniões</option>
                  <option value="Cerqs">Cerqs</option>
                  <option value="Sala de Aulas">Sala de Aulas</option>
                  <option value="Auditório">Auditório</option>
                  <option value="Lar de Estudantes">Lar de Estudantes</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Quem irá presidir
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 rounded-xl border border-gray-200"
                value={formData.preside}
                onChange={(e) =>
                  setFormData({ ...formData, preside: e.target.value })
                }
                placeholder="Nome de quem irá presidir"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Agenda
              </label>
              <textarea
                className="w-full px-4 py-2 rounded-xl border border-gray-200"
                value={formData.agenda}
                onChange={(e) =>
                  setFormData({ ...formData, agenda: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Inicia às
                </label>
                <input
                  required
                  type="time"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Termina às
                </label>
                <input
                  required
                  type="time"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Participantes
              </label>
              <select
                className="w-full px-4 py-2 rounded-xl border border-gray-200"
                value={formData.participants[0] || ""}
                onChange={(e) =>
                  setFormData({ ...formData, participants: [e.target.value] })
                }
              >
                <option value="">Selecione os participantes</option>
                {[
                  "Membros de CR",
                  "Membros de CAS",
                  "Pessoal fora do Quadro",
                  "Todos Diretores Centrais",
                  "Todos Diretores do Curso",
                  "Todos CTA",
                  "Todos Guardas",
                  "Todos estudantes",
                  "Todos estudantes Femininos",
                  "Todos estudantes Masculinos",
                ].map((participant) => (
                  <option key={participant} value={participant}>
                    {participant}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700"
            >
              Agendar
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleNoteSubmit}
            className="space-y-6 bg-gray-50 p-8 rounded-3xl"
          >
            <h2 className="text-2xl font-bold mb-6">Nova Nota do Dia</h2>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Título
              </label>
              <input
                required
                type="text"
                className="w-full px-4 py-2 rounded-xl border border-gray-200"
                value={noteData.title}
                onChange={(e) =>
                  setNoteData({ ...noteData, title: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Conteúdo
              </label>
              <textarea
                required
                className="w-full px-4 py-2 rounded-xl border border-gray-200"
                value={noteData.content}
                onChange={(e) =>
                  setNoteData({ ...noteData, content: e.target.value })
                }
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700"
            >
              Submeter Nota
            </button>
          </form>
        )}
      </div>
    </motion.div>
  );
}

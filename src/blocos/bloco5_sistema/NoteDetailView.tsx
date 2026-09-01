import React, { useState } from "react";
import { ArrowLeft, FileText, Archive } from "lucide-react";
import { motion } from "motion/react";
import { Nota } from "../../types";

export default function NoteDetailView({
  onBack,
  notes,
}: {
  onBack: () => void;
  notes: Nota[];
}) {
  const [showArchive, setShowArchive] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeNotes = notes
    .filter((note) => {
      const noteDate = new Date(note.date);
      noteDate.setHours(0, 0, 0, 0);
      return noteDate > today;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const archiveNotes = notes
    .filter((note) => {
      const noteDate = new Date(note.date);
      noteDate.setHours(0, 0, 0, 0);
      return noteDate <= today;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const isNew = (dateStr: string) => {
    const noteDate = new Date(dateStr);
    noteDate.setHours(0, 0, 0, 0);
    const diffTime = noteDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 3;
  };

  const displayedNotes = showArchive ? archiveNotes : activeNotes;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-white text-gray-900 p-8 md:p-16"
    >
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
          Voltar
        </button>
        <button
          onClick={() => setShowArchive(!showArchive)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-colors ${showArchive ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
        >
          <Archive size={20} />
          {showArchive
            ? "Ver Notas Ativas"
            : "Arquivo Morto (Repartição de Arquivo)"}
        </button>
      </div>

      <div className="max-w-4xl mx-auto">
        {showArchive && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-center font-bold">
            Localização: Repartição de Arquivo - Arquivo Morto | Ano de
            Referência: {new Date().getFullYear()}
          </div>
        )}
        {displayedNotes.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            Nenhuma nota encontrada.
          </div>
        ) : (
          <div className="space-y-12">
            {displayedNotes.map((note, index) => (
              <div key={note.id} className="relative">
                {isNew(note.date) && !showArchive && (
                  <div className="absolute -top-3 -left-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-10 animate-pulse">
                    Novo
                  </div>
                )}
                <div className="flex justify-end mb-2">
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-600">
                      {new Date(note.date).toLocaleDateString("pt-PT")}
                    </p>
                    <p className="text-sm font-bold text-gray-500">
                      Prazo: {new Date(note.prazo).toLocaleDateString("pt-PT")}
                    </p>
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-center mb-4">
                  {note.title}
                </h2>
                <div className="bg-gray-50 p-8 rounded-3xl relative">
                  <h3 className="text-xl font-bold text-center mb-4">
                    {note.remetente}
                  </h3>
                  <p className="text-gray-700 text-lg leading-relaxed text-center">
                    {note.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

import React, { useState } from "react";
import { ArrowLeft, Archive } from "lucide-react";
import { motion } from "motion/react";
import { Event } from "../../types";

export default function EventDetailView({
  events,
  onBack,
}: {
  events: Event[];
  onBack: () => void;
}) {
  const [showArchive, setShowArchive] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeEvents = events
    .filter((event) => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate > today;
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime}`);
      const dateB = new Date(`${b.date}T${b.startTime}`);
      return dateA.getTime() - dateB.getTime();
    });

  const archiveEvents = events
    .filter((event) => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate <= today;
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime}`);
      const dateB = new Date(`${b.date}T${b.startTime}`);
      return dateB.getTime() - dateA.getTime();
    });

  const isNew = (dateStr: string) => {
    const eventDate = new Date(dateStr);
    eventDate.setHours(0, 0, 0, 0);
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 3;
  };

  const displayedEvents = showArchive ? archiveEvents : activeEvents;

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
            ? "Ver Eventos Ativos"
            : "Arquivo Morto (Repartição de Arquivo)"}
        </button>
      </div>

      <div className="max-w-5xl mx-auto">
        {showArchive && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-center font-bold">
            Localização: Repartição de Arquivo - Arquivo Morto | Ano de
            Referência: {new Date().getFullYear()}
          </div>
        )}
        {displayedEvents.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            Nenhum evento encontrado.
          </div>
        ) : (
          <div className="space-y-16">
            {displayedEvents.map((event) => (
              <div key={event.id} className="relative">
                {isNew(event.date) && !showArchive && (
                  <div className="absolute -top-3 -left-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-10 animate-pulse">
                    Novo
                  </div>
                )}
                <div className="flex justify-end mb-4">
                  <div className="text-right flex gap-8">
                    <p className="text-sm font-bold text-gray-900">
                      {new Date(event.date).toLocaleDateString("pt-PT")}
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {event.location}
                    </p>
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-center mb-6">
                  {event.title}
                </h2>
                <div className="bg-gray-50 p-8 rounded-3xl relative">
                  <h3 className="text-xl font-bold text-center mb-8">
                    {event.remetente || "Gabinete do Diretor-Geral"}
                  </h3>

                  <div className="grid grid-cols-3 gap-8">
                    <div>
                      <p className="text-sm font-bold text-gray-900 mb-2">
                        Quem ira Presidir
                      </p>
                      <p className="text-gray-700 font-medium">
                        ( {event.preside || "N/A"} )
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-bold text-gray-900 mb-2">
                        Agenda
                      </p>
                      <div className="text-gray-700 font-medium whitespace-pre-wrap">
                        {event.agenda
                          ? event.agenda.split("\n").map((item, i) => (
                              <div key={i}>
                                {i + 1}º ponto( {item} )
                              </div>
                            ))
                          : "Nenhuma agenda definida."}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 mb-2">
                        Convocados
                      </p>
                      <p className="text-gray-700 font-medium">
                        ( {event.participants} )
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

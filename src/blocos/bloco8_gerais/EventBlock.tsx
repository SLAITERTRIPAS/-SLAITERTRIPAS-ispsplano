import React from "react";
import { Event } from "../../types";

export default function EventBlock({
  events = [],
  onEventClick,
}: {
  events: Event[];
  onEventClick: () => void;
}) {
  // Sort events by date and time
  const sortedEvents = [...(events || [])].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.startTime}`);
    const dateB = new Date(`${b.date}T${b.startTime}`);
    return dateA.getTime() - dateB.getTime();
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get only upcoming events or today's events
  const displayEvents = sortedEvents
    .filter((e) => {
      const eventDate = new Date(e.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= today;
    })
    .slice(0, 3);

  const isNew = (dateStr: string) => {
    const eventDate = new Date(dateStr);
    eventDate.setHours(0, 0, 0, 0);
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 3;
  };

  return (
    <div className="w-full sm:w-72 bg-slate-950/80 border border-slate-800 p-6 rounded-xl shadow-lg backdrop-blur-sm">
      <div className="space-y-4 mb-6">
        {displayEvents.length > 0 ? (
          displayEvents.map((event) => (
            <button
              key={event.id}
              onClick={onEventClick}
              className="w-full text-left border-l-2 border-amber-600 pl-4 hover:bg-white/5 transition-colors py-1 group relative"
            >
              <div className="flex flex-col">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-white font-bold text-[17px] leading-tight group-hover:text-amber-500 transition-colors truncate">
                    {event.title}
                  </p>
                  {isNew(event.date) && (
                    <span className="flex-none bg-amber-600 text-white text-[10px] font-black px-1.5 rounded-sm animate-pulse">
                      Novo
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-sm mt-1">
                  {new Date(event.date + "T12:00:00").toLocaleDateString(
                    "pt-PT",
                  )}{" "}
                  — {event.startTime}
                </p>
              </div>
            </button>
          ))
        ) : (
          <p className="text-slate-500 text-[17px] italic">
            Nenhum evento agendado.
          </p>
        )}
      </div>
      <button
        onClick={onEventClick}
        className="text-slate-400 text-[10px] font-bold hover:text-amber-500 transition-all tracking-widest"
      >
        VER CALENDÁRIO COMPLETO —
      </button>
    </div>
  );
}

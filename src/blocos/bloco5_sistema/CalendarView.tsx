import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Users,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Event, Nota } from "../../types";
import { holidays2026 } from "../../constants/holidays";

export default function CalendarView({
  events,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onAgendar,
  onNota,
  title,
  notes,
}: {
  events: Event[];
  onAddEvent?: (event: Omit<Event, "id">) => Promise<any>;
  onUpdateEvent?: (id: string, event: Partial<Event>) => Promise<any>;
  onDeleteEvent?: (id: string) => Promise<any>;
  onAgendar: () => void;
  onNota: () => void;
  title?: string;
  notes?: Nota[];
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAgendarOptions, setShowAgendarOptions] = useState(false);

  const [newEvent, setNewEvent] = useState({
    title: "",
    type: "Reunião" as
      | "Reunião"
      | "Encontro"
      | "Data Comemorativa"
      | "Feriado Nacional"
      | "Feriado Institucional",
    agenda: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    participants: [] as string[],
  });

  const daysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) =>
    new Date(year, month, 1).getDay();

  const prevMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1),
    );
  const nextMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1),
    );

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const eventDate =
      newEvent.date ||
      (selectedDate
        ? selectedDate.toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0]);

    const event: Omit<Event, "id"> = {
      title: newEvent.title,
      date: eventDate,
      startTime: newEvent.startTime,
      endTime: newEvent.endTime,
      location: newEvent.location,
      participants: newEvent.participants.join(", "),
      type:
        newEvent.type === "Reunião"
          ? "meeting"
          : newEvent.type === "Encontro"
            ? "activity"
            : (newEvent.type as any),
      agenda: newEvent.agenda,
    };

    if (onAddEvent) await onAddEvent(event);
    setShowModal(false);
    setNewEvent({
      title: "",
      type: "Reunião",
      agenda: "",
      date: "",
      startTime: "",
      endTime: "",
      location: "",
      participants: [],
    });
  };

  const allEvents = [...events, ...holidays2026];

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);
    const calendarDays = [];

    // Empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(
        <div
          key={`empty-${i}`}
          className="min-h-0 border border-slate-300/30 bg-transparent"
        ></div>,
      );
    }

    // Days of current month
    for (let day = 1; day <= days; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayEvents = allEvents.filter((e) => e.date === dateStr);
      const dayNotes = notes?.filter((n) => n.date === dateStr) || [];
      const isToday =
        new Date().toDateString() === new Date(year, month, day).toDateString();
      const isSelected = selectedDate?.toISOString().split("T")[0] === dateStr;

      calendarDays.push(
        <motion.div
          key={day}
          initial={isToday ? { scale: 0.98, opacity: 0 } : false}
          animate={isToday ? { scale: 1, opacity: 1 } : false}
          onClick={() => {
            const d = new Date(year, month, day);
            setSelectedDate(d);
            setNewEvent((prev) => ({
              ...prev,
              date: d.toISOString().split("T")[0],
            }));
            setShowModal(true);
          }}
          className={`min-h-0 border p-2 md:p-4 transition-all cursor-pointer relative group flex flex-col overflow-hidden ${
            isToday
              ? "border-red-500 border-2 z-10 shadow-lg bg-transparent"
              : isSelected
                ? "border-orange-500 bg-transparent"
                : "border-slate-300/30 bg-transparent hover:bg-white/10"
          }`}
        >
          <div className="flex flex-col items-center gap-2 h-full relative z-10 w-full text-center">
            <span
              className={`text-2xl font-black leading-none tracking-tighter transition-colors ${
                isToday
                  ? "text-blue-900"
                  : "text-blue-800 group-hover:text-blue-600"
              }`}
            >
              {day}
            </span>

            <div className="flex flex-col gap-1 w-full pt-1">
              {dayEvents.length > 0 &&
                dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="text-[11px] font-medium leading-tight text-blue-900 bg-white/60 backdrop-blur-sm p-1 rounded w-full text-justify hyphens-auto"
                  >
                    {event.title}
                  </div>
                ))}
            </div>
          </div>

          <div className="mt-auto flex justify-between items-center relative z-10">
            {dayNotes.length > 0 && (
              <div className="text-[10px] font-black tracking-widest text-red-500">
                Nota Pendente
              </div>
            )}
          </div>
        </motion.div>,
      );
    }

    // Trailing empty slots to complete 35 or 42 cells (5 or 6 full rows)
    const totalSlots = calendarDays.length <= 35 ? 35 : 42;
    while (calendarDays.length < totalSlots) {
      calendarDays.push(
        <div
          key={`empty-trailing-${calendarDays.length}`}
          className="min-h-0 border border-slate-300/30 bg-transparent"
        ></div>,
      );
    }

    return calendarDays;
  };

  return (
    <div className="w-full flex justify-center items-start py-6 px-4">
      <div className="w-full max-w-7xl flex flex-col xl:flex-row gap-6 relative mx-auto">
        {/* Left side: Calendar Grid */}
        <div className="relative bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col w-full xl:w-[70%] aspect-[35/30]">
          {/* Background Logo */}
          <div
            className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none"
            style={{
              backgroundImage:
                'url("https://lh3.googleusercontent.com/d/1Xasp7NB08GDtIE2VEwf-O5iycCdDJKg1")',
              backgroundSize: "100% 100%",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              opacity: 0.5,
            }}
          />

          <div className="relative z-10 flex flex-col h-full bg-transparent">
            <div className="grid grid-cols-7 bg-[#10172e] flex-none">
              {[
                "Domingo",
                "Segunda",
                "Terça",
                "Quarta",
                "Quinta",
                "Sexta",
                "Sábado",
              ].map((day, index) => {
                const isTodayColumn =
                  new Date().getDay() === index &&
                  currentDate.getMonth() === new Date().getMonth() &&
                  currentDate.getFullYear() === new Date().getFullYear();

                return (
                  <div
                    key={day}
                    className={`py-3 text-center text-[11px] md:text-xs font-black tracking-wider transition-colors truncate ${
                      isTodayColumn
                        ? "bg-gradient-to-b from-red-600 to-orange-500 text-white z-10 shadow-lg"
                        : "text-blue-200"
                    }`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-7 flex-grow auto-rows-fr">
              {renderCalendar()}
            </div>

            {/* Songo Watermark */}
            <div className="p-3 flex justify-end flex-none">
              <span className="text-2xl font-black text-gray-400/40 font-serif tracking-tighter">
                Songo
              </span>
            </div>
          </div>
        </div>

        {/* Right side: Controls and List */}
        <div className="w-full xl:w-[35%] bg-white rounded-3xl shadow-xl border border-gray-100 p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row xl:flex-col justify-between items-start sm:items-center xl:items-start gap-3 z-30">
            <div className="flex items-center gap-3">
              <div className="flex gap-1 bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
                <button
                  onClick={prevMonth}
                  className="p-1 hover:bg-slate-50 rounded-lg transition-colors text-slate-600"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1 hover:bg-slate-50 rounded-lg transition-colors text-slate-600"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              <span className="text-base font-black text-blue-900 tracking-tighter">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
            </div>

            <div className="relative w-full sm:w-auto xl:w-full">
              <button
                onClick={() => setShowAgendarOptions(!showAgendarOptions)}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-md shadow-blue-100 tracking-widest"
              >
                <Plus size={18} /> Agendar
              </button>
              <AnimatePresence>
                {showAgendarOptions && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-full bg-white rounded-2xl shadow-2xl z-[100] border border-gray-100 overflow-hidden origin-top-right"
                  >
                    <button
                      onClick={() => {
                        setShowAgendarOptions(false);
                        onAgendar();
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 text-[11px] font-black text-blue-900 tracking-widest border-b border-gray-50"
                    >
                      Agendar Encontro
                    </button>
                    <button
                      onClick={() => {
                        setShowAgendarOptions(false);
                        setNewEvent({ ...newEvent, type: "Data Comemorativa" });
                        setShowModal(true);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 text-[11px] font-black text-blue-900 tracking-widest border-b border-gray-50"
                    >
                      Data Comemorativa
                    </button>
                    <button
                      onClick={() => {
                        setShowAgendarOptions(false);
                        setNewEvent({ ...newEvent, type: "Feriado Nacional" });
                        setShowModal(true);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 text-[11px] font-black text-blue-900 tracking-widest border-b border-gray-50"
                    >
                      Feriado Nacional
                    </button>
                    <button
                      onClick={() => {
                        setShowAgendarOptions(false);
                        setNewEvent({
                          ...newEvent,
                          type: "Feriado Institucional",
                        });
                        setShowModal(true);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 text-[11px] font-black text-blue-900 tracking-widest border-b border-gray-50"
                    >
                      Feriado Institucional
                    </button>
                    <button
                      onClick={() => {
                        setShowAgendarOptions(false);
                        onNota();
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 text-[11px] font-black text-blue-900 tracking-widest"
                    >
                      Nota do Dia
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Agendamento */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-blue-600 text-white">
                <h3 className="text-xl font-bold">Agendar Novo Encontro</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddEvent} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Data
                  </label>
                  <input
                    required
                    type="date"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newEvent.date}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, date: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Título da Actividade
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ex: Reunião de Planejamento"
                    value={newEvent.title}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, title: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Tipo de Encontro
                    </label>
                    <select
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newEvent.type}
                      onChange={(e) =>
                        setNewEvent({
                          ...newEvent,
                          type: e.target.value as any,
                        })
                      }
                    >
                      <option value="Reunião">Reunião</option>
                      <option value="Encontro">Encontro</option>
                      <option value="Data Comemorativa">
                        Data Comemorativa
                      </option>
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
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newEvent.location}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, location: e.target.value })
                      }
                    >
                      <option value="">Selecione o Local</option>
                      <option value="Sala de Reuniões">Sala de Reuniões</option>
                      <option value="Cerqs">Cerqs</option>
                      <option value="Sala de Aulas">Sala de Aulas</option>
                      <option value="Auditório">Auditório</option>
                      <option value="Lar de Estudantes">
                        Lar de Estudantes
                      </option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Agenda
                  </label>
                  <textarea
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Descreva a agenda..."
                    value={newEvent.agenda}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, agenda: e.target.value })
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
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newEvent.startTime}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, startTime: e.target.value })
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
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newEvent.endTime}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, endTime: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Participantes
                  </label>
                  {[
                    "Membros de CR",
                    "Membros de CAS",
                    "Pessoal fora do Quadro",
                    "Todos estudantes",
                    "Todos estudantes Femininos",
                    "Todos estudantes Masculinos",
                  ].map((participant) => (
                    <label
                      key={participant}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="checkbox"
                        checked={newEvent.participants.includes(participant)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewEvent({
                              ...newEvent,
                              participants: [
                                ...newEvent.participants,
                                participant,
                              ],
                            });
                          } else {
                            setNewEvent({
                              ...newEvent,
                              participants: newEvent.participants.filter(
                                (p) => p !== participant,
                              ),
                            });
                          }
                        }}
                      />
                      <span className="text-sm text-gray-700">
                        {participant}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
                  >
                    Submeter o Registo
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

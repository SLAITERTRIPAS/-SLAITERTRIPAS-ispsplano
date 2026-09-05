import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Users,
  X,
  Calendar as CalendarIcon,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Lock,
  Unlock,
  Save,
  AlertTriangle,
  Trash2,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Event, Nota, PeriodoPlanificacao } from "../../types";
import { holidays2026 } from "../../constants/holidays";
import {
  DEFAULT_PLANNING_PERIOD,
  canManagePeriodoPlanificacao,
  subscribePeriodoPlanificacao,
  savePeriodoPlanificacao,
  isPlanificacaoAberta,
  isRelatorioSemestralAberto,
  ativarContagem30DiasPlanificacao,
  ativarPeriodoRelatorio,
  estenderPrazoPlanificacao,
  executarSubmissaoAutomaticaSePrazoExpirado,
  getCicloPlanoEstrutura,
  getCicloRelatorioEstrutura,
} from "../../lib/planningPeriodService";

export default function CalendarView({
  events,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onAgendar,
  onNota,
  title,
  notes,
  user,
}: {
  events: Event[];
  onAddEvent?: (event: Omit<Event, "id">) => Promise<any>;
  onUpdateEvent?: (id: string, event: Partial<Event>) => Promise<any>;
  onDeleteEvent?: (id: string) => Promise<any>;
  onAgendar: () => void;
  onNota: () => void;
  title?: string;
  notes?: Nota[];
  user?: any;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAgendarOptions, setShowAgendarOptions] = useState(false);

  // Período de Planificação state
  const [periodoPlanificacao, setPeriodoPlanificacao] = useState<PeriodoPlanificacao>(DEFAULT_PLANNING_PERIOD);
  const [showPeriodoModal, setShowPeriodoModal] = useState(false);
  const [periodoForm, setPeriodoForm] = useState<Partial<PeriodoPlanificacao>>({ ...DEFAULT_PLANNING_PERIOD });
  const [isSavingPeriodo, setIsSavingPeriodo] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  const currentUser = user || (typeof window !== "undefined" ? JSON.parse(localStorage.getItem("sigep_logged_in_user") || "null") : null);
  const canManagePeriod = canManagePeriodoPlanificacao(currentUser);

  useEffect(() => {
    const unsub = subscribePeriodoPlanificacao((periodo) => {
      setPeriodoPlanificacao(periodo);
      setPeriodoForm(periodo);
      if (periodo && !isPlanificacaoAberta(periodo).aberta) {
        executarSubmissaoAutomaticaSePrazoExpirado(periodo);
      }
    });
    return () => unsub();
  }, []);

  const handleSavePeriodo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPeriodo(true);
    try {
      await savePeriodoPlanificacao(periodoForm, currentUser);
      setSaveSuccessMsg("Período de planificação e relatórios atualizado com sucesso!");
      setTimeout(() => {
        setSaveSuccessMsg("");
        setShowPeriodoModal(false);
      }, 1500);
    } catch (err) {
      console.error("Erro ao salvar período de planificação:", err);
      alert("Erro ao salvar período de planificação. Tente novamente.");
    } finally {
      setIsSavingPeriodo(false);
    }
  };

  const planStatus = isPlanificacaoAberta(periodoPlanificacao);
  const relatorioStatus = isRelatorioSemestralAberto(periodoPlanificacao);


  const [newEvent, setNewEvent] = useState({
    title: "",
    type: "Reunião" as
      | "Reunião"
      | "Encontro"
      | "Início e Fechamento de Atividade"
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

  const [eventFilter, setEventFilter] = useState<"todos" | "reunioes" | "feriados" | "notas">("todos");
  const [searchQuery, setSearchQuery] = useState("");

  const activeYear = currentDate.getFullYear();
  const activeMonth = currentDate.getMonth();

  const monthEvents = allEvents.filter((e) => {
    if (!e.date) return false;
    const [y, m] = e.date.split("-").map(Number);
    return y === activeYear && m === activeMonth + 1;
  });

  const monthNotes = (notes || []).filter((n) => {
    if (!n.date) return false;
    const [y, m] = n.date.split("-").map(Number);
    return y === activeYear && m === activeMonth + 1;
  });

  const rawDisplayEvents = selectedDate
    ? monthEvents.filter((e) => e.date === selectedDate.toISOString().split("T")[0])
    : monthEvents;

  const rawDisplayNotes = selectedDate
    ? monthNotes.filter((n) => n.date === selectedDate.toISOString().split("T")[0])
    : monthNotes;

  const filteredDisplayItems = [...rawDisplayEvents, ...rawDisplayNotes].filter((item: any) => {
    const isNote = item.hasOwnProperty("content");

    if (eventFilter === "reunioes") {
      if (isNote) return false;
      const t = item.type || "";
      if (t === "Feriado Nacional" || t === "Feriado Institucional" || t === "Data Comemorativa") return false;
    } else if (eventFilter === "feriados") {
      if (isNote) return false;
      const t = item.type || "";
      if (t !== "Feriado Nacional" && t !== "Feriado Institucional" && t !== "Data Comemorativa") return false;
    } else if (eventFilter === "notas") {
      if (!isNote) return false;
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const titleMatch = (item.title || "").toLowerCase().includes(q);
      const locMatch = (item.location || "").toLowerCase().includes(q);
      const agendaMatch = (item.agenda || item.content || "").toLowerCase().includes(q);
      return titleMatch || locMatch || agendaMatch;
    }

    return true;
  });

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
    <div className="w-full flex flex-col justify-center items-center py-6 px-4">
      <div className="w-full max-w-7xl flex flex-col gap-6 relative mx-auto">
        {/* Banner de Estado do Período de Planificação e Relatórios */}
        <div className="w-full bg-white rounded-3xl p-4 sm:p-5 shadow-lg border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
              planStatus.aberta ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
            }`}>
              {planStatus.aberta ? <Unlock size={20} /> : <Lock size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  Período de Planificação Institucional
                </h3>
                <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md border ${
                  planStatus.aberta
                    ? "bg-emerald-600 text-white border-emerald-700"
                    : "bg-red-600 text-white border-red-700"
                }`}>
                  {planStatus.aberta ? "Período Aberto" : "Período Fechado"}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {planStatus.aberta
                  ? `Ciclo de submissão oficial ativo até ${periodoPlanificacao?.dataFimPlanificacao || "ao encerramento do prazo"}`
                  : (planStatus.motivo || "Fora do período oficial de elaboração e submissão de planos setoriais.")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-xl">
              <span className="text-xs font-bold text-slate-600">Relatórios Semestrais:</span>
              <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md ${
                relatorioStatus.aberto ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"
              }`}>
                {relatorioStatus.aberto ? "Aberto" : "Fechado"}
              </span>
            </div>

            {canManagePeriod && (
              <button
                onClick={() => setShowPeriodoModal(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-2 shadow-md shadow-purple-100 shrink-0"
              >
                <ShieldCheck size={16} /> Gerir Prazos
              </button>
            )}
          </div>
        </div>

        <div className="w-full flex flex-col xl:flex-row gap-6 relative">
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
                    {/* Período de Planificação (Acessível ao Chefe do DPEP e Técnico de Planificação) */}
                    {canManagePeriod && (
                      <button
                        onClick={() => {
                          setShowAgendarOptions(false);
                          setShowPeriodoModal(true);
                        }}
                        className="w-full text-left px-4 py-3 bg-purple-50/80 hover:bg-purple-100 text-[11px] font-black text-purple-900 tracking-wider border-b border-purple-100 flex items-center justify-between"
                      >
                        <span className="flex items-center gap-1.5">
                          <CalendarIcon size={14} className="text-purple-700" />
                          Período de Planificação
                        </span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-md font-extrabold ${
                            periodoPlanificacao.status === "aberto"
                              ? "bg-emerald-600 text-white"
                              : "bg-red-600 text-white"
                          }`}
                        >
                          {periodoPlanificacao.status === "aberto" ? "Aberto" : "Fechado"}
                        </span>
                      </button>
                    )}

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

          {/* Lista Directa de Eventos na Área */}
          <div className="flex flex-col gap-3 pt-3 border-t border-slate-100 flex-1 overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                  {selectedDate
                    ? `Eventos em ${selectedDate.toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" })}`
                    : `Eventos de ${monthNames[currentDate.getMonth()]}`}
                </h4>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                  {filteredDisplayItems.length} registo(s) apresentado(s)
                </p>
              </div>

              {selectedDate && (
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline"
                >
                  Ver Todo o Mês
                </button>
              )}
            </div>

            {/* Categorias de Filtro */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-bold">
              {[
                { key: "todos", label: "Todos" },
                { key: "reunioes", label: "Reuniões" },
                { key: "feriados", label: "Feriados" },
                { key: "notas", label: "Notas" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setEventFilter(tab.key as any)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    eventFilter === tab.key
                      ? "bg-blue-600 text-white shadow-sm font-black"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Pesquisa */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar evento ou local..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium"
              />
            </div>

            {/* Content List */}
            <div className="max-h-[380px] xl:max-h-[460px] overflow-y-auto space-y-2.5 pr-1">
              {filteredDisplayItems.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 my-2">
                  <CalendarIcon size={26} className="mx-auto text-slate-300 mb-1.5" />
                  <p className="text-xs font-bold text-slate-500">Nenhum evento nesta seleção.</p>
                  <p className="text-[10px] text-slate-400 mt-1">Utilize o botão "Agendar" para criar novos compromissos.</p>
                </div>
              ) : (
                filteredDisplayItems.map((item: any) => {
                  const isNote = item.hasOwnProperty("content");
                  const eventType = item.type || "Reunião";

                  return (
                    <div
                      key={item.id || Math.random().toString()}
                      className="p-3 bg-slate-50/80 hover:bg-slate-100/90 border border-slate-200/80 rounded-2xl transition-all flex flex-col gap-1.5 group relative shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 font-mono">
                            {item.date ? item.date.split("-").reverse().join("/") : "Sem data"}
                          </span>

                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            isNote
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : eventType === "Feriado Nacional"
                              ? "bg-red-100 text-red-800 border border-red-200"
                              : eventType === "Feriado Institucional"
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : eventType === "Data Comemorativa"
                              ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}>
                            {isNote ? "Nota do Dia" : eventType}
                          </span>
                        </div>

                        {!isNote && onDeleteEvent && !String(item.id).startsWith("feriado-") && (
                          <button
                            onClick={async () => {
                              if (confirm(`Tem a certeza que deseja eliminar o evento "${item.title}"?`)) {
                                await onDeleteEvent(item.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar Evento"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      <div>
                        <h5 className="text-xs font-black text-slate-800 leading-snug">
                          {item.title}
                        </h5>
                        {isNote && item.content && (
                          <p className="text-[11px] text-slate-600 mt-1">{item.content}</p>
                        )}
                        {!isNote && item.agenda && (
                          <p className="text-[11px] text-slate-600 mt-1">{item.agenda}</p>
                        )}
                      </div>

                      {!isNote && (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold text-slate-500 pt-1 border-t border-slate-200/60">
                          {item.startTime && (
                            <span className="flex items-center gap-1 text-slate-700">
                              <Clock size={11} className="text-blue-600" />
                              {item.startTime} {item.endTime ? `- ${item.endTime}` : ""}
                            </span>
                          )}
                          {item.location && (
                            <span className="flex items-center gap-1 text-slate-700">
                              <MapPin size={11} className="text-red-500" />
                              {item.location}
                            </span>
                          )}
                          {item.preside && (
                            <span className="flex items-center gap-1 text-slate-700">
                              <Users size={11} className="text-purple-600" />
                              Preside: {item.preside}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
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
                    Título da Atividade
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
                      <option value="Início e Fechamento de Atividade">
                        Início e Fechamento de Atividade
                      </option>
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

        {/* Modal de Gestão do Período de Planificação e Relatórios */}
        {showPeriodoModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <CalendarIcon size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Gestão do Período de Planificação e Relatórios
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Controlo do calendário institucional (DPEP & Repartição de Planificação)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPeriodoModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {saveSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  {saveSuccessMsg}
                </div>
              )}

              {/* Seção 1: Período de Planificação dos Setores */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-purple-50/30 border border-purple-100/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className="text-purple-700" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Período de Planificação dos Setores
                    </h4>
                  </div>
                  {(() => {
                    const statusInfo = isPlanificacaoAberta(periodoPlanificacao);
                    return (
                      <span
                        className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm border ${
                          statusInfo.aberta
                            ? "bg-emerald-600 text-white border-emerald-700"
                            : "bg-red-600 text-white border-red-700"
                        }`}
                      >
                        {statusInfo.aberta ? "Período Aberto" : "Período Expirado"}
                      </span>
                    );
                  })()}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Ao ativar, o sistema abre o ciclo oficial de planificação por <strong>30 dias</strong> contados a partir da data de ativação (ou de 1 a 30 de Abril).
                </p>

                {/* Ciclo de 3 Meses do Plano de Atividades */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-900 block">
                    Trajetória do Ciclo do Plano de Atividades (3 Meses):
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {getCicloPlanoEstrutura().map((estagio) => (
                      <div
                        key={estagio.mesNumero}
                        className="p-2.5 rounded-xl bg-white border border-purple-100 shadow-sm space-y-1 hover:border-purple-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                            Mês {estagio.mesNumero} - {estagio.mesNome}
                          </span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-800 leading-tight">
                          {estagio.fase}
                        </p>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          {estagio.descricao}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    type="button"
                    onClick={async () => {
                      setIsSavingPeriodo(true);
                      await ativarContagem30DiasPlanificacao(currentUser);
                      setSaveSuccessMsg("Período de planificação aberto com sucesso por 30 dias a partir de hoje!");
                      setTimeout(() => setSaveSuccessMsg(""), 3000);
                      setIsSavingPeriodo(false);
                    }}
                    disabled={isSavingPeriodo}
                    className="flex-1 min-w-[200px] bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl text-xs font-black tracking-wide shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Unlock size={16} /> Abrir Período de Planificação (30 Dias)
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      setIsSavingPeriodo(true);
                      await savePeriodoPlanificacao({ status: "fechado" }, currentUser);
                      const resAuto = await executarSubmissaoAutomaticaSePrazoExpirado(periodoPlanificacao);
                      setSaveSuccessMsg(
                        `Período encerrado. ${resAuto.submetidas > 0 ? `${resAuto.submetidas} atividades submetidas automaticamente.` : ""}`
                      );
                      setTimeout(() => setSaveSuccessMsg(""), 3500);
                      setIsSavingPeriodo(false);
                    }}
                    disabled={isSavingPeriodo}
                    className="bg-red-600 hover:bg-red-700 text-white py-2.5 px-4 rounded-xl text-xs font-black tracking-wide shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Lock size={16} /> Encerrar & Submeter Rascunhos
                  </button>
                </div>

                {/* Extensão de Prazo em 2 Fases (1ª Fase: +7 Dias | 2ª Fase: +5 Dias) */}
                <div className="pt-3 border-t border-purple-100/80 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock size={14} className="text-purple-700" />
                      Extensão de Prazo pelos Setores (DPEP / Planificação)
                    </span>
                    <span className="text-[10px] font-bold text-purple-800 bg-purple-100/80 px-2.5 py-0.5 rounded-md border border-purple-200">
                      {periodoPlanificacao?.extensaoFase2Usada
                        ? "Esgotado: 2ª Fase Usada (+12d total)"
                        : periodoPlanificacao?.extensaoFase1Usada
                        ? "1ª Fase Usada (+7d)"
                        : "Extensão Disponível"}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-snug">
                    A extensão é permitida estritamente em duas fases: <strong>1ª Fase (+7 Dias)</strong> e <strong>2ª Fase (+5 Dias)</strong>. Após a segunda fase, não é possível estender mais o prazo.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!periodoPlanificacao) return;
                        setIsSavingPeriodo(true);
                        const res = await estenderPrazoPlanificacao(1, periodoPlanificacao, currentUser);
                        setSaveSuccessMsg(res.message);
                        setTimeout(() => setSaveSuccessMsg(""), 4000);
                        setIsSavingPeriodo(false);
                      }}
                      disabled={isSavingPeriodo || Boolean(periodoPlanificacao?.extensaoFase1Usada)}
                      className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm border ${
                        periodoPlanificacao?.extensaoFase1Usada
                          ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                          : "bg-purple-700 hover:bg-purple-800 text-white border-purple-800"
                      }`}
                    >
                      <Clock size={14} /> 1ª Fase (+7 Dias)
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        if (!periodoPlanificacao) return;
                        setIsSavingPeriodo(true);
                        const res = await estenderPrazoPlanificacao(2, periodoPlanificacao, currentUser);
                        setSaveSuccessMsg(res.message);
                        setTimeout(() => setSaveSuccessMsg(""), 4000);
                        setIsSavingPeriodo(false);
                      }}
                      disabled={
                        isSavingPeriodo ||
                        !periodoPlanificacao?.extensaoFase1Usada ||
                        Boolean(periodoPlanificacao?.extensaoFase2Usada)
                      }
                      className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm border ${
                        periodoPlanificacao?.extensaoFase2Usada || !periodoPlanificacao?.extensaoFase1Usada
                          ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                          : "bg-amber-600 hover:bg-amber-700 text-white border-amber-700"
                      }`}
                    >
                      <Clock size={14} /> 2ª Fase (+5 Dias Final)
                    </button>
                  </div>

                  {periodoPlanificacao?.extensaoFase2Usada && (
                    <div className="p-2.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-[10px] font-bold flex items-center gap-2">
                      <AlertTriangle size={14} className="text-red-600 shrink-0" />
                      O prazo atingiu o limite máximo de extensões (7 + 5 dias). Não é possível estender mais. Quando o prazo expirar, a submissão será automática.
                    </div>
                  )}
                </div>
              </div>

              {/* Seção 2: Período de Relatórios Semestrais */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 border border-blue-100/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={18} className="text-blue-700" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Período de Relatórios Semestrais
                    </h4>
                  </div>
                  {(() => {
                    const statusRel = isRelatorioSemestralAberto(periodoPlanificacao);
                    return (
                      <span
                        className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm border ${
                          statusRel.aberto
                            ? "bg-emerald-600 text-white border-emerald-700"
                            : "bg-red-600 text-white border-red-700"
                        }`}
                      >
                        {statusRel.aberto ? "Período Aberto" : "Período Expirado"}
                      </span>
                    );
                  })()}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Regulamentarmente inicia no dia <strong>1 de Janeiro</strong> com a duração de{" "}
                  <strong>3 meses (até 31 de Março)</strong> para produção, compilação e aprovação do relatório.
                </p>

                {/* Ciclo de 3 Meses do Relatório */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-900 block">
                    Trajetória do Ciclo do Relatório (3 Meses):
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {getCicloRelatorioEstrutura().map((estagio) => (
                      <div
                        key={estagio.mesNumero}
                        className="p-2.5 rounded-xl bg-white border border-blue-100 shadow-sm space-y-1 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                            Mês {estagio.mesNumero} - {estagio.mesNome}
                          </span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-800 leading-tight">
                          {estagio.fase}
                        </p>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          {estagio.descricao}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    type="button"
                    onClick={async () => {
                      setIsSavingPeriodo(true);
                      await ativarPeriodoRelatorio(currentUser);
                      setSaveSuccessMsg("Período de relatórios ativado para a janela regular (1 Jan a 31 Mar - 3 meses).");
                      setTimeout(() => setSaveSuccessMsg(""), 3000);
                      setIsSavingPeriodo(false);
                    }}
                    disabled={isSavingPeriodo}
                    className="flex-1 min-w-[200px] bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl text-xs font-black tracking-wide shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Unlock size={16} /> Abrir Período de Relatórios (3 Meses)
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      setIsSavingPeriodo(true);
                      await savePeriodoPlanificacao({ statusRelatorio: "fechado" }, currentUser);
                      setSaveSuccessMsg("Período de relatórios encerrado manualmente.");
                      setTimeout(() => setSaveSuccessMsg(""), 3000);
                      setIsSavingPeriodo(false);
                    }}
                    disabled={isSavingPeriodo}
                    className="bg-red-600 hover:bg-red-700 text-white py-2.5 px-4 rounded-xl text-xs font-black tracking-wide shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Lock size={16} /> Encerrar Relatórios
                  </button>
                </div>
              </div>

              {/* Formulário Personalizado de Intervalo */}
              <form onSubmit={handleSavePeriodo} className="space-y-4 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Ajuste Personalizado de Datas do Período
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Início da Planificação
                    </label>
                    <input
                      type="date"
                      value={periodoForm.dataInicioPlanificacao || ""}
                      onChange={(e) =>
                        setPeriodoForm({ ...periodoForm, dataInicioPlanificacao: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Fim da Planificação
                    </label>
                    <input
                      type="date"
                      value={periodoForm.dataFimPlanificacao || ""}
                      onChange={(e) =>
                        setPeriodoForm({ ...periodoForm, dataFimPlanificacao: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Início dos Relatórios
                    </label>
                    <input
                      type="date"
                      value={periodoForm.dataInicioRelatorioSemestral || ""}
                      onChange={(e) =>
                        setPeriodoForm({ ...periodoForm, dataInicioRelatorioSemestral: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Fim dos Relatórios
                    </label>
                    <input
                      type="date"
                      value={periodoForm.dataFimRelatorioSemestral || ""}
                      onChange={(e) =>
                        setPeriodoForm({ ...periodoForm, dataFimRelatorioSemestral: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Observações / Nota Institucional
                  </label>
                  <textarea
                    rows={2}
                    value={periodoForm.observacoes || ""}
                    onChange={(e) =>
                      setPeriodoForm({ ...periodoForm, observacoes: e.target.value })
                    }
                    placeholder="E.g., Período extraordinário aberto pela Direção Geral..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPeriodoModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingPeriodo}
                    className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <Save size={14} /> Guardar Configurações
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

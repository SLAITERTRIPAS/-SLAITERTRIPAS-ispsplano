import React, { useState, useMemo, useEffect } from "react";
import {
  Send,
  User,
  Search,
  Users,
  ChevronDown,
  Check,
  MessageSquare,
  Trash2,
  Inbox,
  SendHorizontal,
  Plus,
  ArrowLeft,
  Mail,
  MailOpen,
  CheckCheck,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Colaborador, Message } from "../../types";
import { firestoreService } from "../../lib/firestoreService";
import { serverTimestamp } from "firebase/firestore";

interface CaixaMensagensViewProps {
  departmentTitle: string;
  user?: any;
  colaboradores?: Colaborador[];
}

type ViewMode = "entrada" | "saida" | "nova";

export default function CaixaMensagensView({
  departmentTitle,
  user,
  colaboradores = [],
}: CaixaMensagensViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("entrada");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [search, setSearch] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [isReplying, setIsReplying] = useState(false);

  // Novos estados para fluxo de múltiplos destinatários
  const [isSelectingTargets, setIsSelectingTargets] = useState(false);
  const [isSupportMode, setIsSupportMode] = useState(false);
  const [targetRecipients, setTargetRecipients] = useState<Colaborador[]>([]);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const isSameDay = (d1: any, d2: any) => {
    if (!d1 || !d2) return false;
    const date1 = d1.toDate ? d1.toDate() : new Date(d1.seconds * 1000);
    const date2 = d2.toDate ? d2.toDate() : new Date(d2.seconds * 1000);
    return date1.toDateString() === date2.toDateString();
  };

  const formatDateHeader = (timestamp: any) => {
    if (!timestamp) return "";
    try {
      const date = timestamp.toDate
        ? timestamp.toDate()
        : timestamp.seconds
          ? new Date(timestamp.seconds * 1000)
          : typeof timestamp === "string"
            ? new Date(timestamp)
            : null;
      if (!date || isNaN(date.getTime())) return "";

      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) return "Hoje";
      if (date.toDateString() === yesterday.toDateString()) return "Ontem";
      return date.toLocaleDateString([], {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch (e) {
      return "";
    }
  };

  // Subscrever às mensagens filtradas pelo utilizador atual
  useEffect(() => {
    if (!user?.id) return;
    const unsub = firestoreService.messages.subscribe(
      user.id,
      (data: Message[]) => {
        setAllMessages(data);
      },
    );
    return () => unsub();
  }, [user?.id]);

  // Marcar como lida ao abrir uma conversa na Entrada
  useEffect(() => {
    setIsReplying(false); // Reset reply state when changing conversation
    if (viewMode === "entrada" && selectedConversationId && user) {
      const messagesToMarkAsRead = allMessages.filter(
        (m) =>
          m.senderId === selectedConversationId &&
          m.recipientId === user.id &&
          !m.read,
      );

      messagesToMarkAsRead.forEach((m) => {
        if (m.id) firestoreService.messages.markAsRead(m.id);
      });
    }
  }, [selectedConversationId, viewMode, allMessages, user]);

  const inboxGroups = useMemo(() => {
    if (!user?.id) return [];
    const received = allMessages.filter((m) => m.recipientId === user.id);
    const groups: Record<
      string,
      { lastMsg: Message; unreadCount: number; contactName: string }
    > = {};

    received
      .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
      .forEach((m) => {
        const otherId = m.senderId;
        if (!groups[otherId]) {
          groups[otherId] = {
            lastMsg: m,
            unreadCount: 0,
            contactName: m.senderName,
          };
        }
        if (!m.read) groups[otherId].unreadCount++;
      });

    return Object.entries(groups).map(([id, data]) => ({ id, ...data }));
  }, [allMessages, user?.id]);

  const sentGroups = useMemo(() => {
    if (!user?.id) return [];
    const sent = allMessages.filter((m) => m.senderId === user.id);
    const groups: Record<string, { lastMsg: Message; contactName: string }> =
      {};

    sent
      .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
      .forEach((m) => {
        const otherId = m.recipientId;
        if (!groups[otherId]) {
          groups[otherId] = {
            lastMsg: m,
            contactName: m.recipientName,
          };
        }
      });

    return Object.entries(groups).map(([id, data]) => ({ id, ...data }));
  }, [allMessages, user?.id]);

  const activeMessages = useMemo(() => {
    if (!user || !selectedConversationId) return [];
    return allMessages
      .filter(
        (m) =>
          (m.senderId === user.id &&
            m.recipientId === selectedConversationId) ||
          (m.senderId === selectedConversationId && m.recipientId === user.id),
      )
      .sort(
        (a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0),
      );
  }, [allMessages, user, selectedConversationId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [activeMessages]);

  // Find admins and owner
  const admins = useMemo(() => {
    return colaboradores.filter(
      (c) =>
        c.id !== user?.id &&
        (c.cargo?.toLowerCase().includes("administrador") ||
          c.cargoChefia?.toLowerCase().includes("administrador") ||
          c.nome === "Franzíssi Tripalonga" ||
          c.nome === "SLAITER TRIPAS"),
    );
  }, [colaboradores, user]);

  const availableRecipients = useMemo(() => {
    if (!user || !colaboradores.length) return [];
    if (isSupportMode) {
      return admins;
    }
    return colaboradores.filter((c) => c.id !== user.id);
  }, [user, colaboradores, isSupportMode, admins]);

  const filteredRecipients = availableRecipients.filter(
    (r) =>
      r.nome.toLowerCase().includes(search.toLowerCase()) ||
      (r.nuit || "").includes(search),
  );

  const toggleRecipientSelection = (recipient: Colaborador) => {
    setTargetRecipients((prev) => {
      const isSelected = prev.find((p) => p.id === recipient.id);
      if (isSelected) {
        return prev.filter((p) => p.id !== recipient.id);
      }
      if (prev.length >= 50) return prev; // Limite de 50
      return [...prev, recipient];
    });
  };

  const toggleSelectAll = () => {
    if (targetRecipients.length === filteredRecipients.length) {
      setTargetRecipients([]);
    } else {
      setTargetRecipients(filteredRecipients);
    }
  };

  const handleSendToAll = async () => {
    if (!newMessage.trim() || !user?.id) return;

    // Confirmação para envio em massa
    if (
      !window.confirm(
        `Tem certeza que deseja enviar esta mensagem para TODOS os ${availableRecipients.length} colaboradores do sistema?`,
      )
    ) {
      return;
    }

    try {
      const promises = availableRecipients.map((recipient) => {
        const messageData: Message = {
          text: newMessage.trim(),
          subject: subject.trim() || "Sem Assunto",
          senderId: user.id,
          senderName: user.nome || "Utilizador",
          recipientId: recipient.id,
          recipientName: recipient.nome,
          timestamp: serverTimestamp(),
          read: false,
        };
        return firestoreService.messages.add(messageData);
      });

      await Promise.all(promises);

      setNewMessage("");
      setSubject("");
      setTargetRecipients([]);
      setIsSelectingTargets(false);
      setViewMode("saida");
      alert("Mensagem enviada para todos os colaboradores com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar mensagens para todos:", error);
      alert("Erro ao processar envio em massa.");
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    console.log(
      "DEBUG: handleSend acionado. viewMode:",
      viewMode,
      "selectedConversationId:",
      selectedConversationId,
      "newMessage:",
      newMessage,
    );

    if (!newMessage.trim() || !user?.id) {
      console.log(
        "DEBUG: Falha na validação. Mensagem ou ID de utilizador em falta.",
      );
      return;
    }

    // Se for modo resposta em conversa ativa
    if (viewMode !== "nova" && selectedConversationId) {
      console.log("DEBUG: Respondendo à conversa:", selectedConversationId);
      const recipient = colaboradores.find(
        (c) => c.id === selectedConversationId,
      );

      let recipientId = selectedConversationId!;
      let recipientName = "Utilizador";

      if (recipient) {
        recipientId = recipient.id;
        recipientName = recipient.nome;
      } else {
        // Fallback to searching in active messages
        const lastMsg = activeMessages[activeMessages.length - 1];
        if (lastMsg) {
          if (lastMsg.senderId === selectedConversationId) {
            recipientId = lastMsg.senderId;
            recipientName = lastMsg.senderName;
          } else if (lastMsg.recipientId === selectedConversationId) {
            recipientId = lastMsg.recipientId;
            recipientName = lastMsg.recipientName;
          }
        }
      }

      if (!recipientId) {
        console.error(
          "DEBUG: Destinatário não encontrado e não foi possível resolver a partir das mensagens.",
        );
        alert("Erro: Destinatário não encontrado.");
        return;
      }

      const messageData: Message = {
        text: newMessage.trim(),
        subject: "Re: " + (activeMessages[0]?.subject || "Sem Assunto"),
        senderId: user.id,
        senderName: user.nome || "Utilizador",
        recipientId: recipientId,
        recipientName: recipientName,
        timestamp: serverTimestamp(),
        tenantId: "Songo",
        read: false,
      };

      try {
        await firestoreService.messages.add(messageData);
        console.log("DEBUG: Mensagem enviada com sucesso.");
        setNewMessage("");
        setIsReplying(false);
        alert("Mensagem enviada com sucesso!");
      } catch (error) {
        console.error("DEBUG: Falha ao enviar mensagem:", error);
        alert(
          "Erro ao enviar mensagem: " +
            (error instanceof Error ? error.message : String(error)),
        );
      }
      return;
    }

    // Se for modo NOVA mensagem com múltiplos destinatários
    if (targetRecipients.length === 0) return;

    try {
      console.log(
        "DEBUG: Enviando múltiplas mensagens para:",
        targetRecipients,
      );
      const promises = targetRecipients.map((recipient) => {
        const messageData: Message = {
          text: newMessage.trim(),
          subject: subject.trim() || "Sem Assunto",
          senderId: user.id,
          senderName: user.nome || "Utilizador",
          recipientId: recipient.id,
          recipientName: recipient.nome,
          timestamp: serverTimestamp(),
          tenantId: "Songo",
          read: false,
        };
        console.log("DEBUG: messageData:", messageData);
        return firestoreService.messages.add(messageData);
      });

      await Promise.all(promises);
      console.log("DEBUG: Todas as mensagens enviadas com sucesso.");

      setNewMessage("");
      setSubject("");
      setTargetRecipients([]);
      setIsSelectingTargets(false);
      setViewMode("saida");
      if (targetRecipients.length === 1) {
        setSelectedConversationId(targetRecipients[0].id);
      }
      alert("Mensagens enviadas com sucesso!");
    } catch (error) {
      console.error("DEBUG: Erro ao enviar mensagens em massa:", error);
      alert(
        "Erro ao enviar mensagens: " +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  };

  const formatFullTimestamp = (timestamp: any) => {
    if (!timestamp) return "...";
    try {
      const date = timestamp.toDate
        ? timestamp.toDate()
        : timestamp.seconds
          ? new Date(timestamp.seconds * 1000)
          : null;
      if (!date || isNaN(date.getTime())) return "Enviando...";

      const dayOfWeek = date.toLocaleDateString("pt-MZ", { weekday: "long" });
      const fullDate = date.toLocaleDateString("pt-MZ", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const time = date.toLocaleTimeString("pt-MZ", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      return `${dayOfWeek}, ${fullDate} às ${time}`;
    } catch (e) {
      return "...";
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "...";
    try {
      const date = timestamp.toDate
        ? timestamp.toDate()
        : timestamp.seconds
          ? new Date(timestamp.seconds * 1000)
          : null;
      if (!date || isNaN(date.getTime())) return "...";
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch (e) {
      return "...";
    }
  };

  const handleContactAdmin = () => {
    setViewMode("nova");
    setIsSupportMode(true);
    setIsSelectingTargets(true);
    setTargetRecipients(admins);
    setSubject("INQUIETAÇÃO / SUPORTE AO SISTEMA");
    setNewMessage("");
    setSearch("");
  };

  return (
    <div className="h-full flex bg-white overflow-hidden min-h-0 w-full relative">
      {/* Sidebar de Navegação */}
      <div
        className={`bg-gray-50 border-r flex flex-col shrink-0 h-full relative transition-all duration-300 ${
          isSidebarCollapsed ? "w-16 p-2" : "w-64"
        }`}
      >
        {/* Botão de minimização/maximização centrado no limite do submenu lateral */}
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          title={isSidebarCollapsed ? "Maximizar Menu Lateral" : "Minimizar Menu Lateral"}
          className="hidden md:flex absolute top-1/2 -translate-y-1/2 -right-3.5 z-40 w-7 h-7 bg-white text-slate-800 hover:bg-blue-600 hover:text-white rounded-full border-2 border-slate-300 hover:border-blue-600 shadow-xl items-center justify-center transition-all duration-300 transform hover:scale-110 focus:outline-none cursor-pointer"
        >
          {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className={isSidebarCollapsed ? "p-1" : "p-4"}>
          <button
            onClick={() => {
              setViewMode("nova");
              setIsSupportMode(false);
              setIsSelectingTargets(false);
              setTargetRecipients([]);
              setSearch("");
            }}
            title="Nova Mensagem"
            className={`w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95 ${
              isSidebarCollapsed ? "px-0" : ""
            }`}
          >
            <Plus size={18} className="shrink-0" />
            {!isSidebarCollapsed && <span>Nova Mensagem</span>}
          </button>
        </div>

        <nav className={`flex-1 space-y-1 ${isSidebarCollapsed ? "px-1" : "px-3"}`}>
          <button
            onClick={() => setViewMode("entrada")}
            title="Entrada"
            className={`w-full p-3 flex items-center gap-3 rounded-xl font-bold text-sm transition-colors ${
              isSidebarCollapsed ? "justify-center px-0" : ""
            } ${viewMode === "entrada" ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-100"}`}
          >
            <Inbox size={20} className="shrink-0" />
            {!isSidebarCollapsed && <span>Entrada</span>}
            {inboxGroups.reduce((acc, curr) => acc + curr.unreadCount, 0) > 0 && (
              <span
                className={`${
                  isSidebarCollapsed ? "absolute top-2 right-2 text-[8px] px-1" : "ml-auto text-[10px] px-2 py-0.5"
                } bg-blue-600 text-white rounded-full font-black`}
              >
                {inboxGroups.reduce((acc, curr) => acc + curr.unreadCount, 0)}
              </span>
            )}
          </button>
          <button
            onClick={() => setViewMode("saida")}
            title="Saída"
            className={`w-full p-3 flex items-center gap-3 rounded-xl font-bold text-sm transition-colors ${
              isSidebarCollapsed ? "justify-center px-0" : ""
            } ${viewMode === "saida" ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-100"}`}
          >
            <SendHorizontal size={20} className="shrink-0" />
            {!isSidebarCollapsed && <span>Saída</span>}
          </button>
        </nav>

        <div className="mt-auto p-4 border-t bg-blue-50/50">
          <p className="text-[10px] font-black text-blue-900/30 tracking-[0.2em] mb-4 text-center">
            Canal de Suporte
          </p>
          <button
            onClick={handleContactAdmin}
            className="w-full p-4 bg-white border-2 border-blue-100 rounded-2xl flex flex-col items-center gap-2 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all group shadow-sm"
          >
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 group-hover:bg-white/20 group-hover:text-white transition-colors">
              <ShieldCheck size={20} />
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black tracking-widest leading-none mb-1">
                Contactar
              </p>
              <p className="text-[10px] font-black tracking-widest leading-none">
                Administração
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Lista de Conversas (Não aparece em modo Nova) */}
      {viewMode !== "nova" && (
        <div className="w-80 border-r flex flex-col shrink-0">
          <div className="p-4 border-b">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Pesquisar conversa..."
                className="w-full pl-9 pr-4 py-2 bg-gray-100 border-none rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar h-full">
            {viewMode === "entrada"
              ? inboxGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedConversationId(group.id)}
                    className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 border-b border-gray-50 text-left ${selectedConversationId === group.id ? "bg-blue-50" : ""}`}
                  >
                    <div className="relative">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${group.unreadCount > 0 ? "bg-blue-600 shadow-md ring-2 ring-blue-100" : "bg-gray-400"}`}
                      >
                        {group.contactName.substring(0, 2).toUpperCase()}
                      </div>
                      {group.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center border-2 border-white font-black">
                          {group.unreadCount}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p
                          className={`text-sm truncate ${group.unreadCount > 0 ? "font-black text-gray-900" : "font-bold text-gray-600"}`}
                        >
                          {group.contactName}
                        </p>
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {formatTime(group.lastMsg.timestamp)}
                        </span>
                      </div>
                      <p
                        className={`text-xs truncate ${group.unreadCount > 0 ? "text-blue-600 font-bold" : "text-gray-400"}`}
                      >
                        {group.lastMsg.text}
                      </p>
                    </div>
                  </button>
                ))
              : sentGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedConversationId(group.id)}
                    className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 border-b border-gray-50 text-left ${selectedConversationId === group.id ? "bg-blue-50" : ""}`}
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold border border-gray-200">
                      {group.contactName.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-bold text-gray-800 truncate">
                          Para: {group.contactName}
                        </p>
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {formatTime(group.lastMsg.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {group.lastMsg.text}
                      </p>
                    </div>
                  </button>
                ))}
          </div>
        </div>
      )}

      {/* Área de Visualização / Composição */}
      <div className="flex-1 flex flex-col bg-gray-50/30 min-w-0 overflow-hidden">
        {viewMode === "nova" ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 bg-white border-b flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white">
                  <Plus size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-800 tracking-tight">
                    Nova Mensagem de Sistema
                  </h2>
                  <p className="text-[10px] font-bold text-gray-400 tracking-widest">
                    Remetente: {user?.nome}
                  </p>
                </div>
              </div>
              {isSelectingTargets && (
                <button
                  onClick={() => setIsSelectingTargets(false)}
                  className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 p-2 transition-colors"
                >
                  <ArrowLeft size={16} />
                  Voltar ao Texto
                </button>
              )}
            </div>

            <div className="flex-1 p-8 overflow-hidden flex flex-col">
              {!isSelectingTargets ? (
                /* PASSO 1: Escrever Mensagem */
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col h-full max-h-full transform transition-all duration-300">
                  <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-400 tracking-widest">
                      Nova Mensagem: Defina o assunto e o texto
                    </span>
                  </div>
                  <div className="px-8 pt-6">
                    <input
                      type="text"
                      className="w-full pb-4 border-b border-gray-100 outline-none text-xl font-black text-gray-800 placeholder:text-gray-200"
                      placeholder="ASSUNTO DA MENSAGEM..."
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                  <textarea
                    className="flex-1 p-8 outline-none bg-transparent resize-none text-gray-700 font-medium text-lg leading-relaxed placeholder:text-gray-300"
                    placeholder="Escreva aqui o conteúdo da sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <div className="p-6 bg-gray-50 flex justify-end">
                    <button
                      onClick={() => setIsSelectingTargets(true)}
                      className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black flex items-center gap-3 shadow-lg shadow-blue-100 transition-all active:scale-95 group"
                    >
                      SELECIONAR DESTINATÁRIOS
                      <Users
                        size={18}
                        className="group-hover:scale-110 transition-transform"
                      />
                    </button>
                  </div>
                </div>
              ) : (
                /* PASSO 2: Selecionar Destinatários */
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col h-full overflow-hidden transform transition-all duration-300">
                  <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <Users size={20} />
                      </div>
                      <div>
                        <h2 className="text-sm font-black text-gray-800 tracking-tight">
                          Seleção de Destinatários
                        </h2>
                        <div className="flex items-center gap-3 mt-0.5">
                          <p className="text-[10px] font-bold text-gray-400 tracking-widest flex items-center gap-1.5">
                            <span
                              className={`${targetRecipients.length > 0 ? "text-blue-600" : ""}`}
                            >
                              {targetRecipients.length} de{" "}
                              {filteredRecipients.length} selecionados
                            </span>
                          </p>
                          <button
                            onClick={toggleSelectAll}
                            className="text-[9px] font-black text-blue-600 hover:text-blue-700 tracking-[0.2em] bg-blue-50 px-2 py-0.5 rounded cursor-pointer transition-colors"
                          >
                            {targetRecipients.length ===
                            filteredRecipients.length
                              ? "Desmarcar Todos"
                              : "Selecionar Todos"}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleSendToAll}
                        disabled={!newMessage.trim() || !subject.trim()}
                        className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black tracking-widest hover:bg-slate-800 disabled:opacity-50 transition-all shadow-md flex items-center gap-2"
                      >
                        <Users size={14} />
                        Enviar para TODOS ({availableRecipients.length})
                      </button>
                      <div className="relative w-64">
                        <Search
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={14}
                        />
                        <input
                          type="text"
                          placeholder="Pesquisar por NUIT ou Nome..."
                          className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 scrollbar min-h-0">
                    {filteredRecipients.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filteredRecipients.map((r) => {
                          const isSelected = targetRecipients.find(
                            (p) => p.id === r.id,
                          );
                          return (
                            <button
                              key={r.id}
                              onClick={() => toggleRecipientSelection(r)}
                              className={`p-4 flex items-center gap-4 rounded-2xl border transition-all text-left ${isSelected ? "bg-blue-600 border-blue-600 text-white shadow-md" : "bg-white border-gray-100 text-gray-800 hover:border-blue-200"}`}
                            >
                              <div
                                className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${isSelected ? "bg-white border-white text-blue-600" : "bg-transparent border-gray-200"}`}
                              >
                                {isSelected && (
                                  <Check size={14} strokeWidth={4} />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-sm font-bold truncate ${isSelected ? "text-white" : "text-gray-800"}`}
                                >
                                  {r.nome}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span
                                    className={`text-[10px] font-black tracking-widest opacity-70`}
                                  >
                                    {r.nuit || "S/ NUIT"}
                                  </span>
                                  <span className="w-1 h-1 rounded-full bg-current opacity-30" />
                                  <span className="text-[10px] font-bold truncate opacity-70">
                                    {r.cargoChefia || r.cargo || "Funcionário"}
                                  </span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                          <Users size={32} />
                        </div>
                        <p className="text-gray-500 font-bold">
                          Nenhum colaborador encontrado
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Verifique se existem colaboradores registados no
                          sistema.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-6 bg-white border-t flex justify-between items-center shrink-0">
                    <button
                      onClick={() => setIsSelectingTargets(false)}
                      className="text-sm font-black text-gray-400 hover:text-gray-600 tracking-widest px-4"
                    >
                      Editar Mensagem
                    </button>
                    <button
                      onClick={() => handleSend()}
                      disabled={
                        targetRecipients.length === 0 ||
                        !newMessage.trim() ||
                        !subject.trim()
                      }
                      className="px-12 py-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl font-black flex items-center gap-3 shadow-lg shadow-green-100 transition-all active:scale-95"
                    >
                      <Send size={18} />
                      Enviar para {targetRecipients.length} Colaboradores
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : selectedConversationId ? (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="p-4 bg-white border-b flex items-center justify-between shadow-sm shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
                  {(
                    inboxGroups.find((g) => g.id === selectedConversationId)
                      ?.contactName ||
                    sentGroups.find((g) => g.id === selectedConversationId)
                      ?.contactName ||
                    "U"
                  )
                    .substring(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800">
                    {inboxGroups.find((g) => g.id === selectedConversationId)
                      ?.contactName ||
                      sentGroups.find((g) => g.id === selectedConversationId)
                        ?.contactName ||
                      "Utilizador"}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-[10px] font-bold text-gray-400 tracking-widest">
                      Chat Ativo
                    </span>
                    <span className="mx-1.5 text-gray-200">|</span>
                    <span className="text-[9px] font-black text-blue-500 tracking-[0.15em] bg-blue-50 px-2 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                      <Check size={10} strokeWidth={4} />
                      Mensagens Privadas
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Conversation Area with Scroll */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50 scrollbar min-h-0 flex flex-col w-full overflow-x-hidden">
              {activeMessages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                  <MessageSquare size={48} className="opacity-10 mb-4" />
                  <p className="text-sm font-bold tracking-widest text-[10px]">
                    Nenhuma mensagem nesta conversa.
                  </p>
                </div>
              ) : (
                activeMessages.map((msg, idx) => {
                  const isMe = msg.senderId === user.id;
                  const showDate =
                    idx === 0 ||
                    !isSameDay(
                      msg.timestamp,
                      activeMessages[idx - 1].timestamp,
                    );

                  return (
                    <React.Fragment key={msg.id || idx}>
                      {showDate && (
                        <div className="flex justify-center my-6 sticky top-0 z-10 pointer-events-none">
                          <span className="px-4 py-1 bg-white/80 backdrop-blur-sm border border-gray-100 rounded-full text-[10px] font-black text-gray-400 tracking-widest shadow-sm pointer-events-auto">
                            {formatDateHeader(msg.timestamp)}
                          </span>
                        </div>
                      )}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`flex mb-2 ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] flex flex-col ${isMe ? "items-end" : "items-start"}`}
                        >
                          {!isMe && (
                            <span className="text-[9px] font-black text-gray-400 mb-1 ml-4 tracking-[0.1em]">
                              {msg.senderName}
                            </span>
                          )}
                          <div
                            className={`relative group px-5 py-3 rounded-2xl shadow-md border ${
                              isMe
                                ? "bg-blue-600 text-white border-blue-500 rounded-tr-none"
                                : "bg-white text-gray-800 border-gray-100 rounded-tl-none"
                            }`}
                          >
                            {msg.subject && msg.subject !== "Sem Assunto" && (
                              <div
                                className={`text-[10px] font-black tracking-widest mb-1 pb-1 border-b ${isMe ? "border-blue-400/30" : "border-gray-100"}`}
                              >
                                {msg.subject}
                              </div>
                            )}
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {msg.text}
                            </p>

                            <div
                              className={`flex items-center gap-2 mt-2 pt-1 border-t ${isMe ? "border-blue-400/20 justify-end text-blue-100" : "border-gray-50 text-gray-400"}`}
                            >
                              <span className="text-[8px] font-bold">
                                {msg.timestamp
                                  ? formatTime(msg.timestamp)
                                  : "Enviando..."}
                              </span>
                              {isMe && (
                                <div
                                  className={`${msg.read ? "text-white" : "opacity-50"}`}
                                >
                                  {msg.read ? (
                                    <CheckCheck size={10} />
                                  ) : (
                                    <Check size={10} />
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Hover info for "Prova de Envio" */}
                            <div className="absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -translate-y-full mb-1 bg-gray-900 text-white text-[8px] px-2 py-1 rounded font-black whitespace-nowrap z-20">
                              PROVA DE ENVIO:{" "}
                              {msg.id?.substring(0, 12).toUpperCase()} |{" "}
                              {formatFullTimestamp(msg.timestamp)}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </React.Fragment>
                  );
                })
              )}
              <div ref={messagesEndRef} className="h-4 shrink-0" />
            </div>

            {/* Reply Area at BOTTOM */}
            <div className="p-4 bg-white border-t px-6 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
              {!isReplying ? (
                <div className="max-w-4xl mx-auto flex justify-center py-1">
                  <button
                    onClick={() => setIsReplying(true)}
                    className="px-10 py-3 bg-blue-600 text-white rounded-full font-black text-xs tracking-widest flex items-center gap-2 transition-all hover:bg-blue-700 shadow-lg shadow-blue-100 active:scale-95"
                  >
                    <MessageSquare size={16} />
                    Responder Agora
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleSend}
                  className="max-w-4xl mx-auto space-y-3"
                >
                  <div className="flex gap-3 relative">
                    <textarea
                      className="flex-1 px-6 py-4 bg-gray-50 border border-gray-200 rounded-3xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium resize-none h-24 shadow-inner"
                      placeholder="Escreva uma resposta oficial..."
                      value={newMessage}
                      autoFocus
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsReplying(false);
                        setNewMessage("");
                      }}
                      className="px-6 py-2 text-gray-400 hover:text-gray-600 font-black text-[10px] tracking-widest"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="px-10 py-3 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-md shadow-blue-200 font-black text-xs tracking-widest gap-2"
                    >
                      <Send size={14} />
                      Enviar Mensagem
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-400">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <MailOpen size={48} className="text-blue-200" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Selecione uma Pasta
            </h3>
            <p className="text-sm max-w-xs leading-relaxed">
              Escolha entre a sua **Caixa de Entrada** ou **Saída** para gerir
              as suas comunicações oficiais.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

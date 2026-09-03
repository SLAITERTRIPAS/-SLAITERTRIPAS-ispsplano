import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Network,
  ChevronRight,
  Database,
  ShieldCheck,
  Zap,
  FileText,
  Settings,
  RefreshCw,
  CheckSquare,
  Users,
  Plus,
  Trash2,
  ArrowLeft,
  Maximize2,
  Info,
  Clock,
  User,
  Download,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Printer,
} from "lucide-react";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { firestoreService } from "../../lib/firestoreService";
import { isSuperBossUser } from "../../lib/auth";
import { ProcessingCircle } from "../../components/ui/ProcessingCircle";
import { openPrintDocumentWindow } from "../../lib/printUtils";
import { formatRelativeTime } from "../bloco5_sistema/systemUtils";
import { safeJSONStringify } from "../../lib/utils";
import blueprint from "../../../firebase-blueprint.json";
import MonografiaView from "../bloco3_unidades_organicas/MonografiaView";
import SystemRegistrationForm from "../bloco5_sistema/SystemRegistrationForm";
import { getUnifiedProducts, saveUnifiedProduct, deleteUnifiedProduct } from "../../lib/unifiedManager";
import { RUBRICAS, getNecessidadesOptions, formatNecessidadeWithCode, PRODUTOS_POR_NECESSIDADE } from "../../constants/formOptions";

// --- CPANEL VIEW ---
export function CPanelView({
  version,
  currentDate,
}: {
  version: string;
  currentDate: string;
}) {
  const [cPanelActive, setCPanelActive] = useState("Entidades (Schema)");

  const renderCPanelDetails = () => {
    switch (cPanelActive) {
      case "Entidades (Schema)":
        return (
          <div className="space-y-6">
            <p className="text-gray-500 font-medium italic">
              Exploração de Entidades Definidas no Blueprint do Sistema (Lógica
              de Negócio)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries((blueprint as any).entities).map(
                ([name, entity]: [string, any]) => (
                  <div
                    key={name}
                    className="bg-gray-50 border border-gray-100 p-6 rounded-2xl"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-black text-blue-900 border-b-2 border-blue-600 pb-1">
                        {name}
                      </h4>
                      <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-black tracking-widest">
                        {entity.title}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-4 italic">
                      "{entity.description}"
                    </p>
                    <div className="space-y-2">
                      {Object.entries(entity.properties).map(
                        ([propName, prop]: [string, any]) => (
                          <div
                            key={propName}
                            className="flex items-center justify-between group"
                          >
                            <span className="text-gray-600 group-hover:text-blue-600 transition-colors">
                              {propName}
                            </span>
                            <div className="flex items-center gap-2">
                              {prop.enum && (
                                <span className="text-[8px] bg-amber-100 text-amber-700 font-bold px-1 rounded tracking-tighter">
                                  Enum
                                </span>
                              )}
                              <span className="text-gray-400 opacity-60">
                                ::
                              </span>
                              <span className="text-blue-500 font-bold">
                                {prop.type}
                              </span>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        );
      case "Base de Dados (JSON)":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-900 text-blue-300 p-4 rounded-xl mb-4">
              <div className="flex items-center gap-2">
                <ProcessingCircle
                  size={10}
                  strokeWidth={12}
                  className="opacity-80"
                />
                <span className="text-[10px] font-black tracking-widest">
                  Live Firestore Connector
                </span>
              </div>
              <span className="text-[9px] font-mono opacity-50">
                PROD_ENV_SIGEP_X01
              </span>
            </div>
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-green-400 overflow-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              <pre className="text-[10px] leading-relaxed">
                {safeJSONStringify(
                  {
                    config: {
                      sync_interval: "realtime",
                      persistence: "enabled",
                      version: version,
                      last_checkpoint: currentDate,
                    },
                    collections: Object.keys(
                      (blueprint as any).firestore || {},
                    ).map((c) => ({
                      path: c,
                      schema: (blueprint as any).firestore[c].schema,
                      status: "active",
                      encrypted: true,
                    })),
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
          </div>
        );
      default:
        return (
          <div className="p-4 text-gray-500 italic">
            Módulo em desenvolvimento ou indisponível.
          </div>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-blue-300 text-xs font-bold tracking-widest opacity-80">
            Gestão e Atualização Técnica do Sistema
          </p>
        </div>
        <Network
          size={48}
          className="text-white/10 absolute right-8 top-1/2 -translate-y-1/2 scale-150"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-4 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-[10px] font-black text-gray-400 tracking-widest mb-4">
              Módulos do Sistema
            </h3>
            <div className="space-y-2">
              {[
                "Entidades (Schema)",
                "Base de Dados (JSON)",
                "Constantes do Sistema",
                "Código Fonte (V1)",
              ].map((item) => (
                <button
                  key={item}
                  onClick={() => setCPanelActive(item)}
                  className={`w-full text-left p-4 rounded-2xl text-xs font-bold tracking-widest transition-all flex items-center justify-between ${cPanelActive === item ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}
                >
                  {item}
                  <ChevronRight
                    size={14}
                    className={
                      cPanelActive === item ? "text-white" : "text-gray-300"
                    }
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={cPanelActive}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm min-h-[500px] overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-gray-50 bg-gray-50/30">
                <h3 className="text-xl font-black text-slate-900 tracking-tighter">
                  {cPanelActive}
                </h3>
              </div>
              <div className="flex-1 p-8 overflow-auto font-mono text-[11px]">
                {renderCPanelDetails()}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// --- RECENT ACTIVITY LOG ---
export function RecentActivityLog({
  colaboradores = [],
}: {
  colaboradores: any[];
}) {
  const sortedActivities = [...colaboradores]
    .filter((c) => c.updatedAt)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 15);

  const lastUpdated =
    sortedActivities.length > 0
      ? new Date(
          Math.max(
            ...sortedActivities.map((a) => new Date(a.updatedAt).getTime()),
          ),
        ).toLocaleString("pt-PT", {
          hour: "2-digit",
          minute: "2-digit",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "---";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-black text-blue-900 tracking-tight">
          Registo de Actividade Recente
        </h2>
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 tracking-widest">
          <Clock size={14} /> Atualizado em: {lastUpdated}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-50">
          {sortedActivities.length === 0 ? (
            <div className="py-20 text-center">
              <Zap size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400 font-bold tracking-widest italic text-xs">
                Nenhuma actividade recente detetada no sistema.
              </p>
            </div>
          ) : (
            sortedActivities.map((activity, idx) => (
              <div
                key={activity.id || idx}
                className="p-6 hover:bg-blue-50/30 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center shrink-0 group-hover:border-blue-200 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-black">
                      {activity.updatedBy?.substring(0, 2).toUpperCase() || (
                        <User size={16} />
                      )}
                    </div>
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-black text-gray-900">
                        {activity.updatedBy || "Utilizador do Sistema"}
                      </p>
                      <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full tracking-tighter tabular-nums">
                        {formatRelativeTime(activity.updatedAt)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Atualizou os dados de{" "}
                        <span className="font-bold text-blue-900">
                          {activity.nome}
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {activity.unidade && (
                          <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-bold tracking-widest">
                            {activity.unidade}
                          </span>
                        )}
                        {activity.cargoChefia &&
                          activity.cargoChefia !== "Nenhum" && (
                            <span className="text-[9px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded font-bold tracking-widest border border-amber-100">
                              {activity.cargoChefia}
                            </span>
                          )}
                        {activity.confiavel && (
                          <span className="text-[9px] bg-green-50 text-green-600 px-2 py-0.5 rounded font-bold tracking-widest border border-green-100">
                            VALIDADO (CHEFE RH)
                          </span>
                        )}
                        {activity.validadoPorRH && (
                          <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold tracking-widest border border-blue-100">
                            Confirmado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {sortedActivities.length > 0 && (
          <div className="p-6 bg-gray-50/50 border-t border-gray-100 text-center">
            <p className="text-[10px] font-black text-gray-400 tracking-widest italic">
              A mostrar as últimas 15 atualizações globais.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
export function DatabaseView({
  stats,
  tableData,
  onExtrairCompleta,
  isExtracting,
  onSeedCollaborators,
}: {
  stats: { totalRecords: number; dbSizeFormatted: string; currentDate: string };
  tableData: any[];
  onExtrairCompleta?: (format: "excel" | "json") => void;
  isExtracting?: boolean;
  onSeedCollaborators?: () => void;
}) {
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);

  const handleRunAuditAndSync = async () => {
    setIsAuditing(true);
    setAuditResult(null);
    try {
      const res = await firestoreService.runDatabaseAuditAndSync();
      setAuditResult(res);
    } catch (err: any) {
      alert(
        `Erro ao executar varredura: ${err?.message || "Tente novamente."}`,
      );
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-gray-500 text-xs leading-[1.5]">
            Visualização e diagnóstico em tempo real das tabelas e registos do
            sistema.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            disabled={isAuditing}
            onClick={handleRunAuditAndSync}
            className="bg-blue-600 text-white hover:bg-blue-700 border border-blue-700 px-3 py-1.5 rounded-full text-[10px] font-black flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            title="Executar varredura do sistema para identificar e resolver conflitos sem apagar dados de utilizadores"
          >
            {isAuditing ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : (
              <Activity size={12} />
            )}
            {isAuditing
              ? "VARREDURA EM CURSO..."
              : "VARREDURA DE ANOMALIAS E CONFLITOS"}
          </button>
          {onSeedCollaborators && (
            <button
              onClick={onSeedCollaborators}
              className="bg-purple-50 text-purple-600 border border-purple-200 px-3 py-1.5 rounded-full text-[10px] font-black flex items-center gap-1.5 hover:bg-purple-100 transition-colors shadow-sm"
              title="Garantir que todos os colaboradores do Efetivo Geral estão na base de dados"
            >
              <Users size={12} />
              SINC. EFETIVO GERAL
            </button>
          )}
          <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border border-green-200">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            CONECTADO
          </div>
        </div>
      </div>

      {auditResult && (
        <div className="mb-6 bg-white border border-blue-200 rounded-2xl p-6 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2 text-blue-900 font-black text-sm">
              <CheckCircle2 className="text-emerald-500" size={18} />
              Relatório de Varredura e Resolução de Conflitos
            </div>
            <button
              onClick={() => setAuditResult(null)}
              className="text-xs font-bold text-gray-400 hover:text-gray-600"
            >
              Fechar
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
              <p className="text-[10px] font-bold text-gray-400">
                Coleções Analisadas
              </p>
              <p className="text-lg font-black text-gray-800">
                {auditResult.collectionsScanned}
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-[10px] font-bold text-blue-500">
                Registos Auditados
              </p>
              <p className="text-lg font-black text-blue-800">
                {auditResult.totalDocsScanned}
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="text-[10px] font-bold text-amber-600">
                Anomalias Detetadas
              </p>
              <p className="text-lg font-black text-amber-800">
                {auditResult.anomaliesDetected}
              </p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
              <p className="text-[10px] font-bold text-emerald-600">
                Conflitos Resolvidos
              </p>
              <p className="text-lg font-black text-emerald-800">
                {auditResult.conflictsResolved}
              </p>
            </div>
          </div>

          <div className="bg-slate-900 text-slate-200 rounded-xl p-4 text-xs font-mono max-h-48 overflow-y-auto space-y-1">
            <p className="text-emerald-400 font-bold mb-1">
              --- REGISTO DE EXECUÇÃO DA VARREDURA ---
            </p>
            {auditResult.logs?.map((l: string, idx: number) => (
              <p key={idx} className="text-slate-300">
                » {l}
              </p>
            ))}
          </div>
          <p className="text-[11px] text-emerald-700 font-bold mt-3 flex items-center gap-1.5">
            <ShieldCheck size={14} />
            Nenhum dado inserido pelos utilizadores foi removido. Todos os
            campos foram mesclados e preservados integralmente.
          </p>
        </div>
      )}

      {onExtrairCompleta && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
          <div>
            <h4 className="text-sm font-black text-blue-900 leading-none mb-1 flex items-center gap-2">
              <Database size={16} className="text-blue-600 animate-pulse" />
              Extração Completa da Base de Dados
            </h4>
            <p className="text-xs text-blue-700/80 font-medium">
              Descarregue todos os registos de todas as tabelas em formato
              unificado.
            </p>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              disabled={isExtracting}
              onClick={() => onExtrairCompleta("excel")}
              className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black tracking-widest transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/15 cursor-pointer"
            >
              {isExtracting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />A EXTRAIR...
                </>
              ) : (
                <>
                  <Download size={14} />
                  EXTRAIR EXCEL (XLSX)
                </>
              )}
            </button>
            <button
              disabled={isExtracting}
              onClick={() => onExtrairCompleta("json")}
              className="flex-1 sm:flex-none px-4 py-2 bg-blue-950 hover:bg-blue-900 disabled:opacity-50 text-white rounded-xl text-xs font-black tracking-widest transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-950/15 cursor-pointer"
            >
              {isExtracting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />A EXTRAIR...
                </>
              ) : (
                <>
                  <Download size={14} />
                  EXTRAIR JSON
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-4">
        {[
          {
            title: "Total De Tabelas",
            value: "5",
            color: "text-blue-600",
            bg: "bg-blue-50/50",
            border: "border-blue-100",
          },
          {
            title: "Total De Registos",
            value: stats.totalRecords.toString(),
            color: "text-purple-600",
            bg: "bg-purple-50/50",
            border: "border-purple-100",
          },
          {
            title: "Tamanho Do Banco",
            value: stats.dbSizeFormatted,
            color: "text-pink-600",
            bg: "bg-pink-50/50",
            border: "border-pink-100",
          },
        ].map((card, idx) => (
          <div
            key={idx}
            className={`${card.bg} border ${card.border} rounded-lg p-4 shadow-sm`}
          >
            <h3
              className={`text-[10px] font-bold tracking-wider ${card.color} mb-4 leading-[1.5]`}
            >
              {card.title}
            </h3>
            <p className={`text-4xl font-bold ${card.color} leading-[1.5]`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-bold tracking-wider border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Nome Da Tabela</th>
              <th className="px-6 py-4">Registos</th>
              <th className="px-6 py-4">Última Alteração</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tableData.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-700 flex items-center gap-2">
                  <Database size={14} className="text-gray-400" />
                  {row.name}
                </td>
                <td className="px-6 py-4 font-bold text-gray-900">
                  {row.records}
                </td>
                <td className="px-6 py-4 text-gray-500 text-xs">
                  {row.lastUpdate}
                </td>
                <td className="px-6 py-4">
                  <span className="bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded text-[10px] font-bold">
                    {row.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// --- USER MANAGEMENT VIEW ---
export function UserManagementView({
  currentUser,
  onRegistarClick,
}: {
  currentUser: any;
  onRegistarClick: () => void;
}) {
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [isResetting, setIsResetting] = useState<string | null>(null);
  const [resetConfirmUser, setResetConfirmUser] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const q = collection(db, "users");
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setAllUsers(snap.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
        setUsersLoading(false);
      },
      (err: any) => {
        console.warn("Aviso ao carregar utilizadores em tempo real:", err?.message || String(err));
        try {
          const local = localStorage.getItem("sigep_local_users") || localStorage.getItem("sigep_users");
          if (local) setAllUsers(JSON.parse(local));
        } catch (_) {}
        setUsersLoading(false);
      },
    );

    // Update current time every second to refresh duration
    const interval = setInterval(() => setNow(new Date()), 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const isEffectivelyOnline = (u: any) => {
    if (u.isOnline) return true;
    if (!u.lastSeenAt) return false;
    const lastSeen = new Date(u.lastSeenAt).getTime();
    const tenMinutesAgo = now.getTime() - 10 * 60 * 1000;
    return lastSeen > tenMinutesAgo;
  };

  const calculateDuration = (loginAt: string) => {
    if (!loginAt) return "---";
    const start = new Date(loginAt).getTime();
    const diff = Math.max(0, now.getTime() - start);

    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleResetPassword = (id: string, name: string) => {
    setResetConfirmUser({ id, name });
  };

  const executeResetPassword = async () => {
    if (!resetConfirmUser) return;
    const { id, name } = resetConfirmUser;
    const userName = name || "Utilizador";
    setResetConfirmUser(null);

    setIsResetting(id);
    try {
      const res = await (firestoreService as any).resetUserPasswordToDefault(
        id,
      );
      if (res && res.success) {
        alert(`Senha de ${userName} resetada com sucesso para '1234'.`);
      } else {
        alert("Erro ao resetar senha: " + (res?.error || "Erro desconhecido"));
      }
    } catch (err: any) {
      console.error("Erro ao resetar senha:", err);
      alert("Erro ao resetar senha: " + (err?.message || String(err)));
    } finally {
      setIsResetting(null);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!isSuperBossUser(currentUser)) {
      alert("Apenas o proprietário pode remover utilizadores.");
      return;
    }
    if (
      confirm(
        "Tem a certeza que deseja remover este utilizador permanentemente? Esta ação é irreversível e sem possibilidade de recuperação.",
      )
    ) {
      try {
        await firestoreService.users.delete(id);
        setAllUsers((prev) => prev.filter((u) => u.id !== id));
        alert("dados excluido com sucesso");
      } catch (err) {
        alert("Erro ao remover utilizador.");
      }
    }
  };

  const handleExportUserReport = () => {
    const contentHtml = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 16px; color: #0f172a;">Relatório de Acessos e Utilizadores do Sistema</h3>
        <p style="font-size: 11px; color: #64748b; margin-bottom: 20px;">Data de Emissão: ${new Date().toLocaleString("pt-PT")}</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1;">
              <th style="padding: 8px; text-align: left;">Nome</th>
              <th style="padding: 8px; text-align: left;">Email / NUIT</th>
              <th style="padding: 8px; text-align: left;">Cargo / Unidade</th>
              <th style="padding: 8px; text-align: left;">Status</th>
              <th style="padding: 8px; text-align: left;">Tempo de Sessão / Último Acesso</th>
            </tr>
          </thead>
          <tbody>
            ${filteredUsers
              .map(
                (u) => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px; font-weight: bold;">${u.name || "N/D"}</td>
                <td style="padding: 8px;">${u.email || "---"} <br/><span style="color: #64748b; font-size: 9px;">NUIT: ${u.nuit || "---"}</span></td>
                <td style="padding: 8px;">${u.cargo || "N/D"} <br/><span style="color: #64748b; font-size: 9px;">${u.direcao || u.departamento || "Institucional"}</span></td>
                <td style="padding: 8px;">${isEffectivelyOnline(u) ? "Conectado Agora" : "Desconectado"}</td>
                <td style="padding: 8px;">${isEffectivelyOnline(u) ? calculateDuration(u.lastLoginAt) : (u.lastSeenAt ? new Date(u.lastSeenAt).toLocaleString("pt-PT") : "Inativo")}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
        <div style="margin-top: 30px; font-size: 10px; color: #64748b; text-align: right;">
          <p>SIGEP - Instituto Superior Politécnico de Songo</p>
        </div>
      </div>
    `;

    openPrintDocumentWindow({
      title: "Relatório de Gestão de Utilizadores e Acessos",
      subtitle: `Total de Registos: ${filteredUsers.length}`,
      direcao: "Direcção de Serviços Técnicos e Informáticos",
      departamento: "Sistemas e Infraestruturas",
      contentHtml,
      orientation: "portrait",
    });
  };

  const filteredUsers = allUsers.filter(
    (u) =>
      (u.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.nuit || "").toString().includes(searchTerm),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <h2 className="text-2xl font-black text-blue-900 tracking-tight">
          Gestão de Utilizadores
        </h2>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:w-64">
            <input
              type="text"
              placeholder="Pesquisar por nome, email ou NUIT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
            <Users
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
          <button
            onClick={handleExportUserReport}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black tracking-widest hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 shrink-0 inline-flex items-center gap-2"
            title="Extrair Relatório de Acessos e Utilizadores"
          >
            <Printer size={14} /> Relatório
          </button>
          <button
            onClick={onRegistarClick}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-black tracking-widest hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 shrink-0"
          >
            + Novo Utilizador
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[10px] font-black text-gray-400 tracking-widest border-b border-gray-100">
            <tr>
              <th className="px-8 py-4">Utilizador</th>
              <th className="px-8 py-4">Cargo / Unidade</th>
              <th className="px-8 py-4">Tempo de Sessão</th>
              <th className="px-8 py-4">Status</th>
              <th className="px-8 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {usersLoading ? (
              <tr>
                <td colSpan={5} className="px-8 py-20">
                  <div className="flex flex-col items-center justify-center gap-6">
                    <ProcessingCircle size={60} strokeWidth={1.5} />
                    <p className="text-gray-400 font-black tracking-[0.3em] text-[10px] animate-pulse">
                      A carregar utilizadores...
                    </p>
                  </div>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-8 py-12 text-center text-gray-400 font-bold tracking-widest italic"
                >
                  Nenhum utilizador encontrado para esta pesquisa.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const online = isEffectivelyOnline(u);
                return (
                  <tr
                    key={u.id}
                    className={`hover:bg-gray-50/50 transition-colors ${online ? "bg-blue-50/20" : ""}`}
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`relative w-10 h-10 rounded-full flex items-center justify-center font-black shadow-sm ${online ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}
                        >
                          {u.name?.substring(0, 2) ||
                            u.email?.substring(0, 2).toUpperCase()}
                          {online && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full animate-pulse"></span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 leading-none mb-1">
                            {u.name}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-black text-gray-600 mb-1">
                        {u.cargo}
                      </p>
                      <p className="text-[9px] text-gray-400 font-medium">
                        {u.isOwner || isSuperBossUser(u)
                          ? "PROPRIETÁRIO / PROGRAMADOR"
                          : u.direcao || u.departamento || "Institucional"}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      {online ? (
                        <div className="flex flex-col">
                          <span className="text-sm font-mono font-black text-blue-600 tabular-nums">
                            {calculateDuration(u.lastLoginAt)}
                          </span>
                          <span className="text-[8px] text-blue-400 font-bold tracking-tighter ">
                            Em actividade contínua
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-400 font-medium italic">
                            Sessão inativa
                          </span>
                          {u.lastSeenAt && (
                            <span className="text-[8px] text-gray-300 font-bold ">
                              Última vez:{" "}
                              {new Date(u.lastSeenAt).toLocaleString("pt-PT")}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`w-fit px-3 py-1 rounded-full text-[9px] font-black ${online ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}
                        >
                          {online ? "Conectado Agora" : "Desconectado"}
                        </span>
                        {u.isOwner && (
                          <span className="w-fit px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[9px] font-black">
                            Proprietário / Programador
                          </span>
                        )}
                        {u.role === "Administrador" && !u.isOwner && (
                          <span className="w-fit px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[9px] font-black">
                            Admin
                          </span>
                        )}
                        {u.mustChangePassword && (
                          <span className="w-fit px-3 py-1 bg-red-50 text-red-600 rounded-full text-[8px] font-black border border-red-100">
                            Senha Padrão
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right space-x-2">
                      <button
                        disabled={isResetting === u.id}
                        onClick={() => handleResetPassword(u.id, u.name)}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors inline-flex items-center justify-center"
                        title="Gerar Senha Padrão (1234)"
                      >
                        {isResetting === u.id ? (
                          <ProcessingCircle size={14} />
                        ) : (
                          <RefreshCw size={16} />
                        )}
                      </button>

                      {isSuperBossUser(currentUser) &&
                        u.email !== currentUser?.email && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remover Utilizador"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {resetConfirmUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100"
            >
              <div className="flex items-center gap-3 text-amber-600 mb-4">
                <AlertTriangle size={28} />
                <h3 className="text-lg font-black text-gray-900">
                  Confirmar Reset de Senha
                </h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                Tem a certeza que quer resetar a senha do usuário <strong className="text-gray-950">{resetConfirmUser.name}</strong>?
              </p>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setResetConfirmUser(null)}
                  className="px-4 py-2 text-xs font-black tracking-widest text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Não
                </button>
                <button
                  type="button"
                  onClick={executeResetPassword}
                  className="px-6 py-2 text-xs font-black tracking-widest text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors shadow-lg shadow-amber-200"
                >
                  Sim
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- HISTORICO CHEFIAS VIEW ---
export function HistoricoChefiasView() {
  const [historico, setHistorico] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = collection(db, "historico_chefias");
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setHistorico(snap.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
        setLoading(false);
      },
      (err: any) => {
        console.warn("Aviso ao carregar histórico de chefias:", err?.message || String(err));
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-black text-blue-900 tracking-tight">
            Histórico de Chefias
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Registo de colaboradores que já exerceram cargos de chefia na
            instituição.
          </p>
        </div>
        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
          <Clock size={24} />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <ProcessingCircle size={40} strokeWidth={1.5} />
            <p className="text-[10px] font-black text-gray-400 tracking-widest animate-pulse">
              A CARREGAR HISTÓRICO...
            </p>
          </div>
        ) : historico.length === 0 ? (
          <div className="py-20 text-center">
            <Info size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-bold tracking-widest italic text-xs">
              Nenhum registo de histórico de chefia encontrado.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[10px] font-black text-gray-400 tracking-widest border-b border-gray-100">
                <tr>
                  <th className="px-8 py-4">Colaborador</th>
                  <th className="px-8 py-4">Cargo Exercido</th>
                  <th className="px-8 py-4">Unidade / Direção</th>
                  <th className="px-8 py-4">Período de Mandato</th>
                  <th className="px-8 py-4">Data de Saída</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[...historico]
                  .sort(
                    (a, b) =>
                      new Date(b.registadoEm).getTime() -
                      new Date(a.registadoEm).getTime(),
                  )
                  .map((h) => (
                    <tr
                      key={h.id}
                      className="hover:bg-blue-50/20 transition-colors"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black shadow-sm">
                            {h.nome?.substring(0, 2).toUpperCase()}
                          </div>
                          <p className="text-sm font-black text-gray-900">
                            {h.nome}
                          </p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs font-bold text-gray-600">
                          {h.cargo}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs text-gray-500">
                          {h.unidade || "N/A"}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-xs font-mono font-bold text-blue-600">
                            {h.inicio
                              ? new Date(h.inicio).toLocaleDateString("pt-PT")
                              : "N/A"}{" "}
                            -{" "}
                            {h.fim
                              ? new Date(h.fim).toLocaleDateString("pt-PT")
                              : "Atual"}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[10px] font-bold text-gray-400 italic">
                          Registado em:{" "}
                          {new Date(h.registadoEm).toLocaleString("pt-PT")}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


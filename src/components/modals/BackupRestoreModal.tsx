import React, { useState, useEffect } from "react";
import {
  Download,
  Upload,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Database,
  RefreshCw,
  X,
  Building2,
  GraduationCap,
  Briefcase,
  Server,
  Lock,
  Clock,
  Play,
  HardDrive,
  FileCheck,
  Sparkles,
  Folder,
  FolderOpen,
  Calendar,
  Trash2,
} from "lucide-react";
import {
  exportFullBackup,
  restoreFullBackup,
  exportDataBackup,
  exportSystemBackup,
  restoreDataBackup,
  restoreSystemBackup,
  runAutomaticBackup,
  getStoredBackupsList,
  getStoredBackupData,
  downloadStoredBackupFile,
  deleteStoredBackup,
  collectAllBackupData,
  SYSTEM_ORGAOS,
  SystemBackupRecord,
} from "../../lib/backupService";

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ORGAN_ICONS: Record<string, React.ReactNode> = {
  direcao_gestao: <Building2 size={20} className="text-blue-600" />,
  unidades_organicas: <GraduationCap size={20} className="text-purple-600" />,
  servicos_centrais: <Briefcase size={20} className="text-emerald-600" />,
  sistema: <Server size={20} className="text-amber-600" />,
};

export default function BackupRestoreModal({
  isOpen,
  onClose,
}: BackupRestoreModalProps) {
  const [activeTab, setActiveTab] = useState<"orgaos" | "historico">("orgaos");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [organStats, setOrganStats] = useState<Record<string, number> | null>(null);
  const [storedBackups, setStoredBackups] = useState<SystemBackupRecord[]>([]);
  const [currentOrganProcessing, setCurrentOrganProcessing] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      loadStoredBackups();
    }
  }, [isOpen]);

  const loadStoredBackups = async () => {
    try {
      const list = await getStoredBackupsList();
      setStoredBackups(list);
    } catch (e) {
      console.error("Erro ao carregar lista de backups:", e);
    }
  };

  if (!isOpen) return null;

  const handleExportData = async () => {
    try {
      setLoading(true);
      setStatusMessage("A iniciar Backup Independente de DADOS...");
      setErrorMessage("");
      setSuccessMessage("");
      const res = await exportDataBackup((msg) => setStatusMessage(msg));
      if (res.success) {
        setStats(res.collectionStats || null);
        setOrganStats(res.organStats || null);
        setSuccessMessage("Backup de Dados exportado com sucesso!");
      } else {
        setErrorMessage("Erro ao exportar dados: " + res.error);
      }
    } catch (err: any) {
      setErrorMessage("Erro: " + err?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportSystem = async () => {
    try {
      setLoading(true);
      setStatusMessage("A iniciar Backup Independente do SISTEMA...");
      setErrorMessage("");
      setSuccessMessage("");
      const res = await exportSystemBackup((msg) => setStatusMessage(msg));
      if (res.success) {
        setStats(res.collectionStats || null);
        setOrganStats(res.organStats || null);
        setSuccessMessage("Backup do Sistema exportado com sucesso!");
      } else {
        setErrorMessage("Erro ao exportar sistema: " + res.error);
      }
    } catch (err: any) {
      setErrorMessage("Erro: " + err?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUploadData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.confirm("Tem a certeza que deseja restaurar o Backup de DADOS? Esta operação atualizará os registos de dados existentes com segurança e integridade.")) {
      if (e.target) e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setLoading(true);
        setStatusMessage("A carregar e a validar o ficheiro de Backup de DADOS...");
        setErrorMessage("");
        setSuccessMessage("");
        const content = event.target?.result as string;
        const res = await restoreDataBackup(content, (msg) => setStatusMessage(msg));
        setStats(res.restoredStats);
        setOrganStats(res.organStats);
        setSuccessMessage(`Restauração de Dados concluída com sucesso! ${res.totalRestored} registos restaurados nos 4 Órgãos. O sistema atualizará em instantes...`);
        setTimeout(() => window.location.reload(), 2000);
      } catch (err: any) {
        console.error("Erro ao restaurar dados:", err);
        setErrorMessage("Erro ao restaurar dados: " + (err?.message || err));
      } finally {
        setLoading(false);
        if (e.target) e.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleFileUploadSystem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.confirm("Tem a certeza que deseja restaurar o Backup do SISTEMA? Esta operação atualizará as configurações e utilizadores do sistema.")) {
      if (e.target) e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setLoading(true);
        setStatusMessage("A carregar e a validar o ficheiro de Backup do SISTEMA...");
        setErrorMessage("");
        setSuccessMessage("");
        const content = event.target?.result as string;
        const res = await restoreSystemBackup(content, (msg) => setStatusMessage(msg));
        setStats(res.restoredStats);
        setOrganStats(res.organStats);
        setSuccessMessage(`Restauração do Sistema concluída com sucesso! ${res.totalRestored} registos restaurados. O sistema atualizará em instantes...`);
        setTimeout(() => window.location.reload(), 2000);
      } catch (err: any) {
        console.error("Erro ao restaurar sistema:", err);
        setErrorMessage("Erro ao restaurar sistema: " + (err?.message || err));
      } finally {
        setLoading(false);
        if (e.target) e.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleRunAutoBackupNow = async () => {
    try {
      setLoading(true);
      setProgressPercent(10);
      setStatusMessage("A iniciar Backup Automático e gravação na nuvem...");
      setErrorMessage("");
      setSuccessMessage("");
      setCurrentOrganProcessing("");

      const record = await runAutomaticBackup(true, (msg, pct) => {
        setStatusMessage(msg);
        if (pct !== undefined) setProgressPercent(pct);
        if (msg.includes("Órgão")) {
          setCurrentOrganProcessing(msg);
        }
      });

      setProgressPercent(100);
      setOrganStats(record.organStats);
      setStats(record.collectionStats);
      setSuccessMessage(
        `Backup Automático concluído com sucesso! ${record.totalRecords} registos foram salvos no sistema e na nuvem. Pode efetuar o download a qualquer momento.`,
      );
      loadStoredBackups();
    } catch (error: any) {
      console.error("Erro no backup automático:", error);
      setErrorMessage("Erro no backup automático: " + (error?.message || error));
    } finally {
      setLoading(false);
      setProgressPercent(0);
      setCurrentOrganProcessing("");
    }
  };

  const handleRestoreFromStored = async (record: SystemBackupRecord) => {
    try {
      setLoading(true);
      setProgressPercent(15);
      setStatusMessage(`A verificar e carregar dados do backup de ${record.formattedDate}...`);
      setErrorMessage("");
      setSuccessMessage("");

      let backupDataToRestore = await getStoredBackupData(record);
      setProgressPercent(35);

      if (!backupDataToRestore || Object.keys(backupDataToRestore).length === 0) {
        const confirmConsolidate = window.confirm(
          `O registo selecionado de ${record.formattedDate} é um sumário de sistema (${record.totalRecords} registos).\n\nDeseja que o sistema consolide e sincronize a base de dados ativa de todos os 4 Órgãos agora?`,
        );

        if (!confirmConsolidate) {
          setErrorMessage(
            "Para restaurar a partir de um arquivo externo, utilize o botão 'Restaurar Backup de Dados' ou 'Restaurar Backup do Sistema' para carregar o seu ficheiro .JSON.",
          );
          setLoading(false);
          setProgressPercent(0);
          return;
        }

        setStatusMessage("A recolher e consolidar dados dos 4 Órgãos...");
        setProgressPercent(45);
        const collected = await collectAllBackupData((msg, pct) => {
          setStatusMessage(msg);
          if (pct !== undefined) setProgressPercent(45 + Math.round(pct * 0.2));
        });
        backupDataToRestore = collected.backupData;
      }

      if (
        !window.confirm(
          `Tem a certeza absoluta que deseja restaurar e aplicar os dados (${record.totalRecords || Object.keys(backupDataToRestore).length} registos) nos devidos lugares?\n\nO sistema será reiniciado após a conclusão para garantir a aplicação correta.`,
        )
      ) {
        setLoading(false);
        setProgressPercent(0);
        return;
      }

      setStatusMessage(`A restaurar e aplicar os dados nos devidos lugares...`);
      setProgressPercent(60);

      const { totalRestored, restoredStats, organStats: restoredOrgans } = await restoreFullBackup(
        backupDataToRestore,
        (msg, pct) => {
          setStatusMessage(msg);
          if (pct !== undefined) setProgressPercent(60 + Math.round(pct * 0.35));
        },
      );

      setProgressPercent(100);
      setStats(restoredStats);
      setOrganStats(restoredOrgans);
      setSuccessMessage(
        `Restauração concluída com sucesso! ${totalRestored} registos aplicados nos devidos lugares. O sistema vai reiniciar em instantes...`,
      );
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      console.error("Erro ao restaurar do backup armazenado:", err);
      setErrorMessage("Erro na restauração: " + (err?.message || err));
      setLoading(false);
      setProgressPercent(0);
    }
  };

  const handleDeleteStoredBackup = async (record: SystemBackupRecord) => {
    if (
      !window.confirm(
        `AVISO: Tem a certeza absoluta que deseja EXCLUIR o backup de ${record.formattedDate} (${record.totalRecords} registos) na nuvem e no sistema?\n\nEsta operação é irreversível.`,
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setProgressPercent(30);
      setStatusMessage(`A excluir backup de ${record.formattedDate} na nuvem...`);
      setErrorMessage("");
      setSuccessMessage("");

      const success = await deleteStoredBackup(record.id);
      setProgressPercent(100);
      
      if (success) {
        setSuccessMessage(`O backup de ${record.formattedDate} foi excluído da nuvem permanentemente com sucesso.`);
        loadStoredBackups(); // Refresh the list
      } else {
        setErrorMessage(`Falha ao excluir o backup de ${record.formattedDate}.`);
      }
    } catch (err: any) {
      console.error("Erro ao excluir backup:", err);
      setErrorMessage("Erro ao excluir backup: " + (err?.message || err));
    } finally {
      setLoading(false);
      setProgressPercent(0);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setLoading(true);
        setStatusMessage("A ler o ficheiro de backup e a restaurar dados por Órgão no Firestore...");
        setErrorMessage("");
        setSuccessMessage("");
        setCurrentOrganProcessing("");

        const content = e.target?.result as string;

        const { totalRestored, restoredStats, organStats: restoredOrgans } = await restoreFullBackup(
          content,
          (msg) => {
            setStatusMessage(msg);
            if (msg.includes("Órgão")) {
              setCurrentOrganProcessing(msg);
            }
          },
        );

        setStats(restoredStats);
        setOrganStats(restoredOrgans);
        setSuccessMessage(
          `Restauração concluída com sucesso! ${totalRestored} registos foram salvos nos 4 Órgãos do sistema. O sistema irá atualizar em instantes...`,
        );
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (err: any) {
        console.error("Erro ao restaurar backup:", err);
        setErrorMessage(
          "Falha ao processar e restaurar o ficheiro de backup: " +
            (err?.message || err),
        );
      } finally {
        setLoading(false);
        setCurrentOrganProcessing("");
        if (event.target) event.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border-2 border-[#121c60] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#121c60] px-6 py-4 flex items-center justify-between text-white border-b-4 border-[#FFB800]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#FFB800] rounded-xl text-[#121c60] shadow-md">
              <Database size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-wider">
                  Centro de Backup e Proteção de Dados por Órgãos
                </h3>
                <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                  <ShieldCheck size={12} />
                  <span>Ativo</span>
                </span>
              </div>
              <p className="text-xs text-white/80">
                Preservação automática e transparente de todas as informações dos 4 Órgãos do SIGEP
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-gray-100 border-b border-gray-200 px-6 pt-3 flex gap-2">
          <button
            onClick={() => setActiveTab("orgaos")}
            className={`pb-3 px-4 font-bold text-xs tracking-wider flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "orgaos"
                ? "border-[#121c60] text-[#121c60]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Building2 size={16} />
            <span>4 Órgãos & Operações</span>
          </button>
          <button
            onClick={() => setActiveTab("historico")}
            className={`pb-3 px-4 font-bold text-xs tracking-wider flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "historico"
                ? "border-[#121c60] text-[#121c60]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <HardDrive size={16} />
            <span>Backups Automáticos no Sistema</span>
            {storedBackups.length > 0 && (
              <span className="bg-[#121c60] text-white px-2 py-0.5 rounded-full text-[10px] font-black">
                {storedBackups.length}
              </span>
            )}
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Active Banner */}
          <div className="bg-indigo-50/90 border border-indigo-200 p-4 rounded-xl text-indigo-950 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-600 text-white rounded-lg shrink-0 mt-0.5 sm:mt-0">
                <Lock size={18} />
              </div>
              <div>
                <h4 className="font-black text-[#121c60] text-sm">
                  Proteção Automática de Dados Garantida
                </h4>
                <p className="text-gray-600 text-[11px] leading-relaxed mt-0.5">
                  Os backups são efetuados <strong>automaticamente a cada 12 horas</strong> e resguardam integralmente todos os registos nos 4 Órgãos do Instituto Superior Politécnico de Songo.
                </p>
              </div>
            </div>
            <button
              onClick={handleRunAutoBackupNow}
              disabled={loading}
              className="shrink-0 bg-[#121c60] hover:bg-[#1b2a80] text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              <Sparkles size={14} className="text-[#FFB800]" />
              <span>Executar Backup Agora</span>
            </button>
          </div>

          {activeTab === "orgaos" && (
            <>
              {/* Grid dos 4 Órgãos Oficiais */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-black text-[#121c60] text-xs tracking-wider flex items-center gap-2">
                    <Building2 size={16} className="text-[#FFB800]" />
                    <span>Os 4 Órgãos Cobertos pelo Sistema de Backup:</span>
                  </h4>
                  <span className="text-[11px] text-gray-500 font-semibold">
                    44 coleções ativas no Firestore
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SYSTEM_ORGAOS.map((organ, index) => {
                    const count = organStats ? organStats[organ.id] : null;
                    const isCurrent = currentOrganProcessing.includes(organ.name);

                    return (
                      <div
                        key={organ.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                          isCurrent
                            ? "border-amber-400 bg-amber-50/80 shadow-md ring-2 ring-amber-300"
                            : "border-gray-200 bg-gray-50/80 hover:border-indigo-300 hover:bg-white"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 bg-white rounded-xl shadow-xs border border-gray-100">
                                {ORGAN_ICONS[organ.id]}
                              </div>
                              <div>
                                <span className="text-[10px] font-black text-gray-400 tracking-wider">
                                  Órgão {index + 1} de 4
                                </span>
                                <h5 className="font-extrabold text-sm text-gray-900 leading-tight">
                                  {organ.name}
                                </h5>
                              </div>
                            </div>
                            {count !== null && (
                              <span className="bg-[#121c60] text-white px-2.5 py-0.5 rounded-full text-[11px] font-black shrink-0">
                                {count} registos
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-600 leading-relaxed mb-3">
                            {organ.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-2 border-t border-gray-200/60 font-semibold text-gray-500">
                          <span>{organ.collections.length} coleções de dados</span>
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle size={12} />
                            <span>Sincronizado</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Cards - Independência Total entre Dados e Sistema */}
              <div className="space-y-4 pt-2">
                <div className="border-b border-gray-200 pb-2">
                  <h4 className="font-black text-[#121c60] text-sm tracking-wider">
                    Operações Independentes de Backup e Restauração
                  </h4>
                  <p className="text-xs text-gray-500">
                    O sistema mantém os backups de Dados e de Sistema completamente separados e independentes.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Bloco de Dados */}
                  <div className="border-2 border-indigo-200 bg-indigo-50/30 rounded-2xl p-5 flex flex-col justify-between hover:border-[#121c60] transition-all space-y-4">
                    <div>
                      <div className="w-10 h-10 bg-[#121c60] text-white rounded-xl flex items-center justify-center mb-3 shadow-md">
                        <Database size={20} />
                      </div>
                      <h4 className="font-black text-[#121c60] text-base mb-1">
                        Backup e Restauração de Dados
                      </h4>
                      <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                        Exclusivo para registos institucionais, colaboradores, atividades, estudantes, finanças e inventário dos 4 Órgãos.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={handleExportData}
                        disabled={loading}
                        className="w-full bg-[#121c60] hover:bg-[#1a2b70] text-white font-black py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 text-xs"
                      >
                        {loading ? <RefreshCw className="animate-spin" size={15} /> : <Download size={15} />}
                        <span>Descarregar Backup de Dados (JSON)</span>
                      </button>

                      <label className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-black py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer text-xs">
                        {loading ? <RefreshCw className="animate-spin" size={15} /> : <Upload size={15} />}
                        <span>Restaurar Backup de Dados</span>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleFileUploadData}
                          disabled={loading}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Bloco de Sistema */}
                  <div className="border-2 border-amber-200 bg-amber-50/30 rounded-2xl p-5 flex flex-col justify-between hover:border-amber-600 transition-all space-y-4">
                    <div>
                      <div className="w-10 h-10 bg-amber-600 text-white rounded-xl flex items-center justify-center mb-3 shadow-md">
                        <Server size={20} />
                      </div>
                      <h4 className="font-black text-amber-900 text-base mb-1">
                        Backup e Restauração do Sistema
                      </h4>
                      <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                        Exclusivo para contas de utilizadores, configurações gerais, documentos normativos, notas, calendário e mensagens.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={handleExportSystem}
                        disabled={loading}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 text-xs"
                      >
                        {loading ? <RefreshCw className="animate-spin" size={15} /> : <Download size={15} />}
                        <span>Descarregar Backup do Sistema (JSON)</span>
                      </button>

                      <label className="w-full bg-amber-700 hover:bg-amber-800 text-white font-black py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer text-xs">
                        {loading ? <RefreshCw className="animate-spin" size={15} /> : <Upload size={15} />}
                        <span>Restaurar Backup do Sistema</span>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleFileUploadSystem}
                          disabled={loading}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "historico" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-[#121c60] text-sm flex items-center gap-2">
                    <HardDrive size={18} className="text-[#FFB800]" />
                    <span>Cópia de Segurança Guardada na Nuvem / Sistema</span>
                  </h4>
                  <p className="text-xs text-gray-500">
                    O Administrador pode descarregar ou restaurar qualquer backup automático salvo
                  </p>
                </div>
                <button
                  onClick={handleRunAutoBackupNow}
                  disabled={loading}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
                >
                  <Play size={14} />
                  <span>Novo Backup Automático</span>
                </button>
              </div>

              {storedBackups.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 border border-dashed border-gray-300 rounded-2xl text-gray-500 space-y-2">
                  <Clock size={32} className="mx-auto text-gray-400" />
                  <p className="font-bold text-sm">Nenhum backup registado ainda</p>
                  <p className="text-xs">
                    O sistema executa backups automaticamente de 12 em 12 horas ou ao clicar no botão acima.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(
                    storedBackups.reduce((acc, b) => {
                      const d = new Date(b.timestamp || Date.now());
                      const year = d.getFullYear().toString();
                      const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
                      const month = monthNames[d.getMonth()] || "Outros";
                      const dayNum = String(d.getDate()).padStart(2, '0');
                      const dayKey = `${dayNum} de ${month} de ${year}`;

                      if (!acc[year]) acc[year] = {};
                      if (!acc[year][month]) acc[year][month] = {};
                      if (!acc[year][month][dayKey]) acc[year][month][dayKey] = [];
                      acc[year][month][dayKey].push(b);
                      return acc;
                    }, {} as Record<string, Record<string, Record<string, SystemBackupRecord[]>>>)
                  ).map(([year, months]) => (
                    <div key={year} className="space-y-4">
                      <div className="flex items-center gap-2 border-b-2 border-[#121c60] pb-2">
                        <Folder className="text-[#121c60]" size={20} />
                        <h5 className="font-black text-sm text-[#121c60]  tracking-wider">
                          Ano / Calendário: {year}
                        </h5>
                      </div>

                      {Object.entries(months).map(([month, days]) => (
                        <div key={month} className="pl-4 space-y-3 border-l-2 border-indigo-200">
                          <div className="flex items-center gap-2 font-extrabold text-xs text-indigo-900">
                            <Calendar size={15} className="text-indigo-600" />
                            <span>Mês: {month}</span>
                          </div>

                          {Object.entries(days).map(([dayKey, backupsListUnknown]) => {
                            const backupsList = backupsListUnknown as SystemBackupRecord[];
                            return (
                            <div key={dayKey} className="pl-4 space-y-2">
                              <div className="bg-[#121c60]/5 border border-[#121c60]/20 px-3.5 py-2 rounded-xl font-bold text-xs text-[#121c60] flex items-center justify-between shadow-2xs">
                                <span className="flex items-center gap-2">
                                  <FolderOpen size={17} className="text-[#FFB800]" />
                                  <span>Pasta de Backup (Dia. Mês. Ano): {dayKey}</span>
                                </span>
                                <span className="bg-[#121c60] text-white px-2 py-0.5 rounded-full text-[10px] font-black">
                                  {backupsList.length} {backupsList.length === 1 ? 'registo' : 'registos'}
                                </span>
                              </div>

                              <div className="space-y-2 pl-2">
                                {backupsList.map((b) => (
                                  <div
                                    key={b.id}
                                    className="p-3.5 bg-white border border-gray-200 rounded-xl shadow-2xs hover:border-indigo-400 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                  >
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-black text-xs text-[#121c60]">
                                          Hora: {b.formattedDate}
                                        </span>
                                        <span
                                          className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                                            b.type === "manual"
                                              ? "bg-purple-100 text-purple-800"
                                              : "bg-blue-100 text-blue-800"
                                          }`}
                                        >
                                          {b.type === "manual" ? "Manual" : "Automático"}
                                        </span>
                                        <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                          {b.totalSizeKB} KB
                                        </span>
                                      </div>
                                      <div className="text-[11px] text-gray-600 flex items-center gap-2">
                                        <span className="font-bold text-emerald-700">
                                          {b.totalRecords} registos totais
                                        </span>
                                        <span>•</span>
                                        <span>4 Órgãos preservados</span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      <button
                                        onClick={() => downloadStoredBackupFile(b)}
                                        className="bg-indigo-50 hover:bg-indigo-100 text-[#121c60] font-bold text-xs px-2.5 py-1.5 rounded-lg border border-indigo-200 flex items-center gap-1 transition-all"
                                        title="Descarregar ficheiro JSON deste backup"
                                      >
                                        <Download size={13} />
                                        <span>Baixar JSON</span>
                                      </button>
                                      <button
                                        onClick={() => handleRestoreFromStored(b)}
                                        disabled={loading}
                                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all disabled:opacity-50 shadow-2xs"
                                        title="Restaurar a base de dados a partir deste backup"
                                      >
                                        <FileCheck size={13} />
                                        <span>Restaurar</span>
                                      </button>
                                      <button
                                        onClick={() => handleDeleteStoredBackup(b)}
                                        disabled={loading}
                                        className="bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs px-2.5 py-1.5 rounded-lg border border-red-200 flex items-center gap-1 transition-all disabled:opacity-50"
                                        title="Excluir permanentemente este backup"
                                      >
                                        <Trash2 size={13} />
                                        <span>Excluir</span>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                             </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Status & Step-by-Step Progress Display */}
          {loading && (
            <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-5 flex flex-col gap-3 text-[#121c60] shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 font-black text-sm">
                  <RefreshCw className="animate-spin text-indigo-600" size={22} />
                  <span>{statusMessage}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#121c60] text-white text-xs font-black px-2.5 py-1 rounded-full shadow-xs">
                    {progressPercent}%
                  </span>
                  {currentOrganProcessing && (
                    <span className="bg-indigo-700 text-white text-[10px] font-black  px-2.5 py-1 rounded-full shadow-xs">
                      Em execução
                    </span>
                  )}
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                <div 
                  className="bg-gradient-to-r from-[#121c60] to-indigo-600 h-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.max(5, progressPercent)}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-gray-600 font-medium">
                Contagem em percentagem ({progressPercent}%): A processar operação de backup ou restauração com validação rigorosa em todos os 4 Órgãos.
              </p>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-2xl flex items-start gap-3 shadow-xs">
              <CheckCircle
                className="shrink-0 text-emerald-600 mt-0.5"
                size={22}
              />
              <div className="text-xs font-semibold leading-relaxed">{successMessage}</div>
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-50 border border-red-300 text-red-900 p-4 rounded-2xl flex items-start gap-3 shadow-xs">
              <AlertTriangle
                className="shrink-0 text-red-600 mt-0.5"
                size={22}
              />
              <div className="text-xs font-semibold leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Stats Summary por Coleção */}
          {stats && Object.keys(stats).length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
              <h5 className="font-black text-[#121c60] text-xs  tracking-wider flex items-center gap-2">
                <CheckCircle size={15} className="text-emerald-600" />
                <span>Resumo das Coleções Processadas por Órgão:</span>
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-44 overflow-y-auto pr-2">
                {Object.entries(stats).map(([col, count]) => (
                  <div
                    key={col}
                    className="bg-white p-2.5 rounded-xl border border-gray-200/80 flex justify-between items-center text-xs shadow-2xs"
                  >
                    <span className="font-semibold text-gray-700 truncate mr-2" title={col}>
                      {col}
                    </span>
                    <span className="bg-[#121c60] text-white px-2 py-0.5 rounded-full font-black text-[10px]">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3.5 border-t border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-2 text-[11px] text-gray-600 font-semibold">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>SIGEP • Base de dados Firestore com encriptação e segurança ativa</span>
          </div>
          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-black px-6 py-2.5 rounded-xl text-xs transition-colors shadow-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}



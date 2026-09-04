import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  Inbox,
  FileText,
  Search,
  Filter,
  DollarSign,
  Layers,
  Printer,
  Download,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import ConsultarPlanoAtividadesModal from "./ConsultarPlanoAtividadesModal";
import { openPrintDocumentWindow } from "../lib/printUtils";

interface PlanosActividadeViewProps {
  onBack: () => void;
  user?: any;
}

export default function PlanosActividadeView({
  onBack,
  user,
}: PlanosActividadeViewProps) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDir, setSelectedDir] = useState<string>("todos");
  const [selectedTrim, setSelectedTrim] = useState<string>("todos");
  const [showConsultarModal, setShowConsultarModal] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "matrix_activities"),
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setActivities(items);
        setLoading(false);
      },
      (err) => {
        console.error("Erro ao carregar matrix_activities:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // Extrair direções presentes nas atividades
  const availableDirections = useMemo(() => {
    const set = new Set<string>();
    activities.forEach((a) => {
      const d = a.direcao || a.unidadeOrganica || a.departamento;
      if (d && typeof d === "string" && d.trim()) set.add(d.trim());
    });
    return Array.from(set).sort();
  }, [activities]);

  // Filtrar atividades
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // Busca textual
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const code = String(act.codigoAtividade || act.codigo || act.numeroAtividade || act.id || "").toLowerCase();
        const name = String(act.nomeAtividade || act.title || act.nome || act.atividade || "").toLowerCase();
        const obj = String(act.objetivoAtividade || act.objetivo || act.descricao || "").toLowerCase();
        const sec = String(act.setor || act.departamento || act.direcao || "").toLowerCase();
        const resp = String(act.responsavel || "").toLowerCase();

        if (!code.includes(term) && !name.includes(term) && !obj.includes(term) && !sec.includes(term) && !resp.includes(term)) {
          return false;
        }
      }

      // Filtro de Direção
      if (selectedDir !== "todos") {
        const actDir = String(act.direcao || act.unidadeOrganica || act.departamento || "").toLowerCase();
        if (!actDir.includes(selectedDir.toLowerCase())) return false;
      }

      // Filtro de Trimestre
      if (selectedTrim !== "todos") {
        const actTrim = String(act.trimestre || act.mesRealizacao || act.mes || "").toLowerCase();
        if (!actTrim.includes(selectedTrim.toLowerCase())) return false;
      }

      return true;
    });
  }, [activities, searchTerm, selectedDir, selectedTrim]);

  // Estatísticas
  const totalOrcamento = useMemo(() => {
    return filteredActivities.reduce((acc, curr) => {
      const v = Number(curr.valor || curr.orcamentoTotal || curr.valorTotal || curr.orcamento || 0);
      return acc + v;
    }, 0);
  }, [filteredActivities]);

  const activitiesEmCurso = useMemo(() => {
    return filteredActivities.filter(
      (a) => a.status === "em_curso" || a.status === "Em Execução" || a.status === "Aprovado" || a.status === "aprovado"
    );
  }, [filteredActivities]);

  const activitiesPlaneadas = useMemo(() => {
    return filteredActivities.filter(
      (a) => a.status !== "em_curso" && a.status !== "Em Execução" && a.status !== "concluido"
    );
  }, [filteredActivities]);

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Botão de Retorno e Ações de Topo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-black text-xs uppercase tracking-wider bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl transition-all shadow-2xs cursor-pointer"
        >
          <ArrowLeft size={16} /> Voltar para Visão Geral
        </button>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => setShowConsultarModal(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
          >
            <FileText size={16} /> Consultar Plano Completo ({filteredActivities.length})
          </button>
        </div>
      </div>

      {/* Título da Seção */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-black uppercase tracking-widest">
            <Building2 size={13} /> Sistema Integrado de Gestão e Planificação
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Planos de Atividade Institucionais & Setoriais
          </h2>
          <p className="text-sm text-slate-300 max-w-2xl font-medium">
            Localização, monitoria e consulta organizada de todas as atividades planificadas, orçamentos correspondentes e cronogramas de execução.
          </p>
        </div>
      </div>

      {/* Cards de Métricas Gerais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total de Atividades</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <FileText size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {loading ? "..." : filteredActivities.length}
          </div>
          <span className="text-xs text-slate-500 font-medium">Planificadas no sistema</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Orçamento Global</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-700 font-mono">
            {loading ? "..." : totalOrcamento.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-500 font-medium">Meticais (MZN)</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Em Execução / Aprovadas</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Clock size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {loading ? "..." : activitiesEmCurso.length}
          </div>
          <span className="text-xs text-slate-500 font-medium">Acompanhamento ativo</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Setoriais / Planeadas</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Calendar size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {loading ? "..." : activitiesPlaneadas.length}
          </div>
          <span className="text-xs text-slate-500 font-medium">No cronograma anual</span>
        </div>
      </div>

      {/* Barra de Pesquisa e Filtros */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="text"
              placeholder="Pesquisar atividades por código, título, departamento, responsável..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedDir}
              onChange={(e) => setSelectedDir(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="todos">Todas as Direções / Unidades</option>
              {availableDirections.map((dir) => (
                <option key={dir} value={dir}>
                  {dir}
                </option>
              ))}
            </select>

            <select
              value={selectedTrim}
              onChange={(e) => setSelectedTrim(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="todos">Todos os Trimestres</option>
              <option value="1">1º Trimestre</option>
              <option value="2">2º Trimestre</option>
              <option value="3">3º Trimestre</option>
              <option value="4">4º Trimestre</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Atividades Organizadas */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">Atividades Registadas no Plano</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Lista sequencial e detalhada de ações e dotações
            </p>
          </div>
          <span className="text-xs font-bold font-mono text-slate-600 bg-white px-3 py-1 rounded-xl border border-slate-200">
            {filteredActivities.length} Atividades
          </span>
        </div>

        <div className="p-5 overflow-y-auto space-y-3">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs">A carregar atividades do plano...</div>
          ) : filteredActivities.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <Inbox size={32} className="text-slate-300" />
              <span>Nenhuma atividade encontrada com os filtros selecionados.</span>
            </div>
          ) : (
            filteredActivities.map((act, idx) => {
              const code = act.codigoAtividade || act.codigo || act.numeroAtividade || `ACT-${idx + 1}`;
              const name = act.nomeAtividade || act.title || act.nome || act.atividade || "Atividade sem título";
              const sector = act.setor || act.reparticao || act.departamento || "Setor Geral";
              const val = Number(act.valor || act.orcamentoTotal || act.valorTotal || act.orcamento || 0);

              return (
                <div
                  key={act.id || idx}
                  className="p-4 bg-slate-50/80 hover:bg-white rounded-2xl border border-slate-200/80 hover:border-blue-300 transition-all shadow-2xs space-y-2"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black font-mono bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-lg border border-blue-100">
                        {code}
                      </span>
                      <span className="text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {sector}
                      </span>
                      {act.trimestre && (
                        <span className="text-[11px] font-medium text-slate-500">
                          {act.trimestre}
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-xs sm:text-sm font-black font-mono text-emerald-700">
                        {val.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN
                      </span>
                    </div>
                  </div>

                  <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                    {name}
                  </h4>

                  {act.objetivoAtividade || act.objetivo ? (
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {act.objetivoAtividade || act.objetivo}
                    </p>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal Completo e Organizado */}
      <ConsultarPlanoAtividadesModal
        isOpen={showConsultarModal}
        onClose={() => setShowConsultarModal(false)}
        activities={filteredActivities}
        title="Plano de Atividades Global"
        subtitle="Visualização e organização de todas as atividades do plano"
        selectedSectorName={selectedDir === "todos" ? "Institucional" : selectedDir}
      />
    </div>
  );
}

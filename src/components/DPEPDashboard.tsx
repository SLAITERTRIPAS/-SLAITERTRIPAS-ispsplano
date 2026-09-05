import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  Layers, 
  Search, 
  Activity,
  CalendarCheck
} from 'lucide-react';
import { MatrixActivity } from '../types';

interface DPEPDashboardProps {
  activities: MatrixActivity[];
  onSelectWorkflow: (mode: 'planning' | 'consulting' | 'pesoe') => void;
  onImport?: () => void;
  selectedYear: number;
  user?: any;
  isChefeDPEP?: boolean;
  isPlanificacao?: boolean;
}

export const DPEPDashboard: React.FC<DPEPDashboardProps> = ({ 
  activities, 
  onSelectWorkflow,
  onImport,
  selectedYear,
  user,
  isChefeDPEP,
  isPlanificacao
}) => {
  // Check if user is authorized to see the PESOE badge/title (Chefe do DPEP e Repartição de Planificação)
  const isAuthorizedForPESOE = useMemo(() => {
    if (isChefeDPEP || isPlanificacao) return true;
    if (!user) return false;
    const dept = String(user.departamento || "").toUpperCase();
    const rep = String(user.reparticao || "").toUpperCase();
    const set = String(user.setor || "").toUpperCase();
    const tit = String(user.titulo || user.role || "").toUpperCase();
    return (
      dept.includes("DPEP") ||
      dept.includes("PLANIFICA") ||
      rep.includes("PLANIFICA") ||
      set.includes("PLANIFICA") ||
      tit.includes("DPEP") ||
      tit.includes("PLANIFICA")
    );
  }, [isChefeDPEP, isPlanificacao, user]);

  // Stats calculations
  const stats = useMemo(() => {
    const validActivities = activities.filter(a => (a.titulo || a.descricao || Number(a.valor) > 0) && (a.setor || a.reparticao || a.departamento));
    const totalActivities = validActivities.length;
    const submetidas = validActivities.filter(a => a.submetido).length;
    const aprovadas = validActivities.filter(a => a.status === 'institucional' || a.status === 'direcao').length;
    const executadas = validActivities.filter(a => a.executada).length;
    const totalBudget = validActivities.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
    
    // Unique sectors with actual planned activities
    const sectors = new Set(validActivities.map(a => a.setor || a.reparticao || a.departamento).filter(Boolean)).size;
    
    // Execution percentage
    const execPercent = totalActivities > 0 ? (executadas / totalActivities) * 100 : 0;

    return {
      totalActivities,
      submetidas,
      aprovadas,
      executadas,
      totalBudget,
      sectors,
      execPercent
    };
  }, [activities]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <motion.div 
      className="p-8 space-y-8 bg-slate-50 min-h-screen"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Painel de Controlo de Planificação
            </h1>
            {isAuthorizedForPESOE && (
              <button
                type="button"
                onClick={() => onSelectWorkflow('pesoe')}
                className="px-4 py-1.5 bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-black rounded-lg shadow-md tracking-wider uppercase inline-flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Clique para abrir a Visualização Oficial do PESOE"
              >
                <span>PESOE</span>
                <span className="text-[10px] bg-white/25 px-1.5 py-0.5 rounded font-bold">Oficial</span>
              </button>
            )}
          </div>
          <p className="text-sm font-bold text-slate-500 tracking-widest mt-1 flex items-center gap-2">
            <Clock size={14} className="text-indigo-600" />
            Ciclo de {selectedYear} • Visão Consolidada DPEP
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => onSelectWorkflow('planning')}
            className="px-6 py-3 bg-[#5842f4] text-white rounded-xl font-black text-xs tracking-widest hover:brightness-110 transition-all shadow-lg flex items-center gap-2 active:scale-95"
            title={isChefeDPEP ? "Aceder ao Plano de Atividades do DPEP" : "Iniciar Nova Planificação"}
          >
            <Activity size={16} />
            {isChefeDPEP ? "Plano do DPEP" : "Nova Planificação"}
          </button>
          {isAuthorizedForPESOE && (
            <button 
              onClick={() => onSelectWorkflow('pesoe')}
              className="px-6 py-3 bg-[#f97316] text-white rounded-xl font-black text-xs tracking-widest hover:bg-[#ea580c] hover:brightness-110 transition-all shadow-lg flex items-center gap-2 active:scale-95"
              title="Visualizar PESOE com Atividades Aprovadas por Direção"
            >
              <Layers size={16} />
              PESOE
            </button>
          )}
          <button 
            onClick={() => onSelectWorkflow('consulting')}
            className="px-6 py-3 bg-white text-slate-900 border border-slate-200 rounded-xl font-black text-xs tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 active:scale-95 shadow-sm"
          >
            <Search size={16} />
            Consultar Ativo
          </button>
          <button 
            onClick={onImport}
            className="px-8 py-3 bg-[#00a3e0] text-white rounded-xl font-black text-sm hover:brightness-110 transition-all flex items-center gap-2 active:scale-95 shadow-lg"
          >
            Importar plano
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            title: "Atividades Totais", 
            value: stats.totalActivities, 
            label: "Total no Ciclo", 
            icon: Activity, 
            color: "bg-blue-600",
            trend: stats.totalActivities > 0 ? `${stats.submetidas} Submetidas` : "0 Submetidas" 
          },
          { 
            title: "Execução Orçamental", 
            value: `${stats.execPercent.toFixed(1)}%`, 
            label: `${stats.executadas} de ${stats.totalActivities}`, 
            icon: TrendingUp, 
            color: "bg-emerald-600",
            trend: stats.totalActivities > 0 ? "Taxa Real" : "0%" 
          },
          { 
            title: "Volume de Investimento", 
            value: stats.totalBudget.toLocaleString('pt-PT'), 
            label: "MZN Planificados", 
            icon: DollarSign, 
            color: "bg-amber-600",
            trend: "Consolidado" 
          },
          { 
            title: "Sincronização de Setores", 
            value: stats.sectors, 
            label: "Unidades Orgânicas", 
            icon: Layers, 
            color: "bg-indigo-600",
            trend: stats.sectors > 0 ? `${stats.sectors} Ativos` : "0 Ativos" 
          }
        ].map((card, i) => (
          <motion.div 
            key={i}
            variants={itemVariants}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 ${card.color} text-white rounded-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                <card.icon size={20} />
              </div>
              <span className="text-[10px] font-black text-slate-400 tracking-widest">{card.trend}</span>
            </div>
            <h3 className="text-[11px] font-black text-slate-400 tracking-[0.15em] mb-1">{card.title}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 tracking-tight">{card.value}</span>
              <span className="text-[10px] font-bold text-slate-400">{card.title === "Orçamento Total" ? "MZN" : ""}</span>
            </div>
            <p className="text-[10px] font-bold text-slate-500 tracking-widest mt-2">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Cronograma de Prazos Institucionais */}
      <motion.div 
        variants={itemVariants}
        className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm"
      >
        <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
              <BarChart3 size={22} />
            </div>
            <div>
              <h4 className="text-base font-black text-slate-900 tracking-tight">Cronograma de Prazos e Tramitação</h4>
              <p className="text-xs text-slate-400 font-bold">Fases de Consolidação e Aprovação do Plano Anual ({selectedYear})</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/60">
            <CalendarCheck size={16} className="text-emerald-600" />
            <span>Calendário Regulamentar</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              label: "Submissão Setorial", 
              date: "30 de Outubro", 
              progress: 100, 
              color: "bg-emerald-500",
              status: "Concluído",
              desc: "Recepção de propostas setoriais"
            },
            { 
              label: "Consolidação DPEP", 
              date: "15 de Novembro", 
              progress: 65, 
              color: "bg-amber-500",
              status: "Em Curso",
              desc: "Harmonização de atividades e rubricas"
            },
            { 
              label: "Parecer Técnico", 
              date: "30 de Novembro", 
              progress: 0, 
              color: "bg-slate-300",
              status: "Pendente",
              desc: "Validação orçamental e conformidade"
            },
            { 
              label: "Aprovação Geral", 
              date: "15 de Dezembro", 
              progress: 0, 
              color: "bg-slate-300",
              status: "Pendente",
              desc: "Homologação pelo Conselho de Direção"
            }
          ].map((step, i) => (
            <div key={i} className="p-5 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-3">
              <div className="flex justify-between items-center text-xs font-black tracking-wider">
                <span className="text-slate-800">{step.label}</span>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                  step.status === 'Concluído' ? 'bg-emerald-100 text-emerald-700' :
                  step.status === 'Em Curso' ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-200 text-slate-600'
                }`}>
                  {step.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">{step.desc}</p>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className={`h-full ${step.color} transition-all duration-500`} style={{ width: `${step.progress}%` }} />
              </div>
              <div className="text-right text-[11px] font-black text-slate-700">
                Prazo: {step.date}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

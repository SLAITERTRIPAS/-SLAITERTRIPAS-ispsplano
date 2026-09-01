import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Layers,
  ChevronRight,
  Filter,
  Search,
  ArrowUpRight,
  MoreVertical,
  Activity,
  Upload
} from 'lucide-react';
import { MatrixActivity } from '../types';

interface DPEPDashboardProps {
  activities: MatrixActivity[];
  onSelectWorkflow: (mode: 'planning' | 'consulting') => void;
  onImport?: () => void;
  selectedYear: number;
}

export const DPEPDashboard: React.FC<DPEPDashboardProps> = ({ 
  activities, 
  onSelectWorkflow,
  onImport,
  selectedYear 
}) => {
  // Stats calculations
  const stats = useMemo(() => {
    const validActivities = activities.filter(a => (a.titulo || a.descricao || Number(a.valor) > 0) && a.setor || a.reparticao || a.departamento);
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

  // Sector-wise aggregation for the table (strictly counting units with actual planned activities)
  const sectorData = useMemo(() => {
    const map: Record<string, any> = {};
    
    activities.forEach(act => {
      if (!act.titulo && !act.descricao && (!act.valor || Number(act.valor) === 0)) return;

      const sector = act.setor || act.reparticao || act.departamento || act.direcao;
      if (!sector || sector === 'Geral' || sector === 'Plano Geral') return;

      if (!map[sector]) {
        map[sector] = {
          name: sector,
          total: 0,
          submetidas: 0,
          aprovadas: 0,
          executadas: 0,
          budget: 0
        };
      }
      
      map[sector].total++;
      if (act.submetido) map[sector].submetidas++;
      if (act.status === 'institucional' || act.status === 'direcao') map[sector].aprovadas++;
      if (act.executada) map[sector].executadas++;
      map[sector].budget += (Number(act.valor) || 0);
    });

    return Object.values(map).filter((item: any) => item.total > 0).sort((a, b) => b.budget - a.budget);
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
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Painel de Controlo de Planificação
          </h1>
          <p className="text-sm font-bold text-slate-500  tracking-widest mt-1 flex items-center gap-2">
            <Clock size={14} className="text-indigo-600" />
            Ciclo de {selectedYear} • Visão Consolidada DPEP
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => onSelectWorkflow('planning')}
            className="px-6 py-3 bg-[#5842f4] text-white rounded-xl font-black text-xs  tracking-widest hover:brightness-110 transition-all shadow-lg flex items-center gap-2 active:scale-95"
          >
            <Activity size={16} />
            Nova Planificação
          </button>
          <button 
            onClick={() => onSelectWorkflow('consulting')}
            className="px-6 py-3 bg-white text-slate-900 border border-slate-200 rounded-xl font-black text-xs  tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 active:scale-95 shadow-sm"
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
            trend: "+12%" 
          },
          { 
            title: "Execução Orçamental", 
            value: `${stats.execPercent.toFixed(1)}%`, 
            label: `${stats.executadas} de ${stats.totalActivities}`, 
            icon: TrendingUp, 
            color: "bg-emerald-600",
            trend: "Meta: 85%" 
          },
          { 
            title: "Volume de Investimento", 
            value: stats.totalBudget.toLocaleString('pt-PT'), 
            label: "MZN Planificados", 
            icon: DollarSign, 
            color: "bg-amber-600",
            trend: "OE + RP" 
          },
          { 
            title: "Sincronização de Setores", 
            value: stats.sectors, 
            label: "Unidades Orgânicas", 
            icon: Layers, 
            color: "bg-indigo-600",
            trend: "Consolidado" 
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
              <span className="text-[10px] font-black text-slate-400  tracking-widest">{card.trend}</span>
            </div>
            <h3 className="text-[11px] font-black text-slate-400  tracking-[0.15em] mb-1">{card.title}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 tracking-tight">{card.value}</span>
              <span className="text-[10px] font-bold text-slate-400">{card.title === "Orçamento Total" ? "MZN" : ""}</span>
            </div>
            <p className="text-[10px] font-bold text-slate-500  tracking-widest mt-2">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Table View */}
        <motion.div 
          variants={itemVariants}
          className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col"
        >
          <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Monitoria de Submissão Setorial</h3>
              <p className="text-[10px] font-black text-slate-400  tracking-widest mt-1">Status de tramitação por unidade orgânica</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
              <button className="px-4 py-2 bg-white text-slate-900 rounded-lg text-xs font-black shadow-sm border border-slate-100">Todos</button>
              <button className="px-4 py-2 text-slate-400 hover:text-slate-600 rounded-lg text-xs font-bold">Pendentes</button>
              <button className="px-4 py-2 text-slate-400 hover:text-slate-600 rounded-lg text-xs font-bold">Concluídos</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400  tracking-widest">Unidade Orgânica</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400  tracking-widest">Atividades</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400  tracking-widest">Aprovadas</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400  tracking-widest">Orçamento (MZN)</th>
                  <th className="px-8 py-4 text-center text-[10px] font-black text-slate-400  tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sectorData.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-[10px]">
                          {row.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 leading-none">{row.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1  tracking-tight">ID: {Math.random().toString(36).substring(7).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-sm font-bold text-slate-700">{row.total}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500" 
                            style={{ width: `${(row.aprovadas / row.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-black text-slate-900">{row.aprovadas}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right font-mono text-xs font-bold text-slate-600">
                      {row.budget.toLocaleString('pt-PT')}
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black  tracking-widest ${
                        row.submetidas === row.total 
                          ? "bg-emerald-100 text-emerald-700" 
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {row.submetidas === row.total ? "Concluído" : "Em Tramitação"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-6 bg-slate-50/50 border-t border-slate-50 text-center">
            <button className="text-xs font-black text-indigo-600  tracking-widest hover:underline flex items-center gap-2 mx-auto">
              Ver Relatório Detalhado de Todos os Setores <ChevronRight size={14} />
            </button>
          </div>
        </motion.div>

        {/* Sidebar Cards */}
        <div className="space-y-6">
          <motion.div 
            variants={itemVariants}
            className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Users size={120} />
            </div>
            <h4 className="text-xs font-black  tracking-widest opacity-80 mb-2">Equipa de Planificação</h4>
            <p className="text-xl font-bold leading-tight mb-6">Colaboração em Tempo Real nas Propostas</p>
            <div className="flex -space-x-2 mb-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-indigo-600 bg-indigo-400 flex items-center justify-center text-[10px] font-black">
                  U{i}
                </div>
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-indigo-600 bg-white text-indigo-600 flex items-center justify-center text-[10px] font-black">
                +12
              </div>
            </div>
            <button className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black text-xs  tracking-widest hover:bg-indigo-50 transition-all active:scale-95 shadow-lg">
              Gerir Utilizadores
            </button>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                <BarChart3 size={20} />
              </div>
              <h4 className="text-sm font-black text-slate-900  tracking-widest">Cronograma de Prazos</h4>
            </div>
            <div className="space-y-4">
              {[
                { label: "Submissão Setorial", date: "30 Out", progress: 100, color: "bg-emerald-500" },
                { label: "Consolidação DPEP", date: "15 Nov", progress: 65, color: "bg-amber-500" },
                { label: "Parecer Técnico", date: "30 Nov", progress: 0, color: "bg-slate-200" },
                { label: "Aprovação Geral", date: "15 Dez", progress: 0, color: "bg-slate-200" }
              ].map((step, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-black  tracking-widest">
                    <span className="text-slate-500">{step.label}</span>
                    <span className="text-slate-900">{step.date}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                    <div className={`h-full ${step.color} transition-all`} style={{ width: `${step.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

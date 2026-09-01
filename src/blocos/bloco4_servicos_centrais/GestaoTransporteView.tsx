import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Car,
  Fuel,
  ClipboardList,
  Pen,
  Search,
  Plus,
  Filter,
  Trash2,
  Edit2,
  Info,
  BarChart3,
  LayoutGrid,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Settings,
  Users,
  History,
  FileText,
  TrendingUp,
  TrendingDown,
  Gauge,
} from "lucide-react";
import { firestoreService } from "../../lib/firestoreService";
import BalancoCombustivelView from "../bloco4_servicos_centrais/BalancoCombustivelView";
import { FichaInventarioVeiculo } from "../bloco6_documentos/FichaInventarioVeiculo";

interface Vehicle {
  id: string;
  matricula: string;
  marca: string;
  modelo: string;
  anoFabrico: string;
  tipoCombustivel: string;
  quilometragem: number;
  estadoGeral: string;
  seguroValidade?: string;
  inspeccaoValidade?: string;
  status: "Disponível" | "Em Uso" | "Manutenção" | "Abatido";
  departamentoAlocado?: string;
}

export default function GestaoTransporteView({
  user,
  onBack,
  initialTab = "visao_geral",
}: {
  user: any;
  onBack: () => void;
  initialTab?: string;
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    // Subscrevendo aos bens filtrando por categoria Veículo
    const unsub = firestoreService.materiais_bens.subscribe((data: any[]) => {
      const vehicleList = data
        .filter((b) => b.categoria === "Veículo" || b.tipo === "Veículo")
        .map((v) => ({
          id: v.id,
          matricula: v.matricula || v.nome,
          marca: v.marca || "",
          modelo: v.modelo || "",
          anoFabrico: v.anoFabrico || "",
          tipoCombustivel: v.tipoCombustivel || "Diesel",
          quilometragem: Number(v.quilometragem || 0),
          estadoGeral: v.estadoGeral || "Bom",
          status:
            v.status || (v.quantidadeDisponivel > 0 ? "Disponível" : "Em Uso"),
          departamentoAlocado: v.setor || "",
          seguroValidade: v.seguroValidade,
          inspeccaoValidade: v.inspeccaoValidade,
        }));
      setVehicles(vehicleList);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const stats = {
    total: vehicles.length,
    available: vehicles.filter((v) => v.status === "Disponível").length,
    inUse: vehicles.filter((v) => v.status === "Em Uso").length,
    maintenance: vehicles.filter((v) => v.status === "Manutenção").length,
    expiringSeguro: vehicles.filter((v) => {
      if (!v.seguroValidade) return false;
      const diff = new Date(v.seguroValidade).getTime() - new Date().getTime();
      return diff < 30 * 24 * 60 * 60 * 1000; // less than 30 days
    }).length,
  };

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.matricula.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.modelo.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const tabs = [
    { id: "visao_geral", label: "Visão Geral", icon: LayoutGrid },
    { id: "gestao_frota", label: "Gestão de Frota", icon: Car },
    { id: "gestao_viatura", label: "Gestão de Viatura", icon: ClipboardList },
    { id: "balanco_combustivel", label: "Balanço de Combustível", icon: Fuel },
  ];

  const renderVisaoGeral = () => (
    <div className="space-y-8">
      {/* Mini Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-[#F27405] transition-all">
          <div>
            <p className="text-[10px] font-black text-slate-400  tracking-widest mb-1">
              Total da Frota
            </p>
            <p className="text-3xl font-black text-slate-900">{stats.total}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl text-slate-400 group-hover:bg-[#F27405]/10 group-hover:text-[#F27405] transition-all">
            <Car size={32} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-500 transition-all">
          <div>
            <p className="text-[10px] font-black text-slate-400  tracking-widest mb-1">
              Disponíveis
            </p>
            <p className="text-3xl font-black text-emerald-600">
              {stats.available}
            </p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-500">
            <CheckCircle2 size={32} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-amber-500 transition-all">
          <div>
            <p className="text-[10px] font-black text-slate-400  tracking-widest mb-1">
              Em Manutenção
            </p>
            <p className="text-3xl font-black text-amber-600">
              {stats.maintenance}
            </p>
          </div>
          <div className="bg-amber-50 p-4 rounded-2xl text-amber-500">
            <Settings size={32} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-red-500 transition-all">
          <div>
            <p className="text-[10px] font-black text-slate-400  tracking-widest mb-1">
              Alertas Documentais
            </p>
            <p className="text-3xl font-black text-red-600">
              {stats.expiringSeguro}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-2xl text-red-500">
            <AlertCircle size={32} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Fleet Activities */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 tracking-tighter">
              Actividades da Frota
            </h3>
            <History className="text-slate-400" />
          </div>
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="bg-blue-100 p-2 rounded-xl text-blue-600 mt-1">
                <Fuel size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Abastecimento Registado
                </p>
                <p className="text-xs text-slate-500">
                  Viatura <span className="font-mono">ABC-123-MP</span> • 45
                  Litros Diesel
                </p>
                <p className="text-[10px] text-slate-400 font-bold mt-1 ">
                  HÁ 2 HORAS
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="bg-amber-100 p-2 rounded-xl text-amber-600 mt-1">
                <Settings size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Entrada em Oficina
                </p>
                <p className="text-xs text-slate-500">
                  Viatura <span className="font-mono">Songo-042-T</span> •
                  Revisão Periódica
                </p>
                <p className="text-[10px] text-slate-400 font-bold mt-1 ">
                  HÁ 5 HORAS
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 italic">
              <p className="text-xs">Outras actividades em processamento...</p>
            </div>
          </div>
        </div>

        {/* Fleet Distribution */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
          <BarChart3 className="text-[#F27405] mb-4" size={48} />
          <h3 className="text-xl font-black text-slate-900 tracking-tighter mb-2">
            Distribuição por Categoria
          </h3>
          <p className="text-sm text-slate-500 max-w-xs mb-6 italic">
            A frota do Songo está distribuída por departamentos académicos e
            administrativos para suporte operacional.
          </p>
          <div className="w-full flex gap-2 h-4 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600" style={{ width: "40%" }}></div>
            <div
              className="h-full bg-emerald-500"
              style={{ width: "30%" }}
            ></div>
            <div className="h-full bg-amber-500" style={{ width: "20%" }}></div>
            <div className="h-full bg-red-500" style={{ width: "10%" }}></div>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full mt-6 text-left">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span className="text-[10px] font-bold text-slate-600 ">
                Administração (40%)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <span className="text-[10px] font-bold text-slate-600 ">
                Académico (30%)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
              <span className="text-[10px] font-bold text-slate-600 ">
                Apoio (20%)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-[10px] font-bold text-slate-600 ">
                Outros (10%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGestaoViatura = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
        <div className="relative w-full md:w-96">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Procurar matrícula, marca ou modelo..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm focus:border-[#F27405] outline-none font-bold text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => {
            setSelectedVehicle(null);
            setShowVehicleForm(true);
          }}
          className="w-full md:w-auto bg-[#F27405] text-white px-8 py-4 rounded-2xl font-black tracking-widest text-[10px]  shadow-xl shadow-[#F27405]/20 hover:bg-[#d86604] transition-all flex items-center justify-center gap-2"
        >
          <Plus size={20} /> Registar Nova Viatura
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group hover:border-[#F27405] transition-all"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div
                  className={`px-3 py-1 rounded-lg text-[9px] font-black  tracking-widest ${
                    vehicle.status === "Disponível"
                      ? "bg-emerald-50 text-emerald-600"
                      : vehicle.status === "Em Uso"
                        ? "bg-blue-50 text-blue-600"
                        : vehicle.status === "Manutenção"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-red-50 text-red-600"
                  }`}
                >
                  {vehicle.status}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedVehicle(vehicle);
                      setShowVehicleForm(true);
                    }}
                    className="p-2 text-slate-400 hover:text-[#F27405] hover:bg-slate-50 rounded-lg transition-all"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-2xl text-slate-400 group-hover:bg-[#F27405]/10 group-hover:text-[#F27405] transition-all">
                  <Car size={32} />
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-900 font-mono tracking-widest">
                    {vehicle.matricula}
                  </h4>
                  <p className="text-xs text-slate-500 font-bold  tracking-wider">
                    {vehicle.marca} {vehicle.modelo} ({vehicle.anoFabrico})
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400  tracking-widest">
                    Quilometragem
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    {vehicle.quilometragem.toLocaleString()} Km
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400  tracking-widest">
                    Alocado a
                  </p>
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {vehicle.departamentoAlocado || "Geral"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400  tracking-widest">
                    Próxima Insp.
                  </p>
                  <p
                    className={`text-sm font-bold ${
                      vehicle.inspeccaoValidade &&
                      new Date(vehicle.inspeccaoValidade) < new Date()
                        ? "text-red-500"
                        : "text-slate-900"
                    }`}
                  >
                    {vehicle.inspeccaoValidade
                      ? new Date(vehicle.inspeccaoValidade).toLocaleDateString()
                      : "---"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400  tracking-widest">
                    Combustível
                  </p>
                  <span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 rounded-md  tracking-widest">
                    {vehicle.tipoCombustivel}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filteredVehicles.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 font-bold italic tracking-widest">
            Nenhuma viatura encontrada no inventário.
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex-1 w-full bg-[#f8f9fa] flex flex-col font-sans overflow-hidden">
      {/* Success / Form Modals */}
      <AnimatePresence>
        {showVehicleForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="w-full max-w-5xl my-auto">
              <FichaInventarioVeiculo
                onCancel={() => setShowVehicleForm(false)}
                onSubmit={async (data) => {
                  try {
                    if (selectedVehicle) {
                      await firestoreService.materiais_bens.update(
                        selectedVehicle.id,
                        {
                          ...data,
                          categoria: "Veículo",
                          updatedAt: new Date().toISOString(),
                        },
                      );
                    } else {
                      await firestoreService.materiais_bens.add({
                        ...data,
                        categoria: "Veículo",
                        updatedAt: new Date().toISOString(),
                      });
                    }
                    setShowVehicleForm(false);
                  } catch (e) {
                    console.error(e);
                    alert("Erro ao guardar dados.");
                  }
                }}
                initialData={
                  selectedVehicle
                    ? {
                        matricula: selectedVehicle.matricula,
                        marca: selectedVehicle.marca,
                        modelo: selectedVehicle.modelo,
                        anoFabrico: selectedVehicle.anoFabrico,
                        tipoCombustivel: selectedVehicle.tipoCombustivel,
                        quilometragem: selectedVehicle.quilometragem,
                        estadoGeral: selectedVehicle.estadoGeral,
                        seguroValidade: selectedVehicle.seguroValidade,
                        inspeccaoValidade: selectedVehicle.inspeccaoValidade,
                      }
                    : null
                }
                user={user}
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <div className="bg-white border-b border-slate-200 px-8 py-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <button
            onClick={onBack}
            className="p-3 bg-slate-50 text-slate-400 hover:text-[#F27405] hover:bg-orange-50 rounded-2xl transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter">
              Repartição de Transporte
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-400  tracking-[0.2em]">
                Gestão Operacional de Frota
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-right text-right mr-4">
            <span className="text-xs font-black text-slate-900 tracking-tight">
              {user?.name || "Gestor de Frota"}
            </span>
            <span className="text-[10px] font-bold text-slate-400  tracking-widest">
              Transportes
            </span>
          </div>
          <div className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-[#F27405] shadow-sm">
            <Users size={24} />
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-80 bg-white border-r border-slate-200 flex flex-col p-6 gap-2 shrink-0 overflow-y-auto">
          <div className="mb-6 px-4">
            <p className="text-[10px] font-black text-slate-400  tracking-[0.3em]">
              Painel de Controlo
            </p>
          </div>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-[#F27405] text-white shadow-xl shadow-[#F27405]/20 translate-x-2"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <tab.icon
                size={20}
                className={activeTab === tab.id ? "opacity-100" : "opacity-40"}
              />
              <span className="text-sm tracking-tight">{tab.label}</span>
            </button>
          ))}

          <div className="mt-auto pt-8 border-t border-slate-50">
            <div className="bg-slate-50 p-6 rounded-3xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Gauge size={16} className="text-[#F27405]" />
                </div>
                <span className="text-[10px] font-black text-slate-900  tracking-widest">
                  Resumo Operacional
                </span>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 ">
                  <span>Eficiência</span>
                  <span className="text-emerald-600">92%</span>
                </div>
                <div className="w-full h-1.5 bg-white rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: "92%" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-12 scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "visao_geral" && renderVisaoGeral()}
              {activeTab === "gestao_frota" && renderVisaoGeral()}{" "}
              {/* Simplified for now as it's an overview */}
              {activeTab === "gestao_viatura" && renderGestaoViatura()}
              {activeTab === "balanco_combustivel" && (
                <div className="max-w-[297mm] mx-auto scale-90 -mt-10 origin-top">
                  <BalancoCombustivelView
                    user={user}
                    onBack={() => setActiveTab("visao_geral")}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

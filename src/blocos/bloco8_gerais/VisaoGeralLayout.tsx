import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  FileText,
  ArrowLeft,
  ChevronRight,
  LayoutGrid,
  Briefcase,
  GraduationCap,
  Microscope,
  UserCheck,
  UserX,
  Archive,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { firestoreService } from "../../lib/firestoreService";
import { EFETIVO_GERAL_DATA } from "../../constants/colaboradoresList";
import { MatrixActivity } from "../../types";
import { getAuthorizedActivities, getRoles } from "../../lib/auth";
import { isValidActivity } from "../bloco5_sistema/plano/PlanoHelpers";
import {
  checkIsSystemAdmin,
  checkIsQuadro,
  hasChefiaPosition,
} from "../../lib/utils";

interface VisaoGeralLayoutProps {
  title: string;
  user?: any;
  colaboradores?: any[];
  onExploreColaboradores?: (filter?: any) => void;
}

type DrillDownView =
  "overview" | "direcoes" | "departamentos" | "reparticoes" | "actividades";

export default function VisaoGeralLayout({
  title,
  user,
  colaboradores,
  onExploreColaboradores,
}: VisaoGeralLayoutProps) {
  const [view, setView] = useState<DrillDownView>("overview");
  const [activities, setActivities] = useState<MatrixActivity[]>([]);
  const [selectedDirecao, setSelectedDirecao] = useState<string | null>(null);
  const [selectedDepartamento, setSelectedDepartamento] = useState<
    string | null
  >(null);
  const [selectedReparticao, setSelectedReparticao] = useState<string | null>(
    null,
  );

  const roles = useMemo(() => {
    if (!user)
      return {
        isDG: false,
        isDC: false,
        isCD: false,
        isCR: false,
        isDCC: false,
        isConsRep: false,
        isConsAdm: false,
        isConsTec: false,
        isGDG: false,
      };
    const t = user.title || user.cargo || user.cargoChefia || "";
    return getRoles(t);
  }, [user]);

  const isSetorUser = useMemo(() => {
    if (!user) return false;
    const t = (
      user.title ||
      user.cargo ||
      user.cargoChefia ||
      ""
    ).toLowerCase();

    const isBoss =
      roles.isDG ||
      roles.isDC ||
      roles.isCD ||
      roles.isCR ||
      roles.isDCC ||
      roles.isConsRep ||
      roles.isConsAdm ||
      roles.isConsTec ||
      roles.isGDG;
    const isSystemAdmin =
      (user.role || "").toLowerCase() === "admin" ||
      (user.role || "").toLowerCase() === "administrador";
    const isPessoal =
      t.includes("pessoal") ||
      t.includes("recursos humanos") ||
      (user.reparticao || "").toLowerCase().includes("pessoal");

    return !isBoss && !isSystemAdmin && !isPessoal;
  }, [user, roles]);

  useEffect(() => {
    const unsub = firestoreService.matrixActivities.subscribe((data: any[]) => {
      setActivities(data || []);
    });
    return () => unsub();
  }, []);

  // Filtrar actividades pela jurisdição do utilizador
  const authorizedActivities = useMemo(() => {
    const valid = (activities || []).filter(isValidActivity);
    return getAuthorizedActivities(valid, user);
  }, [activities, user]);

  const direcoes = useMemo(() => {
    const dirs = new Set<string>();
    authorizedActivities.forEach((a) => {
      if (a.direcao) dirs.add(a.direcao);
    });
    return Array.from(dirs).sort();
  }, [authorizedActivities]);

  const departamentos = useMemo(() => {
    if (!selectedDirecao) return [];
    const depts = new Set<string>();
    authorizedActivities
      .filter((a) => a.direcao === selectedDirecao)
      .forEach((a) => {
        if (a.departamento) depts.add(a.departamento);
      });
    return Array.from(depts).sort();
  }, [authorizedActivities, selectedDirecao]);

  const reparticoes = useMemo(() => {
    if (!selectedDepartamento) return [];
    const reps = new Set<string>();
    authorizedActivities
      .filter((a) => a.departamento === selectedDepartamento)
      .forEach((a) => {
        const rep = a.reparticao || a.setor || "Geral";
        reps.add(rep);
      });
    return Array.from(reps).sort();
  }, [authorizedActivities, selectedDepartamento]);

  const filteredActivities = useMemo(() => {
    return authorizedActivities.filter((a) => {
      const matchesDir = selectedDirecao ? a.direcao === selectedDirecao : true;
      const matchesDept = selectedDepartamento
        ? a.departamento === selectedDepartamento
        : true;
      const matchesRep = selectedReparticao
        ? selectedReparticao === "Geral"
          ? !a.reparticao && !a.setor
          : a.reparticao === selectedReparticao ||
            a.setor === selectedReparticao
        : true;
      return matchesDir && matchesDept && matchesRep;
    });
  }, [
    authorizedActivities,
    selectedDirecao,
    selectedDepartamento,
    selectedReparticao,
  ]);

  const efetivoSummary = useMemo(() => {
    const docentes = EFETIVO_GERAL_DATA.filter(
      (c) => c.tipo === "Docente",
    ).length;
    const cta = EFETIVO_GERAL_DATA.filter((c) => c.tipo === "CTA").length;
    const investigadores = EFETIVO_GERAL_DATA.filter((c) =>
      (c.tipo || "").toLowerCase().includes("investig"),
    ).length;

    return [
      { label: "Corpo Docente", value: docentes, icon: "GraduationCap" },
      { label: "Corpo CTA", value: cta, icon: "Briefcase" },
      { label: "Investigadores", value: investigadores, icon: "Microscope" },
    ];
  }, []);

  const dataset = useMemo(() => {
    return colaboradores && colaboradores.length > 0 ? colaboradores : EFETIVO_GERAL_DATA;
  }, [colaboradores]);

  const filteredDataset = useMemo(() => {
    if (!selectedDirecao && !selectedDepartamento && !selectedReparticao) return dataset;
    return dataset.filter((c) => {
      const matchesDir = selectedDirecao
        ? (c.direcao || "").toLowerCase().includes(selectedDirecao.toLowerCase()) ||
          (c.unidade || "").toLowerCase().includes(selectedDirecao.toLowerCase())
        : true;
      const matchesDept = selectedDepartamento
        ? (c.departamento || "").toLowerCase().includes(selectedDepartamento.toLowerCase())
        : true;
      const matchesRep = selectedReparticao
        ? (c.reparticao || c.sector || "").toLowerCase().includes(selectedReparticao.toLowerCase())
        : true;
      return matchesDir && matchesDept && matchesRep;
    });
  }, [dataset, selectedDirecao, selectedDepartamento, selectedReparticao]);

  const isColaboradorInactive = (estado?: string) => {
    if (!estado) return false;
    const e = estado.toLowerCase().trim();
    return [
      "transferido",
      "falecido",
      "reformado",
      "demitido",
      "rescisao",
      "licenca",
      "eliminado",
    ].includes(e);
  };

  const getGenderMetrics = (list: any[]) => {
    let H = 0;
    let M = 0;
    list.forEach((c) => {
      const g = (c.genero || "M").toString().toUpperCase().trim();
      if (g.startsWith("F")) {
        M++;
      } else {
        H++;
      }
    });
    return { H, M, total: list.length };
  };

  const statsMetrics = useMemo(() => {
    const listDocenteQuadro = filteredDataset.filter((c) => {
      const isAdmin = checkIsSystemAdmin(c);
      if (isAdmin) return false;
      return (
        (c.tipo || "").toLowerCase() !== "cta" &&
        checkIsQuadro(c) === true &&
        !isColaboradorInactive(c.estado)
      );
    });

    const listDocenteNaoQuadro = filteredDataset.filter((c) => {
      const isAdmin = checkIsSystemAdmin(c);
      if (isAdmin) return false;
      return (
        (c.tipo || "").toLowerCase() !== "cta" &&
        checkIsQuadro(c) === false &&
        !isColaboradorInactive(c.estado)
      );
    });

    const listCTAQuadro = filteredDataset.filter((c) => {
      const isAdmin = checkIsSystemAdmin(c);
      if (isAdmin) return false;
      return (
        (c.tipo || "").toLowerCase() === "cta" &&
        checkIsQuadro(c) === true &&
        !isColaboradorInactive(c.estado)
      );
    });

    const listCTANaoQuadro = filteredDataset.filter((c) => {
      const isAdmin = checkIsSystemAdmin(c);
      if (isAdmin) return false;
      return (
        (c.tipo || "").toLowerCase() === "cta" &&
        checkIsQuadro(c) === false &&
        !isColaboradorInactive(c.estado)
      );
    });

    const listForaSongo = filteredDataset.filter((c) => isColaboradorInactive(c.estado));

    const listChefiaDocentes = filteredDataset.filter(
      (c) =>
        hasChefiaPosition(c) &&
        (c.tipo || "").toLowerCase() !== "cta" &&
        !isColaboradorInactive(c.estado)
    );

    const listChefiaCTA = filteredDataset.filter(
      (c) =>
        hasChefiaPosition(c) &&
        (c.tipo || "").toLowerCase() === "cta" &&
        !isColaboradorInactive(c.estado)
    );

    return {
      docenteQuadro: getGenderMetrics(listDocenteQuadro),
      docenteNaoQuadro: getGenderMetrics(listDocenteNaoQuadro),
      ctaQuadro: getGenderMetrics(listCTAQuadro),
      ctaNaoQuadro: getGenderMetrics(listCTANaoQuadro),
      foraSongo: getGenderMetrics(listForaSongo),
      chefiaDocentes: getGenderMetrics(listChefiaDocentes),
      chefiaCTA: getGenderMetrics(listChefiaCTA),
    };
  }, [filteredDataset]);

  const renderOverview = () => {
    const isPessoal = title.toLowerCase().includes("pessoal") || title.toLowerCase().includes("recursos humanos") || title.toLowerCase().includes("rh");

    if (isPessoal) {
      const allDirecoes = Array.from(new Set(dataset.map(c => c.direcao || c.unidade).filter(Boolean))).sort();
      const allDepartamentos = selectedDirecao 
        ? Array.from(new Set(dataset.filter(c => (c.direcao === selectedDirecao || c.unidade === selectedDirecao)).map(c => c.departamento).filter(Boolean))).sort()
        : [];

      return (
        <div className="flex flex-col gap-8">
          {/* Seletor de Unidade para Repartição de Pessoal */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 mx-4 max-w-[1600px] xl:mx-auto w-full shadow-sm">
            <div className="flex flex-col md:flex-row items-end gap-4">
              <div className="flex-1 w-full">
                <label className="block text-[10px] font-black text-slate-400  tracking-widest mb-2 px-1">
                  Filtrar por Direção / Unidade Orgânica
                </label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={selectedDirecao || ""}
                  onChange={(e) => {
                    setSelectedDirecao(e.target.value || null);
                    setSelectedDepartamento(null);
                  }}
                >
                  <option value="">Todas as Direções</option>
                  {allDirecoes.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {selectedDirecao && allDepartamentos.length > 0 && (
                <div className="flex-1 w-full animate-fade-in-right">
                  <label className="block text-[10px] font-black text-slate-400  tracking-widest mb-2 px-1">
                    Filtrar por Departamento
                  </label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    value={selectedDepartamento || ""}
                    onChange={(e) => setSelectedDepartamento(e.target.value || null)}
                  >
                    <option value="">Todos os Departamentos</option>
                    {allDepartamentos.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              )}

              {(selectedDirecao || selectedDepartamento) && (
                <button
                  onClick={() => {
                    setSelectedDirecao(null);
                    setSelectedDepartamento(null);
                  }}
                  className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-black  tracking-widest hover:bg-slate-200 transition-all"
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 p-4 max-w-[1600px] mx-auto w-full">
            {/* Card 1: DOCENTE (QUADRO) */}
            <div
              onClick={() => onExploreColaboradores && onExploreColaboradores({ tipo: "Docente", efetivo: true, direcao: selectedDirecao, departamento: selectedDepartamento })}
              className="relative bg-white rounded-3xl p-6 border border-slate-300 flex flex-col items-center justify-between text-center hover:shadow-lg hover:scale-102 cursor-pointer transition-all duration-300 min-h-[220px]"
            >
              {/* Badge no topo direito */}
              <div className="absolute top-4 right-4 bg-blue-50 text-blue-600 font-extrabold text-[11px] px-2 py-0.5 rounded-full min-w-6 h-6 flex items-center justify-center">
                {statsMetrics.docenteQuadro.total}
              </div>
              {/* Ícone no topo */}
              <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl mb-4">
                <UserCheck size={24} />
              </div>
              {/* Título */}
              <h3 className="text-[11px] font-black text-slate-800 tracking-tight leading-tight  mb-4 h-8 flex items-center justify-center">
                Docente (Quadro)
              </h3>
              {/* Barra inferior */}
              <div className="w-full text-[10px] font-extrabold text-blue-700 bg-blue-50/50 py-1.5 px-3 rounded-xl border border-blue-100/60 flex justify-between items-center">
                <span>H: {statsMetrics.docenteQuadro.H}</span>
                <span>M: {statsMetrics.docenteQuadro.M}</span>
                <span className="font-black text-blue-900">Total: {statsMetrics.docenteQuadro.total}</span>
              </div>
            </div>

            {/* Card 2: DOCENTE (FORA DO QUADRO) */}
            <div
              onClick={() => onExploreColaboradores && onExploreColaboradores({ tipo: "Docente", efetivo: false, direcao: selectedDirecao, departamento: selectedDepartamento })}
              className="relative bg-white rounded-3xl p-6 border border-slate-300 flex flex-col items-center justify-between text-center hover:shadow-lg hover:scale-102 cursor-pointer transition-all duration-300 min-h-[220px]"
            >
              {/* Badge no topo direito */}
              <div className="absolute top-4 right-4 bg-orange-50 text-orange-600 font-extrabold text-[11px] px-2 py-0.5 rounded-full min-w-6 h-6 flex items-center justify-center">
                {statsMetrics.docenteNaoQuadro.total}
              </div>
              {/* Ícone no topo */}
              <div className="p-3.5 bg-orange-50 text-orange-600 rounded-2xl mb-4">
                <UserX size={24} />
              </div>
              {/* Título */}
              <h3 className="text-[11px] font-black text-slate-800 tracking-tight leading-tight  mb-4 h-8 flex items-center justify-center">
                Docente (Fora do Quadro)
              </h3>
              {/* Barra inferior */}
              <div className="w-full text-[10px] font-extrabold text-orange-700 bg-orange-50/50 py-1.5 px-3 rounded-xl border border-orange-100/60 flex justify-between items-center">
                <span>H: {statsMetrics.docenteNaoQuadro.H}</span>
                <span>M: {statsMetrics.docenteNaoQuadro.M}</span>
                <span className="font-black text-orange-900">Total: {statsMetrics.docenteNaoQuadro.total}</span>
              </div>
            </div>

            {/* Card 3: CTA (QUADRO) */}
            <div
              onClick={() => onExploreColaboradores && onExploreColaboradores({ tipo: "CTA", efetivo: true, direcao: selectedDirecao, departamento: selectedDepartamento })}
              className="relative bg-white rounded-3xl p-6 border border-slate-300 flex flex-col items-center justify-between text-center hover:shadow-lg hover:scale-102 cursor-pointer transition-all duration-300 min-h-[220px]"
            >
              {/* Badge no topo direito */}
              <div className="absolute top-4 right-4 bg-green-50 text-green-600 font-extrabold text-[11px] px-2 py-0.5 rounded-full min-w-6 h-6 flex items-center justify-center">
                {statsMetrics.ctaQuadro.total}
              </div>
              {/* Ícone no topo */}
              <div className="p-3.5 bg-green-50 text-green-600 rounded-2xl mb-4">
                <Briefcase size={24} />
              </div>
              {/* Título */}
              <h3 className="text-[11px] font-black text-slate-800 tracking-tight leading-tight  mb-4 h-8 flex items-center justify-center">
                CTA (Quadro)
              </h3>
              {/* Barra inferior */}
              <div className="w-full text-[10px] font-extrabold text-green-700 bg-green-50/50 py-1.5 px-3 rounded-xl border border-green-100/60 flex justify-between items-center">
                <span>H: {statsMetrics.ctaQuadro.H}</span>
                <span>M: {statsMetrics.ctaQuadro.M}</span>
                <span className="font-black text-green-900">Total: {statsMetrics.ctaQuadro.total}</span>
              </div>
            </div>

            {/* Card 4: CTA (FORA DO QUADRO) */}
            <div
              onClick={() => onExploreColaboradores && onExploreColaboradores({ tipo: "CTA", efetivo: false, direcao: selectedDirecao, departamento: selectedDepartamento })}
              className="relative bg-white rounded-3xl p-6 border border-slate-300 flex flex-col items-center justify-between text-center hover:shadow-lg hover:scale-102 cursor-pointer transition-all duration-300 min-h-[220px]"
            >
              {/* Badge no topo direito */}
              <div className="absolute top-4 right-4 bg-amber-50 text-amber-600 font-extrabold text-[11px] px-2 py-0.5 rounded-full min-w-6 h-6 flex items-center justify-center">
                {statsMetrics.ctaNaoQuadro.total}
              </div>
              {/* Ícone no topo */}
              <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl mb-4">
                <Archive size={24} />
              </div>
              {/* Título */}
              <h3 className="text-[11px] font-black text-slate-800 tracking-tight leading-tight  mb-4 h-8 flex items-center justify-center">
                CTA (Fora do Quadro)
              </h3>
              {/* Barra inferior */}
              <div className="w-full text-[10px] font-extrabold text-amber-700 bg-amber-50/50 py-1.5 px-3 rounded-xl border border-amber-100/60 flex justify-between items-center">
                <span>H: {statsMetrics.ctaNaoQuadro.H}</span>
                <span>M: {statsMetrics.ctaNaoQuadro.M}</span>
                <span className="font-black text-amber-900">Total: {statsMetrics.ctaNaoQuadro.total}</span>
              </div>
            </div>

            {/* Card 5: COLABORADORES FORA DO Songo */}
            <div
              onClick={() => onExploreColaboradores && onExploreColaboradores({ foraSongo: true, direcao: selectedDirecao, departamento: selectedDepartamento })}
              className="relative bg-white rounded-3xl p-6 border border-slate-300 flex flex-col items-center justify-between text-center hover:shadow-lg hover:scale-102 cursor-pointer transition-all duration-300 min-h-[220px]"
            >
              {/* Badge no topo direito */}
              <div className="absolute top-4 right-4 bg-rose-50 text-rose-600 font-extrabold text-[11px] px-2 py-0.5 rounded-full min-w-6 h-6 flex items-center justify-center">
                {statsMetrics.foraSongo.total}
              </div>
              {/* Ícone no topo */}
              <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl mb-4">
                <Briefcase size={24} />
              </div>
              {/* Título */}
              <h3 className="text-[11px] font-black text-slate-800 tracking-tight leading-tight  mb-4 h-8 flex items-center justify-center">
                Colaboradores Fora do Songo
              </h3>
              {/* Barra inferior */}
              <div className="w-full text-[10px] font-extrabold text-rose-700 bg-rose-50/50 py-1.5 px-3 rounded-xl border border-rose-100/60 flex justify-between items-center">
                <span>H: {statsMetrics.foraSongo.H}</span>
                <span>M: {statsMetrics.foraSongo.M}</span>
                <span className="font-black text-rose-900">Total: {statsMetrics.foraSongo.total}</span>
              </div>
            </div>

            {/* Card 6: COLABORADORES COM CARGO DE CHEFIA */}
            <div
              onClick={() => onExploreColaboradores && onExploreColaboradores({ chefia: true, direcao: selectedDirecao, departamento: selectedDepartamento })}
              className="relative bg-white rounded-3xl p-6 border border-slate-300 flex flex-col items-center justify-between text-center hover:shadow-lg hover:scale-102 cursor-pointer transition-all duration-300 min-h-[220px]"
            >
              {/* Badge no topo direito */}
              <div className="absolute top-4 right-4 bg-purple-50 text-purple-600 font-extrabold text-[11px] px-2 py-0.5 rounded-full min-w-6 h-6 flex items-center justify-center">
                {statsMetrics.chefiaDocentes.total + statsMetrics.chefiaCTA.total}
              </div>
              {/* Ícone no topo */}
              <div className="p-3.5 bg-purple-50 text-purple-600 rounded-2xl mb-4">
                <ShieldCheck size={24} />
              </div>
              {/* Título */}
              <h3 className="text-[11px] font-black text-slate-800 tracking-tight leading-tight  mb-4 h-8 flex items-center justify-center">
                Colaboradores com Cargo de Chefia
              </h3>
              {/* Caixa com as duas linhas */}
              <div className="w-full flex flex-col gap-1.5 text-[9px] font-bold mt-1 bg-purple-50/50 p-2.5 rounded-xl border border-purple-100/60 text-purple-950">
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    onExploreColaboradores && onExploreColaboradores({ chefiaDocente: true, direcao: selectedDirecao, departamento: selectedDepartamento });
                  }}
                  className="flex justify-between items-center border-b border-purple-100/60 pb-1 cursor-pointer hover:bg-purple-100 p-1 rounded transition-all"
                >
                  <span className="font-black text-purple-800  tracking-wider">Docente:</span>
                  <span className="font-mono text-slate-600">
                    H: {statsMetrics.chefiaDocentes.H} | M: {statsMetrics.chefiaDocentes.M} | Total: {statsMetrics.chefiaDocentes.total}
                  </span>
                </div>
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    onExploreColaboradores && onExploreColaboradores({ chefiaCTA: true, direcao: selectedDirecao, departamento: selectedDepartamento });
                  }}
                  className="flex justify-between items-center pt-0.5 cursor-pointer hover:bg-purple-100 p-1 rounded transition-all"
                >
                  <span className="font-black text-purple-800  tracking-wider">CTA:</span>
                  <span className="font-mono text-slate-600">
                    H: {statsMetrics.chefiaCTA.H} | M: {statsMetrics.chefiaCTA.M} | Total: {statsMetrics.chefiaCTA.total}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const containerClass = isSetorUser
      ? "md:grid-cols-1 max-w-xl mx-auto"
      : "md:grid-cols-2 max-w-5xl mx-auto";

    return (
      <div className={`grid grid-cols-1 ${containerClass} gap-6 p-2`}>
        {/* Card Efetivo Geral */}
        {!isSetorUser && (
          <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden transition-all duration-300">
            <div className="flex items-center justify-between mb-10">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <Users size={32} />
              </div>
              <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 bg-slate-50 px-4 py-2 rounded-full ">
                Efetivo Geral
              </span>
            </div>

            <div className="space-y-8 flex-grow">
              {efetivoSummary.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between group cursor-default"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      {item.icon === "Briefcase" && <Briefcase size={18} />}
                      {item.icon === "GraduationCap" && (
                        <GraduationCap size={18} />
                      )}
                      {item.icon === "Microscope" && <Microscope size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 leading-none mb-1">
                        {item.label}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium  tracking-wider">
                        Songo 2026
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900 tracking-tighter leading-none mb-1 text-2xl">
                      {item.value}
                    </p>
                    <div className="w-8 h-1 bg-blue-100 ml-auto rounded-full group-hover:w-12 transition-all"></div>
                  </div>
                </div>
              ))}
            </div>

            {onExploreColaboradores && (
              <button
                onClick={() => onExploreColaboradores()}
                className="mt-10 py-5 text-xs w-full bg-slate-900 text-white rounded-2xl font-black tracking-[0.2em] hover:bg-blue-600 transition-all  flex items-center justify-center gap-3 group"
              >
                Explorar Colaboradores
                <ChevronRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
            )}
          </div>
        )}

        {/* Card Planos de Actividades */}
        <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden transition-all duration-300">
          <div className="flex items-center justify-between mb-10">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
              <FileText size={32} />
            </div>
            <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 bg-slate-50 px-4 py-2 rounded-full ">
              Actividades
            </span>
          </div>

          <div className="flex-grow flex flex-col justify-center items-center text-center">
            <h3 className="text-2xl mb-4 font-black text-slate-900 tracking-tight ">
              Planos de Actividades
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-10 max-w-[280px] font-medium">
              Visualize e acompanhe o progresso das actividades por direção,
              departamento e setor.
            </p>

            <div className="w-full bg-slate-50 rounded-2xl p-8 mb-10 border border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black text-slate-400 tracking-widest ">
                  Total Planificado
                </span>
                <span className="font-black text-amber-600 text-3xl">
                  {authorizedActivities.length}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-amber-400 rounded-full w-2/3 shadow-sm"></div>
              </div>
            </div>

            <button
              onClick={() => setView("direcoes")}
              className="w-full py-6 text-sm bg-amber-500 text-white rounded-2xl font-black tracking-[0.2em] hover:bg-amber-600 transition-all  flex items-center justify-center gap-3 group shadow-lg shadow-amber-200"
            >
              Ver Planos de Actividades
              <ChevronRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDirecoes = () => (
    <div className="space-y-8 p-2">
      <div className="flex items-center justify-between border-b border-slate-100 pb-6">
        <button
          onClick={() => setView("overview")}
          className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors font-black text-[10px]  tracking-widest"
        >
          <ArrowLeft size={16} /> Voltar
        </button>
        <div className="text-right">
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter ">
            Planos por Direção
          </h2>
          <p className="text-[10px] font-bold text-slate-400 tracking-widest  mt-1">
            Selecione uma Direção
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {direcoes.map((dir) => (
          <button
            key={dir}
            onClick={() => {
              setSelectedDirecao(dir);
              setView("departamentos");
            }}
            className="bg-white p-8 rounded-3xl border-2 border-slate-50 shadow-sm hover:border-blue-500 hover:shadow-xl transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <LayoutGrid size={28} />
              </div>
              <div className="text-left">
                <span className="font-black text-slate-900 tracking-tight text-lg block">
                  {dir}
                </span>
                <span className="text-[10px] font-bold text-slate-400  tracking-widest">
                  DIREÇÃO CENTRÁL
                </span>
              </div>
            </div>
            <ChevronRight
              size={24}
              className="text-slate-200 group-hover:text-blue-500 group-hover:translate-x-2 transition-all"
            />
          </button>
        ))}
      </div>
    </div>
  );

  const renderDepartamentos = () => (
    <div className="space-y-8 p-2">
      <div className="flex items-center justify-between border-b border-slate-100 pb-6">
        <button
          onClick={() => setView("direcoes")}
          className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors font-black text-[10px]  tracking-widest"
        >
          <ArrowLeft size={16} /> Voltar
        </button>
        <div className="text-right">
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter ">
            {selectedDirecao}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 tracking-widest  mt-1">
            Selecione o Departamento
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {departamentos.map((dept) => (
          <button
            key={dept}
            onClick={() => {
              setSelectedDepartamento(dept);
              setView("reparticoes");
            }}
            className="bg-white p-8 rounded-3xl border-2 border-slate-50 shadow-sm hover:border-blue-500 hover:shadow-xl transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <LayoutGrid size={28} />
              </div>
              <div className="text-left">
                <span className="font-black text-slate-900 tracking-tight text-lg block">
                  {dept}
                </span>
                <span className="text-[10px] font-bold text-slate-400  tracking-widest">
                  DEPARTAMENTO
                </span>
              </div>
            </div>
            <ChevronRight
              size={24}
              className="text-slate-200 group-hover:text-blue-500 group-hover:translate-x-2 transition-all"
            />
          </button>
        ))}
      </div>
    </div>
  );

  const renderReparticoes = () => (
    <div className="space-y-8 p-2">
      <div className="flex items-center justify-between border-b border-slate-100 pb-6">
        <button
          onClick={() => setView("departamentos")}
          className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors font-black text-[10px]  tracking-widest"
        >
          <ArrowLeft size={16} /> Voltar
        </button>
        <div className="text-right">
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter ">
            {selectedDepartamento}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 tracking-widest  mt-1">
            Selecione a Repartição / Setor
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reparticoes.map((rep) => (
          <button
            key={rep}
            onClick={() => {
              setSelectedReparticao(rep);
              setView("actividades");
            }}
            className="bg-white p-8 rounded-3xl border-2 border-slate-50 shadow-sm hover:border-blue-500 hover:shadow-xl transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <LayoutGrid size={28} />
              </div>
              <div className="text-left">
                <span className="font-black text-slate-900 tracking-tight text-lg block">
                  {rep}
                </span>
                <span className="text-[10px] font-bold text-slate-400  tracking-widest">
                  REPARTIÇÃO / SETOR
                </span>
              </div>
            </div>
            <ChevronRight
              size={24}
              className="text-slate-200 group-hover:text-blue-500 group-hover:translate-x-2 transition-all"
            />
          </button>
        ))}
      </div>
    </div>
  );

  const renderActividades = () => (
    <div className="space-y-8 p-2">
      <div className="flex items-center justify-between border-b border-slate-100 pb-6">
        <button
          onClick={() => setView("reparticoes")}
          className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors font-black text-[10px]  tracking-widest"
        >
          <ArrowLeft size={16} /> Voltar
        </button>
        <div className="text-right">
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter ">
            {selectedReparticao}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 tracking-widest  mt-1">
            Resumo das Actividades
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black tracking-[0.2em] text-slate-400 ">
                <th className="p-6 text-left w-20">N/O</th>
                <th className="p-6 text-left w-40">Código da Actividade</th>
                <th className="p-6 text-left w-60">Setor</th>
                <th className="p-6 text-left">Nome da Actividade</th>
                <th className="p-6 text-center w-40">Mês da Realização</th>
                <th className="p-6 text-right w-44">Orçamento Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredActivities.length > 0 ? (
                filteredActivities.map((activity, idx) => (
                  <tr
                    key={activity.id}
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-6 text-sm font-bold text-slate-400">
                      {(() => {
                        const code =
                          activity.codigoActividade ||
                          activity.referencia ||
                          "";
                        const match = code.match(/(\d+)$/);
                        if (match) {
                          return parseInt(match[1], 10);
                        }
                        if (activity.no) {
                          const parsedNo = parseInt(activity.no, 10);
                          if (!isNaN(parsedNo)) return parsedNo;
                          return activity.no;
                        }
                        return idx + 1;
                      })()}
                    </td>
                    <td className="p-6">
                      <span className="text-[11px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full  tracking-wider">
                        {activity.codigoActividade ||
                          activity.referencia ||
                          "N/A"}
                      </span>
                    </td>
                    <td className="p-6">
                      <span className="text-[11px] font-bold text-slate-600  tracking-tight">
                        {activity.setor || activity.reparticao || "Geral"}
                      </span>
                    </td>
                    <td className="p-6">
                      <span className="text-sm font-black text-slate-900 tracking-tight block group-hover:text-blue-600 transition-colors">
                        {activity.title || activity.designacao}
                      </span>
                    </td>
                    <td className="p-6 text-center">
                      <span className="text-xs font-bold text-slate-600 ">
                        {activity.mesRealizacao || activity.dataMes || "-"}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <span className="text-sm font-black text-slate-900 tracking-tight">
                        {new Intl.NumberFormat("pt-MZ", {
                          style: "currency",
                          currency: "MZN",
                        }).format(activity.valor || activity.valorTotal || 0)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                        <FileText size={32} />
                      </div>
                      <p className="text-slate-400 font-medium italic">
                        Nenhuma actividade encontrada para esta seleção.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full font-sans">
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {view === "overview" && renderOverview()}
          {view === "direcoes" && renderDirecoes()}
          {view === "departamentos" && renderDepartamentos()}
          {view === "reparticoes" && renderReparticoes()}
          {view === "actividades" && renderActividades()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

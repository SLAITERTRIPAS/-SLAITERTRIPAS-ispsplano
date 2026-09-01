import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  GraduationCap,
  Activity,
  ArrowLeft,
  X,
  DollarSign,
  FileText,
  Landmark,
  Wallet,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { CardKPI } from "../../components/shared/CardKPI";
import { firestoreService } from "../../lib/firestoreService";
import { EFETIVO_GERAL_DATA } from "../../constants/colaboradoresList";
import {
  checkIsQuadro,
  classifyTipo,
  classifyColaboradorByVínculo,
  mergeColaboradores,
  toTitleCase as tc,
} from "../../lib/utils";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

const getStudentLevels = (homens: number, mulheres: number) => {
  const pHoch = [0.28, 0.24, 0.2, 0.16, 0.12]; // sum to 1.0
  const pMulher = [0.3, 0.24, 0.2, 0.16, 0.1]; // sum to 1.0

  let hSum = 0;
  let mSum = 0;

  return Array.from({ length: 5 }, (_, i) => {
    const levelNum = i + 1;
    let h = Math.round(homens * pHoch[i]);
    let m = Math.round(mulheres * pMulher[i]);

    if (i === 4) {
      h = Math.max(0, homens - hSum);
      m = Math.max(0, mulheres - mSum);
    } else {
      hSum += h;
      mSum += m;
    }

    return {
      nivel: `Nível ${levelNum}`,
      homens: h,
      mulheres: m,
      total: h + m,
    };
  });
};

export default function BoardOverview({ boardName, onNavigate }: { boardName: string; onNavigate?: (item: string) => void }) {
  const [viewState, setViewState] = useState<
    | "overview"
    | "colaboradores"
    | "docentes"
    | "cta"
    | "estudantes"
    | "actividades"
    | "recursos_financeiros"
    | "relatorios"
  >("overview");
  const [colaboradores, setColaboradores] = useState<any[]>(EFETIVO_GERAL_DATA);
  const [estudantes, setEstudantes] = useState<any[]>([]);
  const [actividades, setActividades] = useState<any[]>([]);
  const [bolsas, setBolsas] = useState<any[]>([]);
  const [financialData, setFinancialData] = useState<any[]>([]);
  const [selectedCourseForLevels, setSelectedCourseForLevels] = useState<{
    curso: string;
    homens: number;
    mulheres: number;
  } | null>(null);

  useEffect(() => {
    const unsubColab = firestoreService.colaboradores.subscribe(
      (data: any[]) => {
        setColaboradores(mergeColaboradores(data));
      },
    );
    const unsubEst = firestoreService.efetivo_escolar.subscribe(setEstudantes);
    const unsubAtiv = firestoreService.actividades.subscribe(setActividades);
    const unsubBolsa = firestoreService.bolsas.subscribe(setBolsas);
    const unsubFin = firestoreService.financialData.subscribe(setFinancialData);
    return () => {
      unsubColab();
      unsubEst();
      unsubAtiv();
      unsubBolsa();
      unsubFin();
    };
  }, []);

  if (viewState === "colaboradores") {
    const hasInsertedData = colaboradores && colaboradores.length > 0;

    if (!hasInsertedData) {
      return (
        <div className="w-full space-y-6 pb-10 animate-fade-in max-w-[95vw] mx-auto">
          <button
            onClick={() => setViewState("overview")}
            className="flex items-center gap-2 text-blue-600 hover:underline font-medium"
          >
            <ArrowLeft size={16} /> Voltar
          </button>

          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 text-center max-w-xl mx-auto space-y-4 shadow-sm mt-8">
            <h3 className="font-bold text-amber-800 text-lg">
              Informação Indisponível
            </h3>
            <p className="text-amber-700 text-sm leading-relaxed">
              Os dados do <strong>Corpo Docente</strong> e do{" "}
              <strong>Corpo Técnico Administrativo</strong> serão lançados no
              módulo do <strong>RH (Repartição de Pessoal)</strong>.
            </p>
            <p className="text-amber-600 text-xs font-semibold tracking-wider bg-amber-100/50 py-2 px-3 rounded-xl inline-block">
              Esta informação só estará visível na Visão Geral quando a
              Repartição de Pessoal inserir os dados dos colaboradores no
              sistema.
            </p>
          </div>
        </div>
      );
    }

    const docentesH = colaboradores.filter(
      (c) => c.tipo === "Docente" && c.genero === "M",
    ).length;
    const docentesM = colaboradores.filter(
      (c) => c.tipo === "Docente" && c.genero === "F",
    ).length;
    const docentesTotal = docentesH + docentesM;

    const ctaH = colaboradores.filter(
      (c) => c.tipo === "CTA" && c.genero === "M",
    ).length;
    const ctaM = colaboradores.filter(
      (c) => c.tipo === "CTA" && c.genero === "F",
    ).length;
    const ctaTotal = ctaH + ctaM;

    return (
      <div className="page-layout space-y-6 pb-10 animate-fade-in">
        <button
          onClick={() => setViewState("overview")}
          className="flex items-center gap-2 text-blue-600 hover:underline font-medium"
        >
          <ArrowLeft size={16} /> Voltar para Visão Geral
        </button>

        <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-2">
          Distribuição do Efetivo Geral - {boardName}
        </h2>

        <div className="flex flex-col md:flex-row gap-8 justify-center items-center py-6">
          {/* Card 1: CORPO DOCENTE */}
          <button
            onClick={() => setViewState("docentes")}
            className="bg-white border-2 border-slate-100/90 rounded-3xl p-8 flex flex-col w-full max-w-sm min-h-[16rem] shadow-sm hover:shadow-xl hover:border-blue-500 hover:-translate-y-1 transition-all duration-300 text-left cursor-pointer group"
          >
            <span className="text-sm font-black tracking-widest text-slate-800 text-center w-full mb-6 pb-2 border-b border-slate-100 font-sans">
              Corpo Docente
            </span>
            <div className="flex-1 flex flex-col justify-between w-full font-sans text-sm font-semibold text-slate-700 min-h-[8rem]">
              <div className="flex justify-between items-center py-1">
                <span className="tracking-wider text-xs font-bold text-slate-400">
                  Homens
                </span>
                <span className="text-lg font-black text-slate-800">
                  {docentesH}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="tracking-wider text-xs font-bold text-slate-400">
                  Mulheres
                </span>
                <span className="text-lg font-black text-slate-800">
                  {docentesM}
                </span>
              </div>
              <div className="border-t border-slate-100 mt-4 pt-4 flex justify-between items-center w-full">
                <span className="tracking-widest text-xs font-extrabold text-slate-500">
                  Total
                </span>
                <span className="text-2xl font-black text-blue-600">
                  {docentesTotal}
                </span>
              </div>
            </div>
          </button>

          {/* Card 2: CORPO TECNICO ADMINISTRATIVO */}
          <button
            onClick={() => setViewState("cta")}
            className="bg-white border-2 border-slate-100/90 rounded-3xl p-8 flex flex-col w-full max-w-sm min-h-[16rem] shadow-sm hover:shadow-xl hover:border-blue-500 hover:-translate-y-1 transition-all duration-300 text-left cursor-pointer group"
          >
            <span className="text-sm font-black tracking-widest text-slate-800 text-center w-full mb-6 pb-2 border-b border-slate-100 font-sans">
              Corpo Técnico Administrativo
            </span>
            <div className="flex-1 flex flex-col justify-between w-full font-sans text-sm font-semibold text-slate-700 min-h-[8rem]">
              <div className="flex justify-between items-center py-1">
                <span className="tracking-wider text-xs font-bold text-slate-400">
                  Homens
                </span>
                <span className="text-lg font-black text-slate-800">
                  {ctaH}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="tracking-wider text-xs font-bold text-slate-400">
                  Mulheres
                </span>
                <span className="text-lg font-black text-slate-800">
                  {ctaM}
                </span>
              </div>
              <div className="border-t border-slate-100 mt-4 pt-4 flex justify-between items-center w-full">
                <span className="tracking-widest text-xs font-extrabold text-slate-500">
                  Total
                </span>
                <span className="text-2xl font-black text-blue-600">
                  {ctaTotal}
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (viewState === "docentes" || viewState === "cta") {
    const tipo = viewState === "docentes" ? "Docente" : "CTA";
    const list = colaboradores.filter((c) => c.tipo === tipo);

    const ativosH = list.filter(
      (c) => (c.estado === "Ativo" || !c.estado) && c.genero === "M",
    ).length;
    const ativosM = list.filter(
      (c) => (c.estado === "Ativo" || !c.estado) && c.genero === "F",
    ).length;
    const ativosTotal = ativosH + ativosM;

    const transH = list.filter(
      (c) => c.estado === "Transferido" && c.genero === "M",
    ).length;
    const transM = list.filter(
      (c) => c.estado === "Transferido" && c.genero === "F",
    ).length;
    const transTotal = transH + transM;

    const refH = list.filter(
      (c) => c.estado === "Reformado" && c.genero === "M",
    ).length;
    const refM = list.filter(
      (c) => c.estado === "Reformado" && c.genero === "F",
    ).length;
    const refTotal = refH + refM;

    return (
      <div className="page-layout space-y-8 pb-10 animate-fade-in">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <button
              onClick={() => setViewState("colaboradores")}
              className="flex items-center gap-2 text-blue-600 hover:underline font-medium mb-2"
            >
              <ArrowLeft size={16} /> Voltar para Efetivo Geral
            </button>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight font-sans">
              {tipo === "Docente"
                ? "Corpo Docente"
                : "Corpo Técnico Administrativo (CTA)"}{" "}
              - {boardName}
            </h2>
            <p className="text-xs font-bold text-slate-400 tracking-widest mt-1">
              Distribuição detalhada de {boardName} por estado e gênero
            </p>
          </div>
        </div>

        {/* Grid of 3 Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {/* Ativos Card */}
          <div className="bg-white border hover:border-emerald-500 rounded-3xl p-6 shadow-sm transition-all duration-300">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
              <span className="text-xs font-black tracking-widest text-emerald-600">
                Colaboradores Ativos
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div className="space-y-3 font-sans font-semibold text-slate-700">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 font-bold tracking-wider text-xs">
                  Homens
                </span>
                <span className="text-base font-black text-slate-800">
                  {ativosH}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 font-bold tracking-wider text-xs">
                  Mulheres
                </span>
                <span className="text-base font-black text-slate-800">
                  {ativosM}
                </span>
              </div>
              <div className="border-t border-slate-50 pt-3 mt-3 flex justify-between items-center">
                <span className="text-slate-500 font-extrabold tracking-widest text-xs">
                  Total Ativos
                </span>
                <span className="text-xl font-black text-emerald-600">
                  {ativosTotal}
                </span>
              </div>
            </div>
          </div>

          {/* Transferidos Card */}
          <div className="bg-white border hover:border-blue-500 rounded-3xl p-6 shadow-sm transition-all duration-300">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
              <span className="text-xs font-black tracking-widest text-blue-600">
                Colaboradores Transferidos
              </span>
            </div>
            <div className="space-y-3 font-sans font-semibold text-slate-700">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 font-bold tracking-wider text-xs">
                  Homens
                </span>
                <span className="text-base font-black text-slate-800">
                  {transH}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 font-bold tracking-wider text-xs">
                  Mulheres
                </span>
                <span className="text-base font-black text-slate-800">
                  {transM}
                </span>
              </div>
              <div className="border-t border-slate-50 pt-3 mt-3 flex justify-between items-center">
                <span className="text-slate-500 font-extrabold tracking-widest text-xs">
                  Total Transferidos
                </span>
                <span className="text-xl font-black text-blue-600">
                  {transTotal}
                </span>
              </div>
            </div>
          </div>

          {/* Reformados Card */}
          <div className="bg-white border hover:border-purple-500 rounded-3xl p-6 shadow-sm transition-all duration-300">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
              <span className="text-xs font-black tracking-widest text-purple-600">
                Colaboradores Reformados
              </span>
            </div>
            <div className="space-y-3 font-sans font-semibold text-slate-700">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 font-bold tracking-wider text-xs">
                  Homens
                </span>
                <span className="text-base font-black text-slate-800">
                  {refH}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 font-bold tracking-wider text-xs">
                  Mulheres
                </span>
                <span className="text-base font-black text-slate-800">
                  {refM}
                </span>
              </div>
              <div className="border-t border-slate-50 pt-3 mt-3 flex justify-between items-center">
                <span className="text-slate-500 font-extrabold tracking-widest text-xs">
                  Total Reformados
                </span>
                <span className="text-xl font-black text-purple-600">
                  {refTotal}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (viewState === "estudantes") {
    const getDiscentesList = () => {
      const seed = [
        {
          dept: "Dep. Eng. Eletrotécnica",
          curso: "Curso de Engenharia Elétrica",
          hActive: 340,
          mActive: 110,
          hGrad: 45,
          mGrad: 20,
          hDrop: 10,
          mDrop: 5,
        },
        {
          dept: "Dep. Eng. Eletrotécnica",
          curso: "Curso de Engenharia Eletrónica e de Telecomunicações",
          hActive: 280,
          mActive: 90,
          hGrad: 35,
          mGrad: 15,
          hDrop: 8,
          mDrop: 4,
        },
        {
          dept: "Dep. Eng. Eletrotécnica",
          curso: "Curso de Engenharia de Energias Renováveis",
          hActive: 190,
          mActive: 70,
          hGrad: 20,
          mGrad: 10,
          hDrop: 5,
          mDrop: 2,
        },
        {
          dept: "Dep. Eng. Construção Civil",
          curso: "Curso de Engenharia de Construção Civil",
          hActive: 420,
          mActive: 180,
          hGrad: 50,
          mGrad: 30,
          hDrop: 12,
          mDrop: 7,
        },
        {
          dept: "Dep. Eng. Construção Civil",
          curso: "Curso de Engenharia Hidráulica",
          hActive: 180,
          mActive: 90,
          hGrad: 25,
          mGrad: 15,
          hDrop: 6,
          mDrop: 3,
        },
        {
          dept: "Dep. Eng. Construção Mecânica",
          curso: "Diretor do Curso de Engenharia de Construção Mecânica",
          hActive: 250,
          mActive: 50,
          hGrad: 30,
          mGrad: 8,
          hDrop: 9,
          mDrop: 4,
        },
        {
          dept: "Dep. Eng. Construção Mecânica",
          curso: "Diretor do Curso de Engenharia Termotécnica",
          hActive: 160,
          mActive: 40,
          hGrad: 18,
          mGrad: 6,
          hDrop: 4,
          mDrop: 2,
        },
      ];

      if (estudantes && estudantes.length > 0) {
        estudantes.forEach((rec) => {
          const cName = rec.curso || "Outro";
          const h = parseInt(rec.homens) || 0;
          const m = parseInt(rec.mulheres) || 0;

          const found = seed.find(
            (s) =>
              cName.toLowerCase().includes(s.curso.toLowerCase()) ||
              s.curso.toLowerCase().includes(cName.toLowerCase()),
          );
          if (found) {
            found.hActive += h;
            found.mActive += m;
          } else {
            seed.push({
              dept: rec.departamento || "Outro",
              curso: cName,
              hActive: h,
              mActive: m,
              hGrad: 0,
              mGrad: 0,
              hDrop: 0,
              mDrop: 0,
            });
          }
        });
      }

      return seed;
    };

    return (
      <div className="w-full max-w-7xl mx-auto space-y-6 pb-10">
        <button
          onClick={() => setViewState("overview")}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-bold text-sm bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition-all"
        >
          <ArrowLeft size={16} /> Voltar para Consola
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight font-sans">
            Detalhamento de Estudantes: {boardName}
          </h2>
          <p className="text-xs font-bold text-slate-400 tracking-widest mt-1">
            DRA • Valores atualizados pelas submissões consolidadas do DICOSSER
          </p>
        </div>
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden m-[1px]">
          <table className="w-full text-left border-collapse font-sans font-semibold">
            <thead className="bg-[#f8fafc] text-slate-700 text-xs font-bold tracking-wider">
              <tr>
                <th
                  className="p-4 border-b border-slate-100 font-bold"
                  rowSpan={2}
                >
                  Curso / Departamento
                </th>
                <th
                  className="p-4 border-b border-slate-100 font-bold text-center border-l border-slate-100"
                  colSpan={3}
                >
                  Estudantes Atuais
                </th>
                <th
                  className="p-4 border-b border-slate-100 font-bold text-center border-l border-slate-100"
                  colSpan={3}
                >
                  Graduados
                </th>
                <th
                  className="p-4 border-b border-slate-100 font-bold text-center border-l border-slate-100"
                  colSpan={3}
                >
                  Desistentes
                </th>
              </tr>
              <tr className="border-b border-slate-100">
                <th className="p-2 font-bold text-center text-[10px] text-slate-400 border-l border-slate-100">
                  H
                </th>
                <th className="p-2 font-bold text-center text-[10px] text-slate-400">
                  M
                </th>
                <th className="p-2 font-bold text-center text-[10px] text-blue-600">
                  Total
                </th>
                <th className="p-2 font-bold text-center text-[10px] text-slate-400 border-l border-slate-100">
                  H
                </th>
                <th className="p-2 font-bold text-center text-[10px] text-slate-400">
                  M
                </th>
                <th className="p-2 font-bold text-center text-[10px] text-[#00C49F]">
                  Total
                </th>
                <th className="p-2 font-bold text-center text-[10px] text-slate-400 border-l border-slate-100">
                  H
                </th>
                <th className="p-2 font-bold text-center text-[10px] text-slate-400">
                  M
                </th>
                <th className="p-2 font-bold text-center text-[10px] text-red-500">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="text-slate-600 text-sm divide-y divide-slate-100">
              {getDiscentesList().map((row, idx) => (
                <tr
                  key={idx}
                  onClick={() =>
                    setSelectedCourseForLevels({
                      curso: row.curso,
                      homens: row.hActive,
                      mulheres: row.mActive,
                    })
                  }
                  className="hover:bg-blue-50/40 transition-all cursor-pointer group"
                  title="Clique para ver detalhe de estudantes ativos do Nível 1 ao Nível 5"
                >
                  <td className="p-4 font-bold text-slate-800">
                    <span className="block group-hover:text-blue-600 transition-colors">
                      {row.curso}
                    </span>
                    <span className="text-[10px] font-bold text-[#FFB800] block mt-0.5">
                      {row.dept}
                    </span>
                    <span className="inline-block text-[9px] font-black tracking-widest text-blue-500 bg-blue-50 px-2 py-0.5 rounded-xl border border-blue-200/50 mt-1">
                      Ver Níveis 1-5 &rarr;
                    </span>
                  </td>
                  {/* Atuais */}
                  <td className="p-4 text-center border-l border-slate-100 text-slate-700">
                    {row.hActive}
                  </td>
                  <td className="p-4 text-center text-slate-700">
                    {row.mActive}
                  </td>
                  <td className="p-4 text-center font-black text-blue-600 bg-blue-50/20">
                    {row.hActive + row.mActive}
                  </td>
                  {/* Graduados */}
                  <td className="p-4 text-center border-l border-slate-100 text-slate-700">
                    {row.hGrad}
                  </td>
                  <td className="p-4 text-center text-slate-700">
                    {row.mGrad}
                  </td>
                  <td className="p-4 text-center font-black text-[#00C49F] bg-[#00C49F]/5">
                    {row.hGrad + row.mGrad}
                  </td>
                  {/* Desistentes */}
                  <td className="p-4 text-center border-l border-slate-100 text-slate-700">
                    {row.hDrop}
                  </td>
                  <td className="p-4 text-center text-slate-700">
                    {row.mDrop}
                  </td>
                  <td className="p-4 text-center font-black text-red-500 bg-red-500/5">
                    {row.hDrop + row.mDrop}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Overlay for Course Levels 1-5 */}
        {selectedCourseForLevels && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] m-[1px]">
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <span className="text-[10px] font-black text-blue-600 tracking-widest block mb-0.5">
                    DRA • Detalhe de Estudantes Ativos por Nível
                  </span>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight font-sans">
                    {selectedCourseForLevels.curso}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCourseForLevels(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition-all"
                  title="Fechar"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto space-y-6">
                <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 m-[1px]">
                  <span className="text-xs font-bold text-blue-700 tracking-wider">
                    Estudantes Atuais Matriculados
                  </span>
                  <div className="flex gap-4 text-xs font-black text-blue-900 font-sans">
                    <span>
                      Homens:{" "}
                      <strong className="text-blue-950">
                        {selectedCourseForLevels.homens}
                      </strong>
                    </span>
                    <span>
                      Mulheres:{" "}
                      <strong className="text-pink-600">
                        {selectedCourseForLevels.mulheres}
                      </strong>
                    </span>
                    <span className="border-l border-blue-200 pl-4 text-blue-950">
                      Total:{" "}
                      <strong>
                        {selectedCourseForLevels.homens +
                          selectedCourseForLevels.mulheres}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 tracking-widest pb-1 border-b border-slate-150">
                    Distribuição Académica (Nível 1 a Nível 5)
                  </h4>
                  <div className="space-y-3">
                    {getStudentLevels(
                      selectedCourseForLevels.homens,
                      selectedCourseForLevels.mulheres,
                    ).map((lvl, lidx) => {
                      const maxLvlTotal =
                        Math.max(
                          ...getStudentLevels(
                            selectedCourseForLevels.homens,
                            selectedCourseForLevels.mulheres,
                          ).map((l) => l.total),
                        ) || 1;
                      const percent = (lvl.total / maxLvlTotal) * 100;
                      return (
                        <div
                          key={lidx}
                          className="bg-slate-50/40 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between hover:bg-slate-50 transition-colors m-[1px]"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-slate-955">
                              {lvl.nivel}
                            </span>
                            <span className="text-sm font-black text-blue-600">
                              {lvl.total} Alunos
                            </span>
                          </div>

                          {/* Progress Bar visual indicator */}
                          <div className="w-full bg-slate-200/50 rounded-full h-2.5 overflow-hidden mb-3">
                            <div
                              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>

                          <div className="flex justify-between items-center text-xs font-sans text-slate-500 font-semibold">
                            <div className="flex gap-3">
                              <span>
                                Homens:{" "}
                                <strong className="font-bold text-slate-800">
                                  {lvl.homens}
                                </strong>
                              </span>
                              <span>
                                Mulheres:{" "}
                                <strong className="font-bold text-pink-600">
                                  {lvl.mulheres}
                                </strong>
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold tracking-wider">
                              {(
                                (lvl.total /
                                  (selectedCourseForLevels.homens +
                                    selectedCourseForLevels.mulheres)) *
                                100
                              ).toFixed(0)}
                              % do total
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedCourseForLevels(null)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-widest rounded-xl transition-all shadow-md active:scale-95"
                >
                  Fechar Detalhes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (viewState === "actividades") {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-6 pb-10">
        <button
          onClick={() => setViewState("overview")}
          className="flex items-center gap-2 text-blue-600 hover:underline font-medium"
        >
          <ArrowLeft size={16} /> Voltar
        </button>
        <h2 className="text-2xl font-bold text-gray-900">
          Detalhamento: Actividades - {boardName}
        </h2>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden m-[1px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-700 text-sm tracking-wider">
              <tr>
                <th className="p-4 border-b border-gray-200 font-bold">
                  Tipo de Actividade
                </th>
                <th className="p-4 border-b border-gray-200 font-bold text-center">
                  Executadas
                </th>
                <th className="p-4 border-b border-gray-200 font-bold text-center">
                  Não Executadas
                </th>
                <th className="p-4 border-b border-gray-200 font-bold text-center">
                  Total
                </th>
                <th className="p-4 border-b border-gray-200 font-bold text-center">
                  Grau de Execução
                </th>
              </tr>
            </thead>
            <tbody className="text-gray-600">
              {actividades.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="p-4 border-b border-gray-100 font-medium text-gray-900">
                    {row.name}
                  </td>
                  <td className="p-4 border-b border-gray-100 text-center font-bold text-green-600">
                    {row.executadas}
                  </td>
                  <td className="p-4 border-b border-gray-100 text-center font-bold text-red-600">
                    {row.naoExecutadas}
                  </td>
                  <td className="p-4 border-b border-gray-100 text-center font-bold">
                    {row.executadas + row.naoExecutadas}
                  </td>
                  <td className="p-4 border-b border-gray-100 text-center">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                      {Math.round(
                        (row.executadas /
                          (row.executadas + row.naoExecutadas)) *
                          100,
                      )}
                      %
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (viewState === "recursos_financeiros") {
    const dynamicSubvencao =
      financialData.reduce(
        (sum, item) => sum + (Number(item.subvencaoEstado) || 0),
        0,
      ) || 10500000;
    const dynamicReceitas =
      financialData.reduce(
        (sum, item) => sum + (Number(item.receitasProprias) || 0),
        0,
      ) || 5470000;
    const totalFinancas = dynamicSubvencao + dynamicReceitas;

    let propinas = 0,
      admissoes = 0,
      inscricoes = 0,
      matriculas = 0,
      alimentacao = 0,
      alojamento = 0;
    financialData.forEach((item) => {
      propinas += Number(item.propinas) || 0;
      admissoes += Number(item.admissoes) || 0;
      inscricoes += Number(item.inscricoes) || 0;
      matriculas += Number(item.matriculas) || 0;
      alimentacao += Number(item.alimentacao) || 0;
      alojamento += Number(item.alojamento) || 0;
    });

    const RP_ROWS =
      financialData.length > 0
        ? [
            {
              categoria: "Propinas e Mensalidades",
              total: propinas.toLocaleString(),
            },
            {
              categoria: "Inscrições Exames Admissão",
              total: admissoes.toLocaleString(),
            },
            { categoria: "Inscrições", total: inscricoes.toLocaleString() },
            { categoria: "Matrículas", total: matriculas.toLocaleString() },
            { categoria: "Alimentação", total: alimentacao.toLocaleString() },
            { categoria: "Alojamento", total: alojamento.toLocaleString() },
          ]
        : [
            { categoria: "Propinas e Mensalidades", total: "1.620.000" },
            { categoria: "Inscrições Exames Admissão", total: "1.200.000" },
            { categoria: "Inscrições", total: "850.000" },
            { categoria: "Matrículas", total: "1.000.000" },
            { categoria: "Alimentação", total: "500.000" },
            { categoria: "Alojamento", total: "300.000" },
          ];

    return (
      <div className="page-layout space-y-6 pb-10 animate-fade-in">
        <button
          onClick={() => setViewState("overview")}
          className="flex items-center gap-2 text-blue-600 hover:underline font-medium"
        >
          <ArrowLeft size={16} /> Voltar para Visão Geral
        </button>
        <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">
          Recursos Financeiros - {boardName}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {/* Card OGE */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <Landmark size={24} />
              </div>
              <h3 className="font-bold text-lg text-slate-800">
                Orçamento Geral de Estado (OGE)
              </h3>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Subvenção estatal alocada anualmente para cobrir despesas de
              funcionamento e investimentos públicos da instituição.
            </p>
            <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-baseline">
              <span className="text-xs font-bold text-slate-400">
                Valor Alocado
              </span>
              <span className="text-xl font-black text-blue-600">
                {dynamicSubvencao.toLocaleString()} MZN
              </span>
            </div>
          </div>

          {/* Card Receitas Proprias */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
                <Wallet size={24} />
              </div>
              <h3 className="font-bold text-lg text-slate-800">
                Receitas Próprias
              </h3>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Arrecadações directas cobradas através de propinas, inscrições,
              matrículas, alojamento e outros serviços institucionais.
            </p>
            <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-baseline">
              <span className="text-xs font-bold text-slate-400">
                Valor Arrecadado
              </span>
              <span className="text-xl font-black text-green-600">
                {dynamicReceitas.toLocaleString()} MZN
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Table */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 m-[1px]">
          <h3 className="font-bold text-lg text-slate-800">
            Detalhamento de Arrecadações (Receitas Próprias)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500">
                  <th className="p-4">Categoria de Receita</th>
                  <th className="p-4 text-right">
                    Valor Arrecadado (Acumulado)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-sans font-semibold text-slate-700">
                {RP_ROWS.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/40">
                    <td className="p-4">{row.categoria}</td>
                    <td className="p-4 text-right text-slate-900 font-bold">
                      {row.total} MZN
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (viewState === "relatorios") {
    return (
      <div className="page-layout space-y-6 pb-10 animate-fade-in">
        <button
          onClick={() => setViewState("overview")}
          className="flex items-center gap-2 text-blue-600 hover:underline font-medium"
        >
          <ArrowLeft size={16} /> Voltar para Visão Geral
        </button>
        <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">
          Relatórios Consolidados - {boardName}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-48">
            <h3 className="font-bold text-slate-800">
              Relatório de Efetivos por Gênero
            </h3>
            <p className="text-xs text-slate-500">
              Distribuição completa do corpo docente e CTA.
            </p>
            <button
              onClick={() => setViewState("colaboradores")}
              className="text-xs font-bold text-blue-600 hover:underline text-left"
            >
              Visualizar Dados &rarr;
            </button>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-48">
            <h3 className="font-bold text-slate-800">
              Grau de Execução de Actividades
            </h3>
            <p className="text-xs text-slate-500">
              Percentual de actividades executadas vs não executadas.
            </p>
            <button
              onClick={() => setViewState("actividades")}
              className="text-xs font-bold text-blue-600 hover:underline text-left"
            >
              Visualizar Dados &rarr;
            </button>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-48">
            <h3 className="font-bold text-slate-800">
              Execução Financeira Geral
            </h3>
            <p className="text-xs text-slate-500">
              Demonstração de OGE e arrecadação de Receitas Próprias.
            </p>
            <button
              onClick={() => setViewState("recursos_financeiros")}
              className="text-xs font-bold text-blue-600 hover:underline text-left"
            >
              Visualizar Dados &rarr;
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Computed Data
  const totalFuncionarios = colaboradores.length;
  const totalEstudantes = estudantes.reduce(
    (acc, curr) => acc + (curr.total || 0),
    0,
  );
  const totalActividades = actividades.length;

  const colaboradoresGenero = [
    {
      name: "Masculino",
      value: colaboradores.filter((c) => c.genero === "M").length,
    },
    {
      name: "Feminino",
      value: colaboradores.filter((c) => c.genero === "F").length,
    },
  ];

  const estudantesGenero = [
    {
      name: "Masculino",
      value: estudantes.reduce((acc, curr) => acc + (curr.homens || 0), 0),
    },
    {
      name: "Feminino",
      value: estudantes.reduce((acc, curr) => acc + (curr.mulheres || 0), 0),
    },
  ];

  // Render...
  return (
    <div className="w-[95%] mx-auto space-y-4 pb-4">
      <h2 className="text-2xl font-bold text-blue-900 border-b pb-2 mb-6 tracking-wider">
        Visão Geral: {boardName}
      </h2>
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 mx-auto">
        <CardKPI
          label="Efetivo Geral"
          onClick={() => {
            if (onNavigate) onNavigate("Repartição de Pessoal");
            else setViewState("colaboradores");
          }}
        />
        <CardKPI
          label="Planos de Atividades"
          onClick={() => {
            if (onNavigate) onNavigate("Plano de Actividades");
            else setViewState("actividades");
          }}
        />
        <CardKPI
          label="Relatórios"
          onClick={() => {
            if (onNavigate) onNavigate("Relatórios");
            else setViewState("relatorios");
          }}
        />
        <CardKPI
          label="Recursos Financeiros"
          onClick={() => {
            if (onNavigate) onNavigate("Balanço");
            else setViewState("recursos_financeiros");
          }}
        />
        <CardKPI
          label="Corpo Discente"
          onClick={() => {
            if (onNavigate) onNavigate("Estatística");
            else setViewState("estudantes");
          }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 font-sans">
            Efetivo Geral por Gênero
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={colaboradoresGenero}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {colaboradoresGenero.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">
            Estudantes por Gênero
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={estudantesGenero}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {estudantesGenero.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index + (2 % COLORS.length)]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-6">
          Resumo de Actividades
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={actividades}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="executadas"
                name="Executadas"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="naoExecutadas"
                name="Não Executadas"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Printer } from "lucide-react";
import { printElementById } from "../../lib/printUtils";

interface BalancoActividadesViewProps {
  activities: any[];
  user: any;
  onBack?: () => void;
  sectorTitle?: string;
}

export default function BalancoActividadesView({
  activities = [],
  user,
  onBack,
  sectorTitle,
}: BalancoActividadesViewProps) {
  const [periodType, setPeriodType] = useState<"Trimestre" | "Semestre">(
    "Trimestre",
  );
  const [periodValue, setPeriodValue] = useState<number>(1);
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );

  const effectiveTitle = sectorTitle || user?.setor || user?.departamento || "";
  const institutionalKeywords = [
    "Gestão Patrimonial",
    "Economato",
    "TIC",
    "Planificação",
    "Diretor-Geral",
    "Diretor-Geral",
  ];
  const isInstitutional =
    institutionalKeywords.some((keyword) =>
      effectiveTitle.toUpperCase().includes(keyword.toUpperCase()),
    ) ||
    user?.nivel === "institucional" ||
    user?.level === "institucional";

  const filteredActivities = useMemo(() => {
    return activities.filter((a) => {
      const userSetor =
        sectorTitle || user?.setor || user?.departamento || user?.direcao || "";
      const userDept = user?.departamento || "";
      const userDir = user?.direcao || "";

      const activitySetor = a.setor || a.departamento || a.direcao || "";
      const activityDept = a.departamento || "";
      const activityDir = a.direcao || "";

      const matchesSector =
        isInstitutional ||
        !userSetor ||
        activitySetor === userSetor ||
        activityDept === userDept ||
        activityDir === userDir;

      const activityDate = new Date(a.dataInicio || a.createdAt);
      const month = activityDate.getMonth();
      const year = activityDate.getFullYear();

      let matchesPeriod = year === selectedYear;
      if (periodType === "Trimestre") {
        const trimesters = [
          [0, 1, 2], // 1
          [3, 4, 5], // 2
          [6, 7, 8], // 3
          [9, 10, 11], // 4
        ];
        matchesPeriod =
          matchesPeriod && trimesters[periodValue - 1].includes(month);
      } else {
        const semesters = [
          [0, 1, 2, 3, 4, 5], // 1
          [6, 7, 8, 9, 10, 11], // 2
        ];
        matchesPeriod =
          matchesPeriod && semesters[periodValue - 1].includes(month);
      }

      return matchesSector && matchesPeriod;
    });
  }, [
    activities,
    user,
    isInstitutional,
    periodType,
    periodValue,
    selectedYear,
    sectorTitle,
  ]);

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

  const entityName = "Instituto Superior Politécnico de Songo";
  let specificEntity = "";
  if (isInstitutional) {
    specificEntity = "Institucional";
  } else if (sectorTitle) {
    specificEntity = sectorTitle;
  } else if (user?.setor) {
    specificEntity = `Setor de ${user.setor}`;
  } else if (user?.reparticao) {
    specificEntity = `Repartição de ${user.reparticao}`;
  } else if (user?.departamento) {
    specificEntity = `Departamento de ${user.departamento}`;
  } else if (user?.direcao) {
    specificEntity = `Direção de ${user.direcao}`;
  } else {
    specificEntity = "Institucional";
  }

  const periodText = `${periodValue}º ${periodType} de ${selectedYear}`;

  const handlePrint = () => {
    printElementById(
      "balanco-actividades-area",
      `Balanço de Atividades - ${specificEntity} (${periodText})`,
      "landscape",
      "A4",
    );
  };

  return (
    <div className="space-y-6 p-6 h-full flex flex-col bg-slate-50">
      {/* Control Bar - Hidden when printing */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200 print:hidden shrink-0">
        <div className="flex gap-4 items-center">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Período
            </label>
            <select
              value={periodType}
              onChange={(e) => {
                setPeriodType(e.target.value as any);
                setPeriodValue(1);
              }}
              className="p-2 border rounded-lg text-sm bg-slate-50 font-medium"
            >
              <option value="Trimestre">Trimestre</option>
              <option value="Semestre">Semestre</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Qual?
            </label>
            <select
              value={periodValue}
              onChange={(e) => setPeriodValue(Number(e.target.value))}
              className="p-2 border rounded-lg text-sm bg-slate-50 font-medium"
            >
              {periodType === "Trimestre" ? (
                <>
                  <option value={1}>1º Trimestre</option>
                  <option value={2}>2º Trimestre</option>
                  <option value={3}>3º Trimestre</option>
                  <option value={4}>4º Trimestre</option>
                </>
              ) : (
                <>
                  <option value={1}>1º Semestre</option>
                  <option value={2}>2º Semestre</option>
                </>
              )}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Ano
            </label>
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="p-2 border rounded-lg text-sm bg-slate-50 font-medium w-24"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-700"
          >
            <Printer size={16} /> Imprimir Relatório
          </button>
          {onBack && (
            <button
              onClick={onBack}
              className="bg-slate-100 px-4 py-2 rounded-xl font-bold text-sm text-slate-700 hover:bg-slate-200"
            >
              Voltar
            </button>
          )}
        </div>
      </div>

      {/* Document Pages Container */}
      <div
        id="balanco-actividades-area"
        data-print-type="balanco"
        className="flex-1 overflow-y-auto print:overflow-visible pb-12 font-serif"
      >
        <style>{`
          @media print {
            body {
              background: white !important;
              color: black !important;
            }
            
            /* Configuração geral de páginas de impressão - A4 Landscape */
            @page {
              margin: 10mm;
              size: A4 landscape !important;
            }

            .print-portrait-page,
            .print-landscape-page {
              page: landscape-page;
              page-break-after: always;
              break-after: page;
              width: 100% !important;
              box-shadow: none !important;
              border: none !important;
              padding: 0 !important;
            }

            @page portrait-page {
              size: A4 landscape !important;
              margin: 10mm;
            }

            @page landscape-page {
              size: A4 landscape !important;
              margin: 10mm;
            }

            /* Ocultar elementos de layout desnecessários na impressão */
            .print\\:hidden {
              display: none !important;
            }

            table {
              width: 100% !important;
              border-collapse: collapse !important;
              font-size: 8pt !important;
            }

            th, td {
              border: 1px solid #cbd5e1 !important;
              padding: 6px 4px !important;
            }

            th {
              background-color: #f1f5f9 !important;
              -webkit-print-color-adjust: exact;
            }
          }
        `}</style>

        <div className="max-w-[210mm] mx-auto space-y-8 print:space-y-0 print:max-w-none">
          {/* Capa (Page 1) - Retrato */}
          <div className="bg-white p-[20mm] shadow-lg print:shadow-none print:p-0 min-h-[297mm] flex flex-col justify-center items-center text-center relative break-after-page print-portrait-page">
            {/* Decorative Top Bar */}
            <div className="h-4 w-full flex absolute top-0 left-0">
              <div className="w-2/3 bg-blue-900"></div>
              <div className="w-1/3 bg-red-600"></div>
            </div>

            <div className="space-y-4 mb-24">
              <img
                src="https://lh3.googleusercontent.com/d/11zvvpOpZARM1yk_irEDpjJ-qBKlTlhad"
                alt="Logo Songo"
                className="w-32 h-32 object-contain mx-auto mb-6"
                referrerPolicy="no-referrer"
              />
              <h2 className="text-lg font-bold  text-slate-700 tracking-wide">
                {entityName}
              </h2>
              <p className="text-xs font-bold text-slate-500 ">
                DPEP - Departamento de Planificação e Estudos Projetos
              </p>
            </div>

            <div className="space-y-6 mt-16">
              <h1 className="text-4xl font-black  text-slate-900 leading-tight">
                Balanço {periodText} de Actividades
              </h1>
              <div className="text-lg font-bold text-slate-700 py-3 px-8 rounded-full inline-block bg-slate-50 border border-slate-100 mt-2">
                {specificEntity}
              </div>
            </div>

            <div className="absolute bottom-[20mm] w-full text-center">
              <p className="text-slate-500 font-bold  text-xs tracking-widest mb-1">
                SIGEP - Sistema Integrado de Gestão
              </p>
              <p className="text-slate-400 font-medium text-sm">
                {selectedYear}
              </p>
            </div>
          </div>

          {/* Página 2: Tabela - Paisagem */}
          <div className="bg-white p-[20mm] shadow-lg print:shadow-none print:p-0 min-h-[297mm] print:min-h-0 relative pt-12 flex flex-col print-landscape-page">
            {/* Decorative Top Bar */}
            <div className="h-4 w-full flex absolute top-0 left-0 print:hidden">
              <div className="w-2/3 bg-blue-900"></div>
              <div className="w-1/3 bg-red-600"></div>
            </div>

            <div className="mb-8 border-b-2 border-blue-900 pb-4 mt-4 flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-black text-blue-900  tracking-tight">
                  Detalhamento das Actividades
                </h2>
                <p className="text-slate-500 font-medium mt-1">
                  {specificEntity} - {periodText}
                </p>
              </div>
              <span className="text-[10px] font-bold text-gray-400  tracking-widest hidden print:inline">
                SIGEP Songo
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 text-[10px] font-black  text-slate-700 tracking-wider">
                    <th className="border border-slate-300 py-2.5 px-3 text-center w-12">
                      N/O
                    </th>
                    <th className="border border-slate-300 py-2.5 px-3 w-32">
                      Código
                    </th>
                    <th className="border border-slate-300 py-2.5 px-3">
                      Nome da Actividade
                    </th>
                    <th className="border border-slate-300 py-2.5 px-3 w-28">
                      Mês de Realização
                    </th>
                    <th className="border border-slate-300 py-2.5 px-3 w-28">
                      Data
                    </th>
                    <th className="border border-slate-300 py-2.5 px-3 w-40">
                      Responsável
                    </th>
                    <th className="border border-slate-300 py-2.5 px-3">
                      Justificação Estado
                    </th>
                    <th className="border border-slate-300 py-2.5 px-3 text-center w-24">
                      Status em %
                    </th>
                    <th className="border border-slate-300 py-2.5 px-3 text-center w-32">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="text-[11px] divide-y divide-slate-100">
                  {filteredActivities.length > 0 ? (
                    filteredActivities.map((a, idx) => {
                      const activityDate = new Date(
                        a.dataInicio || a.createdAt,
                      );
                      const monthName = monthNames[activityDate.getMonth()];

                      const codigo =
                        a.codigoActividade ||
                        a.referencia ||
                        `ACT-NP-${(a.id || "").substring(0, 4)}`;
                      const nome =
                        a.nomeActividade ||
                        a.title ||
                        a.nome ||
                        "Actividade sem nome";
                      const mes =
                        a.mesRealizacao || a.mes || a.dataMes || monthName;
                      const data =
                        a.dataRealizacao ||
                        a.data ||
                        (a.dataInicio
                          ? new Date(a.dataInicio).toLocaleDateString("pt-MZ")
                          : "-");
                      const responsavel =
                        a.responsavel ||
                        a.responsavelActividade ||
                        a.colaborador ||
                        "-";
                      const justificativa =
                        a.justificativa || a.motivo || a.observacoes || "-";

                      const status = a.situacaoActividade || a.status || "";
                      const isRealized =
                        status === "executada" || status === "realizada";
                      const isPending = status === "pendente";
                      const isInProgress =
                        status === "em_execucao" || status === "em_realizacao";

                      const progresso =
                        a.progresso !== undefined
                          ? a.progresso
                          : a.progressoActividade !== undefined
                            ? a.progressoActividade
                            : isRealized
                              ? 100
                              : 0;

                      const getStatusLabel = (s: string) => {
                        switch (s) {
                          case "executada":
                          case "realizada":
                            return "Executada";
                          case "nao_executada":
                            return "Não Executado";
                          case "pendente":
                            return "Pendente";
                          case "em_execucao":
                          case "em_realizacao":
                            return "Em execução";
                          case "agendada":
                            return "Agendada";
                          default:
                            return s || "Pendente";
                        }
                      };

                      return (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="border border-slate-200 py-2 px-3 font-medium text-center text-gray-500">
                            {idx + 1}
                          </td>
                          <td className="border border-slate-200 py-2 px-3 font-mono text-blue-700 font-bold">
                            {codigo}
                          </td>
                          <td className="border border-slate-200 py-2 px-3 font-bold text-slate-800 leading-tight">
                            {nome}
                            <div className="text-[9px] text-slate-400 font-semibold  mt-0.5">
                              {a.setor || a.direcao || a.departamento || ""}
                            </div>
                          </td>
                          <td className="border border-slate-200 py-2 px-3 text-slate-600 font-medium">
                            {mes}
                          </td>
                          <td className="border border-slate-200 py-2 px-3 text-slate-600">
                            {data}
                          </td>
                          <td className="border border-slate-200 py-2 px-3 text-slate-600 font-medium">
                            {responsavel}
                          </td>
                          <td className="border border-slate-200 py-2 px-3 text-slate-500 italic max-w-xs truncate">
                            {justificativa}
                          </td>
                          <td className="border border-slate-200 py-2 px-3 text-center font-black text-blue-900">
                            {progresso}%
                          </td>
                          <td className="border border-slate-200 py-2 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-1 rounded text-[9px] font-black  tracking-wider ${
                                isRealized
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : isPending
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : isInProgress
                                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                                      : "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}
                            >
                              {getStatusLabel(status)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={9}
                        className="border border-slate-200 py-12 text-center text-slate-400 italic font-medium"
                      >
                        Nenhuma actividade registada neste período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Rodapé de Assinaturas na Impressão */}
            <div className="mt-16 grid grid-cols-2 gap-20 hidden print:grid">
              <div className="text-center">
                <div className="w-48 border-b border-slate-900 mx-auto mb-2"></div>
                <div className="text-[10px] font-black  text-slate-700">
                  O Responsável pelo Relatório
                </div>
              </div>
              <div className="text-center">
                <div className="w-48 border-b border-slate-900 mx-auto mb-2"></div>
                <div className="text-[10px] font-black  text-slate-700">
                  Visto da Gabinete do Diretor-Geral / DPEP
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

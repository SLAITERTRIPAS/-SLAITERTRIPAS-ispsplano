import { printElementById } from "../../lib/printUtils";
import React from "react";
import { motion } from "motion/react";
import { FileText, Download, ArrowLeft, Printer } from "lucide-react";
import { openPrintDocumentWindow } from "../../lib/printUtils";

interface ReportSection {
  title: string;
  content: React.ReactNode;
}

interface StandardReportModelProps {
  direction: string;
  year: number;
  semester?: number;
  title: string;
  location?: string;
  date?: string;
  technicalSheet?: {
    name: string;
    role: string;
  }[];
  abbreviations?: {
    sigla: string;
    significado: string;
  }[];
  stats?: {
    cursos?: number;
    novosIngressos?: number;
    matriculados?: number;
    desistentes?: number;
    bolseiros?: number;
    aproveitamento?: number;
    docentesGlobal?: number;
    ctaGlobal?: number;
    orcamentoEstado?: number;
    receitasProprias?: number;
    financiamentoParceiros?: number;
    titulosBiblioteca?: number;
  };
  sections: ReportSection[];
  onBack: () => void;
  user?: any;
}

import { InstitutionalHeader } from "../../components/InstitutionalHeader";

export default function StandardReportModel({
  direction,
  year,
  semester,
  title,
  location = "Songo",
  date = new Date().toLocaleDateString("pt-PT", {
    month: "long",
    year: "numeric",
  }),
  technicalSheet = [],
  abbreviations = [],
  stats,
  sections,
  onBack,
  user,
}: StandardReportModelProps) {
  const handlePrint = () => {
    const reportElement = document.getElementById("standard-report-content");
    if (reportElement) {
      openPrintDocumentWindow({
        title: title || "Relatório de Atividades - Songo",
        orgao: user?.unidadeOrganica || user?.unidade || "UNIDADE ORGÂNICA",
        direcao: user?.direcao || "DICOSAFA",
        departamento: user?.departamento || "",
        reparticao: user?.reparticao || "",
        setor: user?.setor || user?.sector || "",
        contentHtml: reportElement.innerHTML,
        orientation: "auto",
        pageSize: "auto",
      });
    } else {
      printElementById("print-area");
    }
  };

  const renderStatsTable = () => {
    if (!stats) return null;

    return (
      <div className="p-20 min-h-[29.7cm] space-y-12 font-serif border-b border-gray-100 print:border-none page-break-after-always">
        <h3 className="text-xl font-bold border-b border-black pb-2 mb-8">
          Songo em Números - Indicadores do Período
        </h3>
        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
          <div className="space-y-4">
            <h4 className="font-bold border-b border-gray-200 pb-1 text-sm  tracking-wider">
              Educação e Formação
            </h4>
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-2">Cursos Ativos</td>
                  <td className="py-2 font-bold text-right">{stats.cursos}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2">Novos Ingressos</td>
                  <td className="py-2 font-bold text-right">
                    {stats.novosIngressos}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2">Matriculados</td>
                  <td className="py-2 font-bold text-right">
                    {stats.matriculados}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2">Estudantes Desistentes</td>
                  <td className="py-2 font-bold text-right">
                    {stats.desistentes}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2">Bolsas Atribuídas</td>
                  <td className="py-2 font-bold text-right">
                    {stats.bolseiros}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2">Aproveitamento Global</td>
                  <td className="py-2 font-bold text-right">
                    {stats.aproveitamento}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold border-b border-gray-200 pb-1 text-sm  tracking-wider">
              Recursos e Administração
            </h4>
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-2">Docentes (Global)</td>
                  <td className="py-2 font-bold text-right">
                    {stats.docentesGlobal}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2">CTA (Global)</td>
                  <td className="py-2 font-bold text-right">
                    {stats.ctaGlobal}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2">Títulos Biblioteca</td>
                  <td className="py-2 font-bold text-right">
                    {stats.titulosBiblioteca}
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-2 pl-2">Finanças (10^3 MZN)</td>
                  <td></td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 pl-4">Orçamento Estado</td>
                  <td className="py-2 font-bold text-right">
                    {stats.orcamentoEstado?.toLocaleString()}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 pl-4">Receitas Próprias</td>
                  <td className="py-2 font-bold text-right">
                    {stats.receitasProprias?.toLocaleString()}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 pl-4">Financ. Parceiros</td>
                  <td className="py-2 font-bold text-right">
                    {stats.financiamentoParceiros?.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-20 p-8 border-2 border-black/5 rounded-3xl bg-gray-50/30">
          <p className="text-xs text-gray-500 italic text-justify leading-relaxed">
            Estes indicadores refletem a performance operacional do Songo durante
            o {semester ? `${semester}º Semestre de ` : ""} {year}. Os dados
            foram extraídos dos sistemas integrados de gestão académica e
            financeira.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-200 p-4 md:p-12 print:p-0 print:bg-white font-serif">
      {/* Toolbar - Hidden on print */}
      <div className="max-w-[21cm] mx-auto mb-8 flex items-center justify-between print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-2 bg-white text-blue-900 px-4 py-2 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm border border-gray-200"
        >
          <ArrowLeft size={20} /> Voltar
        </button>
        <div className="flex gap-4">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-900 text-white px-8 py-3 rounded-xl font-black hover:bg-blue-800 transition-all shadow-xl hover:scale-105 active:scale-95"
          >
            <Printer size={18} /> IMPRIMIR RELATÓRIO (A4)
          </button>
        </div>
      </div>

      {/* Report Pages Container */}
      <div id="standard-report-content" className="flex flex-col gap-12 print:gap-0 items-center pb-20">
        {/* Page 1: Cover */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-[21cm] h-[29.7cm] bg-white shadow-[0_30px_60px_-12px_rgba(0,0,0,0.25)] print:shadow-none flex flex-col items-center justify-between p-[2.5cm] relative overflow-hidden page-break-after-always"
        >
          {/* Subtle Branding Accent */}
          <div className="absolute top-0 left-0 w-full h-1.5 flex no-print">
            <div className="w-2/3 bg-blue-900"></div>
            <div className="w-1/3 bg-red-600"></div>
          </div>

          <div className="w-full">
            <InstitutionalHeader 
              unidadeName={user?.unidadeOrganica || "UNIDADE ORGÂNICA"}
              direcaoName={direction || user?.direcao || "Songo"} 
              departamentoName={user?.departamento}
              reparticaoName={user?.reparticao}
              sectorName={user?.setor}
              year={year}
              title={semester ? `RELATÓRIO DO ${semester}º SEMESTRE DE ACTIVIDADES` : "RELATÓRIO ANUAL DE ACTIVIDADES"}
            />
          </div>

          <div className="space-y-12 py-10 w-full text-center relative">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-1 bg-red-600 opacity-20"></div>
            <div className="space-y-8">
              <h3 className="text-5xl font-black  tracking-tighter leading-[1.1] max-w-3xl mx-auto text-slate-900">
                {semester
                  ? `Relatório do ${semester}º Semestre de Actividades`
                  : "Relatório Anual de Actividades"}
              </h3>
              <div className="flex items-center justify-center gap-6">
                <div className="h-0.5 w-12 bg-slate-200"></div>
                <p className="text-8xl font-black text-blue-950 tracking-tighter tabular-nums">
                  {year}
                </p>
                <div className="h-0.5 w-12 bg-slate-200"></div>
              </div>
            </div>
          </div>

          <div className="mt-auto space-y-4 w-full text-center border-t border-slate-50 pt-10">
            <p className="text-xl font-black  tracking-[0.3em] text-slate-800">
              {location}
            </p>
            <p className="text-lg font-bold text-slate-400 capitalize tracking-widest">
              {new Date().toLocaleDateString("pt-PT", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </motion.div>

        {/* Page 2: Contra Capa (Inner Cover) */}
        <div className="w-[21cm] h-[29.7cm] bg-white shadow-[0_30px_60px_-12px_rgba(0,0,0,0.25)] print:shadow-none flex flex-col items-center justify-center p-[2.5cm] relative overflow-hidden page-break-after-always">
          <div className="flex-grow flex flex-col items-center justify-center space-y-24 w-full text-center">
            <div className="space-y-8">
              <h3 className="text-4xl font-black  tracking-tight leading-tight max-w-xl mx-auto text-slate-800">
                {semester
                  ? `Relatório do ${semester}º Semestre de Actividades`
                  : "Relatório Anual de Actividades"}
              </h3>
              <div className="h-1 w-20 bg-slate-900 mx-auto"></div>
              <p className="text-9xl font-black text-slate-900 tracking-tighter tabular-nums">
                {year}
              </p>
            </div>
          </div>

          <div className="mt-auto pt-12 text-center w-full border-t border-slate-50">
            <p className="text-xl font-bold  tracking-widest text-slate-400 italic">
              {location},{" "}
              {new Date().toLocaleDateString("pt-PT", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Page 3: Ficha Técnica */}
        <div className="w-[21cm] h-[29.7cm] bg-white shadow-2xl print:shadow-none p-[2.5cm] space-y-12 relative overflow-hidden page-break-after-always text-left">
          <h2 className="text-3xl font-black mb-12 border-b-4 border-blue-900 pb-4 text-slate-900 tracking-tighter">
            Ficha Técnica
          </h2>

          <table className="w-full text-sm leading-relaxed border-collapse">
            <tbody>
              <tr>
                <td className="font-bold py-6 pr-8 border-b border-slate-100 w-1/3 align-top text-slate-400  text-[10px] tracking-widest">
                  Título:
                </td>
                <td className="py-6 border-b border-slate-100 font-bold text-slate-800">
                  {semester
                    ? `Relatório do ${semester}º Semestre de Actividades`
                    : "Relatório Anual de Actividades"}
                  -{year}
                </td>
              </tr>
              <tr>
                <td className="font-bold py-6 pr-8 border-b border-slate-100 w-1/3 align-top text-slate-400  text-[10px] tracking-widest">
                  Edição:
                </td>
                <td className="py-6 border-b border-slate-100">
                  <div className="space-y-1">
                    <p className="font-bold text-base text-slate-800">
                      Instituto Superior Politécnico de Songo
                    </p>
                    <p className="text-slate-600">
                      Departamento de Planificação, Estudos e Projetos (DPEP)
                    </p>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="font-bold py-6 pr-8 border-b border-slate-100 w-1/3 align-top text-slate-400  text-[10px] tracking-widest">
                  Data:
                </td>
                <td className="py-6 border-b border-slate-100 capitalize text-slate-800">
                  {new Date().toLocaleDateString("pt-PT", {
                    month: "long",
                    year: "numeric",
                  })}
                </td>
              </tr>
              <tr>
                <td className="font-bold py-6 pr-8 border-b border-slate-100 w-1/3 align-top text-slate-400  text-[10px] tracking-widest">
                  Colaboração:
                </td>
                <td className="py-6 border-b border-slate-100">
                  <div className="grid grid-cols-1 gap-3 text-slate-700">
                    <p className="font-medium">• Divisão de Engenharia (DE)</p>
                    <p className="font-medium">
                      • Centro de Incubação de Empresas (CIE)
                    </p>
                    <p className="font-medium">
                      • Direção de Coordenação de Serviços Académicos, Sociais,
                      Extensão e Relações Públicas (DICOSSER)
                    </p>
                    <p className="font-medium">
                      • Direção de Coordenação de Serviços de Administração,
                      Finanças e de Apoio (DICOSAFA)
                    </p>
                    <p className="font-medium">
                      • Gabinete do Diretor-Geral (GDG)
                    </p>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="font-bold py-6 pr-8 w-1/3 align-top text-slate-400  text-[10px] tracking-widest">
                  Endereço:
                </td>
                <td className="py-6">
                  <div className="space-y-2 text-slate-700">
                    <p className="font-bold text-slate-800 underline underline-offset-4">
                      Instituto Superior Politécnico de Songo
                    </p>
                    <p>Campus principal de Catondo,</p>
                    <p>Bairro Catondo, Vila de Songo – Cahora Bassa – Tete.</p>
                    <p className="text-blue-600 font-mono text-xs font-bold pt-2">
                      www.ispsongo.ac.mz
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Page 4: Abbreviations (If needed) */}
        {abbreviations.length > 0 && (
          <div className="w-[21cm] h-[29.7cm] bg-white shadow-2xl print:shadow-none p-[2.5cm] space-y-8 relative overflow-hidden page-break-after-always">
            <h3 className="text-2xl font-black mb-8 border-b-2 border-slate-900 pb-2  tracking-tighter text-slate-900">
              Lista De Abreviaturas
            </h3>
            <div className="grid grid-cols-[140px_1fr] gap-x-8 gap-y-3 text-xs leading-relaxed">
              <div className="font-black border-b border-slate-200 pb-1  text-[10px] text-slate-400 tracking-widest">
                Sigla
              </div>
              <div className="font-black border-b border-slate-200 pb-1  text-[10px] text-slate-400 tracking-widest">
                Significado
              </div>
              {abbreviations.map((item, idx) => (
                <React.Fragment key={idx}>
                  <div className="font-bold text-slate-900">{item.sigla}</div>
                  <div className="text-slate-700">{item.significado}</div>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Stats (Optional) */}
        {stats && (
          <div className="w-[21cm] h-[29.7cm] bg-white shadow-2xl print:shadow-none p-[2.5cm] space-y-12 relative overflow-hidden page-break-after-always">
            <h3 className="text-2xl font-black border-b-2 border-slate-900 pb-4 mb-10 text-slate-900 tracking-tighter ">
              Songo em Números - Indicadores do Período
            </h3>
            <div className="grid grid-cols-2 gap-x-16 gap-y-8">
              <div className="space-y-6">
                <h4 className="font-black border-b-2 border-blue-900 pb-2 text-[11px]  tracking-widest text-blue-900">
                  Educação e Formação
                </h4>
                <table className="w-full text-xs">
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="py-3 text-slate-600">Cursos Ativos</td>
                      <td className="py-3 font-bold text-right text-slate-900">
                        {stats.cursos}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-3 text-slate-600">Novos Ingressos</td>
                      <td className="py-3 font-bold text-right text-slate-900">
                        {stats.novosIngressos}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-3 text-slate-600">Matriculados</td>
                      <td className="py-3 font-bold text-right text-slate-900">
                        {stats.matriculados}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-3 text-slate-600">
                        Estudantes Desistentes
                      </td>
                      <td className="py-3 font-bold text-right text-slate-900">
                        {stats.desistentes}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-3 text-slate-600">Bolsas Atribuídas</td>
                      <td className="py-3 font-bold text-right text-slate-900">
                        {stats.bolseiros}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-3 text-slate-600">
                        Aproveitamento Global
                      </td>
                      <td className="py-3 font-bold text-right text-slate-900">
                        {stats.aproveitamento}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="space-y-6">
                <h4 className="font-black border-b-2 border-blue-900 pb-2 text-[11px]  tracking-widest text-blue-900">
                  Recursos e Administração
                </h4>
                <table className="w-full text-xs">
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="py-3 text-slate-600">Docentes (Global)</td>
                      <td className="py-3 font-bold text-right text-slate-900">
                        {stats.docentesGlobal}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-3 text-slate-600">CTA (Global)</td>
                      <td className="py-3 font-bold text-right text-slate-900">
                        {stats.ctaGlobal}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-3 text-slate-600">
                        Títulos Biblioteca
                      </td>
                      <td className="py-3 font-bold text-right text-slate-900">
                        {stats.titulosBiblioteca}
                      </td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="py-3 pl-3 font-bold text-slate-500  text-[9px] tracking-wider">
                        Finanças (10^3 MZN)
                      </td>
                      <td></td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-3 pl-4 text-slate-600">
                        Orçamento Estado
                      </td>
                      <td className="py-3 font-bold text-right text-slate-900">
                        {stats.orcamentoEstado?.toLocaleString()}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-3 pl-4 text-slate-600">
                        Receitas Próprias
                      </td>
                      <td className="py-3 font-bold text-right text-slate-900">
                        {stats.receitasProprias?.toLocaleString()}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-3 pl-4 text-slate-600">
                        Financ. Parceiros
                      </td>
                      <td className="py-3 font-bold text-right text-slate-900">
                        {stats.financiamentoParceiros?.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-20 p-10 border-l-8 border-blue-900 bg-slate-50 rounded-r-3xl">
              <p className="text-sm text-slate-500 italic text-justify leading-relaxed">
                Estes indicadores refletem a performance operacional do Songo
                durante o {semester ? `${semester}º Semestre de ` : ""} {year}.
                Os dados foram extraídos dos sistemas integrados de gestão
                académica e financeira, servindo como base analítica para as
                seções subsequentes deste documento.
              </p>
            </div>
          </div>
        )}

        {/* Content Sections */}
        {sections.map((section, idx) => (
          <div
            key={idx}
            className="w-[21cm] min-h-[29.7cm] bg-white shadow-2xl print:shadow-none p-[2.5cm] space-y-10 relative overflow-hidden page-break-after-always"
          >
            <h3 className="text-2xl font-black mb-10 border-b-4 border-slate-900 pb-4 flex items-center gap-6  tracking-tighter text-slate-900">
              <span className="bg-slate-900 text-white w-10 h-10 flex items-center justify-center text-lg font-black">
                {idx + 1}
              </span>
              {section.title}
            </h3>
            <div className="text-justify leading-[1.8] space-y-6 text-base text-slate-800 whitespace-pre-wrap font-sans">
              {section.content}
            </div>

            {/* Page Footer */}
            <div className="absolute bottom-10 left-[2.5cm] right-[2.5cm] flex justify-between items-center text-[10px] text-slate-400 font-sans tracking-widest border-t border-slate-50 pt-4">
              <span>Songo • RELATÓRIO DE ACTIVIDADES {year}</span>
              <span className="font-bold">
                Página{" "}
                {idx + 4 + (stats ? 1 : 0) + (abbreviations.length > 0 ? 1 : 0)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

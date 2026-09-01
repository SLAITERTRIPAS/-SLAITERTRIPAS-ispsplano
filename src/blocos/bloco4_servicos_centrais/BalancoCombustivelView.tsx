import React from "react";
import {
  Printer,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { isSuperBossUser } from "../../lib/auth";
import { printElementById } from "../../lib/printUtils";

export default function BalancoCombustivelView({
  user,
  onBack,
}: {
  user?: any;
  onBack?: () => void;
}) {
  const handlePrint = () => {
    printElementById(
      "balanco-combustivel-area",
      "Balanço de Combustível - Songo",
      "landscape",
      "A4",
    );
  };

  // Restrição: Apenas Repartição de Transporte
  const userSetor = user?.setor || user?.departamento || "";
  const isTransporte =
    userSetor === "Transporte" || userSetor === "Repartição de Transporte";

  if (!isTransporte && !isSuperBossUser(user)) {
    return (
      <div className="p-6 text-red-600 font-bold">
        Acesso não autorizado a este balanço.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-slate-50 min-h-screen pb-12 print:bg-white print:p-0">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200 print:hidden sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-black tracking-tighter text-[#121c60] flex items-center gap-2">
            <TrendingUp size={24} className="text-orange-500" />
            Balanço de Combustível (Institucional)
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Controle de Entrada e Saída (Registro por
            Direção/Departamento/Repartição)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="bg-slate-100 text-[#121c60] border border-slate-200 p-2.5 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 text-xs font-bold"
              title="Voltar"
            >
              <span className="hidden sm:inline">Voltar</span>
            </button>
          )}
          <button
            onClick={handlePrint}
            className="bg-[#121c60] text-white p-2.5 rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2 text-xs font-bold"
            title="Imprimir Balanço"
          >
            <Printer size={16} />
            <span className="hidden sm:inline">Imprimir Ficha</span>
          </button>
        </div>
      </div>

      <div
        id="balanco-combustivel-area"
        data-print-type="balanco"
        className="max-w-[297mm] mx-auto bg-white p-12 shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-0 relative font-serif pt-16"
      >
        {/* Decorative Top Bar */}
        <div className="h-4 w-full flex absolute top-0 left-0">
          <div className="w-2/3 bg-blue-900"></div>
          <div className="w-1/3 bg-red-600"></div>
        </div>
        <div className="text-center mb-10 border-b-2 border-slate-900 pb-10 relative">
          <div className="w-32 h-32 mx-auto mb-6 bg-white overflow-hidden p-1">
            <img
              src="https://lh3.googleusercontent.com/d/11zvvpOpZARM1yk_irEDpjJ-qBKlTlhad"
              alt="Logo Songo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-black  tracking-widest text-[#121c60]">
              INSTITUTO SUPERIOR POLITÉCNICO DO SONGO
            </h1>
            <p className="text-xs  font-bold text-slate-600 tracking-wider">
              Direção De Coordenação De Serviços De Administração, Finanças E De
              Apoio (DICOSAFA)
            </p>
            <p className="text-[11px]  font-bold text-slate-500 tracking-widest">
              Departamento De Património
            </p>
            <p className="text-[11px]  font-bold text-slate-500 tracking-widest">
              Repartição de Transporte
            </p>
            <p className="text-[11px]  font-black text-slate-800 tracking-[0.2em] pt-1">
              SETOR DE COMBUSTIVEL
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center">
            <h2 className="text-xl font-black  tracking-[0.3em] text-slate-900 border-b-2 border-slate-900 pb-1 px-4 inline-block">
              Balanço de Entrada e Saída de Combustível
            </h2>
          </div>

          <div className="absolute top-0 right-0 w-32 text-right hidden md:block">
            <span className="text-[10px]  font-black tracking-widest text-slate-400">
              DOC: RTC-001/26
            </span>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8 grid grid-cols-2 gap-4 text-sm print:grid-cols-4 print:p-0 print:border-none print:bg-white">
          <div>
            <span className="text-[10px] text-slate-500 font-bold  block mb-1">
              Mês de Referência
            </span>
            <span className="font-medium text-slate-900">Maio 2026</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold  block mb-1">
              Responsável
            </span>
            <span className="font-medium text-slate-900">
              Repartição de Transporte
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-[#121c60] text-white">
                <th className="p-3 font-bold border border-slate-700 text-center w-24">
                  Data
                </th>
                <th className="p-3 font-bold border border-slate-700 text-center w-24">
                  Ação
                </th>
                <th className="p-3 font-bold border border-slate-700">
                  Descrição / Justificativo
                </th>
                <th className="p-3 font-bold border border-slate-700 text-center w-32 border-l-2">
                  Entrada (L)
                </th>
                <th className="p-3 font-bold border border-slate-700 text-center w-32">
                  Saída (L)
                </th>
                <th className="p-3 font-bold border border-slate-700 text-center w-32 border-l-2 bg-blue-900">
                  Saldo (L)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="p-3 border border-slate-300 font-mono text-xs text-center text-slate-600">
                  01/05/2026
                </td>
                <td className="p-3 border border-slate-300 text-center">
                  <span className="inline-block bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
                    SALDO INICIAL
                  </span>
                </td>
                <td className="p-3 border border-slate-300 font-medium text-slate-700">
                  Saldo transportado do mês anterior
                </td>
                <td className="p-3 border border-slate-300 text-center text-blue-600 font-bold border-l-2">
                  ---
                </td>
                <td className="p-3 border border-slate-300 text-center text-rose-600 font-bold">
                  ---
                </td>
                <td className="p-3 border border-slate-300 text-center font-mono font-black text-slate-800 border-l-2 bg-slate-50">
                  1,500.00
                </td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="p-3 border border-slate-300 font-mono text-xs text-center text-slate-600">
                  05/05/2026
                </td>
                <td className="p-3 border border-slate-300 text-center">
                  <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded font-mono flex items-center justify-center gap-1">
                    <ArrowUpRight size={10} /> ENTRADA
                  </span>
                </td>
                <td className="p-3 border border-slate-300 font-medium text-slate-700">
                  Reabastecimento Petromoc Songo (Guia #4023)
                </td>
                <td className="p-3 border border-slate-300 text-center text-blue-600 font-bold border-l-2">
                  + 2,000.00
                </td>
                <td className="p-3 border border-slate-300 text-center text-rose-600 font-bold">
                  ---
                </td>
                <td className="p-3 border border-slate-300 text-center font-mono font-black text-slate-800 border-l-2 bg-slate-50">
                  3,500.00
                </td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="p-3 border border-slate-300 font-mono text-xs text-center text-slate-600">
                  10/05/2026
                </td>
                <td className="p-3 border border-slate-300 text-center">
                  <span className="inline-block bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded font-mono flex items-center justify-center gap-1">
                    <ArrowDownRight size={10} /> SAÍDA
                  </span>
                </td>
                <td className="p-3 border border-slate-300 font-medium text-slate-700">
                  Abastecimento Frota DAF (Toyota Hilux ALD-502-MC)
                </td>
                <td className="p-3 border border-slate-300 text-center text-blue-600 font-bold border-l-2">
                  ---
                </td>
                <td className="p-3 border border-slate-300 text-center text-rose-600 font-bold">
                  - 80.00
                </td>
                <td className="p-3 border border-slate-300 text-center font-mono font-black text-slate-800 border-l-2 bg-slate-50">
                  3,420.00
                </td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="p-3 border border-slate-300 font-mono text-xs text-center text-slate-600">
                  12/05/2026
                </td>
                <td className="p-3 border border-slate-300 text-center">
                  <span className="inline-block bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded font-mono flex items-center justify-center gap-1">
                    <ArrowDownRight size={10} /> SAÍDA
                  </span>
                </td>
                <td className="p-3 border border-slate-300 font-medium text-slate-700">
                  Gerador Central (Requisição #102)
                </td>
                <td className="p-3 border border-slate-300 text-center text-blue-600 font-bold border-l-2">
                  ---
                </td>
                <td className="p-3 border border-slate-300 text-center text-rose-600 font-bold">
                  - 150.00
                </td>
                <td className="p-3 border border-slate-300 text-center font-mono font-black text-slate-800 border-l-2 bg-slate-50">
                  3,270.00
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 border-t-2 border-slate-400">
                <td
                  colSpan={3}
                  className="p-3 font-black text-right text-slate-700  tracking-widest text-xs"
                >
                  Total Parcial (Litros)
                </td>
                <td className="p-3 text-center border border-slate-300 text-blue-700 font-black font-mono border-l-2">
                  2,000.00
                </td>
                <td className="p-3 text-center border border-slate-300 text-rose-700 font-black font-mono">
                  230.00
                </td>
                <td className="p-3 text-center border border-slate-300 text-slate-900 font-black font-mono border-l-2 text-lg">
                  3,270.00
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-20 grid grid-cols-2 gap-12 text-sm text-center">
          <div>
            <div className="border-b border-black mb-2 pb-14 w-2/3 mx-auto"></div>
            <p className="font-bold">O Chefe da Repartição de Transporte</p>
            <p className="text-[10px]  text-slate-500 mt-1">
              Elaborado por
            </p>
          </div>
          <div>
            <div className="border-b border-black mb-2 pb-14 w-2/3 mx-auto"></div>
            <p className="font-bold">Direção de Administração e Finanças</p>
            <p className="text-[10px]  text-slate-500 mt-1">
              Homologado por
            </p>
          </div>
        </div>

        <style
          dangerouslySetInnerHTML={{
            __html: `
          @media print {
            @page {
              size: A4 landscape;
              margin: 1cm;
            }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `,
          }}
        />
      </div>
    </div>
  );
}

import React from "react";

export const ActivityTableHeader = React.memo(function ActivityTableHeader({
  isDPEP,
  onToggleSelectAll,
  isAllSelected,
}: {
  isDPEP: boolean;
  onToggleSelectAll?: () => void;
  isAllSelected?: boolean;
}) {
  return (
    <thead className="bg-[#4f81bd] text-white text-[9.5px]  font-black tracking-tight text-center align-middle">
      <tr className="border-t-2 border-slate-950">
        <th
          className="p-1 border-2 border-slate-950 whitespace-nowrap w-7 text-center no-print th-checkbox"
          rowSpan={2}
        >
          <input
            type="checkbox"
            checked={Boolean(isAllSelected)}
            onChange={onToggleSelectAll || (() => {})}
            readOnly={!onToggleSelectAll}
            disabled={!onToggleSelectAll}
            className="cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title={
              onToggleSelectAll
                ? "Selecionar / Desselecionar Todas"
                : "Seleção indisponível"
            }
          />
        </th>
        <th
          className="p-1 border-2 border-slate-950 whitespace-nowrap w-8 text-center text-[9.5px]"
          rowSpan={2}
        >
          N/O
        </th>
        <th
          className="p-1 border-2 border-slate-950 whitespace-nowrap w-10 text-center text-[9.5px] bg-indigo-900"
          rowSpan={2}
        >
          Nº Dir.
        </th>
        <th
          className="p-1 border-2 border-slate-950 font-black tracking-widest text-[10.5px]"
          colSpan={isDPEP ? 5 : 3}
        >
          I. IDENTIFICAÇÃO
        </th>
        <th
          className="p-1 border-2 border-slate-950 font-black tracking-widest text-[10.5px]"
          colSpan={3}
        >
          II. ATIVIDADE
        </th>
        <th
          className="p-1 border-2 border-slate-950 font-black tracking-widest text-[10.5px]"
          colSpan={2}
        >
          V. TEMPO E DURAÇÃO
        </th>
        <th
          className="p-1 border-2 border-slate-950 font-black tracking-widest text-[10.5px]"
          colSpan={1}
        >
          VI. TRANS
        </th>
        <th
          className="p-1 border-2 border-slate-950 font-black tracking-widest text-[10.5px]"
          colSpan={5}
        >
          VII. RUBRICAS E NECESSIDADES
        </th>
        <th
          className="p-1 border-2 border-slate-950 font-black tracking-widest text-[9.5px] w-20"
          rowSpan={2}
        >
          IX. OBSERVAÇÕES
        </th>
        <th
          className="p-1 border-2 border-slate-950 font-black tracking-widest text-[9.5px] w-14 text-center no-print th-actions"
          rowSpan={2}
        >
          Estado
        </th>
        <th
          className="p-1 border-2 border-slate-950 font-black tracking-widest text-[9.5px] w-12 text-center no-print th-actions"
          rowSpan={2}
        >
          Ações
        </th>
      </tr>
      <tr>
        {/* I. IDENTIFICAÇÃO */}
        <th
          className="p-1 border-2 border-slate-950 text-[9px] font-black w-10 text-center"
          rowSpan={1}
        >
          ÓRGÃO
        </th>
        <th
          className="p-1 border-2 border-slate-950 text-[9px] font-black w-14 text-center"
          rowSpan={1}
        >
          DIREÇÃO
        </th>
        <th
          className="p-1 border-2 border-slate-950 text-[9px] font-black w-14 text-center"
          rowSpan={1}
        >
          DEPARTAMENTO
        </th>
        {isDPEP && (
          <>
            <th
              className="p-1 border-2 border-slate-950 text-[9px] font-black w-14 text-center"
              rowSpan={1}
            >
              FONTE DE RECEITA
            </th>
            <th
              className="p-1 border-2 border-slate-950 text-[9px] font-black w-10 text-center"
              rowSpan={1}
            >
              PRIORIDADE
            </th>
          </>
        )}

        {/* II. ATIVIDADE */}
        <th
          className="p-1 border-2 border-slate-950 text-[9px] font-black w-24 text-center whitespace-nowrap"
          rowSpan={1}
        >
          Cód./Atividade
        </th>
        <th
          className="p-1 border-2 border-slate-950 text-[9.5px] font-black"
          rowSpan={1}
        >
          Nome da atividade
        </th>
        <th
          className="p-1 border-2 border-slate-950 text-[9px] font-black"
          rowSpan={1}
        >
          Objetivo da atividade
        </th>

        {/* V. TEMPO E DURAÇÃO */}
        <th
          className="p-1 border-2 border-slate-950 text-[9px] font-black w-12 text-center"
          rowSpan={1}
          title="Periodicidade e Trimestre de Execução (Mensal, Semestral, Trimestral, Anual)"
        >
          Trimestre / Período
        </th>
        <th
          className="p-1 border-2 border-slate-950 text-[9px] font-black w-14 text-center whitespace-nowrap"
          rowSpan={1}
          title="Mês de realização"
        >
          Mês/Real.
        </th>

        {/* VI. TRANS */}
        <th
          className="p-1 border-2 border-slate-950 text-[9px] font-black w-8 text-center whitespace-nowrap"
          rowSpan={1}
          title="Necessidade de Transporte"
        >
          N/T
        </th>

        {/* VII. RUBRICAS E NECESSIDADES */}
        <th
          className="p-1 border-2 border-slate-950 text-[9px] font-black w-28"
          rowSpan={1}
        >
          Rúbrica
        </th>
        <th
          className="p-1 border-2 border-slate-950 text-[9px] font-black w-28"
          rowSpan={1}
        >
          Necessidade
        </th>
        <th
          className="p-1 border-2 border-slate-950 text-[9px] font-black w-10 text-center"
          rowSpan={1}
        >
          QUANT
        </th>
        <th
          className="p-1 border-2 border-slate-950 text-[9px] font-black w-16 text-right"
          rowSpan={1}
        >
          Unitário (MT)
        </th>
        <th
          className="p-1 border-2 border-slate-950 text-[9px] font-black w-20 text-right"
          rowSpan={1}
        >
          VALOR TOTAL GERAL (MZN)
        </th>
      </tr>
    </thead>
  );
});

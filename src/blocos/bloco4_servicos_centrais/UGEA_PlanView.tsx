import React from "react";
import { ArrowLeft, FileText, Target, Building2 } from "lucide-react";
import { MatrixActivity } from "../../types";
import { getAuthorizedActivities } from "../../lib/auth";

interface UGEAPlanViewProps {
  type: "Aquisicão" | "Contratação";
  activities: MatrixActivity[];
  user?: any;
  onBack: () => void;
}

export default function UGEAPlanView({
  type,
  activities,
  user,
  onBack,
}: UGEAPlanViewProps) {
  // Filter activities based on the requested plan type AND user permissions
  const authorizedActivities = getAuthorizedActivities(activities, user);
  const planActivities = authorizedActivities.filter((a) => {
    if (type === "Aquisicão") return a.necessitaAquisicao === "Sim";
    if (type === "Contratação") return a.necessitaContratacao === "Sim";
    return false;
  });

  const totalOrcamento = planActivities.reduce(
    (acc, a) => acc + (a.total || a.valor || 0),
    0,
  );

  return (
    <div className="h-full w-full bg-gray-50 flex flex-col p-6 font-sans">
      {/* Botão de Voltar */}
      <button
        onClick={onBack}
        className="mb-6 self-start text-blue-600 font-black text-[10px] tracking-widest  hover:underline flex items-center gap-2"
      >
        <ArrowLeft size={14} strokeWidth={3} /> Voltar ao Painel da UGEA
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full text-[10px] font-black tracking-widest text-blue-600 ">
            <Building2 size={12} />
            Unidade Gestora e Executora de Aquisições (UGEA)
          </div>
          <h1 className="text-2xl font-black text-blue-950">
            Plano de{" "}
            {type === "Aquisicão"
              ? "Aquisição de Bens e Materiais"
              : "Contratação de Serviços"}
          </h1>
        </div>

        <div className="flex flex-col md:items-end gap-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <span className="text-[9px] font-black tracking-widest text-slate-400 ">
            ORÇAMENTO GERAL DO PLANO (SOMA TOTAL)
          </span>
          <span className="text-xl md:text-2xl font-black text-blue-900">
            {totalOrcamento.toLocaleString("pt-MZ", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            MZN
          </span>
          <span className="text-[10px] font-bold text-emerald-600 mt-1">
            {planActivities.length} Actividades Activas
          </span>
        </div>
      </div>

      <div className="flex-grow overflow-auto">
        {planActivities.length > 0 ? (
          <div className="bg-white border text-sm border-gray-100 rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-blue-900 text-white text-[10px] tracking-wider">
                  <th className="p-4 font-black border-r border-blue-800">
                    N/O
                  </th>
                  <th className="p-4 font-black border-r border-blue-800">
                    NOME DA RUBRICA
                  </th>
                  <th className="p-4 font-black border-r border-blue-800">
                    NOME DA NECESSIDADE
                  </th>
                  <th className="p-4 font-black border-r border-blue-800">
                    NOME DO PRODUTO/SERVICO
                  </th>
                  <th className="p-4 font-black border-r border-blue-800">
                    QUANTIDADE
                  </th>
                  <th className="p-4 font-black border-r border-blue-800">
                    PREÇO UNITÁRIO
                  </th>
                  <th className="p-4 font-black border-r border-blue-800">
                    VALOR TOTAL
                  </th>
                </tr>
              </thead>
              <tbody>
                {planActivities.flatMap((activity, index) => {
                  const rubricas = Array.isArray(activity.rubricas) && activity.rubricas.length > 0
                    ? activity.rubricas
                    : [
                        {
                          rubrica: activity.rubrica || "—",
                          necessidade: activity.necessidade || "—",
                          especificacao: activity.especificacoes || "",
                          detalhes: activity.detalhes || "",
                          quantidade: activity.quantidade || activity.numeroPessoas || 1,
                          precoUnitario: activity.unitario || activity.precoUnitario || 0,
                          valorTotal: activity.valor || activity.total || 0,
                        },
                      ];

                  return rubricas.map((rubricaItem: any, rIdx: number) => (
                    <tr
                      key={`${activity.id}-${rIdx}`}
                      className="border-b hover:bg-gray-50 transition-colors text-xs"
                    >
                      <td className="p-4 border-r font-bold text-gray-700">
                        {rIdx === 0 ? (activity.no || String(index + 1).padStart(2, "0")) : ""}
                      </td>
                      <td className="p-4 border-r font-medium text-gray-800">
                        {rubricaItem.rubrica}
                      </td>
                      <td className="p-4 border-r font-medium text-gray-800">
                        {rubricaItem.necessidade}
                      </td>
                      <td className="p-4 border-r font-bold text-gray-900">
                        {rIdx === 0 ? (activity.title || activity.produtoServico || "—") : ""}
                      </td>
                      <td className="p-4 border-r font-semibold text-gray-700">
                        {rubricaItem.quantidade}
                      </td>
                      <td className="p-4 border-r font-medium text-gray-700">
                        {(rubricaItem.precoUnitario || 0).toLocaleString("pt-MZ", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }) + " MZN"}
                      </td>
                      <td className="p-4 border-r font-black text-blue-900">
                        {(rubricaItem.valorTotal || 0).toLocaleString("pt-MZ", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }) + " MZN"}
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <Target size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">
              Não existem actividades consolidadas no Plano de{" "}
              {type === "Aquisicão" ? "Aquisição" : "Contratação"} para o
              próximo ano.
            </p>
            <p className="text-gray-400 text-sm mt-2">
              As actividades aparecerão aqui quando forem planeadas com a opção
              'Necessita{" "}
              {type === "Aquisicão"
                ? "bens/materiais"
                : "contratação de serviço"}
              ' selecionada.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useMemo } from "react";
import { 
  getActivityDisplayNo, 
  getActivityGroup, 
  ActivitySelectionContext, 
  isDuplicateActivity,
  isValidActivity
} from "./PlanoHelpers";
import { 
  getDirectionAbbreviation, 
  getDepartmentAbbreviation, 
  getActivityInitials 
} from "../../../lib/utils";
import { firestoreService } from "../../../lib/firestoreService";
import { PRIORIDADES, FONTES_RECEITA } from "../../../constants/formOptions";

export const ActivityTableRow = React.memo(function ActivityTableRow({
  activity,
  getActivityTotal,
  actions,
  onUpdateExecution,
  onUpdateRelatorio,
  onUpdateApproval,
  onViewHistory,
  onRolloverYear,
  index,
  isDPEP,
  user,
  isBossOrAdmin,
  isReadOnly = false,
}: {
  activity: any;
  getActivityTotal: (act: any) => number;
  actions: React.ReactNode;
  onUpdateExecution?: (id: string, status: string) => void;
  onUpdateRelatorio?: (id: string, relatorio: string) => void;
  onUpdateApproval?: (id: string, approvalStatus: string) => void;
  onViewHistory?: (activity: any) => void;
  onRolloverYear?: (id: string) => void;
  index?: number;
  isDPEP?: boolean;
  user?: any;
  isBossOrAdmin?: boolean;
  rawActivities?: any[];
  selectedActivityIds?: string[];
  onToggleSelect?: (id: string) => void;
  onEditActivity?: (activity: any) => void;
  isReadOnly?: boolean;
}) {
  if (!activity || !isValidActivity(activity)) return null;

  const { rawActivities, selectedActivityIds, onToggleSelect, onEditActivity } =
    React.useContext(ActivitySelectionContext);
  
  const actGroup = getActivityGroup(activity, rawActivities || []);
  const actGroupIds = actGroup.map((g) => g.id).filter(Boolean);
  const isSelected =
    actGroupIds.length > 0
      ? actGroupIds.every((id) => (selectedActivityIds || []).includes(id))
      : (selectedActivityIds || []).includes(activity.id);

  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState(
    activity.prioridade || "Média",
  );
  const [selectedFonte, setSelectedFonte] = useState(
    activity.fonteReceita || activity.orcamento || "Orçamento do Estado",
  );

  const isAuthorizedForPESOE = useMemo(() => {
    if (isDPEP || isBossOrAdmin) return true;
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
  }, [isDPEP, isBossOrAdmin, user]);

  const rubricas = useMemo(
    () =>
      Array.isArray(activity.rubricas) && activity.rubricas.length > 0
        ? activity.rubricas
        : [
            {
              rubrica: activity.rubrica || "Sem rubrica",
              necessidade: activity.necessidade || "Sem necessidade",
              especificacao: activity.especificacoes || "",
              detalhes: activity.detalhes || "",
              quantidade: activity.quantidade || 0,
              numeroPessoas: activity.numeroPessoas || 0,
              precoUnitario: activity.unitario || 0,
              valorTotal:
                activity.ajudaCusto ||
                activity.valorTotal ||
                getActivityTotal(activity) || 0,
            },
          ],
    [activity, getActivityTotal],
  );

  return (
    <>
      {rubricas.map((rubricaItem: any, rIdx: number) => {
        const getRubricaTotal = (r: any) => {
          if (r.valorTotal) return Number(r.valorTotal);
          const q = Number(r.quantidade || 0);
          const p = Number(r.precoUnitario || 0);
          return q * p;
        };

        const totalRowValue = getRubricaTotal(rubricaItem);
        const isLastRow = rIdx === rubricas.length - 1;
        const rowBorderClasses = isLastRow
          ? "border-b-[5px] border-double border-b-slate-900 [&>td]:border-b-[5px] [&>td]:border-double [&>td]:border-b-slate-900"
          : "border-b border-slate-300 [&>td]:border-b [&>td]:border-slate-300";

        return (
          <tr
            key={`${activity.id || index}-${rIdx}`}
            className={`hover:bg-[#dbe5f1] transition-colors ${activity.submetido ? "bg-[#f2f2f2] text-slate-500" : "bg-[#eff3f8]"} ${rowBorderClasses}`}
          >
            {/* Checkbox */}
            <td
              className="p-1 text-center border-r border-slate-300 bg-white w-8 no-print td-checkbox"
              rowSpan={rubricas.length}
              hidden={rIdx > 0}
            >
              <input
                type="checkbox"
                checked={Boolean(isSelected)}
                onChange={() => !isReadOnly && onToggleSelect?.(activity.id)}
                readOnly={isReadOnly || !onToggleSelect}
                disabled={isReadOnly || !onToggleSelect}
                className="cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              />
            </td>
            {/* Nº */}
            <td
              className={`p-1 text-center font-bold border-r border-slate-300 text-slate-900 bg-[#c6d9f1] transition-colors group relative w-10 text-xs ${isReadOnly ? "cursor-default" : "cursor-pointer hover:bg-[#b8cdf0]"}`}
              onClick={() => !isReadOnly && onToggleSelect?.(activity.id)}
              title={isReadOnly ? undefined : "Clique para selecionar esta atividade e todas as suas necessidades"}
              rowSpan={rubricas.length}
              hidden={rIdx > 0}
            >
              {!isReadOnly && (isBossOrAdmin || activity.userId === user?.id) ? (
                <input
                  type="text"
                  defaultValue={
                    getActivityDisplayNo(activity) ??
                    (index !== undefined ? String(index + 1).padStart(3, "0") : "001")
                  }
                  className="w-10 text-center bg-transparent border-none focus:ring-2 focus:ring-blue-500 rounded font-bold cursor-text p-0 text-xs font-mono"
                  onClick={(e) => e.stopPropagation()}
                  onBlur={async (e) => {
                    const newVal = e.target.value.trim();
                    if (newVal && newVal !== getActivityDisplayNo(activity)) {
                      const parsed = parseInt(newVal.replace(/[^\d]/g, ""), 10);
                      const newNo = !isNaN(parsed) && parsed > 0 ? String(parsed).padStart(3, "0") : newVal;

                      const dirInitials = getDirectionAbbreviation(
                        activity.direcao || activity.unidadeOrganica || "Songo",
                      ).toUpperCase();
                      const sectorOrDept = activity.setor || activity.reparticao || activity.departamento || "Geral";
                      const deptInitials = getDepartmentAbbreviation(
                        sectorOrDept,
                      ).toUpperCase();
                      const actInitials = getActivityInitials(
                        activity.nomeActividade ||
                          activity.title ||
                          activity.designacao ||
                          "",
                      );

                      const newCode = [
                        dirInitials !== "-" ? dirInitials : "Songo",
                        deptInitials !== "-" ? deptInitials : "Geral",
                        newNo,
                        actInitials,
                      ]
                        .filter(Boolean)
                        .join("/");

                      await firestoreService.matrixActivities.update(
                        activity.id,
                        {
                          no: newNo,
                          numeroActividade: newNo,
                          nActividade: newNo,
                          codigoActividade: newCode,
                          referencia: newCode,
                        },
                      );
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                />
              ) : (
                <span className="font-mono font-bold">
                  {getActivityDisplayNo(activity) ??
                    (index !== undefined ? String(index + 1).padStart(3, "0") : "001")}
                </span>
              )}
            </td>
            {/* Nº Direção */}
            <td
              className="p-1 text-center font-black border-r border-slate-300 text-white bg-indigo-800 w-12 text-[10px]"
              rowSpan={rubricas.length}
              hidden={rIdx > 0}
            >
              {activity.numeroDirecao || "-"}
            </td>

            {/* I. IDENTIFICAÇÃO */}
            <td
              className="p-1 border-r border-slate-300 text-[10px] text-slate-600 font-semibold text-center whitespace-nowrap w-12"
              title={
                activity.unidadeOrganica ||
                activity.unidadeSelecionada ||
                "Songo"
              }
              rowSpan={rubricas.length}
              hidden={rIdx > 0}
            >
              {(() => {
                let orgao =
                  activity.unidadeOrganica ||
                  activity.unidadeSelecionada ||
                  "Songo";
                let dir = activity.direcao || "Geral";
                if (
                  orgao.includes("Diretor-Geral") &&
                  dir.includes("Direção e Gestão")
                ) {
                  orgao = dir;
                }
                return getDirectionAbbreviation(orgao);
              })()}
            </td>
            <td
              className="p-1 border-r border-slate-300 text-[10px] font-bold text-slate-800 text-center whitespace-nowrap w-16"
              title={activity.direcao || "Geral"}
              rowSpan={rubricas.length}
              hidden={rIdx > 0}
            >
              {(() => {
                let orgao =
                  activity.unidadeOrganica ||
                  activity.unidadeSelecionada ||
                  "Songo";
                let dir = activity.direcao || "Geral";
                if (
                  orgao.includes("Diretor-Geral") &&
                  dir.includes("Direção e Gestão")
                ) {
                  dir = orgao;
                }
                return getDirectionAbbreviation(dir);
              })()}
            </td>
            <td
              className="p-1 border-r border-slate-300 text-[10px] font-medium text-slate-600 text-center whitespace-nowrap w-16"
              title={activity.departamento || "Geral"}
              rowSpan={rubricas.length}
              hidden={rIdx > 0}
            >
              {activity.departamento
                ? getDepartmentAbbreviation(activity.departamento)
                : "Geral"}
            </td>
            {isDPEP && (
              <>
                <td
                  className="p-1 border-r border-slate-300 text-[10px] text-center font-black text-blue-700 bg-blue-50/10 whitespace-nowrap w-16"
                  rowSpan={rubricas.length}
                  hidden={rIdx > 0}
                >
                  {activity.fonteReceita || activity.orcamento || "OE"}
                </td>
                <td
                  className="p-1 border-r border-slate-300 text-[10px] text-center font-semibold text-slate-600 whitespace-nowrap w-12"
                  rowSpan={rubricas.length}
                  hidden={rIdx > 0}
                >
                  {activity.prioridade || "Média"}
                </td>
              </>
            )}

            {/* II. ATIVIDADE */}
            <td
              className="p-1 border-r border-slate-300 text-[10px] text-center font-bold text-blue-600 bg-blue-50/10 font-mono whitespace-nowrap w-24"
              rowSpan={rubricas.length}
              hidden={rIdx > 0}
            >
              {activity.codigoActividade ||
                activity.referencia ||
                activity.nActividade ||
                "-"}
            </td>
            <td
              className={`p-1.5 border-r border-slate-300 text-[10px] font-black text-slate-900 whitespace-normal break-words leading-tight transition-colors ${isReadOnly ? "cursor-default" : "cursor-pointer hover:bg-blue-50/50"}`}
              onClick={isReadOnly ? undefined : () => setShowOptionsModal(true)}
              title={isReadOnly ? undefined : "Clique sobre a atividade para gerir Opções (Aprovada / Reconduzida para ano+1)"}
              rowSpan={rubricas.length}
              hidden={rIdx > 0}
            >
              <div className="flex flex-col gap-1">
                <span className={isReadOnly ? "" : "underline decoration-dotted decoration-blue-500"}>
                  {activity.title}
                </span>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {activity.statusAprovacao === "aprovada" ||
                  activity.aprovada ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 ">
                      ✓ Aprovada
                    </span>
                  ) : null}
                  {activity.ano ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200 ">
                      Ano: {activity.ano}
                    </span>
                  ) : null}
                  {activity.requiresUpdate && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black bg-red-100 text-red-700 border border-red-200  animate-pulse">
                      Pendente Atualização
                    </span>
                  )}
                  {isDuplicateActivity(activity, rawActivities) && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black bg-amber-100 text-amber-900 border border-amber-300  shadow-sm">
                      ⚠️ Repetida
                    </span>
                  )}
                </div>
              </div>

              {showOptionsModal && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-scale-up"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 className="text-sm font-black text-slate-900  tracking-tight mb-2">
                      {isApproving
                        ? isAuthorizedForPESOE
                          ? "Aprovar Atividade (Plano 2027 & PESOE 2027)"
                          : "Aprovar Atividade (Plano 2027)"
                        : "Opções da Atividade"}
                    </h3>
                    <p className="text-[11px] text-slate-500 mb-4 font-medium leading-relaxed">
                      {activity.title}
                    </p>

                    {isApproving ? (
                      <div className="space-y-4 mb-6">
                        <div>
                          <label className="block text-[10px] font-black  text-slate-700 mb-1">
                            Nível de Prioridade
                          </label>
                          <select
                            value={selectedPriority}
                            onChange={(e) =>
                              setSelectedPriority(e.target.value)
                            }
                            className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold outline-none bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                          >
                            {PRIORIDADES.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black  text-slate-700 mb-1">
                            Fonte de Receita
                          </label>
                          <select
                            value={selectedFonte}
                            onChange={(e) => setSelectedFonte(e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold outline-none bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                          >
                            {FONTES_RECEITA.map((f) => (
                              <option key={f} value={f}>
                                {f}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 font-medium">
                          Ao aprovar, esta atividade será alocada para o{" "}
                          <strong>Plano 2027</strong>{isAuthorizedForPESOE ? <span> e <strong>PESOE 2027</strong></span> : null}.
                        </div>
                        <div className="flex gap-2 justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => setIsApproving(false)}
                            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                          >
                            Voltar
                          </button>
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const updateData = {
                                  statusAprovacao: "aprovada",
                                  aprovada: true,
                                  status: "institucional",
                                  isPESOE: true,
                                  situacaoActividade: "agendada",
                                  prioridade: selectedPriority,
                                  fonteReceita: selectedFonte,
                                  orcamento: selectedFonte,
                                  ano: 2027,
                                };
                                await firestoreService.matrixActivities.update(
                                  activity.id,
                                  updateData,
                                );
                                activity.statusAprovacao = "aprovada";
                                activity.aprovada = true;
                                activity.status = "institucional";
                                activity.isPESOE = true;
                                activity.situacaoActividade = "agendada";
                                activity.prioridade = selectedPriority;
                                activity.fonteReceita = selectedFonte;
                                activity.orcamento = selectedFonte;
                                activity.ano = 2027;
                                setShowOptionsModal(false);
                                setIsApproving(false);
                                alert(
                                  isAuthorizedForPESOE
                                    ? "Atividade aprovada com sucesso e distribuída para: Setor de Monitoria, PESOE e Plano Institucional!"
                                    : "Atividade aprovada com sucesso e distribuída para: Setor de Monitoria e Plano Institucional!"
                                );
                              } catch (err) {
                                console.error(err);
                                alert("Erro ao aprovar atividade.");
                              }
                            }}
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer"
                          >
                            Confirmar Aprovação
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2 mb-6">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsApproving(true);
                            }}
                            className="w-full p-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-800 rounded-2xl font-black text-xs text-left flex items-center justify-between group transition-all cursor-pointer"
                          >
                            <span>{isAuthorizedForPESOE ? "APROVAR PARA 2027 (PESOE)" : "APROVAR PARA 2027"}</span>
                            <span className="p-1.5 bg-emerald-600 text-white rounded-lg group-hover:scale-110 transition-transform">✓</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm("Deseja reconduzir esta atividade para o próximo ano fiscal (2027)?")) {
                                try {
                                  await firestoreService.matrixActivities.update(activity.id, {
                                    reconduzida: true,
                                    ano: 2027,
                                    status: "institucional"
                                  });
                                  alert("Atividade reconduzida para 2027!");
                                  setShowOptionsModal(false);
                                } catch(err) {
                                  alert("Erro ao reconduzir.");
                                }
                              }
                            }}
                            className="w-full p-4 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-800 rounded-2xl font-black text-xs text-left flex items-center justify-between group transition-all cursor-pointer"
                          >
                            <span>RECONDUZIR PARA ANO+1</span>
                            <span className="p-1.5 bg-indigo-600 text-white rounded-lg group-hover:scale-110 transition-transform">→</span>
                          </button>
                        </div>

                        <div className="flex justify-end pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setShowOptionsModal(false)}
                            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs shadow-lg cursor-pointer"
                          >
                            Fechar
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </td>
            <td
              className="p-1.5 border-r border-slate-300 text-[10px] text-slate-500 italic whitespace-normal break-words leading-tight"
              rowSpan={rubricas.length}
              hidden={rIdx > 0}
            >
              {activity.objetivoActividade || activity.objetivo || activity.especificacoes || "-"}
            </td>

            {/* V. TEMPO E DURAÇÃO */}
            <td
              className="p-1 border-r border-slate-300 text-[10px] font-black text-slate-700 text-center w-12"
              rowSpan={rubricas.length}
              hidden={rIdx > 0}
            >
              {(() => {
                const freq = activity.frequencia || "";
                const trims = Array.isArray(activity.trimestres) && activity.trimestres.length > 0 
                  ? activity.trimestres 
                  : [activity.trimestre].filter(Boolean);

                const formatTrimStr = (tList: any[]) => {
                  return tList.map((t: string) => {
                    const s = String(t).trim();
                    if (s.includes("1") || (s.toLowerCase().includes("i") && !s.toLowerCase().includes("ii") && !s.toLowerCase().includes("iv"))) return "1º";
                    if (s.includes("2") || s.toLowerCase().includes("ii")) return "2º";
                    if (s.includes("3") || s.toLowerCase().includes("iii")) return "3º";
                    if (s.includes("4") || s.toLowerCase().includes("iv")) return "4º";
                    const digits = s.replace(/\D/g, "");
                    if (digits) return `${digits}º`;
                    return s;
                  }).join(", ");
                };

                if (trims.length > 0) {
                  return formatTrimStr(trims);
                }

                if (freq === "Anual") return "1º, 2º, 3º, 4º (Anual)";
                if (freq === "Semestral") {
                  if (activity.semestre?.includes("1")) return "1º, 2º";
                  if (activity.semestre?.includes("2")) return "3º, 4º";
                  return "Semestral";
                }
                if (freq === "Mensal") return "1º, 2º, 3º, 4º (Mensal)";
                if (freq === "Trimestral") return "Trimestral";

                if (activity.semestre?.includes("1")) return "1º, 2º";
                if (activity.semestre?.includes("2")) return "3º, 4º";

                return "-";
              })()}
            </td>
            <td
              className="p-1 border-r border-slate-300 text-[10px] font-semibold text-slate-600 text-center w-14"
              rowSpan={rubricas.length}
              hidden={rIdx > 0}
            >
              {(() => {
                const ms = Array.isArray(activity.mesesRealizacao)
                  ? activity.mesesRealizacao
                  : [activity.mesRealizacao || activity.mes].filter(Boolean);
                if (ms.length === 0) return "-";
                if (ms.length > 2) return `${ms[0]}...`;
                return ms.join(", ");
              })()}
            </td>

            {/* VI. TRANSPORTE */}
            <td
              className="p-1 border-r border-slate-300 text-[10px] text-center font-bold w-8"
              rowSpan={rubricas.length}
              hidden={rIdx > 0}
            >
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] ${activity.necessitaTransporte === "Sim" ? "bg-amber-100 text-amber-800 font-black" : "bg-slate-100 text-slate-400"}`}
              >
                {activity.necessitaTransporte || "Não"}
              </span>
            </td>

            {/* VII. RUBRICAS E NECESSIDADES (Individual Rows) */}
            <td className="p-1.5 border-r border-slate-300 text-[10px] font-bold text-slate-800 w-28 leading-tight break-words whitespace-normal">
              {rubricaItem.rubrica || "-"}
            </td>
            <td className="p-1.5 border-r border-slate-300 text-[10px] text-slate-600 italic w-28 leading-tight break-words whitespace-normal">
              {rubricaItem.necessidade || rubricaItem.especificacao || "-"}
            </td>
            <td className="p-1 border-r border-slate-300 text-[10px] text-center font-black text-slate-700 w-10">
              {rubricaItem.quantidade || rubricaItem.numeroPessoas || "-"}
            </td>
            <td className="p-1 border-r border-slate-300 text-[10px] text-right font-medium text-slate-500 w-16">
              {rubricaItem.precoUnitario
                ? Number(rubricaItem.precoUnitario).toLocaleString("pt-MZ", {
                    minimumFractionDigits: 2,
                  })
                : "-"}
            </td>
            <td className="p-1 border-r border-slate-300 text-[10px] text-right font-black text-slate-900 w-20 bg-[#dbe5f1]">
              {totalRowValue
                ? totalRowValue.toLocaleString("pt-MZ", {
                    minimumFractionDigits: 2,
                  })
                : "-"}
            </td>

            {/* IX. OBSERVAÇÕES */}
            <td
              className="p-1.5 border-r border-slate-300 text-[10px] text-slate-400 font-medium w-20 leading-snug whitespace-normal break-words"
              rowSpan={rubricas.length}
              hidden={rIdx > 0}
            >
              {activity.observacoes || "-"}
            </td>

            {/* Estado */}
            <td
              className="p-1 border-r border-slate-300 text-center w-16 no-print td-actions"
              rowSpan={rubricas.length}
              hidden={rIdx > 0}
            >
              <div className="flex items-center justify-center gap-1">
                <span
                  className={`text-[8px] font-black  px-2 py-1 rounded-full border shadow-sm ${
                    activity.status === "institucional" || activity.status === "consolidated"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : activity.status === "direcao"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : activity.status === "departamento"
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                          : "bg-slate-50 text-slate-500 border-slate-200"
                  }`}
                >
                  {activity.status || "draft"}
                </span>
                {Array.isArray(activity.workflowHistory) && activity.workflowHistory.length > 0 && (
                  <button
                    onClick={() => onViewHistory?.(activity)}
                    className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition-all active:scale-90"
                    title="Ver Histórico de Tramitação e Assinaturas"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </button>
                )}
              </div>
            </td>

            {/* Ações */}
            <td
              className="p-1 text-center w-14 no-print td-actions"
              rowSpan={rubricas.length}
              hidden={rIdx > 0}
            >
              {actions}
            </td>
          </tr>
        );
      })}
    </>
  );
});

import React, { useState, useMemo, useRef } from "react";
import {
  Plus,
  Trash2,
  Save,
  FileText,
  Building2,
  Calendar as CalendarIcon,
  Target,
  Edit,
  Upload,
} from "lucide-react";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "motion/react";
import { FONTES_RECEITA, PRIORIDADES } from "../../constants/formOptions";
import { isSuperBossUser, getAuthorizedActivities } from "../../lib/auth";
import { isValidActivity } from "./plano/PlanoHelpers";
import { firestoreService } from "../../lib/firestoreService";
import { getActivityTotal } from "./systemUtils";
import {
  getDirectionAbbreviation,
  normalizeString,
  getStatusFromDates,
} from "../../lib/utils";
import { MatrixActivity } from "../../types";

import ActivityForm from "../bloco5_sistema/ActivityForm";

const getExcelValue = (
  item: any,
  synonyms: string[],
  defaultValue: any = "",
): any => {
  if (!item) return defaultValue;
  const keys = Object.keys(item);
  const normalizedSyns = synonyms.map((s) => normalizeString(s));

  for (const key of keys) {
    const normalizedKey = normalizeString(key);
    if (
      normalizedSyns.some(
        (syn) =>
          normalizedKey === syn ||
          normalizedKey.includes(syn) ||
          syn.includes(normalizedKey),
      )
    ) {
      return item[key];
    }
  }
  return defaultValue;
};

const parseNumericValue = (val: any): number => {
  if (val === undefined || val === null) return 0;
  if (typeof val === "number") return val;
  const str = val.toString().replace(/[^0-9,.-]/g, "");
  if (str.includes(",") && str.includes(".")) {
    if (str.indexOf(".") < str.indexOf(",")) {
      return parseFloat(str.replace(/\./g, "").replace(",", ".")) || 0;
    } else {
      return parseFloat(str.replace(/,/g, "")) || 0;
    }
  } else if (str.includes(",")) {
    const parts = str.split(",");
    if (parts[1] && (parts[1].length === 2 || parts[1].length === 1)) {
      return parseFloat(str.replace(",", ".")) || 0;
    } else {
      return parseFloat(str.replace(",", "")) || 0;
    }
  }
  return parseFloat(str) || 0;
};

export default function MatrixView({
  title,
  isDepartment,
  externalActivities: rawActivities,
  setExternalActivities,
  onFinalSubmit,
  onActivityAdded,
  onUpdateActivity,
  onDeleteActivity,
  user,
}: {
  title: string;
  isDepartment: boolean;
  externalActivities?: MatrixActivity[];
  setExternalActivities?: React.Dispatch<
    React.SetStateAction<MatrixActivity[]>
  >;
  onFinalSubmit?: (activities: MatrixActivity[]) => void;
  onActivityAdded?: (activity: MatrixActivity) => void;
  onUpdateActivity?: (id: string, data: Partial<MatrixActivity>) => void;
  onDeleteActivity?: (id: string) => void;
  user?: any;
}) {
  const externalActivities = useMemo(
    () => {
      const valid = (rawActivities || []).filter(isValidActivity);
      return getAuthorizedActivities(valid, user);
    },
    [rawActivities, user],
  );
  const nextYear = new Date().getFullYear() + 1;
  const viewTitle =
    title === "Matriz"
      ? `Matriz de Actividades - Ano ${nextYear} (Ano +1)`
      : title.startsWith("Plano") || title.startsWith("Matriz")
        ? title
        : isDepartment
          ? `Plano de Actividades - para ${nextYear}`
          : `Matriz de Actividades - Ano ${nextYear} (Ano +1)`;

  const [localActivities, setLocalActivities] = useState<MatrixActivity[]>([]);
  const activities = externalActivities || localActivities;
  const setActivities = setExternalActivities || setLocalActivities;

  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<MatrixActivity | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File upload triggered");
    const file = e.target.files?.[0];
    if (!file) {
      console.log("No file selected");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        console.log("File read success");
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData: any[] = XLSX.utils.sheet_to_json(ws);
        console.log("Parsed data:", jsonData);

        const newActivities: MatrixActivity[] = jsonData.map((item: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          unidadeOrganica: getExcelValue(item, [
            "unidade organica",
            "unidade",
            "organica",
            "setor",
            "sector",
          ]),
          direcao: getExcelValue(item, [
            "direcao",
            "direccao",
            "diretoria",
            "orgao",
            "diretor",
          ]),
          departamento: getExcelValue(item, ["departamento", "dept", "depto"]),
          reparticao: getExcelValue(item, ["reparticao", "repart", "seccao"]),
          orcamento: getExcelValue(item, [
            "orcamento",
            "fonte de receita",
            "fonte",
            "receita",
            "financiamento",
            "orcado",
          ]),
          no: getExcelValue(
            item,
            ["n", "no", "numero", "num", "id", "ordem"],
            "1",
          )?.toString(),
          title: getExcelValue(
            item,
            [
              "actividade",
              "nome",
              "descricao",
              "titulo",
              "nome da actividade",
              "descricao da actividade",
              "activity",
              "title",
              "description",
            ],
            "Actividade Importada",
          ),
          localRealizacao: getExcelValue(item, [
            "local",
            "realizacao",
            "local realizacao",
            "onde",
          ]),
          dataMes: getExcelValue(item, [
            "mes",
            "mes de realizacao",
            "cronograma",
            "data",
            "data/mes",
            "month",
            "periodo",
          ]),
          data: getExcelValue(item, [
            "data exata",
            "data inicio",
            "data fim",
            "datas",
          ]),
          status: "draft",
          valor: parseNumericValue(
            getExcelValue(
              item,
              [
                "valor",
                "custo",
                "preco",
                "orcamento estimado",
                "valor total",
                "total",
                "price",
                "value",
                "amount",
              ],
              0,
            ),
          ),
          rubrica: getExcelValue(item, [
            "rubrica",
            "classificacao",
            "rubrica orcamental",
            "item orcamental",
            "codigo",
          ]),
          necessidade: getExcelValue(item, [
            "necessidade",
            "recursos",
            "necessidades",
            "meios",
            "requisitos",
          ]),
          necessitaAquisicao: getExcelValue(item, [
            "aquisicao",
            "compra",
            "necessita aquisicao",
            "adquirir",
          ]),
          necessitaContratacao: getExcelValue(item, [
            "contratacao",
            "contratar",
            "necessita contratacao",
          ]),
          frequencia: getExcelValue(
            item,
            ["frequencia", "periodicidade", "frequent"],
            "Mensal",
          ),
          nivel: getExcelValue(
            item,
            [
              "nivel",
              "prioridade",
              "grau",
              "importancia",
              "nivel de prioridade",
            ],
            "Média",
          ),
          responsavel: getExcelValue(item, [
            "responsavel",
            "quem",
            "encarregado",
            "colaborador",
          ]),
          prazo: getExcelValue(item, [
            "prazo",
            "limite",
            "data limite",
            "deadline",
          ]),
          referencia: getExcelValue(item, ["referencia", "ref", "codigo ref"]),
          objetivoActividade: getExcelValue(item, [
            "objetivo",
            "meta",
            "proposito",
            "fim",
            "objetivos",
          ]),
          trabalhoProvincia: getExcelValue(item, [
            "provincia",
            "trabalho provincia",
          ]),
          trabalhoDistrito: getExcelValue(item, [
            "distrito",
            "trabalho distrito",
          ]),
          outrosColaboradores: getExcelValue(item, [
            "outros",
            "participantes",
            "equipa",
            "outros colaboradores",
          ]),
          necessitaTransporte: getExcelValue(item, [
            "transporte",
            "necessita transporte",
            "viagem",
          ]),
          viatura: getExcelValue(item, [
            "viatura",
            "carro",
            "veiculo",
            "automovel",
          ]),
          motorista: getExcelValue(item, ["motorista", "condutor"]),
          observacoes: getExcelValue(item, [
            "observacao",
            "observacoes",
            "obs",
            "notas",
            "comentario",
          ]),
        }));

        setActivities([...newActivities, ...activities]);
        console.log("Activities updated");
      } catch (error) {
        console.error("Error parsing file:", error);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleAddActivity = (data: any) => {
    // Calculate total value
    const totalValue = getActivityTotal(data);

    // Get main rubric and necessity (from the first one)
    const mainRubric = data.rubricas?.[0]?.rubrica || "";
    const mainNecessity = data.rubricas?.[0]?.necessidade || "";

    const activity: MatrixActivity = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      unidadeOrganica:
        data.selectedCategory ||
        data.unidadeOrganica ||
        user?.unidadeOrganica ||
        user?.unidade ||
        "Songo",
      direcao:
        data.unidadeSelecionada ||
        data.direcao ||
        user?.direcao ||
        user?.servicoCentral ||
        "Direção Geral",
      departamento: (() => {
        const dStr = String(data.departamento || user?.departamento || "").trim();
        if (dStr) return dStr;
        const isUgea = 
          String(user?.departamento || "").toLowerCase().includes("ugea") ||
          String(user?.departamento || "").toLowerCase().includes("aquisi") ||
          String(data.departamento || "").toLowerCase().includes("ugea") ||
          String(data.departamento || "").toLowerCase().includes("aquisi") ||
          String(title || "").toLowerCase().includes("ugea") ||
          String(title || "").toLowerCase().includes("aquisi");
        return isUgea ? "Unidade Gestora e Executora de Aquisições" : "Departamento Geral";
      })(),
      reparticao:
        data.reparticao ||
        data.setor ||
        user?.reparticao ||
        user?.setor ||
        title ||
        "Repartição Geral",
      setor:
        data.setor ||
        data.reparticao ||
        user?.setor ||
        user?.sector ||
        user?.seccao ||
        user?.reparticao ||
        title ||
        "Setor Geral",
      orcamento: data.fonteReceita || "",
      nivel: data.prioridade || "Média",
      no: data.numeroActividade || data.nActividade || "1",
      title: data.nomeActividade || "Nova Actividade",
      localRealizacao:
        data.trabalhoProvincia && data.trabalhoDistrito
          ? `${data.trabalhoProvincia} - ${data.trabalhoDistrito}`
          : data.realizacaoProvincia && data.realizacaoDistrito
            ? `${data.realizacaoProvincia} - ${data.realizacaoDistrito}`
            : "",
      dataMes: data.mesRealizacao || data.dataInicio || "",
      data:
        data.dataInicio && data.dataFim
          ? `${data.dataInicio} a ${data.dataFim}`
          : data.dataInicio || data.dataFim || "",
      frequencia: data.frequencia || "Mensal",
      rubrica: mainRubric,
      necessidade: mainNecessity,
      necessitaAquisicao: data.necessitaAquisicao || "Não",
      necessitaContratacao: data.necessitaContratacao || "Não",
      valor: totalValue,
      status: "draft",
      responsavel: data.responsavel || "",
      prazo: data.dataFim || data.mesRealizacao || data.dataInicio || "",
      referencia: data.codigoActividade
        ? data.codigoActividade.toUpperCase()
        : `ACT-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
      ano: Number(data.ano || new Date().getFullYear() + 1),
      trimestre: data.trimestre || "",
      mesRealizacao: data.mesRealizacao || "",
      dataInicio: data.dataInicio || "",
      dataFim: data.dataFim || "",
      totalDias: Number(data.totalDias) || 0,
      distanciaKm: Number((data.distanciaKm || data.distanciaDestino || 0) * 2),
      distanciaDestino: Number(data.distanciaDestino || 0),
      litrosGasoleo: Number(data.litrosGasoleo || 0),
      precoLitro: Number(data.precoLitro || 0),
      valorTotalGasoleo: Number(data.valorTotalGasoleo || 0),
      prioridadeProposta: data.prioridadeProposta || "",
      codigoActividade: data.codigoActividade || "",
      curso: data.curso || "",
      rubricas: data.rubricas || [],
      outrosColaboradores: data.outrosColaboradores || "",
      necessitaTransporte: data.necessitaTransporte || "Não",
      viatura: data.viatura || "",
      motorista: data.motorista || "",
      observacoes: data.observacoes || "",
    };

    setActivities([activity, ...activities]);
    onActivityAdded?.(activity);
    setShowForm(false);
  };

  const updateActivity = async (
    id: string,
    field: keyof MatrixActivity,
    value: any,
  ) => {
    if (!isSuperBossUser(user)) {
      alert("Apenas o Administrador pode realizar esta alteração.");
      return;
    }
    if (onUpdateActivity) await onUpdateActivity(id, { [field]: value });
    else
      setActivities(
        activities.map((a) => (a.id === id ? { ...a, [field]: value } : a)),
      );
  };

  const removeActivity = async (id: string) => {
    const isAdminOrPlanificador =
      isSuperBossUser(user) ||
      user?.role === "admin" ||
      user?.role === "administrador" ||
      user?.role === "planificação" ||
      user?.role === "planificador";

    if (!isAdminOrPlanificador) {
      alert("Apenas o Administrador ou Planificador pode realizar esta exclusão.");
      return;
    }
    const deletedAct = activities.find((a) => a.id === id);
    if (onDeleteActivity) {
      await onDeleteActivity(id);
    } else {
      try {
        await firestoreService.matrixActivities.delete(id);
      } catch (err) {
        console.error("Erro ao eliminar da base de dados:", err);
      }
      const remaining = activities.filter((a) => a.id !== id);
      if (deletedAct) {
        const deletedDir = (
          deletedAct.direcao ||
          deletedAct.unidadeOrganica ||
          ""
        )
          .trim()
          .toLowerCase();
        const deletedDept = (deletedAct.departamento || "")
          .trim()
          .toLowerCase();
        const deletedYear = Number(deletedAct.ano || 0);

        const getNumericOrderVal = (act: any) => {
          const code = act.referencia || act.codigoActividade || "";
          const match = code.match(/(\d+)$/);
          if (match) {
            return parseInt(match[1], 10);
          }
          const rawNo = act.no || act.numeroAtividade || act.numeroActividade;
          if (rawNo) {
            const parsed = parseInt(rawNo, 10);
            if (!isNaN(parsed)) return parsed;
          }
          return 999999;
        };

        const otherGroups = remaining.filter((act) => {
          const actDir = (act.direcao || act.unidadeOrganica || "")
            .trim()
            .toLowerCase();
          const actDept = (act.departamento || "").trim().toLowerCase();
          const actYear = Number(act.ano || 0);
          return !(
            actDir === deletedDir &&
            actDept === deletedDept &&
            actYear === deletedYear
          );
        });

        const sameGroup = remaining.filter((act) => {
          const actDir = (act.direcao || act.unidadeOrganica || "")
            .trim()
            .toLowerCase();
          const actDept = (act.departamento || "").trim().toLowerCase();
          const actYear = Number(act.ano || 0);
          return (
            actDir === deletedDir &&
            actDept === deletedDept &&
            actYear === deletedYear
          );
        });

        const sorted = [...sameGroup].sort(
          (a, b) => getNumericOrderVal(a) - getNumericOrderVal(b),
        );

        const updatedGroup = sorted.map((act, i) => {
          const newNumStr = String(i + 1).padStart(3, "0");
          const updated = {
            ...act,
            no: newNumStr,
            numeroAtividade: newNumStr,
            numeroActividade: newNumStr,
          };

          if (act.codigoActividade) {
            const parts = String(act.codigoActividade).split("/");
            if (parts.length >= 3) {
              const numIdx = parts.findIndex((p: string) => /^\d+$/.test(p));
              const tempParts = [...parts];
              if (numIdx !== -1) tempParts[numIdx] = newNumStr;
              else tempParts[2] = newNumStr;
              updated.codigoActividade = tempParts.join("/");
            }
          }
          if (act.referencia) {
            const parts = String(act.referencia).split("/");
            if (parts.length >= 3) {
              const numIdx = parts.findIndex((p: string) => /^\d+$/.test(p));
              const tempParts = [...parts];
              if (numIdx !== -1) tempParts[numIdx] = newNumStr;
              else tempParts[2] = newNumStr;
              updated.referencia = tempParts.join("/");
            } else {
              const match = act.referencia.match(/(.*?)-(\d+)$/);
              if (match) {
                updated.referencia = `${match[1]}-${newNumStr}`;
              }
            }
          }
          return updated;
        });

        setActivities([...otherGroups, ...updatedGroup]);
      } else {
        setActivities(remaining);
      }
    }
  };

  return (
    <div className="w-full max-w-[90%] mx-auto space-y-4 md:space-y-8 pb-20 px-2 md:px-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-blue-900">
            {viewTitle}
          </h2>
          <p className="text-sm md:text-base text-gray-500">
            {isDepartment
              ? "Elabore o plano setorial do seu departamento com base nas diretrizes estratégicas."
              : "Defina as diretrizes estratégicas para os planos setoriais das direções."}
          </p>
        </div>
        {(title.includes("Plano") || title.includes("Matriz")) &&
          title !== "Minha Matriz" &&
          title !== "Plano Setorial" &&
          title !== "Plano Institucional" && (
            <div className="flex flex-col md:flex-row gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full md:w-auto bg-emerald-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 whitespace-nowrap"
              >
                <Upload size={20} /> IMPORTAR EXCEL
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx, .xls"
                style={{ display: "none" }}
              />
              <button
                onClick={() => setShowForm(true)}
                className="w-full md:w-auto bg-blue-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 whitespace-nowrap"
              >
                <Plus size={20} /> NOVO PLANO DE ATIVIDADE
              </button>
            </div>
          )}
      </div>

      <AnimatePresence>
        {(showForm || editingActivity) && (
          <div className="absolute inset-0 bg-white z-50 flex flex-col">
            <ActivityForm
              key={editingActivity?.id || "new-activity"}
              sectorName={title}
              planType={title || (isDepartment ? "Plano" : "Matriz")}
              plannedActivitiesProp={activities}
              plannedActivitiesCount={activities.length}
              title={
                editingActivity ? "Atualizar dados" : "Adicionar novo registo"
              }
              initialData={
                editingActivity || { ano: new Date().getFullYear() + 1 }
              }
              user={user}
              onClose={() => {
                setShowForm(false);
                setEditingActivity(null);
              }}
              onSubmit={
                editingActivity
                  ? (data) => {
                      if (data._forceNewRecord) {
                        handleAddActivity(data);
                        return;
                      }
                      const totalValue =
                        data.rubricas?.reduce(
                          (acc: number, r: any) =>
                            acc + (r.valorTotal || r.total || 0),
                          0,
                        ) || 0;
                      const mainRubric = data.rubricas?.[0]?.rubrica || "";
                      const mainNecessity =
                        data.rubricas?.[0]?.necessidade || "";

                      const updated: MatrixActivity = {
                        ...editingActivity,
                        ...data,
                        title:
                          data.nomeAtividade ||
                          data.nomeActividade ||
                          data.title ||
                          "",
                        valor: totalValue,
                        rubrica: mainRubric,
                        necessidade: mainNecessity,
                        unidadeOrganica:
                          data.selectedCategory ||
                          data.unidadeOrganica ||
                          editingActivity.unidadeOrganica ||
                          user?.unidadeOrganica ||
                          user?.unidade ||
                          "Songo",
                        direcao:
                          data.unidadeSelecionada ||
                          data.direcao ||
                          editingActivity.direcao ||
                          user?.direcao ||
                          user?.servicoCentral ||
                          "Direção Geral",
                        departamento:
                          data.departamento ||
                          editingActivity.departamento ||
                          user?.departamento ||
                          ((() => {
                            const isUgea = 
                              String(user?.departamento || "").toLowerCase().includes("ugea") ||
                              String(user?.departamento || "").toLowerCase().includes("aquisi") ||
                              String(data.departamento || "").toLowerCase().includes("ugea") ||
                              String(data.departamento || "").toLowerCase().includes("aquisi") ||
                              String(title || "").toLowerCase().includes("ugea");
                            return isUgea ? "Unidade Gestora e Executora de Aquisições" : "Departamento Geral";
                          })()),
                        reparticao:
                          data.reparticao ||
                          data.setor ||
                          editingActivity.reparticao ||
                          user?.reparticao ||
                          user?.setor ||
                          title ||
                          "Repartição Geral",
                        setor:
                          data.setor ||
                          data.reparticao ||
                          editingActivity.setor ||
                          user?.setor ||
                          user?.sector ||
                          user?.seccao ||
                          user?.reparticao ||
                          title ||
                          "Setor Geral",
                        no:
                          data.numeroAtividade ||
                          data.nActividade ||
                          data.no ||
                          "",
                        responsavel: data.responsavel || "",
                        prazo:
                          data.dataFim ||
                          data.mesRealizacao ||
                          data.dataInicio ||
                          "",
                        dataMes: data.mesRealizacao || data.dataInicio || "",
                        data:
                          data.dataInicio && data.dataFim
                            ? `${data.dataInicio} a ${data.dataFim}`
                            : data.dataInicio || data.dataFim || "",
                        frequencia: data.frequencia || "Mensal",
                        necessitaAquisicao: data.necessitaAquisicao || "Não",
                        necessitaContratacao:
                          data.necessitaContratacao || "Não",
                        referencia: data.codigoAtividade
                          ? data.codigoAtividade.toUpperCase()
                          : editingActivity.referencia || "",
                        ano: Number(
                          data.ano ||
                            editingActivity.ano ||
                            new Date().getFullYear() + 1,
                        ),
                        trimestre: data.trimestre || "",
                        mesRealizacao: data.mesRealizacao || "",
                        dataInicio: data.dataInicio || "",
                        dataFim: data.dataFim || "",
                        totalDias: Number(data.totalDias) || 0,
                        distanciaKm: Number(
                          data.distanciaKm || data.distanciaDestino || 0,
                        ),
                        distanciaDestino: Number(
                          data.distanciaDestino || data.distanciaKm || 0,
                        ),
                        litrosGasoleo: Number(data.litrosGasoleo || 0),
                        precoLitro: Number(data.precoLitro || 0),
                        valorTotalGasoleo: Number(data.valorTotalGasoleo || 0),
                        prioridadeProposta: data.prioridadeProposta || "",
                        codigoActividade: data.codigoActividade || "",
                        curso: data.curso || "",
                        rubricas: data.rubricas || [],
                        outrosColaboradores: data.outrosColaboradores || "",
                        necessitaTransporte: data.necessitaTransporte || "Não",
                        viatura: data.viatura || "",
                        motorista: data.motorista || "",
                        observacoes: data.observacoes || "",
                      };

                      if (onUpdateActivity) {
                        onUpdateActivity(editingActivity.id, updated);
                      }
                      setActivities(
                        activities.map((a) =>
                          a.id === editingActivity.id
                            ? { ...a, ...updated }
                            : a,
                        ),
                      );
                      setEditingActivity(null);
                      setShowForm(false);
                    }
                  : handleAddActivity
              }
            />
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4">
        {activities.length > 0 ? (
          title === "Matriz" ? (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-blue-900 text-white text-[10px] tracking-wider">
                    <th className="p-4 font-black border-r border-blue-800">
                      Nº
                    </th>
                    <th className="p-4 font-black border-r border-blue-800">
                      Referência
                    </th>
                    <th className="p-4 font-black border-r border-blue-800">
                      Direção
                    </th>
                    <th className="p-4 font-black border-r border-blue-800">
                      Actividade/Tarefa
                    </th>
                    <th className="p-4 font-black border-r border-blue-800">
                      Responsável
                    </th>
                    <th className="p-4 font-black border-r border-blue-800">
                      Recursos Necessários
                    </th>
                    <th className="p-4 font-black border-r border-blue-800">
                      Prazo
                    </th>
                    <th className="p-4 font-black border-r border-blue-800">
                      Status
                    </th>
                    <th className="p-4 font-black text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {activities.map((activity) => (
                    <tr
                      key={activity.id}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-4 border-r text-center font-bold text-blue-600">
                        {(() => {
                          const code =
                            activity.referencia ||
                            activity.codigoActividade ||
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
                          return "-";
                        })()}
                      </td>
                      <td className="p-4 border-r font-mono text-xs text-gray-500">
                        {activity.referencia || "-"}
                      </td>
                      <td
                        className="p-4 border-r font-bold text-blue-900"
                        title={activity.direcao || ""}
                      >
                        {getDirectionAbbreviation(activity.direcao || "")}
                      </td>
                      <td className="p-4 border-r font-bold text-gray-900">
                        {activity.title}
                      </td>
                      <td className="p-4 border-r text-gray-600">
                        {activity.responsavel || "-"}
                      </td>
                      <td className="p-4 border-r text-gray-500">
                        {activity.rubricas && activity.rubricas.length > 0 ? (
                          <div className="space-y-1.5 min-w-[200px]">
                            {activity.rubricas.map((r, i) => (
                              <div
                                key={i}
                                className="pb-1 last:pb-0 border-b last:border-0 border-gray-100 text-[11px] leading-normal"
                              >
                                <span className="font-bold text-gray-700 block">
                                  {r.rubrica}
                                </span>
                                <span className="text-gray-500 block italic">
                                  • {r.necessidade}
                                </span>
                                <span className="text-blue-600 font-semibold block text-right mt-0.5">
                                  {(r.valorTotal || 0).toLocaleString("pt-MZ", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }) + " MZN"}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <>
                            {activity.necessidade || activity.rubrica || "-"}
                            {(activity.valor || 0) > 0 && (
                              <span className="block text-blue-600 font-bold mt-1">
                                {(activity.valor || 0).toLocaleString("pt-MZ", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }) + " MZN"}
                              </span>
                            )}
                          </>
                        )}
                      </td>
                      <td className="p-4 border-r text-gray-600">
                        {activity.prazo || activity.dataMes || "-"}
                      </td>
                      <td className="p-4 border-r">
                        <span className="flex items-center gap-1.5 text-amber-600 font-bold text-[10px]">
                          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                          {activity.status === "draft"
                            ? "Aguardando Plano Setorial"
                            : "Submetido"}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setEditingActivity(activity)}
                            className="p-2 text-blue-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => removeActivity(activity.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Remover"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : title === "Plano Institucional" ||
            title === "Plano Setorial" ||
            title === "Matriz das Direções centrais" ? (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-blue-900 text-white text-[10px] tracking-wider">
                    <th className="p-4 font-black border-r border-blue-800">
                      Direção
                    </th>
                    <th className="p-4 font-black border-r border-blue-800">
                      Referência
                    </th>
                    <th className="p-4 font-black border-r border-blue-800">
                      Status
                    </th>
                    <th className="p-4 font-black border-r border-blue-800">
                      Departamento
                    </th>
                    <th className="p-4 font-black border-r border-blue-800">
                      Repartição
                    </th>
                    <th className="p-4 font-black border-r border-blue-800">
                      Orçamento
                    </th>
                    <th className="p-4 font-black border-r border-blue-800">
                      Nível de Prioridade
                    </th>
                    <th className="p-4 font-black border-r border-blue-800">
                      Nome da Actividade
                    </th>
                    <th className="p-4 font-black border-r border-blue-800">
                      Local de Realização
                    </th>
                    <th className="p-4 font-black border-r border-blue-800">
                      Mês
                    </th>
                    <th className="p-4 font-black border-r border-blue-800">
                      Data
                    </th>
                    <th className="p-4 font-black border-r border-blue-800">
                      Rubrica
                    </th>
                    <th className="p-4 font-black border-r border-blue-800">
                      Necessidade
                    </th>
                    <th className="p-4 font-black border-r border-blue-800">
                      Valor
                    </th>
                    <th className="p-4 font-black text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {getStatusFromDates(activities).map((activity) => (
                    <tr
                      key={activity.id}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td
                        className="p-4 border-r font-medium text-gray-700"
                        title={
                          activity.direcao || activity.unidadeOrganica || ""
                        }
                      >
                        {getDirectionAbbreviation(
                          activity.direcao || activity.unidadeOrganica || "",
                        )}
                      </td>
                      <td className="p-4 border-r font-mono text-xs text-gray-500">
                        {activity.referencia || "-"}
                      </td>
                      <td className="p-4 border-r text-gray-600">
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                            activity.status === "pronta"
                              ? "bg-yellow-100 text-yellow-700"
                              : activity.status === "em_execucao"
                                ? "bg-green-100 text-green-700"
                                : activity.status === "executada"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {activity.status === "pronta"
                            ? "Pronta"
                            : activity.status === "em_execucao"
                              ? "Em Execução"
                              : activity.status === "executada"
                                ? "Executada"
                                : activity.status}
                        </span>
                      </td>
                      <td className="p-4 border-r text-gray-600">
                        {activity.departamento}
                      </td>
                      <td className="p-4 border-r text-gray-600">
                        {activity.reparticao || "-"}
                      </td>
                      <td className="p-4 border-r text-gray-600">
                        <select
                          value={activity.orcamento || ""}
                          onChange={(e) =>
                            updateActivity(
                              activity.id,
                              "orcamento",
                              e.target.value,
                            )
                          }
                          className="w-full bg-transparent border-0 outline-none focus:ring-2 focus:ring-blue-500 rounded p-1 text-xs text-blue-900 font-bold"
                        >
                          <option value="">Selecione...</option>
                          {FONTES_RECEITA.map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4 border-r">
                        <select
                          value={activity.nivel || "Média"}
                          onChange={(e) =>
                            updateActivity(activity.id, "nivel", e.target.value)
                          }
                          className={`w-full bg-transparent border-0 outline-none focus:ring-2 focus:ring-blue-500 rounded p-1 text-xs font-bold ${
                            activity.nivel === "Urgente"
                              ? "text-red-700"
                              : activity.nivel === "Alta"
                                ? "text-orange-700"
                                : activity.nivel === "Média"
                                  ? "text-blue-700"
                                  : "text-gray-700"
                          }`}
                        >
                          {PRIORIDADES.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4 border-r font-bold text-gray-900">
                        {activity.title}
                      </td>
                      <td className="p-4 border-r text-gray-600">
                        {activity.localRealizacao || "-"}
                      </td>
                      <td className="p-4 border-r text-gray-600">
                        {activity.dataMes}
                      </td>
                      <td className="p-4 border-r text-gray-600">
                        {activity.data || activity.prazo || "-"}
                      </td>
                      <td className="p-4 border-r text-gray-600">
                        {activity.rubricas && activity.rubricas.length > 0 ? (
                          <div className="space-y-2">
                            {activity.rubricas.map((r, i) => (
                              <div
                                key={i}
                                className="pb-1 last:pb-0 border-b last:border-0 border-gray-100 font-bold"
                              >
                                {r.rubrica || "-"}
                              </div>
                            ))}
                          </div>
                        ) : (
                          activity.rubrica || "-"
                        )}
                      </td>
                      <td className="p-4 border-r text-gray-500 italic">
                        {activity.rubricas && activity.rubricas.length > 0 ? (
                          <div className="space-y-2">
                            {activity.rubricas.map((r, i) => (
                              <div
                                key={i}
                                className="pb-1 last:pb-0 border-b last:border-0 border-gray-100 italic"
                              >
                                {r.necessidade || "-"}
                              </div>
                            ))}
                          </div>
                        ) : (
                          activity.necessidade || "-"
                        )}
                      </td>
                      <td className="p-4 border-r font-black text-blue-900">
                        {activity.rubricas && activity.rubricas.length > 0 ? (
                          <div className="space-y-2 text-right">
                            {activity.rubricas.map((r, i) => (
                              <div
                                key={i}
                                className="pb-1 last:pb-0 border-b last:border-0 border-gray-100"
                              >
                                {(r.valorTotal || 0).toLocaleString("pt-MZ", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }) + " MZN"}
                              </div>
                            ))}
                            <div className="border-t border-blue-200 pt-1 font-black text-emerald-600 text-[11px] mt-1">
                              {(activity.valor || 0).toLocaleString("pt-MZ", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }) + " MZN"}
                            </div>
                          </div>
                        ) : (
                          (activity.valor || 0).toLocaleString("pt-MZ", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) + " MZN"
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setEditingActivity(activity)}
                            className="p-2 text-blue-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => removeActivity(activity.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Remover"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            activities.map((activity) => (
              <motion.div
                layout
                key={activity.id}
                className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >
                <div className="flex-grow space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full tracking-wider">
                      {(() => {
                        const code =
                          activity.referencia ||
                          activity.codigoActividade ||
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
                        return "-";
                      })()}
                    </span>
                    <h4 className="text-lg font-bold text-gray-900">
                      {activity.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Building2 size={14} className="text-blue-500" />
                      <span
                        className="font-medium"
                        title={
                          activity.direcao || activity.unidadeOrganica || ""
                        }
                      >
                        {getDirectionAbbreviation(
                          activity.direcao || activity.unidadeOrganica || "",
                        )}{" "}
                        - {activity.departamento}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon size={14} className="text-blue-500" />
                      <span>{activity.dataMes}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                        {activity.frequencia}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 mt-2">
                    {activity.rubricas && activity.rubricas.length > 0 ? (
                      activity.rubricas.map((r, i) => (
                        <div
                          key={i}
                          className="flex flex-wrap items-center gap-2 text-[10px]"
                        >
                          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-bold">
                            {r.rubrica}
                          </span>
                          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium italic">
                            {r.necessidade}
                          </span>
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-black">
                            {(r.valorTotal || 0).toLocaleString("pt-MZ", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }) + " MZN"}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="flex gap-2">
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold">
                          {activity.rubrica}
                        </span>
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold">
                          {(activity.valor || 0).toLocaleString("pt-MZ", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) + " MZN"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-none">
                  <button
                    onClick={() => setEditingActivity(activity)}
                    className="p-3 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                    title="Editar Actividade"
                  >
                    <Edit size={20} />
                  </button>
                  <button
                    onClick={() => removeActivity(activity.id)}
                    className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Remover da Matriz"
                  >
                    <Trash2 size={20} />
                  </button>
                  <div className="h-10 w-px bg-gray-100 mx-2 hidden md:block"></div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-gray-400 mb-1">
                      Status
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-600 font-bold text-xs">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                      Aguardando Plano Setorial
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          )
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <Target size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">
              {isDepartment
                ? `Nenhuma actividade definida para o plano de ${nextYear}.`
                : `Nenhuma diretriz estratégica definida para ${nextYear}.`}
            </p>
            <p className="text-gray-400 text-sm">
              {isDepartment
                ? "Comece adicionando as actividades do seu departamento."
                : "Comece adicionando actividades para orientar as direções."}
            </p>
          </div>
        )}
      </div>

      {activities.length > 0 && (
        <div className="bg-blue-900 p-8 rounded-3xl text-white flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/10 rounded-2xl">
              <FileText size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold">
                SUBMETER O PLANO DE ATIVIDADE
              </h3>
              <p className="text-blue-200 text-sm">
                O plano será submetido para validação do seu superior hierárquico imediato (Direção ou Departamento correspondente).
              </p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-emerald-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all whitespace-nowrap flex items-center justify-center gap-2"
            >
              <Upload size={20} /> Importar Excel
            </button>
            <button
              onClick={() => {
                // Sort activities by 'no' (numeric)
                const sortedActivities = [...activities].sort((a, b) => {
                  const numA = parseInt(a.no) || 0;
                  const numB = parseInt(b.no) || 0;
                  return numA - numB;
                });
                setActivities(sortedActivities);

                if (onFinalSubmit) {
                  onFinalSubmit(sortedActivities);
                } else {
                  let message = "Plano de Atividade submetido com sucesso!";
                  alert(message);
                }
              }}
              className="bg-white text-blue-900 px-10 py-4 rounded-xl font-bold hover:bg-blue-50 transition-all whitespace-nowrap"
            >
              SUBMETER O PLANO DE ATIVIDADE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

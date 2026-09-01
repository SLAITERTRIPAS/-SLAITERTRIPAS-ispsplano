/**
 * Utilitários para o Bloco 5 - Sistema
 */

/**
 * Calcula o total de uma atividade considerando rubricas ou transporte.
 */
export const getActivityTotal = (act: any): number => {
  if (!act) return 0;
  const hasRubricas = act.rubricas && Array.isArray(act.rubricas) && act.rubricas.length > 0;
  const rubricVal = hasRubricas
    ? act.rubricas.reduce(
        (acc: number, r: any) =>
          acc + Number(r?.valorTotal || r?.total || 0),
        0,
      )
    : Number(act.valor || act.total || 0);
  const fuelVal =
    !hasRubricas && act.necessitaTransporte === "Sim"
      ? Number(act.litrosGasoleo || 0) * Number(act.precoLitro || 0)
      : 0;
  return (isNaN(rubricVal) ? 0 : rubricVal) + (isNaN(fuelVal) ? 0 : fuelVal);
};

/**
 * Verifica se um item é considerado "dado de programador" (teste).
 * Critérios: Ano 2027 ou anos anteriores a 2025.
 */
export const isProgrammerData = (item: any): boolean => {
  if (!item) return false;
  const year = Number(item.ano || item.year || item.Year || item.Ano || 0);
  return year === 2027 || (year > 0 && year <= 2024);
};

/**
 * Filtra itens eliminados ou deletados.
 */
export const filterDeleted = (list: any[]): any[] => {
  return (list || []).filter(
    (item) =>
      !item.isDeleted &&
      item.estado !== "Eliminado" &&
      item.estado !== "Deletado" &&
      item.status !== "Deletado",
  );
};

/**
 * Formata o tempo relativo (ex: "Há 5 min").
 */
export const formatRelativeTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    const datePart = date.toLocaleDateString("pt-PT");
    const timePart = date.toLocaleTimeString("pt-PT", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const exactTimeStr = `${datePart} às ${timePart}`;

    let relativeStr = "";
    if (diffMin < 1) relativeStr = "Agora mesmo";
    else if (diffMin < 60) relativeStr = `Há ${diffMin} min`;
    else if (diffHr < 24)
      relativeStr = `Há ${diffHr} hora${diffHr > 1 ? "s" : ""}`;
    else if (diffDay < 7)
      relativeStr = `Há ${diffDay} dia${diffDay > 1 ? "s" : ""}`;

    if (relativeStr) {
      return `${exactTimeStr} (${relativeStr})`;
    }
    return exactTimeStr;
  } catch {
    return dateString;
  }
};

export function getInitials(text: string): string {
  if (!text) return "";
  return text
    .split(" ")
    .filter((word) => word.length > 2) // Ignore small words like 'de', 'o', 'a'
    .map((word) => word[0].toUpperCase())
    .join("");
}

export function formatTrackingCode(
  direcao: string,
  departamento: string,
  reparticao: string,
  number: number,
  year?: number,
): string {
  const dir = getInitials(direcao) || "Dir";
  const dep = getInitials(departamento) || "Dep";
  const rep = getInitials(reparticao);
  const num = String(number).padStart(4, "0");
  const y = year || new Date().getFullYear();

  const parts = [dir, dep];
  if (rep) parts.push(rep);
  parts.push(num);
  parts.push(String(y));

  return parts.join("/");
}

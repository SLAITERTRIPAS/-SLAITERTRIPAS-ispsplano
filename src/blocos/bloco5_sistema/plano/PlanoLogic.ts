import { MatrixActivity } from "../../../types";
import { getActivityTotal } from "../systemUtils";

export const isSalaryActivity = (act: any): boolean => {
  if (!act) return false;
  const title = (
    act.titulo ||
    act.nomeAtividade ||
    act.nome ||
    ""
  ).toUpperCase();
  const obj = (act.objetivoAtividade || act.objetivo || "").toUpperCase();
  const rubrica = (act.rubrica || "").toUpperCase();
  const nec = (act.necessidade || "").toUpperCase();
  const combo = `${title} ${obj} ${rubrica} ${nec}`;

  return (
    combo.includes("SALÁRIO") ||
    combo.includes("SALARIO") ||
    combo.includes("REMUNERAÇÃO") ||
    combo.includes("REMUNERACAO") ||
    combo.includes("PAGAMENTO DE SAL") ||
    combo.includes("GARANTIR SAL") ||
    combo.includes("112")
  );
};

export const getIsUserHR = (user: any, title: string): boolean => {
  const dept = String(user?.departamento || title || "").toUpperCase();
  const cargo = (user?.cargo || "").toUpperCase();
  return (
    dept.includes("RECURSOS HUMANOS") ||
    dept.includes(" RH ") ||
    dept.endsWith(" RH") ||
    dept.startsWith("RH ") ||
    dept === "RH" ||
    cargo.includes("RH") ||
    cargo.includes("RECURSOS HUMANOS")
  );
};

export const isDepartmentMatch = (deptA?: any, deptB?: any): boolean => {
  if (!deptA || !deptB) return false;
  const norm = (s: any) =>
    String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/^departamento\s+(de\s+|da\s+|dos\s+|do\s+)?/i, "")
      .trim();
  const a = norm(deptA);
  const b = norm(deptB);
  if (!a || !b) return false;
  return a === b;
};

export const isSectorMatch = (secA?: any, secB?: any): boolean => {
  if (!secA || !secB) return false;
  const norm = (s: any) =>
    String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/^(setor|reparticao)\s+(de\s+|da\s+|dos\s+|do\s+)?/i, "")
      .trim();
  const a = norm(secA);
  const b = norm(secB);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
};

export const getDirectionKeysMatched = (
  dirTitle: string = "",
  userDept: string = "",
) => {
  const t = (dirTitle || "").toUpperCase();
  const ud = (userDept || "").toUpperCase();

  if (
    t.includes("DICOSAFA") ||
    ud.includes("DICOSAFA") ||
    t.includes("COSSAFA") ||
    ud.includes("COSSAFA") ||
    t.includes("ADMINISTRAÇÃO, FINANÇAS") ||
    ud.includes("ADMINISTRAÇÃO, FINANÇAS") ||
    t.includes("ADMINISTRACAO, FINANCAS") ||
    ud.includes("ADMINISTRACAO, FINANCAS")
  ) {
    return "DICOSAFA";
  }
  if (
    t.includes("DICOSSER") ||
    ud.includes("DICOSSER") ||
    t.includes("COSSER") ||
    ud.includes("COSSER") ||
    t.includes("REGISTO ACADÉMICO") ||
    t.includes("REGISTO ACADEMICO") ||
    t.includes("DRA") ||
    ud.includes("REGISTO ACADÉMICO") ||
    ud.includes("REGISTO ACADEMICO") ||
    ud.includes("DRA") ||
    t.includes("SERVIÇOS SOCIAIS") ||
    ud.includes("SERVIÇOS SOCIAIS") ||
    t.includes("SERVICOS SOCIAIS") ||
    ud.includes("SERVICOS SOCIAIS")
  ) {
    return "DICOSSER";
  }
  if (
    t.includes("ENGENHARIA") ||
    t.includes("DIVISÃO") ||
    t.includes("DIVISAO") ||
    ud.includes("ENGENHARIA") ||
    ud.includes("DIVISÃO") ||
    ud.includes("DIVISAO")
  ) {
    return "Divisão de Engenharia";
  }
  if (
    t.includes("INCUBADORA") ||
    t.includes("INCUBACAO") ||
    t.includes("INCUBACÃO") ||
    t.includes("CIE") ||
    ud.includes("INCUBADORA") ||
    ud.includes("INCUBACAO") ||
    ud.includes("INCUBACÃO") ||
    ud.includes("CIE")
  ) {
    return "Centro de Incubação de Empresas";
  }
  if (
    t.includes("GERAL") ||
    t.includes("GABINETE") ||
    t.includes("DG") ||
    t.includes("GDG") ||
    ud.includes("GERAL") ||
    ud.includes("GABINETE") ||
    ud.includes("DG") ||
    ud.includes("GDG")
  ) {
    return "Gabinete do Diretor-Geral";
  }

  return "DICOSAFA";
};

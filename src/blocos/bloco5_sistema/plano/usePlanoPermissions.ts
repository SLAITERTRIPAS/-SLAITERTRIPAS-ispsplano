import { useMemo } from "react";
import { isSuperBossUser } from "../../../lib/auth";

export function usePlanoPermissions(user: any, title: string) {
  const isAllocated = useMemo(() => {
    if (!user) return false;
    
    // Se o utilizador tem qualquer campo de alocação preenchido, é considerado alocado
    if (user.direcao || user.departamento || user.unidadeOrganica || user.setor || user.reparticao) return true;
    
    // Exceção para departamentos conhecidos (DICOSAFA/TIC) ou chefias baseadas no título
    const context = `${user.title || ""} ${user.cargo || ""} ${user.cargoChefia || ""} ${user.role || ""} ${user.email || ""}`.toUpperCase();
    if (context.includes("DICOSAFA") || context.includes("TIC") || context.includes("SECRETARIA GERAL") || context.includes("CHEFE") || context.includes("DIRETOR")) return true;
    
    // Administradores e Super utilizadores têm sempre acesso
    if (isSuperBossUser(user)) return true;
    
    return false;
  }, [user]);

  const isDPEP = useMemo(() => {
    if (!user) return false;
    const titleUpper = String(
      user.title ||
      user.cargo ||
      user.cargoChefia ||
      ""
    ).toUpperCase();
    const deptUpper = String(user.departamento || "").toUpperCase();
    const roleUpper = String(user.role || "").toUpperCase();
    const sectUpper = String(user.setor || user.reparticao || "").toUpperCase();

    // Setor de Monitoria não planifica nem atua como DPEP / Planificação
    if (sectUpper.includes("MONITORIA") || titleUpper.includes("MONITORIA") || roleUpper.includes("MONITORIA")) {
      return false;
    }

    return (
      titleUpper.includes("DPEP") ||
      deptUpper.includes("DPEP") ||
      roleUpper.includes("DPEP") ||
      titleUpper.includes("PLANIFICAÇÃO") ||
      deptUpper.includes("PLANIFICAÇÃO") ||
      isSuperBossUser(user)
    );
  }, [user]);

  return { isAllocated, isDPEP };
}

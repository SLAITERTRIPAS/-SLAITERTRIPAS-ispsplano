
import { getRoles } from "./auth";

export type UserRole = 
  | 'setor' 
  | 'chefe_departamento' 
  | 'diretor' 
  | 'planificacao' 
  | 'chefe_dpep' 
  | 'conselho';

export interface Permissions {
  canEdit: boolean;
  canValidate: boolean;
  canApprove: boolean;
}

export const getPermissions = (role: UserRole): Permissions => {
  switch (role) {
    case 'setor':
    case 'chefe_departamento':
    case 'diretor':
      return { canEdit: true, canValidate: false, canApprove: false };
    case 'planificacao':
    case 'chefe_dpep':
      return { canEdit: false, canValidate: true, canApprove: false };
    case 'conselho':
      return { canEdit: false, canValidate: false, canApprove: true };
    default:
      return { canEdit: false, canValidate: false, canApprove: false };
  }
};

export const mapUserToRole = (user: any): UserRole => {
  const roles = getRoles(user.title || user.cargo || user.cargoChefia || "");
  
  if (roles.isConsRep) return 'conselho';
  if (roles.isDCC) return 'chefe_dpep'; // Ajuste conforme necessidade
  if (roles.isDC) return 'diretor';
  if (roles.isCD) return 'chefe_departamento';
  
  // Lógica padrão para Repartição de Planificação ou Setores
  if (user.departamento && (user.departamento.includes('Planificação') || user.departamento.includes('DPEP'))) {
    return 'planificacao';
  }
  
  return 'setor';
};

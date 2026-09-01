export interface AuditLog {
  userId: string;
  userEmail: string;
  sectorId: string;
  action: string;
  timestamp: string;
  collection: string;
  documentId: string;
}

import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

export const logAcesso = async (log: Omit<AuditLog, 'timestamp'>) => {
  try {
    await addDoc(collection(db, 'logs_acesso'), {
      ...log,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Erro ao registar log de auditoria:', err);
  }
};

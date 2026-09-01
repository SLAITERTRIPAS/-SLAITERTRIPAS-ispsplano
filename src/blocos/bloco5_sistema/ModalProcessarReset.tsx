import React, { useState } from "react";
import { motion } from "motion/react";
import { X, Key, CheckCircle2, User, AlertCircle } from "lucide-react";
import { firestoreService } from "../../lib/firestoreService";
import { db } from "../../lib/firebase";
import { query, collection, where, getDocs, getDoc, updateDoc, doc } from "firebase/firestore";

interface ModalProcessarResetProps {
  user: any;
  request: any;
  onClose: () => void;
  onComplete: () => void;
}

export default function ModalProcessarReset({
  user,
  request,
  onClose,
  onComplete,
}: ModalProcessarResetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReset = async () => {
    setIsSubmitting(true);
    try {
      const usersRef = collection(db, "users");
      const identifier = request.identifier ? request.identifier.trim() : "";
      
      let userDocId: string | null = null;

      // 1. Try by document ID
      if (identifier) {
        try {
          const docRef = doc(db, "users", identifier);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            userDocId = docSnap.id;
          }
        } catch (e) {
          // ignore doc ID lookup error if invalid format
        }
      }

      // 2. Try by email
      if (!userDocId && identifier) {
        let q = query(usersRef, where("email", "==", identifier));
        let querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          userDocId = querySnapshot.docs[0].id;
        }
      }

      // 3. Try by nuit
      if (!userDocId && identifier) {
        let q = query(usersRef, where("nuit", "==", identifier));
        let querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          userDocId = querySnapshot.docs[0].id;
        }
      }

      // 4. Try by name
      if (!userDocId && identifier) {
        let q = query(usersRef, where("name", "==", identifier));
        let querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          userDocId = querySnapshot.docs[0].id;
        }
      }

      if (userDocId) {
        const res = await (firestoreService as any).resetUserPasswordToDefault(userDocId);
        if (!res.success) {
          throw new Error(res.error || "Erro ao redefinir senha.");
        }

        // Mark request as processed
        await firestoreService.password_reset_requests.update(request.id, {
            status: "Processado",
            processedBy: user?.name || "Administrador",
            processedAt: new Date().toISOString(),
        });
        
        alert(`Senha de ${request.identifier} redefinida com sucesso para '1234'.`);
        onComplete();
        onClose();
      } else {
        alert("Utilizador não encontrado na base de dados para o identificador: " + identifier);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      alert("Erro ao processar redefinição de senha: " + (error instanceof Error ? error.message : String(error)));
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      ></motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 p-8"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-all"
        >
          <X size={24} />
        </button>
        <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <AlertCircle size={32} className="text-red-600" />
            </div>
            <h2 className="text-xl font-black mb-4">Redefinição de Senha</h2>
            <p className="text-slate-600 mb-8">Tem certeza que deseja redefinir a senha para <span className="font-bold">1234</span> para o utilizador: <span className="font-bold">{request.identifier}</span>?</p>
            
            <button
                onClick={handleReset}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-[2rem] font-black tracking-widest text-sm hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSubmitting ? "Processando..." : (
                    <>
                    Confirmar Redefinição <Key size={18} />
                    </>
                )}
            </button>
        </div>
      </motion.div>
    </div>
  );
}

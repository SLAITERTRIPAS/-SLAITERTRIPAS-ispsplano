import React, { useState } from "react";
import { X, Key, CheckCircle2, AlertCircle } from "lucide-react";
import { firestoreService } from "../../lib/firestoreService";
import { safeJSONStringify } from "../../lib/utils";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function ChangePasswordModal({
  user,
  onClose,
}: {
  user: any;
  onClose: () => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (newPassword.length < 4) {
      setError("A palavra-passe deve ter pelo menos 4 caracteres.");
      return;
    }

    setLoading(true);
    try {
      if (user?.id) {
        // Encontrar e atualizar todos os documentos correspondentes a este utilizador no Firestore
        // (tanto o original quanto os duplicados por UID) para evitar dessincronização de senhas.
        const usersRef = collection(db, "users");
        const uniqueDocIds = new Set<string>();
        uniqueDocIds.add(user.id);

        if (user.email) {
          try {
            const qEmail = query(
              usersRef,
              where("email", "==", String(user.email).toLowerCase().trim()),
            );
            const snapEmail = await getDocs(qEmail);
            snapEmail.forEach((docSnap) => uniqueDocIds.add(docSnap.id));
          } catch (e) {
            console.warn("Erro ao buscar docs por email:", e);
          }
        }

        if (user.nuit) {
          try {
            const qNuit = query(
              usersRef,
              where("nuit", "==", String(user.nuit).trim()),
            );
            const snapNuit = await getDocs(qNuit);
            snapNuit.forEach((docSnap) => uniqueDocIds.add(docSnap.id));

            const numericNuit = Number(user.nuit);
            if (!isNaN(numericNuit)) {
              const qNuitNum = query(
                usersRef,
                where("nuit", "==", numericNuit),
              );
              const snapNuitNum = await getDocs(qNuitNum);
              snapNuitNum.forEach((docSnap) => uniqueDocIds.add(docSnap.id));
            }
          } catch (e) {
            console.warn("Erro ao buscar docs por nuit:", e);
          }
        }

        // Aplicar o fluxo de atualização de palavra-passe e criação de nova sessão
        const passwordHash = firestoreService.hashPassword(newPassword);
        user.passwordHash = passwordHash;
        user.passwordExpired = false;
        user.mustChangePassword = false;
        user.isFirstAccess = false;

        // Atualizar todos os documentos identificados em paralelo na coleção 'users'
        await Promise.all(
          Array.from(uniqueDocIds).map((docId) =>
            updateDoc(doc(db, "users", docId), {
              password: newPassword,
              passwordHash: passwordHash,
              passwordExpired: false,
              mustChangePassword: false,
              isFirstAccess: false,
            }).catch((err) =>
              console.warn(`Erro ao atualizar doc ${docId}:`, err),
            ),
          ),
        );

        // Invalida sessão antiga
        await firestoreService.invalidateSession(user.id);

        // Cria nova sessão
        await firestoreService.createSession(user.id);

        // Atualizar também na coleção 'colaboradores' para manter consistência
        if (user.email || user.nuit) {
          try {
            const colRef = collection(db, "colaboradores");
            const emailStr = String(user.email || "")
              .toLowerCase()
              .trim();
            const nuitStr = String(user.nuit || "").trim();
            const [snapColE, snapColN] = await Promise.all([
              emailStr
                ? getDocs(query(colRef, where("email", "==", emailStr)))
                : Promise.resolve({ docs: [] }),
              nuitStr
                ? getDocs(query(colRef, where("nuit", "==", nuitStr)))
                : Promise.resolve({ docs: [] }),
            ]);
            const colIds = new Set<string>();
            [...snapColE.docs, ...snapColN.docs].forEach((d) =>
              colIds.add(d.id),
            );
            await Promise.all(
              Array.from(colIds).map((cId) =>
                updateDoc(doc(db, "colaboradores", cId), {
                  password: newPassword,
                  mustChangePassword: false,
                  isFirstAccess: false,
                }).catch((err) =>
                  console.warn("Erro ao atualizar colaborador password:", err),
                ),
              ),
            );
          } catch (e) {
            console.warn("Aviso ao atualizar colaboradores:", e);
          }
        }

        // Atualizar sigep_users_cache no localStorage
        try {
          const cache: any[] = JSON.parse(
            localStorage.getItem("sigep_users_cache") || "[]",
          );
          const updatedCache = cache.map((u: any) => {
            if (
              u.id === user.id ||
              (u.email &&
                u.email.toLowerCase() === (user.email || "").toLowerCase()) ||
              (u.nuit && u.nuit === user.nuit)
            ) {
              return {
                ...u,
                password: newPassword,
                mustChangePassword: false,
                isFirstAccess: false,
              };
            }
            return u;
          });
          localStorage.setItem(
            "sigep_users_cache",
            safeJSONStringify(updatedCache),
          );
        } catch (e) {
          console.warn("Erro ao atualizar cache local de utilizadores:", e);
        }

        // Update local storage if this is the currently logged in user
        const storedUser = localStorage.getItem("sigep_logged_in_user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (
            parsed.id === user.id ||
            parsed.email === user.email ||
            parsed.nuit === user.nuit
          ) {
            const updatedUser = {
              ...parsed,
              password: newPassword,
              mustChangePassword: false,
              isFirstAccess: false,
            };
            localStorage.setItem(
              "sigep_logged_in_user",
              safeJSONStringify(updatedUser),
            );
          }
        }

        setSuccess("Senha alterada com sucesso!");
        setTimeout(() => {
          onClose();
          // Force reload to ensure all states are consistent with new password
          window.location.reload();
        }, 2000);
      }
    } catch (err: any) {
      console.error(err);
      setError("Erro ao redefinir senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
        <div className="bg-[#121c60] p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Key size={24} className="text-[#FFB800]" />
            <h2 className="text-xl font-bold tracking-tight">
              Alterar Palavra-passe
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-700 text-sm">
              <AlertCircle size={20} />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-center gap-3 text-green-700 text-sm">
              <CheckCircle2 size={24} />
              <p className="font-bold">{success}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 tracking-wider">
                NOVA PALAVRA-PASSE
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••"
                className="w-full p-4 bg-gray-50 rounded-xl text-sm border-2 border-gray-100 focus:outline-none focus:border-[#121c60] transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 tracking-wider">
                CONFIRMAR NOVA PALAVRA-PASSE
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••"
                className="w-full p-4 bg-gray-50 rounded-xl text-sm border-2 border-gray-100 focus:outline-none focus:border-[#121c60] transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#121c60] text-white py-4 px-8 rounded-xl font-bold hover:bg-[#1a2b70] transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50"
          >
            {loading ? "A Guardar..." : "Atualizar Palavra-passe"}
          </button>
        </form>
      </div>
    </div>
  );
}

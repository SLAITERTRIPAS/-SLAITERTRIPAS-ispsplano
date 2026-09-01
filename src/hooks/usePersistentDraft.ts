import { useState, useEffect } from "react";
import { firestoreService } from "../lib/firestoreService";

export function usePersistentDraft<T>(
  formId: string,
  initialState: T,
  isEditMode: boolean = false,
) {
  const [data, setData] = useState<T>(initialState);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  let user = null;
  try {
    const userString = localStorage.getItem("sigep_logged_in_user");
    user = userString ? JSON.parse(userString) : null;
  } catch (e) {
    console.warn("Erro ao ler utilizador guardado:", e);
  }

  // Carregar rascunho na montagem
  useEffect(() => {
    if (!user?.id || isEditMode) {
      setIsDraftLoaded(true);
      return;
    }

    const checkDraft = async () => {
      try {
        const draft = await firestoreService.drafts.getByUserAndForm(
          user.id,
          formId,
        );
        if (draft) {
          setShowDraftModal(true);
        } else {
          setIsDraftLoaded(true);
        }
      } catch (err) {
        console.error(`Erro ao verificar rascunho para ${formId}:`, err);
        setIsDraftLoaded(true);
      }
    };

    checkDraft();
  }, [user?.id, formId, isEditMode]);

  // Sincronizar rascunho com debounce
  useEffect(() => {
    if (isDraftLoaded && !isEditMode && user?.id) {
      setIsSyncing(true);
      const timer = setTimeout(() => {
        firestoreService.drafts
          .save(user.id, formId, {
            formData: data,
            updatedAt: new Date().toISOString(),
          })
          .then(() => setIsSyncing(false))
          .catch((err) => {
            console.error(`Erro ao sincronizar rascunho ${formId}:`, err);
            setIsSyncing(false);
          });
      }, 2500); // 2.5 segundos de debounce
      return () => clearTimeout(timer);
    }
  }, [data, isDraftLoaded, isEditMode, user?.id, formId]);

  const recoverDraft = async () => {
    if (!user?.id) return;
    try {
      const draft: any = await firestoreService.drafts.getByUserAndForm(
        user.id,
        formId,
      );
      if (draft && draft.formData) {
        setData(draft.formData);
      }
    } catch (e) {
      console.error("Erro ao recuperar rascunho:", e);
    }
    setIsDraftLoaded(true);
    setShowDraftModal(false);
  };

  const discardDraft = async () => {
    if (user?.id) {
      try {
        await firestoreService.drafts.deleteByUserAndForm(user.id, formId);
      } catch (err) {
        console.error("Erro ao descartar rascunho:", err);
      }
    }
    setIsDraftLoaded(true);
    setShowDraftModal(false);
  };

  const clearDraft = async () => {
    if (user?.id) {
      try {
        await firestoreService.drafts.deleteByUserAndForm(user.id, formId);
      } catch (err) {
        console.error("Erro ao limpar rascunho:", err);
      }
    }
  };

  return {
    data,
    setData,
    isDraftLoaded,
    showDraftModal,
    isSyncing,
    recoverDraft,
    discardDraft,
    clearDraft,
    currentUser: user,
  };
}

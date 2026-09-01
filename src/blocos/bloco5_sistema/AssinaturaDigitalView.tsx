import React, { useState, useEffect, useRef } from "react";
import { Pen, Upload, X, Loader2, FileText, CheckCircle, Database, Check } from "lucide-react";
import { firestoreService } from "../../lib/firestoreService";
import { motion, AnimatePresence } from "motion/react";

type TabType = "signatures" | "minhas_assinaturas" | "despachos" | "pareceres";

export default function AssinaturaDigitalView({
  user,
  onBack,
}: {
  user: any;
  onBack: () => void;
}) {
  const [signature, setSignature] = useState<any>(null);
  const [allUserSignatures, setAllUserSignatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("signatures");
  const [tempProcessedSignature, setTempProcessedSignature] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calcular Iniciais + NUIT do utilizador atual
  const userNameStr = user?.name || user?.displayName || (window as any).auth?.currentUser?.displayName || "Utilizador Sistema";
  const userInitials = userNameStr
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);
  const userNuit = user?.nuit || user?.nuip || "999999999";
  const uniqueId = `${userInitials}-${userNuit}`;

  useEffect(() => {
    const unsub = firestoreService.signatures.subscribe((sigs: any[]) => {
      const userSigs = sigs.filter((sig) => sig.userId === (user?.id || uniqueId) || sig.uniqueId === uniqueId || sig.userId === uniqueId);
      setAllUserSignatures(userSigs);
      const userSig = userSigs[userSigs.length - 1] || sigs.find((sig) => sig.userId === (user?.id || uniqueId));
      setSignature(userSig || null);
    });
    return unsub;
  }, [user, uniqueId]);

  // Função para remover fundo branco/claro e redimensionar para caber no limite do Firestore (<1MB)
  const removeBackgroundAndProcess = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_DIMENSION = 500;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_DIMENSION) {
              height *= MAX_DIMENSION / width;
              width = MAX_DIMENSION;
            }
          } else {
            if (height > MAX_DIMENSION) {
              width *= MAX_DIMENSION / height;
              height = MAX_DIMENSION;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(event.target?.result as string || "");
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Remover fundo claro/branco
            if (r > 200 && g > 200 && b > 200) {
              data[i + 3] = 0;
            }
          }

          ctx.putImageData(imgData, 0, 0);
          resolve(canvas.toDataURL("image/png", 0.8));
        };
        img.onerror = () => reject(new Error("Erro ao carregar imagem"));
        img.src = event.target?.result as string;
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const [rawUploadedImage, setRawUploadedImage] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setRawUploadedImage(e.target?.result as string);
        setTempProcessedSignature(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const processRemoveBackground = () => {
    if (!rawUploadedImage) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX_DIMENSION = 500;
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > MAX_DIMENSION) {
          height *= MAX_DIMENSION / width;
          width = MAX_DIMENSION;
        }
      } else {
        if (height > MAX_DIMENSION) {
          width *= MAX_DIMENSION / height;
          height = MAX_DIMENSION;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, width, height);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Remover fundo claro/branco
        if (r > 200 && g > 200 && b > 200) {
          data[i + 3] = 0;
        }
      }

      ctx.putImageData(imgData, 0, 0);
      setTempProcessedSignature(canvas.toDataURL("image/png", 0.8));
    };
    img.src = rawUploadedImage;
  };

  const handleDeleteSignature = async (sigId: string) => {
    if (window.confirm("Tem certeza que deseja excluir permanentemente esta assinatura?")) {
      try {
        setLoading(true);
        if (sigId && !sigId.startsWith("local_")) {
          await firestoreService.signatures.delete(sigId);
        }
        // Sempre remover do localStorage/estado local para garantir resposta imediata da UI
        try {
          const key = "sigep_local_signatures";
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
              const filtered = parsed.filter((item: any) => item.id !== sigId);
              localStorage.setItem(key, JSON.stringify(filtered));
            }
          }
        } catch (_) {}

        setAllUserSignatures((prev) => prev.filter((s) => s.id !== sigId));
        if (signature?.id === sigId) {
          setSignature(null);
        }
      } catch (e) {
        console.error("Erro ao apagar assinatura", e);
        // Mesmo com erro de rede, garantir limpeza local da UI
        setAllUserSignatures((prev) => prev.filter((s) => s.id !== sigId));
        if (signature?.id === sigId) {
          setSignature(null);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSaveSignature = async () => {
    try {
      setLoading(true);
      const userIdToUse = user?.id || uniqueId;
      const userNameToUse = userNameStr;

      // Sempre criar uma nova entrada limpa e única na coleção para evitar duplicados indesejados
      await firestoreService.signatures.add({
        userId: userIdToUse,
        userName: userNameToUse,
        nuit: userNuit,
        uniqueId: uniqueId,
        data: tempProcessedSignature,
        createdAt: new Date().toISOString(),
      });
      setTempProcessedSignature(null);
      setRawUploadedImage(null);
    } catch (e) {
      console.error("Erro ao guardar assinatura", e);
      alert("Erro ao guardar na base de dados.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllSignatures = async () => {
    if (window.confirm("ATENÇÃO: Deseja excluir absolutamente TODAS as assinaturas inseridas no sistema? Esta ação é irreversível.")) {
      try {
        setLoading(true);
        // Excluir todas do Firestore
        for (const sig of allUserSignatures) {
          if (sig.id && !sig.id.startsWith("local_")) {
            await firestoreService.signatures.delete(sig.id);
          }
        }
        // Limpar localStorage
        localStorage.removeItem("sigep_local_signatures");
        setAllUserSignatures([]);
        setSignature(null);
        alert("Todas as assinaturas foram excluídas com sucesso.");
      } catch (e) {
        console.error("Erro ao limpar assinaturas", e);
        setAllUserSignatures([]);
        setSignature(null);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 p-6 md:p-10 font-serif">
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
      >
        <X size={20} /> Voltar
      </button>

      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 max-w-4xl w-full overflow-hidden flex flex-col min-h-[600px]">
        {/* Header Section */}
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tighter">
              Gestão de Assinaturas e Atos
            </h1>
            <p className="text-slate-500 italic">
              Gerencie suas assinaturas digitais, consulte seus despachos e acompanhe seus pareceres emitidos.
            </p>
          </div>
          <div className="bg-blue-900/10 border border-blue-200 px-4 py-2 rounded-xl text-right">
            <p className="text-[10px] font-bold text-blue-900 uppercase tracking-widest">ID Único</p>
            <p className="text-xs font-mono font-black text-blue-950">{uniqueId}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 px-4 bg-white sticky top-0 z-10">
          <button
            onClick={() => setActiveTab("signatures")}
            className={`px-6 py-4 flex items-center gap-2 font-bold text-sm transition-all border-b-2 ${
              activeTab === "signatures"
                ? "border-blue-900 text-blue-900"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Pen size={18} /> Carregar minha assinatura
          </button>
          <button
            onClick={() => setActiveTab("minhas_assinaturas")}
            className={`px-6 py-4 flex items-center gap-2 font-bold text-sm transition-all border-b-2 ${
              activeTab === "minhas_assinaturas"
                ? "border-blue-900 text-blue-900"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Database size={18} /> Minhas Assinaturas ({allUserSignatures.length})
          </button>
          <button
            onClick={() => setActiveTab("despachos")}
            className={`px-6 py-4 flex items-center gap-2 font-bold text-sm transition-all border-b-2 ${
              activeTab === "despachos"
                ? "border-blue-900 text-blue-900"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <CheckCircle size={18} /> Meus Despachos
          </button>
          <button
            onClick={() => setActiveTab("pareceres")}
            className={`px-6 py-4 flex items-center gap-2 font-bold text-sm transition-all border-b-2 ${
              activeTab === "pareceres"
                ? "border-blue-900 text-blue-900"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <FileText size={18} /> Meus Pareceres
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === "signatures" && (
              <motion.div
                key="signatures"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-200">
                  <h3 className="text-lg font-black text-slate-800 mb-4 text-center">Assinatura Digitalizada</h3>
                  
                  {tempProcessedSignature ? (
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-emerald-300 rounded-2xl bg-emerald-50/30 mb-6">
                      <p className="text-xs font-bold text-emerald-800 mb-4">
                        ✓ Fundo removido com sucesso! Pronto para guardar:
                      </p>
                      <img
                        src={tempProcessedSignature}
                        alt="Assinatura Processada"
                        className="max-h-40 max-w-full object-contain mb-6 bg-white p-4 rounded-xl border border-emerald-200 shadow-sm"
                      />
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => { setTempProcessedSignature(null); setRawUploadedImage(null); }}
                          className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs transition-all"
                        >
                          Escolher Outra
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveSignature}
                          disabled={loading}
                          className="px-8 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-black text-xs transition-all shadow-lg flex items-center gap-2"
                        >
                          {loading ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                          Guardar & Usar
                        </button>
                      </div>
                    </div>
                  ) : rawUploadedImage ? (
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-amber-300 rounded-2xl bg-amber-50/30 mb-6">
                      <p className="text-xs font-bold text-amber-900 mb-4">
                        Imagem carregada. Deseja remover o fundo antes de guardar?
                      </p>
                      <img
                        src={rawUploadedImage}
                        alt="Assinatura Original"
                        className="max-h-40 max-w-full object-contain mb-6 bg-white p-4 rounded-xl border border-amber-200 shadow-sm"
                      />
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => setRawUploadedImage(null)}
                          className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs transition-all"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={processRemoveBackground}
                          disabled={loading}
                          className="px-8 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-black text-xs transition-all shadow-lg flex items-center gap-2"
                        >
                          <Check size={16} /> Remover Fundo & Guardar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-white mb-6">
                      {signature ? (
                        <div className="mb-6 flex flex-col items-center">
                          <img
                            src={signature.data}
                            alt="Assinatura Guardada"
                            className="max-h-40 max-w-full object-contain mb-2 p-3 bg-slate-50 rounded-xl border border-slate-100 shadow-sm"
                          />
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                            ✓ Assinatura ativa na base de dados
                          </span>
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-400">
                          <Pen size={32} />
                        </div>
                      )}

                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                        className="cursor-pointer flex items-center gap-3 bg-blue-900 text-white px-8 py-3 rounded-xl font-black text-xs hover:bg-blue-800 transition-all shadow-lg"
                      >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                        {signature ? "Alterar / Carregar Nova Assinatura" : "Carregar Assinatura"}
                      </button>
                    </div>
                  )}

                  <div className="text-center space-y-2">
                    <p className="text-sm text-slate-500 font-medium">
                      Local onde serão armazenadas todas as suas assinaturas para uso em documentos oficiais.
                    </p>
                    <div className="flex justify-center items-center gap-4 text-xs text-slate-400">
                      <span>ID: <strong className="text-slate-700">{uniqueId}</strong></span>
                      {signature && (
                        <span>• Última atualização: {new Date(signature.updatedAt || signature.createdAt).toLocaleDateString("pt-PT")}</span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "minhas_assinaturas" && (
              <motion.div
                key="minhas_assinaturas"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-200">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-black text-slate-800">Minhas Assinaturas Armazenadas</h3>
                      <p className="text-xs text-slate-500">Repositório seguro vinculado ao seu ID único: <strong className="font-mono text-blue-900">{uniqueId}</strong></p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-blue-900 text-white font-bold px-3 py-1 rounded-full">
                        {allUserSignatures.length} {allUserSignatures.length === 1 ? 'Assinatura' : 'Assinaturas'}
                      </span>
                      {allUserSignatures.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearAllSignatures}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
                        >
                          Excluir Todas
                        </button>
                      )}
                    </div>
                  </div>

                  {allUserSignatures.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                      <Database className="mx-auto text-slate-300 mb-3" size={40} />
                      <p className="text-sm font-bold text-slate-700">Ainda não possui assinaturas guardadas</p>
                      <p className="text-xs text-slate-400 mt-1">Carregue uma assinatura na primeira aba para guardá-la na base de dados.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {allUserSignatures.map((sig, idx) => (
                        <div key={sig.id || idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                                {sig.nuit || userNuit}
                              </span>
                              <p className="text-xs font-bold text-slate-800 mt-1">{sig.userName || userNameStr}</p>
                            </div>
                            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                              Ativa
                            </span>
                          </div>

                          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-center min-h-[100px]">
                            <img
                              src={sig.data}
                              alt="Assinatura"
                              className="max-h-20 object-contain"
                            />
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-100 pt-3">
                            <span>ID: {sig.uniqueId || uniqueId}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteSignature(sig.id)}
                              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg transition-colors"
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "despachos" && (
              <motion.div
                key="despachos"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center justify-center h-full text-center py-12"
              >
                <div className="w-20 h-20 bg-blue-50 text-blue-900 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-800">Meus Despachos</h3>
                <p className="text-slate-500 max-w-md mx-auto mt-4 mb-8 italic">
                  Lugar onde serão armazenados todos os seus despachos emitidos no sistema, permitindo consulta histórica e acompanhamento.
                </p>
                <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-10 w-full">
                  <p className="text-slate-400 font-medium italic">Nenhum despacho registado nesta conta ({uniqueId}) até ao momento.</p>
                </div>
              </motion.div>
            )}

            {activeTab === "pareceres" && (
              <motion.div
                key="pareceres"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center justify-center h-full text-center py-12"
              >
                <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-6">
                  <FileText size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-800">Meus Pareceres</h3>
                <p className="text-slate-500 max-w-md mx-auto mt-4 mb-8 italic">
                  Lugar onde serão armazenados todos os seus pareceres técnicos, instrutivos e vinculativos emitidos em processos.
                </p>
                <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-10 w-full">
                  <p className="text-slate-400 font-medium italic">Nenhum parecer registado nesta conta ({uniqueId}) até ao momento.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}


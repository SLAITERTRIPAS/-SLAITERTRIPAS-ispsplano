import React, { useRef, useState, useEffect } from "react";
import {
  Upload,
  X,
  Check,
  Eye,
  User,
  FileImage,
  PenTool,
  Database,
} from "lucide-react";
import { firestoreService } from "../../lib/firestoreService";
import { auth } from "../../lib/firebase";

interface Signature {
  id: string;
  userId: string;
  userName: string;
  data: string;
  createdAt: string;
  updatedAt?: string;
}

export default function SignatureUpload({
  label = "Assinatura",
  subLabel,
  value,
  onChange,
  readOnly,
  user,
}: {
  label?: string;
  subLabel?: string;
  value?: string;
  onChange?: (val: string) => void;
  readOnly?: boolean;
  user?: any;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [allSignatures, setAllSignatures] = useState<Signature[]>([]);
  const [saveToProfile, setSaveToProfile] = useState(true);
  const [activeTab, setActiveTab] = useState<"upload" | "saved" | "all">(
    "upload",
  );

  // Subscrever às assinaturas guardadas no sistema
  useEffect(() => {
    const unsub = firestoreService.signatures.subscribe((sigs: any[]) => {
      setAllSignatures(sigs as Signature[]);
    });
    return unsub;
  }, []);

  // Determinar o ID do utilizador atual para filtrar
  const currentUserId = user?.id || auth.currentUser?.uid || "";
  const mySignature = allSignatures.find((sig) => sig.userId === currentUserId);

  const [tempProcessedSignature, setTempProcessedSignature] = useState<string | null>(null);

  // Função para carregar e remover o fundo branco/claro da imagem da assinatura com redimensionamento
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

          // Remover pixels brancos ou claros (fundo) tornando-os transparentes
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Se o pixel for quase branco (R, G, B > 200), define alpha = 0 (transparente)
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

  // Manipular upload de ficheiro local com remoção de fundo e pré-visualização
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const processedBase64 = await removeBackgroundAndProcess(file);
        setTempProcessedSignature(processedBase64);
      } catch (err) {
        console.error("Erro ao processar imagem de assinatura:", err);
        alert("Erro ao processar a imagem da assinatura. Tente novamente.");
      }
    }
  };

  // Guardar assinatura processada para uso atual e futuro
  const handleSaveProcessedSignature = async () => {
    if (!tempProcessedSignature) return;

    try {
      // Chamar onChange para atualizar o documento local
      if (onChange) {
        onChange(tempProcessedSignature);
      }

      // Guardar nas áreas de "Minhas Assinaturas" no sistema e na base de dados (Firestore)
      if (currentUserId) {
        if (mySignature) {
          await firestoreService.signatures.update(mySignature.id, {
            data: tempProcessedSignature,
            updatedAt: new Date().toISOString(),
          });
        } else {
          await firestoreService.signatures.add({
            userId: currentUserId,
            userName:
              user?.name ||
              user?.displayName ||
              auth.currentUser?.displayName ||
              "Utilizador",
            data: tempProcessedSignature,
            createdAt: new Date().toISOString(),
          });
        }
      }
      setTempProcessedSignature(null);
      setIsOpen(false);
    } catch (err) {
      console.error("Erro ao guardar assinatura na base de dados:", err);
      alert("Erro ao guardar assinatura. Tente novamente.");
    }
  };

  const selectSignature = (sigData: string) => {
    if (onChange) {
      onChange(sigData);
    }
    setIsOpen(false);
  };

  const clearSignature = () => {
    if (onChange) {
      onChange("");
    }
  };

  return (
    <div className="flex flex-col items-center group w-full relative">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Área da Assinatura no Documento */}
      {value ? (
        <div className="w-full flex flex-col items-center">
          <div
            className={`h-16 w-full flex items-end justify-center mb-2 border-b border-slate-950 transition-opacity ${!readOnly ? "cursor-pointer hover:opacity-85" : ""}`}
            onClick={() => !readOnly && setIsOpen(true)}
          >
            <img
              src={value}
              alt="Assinatura"
              className="max-h-16 max-w-full object-contain mix-blend-multiply pb-1"
            />
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={clearSignature}
              className="text-[9px] text-red-500 font-bold hover:underline mb-2 print:hidden"
            >
              Remover Assinatura
            </button>
          )}
        </div>
      ) : (
        <div
          className={`h-16 w-full flex flex-col items-center justify-end mb-2 border-b border-slate-400 transition-all ${!readOnly ? "cursor-pointer text-slate-400 hover:text-blue-600 border-dashed hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/20" : ""} ${readOnly ? "pointer-events-none border-solid border-slate-200" : ""}`}
          onClick={() => !readOnly && setIsOpen(true)}
        >
          {!readOnly && (
            <div className="flex flex-col items-center gap-1 pb-1">
              <PenTool size={14} className="opacity-60" />
              <span className="text-[9px] font-bold opacity-85">
                Clique para assinar
              </span>
            </div>
          )}
        </div>
      )}

      <div className="text-center w-full">
        <p className="text-[10px] font-black text-slate-900 leading-tight">
          {label}
        </p>
        {subLabel && (
          <p className="text-[8px] text-slate-400 mt-1 italic font-bold">
            {subLabel}
          </p>
        )}
      </div>

      {/* Modal / Popup de Seleção de Assinatura */}
      {isOpen && !readOnly && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl border border-slate-200 flex flex-col max-h-[85vh] overflow-hidden">
            {/* Header do Modal */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tighter">
                  Inserir Assinatura Digital
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Selecione uma assinatura guardada ou carregue um novo
                  ficheiro.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-xl transition-all text-slate-500 hover:text-slate-900"
              >
                <X size={18} />
              </button>
            </div>

            {/* Abas / Tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50/50 text-xs font-bold text-slate-500">
              <button
                type="button"
                onClick={() => setActiveTab("upload")}
                className={`flex-1 py-3 text-center border-b-2 transition-all ${activeTab === "upload" ? "border-blue-900 text-blue-900 bg-white" : "border-transparent hover:text-slate-800"}`}
              >
                Carregar Nova
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("saved")}
                className={`flex-1 py-3 text-center border-b-2 transition-all ${activeTab === "saved" ? "border-blue-900 text-blue-900 bg-white" : "border-transparent hover:text-slate-800"} flex items-center justify-center gap-1.5`}
              >
                <User size={12} /> Minha Assinatura
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`flex-1 py-3 text-center border-b-2 transition-all ${activeTab === "all" ? "border-blue-900 text-blue-900 bg-white" : "border-transparent hover:text-slate-800"} flex items-center justify-center gap-1.5`}
              >
                <Database size={12} /> Outros Setores / Utilizadores
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* ABA: UPLOAD */}
              {activeTab === "upload" && (
                <div className="space-y-6">
                  {tempProcessedSignature ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <p className="text-xs font-bold text-emerald-700 mb-2">
                          ✓ Fundo removido com sucesso! Pré-visualização da assinatura:
                        </p>
                        <div className="p-6 bg-slate-900/5 rounded-2xl border border-slate-200 flex items-center justify-center min-h-[120px]">
                          <img
                            src={tempProcessedSignature}
                            alt="Assinatura processada"
                            className="max-h-24 object-contain"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setTempProcessedSignature(null)}
                          className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs transition-all"
                        >
                          Escolher Outra
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveProcessedSignature}
                          className="flex-1 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
                        >
                          <Check size={16} /> Guardar & Usar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-blue-500 hover:bg-blue-50/10 cursor-pointer group transition-all"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="p-4 bg-slate-100 rounded-full group-hover:bg-blue-100 transition-colors">
                            <Upload
                              size={24}
                              className="text-slate-500 group-hover:text-blue-600"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-700">
                              Selecione a Imagem da Assinatura
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              O sistema removerá automaticamente o fundo branco para uso profissional em documentos.
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ABA: MINHA ASSINATURA */}
              {activeTab === "saved" && (
                <div className="space-y-4">
                  {mySignature ? (
                    <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 flex flex-col items-center">
                      <div className="bg-white p-4 rounded-xl border border-slate-100 w-full flex justify-center items-center h-24 mb-4">
                        <img
                          src={mySignature.data}
                          alt="Minha Assinatura"
                          className="max-h-20 object-contain mix-blend-multiply"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => selectSignature(mySignature.data)}
                        className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <Check size={16} /> Usar esta Assinatura
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <User size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-bold">
                        Não tem nenhuma assinatura guardada no seu perfil.
                      </p>
                      <p className="text-[10px] mt-1">
                        Carregue uma assinatura na aba anterior e marque a opção
                        para guardar no perfil.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ABA: OUTROS SETORES / USUÁRIOS */}
              {activeTab === "all" && (
                <div className="space-y-3">
                  {allSignatures.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-1">
                      {allSignatures.map((sig) => (
                        <div
                          key={sig.id}
                          className="border border-slate-100 hover:border-blue-200 hover:bg-blue-50/10 p-3 rounded-xl flex items-center justify-between gap-4 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center border">
                              <FileImage size={16} className="text-slate-400" />
                            </div>
                            <div className="leading-tight">
                              <p className="text-xs font-bold text-slate-900">
                                {sig.userName}
                              </p>
                              <p className="text-[9px] text-slate-500">
                                Última alteração:{" "}
                                {new Date(
                                  sig.updatedAt || sig.createdAt,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="bg-white px-2 py-1 rounded border border-slate-100 max-h-8 max-w-[100px] flex items-center justify-center">
                              <img
                                src={sig.data}
                                alt="Preview"
                                className="max-h-6 object-contain mix-blend-multiply"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => selectSignature(sig.data)}
                              className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-bold text-[10px] transition-all"
                            >
                              Selecionar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <Database size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-bold">
                        Nenhuma assinatura registada no sistema.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer do Modal */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 text-right">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

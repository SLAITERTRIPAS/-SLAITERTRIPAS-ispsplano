import React, { useState, useEffect } from "react";
import {
  X,
  Maximize2,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { ProcessingCircle } from "../../components/ui/ProcessingCircle";
import {
  withTimeout,
  normalize as n,
  generateCollaboratorId,
  safeJSONStringify,
} from "../../lib/utils";
import { EFETIVO_GERAL_DATA } from "../../constants/colaboradoresList";
import RegistarFuncionarioForm from "../bloco8_gerais/RegistarFuncionarioForm";
import { holidays2026 } from "../../constants/holidays";
import { auth, db } from "../../lib/firebase";
import { signInAnonymously } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  limit,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { firestoreService } from "../../lib/firestoreService";

// Pre-process baseline for O(1) lookups
const EFETIVO_MAP = new Map();
EFETIVO_GERAL_DATA.forEach((c) => {
  if (c.email) EFETIVO_MAP.set(n(c.email), c);
  if (c.nuit) EFETIVO_MAP.set(n(c.nuit), c);
  const genId =
    (c as any).id || generateCollaboratorId(c.nome || "", c.nuit || "");
  if (genId) EFETIVO_MAP.set(n(genId), c);
});

// Helper for local user caching during quota/network constraints
const saveUserToCache = (userData: any) => {
  try {
    const cache: any[] = JSON.parse(
      localStorage.getItem("sigep_users_cache") || "[]",
    );
    const emailNorm = (userData.email || "").toLowerCase().trim();
    const idNorm = String(userData.id || "")
      .toLowerCase()
      .trim();
    const nuitNorm = String(userData.nuit || "")
      .toLowerCase()
      .trim();

    const filtered = cache.filter((u: any) => {
      const uEmail = (u.email || "").toLowerCase().trim();
      const uId = String(u.id || "")
        .toLowerCase()
        .trim();
      const uNuit = String(u.nuit || "")
        .toLowerCase()
        .trim();
      if (emailNorm && uEmail === emailNorm) return false;
      if (idNorm && uId === idNorm) return false;
      if (nuitNorm && uNuit === nuitNorm) return false;
      return true;
    });

    filtered.push(userData);
    localStorage.setItem("sigep_users_cache", safeJSONStringify(filtered));
  } catch (e) {
    console.warn("Não foi possível guardar no cache local:", e);
  }
};

const findLocalUser = (lowerInput: string, inputPass?: string) => {
  const normInput = n(lowerInput);
  if (!normInput) return null;

  // 1. Procurar no cache local
  try {
    const cache: any[] = JSON.parse(
      localStorage.getItem("sigep_users_cache") || "[]",
    );
    const found = cache.find((u: any) => {
      const eMatch = u.email && n(u.email) === normInput;
      const nMatch = u.nuit && n(u.nuit) === normInput;
      const idMatch = u.id && n(String(u.id)) === normInput;
      const uMatch = u.usuario && n(u.usuario) === normInput;
      const estMatch = u.numeroEstudante && n(u.numeroEstudante) === normInput;
      return eMatch || nMatch || idMatch || uMatch || estMatch;
    });
    if (found) return found;
  } catch (e) {}

  // 2. Procurar no último utilizador autenticado
  try {
    const stored = JSON.parse(
      localStorage.getItem("sigep_logged_in_user") || "{}",
    );
    if (stored && (stored.email || stored.nuit || stored.id)) {
      const eMatch = stored.email && n(stored.email) === normInput;
      const nMatch = stored.nuit && n(stored.nuit) === normInput;
      const idMatch = stored.id && n(String(stored.id)) === normInput;
      const uMatch = stored.usuario && n(stored.usuario) === normInput;
      if (eMatch || nMatch || idMatch || uMatch) return stored;
    }
  } catch (e) {}

  // 3. Fallback para Administrador removido conforme solicitado para limpeza de dados de teste.

  // 4. Procurar na lista estática EFETIVO_MAP
  const generalCol = EFETIVO_MAP.get(normInput);
  if (generalCol) {
    return {
      id:
        (generalCol as any).id ||
        generateCollaboratorId(generalCol.nome || "", generalCol.nuit || ""),
      name: generalCol.nome,
      nome: generalCol.nome,
      email: (
        generalCol.email ||
        `${generalCol.nome.toLowerCase().split(" ").join(".")}@songo.ac.mz`
      ).toLowerCase(),
      nuit: generalCol.nuit,
      role: generalCol.tipo === "Docente" ? "Docente" : "CTA",
      unidade: generalCol.unidade || "",
      direcao: (generalCol as any).direcao || "",
      departamento: (generalCol as any).departamento || "",
      reparticao: (generalCol as any).reparticao || "",
      cargo: generalCol.cargo || "",
      status: generalCol.status || "Ativo",
      areaDeAfetacao: (generalCol as any).areaDeAfetacao || "",
      isFirstAccess: true,
    };
  }

  return null;
};

export default function LoginScreen({
  onClose,
  onLogin,
  onRegisterClick,
  events,
}: {
  onClose: () => void;
  onLogin: (user: any) => void;
  onRegisterClick: () => void;
  events: any[];
}) {
  const [view, setView] = useState<"login" | "create_password">("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showContactAdmin, setShowContactAdmin] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactId, setContactId] = useState("");
  const [contactText, setContactText] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [requestReset, setRequestReset] = useState(false);

  const handleRequestReset = async () => {
    if (!identifier) {
      setError("Por favor, insira o seu identificador (email/nuit) para solicitar a redefinição.");
      return;
    }
    setLoading(true);
    try {
      await firestoreService.password_reset_requests.add({
        identifier: identifier,
        status: "Pendente",
        timestamp: new Date(),
      });
      setSuccess("Pedido de redefinição enviado com sucesso. Aguarde a notificação do Administrador.");
      setRequestReset(false);
    } catch (e) {
      setError("Erro ao enviar pedido.");
    } finally {
      setLoading(false);
    }
  };

  // Recover State
  const [recoverNuit, setRecoverNuit] = useState("");

  // Reset State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [matchedUser, setMatchedUser] = useState<any>(null);
  const [dbEstudantes, setDbEstudantes] = useState<any[]>([]);

  useEffect(() => {
    let unsub: any;
    const authUnsub = auth.onAuthStateChanged((user) => {
      if (user) {
        unsub = firestoreService.efetivo_escolar.subscribe(setDbEstudantes);
      }
    });
    return () => {
      authUnsub();
      if (unsub) unsub();
    };
  }, []);

  // Auto-seed removed as requested.

  const allFutureEvents = React.useMemo(() => {
    const allEvents = [...events, ...holidays2026];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filterAndFormat = (eventList: any[]) => {
      return eventList
        .filter((e) => {
          if (!e.date) return false;
          const eDate = new Date(e.date);
          eDate.setHours(0, 0, 0, 0);
          return eDate >= today;
        })
        .map((e) => {
          const eDate = new Date(e.date);
          eDate.setHours(0, 0, 0, 0);
          const diffTime = Math.abs(eDate.getTime() - today.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const dateStr = `${String(eDate.getDate()).padStart(2, "0")}/${String(eDate.getMonth() + 1).padStart(2, "0")}/${eDate.getFullYear()}`;
          return { ...e, diffDays, displayDate: dateStr, dateObj: eDate };
        })
        .filter((e) => e.diffDays <= 7)
        .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
    };

    const comemorativas = filterAndFormat(
      allEvents.filter((e) => e.type === "Data Comemorativa"),
    );
    const feriadosNacionais = filterAndFormat(
      allEvents.filter((e) => e.type === "Feriado Nacional"),
    );
    const feriadosInstitucionais = filterAndFormat(
      allEvents.filter((e) => e.type === "Feriado Institucional"),
    );

    return {
      comemorativas,
      feriadosNacionais,
      feriadosInstitucionais,
      all: [
        ...comemorativas,
        ...feriadosNacionais,
        ...feriadosInstitucionais,
      ].sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime()),
    };
  }, [events]);

  const {
    comemorativas,
    feriadosNacionais,
    feriadosInstitucionais,
    all: allFutureEventsList,
  } = allFutureEvents;
  const closestEventId =
    allFutureEventsList.length > 0 ? allFutureEventsList[0].id : null;

  const renderEvent = (e: any) => {
    const isClosest = e.id === closestEventId;
    return (
      <div
        key={e.id}
        className={`flex justify-between items-start text-sm py-1 border-b border-white/10 last:border-0 ${isClosest ? "font-black" : "opacity-80"}`}
      >
        <div>
          <p className={isClosest ? "rgb-blink" : ""}>{e.title}</p>
          <p
            className={`text-[10px] tracking-widest ${isClosest ? "text-white font-bold" : "opacity-70"}`}
          >
            {e.displayDate}
          </p>
        </div>
        {isClosest && (
          <div className="text-[10px] font-black tracking-widest bg-white text-[#1e1e96] px-2 py-1 rounded whitespace-nowrap animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)]">
            Faltam {e.diffDays} dia{e.diffDays !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    let localVersion: any = null;

    const lowerInput = identifier.toLowerCase().trim();
    const upperInput = identifier.toUpperCase().trim();
    const exactInput = identifier.trim();
    const normInput = n(lowerInput);

    try {
      // 1. Tentar autenticação anónima com tratamento silencioso de erro
      try {
        if (!auth.currentUser) {
          await withTimeout(signInAnonymously(auth), 4000);
        }
      } catch (authErr) {
        console.warn("Aviso na autenticação anónima (quota/rede):", authErr);
      }

      let user: any = null;
      let matchedDoc: any = null;
      let isQuotaError = false;

      // 2. Tentar consulta no Firestore
      try {
        const usersRef = collection(db, "users");
        const colRef = collection(db, "colaboradores");
        const estRef = collection(db, "efetivo_escolar");

        const isEmail = lowerInput.includes("@");
        const isNumeric = /^\d+$/.test(lowerInput);
        const numericInput = isNumeric ? Number(lowerInput) : null;

        // Definir as promessas individualmente de forma inteligente
        const pEmail = isEmail 
          ? getDocs(query(usersRef, where("email", "==", String(lowerInput))))
          : Promise.resolve({ docs: [] });

        const pNuit = (isNumeric && !isEmail)
          ? getDocs(query(usersRef, where("nuit", "==", String(lowerInput))))
          : Promise.resolve({ docs: [] });

        const pId = (!isEmail && !isNumeric)
          ? getDocs(query(usersRef, where("id", "==", String(lowerInput))))
          : Promise.resolve({ docs: [] });

        const pIdUpper = (!isEmail && !isNumeric)
          ? getDocs(query(usersRef, where("id", "==", String(upperInput))))
          : Promise.resolve({ docs: [] });

        const pIdExact = (!isEmail && !isNumeric)
          ? getDocs(query(usersRef, where("id", "==", String(exactInput))))
          : Promise.resolve({ docs: [] });

        const pUsuario = (!isEmail && !isNumeric)
          ? getDocs(query(usersRef, where("usuario", "==", String(lowerInput))))
          : Promise.resolve({ docs: [] });

        const pColEmail = isEmail
          ? getDocs(query(colRef, where("email", "==", String(lowerInput))))
          : Promise.resolve({ docs: [] });

        const pColNuit = (isNumeric && !isEmail)
          ? getDocs(query(colRef, where("nuit", "==", String(lowerInput))))
          : Promise.resolve({ docs: [] });

        const pColId = (!isEmail && !isNumeric)
          ? getDocs(query(colRef, where("id", "==", String(lowerInput))))
          : Promise.resolve({ docs: [] });

        const pEstId = Promise.resolve({ docs: [] });
        const pEstNuit = Promise.resolve({ docs: [] });

        const pNuitNum = (numericInput !== null && !isEmail)
          ? getDocs(query(usersRef, where("nuit", "==", numericInput)))
          : Promise.resolve({ docs: [] });

        const pColNuitNum = (numericInput !== null && !isEmail)
          ? getDocs(query(colRef, where("nuit", "==", numericInput)))
          : Promise.resolve({ docs: [] });

        const pEstNuitNum = Promise.resolve({ docs: [] });

        const [
          snapEmail,
          snapNuit,
          snapId,
          snapIdUpper,
          snapIdExact,
          snapUsuario,
          snapColEmail,
          snapColNuit,
          snapColId,
          snapEstId,
          snapEstNuit,
          snapNuitNum,
          snapColNuitNum,
          snapEstNuitNum,
        ] = await withTimeout(
          Promise.all([
            pEmail,
            pNuit,
            pId,
            pIdUpper,
            pIdExact,
            pUsuario,
            pColEmail,
            pColNuit,
            pColId,
            pEstId,
            pEstNuit,
            pNuitNum,
            pColNuitNum,
            pEstNuitNum,
          ]),
          10000,
        );

        let allMatchedDocs = [
          ...snapEmail.docs,
          ...snapNuit.docs,
          ...snapId.docs,
          ...snapIdUpper.docs,
          ...snapIdExact.docs,
          ...snapUsuario.docs,
          ...(snapNuitNum ? snapNuitNum.docs : []),
        ];

        if (allMatchedDocs.length === 0) {
          try {
            let directDoc = await firestoreService.users.getById(lowerInput);
            if (!directDoc)
              directDoc = await firestoreService.users.getById(upperInput);
            if (!directDoc)
              directDoc = await firestoreService.users.getById(exactInput);
            if (directDoc) {
              allMatchedDocs = [
                { id: directDoc.id, data: () => directDoc } as any,
              ];
            }
          } catch (e) {}
        }

        allMatchedDocs = allMatchedDocs.filter(
          (v, i, a) => a.findIndex((v2) => v2.id === v.id) === i,
        );
        allMatchedDocs.sort((a, b) => {
          const aData = a.data();
          const bData = b.data();
          if (
            aData.mustChangePassword === false &&
            bData.mustChangePassword !== false
          )
            return -1;
          if (
            aData.mustChangePassword !== false &&
            bData.mustChangePassword === false
          )
            return 1;
          return 0;
        });

        matchedDoc = allMatchedDocs[0];
        user = matchedDoc ? { ...matchedDoc.data(), id: matchedDoc.id } : null;

        if (user) {
          try {
            const cache: any[] = JSON.parse(
              localStorage.getItem("sigep_users_cache") || "[]",
            );
            localVersion = cache.find((u: any) => {
              const eMatch =
                u.email &&
                u.email.toLowerCase().trim() ===
                  (user.email || "").toLowerCase().trim();
              const nMatch =
                u.nuit &&
                String(u.nuit).trim() === String(user.nuit || "").trim();
              const idMatch =
                u.id && String(u.id).trim() === String(user.id || "").trim();
              return eMatch || nMatch || idMatch;
            });

            if (localVersion) {
              if (localVersion.mustChangePassword === false) {
                user.mustChangePassword = false;
              }
              // Apenas usar a senha do cache local se a senha do Firestore for vazia ou padrão
              if (
                localVersion.password &&
                (!user.password ||
                  user.password === "1234" ||
                  ["admin", "123456", "123"].includes(user.password))
              ) {
                user.password = localVersion.password;
              }
            }
          } catch (e) {
            console.warn("Erro ao mesclar com cache local no LoginScreen:", e);
          }
        }

        if (!user) {
          const matchedColDoc =
            snapColEmail.docs[0] ||
            snapColNuit.docs[0] ||
            snapColId.docs[0] ||
            (snapColNuitNum && snapColNuitNum.docs[0]);

          if (matchedColDoc) {
            const dbCol = matchedColDoc.data();
            const tempUser = {
              id: matchedColDoc.id,
              name: dbCol.nome,
              email: (
                dbCol.email ||
                `${dbCol.nome.toLowerCase().split(" ").join(".")}@songo.ac.mz`
              ).toLowerCase(),
              nuit: dbCol.nuit,
              role: dbCol.tipo === "Docente" ? "Docente" : "CTA",
              unidade: dbCol.unidade || "",
              direcao: dbCol.direcao || "",
              departamento: dbCol.departamento || "",
              reparticao: dbCol.reparticao || "",
              cargo: dbCol.cargo || "",
              status: dbCol.status || "Ativo",
              areaDeAfetacao: dbCol.areaDeAfetacao || "",
            };
            user = {
              ...tempUser,
              password: "1234",
              mustChangePassword: true,
            };
          }
        }
      } catch (fsErr: any) {
        console.warn(
          "Aviso Firestore na busca do utilizador (possível quota/rede):",
          fsErr,
        );
        isQuotaError = true;
      }

      // 3. Fallback para cache/base local se não encontrado no Firestore ou se houve erro de quota
      if (!user) {
        const localUser = findLocalUser(lowerInput, password);
        if (localUser) {
          user = localUser;
        }
      }

      if (!user) {
        if (isQuotaError) {
          setError(
            "O serviço de base de dados atingiu o limite de quota diária temporariamente. Se já acedeu anteriormente neste dispositivo, utilize o seu email/nuit registado.",
          );
        } else {
          setError(
            "O utilizador não foi encontrado ou não está registado no sistema.",
          );
        }
        setLoading(false);
        return;
      }

      if (user) {
        const isDefaultInput = password === "1234";
        const dbPassword = user.password;
        const hasChangedPassword = user.mustChangePassword === false;

        // 1. Validação estrita de senha
        let isCorrect = false;
        let forceChange = false;

        if (hasChangedPassword) {
          // Utilizador já alterou a senha - só aceita a senha personalizada
          if (password === dbPassword) {
            isCorrect = true;
          } else if (isDefaultInput) {
            setError(
              "A senha padrão foi bloqueada para este utilizador. Por favor, contacte o administrador.",
            );
            setLoading(false);
            return;
          }
        } else {
          // Primeiro acesso ou senha resetada pelo administrador
          const isDbDefault =
            !dbPassword ||
            dbPassword === "1234" ||
            ["admin", "123456", "123"].includes(dbPassword);

          if (password === dbPassword) {
            isCorrect = true;
            if (isDbDefault) forceChange = true;
          } else if (isDefaultInput && isDbDefault) {
            isCorrect = true;
            forceChange = true;
          }
        }

        if (!isCorrect) {
          setError("A senha está incorreta.");
          setLoading(false);
          return;
        }

        if (forceChange) {
          setMatchedUser(user);
          setView("create_password");
          setLoading(false);
          return;
        }

        // Login bem sucedido
        user.mustChangePassword = false;

        // Sincronizar dados do Firebase Auth se disponível, mas APENAS atualizar o doc correspondente,
        // sem criar um registo espelhado com o UID
        if (auth.currentUser && matchedDoc && !isQuotaError) {
          try {
            const userUpdateData = {
              authUid: auth.currentUser.uid, // guardamos o UID no doc original em vez de usar como ID
              updatedAt: serverTimestamp(),
            };
            await withTimeout(updateDoc(doc(db, "users", matchedDoc.id), userUpdateData), 4000);
          } catch (err) {
            console.warn("Aviso ao sincronizar UID:", err);
          }
        }

        // Tentar obter dados atualizados do colaborador se sem quota error
        if (!isQuotaError) {
          try {
            if (user.role === "Estudante") {
              const estRef = collection(db, "efetivo_escolar");
              const qEst = query(
                estRef,
                where("numeroEstudante", "==", user.numeroEstudante || ""),
              );
              const snapEst = await withTimeout(getDocs(qEst), 5000);
              if (!snapEst.empty) {
                const freshData = snapEst.docs[0].data();
                user = { ...user, ...freshData, id: user.id };
              }
            } else {
              const colRef = collection(db, "colaboradores");
              const nuitStr = String(user.nuit || "");
              const isNuitNum = /^\d+$/.test(nuitStr);
              const nuitNum = isNuitNum ? Number(nuitStr) : null;

              let snapCol = await withTimeout(
                getDocs(query(colRef, where("nuit", "==", nuitStr))),
                5000,
              );
              if (snapCol.empty && isNuitNum && nuitNum !== null) {
                snapCol = await withTimeout(
                  getDocs(query(colRef, where("nuit", "==", nuitNum))),
                  5000,
                );
              }

              if (!snapCol.empty) {
                const freshData = snapCol.docs[0].data();
                user = {
                  ...user,
                  ...freshData,
                  id: snapCol.docs[0].id || user.id,
                };
              }
            }
          } catch (dataErr) {
            console.warn("Erro ao buscar dados atualizados:", dataErr);
          }
        }

        const calcArea = (cc: any): string => {
          if (
            cc.reparticao &&
            cc.reparticao !== "Nenhum" &&
            cc.reparticao !== "-"
          )
            return cc.reparticao;
          if (
            cc.departamento &&
            cc.departamento !== "Nenhum" &&
            cc.departamento !== "-"
          )
            return cc.departamento;
          if (cc.direcao && cc.direcao !== "Nenhum" && cc.direcao !== "-")
            return cc.direcao;
          return cc.unidade || "";
        };

        // Alocação automática e derivação de área para todos colaboradores afetados
        const isChefia =
          user.cargoChefia &&
          user.cargoChefia !== "Nenhum" &&
          user.cargoChefia !== "-";
        if (isChefia) {
          user.isChefia = true;
          if (user.status !== "Afetado" || !user.areaDeAfetacao) {
            const area = calcArea(user);
            user.status = "Afetado";
            user.areaDeAfetacao = area;

            if (!isQuotaError) {
              try {
                const colRef = collection(db, "colaboradores");
                const nuitStr = String(user.nuit || "");
                const isNuitNum = /^\d+$/.test(nuitStr);
                const nuitNum = isNuitNum ? Number(nuitStr) : null;

                let snapCol = await withTimeout(
                  getDocs(query(colRef, where("nuit", "==", nuitStr))),
                  4000,
                );
                if (snapCol.empty && isNuitNum && nuitNum !== null) {
                  snapCol = await withTimeout(
                    getDocs(query(colRef, where("nuit", "==", nuitNum))),
                    4000,
                  );
                }

                if (!snapCol.empty) {
                  await withTimeout(
                    updateDoc(
                      doc(db, "colaboradores", snapCol.docs[0].id),
                      {
                        status: "Afetado",
                        areaDeAfetacao: area,
                        isChefia: true,
                      },
                    ),
                    4000,
                  );
                }
                if (matchedDoc) {
                  await withTimeout(
                    updateDoc(doc(db, "users", matchedDoc.id), {
                      status: "Afetado",
                      areaDeAfetacao: area,
                      isChefia: true,
                    }),
                    4000,
                  );
                }
              } catch (err) {
                console.warn(
                  "Erro ao alocar automaticamente cargo de chefia no login:",
                  err,
                );
              }
            }
          }
        } else if (!user.areaDeAfetacao) {
          const area = calcArea(user);
          if (area) {
            user.areaDeAfetacao = area;
            if (user.status !== "Afetado") user.status = "Afetado";
          }
        }

        // Verificar alocação (Status 'Afetado' e areaDeAfetacao)
        const isAfetado = user.status === "Afetado" && user.areaDeAfetacao;
        const isAdmin =
          user.role === "Administrador" ||
          user.role === "Administrador do Sistema" ||
          String(user.role).toLowerCase().includes("admin");
        const isProgrammer = user.email === "slaitertripas@gmail.com";

        if (!isAfetado && !isAdmin && !isProgrammer) {
          setError("Aguarde a sua afetação que será feita pelo RH.");
          setLoading(false);
          return;
        }

        // Garantir que utilizadores autenticados nunca mais precisem de alterar a senha obrigatoriamente
        user.mustChangePassword = false;

        if (matchedDoc && !isQuotaError) {
          updateDoc(doc(db, "users", matchedDoc.id), {
            mustChangePassword: false,
            isFirstAccess: false,
          }).catch(console.warn);
        }
        user.mustChangePassword = false;

        // Guardar utilizador no cache local
        saveUserToCache({ ...user, password: password || user.password });

        setSuccess(`Bem-vindo à SIGEP`);
        setTimeout(() => {
          onLogin({
            ...user,
            userArea: {
              unidade: user.unidade,
              direcao: user.direcao,
              departamento: user.departamento,
              reparticao: user.reparticao,
              setor: user.setor,
            },
          });
        }, 500);
      } else {
        setError("A senha está incorreta.");
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || String(err);
      try {
        if (
          typeof err.message === "string" &&
          err.message.trim().startsWith("{")
        ) {
          const parsed = JSON.parse(err.message);
          errMsg = parsed.error || err.message;
        }
      } catch (_) {}

      const errLower = errMsg.toLowerCase();
      if (
        errLower.includes("quota") ||
        errLower.includes("resource-exhausted") ||
        errLower.includes("resource_exhausted")
      ) {
        const fallbackUser = findLocalUser(lowerInput, password);
        if (fallbackUser) {
          saveUserToCache({
            ...fallbackUser,
            password: password || fallbackUser.password,
          });
          setSuccess(`Bem-vindo à SIGEP (Modo Cache Local)`);
          setTimeout(() => {
            onLogin({
              ...fallbackUser,
              userArea: {
                unidade: fallbackUser.unidade,
                direcao: fallbackUser.direcao,
                departamento: fallbackUser.departamento,
                reparticao: fallbackUser.reparticao,
                setor: fallbackUser.setor,
              },
            });
          }, 500);
          return;
        } else {
          setError(
            "O limite de quota do servidor foi atingido temporariamente. Se já acedeu anteriormente neste dispositivo, tente utilizar as suas credenciais habituais.",
          );
        }
      } else {
        setError("Erro ao autenticar: " + errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePasswordSubmit = async (e: React.FormEvent) => {
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
      if (matchedUser) {
        const pwdHash = firestoreService.hashPassword(newPassword);
        const newUser = {
          id: matchedUser.id || undefined,
          name: matchedUser.name,
          email: (matchedUser.email || "").toLowerCase().trim(),
          nuit: matchedUser.nuit || "",
          password: newPassword, // Save the new password
          passwordHash: pwdHash,
          passwordExpired: false,
          role: matchedUser.role,
          mustChangePassword: false,
          unidade: matchedUser.unidade || "",
          direcao: matchedUser.direcao || "",
          departamento: matchedUser.departamento || "",
          reparticao: (matchedUser as any).reparticao || "",
          cargo: matchedUser.cargo || "",
          numeroEstudante: matchedUser.numeroEstudante || "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        let docId = "local_" + Date.now();
        try {
          const usersRef = collection(db, "users");
          const isNuitNumeric = /^\d+$/.test(String(newUser.nuit || ""));
          const nuitNumericVal = isNuitNumeric ? Number(newUser.nuit) : null;

          const emailStr = String(newUser.email || "")
            .toLowerCase()
            .trim();
          const qEmail = emailStr
            ? query(usersRef, where("email", "==", emailStr))
            : null;

          const nuitStr = String(newUser.nuit || "").trim();
          const qNuit = nuitStr
            ? query(usersRef, where("nuit", "==", nuitStr))
            : null;
          const qNuitNum =
            nuitNumericVal !== null
              ? query(usersRef, where("nuit", "==", nuitNumericVal))
              : null;

          const [snapEmail, snapNuit, snapNuitNum] = await Promise.all([
            qEmail ? getDocs(qEmail) : Promise.resolve({ docs: [] }),
            qNuit ? getDocs(qNuit) : Promise.resolve({ docs: [] }),
            qNuitNum ? getDocs(qNuitNum) : Promise.resolve({ docs: [] }),
          ]);

          let allDocs = [
            ...snapEmail.docs,
            ...snapNuit.docs,
            ...snapNuitNum.docs,
          ];

          if (allDocs.length === 0 && matchedUser.id) {
            allDocs = [{ id: matchedUser.id }] as any;
          }

          const uniqueDocs = allDocs.filter(
            (v, i, a) => a.findIndex((v2: any) => v2.id === v.id) === i,
          );

          if (uniqueDocs.length > 0) {
            docId = uniqueDocs[0].id;
            // Atualizar (ou criar) todos os documentos em paralelo
            const { setDoc } = await import("firebase/firestore");
            await Promise.all(
              uniqueDocs.map((d: any) =>
                setDoc(
                  doc(db, "users", d.id),
                  {
                    ...newUser,
                    password: newPassword,
                    mustChangePassword: false,
                    id: d.id,
                    updatedAt: serverTimestamp(),
                  },
                  { merge: true },
                ).catch((err: any) =>
                  console.warn(`Erro ao atualizar doc ${d.id}:`, err),
                ),
              ),
            );
          } else {
            // Usa id gerado com Iniciais e Nuit se não houver um doc
            docId =
              newUser.id || generateCollaboratorId(newUser.name, newUser.nuit);
            const { setDoc } = await import("firebase/firestore");
            await setDoc(doc(db, "users", docId), {
              ...newUser,
              id: docId,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }

          if (auth.currentUser && docId) {
            // Apenas atualizamos o documento original com o UID, não criamos um espelhado
            await updateDoc(doc(db, "users", docId), {
              authUid: auth.currentUser.uid,
            });
          }
        } catch (fsErr) {
          console.warn(
            "Aviso ao guardar utilizador no Firestore (Quota/Rede):",
            fsErr,
          );
        }

        const finalUser = { ...newUser, id: docId || "local_" + Date.now() };
        saveUserToCache(finalUser);

        setSuccess("Senha criada com sucesso!");
        setTimeout(() => {
          onLogin({
            ...finalUser,
            userArea: {
              unidade: finalUser.unidade,
              direcao: finalUser.direcao,
              departamento: finalUser.departamento,
              reparticao: (matchedUser as any).reparticao || "",
              setor: (matchedUser as any).setor || "",
            },
          });
          setSuccess("");
          setView("login");
          setNewPassword("");
          setConfirmPassword("");
          setMatchedUser(null);
        }, 1000);
      }
    } catch (err: any) {
      console.error(err);
      setError("Erro ao criar senha no sistema: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col md:flex-row h-screen w-full bg-white z-[100] overflow-y-auto">
      {/* Left Side - Blue */}
      <div className="hidden md:flex w-full md:w-1/2 bg-[#1e1e96] p-8 md:p-12 flex-col justify-between text-white relative overflow-y-auto">
        {/* Background Image with transparency */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="https://lh3.googleusercontent.com/d/1Xasp7NB08GDtIE2VEwf-O5iycCdDJKg1"
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover opacity-30"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="relative z-10 flex flex-col">
          <div className="flex items-center gap-4">
            <div className="border border-white/30 p-1 rounded flex items-center justify-center bg-white overflow-hidden w-12 h-12">
              <img
                src="https://lh3.googleusercontent.com/d/11zvvpOpZARM1yk_irEDpjJ-qBKlTlhad"
                alt="Logo"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="text-sm font-bold tracking-widest leading-tight">
              Serviço de
              <br />
              planificação institucional
            </h1>
          </div>

          <div className="mt-[10px] space-y-4">
            <style>{`
              @keyframes rgbBlink {
                0% { color: #ff3b30; text-shadow: 0 0 8px #ff3b30; }
                33% { color: #34c759; text-shadow: 0 0 8px #34c759; }
                66% { color: #007aff; text-shadow: 0 0 8px #007aff; }
                100% { color: #ff3b30; text-shadow: 0 0 8px #ff3b30; }
              }
              .rgb-blink {
                animation: rgbBlink 1s infinite;
              }
            `}</style>
            {comemorativas.length > 0 && (
              <div>
                <h2 className="text-[10px] font-black underline mb-2 tracking-widest text-blue-200">
                  Datas comemorativas
                </h2>
                <div className="space-y-1">
                  {comemorativas.map((e) => renderEvent(e))}
                </div>
              </div>
            )}
            {feriadosNacionais.length > 0 && (
              <div>
                <h2 className="text-[10px] font-black underline mt-4 mb-2 tracking-widest text-blue-200">
                  Feriados nacionais
                </h2>
                <div className="space-y-1">
                  {feriadosNacionais.map((e) => renderEvent(e))}
                </div>
              </div>
            )}
            {feriadosInstitucionais.length > 0 && (
              <div>
                <h2 className="text-[10px] font-black underline mt-4 mb-2 tracking-widest text-blue-200">
                  Feriados institucionais
                </h2>
                <div className="space-y-1">
                  {feriadosInstitucionais.map((e) => renderEvent(e))}
                </div>
              </div>
            )}
            {comemorativas.length === 0 &&
              feriadosNacionais.length === 0 &&
              feriadosInstitucionais.length === 0 && (
                <p className="text-sm opacity-80">Nenhum evento agendado.</p>
              )}
          </div>
        </div>

        <div
          className="relative z-10 text-[10px] text-white font-sans font-bold tracking-wider"
          style={{
            textShadow:
              "1px 1px 0 #000, 2px 2px 0 #000, 3px 3px 0 #000, 4px 4px 4px rgba(0,0,0,0.5)",
          }}
        >
          Desenvolvido por Franzissi - 2025-2026 | @todos os direitos reservados
        </div>

        {/* Top Right Icons */}
        <div className="absolute top-6 right-6 flex gap-3 z-20">
          <button
            type="button"
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen?.().catch(() => {});
              } else {
                document.exitFullscreen?.().catch(() => {});
              }
            }}
            title="Maximizar / Ecrã Inteiro"
            className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-white cursor-pointer"
          >
            <Maximize2 size={16} />
          </button>
          <button
            type="button"
            onClick={() => {
              setIdentifier("");
              setPassword("");
              setError("");
            }}
            title="Limpar formulário"
            className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-white cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Right Side - White */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-8 md:p-20 overflow-y-auto">
        <div className="w-full max-w-md text-center">
          {view === "login" && (
            <>
              <h1 className="text-4xl font-bold text-[#0a0a5a] mb-2 font-serif tracking-tight">
                Bem-vindo
              </h1>
              <p className="text-xl text-gray-500 italic mb-8 font-serif">
                Insira as suas credenciais de acesso.
              </p>

              <form className="space-y-8" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-700 text-sm animate-shake">
                    <AlertCircle size={20} className="shrink-0" />
                    <div className="flex flex-col text-left">
                      <p className="font-medium">{error}</p>
                      {(error.includes("administrador") ||
                        error.includes("incorreta")) && (
                        <button
                          type="button"
                          onClick={() => {
                            setContactId(identifier);
                            setShowContactAdmin(true);
                            setError("");
                          }}
                          className="text-[#0a0a5a] font-bold hover:underline mt-1 text-xs"
                        >
                          Contactar o Administrador
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex flex-col items-center gap-2 text-green-700 text-sm animate-bounce">
                    <CheckCircle2 size={24} />
                    <p className="font-bold text-center">{success}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="block text-[10px] font-bold text-[#0a0a5a] tracking-[0.2em]">
                    ID, NUIT ou E-mail
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="ID, NUIT ou E-mail"
                    className="w-full p-4 bg-gray-100 rounded-xl text-sm text-center placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0a0a5a]/20 transition-all"
                    required
                    autoComplete="username"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-bold text-[#0a0a5a] tracking-[0.2em]">
                    Palavra-passe
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="•••••"
                    className="w-full p-4 bg-gray-100 rounded-xl text-sm text-center placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0a0a5a]/20 transition-all"
                    required
                    autoComplete="current-password"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={!!success || loading}
                    className="w-full bg-[#0a0a5a] text-white py-4 px-8 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-[#0a0a5a]/90 transition-all shadow-lg shadow-blue-900/20 group disabled:bg-gray-400"
                  >
                    {loading ? (
                      <ProcessingCircle size={20} />
                    ) : (
                      <>
                        <span className="tracking-widest text-sm">
                          Entrar no sistema
                        </span>
                        <ArrowRight
                          size={18}
                          className="group-hover:translate-x-1 transition-transform"
                        />
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-8 pt-4 border-t border-gray-100 flex justify-center">
                <button
                  type="button"
                  onClick={async () => {
                    setLoading(true);
                    setError("");
                    try {
                      const { clearIndexedDbPersistence, terminate } =
                        await import("firebase/firestore");
                      await terminate(db);
                      await new Promise((resolve) => setTimeout(resolve, 100));
                      await clearIndexedDbPersistence(db);
                      setSuccess(
                        "Cache do sistema limpo com sucesso! A recarregar...",
                      );
                      setTimeout(() => {
                        window.location.reload();
                      }, 1200);
                    } catch (err: any) {
                      setError("Erro ao limpar cache: " + err.message);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="text-xs text-blue-700 hover:text-blue-900 font-bold transition-colors cursor-pointer hover:underline"
                >
                  🔄 Resolver problemas de acesso (Limpar Cache)
                </button>
              </div>
            </>
          )}

          {view === "create_password" && (
            <>
              <h1 className="text-4xl font-bold text-[#0a0a5a] mb-2 font-serif tracking-tight">
                Criar Palavra-passe
              </h1>
              <p className="text-sm text-gray-500 italic mb-8 font-serif">
                Como este é o seu primeiro acesso ao sistema, por favor defina a
                sua palavra-passe de acesso.
              </p>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 text-amber-800 text-sm mb-6 text-left animate-pulse">
                <AlertCircle
                  className="shrink-0 text-amber-600 mt-0.5"
                  size={20}
                />
                <div>
                  <p className="font-bold">Aviso de Segurança</p>
                  <p>
                    É obrigatório alterar a palavra-passe padrão para garantir a
                    segurança da sua conta.
                  </p>
                </div>
              </div>

              <form className="space-y-6" onSubmit={handleCreatePasswordSubmit}>
                {error && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-700 text-sm animate-shake">
                    <AlertCircle size={20} />
                    <p className="font-medium">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex flex-col items-center gap-2 text-green-700 text-sm animate-bounce">
                    <CheckCircle2 size={24} />
                    <p className="font-bold text-center">{success}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="block text-[10px] font-bold text-[#0a0a5a] tracking-[0.2em]">
                    Criar Palavra-passe
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="•••••"
                    className="w-full p-4 bg-gray-100 rounded-xl text-sm text-center placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0a0a5a]/20 transition-all"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-bold text-[#0a0a5a] tracking-[0.2em]">
                    Confirmar Palavra-passe
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="•••••"
                    className="w-full p-4 bg-gray-100 rounded-xl text-sm text-center placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0a0a5a]/20 transition-all"
                    required
                  />
                </div>

                <div className="pt-4 flex flex-col gap-4">
                  <button
                    type="submit"
                    disabled={!!success || loading}
                    className="w-full bg-[#0a0a5a] text-white py-4 px-8 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-[#0a0a5a]/90 transition-all shadow-lg shadow-blue-900/20 group disabled:bg-gray-400"
                  >
                    {loading ? (
                      <ProcessingCircle size={20} />
                    ) : (
                      <>
                        <span className="tracking-widest text-sm">
                          Criar Senha e Entrar
                        </span>
                        <ArrowRight
                          size={18}
                          className="group-hover:translate-x-1 transition-transform"
                        />
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setView("login");
                      setError("");
                      setSuccess("");
                    }}
                    className="text-[10px] font-bold text-gray-500 tracking-widest hover:text-[#0a0a5a]"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Contact Admin Modal */}
      {showContactAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-[#0a0a5a] p-8 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black tracking-tight">
                    Contactar Administrador
                  </h3>
                  <p className="text-blue-200 text-sm mt-1">
                    Solicitação de recuperação de acesso ao sistema
                  </p>
                </div>
                <button
                  onClick={() => setShowContactAdmin(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[#0a0a5a] tracking-widest">
                    Assunto
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="Recuperação de Senha / Acesso Bloqueado"
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#0a0a5a] tracking-widest">
                      Nome do Utilizador
                    </label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Seu nome completo"
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-[#0a0a5a]/20 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#0a0a5a] tracking-widest">
                      ID / NUIT
                    </label>
                    <input
                      type="text"
                      value={contactId}
                      onChange={(e) => setContactId(e.target.value)}
                      placeholder="ID ou NUIT"
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-[#0a0a5a]/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[#0a0a5a] tracking-widest">
                    Mensagem Adicional
                  </label>
                  <textarea
                    value={contactText}
                    onChange={(e) => setContactText(e.target.value)}
                    placeholder="Explique o problema ao administrador..."
                    rows={4}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-[#0a0a5a]/20 outline-none transition-all resize-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={async () => {
                    if (!contactName.trim() || !contactId.trim()) {
                      alert("Por favor, preencha o seu nome e identificação.");
                      return;
                    }

                    setIsSendingMessage(true);
                    try {
                      // Enviar mensagem para o administrador principal
                      await firestoreService.messages.add({
                        senderId: "SYSTEM_LOGIN",
                        senderName: contactName,
                        recipientId: "slaitertripas@gmail.com", // ID do Administrador Principal
                        recipientName: "SLAITER TRIPAS",
                        subject: "Recuperação de Senha / Acesso Bloqueado",
                        content: `Solicitação de recuperação de senha para o utilizador ${contactName} (ID: ${contactId}).\n\nMensagem do utilizador: ${contactText || "Sem mensagem adicional."}`,
                        type: "recovery_request",
                        status: "pendente",
                        createdAt: new Date().toISOString(),
                        read: false,
                      });

                      alert(
                        "Solicitação enviada com sucesso ao administrador. Por favor, aguarde o contacto.",
                      );
                      setShowContactAdmin(false);
                      setContactText("");
                      setContactName("");
                    } catch (err) {
                      console.error(err);
                      alert(
                        "Erro ao enviar mensagem. Tente novamente mais tarde.",
                      );
                    } finally {
                      setIsSendingMessage(false);
                    }
                  }}
                  disabled={isSendingMessage}
                  className="w-full bg-[#0a0a5a] text-white py-4 rounded-2xl font-black text-xs tracking-widest hover:bg-[#0a0a5a]/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                >
                  {isSendingMessage ? (
                    <ProcessingCircle size={16} />
                  ) : (
                    "Enviar Mensagem ao Administrador"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

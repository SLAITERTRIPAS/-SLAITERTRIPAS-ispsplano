import React, { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle, FileText, Send, User } from "lucide-react";
import { ServiceRequest } from "../../types";
import { firestoreService } from "../../lib/firestoreService";
import MainHeader from "../bloco1_apresentacao/MainHeader";

export default function ReposicaoTesteView({
  onBack,
  user,
}: {
  onBack: () => void;
  user: any;
}) {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // We determine what role context we are viewing from.
  // Normally the user object has cargo or tipo
  const isSG =
    user?.nome === "Admin" ||
    user?.cargo?.includes("Secretaria") ||
    user?.name?.includes("Secretaria") ||
    user?.departamento?.includes("Secretaria");
  const isDC =
    user?.cargo?.includes("Diretor do Curso") ||
    user?.name?.includes("Diretor do Curso") ||
    user?.cargo?.includes("Chefe do DE");
  const isDocente =
    user?.tipo === "Docente" || user?.cargo?.includes("Docente");

  useEffect(() => {
    const unsub = firestoreService.serviceRequests.subscribe((data) => {
      // Filter only reposicao de teste
      const reposicao = data.filter(
        (d) => d.service === "Pedido de realização de reposição de teste",
      );
      setRequests(reposicao);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const dispatchToDiretorCurso = async (req: ServiceRequest) => {
    const updated = {
      ...req,
      status: "No Diretor do Curso",
    };
    updated.history.push({
      stage: "Despachado",
      date: new Date().toISOString(),
      author: user?.name || "Secretaria Geral",
      parecer: "Despachado para o Diretor do Curso",
    });
    await firestoreService.serviceRequests.update(req.id, updated as any);
  };

  const dispatchToDocente = async (req: ServiceRequest) => {
    const updated = {
      ...req,
      status: "No Docente",
    };
    updated.history.push({
      stage: "Despachado",
      date: new Date().toISOString(),
      author: user?.name || "Diretor do Curso",
      parecer: "Despachado para o Docente responsável",
    });
    await firestoreService.serviceRequests.update(req.id, updated as any);
  };

  const evaluateRequest = async (req: ServiceRequest) => {
    const updated = {
      ...req,
      status: "Concluído",
    };
    updated.history.push({
      stage: "Avaliado",
      date: new Date().toISOString(),
      author: user?.name || "Docente",
      parecer: "O docente tomou conhecimento e avaliou o pedido de reposição.",
    });
    await firestoreService.serviceRequests.update(req.id, updated as any);
  };

  const sgRequests = requests.filter((r) => r.status === "Na Secretaria Geral");
  const dcRequests = requests.filter((r) => r.status === "No Diretor do Curso");

  // For Docente, we filter matching docents to only show relevant tests
  // Or if Admin, show all
  const docenteRequests = requests.filter((r) => r.status === "No Docente");

  const renderList = (
    title: string,
    list: ServiceRequest[],
    action: (req: ServiceRequest) => void,
    actionText: string,
  ) => (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      {list.length === 0 ? (
        <div className="p-8 text-center text-gray-500 bg-white rounded-2xl border">
          Nenhum pedido pendente nesta fase.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {list.map((req) => (
            <div
              key={req.id}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
              <div>
                <h3 className="font-bold text-lg">{req.nome}</h3>
                <div className="text-sm text-gray-600 grid grid-cols-2 gap-x-8 gap-y-1 mt-2">
                  <p>
                    <span className="font-semibold text-gray-500">Curso:</span>{" "}
                    {req.curso}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-500">
                      Disciplina:
                    </span>{" "}
                    {req.nomeCadeira || "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-500">
                      Docente:
                    </span>{" "}
                    {req.nomeDocente || "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-500">
                      Nº do Teste:
                    </span>{" "}
                    {req.numeroTeste || "N/A"}
                  </p>
                  <p className="col-span-2">
                    <span className="font-semibold text-gray-500">
                      Código de Rastreio:
                    </span>{" "}
                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                      {req.trackingCode}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => action(req)}
                className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-indigo-700 transition"
              >
                {actionText}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 p-8 max-w-6xl mx-auto w-full">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-black mb-8 px-4 py-2 bg-white rounded-xl shadow-sm w-fit border border-gray-200"
        >
          <ArrowLeft size={18} /> Voltar
        </button>

        {loading ? (
          <div className="text-center p-12 text-gray-500">
            A carregar pedidos...
          </div>
        ) : (
          <>
            {isSG &&
              renderList(
                "Pedidos na Secretaria Geral (Para Despacho)",
                sgRequests,
                dispatchToDiretorCurso,
                "Despachar p/ Diretor",
              )}
            {isDC &&
              renderList(
                "Pedidos no Diretor do Curso (Para Despacho)",
                dcRequests,
                dispatchToDocente,
                "Despachar p/ Docente",
              )}
            {isDocente &&
              renderList(
                "Pedidos Pendentes de Avaliação (Meus Alunos)",
                docenteRequests.filter(
                  (r) =>
                    !r.nomeDocente ||
                    !user?.name ||
                    r.nomeDocente
                      .toLowerCase()
                      .includes(user.name.toLowerCase()) ||
                    user.name
                      .toLowerCase()
                      .includes(r.nomeDocente.toLowerCase()),
                ),
                evaluateRequest,
                "Aprovar Reposição",
              )}

            {!isSG && !isDC && !isDocente && (
              <div className="p-8 text-center text-gray-500 bg-white rounded-2xl border">
                A sua função atual (
                {user?.cargo || user?.tipo || "Desconhecida"}) não tem
                permissões para visualizar ou despachar estes pedidos.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

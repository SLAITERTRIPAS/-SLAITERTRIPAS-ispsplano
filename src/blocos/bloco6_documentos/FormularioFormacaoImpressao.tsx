import React from "react";

export default function FormularioFormacaoImpressao({
  colaboracao,
}: {
  colaboracao?: any;
}) {
  // Use colaboracao data if available, else blank
  const c = colaboracao || {};

  return (
    <div className="hidden print:block font-serif w-[210mm] min-h-[297mm] mx-auto p-12 text-black bg-white">
      <div className="text-center mb-8 border-b-2 border-black pb-4 flex flex-col items-center">
        <h1 className="text-sm font-black tracking-tight ">
          INSTITUTO SUPERIOR POLITÉCNICO DE SONGO
        </h1>
        <p className="text-[11px] font-bold  tracking-wide mt-0.5">PROVÍNCIA DE TETE</p>
        <p className="text-[11px] font-bold  tracking-wide">DISTRITO DE CAHORA-BASSA</p>
        <h2 className="text-base font-black mt-4 ">
          Formulário De Colaboradores Em Formação
        </h2>
      </div>

      <div className="space-y-6 text-sm">
        {/* 1. Dados do Colaborador */}
        <div>
          <h3 className="font-bold bg-gray-200 p-1 mb-2">
            1. Dados do Colaborador
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex">
              <span className="w-48 font-semibold">Nome Completo:</span>{" "}
              <span className="flex-1 border-b border-black">
                {c.nome || ""}
              </span>
            </div>
            <div className="flex">
              <span className="w-48 font-semibold">Cargo/Função:</span>{" "}
              <span className="flex-1 border-b border-black">
                {c.cargo || ""}
              </span>
            </div>
            <div className="flex">
              <span className="w-48 font-semibold">Departamento/Setor:</span>{" "}
              <span className="flex-1 border-b border-black">
                {c.departamento || ""}
              </span>
            </div>
            <div className="flex">
              <span className="w-48 font-semibold">Data de Admissão:</span>{" "}
              <span className="flex-1 border-b border-black">
                {c.dataAdmissao || ""}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex">
                <span className="w-32 font-semibold">Email Corporativo:</span>{" "}
                <span className="flex-1 border-b border-black">
                  {c.email || ""}
                </span>
              </div>
              <div className="flex">
                <span className="w-24 font-semibold">Telefone:</span>{" "}
                <span className="flex-1 border-b border-black">
                  {c.telefone || ""}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Dados da Formação */}
        <div className="mt-8">
          <h3 className="font-bold bg-gray-200 p-1 mb-2">
            2. Dados da Formação
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center gap-2 mt-2">
              <span className="font-semibold w-40">Tipo de Formação:</span>
              <span className="border border-black w-4 h-4 inline-flex items-center justify-center font-bold text-xs">
                {c.tipoFormacao === "Presencial (Local)" ? "X" : ""}
              </span>{" "}
              <span>Presencial (Local)</span>
              <span className="border border-black w-4 h-4 inline-flex items-center justify-center font-bold text-xs ml-4">
                {c.tipoFormacao === "Online (EAD)" ? "X" : ""}
              </span>{" "}
              <span>Online (EAD)</span>
              <span className="border border-black w-4 h-4 inline-flex items-center justify-center font-bold text-xs ml-8">
                {c.localizacao === "No País" ? "X" : ""}
              </span>{" "}
              <span>No País</span>
              <span className="border border-black w-4 h-4 inline-flex items-center justify-center font-bold text-xs ml-4">
                {c.localizacao === "Fora do País" ? "X" : ""}
              </span>{" "}
              <span>Fora do País</span>
            </div>

            <div className="flex mt-2">
              <span className="w-48 font-semibold">Nome do Curso/Evento:</span>{" "}
              <span className="flex-1 border-b border-black">
                {c.curso || ""}
              </span>
            </div>
            <div className="flex">
              <span className="w-64 font-semibold">
                Instituição/Entidade Promotora:
              </span>{" "}
              <span className="flex-1 border-b border-black">
                {c.universidade || ""}
              </span>
            </div>
            <div className="flex">
              <span className="w-56 font-semibold">
                País e Cidade da Formação:
              </span>{" "}
              <span className="flex-1 border-b border-black">
                {c.paisCidade || ""}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex">
                <span className="w-32 font-semibold">Data de Início:</span>{" "}
                <span className="flex-1 border-b border-black">
                  {c.dataInicio || ""}
                </span>
              </div>
              <div className="flex">
                <span className="w-32 font-semibold">Data de Término:</span>{" "}
                <span className="flex-1 border-b border-black">
                  {c.dataTermino || ""}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex">
                <span className="w-40 font-semibold">Carga Horária Total:</span>{" "}
                <span className="flex-1 border-b border-black text-center">
                  {c.cargaHoraria ? `${c.cargaHoraria}` : ""}
                </span>{" "}
                <span className="ml-2 font-semibold">Horas</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <span className="font-semibold">
                A formação ocorre no horário de trabalho?
              </span>
              <span className="border border-black w-4 h-4 inline-flex items-center justify-center font-bold text-xs">
                {c.horarioTrabalho === "Sim" ? "X" : ""}
              </span>{" "}
              <span className="mr-4">Sim</span>
              <span className="border border-black w-4 h-4 inline-flex items-center justify-center font-bold text-xs">
                {c.horarioTrabalho === "Não" ? "X" : ""}
              </span>{" "}
              <span>Não</span>
            </div>
          </div>
        </div>

        {/* 3. Justificativa e Objetivos */}
        <div className="mt-8">
          <h3 className="font-bold bg-gray-200 p-1 mb-2">
            3. Justificativa e Objetivos
          </h3>
          <div className="space-y-4">
            <div>
              <p className="font-semibold mb-1">
                Objetivo da Formação (O que será aprendido?):
              </p>
              <div className="w-full relative">
                <div className="border-b border-black h-8 mt-4 w-full"></div>
                <div className="border-b border-black h-8 w-full"></div>
                {c.objetivoFormacao && (
                  <span className="absolute inset-0 px-1 pt-1 whitespace-pre-wrap">
                    {c.objetivoFormacao}
                  </span>
                )}
              </div>
            </div>
            <div className="pt-2">
              <p className="font-semibold mb-1">
                Como este curso beneficiará o seu trabalho e a organização?
              </p>
              <div className="w-full relative">
                <div className="border-b border-black h-8 mt-4 w-full"></div>
                <div className="border-b border-black h-8 w-full"></div>
                {c.beneficioTrabalho && (
                  <span className="absolute inset-0 px-1 pt-1 whitespace-pre-wrap">
                    {c.beneficioTrabalho}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Custos e Necessidades */}
        <div className="mt-8">
          <h3 className="font-bold bg-gray-200 p-1 mb-2">
            4. Custos e Necessidades (Preencher se aplicável)
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex">
                <span className="w-40 font-semibold">Custo da Inscrição:</span>{" "}
                <span className="font-semibold mr-1">$</span>{" "}
                <span className="flex-1 border-b border-black">
                  {c.custoInscricao || ""}
                </span>
              </div>
            </div>
            <div className="flex mt-2">
              <span className="w-[360px] font-semibold">
                Custo Estimado de Viagem (Passagens/Alojamento):
              </span>{" "}
              <span className="font-semibold mr-1">$</span>{" "}
              <span className="flex-1 border-b border-black">
                {c.custoViagem || ""}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <span className="font-semibold">
                Solicita ajuda de custo/subsídio?
              </span>
              <span className="border border-black w-4 h-4 inline-flex items-center justify-center font-bold text-xs">
                {c.ajudaCusto === "Sim" ? "X" : ""}
              </span>{" "}
              <span className="mr-4">Sim</span>
              <span className="border border-black w-4 h-4 inline-flex items-center justify-center font-bold text-xs">
                {c.ajudaCusto === "Não" ? "X" : ""}
              </span>{" "}
              <span>Não</span>
            </div>
          </div>
        </div>

        {/* 5. Aprovações */}
        <div className="mt-8">
          <h3 className="font-bold bg-gray-200 p-1 mb-4">
            5. Aprovações (Uso Exclusivo de Recursos Humanos / Chefia)
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="font-semibold">
                  Aprovado pela Chefia Imediata?
                </span>
                <span className="border border-black w-4 h-4 inline-block"></span>{" "}
                <span className="mr-4">Sim</span>
                <span className="border border-black w-4 h-4 inline-block"></span>{" "}
                <span>Não</span>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <div className="flex">
                  <span className="w-36 font-semibold">Nome do Gestor:</span>{" "}
                  <span className="flex-1 border-b border-black"></span>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="flex">
                    <span className="w-24 font-semibold">Assinatura:</span>{" "}
                    <span className="flex-1 border-b border-black"></span>
                  </div>
                  <div className="flex">
                    <span className="w-16 font-semibold">Data:</span>{" "}
                    <span className="flex-1 border-b border-black"></span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8">
              <div className="flex items-center gap-2 mb-6">
                <span className="font-semibold">
                  Aprovado pelo RH / Direcção?
                </span>
                <span className="border border-black w-4 h-4 inline-block"></span>{" "}
                <span className="mr-4">Sim</span>
                <span className="border border-black w-4 h-4 inline-block"></span>{" "}
                <span>Não</span>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="flex">
                  <span className="w-24 font-semibold">Assinatura:</span>{" "}
                  <span className="flex-1 border-b border-black"></span>
                </div>
                <div className="flex">
                  <span className="w-16 font-semibold">Data:</span>{" "}
                  <span className="flex-1 border-b border-black"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

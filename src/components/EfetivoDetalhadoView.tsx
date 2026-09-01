import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  ArrowLeft,
  UserCheck,
  UserX,
  Briefcase,
  Archive,
  ShieldCheck,
  Search,
  X,
  Users,
  Phone,
  Mail,
  FileSpreadsheet,
} from "lucide-react";
import { Colaborador } from "../types";
import {
  checkIsSystemAdmin,
  checkIsQuadro,
  hasChefiaPosition,
} from "../lib/utils";

interface Props {
  colaboradores: Colaborador[];
  onBack: () => void;
}

type RectangleType =
  | "docente_quadro"
  | "docente_nao_quadro"
  | "cta_quadro"
  | "cta_nao_quadro"
  | "fora_songo"
  | "chefia";

export default function EfetivoDetalhadoView({ colaboradores, onBack }: Props) {
  const [selectedRect, setSelectedRect] = useState<RectangleType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const detailsRef = useRef<HTMLDivElement>(null);

  // Inatividade
  const isColaboradorInactive = (estado?: string) => {
    if (!estado) return false;
    const e = estado.toLowerCase().trim();
    return [
      "transferido",
      "falecido",
      "reformado",
      "demitido",
      "rescisao",
      "licenca",
      "eliminado",
    ].includes(e);
  };

  const getGenderMetrics = (list: any[]) => {
    let H = 0;
    let M = 0;
    list.forEach((c) => {
      const g = (c.genero || "M").toString().toUpperCase().trim();
      if (g.startsWith("F")) {
        M++;
      } else {
        H++;
      }
    });
    return { H, M, total: list.length };
  };

  // Listas filtradas para cada quadro
  const lists = useMemo(() => {
    const docenteQuadro = colaboradores.filter((c) => {
      const isAdmin = checkIsSystemAdmin(c);
      if (isAdmin) return false;
      return (
        (c.tipo || "").toLowerCase() !== "cta" &&
        checkIsQuadro(c) === true &&
        !isColaboradorInactive(c.estado)
      );
    });

    const docenteNaoQuadro = colaboradores.filter((c) => {
      const isAdmin = checkIsSystemAdmin(c);
      if (isAdmin) return false;
      return (
        (c.tipo || "").toLowerCase() !== "cta" &&
        checkIsQuadro(c) === false &&
        !isColaboradorInactive(c.estado)
      );
    });

    const ctaQuadro = colaboradores.filter((c) => {
      const isAdmin = checkIsSystemAdmin(c);
      if (isAdmin) return false;
      return (
        (c.tipo || "").toLowerCase() === "cta" &&
        checkIsQuadro(c) === true &&
        !isColaboradorInactive(c.estado)
      );
    });

    const ctaNaoQuadro = colaboradores.filter((c) => {
      const isAdmin = checkIsSystemAdmin(c);
      if (isAdmin) return false;
      return (
        (c.tipo || "").toLowerCase() === "cta" &&
        checkIsQuadro(c) === false &&
        !isColaboradorInactive(c.estado)
      );
    });

    const foraSongo = colaboradores.filter((c) => isColaboradorInactive(c.estado));

    const chefia = colaboradores.filter(
      (c) => hasChefiaPosition(c) && !isColaboradorInactive(c.estado)
    );

    return {
      docente_quadro: docenteQuadro,
      docente_nao_quadro: docenteNaoQuadro,
      cta_quadro: ctaQuadro,
      cta_nao_quadro: ctaNaoQuadro,
      fora_songo: foraSongo,
      chefia: chefia,
    };
  }, [colaboradores]);

  // Estatísticas para cada quadro
  const stats = useMemo(() => {
    const chefiaDocenteList = lists.chefia.filter(
      (c) => (c.tipo || "").toLowerCase() !== "cta"
    );
    const chefiaCtaList = lists.chefia.filter(
      (c) => (c.tipo || "").toLowerCase() === "cta"
    );

    return {
      docente_quadro: getGenderMetrics(lists.docente_quadro),
      docente_nao_quadro: getGenderMetrics(lists.docente_nao_quadro),
      cta_quadro: getGenderMetrics(lists.cta_quadro),
      cta_nao_quadro: getGenderMetrics(lists.cta_nao_quadro),
      fora_songo: getGenderMetrics(lists.fora_songo),
      chefia: getGenderMetrics(lists.chefia),
      chefia_docente: getGenderMetrics(chefiaDocenteList),
      chefia_cta: getGenderMetrics(chefiaCtaList),
    };
  }, [lists]);

  // Lista selecionada atualmente
  const currentList = useMemo(() => {
    if (!selectedRect) {
      // Se nada selecionado, mostra todos os colaboradores válidos (exclui admins do sistema)
      return colaboradores.filter((c) => !checkIsSystemAdmin(c));
    }
    return lists[selectedRect];
  }, [selectedRect, lists, colaboradores]);

  // Lista filtrada pelo termo de busca
  const filteredList = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return currentList;
    return currentList.filter(
      (c) =>
        (c.nome || "").toLowerCase().includes(term) ||
        (c.categoria || "").toLowerCase().includes(term) ||
        (c.unidade || "").toLowerCase().includes(term) ||
        (c.departamento || "").toLowerCase().includes(term) ||
        (c.cargoChefia || "").toLowerCase().includes(term) ||
        (c.email || "").toLowerCase().includes(term),
    );
  }, [currentList, searchTerm]);

  // Rolar para os detalhes quando mudar a seleção
  useEffect(() => {
    if (selectedRect && detailsRef.current) {
      detailsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedRect]);

  const exportToCSV = () => {
    const headers = [
      "Nome",
      "Gênero",
      "Tipo",
      "Vínculo",
      "Unidade",
      "Departamento",
      "Cargo Chefia",
      "E-mail",
      "Telefone",
      "Estado",
    ];

    const rows = filteredList.map((c) => [
      c.nome || "",
      c.genero || "",
      c.tipo || "",
      c.tipoRelacaoContractual || c.vinculoContractual || "",
      c.unidade || "",
      c.departamento || "",
      c.cargoChefia || "",
      c.email || "",
      c.telefone || "",
      c.estado || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    const filename = `efetivo_geral_${selectedRect || "completo"}.csv`;
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-8 pb-12 animate-fade-in text-slate-800">
      {/* Header com botão de voltar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-xs tracking-wider transition-colors mb-2"
          >
            <ArrowLeft size={16} /> Voltar ao Painel Geral
          </button>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight font-sans">
            Efetivo Geral de Pessoal
          </h2>
          <p className="text-xs font-bold text-slate-400 tracking-widest mt-1">
            Consolidação unificada de todos os quadros e categorias da instituição
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-50 border border-slate-100 px-5 py-3 rounded-2xl flex items-center gap-3">
            <Users size={20} className="text-slate-400" />
            <div>
              <p className="text-[10px] font-black text-slate-400 tracking-wider">
                Total de Colaboradores
              </p>
              <p className="text-xl font-black text-slate-900 leading-none">
                {colaboradores.filter((c) => !checkIsSystemAdmin(c)).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de 6 Retângulos (Quadros) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 max-w-[1600px] mx-auto w-full">
        {/* Card 1: DOCENTE (QUADRO) */}
        <div
          onClick={() => setSelectedRect(selectedRect === "docente_quadro" ? null : "docente_quadro")}
          className={`relative bg-slate-50/50 rounded-3xl p-6 border flex flex-col items-center justify-between text-center hover:shadow-lg hover:scale-102 cursor-pointer transition-all duration-300 min-h-[220px] ${
            selectedRect === "docente_quadro"
              ? "border-blue-500 ring-2 ring-blue-100"
              : "border-slate-300"
          }`}
        >
          <div className="absolute top-4 right-4 bg-blue-50 text-blue-600 font-extrabold text-[11px] px-2 py-0.5 rounded-full min-w-6 h-6 flex items-center justify-center">
            {stats.docente_quadro.total}
          </div>
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl mb-4">
            <UserCheck size={24} />
          </div>
          <h3 className="text-[11px] font-black text-slate-800 tracking-tight leading-tight mb-4 h-8 flex items-center justify-center">
            Docente (Quadro)
          </h3>
          <div className="w-full text-[10px] font-extrabold text-blue-700 bg-blue-50/50 py-1.5 px-3 rounded-xl border border-blue-100/60 flex justify-between items-center">
            <span>H: {stats.docente_quadro.H}</span>
            <span>M: {stats.docente_quadro.M}</span>
            <span className="font-black text-blue-900">Total: {stats.docente_quadro.total}</span>
          </div>
        </div>

        {/* Card 2: DOCENTE (FORA DO QUADRO) */}
        <div
          onClick={() => setSelectedRect(selectedRect === "docente_nao_quadro" ? null : "docente_nao_quadro")}
          className={`relative bg-slate-50/50 rounded-3xl p-6 border flex flex-col items-center justify-between text-center hover:shadow-lg hover:scale-102 cursor-pointer transition-all duration-300 min-h-[220px] ${
            selectedRect === "docente_nao_quadro"
              ? "border-orange-500 ring-2 ring-orange-100"
              : "border-slate-300"
          }`}
        >
          <div className="absolute top-4 right-4 bg-orange-50 text-orange-600 font-extrabold text-[11px] px-2 py-0.5 rounded-full min-w-6 h-6 flex items-center justify-center">
            {stats.docente_nao_quadro.total}
          </div>
          <div className="p-3.5 bg-orange-50 text-orange-600 rounded-2xl mb-4">
            <UserX size={24} />
          </div>
          <h3 className="text-[11px] font-black text-slate-800 tracking-tight leading-tight mb-4 h-8 flex items-center justify-center">
            Docente (Fora do Quadro)
          </h3>
          <div className="w-full text-[10px] font-extrabold text-orange-700 bg-orange-50/50 py-1.5 px-3 rounded-xl border border-orange-100/60 flex justify-between items-center">
            <span>H: {stats.docente_nao_quadro.H}</span>
            <span>M: {stats.docente_nao_quadro.M}</span>
            <span className="font-black text-orange-900">Total: {stats.docente_nao_quadro.total}</span>
          </div>
        </div>

        {/* Card 3: CTA (QUADRO) */}
        <div
          onClick={() => setSelectedRect(selectedRect === "cta_quadro" ? null : "cta_quadro")}
          className={`relative bg-slate-50/50 rounded-3xl p-6 border flex flex-col items-center justify-between text-center hover:shadow-lg hover:scale-102 cursor-pointer transition-all duration-300 min-h-[220px] ${
            selectedRect === "cta_quadro"
              ? "border-green-500 ring-2 ring-green-100"
              : "border-slate-300"
          }`}
        >
          <div className="absolute top-4 right-4 bg-green-50 text-green-600 font-extrabold text-[11px] px-2 py-0.5 rounded-full min-w-6 h-6 flex items-center justify-center">
            {stats.cta_quadro.total}
          </div>
          <div className="p-3.5 bg-green-50 text-green-600 rounded-2xl mb-4">
            <Briefcase size={24} />
          </div>
          <h3 className="text-[11px] font-black text-slate-800 tracking-tight leading-tight mb-4 h-8 flex items-center justify-center">
            CTA (Quadro)
          </h3>
          <div className="w-full text-[10px] font-extrabold text-green-700 bg-green-50/50 py-1.5 px-3 rounded-xl border border-green-100/60 flex justify-between items-center">
            <span>H: {stats.cta_quadro.H}</span>
            <span>M: {stats.cta_quadro.M}</span>
            <span className="font-black text-green-900">Total: {stats.cta_quadro.total}</span>
          </div>
        </div>

        {/* Card 4: CTA (FORA DO QUADRO) */}
        <div
          onClick={() => setSelectedRect(selectedRect === "cta_nao_quadro" ? null : "cta_nao_quadro")}
          className={`relative bg-slate-50/50 rounded-3xl p-6 border flex flex-col items-center justify-between text-center hover:shadow-lg hover:scale-102 cursor-pointer transition-all duration-300 min-h-[220px] ${
            selectedRect === "cta_nao_quadro"
              ? "border-amber-500 ring-2 ring-amber-100"
              : "border-slate-300"
          }`}
        >
          <div className="absolute top-4 right-4 bg-amber-50 text-amber-600 font-extrabold text-[11px] px-2 py-0.5 rounded-full min-w-6 h-6 flex items-center justify-center">
            {stats.cta_nao_quadro.total}
          </div>
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl mb-4">
            <Archive size={24} />
          </div>
          <h3 className="text-[11px] font-black text-slate-800 tracking-tight leading-tight mb-4 h-8 flex items-center justify-center">
            CTA (Fora do Quadro)
          </h3>
          <div className="w-full text-[10px] font-extrabold text-amber-700 bg-amber-50/50 py-1.5 px-3 rounded-xl border border-amber-100/60 flex justify-between items-center">
            <span>H: {stats.cta_nao_quadro.H}</span>
            <span>M: {stats.cta_nao_quadro.M}</span>
            <span className="font-black text-amber-900">Total: {stats.cta_nao_quadro.total}</span>
          </div>
        </div>

        {/* Card 5: COLABORADORES FORA DO SONGO */}
        <div
          onClick={() => setSelectedRect(selectedRect === "fora_songo" ? null : "fora_songo")}
          className={`relative bg-slate-50/50 rounded-3xl p-6 border flex flex-col items-center justify-between text-center hover:shadow-lg hover:scale-102 cursor-pointer transition-all duration-300 min-h-[220px] ${
            selectedRect === "fora_songo"
              ? "border-rose-500 ring-2 ring-rose-100"
              : "border-slate-300"
          }`}
        >
          <div className="absolute top-4 right-4 bg-rose-50 text-rose-600 font-extrabold text-[11px] px-2 py-0.5 rounded-full min-w-6 h-6 flex items-center justify-center">
            {stats.fora_songo.total}
          </div>
          <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl mb-4">
            <Briefcase size={24} />
          </div>
          <h3 className="text-[11px] font-black text-slate-800 tracking-tight leading-tight mb-4 h-8 flex items-center justify-center">
            Colaboradores Fora do Songo
          </h3>
          <div className="w-full text-[10px] font-extrabold text-rose-700 bg-rose-50/50 py-1.5 px-3 rounded-xl border border-rose-100/60 flex justify-between items-center">
            <span>H: {stats.fora_songo.H}</span>
            <span>M: {stats.fora_songo.M}</span>
            <span className="font-black text-rose-900">Total: {stats.fora_songo.total}</span>
          </div>
        </div>

        {/* Card 6: CARGO DE CHEFIA */}
        <div
          onClick={() => setSelectedRect(selectedRect === "chefia" ? null : "chefia")}
          className={`relative bg-slate-50/50 rounded-3xl p-6 border flex flex-col items-center justify-between text-center hover:shadow-lg hover:scale-102 cursor-pointer transition-all duration-300 min-h-[220px] ${
            selectedRect === "chefia"
              ? "border-purple-500 ring-2 ring-purple-100"
              : "border-slate-300"
          }`}
        >
          <div className="absolute top-4 right-4 bg-purple-50 text-purple-600 font-extrabold text-[11px] px-2 py-0.5 rounded-full min-w-6 h-6 flex items-center justify-center">
            {stats.chefia.total}
          </div>
          <div className="p-3.5 bg-purple-50 text-purple-600 rounded-2xl mb-4">
            <ShieldCheck size={24} />
          </div>
          <h3 className="text-[11px] font-black text-slate-800 tracking-tight leading-tight mb-4 h-8 flex items-center justify-center">
            Cargos de Chefia
          </h3>
          {/* Caixa com as duas linhas */}
          <div className="w-full flex flex-col gap-1.5 text-[9px] font-bold mt-1 bg-purple-50/50 p-2.5 rounded-xl border border-purple-100/60 text-purple-950">
            <div className="flex justify-between items-center border-b border-purple-100/60 pb-1">
              <span className="font-black text-purple-800 tracking-wider">Docente:</span>
              <span className="font-mono text-slate-600">
                H: {stats.chefia_docente.H} | M: {stats.chefia_docente.M} | Total: {stats.chefia_docente.total}
              </span>
            </div>
            <div className="flex justify-between items-center pt-0.5">
              <span className="font-black text-purple-800 tracking-wider">CTA:</span>
              <span className="font-mono text-slate-600">
                H: {stats.chefia_cta.H} | M: {stats.chefia_cta.M} | Total: {stats.chefia_cta.total}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Área de Detalhes do Quadro Selecionado */}
      <div
        ref={detailsRef}
        className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <span className="text-[10px] font-black  text-blue-600 tracking-widest bg-blue-50 px-3 py-1 rounded-full">
              {selectedRect ? "Visualização Filtrada" : "Visualização Geral"}
            </span>
            <h3 className="text-lg font-black text-slate-900 tracking-tight mt-2">
              {selectedRect === "docente_quadro" && "Detalhamento: Corpo Docente do Quadro"}
              {selectedRect === "docente_nao_quadro" && "Detalhamento: Corpo Docente Contratado (Fora do Quadro)"}
              {selectedRect === "cta_quadro" && "Detalhamento: Corpo Técnico Administrativo (CTA) do Quadro"}
              {selectedRect === "cta_nao_quadro" && "Detalhamento: Corpo Técnico Administrativo Contratado (Fora do Quadro)"}
              {selectedRect === "fora_songo" && "Detalhamento: Colaboradores Fora de Atividade no Songo (Inativos)"}
              {selectedRect === "chefia" && "Detalhamento: Colaboradores com Cargos de Chefia"}
              {!selectedRect && "Efetivo Geral Completo (Todos os Colaboradores)"}
            </h3>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              {selectedRect
                ? `Mostrando os ${filteredList.length} colaboradores que se enquadram neste critério`
                : "Selecione um dos retângulos acima para filtrar a lista detalhada automaticamente"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Campo de Busca */}
            <div className="relative min-w-[240px]">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar por nome, categoria, etc..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-10 py-2.5 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded-full"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Exportar */}
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black tracking-widest  transition-all"
            >
              <FileSpreadsheet size={15} /> Exportar
            </button>
          </div>
        </div>

        {/* Tabela ou Grid de Colaboradores */}
        {filteredList.length === 0 ? (
          <div className="py-16 text-center text-slate-400 max-w-sm mx-auto space-y-2">
            <Users size={40} className="mx-auto text-slate-300 stroke-[1.5]" />
            <h4 className="font-bold text-slate-700">Nenhum colaborador encontrado</h4>
            <p className="text-xs">
              Tente redefinir o termo de pesquisa ou selecione outra categoria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-100  tracking-widest text-[9px]">
                <tr>
                  <th className="p-4">Nome completo</th>
                  <th className="p-4">Gênero</th>
                  {selectedRect === "chefia" && <th className="p-4 text-purple-600">Cargo de Chefia</th>}
                  <th className="p-4">Carreira / Categoria</th>
                  <th className="p-4">Regime / Vínculo</th>
                  <th className="p-4">Direção / Unidade</th>
                  <th className="p-4">Departamento / Setor</th>
                  <th className="p-4">Contactos</th>
                  <th className="p-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-700">
                {filteredList.map((c) => {
                  const isInactive = isColaboradorInactive(c.estado);
                  const isQ = checkIsQuadro(c);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Nome */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 border border-slate-200 ">
                            {(c.nome || "C").slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-sm leading-tight">
                              {c.nome}
                            </p>
                            <span className="text-[10px] text-slate-400  tracking-wider font-semibold">
                              {c.tipo || "CTA"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Gênero */}
                      <td className="p-4">
                        <span
                          className={`font-black  text-[10px] px-2 py-0.5 rounded-full ${
                            (c.genero || "M").toString().toUpperCase().startsWith("F")
                              ? "bg-pink-50 text-pink-600 border border-pink-100"
                              : "bg-blue-50 text-blue-600 border border-blue-100"
                          }`}
                        >
                          {c.genero || "M"}
                        </span>
                      </td>

                      {/* Cargo de Chefia (se aplicável) */}
                      {selectedRect === "chefia" && (
                        <td className="p-4 font-black text-purple-700">
                          {c.cargoChefia || "-"}
                        </td>
                      )}

                      {/* Carreira / Categoria */}
                      <td className="p-4">
                        <p className="text-slate-900 leading-tight">
                          {c.categoria || "-"}
                        </p>
                        <span className="text-[9px] font-bold text-slate-400  tracking-wider">
                          Nível {c.nivelSalarial || "-"}
                        </span>
                      </td>

                      {/* Regime / Vínculo */}
                      <td className="p-4">
                        <p className="text-slate-900">
                          {c.tipoRelacaoContractual || c.vinculoContractual || "Quadro"}
                        </p>
                        <span className="text-[9px] font-bold text-slate-400  tracking-wider">
                          {isQ ? "Quadro do Estado" : "Contratado / Substituto"}
                        </span>
                      </td>

                      {/* Direção / Unidade */}
                      <td className="p-4 font-semibold text-slate-900">
                        {c.unidade || c.direcao || "-"}
                      </td>

                      {/* Departamento / Setor */}
                      <td className="p-4">
                        {c.departamento || c.sector || "-"}
                      </td>

                      {/* Contactos */}
                      <td className="p-4">
                        <div className="space-y-0.5 text-slate-500 text-[11px] font-semibold">
                          {c.email && (
                            <span className="flex items-center gap-1">
                              <Mail size={12} className="text-slate-400" />
                              {c.email}
                            </span>
                          )}
                          {c.telefone && (
                            <span className="flex items-center gap-1">
                              <Phone size={12} className="text-slate-400" />
                              {c.telefone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="p-4 text-center">
                        <span
                          className={`inline-block text-[9px] font-black tracking-widest  px-3 py-1 rounded-full ${
                            isInactive
                              ? "bg-rose-50 text-rose-600 border border-rose-100"
                              : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          }`}
                        >
                          {c.estado || "Ativo"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

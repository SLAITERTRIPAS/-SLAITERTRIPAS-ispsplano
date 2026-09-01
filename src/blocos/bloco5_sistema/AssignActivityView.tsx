import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  User,
  Building2,
  Briefcase,
  FileText,
  CheckCircle2,
  AlertCircle,
  CheckSquare,
  LayoutGrid,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import {
  UNIDADES_ORGANICAS_SISTEMA as unidadesOrganicas,
  DEPARTAMENTOS,
  REPARTICOES,
  CURSOS,
} from "../../constants/formOptions";
import { mergeColaboradores } from "../../lib/utils";

export default function AssignActivityView({
  directorTitle,
  colaboradores: firestoreColaboradores = [],
}: {
  directorTitle: string;
  colaboradores?: any[];
}) {
  const [formData, setFormData] = useState({
    unidadeId: "",
    direcaoId: "",
    deptoId: "",
    reparticaoId: "",
    curso: "",
    colaboradorId: "",
    actividade: "",
    prazo: "",
  });

  const direcoes = React.useMemo(() => {
    return unidadesOrganicas.flatMap((u) =>
      u.direcoes.map((d) => ({
        id: d,
        unidadeId: u.id,
        name: d,
      })),
    );
  }, []);

  const departamentos = React.useMemo(() => {
    const list: any[] = [];
    Object.entries(DEPARTAMENTOS).forEach(([dir, depts]) => {
      depts.forEach((depto) => {
        list.push({ id: depto, direcaoId: dir, name: depto, aliases: [depto] });
      });
    });
    return list;
  }, []);

  const listReparticoes = React.useMemo(() => {
    const list: any[] = [];
    Object.entries(REPARTICOES).forEach(([depto, reps]) => {
      reps.forEach((rep) => {
        list.push({ id: rep, deptoId: depto, name: rep });
      });
    });
    return list;
  }, []);

  const listCursos = React.useMemo(() => {
    const list: any[] = [];
    Object.entries(CURSOS).forEach(([depto, cursoList]) => {
      cursoList.forEach((c) => {
        list.push({ id: c, deptoId: depto, name: c });
      });
    });
    return list;
  }, []);

  // Merge static data with firestore data if provided
  const mergedColaboradores = mergeColaboradores(firestoreColaboradores);

  const combinedColaboradores = mergedColaboradores.map((c) => ({
    ...c,
    name:
      c.nome +
      (c.tipoRelacaoContractual ? ` (${c.tipoRelacaoContractual})` : ""),
    cargo: c.cargo || c.funcao || "Colaborador",
    repId: "",
    deptoId: "",
    direcaoId: "",
  }));

  const [success, setSuccess] = useState(false);

  const titleUpper = directorTitle.toUpperCase();
  const isDirectorGeral = titleUpper === "Gabinete do Diretor-Geral";

  // Identify user's scope based on title
  const getUserScope = () => {
    if (isDirectorGeral) return { level: "geral" };

    // Check if Director
    const direcao = direcoes.find(
      (d) =>
        titleUpper.includes(d.name.toUpperCase()) ||
        (d.id === "div_eng" &&
          (titleUpper.includes("Engenharia") ||
            titleUpper.includes("Diretor"))),
    );
    if (direcao)
      return { level: "direcao", id: direcao.id, unidadeId: direcao.unidadeId };

    // Check if Chefe de Depto
    const depto = departamentos.find(
      (d) =>
        titleUpper.includes(d.name.toUpperCase()) ||
        d.aliases.some((alias) => titleUpper.includes(alias.toUpperCase())),
    );
    if (depto) {
      const dir = direcoes.find((dir) => dir.id === depto.direcaoId);
      return {
        level: "depto",
        id: depto.id,
        deptoId: depto.id,
        direcaoId: depto.direcaoId,
        unidadeId: dir?.unidadeId,
      };
    }

    // REPARTICOES CANNOT ASSIGN ACTIVITIES (Request 2)
    /* 
    const rep = reparticoes.find(r => titleUpper.includes(r.name.toUpperCase()));
    if (rep) {
      const depto = departamentos.find(d => d.id === rep.deptoId);
      const dir = direcoes.find(dir => dir.id === depto?.direcaoId);
      return { level: 'reparticao', id: rep.id, deptoId: rep.deptoId, direcaoId: depto?.direcaoId, unidadeId: dir?.unidadeId };
    }
    */

    return { level: "none" };
  };

  const userScope = getUserScope();

  // Pre-select fields based on scope
  useEffect(() => {
    if (userScope.level !== "geral" && userScope.level !== "none") {
      setFormData((prev) => ({
        ...prev,
        unidadeId: userScope.unidadeId || "",
        direcaoId:
          userScope.direcaoId ||
          (userScope.level === "direcao" ? userScope.id : ""),
        deptoId:
          userScope.deptoId ||
          (userScope.level === "depto" ? userScope.id : ""),
        reparticaoId: "",
      }));
    }
  }, [directorTitle]);

  // Filtered options
  const filteredUnidades =
    userScope.level === "geral"
      ? unidadesOrganicas
      : unidadesOrganicas.filter((u) => u.id === userScope.unidadeId);

  const filteredDirecoes =
    userScope.level === "geral"
      ? direcoes.filter((d) => d.unidadeId === formData.unidadeId)
      : direcoes.filter(
          (d) =>
            d.id === formData.direcaoId ||
            (userScope.level === "direcao" && d.id === userScope.id),
        );

  const filteredDeptos =
    userScope.level === "geral" || userScope.level === "direcao"
      ? departamentos.filter((d) => d.direcaoId === formData.direcaoId)
      : departamentos.filter(
          (d) =>
            d.id === formData.deptoId ||
            (userScope.level === "depto" && d.id === userScope.id),
        );

  const filteredReparticoes =
    userScope.level === "geral" ||
    userScope.level === "direcao" ||
    userScope.level === "depto" ||
    userScope.level === "reparticao"
      ? listReparticoes.filter((r) => r.deptoId === formData.deptoId)
      : listReparticoes.filter((r) => r.id === formData.reparticaoId);

  const filteredCursos =
    userScope.level === "geral" ||
    userScope.level === "direcao" ||
    userScope.level === "depto"
      ? formData.direcaoId === "div_eng"
        ? listCursos.filter((c) => c.deptoId === formData.deptoId)
        : []
      : userScope.level === "curso"
        ? listCursos.filter((c) => c.id === userScope.id)
        : [];

  const filteredColaboradores = combinedColaboradores.filter((c) => {
    return true; // Disabling strict relation filtering since EFETIVO_GERAL_DATA lacks structural fields in this MVP
  });

  // Reset dependent fields on parent change
  useEffect(() => {
    if (userScope.level === "geral") {
      setFormData((prev) => ({
        ...prev,
        direcaoId: "",
        deptoId: "",
        reparticaoId: "",
        colaboradorId: "",
      }));
    }
  }, [formData.unidadeId]);

  useEffect(() => {
    if (userScope.level === "geral" || userScope.level === "direcao") {
      setFormData((prev) => ({
        ...prev,
        deptoId: "",
        reparticaoId: "",
        colaboradorId: "",
      }));
    }
  }, [formData.direcaoId]);

  useEffect(() => {
    if (userScope.level !== "reparticao") {
      setFormData((prev) => ({ ...prev, reparticaoId: "", colaboradorId: "" }));
    }
  }, [formData.deptoId]);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, colaboradorId: "" }));
  }, [formData.reparticaoId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    console.log("Actividade Atribuída:", formData);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setFormData({
        unidadeId: "",
        direcaoId: "",
        deptoId: "",
        reparticaoId: "",
        curso: "",
        colaboradorId: "",
        actividade: "",
        prazo: "",
      });
    }, 3000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
      >
        <div className="p-8 bg-[#1e61ff] text-white">
          <h3 className="text-3xl font-bold flex items-center gap-3 font-serif">
            <CheckSquare className="text-white" size={32} />
            Atribuição de Nova Actividade
          </h3>
          <p className="text-blue-50 mt-2 text-lg font-serif italic">
            Preencha os dados abaixo para delegar uma tarefa a um colaborador.
          </p>
        </div>

        <div className="p-10 space-y-8">
          {userScope.level === "none" ? (
            <div className="p-10 text-center bg-red-50 rounded-2xl border border-red-100 italic text-red-600 font-serif">
              Apenas Chefes de Departamentos, Diretores Centrais e Diretor-Geral
              podem atribuir actividades.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Órgão */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2 font-serif">
                    <Building2 size={18} className="text-[#1e61ff]" />
                    Órgão
                  </label>
                  <select
                    required
                    disabled={userScope.level !== "geral"}
                    className="w-full px-4 py-4 rounded-xl border border-gray-100 bg-white shadow-sm focus:ring-2 focus:ring-[#1e61ff] outline-none disabled:bg-gray-50 disabled:text-gray-400 transition-all text-gray-500 font-serif"
                    value={formData.unidadeId}
                    onChange={(e) =>
                      setFormData({ ...formData, unidadeId: e.target.value })
                    }
                  >
                    <option value="">Selecione a Unidade</option>
                    {unidadesOrganicas.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Direção */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2 font-serif">
                    <Briefcase size={18} className="text-[#1e61ff]" />
                    Direção/Divisão
                  </label>
                  <select
                    required
                    disabled={
                      userScope.level !== "geral" &&
                      userScope.level !== "direcao"
                    }
                    className="w-full px-4 py-4 rounded-xl border border-gray-100 bg-white shadow-sm focus:ring-2 focus:ring-[#1e61ff] outline-none disabled:bg-gray-50 disabled:text-gray-400 transition-all text-gray-500 font-serif"
                    value={formData.direcaoId}
                    onChange={(e) =>
                      setFormData({ ...formData, direcaoId: e.target.value })
                    }
                  >
                    <option value="">Selecione a Direção/Divisão</option>
                    {filteredDirecoes.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Departamento */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2 font-serif">
                    <LayoutGrid size={18} className="text-[#1e61ff]" />
                    Departamento
                  </label>
                  <select
                    required
                    disabled={
                      userScope.level !== "geral" &&
                      userScope.level !== "direcao" &&
                      userScope.level !== "depto"
                    }
                    className="w-full px-4 py-4 rounded-xl border border-gray-100 bg-white shadow-sm focus:ring-2 focus:ring-[#1e61ff] outline-none disabled:bg-gray-50 disabled:text-gray-400 transition-all text-gray-500 font-serif"
                    value={formData.deptoId}
                    onChange={(e) =>
                      setFormData({ ...formData, deptoId: e.target.value })
                    }
                  >
                    <option value="">Selecione o Departamento</option>
                    {filteredDeptos.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Repartição ou Curso */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2 font-serif">
                    <LayoutGrid size={18} className="text-[#1e61ff]" />
                    {formData.direcaoId === "div_eng" ? "Curso" : "Repartição"}
                  </label>
                  <select
                    className="w-full px-4 py-4 rounded-xl border border-gray-100 bg-white shadow-sm focus:ring-2 focus:ring-[#1e61ff] outline-none disabled:bg-gray-50 disabled:text-gray-400 transition-all text-gray-500 font-serif"
                    value={formData.reparticaoId}
                    onChange={(e) =>
                      setFormData({ ...formData, reparticaoId: e.target.value })
                    }
                  >
                    <option value="">
                      {formData.direcaoId === "div_eng"
                        ? "Selecione o Curso"
                        : "Selecione a Repartição"}
                    </option>
                    {formData.direcaoId === "div_eng"
                      ? listCursos[formData.deptoId]?.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))
                      : listReparticoes
                          .filter((r) => r.deptoId === formData.deptoId)
                          .map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                  </select>
                </div>

                {/* Colaborador */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2 font-serif">
                    <User size={18} className="text-[#1e61ff]" />
                    Colaborador
                  </label>
                  <select
                    required
                    className="w-full px-4 py-4 rounded-xl border border-gray-100 bg-white shadow-sm focus:ring-2 focus:ring-[#1e61ff] outline-none disabled:bg-gray-50 disabled:text-gray-400 transition-all text-gray-500 font-serif"
                    value={formData.colaboradorId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        colaboradorId: e.target.value,
                      })
                    }
                  >
                    <option value="">Selecione o Colaborador</option>
                    {filteredColaboradores.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.cargo})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nome da Actividade */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2 font-serif">
                  <FileText size={18} className="text-[#1e61ff]" />
                  Nome da Actividade
                </label>
                <textarea
                  required
                  rows={4}
                  className="w-full px-4 py-4 rounded-xl border border-gray-100 bg-white shadow-sm focus:ring-2 focus:ring-[#1e61ff] outline-none transition-all resize-none text-gray-500 font-serif"
                  placeholder="Descreva detalhadamente a actividade a ser realizada..."
                  value={formData.actividade}
                  onChange={(e) =>
                    setFormData({ ...formData, actividade: e.target.value })
                  }
                />
              </div>

              {/* Prazo */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2 font-serif">
                  <CalendarIcon size={18} className="text-[#1e61ff]" />
                  Prazo de Entrega
                </label>
                <input
                  required
                  type="date"
                  className="w-full px-4 py-4 rounded-xl border border-gray-100 bg-white shadow-sm focus:ring-2 focus:ring-[#1e61ff] outline-none transition-all text-gray-500 font-serif"
                  value={formData.prazo}
                  onChange={(e) =>
                    setFormData({ ...formData, prazo: e.target.value })
                  }
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={success}
                  className={`w-full py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all shadow-lg font-serif ${
                    success
                      ? "bg-green-500 text-white"
                      : "bg-[#1e61ff] text-white hover:bg-[#1e61ff]/90 shadow-blue-100 hover:shadow-blue-200"
                  }`}
                >
                  {success ? (
                    <>
                      <CheckCircle2 size={28} />
                      Actividade Atribuída com Sucesso!
                    </>
                  ) : (
                    <>
                      <CheckSquare size={28} />
                      Atribuir Actividade
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 bg-green-50 border-t border-green-100 flex items-center justify-center gap-2 text-green-700 text-sm font-medium"
            >
              <AlertCircle size={16} />O colaborador receberá uma notificação
              imediata sobre esta nova tarefa.
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

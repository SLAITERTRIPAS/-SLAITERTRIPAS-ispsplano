import React, { useState } from "react";
import { X, Save } from "lucide-react";
import { motion } from "motion/react";
import {
  UNIDADES_ORGANICAS_SISTEMA,
  DEPARTAMENTOS,
  FUNCIONARIOS,
} from "../../constants/formOptions";

interface IndividualPlanFormProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  sectorName?: string;
  colaboradores?: any[];
  user?: any;
}

import SearchableSelect from "../../components/ui/SearchableSelect";

export default function IndividualPlanForm({
  onClose,
  onSubmit,
  sectorName,
  colaboradores = [],
  user,
}: IndividualPlanFormProps) {
  const isUserChefia =
    user?.cargoChefia &&
    user?.cargoChefia !== "Nenhum" &&
    user?.cargoChefia !== "";
  const initialUnidadeOrganica = "";

  const isMandatoLocked =
    user?.estadoMandato !== "Cessado" &&
    user?.estadoMandato !== "Nenhum" &&
    user?.cargoChefia &&
    user?.cargoChefia !== "Nenhum" &&
    user?.cargoChefia !== "";

  const [selectedCategory, setSelectedCategory] = useState(
    initialUnidadeOrganica,
  );
  const [formData, setFormData] = useState({
    unidadeOrganica: initialUnidadeOrganica,
    direcao: user?.direcao || "",
    departamento: user?.departamento || "",
    nomeColaborador: user?.name || "",
    nomeActividade: "",
    objetivo: "",
    dataInicial: "",
    dataFinal: "",
  });

  // Use Firestore colaboradores if available, fallback to FUNCIONARIOS
  const employeeOptions = (
    colaboradores.length > 0
      ? colaboradores.map((c) => ({ value: c.nome, label: c.nome }))
      : FUNCIONARIOS.map((f) => ({ value: f.nome, label: f.nome }))
  ).sort((a, b) =>
    (a.label || "").localeCompare(b.label || "", "pt", { sensitivity: "base" }),
  );

  const [autoFilled, setAutoFilled] = useState(false);

  // Preenchimento automático de unidade desativado por solicitação do utilizador para manter campo em branco e evitar erro de identidade
  /*
  React.useEffect(() => {
    if (user && !selectedCategory) {
      const currentUnidade = user.unidade || user.unidadeOrganica || '';
      setSelectedCategory(currentUnidade);
      setFormData(prev => ({ ...prev, unidadeOrganica: currentUnidade }));
      
      if (!currentUnidade) {
        for (const cat of UNIDADES_ORGANICAS_SISTEMA) {
          if (cat.direcoes.includes(user.direcao)) {
            setSelectedCategory(cat.nome);
            setFormData(prev => ({ ...prev, unidadeOrganica: cat.nome }));
            break;
          }
        }
      }
    }
  }, [user, selectedCategory]);
  */

  React.useEffect(() => {
    if (sectorName && !autoFilled && !isMandatoLocked) {
      let matchedCat = "";
      let matchedDir = "";
      let matchedDep = "";

      const searchName = sectorName.toLowerCase();

      // Match Direction logic (similar to ActivityForm)
      for (const [dir, deps] of Object.entries(DEPARTAMENTOS)) {
        if (
          dir.toLowerCase() === searchName ||
          searchName.includes(dir.toLowerCase())
        ) {
          matchedDir = dir;
          break;
        }
        if (
          deps.some(
            (d) =>
              d.toLowerCase() === searchName ||
              searchName.includes(d.toLowerCase()),
          )
        ) {
          matchedDep =
            deps.find(
              (d) =>
                d.toLowerCase() === searchName ||
                searchName.includes(d.toLowerCase()),
            ) || "";
          matchedDir = dir;
          break;
        }
      }

      if (matchedDir) {
        for (const cat of UNIDADES_ORGANICAS_SISTEMA) {
          if (cat.direcoes.includes(matchedDir)) {
            matchedCat = cat.nome;
            break;
          }
        }
      }

      if (matchedCat || matchedDir || matchedDep) {
        if (matchedCat) setSelectedCategory(matchedCat);
        setFormData((prev) => ({
          ...prev,
          unidadeOrganica: matchedCat || prev.unidadeOrganica,
          direcao: matchedDir || prev.direcao,
          departamento: matchedDep || prev.departamento,
        }));
        setAutoFilled(true);
      }
    }
  }, [sectorName, autoFilled, isMandatoLocked]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    if (
      (name === "unidadeOrganica" ||
        name === "direcao" ||
        name === "departamento") &&
      isMandatoLocked
    ) {
      return;
    }

    if (name === "dataInicial" || name === "dataFinal") {
      const start = name === "dataInicial" ? value : formData.dataInicial;
      const end = name === "dataFinal" ? value : formData.dataFinal;

      if (start && end) {
        if (new Date(start) > new Date(end)) {
          alert("Data invalida");
          return;
        }
      }
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(formData.dataInicial) > new Date(formData.dataFinal)) {
      alert("Data invalida");
      return;
    }
    onSubmit(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute inset-0 bg-white z-50 flex flex-col overflow-hidden"
    >
      {/* Header matching the image */}
      <div className="flex-none p-4 relative border-b border-gray-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={20} className="text-gray-400" />
        </button>

        <div className="text-center space-y-1">
          <h1 className="text-amber-500 font-black text-lg tracking-tight">
            Instituto Superior Politécnico De Songo
          </h1>
          <h2 className="text-[#4a90e2] font-medium text-2xl">
            FORMUÁRIO DE PLANO IDIVIDUAL
          </h2>
          <p className="text-[#4a90e2] text-[10px] font-bold">
            ANO ECONÓMICO (DE 2026 PARA 2027)
          </p>
        </div>
      </div>

      <div className="flex-grow overflow-auto p-8 bg-white">
        <form
          id="individual-plan-form"
          onSubmit={handleSubmit}
          className="max-w-7xl mx-auto space-y-12"
        >
          {/* Top Row: Unidade, Direção, Departamento, Nome Colaborador */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 border-t-2 border-[#1a4b84] pt-4">
            <div className="space-y-1">
              <label className="block text-[#1a4b84] font-serif text-lg italic">
                Órgão
              </label>
              <select
                name="unidadeOrganica"
                value={selectedCategory}
                onChange={(e) => {
                  if (isMandatoLocked) return;
                  setSelectedCategory(e.target.value);
                  setFormData((prev) => ({
                    ...prev,
                    unidadeOrganica: e.target.value,
                    direcao: "",
                    departamento: "",
                  }));
                }}
                className="w-full p-2 border-2 border-gray-400 rounded-xl text-sm outline-none focus:border-[#1a4b84] transition-all bg-white disabled:bg-gray-100 disabled:text-gray-500"
                required
                disabled={isMandatoLocked}
              >
                <option value=""></option>
                {UNIDADES_ORGANICAS_SISTEMA.map((u) => (
                  <option key={u.id} value={u.nome}>
                    {u.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-[#1a4b84] font-serif text-lg italic sign-input-label">
                Direção
              </label>
              <select
                name="direcao"
                value={formData.direcao}
                onChange={(e) => {
                  if (isMandatoLocked) return;
                  setFormData((prev) => ({
                    ...prev,
                    direcao: e.target.value,
                    departamento: "",
                  }));
                }}
                className="w-full p-2 border-2 border-gray-400 rounded-xl text-sm outline-none focus:border-[#1a4b84] transition-all bg-white disabled:bg-gray-100 disabled:text-gray-500"
                required
                disabled={isMandatoLocked}
              >
                <option value=""></option>
                {selectedCategory &&
                  UNIDADES_ORGANICAS_SISTEMA.find(
                    (u) => u.nome === selectedCategory,
                  )?.direcoes?.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-[#1a4b84] font-serif text-lg italic">
                Departamento
              </label>
              <select
                name="departamento"
                value={formData.departamento}
                onChange={handleChange}
                className="w-full p-2 border-2 border-gray-400 rounded-xl text-sm outline-none focus:border-[#1a4b84] transition-all bg-white disabled:bg-gray-100 disabled:text-gray-500"
                required
                disabled={isMandatoLocked}
              >
                <option value=""></option>
                {formData.direcao &&
                (DEPARTAMENTOS[formData.direcao] ||
                  DEPARTAMENTOS[formData.direcao]) ? (
                  (
                    DEPARTAMENTOS[formData.direcao] ||
                    DEPARTAMENTOS[formData.direcao]
                  ).map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))
                ) : (
                  <option disabled>Selecione uma Direção primeiro</option>
                )}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-[#1a4b84] font-serif text-lg italic whitespace-nowrap">
                Nome do Colaborador
              </label>
              <SearchableSelect
                value={formData.nomeColaborador}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, nomeColaborador: val }))
                }
                options={employeeOptions}
                placeholder="Selecione o Colaborador..."
                className="w-full"
              />
            </div>
          </div>

          {/* Bottom Row: Nome da Actividade, Objetivo, Data Inicial, Data Final */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 border-t-2 border-[#4a90e2] pt-4">
            <div className="md:col-span-4 space-y-1">
              <label className="block text-[#4a90e2] font-serif text-lg italic">
                Nome da Actividade
              </label>
              <textarea
                name="nomeActividade"
                value={formData.nomeActividade}
                onChange={handleChange}
                rows={3}
                className="w-full p-3 border-2 border-gray-400 rounded-2xl text-sm outline-none focus:border-[#4a90e2] transition-all resize-none"
                required
              />
            </div>
            <div className="md:col-span-4 space-y-1">
              <label className="block text-[#4a90e2] font-serif text-lg italic">
                Objetivo
              </label>
              <textarea
                name="objetivo"
                value={formData.objetivo}
                onChange={handleChange}
                rows={3}
                className="w-full p-3 border-2 border-gray-400 rounded-2xl text-sm outline-none focus:border-[#4a90e2] transition-all resize-none"
                required
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="block text-[#4a90e2] font-serif text-lg italic text-center">
                Data Inicial
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="dataInicial"
                  value={formData.dataInicial}
                  onChange={handleChange}
                  className="w-full p-2 border-2 border-gray-400 rounded-2xl text-sm outline-none focus:border-[#4a90e2] transition-all text-center"
                  required
                />
              </div>
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="block text-[#4a90e2] font-serif text-lg italic text-center">
                Data final
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="dataFinal"
                  value={formData.dataFinal}
                  onChange={handleChange}
                  className="w-full p-2 border-2 border-gray-400 rounded-2xl text-sm outline-none focus:border-[#4a90e2] transition-all text-center"
                  required
                />
              </div>
            </div>
          </div>
        </form>
      </div>

      <div className="flex-none p-6 bg-white border-t border-gray-200 flex justify-end items-center">
        <button
          type="submit"
          form="individual-plan-form"
          className="bg-[#1a5f7a] text-white px-12 py-2 rounded-lg font-bold text-lg hover:bg-[#144a5f] transition-all shadow-md"
        >
          submeter
        </button>
      </div>
    </motion.div>
  );
}

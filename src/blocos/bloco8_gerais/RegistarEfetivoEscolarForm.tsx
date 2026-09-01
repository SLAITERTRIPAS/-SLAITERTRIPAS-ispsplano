import React, { useState } from "react";
import { Users, Save } from "lucide-react";

const DEPARTAMENTO_CURSOS: Record<string, string[]> = {
  "Departamento de Engenharia Eletrotécnica": [
    "Curso de Engenharia Elétrica",
    "Curso de Engenharia Eletrónica e de Telecomunicações",
    "Curso de Engenharia de Energias Renováveis",
  ],
  "Departamento de Engenharia de Construção Civil": [
    "Curso de Engenharia de Construção Civil",
    "Curso de Engenharia Hidráulica",
  ],
  "Departamento de Engenharia de Construção Mecânica": [
    "Diretor do Curso de Engenharia de Construção Mecânica",
    "Diretor do Curso de Engenharia Termotécnica",
  ],
};

export default function RegistarEfetivoEscolarForm({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (data: any) => void;
}) {
  const [departamento, setDepartamento] = useState(
    "Departamento de Engenharia Eletrotécnica",
  );
  const [curso, setCurso] = useState("Curso de Engenharia Elétrica");
  const [nivel, setNivel] = useState("1º Ano");
  const [categoria, setCategoria] = useState("Matriculados");
  const [homens, setHomens] = useState(0);
  const [mulheres, setMulheres] = useState(0);

  const handleDeptChange = (dept: string) => {
    setDepartamento(dept);
    const availableCursos = DEPARTAMENTO_CURSOS[dept] || [];
    setCurso(availableCursos[0] || "");
  };

  const handleSubmit = () => {
    onSubmit({
      departamento,
      curso,
      nivel,
      categoria,
      homens,
      mulheres,
      total: homens + mulheres,
      dataRegisto: new Date().toISOString(),
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-4xl mx-auto border border-gray-200">
      <div className="bg-white p-6 border-b border-gray-100 flex items-start gap-4">
        <div className="bg-blue-100 p-3 rounded-lg">
          <Users className="text-blue-900" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-blue-900 border-none">
            Registo de Efetivo Escolar
          </h2>
          <p className="text-gray-500 text-sm">
            Introduza o número de estudantes por departamento, curso, nível e
            género.
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-semibold ">
            <span>DICOSSER • Departamento de Registo Académico</span>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">
              DEPARTAMENTO
            </label>
            <select
              value={departamento}
              onChange={(e) => handleDeptChange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm font-sans"
            >
              {Object.keys(DEPARTAMENTO_CURSOS).map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">
              CURSO
            </label>
            <select
              value={curso}
              onChange={(e) => setCurso(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm font-sans"
            >
              {(DEPARTAMENTO_CURSOS[departamento] || []).map((cur) => (
                <option key={cur} value={cur}>
                  {cur}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">
              CATEGORIA
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm font-sans"
            >
              <option value="Novos Ingressos">Novos Ingressos</option>
              <option value="Matriculados">Matriculados</option>
              <option value="Graduados">Graduados</option>
              <option value="Transferidos">Transferidos</option>
              <option value="Desistentes">Desistentes</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">
              NÍVEL / ANO
            </label>
            <select
              value={nivel}
              onChange={(e) => setNivel(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm font-sans"
            >
              <option value="1º Ano">1º Ano</option>
              <option value="2º Ano">2º Ano</option>
              <option value="3º Ano">3º Ano</option>
              <option value="4º Ano">4º Ano</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">
              Homem
            </label>
            <input
              type="number"
              value={homens}
              onChange={(e) => setHomens(parseInt(e.target.value) || 0)}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm font-sans"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">
              Mulher
            </label>
            <input
              type="number"
              value={mulheres}
              onChange={(e) => setMulheres(parseInt(e.target.value) || 0)}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm font-sans"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">
              TOTAL (H+M)
            </label>
            <input
              type="number"
              value={homens + mulheres}
              readOnly
              className="w-full p-3 border border-gray-200 bg-gray-50 rounded-lg text-sm font-bold text-blue-900 font-sans"
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
          <button
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-900 text-white rounded-lg font-bold hover:bg-blue-800 flex items-center gap-2 text-sm cursor-pointer"
          >
            <Save size={16} />
            Submeter o Registo
          </button>
        </div>
      </div>
    </div>
  );
}

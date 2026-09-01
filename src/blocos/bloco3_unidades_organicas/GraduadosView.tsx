import React, { useState } from "react";
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  User,
} from "lucide-react";
import RegistarGraduadoForm from "../bloco8_gerais/RegistarGraduadoForm";

interface Graduado {
  id: string;
  nome: string;
  genero: "Homem" | "Mulher";
  idade: number;
  anoIngresso: number;
  anoGraduacao: number;
  mediaFinal: number;
  tfc: string;
}

const mockGraduados: Graduado[] = [];

export default function GraduadosView() {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  if (showForm) {
    return (
      <RegistarGraduadoForm
        onCancel={() => setShowForm(false)}
        onSubmit={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
            <GraduationCap size={28} />
            Lista de Graduados
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Gerencie o registo individual de todos os graduados do curso.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-100"
        >
          <Plus size={20} />
          Registar Novo Graduado
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Pesquisar por nome ou TFC..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
            <Filter size={16} />
            Filtros
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-500 text-xs tracking-widest font-bold">
              <tr>
                <th className="p-4 border-b border-gray-100">Graduado</th>
                <th className="p-4 border-b border-gray-100">Género</th>
                <th className="p-4 border-b border-gray-100">Idade</th>
                <th className="p-4 border-b border-gray-100">
                  Ingresso/Graduação
                </th>
                <th className="p-4 border-b border-gray-100">Média</th>
                <th className="p-4 border-b border-gray-100">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-600">
              {mockGraduados.map((g) => (
                <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                        {g.nome.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{g.nome}</p>
                        <p
                          className="text-xs text-gray-400 truncate max-w-[200px]"
                          title={g.tfc}
                        >
                          {g.tfc}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 border-b border-gray-50">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                        g.genero === "Homem"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-pink-100 text-pink-700"
                      }`}
                    >
                      {g.genero}
                    </span>
                  </td>
                  <td className="p-4 border-b border-gray-50">
                    {g.idade} anos
                  </td>
                  <td className="p-4 border-b border-gray-50">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">
                        Ingresso: {g.anoIngresso}
                      </span>
                      <span className="text-xs font-medium">
                        Graduação: {g.anoGraduacao}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 border-b border-gray-50">
                    <span className="font-bold text-gray-900">
                      {g.mediaFinal.toFixed(1)}
                    </span>
                  </td>
                  <td className="p-4 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600 transition-colors">
                        <Edit size={16} />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

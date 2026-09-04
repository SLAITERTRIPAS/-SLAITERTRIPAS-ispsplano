import React, { useState, useEffect } from "react";
import { Book, Save, X, Info } from "lucide-react";
import { firestoreService } from "../../lib/firestoreService";
import { loadAllDocentes } from "../../lib/allocationUtils";

export default function RegistarDisciplinaForm({
  onCancel,
  onSubmit,
  user,
  onShowAlert,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  user?: any;
  onShowAlert: (msg: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [docentes, setDocentes] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    nome: "",
    codigo: "",
    departamento: user?.departamento || "Departamento de Disciplinas Gerais",
    curso: "",
    docenteId: "",
    classificacaoExame: "com_exame",
    semestre: "1º Semestre",
    nivel: "1º ano",
    turma: "",
    cargaSemanal: "12h",
  });

  const departamentoCursosMap: Record<string, string[]> = {
    "Departamento de Engenharia Eletrotécnica": [
      "Engenharia Elétrica",
      "Engenharia Eletrónica e de Telecomunicações",
      "Engenharia de Energias Renováveis",
    ],
    "Departamento de Engenharia de Construção Civil": [
      "Engenharia de Construção Civil",
      "Engenharia Hidráulica",
    ],
    "Departamento de Engenharia de Construção Mecânica": [
      "Engenharia de Construção Mecânica",
      "Engenharia Termotécnica",
    ],
    "Departamento de Disciplinas Gerais": [
      "Engenharia Informática",
      "Ciências Biológicas",
      "Economia",
      "Matemática",
      "Física",
      "Química",
    ],
  };

  useEffect(() => {
    const unsubColab = firestoreService.colaboradores.subscribe((data: any[]) => {
      setDocentes(loadAllDocentes(data || []));
    });
    return () => unsubColab();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.codigo) {
      onShowAlert("Preencha o nome e o código da disciplina.");
      return;
    }

    setLoading(true);
    try {
      await firestoreService.disciplinas_academicas.add({
        ...formData,
        createdAt: new Date().toISOString(),
        unidade: user?.unidade || "ISPS",
      });
      onShowAlert("Disciplina registada com sucesso!");
      onSubmit();
    } catch (err) {
      onShowAlert("Erro ao registar disciplina.");
    } finally {
      setLoading(false);
    }
  };

  const cursosDisponiveis = departamentoCursosMap[formData.departamento] || [];

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <Book size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-blue-900 tracking-tight">
              Registar Nova Disciplina
            </h2>
            <p className="text-xs text-gray-500 font-medium italic">
              Insira os dados académicos para a nova cadeira no sistema.
            </p>
          </div>
        </div>
        <button onClick={onCancel} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Nome da Disciplina</label>
          <input
            type="text"
            required
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Ex: Análise Matemática I"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Código</label>
          <input
            type="text"
            required
            value={formData.codigo}
            onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Ex: AM1-101"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Departamento</label>
          <select
            value={formData.departamento}
            onChange={(e) => setFormData({ ...formData, departamento: e.target.value, curso: "" })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none"
          >
            {Object.keys(departamentoCursosMap).map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Curso</label>
          <select
            value={formData.curso}
            onChange={(e) => setFormData({ ...formData, curso: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none"
            required
          >
            <option value="">Selecione o Curso...</option>
            {cursosDisponiveis.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Docente Responsável</label>
          <select
            value={formData.docenteId}
            onChange={(e) => setFormData({ ...formData, docenteId: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none"
          >
            <option value="">Selecione um docente...</option>
            {docentes.map(d => (
              <option key={d.id} value={d.id}>{d.nome}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Carga Horária Semanal</label>
          <input
            type="text"
            value={formData.cargaSemanal}
            onChange={(e) => setFormData({ ...formData, cargaSemanal: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none"
          />
        </div>

        <div className="flex gap-4 md:col-span-2 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-grow bg-blue-600 text-white py-4 rounded-2xl font-black tracking-widest hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <Save size={18} />
            {loading ? "A GUARDAR..." : "REGISTAR NO SISTEMA"}
          </button>
        </div>
      </form>
    </div>
  );
}

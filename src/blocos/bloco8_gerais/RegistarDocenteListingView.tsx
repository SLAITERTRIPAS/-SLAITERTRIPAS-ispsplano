import React, { useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  ArrowLeft,
  Filter,
  CheckCircle,
} from "lucide-react";
import RegistarFuncionarioForm from "../bloco8_gerais/RegistarFuncionarioForm";
import { motion } from "motion/react";
import { firestoreService } from "../../lib/firestoreService";
import {
  toTitleCase,
  toSentenceCase,
  checkIsSystemAdmin,
} from "../../lib/utils";

interface RegistarDocenteListingViewProps {
  onBack: () => void;
  user: any;
  colaboradores: any[];
  onShowAlert: (msg: string) => void;
}

export default function RegistarDocenteListingView({
  onBack,
  user,
  colaboradores,
  onShowAlert,
}: RegistarDocenteListingViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Get course/department from user info
  const userDept = user?.departamento || "";
  const userCurso = user?.curso || "";

  // Filter docentes
  const docentes = colaboradores.filter((c) => c.tipo === "Docente");

  const filteredDocentes = docentes.filter((d) => {
    const matchesSearch = d.nome
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Highlight those already assigned to this department
  const isAssignedToMe = (d: any) => {
    return d.departamento === userDept || d.curso === userCurso;
  };

  const handleAssign = async (docente: any) => {
    try {
      await firestoreService.colaboradores.update(docente.id, {
        departamento: userDept,
        curso: userCurso,
        unidade: user?.unidade || "Unidade orgânica",
        direcao: user?.direcao || "Divisão de Engenharia",
      });
      onShowAlert(`Docente ${docente.nome} alocado com sucesso!`);
    } catch (error) {
      onShowAlert("Erro ao alocar docente.");
    }
  };

  if (showForm) {
    return (
      <RegistarFuncionarioForm
        onCancel={() => setShowForm(false)}
        onSubmit={async (data) => {
          try {
            // Pre-fill department/course context
            const enrichedData = {
              ...data,
              departamento: userDept,
              curso: userCurso,
              unidade: user?.unidade || "Unidade orgânica",
              direcao: user?.direcao || "Divisão de Engenharia",
              tipo: "Docente",
              carreira: "Docente",
            };
            await firestoreService.colaboradores.update(
              enrichedData.id,
              enrichedData,
            );
            onShowAlert("Funcionário registado e alocado!");
            setShowForm(false);
          } catch (error) {
            onShowAlert("Erro ao registar funcionário.");
          }
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 font-serif">
      <div className="bg-white border-b border-slate-200 p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Pessoal - Docentes
            </h2>
            <p className="text-xs text-slate-500 tracking-widest font-bold">
              {userDept || "Todos Departamentos"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-grow sm:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Pesquisar docente..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg active:scale-95"
          >
            <UserPlus size={18} />
            <span className="hidden sm:inline">Novo</span>
          </button>
        </div>
      </div>

      <div className="flex-grow p-6 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocentes.map((docente) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={docente.id}
              className={`bg-white border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group ${isAssignedToMe(docente) ? "border-green-200 bg-green-50/10" : "border-slate-100"}`}
            >
              {isAssignedToMe(docente) && (
                <div className="absolute top-4 right-4 text-green-600">
                  <CheckCircle size={20} />
                </div>
              )}

              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 leading-tight text-sm mb-1">
                    {toTitleCase(docente.nome)}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold tracking-widest">
                    {toSentenceCase(docente.nivelAcademico) || "Sem Nível"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-[10px] tracking-wider font-bold">
                  <span className="text-slate-400">Área:</span>
                  <span className="text-slate-700">
                    {toSentenceCase(docente.areaFormacao) || "---"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] tracking-wider font-bold">
                  <span className="text-slate-400">Departamento:</span>
                  <span
                    className={
                      isAssignedToMe(docente)
                        ? "text-green-700"
                        : "text-slate-700"
                    }
                  >
                    {toSentenceCase(docente.departamento) || "Não Alocado"}
                  </span>
                </div>
              </div>

              <div className="mt-8">
                {isAssignedToMe(docente) ? (
                  <div className="w-full py-2.5 rounded-xl border border-green-200 bg-green-50 text-green-700 font-black text-[10px] tracking-widest text-center">
                    Já Alocado
                  </div>
                ) : (
                  <button
                    onClick={() => handleAssign(docente)}
                    className="w-full py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 font-black text-[10px] tracking-widest hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all active:scale-95"
                  >
                    Alocar ao Departamento
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {filteredDocentes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Filter size={48} className="mb-4 opacity-20" />
            <p className="font-bold tracking-widest text-sm">
              Nenhum docente encontrado
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

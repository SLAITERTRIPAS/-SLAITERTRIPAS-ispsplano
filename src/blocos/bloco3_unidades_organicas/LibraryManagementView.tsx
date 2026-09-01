import React, { useState } from "react";
import { LibraryRegistration, BookRegistration } from "../../types";
import {
  Clock,
  User,
  Book,
  Monitor,
  Calendar,
  Search,
  Filter,
  BookOpen,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LibraryManagementViewProps {
  registrations: LibraryRegistration[];
  bookRegistrations: BookRegistration[];
}

export default function LibraryManagementView({
  registrations,
  bookRegistrations,
}: LibraryManagementViewProps) {
  const [activeTab, setActiveTab] = useState<"visitas" | "livros">("visitas");
  const [searchTerm, setSearchTerm] = useState("");

  // Sort registrations by entry time (horaEntrada)
  const sortedRegistrations = [...registrations].sort((a, b) => {
    return a.horaEntrada.localeCompare(b.horaEntrada);
  });

  // Filter books based on search term
  const filteredBooks = bookRegistrations.filter(
    (book) =>
      book.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.autor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.area.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-blue-900 leading-[1.5]">
            GESTÃO DE BIBLIOTECA
          </h2>
          <p className="text-gray-500 leading-[1.5]">
            Administração de visitas e acervo bibliográfico.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-full font-bold flex items-center gap-2">
            <Calendar size={18} />
            {new Date().toLocaleDateString("pt-PT")}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-8 bg-gray-100 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("visitas")}
          className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            activeTab === "visitas"
              ? "bg-white text-orange-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Users size={18} />
          Gestão de Visitas
        </button>
        <button
          onClick={() => setActiveTab("livros")}
          className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            activeTab === "livros"
              ? "bg-white text-orange-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <BookOpen size={18} />
          Gestão de Livros
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "visitas" ? (
          <motion.div
            key="visitas"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {sortedRegistrations.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-20 text-center">
                <Users size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-400">
                  Nenhum registo de visita hoje
                </h3>
                <p className="text-gray-400">
                  Os novos registos aparecerão aqui automaticamente.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {sortedRegistrations.map((reg, index) => (
                  <motion.div
                    key={reg.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                  >
                    <div className="flex items-center gap-6">
                      <div className="bg-orange-600 text-white p-4 rounded-2xl flex flex-col items-center justify-center min-w-[80px]">
                        <Clock size={20} className="mb-1" />
                        <span className="text-lg font-bold">
                          {reg.horaEntrada}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <User size={16} className="text-orange-500" />
                          <h4 className="font-bold text-gray-900 text-lg">
                            {reg.nome}
                          </h4>
                          <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            {reg.tipoVisitante}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-500">
                          <p>
                            <span className="font-semibold">ID:</span>{" "}
                            {reg.numeroIdentificacao}
                          </p>
                          <p>
                            <span className="font-semibold">Curso:</span>{" "}
                            {reg.curso || "N/A"}
                          </p>
                          <p>
                            <span className="font-semibold">Objetivo:</span>{" "}
                            {reg.objetivo}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {reg.usaComputador && (
                        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl text-xs font-bold border border-blue-100">
                          <Monitor size={14} />
                          PC: {reg.computadorId}
                        </div>
                      )}
                      {reg.livrosConsulta && (
                        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-xl text-xs font-bold border border-green-100">
                          <Book size={14} />
                          Consulta Local
                        </div>
                      )}
                      {reg.livrosEmprestimo && (
                        <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-xl text-xs font-bold border border-purple-100">
                          <Book size={14} />
                          Empréstimo
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="livros"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Pesquisar por título, autor ou área..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="flex items-center gap-2 bg-white border border-gray-200 px-6 py-3 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-all">
                <Filter size={20} />
                Filtros
              </button>
            </div>

            {filteredBooks.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-20 text-center">
                <BookOpen size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-400">
                  Nenhuma obra encontrada
                </h3>
                <p className="text-gray-400">
                  Registe novas obras no Atendimento Estudantil.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredBooks.map((book, index) => (
                  <motion.div
                    key={book.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all group"
                  >
                    <div className="flex gap-6">
                      <div className="bg-orange-50 text-orange-600 p-5 rounded-2xl self-start group-hover:bg-orange-600 group-hover:text-white transition-colors">
                        <Book size={32} />
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start mb-2">
                          <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            {book.area}
                          </span>
                          <span className="text-xs font-bold text-gray-400">
                            {book.anoPublicacao}
                          </span>
                        </div>
                        <h4 className="text-xl font-bold text-gray-900 mb-1 leading-tight">
                          {book.titulo}
                        </h4>
                        <p className="text-sm text-gray-500 mb-4 font-medium italic">
                          {book.autor}
                        </p>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div className="bg-gray-50 p-3 rounded-xl">
                            <p className="text-gray-400 mb-0.5">Edição</p>
                            <p className="font-bold text-gray-700">
                              {book.edicao}
                            </p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-xl">
                            <p className="text-gray-400 mb-0.5">Localização</p>
                            <p className="font-bold text-gray-700">
                              {book.localizacao}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div
                              className={`w-2 h-2 rounded-full ${book.estadoConservacao === "Novo" ? "bg-green-500" : "bg-amber-500"}`}
                            ></div>
                            <span className="text-[10px] font-bold text-gray-500">
                              {book.estadoConservacao}
                            </span>
                          </div>
                          <p className="text-[10px] font-bold text-gray-400">
                            ISBN: {book.isbn || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

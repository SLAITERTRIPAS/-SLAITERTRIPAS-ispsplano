import React, { useState } from "react";
import {
  ArrowLeft,
  Save,
  Book,
  FileText,
  Tag,
  Hash,
  CheckCircle2,
  Plus,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { BookRegistration } from "../../types";

export default function BookRegistrationForm({
  onBack,
  onSubmit,
}: {
  onBack: () => void;
  onSubmit?: (book: BookRegistration) => void;
}) {
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    subtitulo: "",
    autor: "",
    coautores: "",
    editora: "",
    anoPublicacao: "",
    edicao: "1ª Edição",
    isbn: "",
    issn: "",
    cdd: "", // Classificação Decimal de Dewey
    cdu: "", // Classificação Decimal Universal
    area: "",
    curso: "",
    genero: "Académico",
    idioma: "Português",
    numeroPaginas: "",
    exemplares: "1",
    localizacao: "", // Estante/Prateleira
    prateleira: "",
    estante: "",
    estadoConservacao: "Novo",
    resumo: "",
    palavrasChave: "",
    dataAquisicao: new Date().toISOString().split("T")[0],
    tipoAquisicao: "Compra",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (onSubmit) {
      onSubmit({
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
      });
    }

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onBack();
    }, 3000);
  };

  return (
    <div className="h-[100dvh] bg-gray-50 flex flex-col overflow-hidden">
      <header className="flex-none bg-[#e67e22] text-white p-4 md:p-6 flex items-center gap-4 shadow-md z-10">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white/20 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg md:text-xl font-bold tracking-wider truncate">
          Registo de Obras
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
          >
            <div className="p-8 bg-orange-50 border-b border-orange-100">
              <h2 className="text-2xl font-bold text-orange-900 flex items-center gap-3">
                <Book className="text-orange-600" />
                Dados da Obra / Livro
              </h2>
              <p className="text-orange-700 mt-1">
                Preencha todos os detalhes técnicos para o catálogo da
                biblioteca.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-gray-700">
                    Título da Obra
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: Engenharia de Software Moderna"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    value={formData.titulo}
                    onChange={(e) =>
                      setFormData({ ...formData, titulo: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-gray-700">
                    Subtítulo (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Princípios e Práticas para o Desenvolvimento Ágil"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    value={formData.subtitulo}
                    onChange={(e) =>
                      setFormData({ ...formData, subtitulo: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">
                    Autor Principal
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    value={formData.autor}
                    onChange={(e) =>
                      setFormData({ ...formData, autor: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">
                    Coautores / Colaboradores
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    value={formData.coautores}
                    onChange={(e) =>
                      setFormData({ ...formData, coautores: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">
                    Editora
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    value={formData.editora}
                    onChange={(e) =>
                      setFormData({ ...formData, editora: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">
                    Ano de Publicação
                  </label>
                  <input
                    required
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    value={formData.anoPublicacao}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        anoPublicacao: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">
                    Edição
                  </label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    value={formData.edicao}
                    onChange={(e) =>
                      setFormData({ ...formData, edicao: e.target.value })
                    }
                  >
                    {[...Array(10)].map((_, i) => (
                      <option key={i} value={`${i + 1}ª Edição`}>
                        {i + 1}ª Edição
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">
                    Idioma
                  </label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    value={formData.idioma}
                    onChange={(e) =>
                      setFormData({ ...formData, idioma: e.target.value })
                    }
                  >
                    <option value="Português">Português</option>
                    <option value="Inglês">Inglês</option>
                    <option value="Francês">Francês</option>
                    <option value="Espanhol">Espanhol</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">
                    Área do Livro
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: Engenharia Civil"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    value={formData.area}
                    onChange={(e) =>
                      setFormData({ ...formData, area: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">
                    Curso Referente
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: Engenharia Civil"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    value={formData.curso}
                    onChange={(e) =>
                      setFormData({ ...formData, curso: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">
                    Género / Categoria
                  </label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    value={formData.genero}
                    onChange={(e) =>
                      setFormData({ ...formData, genero: e.target.value })
                    }
                  >
                    <option value="Académico">Académico</option>
                    <option value="Técnico">Técnico</option>
                    <option value="Científico">Científico</option>
                    <option value="Literatura">Literatura</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Hash className="text-orange-500" size={20} />
                  Classificação e Identificadores
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">
                      Isbn
                    </label>
                    <input
                      type="text"
                      placeholder="978-..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                      value={formData.isbn}
                      onChange={(e) =>
                        setFormData({ ...formData, isbn: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">
                      CDD (Dewey)
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                      value={formData.cdd}
                      onChange={(e) =>
                        setFormData({ ...formData, cdd: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">
                      CDU (Universal)
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                      value={formData.cdu}
                      onChange={(e) =>
                        setFormData({ ...formData, cdu: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Tag className="text-orange-500" size={20} />
                  Inventário e Localização
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">
                      Nº de Exemplares
                    </label>
                    <input
                      required
                      type="number"
                      min="1"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                      value={formData.exemplares}
                      onChange={(e) =>
                        setFormData({ ...formData, exemplares: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">
                      Localização Geral
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Ex: Sala 2"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                      value={formData.localizacao}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          localizacao: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">
                      Estante
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Ex: E-04"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                      value={formData.estante}
                      onChange={(e) =>
                        setFormData({ ...formData, estante: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">
                      Prateleira
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Ex: P-02"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                      value={formData.prateleira}
                      onChange={(e) =>
                        setFormData({ ...formData, prateleira: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">
                    Estado de Conservação
                  </label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    value={formData.estadoConservacao}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estadoConservacao: e.target.value,
                      })
                    }
                  >
                    <option value="Novo">Novo</option>
                    <option value="Bom">Bom</option>
                    <option value="Regular">Regular</option>
                    <option value="Danificado">Danificado</option>
                    <option value="Em Restauro">Em Restauro</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-gray-100">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <FileText size={16} className="text-orange-500" />
                  Resumo / Sinopse
                </label>
                <textarea
                  rows={4}
                  placeholder="Breve descrição do conteúdo da obra..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none"
                  value={formData.resumo}
                  onChange={(e) =>
                    setFormData({ ...formData, resumo: e.target.value })
                  }
                />
              </div>

              <button
                type="submit"
                disabled={success}
                className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg ${
                  success
                    ? "bg-green-500 text-white"
                    : "bg-orange-600 text-white hover:bg-orange-700 shadow-orange-100 hover:shadow-orange-200"
                }`}
              >
                {success ? (
                  <>
                    <CheckCircle2 size={24} />
                    Registo Submetido!
                  </>
                ) : (
                  <>
                    <Save size={24} />
                    Submeter
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </main>

      <footer className="flex-none bg-blue-900 text-white text-center py-3 text-[10px] md:text-xs z-10">
        Sistema de Gestão de Biblioteca - DICOSSER
      </footer>
    </div>
  );
}
